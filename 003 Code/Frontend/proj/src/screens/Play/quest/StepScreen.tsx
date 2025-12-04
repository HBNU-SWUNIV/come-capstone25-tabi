// src/screens/Play/Quest/StepScreen.tsx
import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getCurrentDetail,
  getNextLocationInfo,
  getCurrentLocationInfo,
  type CurrentDetailDto,
} from '../../../api/questPlay';
import {getActiveTarget} from '../../../utils/activeTarget';
import {saveUnfinishedQuest} from '../../../utils/unfinishedQuestStore';
import LinearGradient from 'react-native-linear-gradient';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

import DUMMY from '../../../characters/owl_1.png';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getLocalProfileImage} from '../../../characters/profileImages';

const {width} = Dimensions.get('window');

type RouteParams = {
  detail?: CurrentDetailDto;
};

export default function StepScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialDetail = (route.params as RouteParams | undefined)?.detail;

  // ───────────────────────────────────
  // ① 서버에서 내려오는 액션 상세
  // ───────────────────────────────────
  const [detail, setDetail] = useState<CurrentDetailDto | null>(
    initialDetail ?? null,
  );
  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialDetail);
  const [busy, setBusy] = useState(false); // 연타 / 중복 호출 방지

  // ───────────────────────────────────
  // ② 걸음 수 관련 상태
  // ───────────────────────────────────
  const [currentSteps, setCurrentSteps] = useState(0); // 현재 센서로 센 걸음 수
  const accelSubRef = useRef<any>(null); // 가속도계 구독 핸들

  // ✅ 목표 걸음 수: 서버에서 내려온 walkingCount, 없으면 더미 100
  const stepGoal = useMemo(() => {
    if (detail?.walkingCount != null) return detail.walkingCount;
    return 100; // 더미 테스트용
  }, [detail]);

  // ───────────────────────────────────
  // ③ 최초 진입 시 myQuestPlayId / detail 로드
  // ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveTarget();
        if (!active?.myQuestPlayId) {
          console.warn('❌ myQuestPlayId 없음, 이전 화면으로 복귀');
          navigation.goBack();
          return;
        }
        setMyQuestPlayId(active.myQuestPlayId);

        // route 로 detail 이 안 넘어진 경우에만 서버 호출
        if (!initialDetail) {
          setLoading(true);
          const d = await getCurrentDetail(active.myQuestPlayId);
          setDetail(d);
        }
      } catch (e) {
        console.warn('❌ StepScreen 초기 로드 실패:', e);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, initialDetail]);

  // ───────────────────────────────────
  // ④ actionType -> 다음 화면 매핑
  // ───────────────────────────────────
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

  // ───────────────────────────────────
  // ⑤ 다음 액션으로 진행 (DialogScreen 이랑 동일 패턴)
  // ───────────────────────────────────
  const handleNext = useCallback(async () => {
    if (busy) return;
    if (!detail || !myQuestPlayId) return;
    setBusy(true);

    try {
      // 1) 이 WALKING 액션이 "액션 레벨"에서 마지막인 경우
      if (detail.endAction) {
        // 1-1) 먼저 현재 실행해야 할 위치가 퀘스트의 마지막 위치인지 확인
        const currentLoc = await getCurrentLocationInfo(myQuestPlayId);

        if (currentLoc.errorMessage) {
          console.warn(
            '❌ getCurrentLocationInfo 에러:',
            currentLoc.errorMessage,
          );
          navigation.goBack();
          return;
        }

        // ★ 이 위치가 마지막 위치(endLocation)면 → 바로 클리어 화면으로
        if (currentLoc.endLocation) {
          navigation.replace('QuestClearScreen', {
            myQuestPlayId,
            locationInfo: currentLoc,
          });
          return;
        }

        // 1-2) endAction은 true지만, endLocation은 아님 → 다음 위치로 이동
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
          // 다음 위치로 가라는 의미니까 PlayHome으로 돌려보냄
          navigation.replace('PlayHome');
        } else {
          console.warn('❌ getNextLocationInfo 에러:', nextLoc.errorMessage);
          navigation.goBack();
        }
        return;
      }

      // 2) endAction === false → 같은 위치 안에서 다음 액션으로
      const next = await getCurrentDetail(myQuestPlayId);
      const screenName = mapActionToScreen(next.actionType);

      if (next.actionType === 'WALKING') {
        setDetail(next);
        setCurrentSteps(0);
      } else if (screenName) {
        navigation.replace(screenName, {detail: next});
      } else {
        console.warn('⚠️ 알 수 없는 actionType:', next.actionType);
      }
    } catch (e) {
      console.warn('❌ 다음 WALKING 액션 진행 실패:', e);
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  }, [busy, detail, myQuestPlayId, navigation]);

  // ───────────────────────────────────
  // ⑥ 가속도계로 걸음 수 세기
  // ───────────────────────────────────
  useEffect(() => {
    // 목표 걸음 수가 없으면(이상한 상황) 센서 시작 안 함
    if (stepGoal == null) return;

    // 가속도계 업데이트 주기(ms) 설정
    setUpdateIntervalForType(SensorTypes.accelerometer, 200); // 0.2초마다 업데이트

    // 간단한 피크 감지 기반 걸음 수 계산
    let lastMagnitude = 0;
    let lastStepTime = 0;
    const STEP_THRESHOLD = 1.0; // 얼마나 크게 변화해야 "걸음"으로 볼지 (튜닝 가능)
    const STEP_MIN_INTERVAL = 400; // 최소 걸음 간격(ms), 0.4초 이하 변화는 무시

    const sub = accelerometer.subscribe(
      ({x, y, z}) => {
        // 가속도 벡터 크기 계산
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const delta = Math.abs(magnitude - lastMagnitude);
        const now = Date.now();

        // 일정 threshold 이상 + 최소 간격을 만족하면 1걸음으로 카운트
        if (delta > STEP_THRESHOLD && now - lastStepTime > STEP_MIN_INTERVAL) {
          lastStepTime = now;
          setCurrentSteps(prev => prev + 1);
        }

        lastMagnitude = magnitude;
      },
      error => {
        console.warn('❌ accelerometer 에러:', error);
      },
    );

    accelSubRef.current = sub;

    // 언마운트 시 센서 구독 해제
    return () => {
      if (accelSubRef.current) {
        accelSubRef.current.unsubscribe();
        accelSubRef.current = null;
      }
    };
  }, [stepGoal]);

  // ───────────────────────────────────
  // ⑦ 걸음 수가 목표에 도달하면 자동으로 handleNext 실행
  // ───────────────────────────────────
  useEffect(() => {
    if (stepGoal == null) return;
    if (currentSteps >= stepGoal) {
      // 목표 달성 시 다음 액션으로 진행
      handleNext();
    }
  }, [currentSteps, stepGoal, handleNext]);

  // ───────────────────────────────────
  // ⑧ 로딩 상태 처리
  // ───────────────────────────────────
  if (loading || !detail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#61402D" />
      </View>
    );
  }

  // 남은 걸음 수 계산 (음수 방지)
  const remainingSteps = Math.max((stepGoal ?? 0) - currentSteps, 0);
  const stepsText = `${remainingSteps} 걸음\n남았어!`;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{flex: 1}}>
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerText}>걸어 다녀보자</Text>
        </View>
      </View>
      <View style={styles.container}>
        <View style={styles.inner}>
          {/* 🔥 상단 그라데이션 카드 (남은 걸음 표시) */}
          <LinearGradient
            colors={['#F9CACA', '#E4DBC2', '#C0D8AD']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.stepCard}>
            <Text style={styles.stepText}>{stepsText}</Text>
            {/* 디버그용 현재 누적 걸음 표시하고 싶으면 아래 표시 */}
            {/* <Text style={{marginTop: 8, fontSize: 14, color: '#61402D'}}>
            센서 카운트: {currentSteps}
          </Text> */}
          </LinearGradient>

          {/* 캐릭터 이미지 */}
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
      </View>
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
  // 전체 배경
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

  // 🔥 그라데이션 카드
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

  // 캐릭터
  characterWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
  },
});
