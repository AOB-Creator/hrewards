import { Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from './theme';

export function StarIcon({ size = 16 }: { size?: number }) {
  return <Star size={size} color={colors.star} fill={colors.star} strokeWidth={1} />;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text variant="title">{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="small" muted>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.ratingRow}>
      <Text variant="body" style={{ width: 128 }}>
        {label}
      </Text>
      <View style={styles.ratingTrack}>
        <View style={[styles.ratingFill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text variant="body" style={{ width: 30, textAlign: 'right' }}>
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: inset }} />;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <View style={[styles.center, { paddingHorizontal: 32, gap: 10 }]}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text variant="h3" center>
        {title}
      </Text>
      {hint && (
        <Text variant="small" muted center>
          {hint}
        </Text>
      )}
      {action && <View style={{ marginTop: 10 }}>{action}</View>}
    </View>
  );
}

export function Row({ children, gap = 8, style }: { children: ReactNode; gap?: number; style?: object }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function KeyValue({ k, v, strong, color }: { k: string; v: string; strong?: boolean; color?: string }) {
  return (
    <View style={styles.kv}>
      <Text variant={strong ? 'bodyMedium' : 'body'} muted={!strong} style={{ flex: 1 }}>
        {k}
      </Text>
      <Text variant={strong ? 'bodyMedium' : 'body'} color={color}>
        {v}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 28 },
  ratingTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  ratingFill: { height: 4, backgroundColor: colors.ink, borderRadius: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kv: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
});
