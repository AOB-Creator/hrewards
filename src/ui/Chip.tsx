import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radius } from './theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  trailing?: ReactNode;
  size?: 'md' | 'sm';
  dim?: boolean;
}

export function Chip({ label, active, onPress, icon, trailing, size = 'md', dim }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        active ? styles.active : styles.idle,
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon}
      <Text variant={size === 'sm' ? 'caption' : 'label'} color={active ? colors.white : dim ? colors.muted : colors.ink} style={size === 'md' && { fontSize: 14 }}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sm: { height: 28, paddingHorizontal: 10 },
  idle: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.ink },
});
