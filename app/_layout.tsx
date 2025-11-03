import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="Auth" />
      <Stack.Screen name="ResetPassword" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
