import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Modalize} from 'react-native-modalize';
import CommentModal from '../screens/Social/treasure/CommentModal';
import {getUserIdApi} from '../api/user';

type CommentModalData = {
  id?: number;
  treasureHuntPostId?: number;
  author?: string;
  title?: string;
  description?: string;
  avatar?: any;
} | null;

type Ctx = {
  isOpen: boolean;
  openCommentModal: (item: CommentModalData) => void; // ✅ uid 제거
  closeCommentModal: () => void;
};

const CommentModalContext = createContext<Ctx | null>(null);

export const useCommentModal = () => {
  const ctx = useContext(CommentModalContext);
  if (!ctx)
    throw new Error(
      'useCommentModal must be used within <CommentModalProvider/>',
    );
  return ctx;
};

export const CommentModalProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const modalRef = useRef<Modalize>(null);
  const [selected, setSelected] = useState<CommentModalData>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | undefined>(
    undefined,
  );

  // 1) 앱 시작 시 1차 시도 (성공하면 캐시됨)
  useEffect(() => {
    (async () => {
      try {
        const uid = await getUserIdApi();
        setCurrentUserId(uid.appUserId);
      } catch {
        setCurrentUserId(undefined);
      }
    })();
  }, []);

  // 2) 모달 열기 직전에 항상 최신 userId 보장
  const ensureUserId = useCallback(async () => {
    try {
      const uid = await getUserIdApi();
      setCurrentUserId(uid.appUserId);
      return uid as number;
    } catch {
      // 로그인 안 되어 있으면 undefined 유지 → 삭제버튼 숨김
      setCurrentUserId(undefined);
      return undefined;
    }
  }, []);

  const openCommentModal = useCallback(
    async (item: CommentModalData) => {
      setSelected(item);
      // 로그인 직후/토큰 갱신 직후에도 최신값을 잡기 위해 재조회
      await ensureUserId();

      setIsOpen(true);
      requestAnimationFrame(() => modalRef.current?.open());
    },
    [ensureUserId],
  );

  const closeCommentModal = useCallback(() => {
    modalRef.current?.close();
  }, []);

  const value = useMemo(
    () => ({isOpen, openCommentModal, closeCommentModal}),
    [isOpen, openCommentModal, closeCommentModal],
  );

  return (
    <CommentModalContext.Provider value={value}>
      {children}

      <CommentModal
        ref={modalRef}
        selectedItem={selected}
        currentUserId={currentUserId} // ✅ 항상 유지
        onClose={() => {
          setIsOpen(false);
          setSelected(null);
          // ❌ setCurrentUserId(undefined) 하지 않음
        }}
      />
    </CommentModalContext.Provider>
  );
};
