// src/utils/questRunningTargetsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_RUN_Q = 'runningQuestTargets:v1';
const KEY_POSTINDEX_Q = 'runningQuestTargets:postIndex:v1';
const KEY_LASTSTATUS_Q = 'runningQuestTargets:lastStatus:v1'; // questPostId -> boolean

export type RunningQuestTarget = {
  questPostId: number; // 상태/조인 기준 키
  title?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  reward?: {
    rewardId: number;
    experience: number;
    type: boolean; // 서버 스펙 그대로
    creditCardCount: number;
    coin: number;
  };
};

// ---------- JSON 유틸 ----------
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---------- RUNNING TARGETS ----------
export async function saveRunningQuestTargets(list: RunningQuestTarget[]) {
  const index: Record<number, RunningQuestTarget> = {};
  for (const q of list) index[q.questPostId] = q;

  await AsyncStorage.multiSet([
    [KEY_RUN_Q, JSON.stringify(list)],
    [KEY_POSTINDEX_Q, JSON.stringify(index)],
  ]);
}

export async function loadRunningQuestTargets(): Promise<RunningQuestTarget[]> {
  const raw = await AsyncStorage.getItem(KEY_RUN_Q);
  return safeParse<RunningQuestTarget[]>(raw, []);
}

export async function getQuestPostIndex(): Promise<
  Record<number, RunningQuestTarget>
> {
  const raw = await AsyncStorage.getItem(KEY_POSTINDEX_Q);
  return safeParse<Record<number, RunningQuestTarget>>(raw, {});
}

export async function clearRunningQuestTargets() {
  await AsyncStorage.multiRemove([KEY_RUN_Q, KEY_POSTINDEX_Q]);
}

// ---------- LAST STATUS (AVAILABLE 전용: true=AVAILABLE, false/undefined=NOT) ----------
export async function getQuestLastStatus(): Promise<Record<number, boolean>> {
  const raw = await AsyncStorage.getItem(KEY_LASTSTATUS_Q);
  const obj = safeParse<Record<string, any>>(raw, {});
  const normalized: Record<number, boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    normalized[Number(k)] = v === true || v === 'AVAILABLE';
  }
  return normalized;
}

export async function setQuestLastStatus(map: Record<number, boolean>) {
  await AsyncStorage.setItem(KEY_LASTSTATUS_Q, JSON.stringify(map));
}

export async function upsertQuestLastStatus(
  postId: number,
  available: boolean,
): Promise<Record<number, boolean>> {
  const cur = await getQuestLastStatus();
  if (cur[postId] === available) return cur;
  const next = {...cur, [postId]: available};
  await setQuestLastStatus(next);
  return next;
}

export async function clearQuestLastStatus() {
  await AsyncStorage.removeItem(KEY_LASTSTATUS_Q);
}
