// src/api/questPlay.ts
import instance from './axiosInstance';

/* ========================
 * Types
 * ====================== */

export type PlayStatus = 'AVAILABLE' | 'PENDING' | 'PLAYING' | 'CLEARED';

export interface LatLngBody {
  /** ※ swagger 오타 주의: treasureHuntPostId 아님 */
  questPostId: number;
  latitude: number;
  longitude: number;
}

export interface MyQuestPlayDto {
  myQuestPlayId: number;
  appUserId: number;
  questPostId: number;
  playStatus: PlayStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface LocationInfoDto {
  questRunningLocationId: number;
  locationName: string;
  latitude: number;
  longitude: number;
  altitude: number;
  endLocation: boolean;
  errorMessage?: string;
}

export interface CurrentDetailDto {
  questCurrentPointId: number;
  actionType:
    | 'TALKING'
    | 'STAYING'
    | 'WALKING'
    | 'PHOTO_PUZZLE'
    | 'LOCATION_PUZZLE'
    | 'INPUT_PUZZLE';
  characterImageUrl?: string;
  walkingCount?: number;
  story?: string;
  day?: number;
  hour?: number;
  minute?: number;
  hintOne?: string | null;
  hintTwo?: string | null;
  hintThree?: string | null;
  endAction: boolean;
}

export interface MostRecentTalkingDto {
  talkingActionDto?: {
    actionId: number;
    characterImageUrl?: string;
    questStepId: number;
    story: string;
  };
  errorMessage?: string;
}

export interface AnswerCheckResponse {
  answered: boolean;
  errorMessage?: string;
}

/** React Native용 이미지 파트 타입 */
export type RNUploadFile = {
  uri: string;
  type: string; // e.g. 'image/jpeg'
  name: string; // e.g. 'photo.jpg'
};

/* ========================
 * Helpers
 * ====================== */

const postPlayState = async (path: string, body: LatLngBody) => {
  const {data} = await instance.post<MyQuestPlayDto>(path, body);
  return data;
};

/* ========================
 * 퀘스트 상태 전환 (POST)
 * ====================== */

/** AVAILABLE → PLAYING (혹은 SavePoint에서 재시작) */
export const setPlaying = (body: LatLngBody) =>
  postPlayState('/api/my-quest-play/playing', body);

/** PLAYING/AVAILABLE → PENDING (5km 벗어난 경우 등) */
export const setPending = (body: LatLngBody) =>
  postPlayState('/api/my-quest-play/pending', body);

/** 마지막 지점이면 CLEARED */
export const setCleared = (body: LatLngBody) =>
  postPlayState('/api/my-quest-play/cleared', body);

/** 시작 위치 반경 15m 이내면 AVAILABLE */
export const setAvailable = (body: LatLngBody) =>
  postPlayState('/api/my-quest-play/available', body);

/* ========================
 * 상태별 목록 (GET)
 * ====================== */

export const getPlayingList = async () => {
  const {data} = await instance.get<MyQuestPlayDto[]>(
    '/api/my-quest-play/reading/playing',
  );
  return data;
};

export const getPendingList = async () => {
  const {data} = await instance.get<MyQuestPlayDto[]>(
    '/api/my-quest-play/reading/pending',
  );
  return data;
};

export const getClearedList = async () => {
  const {data} = await instance.get<MyQuestPlayDto[]>(
    '/api/my-quest-play/reading/cleared',
  );
  return data;
};

export const getAvailableList = async () => {
  const {data} = await instance.get<MyQuestPlayDto[]>(
    '/api/my-quest-play/reading/available',
  );
  return data;
};

/* ========================
 * 퀘스트 세부 (CURRENT POINT)
 * ====================== */

/** 다음 위치 세팅 (endAction === true && 15m 진입 시) */
export const setNextLocation = async (
  myQuestPlayId: number,
  coords: {latitude: number; longitude: number},
) => {
  const {data} = await instance.post<LocationInfoDto>(
    `/api/quest-current-point/next-location/setting/${myQuestPlayId}`,
    coords,
  );
  return data;
};

/**
 * 퍼즐 정답 체크 (PHOTO_PUZZLE은 이미지 multipart/form-data)
 * - actionType: 'PHOTO_PUZZLE' | 'INPUT_PUZZLE' | 'LOCATION_PUZZLE' 등
 * - submissionImage: RNUploadFile (사진 퍼즐일 때만)
 * - submissionAnswerString: 입력 퍼즐 답 등
 */
export const checkPuzzleAnswer = async (
  myQuestPlayId: number,
  payload: {
    actionType:
      | 'PHOTO_PUZZLE'
      | 'INPUT_PUZZLE'
      | 'LOCATION_PUZZLE'
      | 'TALKING'
      | 'STAYING'
      | 'WALKING';
    latitude?: number;
    longitude?: number;
    altitude?: number;
    submissionAnswerString?: string;
    submissionImage?: RNUploadFile;
  },
) => {
  const fd = new FormData();

  // 공통
  fd.append('actionType', payload.actionType);

  // LOCATION_PUZZLE일 때만 좌표 전송
  if (payload.actionType === 'LOCATION_PUZZLE') {
    if (typeof payload.latitude === 'number') {
      fd.append('latitude', String(payload.latitude));
    }
    if (typeof payload.longitude === 'number') {
      fd.append('longitude', String(payload.longitude));
    }
    if (typeof payload.altitude === 'number') {
      fd.append('altitude', String(payload.altitude));
    }
  }

  // INPUT_PUZZLE: 문자열 정답
  if (payload.actionType === 'INPUT_PUZZLE' && payload.submissionAnswerString) {
    fd.append('submissionAnswerString', payload.submissionAnswerString);
  }

  // PHOTO_PUZZLE: 사진 파일
  if (payload.actionType === 'PHOTO_PUZZLE' && payload.submissionImage) {
    fd.append('submissionImage', {
      uri: payload.submissionImage.uri,
      name: payload.submissionImage.name,
      type: payload.submissionImage.type,
    } as any);
  }

  const {data} = await instance.post<AnswerCheckResponse>(
    `/api/quest-current-point/answer-check/${myQuestPlayId}`,
    fd,
  );

  return data;
};

/** 다음 위치 정보 조회 (endAction === true일 때 미리보기) */
export const getNextLocationInfo = async (myQuestPlayId: number) => {
  const {data} = await instance.get<LocationInfoDto>(
    `/api/quest-current-point/next-location/info/${myQuestPlayId}`,
  );
  return data;
};

/** 가장 최근 TALKING 액션 조회 (재시작 등에서 직전 대화 보여줄 때) */
export const getMostRecentTalking = async (myQuestPlayId: number) => {
  const {data} = await instance.get<MostRecentTalkingDto>(
    `/api/quest-current-point/most-recent-talking/${myQuestPlayId}`,
  );
  return data;
};

/** 현재 진행 액션 상세 조회 (요청 반복하면 자동으로 다음 액션으로 진행) */
export const getCurrentDetail = async (myQuestPlayId: number) => {
  const {data} = await instance.get<CurrentDetailDto>(
    `/api/quest-current-point/detail/${myQuestPlayId}`,
  );
  return data;
};

/** 현재 위치 정보(실행해야할 위치) 조회 */
export const getCurrentLocationInfo = async (myQuestPlayId: number) => {
  const {data} = await instance.get<LocationInfoDto>(
    `/api/quest-current-point/current-location/info/${myQuestPlayId}`,
  );
  return data;
};

/** 진행 포인트 삭제 (questCurrentPointId 기준) */
export const deleteCurrentPoint = async (questCurrentPointId: number) => {
  await instance.delete(`/api/quest-current-point/${questCurrentPointId}`);
};

/* ========================
 * 힌트 구매/조회
 * ====================== */

export interface QuestHintSaveDto {
  questHintSaveId: number;
  hintContents?: string; // purchase 응답 시 구매된 힌트 내용
  errorMessage?: string;
}

/** 힌트 구매 (1 → 2 → 3 순서 강제) */
export const purchaseHint = async (body: {
  questCurrentPointId: number;
  purchaseHintIndex: 1 | 2 | 3;
}) => {
  const {data} = await instance.post<QuestHintSaveDto>(
    '/api/quest-hint-save/purchase',
    body,
  );
  return data;
};

export interface HintSetDto {
  questHintSaveId: number;
  hintOne: string | null;
  hintTwo: string | null;
  hintThree: string | null;
}

/** 내 힌트 세트 조회 (questHintSaveId 기준) */
export const readHintSet = async (questHintSaveId: number) => {
  const {data} = await instance.get<HintSetDto>(
    `/api/quest-hint-save/read/${questHintSaveId}`,
  );
  return data;
};
