import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloatingLabelInput from '../../../../components/FloatingLabelInput';
import {SafeAreaView} from 'react-native-safe-area-context';

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {color: '#ddd'};

export default function SetQuestDescriptionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [description, setDescription] = useState('');

  // ✅ 기존 저장값 프리필
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('quest_final_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.questDescription) setDescription(parsed.questDescription);
        }
      } catch (e) {
        console.log('[SetQuestDescription] load error', e);
      }
    })();
  }, []);

  const handleNext = async () => {
    try {
      const stored = await AsyncStorage.getItem('quest_final_data');
      const prev = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem(
        'quest_final_data',
        JSON.stringify({...prev, questDescription: description}),
      );
      navigation.navigate('QuestSetEstimatedTime');
    } catch (e) {
      console.log('[SetQuestDescription] save error', e);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.brownLightText}>
            {`퀘스트의 설명을 적어주세요! 필수는 아니지만 적어주면 더욱 좋아요`}
          </Text>
        </View>

        <View style={styles.contentWrapper}>
          <FloatingLabelInput
            label="퀘스트 설명"
            value={description}
            onChangeText={setDescription}
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
  brownLightText: {color: '#61402D', fontWeight: '300', fontSize: 12},
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
