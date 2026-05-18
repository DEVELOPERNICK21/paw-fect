/** 9:16 export canvas sized for Instagram Stories. */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

export const SHARE_CARD_RADIUS = 32;
export const HERO_HEIGHT = 900;
export const FOOTER_HEIGHT = 232;

export const PALETTE = {
  heroBase: '#0B2820',
  heroDeep: '#10291E',
  heroGlowOrange: 'rgba(242, 140, 40, 0.42)',
  heroGlowMint: 'rgba(111, 207, 151, 0.3)',
  accent: '#F28C28',
  accentDark: '#D77411',
  accentSoft: '#FFF1DF',
  mint: '#6FCF97',
  mintDeep: '#2E8058',
  mintSoft: '#E8F8EF',
  surface: '#FAFCFA',
  surfaceAlt: '#EEF5F0',
  surfaceCard: '#FFFFFF',
  ink: '#0F1A14',
  inkSoft: '#5E6E66',
  inkMuted: '#8A9A92',
  white: '#FFFFFF',
  divider: 'rgba(15, 26, 20, 0.08)',
  footerInk: '#F4F8F5',
  footerMuted: '#B8C8BE',
  photoOverlay: 'rgba(11, 40, 32, 0.42)',
};

export const CHIP_DUE_BG = '#FFF1DF';
export const CHIP_DUE_FG = '#9A5A00';
export const CHIP_DONE_BG = '#DDF5E8';
export const CHIP_DONE_FG = '#1A5E30';
export const CHIP_OVERDUE_BG = '#FFE4E4';
export const CHIP_OVERDUE_FG = '#8A1A1A';

export const HEADER_TOP = 36;
export const LOGO_SIZE = 68;
export const LOGO_GAP = 16;
export const PET_IMAGE_HEIGHT = 500;
export const PET_IMAGE_RADIUS = 28;
export const NAME_GAP = 18;
export const SUBLINE_GAP = 24;
export const HERO_STAT_HEIGHT = 72;

export const BODY_PADDING_X = 56;
export const BODY_PADDING_TOP = 40;
export const SECTION_GAP = 22;
export const ROW_GAP = 22;
export const ROW_HEIGHT = 118;
export const HIGHLIGHT_ROW_HEIGHT = 88;
export const INTRO_LINE_HEIGHT = 38;
export const MAX_BODY_HIGHLIGHTS = 1;

export const PREVIEW_MAX_HEIGHT = 460;
export const PREVIEW_WIDTH = Math.round(
  (PREVIEW_MAX_HEIGHT * SHARE_CARD_WIDTH) / SHARE_CARD_HEIGHT,
);
export const PREVIEW_HEIGHT = PREVIEW_MAX_HEIGHT;
