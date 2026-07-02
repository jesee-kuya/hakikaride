import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import { setKycDone } from '../../lib/onboarding';

export default function PrivateKycScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goToDashboard = async () => {
    if (user) await setKycDone(user.id);
    router.replace('/private/dashboard');
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !phone || !licenseNumber) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/private-driver/kyc', {
        first_name: firstName,
        last_name: lastName,
        phone,
        license_number: licenseNumber,
      });
      await goToDashboard();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Already Submitted', 'Your driver profile is already on file.', [
          { text: 'Continue', onPress: goToDashboard },
        ]);
      } else {
        Alert.alert('Submission Failed', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="card-account-details-outline" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.heading}>Complete your driver profile</Text>
        <Text style={styles.subheading}>
          As a private driver you need to submit KYC details before you can be matched with a parent.
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
          <Field
            label="License Number"
            icon="card-text-outline"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="DL-XXXXXXX"
          />
        </View>

        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.submitText}>Submit KYC</Text>}
        </Pressable>

        <Pressable style={styles.linkBtn} onPress={goToDashboard}>
          <Text style={styles.linkText}>Already submitted your details? Continue</Text>
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
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
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
