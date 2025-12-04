// src/screens/Quest/_Wheel.tsx
import React, {useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export const ITEM_H = 44;

type WheelProps = {
  data: number[];
  value: number;
  onChange: (v: number) => void;
  label?: string;
  color?: string; // 비활성 색
  activeColor?: string; // 활성(가운데) 색
  lineColor?: string; // 바 색
  rows?: 3;
};

const ACTIVE_FONT_SIZE = 18; // 활성 폰트 크기
const INACTIVE_FONT_SIZE = 16; // 비활성 폰트 크기(1~2px 작게)

export default function Wheel({
  data,
  value,
  onChange,
  label,
  color = '#A58E81',
  activeColor = '#61402D',
  lineColor = '#8F7B70',
  rows = 3,
}: WheelProps) {
  const ref = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // 🔒 재진입/중복 스냅 방지 플래그
  const isSnappingRef = useRef(false);
  const hadMomentumRef = useRef(false);

  const index = useMemo(() => Math.max(0, data.indexOf(value)), [data, value]);

  const viewportH = ITEM_H * rows;
  const centerTop = (rows / 2 - 0.5) * ITEM_H;
  const centerBot = (rows / 2 + 0.5) * ITEM_H;

  // 외부 값 변경 → 스크롤 동기화(애니메이션 없이 정확히 맞춤)
  useEffect(() => {
    const y = index * ITEM_H;
    ref.current?.scrollToOffset({offset: y, animated: false});
    scrollY.setValue(y);
  }, [index, scrollY]);

  // 안전한 인덱스 계산
  const clampIndex = (i: number) => Math.max(0, Math.min(i, data.length - 1));
  const calcIndexFromOffset = (y: number) => clampIndex(Math.round(y / ITEM_H));

  // 스냅(재진입 방지 + 필요시만 onChange)
  const doSnap = (y: number, animated: boolean) => {
    if (isSnappingRef.current) return;
    isSnappingRef.current = true;

    const i = calcIndexFromOffset(y);
    const v = data[i];

    // 먼저 위치를 고정
    ref.current?.scrollToOffset({offset: i * ITEM_H, animated});

    // 값 변경은 위치 고정 직후 한 번만
    if (v !== value) onChange(v);

    // 다음 프레임에 스냅 종료
    requestAnimationFrame(() => {
      isSnappingRef.current = false;
    });
  };

  // 이벤트 핸들러
  const onMomentumBegin = () => {
    hadMomentumRef.current = true;
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 모멘텀 종료 시에는 애니메이션 없이 “순간” 스냅
    doSnap(e.nativeEvent.contentOffset.y, false);
    hadMomentumRef.current = false;
  };

  const onDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 모멘텀이 이어질 예정이면 여기선 스킵
    if (hadMomentumRef.current) return;
    // 짧은 드래그로 끝나면 부드럽게 맞춰주기
    doSnap(e.nativeEvent.contentOffset.y, true);
  };

  const renderItem = ({item, index: i}: {item: number; index: number}) => {
    const inputRange = [(i - 1) * ITEM_H, i * ITEM_H, (i + 1) * ITEM_H];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.96, 1, 0.96],
      extrapolate: 'clamp',
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.45, 1, 0.45],
      extrapolate: 'clamp',
    });

    const isActive = i === index;
    const textColor = isActive ? activeColor : color;
    const fontSize = isActive ? ACTIVE_FONT_SIZE : INACTIVE_FONT_SIZE;
    const fontWeight = isActive ? '600' : '400';

    return (
      <Animated.View style={[s.item, {transform: [{scale}], opacity}]}>
        <Text style={[s.itemTxt, {color: textColor, fontSize, fontWeight}]}>
          {item}
        </Text>
      </Animated.View>
    );
  };

  // 라벨: 아래 바 오른쪽 위 ‘밀착’
  const approxLabelH = 10;
  const labelTop = centerBot - approxLabelH - 2;
  const labelRight = 4;

  return (
    <View
      pointerEvents="box-none"
      collapsable={false}
      style={[s.viewport, {height: viewportH}]}>
      {/* 가이드 라인 */}
      <View
        pointerEvents="none"
        style={[s.centerLine, {backgroundColor: lineColor, top: centerTop}]}
      />
      <View
        pointerEvents="none"
        style={[s.centerLine, {backgroundColor: lineColor, top: centerBot}]}
      />

      <Animated.FlatList
        ref={ref}
        data={data}
        keyExtractor={n => String(n)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        snapToAlignment="start"
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          hadMomentumRef.current = false;
        }}
        onMomentumScrollBegin={onMomentumBegin}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onDragEnd}
        // 성능/안정성
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
        getItemLayout={(_, i) => ({
          length: ITEM_H,
          offset: ITEM_H * i,
          index: i,
        })}
        contentContainerStyle={{
          paddingTop: centerTop,
          paddingBottom: viewportH - centerBot,
        }}
      />

      {label ? (
        <View
          pointerEvents="none"
          style={[s.labelWrap, {top: labelTop, right: labelRight}]}>
          <Text style={s.label}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  viewport: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTxt: {
    // 폰트 크기/두께는 동적으로 주입
  },
  labelWrap: {
    position: 'absolute',
    width: '100%',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    fontWeight: '400',
    color: '#A58E81',
  },
});
