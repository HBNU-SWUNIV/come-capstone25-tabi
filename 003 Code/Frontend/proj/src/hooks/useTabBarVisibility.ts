import {useCallback, useMemo} from 'react';
import {useNavigation} from '@react-navigation/native';

/** 현재 화면 기준, 상위 TabNavigator의 tabBar를 숨기거나 복원 */
export default function useTabBarVisibility() {
  const nav = useNavigation<any>();

  // 보통: Screen -> Stack -> Tabs. 혹시 더 래핑돼 있으면 한 단계 더 올라감.
  const tabNav = useMemo(() => {
    const p1 = nav?.getParent?.();
    const p2 = p1?.getParent?.();
    const p3 = p2?.getParent?.();
    // p2가 Tabs인 경우가 일반적, 없으면 p1 또는 p3 시도
    return p2 || p1 || p3 || nav;
  }, [nav]);

  const hideTabBar = useCallback(() => {
    if (!tabNav?.setOptions) return;
    tabNav.setOptions({
      // 기존 스타일이 있어도 display만 강제 오버라이드
      tabBarStyle: [{display: 'none'}],
    });
  }, [tabNav]);

  const showTabBar = useCallback(() => {
    if (!tabNav?.setOptions) return;
    // undefined로 원래 스타일 복원
    tabNav.setOptions({tabBarStyle: undefined});
  }, [tabNav]);

  return {hideTabBar, showTabBar};
}
