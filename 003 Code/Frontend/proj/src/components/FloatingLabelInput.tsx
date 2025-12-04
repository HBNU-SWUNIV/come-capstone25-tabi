import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  selectMode?: boolean;
  onPress?: () => void;
  isModalOpen?: boolean;
  containerStyle?: object;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  selectMode = false,
  onPress,
  isModalOpen = false,
  containerStyle,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  useEffect(() => {
    if (!isModalOpen && selectMode) {
      setIsFocused(false);
    }
  }, [isModalOpen, selectMode]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 2],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#999', '#61402D'],
    }),
  };

  const borderBottomColor = isFocused ? '#61402D' : '#6E6E6E';
  const borderBottomWidth = isFocused ? 1.5 : 1;
  const iconColor = isFocused ? '#61402D' : '#6E6E6E';

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>

      {selectMode ? (
        <Pressable
          onPress={() => {
            setIsFocused(true);
            onPress?.();
          }}
          style={[
            styles.input,
            {
              borderBottomColor,
              borderBottomWidth,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}>
          <Text style={{color: '#000', fontSize: 16}}>{value}</Text>
          <Icon name="chevron-down" size={18} color={iconColor} />
        </Pressable>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, {borderBottomColor, borderBottomWidth}]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    marginBottom: 30,
  },
  input: {
    justifyContent: 'center',
    height: 25,
    fontSize: 16,
    color: '#000',
    paddingBottom: 5,
  },
});

export default FloatingLabelInput;
