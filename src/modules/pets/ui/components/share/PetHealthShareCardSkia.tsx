import React, { useEffect, useMemo } from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  Rect,
  RoundedRect,
  Text,
  rect,
  rrect,
  useFont,
  useImage,
  type CanvasRef,
} from '@shopify/react-native-skia';
import type { SkFont } from '@shopify/react-native-skia';

import { images } from '../../../../../shared/assets/images';
import type {
  PetHealthCardHighlight,
  PetHealthCardItem,
  PetHealthCardViewModel,
} from '../../../domain/models/PetHealthCardViewModel';
import {
  careIcon,
  glanceStats,
  plainStatusLine,
  plainTaskName,
  shareCardFooterCta,
  shareCardFooterHint,
  shareCardHighlightsSectionTitle,
  shareCardIntro,
  shareCardPetSubline,
  shareCardSectionTitle,
  shareCardTagline,
} from './petHealthShareCardCopy';
import {
  BODY_PADDING_TOP,
  BODY_PADDING_X,
  FOOTER_HEIGHT,
  HEADER_TOP,
  HERO_HEIGHT,
  HERO_STAT_HEIGHT,
  HIGHLIGHT_ROW_HEIGHT,
  INTRO_LINE_HEIGHT,
  LOGO_GAP,
  LOGO_SIZE,
  MAX_BODY_HIGHLIGHTS,
  PALETTE,
  PET_IMAGE_HEIGHT,
  PET_IMAGE_RADIUS,
  ROW_GAP,
  ROW_HEIGHT,
  SECTION_GAP,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_RADIUS,
  SHARE_CARD_WIDTH,
} from './petHealthShareCardLayout';
import { SHARE_CARD_TYPE } from './petHealthShareCardTypography';

