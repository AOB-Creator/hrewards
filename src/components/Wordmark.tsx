import { View } from 'react-native';
import { Text } from '@/ui/Text';
import { colors, fonts } from '@/ui/theme';

/** "ESCAPE°" logotype. */
export function Wordmark({ size = 20, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} accessibilityRole="header" accessibilityLabel="Escape">
      <Text style={{ fontFamily: fonts.semibold, fontSize: size, lineHeight: size * 1.15, letterSpacing: -0.5, color }}>ESCAPE</Text>
      <View style={{ width: size * 0.42, height: size * 0.42, borderRadius: size, borderWidth: Math.max(1.2, size * 0.075), borderColor: color, marginLeft: 1, marginTop: -size * 0.08 }} />
    </View>
  );
}
