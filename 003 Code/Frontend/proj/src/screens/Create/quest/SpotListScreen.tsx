// src/screens/Quest/SpotListScreen.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useQuestLocations} from '../../../context/QuestLocationStore';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getRunningLocations} from '../../../api/questCreation';
import instance from '../../../api/axiosInstance';

const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  lightBrown: '#B5A699',
  rail: '#CDBBAF',
  badgeText: '#fff',
  chipText: '#fff',
};

const pinColors = [
  '#C94C4C',
  '#E76F51',
  '#FFBC42',
  '#6A994E',
  '#2A9D8F',
  '#277DA1',
  '#3A86FF',
  '#8E7DBE',
  '#8E44AD',
];

type ActionToken = 'talk' | 'stay' | 'puzzle' | 'walk';
type ChipKind = '대화' | '체류' | '퍼즐' | '도보수' | '미설정';

const tokenToLabel = (t: ActionToken): ChipKind => {
  switch (t) {
    case 'talk':
      return '대화';
    case 'stay':
      return '체류';
    case 'puzzle':
      return '퍼즐';
    case 'walk':
      return '도보수';
    default:
      return '미설정';
  }
};

const chipPalette: Record<ChipKind, {bg: string; icon: string}> = {
  대화: {bg: '#6DBC79', icon: 'chatbubbles-sharp'},
  체류: {bg: '#E1B574', icon: 'alarm-sharp'},
  퍼즐: {bg: '#9C86DE', icon: 'extension-puzzle-sharp'},
  도보수: {bg: '#E1837D', icon: 'footsteps-sharp'},
  미설정: {bg: '#9A9A9A', icon: 'help-sharp'},
};

type IndicatingMapValue = {
  questIndicatingId: number;
  talkingAction?: boolean;
  stayingAction?: boolean;
  puzzleAction?: boolean;
  walkingAction?: boolean;
};

