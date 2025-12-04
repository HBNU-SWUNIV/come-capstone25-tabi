// src/screens/User/PremiumDrawScreen.tsx

import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState, useCallback} from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {BlurView} from '@react-native-community/blur';

// ✅ 인벤토리 / 뽑기 API
import {getMyInventory, drawCharacters} from '../../api/user';
import type {DrawType} from '../../api/user';

// ✅ 카드 아이콘
import CARD_PREMIUM from '../../img/card-premium.png';
import CARD_NORMAL from '../../img/card-normal.png';

// ✅ 로딩 카운트다운
import LoadingCircleCountDown from '../../components/LoadingCircleCountDown';
import HeaderIcon from '../../components/HeaderIcon';

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

export default function PremiumDrawScreen() {
  const navigation = useNavigation<Nav>();

  // 한국어 주석: 인벤토리 상태
  const [inventory, setInventory] = useState<Inventory | null>(null);

  // 한국어 주석: 선택한 뽑기권 개수
  const [count, setCount] = useState(0);

  // 한국어 주석: 확인 모달 노출 여부
  const [showConfirm, setShowConfirm] = useState(false);

  // 한국어 주석: 뽑기 진행 중(로딩 화면 표시 여부)
  const [isDrawing, setIsDrawing] = useState(false);

  // 한국어 주석: 인벤토리 조회
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyInventory();
        setInventory(data);
      } catch (e) {
        console.log('[PremiumDrawScreen] getMyInventory error', e);
      }
    })();
  }, []);

  const maxCount = inventory?.uniqueCreditCard ?? 0;
  const normalCount = inventory?.normalCreditCard ?? 0;

  // 한국어 주석: 개수 보정 함수 (0 ~ maxCount 사이로 제한)
  const clampCount = useCallback(
    (value: number) => {
      if (value < 0) return 0;
      if (value > maxCount) return maxCount;
      return value;
    },
    [maxCount],
  );

  const handleChange = (delta: number) => {
    setCount(prev => clampCount(prev + delta));
  };

  const handleMin = () => setCount(0);
  const handleMax = () => setCount(maxCount);

  // 한국어 주석: 하단 "뽑기" 버튼 눌렀을 때 → 확인 모달 오픈
  const handleOpenConfirm = () => {
    if (count <= 0) return;
    if (maxCount <= 0) {
      Alert.alert('안내', '사용할 수 있는 고급 캐릭터 뽑기권이 없어요.');
      return;
    }
    setShowConfirm(true);
  };

  // 한국어 주석: 모달 안에서 "뽑기" 최종 확정
  const handleConfirmDraw = async () => {
    setShowConfirm(false);

    if (count <= 0 || maxCount <= 0) {
      return;
    }

    try {
      setIsDrawing(true);

      const drawType: DrawType = 'ADVANCED';

      // 한국어 주석: 최소 2초 대기 + 서버 요청을 동시에 수행
      const [, result] = await Promise.all([
        new Promise<void>(resolve => setTimeout(() => resolve(), 2000)),
        drawCharacters(drawType, count),
      ]);

      // 한국어 주석: 결과 화면으로 이동 (DrawResultScreen 은 네비게이터에 등록 필요)
      navigation.replace('DrawResultScreen', {
        drawType,
        count,
        result,
      });
    } catch (e) {
      console.log('[PremiumDrawScreen] drawCharacters error', e);
      Alert.alert('오류', '뽑기에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDrawing(false);
    }
  };

  const canDraw = count > 0;

  // ================= 로딩 화면 =================
  if (isDrawing) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.loadingMain}>
          {/* 상단 (로고 자리) */}
          <View style={styles.loadingHeader}>
            <HeaderIcon />
          </View>

          <LoadingCircleCountDown
            initialCount={2}
            onFinish={() => {
              // 한국어 주석: 실제 화면 전환은 handleConfirmDraw 안에서 처리하므로 여기서는 아무 것도 안 해도 된다.
            }}
          />

          {/* 중앙 로딩 컨텐츠 */}
          <View style={styles.loadingContent}>
            {/* 한국어 주석: 지금은 카드 이미지를 사용, 추후 모자 이미지로 교체해도 됨 */}
            <Image source={CARD_PREMIUM} style={styles.loadingImage} />
            <Text style={styles.loadingText}>
              {`캐릭터를 뽑고 있어요!\n잠시만 기다려주세요!`}
            </Text>
          </View>

          {/* 하단 여백 */}
          <View style={{height: 40}} />
        </View>
      </SafeAreaView>
    );
  }

  // ================= 메인 화면 =================
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
              뽑기권을 몇개 사용할건지 선택해주세요!
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
              <Text style={styles.ticketSummaryText}>{maxCount}</Text>
            </View>
          </View>
        </View>
        {/* ================= 중앙 뽑기 UI ================= */}
        <View style={styles.centerArea}>
          {/* 뽑기권 카드 이미지 */}
          <Image source={CARD_PREMIUM} style={styles.mainCardImage} />

          {/* 개수 선택 버튼들 */}
          <View style={styles.counterRow}>
            <Pressable
              style={({pressed}) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={handleMin}>
              <Text style={styles.stepBtnText}>MIN</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={() => handleChange(-10)}>
              <Text style={styles.stepBtnText}>-10</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={() => handleChange(-1)}>
              <Text style={styles.stepBtnText}>-1</Text>
            </Pressable>

            {/* 현재 개수 */}
            <Text style={styles.countText}>{count}</Text>

            <Pressable
              style={({pressed}) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={() => handleChange(+1)}>
              <Text style={styles.stepBtnText}>+1</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={() => handleChange(+10)}>
              <Text style={styles.stepBtnText}>+10</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.stepBtn,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={handleMax}>
              <Text style={styles.stepBtnText}>MAX</Text>
            </Pressable>
          </View>
        </View>
        {/* ================= 하단 안내 + 버튼 ================= */}
        <View style={styles.footer}>
          {/* 안내 문구 */}
          <View style={styles.noticeRow}>
            <Icon
              name="alert-circle"
              size={16}
              color={canDraw ? '#D96262' : '#A89C92'}
              style={styles.noticeIcon}
            />
            <Text
              style={[
                styles.noticeText,
                !canDraw && styles.noticeTextDisabled,
              ]}>
              {canDraw
                ? '고급 캐릭터 뽑기권은 2성에서 4성 사이 캐릭터가 확률적으로 나옵니다'
                : '사용할 뽑기권 개수를 먼저 선택해주세요'}
            </Text>
          </View>

          {/* 뽑기 버튼 (항상 렌더, canDraw 아닐 땐 비활성) */}
          <Pressable
            disabled={!canDraw}
            style={({pressed}) => [
              styles.confirmBtn,
              !canDraw && styles.confirmBtnDisabled,
              pressed && canDraw && pressedButtonStyle,
            ]}
            onPress={handleOpenConfirm}>
            {({pressed}) => (
              <Text
                style={[
                  styles.confirmBtnText,
                  !canDraw && styles.confirmBtnTextDisabled,
                  pressed && canDraw && pressedButtonTextStyle,
                ]}>
                뽑기
              </Text>
            )}
          </Pressable>
        </View>
        {/* ================= 확인 모달 ================= */}
        <Modal
          transparent
          visible={showConfirm}
          animationType="fade"
          onRequestClose={() => setShowConfirm(false)}>
          <View style={styles.modalContainer}>
            {/* 한국어 주석: 배경 블러 */}
            <BlurView
              style={styles.modalBlur}
              blurAmount={15}
              blurType="light"
            />

            {/* 한국어 주석: 흰색 박스 */}
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {`고급 뽑기권 ${count}개를 정말 뽑으시겠어요?`}
              </Text>

              <View style={styles.modalButtonRow}>
                <Pressable
                  style={({pressed}) => [
                    styles.modalBtn,
                    styles.modalCancelBtn,
                    pressed && {backgroundColor: '#E3E3E3'},
                  ]}
                  onPress={() => setShowConfirm(false)}>
                  <Text style={styles.modalCancelText}>취소</Text>
                </Pressable>

                <Pressable
                  style={({pressed}) => [
                    styles.modalBtn,
                    styles.modalOkBtn,
                    pressed && {backgroundColor: '#503624'},
                  ]}
                  onPress={handleConfirmDraw}>
                  <Text style={styles.modalOkText}>뽑기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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

  // ----- 중앙 뽑기 UI -----
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCardImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 40,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#61402D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnPressed: {
    backgroundColor: '#503624',
    transform: [{scale: 0.97}],
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  countText: {
    marginHorizontal: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#61402D',
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
  noticeTextDisabled: {
    color: '#A89C92',
  },

  confirmBtn: {
    backgroundColor: '#61402D',
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#C4B7A8',
  },
  confirmBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmBtnTextDisabled: {
    color: '#F2ECE4',
  },

  // ----- 로딩 화면 -----
  loadingMain: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingHeader: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingLogoText: {
    fontSize: 20,
    color: '#61402D',
    fontWeight: '700',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
    color: '#61402D',
    fontWeight: '300',
  },

  // ----- 확인 모달 -----
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    color: '#61402D',
    textAlign: 'center',
    marginBottom: 22,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtn: {
    marginRight: 8,
    backgroundColor: '#F3F3F3',
  },
  modalOkBtn: {
    marginLeft: 8,
    backgroundColor: '#61402D',
  },
  modalCancelText: {
    color: '#61402D',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
