import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { api, ApiError } from '../../../lib/api';
import { usePolling } from '../../../lib/usePolling';

type PrivateTrip = { id: string; status: string; started_at: string; ended_at?: string | null; [key: string]: unknown };
type LocationPoint = { id: string; trip_id: string; latitude: number; longitude: number; recorded_at: string };

export default function ParentTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<PrivateTrip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [confirming, setConfirming] = useState<'boarding' | 'receive' | null>(null);

  const [history, setHistory] = useState<LocationPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    setLoadingTrip(true);
    try {
      setTrip(await api.get<PrivateTrip>(`/parent/trips/${id}/track`));
    } catch {
      setTrip(null);
    } finally {
      setLoadingTrip(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const isLive = trip?.status === 'in_progress';

  const locationPolling = usePolling<LocationPoint>(
    useCallback(() => api.get<LocationPoint>(`/parent/trips/${id}/location`), [id]),
    8000,
    !!isLive,
  );

  useEffect(() => {
    if (isLive || !id || !trip) return;
    setLoadingHistory(true);
    api
      .get<LocationPoint[]>(`/parent/trips/${id}/location/history`)
      .then((data) => setHistory(data ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [isLive, id, trip]);

  const confirmBoarding = async () => {
    if (!id) return;
    setConfirming('boarding');
    try {
      const updated = await api.patch<PrivateTrip>(`/parent/trips/${id}/boarding`);
      setTrip(updated);
    } catch (e) {
      Alert.alert('Could Not Confirm', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setConfirming(null);
    }
  };

  const confirmReceive = async () => {
    if (!id) return;
    setConfirming('receive');
    try {
      const updated = await api.patch<PrivateTrip>(`/parent/trips/${id}/receive`);
      setTrip(updated);
    } catch (e) {
      Alert.alert('Could Not Confirm', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setConfirming(null);
    }
  };

  if (loadingTrip) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.centered}>
        <MaterialCommunityIcons name="car-off" size={40} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>Trip not found</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
          <Text style={styles.emptyBtnText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Trip</Text>
          <Text style={styles.headerSub}>Status: {trip.status}</Text>
        </View>
      </View>

      {isLive ? (
        <View style={styles.content}>
          <View style={styles.liveCard}>
            <View style={styles.liveHeaderRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTitle}>Live now</Text>
            </View>
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
          </View>

          <View style={styles.confirmRow}>
            <Pressable
              style={[styles.confirmBtn, trip.status === 'boarding_confirmed' && styles.confirmBtnDone]}
              onPress={confirmBoarding}
              disabled={confirming !== null}
            >
              {confirming === 'boarding' ? (
                <ActivityIndicator color={Colors.dark} />
              ) : (
                <>
                  <MaterialCommunityIcons name="human-male-child" size={18} color={Colors.dark} />
                  <Text style={styles.confirmBtnText}>Confirm Boarding</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, trip.status === 'student_received' && styles.confirmBtnDone]}
              onPress={confirmReceive}
              disabled={confirming !== null}
            >
              {confirming === 'receive' ? (
                <ActivityIndicator color={Colors.dark} />
              ) : (
                <>
                  <MaterialCommunityIcons name="hand-heart-outline" size={18} color={Colors.dark} />
                  <Text style={styles.confirmBtnText}>Confirm Received</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : loadingHistory ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : history.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={40} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No location history for this trip.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.listHeading}>Route Breadcrumbs</Text>}
          renderItem={({ item, index }) => (
            <View style={styles.pointRow}>
              <View style={styles.pointIndexWrap}>
                <Text style={styles.pointIndex}>{history.length - index}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointCoords}>
                  {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                </Text>
                <Text style={styles.pointTime}>{new Date(item.recorded_at).toLocaleString()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

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
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1, textTransform: 'capitalize' },

  content: { padding: 16, gap: 16 },
  liveCard: { backgroundColor: '#111827', borderRadius: 16, padding: 16 },
  liveHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.success },
  liveTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  liveDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 13, color: Colors.white },
  liveError: { fontSize: 12, color: '#F87171' },

  confirmRow: { gap: 10 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmBtnDone: { backgroundColor: Colors.successLight },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

  list: { padding: 16, gap: 8 },
  listHeading: { fontSize: 16, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  pointIndexWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIndex: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  pointCoords: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  pointTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
