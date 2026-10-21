import React from 'react';

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
import {
  ArmPart,
  BodyPart,
  CollarPart,
  EarPart,
  FacePart,
  HeadBasePart,
  ShadowPart,
  TagPart,
  TailPart,
} from './mascotParts';
import type { MascotMood, MascotSpecies } from './mascotTypes';

/** The drawable pieces of a character, one node per animated rig layer. */
export interface RigNodes {
  /** Gradient/clip definitions that every layer's <Svg> must include (or null). */
  defs: React.ReactNode;
  shadow: React.ReactNode;
  tail: React.ReactNode;
  body: React.ReactNode;
  tag: React.ReactNode;
  headBase: React.ReactNode;
  earL: React.ReactNode;
  earR: React.ReactNode;
  face: React.ReactNode;
  arm: React.ReactNode;
}

export function rigNodesFor(species: MascotSpecies, mood: MascotMood, blink: boolean, wink: boolean): RigNodes {
  if (species === 'dog') {
    return {
      defs: <GoldenDefs />,
      shadow: <GoldenShadow />,
      tail: <GoldenTail />,
      body: (
        <>
          <GoldenBody mood={mood} />
          <GoldenChest />
          <GoldenCollar />
        </>
      ),
      tag: <GoldenTag />,
      headBase: <GoldenHeadBase />,
      earL: <GoldenEar side="L" />,
      earR: <GoldenEar side="R" />,
      face: <GoldenFace mood={mood} blink={blink} wink={wink} />,
      arm: <GoldenArm />,
    };
  }
  return {
    defs: null,
    shadow: <ShadowPart />,
    tail: <TailPart species={species} mood={mood} />,
    body: (
      <>
        <BodyPart species={species} mood={mood} />
        <CollarPart species={species} />
      </>
    ),
    tag: <TagPart />,
    headBase: <HeadBasePart species={species} mood={mood} />,
    earL: <EarPart species={species} mood={mood} side="L" />,
    earR: <EarPart species={species} mood={mood} side="R" />,
    face: <FacePart species={species} mood={mood} blink={blink} wink={wink} />,
    arm: <ArmPart species={species} mood={mood} />,
  };
}
