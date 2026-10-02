import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from './theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'bodyMedium' | 'small' | 'caption' | 'label';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 40, letterSpacing: -1.2 },
  h1: { fontFamily: fonts.medium, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  title: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 15 },
  label: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 18 },
};

export interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
  weight?: keyof typeof fonts;
}

export function Text({ variant = 'body', color, muted, center, weight, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        variants[variant],
        { color: color ?? (muted ? colors.muted : colors.text) },
        center && { textAlign: 'center' },
        weight && { fontFamily: fonts[weight] },
        style,
      ]}
    />
  );
}