const BRAND_LABEL = 'Pawsoul';

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
  const resolvedLogo = RNImage.resolveAssetSource(images.appIcon);
  const photo = useImage(resolvedPhoto?.uri ?? null);
  const logo = useImage(resolvedLogo?.uri ?? null);

  const fontBrand = useFont(SHARE_CARD_TYPE.brand.file, SHARE_CARD_TYPE.brand.size * scale);
  const fontTagline = useFont(SHARE_CARD_TYPE.tagline.file, SHARE_CARD_TYPE.tagline.size * scale);
  const fontName = useFont(SHARE_CARD_TYPE.petName.file, SHARE_CARD_TYPE.petName.size * scale);
  const fontSubline = useFont(
    SHARE_CARD_TYPE.petSubline.file,
    SHARE_CARD_TYPE.petSubline.size * scale,
  );
  const fontSection = useFont(
    SHARE_CARD_TYPE.sectionTitle.file,
    SHARE_CARD_TYPE.sectionTitle.size * scale,
  );
  const fontIntro = useFont(SHARE_CARD_TYPE.intro.file, SHARE_CARD_TYPE.intro.size * scale);
  const fontGlanceLabel = useFont(
    SHARE_CARD_TYPE.glanceLabel.file,
    SHARE_CARD_TYPE.glanceLabel.size * scale,
  );
  const fontGlanceValue = useFont(
    SHARE_CARD_TYPE.glanceValue.file,
    SHARE_CARD_TYPE.glanceValue.size * scale,
  );
  const fontRowTitle = useFont(
    SHARE_CARD_TYPE.rowTitle.file,
    SHARE_CARD_TYPE.rowTitle.size * scale,
  );
  const fontRowMeta = useFont(
    SHARE_CARD_TYPE.rowMeta.file,
    SHARE_CARD_TYPE.rowMeta.size * scale,
  );
  const fontEmptyTitle = useFont(
    SHARE_CARD_TYPE.emptyTitle.file,
    SHARE_CARD_TYPE.emptyTitle.size * scale,
  );
  const fontEmptySub = useFont(
    SHARE_CARD_TYPE.emptySub.file,
    SHARE_CARD_TYPE.emptySub.size * scale,
  );
  const fontFooterUrl = useFont(
    SHARE_CARD_TYPE.footerUrl.file,
    SHARE_CARD_TYPE.footerUrl.size * scale,
  );
  const fontFooterBrand = useFont(
    SHARE_CARD_TYPE.footerBrand.file,
    SHARE_CARD_TYPE.footerBrand.size * scale,
  );
  const fontCta = useFont(SHARE_CARD_TYPE.cta.file, SHARE_CARD_TYPE.cta.size * scale);
  const fontFooterHint = useFont(
    SHARE_CARD_TYPE.footerHint.file,
    SHARE_CARD_TYPE.footerHint.size * scale,
  );
  const fontEmoji = useFont(SHARE_CARD_TYPE.emoji.file, SHARE_CARD_TYPE.emoji.size * scale);

  const cardClip = useMemo(
    () =>
      rrect(
        rect(0, 0, width, height),
        SHARE_CARD_RADIUS * scale,
        SHARE_CARD_RADIUS * scale,
      ),
    [height, scale, width],
  );

  const subline = shareCardPetSubline(viewModel);

  const bodyTop = HERO_HEIGHT * scale;
  const footerTop = height - FOOTER_HEIGHT * scale;
  const bodyHeight = footerTop - bodyTop;
  const contentWidth = width - BODY_PADDING_X * scale * 2;
  const logoSize = LOGO_SIZE * scale;
  const logoX = BODY_PADDING_X * scale;
  const logoY = HEADER_TOP * scale;
  const photoX = BODY_PADDING_X * scale;
  const photoY = logoY + logoSize + 24 * scale;
  const photoWidth = contentWidth;
  const photoHeight = PET_IMAGE_HEIGHT * scale;
  const photoRadius = PET_IMAGE_RADIUS * scale;
  const photoClip = useMemo(
    () =>
      rrect(
        rect(photoX, photoY, photoWidth, photoHeight),
        photoRadius,
        photoRadius,
      ),
    [photoHeight, photoRadius, photoWidth, photoX, photoY],
  );

  const fontsReady =
    fontBrand &&
    fontTagline &&
    fontName &&
    fontSubline &&
    fontSection &&
    fontIntro &&
    fontGlanceLabel &&
    fontGlanceValue &&
    fontRowTitle &&
    fontRowMeta &&
    fontEmptyTitle &&
    fontEmptySub &&
    fontFooterUrl &&
    fontFooterBrand &&
    fontCta &&
    fontFooterHint &&
    fontEmoji;

  const layout = useMemo(() => {
    if (!fontsReady) {
      return null;
    }

    const introLines = wrapText(shareCardIntro(viewModel), fontIntro, contentWidth);
    const highlights =
      viewModel.snapshot.kind === 'empty'
        ? []
        : viewModel.highlights.slice(0, MAX_BODY_HIGHLIGHTS);
    let contentTop = bodyTop + BODY_PADDING_TOP * scale;

    const highlightsTitleBaseline =
      highlights.length > 0
        ? contentTop + fontSection.getSize() * 0.82
        : null;
    const highlightsFirstRowTop =
      highlightsTitleBaseline != null
        ? highlightsTitleBaseline + SECTION_GAP * scale
        : null;

    if (highlightsTitleBaseline != null && highlightsFirstRowTop != null) {
      contentTop =
        highlightsFirstRowTop +
        highlights.length * (HIGHLIGHT_ROW_HEIGHT * scale + ROW_GAP * scale) +
        28 * scale;
    }

    const careSectionBaseline = contentTop + fontSection.getSize() * 0.82;
    const introStartY = careSectionBaseline + SECTION_GAP * scale;
    const firstRowTop =
      introStartY + introLines.length * INTRO_LINE_HEIGHT * scale + 32 * scale;

    return {
      introLines,
      introStartY,
      careSectionBaseline,
      highlightsTitleBaseline,
      highlightsFirstRowTop,
      highlights,
      firstRowTop,
    };
  }, [bodyTop, contentWidth, fontsReady, scale, viewModel]);

  const photoPending = Boolean(resolvedPhoto?.uri) && photo === null;
  const logoPending = Boolean(resolvedLogo?.uri) && logo === null;

  useEffect(() => {
    if (!fontsReady || photoPending || logoPending || !layout) {
      return;
    }
    onReady?.();
  }, [fontsReady, layout, logoPending, onReady, photoPending]);

  if (!fontsReady || !layout) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const tagline = shareCardTagline();
  const taglineWidth = fontTagline.measureText(tagline).width;
  const nameWidth = fontName.measureText(viewModel.pet.name).width;
  const sublineWidth = subline ? fontSubline.measureText(subline).width : 0;
  const statsTop = photoY + photoHeight + 20 * scale;
  const glanceCards = glanceStats(viewModel);
  const footerCta = shareCardFooterCta();
  const footerHint = shareCardFooterHint();

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
          r={150 * scale}
          color={PALETTE.heroGlowOrange}
        />
        <Circle
          cx={width * 0.12}
          cy={280 * scale}
          r={140 * scale}
          color={PALETTE.heroGlowMint}
        />

        <RoundedRect
          x={logoX - 6 * scale}
          y={logoY - 6 * scale}
          width={logoSize + 12 * scale}
          height={logoSize + 12 * scale}
          r={18 * scale}
          color="rgba(255, 255, 255, 0.14)"
        />
        {logo ? (
          <Image
            image={logo}
            x={logoX}
            y={logoY}
            width={logoSize}
            height={logoSize}
            fit="cover"
          />
        ) : null}
        <Text
          x={logoX + logoSize + LOGO_GAP * scale}
          y={logoY + logoSize * 0.72}
          text={BRAND_LABEL}
          font={fontBrand}
          color={PALETTE.white}
        />
        <Text
          x={(width - taglineWidth) / 2}
          y={photoY - 14 * scale}
          text={tagline}
          font={fontTagline}
          color={PALETTE.mint}
        />

        <RoundedRect
          x={photoX - 4 * scale}
          y={photoY - 4 * scale}
          width={photoWidth + 8 * scale}
          height={photoHeight + 8 * scale}
          r={photoRadius + 4 * scale}
          color={PALETTE.accentSoft}
        />
        <Group clip={photoClip}>
          {photo ? (
            <Image
              image={photo}
              x={photoX}
              y={photoY}
              width={photoWidth}
              height={photoHeight}
              fit="cover"
            />
          ) : (
            <RoundedRect
              x={photoX}
              y={photoY}
              width={photoWidth}
              height={photoHeight}
              r={photoRadius}
              color={PALETTE.mintDeep}
            />
          )}
          <Rect
            x={photoX}
            y={photoY + photoHeight - 120 * scale}
            width={photoWidth}
            height={120 * scale}
            color={PALETTE.photoOverlay}
          />
          <Text
            x={(width - nameWidth) / 2}
            y={photoY + photoHeight - 54 * scale}
            text={viewModel.pet.name}
            font={fontName}
            color={PALETTE.white}
          />
          {subline ? (
            <Text
              x={(width - sublineWidth) / 2}
              y={photoY + photoHeight - 22 * scale}
              text={subline}
              font={fontSubline}
              color={PALETTE.mint}
            />
          ) : null}
        </Group>

        <HeroStatsRow
          width={width}
          scale={scale}
          top={statsTop}
          cards={glanceCards}
          fontLabel={fontGlanceLabel}
          fontValue={fontGlanceValue}
        />

        <Rect
          x={0}
          y={bodyTop}
          width={width}
          height={bodyHeight}
          color={PALETTE.surface}
        />

        {layout.highlightsTitleBaseline != null ? (
          <>
            <RoundedRect
              x={BODY_PADDING_X * scale}
              y={layout.highlightsTitleBaseline - 34 * scale}
              width={10 * scale}
              height={38 * scale}
              r={5 * scale}
              color={PALETTE.mintDeep}
            />
            <Text
              x={BODY_PADDING_X * scale + 22 * scale}
              y={layout.highlightsTitleBaseline}
              text={shareCardHighlightsSectionTitle()}
              font={fontSection}
              color={PALETTE.ink}
            />
          </>
        ) : null}

        {layout.highlightsTitleBaseline != null &&
        layout.highlightsFirstRowTop != null
          ? layout.highlights.map((highlight, index) => (
              <ShareHighlightRow
                key={`${highlight.title}-${index}`}
                highlight={highlight}
                width={width}
                rowTop={
                  layout.highlightsFirstRowTop! +
                  index * (HIGHLIGHT_ROW_HEIGHT * scale + ROW_GAP * scale)
                }
                scale={scale}
                fontRowTitle={fontRowTitle}
                fontRowMeta={fontRowMeta}
                fontEmoji={fontEmoji}
              />
            ))
          : null}

        <RoundedRect
          x={BODY_PADDING_X * scale}
          y={layout.careSectionBaseline - 34 * scale}
          width={10 * scale}
          height={38 * scale}
          r={5 * scale}
          color={PALETTE.accent}
        />
        <Text
          x={BODY_PADDING_X * scale + 22 * scale}
          y={layout.careSectionBaseline}
          text={shareCardSectionTitle()}
          font={fontSection}
          color={PALETTE.ink}
        />

        {layout.introLines.map((line, index) => (
          <Text
            key={`${line}-${index}`}
            x={BODY_PADDING_X * scale}
            y={layout.introStartY + (index + 1) * INTRO_LINE_HEIGHT * scale}
            text={line}
            font={fontIntro}
            color={PALETTE.inkSoft}
          />
        ))}

        {viewModel.snapshot.kind === 'items' ? (
          viewModel.snapshot.items.map((item, index) => (
            <SnapshotRow
              key={`${item.label}-${index}`}
              item={item}
              width={width}
              rowTop={layout.firstRowTop + index * (ROW_HEIGHT * scale + ROW_GAP * scale)}
              scale={scale}
              fontRowTitle={fontRowTitle}
              fontRowMeta={fontRowMeta}
              fontEmoji={fontEmoji}
            />
          ))
        ) : (
          <EmptyState
            viewModel={viewModel}
            width={width}
            top={layout.firstRowTop}
            scale={scale}
            fontEmoji={fontEmoji}
            fontEmptyTitle={fontEmptyTitle}
            fontEmptySub={fontEmptySub}
            fontRowTitle={fontRowTitle}
            fontRowMeta={fontRowMeta}
          />
        )}

        <Rect
          x={0}
          y={footerTop}
          width={width}
          height={FOOTER_HEIGHT * scale}
          color={PALETTE.heroDeep}
        />
        <Text
          x={centerTextX(footerHint, fontFooterHint, width)}
          y={footerTop + 34 * scale}
          text={footerHint}
          font={fontFooterHint}
          color={PALETTE.footerMuted}
        />
        <RoundedRect
          x={BODY_PADDING_X * scale}
          y={footerTop + 58 * scale}
          width={width - BODY_PADDING_X * scale * 2}
          height={60 * scale}
          r={30 * scale}
          color={PALETTE.accent}
        />
        <Text
          x={centerTextX(footerCta, fontCta, width)}
          y={footerTop + 100 * scale}
          text={footerCta}
          font={fontCta}
          color={PALETTE.white}
        />
        <Text
          x={BODY_PADDING_X * scale}
          y={footerTop + 154 * scale}
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
          y={footerTop + 154 * scale}
          text={viewModel.footer.brandLabel}
          font={fontFooterBrand}
          color={PALETTE.footerInk}
        />
      </Group>
    </Canvas>
  );
});

