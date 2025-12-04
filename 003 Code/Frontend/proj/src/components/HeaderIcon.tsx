import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {Dimensions, Image, Pressable, StyleSheet, View} from 'react-native';
import {Text} from 'react-native-gesture-handler';

const {width, height} = Dimensions.get('window');
import AIRPLANE from '../img/plane_brown.png';

function HeaderIcon() {
  return (
    <Pressable
      onPress={() => {
        AsyncStorage.clear()
          .then(() => console.log('🧹 AsyncStorage 초기화 완료'))
          .catch(err => console.warn('❌ 초기화 실패:', err));
      }}>
      <View style={styles.headerLeftContainer}>
        <Text style={styles.headerTitle}>TaBi</Text>
        <Image source={AIRPLANE} style={styles.headerIcon} />
      </View>
    </Pressable>
  );
}

export default HeaderIcon;

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#61402D',
    marginRight: 4,
    fontFamily: 'Madimi One',
  },
  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'cover',
  },
});
