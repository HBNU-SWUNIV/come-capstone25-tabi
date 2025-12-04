// src/screens/QuestTypeSelection.tsx
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CHECKED_RADIO from '../../img/checked_radio.png';
import UNCHECKED_RADIO from '../../img/unchecked_radio.png';
import {createQuestPostInitial} from '../../api/questPost';
import {Header} from '@react-navigation/stack';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');
const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {color: '#ddd'};
const pressedRadioTextStyle = {fontWeight: 'bold' as const};

export default function QuestTypeSelection() {
  const [selectedType, setSelectedType] = useState<'quest' | 'treasure' | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // ✅ 앱 진입 시 이전 퀘스트 확인
  useEffect(() => {
    const checkPreviousQuest = async () => {
      try {
        const savedId = await AsyncStorage.getItem('currentQuestId');
        if (savedId) {
          Alert.alert(
            '이전 퀘스트 발견',
            '이전에 작성 중이던 퀘스트가 있습니다.\n이어서 작성하시겠습니까?',
            [
              {
                text: '새로 만들기',
                style: 'destructive',
                onPress: async () => {
                  await AsyncStorage.removeItem('currentQuestId');
                },
              },
              {
                text: '이어서 하기',
                onPress: () => {
                  navigation.navigate('SpotList', {questId: Number(savedId)});
                },
              },
            ],
          );
        }
      } catch (e) {
        console.log('[checkPreviousQuest error]', e);
      }
    };
    checkPreviousQuest();
  }, [navigation]);

  // ✅ "다음" 버튼 처리
  const handleNext = async () => {
    if (!selectedType || loading) return;

    if (selectedType === 'quest') {
      try {
        setLoading(true);
        const {questPostId, questId} = await createQuestPostInitial();

        // ✅ 로컬에 퀘스트 ID, 퀘스트 포스트 ID 저장
        await AsyncStorage.multiSet([
          ['currentQuestId', String(questId)],
          ['currentQuestPostId', String(questPostId)],
        ]);

        navigation.navigate('SetQuestLocation', {questId});
      } catch (e: any) {
        console.log('[initial-setting error]', e?.message ?? e);
        Alert.alert('오류', '퀘스트 초기 설정 생성 중 문제가 발생했습니다');
      } finally {
        setLoading(false);
      }
    } else if (selectedType === 'treasure') {
      navigation.navigate('TreasureCreation');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      <Text style={styles.brownTitleText}>어떤 퀘스트를 만들고 싶나요?</Text>
      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          <Pressable
            onPress={() => setSelectedType('quest')}
            disabled={loading}>
            <View style={styles.radioContainer}>
              <Text
                style={[
                  styles.brownPlainText,
                  selectedType === 'quest' && pressedRadioTextStyle,
                ]}>
                퀘스트 만들기
              </Text>
              <Image
                source={
                  selectedType === 'quest' ? CHECKED_RADIO : UNCHECKED_RADIO
                }
                style={styles.radioBtn}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setSelectedType('treasure')}
            disabled={loading}>
            <View style={styles.radioContainer}>
              <Text
                style={[
                  styles.brownPlainText,
                  selectedType === 'treasure' && pressedRadioTextStyle,
                ]}>
                보물 찾기
              </Text>
              <Image
                source={
                  selectedType === 'treasure' ? CHECKED_RADIO : UNCHECKED_RADIO
                }
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
            pressed && !!selectedType && !loading && pressedButtonStyle,
            (!selectedType || loading) && {opacity: 0.5},
          ]}
          onPress={handleNext}
          disabled={!selectedType || loading}>
          {({pressed}) => (
            <Text
              style={[
                styles.createBtnText,
                pressed && !!selectedType && !loading && pressedButtonTextStyle,
              ]}>
              {loading ? '처리 중…' : '다음'}
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
    paddingVertical: 30,
    backgroundColor: '#ECE9E1',
    paddingTop: height * 0.06,
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  brownTitleText: {
    color: '#61402D',
    fontSize: 25,
    fontWeight: '500',
    marginLeft: 20,
  },
  brownPlainText: {color: '#61402D', fontSize: 18, fontWeight: '500'},
  contentWrapper: {height: 300},
  contentContainer: {flexDirection: 'column', gap: 20},
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
