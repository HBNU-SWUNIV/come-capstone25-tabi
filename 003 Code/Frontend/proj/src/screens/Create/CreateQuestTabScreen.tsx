import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import RocketIcon from '../../img/rocket.png';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import HeaderIcon from '../../components/HeaderIcon';

const {width, height} = Dimensions.get('window');

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedTextStyle = {
  color: '#ddd',
};

export default function CreateQuestTabScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <HeaderIcon />
      </View>
      <View style={styles.contentContainer}>
        <Image source={RocketIcon} style={styles.rocket} />
        <Text style={styles.brownText}>
          {'여러분들의 아이디어 넘치는\n퀘스트를 기다립니다!'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({pressed}) => [
            styles.createBtn,
            pressed && pressedButtonStyle,
          ]}
          onPress={() => navigation.navigate('CreateTypeSelection')}>
          {({pressed}) => (
            <Text style={[styles.createBtnText, pressed && pressedTextStyle]}>
              생성하기
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    justifyContent: 'space-between',
    paddingVertical: 30,
    paddingTop: height * 0.06,
  },

  headerContainer: {
    justifyContent: 'flex-start',
    width: width,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rocket: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  brownText: {
    color: '#61402D',
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  createBtn: {
    backgroundColor: '#61402D',
    width: 350,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
