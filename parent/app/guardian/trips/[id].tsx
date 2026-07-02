import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { api } from '../../../lib/api';

type LocationPoint = { id: string; trip_id: string; latitude: number; longitude: number; recorded_at: string };

export default function TripBreadcrumbScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get<LocationPoint[]>(`/guardian/trips/${id}/location/history`);
      setPoints(data ?? []);
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Route Breadcrumbs</Text>
          <Text style={styles.headerSub}>{points.length} recorded point{points.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : points.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={40} color={Colors.textLight} />
          <Text style={styles.emptyText}>No location history for this trip yet.</Text>
        </View>
      ) : (
        <FlatList
          data={points}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.pointRow}>
              <View style={styles.pointIndexWrap}>
                <Text style={styles.pointIndex}>{points.length - index}</Text>
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

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  list: { padding: 16, gap: 8 },
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
