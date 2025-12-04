import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_RUN = 'runningTargets:v1';
const KEY_POSTINDEX = 'runningTargets:postIndex:v1';
const KEY_LASTSTATUS = 'runningTargets:lastStatus:v1'; // treasureHuntPostId -> boolean

export type RunningTreasureTarget = {
  myTreasureHuntPlayId: number; // ← 삭제용(AVAILABLE 해제)
  treasureHuntPostId: number; // ← 상태/조인 기준 키
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
export async function saveRunningTreasureTargets(
  list: RunningTreasureTarget[],
) {
  // 인덱스: treasureHuntPostId -> RunningTarget (AVAILABLE 목록과 조인하기 위함)
  const index: Record<number, RunningTreasureTarget> = {};
  for (const t of list) index[t.treasureHuntPostId] = t;

  await AsyncStorage.multiSet([
    [KEY_RUN, JSON.stringify(list)],
    [KEY_POSTINDEX, JSON.stringify(index)],
  ]);
}

export async function loadRunningTreasureTargets(): Promise<
  RunningTreasureTarget[]
> {
  const raw = await AsyncStorage.getItem(KEY_RUN);
  return safeParse<RunningTreasureTarget[]>(raw, []);
}

export async function getTreasurePostIndex(): Promise<
  Record<number, RunningTreasureTarget>
> {
  const raw = await AsyncStorage.getItem(KEY_POSTINDEX);
  return safeParse<Record<number, RunningTreasureTarget>>(raw, {});
}

export async function clearRunningTreasureTargets() {
  await AsyncStorage.multiRemove([KEY_RUN, KEY_POSTINDEX]);
}

// ---------- LAST STATUS (AVAILABLE 전용: true=AVAILABLE, false/undefined=NOT) ----------
export async function getLastTreasureStatus(): Promise<
  Record<number, boolean>
> {
  const raw = await AsyncStorage.getItem(KEY_LASTSTATUS);
  const obj = safeParse<Record<string, any>>(raw, {});
  const normalized: Record<number, boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    normalized[Number(k)] = v === true || v === 'AVAILABLE';
  }
  return normalized;
}

export async function setLastTreasureStatus(map: Record<number, boolean>) {
  await AsyncStorage.setItem(KEY_LASTSTATUS, JSON.stringify(map));
}

/** 단일 포스트의 상태만 업데이트 (경계 교차 시에 호출) */
export async function upsertLastStatus(
  postId: number,
  available: boolean,
): Promise<Record<number, boolean>> {
  const cur = await getLastTreasureStatus();
  if (cur[postId] === available) return cur; // 변화 없음
  const next = {...cur, [postId]: available};
  await setLastTreasureStatus(next);
  return next;
}

export async function clearLastTreasureStatus() {
  await AsyncStorage.removeItem(KEY_LASTSTATUS);
}
