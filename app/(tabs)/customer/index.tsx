import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { router } from 'expo-router';

import SearchBar from '@/components/ui/SearchBar';
import CategoryCard from '@/components/customer/CategoryCard';
import RestaurantCard from '@/components/customer/RestaurantCard';
import { useFavorites } from '@/hooks/useFavorites';
import { getCategories, getRestaurants } from '@/utils/database';
import { Category, Restaurant } from '@/types/database';

export default function CustomerHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, restaurantsData] = await Promise.all([
        getCategories(),
        getRestaurants()
      ]);
      
      setCategories(categoriesData);
      setRestaurants(restaurantsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRestaurant = (restaurant: Restaurant) => {
    router.push({
      pathname: '/customer/restaurant',
      params: { 
        restaurantId: restaurant.id, 
        restaurantName: restaurant.name 
      }
    });
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const promotedRestaurants = filteredRestaurants.filter(r => r.promoted);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <MapPin size={20} color="#FF6B35" />
            <View style={styles.locationText}>
              <Text style={styles.deliverTo}>Deliver to</Text>
              <Text style={styles.address}>Downtown, City Center</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/customer/profile')}
          >
            <Text style={styles.profileInitial}>JD</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search restaurants, cuisines..."
          style={styles.searchContainer}
        />

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={{
                    id: parseInt(category.id.slice(-8), 16), // Convert UUID to number for compatibility
                    name: category.name,
                    emoji: category.emoji
                  }}
                  onPress={() => console.log('Category pressed:', category.name)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Promoted Restaurants */}
        {promotedRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promoted</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promotedContainer}>
              {promotedRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={{
                    id: parseInt(restaurant.id.slice(-8), 16), // Convert UUID to number for compatibility
                    name: restaurant.name,
                    cuisine: restaurant.cuisine,
                    rating: restaurant.rating,
                    deliveryTime: restaurant.delivery_time,
                    deliveryFee: restaurant.delivery_fee,
                    image: restaurant.image,
                    promoted: restaurant.promoted
                  }}
                  variant="promoted"
                  onPress={() => navigateToRestaurant(restaurant)}
                  onFavoritePress={() => toggleFavorite(parseInt(restaurant.id.slice(-8), 16))}
                  isFavorite={isFavorite(parseInt(restaurant.id.slice(-8), 16))}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Restaurants</Text>
            <TouchableOpacity onPress={() => router.push('/customer/orders')}>
              <Text style={styles.viewAll}>View Orders</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.restaurantsContainer}>
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={{
                  id: parseInt(restaurant.id.slice(-8), 16), // Convert UUID to number for compatibility
                  name: restaurant.name,
                  cuisine: restaurant.cuisine,
                  rating: restaurant.rating,
                  deliveryTime: restaurant.delivery_time,
                  deliveryFee: restaurant.delivery_fee,
                  image: restaurant.image,
                  promoted: restaurant.promoted
                }}
                onPress={() => navigateToRestaurant(restaurant)}
                onFavoritePress={() => toggleFavorite(parseInt(restaurant.id.slice(-8), 16))}
                isFavorite={isFavorite(parseInt(restaurant.id.slice(-8), 16))}
              />
            ))}
          </View>
          
          {filteredRestaurants.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No restaurants found</Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
  },
  deliverTo: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  address: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  searchContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
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
  categoriesContainer: {
    paddingLeft: 20,
  },
  promotedContainer: {
    paddingLeft: 20,
  },
  restaurantsContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
});