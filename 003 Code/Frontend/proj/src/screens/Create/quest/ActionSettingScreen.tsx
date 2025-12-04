// src/screens/Quest/ActionSettingScreen.tsx
import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useMemo, useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {Modalize} from 'react-native-modalize';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import {
  ActionType,
  TimelineAction,
  useActionTimeline,
} from '../../../context/ActionTimelineStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import SwipeableItem from 'react-native-swipeable-item';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

// ✅ API
import {
  createQuestSteps,
  updateQuestStep,
  deleteQuestStep,
  getQuestStep,
  getQuestIndicating,
  type QuestStepRequest,
  type QuestStepResponse,
} from '../../../api/questCreation';

/* -------------------- 테마 -------------------- */
const C = {bg: '#ECE9E1', brown: '#61402D', chipText: '#fff'};

const ACTION_ROUTE: Record<ActionType, string> = {
  TALKING: 'SetDialogScreen',
  STAYING: 'SetStayScreen',
  WALKING: 'SetStepsScreen',
  PHOTO_PUZZLE: 'SetPhotoPuzzleScreen',
  INPUT_PUZZLE: 'SetInputPuzzleScreen',
  LOCATION_PUZZLE: 'SetLocationPuzzleScreen',
};

export const ACTION_PALETTE: Record<
  ActionType,
  {label: string; bg: string; icon: string}
> = {
  TALKING: {label: '대화', bg: '#99C884', icon: 'chatbubbles-sharp'},
  STAYING: {label: '체류', bg: '#D8C397', icon: 'alarm-sharp'},
  WALKING: {label: '도보수', bg: '#C88484', icon: 'footsteps-sharp'},
  PHOTO_PUZZLE: {
    label: '사진 퍼즐',
    bg: '#8E84C8',
    icon: 'extension-puzzle-sharp',
  },
  INPUT_PUZZLE: {
    label: '입력 퍼즐',
    bg: '#6557B6',
    icon: 'extension-puzzle-sharp',
  },
  LOCATION_PUZZLE: {
    label: '위치 퍼즐',
    bg: '#362B73',
    icon: 'extension-puzzle-sharp',
  },
};

