import React, {useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
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
} from 'react-native';
import {Modalize} from 'react-native-modalize';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import SelectModal from '../../components/SelectModal';
import {useSignUp} from '../../context/SignUpContext';

const steps = [
  {key: 'name', label: '이름을 알려주세요', type: 'text', placeholder: '이름'},
  {
    key: 'birth',
    label: '생일을 알려주세요',
    type: 'text',
    placeholder: '생년월일',
  },
  {
    key: 'gender',
    label: '성별을 알려주세요',
    type: 'select',
    options: ['남성', '여성'],
    placeholder: '성별',
  },
  {
    key: 'carrier',
    label: '통신사를 알려주세요',
    type: 'select',
    options: ['SKT', 'KT', 'LGU+', 'SKT 알뜰폰', 'KT 알뜰폰', 'LGU+ 알뜰폰'],
    placeholder: '통신사',
  },
  {
    key: 'phone',
    label: '전화번호를 입력해주세요',
    type: 'text',
    placeholder: '휴대전화 번호',
  },
];

function SignUpProfile() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{[key: string]: string}>({});
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectOptions, setSelectOptions] = useState<
    {label: string; value: string}[]
  >([]);
  const selectModalRef = useRef<Modalize>(null);
  const prevBirthRef = useRef('');
  const navigation = useNavigation<any>();
  const {update} = useSignUp();

  const handleNext = () => {
    const currentKey = steps[currentStep].key;
    const value = formData[currentKey];

    if (currentKey === 'gender') {
      update({gender: value === '남성'});
    } else if (currentKey === 'name') {
      update({username: value});
    } else if (currentKey === 'carrier') {
      update({mobileCarrier: value});
    } else if (currentKey === 'phone') {
      update({phoneNumber: value});
    } else if (currentKey === 'birth') {
      try {
        const isoBirth = new Date(value).toISOString();
        update({birth: isoBirth});
      } catch {
        console.warn('Invalid birth date:', value);
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigation.navigate('SignUpAccount');
    }
  };

  const handleChange = (key: string, value: string) => {
    let newValue = value;

    if (key === 'birth') {
      const prev = prevBirthRef.current;
      const isDeleting = value.length < prev.length;
      const digits = value.replace(/\D/g, '');

      if (isDeleting) {
        newValue = digits;
      } else {
        if (digits.length <= 4) {
          newValue = digits;
        } else if (digits.length <= 6) {
          newValue = `${digits.slice(0, 4)}-${digits.slice(4)}`;
        } else {
          newValue = `${digits.slice(0, 4)}-${digits.slice(
            4,
            6,
          )}-${digits.slice(6, 8)}`;
        }
      }
      prevBirthRef.current = newValue;
    }

    setFormData(prev => ({...prev, [key]: newValue}));
  };

  const openModal = (options: string[], key: string) => {
    setSelectOptions(options.map(opt => ({label: opt, value: opt})));
    setSelectedFieldKey(key);
    selectModalRef.current?.open();
  };

  const renderInput = (step: (typeof steps)[number]) => {
    const value = formData[step.key] || '';
    const isSelect = step.type === 'select';

    return (
      <FloatingLabelInput
        label={step.placeholder}
        value={value}
        onChangeText={text => handleChange(step.key, text)}
        keyboardType={
          step.key === 'phone' || step.key === 'birth'
            ? 'number-pad'
            : 'default'
        }
        selectMode={isSelect}
        onPress={
          isSelect ? () => openModal(step.options || [], step.key) : undefined
        }
        isModalOpen={selectedFieldKey === step.key}
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

          <SelectModal
            ref={selectModalRef}
            title={steps.find(s => s.key === selectedFieldKey)?.label || ''}
            options={selectOptions}
            selectedValue={formData[selectedFieldKey || ''] || ''}
            onSelect={value => {
              if (selectedFieldKey) {
                handleChange(selectedFieldKey, value);
              }
              selectModalRef.current?.close();
            }}
          />
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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

export default SignUpProfile;
