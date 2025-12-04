// src/api/questCreation.ts
import instance from './axiosInstance';

/* =========================
 * Types
 * ======================= */

export type ActionType =
  | 'WALKING'
  | 'TALKING'
  | 'STAYING'
  | 'PHOTO_PUZZLE'
  | 'LOCATION_PUZZLE'
  | 'INPUT_PUZZLE';

export type PhotoKeywordRequest = {keyword: string};

export type QuestStepRequest = {
  questIndicatingId: number; // 어떤 스팟(인디케이팅)에 속한 액션인지
  sequence: number; // 타임라인 내 순서 (1-base 권장)
  actionType: ActionType; // 반드시 위 6종 중 하나
  characterImageUrl: string; // 캐릭터(말풍선 주인) 이미지 URL

  // --- 타입별 필수/옵션 필드 (필요한 것만 채우면 됨) ---
  // WALKING
  walkingCount?: number;

  // TALKING
  story?: string;

  // STAYING
  day?: number;
  hour?: number;
  minute?: number;

  // PHOTO_PUZZLE
  photoKeywordRequests?: PhotoKeywordRequest[];

  // LOCATION_PUZZLE
  locationName?: string; // 보여지는 주소
  actualLocation?: string; // 실주소
  latitude?: number;
  longitude?: number;
  altitude?: number;

  // INPUT_PUZZLE
  answerString?: string;

  // Puzzle 공통 힌트 (PHOTO_PUZZLE / LOCATION_PUZZLE / INPUT_PUZZLE)
  hintOne?: string | null;
  hintTwo?: string | null;
  hintThree?: string | null;
};

export type QuestStepResponse = {
  questStepId: number;
  sequence: number;
  actionType: ActionType | string;
  actionDto: {
    actionId: number;
    characterImageUrl: string;
    questStepId: number;
  };
  questIndicatingId: number;
  errorMessage?: string;
};

// 서버가 “모든 키를 요구” 한다면 사용하는
// 기본값을 채워 넣는 정규화(normalize) 함수
function normalizePayloadForServer(p: QuestStepRequest) {
  return {
    questIndicatingId: p.questIndicatingId,
    sequence: p.sequence,
    actionType: p.actionType,
    characterImageUrl: p.characterImageUrl,

    // 공통/타입 외 필드에 기본값 채움
    walkingCount: p.walkingCount ?? 0,

    story: p.story ?? '',

    day: p.day ?? 0,
    hour: p.hour ?? 0,
    minute: p.minute ?? 0,

    photoKeywordRequests: p.photoKeywordRequests ?? [],

    locationName: p.locationName ?? '',
    actualLocation: p.actualLocation ?? '',
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    altitude: p.altitude ?? 0, // 고도는 규칙상 항상 0

    answerString: p.answerString ?? '',

    hintOne: p.hintOne ?? null,
    hintTwo: p.hintTwo ?? null,
    hintThree: p.hintThree ?? null,
  };
}

/* =========================
 * Helpers (간단 검증)
 * ======================= */

function assertRequiredForType(payload: QuestStepRequest) {
  const t = payload.actionType;

  if (!payload.characterImageUrl) {
    throw new Error('characterImageUrl는 필수입니다.');
  }

  if (t === 'WALKING' && typeof payload.walkingCount !== 'number') {
    throw new Error('WALKING은 walkingCount가 필수입니다.');
  }
  if (t === 'TALKING' && !payload.story) {
    throw new Error('TALKING은 story가 필수입니다.');
  }
  if (
    t === 'STAYING' &&
    !(
      typeof payload.day === 'number' &&
      typeof payload.hour === 'number' &&
      typeof payload.minute === 'number'
    )
  ) {
    throw new Error('STAYING은 day/hour/minute가 모두 필수입니다.');
  }
  if (t === 'PHOTO_PUZZLE' && !payload.photoKeywordRequests?.length) {
    throw new Error(
      'PHOTO_PUZZLE은 photoKeywordRequests가 최소 1개 필요합니다.',
    );
  }
  if (
    t === 'LOCATION_PUZZLE' &&
    !(
      payload.locationName &&
      payload.actualLocation &&
      typeof payload.latitude === 'number' &&
      typeof payload.longitude === 'number' &&
      typeof payload.altitude === 'number'
    )
  ) {
    throw new Error(
      'LOCATION_PUZZLE은 locationName/actualLocation/latitude/longitude/altitude가 필수입니다.',
    );
  }
  if (t === 'INPUT_PUZZLE' && !payload.answerString) {
    throw new Error('INPUT_PUZZLE은 answerString이 필수입니다.');
  }

  // 퍼즐 3종은 힌트 필수(없으면 null로 보내기)
  if (t === 'PHOTO_PUZZLE' || t === 'LOCATION_PUZZLE' || t === 'INPUT_PUZZLE') {
    payload.hintOne ??= null;
    payload.hintTwo ??= null;
    payload.hintThree ??= null;
  }
}

/* =========================
 * API functions
 * ======================= */

/** GET 퀘스트 액션 조회 */
export async function getQuestStep(questStepId: number) {
  const {data} = await instance.get<QuestStepResponse>(
    `/api/quest-step/${questStepId}`,
  );
  return data;
}

