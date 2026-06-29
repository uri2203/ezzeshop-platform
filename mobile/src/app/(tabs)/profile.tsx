import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, useColorScheme, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { ALL_LOCALES, changeLocale, type SupportedLocale } from '../../i18n';
import { useState } from 'react';
import i18n from '../../i18n';

export default function ProfileTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { user, logout } = useAuthStore();

  const bg = isDark ? '#0f0f23' : '#f8fafc';
  const card = isDark ? '#1e2640' : '#fff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const [showLangPicker, setShowLangPicker] = useState(false);
  const [notifications, setNotifications] = useState(true);

  async function handleLogout() {
    Alert.alert(t('profile.logout'), t('profile.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'), style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function selectLocale(code: SupportedLocale) {
    await changeLocale(code);
    setShowLangPicker(false);
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={[styles.name, { color: text }]}>{user?.firstName} {user?.lastName}</Text>
          <Text style={[styles.email, { color: muted }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: '#7c3aed20' }]}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>

        {/* Settings sections */}
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionLabel, { color: muted }]}>{t('profile.settings')}</Text>

          {/* Language */}
          <TouchableOpacity style={[styles.row, { borderBottomColor: border }]} onPress={() => setShowLangPicker(!showLangPicker)}>
            <View style={styles.rowLeft}>
              <Ionicons name="language-outline" size={20} color="#7c3aed" />
              <Text style={[styles.rowText, { color: text }]}>{t('profile.language')}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: muted }]}>{ALL_LOCALES.find((l) => l.code === i18n.language)?.label ?? 'English'}</Text>
              <Ionicons name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={16} color={muted} />
            </View>
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.langPicker}>
              {ALL_LOCALES.map((locale) => (
                <TouchableOpacity
                  key={locale.code}
                  style={[styles.langOption, { borderBottomColor: border }]}
                  onPress={() => void selectLocale(locale.code)}
                >
                  <Text style={[styles.langLabel, { color: text }]}>{locale.label}</Text>
                  {i18n.language === locale.code && <Ionicons name="checkmark" size={16} color="#7c3aed" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notifications */}
          <View style={[styles.row, { borderBottomColor: border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#7c3aed" />
              <Text style={[styles.rowText, { color: text }]}>{t('profile.notifications')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: '#7c3aed' }}
              thumbColor="#fff"
            />
          </View>

          {/* Edit profile */}
          <TouchableOpacity style={[styles.row, { borderBottomColor: border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color="#7c3aed" />
              <Text style={[styles.rowText, { color: text }]}>{t('profile.edit_profile')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={muted} />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-outline" size={20} color="#7c3aed" />
              <Text style={[styles.rowText, { color: text }]}>{t('profile.privacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={muted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#dc262620', borderColor: '#dc2626' }]} onPress={() => void handleLogout()}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: muted }]}>EzzeShop v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  roleText: { color: '#7c3aed', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  section: { marginHorizontal: 24, borderRadius: 20, marginBottom: 16, overflow: 'hidden' },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { fontSize: 15 },
  rowValue: { fontSize: 13 },
  langPicker: { borderTopWidth: 1, borderTopColor: '#334155' },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1 },
  langLabel: { fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 24, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, marginBottom: 32 },
});
