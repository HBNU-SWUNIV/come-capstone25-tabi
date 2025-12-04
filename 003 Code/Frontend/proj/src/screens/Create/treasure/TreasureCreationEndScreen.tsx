import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import LoadingCircle from '../../../components/LoadingCircle';
import LoadingCircleCountDown from '../../../components/LoadingCircleCountDown';
import FILE from '../../../img/file_plus_dynamic.png';
import PICKAXE from '../../../img/pickaxe.png';
import Lightning from '../../../img/lightning.png';

import {useTreasure} from '../../../context/TreasureContext';
import {createTreasureHunt} from '../../../api/treasureHuntPost';
import {SafeAreaView} from 'react-native-safe-area-context';
import HeaderIcon from '../../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');

export default function TreasureCreationEndScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {treasure} = useTreasure();

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(
    'pending',
  );

  useEffect(() => {
    const createTreasure = async () => {
      try {
        await createTreasureHunt({
          isPublic: treasure.isPublic,
          treasureHuntTitle: treasure.treasureHuntTitle,
          treasureHuntDescription: treasure.treasureHuntDescription,
          imageInfo: treasure.imageInfo!,
          latitude: treasure.latitude ?? 0,
          longitude: treasure.longitude ?? 0,
          altitude: treasure.altitude ?? 0,
        });

        setStatus('success');

        setTimeout(() => {
          navigation.replace('CreateIntro');
        }, 2000);
      } catch (error) {
        console.error('보물 생성 실패:', error);
        setStatus('error');
      }
    };

    createTreasure();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <View
            style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
            <LoadingCircle onFinish={() => {}} />
            <Image source={PICKAXE} style={styles.imag} />
            <Text style={styles.text}>
              {`흙을 덮는 중이에요\n잠시만 기다려주세요!`}
            </Text>
          </View>
        );
      case 'success':
        return (
          <View
            style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
            <LoadingCircleCountDown onFinish={() => {}} initialCount={2} />
            <Image source={FILE} style={styles.imag} />
            <Text style={styles.text}>
              {`여러분들의 소중한 보물이\n생성 완료 되었습니다!`}
            </Text>
          </View>
        );
      case 'error':
        return (
          <View
            style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
            <Image source={Lightning} style={styles.imag} />
            <Text style={styles.text}>
              {`삽이 부러졌어요...\n잠시 후 다시 시도해주세요`}
            </Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                setStatus('pending');
                // 재시도
                setTimeout(() => {
                  navigation.replace('CreationEnd');
                }, 100);
              }}>
              <Text style={styles.retryBtnText}>다시 시도하기</Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#ECE9E1',
    position: 'relative',
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
  },

  text: {
    fontSize: 22,
    marginTop: 20,
    textAlign: 'center',
    color: '#61402D',
    fontWeight: '300',
  },
  imag: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#61402D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
