import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius } from './theme';

/** Small pill used for "150 m²", "Cancellation", "Want to visit"… */
export function Tag({ label, icon, tone = 'outline' }: { label: string; icon?: ReactNode; tone?: 'outline' | 'white' | 'success' | 'warning' | 'danger' | 'dark' | 'grey' }) {
  const toneStyle = {
    outline: { backgroundColor: colors.white, borderColor: colors.border, color: colors.inkSoft },
    white: { backgroundColor: colors.white, borderColor: colors.white, color: colors.ink },
    grey: { backgroundColor: colors.surface, borderColor: colors.surface, color: colors.inkSoft },
    success: { backgroundColor: colors.successBg, borderColor: colors.successBg, color: colors.success },
    warning: { backgroundColor: colors.warningBg, borderColor: colors.warningBg, color: colors.warning },
    danger: { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg, color: colors.danger },
    dark: { backgroundColor: colors.ink, borderColor: colors.ink, color: colors.white },
  }[tone];
  return (
    <View style={[styles.base, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      {icon}
      <Text variant="caption" color={toneStyle.color} style={{ fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
