import React, {forwardRef, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Modalize} from 'react-native-modalize';
import Icon from 'react-native-vector-icons/Ionicons';

interface ImagePickerModalProps {
  onSelect: (value: 'camera' | 'library') => void;
}

const ImagePickerModal = forwardRef<Modalize, ImagePickerModalProps>(
  ({onSelect}, ref) => {
    const options = [
      {label: '카메라로 촬영', value: 'camera'},
      {label: '앨범에서 선택', value: 'library'},
    ];

    return (
      <Modalize
        ref={ref}
        modalStyle={styles.modal}
        adjustToContentHeight
        handlePosition="inside">
        <View style={styles.container}>
          <Text style={styles.title}>이미지 선택 방법</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => {
                onSelect(option.value as 'camera' | 'library');
              }}>
              <View style={styles.iconLabelWrapper}>
                <Icon
                  name={option.value === 'camera' ? 'camera' : 'image'}
                  size={24}
                  color="#61402D"
                  style={styles.optionIcon}
                />
                <Text style={styles.label}>{option.label}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#61402D" />
            </TouchableOpacity>
          ))}
        </View>
      </Modalize>
    );
  },
);

export default ImagePickerModal;

const styles = StyleSheet.create({
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40,
    backgroundColor: '#ECE9E1',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#242424',
    marginBottom: 20,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '300',
    color: '#2a2a2a',
  },
});
