// src/screens/Quest/SetLocationPuzzleScreen.tsx
import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  withTiming,
  interpolateColor,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import {ACTION_PALETTE} from './ActionSettingScreen';
import {ActionType} from '../../../context/ActionTimelineStore';
import {resolveCharacterSource, useQuestStepLoader} from './_shared';
import {
  type QuestStepRequest,
  type QuestStepResponse,
} from '../../../api/questCreation';

type RouteParams = {
  spotId: string;
  questStepId: string | number;
  actionType: ActionType;
  ordinal: number;
};

type Place = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  hint1: '#C0AD58',
  hint2: '#98982C',
  hint3: '#478C77',
  keywordBg: '#8F7B70',
};

const TAB_W = 28;
const GAP = 8;
const DROP = 4;
const TABS_OFFSET = 10;
const LINK_W = 28;
const LINK_H = 10;
const LINK_OVERLAP = 4;

/** 힌트 탭 (스타일/문구 유지) */
function HintTab({
  index,
  label,
  color,
  activeIdxSV,
  onPress,
  duration = 200,
}: {
  index: number;
  label: string;
  color: string;
  activeIdxSV: Animated.SharedValue<number>;
  onPress: () => void;
  duration?: number;
}) {
  const style = useAnimatedStyle(() => {
    const to = activeIdxSV.value === index ? DROP : 0;
    return {
      transform: [
        {
          translateY: withTiming(to, {
            duration,
            easing: Easing.out(Easing.quad),
          }),
        },
      ],
      opacity: withTiming(activeIdxSV.value === index ? 1 : 0.7, {duration}),
      zIndex: 3,
    };
  }, []);
  return (
    <Animated.View style={[styles.hintTabWrap, style]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        style={[styles.hintTab, {backgroundColor: color}]}>
        <Text style={styles.hintTabTxt}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SetLocationPuzzleScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {spotId, questStepId, actionType, ordinal} =
    route.params as RouteParams;

  // 공통 로더 훅 적용
  const {
    loading,
    saving,
    sequence,
    setSequence,
    data,
    setData,
    characterImageUrl,
    setCharacterImageUrl,
    handleSave,
  } = useQuestStepLoader<{
    locationName: string;
    actualLocation: string;
    latitude: number;
    longitude: number;
    altitude: number;
    hintOne: string | null;
    hintTwo: string | null;
    hintThree: string | null;
    characterImageUrl: string;
  }>({
    questStepId,
    defaults: {
      locationName: '',
      actualLocation: '',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      hintOne: '',
      hintTwo: '',
      hintThree: '',
      characterImageUrl: '',
    },
    mapFromResponse: (full: QuestStepResponse) => {
      const dto = (full as any)?.actionDto ?? {};
      const hintDto = dto.hintDto ?? {};

      console.log('[DEBUG] 서버 응답 전체:', full);
      console.log('[DEBUG] actionDto:', dto);
      console.log('[DEBUG] 힌트 값:', {
        hintOne: hintDto.hintOne,
        hintTwo: hintDto.hintTwo,
        hintThree: hintDto.hintThree,
      });

      return {
        locationName: dto.locationName ?? '',
        actualLocation: dto.actualLocation ?? '',
        latitude:
          typeof dto.latitude === 'number'
            ? dto.latitude
            : (full as any)?.latitude ?? 0,
        longitude:
          typeof dto.longitude === 'number'
            ? dto.longitude
            : (full as any)?.longitude ?? 0,
        altitude:
          typeof dto.altitude === 'number'
            ? dto.altitude
            : (full as any)?.altitude ?? 0,
        hintOne: hintDto.hintOne ?? '',
        hintTwo: hintDto.hintTwo ?? '',
        hintThree: hintDto.hintThree ?? '',
        characterImageUrl: dto.characterImageUrl ?? '',
      };
    },
  });

  const [place, setPlace] = useState<Place | null>(null);

  // ✅ 로컬 hints 상태 + 서버 값 바인딩
  const [hints, setHints] = useState<string[]>(['', '', '']);
  useEffect(() => {
    setHints([
      String(data.hintOne ?? ''),
      String(data.hintTwo ?? ''),
      String(data.hintThree ?? ''),
    ]);
  }, [data.hintOne, data.hintTwo, data.hintThree]);

  // 프리필 → place 미니 상태 동기화
  useEffect(() => {
    if (data.locationName || data.actualLocation) {
      setPlace({
        id: String(Date.now()),
        name: data.locationName,
        address: data.actualLocation,
        lat: Number(data.latitude || 0),
        lng: Number(data.longitude || 0),
      });
    }
  }, [data.locationName, data.actualLocation, data.latitude, data.longitude]);

  const goSearch = () => {
    nav.navigate('SearchLocation', {
      onPick: (p: any) => {
        if (!p) return;
        const picked: Place = {
          id: p.id ?? p.place_id ?? String(Date.now()),
          name: p.name,
          address: p.address,
          lat: p.lat,
          lng: p.lng,
        };
        setPlace(picked);
        setData(prev => ({
          ...prev,
          locationName: picked.name,
          actualLocation: picked.address,
          latitude: picked.lat,
          longitude: picked.lng,
        }));
      },
    });
  };

  // 힌트
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxSV = useSharedValue(0);
  const onSelectHint = (i: number) => {
    setActiveIdx(i);
    activeIdxSV.value = withTiming(i, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };
  const onChangeHint = (t: string) => {
    // 로컬 + 공통 데이터 동기화
    setHints(prev => {
      const cp = [...prev];
      cp[activeIdx] = t;
      return cp;
    });
    const key =
      activeIdx === 0 ? 'hintOne' : activeIdx === 1 ? 'hintTwo' : 'hintThree';
    setData(prev => ({...prev, [key]: t}));
  };

  const previewImage = useMemo(
    () => resolveCharacterSource(characterImageUrl),
    [characterImageUrl],
  );

  const titleLabel = `${ACTION_PALETTE[actionType].label} ${ordinal}`;
  const guide = `위치 퍼즐은 퀘스트 실행자가 대화를 통해 추측해서\n설정한 위치로 이동해야 하는 퍼즐이에요!`;

  const openCharacterPicker = () => {
    nav.navigate('CharacterSelect', {
      onPick: (payload: {imageUrl: string; name?: string}) => {
        if (payload?.imageUrl) setCharacterImageUrl(payload.imageUrl);
      },
    });
  };

  const canSave = !!characterImageUrl && !!place && !saving;

  const onSave = async () => {
    if (!characterImageUrl) return;
    if (!place) return;

    const payload: QuestStepRequest = {
      questIndicatingId: Number(spotId),
      sequence: sequence || 1,
      actionType: 'LOCATION_PUZZLE',
      characterImageUrl,
      locationName: data.locationName || place.name,
      actualLocation: data.actualLocation || place.address,
      latitude: typeof data.latitude === 'number' ? data.latitude : place.lat,
      longitude:
        typeof data.longitude === 'number' ? data.longitude : place.lng,
      altitude: typeof data.altitude === 'number' ? data.altitude : 0,
      hintOne: (data as any).hintOne ? String((data as any).hintOne) : null,
      hintTwo: (data as any).hintTwo ? String((data as any).hintTwo) : null,
      hintThree: (data as any).hintThree
        ? String((data as any).hintThree)
        : null,
    };

    await handleSave(payload, {
      onSuccess: () => nav.goBack(),
      onError: () => Alert.alert('오류', '저장 중 문제가 발생했다.'),
    });
  };

  const cardStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        activeIdxSV.value,
        [0, 1, 2],
        [C.hint1, C.hint2, C.hint3],
      ),
      zIndex: 2,
    }),
    [],
  );
  const linkerStyle = useAnimatedStyle(() => {
    const step = TAB_W + GAP;
    const tx = withTiming(activeIdxSV.value * step, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    return {
      transform: [{translateX: tx}],
      backgroundColor: interpolateColor(
        activeIdxSV.value,
        [0, 1, 2],
        [C.hint1, C.hint2, C.hint3],
      ),
      zIndex: 1,
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.select({ios: 'padding'})}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => nav.goBack()}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon name="chevron-back" size={24} color={C.brown} />
            </TouchableOpacity>
            <View style={{marginLeft: 6}}>
              <Text style={styles.title}>{titleLabel}</Text>
              <Text style={styles.subtitle}>{guide}</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            <View style={styles.circleWrap}>
              {!previewImage ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={openCharacterPicker}>
                  <LinearGradient
                    colors={['#E6E68C', '#76A86A', '#69739B']}
                    start={{x: 0.5, y: 0}}
                    end={{x: 0.5, y: 1}}
                    style={styles.circleBtn}>
                    <Icon name="add-circle" size={24} color="#EDEDED" />
                    <Text style={styles.circleLabel}>캐릭터 추가</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.charCard}
                  onPress={openCharacterPicker}
                  activeOpacity={0.9}>
                  <Image source={previewImage} style={styles.charAvatar} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>위치 설정</Text>
            <TouchableOpacity
              style={styles.searchBtnLike}
              onPress={goSearch}
              activeOpacity={0.9}>
              <Icon
                name="search"
                size={16}
                color="#fff"
                style={{marginRight: 8}}
              />
              <Text style={styles.searchBtnLikeText}>위치를 검색해주세요</Text>
              {place ? (
                <TouchableOpacity
                  onPress={() => setPlace(null)}
                  hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                  <Icon name="close" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>

            {place && (
              <View style={styles.selectedRow}>
                <Icon
                  name="arrow-forward"
                  size={16}
                  color={C.brown}
                  style={{marginRight: 8}}
                />
                <View style={{flex: 1}}>
                  <Text style={styles.selectedName} numberOfLines={2}>
                    {place.name}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, {marginTop: 36}]}>
              힌트 설정
            </Text>
            <View style={styles.hintSection}>
              <View style={styles.hintTabsHolder}>
                <View style={styles.hintTabsRow}>
                  {[C.hint1, C.hint2, C.hint3].map((color, i) => (
                    <React.Fragment key={i}>
                      <HintTab
                        index={i}
                        label={(i + 1).toString()}
                        color={color}
                        activeIdxSV={activeIdxSV}
                        onPress={() => onSelectHint(i)}
                      />
                      {i < 2 && <View style={{width: GAP}} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.linker,
                  {
                    left: TABS_OFFSET + (TAB_W - LINK_W) / 2,
                    top: TAB_W + DROP + LINK_OVERLAP - 6,
                  },
                  linkerStyle,
                ]}
              />

              <Animated.View style={[styles.hintCard, cardStyle]}>
                <TextInput
                  value={hints[activeIdx]}
                  onChangeText={onChangeHint}
                  multiline
                  textAlignVertical="top"
                  placeholder={
                    activeIdx === 0
                      ? '아주 약간의 힌트를 입력해주세요!'
                      : activeIdx === 1
                      ? '어느정도 추측할 수 있는 힌트를 입력해주세요!'
                      : '결정적인 힌트를 입력해주세요!'
                  }
                  placeholderTextColor="#6C6C6C"
                  style={styles.hintInput}
                />
              </Animated.View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onSave}
              disabled={!canSave}
              activeOpacity={0.9}
              style={[
                styles.saveBtn,
                {backgroundColor: canSave ? C.brown : '#BFB7B2'},
              ]}>
              <Text style={styles.saveTxt}>{saving ? '저장 중…' : '저장'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {color: C.brown, fontSize: 20, fontWeight: '800'},
  subtitle: {
    color: C.brown,
    opacity: 0.7,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  scroll: {paddingHorizontal: 20, paddingBottom: 24},
  circleWrap: {alignItems: 'center', marginTop: 18, zIndex: 1},
  circleBtn: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: {color: '#EDEDED', fontWeight: '800', marginTop: 8},
  charCard: {alignItems: 'center'},
  charAvatar: {width: 240, height: 240, borderRadius: 120},
  sectionTitle: {
    color: C.brown,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  searchBtnLike: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8F7B70',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchBtnLikeText: {color: '#B6B3B3', flex: 1},
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingLeft: 4,
  },
  selectedName: {color: C.brown, fontSize: 16, fontWeight: '500'},
  hintSection: {position: 'relative'},
  hintTabsHolder: {
    height: TAB_W + DROP,
    marginTop: 4,
    paddingLeft: TABS_OFFSET,
  },
  hintTabsRow: {flexDirection: 'row', alignItems: 'flex-start', height: TAB_W},
  hintTabWrap: {width: TAB_W, height: TAB_W},
  hintTab: {
    width: TAB_W,
    height: TAB_W,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTabTxt: {color: '#fff', fontWeight: '800', fontSize: 12},
  linker: {
    position: 'absolute',
    width: LINK_W,
    height: LINK_H,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  hintCard: {marginTop: 0, borderRadius: 12, padding: 12},
  hintInput: {
    minHeight: 110,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    color: '#2b2b2b',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  saveBtn: {borderRadius: 12, paddingVertical: 16, alignItems: 'center'},
  saveTxt: {color: '#fff', fontWeight: '800', fontSize: 16},
});
