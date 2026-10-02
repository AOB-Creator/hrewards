import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '@/store/session';
import { useSearch } from '@/store/search';
import { useSettings } from '@/store/settings';
import { colors } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

function useHydrated() {
  const [ready, setReady] = useState(
    () => useSettings.persist.hasHydrated() && useSession.persist.hasHydrated() && useSearch.persist.hasHydrated(),
  );
  useEffect(() => {
    if (ready) return;
    const check = () => {
      if (useSettings.persist.hasHydrated() && useSession.persist.hasHydrated() && useSearch.persist.hasHydrated()) setReady(true);
    };
    const unsubs = [useSettings, useSession, useSearch].map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubs.forEach((u) => u());
  }, [ready]);
  return ready;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const hydrated = useHydrated();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    useSettings.getState().refreshRates();
    useSession.getState().refresh();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="results" />
          <Stack.Screen name="hotel/[id]" />
          <Stack.Screen name="booking/new" options={{ gestureEnabled: false }} />
          <Stack.Screen name="booking/[id]" />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/otp" options={{ presentation: 'modal' }} />
          <Stack.Screen name="rewards" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
