import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getCurrentDetail,
  getCurrentLocationInfo,
  getNextLocationInfo,
  type CurrentDetailDto,
} from '../../../api/questPlay';
import {getActiveTarget} from '../../../utils/activeTarget';
import {saveUnfinishedQuest} from '../../../utils/unfinishedQuestStore';
import {BlurView} from '@react-native-community/blur';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getLocalProfileImage} from '../../../characters/profileImages';

const {width} = Dimensions.get('window');

type RouteParams = {
  detail?: CurrentDetailDto;
};

export default function DialogScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialDetail = (route.params as RouteParams | undefined)?.detail;

  const [detail, setDetail] = useState<CurrentDetailDto | null>(
    initialDetail ?? null,
  );
  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialDetail);
  const [busy, setBusy] = useState(false);

  // 처음 진입 시 myQuestPlayId 및 초기 detail 세팅
  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveTarget();
        if (!active?.myQuestPlayId) {
          console.warn('❌ myQuestPlayId 없음 → 이전 화면으로');
          navigation.goBack();
          return;
        }
        setMyQuestPlayId(active.myQuestPlayId);

        if (!initialDetail) {
          setLoading(true);
          const d = await getCurrentDetail(active.myQuestPlayId);
          setDetail(d);
        }
      } catch (e) {
        console.warn('❌ DialogScreen 초기 로드 실패:', e);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, initialDetail]);

  const mapActionToScreen = (type: CurrentDetailDto['actionType']) => {
    switch (type) {
      case 'TALKING':
        return 'DialogScreen';
      case 'STAYING':
        return 'StayScreen';
      case 'WALKING':
        return 'StepScreen';
      case 'PHOTO_PUZZLE':
        return 'PhotoPuzzleScreen';
      case 'LOCATION_PUZZLE':
        return 'LocationPuzzleScreen';
      case 'INPUT_PUZZLE':
        return 'InputPuzzleScreen';
      default:
        return null;
    }
  };

  // 다음 액션 진행
  const handleNext = useCallback(async () => {
    if (busy) return;
    if (!detail || !myQuestPlayId) return;

    setBusy(true);
    try {
      if (detail.endAction) {
        try {
          // 1) 먼저 "현재 위치" 정보로 이 위치가 마지막인지 확인
          const currentLoc = await getCurrentLocationInfo(myQuestPlayId);

          if (currentLoc.errorMessage) {
            console.warn(
              '⚠️ current location info error:',
              currentLoc.errorMessage,
            );
            return;
          }

          // ✅ 이 위치가 퀘스트의 마지막 위치인 경우 → 클리어 화면으로
          if (currentLoc.endLocation) {
            navigation.replace('QuestClearScreen', {locationInfo: currentLoc});
            return;
          }

          // ✅ 아직 마지막 위치가 아니라면 → "다음 위치" 미리보기 가져오기
          const nextLoc = await getNextLocationInfo(myQuestPlayId);

          if (nextLoc.errorMessage) {
            console.warn('⚠️ next location info error:', nextLoc.errorMessage);
            return;
          }

          const active = await getActiveTarget();
          if (active) {
            await saveUnfinishedQuest({
              myQuestPlayId,
              questPostId: Number(active.id),
              title: active.title,
              locationName: nextLoc.locationName,
              latitude: nextLoc.latitude,
              longitude: nextLoc.longitude,
            });
          }

          navigation.replace('PlayHome');
          return;
        } catch (e) {
          console.warn('❌ endAction 처리 중 에러:', e);
          return;
        }
      }

      const next = await getCurrentDetail(myQuestPlayId);
      const screenName = mapActionToScreen(next.actionType);

      if (next.actionType === 'TALKING') {
        setDetail(next);
      } else if (screenName) {
        navigation.replace(screenName, {detail: next});
      } else {
        console.warn('⚠️ unknown actionType:', next.actionType);
      }
    } catch (e) {
      console.warn('❌ next step error:', e);
    } finally {
      setBusy(false);
    }
  }, [busy, detail, myQuestPlayId, navigation]);

  // 로딩 시
  if (loading || !detail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#61402D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerText}>대화</Text>
        </View>
      </View>
      <Pressable style={styles.touchArea} onPress={handleNext}>
        <View style={styles.inner}>
          {/* 캐릭터 영역 */}
          <View style={styles.characterWrapper}>
            {(() => {
              const char = getLocalProfileImage(detail.characterImageUrl);

              if (!char) {
                return (
                  <View style={styles.characterPlaceholder}>
                    <Text style={styles.placeholderText}>캐릭터</Text>
                  </View>
                );
              }

              return (
                <Image
                  source={char}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              );
            })()}
          </View>

          {/* 대화 말풍선 카드 */}
          <View style={styles.dialogCardWrapper}>
            <View style={styles.dialogCardInner}>
              <BlurView
                style={styles.blurLayer}
                blurType="light"
                blurAmount={5}
                reducedTransparencyFallbackColor="#ffffff26"
              />

              <View style={styles.dialogInner}>
                <View style={styles.storyWrapper}>
                  <Text style={styles.storyText}>{detail.story}</Text>
                </View>

                <Text style={styles.hintText}>터치해서 넘어가기</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 배경 전체
  screen: {
    flex: 1,
    backgroundColor: '#ECE9E1',
  },

  // 전체 터치 영역
  touchArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ECE9E1',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrapper: {
    borderBottomColor: '#61402D',
    borderBottomWidth: 2,
  },
  headerText: {
    color: '#61402D',
    fontSize: 20,
    fontWeight: '600',
  },

  // 중앙 정렬용 래퍼
  inner: {
    width: '100%',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  characterWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: -40, // 카드 위로 겹치게
  },

  characterImage: {
    width: width * 0.55,
    height: width * 0.55,
  },

  characterPlaceholder: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 20,
    backgroundColor: '#D8D2C5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    color: '#61402D',
    fontSize: 16,
  },

  dialogCardWrapper: {
    width: '90%',
    minHeight: 240,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 0},
    elevation: 6,
  },

  dialogCardInner: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#ffffff2f',
  },

  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  dialogInner: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 30,
    position: 'relative',
  },

  storyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  storyText: {
    fontSize: 20,
    color: '#424242',
    lineHeight: 28,
    textAlign: 'center',
  },

  hintText: {
    position: 'absolute',
    bottom: 15,
    right: 20,
    fontSize: 12,
    color: '#61402db6',
  },
});
