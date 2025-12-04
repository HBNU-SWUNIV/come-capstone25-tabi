// src/screens/Play/Quest/PuzzleCorrectScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getCurrentDetail,
  getCurrentLocationInfo,
  type CurrentDetailDto,
  type LocationInfoDto,
} from '../../../api/questPlay';
import {getActiveTarget} from '../../../utils/activeTarget';
import LoadingCircleCountDown from '../../../components/LoadingCircleCountDown';

import HAPPYOWL from '../../../characters/owl_1.png';

const {width} = Dimensions.get('window');

type RouteParams = {
  result?: any; // AnswerCheckResponse 같은 타입 들어올 예정
  isEnd?: boolean; // detail.endAction 값
};

export default function PuzzleCorrectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const isEnd = params?.isEnd ?? false;

  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(null);

  // actionType → 화면 매핑
  const mapActionToScreen = (type: CurrentDetailDto['actionType']) => {
    switch (type) {
      case 'TALKING':
        return 'DialogScreen';
      case 'STAYING':
        return 'StayScreen';
      case 'WALKING':
        return 'StepScreen';
      case 'PHOTO_PUZZLE':
        return 'PhotoPuzzleScreen';
      case 'LOCATION_PUZZLE':
        return 'LocationPuzzleScreen';
      case 'INPUT_PUZZLE':
        return 'InputPuzzleScreen';
      default:
        return null;
    }
  };

  // 진입 시 activeTarget 에서 myQuestPlayId 가져오기
  useEffect(() => {
    (async () => {
      const active = await getActiveTarget();
      if (!active?.myQuestPlayId) {
        navigation.goBack();
        return;
      }
      setMyQuestPlayId(active.myQuestPlayId);
    })();
  }, [navigation]);

  // 카운트다운 종료 후 처리
  const handleFinish = useCallback(async () => {
    if (!myQuestPlayId) {
      navigation.goBack();
      return;
    }

    try {
      if (!isEnd) {
        // ===========================
        // endAction === false
        // → 같은 위치 안에서 다음 액션으로 진행
        // ===========================
        const next = await getCurrentDetail(myQuestPlayId);
        const screenName = mapActionToScreen(next.actionType);

        if (screenName) {
          navigation.replace(screenName, {detail: next});
        } else {
          navigation.goBack();
        }
      } else {
        // ===========================
        // endAction === true
        // → 위치 단위로는 마지막 액션
        //    현재 실행해야 할 위치 정보를 조회하고,
        //    endLocation 여부에 따라 분기
        // ===========================
        const loc: LocationInfoDto = await getCurrentLocationInfo(
          myQuestPlayId,
        );

        if (loc.endLocation) {
          // 이 위치가 퀘스트의 마지막 위치 → 바로 클리어 화면
          navigation.replace('QuestClearScreen', {locationInfo: loc});
        } else {
          // 아직 마지막 위치는 아님
          // 여기서 "다음 위치로 이동 안내" 화면으로 보내거나
          // 퀘스트 메인 화면으로 돌려보내는 등 추후 설계 가능
          // 일단은 뒤로 보내두자
          navigation.goBack();
        }
      }
    } catch (e) {
      console.warn('❌ PuzzleCorrect 다음 단계 처리 실패:', e);
      navigation.goBack();
    }
  }, [myQuestPlayId, navigation, isEnd]);

  return (
    <View style={styles.container}>
      <LoadingCircleCountDown initialCount={3} onFinish={handleFinish} />

      <View style={styles.inner}>
        <Image source={HAPPYOWL} style={styles.characterImage} />

        <Text style={[styles.resultText, styles.correctText]}>정답!</Text>

        <View style={styles.messageWrapper}>
          <Text style={styles.messageText}>잘했어요!</Text>
          <Text style={styles.messageText}>정말 똑똑하군요?</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: width * 0.9,
    alignItems: 'center',
  },
  characterImage: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 24,
  },
  correctText: {
    color: '#3D7BFF',
  },
  messageWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 18,
    color: '#4A4036',
    lineHeight: 26,
  },
});
