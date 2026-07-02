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
  Switch,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { api, ApiError } from '../../lib/api';
import { getActiveTrip, clearActiveTrip, setActiveTrip, type ActiveTrip } from '../../lib/tripStorage';
import { useLocationSharing } from '../../lib/useLocationSharing';

type Student = { id: string; name?: string; grade?: string; [key: string]: unknown };

export default function SchoolTripScreen() {
  const router = useRouter();
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[]>([]);
  const [boardingId, setBoardingId] = useState<string | null>(null);

  const [boardedList, setBoardedList] = useState<Student[]>([]);
  const [loadingBoarded, setLoadingBoarded] = useState(false);

  const [statusText, setStatusText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [ending, setEnding] = useState(false);

  const loadBoarded = useCallback(async (tripId: string) => {
    setLoadingBoarded(true);
    try {
      const data = await api.get<Student[]>(`/school-driver/trips/${tripId}/students`);
      setBoardedList(data ?? []);
    } catch {
      // ignore — boarded list is best-effort
    } finally {
      setLoadingBoarded(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getActiveTrip().then((t) => {
        if (cancelled) return;
        const schoolTrip = t && t.kind === 'school' ? t : null;
        setTrip(schoolTrip);
        setLoadingTrip(false);
        if (schoolTrip) loadBoarded(schoolTrip.id);
      });
      return () => {
        cancelled = true;
      };
    }, [loadBoarded]),
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

  const locationSharing = useLocationSharing(
    useCallback(
      async (latitude: number, longitude: number) => {
        if (!trip) return;
        await api.post(`/school-driver/trips/${trip.id}/location`, { latitude, longitude });
      },
      [trip],
    ),
  );

  const boardStudent = async (student: Student) => {
    if (!trip) return;
    setBoardingId(student.id);
    try {
      await api.post(`/school-driver/trips/${trip.id}/students`, { student_id: student.id });
      await loadBoarded(trip.id);
      setSearch('');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Already Boarded', `${student.name ?? student.id} has already been checked in.`);
      } else {
        Alert.alert('Could Not Board Student', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setBoardingId(null);
    }
  };

  const updateStatus = async () => {
    if (!trip) return;
    if (!statusText) {
      Alert.alert('Missing Status', 'Enter a status to set.');
      return;
    }
    setUpdatingStatus(true);
    try {
      const updated = await api.patch<{ status: string }>(`/school-driver/trips/${trip.id}/status`, {
        status: statusText,
      });
      const next = { ...trip, status: updated.status };
      setTrip(next);
      await setActiveTrip(next);
      setStatusText('');
    } catch (e) {
      Alert.alert('Update Failed', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const endTrip = async () => {
    if (!trip) return;
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip',
        style: 'destructive',
        onPress: async () => {
          setEnding(true);
          try {
            await api.patch(`/school-driver/trips/${trip.id}/end`);
            locationSharing.stop();
            await clearActiveTrip();
            router.replace('/school/dashboard');
          } catch (e) {
            Alert.alert('Could Not End Trip', e instanceof ApiError ? e.message : 'Please try again.');
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
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
        <MaterialCommunityIcons name="bus-alert" size={40} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No active trip</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.replace('/school/dashboard')}>
          <Text style={styles.emptyBtnText}>Back to Dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const boardedIds = new Set(boardedList.map((s) => s.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/school/dashboard')} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{trip.label}</Text>
          <Text style={styles.headerSub}>Status: {trip.status}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Boarded Students</Text>
            <Text style={styles.countBadge}>{boardedList.length}</Text>
          </View>
          {loadingBoarded && boardedList.length === 0 ? (
            <ActivityIndicator color={Colors.textLight} style={{ marginVertical: 8 }} />
          ) : boardedList.length === 0 ? (
            <Text style={styles.noResults}>No students boarded yet.</Text>
          ) : (
            <View style={styles.boardedList}>
              {boardedList.map((s) => (
                <View key={s.id} style={styles.boardedRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.boardedText}>{s.name ?? s.id}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Board a Student</Text>
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
          {results.map((stu) => {
            const already = boardedIds.has(stu.id);
            return (
              <Pressable
                key={stu.id}
                style={[styles.studentRow, already && styles.studentRowDisabled]}
                onPress={() => !already && boardStudent(stu)}
                disabled={already || boardingId !== null}
              >
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>{(stu.name ?? '?')[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{stu.name ?? stu.id}</Text>
                  {stu.grade ? <Text style={styles.studentMeta}>{stu.grade}</Text> : null}
                </View>
                {boardingId === stu.id ? (
                  <ActivityIndicator size="small" color={Colors.textLight} />
                ) : already ? (
                  <Text style={styles.boardedTag}>Boarded</Text>
                ) : (
                  <MaterialCommunityIcons name="plus-circle-outline" size={22} color={Colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Trip Status</Text>
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="progress-clock" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={statusText}
                onChangeText={setStatusText}
                placeholder="e.g. en_route"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
            </View>
            <Pressable style={styles.primaryBtn} onPress={updateStatus} disabled={updatingStatus}>
              {updatingStatus ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.primaryBtnText}>Update</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Sharing</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Share live location</Text>
                <Text style={styles.switchHint}>Sends your position every 20 seconds while on.</Text>
              </View>
              <Switch
                value={locationSharing.sharing}
                onValueChange={(v) => (v ? locationSharing.start() : locationSharing.stop())}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
            {locationSharing.lastPoint && (
              <View style={styles.locationResult}>
                <MaterialCommunityIcons name="map-marker-check" size={16} color={Colors.success} />
                <Text style={styles.locationText}>
                  {locationSharing.lastPoint.latitude.toFixed(5)}, {locationSharing.lastPoint.longitude.toFixed(5)}
                </Text>
              </View>
            )}
            {locationSharing.error && (
              <View style={styles.locationResult}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={[styles.locationText, { color: Colors.error }]}>{locationSharing.error}</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable style={styles.endBtn} onPress={endTrip} disabled={ending}>
          {ending ? (
            <ActivityIndicator color={Colors.error} />
          ) : (
            <>
              <MaterialCommunityIcons name="flag-checkered" size={18} color={Colors.error} />
              <Text style={styles.endBtnText}>End Trip</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
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

  scroll: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  boardedList: { gap: 6 },
  boardedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  boardedText: { fontSize: 13, color: Colors.dark, fontWeight: '600' },
  noResults: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 12 },

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
  studentRowDisabled: { opacity: 0.6 },
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
  boardedTag: { fontSize: 11, fontWeight: '700', color: Colors.success },

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
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  switchHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  locationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  locationText: { fontSize: 13, color: Colors.dark, flex: 1 },

  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    paddingVertical: 16,
  },
  endBtnText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
