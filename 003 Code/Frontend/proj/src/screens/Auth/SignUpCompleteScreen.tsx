import React, {useContext} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import HEART from '../../img/heart_dynamic.png';
import {useSignUp} from '../../context/SignUpContext';
import {AuthContext} from '../../context/AuthContent';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');

function SignUpCompleteScreen() {
  const navigation = useNavigation<any>();
  const {data} = useSignUp();
  const {login} = useContext(AuthContext);
  const {email, password} = data;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      <View style={styles.content}>
        <Image source={HEART} style={styles.heart} />
        <Text style={styles.messageText}>
          {`여러분의 소중한\nTaBi 계정이 생성되었어요!`}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={async () => {
            try {
              if (!email || !password) {
                Alert.alert('로그인 실패', '이메일 또는 비밀번호가 없습니다.');
                return;
              }
              await login(email, password);
              navigation.replace('ProfileStacks');
            } catch (e) {
              Alert.alert('로그인 실패', '자동 로그인에 실패했습니다.');
            }
          }}>
          <Text style={styles.buttonText}>프로필 설정하기</Text>
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

export default SignUpCompleteScreen;
