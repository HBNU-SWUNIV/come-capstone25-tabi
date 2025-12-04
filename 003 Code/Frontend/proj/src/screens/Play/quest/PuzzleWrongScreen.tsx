// src/screens/Play/Quest/PuzzleWrongScreen.tsx
import React, {useCallback} from 'react';
import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import LoadingCircleCountDown from '../../../components/LoadingCircleCountDown';

import SADOWL from '../../../characters/sad_owl.png';

const {width} = Dimensions.get('window');

// どの画面から来たかを表すフラグ
type FromScreen = 'INPUT_PUZZLE' | 'LOCATION_PUZZLE' | 'PHOTO_PUZZLE';

type RouteParams = {
  from?: FromScreen;
  // result?: AnswerCheckResponse みたいな感じで必要なら型を追記
};

export default function PuzzleWrongScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const from = params?.from;

  // ▶ カウントダウン終了後、元のパズル画面へ戻る
  const handleFinish = useCallback(() => {
    // from がない場合はフォールバックで単純に goBack
    if (!from) {
      navigation.goBack();
      return;
    }

    let targetScreen: string;

    switch (from) {
      case 'INPUT_PUZZLE':
        targetScreen = 'InputPuzzleScreen';
        break;
      case 'LOCATION_PUZZLE':
        targetScreen = 'LocationPuzzleScreen';
        break;
      case 'PHOTO_PUZZLE':
        // 写真系はカメラ画面に戻す or PhotoPuzzleScreen に戻すなど
        targetScreen = 'PhotoPuzzleCameraScreen';
        break;
      default:
        navigation.goBack();
        return;
    }

    // 元のパズル画面へ置き換えナビゲーション
    navigation.replace(targetScreen as never);
  }, [navigation, from]);

  return (
    <View style={styles.container}>
      {/* 좌상단 카운트다운 (3초) */}
      <LoadingCircleCountDown initialCount={3} onFinish={handleFinish} />

      <View style={styles.inner}>
        <Image source={SADOWL} style={styles.characterImage} />

        <Text style={[styles.resultText, styles.wrongText]}>오답</Text>

        <View style={styles.messageWrapper}>
          <Text style={styles.messageText}>다시 한번 생각해볼까요?</Text>
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
  wrongText: {
    color: '#FF4D6A',
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
