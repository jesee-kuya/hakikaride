import { Stack } from 'expo-router';

export default function PrivateParentLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
