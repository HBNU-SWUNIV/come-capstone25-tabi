// src/utils/locationTracker.ts
import {Platform} from 'react-native';
import Geolocation, {
  GeoError,
  GeoPosition,
} from 'react-native-geolocation-service';
import haversine from 'haversine-distance';
import AsyncStorage from '@react-native-async-storage/async-storage';

import notifee, {
  AndroidImportance,
  EventType,
  Notification,
} from '@notifee/react-native';

import {PERMISSIONS, RESULTS, check, request} from 'react-native-permissions';

import {navigationRef, navigateToPlayScreen} from './navigationRef';
import type {PlayStackParamList} from './navigationRef';

// ==============================
// 튜닝 가능한 상수
// ==============================
const STORAGE_KEY = 'coordinateList'; // 좌표 리스트 저장 키
const TARGETS_RELOAD_MS = 7_000; // AsyncStorage에서 타겟 재로딩 주기
const WATCH_INTERVAL_MS = 3_000;
const WATCH_FASTEST_MS = 2_000;
const NOTIFY_COOLDOWN = 20_000; // 동일 타겟 재알림 쿨다운(ms)

const DISTANCE_LIMITS: Record<'treasure' | 'quest', number> = {
  treasure: 5, // m
  quest: 3, // m
};

// ==============================
// 타입
// ==============================
export interface LocationData {
  type: 'treasure' | 'quest';
  latitude: number;
  longitude: number;
  id: string;
}

// navigateToPlayScreen 이 기대하는 객체 형태 그대로 저장하기 위한 타입
type PendingNav =
  | {screen: 'PlayHome'}
  | {screen: 'TreasureView'; params: {id: string}}
  | {screen: 'QuestView'; params: {id: string}};

// ==============================
// 내부 상태
// ==============================
let latestTargets: LocationData[] = [];
let reloadTimer: ReturnType<typeof setInterval> | null = null;
let watchId: number | null = null;

const notifiedAt = new Map<string, number>(); // 스팸 방지

let pendingNotification: PendingNav | null = null;

// ==============================
// 유틸
// ==============================
function hasRecentlyNotified(id: string): boolean {
  const now = Date.now();
  const last = notifiedAt.get(id);
  if (last && now - last < NOTIFY_COOLDOWN) return true;
  notifiedAt.set(id, now);
  return false;
}

async function loadTargetsFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    latestTargets = raw ? (JSON.parse(raw) as LocationData[]) : [];
  } catch {
    latestTargets = [];
  }
}

// ==============================
// 권한
// ==============================
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // 1) WhenInUse 먼저
    const inUse =
      (await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)) === RESULTS.GRANTED
        ? RESULTS.GRANTED
        : await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

    if (inUse !== RESULTS.GRANTED) return false;

    // 2) 필요할 때만 Always 추가 요청
    const always =
      (await check(PERMISSIONS.IOS.LOCATION_ALWAYS)) === RESULTS.GRANTED
        ? RESULTS.GRANTED
        : await request(PERMISSIONS.IOS.LOCATION_ALWAYS);

    return always === RESULTS.GRANTED; // Always 필요 없으면 여기서 true 반환해도 OK
  } else {
    const fine =
      (await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)) ===
      RESULTS.GRANTED
        ? RESULTS.GRANTED
        : await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    return fine === RESULTS.GRANTED;
  }
}

// ==============================
// Notifee
// ==============================
export async function setupNotifee() {
  await notifee.requestPermission();

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: '기본 채널',
      importance: AndroidImportance.HIGH,
    });
  }

  // 포그라운드 눌림 처리
  notifee.onForegroundEvent(async ({type, detail}) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      await onNotificationPress(detail.notification.data);
    }
  });

  // ⚠️ 백그라운드 이벤트는 index.ts 등 최상위에서 등록 권장
  // notifee.onBackgroundEvent(...)
}

async function triggerPushNotification(target: LocationData) {
  const title = target.type === 'treasure' ? '보물 근처 도착!' : '퀘스트 시작!';
  const body =
    target.type === 'treasure'
      ? '5m 이내로 접근했어요! 확인해보세요.'
      : '퀘스트 위치에 도착했어요!';

  const payload: Notification = {
    title,
    body,
    android:
      Platform.OS === 'android'
        ? {
            channelId: 'default',
            pressAction: {id: 'default'},
          }
        : undefined,
    data:
      target.type === 'treasure'
        ? {screen: 'TreasureView', targetId: target.id}
        : {screen: 'QuestView', targetId: target.id},
  };

  await notifee.displayNotification(payload);
}

// ==============================
// 알림 탭 시 네비게이션
// ==============================
export async function onNotificationPress(data: {
  screen?: string;
  targetId?: string;
}) {
  // 허용 스크린만 선별
  const scr =
    data.screen === 'TreasureView' || data.screen === 'QuestView'
      ? (data.screen as 'TreasureView' | 'QuestView')
      : 'PlayHome';

  const nav: PendingNav =
    scr === 'PlayHome' || !data.targetId
      ? {screen: 'PlayHome'}
      : {screen: scr, params: {id: String(data.targetId)}};

  if (!navigationRef.isReady()) {
    pendingNotification = nav;
    return;
  }
  navigateToPlayScreen(nav);
}

// 앱 진입 후 네비 준비되면 호출 (App.tsx에서 setInterval로 주기 호출 중)
export function handlePendingNotification() {
  if (pendingNotification && navigationRef.isReady()) {
    navigateToPlayScreen(pendingNotification);
    pendingNotification = null;
  }
}

// ==============================
// 위치 트래킹
// ==============================
export async function startLocationTracking() {
  const ok = await requestLocationPermission();
  if (!ok) {
    console.warn('[location] 위치 권한이 거부됨');
    return;
  }

  await loadTargetsFromStorage();

  if (reloadTimer) clearInterval(reloadTimer);
  reloadTimer = setInterval(loadTargetsFromStorage, TARGETS_RELOAD_MS);

  // 기존 워치 정리
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
    Geolocation.stopObserving();
    watchId = null;
  }

  watchId = Geolocation.watchPosition(onPosition, onPositionError, {
    enableHighAccuracy: true,
    distanceFilter: 0,
    interval: WATCH_INTERVAL_MS,
    fastestInterval: WATCH_FASTEST_MS,
    showsBackgroundLocationIndicator: true, // iOS 표시(선택)
  });

  // 필요 시 해제 함수 반환
  return stopLocationTracking;
}

function onPosition(pos: GeoPosition) {
  const user = {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };

  for (const target of latestTargets) {
    const distance = haversine(user, {
      latitude: target.latitude,
      longitude: target.longitude,
    }); // meters

    if (
      distance <= DISTANCE_LIMITS[target.type] &&
      !hasRecentlyNotified(target.id)
    ) {
      triggerPushNotification(target).catch(e =>
        console.warn('[notifee] displayNotification 실패:', e),
      );
    }
  }
}

function onPositionError(error: GeoError) {
  console.warn('❌ 위치 수신 에러:', error);
}

export function stopLocationTracking() {
  if (reloadTimer) {
    clearInterval(reloadTimer);
    reloadTimer = null;
  }
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
    Geolocation.stopObserving();
    watchId = null;
  }
}
