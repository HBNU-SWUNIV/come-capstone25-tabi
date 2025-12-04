// src/context/QuestLocationStore.ts
import React, {createContext, useContext, useMemo, useState} from 'react';

export type ActionToken = 'talk' | 'stay' | 'puzzle' | 'walk';

export type QuestPlace = {
  id: string; // place_id
  name: string; // 장소명
  address: string; // 서브 텍스트
  lat: number;
  lng: number;
  sequence?: number; // 순서 정보 (SpotListScreen에서 사용)
  questRunningLocationId?: number; // 실행 위치 ID
  questIndicatingId?: number; // 인디케이팅 ID
  actions?: ActionToken[]; // 액션 목록
};

type Ctx = {
  places: QuestPlace[];
  addPlace: (p: QuestPlace) => void;
  removePlace: (id: string) => void;
  clear: () => void;
  setPlaces: React.Dispatch<React.SetStateAction<QuestPlace[]>>;
};

const QuestLocationCtx = createContext<Ctx | null>(null);

export const QuestLocationProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [places, setPlaces] = useState<QuestPlace[]>([]);

  const addPlace = (p: QuestPlace) =>
    setPlaces(prev => (prev.find(x => x.id === p.id) ? prev : [...prev, p]));

  const removePlace = (id: string) =>
    setPlaces(prev => prev.filter(p => p.id !== id));

  const clear = () => setPlaces([]);

  const value = useMemo(
    () => ({places, addPlace, removePlace, clear, setPlaces}),
    [places],
  );

  return (
    <QuestLocationCtx.Provider value={value}>
      {children}
    </QuestLocationCtx.Provider>
  );
};

export const useQuestLocations = () => {
  const ctx = useContext(QuestLocationCtx);
  if (!ctx)
    throw new Error(
      'useQuestLocations must be used within QuestLocationProvider',
    );
  return ctx;
};
