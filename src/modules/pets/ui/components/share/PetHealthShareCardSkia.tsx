import React, { useEffect, useMemo } from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  Line,
  Rect,
  RoundedRect,
  Skia,
  Text,
  rect,
  rrect,
  useFont,
  useImage,
  type CanvasRef,
} from '@shopify/react-native-skia';

import type {
  PetHealthCardItem,
  PetHealthCardItemStatus,
  PetHealthCardViewModel,
} from '../../../domain/models/PetHealthCardViewModel';
import {
  AVATAR_BORDER,
  AVATAR_SIZE,
  BODY_PADDING_TOP,
  BODY_PADDING_X,
  CHIP_DONE_BG,
  CHIP_DONE_FG,
  CHIP_DUE_BG,
  CHIP_DUE_FG,
  CHIP_OVERDUE_BG,
  CHIP_OVERDUE_FG,
  FOOTER_HEIGHT,
  HERO_HEIGHT,
  HERO_PADDING_TOP,
  NAME_GAP,
  PALETTE,
  ROW_GAP,
  SECTION_GAP,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_RADIUS,
  SHARE_CARD_WIDTH,
  SUBLINE_GAP,
} from './petHealthShareCardLayout';

const FONT_BOLD = require('../../../../../shared/assets/fonts/PlusJakartaSans-Bold.ttf');
const FONT_MEDIUM = require('../../../../../shared/assets/fonts/PlusJakartaSans-Medium.ttf');
const FONT_EXTRA_BOLD = require('../../../../../shared/assets/fonts/PlusJakartaSans-ExtraBold.ttf');
const FONT_SEMIBOLD = require('../../../../../shared/assets/fonts/PlusJakartaSans-SemiBold.ttf');

const KICKER = 'PET HEALTH CARD';
const TAGLINE = 'Shareable care snapshot from Paw-fect';

export interface PetHealthShareCardSkiaProps {
  viewModel: PetHealthCardViewModel;
  width?: number;
  height?: number;
  onReady?: () => void;
}

export const PetHealthShareCardSkia = React.forwardRef<
  CanvasRef,
  PetHealthShareCardSkiaProps
