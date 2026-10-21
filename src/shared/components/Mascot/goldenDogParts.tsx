import React from 'react';
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { fluffPath, strandPath } from './furGeometry';
import type { MascotMood } from './mascotTypes';

/**
 * Original golden-puppy character (front-facing, symmetrical) on the shared 256
 * canvas. Built for cuteness and volume: big round head, eyes set low and wide,
 * short muzzle, small soft ears, chubby body. Depth comes from soft alpha
 * gradients (highlight, core shadow, rim light), not heavy outlines. Each export
 * is one rig part; every layer's <Svg> must include <GoldenDefs />.
 */
const OUT = '#6B4426';
const OW = 1.9;
const line = { stroke: OUT, strokeWidth: OW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const HEAD_D = fluffPath({ cx: 128, cy: 100, rx: 67, ry: 56, tufts: 34, depth: 0.032, seed: 3 });
const BODY_D = 'M106,150 C84,162 62,196 68,226 C72,242 98,250 128,250 C158,250 184,242 188,226 C194,196 172,162 150,150 Z';
const EAR_D = fluffPath({ cx: 56, cy: 98, rx: 21, ry: 40, tufts: 14, depth: 0.075, seed: 11, rotate: 8 });
const TAIL_LOBES = [
  { cx: 198, cy: 234, rx: 17, ry: 13, rotate: 10, seed: 1 },
  { cx: 220, cy: 224, rx: 15, ry: 16, rotate: 25, seed: 2 },
  { cx: 232, cy: 202, rx: 13, ry: 17, rotate: 5, seed: 3 },
  { cx: 230, cy: 180, rx: 10, ry: 14, rotate: -10, seed: 4 },
];

export const GoldenDefs: React.FC = () => (
  <Defs>
    <RadialGradient id="gdFur" cx="0.36" cy="0.3" r="0.85">
      <Stop offset="0" stopColor="#FFE8B4" />
      <Stop offset="0.5" stopColor="#F6C973" />
      <Stop offset="1" stopColor="#DFA04C" />
    </RadialGradient>
    <LinearGradient id="gdBody" x1="0.2" y1="0" x2="0.8" y2="1">
      <Stop offset="0" stopColor="#F9D48A" />
      <Stop offset="1" stopColor="#DFA24F" />
    </LinearGradient>
    <LinearGradient id="gdEar" x1="0.2" y1="0" x2="0.9" y2="1">
      <Stop offset="0" stopColor="#EFBE6E" />
      <Stop offset="1" stopColor="#C98639" />
    </LinearGradient>
    <RadialGradient id="gdCream" cx="0.45" cy="0.35" r="0.8">
      <Stop offset="0" stopColor="#FFFAEB" />
      <Stop offset="1" stopColor="#F8E5B6" />
    </RadialGradient>
    <RadialGradient id="gdHi" cx="0.5" cy="0.5" r="0.5">
      <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
      <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
    </RadialGradient>
    <RadialGradient id="gdShade" cx="0.5" cy="0.5" r="0.5">
      <Stop offset="0" stopColor="#A5601F" stopOpacity="0.42" />
      <Stop offset="1" stopColor="#A5601F" stopOpacity="0" />
    </RadialGradient>
    <RadialGradient id="gdIris" cx="0.5" cy="0.35" r="0.8">
      <Stop offset="0" stopColor="#A56C3C" />
      <Stop offset="1" stopColor="#5A3320" />
    </RadialGradient>
    <RadialGradient id="gdNose" cx="0.35" cy="0.3" r="0.8">
      <Stop offset="0" stopColor="#74584F" />
      <Stop offset="1" stopColor="#241816" />
    </RadialGradient>
    <ClipPath id="gdHeadClip">
      <Path d={HEAD_D} />
    </ClipPath>
    <ClipPath id="gdBodyClip">
      <Path d={BODY_D} />
    </ClipPath>
  </Defs>
);

interface P {
  mood: MascotMood;
}

export const GoldenShadow: React.FC = () => <Ellipse cx={128} cy={249} rx={86} ry={8} fill="rgba(107,68,38,0.18)" />;

export const GoldenTail: React.FC = () => (
  <G>
    {TAIL_LOBES.map(l => (
      <Path key={`o${l.seed}`} d={fluffPath({ ...l, tufts: 9, depth: 0.12 })} fill="#E6AE56" {...line} />
    ))}
    {TAIL_LOBES.map(l => (
      <Path key={`f${l.seed}`} d={fluffPath({ ...l, rx: l.rx * 0.9, ry: l.ry * 0.9, tufts: 9, depth: 0.1 })} fill="#EDB963" />
    ))}
    <Path d="M236,186 C240,204 232,220 218,230" stroke="#F9DB9C" strokeWidth={3.4} strokeLinecap="round" fill="none" opacity={0.7} />
  </G>
);

export const GoldenBody: React.FC<P> = ({ mood }) => (
  <G>
    <Path d={BODY_D} fill="url(#gdBody)" {...line} />
    <G clipPath="url(#gdBodyClip)">
      {/* belly glow + side shading + rim light for volume */}
      <Ellipse cx={128} cy={214} rx={42} ry={40} fill="url(#gdHi)" opacity={0.7} />
      <Ellipse cx={186} cy={214} rx={34} ry={50} fill="url(#gdShade)" />
      <Ellipse cx={70} cy={214} rx={26} ry={46} fill="url(#gdShade)" opacity={0.7} />
      <Ellipse cx={128} cy={158} rx={46} ry={16} fill="url(#gdShade)" opacity={0.9} />
    </G>
    <Path d="M80,176 C72,196 70,214 74,230" stroke="#FFF3CF" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.55} />
    {/* hind paws */}
    <G>
      <Ellipse cx={70} cy={241} rx={21} ry={11.5} fill="url(#gdBody)" {...line} />
      <Ellipse cx={186} cy={241} rx={21} ry={11.5} fill="url(#gdBody)" {...line} />
      <Path d="M60,248 C59,244 60,241 62,238 M70,249 C69,245 70,241 71,238 M80,248 C80,244 81,241 82,238 M176,248 C175,244 176,241 177,238 M186,249 C185,245 186,241 187,238 M196,248 C196,244 197,241 198,238" stroke={OUT} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.8} />
    </G>
    {/* chubby front legs */}
    <Path d="M99,204 C96,222 96,234 100,244 C104,252 124,252 128,244 C128,230 128,216 126,204 Z" fill="url(#gdBody)" {...line} />
    {mood === 'wave' ? null : (
      <Path d="M130,204 C128,216 128,230 128,244 C132,252 152,252 156,244 C160,234 160,222 157,204 Z" fill="url(#gdBody)" {...line} />
    )}
    <Path d="M105,250 C104,246 105,243 107,240 M113,251 C113,247 114,243 115,240 M121,250 C121,246 122,243 123,240" stroke={OUT} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.8} />
    {mood === 'wave' ? null : (
      <Path d="M135,250 C134,246 135,243 137,240 M143,251 C143,247 144,243 145,240 M151,250 C151,246 152,243 153,240" stroke={OUT} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.8} />
    )}
  </G>
);

