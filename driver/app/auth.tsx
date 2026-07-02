import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth, type Role } from '../lib/auth';
import { ApiError } from '../lib/api';

type Tab = 'login' | 'signup';

const ROLE_OPTIONS: {
  label: string;
  value: Role;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { label: 'School Driver', value: 'school_driver', icon: 'bus-school' },
  { label: 'Private Driver', value: 'private_driver', icon: 'car' },
];

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  rightIcon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onRightPress?: () => void;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
};

function Field({
  label,
  icon,
  rightIcon,
  onRightPress,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={Colors.textLight} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
        />
        {rightIcon && (
          <Pressable style={styles.inputRight} onPress={onRightPress} hitSlop={8}>
            <MaterialCommunityIcons name={rightIcon} size={18} color={Colors.textLight} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState<Role>('school_driver');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const navigateForRole = (role: Role) => {
    router.replace(role === 'private_driver' ? '/private/kyc' : '/school/pending');
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Missing Fields', 'Please fill in your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(loginEmail, loginPassword);
      navigateForRole(user.role);
    } catch (e) {
      Alert.alert('Sign In Failed', e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!signupUsername || !signupEmail || !signupPassword || !signupConfirm) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (signupUsername.length < 3) {
      Alert.alert('Username Too Short', 'Username must be at least 3 characters.');
      return;
    }
    if (signupPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await signup(signupUsername, signupEmail, signupPassword, signupRole);
      navigateForRole(user.role);
    } catch (e) {
      Alert.alert('Sign Up Failed', e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={keyboardVisible}
        >
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="steering" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.brandName}>HakikaRide Driver</Text>
          </View>

          <Text style={styles.heading}>{activeTab === 'login' ? 'Welcome back' : 'Create account'}</Text>
          <Text style={styles.subheading}>
            {activeTab === 'login' ? 'Sign in to start your trip' : 'Sign up as a school or private driver'}
          </Text>

          <View style={styles.tabRow}>
            {(['login', 'signup'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t === 'login' ? 'Login' : 'Sign Up'}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === 'login' && (
            <View style={styles.form}>
              <Field
                label="Email"
                icon="email-outline"
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <Field
                label="Password"
                icon="lock-outline"
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="••••••••"
                secureTextEntry={!showLoginPass}
                rightIcon={showLoginPass ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowLoginPass((v) => !v)}
              />
              <Pressable style={styles.forgotLink} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={handleLogin} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={Colors.dark} />
                ) : (
                  <Text style={styles.submitText}>Sign In</Text>
                )}
              </Pressable>
            </View>
          )}

          {activeTab === 'signup' && (
            <View style={styles.form}>
              <View style={styles.roleWrap}>
                <Text style={styles.roleTitle}>I drive for</Text>
                <View style={styles.roleRow}>
                  {ROLE_OPTIONS.map((opt) => {
                    const active = signupRole === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.roleChip, active && styles.roleChipActive]}
                        onPress={() => setSignupRole(opt.value)}
                      >
                        <MaterialCommunityIcons
                          name={opt.icon}
                          size={16}
                          color={active ? Colors.dark : Colors.textSecondary}
                        />
                        <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {signupRole === 'school_driver' && (
                  <Text style={styles.roleHint}>
                    A school admin must link your account before you can start trips.
                  </Text>
                )}
                {signupRole === 'private_driver' && (
                  <Text style={styles.roleHint}>You'll complete a short KYC form after signing up.</Text>
                )}
              </View>

              <Field
                label="Username"
                icon="account-outline"
                value={signupUsername}
                onChangeText={setSignupUsername}
                placeholder="jane_driver"
              />
              <Field
                label="Email"
                icon="email-outline"
                value={signupEmail}
                onChangeText={setSignupEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <Field
                label="Password"
                icon="lock-outline"
                value={signupPassword}
                onChangeText={setSignupPassword}
                placeholder="At least 8 characters"
                secureTextEntry={!showSignupPass}
                rightIcon={showSignupPass ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowSignupPass((v) => !v)}
              />
              <Field
                label="Confirm Password"
                icon="lock-check-outline"
                value={signupConfirm}
                onChangeText={setSignupConfirm}
                placeholder="••••••••"
                secureTextEntry={!showConfirmPass}
                rightIcon={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowConfirmPass((v) => !v)}
              />
              <Pressable style={styles.submitBtn} onPress={handleSignup} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={Colors.dark} />
                ) : (
                  <Text style={styles.submitText}>Create Account</Text>
                )}
              </Pressable>
            </View>
          )}

          <Text style={styles.terms}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 17, fontWeight: '800', color: Colors.dark },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.dark, marginBottom: 6 },
  subheading: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 28 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  tabBtnActive: { backgroundColor: Colors.dark },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  roleWrap: { marginBottom: 6 },
  roleTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  roleChipTextActive: { color: Colors.dark },
  roleHint: { fontSize: 12, color: Colors.textLight, marginTop: 8, lineHeight: 17 },
  form: { gap: 14 },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.dark, paddingVertical: 13 },
  inputRight: { padding: 4, marginLeft: 6 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  terms: { marginTop: 24, fontSize: 12, color: Colors.textLight, textAlign: 'center', lineHeight: 18 },
});
