// src/screens/Quest/QuestSocialScreen.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  FlatList,
  ListRenderItemInfo,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';

// API
import {fetchQuestPostList, startQuestPlay} from '../../../api/questPost';
import type {QuestPostDto} from '../../../api/questPost';

// Image
import FIRE from '../../../img/fire.png';
import MONEY from '../../../img/money.png';
import CARD_NORMAL from '../../../img/card-normal.png';
import CARD_PREMIUM from '../../../img/card-premium.png';
import HeaderIcon from '../../../components/HeaderIcon';

// ✅ 프로필 이미지 매핑
import {getLocalProfileImage} from '../../../characters/profileImages';

// ⚠ 구글 Street View Static API 키
import Config from 'react-native-config';

const {width, height} = Dimensions.get('window');
const PAGE_SIZE = 10;

const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  text: '#141414',
  sub: '#4d4d4d',
  divider: '#D7C9BF',
  modalOverlay: 'rgba(0,0,0,0.4)',
  panelOuter: '#E8E1D8',
  panelInner: '#F9F6F1',
};

type QuestPostLocal = QuestPostDto & {
  uploadUserName: string;
  uploadUserProfileUrl: string;
  questTitle: string;
  questDescription: string;
  createdAt: string;
};

const toLocal = (n: QuestPostDto): QuestPostLocal => ({
  ...n,
  uploadUserName: n.uploadUserName ?? 'Unknown',
  uploadUserProfileUrl: n.uploadUserProfileUrl ?? '',
  questTitle: n.questTitle ?? '',
  questDescription: n.questDescription ?? '',
  createdAt: n.createdAt ?? '',
});

/** 좌표 문자열/number → number 또는 null */
const normalizeCoord = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** Street View URL 생성 */
const getStreetViewUrl = (latRaw: unknown, lngRaw: unknown): string | null => {
  const lat = normalizeCoord(latRaw);
  const lng = normalizeCoord(lngRaw);

  if (lat === null || lng === null) {
    // console.log('[StreetView] invalid coords:', latRaw, lngRaw);
    return null;
  }

  const key = Config.GOOGLE_STATIC_MAP_KEY;
  if (!key) {
    console.warn('⚠ GOOGLE_STATIC_MAP_KEY간 설정되어 있지 않다');
    return null;
  }

  // Street View Static API: size는 640x640 이하 권장
  return (
    'https://maps.googleapis.com/maps/api/streetview' +
    `?size=600x400` +
    `&location=${lat},${lng}` +
    `&fov=80&heading=0&pitch=0` +
    `&key=${key}`
  );
};

