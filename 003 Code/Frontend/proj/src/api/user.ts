// user.ts
import axiosInstance from './axiosInstance';

export const getUserIdApi = async () => {
  try {
    const res = await axiosInstance.get('/api/app-user/my-info');
    console.log('my-info 응답:', res.data);
    return res.data;
  } catch (e) {
    console.error('my-info 실패', e);
    throw e;
  }
};

// ===============================
// POST 캐릭터 뽑기
// ===============================
export type DrawType = 'NORMAL' | 'ADVANCED';

export const drawCharacters = async (drawType: DrawType, count: number) => {
  const body = {drawType, count};
  const response = await axiosInstance.post('/api/my-character/draw', body);
  return response.data;
};

// ===============================
// GET 내 인벤토리 조회
// ===============================
export const getMyInventory = async () => {
  try {
    const res = await axiosInstance.get('/api/my-inventory/read');
    return res.data;
  } catch (e) {
    console.error('인벤토리 조회 실패', e);
    throw e;
  }
};
