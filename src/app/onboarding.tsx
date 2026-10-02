import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/Wordmark';
import { IMG } from '@/data/images';
import { useT } from '@/i18n';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';

const RING = [IMG.travel1, IMG.travel2, IMG.travel3, IMG.travel4, IMG.travel5, IMG.travel6, IMG.travel7, IMG.travel8, IMG.travel9, IMG.travel10, IMG.samarkand, IMG.bukhara];

export default function Onboarding() {
  const { t } = useT();
  const { width, height } = useWindowDimensions();
  const complete = useSettings((s) => s.completeOnboarding);
  const [spin] = useState(() => new Animated.Value(0));
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 60_000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [spin, appear]);

  const size = Math.min(width - 40, height * 0.46, 360);
  const r = size / 2 - 34;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counter = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  const start = (path: '/(tabs)' | '/auth/login') => {
    complete();
    router.replace('/(tabs)');
    if (path === '/auth/login') setTimeout(() => router.push('/auth/login'), 50);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Wordmark size={21} />
      </View>
      <View style={styles.center}>
        <Animated.View style={{ width: size, height: size, opacity: appear, transform: [{ rotate }, { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
          <View style={[styles.glow, { width: size * 0.62, height: size * 0.62, borderRadius: size, left: size * 0.19, top: size * 0.19 }]} />
          {RING.map((src, i) => {
            const a = (i / RING.length) * Math.PI * 2 - Math.PI / 2;
            const s = 40 + ((i * 7) % 4) * 5;
            const tilt = ((i % 5) - 2) * 9;
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: size / 2 + Math.cos(a) * r - s / 2,
                  top: size / 2 + Math.sin(a) * r - s / 2,
                  transform: [{ rotate: counter }, { rotate: `${tilt}deg` }],
                }}
              >
                <Image source={src} style={{ width: s, height: s, borderRadius: 11 }} contentFit="cover" transition={300} />
              </Animated.View>
            );
          })}
          <Animated.View style={[styles.hero, { left: size / 2 - 52, top: size / 2 - 52, transform: [{ rotate: counter }] }]}>
            <Image source={IMG.couple} style={{ width: 104, height: 104, borderRadius: 24 }} contentFit="cover" transition={300} />
          </Animated.View>
        </Animated.View>
      </View>
      <View style={styles.bottom}>
        <Text variant="body" muted center>
          {t('onb.kicker')}
        </Text>
        <Text variant="display" center style={{ marginTop: 8, marginBottom: 28 }}>
          {t('onb.title')}
        </Text>
        <Button title={t('onb.cta')} onPress={() => start('/(tabs)')} testID="onboarding-cta" />
        <Button title={t('onb.signIn')} variant="ghost" size="md" onPress={() => start('/auth/login')} style={{ marginTop: 4 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', backgroundColor: '#F7F7F8', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  hero: { position: 'absolute' },
  bottom: { paddingHorizontal: 24, paddingBottom: 8 },
});
