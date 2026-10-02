import * as Haptics from 'expo-haptics';
import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useSearch } from '@/store/search';
import { colors, shadow } from '@/ui/theme';

export function HeartButton({ hotelId, size = 38 }: { hotelId: string; size?: number }) {
  const saved = useSearch((s) => s.favorites.includes(hotelId));
  const toggle = useSearch((s) => s.toggleFavorite);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from saved' : 'Save'}
      accessibilityState={{ selected: saved }}
      hitSlop={8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        toggle(hotelId);
      }}
      style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Heart size={size * 0.5} color={saved ? colors.heart : colors.ink} fill={saved ? colors.heart : 'transparent'} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow },
});
