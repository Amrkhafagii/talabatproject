import { Stack } from 'expo-router';

export default function RestaurantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="add-menu-item" />
      <Stack.Screen name="edit-menu-item" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}