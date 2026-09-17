import React, { useId } from 'react';
import Svg, {
  Defs,
  Ellipse,
  G,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export interface Paw3dIconProps {
  size?: number;
  /** Soft cream clay (default) — reads well on accent FAB. */
  tone?: 'cream' | 'white';
}

/**
 * Soft clay / 3D paw glyph — highlight + depth without a flat Material icon.
 */
export const Paw3dIcon: React.FC<Paw3dIconProps> = ({
  size = 32,
  tone = 'cream',
}) => {
  const uid = useId().replace(/:/g, '');
  const padId = `pawPad-${uid}`;
  const toeId = `pawToe-${uid}`;
  const shadeId = `pawShade-${uid}`;

  const highlight = tone === 'white' ? '#FFFFFF' : '#FFF8F0';
  const mid = tone === 'white' ? '#F3F4F6' : '#F2C9A0';
  const deep = tone === 'white' ? '#D1D5DB' : '#D4894A';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
      <Defs>
        <RadialGradient id={padId} cx="34%" cy="28%" r="72%">
          <Stop offset="0%" stopColor={highlight} stopOpacity="1" />
          <Stop offset="52%" stopColor={mid} stopOpacity="1" />
          <Stop offset="100%" stopColor={deep} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id={toeId} cx="32%" cy="26%" r="70%">
          <Stop offset="0%" stopColor={highlight} stopOpacity="1" />
          <Stop offset="48%" stopColor={mid} stopOpacity="1" />
          <Stop offset="100%" stopColor={deep} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id={shadeId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Ground contact shadow */}
      <Ellipse cx="32" cy="58.5" rx="16" ry="3.2" fill={`url(#${shadeId})`} />

      <G>
        {/* Toe contact shadows */}
        <Ellipse cx="16" cy="24" rx="7.2" ry="8.4" fill="rgba(0,0,0,0.14)" />
        <Ellipse cx="26.5" cy="15.5" rx="6.6" ry="7.6" fill="rgba(0,0,0,0.12)" />
        <Ellipse cx="37.5" cy="15.5" rx="6.6" ry="7.6" fill="rgba(0,0,0,0.12)" />
        <Ellipse cx="48" cy="24" rx="7.2" ry="8.4" fill="rgba(0,0,0,0.14)" />
        <Ellipse cx="32" cy="44" rx="15.2" ry="13.2" fill="rgba(0,0,0,0.16)" />

        {/* Pads */}
        <Ellipse cx="16" cy="22.2" rx="7" ry="8.1" fill={`url(#${toeId})`} />
        <Ellipse cx="26.5" cy="13.8" rx="6.4" ry="7.3" fill={`url(#${toeId})`} />
        <Ellipse cx="37.5" cy="13.8" rx="6.4" ry="7.3" fill={`url(#${toeId})`} />
        <Ellipse cx="48" cy="22.2" rx="7" ry="8.1" fill={`url(#${toeId})`} />
        <Ellipse cx="32" cy="42.2" rx="14.8" ry="12.8" fill={`url(#${padId})`} />

        {/* Specular glints */}
        <Ellipse
          cx="13.8"
          cy="18.6"
          rx="2.4"
          ry="1.5"
          fill="#FFFFFF"
          opacity={0.55}
        />
        <Ellipse
          cx="24.6"
          cy="10.8"
          rx="2.1"
          ry="1.3"
          fill="#FFFFFF"
          opacity={0.5}
        />
        <Ellipse
          cx="35.6"
          cy="10.8"
          rx="2.1"
          ry="1.3"
          fill="#FFFFFF"
          opacity={0.5}
        />
        <Ellipse
          cx="45.8"
          cy="18.6"
          rx="2.4"
          ry="1.5"
          fill="#FFFFFF"
          opacity={0.55}
        />
        <Ellipse
          cx="26.5"
          cy="36.5"
          rx="5.5"
          ry="3.2"
          fill="#FFFFFF"
          opacity={0.42}
        />
      </G>
    </Svg>
  );
};
