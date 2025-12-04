import React from 'react';
import {View, Pressable, StyleSheet, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function CustomStackHeader() {
  const navigation = useNavigation();

  const route = useRoute();

  const titleMap: Record<string, string> = {
    TreasureSetVisible: '보물찾기 공개 여부',
    TreasureSetTitle: '보물찾기 제목 설정',
    TreasureSetDescription: '보물찾기 설명 설정',
    TreasureSetThumbnail: '보물찾기 이미지 설정',
    QuestSetVisible: '퀘스트 공개 여부',
    QuestSetTitle: '퀘스트 제목 설정',
    QuestSetDescription: '퀘스트 설명 설정',
    QuestSetEstimatedTime: '퀘스트 예상 소요 시간 설정',
  };

  const title = titleMap[route.name] ?? '';

  return (
    <SafeAreaView edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#61402D" />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ECE9E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#61402D',
    marginLeft: 8,
  },
});
