import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import CHECKED_RADIO from '../../../img/checked_radio.png';
import UNCHECKED_RADIO from '../../../img/unchecked_radio.png';
import {useTreasure} from '../../../context/TreasureContext';
import {SafeAreaView} from 'react-native-safe-area-context';

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {
  color: '#ddd',
};
const pressedRadioTextStyle = {
  fontWeight: 'bold' as const,
};

export default function SetVisibleScreen() {
  const {treasure, setTreasure} = useTreasure();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleSelect = (isPublic: boolean) => {
    setTreasure(prev => ({...prev, isPublic}));
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.brownLightText}>
          {`보물지도를 공개할지 설정 해주세요!\n보물지도가 공개되면 다른 사람들이 찾을 수 있어요.`}
        </Text>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          <Pressable onPress={() => handleSelect(true)}>
            <View style={styles.radioContainer}>
              <Text
                style={[
                  styles.brownPlainText,
                  treasure.isPublic && pressedRadioTextStyle,
                ]}>
                공개
              </Text>
              <Image
                source={treasure.isPublic ? CHECKED_RADIO : UNCHECKED_RADIO}
                style={styles.radioBtn}
              />
            </View>
          </Pressable>

          <Pressable onPress={() => handleSelect(false)}>
            <View style={styles.radioContainer}>
              <Text
                style={[
                  styles.brownPlainText,
                  !treasure.isPublic && pressedRadioTextStyle,
                ]}>
                비공개
              </Text>
              <Image
                source={!treasure.isPublic ? CHECKED_RADIO : UNCHECKED_RADIO}
                style={styles.radioBtn}
              />
            </View>
          </Pressable>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          style={({pressed}) => [
            styles.createBtn,
            pressed && pressedButtonStyle,
          ]}
          onPress={() => navigation.navigate('TreasureSetTitle')}>
          {({pressed}) => (
            <Text
              style={[styles.createBtnText, pressed && pressedButtonTextStyle]}>
              다음
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 30,
    backgroundColor: '#ECE9E1',
  },
  header: {
    marginTop: 10,
    marginLeft: 46,
  },
  brownTitleText: {
    color: '#61402D',
    fontSize: 25,
    fontWeight: '500',
  },
  brownPlainText: {
    color: '#61402D',
    fontSize: 18,
    fontWeight: '500',
  },
  brownLightText: {
    color: '#61402D',
    fontWeight: '300',
    fontSize: 12,
  },
  contentWrapper: {
    paddingTop: 60,
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'column',
    gap: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginLeft: 20,
    marginRight: 20,
  },
  radioBtn: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  footer: {
    alignItems: 'center',
  },
  createBtn: {
    backgroundColor: '#61402D',
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