>(function PetHealthShareCardSkia(
  { viewModel, width = SHARE_CARD_WIDTH, height = SHARE_CARD_HEIGHT, onReady },
  ref,
) {
  const scale = width / SHARE_CARD_WIDTH;
  const resolvedPhoto = RNImage.resolveAssetSource(viewModel.pet.photoSource);
  const photo = useImage(resolvedPhoto?.uri ?? null);

  const fontKicker = useFont(FONT_BOLD, 22 * scale);
  const fontTagline = useFont(FONT_MEDIUM, 24 * scale);
  const fontName = useFont(FONT_EXTRA_BOLD, 54 * scale);
  const fontSubline = useFont(FONT_MEDIUM, 28 * scale);
  const fontStat = useFont(FONT_SEMIBOLD, 22 * scale);
  const fontStatValue = useFont(FONT_BOLD, 26 * scale);
  const fontSection = useFont(FONT_BOLD, 30 * scale);
  const fontNarrative = useFont(FONT_MEDIUM, 28 * scale);
  const fontRowTitle = useFont(FONT_BOLD, 30 * scale);
  const fontRowMeta = useFont(FONT_MEDIUM, 24 * scale);
  const fontChip = useFont(FONT_BOLD, 24 * scale);
  const fontCallout = useFont(FONT_MEDIUM, 26 * scale);
  const fontEmptyTitle = useFont(FONT_BOLD, 42 * scale);
  const fontEmptySub = useFont(FONT_MEDIUM, 30 * scale);
  const fontFooterUrl = useFont(FONT_MEDIUM, 26 * scale);
  const fontFooterBrand = useFont(FONT_BOLD, 30 * scale);
  const fontCta = useFont(FONT_BOLD, 28 * scale);
  const fontEmoji = useFont(FONT_MEDIUM, 40 * scale);

  const cardClip = useMemo(
    () =>
      rrect(
        rect(0, 0, width, height),
        SHARE_CARD_RADIUS * scale,
        SHARE_CARD_RADIUS * scale,
      ),
    [height, scale, width],
  );

  const narrative = useMemo(
    () => buildNarrative(viewModel),
    [viewModel],
  );

  const avatarRadius = (AVATAR_SIZE / 2) * scale;
  const avatarCenterX = width / 2;
  const avatarCenterY =
    HERO_PADDING_TOP * scale + 92 * scale + avatarRadius + AVATAR_BORDER * scale;

  const subline = formatSubline(
    viewModel.pet.breedLabel,
    viewModel.pet.ageLabel,
  );
  const nameWidth = fontName?.measureText(viewModel.pet.name).width ?? 0;
  const sublineWidth =
    subline && fontSubline ? fontSubline.measureText(subline).width : 0;

  const nameTop =
    avatarCenterY + avatarRadius + AVATAR_BORDER * scale + NAME_GAP * scale;
  const nameBaseline = nameTop + (fontName?.getSize() ?? 0) * 0.82;
  const sublineBaseline =
    nameBaseline + (fontName?.getSize() ?? 0) * 0.18 + SUBLINE_GAP * scale;

  const bodyTop = HERO_HEIGHT * scale;
  const footerTop = height - FOOTER_HEIGHT * scale;
  const bodyHeight = footerTop - bodyTop;

  const sectionTop = bodyTop + BODY_PADDING_TOP * scale;
  const sectionBaseline = sectionTop + (fontSection?.getSize() ?? 0) * 0.82;
  const narrativeBaseline = sectionBaseline + SECTION_GAP * scale + 34 * scale;
  const firstRowTop = narrativeBaseline + 42 * scale;

  const rowHeight = 104 * scale;
  const chipPadX = 22 * scale;
  const chipPadY = 10 * scale;
  const chipRadius = 36 * scale;

  const fontsReady =
    fontKicker &&
    fontTagline &&
    fontName &&
    fontSubline &&
    fontStat &&
    fontStatValue &&
    fontSection &&
    fontNarrative &&
    fontRowTitle &&
    fontRowMeta &&
    fontChip &&
    fontCallout &&
    fontEmptyTitle &&
    fontEmptySub &&
    fontFooterUrl &&
    fontFooterBrand &&
    fontCta &&
    fontEmoji;

  const photoPending = Boolean(resolvedPhoto?.uri) && photo === null;

  useEffect(() => {
    if (!fontsReady || photoPending) {
      return;
    }
    onReady?.();
  }, [fontsReady, onReady, photoPending]);

  if (!fontsReady) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const kickerWidth = fontKicker.measureText(KICKER).width + 48 * scale;
  const kickerX = (width - kickerWidth) / 2;
  const taglineWidth = fontTagline.measureText(TAGLINE).width;
  const statCards = buildStatCards(viewModel);

  return (
    <Canvas ref={ref} style={{ width, height }}>
      <Group clip={cardClip}>
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={height}
          r={SHARE_CARD_RADIUS * scale}
          color={PALETTE.surface}
        />

        <Rect x={0} y={0} width={width} height={bodyTop} color={PALETTE.heroBase} />
        <Circle
          cx={width * 0.86}
          cy={72 * scale}
          r={170 * scale}
          color={PALETTE.heroGlowOrange}
        />
        <Circle
          cx={width * 0.12}
          cy={220 * scale}
          r={130 * scale}
          color={PALETTE.heroGlowMint}
        />
        <Circle
          cx={width * 0.5}
          cy={bodyTop}
          r={220 * scale}
          color="rgba(255, 255, 255, 0.04)"
        />

        <RoundedRect
          x={kickerX}
          y={40 * scale}
          width={kickerWidth}
          height={44 * scale}
          r={22 * scale}
          color={PALETTE.accent}
        />
        <Text
          x={kickerX + 24 * scale}
          y={40 * scale + 32 * scale}
          text={KICKER}
          font={fontKicker}
          color={PALETTE.white}
        />
        <Text
          x={(width - taglineWidth) / 2}
          y={96 * scale}
          text={TAGLINE}
          font={fontTagline}
          color={PALETTE.mint}
        />

        <Circle
          cx={avatarCenterX}
          cy={avatarCenterY}
          r={avatarRadius + AVATAR_BORDER * scale}
          color={PALETTE.accentSoft}
        />
        <Circle
          cx={avatarCenterX}
          cy={avatarCenterY}
          r={avatarRadius}
          color={PALETTE.mintDeep}
        />

        {photo ? (
          <Group
            clip={Skia.Path.Make().addCircle(
              avatarCenterX,
              avatarCenterY,
              avatarRadius,
            )}
          >
            <Image
              image={photo}
              x={avatarCenterX - avatarRadius}
              y={avatarCenterY - avatarRadius}
              width={avatarRadius * 2}
              height={avatarRadius * 2}
              fit="cover"
            />
          </Group>
        ) : null}

        <Text
          x={(width - nameWidth) / 2}
          y={nameBaseline}
          text={viewModel.pet.name}
          font={fontName}
          color={PALETTE.white}
        />

        {subline ? (
          <Text
            x={(width - sublineWidth) / 2}
            y={sublineBaseline}
            text={subline}
            font={fontSubline}
            color={PALETTE.mint}
          />
        ) : null}

        <StatRow
          width={width}
          scale={scale}
          top={bodyTop - 88 * scale}
          cards={statCards}
          fontLabel={fontStat}
          fontValue={fontStatValue}
        />

        <Rect
          x={0}
          y={bodyTop}
          width={width}
          height={bodyHeight}
          color={PALETTE.surface}
        />

        <RoundedRect
          x={BODY_PADDING_X * scale}
          y={bodyTop - 18 * scale}
          width={width - BODY_PADDING_X * scale * 2}
          height={36 * scale}
          r={18 * scale}
          color={PALETTE.surfaceAlt}
        />

        <RoundedRect
          x={BODY_PADDING_X * scale}
          y={sectionTop - 8 * scale}
          width={10 * scale}
          height={42 * scale}
          r={5 * scale}
          color={PALETTE.accent}
        />
        <Text
          x={BODY_PADDING_X * scale + 22 * scale}
          y={sectionBaseline}
          text="Care snapshot"
          font={fontSection}
          color={PALETTE.ink}
        />
        <Text
          x={BODY_PADDING_X * scale}
          y={narrativeBaseline}
          text={narrative.body}
          font={fontNarrative}
          color={PALETTE.inkSoft}
        />

        {viewModel.snapshot.kind === 'items' ? (
          viewModel.snapshot.items.map((item, index, items) => (
            <SnapshotRow
              key={`${item.label}-${index}`}
              item={item}
              isLast={index === items.length - 1}
              width={width}
              rowTop={firstRowTop + index * (rowHeight + ROW_GAP * scale)}
              rowHeight={rowHeight}
              scale={scale}
              fontRowTitle={fontRowTitle}
              fontRowMeta={fontRowMeta}
              fontChip={fontChip}
              fontEmoji={fontEmoji}
              chipPadX={chipPadX}
              chipPadY={chipPadY}
              chipRadius={chipRadius}
            />
          ))
        ) : (
          <EmptyState
            viewModel={viewModel}
            width={width}
            bodyTop={bodyTop}
            scale={scale}
            fontEmoji={fontEmoji}
            fontEmptyTitle={fontEmptyTitle}
            fontEmptySub={fontEmptySub}
            fontRowTitle={fontRowTitle}
            fontRowMeta={fontRowMeta}
          />
        )}

        {viewModel.snapshot.kind === 'items' ? (
          <CalloutPanel
            width={width}
            scale={scale}
            top={Math.min(
              firstRowTop +
                viewModel.snapshot.items.length * (rowHeight + ROW_GAP * scale) +
                20 * scale,
              footerTop - 128 * scale,
            )}
            font={fontCallout}
          />
        ) : null}

        <Rect
          x={0}
          y={footerTop}
          width={width}
          height={FOOTER_HEIGHT * scale}
          color={PALETTE.heroDeep}
        />
        <RoundedRect
          x={BODY_PADDING_X * scale}
          y={footerTop + 28 * scale}
          width={width - BODY_PADDING_X * scale * 2}
          height={64 * scale}
          r={32 * scale}
          color={PALETTE.accent}
        />
        <Text
          x={centerTextX(
            'Track vaccines & reminders in Paw-fect',
            fontCta,
            width,
          )}
          y={footerTop + 72 * scale}
          text="Track vaccines & reminders in Paw-fect"
          font={fontCta}
          color={PALETTE.white}
        />
        <Text
          x={BODY_PADDING_X * scale}
          y={footerTop + 132 * scale}
          text={viewModel.footer.urlLabel}
          font={fontFooterUrl}
          color={PALETTE.footerMuted}
        />
        <Text
          x={
            width -
            BODY_PADDING_X * scale -
            fontFooterBrand.measureText(viewModel.footer.brandLabel).width
          }
          y={footerTop + 132 * scale}
          text={viewModel.footer.brandLabel}
          font={fontFooterBrand}
          color={PALETTE.footerInk}
        />
      </Group>
    </Canvas>
  );
});

