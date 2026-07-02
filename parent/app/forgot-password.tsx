import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email);
      Alert.alert(
        'Check Your Email',
        'If that email is registered, a reset link is on its way. Have your reset token ready.',
        [{ text: 'Enter Reset Token', onPress: () => router.replace('/reset-password') }],
      );
    } catch (e) {
      Alert.alert('Something Went Wrong', e instanceof ApiError ? e.message : 'Please try again.');
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
        <Text style={styles.heading}>Forgot password?</Text>
        <Text style={styles.subheading}>
          Enter your account email. If it matches a parent account, you'll receive reset instructions.
        </Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="email-outline" size={18} color={Colors.textLight} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.dark} /> : <Text style={styles.submitText}>Send Reset Link</Text>}
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/reset-password')}>
          <Text style={styles.linkText}>Already have a reset token?</Text>
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
  field: { gap: 6, marginBottom: 20 },
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
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
