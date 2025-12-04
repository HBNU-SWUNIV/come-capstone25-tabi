// src/screens/Play/PlayTabScreen.tsx
import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import haversine from 'haversine-distance';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

// ----- Treasure APIs -----
import {
  getAvailableTreasureHunts,
  setTreasureHuntAvailable,
  setTreasureHuntPlaying,
  deleteAvailableTreasureHunt,
} from '../../api/treasureHuntPlay';
import {getMyRunningTreasureHunt} from '../../api/myTreasure';
import {
  saveRunningTreasureTargets,
  loadRunningTreasureTargets,
  getTreasurePostIndex,
  getLastTreasureStatus,
  setLastTreasureStatus,
  type RunningTreasureTarget,
} from '../../utils/treasureRunningTargetsStore';

// ----- Quest APIs -----
import {getMyRunningQuests} from '../../api/myQuest';
import {
  setAvailable,
  setPending,
  setPlaying,
  getAvailableList,
  setNextLocation,
} from '../../api/questPlay';
import {
  saveRunningQuestTargets,
  loadRunningQuestTargets,
  getQuestPostIndex,
  getQuestLastStatus,
  setQuestLastStatus,
  type RunningQuestTarget,
} from '../../utils/questRunningTargetsStore';

// ----- 진행 중 퀘스트 스토어 -----
import {
  loadUnfinishedQuest,
  type UnfinishedQuest,
} from '../../utils/unfinishedQuestStore';

import {setActiveTarget} from '../../utils/activeTarget';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');

const pressedItemStyle = {backgroundColor: '#d2cfc8'};
const pressedTextStyle = {opacity: 0.7};

const NEAR_LIMIT_M_TREASURE = 1000; // 1km
const NEAR_LIMIT_M_QUEST_AVAILABLE = 1000; // 퀘스트 시작 반경 (테스트용 1km)
const NEAR_LIMIT_M_QUEST_PENDING = 5000; // Pending 전환까지의 필요 거리 5km

// --- 위치 Promise 유틸 ---
const getCurrentPositionP = () =>
  new Promise<GeoPosition>((resolve, reject) =>
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000,
    }),
  );

// ===================================================================
// 1) Treasure: 서버 실행목록 → 로컬 캐시
// ===================================================================
async function refreshRunningTreasureCache(): Promise<RunningTreasureTarget[]> {
  const res = await getMyRunningTreasureHunt();
  const list: RunningTreasureTarget[] = Array.isArray(res.data)
    ? res.data.map((item: any) => ({
        myTreasureHuntPlayId: item.myTreasureHuntPlayId,
        treasureHuntPostId: item.treasureHuntPostId,
        title: item.treasureHuntTitle,
        latitude: item.treasureHuntStartLocation.latitude,
        longitude: item.treasureHuntStartLocation.longitude,
        imageUrl: item.treasureHuntPostImage?.imageUrl,
        reward: item.reward && {
          rewardId: item.reward.rewardId,
          experience: item.reward.experience, // 서버 스펙에 맞게 사용 중
          type: item.reward.type,
          creditCardCount: item.reward.creditCardCount,
          coin: item.reward.coin,
        },
      }))
    : [];
  await saveRunningTreasureTargets(list);
  return list;
}

// ===================================================================
// 2) Treasure: 위치와 비교해 AVAILABLE 전환/해제 + AVAILABLE 조인
// ===================================================================
async function syncTreasureAvailabilityWithLocation(): Promise<
  RunningTreasureTarget[]
