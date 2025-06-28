import { supabase } from '../supabase';
import { Restaurant, RestaurantFilters } from '@/types/database';

export async function getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
  let query = supabase
    .from('restaurants')
    .select('*');

  // Apply filters
  if (filters?.cuisine && filters.cuisine.length > 0) {
    query = query.in('cuisine', filters.cuisine);
  }

  if (filters?.rating) {
    query = query.gte('rating', filters.rating);
  }

  if (filters?.deliveryFee) {
    query = query.lte('delivery_fee', filters.deliveryFee);
  }

  if (filters?.promoted !== undefined) {
    query = query.eq('promoted', filters.promoted);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,cuisine.ilike.%${filters.search}%`);
  }

  // Order by promoted first, then by rating
  query = query.order('promoted', { ascending: false })
              .order('rating', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }

  return data || [];
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }

  return data;
}

export async function getRestaurantByUserId(userId: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user restaurant:', error);
    return null;
  }

  return data;
}

async function createRestaurant(restaurant: Omit<Restaurant, 'id' | 'created_at' | 'rating'>): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();

  if (error) {
    console.error('Error creating restaurant:', error);
    return null;
  }

  return data;
}

async function updateRestaurant(restaurantId: string, updates: Partial<Restaurant>): Promise<boolean> {
  const { error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId);

  if (error) {
    console.error('Error updating restaurant:', error);
    return false;
  }

  return true;
}