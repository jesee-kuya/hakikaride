import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';

type PrivateParentProfile = { id: string; first_name: string; last_name: string; phone: string };

export default function ParentOnboardingScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [checking, setChecking] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await api.get<PrivateParentProfile>('/parent/profile');
        router.replace('/parent/dashboard');
      } catch {
        setChecking(false);
      }
    })();
  }, [router]);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/parent/kyc', { first_name: firstName, last_name: lastName, phone });
      router.replace('/parent/dashboard');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        router.replace('/parent/dashboard');
      } else {
        Alert.alert('Submission Failed', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="account-child-outline" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.heading}>Create your parent profile</Text>
        <Text style={styles.subheading}>
          After this, you can add your children, connect a school, and match with a private driver.
        </Text>

        <View style={styles.form}>
          <Field label="First Name" icon="account-outline" value={firstName} onChangeText={setFirstName} placeholder="Jane" />
          <Field label="Last Name" icon="account-outline" value={lastName} onChangeText={setLastName} placeholder="Doe" />
          <Field
            label="Phone Number"
            icon="phone-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="+254 7XX XXX XXX"
            keyboardType="phone-pad"
          />
        </View>

        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.submitText}>Create Profile</Text>}
        </Pressable>

        <Pressable style={styles.signOutBtn} onPress={() => logout().then(() => router.replace('/'))}>
          <MaterialCommunityIcons name="logout" size={16} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
};

function Field({ label, icon, value, onChangeText, placeholder, keyboardType }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 40 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.dark, marginBottom: 8 },
  subheading: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  form: { gap: 14, marginBottom: 20 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, color: Colors.dark, paddingVertical: 13 },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    paddingVertical: 14,
  },
  signOutText: { fontSize: 13, fontWeight: '700', color: Colors.error },
});