> {
  const list = await loadRunningTreasureTargets();
  if (list.length === 0) return [];

  const pos = await getCurrentPositionP();
  const user = {latitude: pos.coords.latitude, longitude: pos.coords.longitude};

  const last = await getLastTreasureStatus(); // treasureHuntPostId -> boolean
  const next: Record<number, boolean> = {...last};

  await Promise.all(
    list.map(async t => {
      const d = haversine(
        {latitude: user.latitude, longitude: user.longitude},
        {latitude: t.latitude, longitude: t.longitude},
      );

      const isAvailable = d <= NEAR_LIMIT_M_TREASURE;
      const wasAvailable = !!last[t.treasureHuntPostId];

      try {
        if (isAvailable && !wasAvailable) {
          await setTreasureHuntAvailable({
            treasureHuntPostId: t.treasureHuntPostId,
            latitude: user.latitude,
            longitude: user.longitude,
          });
          next[t.treasureHuntPostId] = true;
          console.log(`✅ Treasure ${t.treasureHuntPostId} → AVAILABLE`);
        } else if (!isAvailable && wasAvailable) {
          await deleteAvailableTreasureHunt(t.myTreasureHuntPlayId);
          next[t.treasureHuntPostId] = false;
          console.log(
            `✅ Treasure ${t.treasureHuntPostId} → NOT AVAILABLE (removed)`,
          );
        }
      } catch (e) {
        console.warn(
          `❌ treasure availability sync 실패(post:${t.treasureHuntPostId})`,
          e,
        );
      }
    }),
  );

  await setLastTreasureStatus(next);

  const avail = await getAvailableTreasureHunts();
  const postIndex = await getTreasurePostIndex();

  const visible: RunningTreasureTarget[] = Array.isArray(avail.data)
    ? avail.data.map(
        (a: any) =>
          postIndex[a.treasureHuntPostId] || {
            myTreasureHuntPlayId: 0,
            treasureHuntPostId: a.treasureHuntPostId,
            title: `#${a.treasureHuntPostId}`,
            latitude: 0,
            longitude: 0,
          },
      )
    : [];

  return visible;
}

// ===================================================================
// 3) Quest: 서버 실행목록 → 로컬 캐시
// ===================================================================
async function refreshRunningQuestCache(): Promise<RunningQuestTarget[]> {
  const list = await getMyRunningQuests(); // QuestPostDto[]
  const mapped: RunningQuestTarget[] = Array.isArray(list)
    ? list.map((q: any) => ({
        questPostId: q.questPostId,
        title: q.questTitle ?? '',
        latitude: q.questStartLocationDto?.latitude ?? 0,
        longitude: q.questStartLocationDto?.longitude ?? 0,
        imageUrl: q.questPostImageDtos?.[0]?.characterImageUrl,
        reward: q.rewardDto && {
          rewardId: q.rewardDto.rewardId,
          experience: q.rewardDto.experience,
          type: q.rewardDto.type,
          creditCardCount: q.rewardDto.creditCardCount,
          coin: q.rewardDto.coin,
        },
      }))
    : [];

  await saveRunningQuestTargets(mapped);
  return mapped;
}

// ===================================================================
// 4) Quest: 위치와 비교해 AVAILABLE/PENDING 전환 + AVAILABLE 조인
// ===================================================================
async function syncQuestAvailabilityWithLocation(): Promise<
  RunningQuestTarget[]
