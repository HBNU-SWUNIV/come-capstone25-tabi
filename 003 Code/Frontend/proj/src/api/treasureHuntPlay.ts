// src/api/treasureHuntPlay.ts

import axiosInstance from './axiosInstance';

interface LocationPayload {
  treasureHuntPostId: number;
  latitude: number; // 현재 사용자의 위치 정보, 보물찾기 위치정보가 아님
  longitude: number; // 현재 사용자의 위치 정보, 보물찾기 위치정보가 아님
}

// POST: 상태를 playing으로 변경
// 현재 PENDING 또는 AVAILABLE 상태인 보물찾기를 다시 실행하면 PLAYING 상태로 전환.
// PlayTabScreen에서 실행 리스트에 노출된 항목을 터치할때 호출함.
export const setTreasureHuntPlaying = (payload: LocationPayload) => {
  return axiosInstance.post('/api/my-treasure-hunt-play/playing', payload);
};

// POST: 상태를 pending으로 변경
// 현재 PLAYING 상태인 보물찾기를 실행중에 뒤로가기를 누르면 일시중지(PENDING) 상태로 전환.
export const setTreasureHuntPending = (payload: LocationPayload) => {
  return axiosInstance.post('/api/my-treasure-hunt-play/pending', payload);
};

// POST: 상태를 cleared로 변경
// 현재 위치가 시작 지점 반경 1.5m 이내인 경우 보물찾기를 완료 상태로 전환
// 보물찾기 포스트 번호, 해당 사람이 위치한 위도, 경도를 전달.
export const setTreasureHuntCleared = (payload: LocationPayload) => {
  return axiosInstance.post('/api/my-treasure-hunt-play/cleared', payload);
};

// POST: 상태를 available로 변경
// 사용자의 현재 위치가 시작 위치 반경 1km 이내인 경우 AVAILABLE 상태로 보물찾기를 등록.
// PlayTabScreen에서 실행 리스트에 노출할때 사용하는 api이다.
export const setTreasureHuntAvailable = (payload: LocationPayload) => {
  return axiosInstance.post('/api/my-treasure-hunt-play/available', payload);
};

// GET: playing 상태 보물찾기 조회
// 로그인한 사용자의 PLAYING 상태 보물찾기 목록을 조회 (종료된 게시글은 제외).
export const getPlayingTreasureHunts = () => {
  return axiosInstance.get('/api/my-treasure-hunt-play/reading/playing');
};

// GET: pending 상태 보물찾기 조회
// 로그인한 사용자의 PENDING 상태 보물찾기 목록을 조회 (종료된 게시글은 제외).
export const getPendingTreasureHunts = () => {
  return axiosInstance.get('/api/my-treasure-hunt-play/reading/pending');
};

// DELETE: 'Available' 상태 보물찾기 플레이 삭제
// 사용자가 저장한 보물찾기 중 'AVAILABLE'(진행 가능) 상태인 항목을 ID를 통해 삭제
// 1km 내에 벗어났다면 해당 api를 통해 벗어난 TreasureHuntPlay 객체 Id를 포함시켜 보내 삭제 요청
export const deleteAvailableTreasureHunt = (myTreasureHuntPlayId: number) => {
  return axiosInstance.delete(
    `/api/my-treasure-hunt-play/available/${myTreasureHuntPlayId}`,
  );
};

// GET: cleared 상태 보물찾기 조회
// 로그인한 사용자의 CLEARED 상태 보물찾기 목록을 조회
export const getClearedTreasureHunts = () => {
  return axiosInstance.get('/api/my-treasure-hunt-play/reading/cleared');
};

// GET: available 상태 보물찾기 조회
// 로그인한 사용자의 AVAILABLE 상태 보물찾기 목록을 조회 (종료된 게시글은 제외)
// 보물찾기 실행부분의 "실행될 퀘스트가 여러개일 경우" 페이지 리스트에 올라가는 정보
export const getAvailableTreasureHunts = () => {
  return axiosInstance.get('/api/my-treasure-hunt-play/reading/available');
};
