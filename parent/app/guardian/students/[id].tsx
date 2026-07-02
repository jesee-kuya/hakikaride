import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { api, ApiError } from '../../../lib/api';
import { usePolling } from '../../../lib/usePolling';

type Student = { id: string; first_name?: string; last_name?: string; name?: string; grade?: string; [key: string]: unknown };
type Trip = { id: string; status: string; started_at: string; ended_at?: string | null; trip_type?: string; [key: string]: unknown };
type LocationPoint = { id: string; trip_id: string; latitude: number; longitude: number; recorded_at: string };

function studentLabel(s: Student | null) {
  if (!s) return 'Student';
  if (s.name) return s.name;
  const full = [s.first_name, s.last_name].filter(Boolean).join(' ');
  return full || s.id;
}

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [activeTrip, setActiveTrip] = useState<Trip | null | undefined>(undefined);
  const [loadingTrip, setLoadingTrip] = useState(true);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const loadStudent = useCallback(async () => {
    if (!id) return;
    setLoadingStudent(true);
    try {
      setStudent(await api.get<Student>(`/guardian/students/${id}`));
    } catch {
      setStudent(null);
    } finally {
      setLoadingStudent(false);
    }
  }, [id]);

  const loadActiveTrip = useCallback(async () => {
    if (!id) return;
    setLoadingTrip(true);
    try {
      setActiveTrip(await api.get<Trip>(`/guardian/students/${id}/track`));
    } catch (e) {
      setActiveTrip(e instanceof ApiError && e.status === 404 ? null : null);
    } finally {
      setLoadingTrip(false);
    }
  }, [id]);

  const loadTrips = useCallback(async () => {
    if (!id) return;
    setLoadingTrips(true);
    try {
      const data = await api.get<Trip[]>(`/guardian/students/${id}/trips`);
      setTrips(data ?? []);
    } catch {
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudent();
    loadActiveTrip();
    loadTrips();
  }, [loadStudent, loadActiveTrip, loadTrips]);

  const isLive = activeTrip != null;

  const locationPolling = usePolling<LocationPoint>(
    useCallback(() => api.get<LocationPoint>(`/guardian/students/${id}/location`), [id]),
    8000,
    isLive,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{studentLabel(student)}</Text>
          {loadingStudent ? null : student?.grade ? <Text style={styles.headerSub}>{student.grade}</Text> : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Status</Text>
          {loadingTrip ? (
            <ActivityIndicator color={Colors.textLight} style={{ marginVertical: 12 }} />
          ) : isLive ? (
            <View style={styles.liveCard}>
              <View style={styles.liveHeaderRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTitle}>Trip in progress</Text>
              </View>
              <Text style={styles.liveSub}>
                {activeTrip?.trip_type ? `${activeTrip.trip_type} · ` : ''}status: {activeTrip?.status}
              </Text>
              <View style={styles.liveDivider} />
              {locationPolling.data ? (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker-check" size={16} color={Colors.primary} />
                  <Text style={styles.locationText}>
                    {locationPolling.data.latitude.toFixed(5)}, {locationPolling.data.longitude.toFixed(5)}
                  </Text>
                </View>
              ) : locationPolling.error ? (
                <Text style={styles.liveError}>{locationPolling.error}</Text>
              ) : (
                <ActivityIndicator color="#9CA3AF" size="small" />
              )}
              {activeTrip?.id && (
                <Pressable
                  style={styles.trackHistoryBtn}
                  onPress={() => router.push({ pathname: '/guardian/trips/[id]', params: { id: activeTrip.id } })}
                >
                  <Text style={styles.trackHistoryText}>View route breadcrumbs</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.white} />
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="bus-clock" size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>No trip in progress right now.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip History</Text>
          {loadingTrips ? (
            <ActivityIndicator color={Colors.textLight} style={{ marginVertical: 12 }} />
          ) : trips.length === 0 ? (
            <Text style={styles.noResults}>No trips recorded yet.</Text>
          ) : (
            trips.map((trip) => (
              <Pressable
                key={trip.id}
                style={styles.tripRow}
                onPress={() => router.push({ pathname: '/guardian/trips/[id]', params: { id: trip.id } })}
              >
                <View style={styles.tripIcon}>
                  <MaterialCommunityIcons name="bus" size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripType}>{trip.trip_type ?? 'trip'}</Text>
                  <Text style={styles.tripMeta}>
                    {trip.status} · {new Date(trip.started_at).toLocaleString()}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  scroll: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },

  liveCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16 },
  liveHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.success },
  liveTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  liveSub: { fontSize: 12, color: '#9CA3AF', marginTop: 4, textTransform: 'capitalize' },
  liveDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 13, color: Colors.white },
  liveError: { fontSize: 12, color: '#F87171' },
  trackHistoryBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  trackHistoryText: { fontSize: 13, fontWeight: '600', color: Colors.white },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
  noResults: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 12 },

  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripType: { fontSize: 14, fontWeight: '600', color: Colors.dark, textTransform: 'capitalize' },
  tripMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
});