/**
 * PUT 퀘스트 액션 수정
 * - 순서 변경(리오더)도 이 API 사용
 * - 타입별 필수값 검증 수행
 */
export async function updateQuestStep(
  questStepId: number,
  payload: QuestStepRequest,
) {
  assertRequiredForType(payload);
  // const body = normalizePayloadForServer(payload); // <- 필요시에만 사용
  const {data} = await instance.put<QuestStepResponse>(
    `/api/quest-step/${questStepId}`,
    payload,
  );
  return data;
}

/** DELETE 퀘스트 액션 삭제 */
export async function deleteQuestStep(questStepId: number) {
  await instance.delete(`/api/quest-step/${questStepId}`);
}

/**
 * POST 퀘스트 액션 생성
 * - 한 스팟에 여러 액션을 "한 번에" 만들 수 있도록 단건/배열 둘 다 지원
 * - 서버가 단건만 받는다면 배열 입력시 for..of로 순차 호출해 합쳐 반환
 */
export async function createQuestSteps(
  payload: QuestStepRequest | QuestStepRequest[],
) {
  if (Array.isArray(payload)) {
    // 모두 유효성 체크
    payload.forEach(assertRequiredForType);

    try {
      // 서버가 배열도 받는 형태라면 한 번에 전송:
      const {data} = await instance.post<QuestStepResponse[]>(
        '/api/quest-step/creation',
        payload as any,
      );
      return data;
    } catch (e) {
      // 혹시 서버가 단건만 받는다면 순차로 보내서 결과 배열 리턴
      const results: QuestStepResponse[] = [];
      for (const item of payload) {
        const r = await createQuestSteps(item);
        results.push(r as QuestStepResponse);
      }
      return results;
    }
  } else {
    assertRequiredForType(payload);
    const {data} = await instance.post<QuestStepResponse>(
      '/api/quest-step/creation',
      payload,
    );
    return data;
  }
}

/* =========================
 * (옵션) 사용 예시
 * ======================= */
/*
await createQuestSteps({
  questIndicatingId: 123,
  sequence: 1,
  actionType: 'TALKING',
  characterImageUrl: 'https://.../npc.png',
  story: '첫 대사입니다.',
});

await updateQuestStep(42, {
  questIndicatingId: 123,
  sequence: 2,
  actionType: 'PHOTO_PUZZLE',
  characterImageUrl: 'https://.../npc.png',
  photoKeywordRequests: [{ keyword: '빨간문' }, { keyword: '고양이' }],
  hintOne: null,
  hintTwo: '광각이 도움될지도?',
  hintThree: '정문 왼쪽 벽에 있어요.',
});
*/

/* ========================
 * 실행 위치(러닝 로케이션)
 * ====================== */

export interface RunningLocationUpsert {
  /** 1,2,3… 순서대로 정렬해서 보낼 것 */
  sequence: number;
  locationName: string;
  detailLocation: string;
  latitude: number;
  longitude: number;
  altitude: number;
  /** 이전에 생성된 항목 갱신 시에만 포함 */
  questRunningLocationId?: number;
}

export interface RunningLocationDto {
  questRunningLocationId: number;
  sequence: number;
  locationName: string;
  detailLocation: string;
  latitude: number;
  longitude: number;
  altitude: number;
  questIndicatingId: number;
  questId: number;
}

/** 실행 위치 저장/갱신 (전체 교체 방식) */
export const saveRunningLocations = async (
  questId: number,
  list: RunningLocationUpsert[],
) => {
  const {data} = await instance.post<RunningLocationDto[]>(
    `/api/quest-running-location/save/${questId}`,
    list,
  );
  return data;
};

/** 실행 위치 전체 조회 */
export const getRunningLocations = async (questId: number) => {
  const {data} = await instance.get<RunningLocationDto[]>(
    `/api/quest-running-location/${questId}`,
  );
  return data;
};

/** 실행 위치 단건 삭제 */
export const deleteRunningLocation = async (questRunningLocationId: number) => {
  await instance.delete(
    `/api/quest-running-location/${questRunningLocationId}`,
  );
};

/* ========================
 * 퀘스트 인디케이팅 (설정) 조회
 * ====================== */

export interface QuestStepDto {
  questStepId: number;
  sequence: number;
  actionType:
    | 'TALKING'
    | 'STAYING'
    | 'WALKING'
    | 'PHOTO_PUZZLE'
    | 'LOCATION_PUZZLE'
    | 'INPUT_PUZZLE';
  actionDto: {
    actionId: number;
    characterImageUrl: string;
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

/** 퀘스트 인디케이팅 단건 조회 */
export const getQuestIndicating = async (questIndicatingId: number) => {
  const {data} = await instance.get<QuestIndicatingDto>(
    `/api/quest-indicating/${questIndicatingId}`,
  );
  return data;
};

/** 퀘스트 인디케이팅 일괄 조회 (Quest ID 기준) */
export const getQuestIndicatingList = async (questId: number) => {
  const {data} = await instance.get<QuestIndicatingDto[]>(
    `/api/quest-indicating/list/${questId}`,
  );
  return data;
};
