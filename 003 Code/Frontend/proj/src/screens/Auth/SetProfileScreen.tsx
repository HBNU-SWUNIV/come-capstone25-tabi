import React, {useContext, useEffect, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {checkNicknameDuplicate, createProfile} from '../../api/profile';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// 프로필 사진 동적 반영을 위한 객체
import {characterImageMap} from '../../characters/profileImages';
import {AuthContext} from '../../context/AuthContent';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');
const InitialNicknameStatus = `닉네임은 영어 대소문자, "." 와 "_" 만 사용할 수 있어요`;

function SetProfileScreen() {
  const navigation = useNavigation<any>();
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState(InitialNicknameStatus);
  const [isRed, setIsRed] = useState(true);
  const [selectedImageName, setSelectedImageName] = useState('owl_1.png');

  const route = useRoute<any>();
  const {setHasProfile} = useContext(AuthContext);

  useEffect(() => {
    if (route.params?.imageName) {
      setSelectedImageName(route.params.imageName);
    }
  }, [route.params?.imageName]);

  const handleCreateProfile = async () => {
    try {
      await createProfile(nickname, selectedImageName);
      setHasProfile(true);
      navigation.replace('MainTabs');
    } catch (err: any) {
      console.error('프로필 생성 실패', err);
      Alert.alert(
        '프로필 생성 실패',
        '잠시 후 다시 시도해주세요.',
        [{text: '확인'}],
        {cancelable: true},
      );
    }
  };

  const handleDuplicateCheck = async () => {
    if (!nickname.trim()) {
      setNicknameStatus('빈칸 입력은 안돼요!');
      setIsNicknameValid(false);
      setIsRed(true);
      return;
    }

    const nicknameRegex = /^[a-zA-Z0-9._]+$/;
    if (!nicknameRegex.test(nickname)) {
      setNicknameStatus(InitialNicknameStatus);
      setIsNicknameValid(false);
      setIsRed(true);
      return;
    }

    try {
      await checkNicknameDuplicate(nickname);
      setNicknameStatus('사용 가능해요!');
      setIsNicknameValid(true);
      setIsRed(false);
    } catch (error: any) {
      setNicknameStatus(error.message);
      setIsNicknameValid(false);
      setIsRed(true);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={60}>
          <View style={styles.headerContainer}>
            <HeaderIcon />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text
                style={
                  styles.titleText
                }>{`여러분의 멋진 프로필을\n작성해주세요!`}</Text>
              <Text style={styles.brownLightText}>
                {`프로필 사진과 닉네임을 설정해주세요!\n프로필 사진과 닉네임은 추후에 또 변경 가능하답니다!`}
              </Text>
            </View>

            <View style={styles.content}>
              {/* 프로필 이미지 등록 버튼 */}
              <View style={styles.rainbowWrapper}>
                <LinearGradient
                  colors={['#E35959', '#DDE65C', '#6679DA']}
                  style={styles.rainbowCircle}>
                  <Pressable
                    style={styles.innerCircle}
                    onPress={() => {
                      navigation.navigate('SetProfileImage');
                    }}>
                    <Image
                      source={characterImageMap[selectedImageName]}
                      style={styles.image}
                    />
                    <Text style={styles.imageLabel}>이미지 설정</Text>
                  </Pressable>
                </LinearGradient>
              </View>

              {/* 닉네임 입력창 + 중복확인 버튼 */}
              <View>
                <View style={styles.nicknameInputWrapper}>
                  <View style={{flex: 1}}>
                    <FloatingLabelInput
                      label="닉네임"
                      value={nickname}
                      onChangeText={text => {
                        setNickname(text);
                        setIsNicknameValid(false);
                        setIsRed(true);
                        setNicknameStatus(InitialNicknameStatus);
                      }}
                      maxLength={24}
                      autoCapitalize="none"
                      autoCorrect={false}
                      containerStyle={{marginBottom: 0}}
                    />
                  </View>
                  <Pressable
                    style={styles.checkButton}
                    onPress={() => {
                      if (!isNicknameValid) {
                        handleDuplicateCheck();
                      }
                    }}>
                    {isNicknameValid ? (
                      <Icon name="checkmark" size={15} color="#fff" />
                    ) : (
                      <Text style={styles.checkButtonText}>중복확인</Text>
                    )}
                  </Pressable>
                </View>

                {!!nicknameStatus && (
                  <View style={styles.nicknameStatusTextContainer}>
                    <Icon
                      name="alert-circle"
                      size={12}
                      color={isRed ? '#EB3F56' : '#6A994E'}
                      style={{marginRight: 2}}
                    />
                    <Text
                      style={[
                        styles.errorText,
                        isRed ? {color: '#D9534F'} : {color: '#6A994E'},
                      ]}>
                      {nicknameStatus}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {isNicknameValid ? (
          <View style={styles.footer}>
            <Pressable
              style={styles.completeButton}
              onPress={handleCreateProfile}>
              <Text style={styles.completeButtonText}>시작하기</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingTop: 10,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  content: {
    justifyContent: 'center',
  },
  rainbowWrapper: {
    alignItems: 'center',
    marginVertical: 30,
  },
  rainbowCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ECE9E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 6,
  },
  imageLabel: {
    color: '#61402D',
    fontSize: 12,
    fontWeight: '500',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#61402D',
  },
  brownLightText: {
    color: '#61402D',
    fontWeight: '300',
    fontSize: 12,
  },
  nicknameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', // 인풋과 버튼 수직 정렬
    marginBottom: 4,
    gap: 10,
  },
  nicknameStatusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkButton: {
    backgroundColor: '#61402D',
    height: 30,
    width: 70,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '300',
  },
  errorText: {
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ECE9E1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#61402D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SetProfileScreen;
