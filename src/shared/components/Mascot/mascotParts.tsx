import React from 'react';
import { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import { fluffPath, strandPath } from './furGeometry';
import { MOOD_POSE, PIVOT } from './mascotRig';
import type { MascotMood, MascotSpecies } from './mascotTypes';

/**
 * Character art, one function per rig part, authored on a 256 x 256 canvas in a
 * chibi sticker style (thick warm outline, flat colour, big glossy eyes).
 * `MascotArt` stacks these in one <Svg>; `Mascot` puts each in its own layer so
 * parts can be animated independently. Same drawing either way.
 */
export const OUT = '#5B3A2A';
const OW = 5;
const INK = '#2A1B2E';
const PAL = {
  dog: {
    fur: '#EDBB72',
    furShade: '#DDA458',
    cream: '#FFF1D8',
    patch: '#D9953F',
    ear: '#D9953F',
    earHi: '#F2BD70',
    nose: '#3B2A2A',
    iris: '#4A63B5',
  },
  cat: {
    fur: '#F6A24F',
    furShade: '#E38A32',
    cream: '#FFF0DA',
    patch: '#E38A32',
    ear: '#F6A24F',
    earHi: '#FFC17A',
    nose: '#E8788A',
    iris: '#3FAF7C',
  },
} as const;
const PINK = '#FF9AA4';
const PAD = '#FF8FA0';
const TONGUE = '#FF7F95';
const MOUTH_DARK = '#5A2630';
const COLLAR = '#D94A3A';

const stroke = { stroke: OUT, strokeWidth: OW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** A 4-point sparkle centred on (x, y). */
const sparklePath = (x: number, y: number, s: number): string =>
  `M${x},${y - s} L${x + s * 0.3},${y - s * 0.3} L${x + s},${y} L${x + s * 0.3},${y + s * 0.3} L${x},${y + s} L${x - s * 0.3},${y + s * 0.3} L${x - s},${y} L${x - s * 0.3},${y - s * 0.3} Z`;

interface PartProps {
  species: MascotSpecies;
  mood: MascotMood;
}

export const ShadowPart: React.FC = () => (
  <Ellipse cx={128} cy={241} rx={80} ry={9} fill="rgba(91,58,42,0.16)" />
);

const FluffyBlobs: React.FC<{ fill: string; blobs: { cx: number; cy: number; rx: number; ry: number; rotate: number; seed: number }[] }> = ({ fill, blobs }) => (
  <G>
    {/* pass 1: outlines of every blob; pass 2: fills on top hide the inner outlines */}
    {blobs.map(b => (
      <Path key={`o${b.seed}`} d={fluffPath({ ...b, tufts: 10, depth: 0.13 })} fill={fill} {...stroke} />
    ))}
    {blobs.map(b => (
      <Path key={`f${b.seed}`} d={fluffPath({ ...b, rx: b.rx * 0.92, ry: b.ry * 0.92, tufts: 10, depth: 0.1 })} fill={fill} />
    ))}
  </G>
);

export const TailPart: React.FC<PartProps> = ({ species }) => {
  const p = PAL[species];
  if (species === 'dog') {
    return (
      <FluffyBlobs
        fill={p.fur}
        blobs={[
          { cx: 190, cy: 214, rx: 14, ry: 12, rotate: 0, seed: 1 },
          { cx: 204, cy: 196, rx: 13, ry: 15, rotate: 20, seed: 2 },
          { cx: 208, cy: 176, rx: 12, ry: 15, rotate: 10, seed: 3 },
        ]}
      />
    );
  }
  return (
    <G>
      <FluffyBlobs
        fill={p.fur}
        blobs={[
          { cx: 192, cy: 220, rx: 16, ry: 13, rotate: 0, seed: 1 },
          { cx: 212, cy: 208, rx: 15, ry: 15, rotate: 30, seed: 2 },
          { cx: 220, cy: 186, rx: 14, ry: 16, rotate: 0, seed: 3 },
          { cx: 216, cy: 164, rx: 14, ry: 16, rotate: -15, seed: 4 },
          { cx: 220, cy: 144, rx: 12, ry: 14, rotate: 0, seed: 5 },
        ]}
      />
      <Path d="M206,214 L222,206 M212,192 L229,188 M210,170 L226,166" stroke={p.furShade} strokeWidth={5} strokeLinecap="round" fill="none" />
    </G>
  );
};

const LegPaw: React.FC<{ x: number; species: MascotSpecies }> = ({ x, species }) => {
  const p = PAL[species];
  return (
    <G>
      <Path d={`M${x},200 C${x},196 ${x + 20},196 ${x + 20},200 L${x + 20},226 C${x + 20},238 ${x},238 ${x},226 Z`} fill={p.fur} {...stroke} />
      <Path d={`M${x + 7},234 v-6 M${x + 13},234 v-6`} stroke={OUT} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
};

export const BodyPart: React.FC<PartProps> = ({ species, mood }) => {
  const p = PAL[species];
  const waving = mood === 'wave';
  const chest = MOOD_POSE[mood].chest;
  return (
    <G transform={`translate(0,${(1 - chest) * 150}) scale(1,${chest})`}>
      <Path d={fluffPath({ cx: 128, cy: 204, rx: 62, ry: 50, tufts: 16, depth: 0.075, seed: 3 })} fill={p.fur} {...stroke} />
      <Path d={fluffPath({ cx: 128, cy: 206, rx: 27, ry: 32, tufts: 9, depth: 0.12, seed: 5 })} fill={p.cream} />
      <Path d={strandPath(128, 206, 46, 20, 160, 7, 7, 2)} stroke={p.furShade} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.75} />
      {species === 'cat' ? (
        <G stroke={p.furShade} strokeWidth={5} strokeLinecap="round">
          <Path d="M72,188 L84,190 M70,204 L82,204 M74,218 L86,216" />
          <Path d="M184,188 L172,190 M186,204 L174,204 M182,218 L170,216" />
        </G>
      ) : null}
      {/* hind feet with pink pads */}
      <G>
        <Path d={fluffPath({ cx: 80, cy: 232, rx: 25, ry: 14, tufts: 8, depth: 0.14, seed: 4 })} fill={p.fur} {...stroke} />
        <Ellipse cx={80} cy={234} rx={10} ry={7.5} fill={PAD} />
        <Circle cx={69} cy={224} r={3.6} fill={PAD} />
        <Circle cx={80} cy={221} r={3.6} fill={PAD} />
        <Circle cx={91} cy={224} r={3.6} fill={PAD} />
        <Path d={fluffPath({ cx: 176, cy: 232, rx: 25, ry: 14, tufts: 8, depth: 0.14, seed: 6 })} fill={p.fur} {...stroke} />
        <Ellipse cx={176} cy={234} rx={10} ry={7.5} fill={PAD} />
        <Circle cx={165} cy={224} r={3.6} fill={PAD} />
        <Circle cx={176} cy={221} r={3.6} fill={PAD} />
        <Circle cx={187} cy={224} r={3.6} fill={PAD} />
      </G>
      <LegPaw x={104} species={species} />
      {waving ? null : <LegPaw x={132} species={species} />}
    </G>
  );
};

/** Raised front paw, only used by the wave mood (pivot = shoulder). */
export const ArmPart: React.FC<PartProps> = ({ species }) => {
  const p = PAL[species];
  return (
    <G>
      <Path d="M150,188 C178,188 198,172 202,150" stroke={OUT} strokeWidth={26} strokeLinecap="round" fill="none" />
      <Path d="M150,188 C178,188 198,172 202,150" stroke={p.fur} strokeWidth={16} strokeLinecap="round" fill="none" />
      <Ellipse cx={203} cy={140} rx={15} ry={17} fill={p.fur} {...stroke} />
      <Ellipse cx={203} cy={145} rx={7} ry={5.5} fill={PAD} />
      <Circle cx={195} cy={136} r={3} fill={PAD} />
      <Circle cx={203} cy={132} r={3} fill={PAD} />
      <Circle cx={211} cy={136} r={3} fill={PAD} />
    </G>
  );
};

export const CollarPart: React.FC<{ species?: MascotSpecies }> = ({ species = 'dog' }) => (
  <G>
    {/* chest ruff peeking out under the collar */}
    <Path d={fluffPath({ cx: 128, cy: 184, rx: 24, ry: 15, tufts: 7, depth: 0.2, seed: 8 })} fill={PAL[species].cream} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
    <Path d="M96,160 Q128,184 160,160" stroke={OUT} strokeWidth={17} strokeLinecap="round" fill="none" />
    <Path d="M96,160 Q128,184 160,160" stroke={COLLAR} strokeWidth={10} strokeLinecap="round" fill="none" />
  </G>
);

/** Bone tag, swings from the collar (pivot = collar centre). */
export const TagPart: React.FC = () => (
  <G transform="translate(0,12)">
    <Line x1={128} y1={160} x2={128} y2={170} stroke={OUT} strokeWidth={3} strokeLinecap="round" />
    <Path d="M120,172 L136,172 L136,181 L120,181 Z" fill="#FFFFFF" />
    <Circle cx={120} cy={172} r={4.4} fill="#FFFFFF" {...stroke} strokeWidth={3.2} />
    <Circle cx={120} cy={181} r={4.4} fill="#FFFFFF" {...stroke} strokeWidth={3.2} />
    <Circle cx={136} cy={172} r={4.4} fill="#FFFFFF" {...stroke} strokeWidth={3.2} />
    <Circle cx={136} cy={181} r={4.4} fill="#FFFFFF" {...stroke} strokeWidth={3.2} />
    <Path d="M120,172 L136,172 L136,181 L120,181 Z" fill="#FFFFFF" />
  </G>
);

export const HeadBasePart: React.FC<PartProps> = ({ species }) => {
  const p = PAL[species];
  const cat = species === 'cat';
  const rx = cat ? 78 : 76;
  const ry = cat ? 60 : 62;
  return (
    <G>
      {/* cheek ruffs: bigger swept tufts at the lower sides */}
      <Path d={fluffPath({ cx: 62, cy: 134, rx: 15, ry: 12, tufts: 6, depth: 0.2, seed: 12, rotate: 20 })} fill={p.fur} {...stroke} strokeWidth={4} />
      <Path d={fluffPath({ cx: 194, cy: 134, rx: 15, ry: 12, tufts: 6, depth: 0.2, seed: 13, rotate: -20 })} fill={p.fur} {...stroke} strokeWidth={4} />
      <Path d={fluffPath({ cx: 128, cy: 100, rx, ry, tufts: 20, depth: 0.075, seed: 7 })} fill={p.fur} {...stroke} />
      {cat ? (
        <G>
          <Path d="M128,44 Q122,58 128,70 Q134,58 128,44 Z" fill={p.furShade} />
          <Path d="M108,48 Q106,60 112,70 Q116,58 108,48 Z" fill={p.furShade} opacity={0.85} />
          <Path d="M148,48 Q150,60 144,70 Q140,58 148,48 Z" fill={p.furShade} opacity={0.85} />
        </G>
      ) : (
        <G>
          <Path d="M128,40 C112,52 108,70 118,88 C124,96 132,96 138,88 C148,70 144,52 128,40 Z" fill={p.cream} />
          <Path d={fluffPath({ cx: 98, cy: 102, rx: 25, ry: 27, tufts: 9, depth: 0.12, seed: 2 })} fill={p.patch} opacity={0.9} />
        </G>
      )}
      {/* top-of-head tuft */}
      <Path
        d="M114,42 Q108,24 120,30 Q122,18 130,28 Q136,16 142,32 Q150,26 144,44 Q130,36 114,42 Z"
        fill={p.fur}
        {...stroke}
        strokeWidth={3.6}
      />
      <Path d={fluffPath({ cx: 128, cy: cat ? 127 : 128, rx: cat ? 30 : 38, ry: cat ? 20 : 27, tufts: 10, depth: 0.1, seed: 9 })} fill={p.cream} />
      {/* fur strands */}
      <Path d={strandPath(128, 100, rx - 18, 215, 325, 6, 7, 4)} stroke={p.furShade} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.7} />
      
    </G>
  );
};

export const EarPart: React.FC<PartProps & { side: 'L' | 'R' }> = ({ species, mood, side }) => {
  const p = PAL[species];
  const flare = MOOD_POSE[mood].earFlare;
  const art =
    species === 'dog' ? (
      <G>
        <Path d={fluffPath({ cx: 46, cy: 102, rx: 24, ry: 44, tufts: 15, depth: 0.065, seed: 11, rotate: -14 })} fill={p.ear} {...stroke} />
        <Path d="M42,80 C36,100 38,118 46,128" stroke={p.earHi} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.75} />
        <Path d="M56,84 C54,98 56,110 60,118" stroke={p.earHi} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.5} />
      </G>
    ) : (
      <G>
        <Path d="M60,86 C48,62 50,38 58,18 C61,12 68,12 73,16 L106,52 Z" fill={p.ear} {...stroke} />
        <Path d="M70,76 C64,60 64,44 68,32 L90,52 Z" fill="#FFB4BC" />
        {/* inner-ear fur tufts */}
        <Path d="M66,76 L72,60 L76,72 L82,56 L86,70 L90,58 L92,76 Z" fill="#FFF0DA" stroke={OUT} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M54,40 l-4,-8 M60,30 l-3,-8" stroke={p.furShade} strokeWidth={3.6} strokeLinecap="round" />
      </G>
    );
  return (
    <G transform={side === 'R' ? 'translate(256,0) scale(-1,1)' : undefined}>
      <G transform={`rotate(${flare + (species === 'dog' ? 8 : 0)} ${PIVOT.earL.x} ${PIVOT.earL.y})`}>{art}</G>
    </G>
  );
};

