// src/screens/Character/SelectDrawTicketScreen.tsx

import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// ✅ 인벤토리 API
import {getMyInventory} from '../../api/user';

// ✅ 라디오/카드 아이콘 (경로는 프로젝트 구조에 맞게 조정)
import CHECKED_RADIO from '../../img/checked_radio.png';
import UNCHECKED_RADIO from '../../img/unchecked_radio.png';
import CARD_PREMIUM from '../../img/card-premium.png';
import CARD_NORMAL from '../../img/card-normal.png';

type Inventory = {
  myInventoryId: number;
  coins: number;
  uniqueCreditCard: number; // 고급
  normalCreditCard: number; // 일반
};

type Nav = NativeStackNavigationProp<any>;

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {color: '#ddd'};
const pressedRadioTextStyle = {fontWeight: 'bold' as const};

export default function CharacterDrawScreen() {
  const navigation = useNavigation<Nav>();

  // 어떤 뽑기권을 선택했는지 상태
  const [selectedTicket, setSelectedTicket] = useState<
    'premium' | 'normal' | null
  >(null);

  // 인벤토리 정보
  const [inventory, setInventory] = useState<Inventory | null>(null);

  // 최초 마운트 시 인벤토리 조회
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyInventory();
        setInventory(data);
      } catch (e) {
        console.log('[SelectDrawTicketScreen] getMyInventory error', e);
        // 실패해도 화면은 그대로 사용 가능하도록 둔다.
      }
    })();
  }, []);

  // 라디오 선택 처리
  const handleSelect = (type: 'premium' | 'normal') => {
    setSelectedTicket(type);
  };

  // 선택 완료 버튼 처리
  const handleConfirm = () => {
    if (!selectedTicket) return;

    if (selectedTicket === 'premium') {
      const count = inventory?.uniqueCreditCard ?? 0;
      if (count <= 0) {
        Alert.alert('안내', '사용할 수 있는 고급 캐릭터 뽑기권이 없어요.');
        return;
      }
      navigation.navigate('PremiumDrawScreen');
    } else {
      const count = inventory?.normalCreditCard ?? 0;
      if (count <= 0) {
        Alert.alert('안내', '사용할 수 있는 일반 캐릭터 뽑기권이 없어요.');
        return;
      }
      navigation.navigate('NormalDrawScreen');
    }
  };

  // 선택된 뽑기권에 따라 하단 안내 문구 생성
  const getNoticeText = () => {
    if (selectedTicket === 'premium') {
      return '고급 캐릭터 뽑기권은 2성에서 4성 사이 캐릭터가 확률적으로 나옵니다';
    }
    if (selectedTicket === 'normal') {
      return '일반 캐릭터 뽑기권은 1성에서 4성 사이 캐릭터가 확률적으로 나옵니다';
    }
    return '';
  };

  const premiumCount = inventory?.uniqueCreditCard ?? 0;
  const normalCount = inventory?.normalCreditCard ?? 0;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* ================= 헤더 ================= */}
        <View style={styles.headerRow}>
          {/* 뒤로가기 버튼 */}

          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color="#61402D" />
          </Pressable>

          {/* 타이틀 + 서브텍스트 */}
          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>캐릭터 뽑기</Text>
            <Text style={styles.headerSubtitle}>
              어떤 캐릭터 뽑기권을 사용할지 골라주세요!
            </Text>
          </View>

          {/* 인벤토리 요약 (우측 상단) */}
          <View style={styles.headerInventoryBox}>
            {/* 일반 뽑기권 */}
            <View style={styles.ticketSummaryRow}>
              <Image source={CARD_NORMAL} style={styles.ticketSummaryIcon} />
              <Text style={styles.ticketSummaryText}>{normalCount}</Text>
            </View>

            {/* 고급 뽑기권 */}
            <View style={styles.ticketSummaryRow}>
              <Image source={CARD_PREMIUM} style={styles.ticketSummaryIcon} />
              <Text style={styles.ticketSummaryText}>{premiumCount}</Text>
            </View>
          </View>
        </View>

        {/* ================= 라디오 선택 영역 ================= */}
        <View style={styles.contentWrapper}>
          <View style={styles.radioGroup}>
            {/* 일반 캐릭터 뽑기권 */}
            <Pressable onPress={() => handleSelect('normal')}>
              <View style={styles.radioRow}>
                <View style={styles.radioLeft}>
                  <Image source={CARD_NORMAL} style={styles.ticketIcon} />
                  <Text
                    style={[
                      styles.radioLabel,
                      selectedTicket === 'normal' && pressedRadioTextStyle,
                    ]}>
                    일반 캐릭터 뽑기권
                  </Text>
                </View>
                <Image
                  source={
                    selectedTicket === 'normal'
                      ? CHECKED_RADIO
                      : UNCHECKED_RADIO
                  }
                  style={styles.radioIcon}
                />
              </View>
            </Pressable>

            {/* 고급 캐릭터 뽑기권 */}
            <Pressable onPress={() => handleSelect('premium')}>
              <View style={styles.radioRow}>
                <View style={styles.radioLeft}>
                  <Image source={CARD_PREMIUM} style={styles.ticketIcon} />
                  <Text
                    style={[
                      styles.radioLabel,
                      selectedTicket === 'premium' && pressedRadioTextStyle,
                    ]}>
                    고급 캐릭터 뽑기권
                  </Text>
                </View>
                <Image
                  source={
                    selectedTicket === 'premium'
                      ? CHECKED_RADIO
                      : UNCHECKED_RADIO
                  }
                  style={styles.radioIcon}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ================= 하단 안내 + 버튼 ================= */}
        <View style={styles.footer}>
          {selectedTicket && (
            <>
              {/* 안내 문구 */}
              <View style={styles.noticeRow}>
                <Icon
                  name="alert-circle"
                  size={16}
                  color="#D96262"
                  style={styles.noticeIcon}
                />
                <Text style={styles.noticeText}>{getNoticeText()}</Text>
              </View>

              {/* 선택 완료 버튼 */}
              <Pressable
                style={({pressed}) => [
                  styles.confirmBtn,
                  pressed && pressedButtonStyle,
                ]}
                onPress={handleConfirm}>
                {({pressed}) => (
                  <Text
                    style={[
                      styles.confirmBtnText,
                      pressed && pressedButtonTextStyle,
                    ]}>
                    선택완료
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ================= 스타일 ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ECE9E1',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 30,
    backgroundColor: '#ECE9E1',
  },

  // ----- 헤더 -----
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  backButton: {
    paddingRight: 6,
  },
  headerTextBox: {
    flex: 1,
    paddingLeft: 4,
  },
  headerTitle: {
    color: '#61402D',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#61402D',
    fontSize: 12,
    fontWeight: '300',
  },
  headerInventoryBox: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketSummaryIcon: {
    width: 28,
    height: 18,
    resizeMode: 'contain',
    marginRight: 4,
  },
  ticketSummaryText: {
    color: '#61402D',
    fontSize: 13,
    fontWeight: '600',
  },

  // ----- 라디오 영역 -----
  contentWrapper: {
    flex: 1,
    marginTop: 80,
  },
  radioGroup: {
    flexDirection: 'column',
    gap: 24,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIcon: {
    width: 52,
    height: 34,
    resizeMode: 'contain',
    marginRight: 16,
  },
  radioLabel: {
    color: '#61402D',
    fontSize: 18,
    fontWeight: '500',
  },
  radioIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },

  // ----- 하단 안내 + 버튼 -----
  footer: {
    alignItems: 'center',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 24,
  },
  noticeIcon: {
    marginRight: 4,
  },
  noticeText: {
    color: '#61402D',
    fontSize: 11,
  },
  confirmBtn: {
    backgroundColor: '#61402D',
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
