import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {BlurView} from '@react-native-community/blur';
import {
  fetchTreasureHuntFeed,
  playTreasureHunt,
} from '../../../api/treasureHuntPost';
import Geolocation from 'react-native-geolocation-service';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useCommentModal} from '../../../context/CommentModalProvider';
import {getLocalProfileImage} from '../../../characters/profileImages';

const {width, height} = Dimensions.get('window');

interface TreasureItem {
  id: number;
  location: string;
  title: string;
  description: string;
  author: string;
  image: {uri: string};
  likes: number;
  played: number;
  latitude?: number;
  longitude?: number;
  uploadUserProfileUrl?: string; // <- 프로필 경로(서버)
}

const API_BASE_URL = 'https://port-0-tabi-9zxht12blqj9n2fu.sel4.cloudtype.app';

const Card = ({
  item,
  onPress,
  onPlay,
}: {
  item: TreasureItem;
  onPress: (i: TreasureItem) => void;
  onPlay: (i: TreasureItem) => void;
}) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <TouchableOpacity onPress={() => onPress(item)} style={styles.card}>
      <Image source={item.image} style={styles.cardImage} />
      <View style={styles.cardFooter}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={12}
          reducedTransparencyFallbackColor="rgba(255,255,255,0.35)"
          pointerEvents="none"
        />
        <View style={styles.cardFooterContent} pointerEvents="box-none">
          <View style={styles.cardLeft}>
            <Text
              style={styles.cardTitle}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.location}
            </Text>
            <Text style={styles.cardAuthor}>@{item.author}</Text>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.iconGroup}>
              <TouchableOpacity
                onPress={() => {
                  setSaved(s => !s);
                  onPlay(item);
                }}>
                <Icon
                  name={saved ? 'game-controller' : 'game-controller-outline'}
                  size={20}
                  color={'#61402D'}
                />
              </TouchableOpacity>
              <Text style={styles.iconLabel}>{item.played}</Text>
            </View>
            <View style={styles.iconGroup}>
              <TouchableOpacity onPress={() => setLiked(l => !l)}>
                <Icon
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={'#E06167'}
                />
              </TouchableOpacity>
              <Text style={styles.iconLabel}>{item.likes}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TreasureSocialScreen = () => {
  const [query, setQuery] = useState('');
  const [treasures, setTreasures] = useState<TreasureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const {openCommentModal} = useCommentModal();

  const mapResponseToTreasureItems = (response: any[]): TreasureItem[] =>
    response.map(item => ({
      id: item.treasureHuntPostId,
      location: item.treasureHuntStartLocation.indicateLocation,
      description: item.treasureHuntDescription,
      title: item.treasureHuntTitle,
      author: item.uploadUserName,
      image: {uri: `${API_BASE_URL}${item.treasureHuntPostImage.imageUrl}`},
      likes: item.postCounter.likeCount,
      played: item.postCounter.playCount,
      latitude: item.treasureHuntStartLocation.latitude,
      longitude: item.treasureHuntStartLocation.longitude,
      uploadUserProfileUrl: item.uploadUserProfileUrl, // 예: '/profile-characters/owl_1.png'
    }));

  const fetchTreasureData = async () => {
    try {
      setLoading(true);
      const res = await fetchTreasureHuntFeed(0);
      if (Array.isArray(res.data)) {
        setTreasures(mapResponseToTreasureItems(res.data));
      } else {
        setTreasures([]);
      }
    } catch (e) {
      console.warn('보물 피드 불러오기 실패', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (item: TreasureItem) => {
    // 🔴 여기서 avatar는 로컬 require를 넘긴다
    const avatarRequire = getLocalProfileImage(item.uploadUserProfileUrl);

    openCommentModal({
      treasureHuntPostId: item.id,
      author: item.author,
      title: item.title,
      description: item.description,
      avatar: avatarRequire, // ← require(...) number | undefined
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', fetchTreasureData);
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchTreasureData();
    }, []),
  );

  const handlePlay = async (treasure: TreasureItem) => {
    try {
      await new Promise<void>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          async pos => {
            try {
              const payload = {
                treasureHuntPostId: treasure.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              };
              const res = await playTreasureHunt(payload);
              console.log('[Get Contract] <=', res.status);
              setTreasures(prev =>
                prev.map(t =>
                  t.id === treasure.id ? {...t, played: t.played + 1} : t,
                ),
              );
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          error => reject(error),
          {enableHighAccuracy: true, timeout: 7000, maximumAge: 10000},
        );
      });
    } catch (err: any) {
      console.log(
        '[Get Contract] error =>',
        err?.response?.status,
        err?.response?.data || err?.message,
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color="#fff" style={{marginRight: 6}} />
        <TextInput
          placeholder="검색"
          placeholderTextColor="#c5a491"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#61402D" />
      ) : (
        <FlatList
          data={treasures}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <Card item={item} onPress={handleCardPress} onPlay={handlePlay} />
          )}
          numColumns={2}
          columnWrapperStyle={styles.cardRow}
          contentContainerStyle={styles.cardContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ECE9E1',
    paddingHorizontal: 16,
    paddingTop: height * 0.1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#61402D',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  searchInput: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  cardContainer: {
    paddingVertical: 24,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ddd',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cardFooterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#242424',
    maxWidth: 100,
  },
  cardAuthor: {
    fontSize: 10,
    fontWeight: '300',
    color: '#555',
  },
  cardRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconGroup: {
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '300',
    color: '#242424',
    marginTop: 2,
  },
});

export default TreasureSocialScreen;
