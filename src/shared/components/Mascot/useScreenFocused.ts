import { NavigationContext } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';

/**
 * True while the surrounding navigation screen is focused. Outside a navigator
 * (tests, storybook) it is always true. Tab screens stay mounted when blurred,
 * so native surfaces (Rive) must be released on blur: stacking several GL
 * surfaces exhausts EGL memory on Android and punches holes in the tab bar.
 */
export function useScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => navigation?.isFocused() ?? true);

  useEffect(() => {
    if (!navigation) {
      return undefined;
    }
    setFocused(navigation.isFocused());
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);

  return focused;
}
