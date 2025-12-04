// src/screens/Quest/SetDialogScreen.tsx
import React from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {ACTION_PALETTE} from './ActionSettingScreen';
import {ActionType} from '../../../context/ActionTimelineStore';
import {resolveCharacterSource, useQuestStepLoader} from './_shared';

// API 타입
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

const MAX_LEN = 250;
const C = {bg: '#ECE9E1', brown: '#61402D'};

export default function SetDialogScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {questIndicatingId, questStepId, actionType, ordinal} =
    route.params as RouteParams;

  /* --------------------------------------------------------------------------
   * 한국어 주석
   * - 로더 훅이 서버에서 값을 불러오고(data), 저장(handleSave)까지 담당
   * - 텍스트 입력값은 별도 로컬 상태를 쓰지 않고 data.story를 단일 소스로 사용
   *   → 서버 프리필 값이 즉시 바인딩됨
   * ------------------------------------------------------------------------ */
  const {
    loading,
    saving,
    sequence,
    setData,
    characterImageUrl,
    setCharacterImageUrl,
    handleSave,
    data,
  } = useQuestStepLoader<{story: string; characterImageUrl: string}>({
    questStepId,
    defaults: {story: '', characterImageUrl: ''},
    mapFromResponse: (full: QuestStepResponse) => ({
      // ⚠️ 서버 스키마에 따라 story 위치가 다르면 여기만 조정하면 됨
      story: (full as any)?.story ?? (full as any)?.actionDto?.story ?? '',
      characterImageUrl: (full as any)?.actionDto?.characterImageUrl ?? '',
    }),
  });

  const previewSource = React.useMemo(
    () => resolveCharacterSource(characterImageUrl),
    [characterImageUrl],
  );

  const titleLabel = `${ACTION_PALETTE[actionType].label} ${ordinal}`;
  const guide = `대화는 퀘스트의 흐름을 이어갈 중요한 역할을 해요\n퀘스트를 자연스럽게 이어갈 수 있도록 스토리를 만들어주세요!`;

  const openCharacterPicker = () => {
    nav.navigate('CharacterSelect', {
      onPick: (payload: {imageUrl: string; name?: string}) => {
        if (payload?.imageUrl) setCharacterImageUrl(payload.imageUrl);
      },
    });
  };

  const onChangeText = (v: string) => {
    // 한국어 주석: 길이 제한 및 단일 소스 업데이트
    const next = v.slice(0, MAX_LEN);
    setData(prev => ({...prev, story: next}));
  };

  const onSave = async () => {
    if (!questIndicatingId) {
      Alert.alert('오류', 'questIndicatingId가 없습니다');
      return;
    }
    if (!characterImageUrl) {
      Alert.alert('안내', '캐릭터 이미지를 선택해주세요');
      return;
    }
    const trimmed = (data.story ?? '').trim();
    if (trimmed.length === 0) {
      Alert.alert('안내', '대화 내용을 입력해주세요');
      return;
    }

    const payload: QuestStepRequest = {
      questIndicatingId,
      sequence: sequence || 1,
      actionType: 'TALKING',
      characterImageUrl,
      story: trimmed,
    };

    await handleSave(payload, {
      onSuccess: () =>
        Alert.alert('저장 성공', '이전 화면으로 돌아갈게요', [
          {text: '확인', onPress: () => nav.goBack()},
        ]),
      onError: () => Alert.alert('오류', '저장 중 문제가 발생했습니다'),
    });
  };

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

  const story = data.story ?? '';
  const saveDisabled =
    saving ||
    !questIndicatingId ||
    !characterImageUrl ||
    story.trim().length === 0;

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

          <View style={styles.body}>
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
                  activeOpacity={0.9}
                  onPress={openCharacterPicker}>
                  <Image source={previewSource} style={styles.charAvatar} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputArea}>
              <View style={styles.inputCard}>
                <View style={{flex: 1, position: 'relative'}}>
                  {story.length === 0 && (
                    <View style={styles.centerPlaceholder}>
                      <Text style={styles.placeholderText}>
                        퀘스트 스토리에 맞는 내용을 입력해주세요!
                      </Text>
                    </View>
                  )}
                  <TextInput
                    value={story}
                    onChangeText={onChangeText}
                    maxLength={MAX_LEN}
                    multiline
                    textAlignVertical="top"
                    style={styles.textArea}
                  />
                  {story.length > 0 && (
                    <Text style={styles.counter}>
                      {story.length}/{MAX_LEN}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onSave}
              disabled={saveDisabled}
              activeOpacity={0.9}
              style={[
                styles.saveBtn,
                {backgroundColor: saveDisabled ? '#BFB7B2' : C.brown},
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
  body: {flex: 1, paddingHorizontal: 20},
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
  inputArea: {flex: 1, zIndex: 2, transform: [{translateY: -40}]},
  inputCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: C.brown,
    paddingHorizontal: 20,
    paddingTop: 18,
    textAlign: 'left',
  },
  centerPlaceholder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {textAlign: 'center', color: '#767575'},
  counter: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    fontSize: 12,
    color: '#8A7F79',
  },
  footer: {paddingHorizontal: 20, paddingBottom: 10},
  saveBtn: {borderRadius: 12, paddingVertical: 16, alignItems: 'center'},
  saveTxt: {color: '#fff', fontWeight: '800', fontSize: 16},
});
