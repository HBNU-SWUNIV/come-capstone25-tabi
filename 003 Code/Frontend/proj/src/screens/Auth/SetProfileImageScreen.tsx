import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {getMyCharacters} from '../../api/profile';
import {characterImageMap} from '../../characters/profileImages';
import {characterNameMap} from '../../characters/characterNameMap';
import StarRating from '../../components/StarRating';

type Character = {
  characterId: number;
  characterName: string;
  rank: number;
  characterURL: string;
};

function SetProfileImageScreen() {
  const navigation = useNavigation<any>();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await getMyCharacters();
        console.log(response);
        setCharacters(response.characters || []);
      } catch (error) {
        console.error('캐릭터 정보 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const handleSelect = (characterName: string, rank: number) => {
    const imageName = `${characterName}_${rank}.png`;
    navigation.navigate('SetProfile', {imageName});
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#61402D" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{padding: 20}}>
      {characters.map(character => {
        const imageName = `${character.characterName}_${character.rank}.png`;
        console.log(imageName);
        const imageSource = characterImageMap[imageName];

        if (!imageSource) return null; // 이미지가 없는 경우 건너뜀

        return (
          <Pressable
            key={character.characterId}
            onPress={() =>
              handleSelect(character.characterName, character.rank)
            }
            style={{alignItems: 'center', marginBottom: 20}}>
            <Image source={imageSource} style={{width: 100, height: 100}} />

            {/* 캐릭터 이름 한글 매핑 */}
            <Text style={{marginTop: 6, fontSize: 14, color: '#333'}}>
              {characterNameMap[character.characterName] ||
                character.characterName}
            </Text>

            {/* Rank에 따라 별 표시 */}
            <View style={{marginTop: 4}}>
              <StarRating count={character.rank} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default SetProfileImageScreen;
