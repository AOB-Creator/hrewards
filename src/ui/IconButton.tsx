import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, shadow } from './theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  size?: number;
  badge?: number;
  floating?: boolean;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
  label: string;
}

export function IconButton({ children, onPress, size = 44, badge, floating, dark, style, label }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: dark ? colors.ink : colors.white },
        !floating && !dark && styles.bordered,
        floating && shadow,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {children}
      {!!badge && (
        <View style={styles.badge}>
          <Text variant="caption" color={colors.white} style={{ fontSize: 9, lineHeight: 12 }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  bordered: { borderWidth: 1, borderColor: colors.border },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
