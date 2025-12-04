// 진행 중(완전히 끝나지 않은) 퀘스트 정보를 저장/조회하는 유틸
// - endAction === true 인 시점에 getNextLocationInfo 로 받은 위치 정보를 저장
// - PlayTabScreen 에서 읽어서 "플레이중인 퀘스트" 영역에 노출하는 용도

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_UNFINISHED_QUEST = 'unfinishedQuest:v1';

export type UnfinishedQuest = {
  // 현재 플레이 중인 myQuestPlayId
  myQuestPlayId: number;
  // 퀘스트 게시글 ID
  questPostId: number;
  // 퀘스트 제목 (리스트 표시용)
  title?: string;
  // 현재 진행해야 하는 위치 이름
  locationName?: string;
  // 현재 진행해야 하는 위치 좌표
  latitude: number;
  longitude: number;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// 진행 중 퀘스트 저장
export async function saveUnfinishedQuest(data: UnfinishedQuest) {
  await AsyncStorage.setItem(KEY_UNFINISHED_QUEST, JSON.stringify(data));
}

// 진행 중 퀘스트 조회
export async function loadUnfinishedQuest(): Promise<UnfinishedQuest | null> {
  const raw = await AsyncStorage.getItem(KEY_UNFINISHED_QUEST);
  const parsed = safeParse<UnfinishedQuest | null>(raw, null);
  return parsed;
}

// 진행 중 퀘스트 정보 제거
export async function clearUnfinishedQuest() {
  await AsyncStorage.removeItem(KEY_UNFINISHED_QUEST);
}
