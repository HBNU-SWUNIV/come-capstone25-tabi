import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import HeaderIcon from '../img/plane_brown.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp} from '@react-navigation/native';

export const RootScreenOptions = () => {
  // 기본 헤더 스타일
  return {
    headerShown: false,

    // headerTitle: '',
    // headerLeft: () => (
    // <Pressable
    //   onPress={() => {
    //     AsyncStorage.clear()
    //       .then(() => console.log('🧹 AsyncStorage 초기화 완료'))
    //       .catch(err => console.warn('❌ 초기화 실패:', err));
    //   }}>
    //   <View style={styles.headerLeftContainer}>
    //     <Text style={styles.headerTitle}>TaBi</Text>
    //     <Image source={HeaderIcon} style={styles.headerIcon} />
    //   </View>
    // </Pressable>
    // ),
    // headerStyle: {
    //   backgroundColor: '#ECE9E1',
    // },
    // headerShadowVisible: false, // iOS / Android 그림자 제거
    // contentStyle: {
    //   backgroundColor: '#ECE9E1',
    // },
  };
};

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
