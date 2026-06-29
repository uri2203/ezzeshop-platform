import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';

const QUICK_ACTIONS = [
  { key: 'create_campaign', icon: 'megaphone-outline', route: '/(tabs)/campaigns', color: ['#7c3aed', '#5b21b6'] },
  { key: 'find_creators', icon: 'people-outline', route: '/creators', color: ['#2563eb', '#1d4ed8'] },
  { key: 'watch_tv', icon: 'tv-outline', route: '/(tabs)/tv', color: ['#dc2626', '#b91c1c'] },
  { key: 'talk_agent', icon: 'sparkles-outline', route: '/(tabs)/agent', color: ['#059669', '#047857'] },
] as const;

export default function HomeTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0f0f23' : '#f8fafc';
  const card = isDark ? '#1e2640' : '#fff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#7c3aed20', '#0f0f2300']} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: muted }]}>{t('home.greeting')}, {user?.firstName ?? ''} 👋</Text>
            <Text style={[styles.headerTitle, { color: text }]}>EzzeShop</Text>
            <Text style={[styles.headerSubtitle, { color: muted }]}>{t('home.subtitle')}</Text>
          </View>
          <View style={styles.logoBox}>
            <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.logoGradient}>
              <Ionicons name="flash" size={28} color="#fff" />
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>{t('home.quick_actions')}</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(({ key, icon, route, color }) => (
              <TouchableOpacity
                key={key}
                style={[styles.actionCard, { backgroundColor: card }]}
                onPress={() => router.push(route as Parameters<typeof router.push>[0])}
                activeOpacity={0.8}
              >
                <LinearGradient colors={color as unknown as string[]} style={styles.actionIcon}>
                  <Ionicons name={icon as 'megaphone-outline'} size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: text }]} numberOfLines={2}>
                  {t(`home.${key}` as Parameters<typeof t>[0])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats card */}
        <View style={[styles.statsCard, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text, marginBottom: 16 }]}>Tu actividad</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Campañas', value: '0' },
              { label: 'Matches', value: '0' },
              { label: 'Vistas', value: '0' },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statItem}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 16 },
  greeting: { fontSize: 14, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, lineHeight: 20 },
  logoBox: { marginTop: 4 },
  logoGradient: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '46.5%', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  statsCard: { marginHorizontal: 24, marginBottom: 24, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#7c3aed' },
  statLabel: { fontSize: 12, fontWeight: '500' },
});