export const GoldenChest: React.FC = () => (
  <G>
    <Path
      d="M100,168 C94,184 98,204 108,216 L112,226 L119,214 L124,230 L130,216 L137,228 L141,214 L148,222 C158,206 162,184 156,168 Z"
      fill="url(#gdCream)"
      stroke={OUT}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Path d={strandPath(128, 190, 16, 40, 140, 4, 6, 4)} stroke="#E4C58A" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.85} />
  </G>
);

export const GoldenCollar: React.FC = () => (
  <G>
    <Path d="M99,164 Q128,186 157,164" stroke={OUT} strokeWidth={12} strokeLinecap="round" fill="none" />
    <Path d="M99,164 Q128,186 157,164" stroke="#2FA39B" strokeWidth={8} strokeLinecap="round" fill="none" />
    <Path d="M107,162 Q128,176 149,162" stroke="rgba(255,255,255,0.4)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </G>
);

export const GoldenTag: React.FC = () => (
  <G transform="translate(0,15)">
    <Circle cx={128} cy={172} r={8.5} fill="#FFC857" stroke={OUT} strokeWidth={1.8} />
    <Ellipse cx={125} cy={169} rx={3} ry={2} fill="rgba(255,255,255,0.6)" />
    <Path
      d="M128,177 c-3.6,-2.8 -5.6,-4.6 -5.6,-7.4 c0,-1.9 1.5,-3 3,-3 c1,0 1.8,0.5 2.6,1.4 c0.8,-0.9 1.6,-1.4 2.6,-1.4 c1.5,0 3,1.1 3,3 c0,2.8 -2,4.6 -5.6,7.4 z"
      fill="#E4572E"
    />
  </G>
);

