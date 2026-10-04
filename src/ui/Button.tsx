import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius } from './theme';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({ title, onPress, variant = 'primary', size = 'lg', disabled, loading, icon, textColor, style, testID }: Props) {
  const h = size === 'lg' ? 56 : size === 'md' ? 46 : 36;
  const bg =
    variant === 'primary' ? colors.ink : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.white : 'transparent';
  const fg = textColor ?? (variant === 'primary' || variant === 'danger' ? colors.white : colors.ink);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { height: h, backgroundColor: bg, paddingHorizontal: size === 'sm' ? 14 : 22 },
        variant === 'secondary' && styles.outline,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant={size === 'sm' ? 'label' : 'bodyMedium'} color={fg} style={size === 'lg' && { fontSize: 16 }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1, borderColor: colors.borderStrong },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
