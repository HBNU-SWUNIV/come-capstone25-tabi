// src/screens/Play/Quest/PhotoPuzzleCameraScreen.tsx
import React, {useEffect, useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  launchCamera,
  type Asset,
  type CameraOptions,
} from 'react-native-image-picker';

import {
  checkPuzzleAnswer,
  CurrentDetailDto,
  type RNUploadFile,
} from '../../../api/questPlay';
import {getActiveTarget} from '../../../utils/activeTarget';
import {SafeAreaView} from 'react-native-safe-area-context';
import axios from 'axios';

const {width, height} = Dimensions.get('window');

type RouteParams = {
  myQuestPlayId?: number;
  detail?: CurrentDetailDto;
};

export default function PhotoPuzzleCameraScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const routeParams = route.params as RouteParams | undefined;

  // --- クエスト実行 ID ---
  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(
    routeParams?.myQuestPlayId ?? null,
  );
  const [detail, setDetail] = useState<CurrentDetailDto | null>(
    routeParams?.detail ?? null,
  );

  // --- 撮影した写真 ---
  const [photo, setPhoto] = useState<RNUploadFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // ===========================
  // 1. 카메라 열기 (first=true면 취소 시 goBack)
  // ===========================
  const openCamera = async (first: boolean) => {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      cameraType: 'back', // TS 에러 나면 이 줄만 빼도 됨
    };

    const res = await launchCamera(options);

    if (res.didCancel) {
      if (first) {
        navigation.goBack();
      }
      return;
    }

    if (res.errorCode) {
      console.warn('❌ launchCamera error:', res.errorMessage);
      if (first) {
        navigation.goBack();
      }
      return;
    }

    const asset: Asset | undefined = res.assets?.[0];
    if (!asset?.uri) {
      console.warn('❌ no asset uri');
      if (first) {
        navigation.goBack();
      }
      return;
    }

    const file: RNUploadFile = {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || 'photo.jpg',
    };
    setPhoto(file);
  };

  // ===========================
  // 2. 초기 로드: myQuestPlayId 확보 + 카메라 한 번만 실행
  // ===========================
  useEffect(() => {
    (async () => {
      try {
        let id = myQuestPlayId;
        if (!id) {
          const active = await getActiveTarget();
          if (!active?.myQuestPlayId) {
            console.warn('❌ myQuestPlayId 없음 → 이전 화면으로 복귀');
            navigation.goBack();
            return;
          }
          id = active.myQuestPlayId;
          setMyQuestPlayId(id);
        }
        await openCamera(true);
      } finally {
        setLoading(false);
      }
    })();
    // [] → 마운트 시 한 번만 실행, 사진 선택해도 다시 안 불린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===========================
  // 3. 정답 체크(사진 제출)
  // ===========================
  const handleSubmitPhoto = useCallback(async () => {
    if (busy) return;
    if (!photo || !myQuestPlayId) return;

    setBusy(true);
    try {
      const res = await checkPuzzleAnswer(myQuestPlayId, {
        actionType: 'PHOTO_PUZZLE',
        submissionImage: photo,
      } as any);

      if (res.answered) {
        console.log('사진 퍼즐 정답:', res);
        navigation.replace('PuzzleCorrectScreen', {
          result: res,
          isEnd: detail!.endAction,
        });
      }
    } catch (e) {
      // 🔥 여기서 400을 "오답"으로 간주해서 처리
      if (axios.isAxiosError(e) && e.response?.status === 400) {
        const res = e.response.data;

        console.warn('사진 퍼즐 오답(400 응답):', res);
        navigation.replace('PuzzleWrongScreen', {
          result: res,
          from: 'PHOTO_PUZZLE',
        });
      } else {
        console.warn('❌ 사진 퍼즐 정답 체크 실패 (기타 에러):', e);
        // 필요하면 Alert 같은 거 띄워도 됨
      }
    } finally {
      setBusy(false);
    }
  }, [busy, photo, myQuestPlayId, navigation, detail]);

  // ===========================
  // 4. 다시 찍기 → 카메라 재실행
  // ===========================
  const handleRetake = useCallback(async () => {
    setPhoto(null);
    setLoading(true);
    try {
      await openCamera(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===========================
  // 5. 렌더링
  // ===========================
  if (loading || !myQuestPlayId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#61402D" />
      </View>
    );
  }

  if (!photo) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>카메라를 준비 중입니다...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{flex: 1}}>
      <View style={styles.container}>
        {/* 촬영된 이미지 미리보기 */}
        <View style={styles.previewWrapper}>
          <Image source={{uri: photo.uri}} style={styles.previewImage} />
        </View>

        {/* 설명 텍스트 */}
        <Text style={styles.questionText}>이 사진을 제출할까요?</Text>

        {/* 하단 버튼 두 개 */}
        <View style={styles.bottomRow}>
          <Pressable
            style={({pressed}) => [
              styles.bottomButton,
              styles.leftButton,
              (busy || !photo) && styles.bottomButtonDisabled,
              pressed && !busy && photo && {opacity: 0.7},
            ]}
            disabled={busy || !photo}
            onPress={handleSubmitPhoto}>
            <Text style={styles.bottomButtonText}>
              {busy ? '확인 중...' : '맞춰보기'}
            </Text>
          </Pressable>

          <Pressable
            style={({pressed}) => [
              styles.bottomButton,
              styles.rightButton,
              pressed && {opacity: 0.7},
            ]}
            onPress={handleRetake}>
            <Text style={styles.bottomButtonText}>다시찍기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#61402D',
    fontSize: 16,
  },
  previewWrapper: {
    width: width * 0.8,
    height: height * 0.45,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#00000020',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  questionText: {
    marginTop: 24,
    fontSize: 18,
    color: '#61402D',
    fontWeight: '500',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  leftButton: {
    marginRight: 8,
    backgroundColor: '#61402D',
  },
  rightButton: {
    marginLeft: 8,
    backgroundColor: '#8C7560',
  },
  bottomButtonDisabled: {
    backgroundColor: '#8C7560',
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
