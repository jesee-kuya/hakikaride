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

type Match = { id: string; status: string; [key: string]: unknown };
type PrivateTrip = { id: string; status: string; started_at: string; [key: string]: unknown };

export default function PrivateDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [matchId, setMatchId] = useState('');
  const [matchBusy, setMatchBusy] = useState<'accepted' | 'rejected' | null>(null);

  const [tripMatchId, setTripMatchId] = useState('');
  const [startingTrip, setStartingTrip] = useState(false);

  const [activeTrip, setActiveTripState] = useState<ActiveTrip | null>(null);

  useFocusEffect(
    useCallback(() => {
      getActiveTrip().then((t) => {
        if (t && t.kind === 'private') setActiveTripState(t);
      });
    }, []),
  );

  const respondToMatch = async (status: 'accepted' | 'rejected') => {
    if (!matchId) {
      Alert.alert('Missing Match ID', 'Enter the match ID you received.');
      return;
    }
    setMatchBusy(status);
    try {
      const match = await api.patch<Match>(`/private-driver/matches/${matchId}`, { status });
      Alert.alert('Match Updated', `Match is now ${match.status}.`);
      setMatchId('');
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        Alert.alert('Match Not Pending', 'This match is no longer waiting for a response.');
      } else {
        Alert.alert('Update Failed', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setMatchBusy(null);
    }
  };

  const startTrip = async () => {
    if (!tripMatchId) {
      Alert.alert('Missing Match ID', 'Enter the accepted match ID to start a trip.');
      return;
    }
    setStartingTrip(true);
    try {
      const trip = await api.post<PrivateTrip>('/private-driver/trips', { match_id: tripMatchId });
      const next: ActiveTrip = {
        id: trip.id,
        status: trip.status,
        startedAt: trip.started_at,
        kind: 'private',
        label: `Match ${tripMatchId.slice(0, 8)}`,
      };
      await setActiveTrip(next);
      setActiveTripState(next);
      setTripMatchId('');
      router.push('/private/trip');
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
          <Text style={styles.headerSub}>Private Driver</Text>
          <Text style={styles.headerTitle}>{user?.username ?? 'Driver'}</Text>
        </View>
        <Pressable style={styles.avatar} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.dark} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {activeTrip && (
          <Pressable style={styles.activeTripCard} onPress={() => router.push('/private/trip')}>
            <View style={styles.activeTripDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTripTitle}>Trip in progress</Text>
              <Text style={styles.activeTripSub}>{activeTrip.label} · tap to resume</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.white} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respond to a Match</Text>
          <Text style={styles.sectionHint}>
            You'll receive a match ID via notification or support once a parent selects you.
          </Text>
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="identifier" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={matchId}
                onChangeText={setMatchId}
                placeholder="Match ID"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.rowBtns}>
              <Pressable
                style={[styles.smallBtn, styles.rejectBtn]}
                onPress={() => respondToMatch('rejected')}
                disabled={matchBusy !== null}
              >
                {matchBusy === 'rejected' ? (
                  <ActivityIndicator color={Colors.error} size="small" />
                ) : (
                  <Text style={styles.rejectBtnText}>Reject</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.smallBtn, styles.acceptBtn]}
                onPress={() => respondToMatch('accepted')}
                disabled={matchBusy !== null}
              >
                {matchBusy === 'accepted' ? (
                  <ActivityIndicator color={Colors.dark} size="small" />
                ) : (
                  <Text style={styles.acceptBtnText}>Accept</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start a Trip</Text>
          <Text style={styles.sectionHint}>Enter the ID of a match you've already accepted.</Text>
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="identifier" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={tripMatchId}
                onChangeText={setTripMatchId}
                placeholder="Accepted match ID"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
            </View>
            <Pressable style={styles.startBtn} onPress={startTrip} disabled={startingTrip}>
              {startingTrip ? (
                <ActivityIndicator color={Colors.dark} />
              ) : (
                <>
                  <MaterialCommunityIcons name="car-side" size={18} color={Colors.dark} />
                  <Text style={styles.startBtnText}>Start Trip</Text>
                </>
              )}
            </Pressable>
          </View>
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
  sectionHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 4 },
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
  rowBtns: { flexDirection: 'row', gap: 10 },
  smallBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  acceptBtn: { backgroundColor: Colors.primary },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  rejectBtn: { backgroundColor: Colors.errorLight },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: Colors.error },
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
