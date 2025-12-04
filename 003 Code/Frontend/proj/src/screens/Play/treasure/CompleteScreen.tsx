// src/screens/CompleteScreen.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageBackground,
  LayoutChangeEvent,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import LoadingCircleCountDown from '../../../components/LoadingCircleCountDown';
import {getActiveTarget, clearActiveTarget} from '../../../utils/activeTarget';
import {getMyProfile} from '../../../api/profile';

import COIN from '../../../img/coin.png';
import NORMAL_CARD from '../../../img/card-normal.png';
import PREMIUM_CARD from '../../../img/card-premium.png';
import BACKGROUND from '../../../img/complete-bg.png';
import RED_STAR from '../../../img/red-star.png';
import {getLocalProfileImage} from '../../../characters/profileImages';

type Phase = 'found' | 'reward';

type Reward = {
  rewardId: number;
  experience: number;
  type: boolean; // true: 일반, false: 고급
  creditCardCount: number;
  coin: number;
} | null;

type MyProfile = {
  myProfileId: number;
  nickName: string;
  profileImageUrl: string;
  level: number;
  experience: number; // 0~10에서 레벨업 (10 채우면 다음 레벨)
};

// ✅ 개발용 더미들(서버 응답 없을 때만 사용)
const FALLBACK_REWARD: NonNullable<Reward> = {
  rewardId: 999,
  experience: 1,
  type: false, // 고급
  creditCardCount: 1,
  coin: 2,
};
const FALLBACK_PROFILE: MyProfile = {
  myProfileId: 0,
  nickName: 'Guest',
  profileImageUrl: '',
  level: 2,
  experience: 1,
};

