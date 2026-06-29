import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, useColorScheme, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import api from '../../services/api';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
  viewCount: number;
  creatorName: string;
}

const CATEGORIES = ['all', 'tech', 'lifestyle', 'gaming', 'beauty', 'food', 'travel', 'fitness', 'music', 'education'];
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function TVTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0f0f23' : '#f8fafc';
  const card = isDark ? '#1e2640' : '#fff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [playing, setPlaying] = useState<ContentItem | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    void loadContent();
  }, [category]);

  async function loadContent() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20', page: '1' });
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const { data } = await api.get(`/streaming?${params.toString()}`);
      setContent((data.data as { items: ContentItem[] }).items ?? []);
    } catch {
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  }

  function playVideo(item: ContentItem) {
    setPlaying(item);
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      {/* Video player overlay */}
      {playing && (
        <View style={styles.playerOverlay}>
          <Video
            ref={videoRef}
            source={{ uri: playing.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPlaying(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.playerTitle} numberOfLines={2}>{playing.title}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: text }]}>EzzeTV</Text>
        <TouchableOpacity onPress={() => router.push('/tv/live' as Parameters<typeof router.push>[0])}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: card }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput
          style={[styles.searchInput, { color: text }]}
          placeholder={t('tv.search')}
          placeholderTextColor={muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => void loadContent()}
          returnKeyType="search"
        />
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setCategory(item)}
            style={[styles.categoryChip, { backgroundColor: item === category ? '#7c3aed' : card, borderColor: item === category ? '#7c3aed' : '#334155' }]}
          >
            <Text style={[styles.categoryText, { color: item === category ? '#fff' : muted }]}>
              {t(`tv.${item}` as Parameters<typeof t>[0])}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Content grid */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#7c3aed" style={styles.loader} />
      ) : (
        <FlatList
          data={content}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="tv-outline" size={48} color={muted} />
              <Text style={[styles.emptyText, { color: muted }]}>{t('tv.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: card, width: CARD_WIDTH }]}
              onPress={() => playVideo(item)}
              activeOpacity={0.8}
            >
              <View style={styles.thumbnail}>
                <Ionicons name="play-circle" size={36} color="#7c3aed" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.cardMeta, { color: muted }]}>{item.creatorName}</Text>
                <Text style={[styles.cardViews, { color: muted }]}>{item.viewCount.toLocaleString()} vistas</Text>
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
  playerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 100, justifyContent: 'center' },
  video: { width: '100%', height: 300 },
  closeBtn: { position: 'absolute', top: 48, right: 16 },
  playerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dc262620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dc2626' },
  liveText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 24, marginBottom: 12, padding: 12, borderRadius: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  categoriesList: { paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: '600' },
  loader: { flex: 1, marginTop: 40 },
  grid: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },
  card: { borderRadius: 16, overflow: 'hidden' },
  thumbnail: { height: 110, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: 12, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cardMeta: { fontSize: 11 },
  cardViews: { fontSize: 11 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15 },
});
