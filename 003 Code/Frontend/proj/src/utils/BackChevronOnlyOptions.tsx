import {useNavigation} from '@react-navigation/native';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {HeaderBackButton} from '@react-navigation/elements';

export const BackChevronOnlyOptions = () => {
  const nav = useNavigation<any>();

  return {
    headerTitle: '',
    headerStyle: {
      backgroundColor: '#ECE9E1',
      shadowOpacity: 0,
      elevation: 0,
    },
    headerTintColor: '#61402D',
    contentStyle: {
      backgroundColor: '#ECE9E1',
    },
    headerLeft: () => (
      <HeaderBackButton
        onPress={() => nav.goBack()}
        tintColor="#61402D"
        // backImage={() => (
        //   <View
        //     style={{
        //       width: 36,
        //       height: 36,
        //       borderRadius: 18,
        //       alignItems: 'center',
        //       justifyContent: 'center',
        //     }}>
        //     <Icon name="chevron-back" size={22} color="#61402D" />
        //   </View>
        // )}
        // style={{marginLeft: 12}} // 인셋
      />
    ),
    headerLeftContainerStyle: {
      paddingTop: 20, // 원하는 만큼 내림
      paddingBottom: 20,
    },
  };
};
