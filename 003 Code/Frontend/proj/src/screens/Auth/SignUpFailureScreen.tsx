import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import HEART from '../../img/heart_dynamic.png';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');

function SignUpFailureScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      <View style={styles.content}>
        <Image source={HEART} style={styles.heart} />
        <Text
          style={
            styles.messageText
          }>{`TaBi 계정 생성에 실패했어요\n다시 시도해 주세요`}</Text>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => navigation.replace('Auth')}>
          <Text style={styles.buttonText}>다시하러 가기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    paddingTop: height * 0.06,
  },
  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  messageText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#61402D',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#61402D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignUpFailureScreen;
