import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: '' as 'client' | 'creator' | '' });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleRegister() {
    if (!form.role) { Alert.alert('', 'Selecciona tu tipo de cuenta'); return; }
    try {
      await register({ ...form, role: form.role });
      router.replace('/(tabs)');
    } catch {
      Alert.alert(t('common.error'), 'No se pudo crear la cuenta. Intenta de nuevo.');
    }
  }

  return (
    <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="flash" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoText}>EzzeShop</Text>
          </View>

          <Text style={styles.title}>{t('auth.register_title')}</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {(['client', 'creator'] as const).map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => update('role', role)}
                style={[styles.roleBtn, form.role === role && styles.roleBtnActive]}
              >
                <Ionicons name={role === 'client' ? 'business-outline' : 'videocam-outline'} size={22} color={form.role === role ? '#fff' : '#94a3b8'} />
                <Text style={[styles.roleText, form.role === role && styles.roleTextActive]}>
                  {t(`auth.iam_${role}` as Parameters<typeof t>[0])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name row */}
          <View style={styles.nameRow}>
            {(['firstName', 'lastName'] as const).map((field) => (
              <View key={field} style={styles.nameField}>
                <Text style={styles.label}>{t(`auth.${field === 'firstName' ? 'first_name' : 'last_name'}` as Parameters<typeof t>[0])}</Text>
                <TextInput
                  style={styles.input}
                  value={form[field]}
                  onChangeText={(v) => update(field, v)}
                  placeholderTextColor="#475569"
                  placeholder={field === 'firstName' ? 'Juan' : 'Pérez'}
                />
              </View>
            ))}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.inputFull}
              value={form.email}
              onChangeText={(v) => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#475569"
              placeholder="tu@email.com"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.inputFull}
              value={form.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry
              placeholderTextColor="#475569"
              placeholder="Mínimo 8 caracteres"
            />
          </View>

          <TouchableOpacity onPress={() => void handleRegister()} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.registerBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>{t('auth.register_btn')}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t('auth.have_account')} </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>{t('auth.sign_in')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  logoBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#334155', backgroundColor: '#1e2640' },
  roleBtnActive: { borderColor: '#7c3aed', backgroundColor: '#7c3aed20' },
  roleText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  roleTextActive: { color: '#a78bfa' },
  nameRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  nameField: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { backgroundColor: '#1e2640', borderRadius: 12, borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 14, fontSize: 15 },
  inputContainer: { marginBottom: 16 },
  inputFull: { backgroundColor: '#1e2640', borderRadius: 12, borderWidth: 1, borderColor: '#334155', color: '#fff', padding: 14, fontSize: 15 },
  registerBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#94a3b8', fontSize: 14 },
  loginLink: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
});
