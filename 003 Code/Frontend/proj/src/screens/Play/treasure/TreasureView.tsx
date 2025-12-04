import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import Geolocation, {
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';
import haversine from 'haversine-distance';
import {useNavigation} from '@react-navigation/native';
import {
  setTreasureHuntCleared,
  setTreasureHuntPending,
} from '../../../api/treasureHuntPlay';
import TreasureARScene from './TreasureARScene';
import MONEY_BAG from '../../../img/money-bag.png';
import {getActiveTarget} from '../../../utils/activeTarget';
import {ViroARSceneNavigator} from '@reactvision/react-viro';
import HeaderIcon from '../../../components/HeaderIcon';
import Icon from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('window');
const pressedEffect = {opacity: 0.7};
const DIST_THRESHOLD_M = 1.5; // 몇 m 이내에 도달해야 열 수 있는가?

type NavTarget = {
  id: string;
  type: 'treasure' | 'quest';
  latitude: number;
  longitude: number;
  title?: string;
  date?: string;
  locationName?: string;
};

export default function TreasureView({route}: any) {
  const [distance, setDistance] = useState<number | null>(null);
  const [showChest, setShowChest] = useState(false);
  const [target, setTarget] = useState<NavTarget>();

  // 최근 위치(실시간 위치, 스냅샷 아님)
  const lastUserPosRef = useRef<{lat: number; lng: number} | null>(null);
  // 1.5m 이내에 "처음" 들어왔을 때의 스냅샷 좌표
  const lockedPosRef = useRef<{lat: number; lng: number} | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const navigation = useNavigation<any>();
  const busyRef = useRef(false);

  // 라우트에 target 없으면 저장된 activeTarget 로드 (재진입 대비)
  useEffect(() => {
    (async () => {
      const saved = await getActiveTarget();
      if (saved) {
        setTarget(saved);
      } else {
        console.log('[ERR] No active target found');
      }
    })();
  }, []);

  // 위치 watch
  useEffect(() => {
    if (!target) return;

    // 이미 스냅샷이 잠겨 있으면 관측할 필요 없음
    if (lockedPosRef.current) return;

    watchIdRef.current = Geolocation.watchPosition(
      (pos: GeoPosition) => {
        const user = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        lastUserPosRef.current = {lat: user.latitude, lng: user.longitude};

        const goal = {latitude: target.latitude, longitude: target.longitude};
        const d = haversine(user, goal);
        setDistance(d);

        // 최초로 1.5m 이내 진입하면:
        // 1) 그 순간의 좌표를 스냅샷으로 고정
        // 2) 보물상자 표시
        // 3) 위치 관측 종료(배터리/흔들림 방지)
        if (d <= DIST_THRESHOLD_M && !lockedPosRef.current) {
          lockedPosRef.current = {lat: user.latitude, lng: user.longitude};
          setShowChest(true);

          if (watchIdRef.current != null) {
            Geolocation.clearWatch(watchIdRef.current);
            Geolocation.stopObserving();
            watchIdRef.current = null;
          }
        }
      },
      (e: GeoError) => {
        console.warn('❌ 위치 watch 에러:', e);
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

  // 거리 기반 컴퍼스 상태(색상 + 안내 문구) 계산
  const getCompassState = (d: number | null) => {
    // 기본값(거리 계산 전)
    if (d == null) {
      return {
        color: '#61D04A', // 기본 초록
        text: '보물을 찾으러 떠나봐요!',
      };
    }

    // 거리 구간별 색상 + 텍스트
    if (d <= 3) {
      // 빨간색: 거의 도착
      return {
        color: '#FF4D4D',
        text: '곧 찾을 수 있을 것 같아요!',
      };
    }
    if (d <= 8) {
      // 주황색: 꽤 가까움
      return {
        color: '#FFA500',
        text: '이 주변에 있는 것 같아요!',
      };
    }
    if (d <= 20) {
      // 노란색: 방향 감 잡는 정도
      return {
        color: '#FFD700',
        text: '엇! 이쪽 방향인 것 같은데요?',
      };
    }

    // 초록색: 아직 거리가 좀 있음
    return {
      color: '#61D04A',
      text: '보물을 찾아 볼까요?',
    };
  };

  const handleButtonPress = async () => {
    if (busyRef.current) return;
    if (!target) {
      navigation.goBack();
      return;
    }

    busyRef.current = true; // 연타 방지 시작

    // 서버에는 스냅샷 좌표(가능하면)를 최우선으로 전송
    const snap = lockedPosRef.current;
    const last = lastUserPosRef.current;
    const payload = {
      treasureHuntPostId: Number(target.id),
      latitude: snap?.lat ?? last?.lat ?? target.latitude,
      longitude: snap?.lng ?? last?.lng ?? target.longitude,
    };

    try {
      if (showChest) {
        // 보물상자 오픈
        await setTreasureHuntCleared(payload);
        navigation.replace('CompleteScreen');
        return;
      } else {
        // 아직 상자를 못 찾았을 때는 Pending 처리
        await setTreasureHuntPending(payload);
      }
    } catch (err) {
      console.warn('❌ 상태 변경 실패:', err);
    } finally {
      busyRef.current = false; // 무조건 해제
    }

    navigation.goBack();
  };

  const {color: compassColor, text: distanceText} = getCompassState(distance);

  return (
    <View style={styles.wrapper}>
      {/* AR 화면 */}
      <ViroARSceneNavigator
        initialScene={{scene: TreasureARScene}}
        autofocus
        style={styles.arView}
      />

      {/* 오버레이 영역 */}
      <View style={styles.overlay}>
        {/* 상단 헤더 */}
        <View style={styles.headerContainer}>
          <HeaderIcon />
        </View>

        {/* 타이틀 + 안내 문구 */}
        <View style={styles.questBlock}>
          <View style={styles.questNav}>
            <Text style={styles.bigText}>{`보물찾기`}</Text>
            <View style={styles.gpsTagWrapper}>
              <Text style={styles.smallText}>{`GPS`}</Text>
            </View>
          </View>

          <View style={styles.infoWrapper}>
            {/* 거리 기반 컴퍼스 안내 박스 */}
            <View style={styles.infoBox}>
              {/* 거리에 따라 색이 변하는 컴퍼스 아이콘 */}
              <Icon name="compass" color={compassColor} size={14} />
              <Text style={styles.infoText} numberOfLines={1}>
                {distanceText}
              </Text>
            </View>

            {/* 보물 찾기 안내 박스 */}
            <View style={[styles.infoBox, styles.infoBoxSpacing]}>
              <Icon name="alert-circle" color="#D96262" size={14} />
              <Text style={styles.infoText}>
                {showChest
                  ? '보물상자를 터치해보세요!'
                  : '보물상자를 찾아보세요!'}
              </Text>
            </View>
          </View>
        </View>

        {/* 중앙 영역: 보물 상자만 화면 정중앙에 */}
        {showChest && (
          <View style={styles.moneyBagWrapper}>
            <Image source={MONEY_BAG} style={styles.moneyBag} />
          </View>
        )}

        {/* 하단 버튼 */}
        <View style={styles.bottomButtonWrapper}>
          <Pressable
            style={({pressed}) => [
              styles.bottomButton,
              pressed && pressedEffect,
            ]}
            onPress={handleButtonPress}>
            <Text style={styles.bottomButtonText}>
              {showChest ? '보물상자 열기' : '뒤로가기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {flex: 1, backgroundColor: '#000'},
  arView: {
    width: width,
    height: height,
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

  // 화면 정중앙에 돈주머니 고정
  moneyBagWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyBag: {width: 100, height: 100, resizeMode: 'contain'},

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
  },
  bottomButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
});
