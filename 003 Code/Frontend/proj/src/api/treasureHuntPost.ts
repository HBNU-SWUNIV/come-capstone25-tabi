// src/api/treasureHunt.ts

import axiosInstance from './axiosInstance';

interface PlayTreasureHuntRequest {
  treasureHuntPostId: number;
  latitude: number;
  longitude: number;
}

interface CreateTreasureHuntRequest {
  isPublic: boolean;
  treasureHuntTitle: string;
  treasureHuntDescription: string;
  imageInfo: {
    uri: string;
    type: string;
    name: string;
  };
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface TreasureHuntPostComment {
  treasureHuntPostCommentId: number;
  treasureHuntPostId: number;
  appUserId: number;
  userName: string;
  profileImageUrl: string;
  comment: string;
  likeCount: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  parentId: number | null; // 최상위면 null/0 처리 가능
  childrenCount: number;
  errorMessage?: string;
}

export interface PagedResponse<T = any> {
  content: T[];
  totalPages?: number;
  totalElements?: number;
  number?: number; // current page
  size?: number;
  [k: string]: any;
}

export const playTreasureHunt = (data: PlayTreasureHuntRequest) => {
  return axiosInstance.post('/api/treasure-hunt-post/play', data);
};

export const createTreasureHunt = (data: CreateTreasureHuntRequest) => {
  const formData = new FormData();

  formData.append('isPublic', String(data.isPublic));
  formData.append('treasureHuntTitle', data.treasureHuntTitle);
  formData.append('treasureHuntDescription', data.treasureHuntDescription);
  formData.append('latitude', String(data.latitude));
  formData.append('longitude', String(data.longitude));
  formData.append('altitude', String(data.altitude));

  formData.append('image', {
    uri: data.imageInfo.uri,
    type: data.imageInfo.type,
    name: data.imageInfo.name,
  });

  return axiosInstance.post('/api/treasure-hunt-post/creation', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const fetchTreasureHuntById = (id: number) => {
  return axiosInstance.get(`/api/treasure-hunt-post/read/${id}`);
};

export const fetchTreasureHuntFeed = (page: number) => {
  return axiosInstance.get('/api/treasure-hunt-post/read-ten', {
    params: {
      pages: page,
    },
  });
};

// 부모(최상위) 댓글 조회
export const fetchParentComments = async (
  treasureHuntPostId: number,
  page: number,
) => {
  const res = await axiosInstance.post<PagedResponse<TreasureHuntPostComment>>(
    `/api/treasure-hunt-post-comment/parent/comment/${page}`,
    {treasureHuntPostId},
  );
  return res.data;
};

// 자식(대댓글) 조회
export const fetchChildComments = async (
  treasureHuntPostId: number,
  parentId: number,
  page: number,
) => {
  const res = await axiosInstance.post<PagedResponse<TreasureHuntPostComment>>(
    `/api/treasure-hunt-post-comment/child/comment/${page}`,
    {treasureHuntPostId, parentTreasureHuntPostCommentId: parentId},
  );
  return res.data;
};

// 댓글 생성(부모/자식 공통)
export const createComment = async (params: {
  treasureHuntPostId: number;
  comment: string;
  parentId?: number; // 대댓글이면 전달
}) => {
  const {treasureHuntPostId, comment, parentId} = params;
  const res = await axiosInstance.post<TreasureHuntPostComment>(
    '/api/treasure-hunt-post-comment/creation',
    {
      treasureHuntPostId,
      comment,
      ...(parentId !== undefined && {
        parentTreasureHuntPostCommentId: parentId,
      }),
    },
  );
  return res.data;
};

export const createReply = (
  treasureHuntPostId: number,
  parentId: number,
  comment: string,
) => createComment({treasureHuntPostId, parentId, comment});

// 댓글 삭제
export const deleteComment = async (commentId: number) => {
  const res = await axiosInstance.delete(
    `/api/treasure-hunt-post-comment/deletion/${commentId}`,
  );
  return res.data;
};
