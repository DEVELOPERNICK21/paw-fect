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
  DIVIDER,
  FOOTER_HEIGHT,
  HERO_AVATAR_FILL,
  HERO_BORDER,
  HERO_GREEN,
  HERO_HEIGHT,
  HERO_PADDING_TOP,
  NAME_GAP,
  ROW_GAP,
  SECTION_GAP,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_RADIUS,
  SHARE_CARD_WIDTH,
  SUBLINE,
  SUBLINE_GAP,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from './petHealthShareCardLayout';

const FONT_BOLD = require('../../../../../shared/assets/fonts/PlusJakartaSans-Bold.ttf');
const FONT_MEDIUM = require('../../../../../shared/assets/fonts/PlusJakartaSans-Medium.ttf');
const FONT_EXTRA_BOLD = require('../../../../../shared/assets/fonts/PlusJakartaSans-ExtraBold.ttf');

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

  const fontName = useFont(FONT_EXTRA_BOLD, 56 * scale);
  const fontSubline = useFont(FONT_MEDIUM, 26 * scale);
  const fontSection = useFont(FONT_BOLD, 26 * scale);
  const fontRow = useFont(FONT_MEDIUM, 36 * scale);
  const fontChip = useFont(FONT_BOLD, 26 * scale);
  const fontEmptyTitle = useFont(FONT_BOLD, 44 * scale);
  const fontEmptySub = useFont(FONT_MEDIUM, 32 * scale);
  const fontFooterUrl = useFont(FONT_MEDIUM, 28 * scale);
  const fontFooterBrand = useFont(FONT_BOLD, 32 * scale);
  const fontEmoji = useFont(FONT_MEDIUM, 96 * scale);

  const cardClip = useMemo(
    () =>
      rrect(
        rect(0, 0, width, height),
        SHARE_CARD_RADIUS * scale,
        SHARE_CARD_RADIUS * scale,
      ),
    [height, scale, width],
  );

  const avatarRadius = (AVATAR_SIZE / 2) * scale;
  const avatarCenterX = width / 2;
  const avatarCenterY = HERO_PADDING_TOP * scale + avatarRadius + AVATAR_BORDER * scale;

  const subline = formatSubline(
    viewModel.pet.breedLabel,
    viewModel.pet.ageLabel,
  );
  const nameWidth = fontName?.measureText(viewModel.pet.name).width ?? 0;
  const sublineWidth = subline && fontSubline ? fontSubline.measureText(subline).width : 0;

  const nameTop = avatarCenterY + avatarRadius + AVATAR_BORDER * scale + NAME_GAP * scale;
  const nameBaseline = nameTop + (fontName?.getSize() ?? 0) * 0.82;
  const sublineBaseline =
    nameBaseline + (fontName?.getSize() ?? 0) * 0.18 + SUBLINE_GAP * scale;

  const bodyTop = HERO_HEIGHT * scale;
  const footerTop = height - FOOTER_HEIGHT * scale;
  const bodyHeight = footerTop - bodyTop;

  const sectionTop = bodyTop + BODY_PADDING_TOP * scale;
  const sectionBaseline = sectionTop + (fontSection?.getSize() ?? 0) * 0.82;
  const firstRowTop = sectionBaseline + SECTION_GAP * scale;

  const rowHeight = 88 * scale;
  const chipPadX = 24 * scale;
  const chipPadY = 10 * scale;
  const chipRadius = 40 * scale;

  const fontsReady =
    fontName &&
    fontSubline &&
    fontSection &&
    fontRow &&
    fontChip &&
    fontEmptyTitle &&
    fontEmptySub &&
    fontFooterUrl &&
    fontFooterBrand &&
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

  return (
    <Canvas ref={ref} style={{ width, height }}>
      <Group clip={cardClip}>
        <RoundedRect
          x={0}
          y={0}
          width={width}
          height={height}
          r={SHARE_CARD_RADIUS * scale}
          color={SURFACE}
        />

        <Rect x={0} y={0} width={width} height={bodyTop} color={HERO_GREEN} />

        <Circle
          cx={avatarCenterX}
          cy={avatarCenterY}
          r={avatarRadius + AVATAR_BORDER * scale}
          color={HERO_BORDER}
        />
        <Circle cx={avatarCenterX} cy={avatarCenterY} r={avatarRadius} color={HERO_AVATAR_FILL} />

        {photo ? (
          <Group
            clip={Skia.Path.Make().addCircle(avatarCenterX, avatarCenterY, avatarRadius)}
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
          color="#ffffff"
        />

        {subline ? (
          <Text
            x={(width - sublineWidth) / 2}
            y={sublineBaseline}
            text={subline}
            font={fontSubline}
            color={SUBLINE}
          />
        ) : null}

        {viewModel.snapshot.kind === 'items' ? (
          <>
            <Text
              x={BODY_PADDING_X * scale}
              y={sectionBaseline}
              text="HEALTH SNAPSHOT"
              font={fontSection}
              color={TEXT_SECONDARY}
            />
            {viewModel.snapshot.items.map((item, index, items) => (
              <SnapshotRow
                key={`${item.label}-${index}`}
                item={item}
                isLast={index === items.length - 1}
                width={width}
                rowTop={firstRowTop + index * (rowHeight + ROW_GAP * scale)}
                rowHeight={rowHeight}
                scale={scale}
                fontRow={fontRow}
                fontChip={fontChip}
                chipPadX={chipPadX}
                chipPadY={chipPadY}
                chipRadius={chipRadius}
              />
            ))}
          </>
        ) : (
          <EmptyState
            viewModel={viewModel}
            width={width}
            bodyTop={bodyTop}
            bodyHeight={bodyHeight}
            scale={scale}
            fontEmoji={fontEmoji}
            fontEmptyTitle={fontEmptyTitle}
            fontEmptySub={fontEmptySub}
          />
        )}

        <Line
          p1={{ x: BODY_PADDING_X * scale, y: footerTop }}
          p2={{ x: width - BODY_PADDING_X * scale, y: footerTop }}
          color={DIVIDER}
          strokeWidth={StyleSheet.hairlineWidth}
        />

        <Text
          x={BODY_PADDING_X * scale}
          y={footerTop + 56 * scale}
          text={viewModel.footer.urlLabel}
          font={fontFooterUrl}
          color={TEXT_SECONDARY}
        />
        <Text
          x={width - BODY_PADDING_X * scale - fontFooterBrand.measureText(viewModel.footer.brandLabel).width}
          y={footerTop + 56 * scale}
          text={viewModel.footer.brandLabel}
          font={fontFooterBrand}
          color={HERO_GREEN}
        />
      </Group>
    </Canvas>
  );
});

