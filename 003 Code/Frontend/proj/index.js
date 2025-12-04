import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, {EventType} from '@notifee/react-native';
import {onNotificationPress} from './src/utils/locationTracker';
import 'react-native-get-random-values';

import {enableScreens} from 'react-native-screens';

enableScreens(true);

// ✅ Headless 이벤트 리스너 (index.js에서 등록)
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS && detail.notification?.data) {
    await onNotificationPress(detail.notification.data);
  }
});

AppRegistry.registerComponent(appName, () => App);
