// src/screens/Quest/SetQuestEstimatedTimeScreen.tsx
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Wheel from './../_Wheel';
import {applyQuestPostFinalSetting} from '../../../../api/questPost';
import {SafeAreaView} from 'react-native-safe-area-context';

/* -----------------------------------------------------------------------------
 * 이 화면의 역할
 * - 최종 제출 바디에서 예상시간(estimatedDay/Hour/Minute)을 수집하는 선택형 단계
 * - 필수가 아니므로 라디오(토글)로 사용 여부를 선택
 * - 사용자가 값을 바꾸면 즉시 AsyncStorage('quest_final_data')에 병합 저장
 * - 필드 키: useEstimatedTime, estimatedDay, estimatedHour, estimatedMinute
 * - "저장하기" 클릭 시 final-setting 엔드포인트로 PUT 요청 후 결과 화면으로 이동
 * - 성공 시: quest_final_data / currentQuestId / currentQuestPostId 키 제거
 * --------------------------------------------------------------------------- */

/** 스토리지 키 */
const STORAGE_KEY = 'quest_final_data';
const QUEST_ID_KEY = 'currentQuestId';
const QUEST_POST_ID_KEY = 'currentQuestPostId';

/** 테마 */
const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  line: '#8F7B70',
  btn: '#61402D',
  btnPressed: '#503624',
  btnText: '#fff',
};

