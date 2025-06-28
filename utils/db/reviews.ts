import { supabase } from '../supabase';
import { Review } from '@/types/database';

async function createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return null;
  }

  return data;
}

async function getRestaurantReviews(restaurantId: string, limit: number = 10): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users(*),
      order:orders(*)
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching restaurant reviews:', error);
    return [];
  }

  return data || [];
}

async function getDriverReviews(driverId: string, limit: number = 10): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users(*),
      order:orders(*)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching driver reviews:', error);
    return [];
  }

  return data || [];
}