PetHealthShareCardSkia.displayName = 'PetHealthShareCardSkia';

const HeroStatsRow: React.FC<{
  width: number;
  scale: number;
  top: number;
  cards: Array<{ label: string; value: string }>;
  fontLabel: SkFont;
  fontValue: SkFont;
}> = ({ width, scale, top, cards, fontLabel, fontValue }) => {
  const gap = 14 * scale;
  const cardWidth =
    (width - BODY_PADDING_X * scale * 2 - gap * (cards.length - 1)) /
    cards.length;

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
              height={HERO_STAT_HEIGHT * scale}
              r={18 * scale}
              color="rgba(255, 255, 255, 0.12)"
            />
            <Text
              x={x + 16 * scale}
              y={top + 28 * scale}
              text={card.label}
              font={fontLabel}
              color={PALETTE.mint}
            />
            <Text
              x={x + 16 * scale}
              y={top + 56 * scale}
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

const ShareHighlightRow: React.FC<{
  highlight: PetHealthCardHighlight;
  width: number;
  rowTop: number;
  scale: number;
  fontRowTitle: SkFont;
  fontRowMeta: SkFont;
  fontEmoji: SkFont;
}> = ({ highlight, width, rowTop, scale, fontRowTitle, fontRowMeta, fontEmoji }) => {
  const cardX = BODY_PADDING_X * scale;
  const cardWidth = width - BODY_PADDING_X * scale * 2;
  const rowHeight = HIGHLIGHT_ROW_HEIGHT * scale;
  const iconWidth = fontEmoji.measureText(highlight.emoji).width;

  return (
    <>
      <RoundedRect
        x={cardX}
        y={rowTop}
        width={cardWidth}
        height={rowHeight}
        r={22 * scale}
        color={PALETTE.surfaceCard}
      />
      <RoundedRect
        x={cardX + 16 * scale}
        y={rowTop + 14 * scale}
        width={58 * scale}
        height={58 * scale}
        r={29 * scale}
        color={PALETTE.accentSoft}
      />
      <Text
        x={cardX + 16 * scale + (58 * scale - iconWidth) / 2}
        y={rowTop + 14 * scale + 42 * scale}
        text={highlight.emoji}
        font={fontEmoji}
        color={PALETTE.accentDark}
      />
      <Text
        x={cardX + 92 * scale}
        y={rowTop + 34 * scale}
        text={highlight.title}
        font={fontRowTitle}
        color={PALETTE.ink}
      />
      <Text
        x={cardX + 92 * scale}
        y={rowTop + 64 * scale}
        text={highlight.detail}
        font={fontRowMeta}
        color={PALETTE.inkSoft}
      />
    </>
  );
};

const SnapshotRow: React.FC<{
  item: PetHealthCardItem;
  width: number;
  rowTop: number;
  scale: number;
  fontRowTitle: SkFont;
  fontRowMeta: SkFont;
  fontEmoji: SkFont;
}> = ({ item, width, rowTop, scale, fontRowTitle, fontRowMeta, fontEmoji }) => {
  const cardX = BODY_PADDING_X * scale;
  const cardWidth = width - BODY_PADDING_X * scale * 2;
  const rowHeight = ROW_HEIGHT * scale;
  const icon = careIcon(item.label);
  const iconWidth = fontEmoji.measureText(icon).width;
  const taskName = plainTaskName(item.label);
  const statusLine = plainStatusLine(item);

  return (
    <>
      <RoundedRect
        x={cardX}
        y={rowTop}
        width={cardWidth}
        height={rowHeight}
        r={22 * scale}
        color={PALETTE.surfaceCard}
      />
      <RoundedRect
        x={cardX + 16 * scale}
        y={rowTop + 16 * scale}
        width={64 * scale}
        height={64 * scale}
        r={32 * scale}
        color={PALETTE.mintSoft}
      />
      <Text
        x={cardX + 16 * scale + (64 * scale - iconWidth) / 2}
        y={rowTop + 16 * scale + 44 * scale}
        text={icon}
        font={fontEmoji}
        color={PALETTE.mintDeep}
      />
      <Text
        x={cardX + 96 * scale}
        y={rowTop + 42 * scale}
        text={taskName}
        font={fontRowTitle}
        color={PALETTE.ink}
      />
      <Text
        x={cardX + 96 * scale}
        y={rowTop + 78 * scale}
        text={statusLine}
        font={fontRowMeta}
        color={PALETTE.inkSoft}
      />
    </>
  );
};

const EmptyState: React.FC<{
  viewModel: PetHealthCardViewModel;
  width: number;
  top: number;
  scale: number;
  fontEmoji: SkFont;
  fontEmptyTitle: SkFont;
  fontEmptySub: SkFont;
  fontRowTitle: SkFont;
  fontRowMeta: SkFont;
}> = ({
  viewModel,
  width,
  top,
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

  const title = `${viewModel.pet.name} just joined Pawsoul`;
  const subtitle = 'We are building the first vaccine and deworming plan.';
  const titleWidth = fontEmptyTitle.measureText(title).width;
  const subtitleWidth = fontEmptySub.measureText(subtitle).width;
  const features = [
    {
      icon: '💉',
      title: 'Vaccines planned',
      meta: 'Starter doses are added automatically',
    },
    {
      icon: '⏰',
      title: 'Reminders included',
      meta: 'You get a nudge before each task is due',
    },
    {
      icon: '🐾',
      title: 'Easy to share',
      meta: 'Send this card to family or your vet',
    },
  ];

  return (
    <>
      <Text
        x={(width - titleWidth) / 2}
        y={top}
        text={title}
        font={fontEmptyTitle}
        color={PALETTE.ink}
      />
      <Text
        x={(width - subtitleWidth) / 2}
        y={top + 46 * scale}
        text={subtitle}
        font={fontEmptySub}
        color={PALETTE.inkSoft}
      />
      {features.map((feature, index) => {
        const rowTop = top + 96 * scale + index * 104 * scale;
        const cardX = BODY_PADDING_X * scale;
        const cardWidth = width - BODY_PADDING_X * scale * 2;
        const iconWidth = fontEmoji.measureText(feature.icon).width;
        return (
          <Group key={feature.title}>
            <RoundedRect
              x={cardX}
              y={rowTop}
              width={cardWidth}
              height={88 * scale}
              r={22 * scale}
              color={PALETTE.surfaceCard}
            />
            <RoundedRect
              x={cardX + 16 * scale}
              y={rowTop + 14 * scale}
              width={58 * scale}
              height={58 * scale}
              r={29 * scale}
              color={PALETTE.accentSoft}
            />
            <Text
              x={cardX + 16 * scale + (58 * scale - iconWidth) / 2}
              y={rowTop + 14 * scale + 40 * scale}
              text={feature.icon}
              font={fontEmoji}
              color={PALETTE.accentDark}
            />
            <Text
              x={cardX + 92 * scale}
              y={rowTop + 36 * scale}
              text={feature.title}
              font={fontRowTitle}
              color={PALETTE.ink}
            />
            <Text
              x={cardX + 92 * scale}
              y={rowTop + 66 * scale}
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

function centerTextX(text: string, font: SkFont, width: number): number {
  return (width - font.measureText(text).width) / 2;
}

function wrapText(text: string, font: SkFont, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: PALETTE.surface,
  },
});
