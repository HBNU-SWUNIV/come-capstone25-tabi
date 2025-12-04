import Icon from 'react-native-vector-icons/Ionicons';

// ICON_MAP만 사용
const ICON_MAP: Record<string, {active: string; inactive: string}> = {
  Play: {active: 'game-controller', inactive: 'game-controller-outline'},
  Create: {active: 'duplicate', inactive: 'duplicate-outline'},
  QuestSocial: {
    active: 'extension-puzzle',
    inactive: 'extension-puzzle-outline',
  },
  TreasureSocial: {active: 'flag', inactive: 'flag-outline'},
  User: {active: 'person', inactive: 'person-outline'},
};

export const mainTabScreenOptions = ({route}: {route: any}) => ({
  tabBarIcon: ({focused, color, size}: any) => {
    const icons = ICON_MAP[route.name] || {
      active: 'ellipse',
      inactive: 'ellipse-outline',
    };

    const iconName = focused ? icons.active : icons.inactive;

    return <Icon name={iconName} size={size} color={color} />;
  },
  tabBarActiveTintColor: '#61402D',
  tabBarInactiveTintColor: 'gray',
  tabBarShowLabel: false,

  tabBarStyle: {
    backgroundColor: '#ECE9E1',
    borderTopWidth: 0,
    shadowColor: 'rgba(197, 193, 183, 0.25)',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 1,
    shadowRadius: 3,
    paddingTop: 6,
  },
  headerTitle: '',
  headerShown: false,
});
