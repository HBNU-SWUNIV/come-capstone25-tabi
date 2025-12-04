// src/screens/Play/Quest/PhotoPuzzleScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  getCurrentDetail,
  readHintSet,
  type CurrentDetailDto,
} from '../../../api/questPlay';
import {getActiveTarget} from '../../../utils/activeTarget';
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

export default function PhotoPuzzleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialDetail = (route.params as RouteParams | undefined)?.detail;

  // --- アクション / クエスト情報 ---
  const [detail, setDetail] = useState<CurrentDetailDto | null>(
    initialDetail ?? null,
  );
  const [myQuestPlayId, setMyQuestPlayId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialDetail);
  const [busy, setBusy] = useState(false);

  // --- ヒントセット ---
  const [hintSet, setHintSet] = useState<HintSet | null>(null);
  const [questHintSaveId, setQuestHintSaveId] = useState<number | null>(null);

  // --- モーダル関連 ---
  const [activeHintIndex, setActiveHintIndex] = useState<HintIndex | null>(
    null,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNeedPrevModal, setShowNeedPrevModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);
  const [modalBusy, setModalBusy] = useState(false);

  const anyModalVisible =
    showConfirmModal || showNeedPrevModal || showHintModal;

  // ===========================
  // 1. 初期データ読み込み
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

        if (!initialDetail) {
          setLoading(true);
          const d = await getCurrentDetail(active.myQuestPlayId);
          setDetail(d);
        } else {
          const maybeId = (initialDetail as any).questHintSaveId as
            | number
            | undefined;
          if (maybeId) {
            setQuestHintSaveId(maybeId);
          }
        }
      } catch (e) {
        console.warn('❌ PhotoPuzzleScreen 초기 로드 실패:', e);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation, initialDetail]);

  // questHintSaveId がセットされたらサーバーからヒントを取得
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
        console.warn('❌ ヒントセット取得失敗:', e);
      }
    })();
  }, [questHintSaveId]);

  // ===========================
  // 2. ヒントヘルパー
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
    if (idx === 1) return true;
    if (idx === 2) return isHintUnlocked(1);
    if (idx === 3) return isHintUnlocked(2);
    return false;
  };

  // ===========================
  // 3. ヒントボタン押下
  // ===========================
  const handleHintPress = async (idx: HintIndex) => {
    if (!detail) return;
    setActiveHintIndex(idx);

    if (isHintUnlocked(idx)) {
      setShowHintModal(true);
      return;
    }

    if (!canPurchaseHint(idx)) {
      setShowNeedPrevModal(true);
      return;
    }

    try {
      setModalBusy(true);
      const inv = await getMyInventory();
      setCoins(inv.coins ?? 0);
    } catch (e) {
      console.warn('❌ インベントリ取得失敗:', e);
    } finally {
      setModalBusy(false);
    }
    setShowConfirmModal(true);
  };

  // ===========================
  // 4. ヒント購入
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
        console.warn('⚠️ ヒント購入失敗:', res.errorMessage);
        setShowConfirmModal(false);
        return;
      }

      setQuestHintSaveId(res.questHintSaveId);
      setShowConfirmModal(false);
      setShowHintModal(true);
    } catch (e) {
      console.warn('❌ ヒント購入エラー:', e);
    } finally {
      setModalBusy(false);
    }
  };

  // ===========================
  // 5. モーダル閉じる
  // ===========================
  const closeAllModals = () => {
    setShowConfirmModal(false);
    setShowNeedPrevModal(false);
    setShowHintModal(false);
    setActiveHintIndex(null);
  };

  // ===========================
  // 6. レンダリング
  // ===========================
  if (loading || !detail || !myQuestPlayId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#61402D" />
      </View>
    );
  }

  const stepsCardText = '조건에 맞는\n사진을 찍어보자!';
  const currentHintText =
    activeHintIndex && getHintTextByIndex(activeHintIndex);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{flex: 1}}>
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerText}>수수께끼를 풀어보자</Text>
        </View>
      </View>
      <View style={styles.container}>
        <View style={styles.inner}>
          {/* 上部グラデーションカード */}
          <LinearGradient
            colors={['#F9CACA', '#E4DBC2', '#C0D8AD']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.stepCard}>
            <Text style={styles.cardTitle}>{stepsCardText}</Text>
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

          {/* ヒントラベル */}
          <Text style={styles.hintLabel}>힌트</Text>

          {/* ヒントボタン */}
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
                  onPress={() => handleHintPress(i)}>
                  <Text style={styles.hintNumber}>{i}</Text>
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

          {/* 하단 사진찍기 버튼 */}
          <View style={styles.bottomButtonWrapper}>
            <Pressable
              style={({pressed}) => [
                styles.bottomButton,
                busy && styles.bottomButtonDisabled,
                pressed && !busy && {opacity: 0.7},
              ]}
              disabled={busy}
              onPress={() =>
                navigation.navigate('PhotoPuzzleCameraScreen', {
                  myQuestPlayId: myQuestPlayId,
                  detail: detail,
                })
              }>
              <Text style={styles.bottomButtonText}>
                {busy ? '준비 중...' : '사진찍기'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ======= 공통 모달 오버레이 ======= */}
        {anyModalVisible && (
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <BlurView
              style={StyleSheet.absoluteFillObject}
              blurType="light"
              blurAmount={12}
              reducedTransparencyFallbackColor="#00000040"
            />
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

            {/* 선행 힌트 안내 모달 */}
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
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: width * 0.9,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    textAlign: 'center',
  },
  characterWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
  },
  hintLabel: {
    marginTop: 12,
    fontSize: 16,
    color: '#61402D',
  },
  hintRow: {
    flexDirection: 'row',
    marginTop: 8,
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
  hintModalCard: {
    width: '80%',
    minHeight: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(61,61,61,0.8)',
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
