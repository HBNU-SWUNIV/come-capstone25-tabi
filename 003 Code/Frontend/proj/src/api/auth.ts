// src/api/auth.ts
import axiosInstance from './axiosInstance';

export const loginApi = async (email: string, password: string) => {
  return await axiosInstance.post('/api/auth/login', {
    email,
    password,
  });
  // 이건 response 전체를 반환함 (data, status, headers 등 포함)
};

export const logoutApi = async () => {
  await axiosInstance.post('/api/auth/logout');
};

export const refreshTokenApi = async () => {
  const response = await axiosInstance.post('/api/auth/refresh');
  return response.data;
};

export const signUpApi = async (signUpData: any) => {
  const response = await axiosInstance.post('/api/app-user/sign-up/info', {
    ...signUpData,
    agreement: true,
  });
  return response.data;
};

export const sendVerificationCodeApi = async (email: string) => {
  return await axiosInstance.post('/api/app-user/sign-up/code-generation', {
    email,
  });
};

export const verifyCodeApi = async (email: string, code: string) => {
  return await axiosInstance.post('/api/app-user/sign-up/code-verification', {
    email,
    code,
  });
};
