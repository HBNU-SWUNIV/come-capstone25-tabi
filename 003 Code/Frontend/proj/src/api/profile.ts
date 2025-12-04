// src/api/profile.ts
import axiosInstance from './axiosInstance';

export const getMyProfile = async () => {
  try {
    const res = await axiosInstance.get('/api/my-profile/retrieval');
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const checkNicknameDuplicate = async (nickName: string) => {
  try {
    const res = await axiosInstance.post(
      '/api/my-profile/nickname-duplication-check',
      {
        nickName,
        profileImageUrl: '',
      },
    );
    return res.data;
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 400) {
      throw new Error('이미 사용중인 닉네임이에요!');
    }

    throw new Error(message || '중복 확인에 실패했습니다.');
  }
};

// 인증된 사용자의 보유 캐릭터 정보 조회
export const getMyCharacters = async () => {
  const response = await axiosInstance.get('/api/my-character/info');
  return response.data;
};

// characterId에 해당하는 캐릭터 이미지 리소스를 서버에서 선택
export const selectProfileCharacter = async (characterId: number) => {
  const response = await axiosInstance.post(
    `/profile-characters/${characterId}`,
  );
  return response.data;
};

// 프로필 생성 요청
export const createProfile = async (
  nickName: string,
  profileImageUrl: string,
) => {
  const body = {
    nickName,
    profileImageUrl, // 예: 'owl_1.png'
  };
  const response = await axiosInstance.post('/api/my-profile/creation', body);
  return response.data;
};
