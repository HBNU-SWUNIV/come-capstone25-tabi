// // src/screens/User/DrawResultScreen.tsx

// import React from 'react';
// import {
//   Image,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import {SafeAreaView} from 'react-native-safe-area-context';
// import {useNavigation, useRoute} from '@react-navigation/native';
// import {NativeStackNavigationProp} from '@react-navigation/native-stack';
// import Icon from 'react-native-vector-icons/Ionicons';

// // 한국어 주석: 뽑기 결과 타입 정의 (API 반환 형식에 맞게 작성)
// type DrawCharacter = {
//   characterId: number;
//   characterName: string;
//   rank: number; // 1~4성
//   characterURL: string;
// };

// type RouteParams = {
//   drawType: 'NORMAL' | 'ADVANCED';
//   count: number;
//   result: {
//     drawCharacters: DrawCharacter[];
//     errorMessage?: string;
//   };
// };

// type Nav = NativeStackNavigationProp<any>;

// export default function DrawResultScreen() {
//   const navigation = useNavigation<Nav>();
//   const route = useRoute<any>();
//   const {result} = (route.params as RouteParams) ?? {};

//   // 한국어 주석: 캐릭터 목록 (없을 경우 빈 배열)
//   const characters: DrawCharacter[] = result?.drawCharacters ?? [];

//   // 한국어 주석: 별(★) 렌더링 함수
//   const renderStars = (rank: number) => {
//     const maxStar = 4;
//     const filled = Math.max(0, Math.min(rank, maxStar));

//     return (
//       <View style={styles.starRow}>
//         {Array.from({length: maxStar}).map((_, idx) => {
//           const isFilled = idx < filled;
//           return (
//             <Text
//               key={idx}
//               style={isFilled ? styles.starFilled : styles.starEmpty}>
//               ★
//             </Text>
//           );
//         })}
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView edges={['top']} style={styles.safeArea}>
//       <View style={styles.mainContainer}>
//         {/* ================= 헤더 ================= */}
//         <View style={styles.headerRow}>
//           <Pressable
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}>
//             <Icon name="chevron-back" size={24} color="#61402D" />
//           </Pressable>

//           <View style={styles.headerTextBox}>
//             <Text style={styles.headerTitle}>캐릭터 뽑기 결과</Text>
//             <Text style={styles.headerSubtitle}>
//               뽑힌 캐릭터를 확인해주세요!
//             </Text>
//           </View>
//         </View>

//         {/* ================= 결과 목록 ================= */}
//         <ScrollView
//           style={styles.list}
//           contentContainerStyle={styles.listContent}>
//           {characters.map(char => (
//             <View key={char.characterId} style={styles.card}>
//               {/* 한국어 주석: 캐릭터 이미지 */}
//               {char.characterURL ? (
//                 <Image
//                   source={{uri: char.characterURL}}
//                   style={styles.cardImage}
//                 />
//               ) : (
//                 <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
//                   <Text style={styles.placeholderText}>이미지 없음</Text>
//                 </View>
//               )}

//               {/* 한국어 주석: 이름 + 별 */}
//               <View style={styles.cardInfo}>
//                 <Text style={styles.cardName}>{char.characterName}</Text>
//                 {renderStars(char.rank)}
//               </View>
//             </View>
//           ))}

//           {/* 한국어 주석: 만약 캐릭터가 하나도 없을 때 표시 */}
//           {characters.length === 0 && (
//             <View style={styles.emptyBox}>
//               <Text style={styles.emptyText}>
//                 뽑힌 캐릭터가 없어요. 다시 시도해주세요.
//               </Text>
//             </View>
//           )}
//         </ScrollView>

//         {/* ================= 하단 버튼 ================= */}
//         <View style={styles.footer}>
//           <Pressable
//             style={({pressed}) => [
//               styles.backHomeBtn,
//               pressed && styles.backHomeBtnPressed,
//             ]}
//             onPress={() => navigation.navigate('UserHome')}>
//             {({pressed}) => (
//               <Text
//                 style={[
//                   styles.backHomeBtnText,
//                   pressed && styles.backHomeBtnTextPressed,
//                 ]}>
//                 돌아가기
//               </Text>
//             )}
//           </Pressable>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// /* ================= 스타일 ================= */
// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#ECE9E1',
//   },
//   mainContainer: {
//     flex: 1,
//     justifyContent: 'space-between',
//     paddingBottom: 30,
//     backgroundColor: '#ECE9E1',
//   },

