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

type Tab = 'home' | 'children' | 'connect' | 'trips' | 'profile';

type PrivateParentProfile = { id: string; first_name: string; last_name: string; phone: string };
type Child = { id: string; first_name: string; last_name: string; grade: string };
type School = { id: string; name?: string; address?: string; [key: string]: unknown };
type PrivateTrip = { id: string; status: string; started_at: string; [key: string]: unknown };

const BOTTOM_TABS: {
  key: Tab;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  activeIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}[] = [
  { key: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { key: 'children', icon: 'account-child-outline', activeIcon: 'account-child', label: 'Children' },
  { key: 'connect', icon: 'compass-outline', activeIcon: 'compass', label: 'Connect' },
  { key: 'trips', icon: 'map-marker-path', activeIcon: 'map-marker-path', label: 'Trips' },
  { key: 'profile', icon: 'cog-outline', activeIcon: 'cog', label: 'Profile' },
];

export default function ParentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Profile
  const [profile, setProfile] = useState<PrivateParentProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Children
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [savingChild, setSavingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editGrade, setEditGrade] = useState('');

  // Schools
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [connectingSchoolId, setConnectingSchoolId] = useState<string | null>(null);

  // Driver match
  const [driverId, setDriverId] = useState('');
  const [matching, setMatching] = useState(false);

  // Trips
  const [trips, setTrips] = useState<PrivateTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get<PrivateParentProfile>('/parent/profile');
      setProfile(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setPhone(data.phone);
    } catch {
      // handled by onboarding flow
    }
  }, []);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      setChildren((await api.get<Child[]>('/parent/children')) ?? []);
    } catch {
      setChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  const loadSchools = useCallback(async (query?: string) => {
    setLoadingSchools(true);
    try {
      const path = query ? `/parent/schools/search?q=${encodeURIComponent(query)}` : '/parent/schools';
      setSchools((await api.get<School[]>(path)) ?? []);
    } catch {
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      setTrips((await api.get<PrivateTrip[]>('/parent/trips')) ?? []);
    } catch {
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadChildren();
      loadSchools();
      loadTrips();
    }, [loadProfile, loadChildren, loadSchools, loadTrips]),
  );

  useEffect(() => {
    const handle = setTimeout(() => loadSchools(schoolQuery || undefined), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolQuery]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await api.put<PrivateParentProfile>('/parent/profile', {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      setProfile(updated);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e) {
      Alert.alert('Save Failed', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your parent account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await api.delete('/parent/account');
              await logout();
              router.replace('/');
            } catch (e) {
              Alert.alert('Could Not Delete Account', e instanceof ApiError ? e.message : 'Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  const addChild = async () => {
    if (!childFirstName || !childLastName || !childGrade) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setSavingChild(true);
    try {
      const child = await api.post<Child>('/parent/children', {
        first_name: childFirstName,
        last_name: childLastName,
        grade: childGrade,
      });
      setChildren((prev) => [child, ...prev]);
      setChildFirstName('');
      setChildLastName('');
      setChildGrade('');
      setShowAddChild(false);
    } catch (e) {
      Alert.alert('Could Not Add Child', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setSavingChild(false);
    }
  };

  const startEditChild = (child: Child) => {
    setEditingChildId(child.id);
    setEditFirstName(child.first_name);
    setEditLastName(child.last_name);
    setEditGrade(child.grade);
  };

  const saveChildEdit = async (id: string) => {
    try {
      const updated = await api.put<Child>(`/parent/children/${id}`, {
        first_name: editFirstName,
        last_name: editLastName,
        grade: editGrade,
      });
      setChildren((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingChildId(null);
    } catch (e) {
      Alert.alert('Could Not Update Child', e instanceof ApiError ? e.message : 'Please try again.');
    }
  };

  const connectSchool = async (school: School) => {
    setConnectingSchoolId(school.id);
    try {
      await api.post('/parent/schools/connect', { school_id: school.id });
      Alert.alert('Connected', `Connected to ${school.name ?? school.id}.`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Already Connected', 'You are already connected to this school.');
      } else {
        Alert.alert('Could Not Connect', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setConnectingSchoolId(null);
    }
  };

  const matchDriver = async () => {
    if (!driverId) {
      Alert.alert('Missing Driver ID', 'Enter the private driver\'s profile ID.');
      return;
    }
    setMatching(true);
    try {
      await api.post('/parent/drivers/match', { driver_id: driverId });
      Alert.alert('Match Requested', 'The driver needs to accept before you can start a trip.');
      setDriverId('');
    } catch (e) {
      Alert.alert('Could Not Request Match', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setMatching(false);
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
          <Text style={styles.headerSub}>Private Parent</Text>
          <Text style={styles.headerTitle}>{user?.username ?? 'Parent'}</Text>
        </View>
        <Pressable style={styles.avatar} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.dark} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            <View style={styles.statsRow}>
              {[
                { icon: 'account-child' as const, label: 'Children', value: children.length, color: '#8B5CF6', bg: '#F5F3FF' },
                { icon: 'map-marker-path' as const, label: 'Trips', value: trips.length, color: '#3B82F6', bg: '#EFF6FF' },
              ].map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                    <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeading}>Quick Actions</Text>
            {[
              { icon: 'account-child-outline' as const, title: 'Add a Child', sub: 'Register a child for a private driver', tab: 'children' as Tab },
              { icon: 'compass-outline' as const, title: 'Connect a School', sub: 'Browse schools and request a connection', tab: 'connect' as Tab },
              { icon: 'map-marker-path' as const, title: 'View Trips', sub: 'Track a live trip or browse past ones', tab: 'trips' as Tab },
            ].map((action) => (
              <Pressable key={action.title} style={styles.actionBtn} onPress={() => setActiveTab(action.tab)}>
                <View style={styles.actionBtnIcon}>
                  <MaterialCommunityIcons name={action.icon} size={22} color={Colors.dark} />
                </View>
                <View style={styles.actionBtnBody}>
                  <Text style={styles.actionBtnTitle}>{action.title}</Text>
                  <Text style={styles.actionBtnSub}>{action.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark} />
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'children' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeading}>Your Children</Text>
              <Pressable style={styles.smallAddBtn} onPress={() => setShowAddChild((v) => !v)}>
                <MaterialCommunityIcons name={showAddChild ? 'close' : 'plus'} size={16} color={Colors.dark} />
                <Text style={styles.smallAddBtnText}>{showAddChild ? 'Cancel' : 'Add Child'}</Text>
              </Pressable>
            </View>

            {showAddChild && (
              <View style={styles.card}>
                <TextField label="First Name" value={childFirstName} onChangeText={setChildFirstName} />
                <TextField label="Last Name" value={childLastName} onChangeText={setChildLastName} />
                <TextField label="Grade" value={childGrade} onChangeText={setChildGrade} />
                <Pressable style={styles.primaryBtn} onPress={addChild} disabled={savingChild}>
                  {savingChild ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.primaryBtnText}>Save Child</Text>}
                </Pressable>
              </View>
            )}

            {loadingChildren ? (
              <ActivityIndicator color={Colors.textLight} style={{ marginTop: 12 }} />
            ) : children.length === 0 ? (
              <Text style={styles.noResults}>No children added yet.</Text>
            ) : (
              children.map((child) =>
                editingChildId === child.id ? (
                  <View key={child.id} style={styles.card}>
                    <TextField label="First Name" value={editFirstName} onChangeText={setEditFirstName} />
                    <TextField label="Last Name" value={editLastName} onChangeText={setEditLastName} />
                    <TextField label="Grade" value={editGrade} onChangeText={setEditGrade} />
                    <View style={styles.rowBtns}>
                      <Pressable style={[styles.smallBtn, styles.cancelBtn]} onPress={() => setEditingChildId(null)}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </Pressable>
                      <Pressable style={[styles.smallBtn, styles.saveSmallBtn]} onPress={() => saveChildEdit(child.id)}>
                        <Text style={styles.saveSmallBtnText}>Save</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View key={child.id} style={styles.childRow}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{child.first_name?.[0] ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{child.first_name} {child.last_name}</Text>
                      <Text style={styles.studentMeta}>{child.grade}</Text>
                    </View>
                    <Pressable onPress={() => startEditChild(child)} hitSlop={8}>
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.textSecondary} />
                    </Pressable>
                  </View>
                ),
              )
            )}
          </View>
        )}

        {activeTab === 'connect' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Match with a Driver</Text>
            <Text style={styles.sectionHint}>
              Enter a private driver's profile ID to request a match. They must accept before you can start a trip.
            </Text>
            <View style={styles.card}>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="identifier" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  value={driverId}
                  onChangeText={setDriverId}
                  placeholder="Driver profile ID"
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="none"
                />
              </View>
              <Pressable style={styles.primaryBtn} onPress={matchDriver} disabled={matching}>
                {matching ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.primaryBtnText}>Request Match</Text>}
              </Pressable>
            </View>

            <Text style={styles.sectionHeading}>Browse Schools</Text>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={18} color={Colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search schools..."
                placeholderTextColor={Colors.textLight}
                value={schoolQuery}
                onChangeText={setSchoolQuery}
              />
              {schoolQuery.length > 0 && (
                <Pressable onPress={() => setSchoolQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={Colors.textLight} />
                </Pressable>
              )}
            </View>
            {loadingSchools ? (
              <ActivityIndicator color={Colors.textLight} style={{ marginTop: 12 }} />
            ) : schools.length === 0 ? (
              <Text style={styles.noResults}>No schools found.</Text>
            ) : (
              schools.map((school) => (
                <View key={school.id} style={styles.schoolRow}>
                  <View style={styles.schoolIcon}>
                    <MaterialCommunityIcons name="school-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{school.name ?? school.id}</Text>
                    {school.address ? <Text style={styles.studentMeta}>{school.address}</Text> : null}
                  </View>
                  <Pressable
                    style={styles.connectBtn}
                    onPress={() => connectSchool(school)}
                    disabled={connectingSchoolId === school.id}
                  >
                    {connectingSchoolId === school.id ? (
                      <ActivityIndicator size="small" color={Colors.dark} />
                    ) : (
                      <Text style={styles.connectBtnText}>Connect</Text>
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'trips' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Your Trips</Text>
            {loadingTrips ? (
              <ActivityIndicator color={Colors.textLight} style={{ marginTop: 12 }} />
            ) : trips.length === 0 ? (
              <Text style={styles.noResults}>No trips yet.</Text>
            ) : (
              trips.map((trip) => (
                <Pressable
                  key={trip.id}
                  style={styles.tripRow}
                  onPress={() => router.push({ pathname: '/parent/trips/[id]', params: { id: trip.id } })}
                >
                  <View style={styles.tripIcon}>
                    <MaterialCommunityIcons name="car-side" size={18} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{trip.status}</Text>
                    <Text style={styles.studentMeta}>{new Date(trip.started_at).toLocaleString()}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>My Profile</Text>
            <View style={styles.card}>
              <TextField label="First Name" value={firstName} onChangeText={setFirstName} />
              <TextField label="Last Name" value={lastName} onChangeText={setLastName} />
              <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Pressable style={styles.primaryBtn} onPress={saveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.primaryBtnText}>Save Changes</Text>}
              </Pressable>
            </View>

            <Pressable style={styles.accountRow} onPress={() => router.push('/change-password')}>
              <MaterialCommunityIcons name="lock-reset" size={20} color={Colors.textSecondary} />
              <Text style={styles.accountRowText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </Pressable>

            <Pressable style={styles.deleteBtn} onPress={deleteAccount} disabled={deletingAccount}>
              {deletingAccount ? (
                <ActivityIndicator color={Colors.error} />
              ) : (
                <>
                  <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
                  <Text style={styles.deleteBtnText}>Delete Account</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {BOTTOM_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
              <MaterialCommunityIcons
                name={active ? tab.activeIcon : tab.icon}
                size={22}
                color={active ? Colors.primary : Colors.textLight}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
};

function TextField({ label, value, onChangeText, keyboardType }: TextFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
      </View>
    </View>
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

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  tabContent: { gap: 12 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.dark },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  sectionHeading: { fontSize: 16, fontWeight: '700', color: Colors.dark, marginTop: 4 },
  sectionHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginTop: -6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  actionBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnBody: { flex: 1 },
  actionBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  actionBtnSub: { fontSize: 12, color: Colors.dark, opacity: 0.6, marginTop: 2 },

  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallAddBtnText: { fontSize: 12, fontWeight: '700', color: Colors.dark },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark },
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

  rowBtns: { flexDirection: 'row', gap: 10 },
  smallBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.background },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  saveSmallBtn: { backgroundColor: Colors.primary },
  saveSmallBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

  noResults: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 12 },

  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  studentName: { fontSize: 15, fontWeight: '600', color: Colors.dark },
  studentMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

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

  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  schoolIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  connectBtnText: { fontSize: 12, fontWeight: '700', color: Colors.dark },

  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

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

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: Colors.error },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'stretch', justifyContent: 'center', paddingVertical: 6, gap: 3 },
  tabLabel: { fontSize: 9, fontWeight: '500', color: Colors.textLight, textAlign: 'center' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
