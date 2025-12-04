import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useTreasure} from '../../../context/TreasureContext';
import FloatingLabelInput from '../../../components/FloatingLabelInput'; // 경로에 맞게 수정
import {SafeAreaView} from 'react-native-safe-area-context';

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {
  color: '#ddd',
};

export default function SetDescriptionScreen() {
  const {treasure, setTreasure} = useTreasure();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.brownLightText}>
            {`보물찾기의 설명을 설정해주세요!\n보물찾기의 설명은 필수는 아니지만 보물찾기의 힌트를 적어도 좋아요.`}
          </Text>
        </View>

        <View style={styles.contentWrapper}>
          <FloatingLabelInput
            label="보물찾기 설명"
            value={treasure.treasureHuntDescription}
            onChangeText={text =>
              setTreasure(prev => ({...prev, treasureHuntDescription: text}))
            }
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({pressed}) => [
              styles.createBtn,
              pressed && pressedButtonStyle,
            ]}
            onPress={() => navigation.navigate('TreasureSetThumbnail')}>
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
  brownTitleText: {
    color: '#61402D',
    fontSize: 25,
    fontWeight: '500',
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
