/**
 * iGyan App - Incubation Hub Page
 * Explore national and state incubation programs
 */

import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Incubator data
const incubators = [
  { name: "Startup India (Main Portal)", region: "National", urls: ["https://www.startupindia.gov.in/"] },
  { name: "Atal Innovation Mission (AIM)", region: "National", urls: ["https://aim.gov.in/atal-incubation-centres.php"] },
  { name: "MSME Incubation Scheme", region: "National", urls: ["https://my.msme.gov.in/inc/"] },
  { name: "MeitY Startup Hub (MSH)", region: "National", urls: ["https://msh.meity.gov.in/"] },
  { name: "Software Tech Parks of India", region: "National", urls: ["https://stpi.in/en/instructions-applying-online"] },
  { name: "NIDHI (DST) Incubator", region: "National", urls: ["https://www.indiascienceandtechnology.gov.in/listingpage/technology-incubators"] },
  { name: "Startup Andhra Pradesh", region: "Andhra Pradesh", urls: ["https://startupandhrapradesh.gov.in/"] },
  { name: "Startup Assam", region: "Assam", urls: ["https://startup.assam.gov.in/"] },
  { name: "Startup Bihar", region: "Bihar", urls: ["https://startup.bihar.gov.in/"] },
  { name: "StartinUP (Uttar Pradesh)", region: "Uttar Pradesh", urls: ["https://startinup.up.gov.in/"] },
  { name: "Startup Goa", region: "Goa", urls: ["https://www.startup.goa.gov.in/"] },
  { name: "Startup Gujarat", region: "Gujarat", urls: ["https://startup.gujarat.gov.in/"] },
  { name: "Startup Haryana", region: "Haryana", urls: ["https://startupharyana.gov.in/"] },
  { name: "Startup Karnataka", region: "Karnataka", urls: ["https://startup.karnataka.gov.in/"] },
  { name: "Kerala Startup Mission", region: "Kerala", urls: ["https://startupmission.kerala.gov.in/"] },
  { name: "Startup Maharashtra", region: "Maharashtra", urls: ["https://msins.in/"] },
  { name: "Startup Odisha", region: "Odisha", urls: ["https://startupodisha.gov.in/"] },
  { name: "Startup Punjab", region: "Punjab", urls: ["https://startup.punjab.gov.in/"] },
  { name: "iStart Rajasthan", region: "Rajasthan", urls: ["https://istart.rajasthan.gov.in/"] },
  { name: "Startup Tamil Nadu (TANSIM)", region: "Tamil Nadu", urls: ["https://startuptn.in/"] },
  { name: "T-Hub (Telangana)", region: "Telangana", urls: ["https://t-hub.co/"] },
  { name: "Startup West Bengal", region: "West Bengal", urls: ["https://startup.wb.gov.in/"] },
  { name: "SINE (IIT Bombay)", region: "Maharashtra", urls: ["https://www.sineiitb.org/"] },
  { name: "FITT (IIT Delhi)", region: "Delhi", urls: ["https://fitt.accubate.app/ext/form/3403/1/apply"] },
  { name: "IIT Madras Incubation Cell", region: "Tamil Nadu", urls: ["https://incubation.iitm.ac.in/"] },
  { name: "SIIC (IIT Kanpur)", region: "Uttar Pradesh", urls: ["https://siicincubator.com/"] },
  { name: "NSRCEL (IIM Bangalore)", region: "Karnataka", urls: ["https://nsrcel.org/programs/"] },
  { name: "IIMA Ventures (CIIE)", region: "Gujarat", urls: ["https://iimaventures.com/incubation/"] },
  { name: "SID (IISc Bangalore)", region: "Karnataka", urls: ["https://sid.iisc.ac.in/"] },
  { name: "i-TIC (IIT Hyderabad)", region: "Telangana", urls: ["https://itic.iith.ac.in/"] },
  { name: "TIDES (IIT Roorkee)", region: "Uttarakhand", urls: ["https://tides.iitr.ac.in/"] },
  { name: "Venture Center (NCL Pune)", region: "Maharashtra", urls: ["https://www.venturecenter.co.in/"] },
  { name: "iCreate (Ahmedabad)", region: "Gujarat", urls: ["https://icreate.org.in/"] },
  { name: "Villgro Innovations", region: "Tamil Nadu", urls: ["https://villgro.org/"] },
  { name: "Startup Oasis (Rajasthan)", region: "Rajasthan", urls: ["https://www.startupoasis.in/"] },
  { name: "PIED Society (BITS Pilani)", region: "Rajasthan", urls: ["https://www.piedsociety.org/"] },
  { name: "DLabs (ISB Hyderabad)", region: "Telangana", urls: ["https://www.isbdlabs.org/"] },
  { name: "IIM Calcutta Innovation Park", region: "West Bengal", urls: ["https://www.iimcip.org/"] },
  { name: "STEP-IIT Kharagpur", region: "West Bengal", urls: ["https://www.stepiitkgp.org/"] },
  { name: "KIIT Tech Business Incubator", region: "Odisha", urls: ["https://www.kiitincubator.in/"] },
  { name: "PSG STEP (Coimbatore)", region: "Tamil Nadu", urls: ["https://www.psgstep.org/"] },
  { name: "TREC STEP (NIT Trichy)", region: "Tamil Nadu", urls: ["https://www.trecstep.com/"] },
  { name: "IIT Mandi Catalyst", region: "Himachal Pradesh", urls: ["https://www.iitmandicatalyst.in/"] },
  { name: "Amrita TBI (Kerala)", region: "Kerala", urls: ["https://amritatbi.com/"] },
  { name: "GUSEC (Gujarat University)", region: "Gujarat", urls: ["https://gusec.edu.in/"] },
  { name: "IIT BHU Innovation Centre", region: "Uttar Pradesh", urls: ["https://i3f-iitbhu.org/"] },
];

