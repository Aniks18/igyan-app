import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../utils/AuthContext';
import { githubUI as c } from '../constants/githubUI';

const variants = {
  institutionalSuite: { label: 'Institutional Suite', subtitle: 'For super admins, principals, and teachers.', placeholder: 'you@institution.edu', signup: 'Request workspace access' },
  professionalSuite: { label: 'Launch Pad', subtitle: 'For students and parents.', placeholder: 'you@example.com', signup: 'Create your account' },
};
export default function LoginScreen() {
  const params = useLocalSearchParams();
  const variant = typeof params.variant === 'string' && variants[params.variant] ? params.variant : 'institutionalSuite';
  const config = variants[variant];
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(null);
  const submit = async () => {
    if (loading) return;
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const result = await login(email.trim(), password, variant);
      if (result.success) router.replace('/(tabs)/home');
      else setError(result.error || 'Sign-in failed. Please try again.');
    } catch (err) { setError(err.message || 'Unable to sign in. Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/auth-options')} style={styles.back}><MaterialIcons name="arrow-back" size={20} color={c.muted} /><Text style={styles.backText}>Choose workspace</Text></Pressable>
          <View style={styles.form}>
            <Image source={require('../assets/brand/igyan-ai-mark.png')} style={styles.logo} />
            <Text style={styles.eyebrow}>{config.label.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            <Text style={styles.label}>Email address</Text>
            <View style={[styles.inputRow, focused === 'email' && styles.focused]}><MaterialIcons name="mail-outline" color="#94a3b8" size={20} /><TextInput accessibilityLabel="Email address" style={styles.input} value={email} placeholder={config.placeholder} placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="username" onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} onChangeText={value => { setEmail(value); setError(''); }} editable={!loading} /></View>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focused === 'password' && styles.focused]}><TextInput accessibilityLabel="Password" style={styles.input} value={password} placeholder="Enter your password" placeholderTextColor="#94a3b8" secureTextEntry={!visible} textContentType="password" autoCapitalize="none" onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} onChangeText={value => { setPassword(value); setError(''); }} editable={!loading} returnKeyType="go" onSubmitEditing={submit} /><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} hitSlop={12} onPress={() => setVisible(value => !value)}><MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={22} color={c.muted} /></Pressable></View>
            <Pressable accessibilityRole="button" disabled={loading} onPress={submit} style={({ pressed }) => [styles.submit, (pressed || loading) && { opacity: 0.7 }]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Sign in</Text>}</Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/signup')} style={styles.signup}><Text style={styles.signupText}>{config.signup}</Text><MaterialIcons name="arrow-forward" size={18} color={c.blue} /></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' }, content: { flexGrow: 1, padding: 24, maxWidth: 540, width: '100%', alignSelf: 'center' }, back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 }, backText: { color: c.muted, fontSize: 14 }, form: { flex: 1, justifyContent: 'center', paddingVertical: 40 }, logo: { width: 64, height: 64, resizeMode: 'contain', marginBottom: 32 }, eyebrow: { fontSize: 12, color: c.blue, fontWeight: '700', letterSpacing: 2 }, title: { fontSize: 34, fontWeight: '800', color: c.heading, marginTop: 16 }, subtitle: { fontSize: 16, lineHeight: 24, color: c.muted, marginTop: 10, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 16, marginBottom: 8 }, inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54, borderWidth: 1, borderColor: '#d0d9e9', borderRadius: 12 }, focused: { borderColor: c.blue, backgroundColor: '#f8fbff' }, input: { flex: 1, color: c.heading, fontSize: 16, minHeight: 52 }, submit: { backgroundColor: c.blue, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28 }, submitText: { color: '#fff', fontWeight: '700', fontSize: 16 }, error: { color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, lineHeight: 20 }, signup: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 48, marginTop: 16 }, signupText: { color: c.blue, fontWeight: '600', fontSize: 14 },
});