export default function CompleteScreen() {
  const navigation = useNavigation<any>();
  const [phase, setPhase] = useState<Phase>('found');

  const [title, setTitle] = useState<string | undefined>();
  const [reward, setReward] = useState<Reward>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  // 진행바/텍스트 배치 계산용 치수
  const [barW, setBarW] = useState(0);
  const [expTextW, setExpTextW] = useState(0);
  const [expTextH, setExpTextH] = useState(0);

  // ---- 초기 데이터 로딩 & 재시도 ----
  const loadData = useCallback(async () => {
    try {
      const t = await getActiveTarget();
      console.log('[Complete] activeTarget =', t);
      setTitle(t?.title);

      const rewardFromStorage = t?.reward;
      if (rewardFromStorage) {
        setReward(rewardFromStorage);
      } else {
        console.warn('[Complete] reward 없음 → FALLBACK 사용');
        setReward(FALLBACK_REWARD); // 테스트 중이면 항상 더미로 보여주기
      }
    } catch (e) {
      console.error('[Complete] getActiveTarget 실패', e);
      setReward(FALLBACK_REWARD); // 실패 시에도 더미
    }

    try {
      const p = await getMyProfile();
      console.log('[Complete] profile =', p);
      setProfile(p);
    } catch (e) {
      console.error('[Complete] getMyProfile 실패', e);
      setProfile(FALLBACK_PROFILE); // 실패 시에도 더미
    }
  }, []);

  useEffect(() => {
    loadData(); // 최초 1회
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(); // 화면에 다시 포커스될 때 재시도
      return () => {};
    }, [loadData]),
  );

  // ---- 보상 단계에서 2초 후 홈으로 ----
  useEffect(() => {
    if (phase !== 'reward') return;
    const tm = setTimeout(async () => {
      await clearActiveTarget();
      navigation.replace('PlayHome');
    }, 3000);
    return () => clearTimeout(tm);
  }, [phase, navigation]);

  // 카드 이미지/라벨 (type: true=일반, false=고급)
  const cardImage = useMemo(
    () => (reward?.type ? NORMAL_CARD : PREMIUM_CARD),
    [reward?.type],
  );
  const cardLabel = reward?.type ? '일반 뽑기권' : '고급 뽑기권';

  // 경험치 바 진행률 (0~1) — 10 단위로 레벨업
  const expProgress = useMemo(() => {
    const exp = profile?.experience ?? 0;
    return Math.max(0, Math.min(1, (exp % 10) / 10));
  }, [profile?.experience]);

  // === EX 텍스트 배치 계산 ===
  // 채워진 폭
  const filledW = useMemo(
    () => Math.round(expProgress * barW),
    [expProgress, barW],
  );
  const textMargin = 6; // 채움 오른쪽과 텍스트 간격
  const textTooWide = filledW < expTextW + textMargin; // 안에 못 들어갈 정도로 짧으면 true

  // 안에 들어가면: left = filledW - textW - margin, 색상은 밝게
  // 밖으로 빼면:   left = filledW + margin, 색상은 어둡게
  const expTextLeft = useMemo(() => {
    if (barW === 0 || expTextW === 0) return 0;
    return textTooWide
      ? filledW + textMargin
      : Math.max(0, filledW - expTextW - textMargin);
  }, [barW, expTextW, filledW, textTooWide, textMargin]);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarW(e.nativeEvent.layout.width);
  };
  const onExpTextLayout = (e: LayoutChangeEvent) => {
    setExpTextW(e.nativeEvent.layout.width);
    setExpTextH(e.nativeEvent.layout.height);
  };

  // 수직 중앙 배치
  const expTextTop = useMemo(() => {
    const h = 28; // progressWrap height
    return Math.max(0, (h - expTextH) / 2);
  }, [expTextH]);

  return (
    <View style={styles.wrap}>
      {phase === 'found' && (
        <>
          <LoadingCircleCountDown
            initialCount={2}
            onFinish={() => setPhase('reward')}
          />
          <View style={styles.centerBox}>
            <Image source={RED_STAR} style={styles.bigIcon} />
            <Text style={styles.centerLine1}>보물을 찾았어요!</Text>
            {!!title && (
              <Text style={styles.centerLine2} numberOfLines={2}>
                “{title}” 보물찾기를 클리어했습니다!
              </Text>
            )}
          </View>
        </>
      )}

      {phase === 'reward' && (
        <ImageBackground
          source={BACKGROUND}
          style={styles.bg}
          resizeMode="cover"
          imageStyle={{opacity: 0.9}}>
          {/* 🔹 블러 오버레이 */}
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={8}
            reducedTransparencyFallbackColor="rgba(255,255,255,0.65)"
          />

          <LoadingCircleCountDown initialCount={3} onFinish={() => {}} />

          {/* 헤더 */}
          <View style={styles.rewardHeader}>
            <Text style={styles.rewardHeadTitle}>두근두근!</Text>
            <Text style={styles.rewardSub}>
              우와! 보물상자를 열어보니 이런게 나왔어요!
            </Text>
          </View>

          {/* --- 경험치 카드 --- */}
          <View style={styles.expCard}>
            <View style={styles.expLeft}>
              {profile?.profileImageUrl ? (
                <Image
                  source={getLocalProfileImage(profile.profileImageUrl)}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, {backgroundColor: '#ddd'}]} />
              )}
              <Text style={styles.nick} numberOfLines={1}>
                {profile?.nickName ?? ''}
              </Text>
            </View>

            <View style={styles.expRight}>
              <Text style={styles.expTitle}>획득 경험치</Text>
              <Text style={styles.levelText}>Lv. {profile?.level ?? '-'}</Text>

              <View style={styles.progressWrap} onLayout={onBarLayout}>
                {/* 채워진 부분 */}
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        barW === 0 ? 0 : `${Math.round(expProgress * 100)}%`,
                    },
                  ]}
                />
                {/* EX +n 텍스트 (안/밖 자동 배치) */}
                <Text
                  onLayout={onExpTextLayout}
                  style={[
                    styles.expText,
                    {
                      position: 'absolute',
                      left: expTextLeft,
                      top: expTextTop,
                      color: textTooWide ? '#2b2b2b' : '#E6E6E6',
                    },
                  ]}>
                  EX +{reward?.experience ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* --- 코인 / 뽑기권 --- */}
          <View style={styles.rewardBody}>
            <View style={styles.rewardItem}>
              <Image source={COIN} style={styles.rewardIcon} />
              <Text style={styles.rewardText}>COIN + {reward?.coin ?? 0}</Text>
            </View>

            {reward && reward.creditCardCount > 0 && (
              <View style={styles.rewardItem}>
                <Image source={cardImage} style={styles.cardIcon} />
                <Text style={styles.rewardText}>
                  {cardLabel} + {reward.creditCardCount}
                </Text>
              </View>
            )}
          </View>
        </ImageBackground>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#ECE9E1',
  },

  // Found 단계
  headerTitle: {
    marginTop: 70,
    textAlign: 'center',
    fontSize: 28,
    color: '#61402D',
    fontWeight: '800',
  },
  centerBox: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  bigIcon: {width: 160, height: 160, resizeMode: 'contain', marginBottom: 16},
  centerLine1: {
    fontSize: 18,
    color: '#61402D',
    fontWeight: '600',
    marginTop: 8,
  },
  centerLine2: {
    fontSize: 16,
    color: '#61402D',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },

  // Reward 단계
  bg: {flex: 1, paddingTop: 24, paddingHorizontal: 20},
  rewardHeader: {alignItems: 'center', marginTop: 12, marginBottom: 14},
  rewardHeadTitle: {fontSize: 24, color: '#E06167', fontWeight: '800'},
  rewardSub: {
    marginTop: 6,
    fontSize: 12,
    color: '#61402D',
    opacity: 0.8,
    textAlign: 'center',
  },

  // 경험치 카드
  expCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  expLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 88,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  nick: {
    marginTop: 8,
    fontSize: 12,
    color: '#2b2b2b',
    fontWeight: '600',
  },
  expRight: {
    flex: 1,
  },
  expTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2b2b2b',
    marginBottom: 2,
  },
  levelText: {fontSize: 14, color: '#2b2b2b', opacity: 0.85, marginBottom: 8},

  // 경험치 바
  progressWrap: {
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F2EE',
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3975E5',
  },
  expText: {
    // 폰트 크기/굵기는 그대로 유지
    fontSize: 10,
    fontWeight: '300',
    // color는 동적으로 바뀜(#E6E6E6 또는 #2b2b2b)
  },

  // 하위 리워드들
  rewardBody: {
    marginTop: 30,
    gap: 28,
    alignItems: 'center',
  },
  rewardItem: {
    alignItems: 'center',
    gap: 6,
  },
  rewardIcon: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
  },
  cardIcon: {
    width: 110,
    height: 70,
    resizeMode: 'contain',
  },
  rewardText: {color: '#61402D', marginTop: 2, fontWeight: '600'},
});
