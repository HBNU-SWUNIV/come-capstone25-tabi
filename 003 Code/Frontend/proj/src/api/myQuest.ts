// src/api/myQuest.ts
import instance from './axiosInstance';
import type {QuestPostDto} from './questPost';

/** POST /api/my-quest/save
 * questPostId → SAVED 상태로 저장
 */
export async function saveMyQuest(questPostId: number): Promise<QuestPostDto> {
  try {
    const {data} = await instance.post('/api/my-quest/save', {
      questPostId,
    });
    return data;
  } catch (e) {
    console.error('❌ saveMyQuest error:', e);
    throw e;
  }
}

/** GET /api/my-quest/my-terminated
 * 내 TERMINATED 퀘스트 목록
 */
export async function getMyTerminatedQuests(): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/my-terminated');
    return data;
  } catch (e) {
    console.error('❌ getMyTerminatedQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/my-saved
 * 내 SAVED 퀘스트 목록
 */
export async function getMySavedQuests(): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/my-saved');
    return data;
  } catch (e) {
    console.error('❌ getMySavedQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/my-running
 * 내 RUNNING(실행 계획 중) 퀘스트 목록
 */
export async function getMyRunningQuests(): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/my-running');
    return data;
  } catch (e) {
    console.error('❌ getMyRunningQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/my-created
 * 내가 제작한 CREATED 퀘스트 목록
 */
export async function getMyCreatedQuests(): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/my-created');
    return data;
  } catch (e) {
    console.error('❌ getMyCreatedQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/counterparty-terminated
 * 상대방 TERMINATED 목록 조회
 */
export async function getCounterpartyTerminatedQuests(
  myProfileId: number,
): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/counterparty-terminated', {
      params: {myProfileId},
    });
    return data;
  } catch (e) {
    console.error('❌ getCounterpartyTerminatedQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/counterparty-saved
 * 상대방 SAVED 목록 조회
 */
export async function getCounterpartySavedQuests(
  myProfileId: number,
): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/counterparty-saved', {
      params: {myProfileId},
    });
    return data;
  } catch (e) {
    console.error('❌ getCounterpartySavedQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/counterparty-running
 * 상대방 RUNNING 목록 조회
 */
export async function getCounterpartyRunningQuests(
  myProfileId: number,
): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/counterparty-running', {
      params: {myProfileId},
    });
    return data;
  } catch (e) {
    console.error('❌ getCounterpartyRunningQuests error:', e);
    throw e;
  }
}

/** GET /api/my-quest/counterparty-created
 * 상대방 CREATED 목록 조회
 */
export async function getCounterpartyCreatedQuests(
  myProfileId: number,
): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get('/api/my-quest/counterparty-created', {
      params: {myProfileId},
    });
    return data;
  } catch (e) {
    console.error('❌ getCounterpartyCreatedQuests error:', e);
    throw e;
  }
}
