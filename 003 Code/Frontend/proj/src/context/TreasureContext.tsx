// src/contexts/TreasureContext.tsx
import React, {createContext, useState, useContext} from 'react';

interface TreasureData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  isPublic: boolean;
  treasureHuntTitle: string;
  treasureHuntDescription: string;
  imageInfo: {
    uri: string;
    type: string;
    name: string;
  } | null;
}

const defaultData: TreasureData = {
  latitude: null,
  longitude: null,
  altitude: null,
  isPublic: true,
  treasureHuntTitle: '',
  treasureHuntDescription: '',
  imageInfo: null,
};

const TreasureContext = createContext<{
  treasure: TreasureData;
  setTreasure: React.Dispatch<React.SetStateAction<TreasureData>>;
}>({
  treasure: defaultData,
  setTreasure: () => {},
});

export const TreasureProvider = ({children}: {children: React.ReactNode}) => {
  const [treasure, setTreasure] = useState<TreasureData>(defaultData);

  return (
    <TreasureContext.Provider value={{treasure, setTreasure}}>
      {children}
    </TreasureContext.Provider>
  );
};

export const useTreasure = () => useContext(TreasureContext);
