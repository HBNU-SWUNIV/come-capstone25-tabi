// src/screens/Quest/SetPhotoPuzzleScreen.tsx
import React, {useEffect, useMemo, useState} from 'react';
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
  ActivityIndicator,
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
  questIndicatingId: number | null;
  questStepId: string | number;
  actionType: ActionType;
  ordinal: number;
};

const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  chipText: '#FFFFFF',
  keywordBg: '#8F7B70',
  keywordPlaceholder: '#B6B3B3',
  keywordRemove: '#767373',
  hint1: '#C0AD58',
  hint2: '#98982C',
  hint3: '#478C77',
};

const TAB_W = 28;
const GAP = 8;
const DROP = 4;
const TABS_OFFSET = 10;
const LINK_W = 28;
const LINK_H = 10;
const LINK_OVERLAP = 4;

/** 힌트 탭 컴포넌트 (스타일/문구 변경 금지) */
function HintTab({
  index,
  label,
  color,
  activeIdxSV,
  onPress,
}: {
  index: number;
  label: string;
  color: string;
  activeIdxSV: Animated.SharedValue<number>;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const to = activeIdxSV.value === index ? DROP : 0;
    return {
      transform: [
        {
          translateY: withTiming(to, {
            duration: 200,
            easing: Easing.out(Easing.quad),
          }),
        },
      ],
      opacity: withTiming(activeIdxSV.value === index ? 1 : 0.7, {
        duration: 200,
      }),
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

export default function SetPhotoPuzzleScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {questIndicatingId, questStepId, actionType, ordinal} =
    route.params as RouteParams;

  // 공통 로더 훅: 로딩 → 프리필 → 저장
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
    keywords: string[];
    hintOne: string | null;
    hintTwo: string | null;
    hintThree: string | null;
    characterImageUrl: string;
  }>({
    questStepId,
    defaults: {
      keywords: [],
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

      const fromDtos = Array.isArray(dto.photoKeywordDtos)
        ? dto.photoKeywordDtos
            .map((k: any) => String(k?.keyword ?? '').trim())
            .filter(Boolean)
        : [];
      return {
        keywords: fromDtos,
        hintOne: hintDto.hintOne ?? '',
        hintTwo: hintDto.hintTwo ?? '',
        hintThree: hintDto.hintThree ?? '',
        characterImageUrl: dto.characterImageUrl ?? '',
      };
    },
  });

  // 화면 로컬 상태(입력 중 임시 값 유지)
  const [kwInput, setKwInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [hints, setHints] = useState<string[]>(['', '', '']);

  // 프리필 → 로컬 반영
  useEffect(() => {
    setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
  }, [data.keywords]);

  // ✅ 힌트 바인딩 보강
  useEffect(() => {
    setHints([
      String(data.hintOne ?? ''),
      String(data.hintTwo ?? ''),
      String(data.hintThree ?? ''),
    ]);
  }, [data.hintOne, data.hintTwo, data.hintThree]);

  // 힌트 탭
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
    setHints(prev => {
      const cp = [...prev];
      cp[activeIdx] = t;
      return cp;
    });
    const key =
      activeIdx === 0 ? 'hintOne' : activeIdx === 1 ? 'hintTwo' : 'hintThree';
    setData(prev => ({...prev, [key]: t}));
  };

  // 키워드 추가/삭제
  const addKeyword = () => {
    const v = kwInput.trim();
    if (!v) return;
    if (keywords.includes(v)) {
      setKwInput('');
      return;
    }
    const next = [...keywords, v];
    setKeywords(next);
    setData(prev => ({...prev, keywords: next}));
    setKwInput('');
  };
  const removeKeyword = (v: string) => {
    const next = keywords.filter(k => k !== v);
    setKeywords(next);
    setData(prev => ({...prev, keywords: next}));
  };

  const previewSource = useMemo(
    () => resolveCharacterSource(characterImageUrl),
    [characterImageUrl],
  );

  const titleLabel = `${ACTION_PALETTE[actionType].label} ${ordinal}`;
  const guide = `사진 퍼즐은 사진에 들어가야 할 특징이나, 요소를 설정하고\n퀘스트 실행자는 설정한 특징, 요소가 들어 있는 사진을 업로드 해야해요!`;

  const openCharacterPicker = () => {
    nav.navigate('CharacterSelect', {
      onPick: (payload: {imageUrl: string; name?: string}) => {
        if (payload?.imageUrl) setCharacterImageUrl(payload.imageUrl);
      },
    });
  };

  const canSave =
    !!characterImageUrl &&
    keywords.length > 0 &&
    !saving &&
    !!questIndicatingId;

  const onSave = async () => {
    if (!questIndicatingId) {
      Alert.alert('오류', 'questIndicatingId가 없습니다');
      return;
    }
    if (!characterImageUrl) {
      Alert.alert('안내', '캐릭터 이미지를 선택해주세요');
      return;
    }

    const payload: QuestStepRequest = {
      questIndicatingId,
      sequence: sequence || 1,
      actionType: 'PHOTO_PUZZLE',
      characterImageUrl,
      photoKeywordRequests: keywords.map(k => ({keyword: k})),
      hintOne: hints[0] || null,
      hintTwo: hints[1] || null,
      hintThree: hints[2] || null,
    };

    await handleSave(payload, {
      onSuccess: () =>
        Alert.alert('완료', '사진 퍼즐을 저장했다.', [
          {text: '확인', onPress: () => nav.goBack()},
        ]),
      onError: () => Alert.alert('오류', '저장 중 문제가 발생했습니다'),
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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safe, {alignItems: 'center', justifyContent: 'center'}]}>
        <ActivityIndicator color={C.brown} />
        <Text style={{marginTop: 8, color: C.brown, opacity: 0.8}}>
          불러오는 중…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.select({ios: 'padding', android: undefined})}>
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
              {!previewSource ? (
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
                  <Image source={previewSource} style={styles.charAvatar} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>키워드 설정</Text>

            <View style={styles.keywordInputRow}>
              <TouchableOpacity
                onPress={addKeyword}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Icon name="add-circle" size={20} color="#EDEDED" />
              </TouchableOpacity>

              <TextInput
                value={kwInput}
                onChangeText={setKwInput}
                placeholder="키워드를 입력해주세요"
                placeholderTextColor={C.keywordPlaceholder}
                style={styles.keywordInput}
                onSubmitEditing={addKeyword}
                returnKeyType="done"
              />

              {kwInput.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setKwInput('')}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <View style={styles.clearPill}>
                    <Icon name="close" size={14} color={C.chipText} />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={{width: 16}} />
              )}
            </View>

            <View style={styles.keywordChips}>
              {keywords.map(k => (
                <View key={k} style={styles.chip}>
                  <Text style={styles.chipTxt}>{k}</Text>
                  <TouchableOpacity
                    onPress={() => removeKeyword(k)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

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
                        label={String(i + 1)}
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
  keywordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.keywordBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  keywordInput: {
    flex: 1,
    marginHorizontal: 8,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  clearPill: {borderRadius: 100, padding: 1, backgroundColor: C.keywordRemove},
  keywordChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.keywordBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  chipTxt: {color: C.chipText, fontWeight: '400', fontSize: 12},
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
