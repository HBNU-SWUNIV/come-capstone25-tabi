import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, View, StyleSheet, Text} from 'react-native';

type Props = {
  onFinish: () => void;
  initialCount?: number; // 기본값 2초
};

export default function LoadingCircleCountDown({
  onFinish,
  initialCount = 2,
}: Props) {
  const rotation = useRef(new Animated.Value(0)).current;
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // 회전 애니메이션 시작
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // 카운트 감소 타이머
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onFinish, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (count === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.absoluteCenter}>
        <Text style={styles.text}>{count}</Text>
      </View>
      <Animated.View
        style={[styles.circle, {transform: [{rotate: rotateInterpolate}]}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  absoluteCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#373737',
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '400',
    color: '#373737',
  },
});
