import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import { getActiveTrip, setActiveTrip, type ActiveTrip } from '../../lib/tripStorage';

type Student = { id: string; name?: string; grade?: string; [key: string]: unknown };
type TripType = 'pickup' | 'dropoff';
type SchoolTrip = { id: string; status: string; started_at: string; bus_id: string; trip_type: string; [key: string]: unknown };

export default function SchoolDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [busId, setBusId] = useState('');
  const [tripType, setTripType] = useState<TripType>('pickup');
  const [startingTrip, setStartingTrip] = useState(false);

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[]>([]);

  const [activeTrip, setActiveTripState] = useState<ActiveTrip | null>(null);

  useFocusEffect(
    useCallback(() => {
      getActiveTrip().then((t) => {
        if (t && t.kind === 'school') setActiveTripState(t);
      });
    }, []),
  );

  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<Student[]>(`/school-driver/students/search?q=${encodeURIComponent(search)}`);
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [search]);

  const startTrip = async () => {
    if (!busId) {
      Alert.alert('Missing Bus ID', 'Enter the bus ID for this trip.');
      return;
    }
    setStartingTrip(true);
    try {
      const trip = await api.post<SchoolTrip>('/school-driver/trips', { bus_id: busId, trip_type: tripType });
      const next: ActiveTrip = {
        id: trip.id,
        status: trip.status,
        startedAt: trip.started_at,
        kind: 'school',
        label: `Bus ${busId} · ${tripType}`,
      };
      await setActiveTrip(next);
      setActiveTripState(next);
      setBusId('');
      router.push('/school/trip');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Trip Already In Progress', 'You already have a trip in progress.');
      } else {
        Alert.alert('Could Not Start Trip', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setStartingTrip(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout().then(() => router.replace('/')) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>School Driver</Text>
          <Text style={styles.headerTitle}>{user?.username ?? 'Driver'}</Text>
        </View>
        <Pressable style={styles.avatar} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.dark} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {activeTrip && (
          <Pressable style={styles.activeTripCard} onPress={() => router.push('/school/trip')}>
            <View style={styles.activeTripDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTripTitle}>Trip in progress</Text>
              <Text style={styles.activeTripSub}>{activeTrip.label} · tap to resume</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.white} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start a Trip</Text>
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="bus" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={busId}
                onChangeText={setBusId}
                placeholder="Bus ID"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.typeRow}>
              {(['pickup', 'dropoff'] as TripType[]).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeChip, tripType === t && styles.typeChipActive]}
                  onPress={() => setTripType(t)}
                >
                  <Text style={[styles.typeChipText, tripType === t && styles.typeChipTextActive]}>
                    {t === 'pickup' ? 'Pickup' : 'Dropoff'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.startBtn} onPress={startTrip} disabled={startingTrip}>
              {startingTrip ? (
                <ActivityIndicator color={Colors.dark} />
              ) : (
                <>
                  <MaterialCommunityIcons name="bus-side" size={18} color={Colors.dark} />
                  <Text style={styles.startBtnText}>Start Trip</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Students</Text>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor={Colors.textLight}
              value={search}
              onChangeText={setSearch}
            />
            {searching && <ActivityIndicator size="small" color={Colors.textLight} />}
            {!searching && search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color={Colors.textLight} />
              </Pressable>
            )}
          </View>
          {results.map((stu) => (
            <View key={stu.id} style={styles.studentRow}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>{(stu.name ?? '?')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{stu.name ?? stu.id}</Text>
                {stu.grade ? <Text style={styles.studentMeta}>{stu.grade}</Text> : null}
              </View>
            </View>
          ))}
          {search.length > 0 && !searching && results.length === 0 && (
            <Text style={styles.noResults}>No students found.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={styles.accountRow} onPress={() => router.push('/change-password')}>
            <MaterialCommunityIcons name="lock-reset" size={20} color={Colors.textSecondary} />
            <Text style={styles.accountRowText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.dark },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 20, paddingBottom: 40 },

  activeTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
  },
  activeTripDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  activeTripTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  activeTripSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 14, color: Colors.dark, paddingVertical: 11 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.dark },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark, paddingVertical: 12 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 15, fontWeight: '700', color: Colors.primaryDark },
  studentName: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  studentMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  noResults: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 12 },

  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountRowText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.dark },
});
