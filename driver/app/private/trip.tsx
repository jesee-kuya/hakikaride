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

type Boarding = { child_id: string; boarded_at: string };

export default function PrivateTripScreen() {
  const router = useRouter();
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);

  const [childId, setChildId] = useState('');
  const [boarding, setBoarding] = useState(false);
  const [boardedList, setBoardedList] = useState<Boarding[]>([]);

  const [statusText, setStatusText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [ending, setEnding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getActiveTrip().then((t) => {
        if (!cancelled) {
          setTrip(t && t.kind === 'private' ? t : null);
          setLoadingTrip(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const locationSharing = useLocationSharing(
    useCallback(
      async (latitude: number, longitude: number) => {
        if (!trip) return;
        await api.post(`/private-driver/trips/${trip.id}/location`, { latitude, longitude });
      },
      [trip],
    ),
  );

  const boardStudent = async () => {
    if (!trip) return;
    if (!childId) {
      Alert.alert('Missing Child ID', 'Enter the child ID to board.');
      return;
    }
    setBoarding(true);
    try {
      const record = await api.post<Boarding>(`/private-driver/trips/${trip.id}/students`, { child_id: childId });
      setBoardedList((prev) => [record, ...prev]);
      setChildId('');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Already Boarded', 'This child has already been checked in on this trip.');
      } else {
        Alert.alert('Could Not Board Student', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setBoarding(false);
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
      const updated = await api.patch<{ status: string }>(`/private-driver/trips/${trip.id}/status`, {
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
            await api.patch(`/private-driver/trips/${trip.id}/end`);
            locationSharing.stop();
            await clearActiveTrip();
            router.replace('/private/dashboard');
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
        <MaterialCommunityIcons name="car-off" size={40} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No active trip</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.replace('/private/dashboard')}>
          <Text style={styles.emptyBtnText}>Back to Dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/private/dashboard')} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{trip.label}</Text>
          <Text style={styles.headerSub}>Status: {trip.status}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Board Student</Text>
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="account-outline" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={childId}
                onChangeText={setChildId}
                placeholder="Child ID"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
            </View>
            <Pressable style={styles.primaryBtn} onPress={boardStudent} disabled={boarding}>
              {boarding ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.primaryBtnText}>Check In</Text>}
            </Pressable>
          </View>

          {boardedList.length > 0 && (
            <View style={styles.boardedList}>
              {boardedList.map((b) => (
                <View key={b.child_id + b.boarded_at} style={styles.boardedRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.boardedText}>{b.child_id}</Text>
                </View>
              ))}
            </View>
          )}
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
                placeholder="e.g. picking_up"
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
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

  boardedList: { marginTop: 10, gap: 6 },
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
