import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState, useEffect} from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloatingLabelInput from '../../../../components/FloatingLabelInput';
import {SafeAreaView} from 'react-native-safe-area-context';

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {color: '#ddd'};

export default function SetQuestTitleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [title, setTitle] = useState('');

  // ✅ 기존 저장된 제목 불러오기
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('quest_final_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.questTitle) setTitle(parsed.questTitle);
        }
      } catch (e) {
        console.log('[SetQuestTitleScreen] load error', e);
      }
    })();
  }, []);

  const handleNext = async () => {
    if (!title.trim()) {
      Alert.alert('안내', '퀘스트 제목을 입력해주세요');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('quest_final_data');
      const prev = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem(
        'quest_final_data',
        JSON.stringify({...prev, questTitle: title}),
      );
      navigation.navigate('QuestSetDescription');
    } catch (e) {
      console.log('[SetQuestTitleScreen] save error', e);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.brownLightText}>
            {`퀘스트의 제목을 설정해주세요! 반드시 적어야 해요.`}
          </Text>
        </View>

        <View style={styles.contentWrapper}>
          <FloatingLabelInput
            label="퀘스트 제목"
            value={title}
            onChangeText={setTitle}
          />
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
                style={[
                  styles.createBtnText,
                  pressed && pressedButtonTextStyle,
                ]}>
                다음
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
  brownLightText: {
    color: '#61402D',
    fontWeight: '300',
    fontSize: 12,
  },
  contentWrapper: {
    marginTop: 40,
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
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