PetHealthShareCardSkia.displayName = 'PetHealthShareCardSkia';

const StatRow: React.FC<{
  width: number;
  scale: number;
  top: number;
  cards: Array<{ label: string; value: string }>;
  fontLabel: NonNullable<ReturnType<typeof useFont>>;
  fontValue: NonNullable<ReturnType<typeof useFont>>;
}> = ({ width, scale, top, cards, fontLabel, fontValue }) => {
  const gap = 16 * scale;
  const cardWidth = (width - BODY_PADDING_X * scale * 2 - gap * 2) / 3;
  const cardHeight = 72 * scale;

  return (
    <>
      {cards.map((card, index) => {
        const x = BODY_PADDING_X * scale + index * (cardWidth + gap);
        return (
          <Group key={card.label}>
            <RoundedRect
              x={x}
              y={top}
              width={cardWidth}
              height={cardHeight}
              r={20 * scale}
              color="rgba(255, 255, 255, 0.12)"
            />
            <Text
              x={x + 18 * scale}
              y={top + 28 * scale}
              text={card.label}
              font={fontLabel}
              color={PALETTE.mint}
            />
            <Text
              x={x + 18 * scale}
              y={top + 58 * scale}
              text={card.value}
              font={fontValue}
              color={PALETTE.white}
            />
          </Group>
        );
      })}
    </>
  );
};

