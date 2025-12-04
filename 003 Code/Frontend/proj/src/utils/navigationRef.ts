import {
  createNavigationContainerRef,
  NavigatorScreenParams,
} from '@react-navigation/native';

// 스택 내 Play 화면들
export type PlayStackParamList = {
  PlayHome: undefined;
  TreasureView: {id: string};
  QuestView: {id: string};
};

// 루트 탭 구조
export type RootTabParamList = {
  Play: NavigatorScreenParams<PlayStackParamList>;
  Create: undefined;
};

// Navigation Ref 객체
export const navigationRef = createNavigationContainerRef<RootTabParamList>();

// ✅ screen과 params의 조합을 구체적으로 명시
type NavigateToPlayScreenArg =
  | {screen: 'PlayHome'; params?: undefined}
  | {screen: 'TreasureView'; params: {id: string}}
  | {screen: 'QuestView'; params: {id: string}};

// navigate 함수
export function navigateToPlayScreen(arg: NavigateToPlayScreenArg) {
  if (!navigationRef.isReady()) return;

  // 정확한 타입을 명시적으로 지정해줌
  navigationRef.navigate('Play', {
    screen: arg.screen,
    params: arg.params,
  } as NavigatorScreenParams<PlayStackParamList>);
}
