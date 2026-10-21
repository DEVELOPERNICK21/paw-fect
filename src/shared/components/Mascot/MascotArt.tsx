import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';

import type { useTheme } from '../../hooks/useTheme';
import type { MascotMood, MascotSpecies } from './mascotTypes';

type Colors = ReturnType<typeof useTheme>['colors'];

export interface MascotArtProps {
  species: MascotSpecies;
  mood: MascotMood;
  colors: Colors;
  size: number;
  /** Momentary closed-eye frame used for blinking. */
  blink?: boolean;
}

/**
 * The character keeps one palette in light and dark mode (like a logo); only
 * the small accessories (thought dots, "z") follow the theme for contrast.
 */
const FUR = '#FFD199';
const EARS = '#F28C28';
const EARS_DARK = '#D77411';
const MUZZLE = '#FFF8F0';
const INK = '#0F172A';
const HIGHLIGHT = '#FFFFFF';
const BLUSH = 'rgba(238, 140, 43, 0.22)';
const TONGUE = '#F27A7A';

const EYE_Y = 58;
const LEFT_EYE_X = 45;
const RIGHT_EYE_X = 75;

const CLOSED_HAPPY_MOODS: readonly MascotMood[] = ['proud', 'celebrating'];

function mouthFor(mood: MascotMood): { d: string; filled?: boolean } {
  switch (mood) {
    case 'curious':
      return { d: 'M57,87 a3,3.5 0 1,0 6,0 a3,3.5 0 1,0 -6,0 Z', filled: true };
    case 'nudge':
      return { d: 'M52,85 Q60,91 68,85' };
    case 'thinking':
      return { d: 'M54,86 Q61,90 67,85' };
    case 'proud':
      return { d: 'M48,82 Q60,98 72,82' };
    case 'celebrating':
      return { d: 'M50,82 Q60,102 70,82 Z', filled: true };
    case 'sleepy':
      return { d: 'M55,86 Q60,89 65,86' };
    case 'happy':
    case 'wave':
    default:
      return { d: 'M52,84 Q60,92 68,84' };
  }
}

/**
 * Placeholder character art (flat SVG, theme-token colours) so every placement
 * can ship now. It is deliberately replaceable: swap this file's output for the
 * illustrator's Rive/Lottie rig without touching any screen.
 */
export const MascotArt: React.FC<MascotArtProps> = ({
  species,
  mood,
  colors,
  size,
  blink = false,
}) => {
  const ink = INK;
  const eyesClosedHappy = CLOSED_HAPPY_MOODS.includes(mood);
  const eyesClosedSleepy = mood === 'sleepy';
  const eyesBlinking = blink && !eyesClosedHappy && !eyesClosedSleepy;
  const lookUp = mood === 'thinking';
  const mouth = mouthFor(mood);

  const eye = (cx: number): React.ReactElement => {
    if (eyesClosedHappy) {
      return (
        <Path
          d={`M${cx - 5},${EYE_Y + 2} Q${cx},${EYE_Y - 5} ${cx + 5},${EYE_Y + 2}`}
          stroke={ink}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    if (eyesClosedSleepy || eyesBlinking) {
      return (
        <Path
          d={`M${cx - 5},${EYE_Y} Q${cx},${EYE_Y + 5} ${cx + 5},${EYE_Y}`}
          stroke={ink}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    const cy = lookUp ? EYE_Y - 3 : EYE_Y;
    return (
      <G>
        <Circle cx={cx} cy={cy} r={5.5} fill={ink} />
        <Circle cx={cx + 1.8} cy={cy - 1.8} r={1.7} fill={HIGHLIGHT} />
      </G>
    );
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {species === 'dog' ? (
        <G>
          <Ellipse
            cx={22}
            cy={52}
            rx={13}
            ry={25}
            fill={EARS}
            transform="rotate(-14 22 52)"
          />
          <Ellipse
            cx={98}
            cy={52}
            rx={13}
            ry={25}
            fill={EARS}
            transform="rotate(14 98 52)"
          />
          <Circle cx={60} cy={62} r={40} fill={FUR} />
          <Ellipse cx={60} cy={79} rx={21} ry={14} fill={MUZZLE} />
          <Ellipse cx={60} cy={71} rx={7} ry={5} fill={ink} />
        </G>
      ) : (
        <G>
          <Polygon points="22,44 28,10 54,30" fill={EARS} />
          <Polygon points="98,44 92,10 66,30" fill={EARS} />
          <Circle cx={60} cy={64} r={39} fill={FUR} />
          <Polygon points="55.5,72 64.5,72 60,77.5" fill={EARS_DARK} />
          <Line x1={20} y1={76} x2={40} y2={78} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={20} y1={86} x2={40} y2={83} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={100} y1={76} x2={80} y2={78} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={100} y1={86} x2={80} y2={83} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      )}

      <Circle cx={35} cy={73} r={6} fill={BLUSH} />
      <Circle cx={85} cy={73} r={6} fill={BLUSH} />

      {eye(LEFT_EYE_X)}
      {eye(RIGHT_EYE_X)}

      {mood === 'curious' ? (
        <Path d="M69,46 Q76,41 83,45" stroke={ink} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      ) : null}
      {mood === 'nudge' ? (
        <G>
          <Path d="M38,48 L52,45" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M68,45 L82,48" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        </G>
      ) : null}

      {mouth.filled ? (
        <Path d={mouth.d} fill={ink} />
      ) : (
        <Path d={mouth.d} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
      )}
      {mood === 'celebrating' ? (
        <Ellipse cx={60} cy={92} rx={4.5} ry={3} fill={TONGUE} />
      ) : null}

      {mood === 'wave' ? (
        <G transform="rotate(18 106 88)">
          <Ellipse cx={106} cy={88} rx={9} ry={13} fill={FUR} stroke={EARS} strokeWidth={2} />
          <Ellipse cx={106} cy={92} rx={4.5} ry={3.5} fill={EARS_DARK} />
          <Circle cx={101.5} cy={85} r={1.8} fill={EARS_DARK} />
          <Circle cx={106} cy={82.5} r={1.8} fill={EARS_DARK} />
          <Circle cx={110.5} cy={85} r={1.8} fill={EARS_DARK} />
        </G>
      ) : null}
      {mood === 'thinking' ? (
        <G fill={colors.text.secondary}>
          <Circle cx={92} cy={24} r={2.5} />
          <Circle cx={100} cy={16} r={3.5} />
          <Circle cx={110} cy={8} r={4.5} />
        </G>
      ) : null}
      {mood === 'sleepy' ? (
        <Path
          d="M92,26 h12 l-12,12 h12"
          stroke={colors.text.secondary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : null}
      {mood === 'proud' || mood === 'celebrating' ? (
        <Path
          d="M102,12 l2.4,6.6 l6.6,2.4 l-6.6,2.4 l-2.4,6.6 l-2.4,-6.6 l-6.6,-2.4 l6.6,-2.4 z"
          fill={colors.warning}
        />
      ) : null}
      {mood === 'celebrating' ? (
        <G>
          <Circle cx={16} cy={20} r={3} fill={colors.accent} />
          <Circle cx={10} cy={44} r={2.5} fill={colors.info} />
          <Circle cx={112} cy={46} r={3} fill={colors.success} />
          <Circle cx={24} cy={8} r={2} fill={colors.danger} />
        </G>
      ) : null}
    </Svg>
  );
};
