import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, User, MapPin, Star, DollarSign, Clock, Phone, Mail, CreditCard as Edit, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverByUserId, getUserProfile } from '@/utils/database';
import { DeliveryDriver, User as UserType } from '@/types/database';

export default function DeliveryProfile() {
  const { user, signOut } = useAuth();
  const [driver, setDriver] = useState<DeliveryDriver | null>(null);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [driverData, profileData] = await Promise.all([
        getDriverByUserId(user.id),
        getUserProfile(user.id)
      ]);
      
      setDriver(driverData);
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'D';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getVehicleDisplayName = (type: string) => {
    switch (type) {
      case 'bicycle':
        return 'Bicycle';
      case 'motorcycle':
        return 'Motorcycle';
      case 'car':
        return 'Car';
      case 'scooter':
        return 'Scooter';
      default:
        return 'Vehicle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Driver Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => console.log('Edit profile')}
          >
            <Edit size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>
              {getInitials(userProfile?.full_name)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {userProfile?.full_name || 'Driver'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {userProfile?.phone && (
            <Text style={styles.profilePhone}>{userProfile.phone}</Text>
          )}
          
          {/* Driver Status */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              driver?.is_online ? styles.onlineStatus : styles.offlineStatus
            ]}>
              <Text style={[
                styles.statusText,
                driver?.is_online ? styles.onlineText : styles.offlineText
              ]}>
                {driver?.is_online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Star size={24} color="#FFB800" fill="#FFB800" />
            <Text style={styles.statNumber}>{driver?.rating?.toFixed(1) || '5.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Truck size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{driver?.total_deliveries || 0}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={24} color="#10B981" />
            <Text style={styles.statNumber}>${driver?.total_earnings?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.vehicleSection}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Truck size={20} color="#FF6B35" />
              <Text style={styles.vehicleType}>
                {driver ? getVehicleDisplayName(driver.vehicle_type) : 'Not Set'}
              </Text>
            </View>
            
            {driver?.vehicle_make && driver?.vehicle_model && (
              <Text style={styles.vehicleDetails}>
                {driver.vehicle_year} {driver.vehicle_make} {driver.vehicle_model}
              </Text>
            )}
            
            {driver?.vehicle_color && (
              <Text style={styles.vehicleDetails}>
                Color: {driver.vehicle_color}
              </Text>
            )}
            
            {driver?.license_plate && (
              <Text style={styles.vehicleDetails}>
                License: {driver.license_plate}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/delivery/earnings')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <DollarSign size={20} color="#10B981" />
              </View>
              <Text style={styles.actionText}>View Earnings</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/delivery/history')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Clock size={20} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Delivery History</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/delivery/location')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <MapPin size={20} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Location Settings</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Driver since</Text>
            <Text style={styles.infoValue}>
              {driver?.created_at ? new Date(driver.created_at).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>License number</Text>
            <Text style={styles.infoValue}>
              {driver?.license_number || 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Background check</Text>
            <Text style={[
              styles.infoValue,
              { color: driver?.background_check_status === 'approved' ? '#10B981' : '#F59E0B' }
            ]}>
              {driver?.background_check_status === 'approved' ? 'Approved' : 'Pending'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Documents verified</Text>
            <Text style={[
              styles.infoValue,
              { color: driver?.documents_verified ? '#10B981' : '#EF4444' }
            ]}>
              {driver?.documents_verified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  editButton: {
    padding: 4,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineStatus: {
    backgroundColor: '#D1FAE5',
  },
  offlineStatus: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  onlineText: {
    color: '#10B981',
  },
  offlineText: {
    color: '#EF4444',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  vehicleSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  actionArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 8,
  },
});