export const GoldenHeadBase: React.FC = () => (
  <G>
    <Path d={HEAD_D} fill="url(#gdFur)" {...line} />
    <G clipPath="url(#gdHeadClip)">
      {/* volume: core shadow bottom-right, glow top-left, forehead sheen */}
      <Ellipse cx={170} cy={150} rx={72} ry={52} fill="url(#gdShade)" />
      <Ellipse cx={96} cy={146} rx={34} ry={22} fill="url(#gdShade)" opacity={0.55} />
      <Ellipse cx={104} cy={72} rx={44} ry={26} fill="url(#gdHi)" />
      {/* muzzle + cheek puffs */}
      <Ellipse cx={128} cy={130} rx={30} ry={22} fill="url(#gdCream)" />
      <Ellipse cx={104} cy={132} rx={16} ry={13} fill="url(#gdCream)" opacity={0.9} />
      <Ellipse cx={152} cy={132} rx={16} ry={13} fill="url(#gdCream)" opacity={0.9} />
      <Ellipse cx={128} cy={150} rx={44} ry={9} fill="url(#gdShade)" opacity={0.7} />
    </G>
    {/* rim light along the top-left edge */}
    <Path d="M70,96 C68,70 90,50 120,47" stroke="#FFF1C9" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.7} />
    {/* soft fur flicks on the forehead */}
    <Path d="M118,52 C115,43 122,38 127,44 M129,50 C127,40 135,35 140,42 M140,52 C142,45 148,43 150,48" stroke={OUT} strokeWidth={1.9} strokeLinecap="round" fill="none" opacity={0.85} />
    <Path d={strandPath(128, 96, 44, 225, 315, 5, 6, 3)} stroke="#C98A3C" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.4} />
  </G>
);

export const GoldenEar: React.FC<{ side: 'L' | 'R' }> = ({ side }) => (
  <G transform={side === 'R' ? 'translate(256,0) scale(-1,1)' : undefined}>
    <Path d={EAR_D} fill="url(#gdEar)" {...line} />
    <Path d="M70,74 C72,96 70,118 62,132" stroke="#A8692A" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.28} />
    <Path d="M46,84 C40,100 42,118 50,130" stroke="#F9D48A" strokeWidth={3.4} strokeLinecap="round" fill="none" opacity={0.75} />
    <Path d={strandPath(56, 104, 17, 130, 235, 3, 7, 9)} stroke="#F9D48A" strokeWidth={1.9} strokeLinecap="round" fill="none" opacity={0.6} />
  </G>
);

type EyeKind = 'open' | 'happy' | 'sleepy' | 'wink';

const Eye: React.FC<{ cx: number; cy: number; kind: EyeKind; look: { dx: number; dy: number } }> = ({ cx, cy, kind, look }) => {
  if (kind === 'happy' || kind === 'wink') {
    return <Path d={`M${cx - 13},${cy + 5} Q${cx},${cy - 13} ${cx + 13},${cy + 5}`} stroke={OUT} strokeWidth={3.8} strokeLinecap="round" fill="none" />;
  }
  if (kind === 'sleepy') {
    return <Path d={`M${cx - 12},${cy - 1} Q${cx},${cy + 9} ${cx + 12},${cy - 1}`} stroke={OUT} strokeWidth={3.4} strokeLinecap="round" fill="none" />;
  }
  const x = cx + look.dx;
  const y = cy + look.dy;
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={13.5} ry={15} fill="#2A1814" />
      <Ellipse cx={x} cy={y + 1.5} rx={11} ry={12.5} fill="url(#gdIris)" />
      <Ellipse cx={x} cy={y + 1} rx={6} ry={7} fill="#160C0A" />
      <Path d={`M${x - 11},${y - 5} Q${x},${y - 18} ${x + 11},${y - 5}`} stroke="rgba(0,0,0,0.4)" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Circle cx={x - 4.6} cy={y - 5.6} r={5} fill="#FFFFFF" />
      <Circle cx={x + 5.2} cy={y + 5.6} r={2.4} fill="#FFFFFF" opacity={0.92} />
      <Path d={`M${x - 7.5},${y + 9.5} Q${x},${y + 14} ${x + 7.5},${y + 9.5}`} stroke="rgba(255,236,200,0.6)" strokeWidth={2} strokeLinecap="round" fill="none" />
    </G>
  );
};

