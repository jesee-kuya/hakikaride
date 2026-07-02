import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';

type Student = { id: string; first_name?: string; last_name?: string; name?: string; grade?: string; [key: string]: unknown };
type GuardianProfile = { id: string; first_name: string; last_name: string; phone: string };
type Tab = 'students' | 'profile';

function studentLabel(s: Student) {
  if (s.name) return s.name;
  const full = [s.first_name, s.last_name].filter(Boolean).join(' ');
  return full || s.id;
}

export default function GuardianDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('students');

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [profile, setProfile] = useState<GuardianProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const data = await api.get<Student[]>('/guardian/students');
      setStudents(data ?? []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get<GuardianProfile>('/guardian/profile');
      setProfile(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setPhone(data.phone);
    } catch {
      // handled by onboarding flow already
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
      loadProfile();
    }, [loadStudents, loadProfile]),
  );

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await api.put<GuardianProfile>('/guardian/profile', {
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
          <Text style={styles.headerSub}>Guardian</Text>
          <Text style={styles.headerTitle}>{user?.username ?? 'Guardian'}</Text>
        </View>
        <Pressable style={styles.avatar} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.dark} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'students' && (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Your Children</Text>
            {loadingStudents ? (
              <ActivityIndicator color={Colors.textLight} style={{ marginTop: 20 }} />
            ) : students.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="account-child-outline" size={36} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>No students linked yet</Text>
                <Text style={styles.emptyText}>
                  Share your profile ID with your school so an admin can link you to your child.
                </Text>
                <View style={styles.idCard}>
                  <Text style={styles.idLabel}>Your Profile ID</Text>
                  <Text style={styles.idValue} numberOfLines={1}>{profile?.id ?? '—'}</Text>
                </View>
              </View>
            ) : (
              students.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.studentCard}
                  onPress={() => router.push({ pathname: '/guardian/students/[id]', params: { id: s.id } })}
                >
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>{studentLabel(s)[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{studentLabel(s)}</Text>
                    {s.grade ? <Text style={styles.studentMeta}>{s.grade}</Text> : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textLight} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={{ gap: 16 }}>
            <Text style={styles.sectionTitle}>My Profile</Text>
            <View style={styles.card}>
              <Field label="First Name" icon="account-outline" value={firstName} onChangeText={setFirstName} />
              <Field label="Last Name" icon="account-outline" value={lastName} onChangeText={setLastName} />
              <Field label="Phone" icon="phone-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Pressable style={styles.saveBtn} onPress={saveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </Pressable>
            </View>

            <Pressable style={styles.accountRow} onPress={() => router.push('/change-password')}>
              <MaterialCommunityIcons name="lock-reset" size={20} color={Colors.textSecondary} />
              <Text style={styles.accountRowText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {([
          { key: 'students', icon: 'account-child-outline', activeIcon: 'account-child', label: 'Children' },
          { key: 'profile', icon: 'cog-outline', activeIcon: 'cog', label: 'Profile' },
        ] as const).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
              <MaterialCommunityIcons
                name={active ? tab.activeIcon : tab.icon}
                size={24}
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

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
};

function Field({ label, icon, value, onChangeText, keyboardType }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons name={icon} size={16} color={Colors.textLight} style={{ marginRight: 10 }} />
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
  scroll: { padding: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.dark },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginTop: 4 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  idCard: {
    marginTop: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  idLabel: { fontSize: 11, fontWeight: '600', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  idValue: { fontSize: 13, fontWeight: '700', color: Colors.dark },

  studentCard: {
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

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
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
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.dark },

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

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'stretch', justifyContent: 'center', paddingVertical: 6, gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: Colors.textLight, textAlign: 'center' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
