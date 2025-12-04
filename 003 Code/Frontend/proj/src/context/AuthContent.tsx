// src/components/AuthContent.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginApi,
  logoutApi,
  signUpApi,
  sendVerificationCodeApi,
  verifyCodeApi,
} from '../api/auth';

let globalLogout: () => void = () => {};

export const registerGlobalLogout = (logoutFunc: () => void) => {
  globalLogout = logoutFunc;
};

export const triggerGlobalLogout = () => {
  globalLogout();
};

interface AuthContextProps {
  isLoggedIn: boolean;
  isFirstLaunch: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeFirstLaunch: () => Promise<void>;
  signUp: (signUpData: any) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  hasProfile: boolean | null;
  setHasProfile: React.Dispatch<React.SetStateAction<boolean | null>>;
}

export const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  isFirstLaunch: false,
  login: async () => {},
  logout: async () => {},
  completeFirstLaunch: async () => {},
  signUp: async () => {},
  sendVerificationCode: async () => {},
  verifyCode: async () => {},
  setHasProfile: () => {},
  hasProfile: null,
});

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [bootDone, setBootDone] = useState(false); // ✅ 추가

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      setIsLoggedIn(!!token);
    };

    const checkFirstLaunch = async () => {
      const launched = await AsyncStorage.getItem('hasLaunched');
      if (launched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstLaunch(true); // 첫 실행
      } else {
        setIsFirstLaunch(false); // 이미 실행한 적 있음
      }
    };

    (async () => {
      await Promise.all([checkToken(), checkFirstLaunch()]);
      setBootDone(true); // 토큰, 첫 로딩 여부 확인 이후 children 렌더
    })();
  }, []);

  useEffect(() => {
    // 로그인하면 "아직 모름(null)"로 바꿔서 AppNavigator가 프로필 재검사 로더를 띄우게 함
    // 로그아웃이면 굳이 검사할 필요 없으니 false(프로필 없음)로.
    setHasProfile(isLoggedIn ? null : false);
  }, [isLoggedIn]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password);
      const accessToken = response?.headers?.authorization?.split(' ')[1]; // 'Bearer abc123'에서 토큰 추출

      if (!accessToken)
        throw new Error('No accessToken found in response headers');

      await AsyncStorage.setItem('accessToken', accessToken);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    } finally {
      await AsyncStorage.removeItem('accessToken');
      setIsLoggedIn(false);
    }
  };

  const signUp = async (signUpData: any) => {
    try {
      const result = await signUpApi(signUpData);
      console.log('✅ 회원가입 성공:', result);
      // 자동 로그인할 경우 아래 주석 해제
      // await AsyncStorage.setItem('accessToken', result.accessToken);
      // setIsLoggedIn(true);
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      await sendVerificationCodeApi(email);
    } catch (error) {
      console.error('인증번호 전송 실패:', error);
      throw error;
    }
  };

  const verifyCode = async (email: string, code: string) => {
    try {
      await verifyCodeApi(email, code);
    } catch (error) {
      console.error('인증번호 확인 실패:', error);
      throw error;
    }
  };

  const completeFirstLaunch = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setIsFirstLaunch(false);
  };

  // 전역에서 logout trigger 가능하게 등록
  useEffect(() => {
    registerGlobalLogout(logout);
  }, []);

  const value = useMemo(
    () => ({
      isLoggedIn,
      isFirstLaunch,
      login,
      logout,
      completeFirstLaunch,
      signUp,
      sendVerificationCode,
      verifyCode,
      hasProfile,
      setHasProfile,
    }),
    [isLoggedIn, isFirstLaunch, hasProfile],
  );

  if (!bootDone) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
