// src/screens/Play/Quest/InputPuzzleScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  getCurrentDetail,
  getNextLocationInfo,
  checkPuzzleAnswer,
  readHintSet,
  type CurrentDetailDto,
} from '../../../api/questPlay';
import {getActiveTarget} from '../../../utils/activeTarget';
import {saveUnfinishedQuest} from '../../../utils/unfinishedQuestStore';
import {getMyInventory} from '../../../api/user';
import {purchaseHint} from '../../../api/questPlay';
import COIN from '../../../img/coin.png';

import DUMMY from '../../../characters/owl_1.png';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getLocalProfileImage} from '../../../characters/profileImages';

const {width} = Dimensions.get('window');

type RouteParams = {
  detail?: CurrentDetailDto;
};

type HintIndex = 1 | 2 | 3;

type HintSet = {
  questHintSaveId: number;
  hintOne: string | null;
  hintTwo: string | null;
  hintThree: string | null;
};

export default function InputPuzzleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialDetail = (route.params as RouteParams | undefined)?.detail;

  // --- 액션 / 퀘스트 정보 ---
  const [detail, setDetail] = useState<CurrentDetailDto | null>(
    initialDetail ?? null,
  );
  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialDetail);
  const [busy, setBusy] = useState(false);

  // --- 정답 입력값 ---
  const [answer, setAnswer] = useState('');

  // --- 힌트 세트 상태 ---
  const [hintSet, setHintSet] = useState<HintSet | null>(null);
  const [questHintSaveId, setQuestHintSaveId] = useState<number | null>(null);

  // --- 모달 / 힌트 관련 상태 ---
  const [activeHintIndex, setActiveHintIndex] = useState<HintIndex | null>(
    null,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false); // 구매 확인 모달
  const [showNeedPrevModal, setShowNeedPrevModal] = useState(false); // "이전 힌트 먼저" 모달
  const [showHintModal, setShowHintModal] = useState(false); // 힌트 내용 모달
  const [coins, setCoins] = useState<number | null>(null); // 내 코인 수량
  const [modalBusy, setModalBusy] = useState(false); // 모달 내 로딩

  const anyModalVisible =
    showConfirmModal || showNeedPrevModal || showHintModal;

  // ===========================
  // 1. 초기 데이터 로딩
  // ===========================
  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveTarget();
        if (!active?.myQuestPlayId) {
          console.warn('❌ myQuestPlayId 없음 → 이전 화면으로 복귀');
          navigation.goBack();
          return;
        }
        setMyQuestPlayId(active.myQuestPlayId);

        // detail 이 없으면 서버에서 현재 액션 상세 조회
        if (!initialDetail) {
          setLoading(true);
          const d = await getCurrentDetail(active.myQuestPlayId);
          setDetail(d);
          // (선택) d.questHintSaveId 같은 필드가 있다면 여기서 초기 힌트 세트도 로딩 가능
          // if (d.questHintSaveId) { ... }
        } else {
          // route 로 넘어온 detail 에 힌트 저장 ID 가 들어있는 경우
          const maybeId = (initialDetail as any).questHintSaveId as
            | number
            | undefined;
          if (maybeId) {
            setQuestHintSaveId(maybeId);
          }
        }
      } catch (e) {
        console.warn('❌ InputPuzzleScreen 초기 로드 실패:', e);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, initialDetail]);

  // questHintSaveId 가 셋팅되면 서버에서 힌트 세트 조회
  useEffect(() => {
    (async () => {
      if (!questHintSaveId) return;
      try {
        const data = await readHintSet(questHintSaveId);
        setHintSet({
          questHintSaveId: data.questHintSaveId,
          hintOne: data.hintOne ?? null,
          hintTwo: data.hintTwo ?? null,
          hintThree: data.hintThree ?? null,
        });
      } catch (e) {
        console.warn('❌ 힌트 세트 조회 실패:', e);
      }
    })();
  }, [questHintSaveId]);

  // ===========================
  // 2. 공통: actionType → 화면 매핑
  // ===========================
  const mapActionToScreen = (type: CurrentDetailDto['actionType']) => {
    switch (type) {
      case 'TALKING':
        return 'DialogScreen';
      case 'STAYING':
        return 'StayScreen';
      case 'WALKING':
        return 'StepScreen';
      case 'PHOTO_PUZZLE':
        return 'PhotoPuzzleScreen';
      case 'LOCATION_PUZZLE':
        return 'LocationPuzzleScreen';
      case 'INPUT_PUZZLE':
        return 'InputPuzzleScreen';
      default:
        return null;
    }
  };

  // ===========================
  // 3. 정답 제출
  // ===========================
  const handleSubmitAnswer = useCallback(async () => {
    if (busy) return;
    if (!detail || !myQuestPlayId) return;
    if (!answer.trim()) return; // 빈 문자열 방지

    setBusy(true);
    Keyboard.dismiss();

    try {
      const res = await checkPuzzleAnswer(myQuestPlayId, {
        actionType: 'INPUT_PUZZLE',
        submissionAnswerString: answer.trim(),
      });

      if (res.answered) {
        navigation.replace('PuzzleCorrectScreen', {
          result: res,
          isEnd: detail.endAction,
        });
      } else {
        navigation.replace('PuzzleWrongScreen', {
          result: res,
          from: 'INPUT_PUZZLE',
        });
      }
    } catch (e) {
      console.warn('❌ 정답 체크 실패:', e);
    } finally {
      setBusy(false);
    }
  }, [busy, detail, myQuestPlayId, answer, navigation]);

  // ===========================
  // 4. endAction 처리 (지금은 PuzzleCorrect/ Wrong 쪽에서 이어가기)
  //    필요 시 별도 handleNext 로직 추가 가능
  // ===========================

  // ===========================
  // 5. 힌트 헬퍼
  // ===========================
  const getHintTextByIndex = (idx: HintIndex): string | null => {
    if (!hintSet) return null;
    if (idx === 1) return hintSet.hintOne;
    if (idx === 2) return hintSet.hintTwo;
    return hintSet.hintThree;
  };

  const isHintUnlocked = (idx: HintIndex) => {
    return !!getHintTextByIndex(idx);
  };

  const canPurchaseHint = (idx: HintIndex) => {
    // 1번은 무조건 구매 가능
    if (idx === 1) return true;
    // 2,3 은 바로 이전 힌트가 열려 있어야 함
    if (idx === 2) return isHintUnlocked(1);
    if (idx === 3) return isHintUnlocked(2);
    return false;
  };

  // ===========================
  // 6. 힌트 버튼 터치 처리
  // ===========================
  const handleHintPress = async (idx: HintIndex) => {
    if (!detail) return;
    setActiveHintIndex(idx);

    // 이미 구매된 힌트라면 → 힌트 내용 모달
    if (isHintUnlocked(idx)) {
      setShowHintModal(true);
      return;
    }

    // 아직 잠겨 있고, 선행 힌트가 필요한데 없을 때
    if (!canPurchaseHint(idx)) {
      setShowNeedPrevModal(true);
      return;
    }

    // 정상적인 구매 플로우 → 코인 조회 후 구매 확인 모달
    try {
      setModalBusy(true);
      const inv = await getMyInventory();
      setCoins(inv.coins ?? 0);
    } catch (e) {
      console.warn('❌ 인벤토리 조회 실패:', e);
    } finally {
      setModalBusy(false);
    }
    setShowConfirmModal(true);
  };

  // ===========================
  // 7. 힌트 구매 처리
  // ===========================
  const handlePurchaseHint = async () => {
    if (!detail || !activeHintIndex) return;
    if (modalBusy) return;
    setModalBusy(true);

    try {
      const body = {
        questCurrentPointId: (detail as any).questCurrentPointId as number,
        purchaseHintIndex: activeHintIndex,
      };
      const res = await purchaseHint(body);

      if (res.errorMessage) {
        console.warn('⚠️ 힌트 구매 실패:', res.errorMessage);
        setShowConfirmModal(false);
        return;
      }

      // questHintSaveId 업데이트 후 힌트 세트 재조회
      setQuestHintSaveId(res.questHintSaveId);
      // 이미 서버에서 구매한 힌트를 읽어올 것이므로, 바로 힌트 내용 모달도 열어줌
      setShowConfirmModal(false);
      setShowHintModal(true);
    } catch (e) {
      console.warn('❌ 힌트 구매 에러:', e);
    } finally {
      setModalBusy(false);
    }
  };

  // ===========================
  // 8. 모달 공통 닫기
  // ===========================
  const closeAllModals = () => {
    setShowConfirmModal(false);
    setShowNeedPrevModal(false);
    setShowHintModal(false);
    setActiveHintIndex(null);
  };

  // ===========================
  // 9. 렌더링
  // ===========================
  if (loading || !detail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#61402D" />
      </View>
    );
  }

  const stepsCardText = '정답은...!';

  const currentHintText =
    activeHintIndex && getHintTextByIndex(activeHintIndex);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{flex: 1}}>
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerText}>수수께끼를 풀어보자</Text>
        </View>
      </View>
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* 상단 그라데이션 카드 */}
          <LinearGradient
            colors={['#F9CACA', '#E4DBC2', '#C0D8AD']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.stepCard}>
            <Text style={styles.cardTitle}>{stepsCardText}</Text>

            {/* 정답 입력 인풋 */}
            <TextInput
              style={styles.answerInput}
              value={answer}
              onChangeText={setAnswer}
              placeholder="..."
              placeholderTextColor="#777"
              textAlign="center"
              onPressIn={e => e.stopPropagation()}
              // 키보드 입력이 카드 외부 터치에 의해 닫히도록
            />
          </LinearGradient>

          {/* 캐릭터 영역 */}
          <View style={styles.characterWrapper}>
            {(() => {
              const char = getLocalProfileImage(detail.characterImageUrl);
              return (
                <Image
                  source={char}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              );
            })()}
          </View>

          {/* 힌트 라벨 */}
          <Text style={styles.hintLabel}>힌트</Text>

          {/* 힌트 버튼 3개 */}
          <View style={styles.hintRow}>
            {[1, 2, 3].map(idx => {
              const i = idx as HintIndex;
              const unlocked = isHintUnlocked(i);
              const bgColor =
                i === 1 ? '#C0AD58' : i === 2 ? '#98982C' : '#478C77';

              return (
                <Pressable
                  key={i}
                  style={({pressed}) => [
                    styles.hintBadge,
                    {backgroundColor: bgColor},
                    pressed && {opacity: 0.8},
                  ]}
                  onPress={e => {
                    e.stopPropagation(); // 배경 Pressable 로 이벤트 전파 방지
                    handleHintPress(i);
                  }}>
                  <Text style={styles.hintNumber}>{i}</Text>
                  {/* 잠겨 있으면 자물쇠 아이콘 */}
                  {!unlocked && (
                    <Icon
                      name="lock-closed"
                      size={12}
                      color="#333"
                      style={styles.hintLockIcon}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* 하단 맞춰보기 버튼 */}
          <View style={styles.bottomButtonWrapper}>
            <Pressable
              style={({pressed}) => [
                styles.bottomButton,
                (!answer.trim() || busy) && styles.bottomButtonDisabled,
                pressed && answer.trim() && !busy && {opacity: 0.7},
              ]}
              disabled={!answer.trim() || busy}
              onPress={e => {
                e.stopPropagation();
                handleSubmitAnswer();
              }}>
              <Text style={styles.bottomButtonText}>
                {busy ? '확인 중...' : '맞춰보기'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ======= 공통 모달 오버레이 ======= */}
        {anyModalVisible && (
          <View style={styles.modalOverlay} pointerEvents="box-none">
            {/* 배경 블러 */}
            <BlurView
              style={StyleSheet.absoluteFillObject}
              blurType="light"
              blurAmount={12}
              reducedTransparencyFallbackColor="#00000040"
            />
            {/* 배경 터치 시 닫기 */}
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={closeAllModals}
            />

            {/* 구매 확인 모달 */}
            {showConfirmModal && activeHintIndex && (
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <View style={{flex: 1}} />
                  <View style={styles.coinRow}>
                    <Image source={COIN} style={styles.coinImg} />
                    <Text style={styles.coinText}>
                      {coins != null ? coins : '...'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalMainText}>
                  {`힌트 ${activeHintIndex}을(를) 보시겠어요?`}
                </Text>
                <Text style={styles.modalSubText}>
                  {`${activeHintIndex}코인이 소모 됩니다!`}
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={closeAllModals}
                    disabled={modalBusy}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={handlePurchaseHint}
                    disabled={modalBusy}>
                    <Text style={styles.modalConfirmText}>
                      {modalBusy ? '구매 중...' : '구매하기'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* 선행 힌트 구매 안내 모달 */}
            {showNeedPrevModal && activeHintIndex && (
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <View style={{flex: 1}} />
                  <View style={styles.coinRow}>
                    <Icon name="logo-bitcoin" size={18} color="#C2A64A" />
                    <Text style={styles.coinText}>
                      {coins != null ? coins : ''}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalMainText}>
                  {`힌트 ${activeHintIndex - 1}을 먼저 구매해주세요!`}
                </Text>

                <View
                  style={[styles.modalButtonRow, {justifyContent: 'flex-end'}]}>
                  <Pressable
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={closeAllModals}>
                    <Text style={styles.modalConfirmText}>돌아가기</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* 힌트 내용 모달 */}
            {showHintModal && activeHintIndex && (
              <View style={styles.hintModalCard}>
                <Text style={styles.hintModalTitle}>
                  {`힌트 ${activeHintIndex}`}
                </Text>
                <Text style={styles.hintModalBody}>
                  {currentHintText ?? '힌트 내용을 불러오지 못했습니다.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ECE9E1',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrapper: {
    borderBottomColor: '#61402D',
    borderBottomWidth: 2,
  },
  headerText: {
    color: '#61402D',
    fontSize: 20,
    fontWeight: '600',
  },
  // 전체 배경
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 가운데 정렬용 래퍼
  inner: {
    width: width * 0.9,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  // 로딩 화면
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 상단 그라데이션 카드
  stepCard: {
    width: '80%',
    height: 160,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -40,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  // 정답 입력 인풋
  answerInput: {
    width: '80%',
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
    fontSize: 20,
    paddingVertical: 6,
    color: '#424242',
  },

  // 캐릭터 영역
  characterWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
  },

  // 힌트 라벨
  hintLabel: {
    marginTop: 30,
    fontSize: 24,
    color: '#61402D',
  },

  // 힌트 버튼 행
  hintRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  hintBadge: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  hintNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hintLockIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },

  // 하단 맞춰보기 버튼
  bottomButtonWrapper: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  bottomButton: {
    backgroundColor: '#61402D',
    width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  bottomButtonDisabled: {
    backgroundColor: '#8C7560',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ===== 모달 공통 =====
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImg: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  coinText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#61402D',
    fontWeight: '600',
  },
  modalMainText: {
    fontSize: 16,
    color: '#61402D',
    textAlign: 'center',
    marginTop: 4,
  },
  modalSubText: {
    fontSize: 14,
    color: '#61402D',
    textAlign: 'center',
    marginTop: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    marginRight: 8,
    backgroundColor: '#F1F1F1',
  },
  modalConfirmButton: {
    marginLeft: 8,
    backgroundColor: '#61402D',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#61402D',
    fontWeight: '500',
  },
  modalConfirmText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 힌트 내용 모달
  hintModalCard: {
    width: '80%',
    minHeight: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(61,61,61,0.8)', // 3D3D3D + 80% 투명도 느낌
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  hintModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  hintModalBody: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
});