const SnapshotRow: React.FC<{
  item: PetHealthCardItem;
  isLast: boolean;
  width: number;
  rowTop: number;
  rowHeight: number;
  scale: number;
  fontRowTitle: NonNullable<ReturnType<typeof useFont>>;
  fontRowMeta: NonNullable<ReturnType<typeof useFont>>;
  fontChip: NonNullable<ReturnType<typeof useFont>>;
  fontEmoji: NonNullable<ReturnType<typeof useFont>>;
  chipPadX: number;
  chipPadY: number;
  chipRadius: number;
}> = ({
  item,
  isLast,
  width,
  rowTop,
  rowHeight,
  scale,
  fontRowTitle,
  fontRowMeta,
  fontChip,
  fontEmoji,
  chipPadX,
  chipPadY,
  chipRadius,
}) => {
  const palette = chipPalette(item.status);
  const chipTextWidth = fontChip.measureText(item.detail).width;
  const chipWidth = chipTextWidth + chipPadX * 2;
  const chipHeight = (fontChip.getSize() ?? 0) + chipPadY * 2;
  const chipX = width - BODY_PADDING_X * scale - chipWidth - 20 * scale;
  const chipY = rowTop + (rowHeight - chipHeight) / 2;
  const icon = careIcon(item.label);
  const iconWidth = fontEmoji.measureText(icon).width;
  const cardX = BODY_PADDING_X * scale;
  const cardWidth = width - BODY_PADDING_X * scale * 2;

  return (
    <>
      <RoundedRect
        x={cardX}
        y={rowTop}
        width={cardWidth}
        height={rowHeight}
        r={24 * scale}
        color={PALETTE.surfaceCard}
      />
      <RoundedRect
        x={cardX + 18 * scale}
        y={rowTop + 18 * scale}
        width={68 * scale}
        height={68 * scale}
        r={34 * scale}
        color={PALETTE.mintSoft}
      />
      <Text
        x={cardX + 18 * scale + (68 * scale - iconWidth) / 2}
        y={rowTop + 18 * scale + 48 * scale}
        text={icon}
        font={fontEmoji}
        color={PALETTE.mintDeep}
      />
      <Text
        x={cardX + 104 * scale}
        y={rowTop + 44 * scale}
        text={item.label}
        font={fontRowTitle}
        color={PALETTE.ink}
      />
      <Text
        x={cardX + 104 * scale}
        y={rowTop + 76 * scale}
        text={statusMeta(item.status)}
        font={fontRowMeta}
        color={PALETTE.inkMuted}
      />
      <RoundedRect
        x={chipX}
        y={chipY}
        width={chipWidth}
        height={chipHeight}
        r={chipRadius}
        color={palette.bg}
      />
      <Text
        x={chipX + chipPadX}
        y={chipY + chipPadY + (fontChip.getSize() ?? 0) * 0.82}
        text={item.detail}
        font={fontChip}
        color={palette.fg}
      />
      {!isLast ? (
        <Line
          p1={{ x: cardX, y: rowTop + rowHeight + ROW_GAP * scale * 0.5 }}
          p2={{
            x: cardX + cardWidth,
            y: rowTop + rowHeight + ROW_GAP * scale * 0.5,
          }}
          color={PALETTE.divider}
          strokeWidth={StyleSheet.hairlineWidth}
        />
      ) : null}
    </>
  );
};

