import { Stack } from 'expo-router';

export default function DeliveryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen name="location" />
      <Stack.Screen name="navigation" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}