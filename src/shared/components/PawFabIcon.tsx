import React from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

export interface PawFabIconProps {
  size?: number;
  color?: string;
  /** Soft drop shadow behind the glyph so it lifts off the gradient. */
  shadowColor?: string;
}

// Classic paw print: wide rounded-triangle pad with softly lobed bottom.
const PAD =
  'M32 28.5 C38 28.5 42 33.5 47 39.5 C51.5 44.5 53 49.5 50 54 C47 58.5 40.5 56.5 32 56.5 C23.5 56.5 17 58.5 14 54 C11 49.5 12.5 44.5 17 39.5 C22 33.5 26 28.5 32 28.5 Z';

const TOES = [
  { cx: 11.5, cy: 28, rx: 5.2, ry: 7.4, r: -24 },
  { cx: 24, cy: 13.5, rx: 5.6, ry: 8, r: -7 },
  { cx: 40, cy: 13.5, rx: 5.6, ry: 8, r: 7 },
  { cx: 52.5, cy: 28, rx: 5.2, ry: 7.4, r: 24 },
] as const;

/**
 * Crisp paw-print glyph for the center tab button: four rounded oval toes over a
 * rounded pad. Flat white reads cleaner on the accent gradient than the
 * old clay 3D paw.
 */
export const PawFabIcon: React.FC<PawFabIconProps> = ({
  size = 32,
  color = '#FFFFFF',
  shadowColor = 'rgba(120, 45, 0, 0.28)',
}) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
    <G transform="translate(0 1.8)">
      <Path d={PAD} fill={shadowColor} />
      {TOES.map(t => (
        <Ellipse
          key={`s-${t.cx}`}
          cx={t.cx}
          cy={t.cy}
          rx={t.rx}
          ry={t.ry}
          rotation={t.r}
          origin={`${t.cx}, ${t.cy}`}
          fill={shadowColor}
        />
      ))}
    </G>
    <Path d={PAD} fill={color} />
    {TOES.map(t => (
      <Ellipse
        key={t.cx}
        cx={t.cx}
        cy={t.cy}
        rx={t.rx}
        ry={t.ry}
        rotation={t.r}
        origin={`${t.cx}, ${t.cy}`}
        fill={color}
      />
    ))}
  </Svg>
);
