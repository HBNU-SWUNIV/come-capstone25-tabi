// Hello World

import {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
// import {createStackNavigator} from '@react-navigation/stack';
import {useContext} from 'react';
import {SignUpProvider} from './src/context/SignUpContext';

// 로더
import FullScreenLoader from './src/components/FullScreenLoader';

// 회원인증 관련
import LandingScreen from './src/screens/LandingScreen';
import AuthScreen from './src/screens/Auth/AuthScreen';
import SignUpTerms from './src/screens/Auth/SignUpTerms';
import TermsDetail from './src/screens/Auth/TermsDetail';
import SignUpProfile from './src/screens/Auth/SignUpProfile';
import SignUpAccount from './src/screens/Auth/SignUpAccount';
import SignUpCompleteScreen from './src/screens/Auth/SignUpCompleteScreen';
import SignUpFailureScreen from './src/screens/Auth/SignUpFailureScreen';
import SetProfileScreen from './src/screens/Auth/SetProfileScreen';
import SetProfileImageScreen from './src/screens/Auth/SetProfileImageScreen';

// MainTabs
import PlayTabScreen from './src/screens/Play/PlayTabScreen';
import CreateQuestTabScreen from './src/screens/Create/CreateQuestTabScreen';
import QuestTypeSelection from './src/screens/Create/QuestTypeSelection';
import QuestSocialScreen from './src/screens/Social/quest/QuestSocialScreen';
import TreasureSocialScreen from './src/screens/Social/treasure/TreasureSocialScreen';

// 마이페이지
import UserHomeScreen from './src/screens/User/UserHomeScreen';
import CharacterDrawScreen from './src/screens/User/CharacterDrawScreen';
import PremiumDrawScreen from './src/screens/User/PremiumDrawScreen';
import NormalDrawScreen from './src/screens/User/NormalDrawScreen';
import DrawResultScreen from './src/screens/User/DrawResultScreen';

// 보물찾기 생성
import HidingScreen from './src/screens/Create/treasure/HidingScreen';
import HidingPendingScreen from './src/screens/Create/treasure/HidingPendingScreen';
import SetTreasureVisibleScreen from './src/screens/Create/treasure/SetTreasureVisibleScreen';
import SetTreasureTitleScreen from './src/screens/Create/treasure/SetTreasureTitleScreen';
import SetTreasureDescriptionScreen from './src/screens/Create/treasure/SetTreasureDescriptionScreen';
import SetTreasureThumbnailScreen from './src/screens/Create/treasure/SetTreasureThumbnailScreen';
import TreasureCreationEndScreen from './src/screens/Create/treasure/TreasureCreationEndScreen';

// 보물찾기 플레이
import TreasureView from './src/screens/Play/treasure/TreasureView';
import CompleteScreen from './src/screens/Play/treasure/CompleteScreen';

// 퀘스트 플레이
import QuestView from './src/screens/Play/quest/QuestView';
import DialogScreen from './src/screens/Play/quest/DialogScreen';
import StayScreen from './src/screens/Play/quest/StayScreen';
import StepScreen from './src/screens/Play/quest/StepScreen';
import InputPuzzleScreen from './src/screens/Play/quest/InputPuzzleScreen';
import LocationPuzzleScreen from './src/screens/Play/quest/LocationPuzzleScreen';
import PhotoPuzzleScreen from './src/screens/Play/quest/PhotoPuzzleScreen';
import PuzzleWrongScreen from './src/screens/Play/quest/PuzzleWrongScreen';
import PuzzleCorrectScreen from './src/screens/Play/quest/PuzzleCorrectScreen';
import PhotoPuzzleCameraScreen from './src/screens/Play/quest/PhotoPuzzleCameraScreen';
import QuestClearScreen from './src/screens/Play/quest/QuestClearScreen';

// 퀘스트 생성
import SetQuestLocationScreen from './src/screens/Create/quest/SetQuestLocationScreen';
import SearchLocationScreen from './src/screens/Create/quest/SearchLocationScreen';
import SpotListScreen from './src/screens/Create/quest/SpotListScreen';
import ActionSettingScreen from './src/screens/Create/quest/ActionSettingScreen';
import SetDialogScreen from './src/screens/Create/quest/SetDialogScreen';
import SetStayScreen from './src/screens/Create/quest/SetStayScreen';
import SetStepsScreen from './src/screens/Create/quest/SetStepsScreen';
import SetPhotoPuzzleScreen from './src/screens/Create/quest/SetPhotoPuzzleScreen';
import SetInputPuzzleScreen from './src/screens/Create/quest/SetInputPuzzleScreen';
import SetLocationPuzzleScreen from './src/screens/Create/quest/SetLocationPuzzleScreen';
import CharacterSelectScreen from './src/screens/Create/quest/CharacterSelectScreen';

import SetQuestVisibleScreen from './src/screens/Create/quest/after-action-setting/SetQuestVisibleScreen';
import SetQuestTitleScreen from './src/screens/Create/quest/after-action-setting/SetQuestTitleScreen';
import SetQuestDescriptionScreen from './src/screens/Create/quest/after-action-setting/SetQuestDescriptionScreen';
import SetQuestEstimatedTime from './src/screens/Create/quest/after-action-setting/SetQuestEstimatedTimeScreen';
import QuestCreationEndScreen from './src/screens/Create/quest/after-action-setting/QuestCreationEndScreen';

import {mainTabScreenOptions} from './src/utils/mainTabScreenOptions';
import {RootScreenOptions} from './src/utils/RootScreenOptions';
import {BackChevronOnlyOptions} from './src/utils/BackChevronOnlyOptions';
import {defaultStackOptions} from './src/utils/defaultStackOptions';
import {
  handlePendingNotification,
  setupNotifee,
  startLocationTracking,
} from './src/utils/locationTracker';
import {navigationRef} from './src/utils/navigationRef';

import {AuthProvider, AuthContext} from './src/context/AuthContent';
import {TreasureProvider} from './src/context/TreasureContext';
import {getMyProfile} from './src/api/profile';

import {
  CommentModalProvider,
  useCommentModal,
} from './src/context/CommentModalProvider';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {QuestLocationProvider} from './src/context/QuestLocationStore';
import {ActionTimelineProvider} from './src/context/ActionTimelineStore';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const RootStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();

function CreateStack() {
  return (
    <MainStack.Navigator screenOptions={defaultStackOptions}>
      <MainStack.Screen
        name="CreateIntro"
        component={CreateQuestTabScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="CreateTypeSelection"
        component={QuestTypeSelection}
        options={{headerShown: false}}
      />

      {/* 보물찾기 */}
      <MainStack.Screen
        name="TreasureCreation"
        component={HidingScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="TreasureCreationPending"
        component={HidingPendingScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="TreasureSetVisible"
        component={SetTreasureVisibleScreen}
      />
      <MainStack.Screen
        name="TreasureSetTitle"
        component={SetTreasureTitleScreen}
      />
      <MainStack.Screen
        name="TreasureSetDescription"
        component={SetTreasureDescriptionScreen}
      />
      <MainStack.Screen
        name="TreasureSetThumbnail"
        component={SetTreasureThumbnailScreen}
      />
      <MainStack.Screen
        name="TreasureCreationEnd"
        component={TreasureCreationEndScreen}
        options={{headerShown: false}}
      />

      {/* 퀘스트 */}
      <MainStack.Screen
        name="SetQuestLocation"
        component={SetQuestLocationScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SearchLocation"
        component={SearchLocationScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SpotList"
        component={SpotListScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="ActionSetting"
        component={ActionSettingScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SetDialogScreen"
        component={SetDialogScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SetStayScreen"
        component={SetStayScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SetStepsScreen"
        component={SetStepsScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SetPhotoPuzzleScreen"
        component={SetPhotoPuzzleScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SetInputPuzzleScreen"
        component={SetInputPuzzleScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="SetLocationPuzzleScreen"
        component={SetLocationPuzzleScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="CharacterSelect"
        component={CharacterSelectScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="QuestSetVisible"
        component={SetQuestVisibleScreen}
      />
      <MainStack.Screen name="QuestSetTitle" component={SetQuestTitleScreen} />
      <MainStack.Screen
        name="QuestSetDescription"
        component={SetQuestDescriptionScreen}
      />
      <MainStack.Screen
        name="QuestSetEstimatedTime"
        component={SetQuestEstimatedTime}
      />
      <MainStack.Screen
        name="QuestCreationEnd"
        component={QuestCreationEndScreen}
        options={{headerShown: false}}
      />
    </MainStack.Navigator>
  );
}

function PlayStack() {
  return (
    <MainStack.Navigator screenOptions={defaultStackOptions}>
      <MainStack.Screen
        name="PlayHome"
        component={PlayTabScreen}
        options={{headerShown: false}}
      />

      {/* 보물찾기 */}
      <MainStack.Screen
        name="TreasureView"
        component={TreasureView}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="CompleteScreen"
        component={CompleteScreen}
        options={{headerShown: false}}
      />

      {/* 퀘스트 */}
      <MainStack.Screen
        name="QuestView"
        component={QuestView}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="DialogScreen"
        component={DialogScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="StayScreen"
        component={StayScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="StepScreen"
        component={StepScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="InputPuzzleScreen"
        component={InputPuzzleScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="LocationPuzzleScreen"
        component={LocationPuzzleScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="PhotoPuzzleScreen"
        component={PhotoPuzzleScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="PhotoPuzzleCameraScreen"
        component={PhotoPuzzleCameraScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="PuzzleWrongScreen"
        component={PuzzleWrongScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="PuzzleCorrectScreen"
        component={PuzzleCorrectScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="QuestClearScreen"
        component={QuestClearScreen}
        options={{headerShown: false}}
      />
    </MainStack.Navigator>
  );
}

function QuestSocialStack() {
  return (
    <MainStack.Navigator screenOptions={defaultStackOptions}>
      <MainStack.Screen
        name="QuestSocial"
        component={QuestSocialScreen}
        options={{headerShown: false}}
      />
    </MainStack.Navigator>
  );
}

function TreasureSocialStack() {
  return (
    <MainStack.Navigator screenOptions={defaultStackOptions}>
      <MainStack.Screen
        name="TreasureSocial"
        component={TreasureSocialScreen}
        options={{headerShown: false}}
      />
    </MainStack.Navigator>
  );
}

function UserStack() {
  return (
    <MainStack.Navigator screenOptions={defaultStackOptions}>
      <MainStack.Screen
        name="UserHome"
        component={UserHomeScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="CharacterDrawScreen"
        component={CharacterDrawScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="PremiumDrawScreen"
        component={PremiumDrawScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="NormalDrawScreen"
        component={NormalDrawScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen
        name="DrawResultScreen"
        component={DrawResultScreen}
        options={{headerShown: false}}
      />
    </MainStack.Navigator>
  );
}

function MainTabs() {
  const {isOpen} = useCommentModal();

  return (
    <MainTab.Navigator
      screenOptions={navProps => {
        const base = mainTabScreenOptions(navProps);
        return {
          ...base,
          tabBarStyle: isOpen
            ? [
                {display: 'none'},
                ...(Array.isArray(base.tabBarStyle)
                  ? base.tabBarStyle
                  : base.tabBarStyle
                  ? [base.tabBarStyle]
                  : []),
              ]
            : base.tabBarStyle,
        };
      }}>
      <MainTab.Screen name="QuestSocial" component={QuestSocialStack} />
      <MainTab.Screen name="TreasureSocial" component={TreasureSocialStack} />
      <MainTab.Screen name="Create" component={CreateStack} />
      <MainTab.Screen name="Play" component={PlayStack} />
      <MainTab.Screen name="User" component={UserStack} />
    </MainTab.Navigator>
  );
}

function ProfileStacks() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="SetProfile"
        component={SetProfileScreen}
        options={{headerShown: false}}
      />
      <ProfileStack.Screen
        name="SetProfileImage"
        component={SetProfileImageScreen}
        options={BackChevronOnlyOptions}
      />
    </ProfileStack.Navigator>
  );
}

function AppNavigator() {
  const {isFirstLaunch, isLoggedIn, hasProfile, setHasProfile} =
    useContext(AuthContext);

  useEffect(() => {
    let alive = true;
    const checkProfile = async () => {
      if (!isLoggedIn) {
        // 비로그인: 프로필 여부 무의미
        alive && setHasProfile(false);
        return;
      }
      try {
        await getMyProfile();
        alive && setHasProfile(true);
      } catch (err: any) {
        // 404면 미설정, 그 외 에러는 정책에 맞게 처리
        if (alive) {
          if (err?.response?.status === 404) setHasProfile(false);
          else setHasProfile(false); // or true/에러화면 등 정책에 맞게
        }
      }
    };
    checkProfile();
    return () => {
      alive = false;
    };
  }, [isLoggedIn, setHasProfile]);

  if (isFirstLaunch) {
    return (
      <NavigationContainer ref={navigationRef}>
        <LandingScreen />
      </NavigationContainer>
    );
  }

  // ✅ 확인 끝날 때까지 로더만 노출 (Navigator 렌더 안함)
  if (!isFirstLaunch && isLoggedIn && hasProfile === null) {
    return (
      <NavigationContainer ref={navigationRef}>
        <FullScreenLoader />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator>
        {isLoggedIn ? (
          hasProfile ? (
            <RootStack.Screen
              name="MainTabs"
              component={MainTabs}
              options={RootScreenOptions}
            />
          ) : (
            <RootStack.Screen
              name="ProfileStacks"
              component={ProfileStacks}
              options={RootScreenOptions}
            />
          )
        ) : (
          // 비로그인 스택
          <>
            {/* <RootStack.Screen
              name="TEST"
              component={NormalDrawScreen}
              options={{headerShown: false}}
            /> */}
            <RootStack.Screen
              name="Auth"
              component={AuthScreen}
              options={RootScreenOptions}
            />
            <RootStack.Screen
              name="SignUpTerms"
              component={SignUpTerms}
              options={BackChevronOnlyOptions}
            />
            <RootStack.Screen
              name="SignUpProfile"
              component={SignUpProfile}
              options={BackChevronOnlyOptions}
            />
            <RootStack.Screen
              name="SignUpAccount"
              component={SignUpAccount}
              options={BackChevronOnlyOptions}
            />
            <RootStack.Screen
              name="TermsDetail"
              component={TermsDetail}
              options={BackChevronOnlyOptions}
            />
            <RootStack.Screen
              name="SignUpComplete"
              component={SignUpCompleteScreen}
              options={RootScreenOptions}
            />
            <RootStack.Screen
              name="SignUpFailure"
              component={SignUpFailureScreen}
              options={RootScreenOptions}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    setupNotifee();
    startLocationTracking();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handlePendingNotification();
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <TreasureProvider>
          <AuthProvider>
            <SignUpProvider>
              <QuestLocationProvider>
                <ActionTimelineProvider>
                  <CommentModalProvider>
                    <AppNavigator />
                  </CommentModalProvider>
                </ActionTimelineProvider>
              </QuestLocationProvider>
            </SignUpProvider>
          </AuthProvider>
        </TreasureProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
