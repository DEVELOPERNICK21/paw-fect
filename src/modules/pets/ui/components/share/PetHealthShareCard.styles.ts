import { StyleSheet } from 'react-native';

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

const HERO_GREEN = '#1a3a2a';
const HERO_BORDER = '#4caf82';
const SUBLINE = '#82c9a8';
const SURFACE = '#ffffff';
const TEXT_PRIMARY = '#101b13';
const TEXT_SECONDARY = '#5a6a60';
const DIVIDER = 'rgba(0, 0, 0, 0.08)';

const CHIP_DUE_BG = '#fff3cd';
const CHIP_DUE_FG = '#7a5800';
const CHIP_DONE_BG = '#d4edda';
const CHIP_DONE_FG = '#1a5e30';
const CHIP_OVERDUE_BG = '#fde0e0';
const CHIP_OVERDUE_FG = '#8a1a1a';

export const shareCardPalette = {
  CHIP_DUE_BG,
  CHIP_DUE_FG,
  CHIP_DONE_BG,
  CHIP_DONE_FG,
  CHIP_OVERDUE_BG,
  CHIP_OVERDUE_FG,
};

/** Fixed-pixel styles for an exportable share asset (exception to token-only UI rule). */
export const petHealthShareCardStyles = StyleSheet.create({
  root: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: SURFACE,
    borderRadius: 64,
    overflow: 'hidden',
  },
  hero: {
    height: 520,
    backgroundColor: HERO_GREEN,
    paddingTop: 88,
    paddingBottom: 56,
    alignItems: 'center',
  },
  avatarRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderColor: HERO_BORDER,
    overflow: 'hidden',
    backgroundColor: '#2e6648',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  petName: {
    color: '#ffffff',
    fontSize: 96,
    marginTop: 28,
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  petSubline: {
    color: SUBLINE,
    fontSize: 36,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  body: {
    flex: 1,
    paddingHorizontal: 72,
    paddingTop: 48,
    paddingBottom: 32,
  },
  sectionLabel: {
    color: TEXT_SECONDARY,
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: TEXT_PRIMARY,
    fontSize: 40,
    flexShrink: 1,
    marginRight: 24,
  },
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 40,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 28,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 120,
    marginBottom: 24,
  },
  emptyTitle: {
    color: TEXT_PRIMARY,
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySub: {
    color: TEXT_SECONDARY,
    fontSize: 32,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 72,
    paddingBottom: 56,
    paddingTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerUrl: {
    color: TEXT_SECONDARY,
    fontSize: 28,
    flex: 1,
    marginRight: 16,
  },
  footerBrand: {
    color: HERO_GREEN,
    fontSize: 32,
    flexShrink: 0,
  },
});
