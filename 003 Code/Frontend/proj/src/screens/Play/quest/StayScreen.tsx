// src/screens/Play/Quest/StayScreen.tsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
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
import LinearGradient from 'react-native-linear-gradient';

import DUMMY from '../../../characters/owl_1.png';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getLocalProfileImage} from '../../../characters/profileImages';

const {width} = Dimensions.get('window');

type RouteParams = {
  // 이전 화면에서 detail 을 넘겨줄 수 있음
  detail?: CurrentDetailDto;
};

// ✅ day/hour/minute 정보를 초 단위로 변환하는 헬퍼
const calcTotalSeconds = (d: CurrentDetailDto) => {
  const days = d.day ?? 0;
  const hours = d.hour ?? 0;
  const minutes = d.minute ?? 0;

  const total = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60;

  // 서버에서 0이 올 수도 있으니, 최소 1초는 보장해도 됨(원하면 제거)
  return total > 0 ? total : 1;
};

// ✅ 남은 초를 "HH:MM:SS" 혹은 "D일 HH:MM:SS" 형식으로 변환
const formatRemaining = (sec: number) => {
  const days = Math.floor(sec / 86400);
  const restDay = sec % 86400;
  const hours = Math.floor(restDay / 3600);
  const restHour = restDay % 3600;
  const minutes = Math.floor(restHour / 60);
  const seconds = restHour % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (days > 0) {
    return `${days}일 ${pad(hours)}시\n${pad(minutes)}분 ${pad(
      seconds,
    )}초\n남았어!`;
  } else if (hours > 0) {
    return `${pad(hours)}시\n${pad(minutes)}분 ${pad(seconds)}초\n남았어!`;
  }
  return `${pad(minutes)}분 ${pad(seconds)}초\n남았어!`;
};

