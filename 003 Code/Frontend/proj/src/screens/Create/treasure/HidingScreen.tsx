import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import InitialARScene from './InitialARScene';
import {useTreasure} from '../../../context/TreasureContext';
import {ViroARSceneNavigator} from '@reactvision/react-viro';

import Geolocation, {
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Platform} from 'react-native';

const {width, height} = Dimensions.get('window');

export default function HidingScreen() {
  const {setTreasure} = useTreasure();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [busy, setBusy] = useState(false);
  const lockedRef = useRef(false);

  const ensureLocationPermission = useCallback(async () => {
    const perm =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const cur = await check(perm);
    if (cur === RESULTS.GRANTED) return true;

    const req = await request(perm);
    return req === RESULTS.GRANTED;
  }, []);

  const getCurrentPosition = useCallback(
    () =>
      new Promise<GeoPosition>((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          // iOS에서는 accuracy 옵션도 가능 (RN 0.76+)
          // accuracy: { ios: 'bestForNavigation' as const },
        });
      }),
    [],
  );

  const handleHide = useCallback(async () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setBusy(true);

    try {
      const ok = await ensureLocationPermission();
      if (!ok) {
        Alert.alert('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }

      const pos = await getCurrentPosition();
      const {latitude, longitude, altitude} = pos.coords;

      // TreasureContext에 위치 저장
      setTreasure(prev => ({
        ...prev,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        altitude: altitude ?? null,
      }));

      // 다음 화면으로 이동
      navigation.navigate('TreasureCreationPending');
    } catch (e) {
      const err = e as GeoError;
      console.warn('❌ 위치 가져오기 실패:', err);
      Alert.alert(
        '위치 에러',
        '현재 위치를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.',
      );
      // 실패 시에도 다음 화면에서 실패 UI를 보이려면 굳이 이동할 필요 없고,
      // 이동해서 실패 UI를 보여주고 싶다면 아래 주석을 해제하세요.
      // navigation.navigate('TreasureCreationPending');
    } finally {
      setBusy(false);
      lockedRef.current = false;
    }
  }, [ensureLocationPermission, getCurrentPosition, navigation, setTreasure]);

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        initialScene={{scene: InitialARScene}}
        autofocus
        style={styles.arView}
      />

      <View style={styles.overlay}>
        <Icon
          name="download"
          size={24}
          color={'#EB3F56'}
          style={styles.arrowIndicator}
        />
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.button}
            onPress={() => navigation.goBack()}
            disabled={busy}>
            <Text style={styles.buttonText}>뒤로가기</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={handleHide} disabled={busy}>
            <Text style={styles.buttonText}>보물 숨기기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000', position: 'relative'},
  arView: {width, height, position: 'absolute', top: 0, left: 0},
  arrowIndicator: {position: 'absolute', bottom: 280},
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  buttonRow: {flexDirection: 'row', gap: 10},
  button: {
    backgroundColor: '#61402D',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 15,
  },
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});
