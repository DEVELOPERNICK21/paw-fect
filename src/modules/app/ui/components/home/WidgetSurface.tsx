import React from 'react';
import type { ViewStyle } from 'react-native';

import { WidgetSurface as SharedWidgetSurface } from '../../../../../shared/components/WidgetSurface';
import type { Theme } from '../../../../../shared/hooks/useTheme';

type WidgetSurfaceProps = {
  theme: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Home re-export of shared WidgetSurface. */
export function WidgetSurface({
  theme,
  children,
  style,
}: WidgetSurfaceProps): React.ReactElement {
  return (
    <SharedWidgetSurface theme={theme} style={style}>
      {children}
    </SharedWidgetSurface>
  );
}
