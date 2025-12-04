// src/api/questComment.ts
import instance from './axiosInstance';

// ✅ 최상위(부모) 댓글 페이지 단위 조회
export const fetchParentComments = async (
  questPostId: number,
  page: number,
) => {
  const res = await instance.post(
    `/api/quest-post-comment/parent/comment/${page}`,
    {
      questPostId,
    },
  );
  return res.data;
};

// ✅ 댓글 생성 (부모/자식 공용)
export const createComment = async (
  questPostId: number,
  comment: string,
  parentQuestPostCommentId?: number,
) => {
  const body: any = {questPostId, comment};
  if (parentQuestPostCommentId) {
    body.parentQuestPostCommentId = parentQuestPostCommentId;
  }
  const res = await instance.post('/api/quest-post-comment/creation', body);
  return res.data;
};

// ✅ 특정 부모의 자식 댓글 페이지 단위 조회
export const fetchChildComments = async (
  questPostId: number,
  parentQuestPostCommentId: number,
  page: number,
) => {
  const res = await instance.post(
    `/api/quest-post-comment/child/comment/${page}`,
    {
      questPostId,
      parentQuestPostCommentId,
    },
  );
  return res.data;
};

// ✅ 댓글 삭제
export const deleteComment = async (commentId: number) => {
  const res = await instance.delete(
    `/api/quest-post-comment/deletion/${commentId}`,
  );
  return res.data;
};
