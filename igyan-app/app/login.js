/* Hallmark · redesign: login · pre-emit critique: P4 H5 E4 S5 R5 V4 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import BrandLogo from '../components/BrandLogo';
import { githubUI as c } from '../constants/githubUI';
import { useAuth } from '../utils/AuthContext';

const variants = {
  institutionalSuite: { label: 'Institutional Suite', subtitle: 'For super admins, principals, and teachers.', placeholder: 'you@institution.edu', signup: 'Request workspace access' },
  professionalSuite: { label: 'Launch Pad', subtitle: 'For students and parents.', placeholder: 'you@example.com', signup: 'Create your account' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const variant = typeof params.variant === 'string' && variants[params.variant] ? params.variant : 'institutionalSuite';
  const config = variants[variant];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !busy;

  const submit = async () => {
    if (busy) return;
    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }
    if (!passwordValid) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const result = await login(email.trim(), password, variant);
      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        setError(result.error || 'Sign-in failed. Please try again.');
      }
    } catch (_e) {
      setError('Sign-in failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const emailError = error && !emailValid;
  const passwordError = error && !passwordValid;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <BrandLogo variant="card" style={styles.logo} />
            <Text style={styles.workspace}>{config.label}</Text>
            <Text accessibilityRole="header" style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
            {!!error && <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {!!notice && !error && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
            <Text nativeID="login-email-label" style={styles.label}>Email address</Text>
            <View style={[styles.inputRow, focused === 'email' && styles.focused, emailError && styles.invalid]}>
              <MaterialIcons name="mail-outline" color={c.placeholder} size={20} />
              <TextInput
                accessibilityLabel="Email address"
                aria-labelledby="login-email-label"
                style={styles.input}
                value={email}
                placeholder={config.placeholder}
                placeholderTextColor={c.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                autoComplete="email"
                editable={!busy}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                onChangeText={value => { setEmail(value); setError(''); setNotice(''); }}
                returnKeyType="next"
              />
            </View>
            <Text nativeID="login-password-label" style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focused === 'password' && styles.focused, passwordError && styles.invalid]}>
              <TextInput
                accessibilityLabel="Password"
                aria-labelledby="login-password-label"
                style={styles.input}
                value={password}
                placeholder="Enter your password"
                placeholderTextColor={c.placeholder}
                secureTextEntry={!visible}
                textContentType="password"
                autoComplete="password"
                autoCapitalize="none"
                editable={!busy}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                onChangeText={value => { setPassword(value); setError(''); setNotice(''); }}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} hitSlop={12} disabled={busy} onPress={() => setVisible(value => !value)}>
                <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={22} color={c.muted} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              hitSlop={8}
              onPress={() => setNotice('Password reset is not available in this build. Please contact your school admin to reset your password.')}
              style={styles.forgot}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: !canSubmit, busy }}
              onPress={submit}
              disabled={!canSubmit}
              style={({ pressed }) => [styles.submit, !canSubmit && styles.submitDisabled, pressed && canSubmit && { opacity: 0.85 }]}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Sign in</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/signup', params: { variant } })} style={styles.signup}>
              <Text style={styles.signupText}>{config.signup}</Text>
              <MaterialIcons name="arrow-forward" size={18} color={c.blue} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.loginBackground },
  content: { flexGrow: 1, padding: 24, maxWidth: 540, width: '100%', alignSelf: 'center' },
  form: { flex: 1, justifyContent: 'center', paddingVertical: 32 },
  logo: { width: 64, height: 64, resizeMode: 'contain', marginBottom: 24 },
  workspace: { fontSize: 14, color: c.muted, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: c.heading, marginTop: 8 },
  subtitle: { fontSize: 16, lineHeight: 24, color: c.muted, marginTop: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 16, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.surface },
  focused: { borderColor: c.primary, backgroundColor: c.focusBackground },
  invalid: { borderColor: c.error },
  input: { flex: 1, color: c.heading, fontSize: 16, minHeight: 52 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: 4 },
  forgotText: { color: c.blue, fontWeight: '600', fontSize: 14 },
  submit: { backgroundColor: c.primary, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: c.error, backgroundColor: c.errorBackground, borderWidth: 1, borderColor: c.error, borderRadius: 12, padding: 14, lineHeight: 20 },
  notice: { color: c.text, backgroundColor: c.subtle, borderRadius: 12, padding: 14, lineHeight: 20 },
  signup: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 48, marginTop: 12 },
  signupText: { color: c.blue, fontWeight: '600', fontSize: 14 },
});
