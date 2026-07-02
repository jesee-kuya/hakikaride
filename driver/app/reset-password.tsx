import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token || !newPassword || !confirmPassword) {
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
      await resetPassword(token, newPassword);
      Alert.alert('Password Reset', 'You can now sign in with your new password.', [
        { text: 'Sign In', onPress: () => router.replace('/auth') },
      ]);
    } catch (e) {
      Alert.alert('Reset Failed', e instanceof ApiError ? e.message : 'Please try again.');
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
      </View>
      <View style={styles.content}>
        <Text style={styles.heading}>Reset password</Text>
        <Text style={styles.subheading}>
          Enter the reset token you were given, along with your new password.
        </Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Reset Token</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="key-outline" size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="Paste your reset token"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>New Password</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
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
          <Text style={styles.fieldLabel}>Confirm Password</Text>
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
          {submitting ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.submitText}>Reset Password</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: { padding: 24, paddingTop: 8 },
  heading: { fontSize: 26, fontWeight: '800', color: Colors.dark, marginBottom: 8 },
  subheading: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 28 },
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
