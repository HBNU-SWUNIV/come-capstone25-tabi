import React, {useEffect, useRef} from 'react';
import {Animated, Easing, View, StyleSheet} from 'react-native';

type Props = {
  onFinish: () => void;
};

export default function LoadingCircle({onFinish}: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 2초 후 콜백 실행
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    // 회전 애니메이션
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    return () => clearTimeout(timer);
  }, [onFinish, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.wrapper}>
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
  circle: {
    width: 30,
    height: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#373737',
    borderTopColor: 'transparent',
  },
});