> {
  const list = await loadRunningQuestTargets();
  if (list.length === 0) return [];

  const pos = await getCurrentPositionP();
  const user = {latitude: pos.coords.latitude, longitude: pos.coords.longitude};

  const last = await getQuestLastStatus(); // questPostId -> boolean
  const next: Record<number, boolean> = {...last};

  await Promise.all(
    list.map(async q => {
      const d = haversine(
        {latitude: user.latitude, longitude: user.longitude},
        {latitude: q.latitude, longitude: q.longitude},
      );

      const isAvailable = d <= NEAR_LIMIT_M_QUEST_AVAILABLE;
      const isPending = d > NEAR_LIMIT_M_QUEST_PENDING;
      const wasAvailable = !!last[q.questPostId];

      try {
        if (isAvailable && !wasAvailable) {
          await setAvailable({
            questPostId: q.questPostId,
            latitude: user.latitude,
            longitude: user.longitude,
          });
          next[q.questPostId] = true;
          console.log(`✅ Quest ${q.questPostId} → AVAILABLE`);
        } else if (isPending && wasAvailable) {
          await setPending({
            questPostId: q.questPostId,
            latitude: user.latitude,
            longitude: user.longitude,
          });
          next[q.questPostId] = false;
          console.log(`✅ Quest ${q.questPostId} → PENDING`);
        }
      } catch (e) {
        console.warn(
          `❌ quest availability sync 실패(post:${q.questPostId})`,
          e,
        );
      }
    }),
  );

  await setQuestLastStatus(next);

  const availList = await getAvailableList(); // MyQuestPlayDto[]
  const postIndex = await getQuestPostIndex();

  const visible: RunningQuestTarget[] = Array.isArray(availList)
    ? availList.map(
        (a: any) =>
          postIndex[a.questPostId] || {
            questPostId: a.questPostId,
            title: `#${a.questPostId}`,
            latitude: 0,
            longitude: 0,
          },
      )
    : [];

  return visible;
}

// ===================================================================
// 5) 통합 타입 + 컴포넌트
// ===================================================================
type RunningItem =
  | (RunningTreasureTarget & {kind: 'treasure'})
  | (RunningQuestTarget & {kind: 'quest'});

