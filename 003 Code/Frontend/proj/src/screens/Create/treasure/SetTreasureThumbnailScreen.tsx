import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useRef} from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTreasure} from '../../../context/TreasureContext';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImagePickerModal from '../../../components/ImagePickerModal';
import DEFAULT_IMAGE from '../../../characters/owl_1.png';
import {Modalize} from 'react-native-modalize';
import {SafeAreaView} from 'react-native-safe-area-context';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const pressedButtonStyle = {
  backgroundColor: '#503624',
  transform: [{scale: 0.97}],
};
const pressedButtonTextStyle = {
  color: '#ddd',
};

export default function SetThumbnailScreen() {
  const {treasure, setTreasure} = useTreasure();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const imagePickerModalRef = useRef<Modalize>(null);

  const handleImagePick = async (type: 'camera' | 'library') => {
    const result =
      type === 'camera'
        ? await launchCamera({mediaType: 'photo'})
        : await launchImageLibrary({mediaType: 'photo'});

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const {uri, type, fileName} = asset;

      if (!uri || !type || !ALLOWED_IMAGE_TYPES.includes(type)) {
        Alert.alert('지원하지 않는 이미지 형식입니다.');
        return;
      }

      setTreasure(prev => ({
        ...prev,
        imageInfo: {
          uri,
          type,
          name: fileName ?? 'treasure.jpg',
        },
      }));
    }

    imagePickerModalRef.current?.close();
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.brownLightText}>
          {`보물찾기의 단서가 될만한 이미지를 설정해주세요!\n해당 이미지는 보물찾기의 썸네일로 사용돼요.`}
        </Text>
      </View>
      <View style={styles.contentWrapper}>
        <Pressable
          onPress={() => imagePickerModalRef.current?.open()}
          style={styles.imageBox}>
          <Image
            source={
              treasure.imageInfo?.uri
                ? {uri: treasure.imageInfo.uri}
                : DEFAULT_IMAGE
            }
            style={styles.image}
          />
          {!treasure.imageInfo?.uri && (
            <Text style={styles.imageText}>이미지 추가</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({pressed}) => [
            styles.createBtn,
            pressed && pressedButtonStyle,
          ]}
          onPress={() => navigation.navigate('TreasureCreationEnd')}>
          {({pressed}) => (
            <Text
              style={[styles.createBtnText, pressed && pressedButtonTextStyle]}>
              다음
            </Text>
          )}
        </Pressable>
      </View>
      <ImagePickerModal
        ref={imagePickerModalRef}
        onSelect={type => handleImagePick(type)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 30,
    backgroundColor: '#ECE9E1',
  },
  header: {
    marginTop: 10,
    marginLeft: 46,
  },
  brownTitleText: {
    color: '#61402D',
    fontSize: 25,
    fontWeight: '500',
  },
  brownLightText: {
    color: '#61402D',
    fontWeight: '300',
    fontSize: 12,
  },
  contentWrapper: {
    // marginTop: 40,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBox: {
    width: 260,
    height: 300,
    alignSelf: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  imageText: {
    marginTop: 10,
    color: '#61402D',
    fontWeight: '500',
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
