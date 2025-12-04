import {ViroARSceneNavigator} from '@reactvision/react-viro';
import React, {useEffect, useRef, useState} from 'react';
import {Dimensions, Pressable, StyleSheet, Text, View} from 'react-native';
import QuestARScene from './QuestARScene';
import HeaderIcon from '../../../components/HeaderIcon';
import Icon from 'react-native-vector-icons/Ionicons';
import Geolocation, {
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';
import haversine from 'haversine-distance';
import {useNavigation} from '@react-navigation/native';
import {getActiveTarget} from '../../../utils/activeTarget';
import {getCurrentDetail} from '../../../api/questPlay';

const {width, height} = Dimensions.get('window');
const pressedEffect = {opacity: 0.7};
const DIST_THRESHOLD_M = 1000; // 보물찾기와 동일하게 1.5m (테스트 : 1000, 리얼: 1.5m)

type NavTarget = {
  id: string;
  type: 'treasure' | 'quest';
  latitude: number;
  longitude: number;
  title?: string;
  reward?: {
    rewardId: number;
    experience: number;
    type: boolean;
    creditCardCount: number;
    coin: number;
  };
  myQuestPlayId?: number; // ★ 퀘스트용
};

const getCurrentPositionP = () =>
  new Promise<GeoPosition>((resolve, reject) =>
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000,
    }),
  );

