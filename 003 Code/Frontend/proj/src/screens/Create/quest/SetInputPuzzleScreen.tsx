// src/screens/Quest/SetInputPuzzleScreen.tsx
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

const DUMMY = 'dummy';

type RouteParams = {
  questIndicatingId: number | null;
  questStepId: string | number;
  actionType: ActionType;
  ordinal: number;
};

const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  hint1: '#C0AD58',
  hint2: '#98982C',
  hint3: '#478C77',
  keywordBg: '#8F7B70',
  keywordPlaceholder: '#B6B3B3',
};

const TAB_W = 28;
const GAP = 8;
const DROP = 4;
const LINK_W = 28;
const LINK_H = 10;
const LINK_OVERLAP = 4;
const TABS_OFFSET = 10;

function HintTab({index, label, color, activeIdxSV, onPress}: any) {
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
  });
  return (
    <Animated.View style={[styles.hintTabWrap, style]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.hintTab, {backgroundColor: color}]}>
        <Text style={styles.hintTabTxt}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SetInputPuzzleScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {questIndicatingId, questStepId, actionType, ordinal} =
    route.params as RouteParams;

  const {
    loading,
    saving,
    sequence,
    setData,
    data,
    characterImageUrl,
    setCharacterImageUrl,
    handleSave,
  } = useQuestStepLoader<{
    answerString: string;
    hintOne: string | null;
    hintTwo: string | null;
    hintThree: string | null;
    characterImageUrl: string;
  }>({
    questStepId,
    defaults: {
      answerString: '',
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
        answerString: dto.answerString ?? '',
        hintOne: hintDto.hintOne ?? '',
        hintTwo: hintDto.hintTwo ?? '',
        hintThree: hintDto.hintThree ?? '',
        characterImageUrl: dto.characterImageUrl ?? '',
      };
    },
  });

  const [answer, setAnswer] = useState('');
  const [hints, setHints] = useState(['', '', '']);

  // 서버 값 → 로컬 answer 반영
  useEffect(() => {
    setAnswer(data.answerString ?? '');
  }, [data.answerString]);

  // 서버 값 → 로컬 hints 반영
  useEffect(() => {
    setHints([data.hintOne ?? '', data.hintTwo ?? '', data.hintThree ?? '']);
  }, [data.hintOne, data.hintTwo, data.hintThree]);

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
    setHints(p => {
      const c = [...p];
      c[activeIdx] = t;
      return c;
    });
    const key =
      activeIdx === 0 ? 'hintOne' : activeIdx === 1 ? 'hintTwo' : 'hintThree';
    setData(prev => ({...prev, [key]: t}));
  };

  const previewSource = useMemo(
    () => resolveCharacterSource(characterImageUrl),
    [characterImageUrl],
  );
  const titleLabel = `${ACTION_PALETTE[actionType].label} ${ordinal}`;
  const guide = `입력 퍼즐은 퀘스트 실행 위치를 바탕으로\n추측할 수 있는문장이나 단어를 넣어 주세요!`;

  const openCharacterPicker = () => {
    nav.navigate('CharacterSelect', {
      onPick: (p: {imageUrl: string}) =>
        p?.imageUrl && setCharacterImageUrl(p.imageUrl),
    });
  };

  const canSave = answer.trim().length > 0;
  const onSave = async () => {
    if (!questIndicatingId)
      return Alert.alert('오류', 'questIndicatingId가 없다.');
    if (!characterImageUrl)
      return Alert.alert('안내', '캐릭터 이미지를 선택한다.');
    if (answer.trim().length === 0)
      return Alert.alert('안내', '정답을 입력한다.');

    const payload: QuestStepRequest = {
      questIndicatingId,
      sequence: sequence || 1,
      actionType: 'INPUT_PUZZLE',
      characterImageUrl,
      answerString: answer.trim() || DUMMY,
      hintOne: hints[0] || null,
      hintTwo: hints[1] || null,
      hintThree: hints[2] || null,
    };

    await handleSave(payload, {
      onSuccess: () =>
        Alert.alert('저장 성공', '이전 화면으로 돌아갈게요', [
          {text: '확인', onPress: () => nav.goBack()},
        ]),
      onError: () =>
        Alert.alert('[SetInputPuzzleScreen]', '저장 중 문제가 발생했습니다'),
    });
  };

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeIdxSV.value,
      [0, 1, 2],
      [C.hint1, C.hint2, C.hint3],
    ),
  }));
  const linkerStyle = useAnimatedStyle(() => {
    const tx = withTiming(activeIdxSV.value * (TAB_W + GAP), {
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
    };
  });

  if (loading)
    return (
      <SafeAreaView
        style={[styles.safe, {alignItems: 'center', justifyContent: 'center'}]}>
        <ActivityIndicator color={C.brown} />
        <Text style={{marginTop: 8, color: C.brown, opacity: 0.8}}>
          불러오는 중…
        </Text>
      </SafeAreaView>
    );

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
                  activeOpacity={0.9}
                  onPress={openCharacterPicker}
                  style={styles.charCard}>
                  <Image source={previewSource} style={styles.charAvatar} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>정답 설정</Text>
            <View style={styles.answerBox}>
              <TextInput
                value={answer}
                onChangeText={v => {
                  setAnswer(v);
                  setData(p => ({...p, answerString: v}));
                }}
                placeholder="정답을 입력해주세요"
                placeholderTextColor={C.keywordPlaceholder}
                style={styles.answerInput}
                multiline
              />
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
              disabled={!canSave || saving || !characterImageUrl}
              activeOpacity={0.9}
              style={[
                styles.saveBtn,
                {backgroundColor: !canSave || saving ? '#BFB7B2' : C.brown},
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
  answerBox: {
    backgroundColor: C.keywordBg,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  answerInput: {color: '#FFFFFF', minHeight: 80, fontSize: 14},
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
