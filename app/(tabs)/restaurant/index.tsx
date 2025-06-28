import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, DollarSign, Clock, Star, TrendingUp, Bell, RefreshCw } from 'lucide-react-native';

import StatCard from '@/components/common/StatCard';
import OrderManagementCard from '@/components/restaurant/OrderManagementCard';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getRestaurantByUserId, 
  getRestaurantOrders, 
  getRestaurantStats, 
  updateOrderStatus 
} from '@/utils/database';
import { Restaurant, Order, RestaurantStats } from '@/types/database';
import { formatOrderTime } from '@/utils/formatters';
import { getOrderItems } from '@/utils/orderHelpers';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<RestaurantStats>({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    rating: 0,
    totalOrders: 0,
    totalRevenue: 0,
    popularItems: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadRestaurantData();
    }
  }, [user]);

  const loadRestaurantData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get restaurant data
      const restaurantData = await getRestaurantByUserId(user.id);
      if (!restaurantData) {
        setError('No restaurant found for this user');
        return;
      }

      setRestaurant(restaurantData);

      // Load orders and stats
      await Promise.all([
        loadOrders(restaurantData.id),
        loadStats(restaurantData.id)
      ]);
    } catch (err) {
      console.error('Error loading restaurant data:', err);
      setError('Failed to load restaurant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (restaurantId: string) => {
    try {
      const ordersData = await getRestaurantOrders(restaurantId);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadStats = async (restaurantId: string) => {
    try {
      const statsData = await getRestaurantStats(restaurantId);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const refreshData = async () => {
    if (!restaurant) return;

    try {
      setRefreshing(true);
      await Promise.all([
        loadOrders(restaurant.id),
        loadStats(restaurant.id)
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus as any } : order
          )
        );
        
        // Refresh stats if order is completed
        if (newStatus === 'delivered' && restaurant) {
          await loadStats(restaurant.id);
        }
      } else {
        Alert.alert('Error', 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const recentOrders = orders.slice(0, 5); // Show only recent 5 orders
  const newOrdersCount = orders.filter(order => order.status === 'preparing').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading restaurant dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Restaurant not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRestaurantData}>
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
          <Store size={24} color="#FF6B35" />
          <View style={styles.headerText}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantStatus}>Open • 8:00 AM - 10:00 PM</Text>
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
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={20} color="#6B7280" />
            {newOrdersCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{newOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={DollarSign}
              value={`$${stats.todayRevenue.toFixed(2)}`}
              label="Revenue"
              iconColor="#10B981"
            />
            <StatCard
              icon={Clock}
              value={stats.todayOrders}
              label="Orders"
              iconColor="#3B82F6"
            />
            <StatCard
              icon={TrendingUp}
              value={`$${stats.avgOrderValue.toFixed(2)}`}
              label="Avg Order"
              iconColor="#F59E0B"
            />
            <StatCard
              icon={Star}
              value={stats.rating.toFixed(1)}
              label="Rating"
              iconColor="#FFB800"
            />
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={refreshData}>
              <Text style={styles.viewAll}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.ordersContainer}>
            {recentOrders.map((order) => (
              <OrderManagementCard
                key={order.id}
                order={{
                  id: order.id,
                  orderNumber: `#${order.order_number || order.id.slice(-6).toUpperCase()}`,
                  customer: `Customer ${order.user_id.slice(-4)}`,
                  items: getOrderItems(order),
                  total: order.total,
                  status: order.status === 'preparing' ? 'new' : order.status === 'ready' ? 'ready' : 'preparing',
                  time: formatOrderTime(order.created_at)
                }}
                onAccept={order.status === 'preparing' ? () => handleUpdateOrderStatus(order.id, 'ready') : undefined}
                onReject={order.status === 'preparing' ? () => handleUpdateOrderStatus(order.id, 'cancelled') : undefined}
                onMarkReady={order.status === 'preparing' ? () => handleUpdateOrderStatus(order.id, 'ready') : undefined}
                onMarkDelivered={order.status === 'ready' ? () => handleUpdateOrderStatus(order.id, 'on_the_way') : undefined}
              />
            ))}

            {recentOrders.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptyText}>New orders will appear here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              title="Manage Menu"
              onPress={() => console.log('Manage Menu')}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="View All Orders"
              onPress={() => console.log('View All Orders')}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="Restaurant Settings"
              onPress={() => console.log('Restaurant Settings')}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </View>
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
  restaurantName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  restaurantStatus: {
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'Inter-Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
  ordersContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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
  },
  quickActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});