PetHealthShareCardSkia.displayName = 'PetHealthShareCardSkia';

const SnapshotRow: React.FC<{
  item: PetHealthCardItem;
  isLast: boolean;
  width: number;
  rowTop: number;
  rowHeight: number;
  scale: number;
  fontRow: NonNullable<ReturnType<typeof useFont>>;
  fontChip: NonNullable<ReturnType<typeof useFont>>;
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
  fontRow,
  fontChip,
  chipPadX,
  chipPadY,
  chipRadius,
}) => {
  const palette = chipPalette(item.status);
  const chipTextWidth = fontChip.measureText(item.detail).width;
  const chipWidth = chipTextWidth + chipPadX * 2;
  const chipHeight = (fontChip.getSize() ?? 0) + chipPadY * 2;
  const chipX = width - BODY_PADDING_X * scale - chipWidth;
  const chipY = rowTop + (rowHeight - chipHeight) / 2;
  const labelBaseline = rowTop + rowHeight * 0.62;

  return (
  <>
    <Text
      x={BODY_PADDING_X * scale}
      y={labelBaseline}
      text={item.label}
      font={fontRow}
      color={TEXT_PRIMARY}
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
        p1={{ x: BODY_PADDING_X * scale, y: rowTop + rowHeight }}
        p2={{ x: width - BODY_PADDING_X * scale, y: rowTop + rowHeight }}
        color={DIVIDER}
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
  bodyHeight: number;
  scale: number;
  fontEmoji: NonNullable<ReturnType<typeof useFont>>;
  fontEmptyTitle: NonNullable<ReturnType<typeof useFont>>;
  fontEmptySub: NonNullable<ReturnType<typeof useFont>>;
}> = ({
  viewModel,
  width,
  bodyTop,
  bodyHeight,
  scale,
  fontEmoji,
  fontEmptyTitle,
  fontEmptySub,
}) => {
  if (viewModel.snapshot.kind !== 'empty') {
    return null;
  }

  const emoji = viewModel.snapshot.speciesEmoji;
  const title = `Just added ${viewModel.pet.name} to Paw-fect 🎉`;
  const subtitle = 'Vaccines and deworming auto-scheduled below.';
  const emojiWidth = fontEmoji.measureText(emoji).width;
  const titleWidth = fontEmptyTitle.measureText(title).width;
  const subtitleWidth = fontEmptySub.measureText(subtitle).width;
  const blockHeight = 96 * scale + 24 * scale + 44 * scale + 16 * scale + 32 * scale;
  const blockTop = bodyTop + (bodyHeight - blockHeight) / 2;
  const emojiBaseline = blockTop + 96 * scale * 0.82;
  const titleBaseline = emojiBaseline + 24 * scale + 44 * scale * 0.2;
  const subtitleBaseline = titleBaseline + 44 * scale * 0.35 + 16 * scale;

  return (
    <>
      <Text
        x={(width - emojiWidth) / 2}
        y={emojiBaseline}
        text={emoji}
        font={fontEmoji}
        color={TEXT_PRIMARY}
      />
      <Text
        x={(width - titleWidth) / 2}
        y={titleBaseline}
        text={title}
        font={fontEmptyTitle}
        color={TEXT_PRIMARY}
      />
      <Text
        x={(width - subtitleWidth) / 2}
        y={subtitleBaseline}
        text={subtitle}
        font={fontEmptySub}
        color={TEXT_SECONDARY}
      />
    </>
  );
};

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

function formatSubline(breed: string | null, age: string | null): string | null {
  if (breed && age) {
    return `${breed} · ${age}`;
  }
  return breed ?? age ?? null;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: SURFACE,
  },
});
