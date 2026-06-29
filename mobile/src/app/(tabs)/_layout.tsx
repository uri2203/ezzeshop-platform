import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  const TAB_BAR_BG = isDark ? '#0f0f23' : '#ffffff';
  const ACTIVE_COLOR = '#7c3aed';
  const INACTIVE_COLOR = isDark ? '#475569' : '#94a3b8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: isDark ? '#1e2640' : '#e2e8f0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home'), tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="tv"
        options={{ title: t('nav.tv'), tabBarIcon: ({ color, size }) => <Ionicons name="tv-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="agent"
        options={{ title: t('nav.agent'), tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{ title: t('nav.campaigns'), tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