type EyeKind = 'open' | 'happyClosed' | 'sleepyClosed' | 'closed' | 'wink';

function gaze(mood: MascotMood): { dx: number; dy: number } {
  if (mood === 'thinking') return { dx: -4, dy: -5 };
  if (mood === 'curious') return { dx: 4, dy: -1 };
  if (mood === 'nudge') return { dx: 0, dy: 2 };
  return { dx: 0, dy: 0 };
}

const Eye: React.FC<{ cx: number; kind: EyeKind; mood: MascotMood; species: MascotSpecies }> = ({ cx, kind, mood, species }) => {
  const cy = 104;
  if (kind === 'happyClosed') {
    return <Path d={`M${cx - 15},${cy + 5} Q${cx},${cy - 16} ${cx + 15},${cy + 5}`} stroke={OUT} strokeWidth={6} strokeLinecap="round" fill="none" />;
  }
  if (kind === 'wink') {
    return <Path d={`M${cx - 15},${cy + 4} Q${cx},${cy - 12} ${cx + 15},${cy + 4}`} stroke={OUT} strokeWidth={6} strokeLinecap="round" fill="none" />;
  }
  if (kind === 'sleepyClosed' || kind === 'closed') {
    return <Path d={`M${cx - 14},${cy - 1} Q${cx},${cy + 11} ${cx + 14},${cy - 1}`} stroke={OUT} strokeWidth={6} strokeLinecap="round" fill="none" />;
  }
  const { dx, dy } = gaze(mood);
  const x = cx + dx;
  const y = cy + dy;
  const iris = PAL[species].iris;
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={15} ry={18.5} fill={INK} stroke={OUT} strokeWidth={4} />
      <Path d={`M${x - 11},${y + 6} Q${x},${y + 20} ${x + 11},${y + 6} Q${x},${y + 12} ${x - 11},${y + 6} Z`} fill={iris} opacity={0.95} />
      <Path d={sparklePath(x - 4, y - 7, 8)} fill="#FFFFFF" />
      <Circle cx={x + 6} cy={y + 6} r={2.8} fill="#FFFFFF" />
      {mood === 'nudge' ? (
        <Path d={`M${x - 11},${y + 9} Q${x},${y + 19} ${x + 11},${y + 9}`} stroke="rgba(255,255,255,0.8)" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      ) : null}
    </G>
  );
};

