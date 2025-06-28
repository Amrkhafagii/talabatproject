import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function DeliveryLayout() {
  const { user, userType, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect non-delivery users to their appropriate dashboard
      if (userType !== 'delivery') {
        switch (userType) {
          case 'customer':
            router.replace('/(tabs)/customer');
            break;
          case 'restaurant':
            router.replace('/(tabs)/restaurant');
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

  // Don't render anything while checking authentication or if user is not a delivery driver
  if (loading || !user || userType !== 'delivery') {
    return null;
  }

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