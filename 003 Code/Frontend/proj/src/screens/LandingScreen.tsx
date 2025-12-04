import React, {useContext} from 'react';
import {
  Text,
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';

import Landing1 from '../img/landing1.png';
import {AuthContext} from '../context/AuthContent';

const {width, height} = Dimensions.get('window');
const pressedItemStyle = {
  backgroundColor: '#d2cfc8',
};
const pressedTextStyle = {
  opacity: 0.7,
};

function LandingScreen() {
  const {completeFirstLaunch} = useContext(AuthContext);

  const handleNext = async () => {
    console.log('🟡 버튼 눌림');
    // 첫 실행 완료 상태로 설정
    await completeFirstLaunch();
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={Landing1} style={styles.image} resizeMode="contain" />
      </View>
      <Pressable style={styles.buttonContainer} onPress={handleNext}>
        {({pressed}) => (
          <View style={[styles.nextButton, pressed && pressedItemStyle]}>
            <Text style={[styles.buttonText, pressed && pressedTextStyle]}>
              다음
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    paddingTop: height * 0.1,
  },
  imageContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: '100%',
    aspectRatio: 1340 / 1934,
    maxHeight: 600,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#61402D',
    paddingVertical: 14,
    paddingHorizontal: width / 2 - 50,
    borderRadius: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LandingScreen;
