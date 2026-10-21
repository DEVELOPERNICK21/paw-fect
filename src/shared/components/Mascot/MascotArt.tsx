import React from 'react';
import Svg, { G } from 'react-native-svg';

import type { useTheme } from '../../hooks/useTheme';
import {
  ArmPart,
  BodyPart,
  CollarPart,
  EarPart,
  ExtrasPart,
  FacePart,
  HeadBasePart,
  ShadowPart,
  TagPart,
  TailPart,
} from './mascotParts';
import {
  GoldenArm,
  GoldenBody,
  GoldenChest,
  GoldenCollar,
  GoldenDefs,
  GoldenEar,
  GoldenFace,
  GoldenHeadBase,
  GoldenShadow,
  GoldenTag,
  GoldenTail,
} from './goldenDogParts';
import { CANVAS, MOOD_POSE, PIVOT, pivotsFor } from './mascotRig';
import type { MascotMood, MascotSpecies } from './mascotTypes';

type Colors = ReturnType<typeof useTheme>['colors'];

export interface MascotArtProps {
  species: MascotSpecies;
  mood: MascotMood;
  colors: Colors;
  size: number;
  /** Momentary closed-eye frame used for blinking. */
  blink?: boolean;
  /** Playful wink on the right eye (tap reaction). */
  wink?: boolean;
}

/**
 * Static composite of the character (all rig parts in one <Svg>). Used for
 * previews, store graphics and the Reduce Motion fallback; `Mascot` renders the
 * very same parts as separate animated layers.
 */
export const MascotArt: React.FC<MascotArtProps> = ({
  species,
  mood,
  colors,
  size,
  blink = false,
  wink = false,
}) => {
  const pose = MOOD_POSE[mood];
  if (species === 'dog') {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        <GoldenDefs />
        <GoldenShadow />
        <GoldenTail />
        <GoldenBody mood={mood} />
        <GoldenChest />
        <GoldenCollar />
        <GoldenTag />
        <G transform={`rotate(${pose.headTilt} ${pivotsFor('dog').head.x} ${pivotsFor('dog').head.y})`}>
          <GoldenEar side="L" />
          <GoldenEar side="R" />
          <GoldenHeadBase />
          <GoldenFace mood={mood} blink={blink} wink={wink} />
        </G>
        {mood === 'wave' ? <GoldenArm /> : null}
        <ExtrasPart mood={mood} secondary={colors.text.secondary} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
      <ShadowPart />
      <TailPart species={species} mood={mood} />
      <BodyPart species={species} mood={mood} />
      <CollarPart species={species} />
      <TagPart />
      <G transform={`rotate(${pose.headTilt} ${PIVOT.head.x} ${PIVOT.head.y})`}>
        {species === 'cat' ? (
          <G>
            <EarPart species={species} mood={mood} side="L" />
            <EarPart species={species} mood={mood} side="R" />
            <HeadBasePart species={species} mood={mood} />
          </G>
        ) : (
          <G>
            <HeadBasePart species={species} mood={mood} />
            <EarPart species={species} mood={mood} side="L" />
            <EarPart species={species} mood={mood} side="R" />
          </G>
        )}
        <FacePart species={species} mood={mood} blink={blink} wink={wink} />
      </G>
      {mood === 'wave' ? <ArmPart species={species} mood={mood} /> : null}
      <ExtrasPart mood={mood} secondary={colors.text.secondary} />
    </Svg>
  );
};