function Brows({ mood }: { mood: MascotMood }): React.ReactElement | null {
  const s = { stroke: '#8A5A36', strokeWidth: 4.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 'curious':
      return (<G><Path d="M82,72 Q98,68 112,74" {...s} /><Path d="M142,58 Q158,50 172,60" {...s} /></G>);
    case 'nudge':
      return (<G><Path d="M82,78 Q96,68 114,66" {...s} /><Path d="M142,66 Q160,68 174,78" {...s} /></G>);
    case 'thinking':
      return (<G><Path d="M82,72 Q98,68 112,72" {...s} /><Path d="M142,68 Q158,60 172,66" {...s} /></G>);
    case 'proud':
    case 'celebrating':
      return (<G><Path d="M84,70 Q98,62 112,68" {...s} /><Path d="M144,68 Q158,62 172,70" {...s} /></G>);
    case 'sleepy':
      return null;
    default:
      return (<G><Path d="M84,74 Q98,68 112,72" {...s} /><Path d="M144,72 Q158,68 172,74" {...s} /></G>);
  }
}

function Mouth({ mood, species }: { mood: MascotMood; species: MascotSpecies }): React.ReactElement {
  const line = { stroke: OUT, strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const cat = species === 'cat';
  const y = cat ? 122 : 130;
  const open = mood === 'celebrating';
  const grin = mood === 'proud';
  if (open) {
    return (
      <G>
        <Path d={`M106,${y + 2} Q128,${y + 40} 150,${y + 2} Q128,${y + 10} 106,${y + 2} Z`} fill={MOUTH_DARK} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
        <Ellipse cx={128} cy={y + 26} rx={13} ry={9} fill={TONGUE} />
      </G>
    );
  }
  if (grin) {
    return (
      <G>
        <Path d={`M110,${y + 2} Q128,${y + 28} 146,${y + 2} Q128,${y + 8} 110,${y + 2} Z`} fill={MOUTH_DARK} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
        <Ellipse cx={128} cy={y + 17} rx={9} ry={6} fill={TONGUE} />
      </G>
    );
  }
  if (mood === 'curious') {
    return <Ellipse cx={128} cy={y + 8} rx={6} ry={7.5} fill={MOUTH_DARK} stroke={OUT} strokeWidth={3} />;
  }
  if (mood === 'sleepy') {
    return <Path d={`M118,${y + 6} Q128,${y + 10} 138,${y + 6}`} {...line} />;
  }
  if (mood === 'nudge' || mood === 'thinking') {
    return (
      <G>
        <Path d={`M128,${y} L128,${y + 4}`} {...line} />
        <Path d={`M128,${y + 4} Q121,${y + 12} 113,${y + 6}`} {...line} />
        <Path d={`M128,${y + 4} Q135,${y + 12} 143,${y + 6}`} {...line} />
      </G>
    );
  }
  return (
    <G>
      <Path d={`M128,${y} L128,${y + 5}`} {...line} />
      <Path d={`M128,${y + 5} Q119,${y + 15} 109,${y + 6}`} {...line} />
      <Path d={`M128,${y + 5} Q137,${y + 15} 147,${y + 6}`} {...line} />
      {mood === 'happy' || mood === 'wave' ? (
        <Path d={`M121,${y + 12} Q128,${y + 28} 135,${y + 12} Z`} fill={TONGUE} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
    </G>
  );
}

export const FacePart: React.FC<PartProps & { blink?: boolean; wink?: boolean }> = ({ species, mood, blink = false, wink = false }) => {
  const p = PAL[species];
  const cat = species === 'cat';
  const baseKind: EyeKind =
    mood === 'proud' || mood === 'celebrating' ? 'happyClosed' : mood === 'sleepy' ? 'sleepyClosed' : blink ? 'closed' : 'open';
  const rightKind: EyeKind = baseKind === 'open' && (wink || mood === 'wave') ? 'wink' : baseKind;
  return (
    <G>
      <Ellipse cx={80} cy={128} rx={11} ry={7} fill={PINK} opacity={0.5} />
      <Ellipse cx={176} cy={128} rx={11} ry={7} fill={PINK} opacity={0.5} />
      {cat ? (
        <G stroke="rgba(91,58,42,0.6)" strokeWidth={2.6} strokeLinecap="round">
          <Line x1={96} y1={126} x2={56} y2={118} />
          <Line x1={96} y1={132} x2={54} y2={134} />
          <Line x1={160} y1={126} x2={200} y2={118} />
          <Line x1={160} y1={132} x2={202} y2={134} />
        </G>
      ) : null}
      {/* nose */}
      {cat ? (
        <Path d="M120,114 Q128,110 136,114 Q133,122 128,123 Q123,122 120,114 Z" fill={p.nose} stroke={OUT} strokeWidth={2.6} strokeLinejoin="round" />
      ) : (
        <G>
          <Path d="M119,114 Q128,108 137,114 Q134,124 128,126 Q122,124 119,114 Z" fill={p.nose} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={124} cy={113} rx={4} ry={2} fill="rgba(255,255,255,0.6)" />
        </G>
      )}
      <Mouth mood={mood} species={species} />
      <Eye cx={100} kind={baseKind} mood={mood} species={species} />
      <Eye cx={156} kind={rightKind} mood={mood} species={species} />
      <Brows mood={mood} />
    </G>
  );
};

/** Floating accessories (sparkles, confetti, zzz, thought dots). Not rigged. */
export const ExtrasPart: React.FC<{ mood: MascotMood; secondary: string }> = ({ mood, secondary }) => (
  <G>
    {mood === 'thinking' ? (
      <G fill={secondary}>
        <Circle cx={196} cy={50} r={4} />
        <Circle cx={210} cy={36} r={5.5} />
        <Circle cx={226} cy={20} r={7} />
      </G>
    ) : null}
    {mood === 'sleepy' ? (
      <G stroke={secondary} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M208,56 h16 l-16,17 h16" />
        <Path d="M232,28 h11 l-11,12 h11" />
      </G>
    ) : null}
    {mood === 'proud' || mood === 'celebrating' ? (
      <G>
        <Path d={sparklePath(214, 40, 15)} fill="#FFC857" />
        <Path d={sparklePath(38, 48, 9)} fill="#FFC857" opacity={0.9} />
      </G>
    ) : null}
    {mood === 'celebrating' ? (
      <G>
        <Circle cx={26} cy={22} r={4.4} fill="#F27A86" />
        <Circle cx={236} cy={88} r={4.4} fill="#2FA39B" />
        <Circle cx={14} cy={92} r={3.8} fill="#5B8DEF" />
        <Path d="M222,14 l8,3 l-3,8 l-8,-3 z" fill="#F28C28" />
        <Path d="M50,12 l7,2 l-2,7 l-7,-2 z" fill="#2FA39B" />
      </G>
    ) : null}
  </G>
);
