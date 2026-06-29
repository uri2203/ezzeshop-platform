import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from '../i18n';
import { useAuthStore } from '../store/auth.store';
import { registerForPushNotifications } from '../hooks/useNotifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loadUser, checkBiometric } = useAuthStore();

  useEffect(() => {
    async function init() {
      await initI18n();
      await loadUser();
      await checkBiometric();
      await registerForPushNotifications();
      await SplashScreen.hideAsync();
    }
    void init();
  }, [loadUser, checkBiometric]);

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </I18nextProvider>
  );
}
