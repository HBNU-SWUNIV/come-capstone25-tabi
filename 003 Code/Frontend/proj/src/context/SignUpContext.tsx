import React, {createContext, useContext, useState} from 'react';

type SignUpInfo = {
  username?: string;
  birth?: string;
  gender?: boolean;
  mobileCarrier?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  agreement?: boolean;
};

type SignUpContextType = {
  data: SignUpInfo;
  update: (partial: Partial<SignUpInfo>) => void;
  reset: () => void;
};

const SignUpContext = createContext<SignUpContextType | null>(null);

export const useSignUp = () => {
  const ctx = useContext(SignUpContext);
  if (!ctx) throw new Error('SignUpContext not found');
  return ctx;
};

export const SignUpProvider = ({children}: {children: React.ReactNode}) => {
  const [data, setData] = useState<SignUpInfo>({});

  const update = (partial: Partial<SignUpInfo>) =>
    setData(prev => ({...prev, ...partial}));

  const reset = () => setData({});

  return (
    <SignUpContext.Provider value={{data, update, reset}}>
      {children}
    </SignUpContext.Provider>
  );
};
