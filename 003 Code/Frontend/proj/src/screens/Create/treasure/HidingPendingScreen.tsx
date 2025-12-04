import React, {useEffect, useState} from 'react';
import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';
import LoadingCircle from '../../../components/LoadingCircle';
import Pickaxe from '../../../img/pickaxe.png';
import Mappin from '../../../img/map_pin_dynamic.png';
import Lightning from '../../../img/lightning.png';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTreasure} from '../../../context/TreasureContext';
import LoadingCircleCountDown from '../../../components/LoadingCircleCountDown';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width, height} = Dimensions.get('window');

export default function HidingPendingScreen() {
  const [isPendingHiding, setIsPendingHiding] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const {treasure} = useTreasure();
  const isFailed = treasure.latitude == null || treasure.longitude == null;

  useEffect(() => {
    const timeout1 = setTimeout(() => {
      setIsPendingHiding(true);
      const timeout2 = setTimeout(() => {
        navigation.replace('TreasureSetVisible');
      }, 2000);
      return () => clearTimeout(timeout2);
    }, 1500);
    return () => clearTimeout(timeout1);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{flex: 1}}>
      <View style={styles.container}>
        {!isPendingHiding ? (
          <>
            <LoadingCircle onFinish={() => {}} />
            <Image source={Pickaxe} style={styles.imag} />
            <Text style={styles.text}>
              {`보물을 숨기고 있어요\n잠시만 기다려주세요!`}
            </Text>
          </>
        ) : isFailed ? (
          <>
            <Image source={Lightning} style={styles.imag} />
            <Text style={styles.text}>
              {`보물 숨기기에 실패했어요\n잠시 후 다시 시도해주세요!`}
            </Text>
          </>
        ) : (
          <>
            <LoadingCircleCountDown onFinish={() => {}} initialCount={2} />
            <Image source={Mappin} style={styles.imag} />
            <Text style={styles.text}>
              {`해당 위치에 보물을 잘 숨겼어요!\n다른 사용자가 보물을 찾을거에요!`}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE9E1',
    position: 'relative',
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
});
