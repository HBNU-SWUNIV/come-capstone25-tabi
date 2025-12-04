import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import WHITE_PLANE from '../../img/plane_white.png';
import GOOGLE from '../../img/logo_google.png';
import KAKAO from '../../img/logo_kakao.png';
import LINE from '../../img/logo_line.png';
import {AuthContext} from '../../context/AuthContent';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {login} = useContext(AuthContext);
  const navigation = useNavigation<any>();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.headerContainer}>
          <HeaderIcon />
        </View>
        {/* 상단 탭 */}
        <View style={styles.tabContainer}>
          <View style={styles.tabWrapper}>
            <Pressable onPress={() => setIsLogin(false)} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  !isLogin ? styles.activeTabText : styles.inactiveTabText,
                ]}>
                회원가입
              </Text>
              {!isLogin && <View style={styles.underline} />}
            </Pressable>
            <Pressable onPress={() => setIsLogin(true)} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  isLogin ? styles.activeTabText : styles.inactiveTabText,
                ]}>
                로그인
              </Text>
              {isLogin && <View style={styles.underline} />}
            </Pressable>
          </View>
        </View>

        {/* 내용 */}
        <View style={styles.content}>
          {isLogin ? (
            <>
              <View style={styles.inputWrapper}>
                <FloatingLabelInput
                  label="이메일"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputWrapper}>
                <FloatingLabelInput
                  label="비밀번호"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <Pressable
                style={styles.loginButton}
                onPress={() => {
                  login(email, password);
                  console.log(email, password);
                }}>
                <Image source={WHITE_PLANE} style={styles.logoImage} />
                <Text style={styles.loginButtonText}>로그인</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.signupGuideContainer}>
                <Text style={styles.signupGuide}>
                  회원가입 방식을 선택해주세요!
                </Text>
              </View>
              <Pressable
                style={[styles.socialButton, {backgroundColor: '#61402D'}]}
                onPress={() => navigation.navigate('SignUpTerms')}>
                <Image source={WHITE_PLANE} style={styles.logoImage} />
                <View style={styles.buttonTextWrapper}>
                  <Text style={styles.registerTabiText}>TaBi</Text>
                  <Text style={[styles.whiteButtonText, {marginBottom: 2}]}>
                    로 회원가입 하기
                  </Text>
                </View>
              </Pressable>
            </>
          )}

          {/* 공통 소셜 버튼 */}
          <Pressable
            style={[styles.socialButton, {backgroundColor: '#dddddd'}]}>
            <Image source={GOOGLE} style={styles.logoImage} />
            <View style={styles.buttonTextWrapper}>
              <Text style={styles.registerGoogleText}>Google</Text>
              <Text style={styles.blackButtonText}>
                로 {isLogin ? '로그인' : '회원가입'} 하기
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.socialButton, {backgroundColor: '#FEE500'}]}>
            <Image source={KAKAO} style={styles.logoImage} />
            <View style={styles.buttonTextWrapper}>
              <Text style={styles.registerKakaoText}>Kakao</Text>
              <Text style={styles.brownButtonText}>
                로 {isLogin ? '로그인' : '회원가입'} 하기
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.socialButton, {backgroundColor: '#00C300'}]}>
            <Image source={LINE} style={styles.logoImage} />
            <View style={styles.buttonTextWrapper}>
              <Text style={styles.registerLineText}>LINE</Text>
              <Text style={styles.whiteButtonText}>
                으로 {isLogin ? '로그인' : '회원가입'} 하기
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: height * 0.06,
    alignItems: 'center',
    backgroundColor: '#ECE9E1',
    minHeight: height,
    paddingBottom: 50,
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: height * 0.1,
    paddingTop: 10,
  },

  tabContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  tabWrapper: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  tab: {
    paddingVertical: 10,
    alignItems: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 16,
    marginBottom: 4,
  },
  activeTabText: {
    color: '#61402D',
    fontWeight: 'bold',
  },
  inactiveTabText: {
    color: '#bbb',
  },
  underline: {
    height: 2,
    width: '100%',
    backgroundColor: '#61402D',
    position: 'absolute',
    bottom: -1,
    left: 0,
  },
  content: {
    width: width * 0.8,
    alignItems: 'center',
    marginBottom: 30,
  },
  inputWrapper: {
    width: '100%',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#61402D',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerTabiText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Madimi One',
  },
  registerGoogleText: {
    color: '#3C3C3C',
    fontSize: 18,
    fontWeight: '600',
  },
  registerKakaoText: {
    color: '#3E2723',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLineText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  whiteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
  blackButtonText: {
    color: '#3c3c3c',
    fontSize: 14,
    fontWeight: '400',
  },
  brownButtonText: {
    color: '#3E2723',
    fontSize: 14,
    fontWeight: '400',
  },
  logoImage: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
    marginRight: 5,
  },
  socialButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  signupGuideContainer: {
    paddingTop: 30,
  },
  signupGuide: {
    marginBottom: 20,
    fontSize: 16,
    color: '#61402D',
    fontWeight: '600',
  },
});
