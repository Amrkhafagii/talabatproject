import { supabase } from '../supabase';
import { Restaurant, MenuItem, RestaurantFilters } from '@/types/database';

async function searchRestaurants(query: string, filters?: RestaurantFilters): Promise<Restaurant[]> {
  let supabaseQuery = supabase
    .from('restaurants')
    .select(`
      *,
      restaurant_hours(*)
    `)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,cuisine.ilike.%${query}%,description.ilike.%${query}%`);

  // Apply additional filters
  if (filters?.cuisine && filters.cuisine.length > 0) {
    supabaseQuery = supabaseQuery.in('cuisine', filters.cuisine);
  }

  if (filters?.rating) {
    supabaseQuery = supabaseQuery.gte('rating', filters.rating);
  }

  if (filters?.deliveryFee) {
    supabaseQuery = supabaseQuery.lte('delivery_fee', filters.deliveryFee);
  }

  if (filters?.promoted !== undefined) {
    supabaseQuery = supabaseQuery.eq('is_promoted', filters.promoted);
  }

  const { data, error } = await supabaseQuery
    .order('is_promoted', { ascending: false })
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error searching restaurants:', error);
    return [];
  }

  return data || [];
}

async function searchMenuItems(query: string, restaurantId?: string): Promise<MenuItem[]> {
  let supabaseQuery = supabase
    .from('menu_items')
    .select(`
      *,
      restaurant:restaurants(*)
    `)
    .eq('is_available', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  if (restaurantId) {
    supabaseQuery = supabaseQuery.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await supabaseQuery
    .order('is_popular', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching menu items:', error);
    return [];
  }

  return data || [];
}

async function getFeaturedRestaurants(limit: number = 6): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .eq('is_promoted', true)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured restaurants:', error);
    return [];
  }

  return data || [];
}

async function getPopularMenuItems(limit: number = 10): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      restaurant:restaurants(*)
    `)
    .eq('is_available', true)
    .eq('is_popular', true)
    .order('sort_order')
    .limit(limit);

  if (error) {
    console.error('Error fetching popular menu items:', error);
    return [];
  }

  return data || [];
}