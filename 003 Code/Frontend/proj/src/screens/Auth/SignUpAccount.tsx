import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import {useNavigation} from '@react-navigation/native';
import {useSignUp} from '../../context/SignUpContext';
import {useContext} from 'react';
import {AuthContext} from '../../context/AuthContent';

const steps = [
  {key: 'email', label: '이메일을 알려주세요', placeholder: '이메일'},
  {
    key: 'code',
    label: '이메일로 보낸 인증번호를 입력해주세요',
    placeholder: '인증번호',
  },
  {key: 'password', label: '비밀번호를 입력해주세요', placeholder: '비밀번호'},
  {
    key: 'confirmPassword',
    label: '비밀번호를 다시 한번 입력해주세요',
    placeholder: '비밀번호 확인',
  },
];

function SignUpAccount() {
  const {signUp, sendVerificationCode, verifyCode} = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{[key: string]: string}>({});
  const navigation = useNavigation<any>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {update, data} = useSignUp();

  const handleNext = async () => {
    if (isSubmitting) return;

    const currentKey = steps[currentStep].key;
    const value = formData[currentKey];

    if (currentKey === 'email') update({email: value});
    else if (currentKey === 'password') update({password: value});

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        await signUp({...data, agreement: true});
        navigation.navigate('SignUpComplete');
      } catch (e) {
        navigation.navigate('SignUpFailure');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const handleRequestCode = async () => {
    const email = formData['email'];
    if (!email || !email.includes('@')) {
      Alert.alert('올바른 이메일을 입력해주세요.');
      return;
    }

    try {
      await sendVerificationCode(email);
      Alert.alert('인증번호를 전송했습니다.');
    } catch (err) {
      Alert.alert('인증번호 전송 실패', '이메일 주소를 다시 확인해주세요.');
    }
  };

  const handleVerifyCode = async () => {
    const email = formData['email'];
    const code = formData['code'];

    if (!email || !email.includes('@')) {
      Alert.alert('이메일이 유효하지 않습니다.');
      return;
    }

    if (!code) {
      Alert.alert('인증번호를 입력해주세요.');
      return;
    }

    try {
      await verifyCode(email, code);
      Alert.alert('인증 성공');
    } catch (err) {
      Alert.alert('인증 실패', '인증번호를 다시 확인해주세요.');
    }
  };

  const renderInput = (step: (typeof steps)[number]) => {
    const value = formData[step.key] || '';
    const isPassword =
      step.key === 'password' || step.key === 'confirmPassword';

    if (step.key === 'email') {
      return (
        <View style={styles.rowContainer}>
          <View style={{flex: 1}}>
            <FloatingLabelInput
              label={step.placeholder}
              value={value}
              onChangeText={text => handleChange(step.key, text)}
              keyboardType="email-address"
            />
          </View>
          <Pressable style={styles.verifyButton} onPress={handleRequestCode}>
            <Text style={styles.verifyButtonText}>인증번호 발급</Text>
          </Pressable>
        </View>
      );
    }

    if (step.key === 'code') {
      return (
        <View style={styles.rowContainer}>
          <View style={{flex: 1}}>
            <FloatingLabelInput
              label={step.placeholder}
              value={value}
              onChangeText={text => handleChange(step.key, text)}
              keyboardType="number-pad"
            />
          </View>
          <Pressable style={styles.verifyButton} onPress={handleVerifyCode}>
            <Text style={styles.verifyButtonText}>인증</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FloatingLabelInput
        label={step.placeholder}
        value={value}
        onChangeText={text => handleChange(step.key, text)}
        secureTextEntry={isPassword}
        keyboardType={step.key === 'code' ? 'number-pad' : 'default'}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{steps[currentStep].label}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {steps
              .slice(0, currentStep + 1)
              .reverse()
              .map(step => (
                <View key={step.key} style={styles.inputGroup}>
                  {renderInput(step)}
                </View>
              ))}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>다음</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 60,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#61402D',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 300,
  },
  inputGroup: {
    marginBottom: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  verifyButton: {
    backgroundColor: '#61402D',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '300',
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
  nextButton: {
    backgroundColor: '#61402D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default SignUpAccount;
