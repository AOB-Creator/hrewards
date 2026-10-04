import { Platform } from 'react-native';

/** Design tokens taken from the Escape mockups: monochrome, pill shapes, soft greys. */
export const colors = {
  bg: '#F2F3F5',
  canvas: '#F2F3F5',
  surface: '#FFFFFF',
  soft: '#F2F3F5',
  card: '#FFFFFF',
  ink: '#111111',
  inkSoft: '#3B3E44',
  text: '#111111',
  muted: '#6B6F76',
  faint: '#9A9EA5',
  border: '#E2E4E8',
  borderStrong: '#D5D7DB',
  white: '#FFFFFF',
  accent: '#5B4BA6',
  accentSoft: '#EEEBF7',
  accentInk: '#3D3175',
  accentLight: '#DCD6F2',
  heart: '#E5484D',
  badge: '#5B4BA6',
  star: '#F5B400',
  success: '#1E8E5A',
  successBg: '#E8F5EE',
  warning: '#9A5B00',
  warningBg: '#FFF4E0',
  danger: '#B42318',
  dangerBg: '#FDECEA',
  overlay: 'rgba(0,0,0,0.35)',
  scrim: 'rgba(17,17,17,0.45)',
  silver: '#8E939B',
  gold: '#B88A2E',
  platinum: '#4A4F5C',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 24, xxl: 28, pill: 999 };
export const space = (n: number) => n * 4;

export const fonts = {
  light: 'Manrope_300Light',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
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
