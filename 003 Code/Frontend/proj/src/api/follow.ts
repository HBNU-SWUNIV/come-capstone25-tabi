// src/api/follow.ts
import instance from './axiosInstance';
import {AxiosError} from 'axios';

/* ========================
  공통 타입/유틸
======================== */
export type Id = number | string;

export type FollowStatus =
  | 'REQUESTED'
  | 'FOLLOWED'
  | 'BLOCKED'
  | 'DECLINED'
  | 'NONE';

export type FollowRow = {
  followId: number;
  followerId: number;
  followerNickName: string;
  followeeId: number;
  followeeNickName: string;
  followStatus: FollowStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string | null;
};

export type ProfilePreview = {
  appUserId: number;
  nickname: string;
  profileImageUrl?: string | null;
  errorMessage?: string | null;
};

// 서버가 공통 래퍼 없이 바로 배열/객체를 내보내므로 any 허용 후 안전 캐스팅
function unwrap<T>(data: any): T {
  return data as T;
}

function normalizeError(e: unknown): Error {
  const err = e as AxiosError<any>;
  if (err.response) {
    const msg =
      err.response.data?.message ||
      err.response.data?.errorMessage ||
      err.response.data?.error ||
      `HTTP ${err.response.status}`;
    return new Error(msg);
  }
  if (err.request) return new Error('네트워크 오류가 발생했어요.');
  return new Error((err as any)?.message ?? '알 수 없는 오류');
}

/* ========================
  Follow APIs
======================== */

/** 팔로우 요청/자동수락: 상대 정책에 따라 REQUESTED 또는 FOLLOWED 생성 */
export async function sendFollowRequest(followeeId: Id): Promise<FollowRow> {
  try {
    const {data} = await instance.post(
      `/api/follow/follow-request/${followeeId}`,
    );
    return unwrap<FollowRow>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 팔로우 요청 수락: 들어온 REQUESTED를 수락하여 상호 FOLLOWED */
export async function acceptFollowRequest(followId: Id): Promise<FollowRow> {
  try {
    const {data} = await instance.post(
      `/api/follow/requests/${followId}/accept`,
    );
    return unwrap<FollowRow>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 팔로우 요청 거절: 들어온 REQUESTED를 DECLINED로 전환 */
export async function declineFollowRequest(followId: Id): Promise<FollowRow> {
  try {
    const {data} = await instance.post(
      `/api/follow/requests/${followId}/decline`,
    );
    return unwrap<FollowRow>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 차단: 기존 요청/팔로우 관계 정리 후 BLOCKED 전환 */
export async function blockUser(followeeId: Id): Promise<FollowRow> {
  try {
    const {data} = await instance.post(`/api/follow/block/${followeeId}`);
    return unwrap<FollowRow>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 차단 해제: 내가 건 BLOCKED 삭제 */
export async function unblock(blockFollowId: Id): Promise<FollowRow> {
  try {
    const {data} = await instance.delete(`/api/follow/block/${blockFollowId}`);
    return unwrap<FollowRow>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 언팔/팔로워 제거: 상대가 나를 FOLLOWED 중일 때 해제 */
export async function unfollow(followeeId: Id): Promise<FollowRow> {
  try {
    const {data} = await instance.delete(`/api/follow/unfollow/${followeeId}`);
    return unwrap<FollowRow>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 닉네임 검색 (GET + querystring 사용: GET은 바디를 잘 안 받음) */
export async function searchProfiles(
  keyword: string,
): Promise<ProfilePreview[]> {
  try {
    const {data} = await instance.get(`/api/follow/profiles/search`, {
      params: {keyword},
    });
    return unwrap<ProfilePreview[]>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 내 팔로잉 목록 (내가 FOLLOWED 중인 사용자들) */
export async function getMyFollowings(): Promise<FollowRow[]> {
  try {
    const {data} = await instance.get(`/api/follow/my-followings`);
    return unwrap<FollowRow[]>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 내 팔로워 목록 (나를 FOLLOWED 중인 사용자들) */
export async function getMyFollowers(): Promise<FollowRow[]> {
  try {
    const {data} = await instance.get(`/api/follow/my-followers`);
    return unwrap<FollowRow[]>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}

/** 차단 목록 조회 */
export async function getBlockedList(): Promise<FollowRow[]> {
  try {
    const {data} = await instance.get(`/api/follow/blocked-list`);
    return unwrap<FollowRow[]>(data);
  } catch (e) {
    throw normalizeError(e);
  }
}
