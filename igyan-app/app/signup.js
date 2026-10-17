/**
 * iGyan App - Signup Modal Screen
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import BrandLogo from '../components/BrandLogo';
import { IconSymbol } from '../components/IconSymbol';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notice, setNotice] = useState('');
  const handleSignup = () => {
    setNotice('This is a preview. Account creation is not connected yet.');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color="#4f46e5" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <BrandLogo variant="card" style={styles.logo} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your learning journey today!</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.form}>
            {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
            <View style={styles.inputContainer}>
              <IconSymbol name="person.fill" size={20} color="#4f46e5" />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#7a8b9c"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="paperplane.fill" size={20} color="#4f46e5" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#7a8b9c"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="gear" size={20} color="#4f46e5" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#7a8b9c"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="gear" size={20} color="#4f46e5" />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#7a8b9c"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Create Account</Text>
              <IconSymbol name="chevron.right" size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity accessibilityRole="button" style={styles.socialButton} onPress={() => setNotice('This is a preview. Google sign-in is not connected yet.')}>
              <IconSymbol name="paperplane.fill" size={20} color="#f8fafc" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    color: '#12305c',
    backgroundColor: '#f0f5ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f8ff",
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: "#12305c",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4f46e5",
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#12305c",
    marginLeft: 12,
  },
  signupButton: {
    backgroundColor: "#4f46e5",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  signupButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ffffff",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#12305c",
    opacity: 0.5,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: "#d9e3f3",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#12305c",
    marginLeft: 12,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: "#12305c",
  },
  loginLink: {
    color: "#4f46e5",
    fontWeight: 'bold',
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: "#12305c",
    opacity: 0.5,
    marginTop: 24,
    marginBottom: 24,
    lineHeight: 18,
  },
});
