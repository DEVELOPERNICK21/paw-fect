import React from 'react';

import { MaterialIcon, type IconName } from '../../../shared/components/MaterialIcon';

export type SmoothTabGlyph = 'home' | 'favorite' | 'wellness' | 'settings';

const TAB_MATERIAL_ICONS: Record<
  SmoothTabGlyph,
  { filled: IconName; outline: IconName }
> = {
  home: { filled: 'home', outline: 'home_outline' },
  favorite: { filled: 'favorite', outline: 'favorite_outline' },
  wellness: { filled: 'wellness', outline: 'wellness_outline' },
  settings: { filled: 'settings', outline: 'settings_outline' },
};

interface SmoothTabIconProps {
  name: SmoothTabGlyph;
  /** Material filled when active; Material outline when inactive. */
  active: boolean;
  size?: number;
  color: string;
  /** Unused — kept for call-site compatibility. */
  detailColor?: string;
}

/**
 * Material / Ionicons-style tab glyphs via the shared MaterialIcon set.
 */
export const SmoothTabIcon: React.FC<SmoothTabIconProps> = ({
  name,
  active,
  size = 24,
  color,
}) => {
  const icons = TAB_MATERIAL_ICONS[name];
  return (
    <MaterialIcon
      name={active ? icons.filled : icons.outline}
      size={size}
      color={color}
    />
  );
};
