import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Password Changed', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Change Failed', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Current Password</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>New Password</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-plus-outline" size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Confirm New Password</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-check-outline" size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.submitText}>Update Password</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  content: { padding: 24 },
  field: { gap: 6, marginBottom: 16 },
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
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
});
