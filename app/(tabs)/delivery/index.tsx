import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, DollarSign, Clock, CircleCheck as CheckCircle, RefreshCw, Phone, Navigation } from 'lucide-react-native';

import StatCard from '@/components/common/StatCard';
import DeliveryCard from '@/components/delivery/DeliveryCard';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getDriverByUserId, 
  createDriverProfile,
  updateDriverOnlineStatus,
  getAvailableDeliveries,
  getDriverDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  getDriverStats
} from '@/utils/database';
import { DeliveryDriver, Delivery, DeliveryStats } from '@/types/database';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<DeliveryDriver | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({
    todayEarnings: 0,
    completedDeliveries: 0,
    avgDeliveryTime: 0,
    rating: 0,
    totalEarnings: 0,
    totalDeliveries: 0,
    onlineHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get or create driver profile
      let driverData = await getDriverByUserId(user.id);
      
      if (!driverData) {
        // Create a default driver profile for new delivery users
        driverData = await createDriverProfile(
          user.id,
          'DL123456789',
          'car'
        );
      }

      if (!driverData) {
        setError('Failed to create driver profile');
        return;
      }

      setDriver(driverData);

      // Load deliveries and stats
      await Promise.all([
        loadDeliveries(driverData.id),
        loadStats(driverData.id)
      ]);
    } catch (err) {
      console.error('Error loading driver data:', err);
      setError('Failed to load driver data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async (driverId: string) => {
    try {
      const [available, active] = await Promise.all([
        getAvailableDeliveries(),
        getDriverDeliveries(driverId)
      ]);
      
      setAvailableDeliveries(available);
      setActiveDeliveries(active);
    } catch (err) {
      console.error('Error loading deliveries:', err);
    }
  };

  const loadStats = async (driverId: string) => {
    try {
      const statsData = await getDriverStats(driverId);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const refreshData = async () => {
    if (!driver) return;

    try {
      setRefreshing(true);
      await Promise.all([
        loadDeliveries(driver.id),
        loadStats(driver.id)
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;

    try {
      const newStatus = !driver.is_online;
      const success = await updateDriverOnlineStatus(driver.id, newStatus);
      
      if (success) {
        setDriver(prev => prev ? { ...prev, is_online: newStatus } : null);
        
        if (newStatus) {
          // Refresh available deliveries when going online
          await loadDeliveries(driver.id);
        }
      } else {
        Alert.alert('Error', 'Failed to update online status');
      }
    } catch (err) {
      console.error('Error toggling online status:', err);
      Alert.alert('Error', 'Failed to update online status');
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    if (!driver) return;

    try {
      const success = await acceptDelivery(deliveryId, driver.id);
      
      if (success) {
        // Refresh deliveries
        await loadDeliveries(driver.id);
        Alert.alert('Success', 'Delivery accepted! Head to the pickup location.');
      } else {
        Alert.alert('Error', 'Failed to accept delivery. It may have been taken by another driver.');
      }
    } catch (err) {
      console.error('Error accepting delivery:', err);
      Alert.alert('Error', 'Failed to accept delivery');
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const success = await updateDeliveryStatus(deliveryId, newStatus);
      
      if (success) {
        // Refresh deliveries and stats
        if (driver) {
          await Promise.all([
            loadDeliveries(driver.id),
            loadStats(driver.id)
          ]);
        }
        
        if (newStatus === 'delivered') {
          Alert.alert('Success', 'Delivery completed! Great job!');
        }
      } else {
        Alert.alert('Error', 'Failed to update delivery status');
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      Alert.alert('Error', 'Failed to update delivery status');
    }
  };

  const callCustomer = (phone: string) => {
    console.log('Call customer:', phone);
    // In a real app, this would open the phone dialer
    Alert.alert('Call Customer', `Would call: ${phone}`);
  };

  const navigate = (address: string) => {
    console.log('Navigate to:', address);
    // In a real app, this would open maps with navigation
    Alert.alert('Navigate', `Would navigate to: ${address}`);
  };

  const formatDeliveryForCard = (delivery: Delivery) => ({
    id: delivery.id,
    restaurantName: delivery.order?.restaurant?.name || 'Unknown Restaurant',
    customerName: `Customer ${delivery.order?.user_id.slice(-4) || '****'}`,
    customerPhone: '+1 (555) 123-4567', // This would come from user profile
    pickupAddress: delivery.pickup_address,
    deliveryAddress: delivery.delivery_address,
    distance: delivery.distance_km ? `${delivery.distance_km} km` : '2.1 miles',
    estimatedTime: delivery.estimated_duration_minutes ? `${delivery.estimated_duration_minutes} min` : '15 min',
    payment: delivery.delivery_fee,
    items: delivery.order?.order_items?.map(item => 
      `${item.menu_item?.name || 'Unknown Item'} x${item.quantity}`
    ) || [],
    status: delivery.status === 'assigned' || delivery.status === 'picked_up' ? 'active' as const : 'available' as const
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading delivery dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Driver profile not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDriverData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Truck size={24} color="#FF6B35" />
          <View style={styles.headerText}>
            <Text style={styles.driverName}>{driver.user?.full_name || 'Driver'}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: driver.is_online ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: driver.is_online ? '#10B981' : '#EF4444' }]}>
                {driver.is_online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={refreshData}
            disabled={refreshing}
          >
            <RefreshCw 
              size={20} 
              color="#6B7280" 
              style={refreshing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
          <Button
            title={driver.is_online ? 'Go Offline' : 'Go Online'}
            onPress={toggleOnlineStatus}
            variant={driver.is_online ? 'danger' : 'secondary'}
            size="small"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={DollarSign}
              value={`$${stats.todayEarnings.toFixed(2)}`}
              label="Earnings"
              iconColor="#10B981"
            />
            <StatCard
              icon={CheckCircle}
              value={stats.completedDeliveries}
              label="Deliveries"
              iconColor="#3B82F6"
            />
            <StatCard
              icon={Clock}
              value={`${stats.avgDeliveryTime}m`}
              label="Avg Time"
              iconColor="#F59E0B"
            />
            <StatCard
              icon={Truck}
              value={stats.rating.toFixed(1)}
              label="Rating"
              iconColor="#FFB800"
            />
          </View>
        </View>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Deliveries</Text>
            <View style={styles.deliveryContainer}>
              {activeDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  order={formatDeliveryForCard(delivery)}
                  onCall={() => callCustomer('+1 (555) 123-4567')}
                  onNavigate={() => navigate(delivery.status === 'assigned' ? delivery.pickup_address : delivery.delivery_address)}
                  onPickup={delivery.status === 'assigned' ? () => handleUpdateDeliveryStatus(delivery.id, 'picked_up') : undefined}
                  onComplete={delivery.status === 'picked_up' ? () => handleUpdateDeliveryStatus(delivery.id, 'delivered') : undefined}
                />
              ))}
            </View>
          </View>
        )}

        {/* Available Orders */}
        {driver.is_online && activeDeliveries.length === 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Deliveries</Text>
              <TouchableOpacity onPress={refreshData}>
                <Text style={styles.viewAll}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ordersContainer}>
              {availableDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  order={formatDeliveryForCard(delivery)}
                  onAccept={() => handleAcceptDelivery(delivery.id)}
                />
              ))}
            </View>

            {availableDeliveries.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No deliveries available</Text>
                <Text style={styles.emptyText}>New delivery requests will appear here</Text>
              </View>
            )}
          </View>
        )}

        {/* Offline State */}
        {!driver.is_online && (
          <View style={styles.offlineState}>
            <Truck size={48} color="#9CA3AF" />
            <Text style={styles.offlineTitle}>You're offline</Text>
            <Text style={styles.offlineText}>Go online to start receiving delivery requests</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 12,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: '#FF6B35',
    fontFamily: 'Inter-Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  deliveryContainer: {
    paddingHorizontal: 20,
  },
  ordersContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  offlineState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  offlineTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});