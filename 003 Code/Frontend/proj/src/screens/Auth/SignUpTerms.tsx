import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import CHECKED_RADIO from '../../img/checked_radio.png';
import UNCHECKED_RADIO from '../../img/unchecked_radio.png';
import {useNavigation} from '@react-navigation/native';

function SignUpTerms() {
  const navigation = useNavigation<any>();
  const [agreedAll, setAgreedAll] = useState(false);
  const [showError, setShowError] = useState(false);

  const toggleAgreeAll = () => {
    setAgreedAll(prev => !prev);
  };

  return (
    <View style={styles.mainContainer}>
      {/* 상단 텍스트 */}
      <View style={styles.headerSection}>
        <Text style={styles.brownTitleText}>원활한 TaBi 사용을 위해</Text>
        <Text style={styles.brownTitleText}>모든 약관에 동의해주세요!</Text>
        <View style={styles.subTitleWrapper}>
          <Text style={styles.brownLightText}>
            설명과 약관을 모두 읽어주세요!
          </Text>
        </View>
      </View>

      {/* 체크 및 약관 내용 */}
      <View style={styles.contentSection}>
        <Pressable onPress={toggleAgreeAll}>
          <View style={styles.agreeAllWrapper}>
            <Image
              source={agreedAll ? CHECKED_RADIO : UNCHECKED_RADIO}
              style={styles.checkboxIcon}
            />
            <Text style={styles.brownSubTitleText}>전체 동의하기</Text>
          </View>
        </Pressable>

        <View style={styles.brownLine} />

        <Pressable
          onPress={() =>
            navigation.navigate('TermsDetail', {termType: 'service'})
          }>
          <View style={styles.termDetailBtnWrapper}>
            <Text style={styles.grayText}>{'\u2022'} 서비스 이용약관 동의</Text>
            <Icon name="chevron-forward" size={16} color="#A19E9E" />
          </View>
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate('TermsDetail', {termType: 'privacy'})
          }>
          <View style={styles.termDetailBtnWrapper}>
            <Text style={styles.grayText}>
              {'\u2022'} 개인정보 수집 및 이용 동의
            </Text>
            <Icon name="chevron-forward" size={16} color="#A19E9E" />
          </View>
        </Pressable>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footerSection}>
        {showError && (
          <View style={styles.errorMessageWrapper}>
            <Icon
              name="alert-circle"
              size={16}
              color="#EB3F56"
              style={{marginRight: 6}}
            />
            <Text style={styles.errorMessage}>
              모든 약관에 동의해야 서비스를 사용할 수 있습니다.
            </Text>
          </View>
        )}
        <Pressable
          style={styles.nextButton}
          onPress={() => {
            if (!agreedAll) {
              setShowError(true);
              return;
            }
            setShowError(false);
            navigation.navigate('SignUpProfile');
          }}>
          <Text style={styles.nextButtonText}>다음</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 40,
  },
  headerSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  contentSection: {
    flex: 3,
    justifyContent: 'flex-start',
    marginTop: 40,
  },
  footerSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  subTitleWrapper: {
    marginVertical: 5,
  },
  brownTitleText: {
    color: '#61402D',
    fontWeight: '500',
    fontSize: 25,
  },
  brownSubTitleText: {
    color: '#61402D',
    fontWeight: '500',
    fontSize: 20,
  },
  brownLightText: {
    color: '#61402D',
    fontWeight: '300',
    fontSize: 12,
  },
  grayText: {
    color: '#4D4D4D',
    fontSize: 16,
    fontWeight: '300',
  },
  brownLine: {
    backgroundColor: '#61402D',
    height: 2,
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
  },
  termDetailBtnWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  agreeAllWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  nextButton: {
    backgroundColor: '#61402D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorMessageWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#EB3F56',
    fontSize: 13,
  },
});

export default SignUpTerms;
