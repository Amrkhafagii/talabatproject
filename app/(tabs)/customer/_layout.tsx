import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="profile" />
      <Stack.Screen 
        name="filters" 
        options={{ 
          presentation: 'modal',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}