const EmptyState: React.FC<{
  viewModel: PetHealthCardViewModel;
  width: number;
  bodyTop: number;
  scale: number;
  fontEmoji: NonNullable<ReturnType<typeof useFont>>;
  fontEmptyTitle: NonNullable<ReturnType<typeof useFont>>;
  fontEmptySub: NonNullable<ReturnType<typeof useFont>>;
  fontRowTitle: NonNullable<ReturnType<typeof useFont>>;
  fontRowMeta: NonNullable<ReturnType<typeof useFont>>;
}> = ({
  viewModel,
  width,
  bodyTop,
  scale,
  fontEmoji,
  fontEmptyTitle,
  fontEmptySub,
  fontRowTitle,
  fontRowMeta,
}) => {
  if (viewModel.snapshot.kind !== 'empty') {
    return null;
  }

  const title = `Welcome ${viewModel.pet.name} to Paw-fect`;
  const subtitle =
    'We are building your vaccine and deworming schedule now.';
  const titleWidth = fontEmptyTitle.measureText(title).width;
  const subtitleWidth = fontEmptySub.measureText(subtitle).width;
  const blockTop = bodyTop + 150 * scale;
  const features = [
    { icon: '💉', title: 'Vaccines scheduled', meta: 'Starter series planned automatically' },
    { icon: '⏰', title: 'Smart reminders', meta: 'Get nudges before each dose is due' },
    { icon: '🐾', title: 'Shareable updates', meta: 'Send this card to family or your vet' },
  ];

  return (
    <>
      <Text
        x={(width - titleWidth) / 2}
        y={blockTop}
        text={title}
        font={fontEmptyTitle}
        color={PALETTE.ink}
      />
      <Text
        x={(width - subtitleWidth) / 2}
        y={blockTop + 52 * scale}
        text={subtitle}
        font={fontEmptySub}
        color={PALETTE.inkSoft}
      />
      {features.map((feature, index) => {
        const rowTop = blockTop + 120 * scale + index * 108 * scale;
        const cardX = BODY_PADDING_X * scale;
        const cardWidth = width - BODY_PADDING_X * scale * 2;
        const iconWidth = fontEmoji.measureText(feature.icon).width;
        return (
          <Group key={feature.title}>
            <RoundedRect
              x={cardX}
              y={rowTop}
              width={cardWidth}
              height={92 * scale}
              r={24 * scale}
              color={PALETTE.surfaceCard}
            />
            <RoundedRect
              x={cardX + 18 * scale}
              y={rowTop + 16 * scale}
              width={60 * scale}
              height={60 * scale}
              r={30 * scale}
              color={PALETTE.accentSoft}
            />
            <Text
              x={cardX + 18 * scale + (60 * scale - iconWidth) / 2}
              y={rowTop + 16 * scale + 42 * scale}
              text={feature.icon}
              font={fontEmoji}
              color={PALETTE.accentDark}
            />
            <Text
              x={cardX + 96 * scale}
              y={rowTop + 38 * scale}
              text={feature.title}
              font={fontRowTitle}
              color={PALETTE.ink}
            />
            <Text
              x={cardX + 96 * scale}
              y={rowTop + 70 * scale}
              text={feature.meta}
              font={fontRowMeta}
              color={PALETTE.inkMuted}
            />
          </Group>
        );
      })}
    </>
  );
};

