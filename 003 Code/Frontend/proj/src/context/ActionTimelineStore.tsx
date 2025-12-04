// src/context/ActionTimelineStore.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {nanoid} from 'nanoid/non-secure';

export type ActionType =
  | 'TALKING'
  | 'STAYING'
  | 'WALKING'
  | 'PHOTO_PUZZLE'
  | 'INPUT_PUZZLE'
  | 'LOCATION_PUZZLE';

export type TimelineAction = {
  id: string;
  type: ActionType;
  // 各アクション用の設定（詳細画面で編集する想定）
  config?: Record<string, any>;
};

type Store = {
  // spotId ごとのタイムライン
  timelines: Record<string, TimelineAction[]>;
  getTimeline: (spotId: string) => TimelineAction[];
  addAction: (spotId: string, type: ActionType) => void;
  removeAction: (spotId: string, id: string) => void;
  reorder: (spotId: string, next: TimelineAction[]) => void;
};

const Ctx = createContext<Store | null>(null);

export function ActionTimelineProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [timelines, setTimelines] = useState<Record<string, TimelineAction[]>>(
    {},
  );

  const getTimeline = useCallback(
    (spotId: string) => timelines[spotId] ?? [],
    [timelines],
  );

  const addAction = useCallback((spotId: string, type: ActionType) => {
    setTimelines(prev => {
      const cur = prev[spotId] ?? [];
      return {
        ...prev,
        [spotId]: [...cur, {id: nanoid(8), type}],
      };
    });
  }, []);

  const removeAction = useCallback((spotId: string, id: string) => {
    setTimelines(prev => {
      const cur = prev[spotId] ?? [];
      return {...prev, [spotId]: cur.filter(a => a.id !== id)};
    });
  }, []);

  const reorder = useCallback((spotId: string, next: TimelineAction[]) => {
    setTimelines(prev => ({...prev, [spotId]: next}));
  }, []);

  const value = useMemo(
    () => ({timelines, getTimeline, addAction, removeAction, reorder}),
    [timelines, getTimeline, addAction, removeAction, reorder],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActionTimeline() {
  const v = useContext(Ctx);
  if (!v) throw new Error('ActionTimelineProvider が必要');
  return v;
}
