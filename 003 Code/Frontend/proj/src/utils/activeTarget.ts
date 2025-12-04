import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'active-target';

export type ActiveTarget = {
  id: string;
  type: 'treasure' | 'quest';
  latitude: number;
  longitude: number;
  title?: string;
  date?: string;
  locationName?: string;

  reward?: {
    rewardId: number;
    experience: number;
    type: boolean; // 보상 타입(true: 일반 뽑기권, false: 고급 뽑기권)
    creditCardCount: number;
    coin: number;
  };

  myQuestPlayId?: number; // ★ 퀘스트 전용
};

export async function setActiveTarget(t: ActiveTarget) {
  await AsyncStorage.setItem(KEY, JSON.stringify(t));
}

export async function getActiveTarget(): Promise<ActiveTarget | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveTarget;
  } catch {
    return null;
  }
}

export async function clearActiveTarget() {
  await AsyncStorage.removeItem(KEY);
}
