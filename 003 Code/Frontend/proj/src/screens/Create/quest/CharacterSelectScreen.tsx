// src/screens/Quest/CharacterSelectScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {getMyCharacters} from '../../../api/profile';
import {characterImageMap} from '../../../characters/profileImages';
import {characterNameMap} from '../../../characters/characterNameMap';
import StarRating from '../../../components/StarRating';
import {SafeAreaView} from 'react-native-safe-area-context';

type CharacterRow = {
  characterId: number;
  characterName: string; // ex) 'owl'
  rank: number; // ex) 1
  characterURL?: string; // 원격 URL(optional)
};

type Character = {
  id: string;
  name: string;
  rank: number;
  avatar?: ImageSourcePropType; // require(...) 또는 {uri}
  // onPick으로 넘길 통일된 식별자(우선 로컬 파일명, 없으면 URL)
  imageUrlKey: string; // ex) 'owl_1.png' 또는 'https://.../owl_1.png'
};

function basename(u: string) {
  try {
    const i = u.lastIndexOf('/');
    return i >= 0 ? u.slice(i + 1) : u;
  } catch {
    return u;
  }
}

export default function CharacterSelectScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const onPick = route.params?.onPick as
    | ((payload: {imageUrl: string; name?: string}) => void)
    | undefined;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await getMyCharacters();
        const rows: CharacterRow[] = response?.characters ?? [];

        const mapped: Character[] = rows.map(ch => {
          const fileKey = `${ch.characterName}_${ch.rank}.png`;
          const local = characterImageMap[fileKey]; // require(...) | undefined
          const remoteUrl = ch.characterURL || undefined;
          const nameKo = characterNameMap[ch.characterName] || ch.characterName;

          // onPick에 넘길 대표 식별자: 로컬 우선(파일명), 없으면 원격 URL
          const imageUrlKey = local ? fileKey : remoteUrl ?? '';

          return {
            id: String(ch.characterId),
            name: nameKo,
            rank: ch.rank,
            avatar: local ?? (remoteUrl ? {uri: remoteUrl} : undefined),
            imageUrlKey,
          };
        });

        setCharacters(mapped);
      } catch (e) {
        console.error('캐릭터 정보 불러오기 실패', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#61402D" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        {characters.map(c => (
          <Pressable
            key={c.id}
            onPress={() => {
              // onPick에 통일된 포맷으로 전달: { imageUrl: 'owl_1.png' | 'https://...' , name }
              onPick?.({imageUrl: c.imageUrlKey, name: c.name});
              nav.goBack();
            }}
            style={styles.item}>
            {c.avatar && <Image source={c.avatar} style={styles.image} />}
            <Text style={styles.name}>{c.name}</Text>
            <StarRating count={c.rank} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {width: '48%', marginBottom: 24, alignItems: 'center'},
  image: {width: 100, height: 100, borderRadius: 50},
  name: {marginTop: 6, fontSize: 14, color: '#333'},
});
