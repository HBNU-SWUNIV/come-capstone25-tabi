import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CHECKED_RADIO from '../../../../img/checked_radio.png';
import UNCHECKED_RADIO from '../../../../img/unchecked_radio.png';
import {SafeAreaView} from 'react-native-safe-area-context';

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {color: '#ddd'};
const pressedRadioTextStyle = {fontWeight: 'bold' as const};

export default function SetQuestVisibleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  // ✅ 초기 로드 (이전 단계에서 저장된 값 있을 경우 복원)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('quest_final_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.pub === 'boolean') setIsPublic(parsed.pub);
        }
      } catch (e) {
        console.log('[SetQuestVisibleScreen] load error', e);
      }
    })();
  }, []);

  const handleSelect = async (pub: boolean) => {
    setIsPublic(pub);
    try {
      const stored = await AsyncStorage.getItem('quest_final_data');
      const prev = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem(
        'quest_final_data',
        JSON.stringify({...prev, pub}),
      );
    } catch (e) {
      console.log('[SetQuestVisibleScreen] save error', e);
    }
  };

  const handleNext = async () => {
    if (isPublic === null) {
      Alert.alert('안내', '공개 여부를 선택해주세요');
      return;
    }
    navigation.navigate('QuestSetTitle'); // 다음 화면으로 이동
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.brownLightText}>
          {`퀘스트를 공개할지 설정 해주세요!\n퀘스트가 공개되면 다른 사람들이 플레이할 수 있어요.`}
        </Text>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          <Pressable onPress={() => handleSelect(true)}>
            <View style={styles.radioContainer}>
              <Text
                style={[
                  styles.brownPlainText,
                  isPublic && pressedRadioTextStyle,
                ]}>
                공개
              </Text>
              <Image
                source={isPublic ? CHECKED_RADIO : UNCHECKED_RADIO}
                style={styles.radioBtn}
              />
            </View>
          </Pressable>

          <Pressable onPress={() => handleSelect(false)}>
            <View style={styles.radioContainer}>
              <Text
                style={[
                  styles.brownPlainText,
                  isPublic === false && pressedRadioTextStyle,
                ]}>
                비공개
              </Text>
              <Image
                source={isPublic === false ? CHECKED_RADIO : UNCHECKED_RADIO}
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
          onPress={handleNext}>
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

/* -------------------- Styles -------------------- */
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
  brownPlainText: {color: '#61402D', fontSize: 18, fontWeight: '500'},
  brownLightText: {color: '#61402D', fontWeight: '300', fontSize: 12},
  contentWrapper: {paddingTop: 60, flex: 1},
  contentContainer: {flexDirection: 'column', gap: 20},
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginLeft: 20,
    marginRight: 20,
  },
  radioBtn: {width: 25, height: 25, resizeMode: 'contain'},
  footer: {alignItems: 'center'},
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
