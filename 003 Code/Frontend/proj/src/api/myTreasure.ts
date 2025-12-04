// src/api/myTreasure.ts
// ※ 보물찾기(MyTreasure) 관련 API 모음

import axiosInstance from './axiosInstance';

// -----------------------------
// 공통 Response 타입 정의
// -----------------------------
export type TreasureHuntPostCounter = {
  postCounterId: number;
  likeCount: number;
  playCount: number;
  shareCount: number;
  commentCount: number;
  reportCount: number;
};

export type TreasureHuntReward = {
  rewardId: number;
  experience: number;
  type: boolean; // true = 일반, false = 고급
  creditCardCount: number;
  coin: number;
};

export type TreasureHuntStartLocation = {
  treasureHuntStartLocationId: number;
  indicateLocation: string;
  latitude: number;
  longitude: number;
  altitude: number;
};

export type TreasureHuntPostImage = {
  treasureHuntPostImageId: number;
  imageUrl: string;
};

export type MyTreasureHuntPost = {
  treasureHuntPostId: number;
  uploadUserName: string;
  uploadUserProfileUrl: string;
  treasureHuntTitle: string;
  treasureHuntDescription: string;
  termination: boolean;
  locked: boolean;
  pub: boolean;
  postCounter: TreasureHuntPostCounter;
  reward: TreasureHuntReward;
  treasureHuntStartLocation: TreasureHuntStartLocation;
  treasureHuntPostImage: TreasureHuntPostImage | null;
  createdAt: string;
};

// ---------------------------------------------------------
// POST /api/my-treasure-hunt/save
// 보물찾기 게시글을 내 보물찾기(SAVED) 상태로 저장
// 이미 참여/저장/종료된 경우 또는 게시글 미존재 시 → 서버에서 400 반환
// ---------------------------------------------------------
export const saveMyTreasureHunt = (treasureHuntPostId: number) => {
  return axiosInstance.post<MyTreasureHuntPost>(
    '/api/my-treasure-hunt/save',
    null,
    {params: {treasureHuntPostId}},
  );
};

// ---------------------------------------------------------
// GET /api/my-treasure-hunt/my-terminated
// 내가 종료(TERMINATED)한 보물찾기 목록 조회
// (프로필 → 종료된 보물찾기 탭)
// ---------------------------------------------------------
export const getMyTerminatedTreasureHunts = () => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/my-terminated',
  );
};

// ---------------------------------------------------------
// GET /api/my-treasure-hunt/my-saved
// 내가 저장(SAVED)한 보물찾기 목록 조회
// (프로필 → 저장한 보물찾기 탭)
// ---------------------------------------------------------
export const getMySavedTreasureHunts = () => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/my-saved',
  );
};

// ---------------------------------------------------------
// GET /api/my-treasure-hunt/my-running
// 내가 실행 계획(RUNNING) 중인 보물찾기 목록 조회
// - 앱에서 반경 비교(1km 내 → available 요청) 용도
// - 프로필 → 실행중인 보물찾기 탭에서도 사용
// ---------------------------------------------------------
export const getMyRunningTreasureHunt = () => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/my-running',
  );
};

// ---------------------------------------------------------
// GET /api/my-treasure-hunt/my-created
// 내가 제작(CREATED)한 보물찾기 목록 조회
// (프로필 → 제작한 보물찾기 탭)
// ---------------------------------------------------------
export const getMyCreatedTreasureHunts = () => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/my-created',
  );
};

// ---------------------------------------------------------
// 상대방 프로필 기반 조회 API
// 상대방 myProfileId 필수
// ---------------------------------------------------------

// GET /api/my-treasure-hunt/counterparty-terminated
// 상대방이 종료한 보물찾기 목록 조회
export const getCounterpartyTerminatedTreasureHunts = (myProfileId: number) => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/counterparty-terminated',
    {params: {myProfileId}},
  );
};

// GET /api/my-treasure-hunt/counterparty-saved
// 상대방이 저장한 보물찾기 목록 조회
export const getCounterpartySavedTreasureHunts = (myProfileId: number) => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/counterparty-saved',
    {params: {myProfileId}},
  );
};

// GET /api/my-treasure-hunt/counterparty-running
// 상대방이 실행 계획 중인 보물찾기 목록 조회
export const getCounterpartyRunningTreasureHunts = (myProfileId: number) => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/counterparty-running',
    {params: {myProfileId}},
  );
};

// GET /api/my-treasure-hunt/counterparty-created
// 상대방이 제작한 보물찾기 목록 조회
export const getCounterpartyCreatedTreasureHunts = (myProfileId: number) => {
  return axiosInstance.get<MyTreasureHuntPost[]>(
    '/api/my-treasure-hunt/counterparty-created',
    {params: {myProfileId}},
  );
};