export default function PlayTabScreen() {
  const [nearby, setNearby] = useState<RunningItem[]>([]);
  const [unfinished, setUnfinished] = useState<UnfinishedQuest | null>(null); // 진행 중 퀘스트
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  // 실행 리스트(Available) 항목 터치 시
  const handleItemPress = async (item: RunningItem) => {
    const pos = await getCurrentPositionP();

    if (item.kind === 'treasure') {
      // 보물찾기: 기존 로직 그대로
      await setActiveTarget({
        id: String(item.treasureHuntPostId),
        type: 'treasure',
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.title,
        reward: item.reward,
      });

      try {
        await setTreasureHuntPlaying({
          treasureHuntPostId: item.treasureHuntPostId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (e) {
        console.warn('❌ treasure playing 전환 실패', e);
      }

      navigation.navigate('TreasureView');
    } else {
      // 퀘스트: setPlaying 결과로 myQuestPlayId 를 받아서 activeTarget 에 저장
      try {
        const playDto = await setPlaying({
          questPostId: item.questPostId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        await setActiveTarget({
          id: String(item.questPostId),
          type: 'quest',
          latitude: item.latitude,
          longitude: item.longitude,
          title: item.title,
          reward: item.reward,
          myQuestPlayId: playDto.myQuestPlayId,
        });
      } catch (e) {
        console.warn('❌ quest playing 전환 실패', e);
        return;
      }

      navigation.navigate('QuestView');
    }
  };

  // "플레이중인 퀘스트" 카드 터치 시
  const handleUnfinishedPress = async () => {
    if (!unfinished) return;

    try {
      // 1) 현재 위치 가져오기
      const pos = await getCurrentPositionP();
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      // 2) 다음 위치로 실행 포인트 셋팅
      const loc = await setNextLocation(unfinished.myQuestPlayId, coords);

      if (loc.errorMessage) {
        console.warn('[PlayTab] setNextLocation error:', loc.errorMessage);
        Alert.alert(
          '안내',
          '조금 더 가까이 이동해 주세요!',
          [{text: '확인', style: 'default'}],
          {cancelable: true},
        );
        return;
      }

      // 3) activeTarget 갱신 (다음 실행 위치 기준)
      await setActiveTarget({
        id: String(unfinished.questPostId),
        type: 'quest',
        latitude: loc.latitude,
        longitude: loc.longitude,
        title: unfinished.title,
        myQuestPlayId: unfinished.myQuestPlayId,
        // reward 는 unfinished 에 없으니 여기선 생략
      });

      // 4) 퀘스트 진행 화면으로 이동
      navigation.navigate('QuestView');
    } catch (e) {
      console.warn('❌ handleUnfinishedPress 실패:', e);
    }
  };

  // 전체 데이터 로딩 (Treasure / Quest / 진행 중 퀘스트)
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // ① 서버 실행 목록 캐시 동기화
      await Promise.all([
        refreshRunningTreasureCache(),
        refreshRunningQuestCache(),
      ]);

      // ② 위치 기반 AVAILABLE 동기화 + 서버 AVAILABLE 조인
      const [visibleTreasure, visibleQuest, unfinishedQuest] =
        await Promise.all([
          syncTreasureAvailabilityWithLocation(),
          syncQuestAvailabilityWithLocation(),
          loadUnfinishedQuest(), // 진행 중 퀘스트 1개 로드
        ]);

      const merged: RunningItem[] = [
        ...visibleTreasure.map(t => ({...t, kind: 'treasure'} as const)),
        ...visibleQuest.map(q => ({...q, kind: 'quest'} as const)),
      ];

      setNearby(merged);
      setUnfinished(unfinishedQuest);
    } finally {
      setLoading(false);
    }
  }, []);

  // 화면 포커스 될 때마다 동기화
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  // 탭을 다시 눌렀을 때 리프레시
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', loadAll);
    return unsub;
  }, [navigation, loadAll]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>

      {/* 진행 중인 퀘스트 영역 */}
      {unfinished && (
        <View style={styles.unfinishedContainer}>
          <Text style={styles.unfinishedTitle}>플레이중인 퀘스트</Text>
          <Pressable
            onPress={handleUnfinishedPress}
            style={({pressed}) => [
              styles.itemBox,
              styles.unfinishedItemBox,
              pressed && pressedItemStyle,
            ]}>
            <Text style={styles.locationText}>
              {unfinished.title ?? `Q. #${unfinished.questPostId}`}
            </Text>
            {unfinished.locationName && (
              <Text style={styles.unfinishedLocationText}>
                {unfinished.locationName}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* 실행 리스트 타이틀 */}
      <View style={styles.titleContainer}>
        <Text style={styles.topText}>실행 리스트</Text>
      </View>

      {/* 실행 리스트 내용 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#61402D" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      ) : nearby.length === 0 ? (
        <View style={styles.emptyMessageContainer}>
          <Text style={styles.brownText}>텅 비었어요!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollViewWrapper}
          contentContainerStyle={styles.scrollViewContent}>
          {nearby.map(item => {
            const key =
              item.kind === 'treasure'
                ? `T-${item.treasureHuntPostId}`
                : `Q-${item.questPostId}`;
            const label =
              item.kind === 'treasure'
                ? `T. ${item.title ?? `#${(item as any).treasureHuntPostId}`}`
                : `Q. ${item.title ?? `#${(item as any).questPostId}`}`;

            return (
              <Pressable
                key={key}
                onPress={() => handleItemPress(item)}
                style={({pressed}) => [
                  styles.itemBox,
                  pressed && pressedItemStyle,
                ]}>
                {({pressed}) => (
                  <Text
                    style={[styles.locationText, pressed && pressedTextStyle]}>
                    {label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE9E1',
    paddingTop: height * 0.06,
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingTop: 10,
  },

  // 진행 중인 퀘스트 영역
  unfinishedContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  unfinishedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#61402D',
    marginBottom: 8,
  },
  unfinishedItemBox: {
    marginBottom: 10,
  },
  unfinishedLocationText: {
    color: '#61402D',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },

  titleContainer: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingLeft: 20,
  },
  topText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#61402D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#61402D',
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    gap: 30,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  itemBox: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 15,
    padding: 20,
    backgroundColor: '#ECE9E1',
  },
  brownText: {
    color: '#61402D',
    fontSize: 20,
  },
  locationText: {
    color: '#61402D',
    fontSize: 20,
    lineHeight: 26,
  },
});