/** 안전 JSON 로드 */
async function readFinalData(): Promise<Record<string, any>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** 병합 저장 */
async function mergeFinalData(patch: Record<string, any>) {
  const cur = await readFinalData();
  const next = {...cur, ...patch};
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** undefined/null 제거 */
function pruneUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: any = {};
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

export default function SetQuestEstimatedTimeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // ▷ 예상시간 사용 여부(라디오)
  const [useEstimatedTime, setUseEstimatedTime] = useState(false);

  // ▷ 휠 값(일/시/분)
  const [day, setDay] = useState<number>(0);
  const [hour, setHour] = useState<number>(0);
  const [minute, setMinute] = useState<number>(0);

  // ▷ 제출 중
  const [submitting, setSubmitting] = useState(false);

  // ▷ 복원
  useEffect(() => {
    (async () => {
      const data = await readFinalData();
      if (typeof data.useEstimatedTime === 'boolean')
        setUseEstimatedTime(!!data.useEstimatedTime);
      if (data.estimatedDay != null) setDay(Number(data.estimatedDay) || 0);
      if (data.estimatedHour != null) setHour(Number(data.estimatedHour) || 0);
      if (data.estimatedMinute != null)
        setMinute(Number(data.estimatedMinute) || 0);
    })();
  }, []);

  // ▷ 라디오 토글
  const toggleUse = async (nextUse: boolean) => {
    setUseEstimatedTime(nextUse);
    if (!nextUse) {
      await mergeFinalData({
        useEstimatedTime: false,
        estimatedDay: undefined,
        estimatedHour: undefined,
        estimatedMinute: undefined,
      });
    } else {
      await mergeFinalData({
        useEstimatedTime: true,
        estimatedDay: String(day),
        estimatedHour: String(hour),
        estimatedMinute: String(minute),
      });
    }
  };

  // ▷ 휠 변경 시 즉시 저장(+자동 on)
  const onChangeDay = async (v: number) => {
    setDay(v);
    setUseEstimatedTime(true);
    await mergeFinalData({useEstimatedTime: true, estimatedDay: String(v)});
  };
  const onChangeHour = async (v: number) => {
    setHour(v);
    setUseEstimatedTime(true);
    await mergeFinalData({useEstimatedTime: true, estimatedHour: String(v)});
  };
  const onChangeMinute = async (v: number) => {
    setMinute(v);
    setUseEstimatedTime(true);
    await mergeFinalData({useEstimatedTime: true, estimatedMinute: String(v)});
  };

  // ▷ 휠 데이터
  const days = useMemo(() => Array.from({length: 365 + 1}, (_, i) => i), []);
  const hours = useMemo(() => Array.from({length: 24 + 1}, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({length: 59 + 1}, (_, i) => i), []);

  /** 최종 제출 */
  const onSubmit = async () => {
    try {
      setSubmitting(true);

      // 필수 키
      const questPostIdStr = await AsyncStorage.getItem(QUEST_POST_ID_KEY);
      const questPostId = questPostIdStr ? Number(questPostIdStr) : NaN;
      if (!questPostIdStr || Number.isNaN(questPostId)) {
        Alert.alert(
          '오류',
          'questPostId를 찾을 수 없다. 처음부터 다시 시도한다.',
        );
        return;
      }

      const data = await readFinalData();

      // 예상시간 검증 + 전송 규칙
      // - 사용 안함: 세 필드 모두 빈 문자열
      // - 사용함: 각 항목이 0이면 ''로 보냄(부분 미설정 허용), 세 항목 모두 0이면 Alert
      const willUse = !!data.useEstimatedTime;
      const d = Number(data.estimatedDay ?? day) || 0;
      const h = Number(data.estimatedHour ?? hour) || 0;
      const m = Number(data.estimatedMinute ?? minute) || 0;

      const sd = willUse && d > 0 ? String(d) : '';
      const sh = willUse && h > 0 ? String(h) : '';
      const sm = willUse && m > 0 ? String(m) : '';

      if (willUse && sd === '' && sh === '' && sm === '') {
        Alert.alert('안내', '예상시간을 모두 0으로 설정할 수 없습니다');
        return;
      }

      // 페이로드
      const payload = pruneUndefined({
        questPostId,
        questTitle: String(data.questTitle ?? ''),
        questDescription: String(data.questDescription ?? ''),
        pub: !!data.pub,
        estimatedDay: willUse ? sd : '',
        estimatedHour: willUse ? sh : '',
        estimatedMinute: willUse ? sm : '',
      });

      // 디버그 로그
      console.log('[FinalSetting][request payload]', payload);

      // 전송
      const res = await applyQuestPostFinalSetting(payload as any);

      // 성공 로그
      console.log('[FinalSetting][success][raw]', res);
      console.log('[FinalSetting][success][summary]', {
        questPostId: res?.questPostId,
        title: res?.questTitle,
        pub: res?.pub,
      });

      // 성공 시 로컬 정리
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        QUEST_ID_KEY,
        QUEST_POST_ID_KEY,
      ]);

      // 결과 화면으로 이동(성공)
      navigation.navigate('QuestCreationEnd', {ok: true});
    } catch (e: any) {
      console.log('[FinalSetting][error]', {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
      // 결과 화면으로 이동(실패)
      navigation.navigate('QuestCreationEnd', {ok: false});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* 버튼 고정 레이아웃: 상단/내용/하단 분리 */}
      <View style={styles.mainContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.brownLightText}>
            {`퀘스트를 완료하는데 걸리는 예상시간을 적어주세요!\n예상시간은 필수가 아니기 때문에 적용하지 않아도 괜찮아요!`}
          </Text>
        </View>

        {/* 본문 */}
        <View style={styles.contentWrapper}>
          {/* 라디오 */}
          <View style={styles.radioRow}>
            <Text style={styles.sectionTitle}>예상시간</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => toggleUse(!useEstimatedTime)}
              style={styles.radioBtn}>
              <Icon
                name={useEstimatedTime ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={C.brown}
              />
            </TouchableOpacity>
          </View>

          {/* 휠 */}
          {useEstimatedTime && (
            <View style={styles.wheelsRow} pointerEvents="box-none">
              <View style={styles.wheelCol}>
                {/* @ts-ignore: 외부 Wheel 타입 미정 */}
                <Wheel
                  data={days}
                  value={day}
                  onChange={onChangeDay}
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
                  value={hour}
                  onChange={onChangeHour}
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
                  value={minute}
                  onChange={onChangeMinute}
                  label="Minute"
                  lineColor={C.line}
                  activeColor={C.brown}
                  color="#A58E81"
                  rows={3}
                />
              </View>
            </View>
          )}
        </View>

        {/* 하단 고정 버튼 */}
        <View style={styles.footer}>
          <Pressable
            disabled={submitting}
            style={({pressed}) => [
              styles.createBtn,
              pressed && {
                backgroundColor: C.btnPressed,
                transform: [{scale: 0.97}],
              },
              submitting && {opacity: 0.7},
            ]}
            onPress={onSubmit}>
            {({pressed}) => (
              <Text style={[styles.createBtnText, pressed && {color: '#ddd'}]}>
                저장하기
              </Text>
            )}
          </Pressable>
        </View>

        {/* 제출 중 오버레이 */}
        {submitting && (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color={C.brown} />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  // SetQuestVisibleScreen 과 동일한 레이아웃 철학
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 30,
    backgroundColor: C.bg,
  },

  header: {
    marginTop: 10,
    marginLeft: 46,
  },
  brownLightText: {
    color: C.brown,
    fontWeight: '300',
    fontSize: 12,
    lineHeight: 18,
  },

  contentWrapper: {paddingTop: 18, paddingHorizontal: 20, flex: 1},

  radioRow: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {color: C.brown, fontWeight: '800', fontSize: 18},
  radioBtn: {padding: 4},

  wheelsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  wheelCol: {width: '31%'},

  footer: {alignItems: 'center'},
  createBtn: {
    backgroundColor: C.btn,
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: C.btnText,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loadingOverlay: {
    position: 'absolute',
    inset: 0 as any,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,233,225,0.6)',
  },
});
