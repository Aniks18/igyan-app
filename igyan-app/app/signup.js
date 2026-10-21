/* Hallmark · redesign: signup · pre-emit critique: P4 H5 E4 S5 R5 V4 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import BrandLogo from '../components/BrandLogo';
import { githubUI as c } from '../constants/githubUI';
import { useAuth } from '../utils/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const { variant } = useLocalSearchParams();
  const { register, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const clear = () => { setError(''); };
  const nameValid = name.trim().length >= 2;
  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 6;
  const matchValid = confirmPassword === password && confirmPassword.length > 0;
  const canSubmit = nameValid && emailValid && passwordValid && matchValid && !busy;

  // New accounts always get a least-privilege default role for the
  // current portal. Elevated roles are assigned by an admin, never here.
  const defaultRole = variant === 'professionalSuite' ? 'b2c_student' : 'student';

  const handleSignup = async () => {
    if (busy) return;
    if (!nameValid) { setError('Enter your full name.'); return; }
    if (!emailValid) { setError('Enter a valid email address.'); return; }
    if (!passwordValid) { setError('Create a password with at least 6 characters.'); return; }
    if (!matchValid) { setError('Passwords do not match.'); return; }
    setError('');
    setBusy(true);
    try {
      const created = await register({
        email: email.trim(),
        password,
        fullName: name.trim(),
        role: defaultRole,
      });
      if (!created.success) {
        setError(created.error || 'Account creation failed. Please try again.');
        return;
      }
      const signedIn = await login(email.trim(), password, typeof variant === 'string' ? variant : null);
      if (signedIn.success) {
        router.replace('/(tabs)/home');
      } else {
        router.replace({ pathname: '/login', params: typeof variant === 'string' ? { variant } : {} });
      }
    } catch (_e) {
      setError('Account creation failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const row = (key, invalid) => [
    styles.inputContainer,
    focused === key && styles.focused,
    invalid && styles.invalid,
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <BrandLogo variant="card" style={styles.logo} />
            <Text accessibilityRole="header" style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your learning journey today.</Text>
          </View>

          <View style={styles.form}>
            {!!error && <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Text nativeID="signup-name-label" style={styles.label}>Full name</Text>
            <View style={row('name', error && !nameValid)}>
              <MaterialIcons name="person-outline" size={20} color={c.placeholder} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={c.placeholder}
                value={name}
                onChangeText={value => { setName(value); clear(); }}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                editable={!busy}
                accessibilityLabel="Full name"
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <Text nativeID="signup-email-label" style={styles.label}>Email</Text>
            <View style={row('email', error && !emailValid)}>
              <MaterialIcons name="mail-outline" size={20} color={c.placeholder} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={c.placeholder}
                value={email}
                onChangeText={value => { setEmail(value); clear(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                editable={!busy}
                accessibilityLabel="Email"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            <Text nativeID="signup-password-label" style={styles.label}>Password</Text>
            <View style={row('password', error && !passwordValid)}>
              <MaterialIcons name="lock-outline" size={20} color={c.placeholder} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={value => { setPassword(value); clear(); }}
                secureTextEntry={!visible}
                textContentType="newPassword"
                autoCapitalize="none"
                editable={!busy}
                accessibilityLabel="Password"
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} hitSlop={12} disabled={busy} onPress={() => setVisible(v => !v)}>
                <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={22} color={c.muted} />
              </Pressable>
            </View>

            <Text nativeID="signup-confirm-label" style={styles.label}>Confirm password</Text>
            <View style={row('confirm', error && !matchValid)}>
              <MaterialIcons name="lock-outline" size={20} color={c.placeholder} />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={c.placeholder}
                value={confirmPassword}
                onChangeText={value => { setConfirmPassword(value); clear(); }}
                secureTextEntry={!visible}
                textContentType="newPassword"
                autoCapitalize="none"
                editable={!busy}
                accessibilityLabel="Confirm password"
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                returnKeyType="go"
                onSubmitEditing={handleSignup}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: !canSubmit, busy }}
              style={({ pressed }) => [styles.signupButton, !canSubmit && styles.disabled, pressed && canSubmit && { opacity: 0.85 }]}
              onPress={handleSignup}
              disabled={!canSubmit}
            >
              {busy
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={styles.signupButtonText}>Create account</Text>}
              {!busy && <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.replace({ pathname: '/login', params: { variant } })}>
                <Text style={styles.loginLink}>Sign in</Text>
              </Pressable>
            </View>

            <Text style={styles.terms}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: { padding: 24, paddingTop: 24, maxWidth: 540, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 24, width: '100%' },
  logo: { marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: c.heading, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, color: c.muted, marginTop: 8, textAlign: 'center' },
  form: { width: '100%', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 16, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  focused: { borderColor: c.primary, backgroundColor: c.focusBackground },
  invalid: { borderColor: c.error },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: c.heading },
  signupButton: {
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 24,
  },
  disabled: { opacity: 0.45 },
  signupButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, minHeight: 44 },
  loginText: { color: c.muted, fontSize: 14 },
  loginLink: { color: c.blue, fontWeight: '700', fontSize: 14 },
  terms: { textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 16, marginBottom: 24, lineHeight: 18 },
  error: { color: c.error, backgroundColor: c.errorBackground, borderWidth: 1, borderColor: c.error, borderRadius: 12, padding: 14, lineHeight: 20, marginBottom: 8 },
});
