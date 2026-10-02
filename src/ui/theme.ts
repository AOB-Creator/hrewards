import { Platform } from 'react-native';

/** Design tokens taken from the Escape mockups: monochrome, pill shapes, soft greys. */
export const colors = {
  bg: '#FFFFFF',
  canvas: '#F2F2F4',
  surface: '#F5F5F6',
  ink: '#121212',
  inkSoft: '#2A2A2A',
  text: '#121212',
  muted: '#8B8B90',
  faint: '#B9B9BE',
  border: '#E6E6E8',
  borderStrong: '#D5D5D8',
  white: '#FFFFFF',
  heart: '#F05A47',
  badge: '#F0573F',
  star: '#FFC531',
  success: '#1E9E61',
  successBg: '#E8F6EF',
  warning: '#C77700',
  warningBg: '#FFF4E0',
  danger: '#D93A2B',
  dangerBg: '#FDECEA',
  overlay: 'rgba(0,0,0,0.35)',
  scrim: 'rgba(18,18,18,0.45)',
  silver: '#9EA3AA',
  gold: '#C9A24A',
  platinum: '#5B6170',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, pill: 999 };
export const space = (n: number) => n * 4;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 4 },
  default: {},
});

export const shadowStrong = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 10 },
  default: {},
});

export const tierColor = (tier: 'silver' | 'gold' | 'platinum') => colors[tier];
