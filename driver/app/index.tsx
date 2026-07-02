import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth } from '../lib/auth';

const FEATURES = [
  {
    icon: 'map-marker-path' as const,
    title: 'Live Trip Tracking',
    desc: 'Share your location on an interval so parents and the school always know where you are.',
    iconColor: '#3B82F6',
    iconBg: '#EFF6FF',
  },
  {
    icon: 'account-check-outline' as const,
    title: 'Fast Boarding',
    desc: 'Check students in as they board — one tap per student, no paperwork.',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
  },
  {
    icon: 'steering' as const,
    title: 'Built for Drivers',
    desc: 'Whether you drive for a school or independently, one app runs your whole trip.',
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'private_driver' ? '/private/dashboard' : '/school/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <MaterialCommunityIcons name="steering" size={30} color={Colors.primary} />
          </View>
          <Text style={styles.brandTag}>HAKIKARIDE DRIVER</Text>
          <Text style={styles.heroTitle}>Your route, your{'\n'}trip, one app.</Text>
          <Text style={styles.heroDesc}>
            For school and private drivers — check students in, run your trip, and share your
            location in real time.
          </Text>
          <View style={styles.heroPills}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>School drivers</Text>
            </View>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>Private drivers</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHY HAKIKARIDE DRIVER</Text>
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: f.iconBg }]}>
                  <MaterialCommunityIcons name={f.icon} size={22} color={f.iconColor} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cta}>
          <Pressable style={styles.btnPrimary} onPress={() => router.push('/auth')}>
            <Text style={styles.btnPrimaryText}>Get Started</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.dark} />
          </Pressable>
          <Pressable style={styles.btnGhost} onPress={() => router.push('/auth')}>
            <Text style={styles.btnGhostText}>I already have an account</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Built with care in Kenya · © 2026 HakikaRide</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 52,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(254,198,1,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroDesc: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 23,
    marginBottom: 28,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  featureList: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureBody: { flex: 1 },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  cta: {
    padding: 20,
    paddingTop: 16,
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  btnGhost: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    paddingBottom: 28,
    paddingTop: 4,
  },
});
