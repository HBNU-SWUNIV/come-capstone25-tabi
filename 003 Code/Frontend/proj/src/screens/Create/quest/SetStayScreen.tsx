// src/screens/Quest/SetStayScreen.tsx
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
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
const MAX_DAY = 365;
const MAX_HOUR = 24;
const MAX_MIN = 59;

export default function SetStayScreen() {
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
    day: number;
    hour: number;
    minute: number;
    characterImageUrl: string;
  }>({
    questStepId,
    defaults: {day: 0, hour: 0, minute: 0, characterImageUrl: ''},
    mapFromResponse: (full: QuestStepResponse) => {
      const dto = (full as any)?.actionDto ?? {};
      const day =
        typeof dto.day === 'number' ? dto.day : (full as any)?.day ?? 0;
      const hour =
        typeof dto.hour === 'number' ? dto.hour : (full as any)?.hour ?? 0;
      const minute =
        typeof dto.minute === 'number'
          ? dto.minute
          : (full as any)?.minute ?? 0;
      return {
        day,
        hour,
        minute,
        characterImageUrl: dto.characterImageUrl ?? '',
      };
    },
  });

  // 총 분 기준 내부 상태
  const [totalMin, setTotalMin] = useState(0);

  // 프리필: day/hour/minute → totalMin
  useEffect(() => {
    const d = Number((data as any)?.day ?? 0);
    const h = Number((data as any)?.hour ?? 0);
    const m = Number((data as any)?.minute ?? 0);
    const minutes = d * 1440 + h * 60 + (h === 24 ? 0 : m);
    setTotalMin(minutes);
  }, [data?.day, data?.hour, data?.minute]);

  // 표시용 파츠
  const parts = useMemo(() => {
    let d = Math.floor(totalMin / 1440);
    let r = totalMin % 1440;
    let h = Math.floor(r / 60);
    let m = r % 60;
    if (h === 24) m = 0;
    return {day: d, hour: h, minute: m};
  }, [totalMin]);

  // 휠 변경 → totalMin 갱신
  const setByParts = (day: number, hour: number, minute: number) => {
    if (hour === 24 && minute > 0) {
      day += 1;
      hour = 0;
    }
    day = Math.max(0, Math.min(MAX_DAY, day));
    hour = Math.max(0, Math.min(MAX_HOUR, hour));
    minute = Math.max(0, Math.min(MAX_MIN, minute));
    setTotalMin(day * 1440 + hour * 60 + (hour === 24 ? 0 : minute));
  };

  // 휠 데이터
  const days = useMemo(
    () => Array.from({length: MAX_DAY + 1}, (_, i) => i),
    [],
  );
  const hours = useMemo(
    () => Array.from({length: MAX_HOUR + 1}, (_, i) => i),
    [],
  );
  const minutes = useMemo(
    () => Array.from({length: MAX_MIN + 1}, (_, i) => i),
    [],
  );

  const titleLabel = `${ACTION_PALETTE[actionType].label} ${ordinal}`;
  const guide = `체류는 지정된 퀘스트 스팟에 머물러야 해요\n너무 오랜시간 머물지 않게 하도록 주의하세요!`;

  const canSave = characterImageUrl !== '' && totalMin > 0 && !saving;

  const previewImage = useMemo(
    () => resolveCharacterSource(characterImageUrl),
    [characterImageUrl],
  );

  const openCharacterPicker = () => {
    nav.navigate('CharacterSelect', {
      onPick: (payload: {imageUrl: string}) => {
        if (payload?.imageUrl) setCharacterImageUrl(payload.imageUrl);
      },
    });
  };

  const onSave = async () => {
    if (!canSave) return;
    const {day, hour, minute} = parts;

    const payload: QuestStepRequest = {
      questIndicatingId: Number(spotId),
      sequence: sequence || 1,
      actionType: 'STAYING',
      characterImageUrl,
      day,
      hour,
      minute,
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
    <>
      {loading ? (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView style={{flex: 1}}>
            <View
              style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
              <ActivityIndicator color={C.brown} />
              <Text style={{marginTop: 8, color: C.brown, opacity: 0.8}}>
                불러오는 중…
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      ) : (
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
                    onPress={openCharacterPicker}>
                    <Image source={previewImage} style={styles.charAvatar} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{marginTop: 18}}>
                <Text style={styles.sectionTitle}>체류시간</Text>

                <View style={styles.wheelsRow} pointerEvents="box-none">
                  <View style={styles.wheelCol}>
                    {/* @ts-ignore: 외부 Wheel 타입 미정 */}
                    <Wheel
                      data={days}
                      value={parts.day}
                      onChange={d => setByParts(d, parts.hour, parts.minute)}
                      label="Day"
                      lineColor={C.line}
                      activeColor={C.brown}
                      color="#A58E81"
                      rows={3}
                    />
                  </View>
                  <View style={styles.wheelCol}>
                    {/* @ts-ignore */}
                    <Wheel
                      data={hours}
                      value={parts.hour}
                      onChange={h =>
                        setByParts(parts.day, h, h === 24 ? 0 : parts.minute)
                      }
                      label="Hour"
                      lineColor={C.line}
                      activeColor={C.brown}
                      color="#A58E81"
                      rows={3}
                    />
                  </View>
                  <View style={styles.wheelCol}>
                    {/* @ts-ignore */}
                    <Wheel
                      data={minutes}
                      value={parts.minute}
                      onChange={m => setByParts(parts.day, parts.hour, m)}
                      label="Minute"
                      lineColor={C.line}
                      activeColor={C.brown}
                      color="#A58E81"
                      rows={3}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onSave}
                disabled={!canSave}
                activeOpacity={0.9}
                style={[
                  styles.saveBtn,
                  {backgroundColor: canSave ? C.brown : '#BFB7B2'},
                ]}>
                <Text style={styles.saveTxt}>
                  {saving ? '저장 중…' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </>
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
