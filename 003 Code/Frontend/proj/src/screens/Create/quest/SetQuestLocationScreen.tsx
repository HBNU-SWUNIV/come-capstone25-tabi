// src/screens/Quest/SetQuestLocationScreen.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE, Region} from 'react-native-maps';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuestLocations} from '../../../context/QuestLocationStore';
import SwipeableItem from 'react-native-swipeable-item';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveRunningLocations} from '../../../api/questCreation'; // ✅ API
import HeaderIcon from '../../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');
const C = {bg: '#ECE9E1', brown: '#61402D', chipBg: '#D6CFC6'};

const pinColors = [
  '#C94C4C',
  '#E76F51',
  '#FFBC42',
  '#6A994E',
  '#2A9D8F',
  '#277DA1',
  '#3A86FF',
  '#8E7DBE',
  '#8E44AD',
];

export default function SetQuestLocationScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const mapRef = useRef<MapView | null>(null);

  const {places, removePlace, setPlaces} = useQuestLocations();

  const [loading, setLoading] = useState(false);

  // ✅ questId를 route.params → AsyncStorage 순으로 결정
  const [questId, setQuestId] = useState<number | null>(null);
  const [resolvingQuestId, setResolvingQuestId] = useState(true);

  useEffect(() => {
    const resolveQuestId = async () => {
      try {
        // 1) 네비게이션 파라미터가 있으면 우선 사용 + 저장
        const fromRoute: number | undefined = route.params?.questId;
        if (typeof fromRoute === 'number' && Number.isFinite(fromRoute)) {
          setQuestId(fromRoute);
          await AsyncStorage.setItem('currentQuestId', String(fromRoute));
          return;
        }

        // 2) 없으면 AsyncStorage에서 복구
        const stored = await AsyncStorage.getItem('currentQuestId');
        if (stored) {
          const parsed = Number(stored);
          if (!Number.isNaN(parsed)) {
            setQuestId(parsed);
            return;
          }
        }

        // 3) 둘 다 없으면 에러 안내
        Alert.alert(
          '오류',
          'questId가 없습니다. 처음 단계부터 다시 시작해 주세요.',
        );
        nav.goBack();
      } finally {
        setResolvingQuestId(false);
      }
    };

    resolveQuestId();
  }, [route.params?.questId, nav]);

  const renderUnderlayLeft = (id: string) => (
    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>
      <TouchableOpacity
        onPress={() => removePlace(id)}
        style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={styles.removeBtn}>삭제</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDraggableItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<(typeof places)[number]>) => {
    const idx = getIndex?.() ?? 0;
    return (
      <SwipeableItem
        key={item.id}
        item={item}
        overSwipe={32}
        swipeEnabled={!isActive}
        renderUnderlayLeft={() => renderUnderlayLeft(item.id)}
        snapPointsLeft={[50]}>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.row, isActive && {opacity: 0.9}]}>
          <View
            style={[
              styles.idxDot,
              {backgroundColor: pinColors[idx % pinColors.length]},
            ]}>
            <Text style={styles.idxText}>{idx + 1}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.placeName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <View style={styles.rightBar} />
        </TouchableOpacity>
      </SwipeableItem>
    );
  };

  const initialRegion: Region = useMemo(
    () => ({
      latitude: places[0]?.lat ?? 36.3504,
      longitude: places[0]?.lng ?? 127.3845,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [places],
  );

  const focusToAll = () => {
    if (!mapRef.current || places.length === 0) return;
    mapRef.current.fitToCoordinates(
      places.map(p => ({latitude: p.lat, longitude: p.lng})),
      {
        edgePadding: {top: 60, bottom: 260, left: 40, right: 40},
        animated: true,
      },
    );
  };

  const handleSave = async () => {
    if (!questId) {
      Alert.alert('오류', 'questId가 확인되지 않았습니다.');
      return;
    }
    if (places.length === 0) {
      Alert.alert('안내', '저장할 위치가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      // sequence는 리스트 순서 기준 1-base
      const body = places.map((p, idx) => ({
        sequence: idx + 1,
        locationName: p.name,
        detailLocation: p.address,
        latitude: p.lat,
        longitude: p.lng,
        altitude: 0, // 고도 미수집이므로 기본값
        // questRunningLocationId: (p as any).questRunningLocationId, // 갱신 시 이미 알고 있다면 포함 가능 (없으면 제외)
      }));

      await saveRunningLocations(questId, body);
      Alert.alert('완료', '실행 위치가 성공적으로 저장되었습니다.');
      nav.navigate('SpotList', {questId}); // SpotList에서도 questId 활용 가능
    } catch (e: any) {
      console.log('[saveRunningLocations error]', e?.message ?? e);
      Alert.alert('오류', '실행 위치 저장 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ questId 복구 중이면 간단한 로딩만 표시(레이아웃 보존)
  if (resolvingQuestId) {
    return (
      <View
        style={[styles.wrap, {alignItems: 'center', justifyContent: 'center'}]}>
        <ActivityIndicator size="small" color={C.brown} />
        <Text style={{marginTop: 8, color: C.brown, opacity: 0.7}}>
          불러오는 중…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      {/* 타이틀/설명 */}
      <View style={styles.header}>
        <Text style={styles.title}>퀘스트 제작</Text>
        <Text style={styles.sub}>
          퀘스트는 실행할 위치와 위치에 여러 기록을 넣어 제작합니다!
        </Text>
      </View>

      {/* 지도 */}
      <View style={styles.mapBox}>
        <MapView
          ref={ref => (mapRef.current = ref)}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onMapReady={focusToAll}>
          {places.map((p, idx) => (
            <Marker
              key={p.id}
              coordinate={{latitude: p.lat, longitude: p.lng}}
              pinColor={pinColors[idx % pinColors.length]}
              title={`${idx + 1}. ${p.name}`}
              description={p.address}
            />
          ))}
        </MapView>
      </View>

      {/* 섹션 헤더 */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>퀘스트 실행 위치</Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => nav.navigate('SearchLocation')}>
          <Text style={styles.searchBtnText}>위치 검색</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listArea}>
        <DraggableFlatList
          containerStyle={{flex: 1}}
          contentContainerStyle={{flexGrow: 1}}
          data={places}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{color: C.brown, opacity: 0.6}}>
                위치를 추가해 주세요.
              </Text>
            </View>
          }
          renderItem={renderDraggableItem}
          onDragEnd={({data}) => setPlaces(data)} // 드래그 후 순서 변경
          activationDistance={4}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* 저장하기 */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={loading}>
        <Text style={styles.saveText}>{loading ? '저장 중…' : '저장하기'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: height * 0.06,
  },
  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
  },

  header: {paddingHorizontal: 20, paddingTop: 16},
  title: {fontSize: 22, fontWeight: '800', color: C.brown, marginBottom: 8},
  sub: {fontSize: 12, color: C.brown, opacity: 0.8},
  mapBox: {height: 220, marginVertical: 30, overflow: 'hidden'},
  sectionHead: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {fontSize: 16, fontWeight: '700', color: C.brown},
  searchBtn: {
    backgroundColor: C.brown,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  searchBtnText: {color: '#fff', fontWeight: '700', fontSize: 12},
  listArea: {flex: 1, paddingHorizontal: 20},
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    paddingVertical: 10,
    marginTop: 10,
  },
  idxDot: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  idxText: {color: '#fff', fontWeight: '800', fontSize: 12},
  placeName: {color: '#242424', fontWeight: '700'},
  address: {color: '#6b6b6b', fontSize: 12, marginTop: 2},
  rightBar: {
    height: '100%',
    width: 4,
    backgroundColor: C.brown,
    marginLeft: 'auto',
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: C.brown,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {color: '#fff', fontWeight: '700'},
  removeBtn: {
    marginTop: 10,
    color: '#C94C4C',
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
