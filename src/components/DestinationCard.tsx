import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';

/** "Recently explored" tile: photo, "Want to visit" pill, city + dates. */
export function DestinationCard({ image, title, subtitle, badge, onPress, width = 172 }: { image: string; title: string; subtitle: string; badge: string; onPress(): void; width?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.9 }]}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.15)']} style={StyleSheet.absoluteFill} />
      <View style={styles.badge}>
        <Tag tone="white" label={badge} />
      </View>
      <View style={styles.center}>
        <Text variant="h2" color={colors.white} style={{ fontSize: 21 }}>
          {title}
        </Text>
        <Text variant="caption" color={colors.white} style={{ opacity: 0.9 }}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 140, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
  badge: { position: 'absolute', top: 10, left: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 18 },
});
