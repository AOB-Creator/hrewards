import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from '@/ui/IconButton';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';

export function ScreenHeader({ title, subtitle, right, onBack }: { title?: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.row}>
      <IconButton label="Back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))}>
        <ChevronLeft size={22} color={colors.ink} strokeWidth={1.6} />
      </IconButton>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {title && (
          <Text variant="title" numberOfLines={1} style={{ fontSize: 16 }}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="caption" muted numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 12 },
});
