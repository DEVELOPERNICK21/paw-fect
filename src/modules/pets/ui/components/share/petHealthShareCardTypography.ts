export const SHARE_CARD_FONT_FILES = {
  regular: require('../../../../../shared/assets/fonts/PlusJakartaSans-Regular.ttf'),
  medium: require('../../../../../shared/assets/fonts/PlusJakartaSans-Medium.ttf'),
  semibold: require('../../../../../shared/assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  bold: require('../../../../../shared/assets/fonts/PlusJakartaSans-Bold.ttf'),
} as const;

/** Friendly type scale for the export card: regular body, semibold headings. */
export const SHARE_CARD_TYPE = {
  kicker: { file: SHARE_CARD_FONT_FILES.semibold, size: 20 },
  tagline: { file: SHARE_CARD_FONT_FILES.regular, size: 24 },
  petName: { file: SHARE_CARD_FONT_FILES.semibold, size: 48 },
  petSubline: { file: SHARE_CARD_FONT_FILES.regular, size: 26 },
  sectionTitle: { file: SHARE_CARD_FONT_FILES.semibold, size: 28 },
  intro: { file: SHARE_CARD_FONT_FILES.regular, size: 26 },
  glanceLabel: { file: SHARE_CARD_FONT_FILES.regular, size: 20 },
  glanceValue: { file: SHARE_CARD_FONT_FILES.semibold, size: 24 },
  rowTitle: { file: SHARE_CARD_FONT_FILES.semibold, size: 26 },
  rowMeta: { file: SHARE_CARD_FONT_FILES.regular, size: 24 },
  emptyTitle: { file: SHARE_CARD_FONT_FILES.semibold, size: 36 },
  emptySub: { file: SHARE_CARD_FONT_FILES.regular, size: 26 },
  footerUrl: { file: SHARE_CARD_FONT_FILES.regular, size: 22 },
  footerBrand: { file: SHARE_CARD_FONT_FILES.semibold, size: 26 },
  footerHint: { file: SHARE_CARD_FONT_FILES.regular, size: 22 },
  cta: { file: SHARE_CARD_FONT_FILES.semibold, size: 26 },
  emoji: { file: SHARE_CARD_FONT_FILES.regular, size: 38 },
} as const;
