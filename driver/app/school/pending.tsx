import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Colors from '../../constants/Colors';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import { setSchoolLinked } from '../../lib/onboarding';

export default function SchoolPendingScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!user) return;
    await Clipboard.setStringAsync(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      // No GET endpoint exists to check link status directly, so we probe a
      // real school-driver route: it 404s until a school admin has linked us.
      await api.get(`/school-driver/students/search?q=${encodeURIComponent('a')}`);
      if (user) await setSchoolLinked(user.id);
      router.replace('/school/dashboard');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        Alert.alert('Not Linked Yet', 'Your school admin hasn\'t linked your account yet. Please try again later.');
      } else {
        Alert.alert('Could Not Check Status', e instanceof ApiError ? e.message : 'Please try again.');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="clock-outline" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.heading}>Waiting to be linked</Text>
        <Text style={styles.subheading}>
          A school admin needs to link your account before you can start trips. Share the ID below with your
          school so they can add you.
        </Text>

        <Pressable style={styles.idCard} onPress={copyId}>
          <View style={{ flex: 1 }}>
            <Text style={styles.idLabel}>Your Driver ID</Text>
            <Text style={styles.idValue} numberOfLines={1}>{user?.id}</Text>
          </View>
          <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={20} color={copied ? Colors.success : Colors.textSecondary} />
        </Pressable>

        <Pressable style={styles.checkBtn} onPress={checkStatus} disabled={checking}>
          {checking ? (
            <ActivityIndicator color={Colors.dark} />
          ) : (
            <>
              <MaterialCommunityIcons name="refresh" size={18} color={Colors.dark} />
              <Text style={styles.checkBtnText}>I've Been Linked — Check Status</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.signOutBtn} onPress={() => logout().then(() => router.replace('/'))}>
          <MaterialCommunityIcons name="logout" size={16} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.dark, marginBottom: 8 },
  subheading: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  idLabel: { fontSize: 11, fontWeight: '600', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  idValue: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  checkBtnText: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  signOutText: { fontSize: 13, fontWeight: '700', color: Colors.error },
});