//   // ----- 헤더 -----
//   headerRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     paddingHorizontal: 16,
//     paddingTop: 6,
//     marginBottom: 10,
//   },
//   backButton: {
//     paddingRight: 6,
//   },
//   headerTextBox: {
//     flex: 1,
//     paddingLeft: 4,
//   },
//   headerTitle: {
//     color: '#61402D',
//     fontSize: 22,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     marginTop: 4,
//     color: '#61402D',
//     fontSize: 12,
//     fontWeight: '300',
//   },

//   // ----- 리스트 / 카드 -----
//   list: {
//     flex: 1,
//   },
//   listContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     gap: 16,
//   },
//   card: {
//     flexDirection: 'row',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 12,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowOffset: {width: 0, height: 2},
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   cardImage: {
//     width: 90,
//     height: 90,
//     borderRadius: 16,
//     resizeMode: 'cover',
//     marginRight: 12,
//     backgroundColor: '#F5F5F5',
//   },
//   cardImagePlaceholder: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   placeholderText: {
//     color: '#999',
//     fontSize: 12,
//   },
//   cardInfo: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   cardName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#61402D',
//     marginBottom: 6,
//   },

//   // ----- 별 표시 -----
//   starRow: {
//     flexDirection: 'row',
//   },
//   starFilled: {
//     color: '#F2C94C',
//     fontSize: 16,
//     marginRight: 2,
//   },
//   starEmpty: {
//     color: '#D5D5D5',
//     fontSize: 16,
//     marginRight: 2,
//   },

//   // ----- 빈 상태 -----
//   emptyBox: {
//     paddingVertical: 40,
//     alignItems: 'center',
//   },
//   emptyText: {
//     color: '#61402D',
//     fontSize: 14,
//   },

//   // ----- 하단 버튼 -----
//   footer: {
//     alignItems: 'center',
//   },
//   backHomeBtn: {
//     backgroundColor: '#61402D',
//     width: 350,
//     height: 50,
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   backHomeBtnPressed: {
//     backgroundColor: '#503624',
//     transform: [{scale: 0.97}],
//   },
//   backHomeBtnText: {
//     color: '#fff',
//     textAlign: 'center',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   backHomeBtnTextPressed: {
//     color: '#ddd',
//   },
// });

// src/screens/User/DrawResultScreen.tsx

// src/screens/User/DrawResultScreen.tsx

import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// ✅ 프로필/캐릭터 이미지 매핑 유틸
import {getLocalProfileImage} from '../../characters/profileImages';

// 한국어 주석: 뽑기 결과 타입 정의 (API 반환 형식에 맞게 작성)
type DrawCharacter = {
  characterId: number;
  characterName: string;
  rank: number; // 1~4성
  characterURL: string; // 예: "/profile-characters/owl_3.png"
};

type RouteParams = {
  drawType: 'NORMAL' | 'ADVANCED';
  count: number;
  result: {
    drawCharacters: DrawCharacter[];
    errorMessage?: string;
  };
};

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.45; // 카드 가로폭 (화면의 70%)
const CARD_HEIGHT = CARD_WIDTH * 1.2; // 카드 세로폭 (비율은 취향껏)

type Nav = NativeStackNavigationProp<any>;

export default function DrawResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  // ─────────────────────────────────────────────
  // ① 실제 라우트 파라미터에서 결과 꺼내기
  // ─────────────────────────────────────────────
  const params = route.params as RouteParams | undefined;
  const result = params?.result;

  // ─────────────────────────────────────────────
  // ② 더미 데이터 (로컬 테스트용)
  // ─────────────────────────────────────────────
  const dummyCharacters: DrawCharacter[] = [
    {
      characterId: 1,
      characterName: '뱀',
      rank: 4,
      characterURL: '/profile-characters/snake_4.png',
    },
    {
      characterId: 2,
      characterName: '다람쥐',
      rank: 3,
      characterURL: '/profile-characters/squirrel_3.png',
    },
    {
      characterId: 3,
      characterName: '거북이',
      rank: 2,
      characterURL: '/profile-characters/turtle_2.png',
    },
  ];

  // ─────────────────────────────────────────────
  // ③ 실제 결과 vs 더미 데이터 선택
  // ─────────────────────────────────────────────
  const characters: DrawCharacter[] =
    result?.drawCharacters && result.drawCharacters.length > 0
      ? result.drawCharacters
      : dummyCharacters;

  // 한국어 주석: 별(★) 렌더링 함수 – UserHomeScreen 스타일
  const renderStars = (rank: number) => {
    return (
      <View style={styles.starRow}>
        {Array.from({length: 4}).map((_, idx) => {
          const starIndex = idx + 1;
          const color = starIndex <= rank ? '#F2CF64' : '#9F9F9F';
          return (
            <Icon
              key={starIndex}
              name="star"
              size={18}
              color={color}
              style={styles.starIcon}
            />
          );
        })}
      </View>
    );
  };

  // 한국어 주석: 서버 URL 또는 더미 URL을 로컬 이미지로 매핑
  const resolveCharacterImage = (url?: string): ImageSourcePropType | null => {
    if (!url) return null;

    // "/profile-characters/owl_3.png" → "owl_3.png" → characterImageMap 매핑
    const local = getLocalProfileImage(url);
    if (local) return local;

    // 혹시 모를 절대 URL 대응 (CDN 등)
    return {uri: url};
  };

  // 랭크별 배경색 (4성은 그라데이션)
  const bgByRank: Record<number, string> = {
    1: '#E4DDD0', // 연한 베이지
    2: '#D3E2F4', // 연한 파랑
    3: '#F3E0B7', // 연한 노랑/베이지
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* ================= 헤더 ================= */}
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color="#61402D" />
          </Pressable>

          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>캐릭터 뽑기 결과</Text>
            <Text style={styles.headerSubtitle}>
              뽑힌 캐릭터를 확인해주세요!
            </Text>
          </View>
        </View>

        {/* ================= 결과 목록 ================= */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}>
          {characters.map(char => {
            const imageSource = resolveCharacterImage(char.characterURL);
            const isRank4 = char.rank === 4;
            const bgColor = bgByRank[char.rank] || bgByRank[1];

            const innerContent = (
              <>
                {/* 캐릭터 이미지 */}
                {imageSource ? (
                  <Image source={imageSource} style={styles.characterImage} />
                ) : (
                  <View
                    style={[
                      styles.characterImage,
                      styles.cardImagePlaceholder,
                    ]}>
                    <Text style={styles.placeholderText}>이미지 없음</Text>
                  </View>
                )}

                {/* 별 */}
                {renderStars(char.rank)}
              </>
            );

            return (
              <View key={char.characterId} style={styles.cardWrapper}>
                <View style={styles.cardShadow}>
                  {isRank4 ? (
                    <LinearGradient
                      colors={['#FFA498', '#E2C586', '#9CCF6F', '#6BACDB']}
                      start={{x: 0.5, y: 0}}
                      end={{x: 0.5, y: 1}}
                      style={styles.cardInner}>
                      {innerContent}
                    </LinearGradient>
                  ) : (
                    <View
                      style={[styles.cardInner, {backgroundColor: bgColor}]}>
                      {innerContent}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* 캐릭터가 하나도 없을 때 표시 (더미까지 비운 경우용) */}
          {characters.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                뽑힌 캐릭터가 없어요. 다시 시도해주세요.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ================= 하단 버튼 ================= */}
        <View style={styles.footer}>
          <Pressable
            style={({pressed}) => [
              styles.backHomeBtn,
              pressed && styles.backHomeBtnPressed,
            ]}
            onPress={() => navigation.navigate('UserHome')}>
            {({pressed}) => (
              <Text
                style={[
                  styles.backHomeBtnText,
                  pressed && styles.backHomeBtnTextPressed,
                ]}>
                돌아가기
              </Text>
            )}
          </Pressable>
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
    marginBottom: 10,
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

  // ----- 리스트 / 카드 컨테이너 -----
  list: {
    flex: 1,
    paddingTop: 80,
  },
  listContent: {
    paddingHorizontal: 0, // 여기 여백은 최소화
    paddingBottom: 20,
    alignItems: 'center', // 가운데 정렬
    rowGap: 20,
  },

  // 세로 카드 하나
  cardWrapper: {
    width: CARD_WIDTH,
    alignSelf: 'center', // 부모 기준 가운데 정렬
    paddingVertical: 10,
  },

  cardShadow: {
    width: '100%',
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 0},
    shadowRadius: 6,
    elevation: 6,
  },

  cardInner: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  characterImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 8,
  },

  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
  },

  placeholderText: {
    color: '#999',
    fontSize: 12,
  },

  // ----- 별 표시 -----
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  starIcon: {
    marginHorizontal: 2,
  },

  // ----- 빈 상태 -----
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#61402D',
    fontSize: 14,
  },

  // ----- 하단 버튼 -----
  footer: {
    alignItems: 'center',
  },
  backHomeBtn: {
    backgroundColor: '#61402D',
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeBtnPressed: {
    backgroundColor: '#503624',
    transform: [{scale: 0.97}],
  },
  backHomeBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backHomeBtnTextPressed: {
    color: '#ddd',
  },
});
