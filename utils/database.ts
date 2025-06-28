import { supabase } from './supabase';
import { Category, Restaurant, MenuItem, Order, OrderItem } from '@/types/database';

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

// Restaurants
export async function getRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('promoted', { ascending: false });

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

// Menu Items
export async function getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('popular', { ascending: false });

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  return data || [];
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }

  return data;
}

// Orders
export async function createOrder(
  userId: string,
  restaurantId: string,
  total: number,
  deliveryAddress: string,
  items: { menuItemId: string; quantity: number; price: number }[]
): Promise<Order | null> {
  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      restaurant_id: restaurantId,
      total,
      delivery_address: deliveryAddress,
      status: 'preparing'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return null;
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    price: item.price
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    return null;
  }

  return order;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      restaurant:restaurants(*),
      order_items(
        *,
        menu_item:menu_items(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }

  return data || [];
}

// Restaurant Orders Management
export async function getRestaurantOrders(restaurantId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        menu_item:menu_items(*)
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching restaurant orders:', error);
    return [];
  }

  return data || [];
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }

  return true;
}

// Restaurant Analytics
export async function getRestaurantStats(restaurantId: string): Promise<{
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  rating: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Get today's orders
  const { data: todayOrders, error: ordersError } = await supabase
    .from('orders')
    .select('total')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', todayISO);

  if (ordersError) {
    console.error('Error fetching today orders:', ordersError);
    return { todayRevenue: 0, todayOrders: 0, avgOrderValue: 0, rating: 0 };
  }

  // Get restaurant rating
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('rating')
    .eq('id', restaurantId)
    .single();

  if (restaurantError) {
    console.error('Error fetching restaurant rating:', restaurantError);
  }

  const revenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const orderCount = todayOrders?.length || 0;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
  const rating = restaurant?.rating || 0;

  return {
    todayRevenue: revenue,
    todayOrders: orderCount,
    avgOrderValue,
    rating
  };
}

// Get restaurant by user (for restaurant owners)
export async function getRestaurantByUserId(userId: string): Promise<Restaurant | null> {
  // For now, we'll assume the first restaurant belongs to the user
  // In a real app, you'd have a user_restaurants table or similar
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching user restaurant:', error);
    return null;
  }

  return data;
}