const CalloutPanel: React.FC<{
  width: number;
  scale: number;
  top: number;
  font: NonNullable<ReturnType<typeof useFont>>;
}> = ({ width, scale, top, font }) => {
  const copy =
    'Share with family, sitters, or your vet so everyone sees what is due next.';
  const panelX = BODY_PADDING_X * scale;
  const panelWidth = width - BODY_PADDING_X * scale * 2;
  const panelHeight = 112 * scale;

  return (
    <>
      <RoundedRect
        x={panelX}
        y={top}
        width={panelWidth}
        height={panelHeight}
        r={24 * scale}
        color={PALETTE.mintSoft}
      />
      <Text
        x={panelX + 24 * scale}
        y={top + 42 * scale}
        text={copy}
        font={font}
        color={PALETTE.mintDeep}
      />
    </>
  );
};

function buildNarrative(viewModel: PetHealthCardViewModel): {
  body: string;
} {
  if (viewModel.snapshot.kind === 'empty') {
    return {
      body: 'This card introduces your pet and the care plan Paw-fect is setting up.',
    };
  }

  const items = viewModel.snapshot.items;
  const overdue = items.find(item => item.status === 'overdue');
  if (overdue) {
    return {
      body: `${overdue.label} needs attention. Share this card to coordinate care with everyone helping ${viewModel.pet.name}.`,
    };
  }

  const next = items.find(item => item.status !== 'done');
  if (next) {
    return {
      body: `Next up: ${next.label} (${next.detail}). Keep family and sitters aligned with one shareable snapshot.`,
    };
  }

  return {
    body: `${viewModel.pet.name} is on track. Share recent wins and upcoming care in one glance.`,
  };
}

function buildStatCards(
  viewModel: PetHealthCardViewModel,
): Array<{ label: string; value: string }> {
  if (viewModel.snapshot.kind === 'empty') {
    return [
      { label: 'Status', value: 'Starting' },
      { label: 'Schedule', value: 'Building' },
      { label: 'Share', value: 'Ready' },
    ];
  }

  const items = viewModel.snapshot.items;
  const doneCount = items.filter(item => item.status === 'done').length;
  const next = items.find(item => item.status !== 'done');
  const overdueCount = items.filter(item => item.status === 'overdue').length;

  return [
    {
      label: 'Next care',
      value: next ? truncate(next.detail, 14) : 'On track',
    },
    {
      label: 'Completed',
      value: doneCount > 0 ? `${doneCount} logged` : 'None yet',
    },
    {
      label: 'Status',
      value: overdueCount > 0 ? 'Needs care' : 'Tracking',
    },
  ];
}

function chipPalette(status: PetHealthCardItemStatus): { bg: string; fg: string } {
  switch (status) {
    case 'done':
      return { bg: CHIP_DONE_BG, fg: CHIP_DONE_FG };
    case 'due_in':
      return { bg: CHIP_DUE_BG, fg: CHIP_DUE_FG };
    case 'overdue':
      return { bg: CHIP_OVERDUE_BG, fg: CHIP_OVERDUE_FG };
  }
}

function careIcon(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('rabies')) {
    return '🛡️';
  }
  if (normalized.includes('vaccin') || normalized.includes('dhpp') || normalized.includes('fvrcp')) {
    return '💉';
  }
  if (normalized.includes('deworm')) {
    return '💊';
  }
  return '🐾';
}

function statusMeta(status: PetHealthCardItemStatus): string {
  switch (status) {
    case 'done':
      return 'Recently completed';
    case 'due_in':
      return 'Upcoming care task';
    case 'overdue':
      return 'Needs attention';
  }
}

function formatSubline(breed: string | null, age: string | null): string | null {
  if (breed && age) {
    return `${breed} · ${age}`;
  }
  return breed ?? age ?? null;
}

function centerTextX(
  text: string,
  font: NonNullable<ReturnType<typeof useFont>>,
  width: number,
): number {
  return (width - font.measureText(text).width) / 2;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: PALETTE.surface,
  },
});