export default function SpotListScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const {places, setPlaces} = useQuestLocations();

  const [loading, setLoading] = useState(true);
  const [indicatingMap, setIndicatingMap] = useState<
    Record<number, IndicatingMapValue>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // questId 결정 (route 우선, 없으면 AsyncStorage)
        let qid: number | null = null;
        if ((route.params as any)?.questId) {
          qid = (route.params as any).questId;
          await AsyncStorage.setItem('currentQuestId', String(qid));
        } else {
          const stored = await AsyncStorage.getItem('currentQuestId');
          if (stored) qid = Number(stored);
        }

        if (!qid) {
          Alert.alert('오류', 'questId를 불러올 수 없습니다.');
          nav.goBack();
          return;
        }

        const [locData, indicatingRes] = await Promise.all([
          getRunningLocations(qid),
          instance.get(`/api/quest-indicating/list/${qid}`),
        ]);

        const indicatingList: any[] = Array.isArray(indicatingRes.data)
          ? indicatingRes.data
          : [];

        // questRunningLocationId -> questIndicatingId 및 액션 플래그 매핑
        const mapObj: Record<number, IndicatingMapValue> = {};
        for (const ind of indicatingList) {
          if (typeof ind?.questRunningLocationId === 'number') {
            mapObj[ind.questRunningLocationId] = {
              questIndicatingId: ind.questIndicatingId,
              talkingAction: !!ind.talkingAction,
              stayingAction: !!ind.stayingAction,
              puzzleAction: !!ind.puzzleAction,
              walkingAction: !!ind.walkingAction,
            };
          }
        }
        setIndicatingMap(mapObj);

        const getActionTokens = (m?: IndicatingMapValue): ActionToken[] => {
          const arr: ActionToken[] = [];
          if (m?.talkingAction) arr.push('talk');
          if (m?.stayingAction) arr.push('stay');
          if (m?.puzzleAction) arr.push('puzzle');
          if (m?.walkingAction) arr.push('walk');
          return arr;
        };

        // 러닝 로케이션 + 인디케이팅 매핑 병합 → 전역 places에 주입
        const merged = Array.isArray(locData)
          ? locData.map(loc => {
              const m = mapObj[loc.questRunningLocationId];
              const actionTokens = getActionTokens(m);
              return {
                id: String(loc.questRunningLocationId), // 고유키
                questRunningLocationId: loc.questRunningLocationId,
                name: loc.locationName,
                address: loc.detailLocation,
                lat: loc.latitude,
                lng: loc.longitude,
                sequence: loc.sequence,
                actions: actionTokens, // ('talk' | 'stay' | 'puzzle' | 'walk')[]
              };
            })
          : [];

        setPlaces(merged);
      } catch (e: any) {
        console.log('[SpotList fetch error]', e?.message ?? e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [route.params, nav, setPlaces]);

  const data = useMemo(() => places, [places]);

  const renderRow = ({
    item,
    index,
  }: {
    item: (typeof places)[number];
    index: number;
  }) => {
    const isFirst = index === 0;
    const isLast = index === data.length - 1;
    const order = index + 1;

    const chips: ChipKind[] =
      item.actions && item.actions.length
        ? item.actions.map(tokenToLabel)
        : ['미설정'];

    const indicating = item.questRunningLocationId
      ? indicatingMap[item.questRunningLocationId]
      : undefined;
    const questIndicatingId = indicating?.questIndicatingId ?? null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          nav.navigate('ActionSetting', {
            // ✅ 꼭 필요한 값만 전달: 인디케이팅 기준키 + 화면 컨텍스트용 spot
            questIndicatingId,
            spot: {
              id: item.id,
              name: item.name,
              address: item.address,
              lat: item.lat,
              lng: item.lng,
              sequence: (item as any).sequence, // 표시용 순번(있으면 전달)
              questRunningLocationId: (item as any).questRunningLocationId, // 참조용(옵션)
            },
          })
        }>
        <View style={styles.row}>
          {/* 좌측 레일 */}
          <View style={styles.railCol}>
            {isFirst ? (
              <View style={{flex: 1, justifyContent: 'flex-end'}}>
                <Text style={styles.railStart}>START</Text>
              </View>
            ) : (
              <View style={styles.timeLineBar} />
            )}
            <View
              style={[
                styles.badge,
                {backgroundColor: pinColors[index % pinColors.length]},
              ]}>
              <Text style={styles.badgeTxt}>{order}</Text>
            </View>
            {isLast ? (
              <View style={{flex: 1, justifyContent: 'flex-start'}}>
                <Text style={styles.railEnd}>END</Text>
              </View>
            ) : (
              <View style={styles.timeLineBar} />
            )}
          </View>

          {/* 우측 내용 */}
          <View style={styles.contentCol}>
            <View style={styles.cardRow}>
              <View style={styles.questBox}>
                <Text style={styles.questBoxTitle}>QUEST</Text>
                <Text style={styles.questBoxNum}>{order}</Text>
              </View>

              <View style={{flex: 1}}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.addr} numberOfLines={1}>
                  {item.address}
                </Text>

                <View style={styles.chipRow}>
                  {chips.map((k, i) => {
                    const pal = chipPalette[k] ?? chipPalette['미설정'];
                    return (
                      <View
                        key={`${k}-${i}`}
                        style={[styles.chip, {backgroundColor: pal.bg}]}>
                        <Icon
                          name={pal.icon}
                          size={14}
                          color={C.chipText}
                          style={{marginRight: 4}}
                        />
                        <Text style={styles.chipTxt}>{k}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleProceed = async () => {
    try {
      const storedPostId = await AsyncStorage.getItem('currentQuestPostId');
      if (!storedPostId) {
        Alert.alert('오류', 'questPostId를 찾을 수 없습니다');
        return;
      }
      const questPostId = Number(storedPostId);
      if (!questPostId || Number.isNaN(questPostId)) {
        Alert.alert('오류', '유효하지 않은 questPostId 입니다');
        return;
      }
      // 다음 페이지로 questPostId만 전달
      nav.navigate('QuestSetVisible', {questPostId});
    } catch (e: any) {
      console.log('[SpotList handleProceed error]', e?.message ?? e);
      Alert.alert('오류', '다음 단계로 이동 중 문제가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.safe, {alignItems: 'center', justifyContent: 'center'}]}>
        <ActivityIndicator size="small" color={C.brown} />
        <Text style={{marginTop: 8, color: C.brown, opacity: 0.7}}>
          불러오는 중…
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <View style={styles.backBtnField}>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Icon name="chevron-back" size={24} color={C.brown} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextField}>
            <Text style={styles.screenTitle}>퀘스트 설정</Text>
            <Text style={styles.sub}>
              {`퀘스트 실행 위치와 설정한 액션 및 액션수를 확인할 수 있어요.\n또한, 퀘스트를 눌러서 액션 설정을 할 수 있답니다!`}
            </Text>
          </View>
        </View>

        <FlatList
          contentContainerStyle={{paddingBottom: 24 + (insets.bottom || 0)}}
          data={data}
          keyExtractor={it => it.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={{height: 12}} />}
          ListFooterComponent={<View style={{height: 8}} />}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={[
            styles.saveBtn,
            {bottom: insets.bottom || 0, left: 16, right: 16},
          ]}
          onPress={handleProceed}>
          <Text style={styles.saveTxt}>저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  wrap: {flex: 1, backgroundColor: C.bg, paddingHorizontal: 16},
  headerRow: {flexDirection: 'row', marginTop: 4, marginBottom: 12},
  backBtnField: {flexDirection: 'column', paddingRight: 6},
  headerTextField: {flexDirection: 'column'},
  screenTitle: {color: C.brown, fontSize: 20, fontWeight: '800'},
  sub: {color: C.brown, opacity: 0.75, fontSize: 11, marginTop: 4},
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 96},
  railCol: {width: 28, alignItems: 'center'},
  timeLineBar: {
    flex: 1,
    width: 2,
    backgroundColor: C.lightBrown,
    borderRadius: 10,
  },
  railStart: {fontSize: 8, color: C.brown, opacity: 0.7, marginBottom: 4},
  railEnd: {fontSize: 8, color: C.brown, opacity: 0.7, marginTop: 4},
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  badgeTxt: {color: C.badgeText, fontWeight: '800', fontSize: 12},
  contentCol: {flex: 1, paddingLeft: 8},
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECE9E1',
    paddingVertical: 10,
  },
  questBox: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#C8B8AD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questBoxTitle: {color: '#fff', fontSize: 15, fontWeight: '700'},
  questBoxNum: {color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2},
  title: {color: C.brown, fontSize: 16, fontWeight: '800'},
  addr: {color: C.brown, opacity: 0.8, marginTop: 3, fontSize: 12},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipTxt: {color: C.chipText, fontWeight: '700', fontSize: 11},
  saveBtn: {
    position: 'absolute',
    backgroundColor: C.brown,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveTxt: {color: '#fff', fontSize: 17, fontWeight: '700'},
});
