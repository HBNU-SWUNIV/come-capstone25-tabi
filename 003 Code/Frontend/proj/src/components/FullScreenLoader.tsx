// src/components/FullScreenLoader.tsx
import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';

export default function FullScreenLoader() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color="#61402D" />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECE9E1',
  },
});
