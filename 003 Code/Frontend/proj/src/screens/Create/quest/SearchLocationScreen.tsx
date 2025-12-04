import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuestLocations} from '../../../context/QuestLocationStore';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import Config from 'react-native-config';
const GOOGLE_STATIC_MAP_KEY = Config.GOOGLE_STATIC_MAP_KEY;

const C = {bg: '#ECE9E1', brown: '#61402D'};

// 공용 Place 타입 (필요시 프로젝트 공용 타입 파일로 분리해 사용해도 됨)
export type Place = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export default function SearchLocationScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {addPlace} = useQuestLocations();
  const insets = useSafeAreaInsets();

  const [chips, setChips] = useState<string[]>([]);
  const [chipsH, setChipsH] = useState(0);
  const onChipsLayout = (e: LayoutChangeEvent) =>
    setChipsH(Math.ceil(e.nativeEvent.layout.height));

  // 선택한 항목
  const [selected, setSelected] = useState<{
    place_id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const ref = useRef<any>(null);

  const handleRowPress = (data: any, details: any) => {
    if (!details?.geometry?.location) return;
    const {lat, lng} = details.geometry.location;
    const name =
      details.name ?? data.structured_formatting?.main_text ?? data.description;
    const address =
      details.formatted_address ??
      data.structured_formatting?.secondary_text ??
      data.description;

    setSelected({
      place_id: data.place_id!,
      name,
      address,
      lat,
      lng,
    });

    if (name) setChips(prev => [...prev, name]);
  };

  const handleConfirm = () => {
    if (!selected) return;

    const result: Place = {
      id: selected.place_id,
      name: selected.name,
      address: selected.address,
      lat: selected.lat,
      lng: selected.lng,
    };

    const onPick: ((p: Place) => void) | undefined = route.params?.onPick;

    if (onPick) {
      // ✅ 호출자가 콜백을 넘긴 경우: 전역 저장 없이 콜백으로만 반환
      onPick(result);
    } else {
      // ✅ 콜백이 없으면 기존 화면(위치 리스트 편집) 시나리오: 전역에 추가
      addPlace(result);
    }
    nav.goBack();
  };

  return (
    <SafeAreaView edges={['top']} style={{flex: 1}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.wrap}>
          {/* 상단바: 뒤로 + 검색 입력 */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => nav.goBack()}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon
                name="chevron-back"
                size={24}
                color={C.brown}
                style={{marginTop: 8}}
              />
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <GooglePlacesAutocomplete
                ref={ref}
                placeholder="검색"
                fetchDetails
                keepResultsAfterBlur
                listViewDisplayed
                GooglePlacesDetailsQuery={{
                  fields: 'geometry,name,formatted_address',
                }}
                enablePoweredByContainer={false}
                keyboardShouldPersistTaps="handled"
                query={{
                  key: GOOGLE_STATIC_MAP_KEY,
                  language: 'ko',
                }}
                onFail={e => console.log('[places fail]', e)}
                onPress={handleRowPress}
                textInputProps={{
                  placeholderTextColor: '#B6B3B3', // placeholder 색상
                }}
                styles={{
                  container: {flex: 1, position: 'relative', zIndex: 10},
                  textInputContainer: {paddingRight: 0},
                  textInput: {
                    paddingLeft: 40,
                    height: 42,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    backgroundColor: '#8E766A',
                    color: '#fff',
                  },
                  listView: {
                    position: 'absolute',
                    top: 42 + 10 + chipsH,
                    left: -48,
                    right: -14,
                    marginTop: 0,
                    padding: 0,
                    backgroundColor: '#ECE9E1',
                    zIndex: 20,
                  },
                  row: {
                    backgroundColor: '#ECE9E1',
                    width: '100%',
                    padding: 0,
                    margin: 0,
                  },
                  description: {color: '#333'},
                  separator: {height: 0},
                }}
                renderLeftButton={() => (
                  <View style={styles.leftIconWrap}>
                    <Icon name="search" size={16} color="#fff" />
                  </View>
                )}
                renderRow={(rowData: any) => {
                  const isSelected = selected?.place_id === rowData.place_id;
                  return (
                    <View
                      style={[
                        styles.rowCustom,
                        isSelected && styles.rowSelected,
                      ]}>
                      <Text
                        style={[
                          styles.rowTitle,
                          isSelected && styles.rowTitleSelected,
                        ]}
                        numberOfLines={1}>
                        {rowData.structured_formatting?.main_text ??
                          rowData.description}
                      </Text>
                      {!!rowData.structured_formatting?.secondary_text && (
                        <Text
                          style={[
                            styles.rowSub,
                            isSelected && styles.rowSubSelected,
                          ]}
                          numberOfLines={1}>
                          {rowData.structured_formatting.secondary_text}
                        </Text>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          </View>

          {/* 칩 영역 */}
          <View style={styles.chipsRow} onLayout={onChipsLayout}>
            {chips.map((c, i) => (
              <View key={`${c}-${i}`} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setChips(prev => prev.filter((_, idx) => idx !== i))
                  }
                  hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                  <Icon name="close" size={12} color={'#fff'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* 플로팅 선택 버튼 */}
          {selected && (
            <View
              style={[
                styles.fabWrap,
                {bottom: (insets.bottom || 0) + 16, left: 16, right: 16},
              ]}
              pointerEvents="box-none">
              <TouchableOpacity style={styles.fab} onPress={handleConfirm}>
                <Text style={styles.fabText}>선택</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, backgroundColor: C.bg, paddingTop: 14},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchBox: {flex: 1},
  leftIconWrap: {
    position: 'absolute',
    left: 12,
    top: -4,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 11,
  },
  chipsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#8F7B70',
    borderRadius: 16,
  },
  chipText: {color: '#fff', fontSize: 12},
  rowCustom: {
    backgroundColor: '#ECE9E1',
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginVertical: 0,
    width: '100%',
  },
  rowSelected: {backgroundColor: C.brown},
  rowTitle: {color: '#242424', fontWeight: '600'},
  rowTitleSelected: {color: '#fff'},
  rowSub: {color: '#6b6b6b', fontSize: 12, marginTop: 2},
  rowSubSelected: {color: '#fff'},
  fabWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: C.brown,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#352318',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  fabText: {color: '#fff', fontWeight: '400', fontSize: 18},
});
