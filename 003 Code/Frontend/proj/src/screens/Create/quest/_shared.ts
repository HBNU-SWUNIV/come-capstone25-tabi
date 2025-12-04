// src/screens/Quest/_shared.ts
import {useEffect, useRef, useState} from 'react';
import {
  getQuestStep,
  updateQuestStep,
  type QuestStepRequest,
} from '../../../api/questCreation';
import {characterImageMap} from '../../../characters/profileImages';

const DUMMY = 'dummy'; // 🔸 통일된 더미 문자열
const DEFAULT_CHAR_IMG = 'owl_1.png'; // 🔸 기본 캐릭터 키(프리뷰 비활성용)

/** 더미(clean) 유틸 */
function stripDummyDeep<T>(v: T): T {
  if (typeof v === 'string') {
    // 문자열 더미 제거
    return (v === DUMMY ? '' : v) as any;
  }
  if (Array.isArray(v)) {
    // 배열 내부의 더미 문자열 제거
    return v
      .map(it => stripDummyDeep(it))
      .filter(it => !(typeof it === 'string' && it === '')) as any;
  }
  if (v && typeof v === 'object') {
    const out: any = Array.isArray(v) ? [] : {};
    for (const k of Object.keys(v as any)) {
      const cleaned = stripDummyDeep((v as any)[k]);
      out[k] = cleaned;
    }
    return out;
  }
  return v;
}

/**
 * 캐릭터 이미지 키(파일명 또는 URL)를 RN ImageSource로 변환
 * 기본 이미지(dummy)는 undefined로 반환 → 버튼 노출
 */
export function resolveCharacterSource(key?: string | null) {
  if (!key || key === DEFAULT_CHAR_IMG) return undefined as any;
  if (/^https?:\/\//i.test(key)) return {uri: key};
  const local = (characterImageMap as any)?.[key];
  return local ?? {uri: key};
}

/**
 * 퀘스트 스텝 로딩/저장 훅
 */
export function useQuestStepLoader<T>({
  questStepId,
  defaults,
  mapFromResponse,
}: {
  questStepId: number | string;
  defaults: T;
  mapFromResponse: (resp: any) => T;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sequence, setSequence] = useState<number>(1);
  const [data, setData] = useState<T>(defaults);
  const [characterImageUrl, setCharacterImageUrl] = useState<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        const full = await getQuestStep(Number(questStepId));
        if (!mountedRef.current) return;

        if (typeof full?.sequence === 'number') setSequence(full.sequence);

        // 1) 화면 매핑
        const mapped = mapFromResponse(full);
        // 2) 더미 문자열/배열 정리(공통 처리)
        const cleaned = stripDummyDeep(mapped);
        setData(cleaned);

        // 3) 캐릭터 이미지 프리필: 기본 ‘owl_1.png’면 빈값으로 둬서 버튼 노출
        const initialChar =
          (cleaned as any)?.characterImageUrl ??
          (full as any)?.actionDto?.characterImageUrl ??
          '';

        setCharacterImageUrl(
          initialChar === DEFAULT_CHAR_IMG ? '' : initialChar,
        );
      } catch (e) {
        if (!mountedRef.current) return;
        setData(defaults);
        setCharacterImageUrl('');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [questStepId]);

  /**
   * 저장 처리
   */
  const handleSave = async (
    payload: QuestStepRequest,
    opts?: {onSuccess?: () => void; onError?: () => void},
  ) => {
    try {
      console.log('[DEBUG payload]', JSON.stringify(payload, null, 2));
      setSaving(true);
      await updateQuestStep(Number(questStepId), payload);
      opts?.onSuccess?.();
    } catch (e) {
      console.log('[useQuestStepLoader handleSave error]', e);
      opts?.onError?.();
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    sequence,
    setSequence,
    data,
    setData,
    characterImageUrl,
    setCharacterImageUrl,
    handleSave,
  };
}