/* -------------------- 그라데이션 화살표 -------------------- */
function GradientArrow({
  startColor,
  endColor,
  size = 30,
}: {
  startColor: string;
  endColor: string;
  size?: number;
}) {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.value = withRepeat(
      withTiming(1, {duration: 700, easing: Easing.inOut(Easing.quad)}),
      -1,
      true,
    );
  }, [offset]);
  const astyle = useAnimatedStyle(() => ({
    transform: [{translateY: offset.value * -4}],
    opacity: 0.6 + 0.4 * offset.value,
  }));
  return (
    <Animated.View style={astyle}>
      <MaskedView
        style={{
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        maskElement={<Icon name="chevron-down" size={size} color="#000" />}>
        <LinearGradient
          colors={[startColor, endColor]}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
          style={{width: size, height: size}}
        />
      </MaskedView>
    </Animated.View>
  );
}

/* -------------------- 유틸 -------------------- */
// 서버 검증 통과를 위한 기본값들
const DEFAULT_CHAR_IMG = 'owl_1.png';
const DUMMY = 'dummy';

// 액션 생성 시 타입별 “최소 유효” 페이로드 생성
function buildMinimalPayload(
  type: ActionType,
  base: {
    questIndicatingId: number;
    sequence: number;
    spot?: {lat?: number; lng?: number};
  },
): QuestStepRequest {
  const common: QuestStepRequest = {
    questIndicatingId: base.questIndicatingId,
    sequence: base.sequence,
    actionType: type,
    characterImageUrl: DEFAULT_CHAR_IMG,
  };
  switch (type) {
    case 'TALKING':
      return {...common, story: DUMMY};
    case 'WALKING':
      return {...common, walkingCount: 0};
    case 'STAYING':
      return {...common, day: 0, hour: 0, minute: 0};
    case 'INPUT_PUZZLE':
      return {
        ...common,
        answerString: DUMMY,
        hintOne: null,
        hintTwo: null,
        hintThree: null,
      };
    case 'PHOTO_PUZZLE':
      return {
        ...common,
        photoKeywordRequests: [{keyword: DUMMY}],
        hintOne: null,
        hintTwo: null,
        hintThree: null,
      };
    case 'LOCATION_PUZZLE':
      return {
        ...common,
        locationName: DUMMY,
        actualLocation: DUMMY,
        latitude: base.spot?.lat ?? 0,
        longitude: base.spot?.lng ?? 0,
        altitude: 0,
        hintOne: null,
        hintTwo: null,
        hintThree: null,
      };
  }
}

// 단건 조회 응답 → 업데이트 가능한 페이로드로 변환
function toUpdatablePayload(step: QuestStepResponse): QuestStepRequest {
  const {actionType, questIndicatingId, sequence, actionDto} = step as any;
  const base: QuestStepRequest = {
    questIndicatingId,
    sequence,
    actionType: actionType as ActionType,
    characterImageUrl: actionDto?.characterImageUrl || DEFAULT_CHAR_IMG,
  };
  const s: any = step;
  switch (actionType) {
    case 'TALKING':
      return {...base, story: s.story ?? DUMMY};
    case 'WALKING':
      return {...base, walkingCount: s.walkingCount ?? 0};
    case 'STAYING':
      return {
        ...base,
        day: s.day ?? 0,
        hour: s.hour ?? 0,
        minute: s.minute ?? 0,
      };
    case 'PHOTO_PUZZLE':
      return {
        ...base,
        photoKeywordRequests: s.photoKeywordRequests?.length
          ? s.photoKeywordRequests
          : [{keyword: DUMMY}],
        hintOne: s.hintOne ?? null,
        hintTwo: s.hintTwo ?? null,
        hintThree: s.hintThree ?? null,
      };
    case 'LOCATION_PUZZLE':
      return {
        ...base,
        locationName: s.locationName ?? DUMMY,
        actualLocation: s.actualLocation ?? DUMMY,
        latitude: s.latitude ?? s.lat ?? 0,
        longitude: s.longitude ?? s.lng ?? 0,
        altitude: s.altitude ?? 0,
        hintOne: s.hintOne ?? null,
        hintTwo: s.hintTwo ?? null,
        hintThree: s.hintThree ?? null,
      };
    case 'INPUT_PUZZLE':
      return {
        ...base,
        answerString: s.answerString ?? DUMMY,
        hintOne: s.hintOne ?? null,
        hintTwo: s.hintTwo ?? null,
        hintThree: s.hintThree ?? null,
      };
    default:
      return base;
  }
}

/* -------------------- 메인 -------------------- */
export default function ActionSettingScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();

  // 한국어 주석: SpotList에서 넘겨준 파라미터(누락 대비 방어)
  const {spot, questIndicatingId} = (route.params as any) ?? {
    spot: {id: ''},
    questIndicatingId: null,
  };

  const sheetRef = useRef<Modalize>(null);
  const {getTimeline} = useActionTimeline();

  // 초기 타임라인(스토어에서 가져오기, 없으면 빈 배열)
  const initialTimeline = Array.isArray(getTimeline(spot?.id || ''))
    ? getTimeline(spot?.id || '')
    : [];
  const [dragData, setDragData] = useState<TimelineAction[]>(initialTimeline);
  const [payloadMap, setPayloadMap] = useState<
    Record<string, QuestStepRequest>
  >({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // 서버에서 인디케이팅 및 스텝 목록 로드
  useEffect(() => {
    (async () => {
      if (!questIndicatingId) {
        setDragData([]);
        setInitialLoading(false);
        // 인디케이팅 없으면 시트를 올려서 사용자에게 안내
        setTimeout(() => sheetRef.current?.open(), 0);
        return;
      }
      try {
        setInitialLoading(true);
        const dto = await getQuestIndicating(questIndicatingId);
        const steps = Array.isArray(dto?.questStepDtos)
          ? [...dto.questStepDtos].sort((a, b) => a.sequence - b.sequence)
          : [];
        const fulls = await Promise.all(
          steps.map((s: any) => getQuestStep(s.questStepId)),
        );
        const nextPayloads: Record<string, QuestStepRequest> = {};
        const nextTimeline: TimelineAction[] = [];
        for (const full of fulls) {
          const key = String(full.questStepId);
          nextPayloads[key] = toUpdatablePayload(full);
          nextTimeline.push({
            id: key,
            type: (full.actionType as ActionType) ?? 'TALKING',
          });
        }
        setPayloadMap(nextPayloads);
        setDragData(nextTimeline);
        // 리스트가 비어있으면 시트 자동 오픈(UX)
        if (nextTimeline.length === 0)
          setTimeout(() => sheetRef.current?.open(), 0);
      } catch (e: any) {
        console.log('[ActionSetting init fetch error]', e?.message ?? e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [questIndicatingId]);

  const headerTitle = useMemo(() => spot?.name ?? '선택한 퀘스트', [spot]);

  /* ---------- 액션 추가 ---------- */
  const handleAdd = async (t: ActionType) => {
    if (!questIndicatingId) {
      Alert.alert(
        '안내',
        '이 위치에는 인디케이팅이 없어 액션을 추가할 수 없다',
      );
      return;
    }
    try {
      setBusy(true);
      const nextSeq = dragData.length + 1;
      const payload = buildMinimalPayload(t, {
        questIndicatingId,
        sequence: nextSeq,
        spot,
      });
      const res = (await createQuestSteps(payload)) as QuestStepResponse;
      const newId = String(res?.questStepId ?? Date.now());
      setPayloadMap(prev => ({...prev, [newId]: payload}));
      setDragData(prev => [...prev, {id: newId, type: t}]);
    } catch (e: any) {
      console.log('[createQuestSteps error]', e?.message ?? e);
      Alert.alert('오류', '액션 생성 중 문제가 발생했습니다');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- 순서 변경(유지) ---------- */
  const handleDragEnd = async (data: TimelineAction[]) => {
    const changed = data
      .map((it, idx) => ({id: it.id, newSeq: idx + 1}))
      .filter(ch => payloadMap[ch.id]?.sequence !== ch.newSeq);

    if (changed.length === 0) {
      setDragData(data);
      return;
    }

    try {
      setBusy(true);
      for (const ch of changed) {
        const base =
          payloadMap[ch.id] ||
          toUpdatablePayload(await getQuestStep(Number(ch.id)));
        const next: QuestStepRequest = {...base, sequence: ch.newSeq};
        await updateQuestStep(Number(ch.id), next);
        setPayloadMap(prev => ({...prev, [ch.id]: next}));
      }
      setDragData(data);
    } catch (e: any) {
      console.log('[reorder updateQuestStep error]', e?.message ?? e);
      Alert.alert('오류', '순서 변경 저장 중 문제가 발생했습니다');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- 삭제(유지) ---------- */
  const handleDelete = async (questStepId: string) => {
    try {
      setBusy(true);
      await deleteQuestStep(Number(questStepId));
      const remained = dragData.filter(d => d.id !== questStepId);

      // 재시퀀스 대상 계산
      const changed = remained
        .map((it, idx) => ({id: it.id, newSeq: idx + 1}))
        .filter(ch => payloadMap[ch.id]?.sequence !== ch.newSeq);

      for (const ch of changed) {
        const base =
          payloadMap[ch.id] ||
          toUpdatablePayload(await getQuestStep(Number(ch.id)));
        const next: QuestStepRequest = {...base, sequence: ch.newSeq};
        await updateQuestStep(Number(ch.id), next);
        setPayloadMap(prev => ({...prev, [ch.id]: next}));
      }

      setDragData(remained);
      setPayloadMap(prev => {
        const clone = {...prev};
        delete clone[questStepId];
        return clone;
      });

      // 전부 삭제되면 시트 자동 오픈
      if (remained.length === 0) setTimeout(() => sheetRef.current?.open(), 0);
    } catch (e: any) {
      console.log('[deleteQuestStep error]', e?.message ?? e);
      Alert.alert('오류', '액션 삭제 중 문제가 발생했습니다');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- 상세 설정으로 이동 ---------- */
  const goDetail = (item: TimelineAction, ordinal: number) => {
    const routeName = ACTION_ROUTE[item.type];
    if (!routeName) return;
    nav.navigate(routeName, {
      questIndicatingId,
      questStepId: item.id,
      actionType: item.type,
      ordinal,
      spot,
    });
  };

  // 동일 타입 내 순번 계산
  const getOrdinalForIndex = (idx: number) => {
    if (idx < 0) return 1;
    const me = dragData[idx];
    let count = 0;
    for (let i = 0; i <= idx; i++) if (dragData[i].type === me.type) count += 1;
    return count;
  };

  /* ---------- 아이템 렌더러 ---------- */
  const renderItem = useCallback(
    ({item, drag, isActive, getIndex}: RenderItemParams<TimelineAction>) => {
      const p = ACTION_PALETTE[item.type];
      const idx = getIndex?.() ?? -1;
      const next = idx >= 0 ? dragData[idx + 1] : undefined;
      const ordinal = getOrdinalForIndex(idx);

      return (
        <View style={{marginBottom: 0}}>
          <SwipeableItem
            key={item.id}
            item={item}
            renderUnderlayLeft={() => (
              <View style={styles.underlayLeft}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteTxt}>삭제</Text>
                </TouchableOpacity>
              </View>
            )}
            snapPointsLeft={[50]}
            overSwipe={28}
            activationThreshold={8}
            swipeDamping={0.6}
            swipeEnabled={!isActive}>
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              activeOpacity={0.9}
              onPress={() => goDetail(item, ordinal)}
              style={[
                styles.actionCard,
                {opacity: isActive ? 0.85 : 1, borderColor: p.bg},
              ]}>
              <View style={[styles.iconBox, {backgroundColor: p.bg}]}>
                <Icon name={p.icon} size={16} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>
                {p.label} {ordinal}
              </Text>
            </TouchableOpacity>
          </SwipeableItem>

          {next && (
            <View style={styles.separatorBox}>
              <GradientArrow
                startColor={ACTION_PALETTE[item.type].bg}
                endColor={ACTION_PALETTE[next.type].bg}
              />
            </View>
          )}
        </View>
      );
    },
    [dragData],
  );

  /* ---------- 화면 ---------- */
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.wrap}>
        {/* 헤더: 뒤로 + 타이틀 + 액션추가 버튼 */}
        <View style={styles.headerRow}>
          <View style={styles.backBtnField}>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Icon name="chevron-back" size={24} color={C.brown} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextField}>
            <Text
              style={styles.screenTitle}
              numberOfLines={1}
              ellipsizeMode="tail">
              {headerTitle}
            </Text>
            {!!spot?.address && (
              <Text style={styles.addr} numberOfLines={1} ellipsizeMode="tail">
                {spot.address}
              </Text>
            )}
          </View>
        </View>

        {/* 타임라인(드래그로 순서 변경) */}
        <DraggableFlatList
          contentContainerStyle={{paddingBottom: 140}}
          data={dragData}
          keyExtractor={it => String(it.id)}
          renderItem={renderItem}
          onDragEnd={({data}) => handleDragEnd(data)}
          ListEmptyComponent={
            <View style={{paddingVertical: 24, alignItems: 'center'}}>
              <Text style={styles.empty}>
                {'아래 시트를 위로 슬라이드 해서 액션을 추가해봐요!'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* 추가 시트(항상 핸들 노출) */}
        <Modalize
          ref={sheetRef}
          withHandle
          handlePosition="inside"
          handleStyle={{backgroundColor: '#646464'}}
          panGestureEnabled
          closeOnOverlayTap
          alwaysOpen={24}
          snapPoint={220}
          modalHeight={320}
          modalStyle={{backgroundColor: C.bg, paddingHorizontal: 16}}>
          <View style={{paddingTop: 20}}>
            <View style={{marginTop: 40}}>
              <Text style={styles.sectionTitle}>일반 액션</Text>
              <View style={styles.gridRow}>
                {(['TALKING', 'STAYING', 'WALKING'] as ActionType[]).map(t => {
                  const p = ACTION_PALETTE[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.actionBtn, {backgroundColor: p.bg}]}
                      onPress={() => handleAdd(t)}>
                      <Icon name={p.icon} size={16} color="#fff" />
                      <Text style={styles.actionBtnTxt}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{marginTop: 40}}>
              <Text style={styles.sectionTitle}>퍼즐 액션</Text>
              <View style={styles.gridRow}>
                {(
                  [
                    'PHOTO_PUZZLE',
                    'INPUT_PUZZLE',
                    'LOCATION_PUZZLE',
                  ] as ActionType[]
                ).map(t => {
                  const p = ACTION_PALETTE[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.actionBtn, {backgroundColor: p.bg}]}
                      onPress={() => handleAdd(t)}>
                      <Icon name={p.icon} size={16} color="#fff" />
                      <Text style={styles.actionBtnTxt}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modalize>
      </View>

      {/* 로딩 오버레이 */}
      {(initialLoading || busy) && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="small" color={C.brown} />
        </View>
      )}
    </SafeAreaView>
  );
}

/* -------------------- 스타일 -------------------- */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  wrap: {flex: 1, backgroundColor: C.bg, paddingTop: 20, paddingHorizontal: 20},

  headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  backBtnField: {paddingRight: 6, justifyContent: 'center'},
  headerTextField: {flex: 1},
  addBtn: {paddingLeft: 8, paddingVertical: 4},

  screenTitle: {color: C.brown, fontSize: 20, fontWeight: '800'},
  addr: {color: C.brown, opacity: 0.8, fontSize: 12, marginTop: 2},

  empty: {textAlign: 'center', color: C.brown, opacity: 0.6},

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3EEE8',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionLabel: {color: C.brown, fontWeight: '800', fontSize: 14},

  sectionTitle: {color: C.brown, fontWeight: '800', marginBottom: 8},
  gridRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 20},
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnTxt: {color: '#fff', fontWeight: '800', marginLeft: 6},

  underlayLeft: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 19,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteBtn: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  deleteTxt: {color: '#C94C4C', fontWeight: '800'},

  separatorBox: {alignItems: 'center', marginVertical: 8},

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,233,225,0.6)',
  },
});
