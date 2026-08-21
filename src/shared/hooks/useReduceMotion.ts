import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Follows the OS reduced-motion setting so press/delight animation can no-op.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apply = (value: boolean): void => {
      if (!cancelled) {
        setReduceMotion(value);
      }
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(apply)
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      apply,
    );

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
