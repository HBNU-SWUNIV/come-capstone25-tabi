// src/screens/Quest/SetStepsScreen.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {ACTION_PALETTE} from './ActionSettingScreen';
import {ActionType} from '../../../context/ActionTimelineStore';
import {resolveCharacterSource, useQuestStepLoader} from './_shared';
import {
  type QuestStepRequest,
  type QuestStepResponse,
} from '../../../api/questCreation';
import Wheel from './_Wheel';

type RouteParams = {
  spotId: string;
  questStepId: string | number;
  actionType: ActionType;
  ordinal: number;
};

const C = {bg: '#ECE9E1', brown: '#61402D', line: '#8F7B70'};

export default function SetStepsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {spotId, questStepId, actionType, ordinal} =
    route.params as RouteParams;

  // 공통 로더 훅
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
    walkingCount: number;
    characterImageUrl: string;
  }>({
    questStepId,
    defaults: {walkingCount: 0, characterImageUrl: ''},
    mapFromResponse: (full: QuestStepResponse) => {
      const dto = (full as any)?.actionDto ?? {};
      const wc =
        typeof dto.walkingCount === 'number'
          ? dto.walkingCount
          : (full as any)?.walkingCount ?? 0;
      return {
        walkingCount: wc,
        characterImageUrl: dto.characterImageUrl ?? '',
      };
    },
  });

  const [thousand, setThousand] = useState(0);
  const [hundred, setHundred] = useState(0);
  const [steps, setSteps] = useState(0); // 0,10,20,...,90

  // 프리필: 서버의 walkingCount → 천/백/십 자리로 분해
  useEffect(() => {
    const wc = Number((data as any)?.walkingCount ?? 0);
    const thous = Math.floor(wc / 1000) % 10;
    const hund = Math.floor((wc % 1000) / 100) % 10;
    const tens = Math.floor((wc % 100) / 10) * 10;
    setThousand(thous);
    setHundred(hund);
    setSteps(tens);
  }, [data?.walkingCount]);

  const thousands = useMemo(() => Array.from({length: 10}, (_, i) => i), []);
  const hundreds = useMemo(() => Array.from({length: 10}, (_, i) => i), []);
  const tensSteps = useMemo(
    () => Array.from({length: 10}, (_, i) => i * 10),
    [],
  );

  const total = thousand * 1000 + hundred * 100 + steps;

  const titleLabel = `${ACTION_PALETTE[actionType].label} ${ordinal}`;
  const guide = `도보수는 지정된 퀘스트 스팟에서 설정한 도보수를 채워야 해요\n설정된 도보수가 단위별로 합산되어 계산되니 주의하세요!`;

  const preview = useMemo(
    () => resolveCharacterSource(characterImageUrl),
    [characterImageUrl],
  );

  const canSave = characterImageUrl.trim().length > 0 && total > 0 && !saving;

  const openCharacterPicker = () => {
    nav.navigate('CharacterSelect', {
      onPick: (payload: {imageUrl: string; name?: string}) => {
        if (payload?.imageUrl) setCharacterImageUrl(payload.imageUrl);
      },
    });
  };

  const onSave = async () => {
    if (!canSave) return;
    const payload: QuestStepRequest = {
      questIndicatingId: Number(spotId),
      sequence: sequence || 1,
      actionType: 'WALKING',
      characterImageUrl,
      walkingCount: total,
    };
    await handleSave(payload, {
      onSuccess: () =>
        Alert.alert('저장 성공', '이전 화면으로 돌아갈게요', [
          {text: '확인', onPress: () => nav.goBack()},
        ]),
      onError: () => Alert.alert('오류', '저장 중 문제가 발생했습니다'),
    });
  };

  return (
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
            {!preview ? (
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
                onPress={openCharacterPicker}>
                <Image source={preview} style={styles.charAvatar} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{marginTop: 18}}>
            <Text style={styles.sectionTitle}>목표 도보수</Text>

            <View style={styles.wheelsRow} pointerEvents="box-none">
              <View style={styles.wheelCol}>
                {/* Wheel 컴포넌트는 기존 그대로 사용 */}
                {/* @ts-ignore: 외부 컴포넌트 타입 불명확성 무시 */}
                <Wheel
                  data={thousands}
                  value={thousand}
                  onChange={setThousand}
                  label="thous"
                  lineColor={C.line}
                  activeColor={C.brown}
                  color="#A58E81"
                  rows={3}
                />
              </View>
              <View style={styles.wheelCol}>
                {/* @ts-ignore */}
                <Wheel
                  data={hundreds}
                  value={hundred}
                  onChange={setHundred}
                  label="hund"
                  lineColor={C.line}
                  activeColor={C.brown}
                  color="#A58E81"
                  rows={3}
                />
              </View>
              <View style={styles.wheelCol}>
                {/* @ts-ignore */}
                <Wheel
                  data={tensSteps}
                  value={steps}
                  onChange={setSteps}
                  label="Steps"
                  lineColor={C.line}
                  activeColor={C.brown}
                  color="#A58E81"
                  rows={3}
                />
              </View>
            </View>

            {/* <View style={{alignItems: 'center', marginTop: 10}}>
              <Text style={{color: C.brown}}>
                총합: <Text style={{fontWeight: '800'}}>{total}</Text> 보
              </Text>
            </View> */}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onSave}
            activeOpacity={0.9}
            disabled={!canSave}
            style={[
              styles.saveBtn,
              {backgroundColor: canSave ? C.brown : '#BFB7B2'},
            ]}>
            <Text style={styles.saveTxt}>{'저장'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 스타일/문구 변경 금지
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
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: {color: '#EDEDED', fontWeight: '800', marginTop: 8},
  charCard: {alignItems: 'center'},
  charAvatar: {width: 260, height: 260, borderRadius: 130},
  sectionTitle: {color: C.brown, fontWeight: '800', fontSize: 18, marginTop: 6},
  wheelsRow: {marginTop: 8, flexDirection: 'row', justifyContent: 'center'},
  wheelCol: {width: '31%'},
  footer: {paddingHorizontal: 20, paddingBottom: 10, paddingTop: 8},
  saveBtn: {borderRadius: 16, paddingVertical: 18, alignItems: 'center'},
  saveTxt: {color: '#fff', fontWeight: '800', fontSize: 18},
});
