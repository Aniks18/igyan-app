import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '../components/IconSymbol';
import BrandLogo from '../components/BrandLogo';
import { githubUI as c } from '../constants/githubUI';

const options = [
  { variant: 'institutionalSuite', label: 'Institutional Suite', eyebrow: 'For schools & institutions', description: 'Manage your campus, teams, workflows, and AI-powered learning programs.', icon: 'building.2.fill' },
  { variant: 'professionalSuite', label: 'Launch Pad', eyebrow: 'For learners & families', description: 'Student and parent access for personalized learning and family progress.', icon: 'graduationcap.fill' },
];

export default function AuthOptionsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandLogo size={52} showName style={styles.brand} />
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text accessibilityRole="header" style={styles.title}>Choose your sign-in experience.</Text>
        <Text style={styles.description}>Select the workspace that best matches how you learn, lead, and grow with IGYAN AI.</Text>
        <View style={styles.options}>
          {options.map(option => (
            <Pressable key={option.variant} accessibilityRole="button" accessibilityLabel={`Sign in to ${option.label}`} onPress={() => router.push({ pathname: '/login', params: { variant: option.variant } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.icon}><IconSymbol name={option.icon} size={26} color={c.blue} /></View>
              <View style={styles.cardBody}><Text style={styles.cardEyebrow}>{option.eyebrow}</Text><Text style={styles.cardTitle}>{option.label}</Text><Text style={styles.cardDescription}>{option.description}</Text></View>
              <IconSymbol name="chevron.right" size={20} color={c.blue} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.loginBackground }, content: { flexGrow: 1, justifyContent: 'center', padding: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 48 }, logo: { width: 52, height: 52, resizeMode: 'contain' }, brandName: { color: c.heading, fontSize: 24, fontWeight: '800' },
  eyebrow: { color: c.blue, fontSize: 12, fontWeight: '700', letterSpacing: 2 }, title: { color: c.heading, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1, marginTop: 14 }, description: { color: c.muted, fontSize: 16, lineHeight: 25, marginTop: 18 },
  options: { gap: 16, marginTop: 32 }, card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 18 }, pressed: { backgroundColor: '#eaf1ff', borderColor: c.blue },
  icon: { width: 44, height: 48, borderRadius: 12, backgroundColor: '#eaf1ff', justifyContent: 'center', alignItems: 'center' }, cardBody: { flex: 1, minWidth: 0 }, cardEyebrow: { color: c.blue, fontSize: 10, fontWeight: '700', letterSpacing: 0.7 }, cardTitle: { color: c.heading, fontSize: 19, fontWeight: '700', marginTop: 5 }, cardDescription: { color: c.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
});