export default function QuestView() {
  const [showNPC, setShowNPC] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [target, setTarget] = useState<NavTarget | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lockedPosRef = useRef<{lat: number; lng: number} | null>(null);
  const lastUserPosRef = useRef<{lat: number; lng: number} | null>(null);
  const busyRef = useRef(false);

  const navigation = useNavigation<any>();

  // activeTarget 로드
  useEffect(() => {
    (async () => {
      const saved = (await getActiveTarget()) as NavTarget | null;
      if (saved && saved.type === 'quest') {
        setTarget(saved);
      } else {
        console.log('[QuestView] activeTarget이 없거나 quest 타입이 아님');
      }
    })();
  }, []);

  // 위치 watch: 거리가 가까워지면 NPC 표시
  useEffect(() => {
    if (!target) return;

    // 이미 스냅샷이 잠겨있으면 더 볼 필요 없음
    if (lockedPosRef.current) return;

    watchIdRef.current = Geolocation.watchPosition(
      (pos: GeoPosition) => {
        const user = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        lastUserPosRef.current = {lat: user.latitude, lng: user.longitude};

        const goal = {
          latitude: target.latitude,
          longitude: target.longitude,
        };

        const d = haversine(user, goal);
        setDistance(d);

        if (d <= DIST_THRESHOLD_M && !lockedPosRef.current) {
          lockedPosRef.current = {lat: user.latitude, lng: user.longitude};
          setShowNPC(true);

          if (watchIdRef.current != null) {
            Geolocation.clearWatch(watchIdRef.current);
            Geolocation.stopObserving();
            watchIdRef.current = null;
          }
        }
      },
      (e: GeoError) => {
        console.warn('[QuestView] 위치 watch 에러:', e);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 2000,
        fastestInterval: 1000,
        showsBackgroundLocationIndicator: false,
      },
    );

    return () => {
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        Geolocation.stopObserving();
        watchIdRef.current = null;
      }
    };
  }, [target]);

  const handleButtonPress = async () => {
    // 아직 NPC 안 보이면 그냥 뒤로가기
    if (!showNPC) {
      navigation.goBack();
      return;
    }

    if (!target || !target.myQuestPlayId) {
      console.warn('[QuestView] myQuestPlayId가 없어 진행 불가');
      navigation.goBack();
      return;
    }

    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const detail = await getCurrentDetail(target.myQuestPlayId);

      switch (detail.actionType) {
        case 'TALKING':
          navigation.navigate('DialogScreen', {
            myQuestPlayId: target.myQuestPlayId,
            detail,
          });
          break;
        case 'STAYING':
          navigation.navigate('StayScreen', {
            myQuestPlayId: target.myQuestPlayId,
            detail,
          });
          break;
        case 'WALKING':
          navigation.navigate('StepScreen', {
            myQuestPlayId: target.myQuestPlayId,
            detail,
          });
          break;
        case 'PHOTO_PUZZLE':
          navigation.navigate('PhotoPuzzleScreen', {
            myQuestPlayId: target.myQuestPlayId,
            detail,
          });
          break;
        case 'LOCATION_PUZZLE':
          navigation.navigate('LocationPuzzleScreen', {
            myQuestPlayId: target.myQuestPlayId,
            detail,
          });
          break;
        case 'INPUT_PUZZLE':
          navigation.navigate('InputPuzzleScreen', {
            myQuestPlayId: target.myQuestPlayId,
            detail,
          });
          break;
        default:
          console.warn('[QuestView] 알 수 없는 actionType:', detail.actionType);
          navigation.goBack();
          break;
      }
    } catch (e) {
      console.warn('❌ getCurrentDetail 실패:', e);
      navigation.goBack();
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      {/* AR 화면 전체 배경 */}
      <ViroARSceneNavigator
        initialScene={{scene: QuestARScene}}
        autofocus
        style={styles.arView}
      />

      {/* 오버레이 */}
      <View style={styles.overlay}>
        {/* 상단 헤더 (로고 + 상단 바) */}
        <View style={styles.headerContainer}>
          <HeaderIcon />
        </View>

        {/* 퀘스트 타이틀 + 안내문구 */}
        <View style={styles.questBlock}>
          <View style={styles.questNav}>
            <Text style={styles.bigText}>{`퀘스트`}</Text>
            <View style={styles.gpsTagWrapper}>
              <Text style={styles.smallText}>{`GPS`}</Text>
            </View>
          </View>

          <View style={styles.infoWrapper}>
            <View style={styles.infoBox}>
              <Icon name="chevron-forward-circle" color="#61D04A" size={12} />
              <Text style={styles.infoText} numberOfLines={1}>
                {target?.title ?? '여기에 위치 이름'}
              </Text>
            </View>
            <View style={[styles.infoBox, styles.infoBoxSpacing]}>
              <Icon name="alert-circle" color="#D96262" size={12} />
              <Text style={styles.infoText}>
                {showNPC ? 'NPC와 대화할 수 있습니다!' : 'NPC를 찾아보세요!'}
              </Text>
            </View>
          </View>
        </View>

        {/* (선택) 디버그용 거리 표시가 필요하면 여기에 추가해서 보면 됨
        <View style={{position: 'absolute', top: 60, right: 20}}>
          <Text style={{color: '#fff'}}>
            {distance != null ? `${distance.toFixed(2)} m` : '거리 계산 중…'}
          </Text>
        </View>
        */}

        {/* 하단 버튼 */}
        <View style={styles.bottomButtonWrapper}>
          <Pressable
            style={({pressed}) => [
              styles.bottomButton,
              pressed && pressedEffect,
            ]}
            onPress={handleButtonPress}>
            <Text style={styles.bottomButtonText}>
              {showNPC ? '대화하기' : '뒤로가기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// 스타일은 색/폰트/아이콘 사이즈 그대로 유지
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  arView: {
    width,
    height,
    position: 'absolute',
    top: 0,
    left: 0,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  questBlock: {
    marginTop: 16,
    paddingHorizontal: 20,
  },

  questNav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bigText: {
    color: '#61402D',
    fontSize: 24,
    fontWeight: '600',
  },
  smallText: {
    color: '#61D04A',
    fontSize: 8,
    fontWeight: '700',
  },

  gpsTagWrapper: {
    marginLeft: 4,
    marginBottom: 4,
  },

  infoWrapper: {
    marginTop: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(81, 81, 81, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '90%',
  },
  infoBoxSpacing: {
    marginTop: 6,
  },
  infoText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 6,
  },

  bottomButtonWrapper: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  bottomButton: {
    backgroundColor: '#61402D',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    width: width * 0.86,
    alignItems: 'center',
  },
  bottomButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
});