export default function QuestSocialScreen() {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [items, setItems] = useState<QuestPostLocal[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 설명 펼치기 상태 (postId -> boolean)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // 보상 모달 상태
  const [rewardVisible, setRewardVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any | null>(null);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}년 ${m}월 ${day}일`;
  };

  const fetchPage = useCallback(
    async (p: number, opts?: {replace?: boolean}) => {
      if (p === 0) setLoading(true);
      try {
        console.log(`[QuestSocial] fetching page ${p} ...`);
        const raw = await fetchQuestPostList(p);
        console.log(
          `[QuestSocial] fetchQuestPostList(${p}) raw response:`,
          raw,
        );

        const list = Array.isArray(raw) ? raw.map(toLocal) : [];
        console.log(
          `[QuestSocial] normalized list (${list.length} items):`,
          list,
        );

        setHasMore(list.length >= PAGE_SIZE);

        setItems(prev => {
          if (p === 0 || opts?.replace) return list;
          const map = new Map<number, QuestPostLocal>();
          prev.forEach(v => map.set(v.questPostId, v));
          list.forEach(v => {
            if (!map.has(v.questPostId)) map.set(v.questPostId, v);
          });
          return Array.from(map.values());
        });
      } catch (e) {
        console.log('[QuestSocial] fetch error', e);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPage(0, {replace: true});
  }, [fetchPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    fetchPage(0, {replace: true});
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    setPage(next);
    fetchPage(next);
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  const onToggleExpand = (id: number) =>
    setExpanded(prev => ({...prev, [id]: !prev[id]}));

  const openRewardModal = (reward: any | null | undefined) => {
    if (!reward) return;
    setSelectedReward(reward);
    setRewardVisible(true);
  };

  const closeRewardModal = () => {
    setRewardVisible(false);
    setSelectedReward(null);
  };

  const ListEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator color={C.brown} />
          <Text style={styles.loadingText}>불러오는 중…</Text>
        </View>
      );
    }
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyText}>표시할 퀘스트가 없습니다.</Text>
      </View>
    );
  }, [loading]);

  const renderItem = ({item}: ListRenderItemInfo<QuestPostLocal>) => {
    const uploader = item.uploadUserName ?? 'Unknown';

    // 프로필 이미지: 서버 경로 → 로컬 매핑 → fallback 순으로 사용
    const localProfileImg = getLocalProfileImage(item.uploadUserProfileUrl);
    const profileSource =
      localProfileImg ||
      (item.uploadUserProfileUrl
        ? {uri: item.uploadUserProfileUrl}
        : require('../../../img/hanbat_logo.png'));

    const left = item.questTitle?.trim() ?? '';
    const rightActual =
      item.questStartLocationDto?.actualLocation?.trim() ?? '';
    const rightIndicate =
      item.questStartLocationDto?.indicateLocation?.trim() ?? '';

    // 기본: indicate 사용 (원래 쓰던 쪽 유지)
    const title = rightIndicate ? `${left} - ${rightIndicate}` : left;

    const desc = item.questDescription?.trim() ?? '';
    const isOpen = !!expanded[item.questPostId];

    const NEED_TRUNCATE = desc.length > 80;
    const shownDesc = !NEED_TRUNCATE || isOpen ? desc : `${desc.slice(0, 80)}…`;

    // Street View URL 생성 (좌표는 number|string 모두 허용)
    const streetViewUrl = getStreetViewUrl(
      item.questStartLocationDto?.latitude,
      item.questStartLocationDto?.longitude,
    );

    return (
      <View style={styles.cardWrap}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image source={profileSource} style={styles.avatar} />
            <View style={{marginLeft: 10, flex: 1}}>
              <Text style={styles.uploader} numberOfLines={1}>
                {uploader}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero 영역: 위치 있으면 Street View, 없으면 기존 Gradient UI */}
        <View style={styles.heroBox}>
          {streetViewUrl ? (
            <Image
              source={{uri: streetViewUrl}}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#AF5F4B', '#CEA480', '#D0D1A4']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[StyleSheet.absoluteFillObject, styles.heroFallback]}>
              <Icon name="image" size={36} color="#ffffffcc" />
              <Text style={styles.heroText}>퀘스트 미리보기</Text>
            </LinearGradient>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <View style={styles.leftButtons}>
            <Pressable
              style={styles.navBtn}
              onPress={() => {
                setIsLiked(!isLiked);
              }}>
              {isLiked ? (
                <Icon name="heart" size={24} color={C.brown} />
              ) : (
                <Icon name="heart-outline" size={24} color={C.brown} />
              )}
            </Pressable>
            <Pressable
              style={styles.navBtn}
              onPress={async () => {
                try {
                  const res = await startQuestPlay(item.questPostId);
                  console.log('startQuestPlay result:', res);

                  Alert.alert(
                    '퀘스트 수주 완료!',
                    '즐거운 모험 되세요!',
                    [{text: '확인'}],
                    {cancelable: true},
                  );
                } catch (err) {
                  console.log('startQuestPlay error:', err);

                  Alert.alert(
                    '오류',
                    '퀘스트 수주에 실패했습니다.',
                    [{text: '확인'}],
                    {cancelable: true},
                  );
                }
              }}>
              <Icon name="game-controller-outline" size={24} color={C.brown} />
            </Pressable>
            <Pressable
              style={styles.navBtn}
              onPress={() => openRewardModal((item as any).rewardDto)}>
              <Icon name="gift-outline" size={24} color={C.brown} />
            </Pressable>
          </View>
          <Pressable
            style={styles.bookmarkBtn}
            onPress={() => {
              setIsBookmarked(!isBookmarked);
            }}>
            {isBookmarked ? (
              <Icon name="bookmark" size={24} color={C.brown} />
            ) : (
              <Icon name="bookmark-outline" size={24} color={C.brown} />
            )}
          </Pressable>
        </View>

        {/* Description */}
        <View style={styles.descBox}>
          <Text style={styles.descText}>{shownDesc}</Text>
          {NEED_TRUNCATE && (
            <Pressable
              hitSlop={8}
              onPress={() => onToggleExpand(item.questPostId)}>
              <Text style={styles.moreTxt}>
                {isOpen ? '접기' : '... 더보기'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Date */}
        <View style={styles.dateRow}>
          <Text style={styles.dateTxt}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  // ───────────────────────────────── 모달 렌더 ────────────────────────────────
  const renderRewardModal = () => {
    if (!selectedReward) return null;

    const exp = selectedReward.experience ?? 0;
    const coin = selectedReward.coin ?? 0;
    const ticketCount = selectedReward.creditCardCount ?? 0;
    const isNormal: boolean = selectedReward.type !== false; // true/undefined → 일반, false → 고급

    const ticketLabel = isNormal ? '일반 캐릭터 뽑기권' : '고급 캐릭터 뽑기권';
    const ticketImage = isNormal ? CARD_NORMAL : CARD_PREMIUM;

    return (
      <Modal
        transparent
        visible={rewardVisible}
        animationType="fade"
        onRequestClose={closeRewardModal}>
        <TouchableWithoutFeedback onPress={closeRewardModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.rewardPanel}>
                {/* 행 1: 경험치 */}
                <View style={styles.rewardRow}>
                  <View style={styles.rewardLeft}>
                    <Image source={FIRE} style={styles.rewardIcon} />
                  </View>
                  <View style={styles.rewardRight}>
                    <Text style={styles.rewardTitle}>획득 가능 경험치</Text>
                    <Text style={[styles.rewardValue, {color: '#D33A2C'}]}>
                      {exp > 0 ? `+${exp}` : '+0'}
                    </Text>
                  </View>
                </View>

                {/* 행 2: 뽑기권 */}
                <View style={styles.rewardRow}>
                  <View style={styles.rewardLeft}>
                    <Image source={ticketImage} style={styles.rewardIcon} />
                  </View>
                  <View style={styles.rewardRight}>
                    <Text style={styles.rewardTitle}>{ticketLabel}</Text>
                    <Text style={[styles.rewardValue, {color: '#1E4FD8'}]}>
                      {ticketCount > 0 ? `+${ticketCount}` : '+0'}
                    </Text>
                  </View>
                </View>

                {/* 행 3: 코인 */}
                <View style={styles.rewardRow}>
                  <View style={styles.rewardLeft}>
                    <Image source={MONEY} style={styles.rewardIcon} />
                  </View>
                  <View style={styles.rewardRight}>
                    <Text style={styles.rewardTitle}>코인</Text>
                    <Text style={[styles.rewardValue, {color: '#C28C08'}]}>
                      {coin > 0 ? `+${coin}` : '+0'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['right', 'left']}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      <FlatList
        data={items}
        keyExtractor={it => String(it.questPostId)}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 16}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={ListEmpty}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={C.brown} />
              <Text style={styles.loadingText}>불러오는 중…</Text>
            </View>
          ) : null
        }
        removeClippedSubviews
        initialNumToRender={5}
        windowSize={7}
      />
      {renderRewardModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: height * 0.06,
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
  },

  centerBox: {
    paddingTop: 40,
    paddingBottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {marginTop: 8, color: C.brown, opacity: 0.7},
  emptyText: {color: C.brown, opacity: 0.7},

  cardWrap: {
    width,
    paddingBottom: 10,
    paddingTop: 8,
    marginVertical: 12,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 22,
    backgroundColor: '#D0C4BA',
  },
  uploader: {
    color: C.text,
    fontSize: 13,
  },
  title: {
    color: '#6D6D6D',
    fontWeight: '400',
    fontSize: 13,
    marginTop: 2,
  },

  /* Hero area */
  heroBox: {
    height: height * 0.38,
    width: width,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {color: '#fff', marginTop: 8, fontWeight: '700'},

  /* Buttons */
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    backgroundColor: C.bg,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkBtn: {
    backgroundColor: C.bg,
    padding: 4,
  },

  /* Description */
  descBox: {
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },
  descText: {
    color: C.text,
    lineHeight: 20,
    fontWeight: '400',
    fontSize: 13,
  },
  moreTxt: {
    color: C.sub,
    marginTop: 8,
    fontWeight: '400',
  },

  /* Date */
  dateRow: {
    marginTop: 10,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  dateTxt: {
    color: C.sub,
    fontSize: 10,
  },

  /* Loading more page */
  loadingMore: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Reward modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: C.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardPanel: {
    width: width * 0.8,
    borderRadius: 28,
    backgroundColor: C.panelOuter,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  rewardRow: {
    backgroundColor: C.panelInner,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRight: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 12,
  },
  rewardTitle: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
