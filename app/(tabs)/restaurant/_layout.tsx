import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function RestaurantLayout() {
  const { user, userType, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect non-restaurant users to their appropriate dashboard
      if (userType !== 'restaurant') {
        switch (userType) {
          case 'customer':
            router.replace('/(tabs)/customer');
            break;
          case 'delivery':
            router.replace('/(tabs)/delivery');
            break;
          default:
            // If userType is not recognized, redirect to login
            router.replace('/(auth)/login');
            break;
        }
      }
    } else if (!loading && !user) {
      // Redirect unauthenticated users to login
      router.replace('/(auth)/login');
    }
  }, [user, userType, loading]);

  // Don't render anything while checking authentication or if user is not a restaurant
  if (loading || !user || userType !== 'restaurant') {
    return null;
  }

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