import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { FlatList, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';

export function Gallery({ images, index, onClose }: { images: string[]; index: number | null; onClose(): void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={index !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(u, i) => `${i}-${u}`}
          renderItem={({ item, index: i }) => (
            <View style={{ width, height, justifyContent: 'center' }}>
              <Image source={item} style={{ width, height: width * 1.1 }} contentFit="cover" />
              <Text variant="small" color={colors.white} center style={{ marginTop: 14 }}>
                {i + 1} / {images.length}
              </Text>
            </View>
          )}
        />
        <Pressable accessibilityLabel="Close" onPress={onClose} style={[styles.close, { top: insets.top + 10 }]}>
          <X size={22} color={colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  close: { position: 'absolute', right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
});
