// src/screens/User/UserProfileScreen.tsx

import React, {useContext, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {BlurView} from '@react-native-community/blur';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {AuthContext} from '../../context/AuthContent';

// ✅ 퀘스트 / 보물찾기 API
import {
  getMyCreatedQuests,
  getMySavedQuests,
  getMyRunningQuests,
  getMyTerminatedQuests,
} from '../../api/myQuest';
import {
  getMyCreatedTreasureHunts,
  getMySavedTreasureHunts,
  getMyRunningTreasureHunt,
  getMyTerminatedTreasureHunts,
  type MyTreasureHuntPost,
} from '../../api/myTreasure';

// ✅ 팔로우 관련 API
import {getMyFollowers, getMyFollowings} from '../../api/follow';

// ✅ 캐릭터 관련 API & 유틸
import {getMyCharacters, getMyProfile} from '../../api/profile';
import {characterImageMap} from '../../characters/profileImages';
import {characterNameMap} from '../../characters/characterNameMap';

// Dummy
import PROFILE_IMG from '../../img/hanbat_logo.png';
import WALLET_ICON from '../../img/wallet-gradient.png';
import CARD_IMAGE from '../../img/card-dynamic-gradient.png';
import COIN from '../../img/coin.png';
import CARD_NORMAL from '../../img/card-normal.png';
import CARD_PREMIUM from '../../img/card-premium.png';
import PLANE from '../../img/plane_brown.png';
import {getMyInventory, getUserIdApi} from '../../api/user';

const {width} = Dimensions.get('window');

type Character = {
  characterId: number;
  characterName: string;
  rank: number;
  characterURL: string;
};

type Inventory = {
  myInventoryId: number;
  coins: number;
  uniqueCreditCard: number;
  normalCreditCard: number;
};

export default function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const {logout} = useContext(AuthContext);

  // 모달
  const [modalVisible, setModalVisible] = useState(false);

  // 상위 탭
  const [mainTab, setMainTab] = useState<'quest' | 'treasure' | 'character'>(
    'quest',
  );

  // 하위 탭
  const subTabsQuest = [
    '제작한 퀘스트',
    '저장한 퀘스트',
    '실행중인 퀘스트',
    '종료된 퀘스트',
  ];
  const subTabsTreasure = [
    '제작한 보물찾기',
    '저장한 보물찾기',
    '실행중인 보물찾기',
    '종료된 보물찾기',
  ];
  const subTabsCharacter = ['수집한 캐릭터', '캐릭터 뽑기'];

  const [subTab, setSubTab] = useState(subTabsQuest[0]);

  const getSubTabs = () => {
    if (mainTab === 'quest') return subTabsQuest;
    if (mainTab === 'treasure') return subTabsTreasure;
    return subTabsCharacter;
  };

  const isCharacterDraw = mainTab === 'character' && subTab === '캐릭터 뽑기';
  const isCollectedCharacter =
    mainTab === 'character' && subTab === '수집한 캐릭터';

  // 설정 아이콘 → 바로 로그아웃
  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('로그아웃 되었습니다');
    } catch (err) {
      Alert.alert('로그아웃 실패', '다시 시도해주세요.');
    }
  };

  // ====================== 프로필 상단 카운트 상태 ======================
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [nickname, setNickname] = useState('Unknown');

  // 프로필 카드용 카운트 로드 (마운트 시 1회)
  useEffect(() => {
    (async () => {
      try {
        const [
          createdQuests,
          createdTreasureRes,
          followers,
          followings,
          myProfile,
        ] = await Promise.all([
          getMyCreatedQuests(), // QuestPostDto[]
          getMyCreatedTreasureHunts(), // AxiosResponse<MyTreasureHuntPost[]>
          getMyFollowers(), // FollowRow[]
          getMyFollowings(), // FollowRow[]
          getMyProfile(), //
        ]);

        const createdTreasure = createdTreasureRes.data ?? [];

        const questLen = createdQuests?.length ?? 0;
        const treasureLen = createdTreasure?.length ?? 0;
        const nickname = myProfile?.nickName ?? 'Unknown';

        setPostCount(questLen + treasureLen);
        setFollowerCount(followers?.length ?? 0);
        setFollowingCount(followings?.length ?? 0);
        setNickname(nickname);
      } catch (e) {
        console.error('[UserProfile] load profile counters error:', e);
      }
    })();
  }, []);

  // ====================== 인벤토리 상태 (모달용) ======================
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // 모달이 열릴 때마다 인벤토리 조회
  useEffect(() => {
    if (!modalVisible) return;

    (async () => {
      try {
        setInventoryLoading(true);
        setInventoryError(null);
        const data = await getMyInventory();
        setInventory(data);
      } catch (e) {
        console.error('[UserProfile] getMyInventory error:', e);
        setInventoryError('보유 재화를 불러오지 못했습니다.');
      } finally {
        setInventoryLoading(false);
      }
    })();
  }, [modalVisible]);

  // ====================== 리스트 상태 (퀘스트 / 보물찾기 / 캐릭터) ======================
  const [questList, setQuestList] = useState<any[]>([]);
  const [treasureList, setTreasureList] = useState<MyTreasureHuntPost[]>([]);
  const [characterList, setCharacterList] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 현재 선택된 탭(mainTab + subTab)에 맞는 리스트 로딩
  const loadCurrentTab = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // ── 캐릭터 탭 ─────────────────────────────────
      if (mainTab === 'character') {
        if (subTab === '수집한 캐릭터') {
          try {
            const res = await getMyCharacters();
            setCharacterList(res.characters ?? []);
          } catch (e) {
            console.error('[UserProfile] getMyCharacters error:', e);
            setErrorMsg('캐릭터를 불러오지 못했습니다.');
            setCharacterList([]);
          }
        } else {
          // 캐릭터 뽑기 탭일 때는 서버 호출 X
          setCharacterList([]);
        }
        setQuestList([]);
        setTreasureList([]);
        return;
      }

      // ── 퀘스트 탭 ─────────────────────────────────
      if (mainTab === 'quest') {
        let list: any[] = [];

        if (subTab === '제작한 퀘스트') {
          list = await getMyCreatedQuests();
        } else if (subTab === '저장한 퀘스트') {
          list = await getMySavedQuests();
        } else if (subTab === '실행중인 퀘스트') {
          list = await getMyRunningQuests();
        } else if (subTab === '종료된 퀘스트') {
          list = await getMyTerminatedQuests();
        }

        setQuestList(list ?? []);
        setTreasureList([]);
        setCharacterList([]);
        return;
      }

      // ── 보물찾기 탭 ─────────────────────────────────
      if (mainTab === 'treasure') {
        let data: MyTreasureHuntPost[] = [];

        if (subTab === '제작한 보물찾기') {
          const res = await getMyCreatedTreasureHunts();
          data = res.data;
        } else if (subTab === '저장한 보물찾기') {
          const res = await getMySavedTreasureHunts();
          data = res.data;
        } else if (subTab === '실행중인 보물찾기') {
          const res = await getMyRunningTreasureHunt();
          data = res.data;
        } else if (subTab === '종료된 보물찾기') {
          const res = await getMyTerminatedTreasureHunts();
          data = res.data;
        }

        setTreasureList(data ?? []);
        setQuestList([]);
        setCharacterList([]);
      }
    } catch (e) {
      console.error('[UserProfile] loadCurrentTab error:', e);
      setErrorMsg('목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [mainTab, subTab]);

  // mainTab / subTab 변경 시 목록 로드
  useEffect(() => {
    // 캐릭터 뽑기 화면일 때는 서버 호출 필요 없음
    if (isCharacterDraw) return;
    loadCurrentTab();
  }, [loadCurrentTab, isCharacterDraw]);

  // ====================== 렌더링 헬퍼 ======================

  // 퀘스트 카드 렌더
  const renderQuestItems = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>불러오는 중...</Text>
        </View>
      );
    }
    if (errorMsg) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>{errorMsg}</Text>
        </View>
      );
    }
    if (!questList || questList.length === 0) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>텅 비었어요!</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listGrid}>
        {questList.map((raw: any) => {
          const id = raw.questPostId ?? Math.random();
          const title = raw.questTitle ?? '제목 없음';

          return (
            <View key={`Q-${id}`} style={styles.listItem}>
              <Text style={styles.listItemTitle} numberOfLines={2}>
                {title}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // 보물찾기 카드 렌더
  const renderTreasureItems = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>불러오는 중...</Text>
        </View>
      );
    }
    if (errorMsg) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>{errorMsg}</Text>
        </View>
      );
    }
    if (!treasureList || treasureList.length === 0) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>텅 비었어요!</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listGrid}>
        {treasureList.map(item => (
          <View key={`T-${item.treasureHuntPostId}`} style={styles.listItem}>
            <Text style={styles.listItemTitle} numberOfLines={2}>
              {item.treasureHuntTitle || '제목 없음'}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  // 수집한 캐릭터 렌더
  const renderCollectedCharacters = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>불러오는 중...</Text>
        </View>
      );
    }
    if (errorMsg) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>{errorMsg}</Text>
        </View>
      );
    }
    if (!characterList || characterList.length === 0) {
      return (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>아직 수집한 캐릭터가 없어요!</Text>
        </View>
      );
    }

    const bgByRank: Record<number, string> = {
      1: '#DADADA',
      2: '#DFCDA6',
      3: '#86B3D3',
    };

    return (
      <ScrollView contentContainerStyle={styles.characterGrid}>
        {characterList.map(ch => {
          const imageName = `${ch.characterName}_${ch.rank}.png`;
          const imageSource = characterImageMap[imageName];
          if (!imageSource) return null;

          const isRank4 = ch.rank === 4;
          const innerContent = (
            <>
              <Image source={imageSource} style={styles.characterImage} />
              <View style={styles.starRow}>
                {Array.from({length: 4}).map((_, idx) => {
                  const starIndex = idx + 1;
                  const color = starIndex <= ch.rank ? '#F2CF64' : '#9F9F9F'; // 랭크 이하면 골드, 아니면 회색
                  return (
                    <Icon
                      key={starIndex}
                      name="star"
                      size={20}
                      color={color}
                      style={styles.starIcon}
                    />
                  );
                })}
              </View>
            </>
          );

          return (
            <View key={ch.characterId} style={styles.characterCardShadow}>
              {isRank4 ? (
                <LinearGradient
                  colors={['#FFA498', '#E2C586', '#9CCF6F', '#6BACDB']}
                  start={{x: 0.5, y: 0}}
                  end={{x: 0.5, y: 1}}
                  style={styles.characterCardInner}>
                  {innerContent}
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.characterCardInner,
                    {backgroundColor: bgByRank[ch.rank] || '#DADADA'},
                  ]}>
                  {innerContent}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ====================== JSX ======================

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ─────────────── 상단 헤더 ─────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.nickText}>{nickname}</Text>
          <Image source={PLANE} style={styles.planeIcon} />
        </View>

        <Pressable onPress={handleLogout} style={styles.settingButton}>
          <Icon name="settings-sharp" size={24} color="#61402D" />
        </Pressable>
      </View>

      {/* ─────────────── 프로필 카드 ─────────────── */}
      <View style={styles.profileCard}>
        <Image source={PROFILE_IMG} style={styles.profileImg} />

        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{postCount}</Text>
            <Text style={styles.statLabel}>게시글</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{followerCount}</Text>
            <Text style={styles.statLabel}>팔로워</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{followingCount}</Text>
            <Text style={styles.statLabel}>팔로잉</Text>
          </View>
        </View>

        <Pressable
          style={styles.walletButton}
          onPress={() => setModalVisible(true)}>
          <Image source={WALLET_ICON} style={styles.walletIcon} />
        </Pressable>
      </View>

      {/* ─────────────── 상위 탭 ─────────────── */}
      <View style={styles.mainTabRow}>
        <Pressable
          style={[styles.mainTabBtn, mainTab === 'quest' && styles.tabActive]}
          onPress={() => {
            setMainTab('quest');
            setSubTab(subTabsQuest[0]);
          }}>
          <Icon name="extension-puzzle" size={22} color="#61402D" />
        </Pressable>

        <Pressable
          style={[
            styles.mainTabBtn,
            mainTab === 'treasure' && styles.tabActive,
          ]}
          onPress={() => {
            setMainTab('treasure');
            setSubTab(subTabsTreasure[0]);
          }}>
          <Icon name="archive" size={22} color="#61402D" />
        </Pressable>

        <Pressable
          style={[
            styles.mainTabBtn,
            mainTab === 'character' && styles.tabActive,
          ]}
          onPress={() => {
            setMainTab('character');
            setSubTab(subTabsCharacter[0]);
          }}>
          <Icon name="logo-octocat" size={22} color="#61402D" />
        </Pressable>
      </View>

      {/* ─────────────── 하위 탭 ─────────────── */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subTabRow}>
          {getSubTabs().map(tab => (
            <Pressable
              key={tab}
              style={[styles.subTabBtn, subTab === tab && styles.subTabActive]}
              onPress={() => setSubTab(tab)}>
              <Text
                style={[
                  styles.subTabText,
                  subTab === tab && styles.subTabTextActive,
                ]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ─────────────── 콘텐츠 영역 ─────────────── */}
      <View style={styles.contentWrapper}>
        {isCharacterDraw ? (
          // 캐릭터 뽑기 전용 UI
          <View style={styles.drawCenter}>
            <Image source={CARD_IMAGE} style={styles.drawImage} />
            <Text style={styles.drawText}>캐릭터를 뽑으러 가볼까요?</Text>

            <Pressable
              style={styles.drawButton}
              onPress={() => navigation.navigate('CharacterDrawScreen')}>
              <Text style={styles.drawButtonText}>캐릭터 뽑기</Text>
            </Pressable>
          </View>
        ) : isCollectedCharacter ? (
          renderCollectedCharacters()
        ) : mainTab === 'quest' ? (
          renderQuestItems()
        ) : mainTab === 'treasure' ? (
          renderTreasureItems()
        ) : (
          // character + 기타 탭은 혹시 대비용 더미 그리드
          <ScrollView contentContainerStyle={styles.listGrid}>
            {Array.from({length: 12}).map((_, i) => (
              <View key={i} style={styles.listItem} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ─────────────── 코인 / 뽑기권 모달 ─────────────── */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <BlurView style={styles.modalBlur} blurAmount={15} blurType="light" />

          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>보유 재화</Text>
            <View style={styles.modalLine} />

            {/* 인벤토리 로딩/에러/정상 상태 처리 */}
            {inventoryLoading ? (
              <View style={styles.modalItem}>
                <Text style={styles.modalTxt}>불러오는 중...</Text>
              </View>
            ) : inventoryError ? (
              <View style={styles.modalItem}>
                <Text style={styles.modalTxt}>{inventoryError}</Text>
              </View>
            ) : (
              <>
                {/* 코인 */}
                <View style={styles.modalItem}>
                  <Image source={COIN} style={styles.modalIcon} />
                  <View>
                    <Text style={styles.modalTxt}>
                      보유 코인: {inventory?.coins ?? 0}
                    </Text>
                  </View>
                </View>

                {/* 고급 캐릭터 뽑기권 (uniqueCreditCard) */}
                <View style={styles.modalItem}>
                  <Image source={CARD_PREMIUM} style={styles.modalCardIcon} />
                  <View>
                    <Text style={styles.modalTxt}>
                      고급 캐릭터 뽑기권: {inventory?.uniqueCreditCard ?? 0}
                    </Text>
                  </View>
                </View>

                {/* 일반 캐릭터 뽑기권 (normalCreditCard) */}
                <View style={styles.modalItem}>
                  <Image source={CARD_NORMAL} style={styles.modalCardIcon} />
                  <View>
                    <Text style={styles.modalTxt}>
                      일반 캐릭터 뽑기권: {inventory?.normalCreditCard ?? 0}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <Pressable
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
  },

  // ====================== 헤더 ======================
  headerRow: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickText: {
    fontSize: 20,
    color: '#61402D',
    fontWeight: '800',
    fontFamily: 'Madimi One',
  },
  planeIcon: {
    width: 22,
    height: 22,
    marginLeft: 6,
  },
  settingButton: {
    padding: 8,
  },

  // ====================== 프로필 카드 ======================
  profileCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ECE9E1',
    padding: 20,
    borderRadius: 15,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 0},
    position: 'relative',
  },
  profileImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ddd',
  },
  profileStats: {
    flexDirection: 'row',
    marginLeft: 22,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 14,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#61402D',
  },
  statLabel: {
    fontSize: 12,
    color: '#61402D',
    marginTop: 4,
  },

  walletButton: {
    position: 'absolute',
    top: 12,
    right: 12,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 0},
    elevation: 6, // Android
  },
  walletIcon: {
    width: 22,
    height: 22,
  },

  // ====================== 상위 탭 ======================
  mainTabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginHorizontal: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#A08D7F',
  },
  mainTabBtn: {
    padding: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#e0d9cf',
  },

  // ====================== 하위 탭 ======================
  subTabRow: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  subTabBtn: {
    marginRight: 26,
    paddingVertical: 6,
  },
  subTabText: {
    fontSize: 16,
    lineHeight: 18,
    color: '#6F655B',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#61402D',
  },
  subTabTextActive: {
    color: '#61402D',
    fontWeight: '600',
  },

  // ====================== 콘텐츠 ======================
  contentWrapper: {flex: 1, marginTop: 14},

  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  listItem: {
    width: width / 3 - 2,
    height: width / 3,
    backgroundColor: '#D8D8D8',
    borderWidth: 0.5,
    borderColor: '#C0C0C0',
  },
  listItemTitle: {
    color: '#61402D',
    fontSize: 12,
    fontWeight: '600',
    padding: 6,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#61402D',
    fontSize: 14,
    opacity: 0.7,
  },

  // ====================== 수집한 캐릭터 그리드 ======================
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
  },
  characterCardShadow: {
    width: '47%',
    borderRadius: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 6,
  },
  characterCardInner: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  starIcon: {
    marginHorizontal: 1,
  },

  // ====================== 캐릭터 뽑기 ======================
  drawCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  drawText: {
    color: '#61402D',
    fontSize: 18,
    marginBottom: 24,
  },
  drawButton: {
    backgroundColor: '#61402D',
    width: '80%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // ====================== 모달 ======================
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // 세로 중앙
    alignItems: 'center', // 가로 중앙
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#61402D',
    fontWeight: '700',
  },
  modalLine: {
    height: 1,
    backgroundColor: '#C5B9A8',
    marginVertical: 16,
  },
  modalItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  modalIcon: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  modalCardIcon: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  modalTxt: {
    color: '#61402D',
    fontSize: 14,
  },
  modalClose: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#61402D',
    borderRadius: 10,
  },
  modalCloseText: {
    color: '#fff',
    textAlign: 'center',
  },
});
