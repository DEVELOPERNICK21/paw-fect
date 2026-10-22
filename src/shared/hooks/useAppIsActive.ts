import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Only a clearly hidden app counts as inactive: `currentState` can be `null` or
 * `unknown` while the app is starting, and the mascot should play then.
 */
const isForeground = (state: string | null | undefined): boolean =>
  state !== 'background' && state !== 'inactive';

/**
 * `true` while the app is in the foreground. Lets looping animations (like the
 * Rive mascot) stop drawing frames when nobody can see them.
 */
export function useAppIsActive(): boolean {
  const [active, setActive] = useState(isForeground(AppState.currentState));

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      setActive(isForeground(state));
    });
    return () => sub.remove();
  }, []);

  return active;
}
