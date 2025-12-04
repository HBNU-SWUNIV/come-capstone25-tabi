// src/hooks/useTabRefresh.ts
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useCallback, useEffect} from 'react';

/**
 * 탭 진입 및 포커스 시 callback 실행
 * @param callback 새로고침 또는 데이터 로드 함수
 */
export const useTabRefresh = (callback: () => void) => {
  const navigation = useNavigation<any>();

  // 📌 탭 다시 눌렀을 때 실행
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      callback();
    });
    return unsubscribe;
  }, [navigation, callback]);

  // 📌 화면 포커스 시 실행
  useFocusEffect(
    useCallback(() => {
      callback();
    }, [callback]),
  );
};
