import { Tabs, router } from 'expo-router';
import { User, Store, Truck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function TabLayout() {
  const { user, userType, loading } = useAuth();

  useEffect(() => {
    // Handle all navigation logic in a single useEffect
    if (!loading) {
      if (!user) {
        router.replace('/(auth)/welcome');
        return;
      }
      
      // If userType is invalid or null, redirect to welcome
      if (!userType || !['customer', 'restaurant', 'delivery'].includes(userType)) {
        router.replace('/(auth)/welcome');
        return;
      }
    }
  }, [user, userType, loading]);

  // Return null while loading or during redirects
  if (loading || !user || !userType || !['customer', 'restaurant', 'delivery'].includes(userType)) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}>
      {userType === 'customer' && (
        <Tabs.Screen
          name="customer"
          options={{
            title: 'Customer',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      )}
      {userType === 'restaurant' && (
        <Tabs.Screen
          name="restaurant"
          options={{
            title: 'Restaurant',
            tabBarIcon: ({ size, color }) => (
              <Store size={size} color={color} />
            ),
          }}
        />
      )}
      {userType === 'delivery' && (
        <Tabs.Screen
          name="delivery"
          options={{
            title: 'Delivery',
            tabBarIcon: ({ size, color }) => (
              <Truck size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}