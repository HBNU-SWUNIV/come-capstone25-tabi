// hooks/useComments.ts
import {useCallback, useEffect, useRef, useState} from 'react';
import type {
  TreasureHuntPostComment,
  PagedResponse,
} from '../api/treasureHuntPost';
import {
  fetchParentComments,
  fetchChildComments,
  createComment,
  createReply,
  deleteComment as deleteCommentApi,
} from '../api/treasureHuntPost';

// 중복 요청 방지 게이트 (loadMore용)
const useLoadingGate = () => {
  const ref = useRef(false);
  const run = useCallback(async <T>(fn: () => Promise<T>) => {
    if (ref.current) return;
    ref.current = true;
    try {
      return await fn();
    } finally {
      ref.current = false;
    }
  }, []);
  return run;
};

// 응답 파서: 배열 / 페이지드 모두 대응
function parsePagedOrArray<T>(data: any): {list: T[]; totalPages?: number} {
  if (Array.isArray(data)) {
    return {list: data as T[]};
  }
  const content = (data as PagedResponse<T>)?.content;
  const totalPages = (data as PagedResponse<T>)?.totalPages;
  return {list: Array.isArray(content) ? content : [], totalPages};
}

/** 부모(최상위) 댓글 훅 */
export function useParentComments(treasureHuntPostId: number) {
  const [items, setItems] = useState<TreasureHuntPostComment[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gate = useLoadingGate();
  // ⬇️ 최신 요청만 반영하기 위한 시퀀스
  const reqIdRef = useRef(0);

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);

      const myReq = ++reqIdRef.current;
      try {
        const data = await fetchParentComments(treasureHuntPostId, nextPage);
        if (myReq !== reqIdRef.current) return;

        const {list, totalPages} =
          parsePagedOrArray<TreasureHuntPostComment>(data);

        setItems(prev => (nextPage === 0 ? list : [...prev, ...list]));

        if (typeof totalPages === 'number') {
          setHasNext(nextPage + 1 < totalPages);
        } else {
          setHasNext(list.length > 0);
        }
        setPage(nextPage);
      } catch (e: any) {
        if (myReq !== reqIdRef.current) return;
        setError(e?.message ?? '댓글을 불러오지 못했어요.');
      } finally {
        if (myReq === reqIdRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [treasureHuntPostId],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setHasNext(true);
      await loadPage(0);
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasNext) return;
    gate(() => loadPage(page + 1));
  }, [gate, loadPage, page, loading, hasNext]);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasNext(true);
    reqIdRef.current++; // 진행 중이던 이전 요청 무효화
    refresh();
  }, [treasureHuntPostId, refresh]);

  // 부모 댓글 생성
  const addComment = useCallback(
    async (comment: string) => {
      const optimisticId = Math.random();
      const optimistic: TreasureHuntPostComment = {
        treasureHuntPostCommentId: optimisticId as any,
        treasureHuntPostId,
        appUserId: -1,
        userName: '나',
        profileImageUrl: '',
        comment,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: 0,
        childrenCount: 0,
      };
      setItems(prev => [optimistic, ...prev]);
      try {
        const saved = await createComment({treasureHuntPostId, comment});
        setItems(prev =>
          prev.map(it =>
            String(it.treasureHuntPostCommentId) === String(optimisticId)
              ? saved
              : it,
          ),
        );
        reqIdRef.current++;
        await loadPage(0);
      } catch (e) {
        setItems(prev =>
          prev.filter(
            it => String(it.treasureHuntPostCommentId) !== String(optimisticId),
          ),
        );
        throw e;
      }
    },
    [treasureHuntPostId, loadPage],
  );

  // 부모 댓글 삭제
  const deleteComment = useCallback(
    async (commentId: number) => {
      const backup = items;
      setItems(prev =>
        prev.filter(it => it.treasureHuntPostCommentId !== commentId),
      );
      try {
        await deleteCommentApi(commentId);
      } catch (e) {
        setItems(backup);
        throw e;
      }
    },
    [items],
  );

  // 🔽 대댓글 삭제 시 부모 childrenCount를 낙관적으로 -1 (메타만)
  const onChildDeletedMeta = useCallback((parentId: number) => {
    setItems(prev =>
      prev.map(it =>
        it.treasureHuntPostCommentId === parentId
          ? {...it, childrenCount: Math.max(0, (it.childrenCount || 0) - 1)}
          : it,
      ),
    );
  }, []);

  return {
    items,
    loading,
    refreshing,
    error,
    hasNext,
    refresh,
    loadMore,
    addComment,
    deleteComment,
    onChildDeletedMeta, // ✅ 노출
  };
}

/** 자식(대댓글) 훅 */
export function useChildComments(treasureHuntPostId: number, parentId: number) {
  const [items, setItems] = useState<TreasureHuntPostComment[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gate = useLoadingGate();
  const reqIdRef = useRef(0);

  const loadPage = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);

      const myReq = ++reqIdRef.current;
      try {
        const data = await fetchChildComments(
          treasureHuntPostId,
          parentId,
          nextPage,
        );
        if (myReq !== reqIdRef.current) return;

        const {list, totalPages} =
          parsePagedOrArray<TreasureHuntPostComment>(data);

        setItems(prev => (nextPage === 0 ? list : [...prev, ...list]));

        if (typeof totalPages === 'number') {
          setHasNext(nextPage + 1 < totalPages);
        } else {
          setHasNext(list.length > 0);
        }
        setPage(nextPage);
      } catch (e: any) {
        if (myReq !== reqIdRef.current) return;
        setError(e?.message ?? '대댓글을 불러오지 못했어요.');
      } finally {
        if (myReq === reqIdRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [treasureHuntPostId, parentId],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setHasNext(true);
      await loadPage(0);
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasNext) return;
    gate(() => loadPage(page + 1));
  }, [gate, loadPage, page, loading, hasNext]);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasNext(true);
    reqIdRef.current++; // 이전 요청 무효화
    refresh();
  }, [treasureHuntPostId, parentId, refresh]);

  // 대댓글 생성
  const addReply = useCallback(
    async (comment: string) => {
      const optimisticId = Math.random();
      const optimistic: TreasureHuntPostComment = {
        treasureHuntPostCommentId: optimisticId as any,
        treasureHuntPostId,
        appUserId: -1,
        userName: '나',
        profileImageUrl: '',
        comment,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId,
        childrenCount: 0,
      };
      setItems(prev => [optimistic, ...prev]);
      try {
        const saved = await createReply(treasureHuntPostId, parentId, comment);
        setItems(prev =>
          prev.map(it =>
            String(it.treasureHuntPostCommentId) === String(optimisticId)
              ? saved
              : it,
          ),
        );
        reqIdRef.current++;
        await loadPage(0);
      } catch (e) {
        setItems(prev =>
          prev.filter(
            it => String(it.treasureHuntPostCommentId) !== String(optimisticId),
          ),
        );
        throw e;
      }
    },
    [treasureHuntPostId, parentId, loadPage],
  );

  // 대댓글 삭제 (API + 로컬 제거)
  const deleteComment = useCallback(
    async (commentId: number) => {
      const backup = items;
      setItems(prev =>
        prev.filter(it => it.treasureHuntPostCommentId !== commentId),
      );
      try {
        await deleteCommentApi(commentId);
      } catch (e) {
        setItems(backup);
        throw e;
      }
    },
    [items],
  );

  return {
    items,
    loading,
    refreshing,
    error,
    hasNext,
    refresh,
    loadMore,
    addReply,
    deleteComment,
  };
}
