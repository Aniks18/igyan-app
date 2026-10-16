/**
 * iGyan App - Home Page
 * Main landing page for the educational app
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { githubUI as c } from '../../constants/githubUI';
import { router } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { IconSymbol } from '../../components/IconSymbol';
import { homeStyles } from '../../styles/pages/homeStyles';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';

const INSTITUTIONAL_ROLES = ['super_admin', 'co_admin', 'student', 'faculty', 'parent'];

export default function HomePage() {
  const { user } = useAuth();
  
  const [schoolData, setSchoolData] = useState(null);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    if (user && user.school_id && INSTITUTIONAL_ROLES.includes(user.role)) {
      fetchSchoolData();
    }
    if (user && user.role === 'parent') {
      fetchChildren();
    }
  }, [user]);

  const fetchSchoolData = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('school_name, logo_url')
        .eq('id', user.school_id)
        .single();
      
      if (!error && data) {
        setSchoolData(data);
      }
    } catch (error) {
      console.error('Error fetching school data:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('parent_student_assignments')
        .select('id, relationship, is_primary, student:users!psa_student_fkey(id, full_name, email)')
        .eq('parent_id', user.id);
      if (!error && data) setChildren(data);
    } catch (e) { console.error('Error fetching children:', e); }
  };

  return (
    <ThemedView style={[homeStyles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={homeStyles.scrollContent}>
        <LinearGradient colors={['#1666be', '#27358e', '#74159d']} style={dashboard.hero}>
          <View style={dashboard.brandRow}>
            <Image source={require('../../assets/brand/igyan-ai-mark.png')} style={dashboard.mark} />
            <View style={{ flex: 1 }}><Text style={dashboard.brand}>IGYAN AI</Text><Text style={dashboard.tagline}>{schoolData?.school_name || 'Talent in Motion'}</Text></View>
          </View>
          <Text style={dashboard.greeting}>Welcome back, {user?.full_name?.split(' ')[0] || 'Learner'}.</Text>
          <Text style={dashboard.heroCopy}>Your workspace for learning, leading, and growing. Turn curiosity into progress, one step at a time.</Text>
          <TouchableOpacity accessibilityRole="button" style={dashboard.heroButton} onPress={() => router.push('/daily-timetable')}><IconSymbol name="calendar" size={18} color="#fff" /><Text style={dashboard.heroButtonText}>View your calendar</Text><IconSymbol name="chevron.right" size={16} color="#fff" /></TouchableOpacity>
        </LinearGradient>

        <Text style={dashboard.sectionTitle}>Quick launchpad</Text>
        <Text style={dashboard.sectionCopy}>Jump back into the tools that keep you moving.</Text>
        <View style={dashboard.grid}>
          {[
            { title: 'Learn', detail: 'Explore your courses', icon: 'book.fill', route: '/(tabs)/courses' },
            { title: 'Classroom', detail: 'Connect and collaborate', icon: 'video.fill', route: '/live-classroom' },
            { title: 'AI Viva Lab', detail: 'Practice your pitch', icon: 'sparkles', route: '/viva-ai' },
            { title: 'AI Tools', detail: 'Create, study, and build', icon: 'cpu', route: '/tools' },
            { title: 'Pitch Craft', detail: 'Bring ideas to life', icon: 'doc.richtext.fill', route: '/content-generator' },
            { title: 'Calendar', detail: 'Plan your next step', icon: 'calendar', route: '/daily-calendar' },
          ].map(action => <TouchableOpacity accessibilityRole="button" key={action.title} onPress={() => router.push(action.route)} style={dashboard.action}><View style={dashboard.actionIcon}><IconSymbol name={action.icon} size={23} color={c.primary} /></View><Text style={dashboard.actionTitle}>{action.title}</Text><Text style={dashboard.actionDetail}>{action.detail}</Text><IconSymbol name="arrow.up.right" size={16} color={c.primary} /></TouchableOpacity>)}
        </View>

        {/* Parent — My Children */}
        {user?.role === 'parent' && children.length > 0 && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <IconSymbol name="person.2.fill" size={18} color="#3b82f6" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#e2e8f0' }}>My Children</Text>
              <View style={{ backgroundColor: '#3b82f620', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 'auto' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>{children.length}</Text>
              </View>
            </View>
            {children.map(c => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#334155', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{(c.student?.full_name || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0' }}>{c.student?.full_name || 'Unknown'}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{c.relationship || 'Parent'}{c.is_primary ? ' · Primary' : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/chat')} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#3b82f615', borderRadius: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>Message</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const dashboard = StyleSheet.create({
  hero: { borderRadius: 22, padding: 24, marginBottom: 28 }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }, mark: { width: 52, height: 52, resizeMode: 'contain', borderRadius: 12, backgroundColor: '#fff' }, brand: { color: '#fff', fontSize: 20, fontWeight: '800' }, tagline: { color: '#dbeafe', fontSize: 12, marginTop: 4 }, greeting: { color: '#fff', fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.5 }, heroCopy: { color: '#e0e7ff', fontSize: 14, lineHeight: 23, marginTop: 12 }, heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, marginTop: 22 }, heroButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 }, sectionTitle: { color: c.heading, fontSize: 21, fontWeight: '700' }, sectionCopy: { color: c.muted, fontSize: 14, lineHeight: 22, marginTop: 6, marginBottom: 18 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 24 }, action: { width: '48%', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, gap: 10 }, actionIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', borderRadius: 12 }, actionTitle: { color: c.heading, fontSize: 16, fontWeight: '700' }, actionDetail: { color: c.muted, fontSize: 12, lineHeight: 19 },
});
