import React from 'react'; // 생략되어 있는 경우 에러 발생 가능
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface StarRatingProps {
  count: number;
}

export default function StarRating({count}: StarRatingProps) {
  return (
    <View style={{flexDirection: 'row'}}>
      {[...Array(count)].map((_, idx) => (
        <Icon key={idx} name="star" size={14} color="#FFD700" />
      ))}
    </View>
  );
}
