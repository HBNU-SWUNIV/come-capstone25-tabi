// src/api/questPost.ts
import instance from './axiosInstance';

/* =========================
   Types
========================= */

export interface QuestPostFinalSettingRequest {
  /** 반드시 포함해야 함 */
  questPostId: number;
  questTitle: string;
  questDescription: string;
  /** estimated* 은 선택. 값이 없으면 undefined/null 로 비워서 보내도 OK */
  estimatedDay?: string | number | null;
  estimatedHour?: string | number | null;
  estimatedMinute?: string | number | null;
  /** 공개 여부 */
  pub: boolean;
}

export interface QuestPostImageDto {
  questPostImageId: number;
  talkContent: string | null;
  characterImageUrl: string | null;
  questPostId: number;
}

export interface QuestStartLocationDto {
  questStartLocationId: number;
  actualLocation: string | null;
  indicateLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  questPostId: number;
}

export interface PostCounterDto {
  postCounterId: number;
  likeCount: number;
  playCount: number;
  shareCount: number;
  commentCount: number;
  reportCount: number;
}

export interface RewardDto {
  rewardId: number;
  experience: number;
  type: boolean;
  creditCardCount: number;
  coin: number;
}

export interface QuestRunningLocationDto {
  questRunningLocationId: number;
  sequence: number;
  locationName: string | null;
  detailLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  questIndicatingId: number;
  questId: number;
}

export interface QuestStepDto {
  questStepId: number;
  sequence: number;
  actionType: string;
  actionDto: {
    actionId: number;
    characterImageUrl: string | null;
    questStepId: number;
  };
  questIndicatingId: number;
}

export interface QuestIndicatingDto {
  questIndicatingId: number;
  actionCount: number;
  talkingAction: boolean;
  stayingAction: boolean;
  puzzleAction: boolean;
  walkingAction: boolean;
  questStepDtos: QuestStepDto[];
  questRunningLocationId: number;
}

export interface QuestPostDto {
  questPostId: number;
  uploadUserName: string | null;
  uploadUserProfileUrl: string | null;
  questTitle: string | null;
  questDescription: string | null;
  estimatedDay: number | null;
  estimatedHour: number | null;
  estimatedMinute: number | null;
  locked: boolean;
  pub: boolean;
  questId: number | null;
  postCounterDto?: PostCounterDto;
  rewardDto?: RewardDto;
  questStartLocationDto?: QuestStartLocationDto;
  questPostImageDtos?: QuestPostImageDto[];
  createdAt?: string;
  questRunningLocationDtos?: QuestRunningLocationDto[];
  questIndicatingDtos?: QuestIndicatingDto[];
}

/* =========================
   Helpers
========================= */

function normError(e: any): Error {
  const msg =
    e?.response?.data?.errorMessage ||
    e?.response?.data?.message ||
    e?.message ||
    'Request failed';
  return new Error(msg);
}

/* =========================
   API functions
========================= */

/**
 * 퀘스트 포스트 최종 설정 적용
 * POST spec처럼 보이지만 실제 엔드포인트는 PUT (요구사항 기준)
 * body 는 estimated* 제외 전부 필수. estimated* 는 선택적으로 전송.
 */
export async function applyQuestPostFinalSetting(
  payload: QuestPostFinalSettingRequest,
): Promise<QuestPostDto> {
  try {
    const {data} = await instance.put<QuestPostDto>(
      '/api/quest-post/creation/final-setting',
      payload,
    );
    return data;
  } catch (e) {
    throw normError(e);
  }
}

/**
 * 퀘스트 플레이 시작
 * 이미 실행/종료/본인 작성 등 제한 케이스는 서버에서 에러 메시지로 반환
 */
export async function startQuestPlay(
  questPostId: number,
): Promise<{success: true} | any> {
  try {
    const {data} = await instance.post(`/api/quest-post/play/${questPostId}`);
    return data ?? {success: true};
  } catch (e) {
    throw normError(e);
  }
}

/**
 * 퀘스트 포스트 초기 설정 생성
 * “퀘스트 만들기” 시작 시 반드시 호출 → 빈 포스트 스켈레톤 생성
 */
export async function createQuestPostInitial(): Promise<QuestPostDto> {
  try {
    const {data} = await instance.post<QuestPostDto>(
      '/api/quest-post/creation/initial-setting',
    );
    return data;
  } catch (e) {
    throw normError(e);
  }
}

/**
 * 퀘스트 포스트 목록 조회 (10개 단위 페이지)
 * @param page 0부터 시작
 */
export async function fetchQuestPostList(
  page: number,
): Promise<QuestPostDto[]> {
  try {
    const {data} = await instance.get<QuestPostDto[]>(
      `/api/quest-post/list/${page}`,
    );
    return data;
  } catch (e) {
    throw normError(e);
  }
}
