import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

interface Campaign {
  id: string;
  title: string;
  objective: string;
  status: string;
  budgetAmount: number;
  budgetCurrency: string;
  startDate: string;
  endDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#059669',
  draft: '#d97706',
  completed: '#2563eb',
  paused: '#64748b',
};

export default function CampaignsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0f0f23' : '#f8fafc';
  const card = isDark ? '#1e2640' : '#fff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/campaigns?limit=20');
      setCampaigns((data.data as { items: Campaign[] }).items ?? []);
    } catch {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }

  function formatBudget(amount: number, currency: string) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: text }]}>{t('campaign.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/campaigns/new' as Parameters<typeof router.push>[0])} activeOpacity={0.85}>
          <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.newBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newBtnText}>{t('campaign.new')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#7c3aed" style={styles.loader} />
      ) : (
        <FlatList
          data={campaigns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onRefresh={() => void loadCampaigns()}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient colors={['#7c3aed20', '#2563eb20']} style={styles.emptyIcon}>
                <Ionicons name="megaphone-outline" size={40} color="#7c3aed" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: text }]}>{t('campaign.empty_title')}</Text>
              <Text style={[styles.emptyDesc, { color: muted }]}>{t('campaign.empty_desc')}</Text>
              <TouchableOpacity onPress={() => router.push('/campaigns/new' as Parameters<typeof router.push>[0])}>
                <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>{t('campaign.create_first')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: card }]}
              onPress={() => router.push(`/campaigns/${item.id}` as Parameters<typeof router.push>[0])}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, { color: text }]} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status] ?? '#64748b'}20` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? '#64748b' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardObjective, { color: muted }]}>{item.objective}</Text>
              <View style={styles.cardBottom}>
                <Text style={[styles.cardBudget, { color: '#7c3aed' }]}>{formatBudget(item.budgetAmount, item.budgetCurrency)}</Text>
                <Text style={[styles.cardDate, { color: muted }]}>{new Date(item.startDate).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loader: { flex: 1, marginTop: 40 },
  list: { padding: 24, gap: 12 },
  card: { borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardObjective: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBudget: { fontSize: 15, fontWeight: '700' },
  cardDate: { fontSize: 12 },
  empty: { alignItems: 'center', gap: 16, paddingTop: 60 },
  emptyIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
