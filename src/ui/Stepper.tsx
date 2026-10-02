import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, radius } from './theme';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange(v: number): void;
  label: string;
}

export function Stepper({ value, min = 0, max = 10, onChange, label }: Props) {
  return (
    <View style={styles.box} accessibilityLabel={`${label}: ${value}`}>
      <Pressable accessibilityLabel={`${label} −`} hitSlop={8} disabled={value <= min} onPress={() => onChange(value - 1)} style={[styles.btn, value <= min && { opacity: 0.3 }]}>
        <Minus size={20} color={colors.ink} strokeWidth={1.6} />
      </Pressable>
      <Text variant="body">{value}</Text>
      <Pressable accessibilityLabel={`${label} +`} hitSlop={8} disabled={value >= max} onPress={() => onChange(value + 1)} style={[styles.btn, value >= max && { opacity: 0.3 }]}>
        <Plus size={20} color={colors.ink} strokeWidth={1.6} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  btn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