export default function StayScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialDetail = (route.params as RouteParams | undefined)?.detail;

  // 현재 액션 상세 정보
  const [detail, setDetail] = useState<CurrentDetailDto | null>(
    initialDetail ?? null,
  );
  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialDetail);
  const [busy, setBusy] = useState(false); // 연타/중복 진행 방지

  // 남은 시간(초 단위)
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  // 초가 줄어들 때 살짝 튀는 애니메이션용
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 타이머가 끝났을 때 한 번만 handleNext 호출하기 위한 플래그
  const finishedRef = useRef(false);

  // ─────────────────────────────────────────────
  // 1. 초기 진입 시 myQuestPlayId + detail 로딩
  // ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveTarget();
        if (!active?.myQuestPlayId) {
          console.warn(
            '❌ myQuestPlayId 를 찾을 수 없음. 이전 화면으로 돌아감',
          );
          navigation.goBack();
          return;
        }
        setMyQuestPlayId(active.myQuestPlayId);

        // route 로 detail 이 안 넘어온 경우에만 서버에서 첫 detail 요청
        if (!initialDetail) {
          setLoading(true);
          const d = await getCurrentDetail(active.myQuestPlayId);
          setDetail(d);
        }
      } catch (e) {
        console.warn('❌ StayScreen 초기 로드 실패:', e);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, initialDetail]);

  // ─────────────────────────────────────────────
  // 2. detail 이 준비되면 day/hour/minute → 남은 초로 변환
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!detail) return;
    const total = calcTotalSeconds(detail);
    setRemainingSec(total);
    finishedRef.current = false; // 새로운 detail 들어올 때마다 리셋
  }, [detail]);

  // ─────────────────────────────────────────────
  // 3. 카운트다운 타이머 (1초마다 1씩 감소)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!detail) return;
    if (remainingSec == null) return;
    if (remainingSec <= 0) return;

    const id = setInterval(() => {
      setRemainingSec(prev => {
        if (prev == null) return prev;
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [detail, remainingSec]);

  // ─────────────────────────────────────────────
  // 4. 남은 시간이 줄어들 때마다(매초) 텍스트 살짝 튀는 애니메이션
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (remainingSec == null) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [remainingSec, scaleAnim]);

  // ─────────────────────────────────────────────
  // 5. actionType -> 화면 이름 매핑
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // 6. 다음 액션으로 진행하는 공통 로직
  // ─────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (remainingSec !== null && remainingSec > 0) return;
    if (busy) return;
    if (!detail || !myQuestPlayId) return;

    setBusy(true);

    try {
      // 1) endAction === true → 현재 위치가 마지막인지 먼저 확인
      if (detail.endAction) {
        // ★ 현재 위치 정보 확인
        const currentLoc = await getCurrentLocationInfo(myQuestPlayId);

        if (currentLoc.errorMessage) {
          console.warn(
            '❌ getCurrentLocationInfo 에러:',
            currentLoc.errorMessage,
          );
          navigation.goBack();
          return;
        }

        // ★ 현재 위치가 마지막(endLocation === true)
        if (currentLoc.endLocation) {
          navigation.replace('QuestClearScreen', {
            myQuestPlayId,
            locationInfo: currentLoc,
          });
          return;
        }

        // ★ 마지막 위치는 아니므로 → 다음 위치 정보 요청
        const nextLoc = await getNextLocationInfo(myQuestPlayId);

        if (!nextLoc.errorMessage) {
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
        } else {
          console.warn('❌ getNextLocationInfo 에러:', nextLoc.errorMessage);
          navigation.goBack();
        }
        return;
      }

      // 2) endAction === false → 다음 액션 detail 요청
      const next = await getCurrentDetail(myQuestPlayId);
      const screenName = mapActionToScreen(next.actionType);

      if (next.actionType === 'STAYING') {
        setDetail(next); // staying 연속이면 화면 유지
      } else if (screenName) {
        navigation.replace(screenName, {detail: next});
      } else {
        console.warn('⚠️ 알 수 없는 actionType:', next.actionType);
      }
    } catch (e) {
      console.warn('❌ StayScreen 다음 액션 진행 실패:', e);
    } finally {
      setBusy(false);
    }
  }, [busy, detail, myQuestPlayId, navigation, remainingSec]);

  // ─────────────────────────────────────────────
  // 7. 타이머가 0이 되는 순간 자동으로 handleNext 한 번 호출
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (remainingSec === 0 && !finishedRef.current) {
      finishedRef.current = true;
      handleNext();
    }
  }, [remainingSec, handleNext]);

  // ─────────────────────────────────────────────
  // 8. 로딩 중 처리
  // ─────────────────────────────────────────────
  if (loading || !detail || remainingSec == null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#61402D" />
      </View>
    );
  }

  const stepsText = formatRemaining(remainingSec);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{flex: 1}}>
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerText}>주변을 구경해보자</Text>
        </View>
      </View>
      {/* 전체 화면을 터치 영역으로 쓰되,
       handleNext 안에서 remainingSec > 0 이면 그냥 무시하도록 했음 */}
      <Pressable style={styles.container} onPress={handleNext}>
        <View style={styles.inner}>
          {/* 🔥 상단 그라데이션 카드 (남은 시간 표시) */}
          <LinearGradient
            colors={['#F9CACA', '#E4DBC2', '#C0D8AD']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.stepCard}>
            <Animated.Text
              style={[styles.stepText, {transform: [{scale: scaleAnim}]}]}>
              {stepsText}
            </Animated.Text>
          </LinearGradient>

          {/* 캐릭터 영역 */}
          <View style={styles.characterWrapper}>
            {(() => {
              const char = getLocalProfileImage(detail.characterImageUrl);
              return (
                <Image
                  source={char}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              );
            })()}
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  // 전체 배경(헤더 아래 영역)
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 중앙 정렬용 래퍼
  inner: {
    width: width * 0.9,
    alignItems: 'center',
  },
  // 로딩 화면
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 🔥 그라데이션 카드 (남은 시간 표시)
  stepCard: {
    width: '80%',
    height: 160,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -40,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },

  stepText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
    lineHeight: 34,
  },

  characterWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
  },
});
