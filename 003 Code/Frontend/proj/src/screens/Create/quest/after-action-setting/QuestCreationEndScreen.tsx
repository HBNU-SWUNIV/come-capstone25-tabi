// src/screens/Quest/QuestCreationEndScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import LoadingCircleCountDown from '../../../../components/LoadingCircleCountDown';
import FILE from '../../../../img/file_plus_dynamic.png';
import LIGHTNING from '../../../../img/lightning.png';
import {SafeAreaView} from 'react-native-safe-area-context';
import HeaderIcon from '../../../../components/HeaderIcon';

type RouteParams = {
  ok?: boolean; // ← 이전 화면에서 전달되는 성공/실패 플래그
};

const {width, height} = Dimensions.get('window');

const C = {
  bg: '#ECE9E1',
  brown: '#61402D',
  btn: '#61402D',
  btnPressed: '#503624',
  btnText: '#fff',
};

export default function QuestCreationEndScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const {ok} = (route.params as RouteParams) ?? {};

  // 기본 진입 시 성공/실패 상태만 사용
  const [status] = useState<'success' | 'error'>(ok ? 'success' : 'error');

  useEffect(() => {
    // 성공 시 2초 뒤 자동 이동
    if (status === 'success') {
      const t = setTimeout(() => navigation.replace('CreateIntro'), 2000);
      return () => clearTimeout(t);
    }
  }, [status, navigation]);

  return (
    <SafeAreaView edges={['top']} style={{flex: 1}}>
      <View style={styles.mainContainer}>
        {/* 상단 헤더 */}
        <View style={styles.headerContainer}>
          <HeaderIcon />
        </View>

        {status === 'success' && (
          <LoadingCircleCountDown onFinish={() => {}} initialCount={2} />
        )}

        {/* 중앙 컨텐츠 */}
        <View style={styles.content}>
          {status === 'success' ? (
            <View>
              <Image source={FILE} style={styles.imag} />
              <Text style={styles.text}>
                {`여러분들의 소중한 퀘스트가\n생성 완료 되었습니다!`}
              </Text>
            </View>
          ) : (
            <>
              <Image source={LIGHTNING} style={styles.imag} />
              <Text style={styles.text}>
                {`퀘스트 생성에 실패했어요!\n퀘스트를 다시 설정해주세요!`}
              </Text>
            </>
          )}
        </View>

        {/* 하단 고정 영역: 실패 시에만 버튼 노출 */}
        <View style={styles.footer}>
          {status === 'error' && (
            <Pressable
              style={({pressed}) => [
                styles.retryBtn,
                pressed && {
                  backgroundColor: C.btnPressed,
                  transform: [{scale: 0.97}],
                },
              ]}
              onPress={() => navigation.navigate('SpotList')}>
              {({pressed}) => (
                <Text style={[styles.retryBtnText, pressed && {color: '#ddd'}]}>
                  스팟 리스트로 이동하기
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 상단/중앙/하단 3분할. 하단 버튼 고정
  mainContainer: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 22,
    marginTop: 20,
    textAlign: 'center',
    color: C.brown,
    fontWeight: '300',
  },
  imag: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  retryBtn: {
    backgroundColor: C.btn,
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: C.btnText,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