export const GoldenFace: React.FC<P & { blink?: boolean; wink?: boolean }> = ({ mood, blink = false, wink = false }) => {
  const happy = mood === 'proud' || mood === 'celebrating';
  const baseKind: EyeKind = happy ? 'happy' : mood === 'sleepy' ? 'sleepy' : blink ? 'sleepy' : 'open';
  const rightKind: EyeKind = baseKind === 'open' && (wink || mood === 'wave') ? 'wink' : baseKind;
  const look =
    mood === 'thinking' ? { dx: -3.5, dy: -4.5 } : mood === 'curious' ? { dx: 3.5, dy: -1.5 } : mood === 'nudge' ? { dx: 0, dy: 2 } : { dx: 0, dy: 0 };
  const open = mood === 'happy' || mood === 'wave' || mood === 'celebrating' || mood === 'proud';
  const brow = { stroke: '#B57A33', strokeWidth: 3.2, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <G>
      {mood === 'nudge' ? (
        <G>
          <Path d="M80,92 Q93,80 110,78" {...brow} />
          <Path d="M146,78 Q163,80 176,92" {...brow} />
        </G>
      ) : mood === 'curious' ? (
        <G>
          <Path d="M82,88 Q95,82 110,86" {...brow} />
          <Path d="M146,72 Q162,64 178,74" {...brow} />
        </G>
      ) : mood === 'sleepy' ? null : (
        <G>
          <Path d="M82,90 Q95,82 110,86" {...brow} />
          <Path d="M146,86 Q161,82 174,90" {...brow} />
        </G>
      )}
      <Ellipse cx={78} cy={128} rx={10} ry={6.5} fill="#F59E8D" opacity={0.42} />
      <Ellipse cx={178} cy={128} rx={10} ry={6.5} fill="#F59E8D" opacity={0.42} />
      <Eye cx={98} cy={108} kind={baseKind} look={look} />
      <Eye cx={158} cy={108} kind={rightKind} look={look} />
      {/* nose */}
      <Path d="M115,119 C115,112 121,110 128,110 C135,110 141,112 141,119 C141,127 135,131 128,131 C121,131 115,127 115,119 Z" fill="url(#gdNose)" />
      <Ellipse cx={121.5} cy={114} rx={5.5} ry={2.4} fill="rgba(255,255,255,0.6)" />
      <Path d="M128,131 L128,137" stroke={OUT} strokeWidth={2} strokeLinecap="round" />
      {open ? (
        <G>
          <Path d="M112,139 C114,149 121,155 128,155 C135,155 142,149 144,139 C137,144 119,144 112,139 Z" fill="#8B3B40" stroke={OUT} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M119,144 C121,153 125,158 128,158 C131,158 135,153 137,144 C133,147 123,147 119,144 Z" fill="#F0909A" />
          <Path d="M128,148 L128,157" stroke="#D0707B" strokeWidth={1.6} strokeLinecap="round" />
        </G>
      ) : mood === 'curious' ? (
        <Ellipse cx={128} cy={144} rx={5} ry={6.5} fill="#7E3238" stroke={OUT} strokeWidth={1.6} />
      ) : (
        <G>
          <Path d="M128,137 Q121,146 112,140" stroke={OUT} strokeWidth={2.3} strokeLinecap="round" fill="none" />
          <Path d="M128,137 Q135,146 144,140" stroke={OUT} strokeWidth={2.3} strokeLinecap="round" fill="none" />
        </G>
      )}
    </G>
  );
};

export const GoldenArm: React.FC = () => (
  <G>
    <Path d="M150,214 C170,212 184,196 188,172 C189,166 202,166 204,172 C206,200 190,224 154,230 Z" fill="url(#gdBody)" {...line} />
    <Ellipse cx={150} cy={216} rx={15} ry={15} fill="url(#gdBody)" {...line} />
    <Ellipse cx={198} cy={156} rx={16} ry={17} fill="url(#gdBody)" {...line} />
    <Path d="M191,160 C190,156 191,152 193,150 M198,163 C198,158 199,153 200,150 M205,160 C205,156 206,152 208,150" stroke={OUT} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.85} />
    <Ellipse cx={193} cy={150} rx={5} ry={3} fill="rgba(255,255,255,0.45)" />
  </G>
);
