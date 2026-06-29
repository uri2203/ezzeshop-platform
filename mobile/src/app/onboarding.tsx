import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '@ezzeshop_onboarded';

const SLIDES = [
  { key: '1', titleKey: 'onboarding.slide1_title', descKey: 'onboarding.slide1_desc', emoji: '🚀' },
  { key: '2', titleKey: 'onboarding.slide2_title', descKey: 'onboarding.slide2_desc', emoji: '📺' },
  { key: '3', titleKey: 'onboarding.slide3_title', descKey: 'onboarding.slide3_desc', emoji: '🤖' },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  }

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      void finish();
    }
  }

  return (
    <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => void finish()}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{t(item.titleKey as Parameters<typeof t>[0])}</Text>
            <Text style={styles.desc}>{t(item.descKey as Parameters<typeof t>[0])}</Text>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity style={styles.button} onPress={next} activeOpacity={0.85}>
        <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? t('onboarding.get_started') : t('onboarding.next')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  skip: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { color: '#94a3b8', fontSize: 14 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
  dotActive: { width: 24, backgroundColor: '#7c3aed' },
  button: { width: width - 48, marginBottom: 40 },
  buttonGradient: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