const priorityRegions = ["National"];

const sortRegions = (a, b) => {
  const aPriority = priorityRegions.indexOf(a);
  const bPriority = priorityRegions.indexOf(b);
  if (aPriority === -1 && bPriority === -1) return a.localeCompare(b);
  if (aPriority === -1) return 1;
  if (bPriority === -1) return -1;
  return aPriority - bPriority;
};

export default function IncubationHubPage() {
  const { openSideNav } = useSideNav();
  const cardColor = useThemeColor({}, 'card');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredIncubators = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return incubators;
    return incubators.filter(
      (incubator) =>
        incubator.name.toLowerCase().includes(query) ||
        incubator.region.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const groupedIncubators = useMemo(() => {
    const buckets = new Map();
    filteredIncubators.forEach((incubator) => {
      const key = incubator.region;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(incubator);
    });
    return Array.from(buckets.entries())
      .map(([region, items]) => [region, items.sort((a, b) => a.name.localeCompare(b.name))])
      .sort((a, b) => sortRegions(a[0], b[0]));
  }, [filteredIncubators]);

  const openUrl = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Incubation Hub"
        onMenuPress={openSideNav}
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <IconSymbol name="building.2.fill" size={32} color="#fff" />
          </View>
          <ThemedText style={styles.heroTitle}>Incubation Hub</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Explore startup incubators & accelerators across India
          </ThemedText>
        </View>

        {/* Stats Badge */}
        <View style={styles.statsBadge}>
          <IconSymbol name="building.columns.fill" size={18} color="#4f46e5" />
          <Text style={styles.statsBadgeText}>{filteredIncubators.length} programs listed</Text>
        </View>

        {/* Search Section */}
        <View style={[styles.searchSection, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.searchTitle}>Find the right incubator</ThemedText>
          <ThemedText style={styles.searchSubtitle}>
            Search by state or program name
          </ThemedText>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={18} color="#8899a6" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search incubators or states..."
              placeholderTextColor="#8899a6"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color="#8899a6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Incubator List */}
        {groupedIncubators.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
            <IconSymbol name="building.2" size={64} color="#666" />
            <ThemedText style={styles.emptyStateTitle}>No Results Found</ThemedText>
            <ThemedText style={styles.emptyStateSubtitle}>
              Try a different search term
            </ThemedText>
          </View>
        ) : (
          groupedIncubators.map(([region, items]) => (
            <View key={region} style={styles.regionSection}>
              {/* Region Header */}
              <View style={styles.regionHeader}>
                <View style={styles.regionTitleContainer}>
                  <Text style={styles.regionIcon}>
                    {region === 'National' ? '🇮🇳' : '📍'}
                  </Text>
                  <Text style={styles.regionTitle}>{region}</Text>
                </View>
                <View style={styles.regionBadge}>
                  <Text style={styles.regionBadgeText}>
                    {items.length} program{items.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Incubator Cards */}
              <View style={styles.cardsContainer}>
                {items.map((incubator) => (
                  <View key={incubator.name} style={[styles.incubatorCard, { backgroundColor: cardColor }]}>
                    <View style={styles.incubatorInfo}>
                      <View style={styles.incubatorIconContainer}>
                        <IconSymbol name="building.2.fill" size={20} color="#4f46e5" />
                      </View>
                      <View style={styles.incubatorDetails}>
                        <Text style={styles.incubatorName} numberOfLines={2}>
                          {incubator.name}
                        </Text>
                        <Text style={styles.incubatorRegion}>{region}</Text>
                      </View>
                    </View>
                    <View style={styles.incubatorActions}>
                      {incubator.urls.map((url, index) => (
                        <TouchableOpacity
                          key={`${incubator.name}-${index}`}
                          style={styles.visitButton}
                          onPress={() => openUrl(url)}
                        >
                          <Text style={styles.visitButtonText}>Visit Portal</Text>
                          <IconSymbol name="arrow.up.right" size={12} color="#4f46e5" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <IconSymbol name="info.circle.fill" size={16} color="#8899a6" />
          <Text style={styles.footerText}>
            Data sourced from official government portals and institutions
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8ff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 20,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#8899a6',
    textAlign: 'center',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 171, 244, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 244, 0.3)',
  },
  statsBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: "#4f46e5",
  },
  searchSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 12,
    color: '#8899a6',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#12305c",
  },
  regionSection: {
    marginBottom: 24,
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regionIcon: {
    fontSize: 20,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: "#12305c",
  },
  regionBadge: {
    backgroundColor: 'rgba(0, 171, 244, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: "#4f46e5",
    textTransform: 'uppercase',
  },
  cardsContainer: {
    gap: 10,
  },
  incubatorCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 244, 0.2)',
  },
  incubatorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  incubatorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 171, 244, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  incubatorDetails: {
    flex: 1,
  },
  incubatorName: {
    fontSize: 15,
    fontWeight: '600',
    color: "#12305c",
    marginBottom: 2,
  },
  incubatorRegion: {
    fontSize: 12,
    color: '#8899a6',
  },
  incubatorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 171, 244, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 244, 0.3)',
    gap: 6,
  },
  visitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: "#4f46e5",
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#8899a6',
    marginTop: 4,
    textAlign: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#8899a6',
    textAlign: 'center',
  },
});
