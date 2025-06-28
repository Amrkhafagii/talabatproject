import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { user, loading, userType } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && userType) {
        // User is authenticated, redirect to appropriate tab based on user type
        switch (userType) {
          case 'customer':
            router.replace('/(tabs)/customer');
            break;
          case 'restaurant':
            router.replace('/(tabs)/restaurant');
            break;
          case 'delivery':
            router.replace('/(tabs)/delivery');
            break;
          default:
            // Fallback to customer dashboard if userType is not recognized
            router.replace('/(tabs)/customer');
            break;
        }
      } else {
        // User is not authenticated, redirect to login screen
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading, userType]);

  // Show loading spinner while checking authentication
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});