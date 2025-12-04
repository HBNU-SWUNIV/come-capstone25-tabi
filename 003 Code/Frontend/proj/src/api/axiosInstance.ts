// src/api/axiosInstance.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {triggerGlobalLogout} from '../context/AuthContent';

const instance = axios.create({
  baseURL: 'https://port-0-tabi-9zxht12blqj9n2fu.sel4.cloudtype.app',
  withCredentials: true,
});

// ✅ 요청 인터셉터: accessToken 자동 삽입
instance.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 응답 인터셉터: 401 시 토큰 갱신 후 재요청
instance.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      try {
        const refreshResponse = await axios.post(
          'https://port-0-tabi-9zxht12blqj9n2fu.sel4.cloudtype.app/api/auth/refresh',
        );
        const newToken = refreshResponse.data.accessToken;
        await AsyncStorage.setItem('accessToken', newToken);

        error.config.headers.Authorization = `Bearer ${newToken}`;
        return instance(error.config);
      } catch (refreshErr) {
        await AsyncStorage.removeItem('accessToken');

        // 여기서 글로벌 logout 호출
        triggerGlobalLogout();

        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);

export default instance;
