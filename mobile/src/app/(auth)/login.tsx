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

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, loginWithBiometric, biometricAvailable, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert(t('common.error'), 'Credenciales incorrectas. Inténtalo de nuevo.');
    }
  }

  async function handleBiometric() {
    const success = await loginWithBiometric();
    if (success) router.replace('/(tabs)');
    else Alert.alert(t('common.error'), 'No se pudo verificar la identidad.');
  }

  return (
    <LinearGradient colors={['#0f0f23', '#1a1a2e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="flash" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoText}>EzzeShop</Text>
          </View>

          <Text style={styles.title}>{t('auth.login_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor="#475569"
                placeholder="tu@email.com"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputPassword]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                placeholderTextColor="#475569"
                placeholder="••••••••"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity onPress={() => void handleLogin()} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.loginBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t('auth.login_btn')}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Biometric */}
          {biometricAvailable && (
            <TouchableOpacity style={styles.biometricBtn} onPress={() => void handleBiometric()}>
              <Ionicons name="finger-print" size={24} color="#7c3aed" />
              <Text style={styles.biometricText}>{t('auth.biometric')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth buttons */}
          <TouchableOpacity style={styles.oauthBtn}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.oauthText}>{t('auth.google')}</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={[styles.oauthBtn, styles.appleBtn]}>
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={[styles.oauthText, styles.appleText]}>{t('auth.apple')}</Text>
            </TouchableOpacity>
          )}

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t('auth.no_account')} </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>{t('auth.sign_up')}</Text>
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
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 28 },
  inputContainer: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e2640', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, color: '#fff', paddingHorizontal: 12, paddingVertical: 14, fontSize: 15 },
  inputPassword: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#7c3aed', fontSize: 13 },
  loginBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  biometricBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  biometricText: { color: '#7c3aed', fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { color: '#64748b', fontSize: 13 },
  oauthBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: '#1e2640', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  oauthText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  appleBtn: { backgroundColor: '#fff' },
  appleText: { color: '#000' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { color: '#94a3b8', fontSize: 14 },
  registerLink: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
});
