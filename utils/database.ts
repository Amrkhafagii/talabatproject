import { supabase } from './supabase';
import { 
  Category, 
  Restaurant, 
  MenuItem, 
  Order, 
  OrderItem, 
  Delivery, 
  DeliveryDriver, 
  DeliveryStats,
  RestaurantStats,
  UserAddress,
  Review,
  User,
  RestaurantFilters,
  MenuItemFilters,
  OrderFilters
} from '@/types/database';

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function createUserProfile(
  userId: string,
  email: string,
  fullName?: string,
  userType: 'customer' | 'restaurant' | 'delivery' = 'customer'
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      full_name: fullName,
      user_type: userType
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }

  return data;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }

  return true;
}

// ============================================================================
// USER ADDRESSES
// ============================================================================

export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) {
    console.error('Error fetching user addresses:', error);
    return [];
  }

  return data || [];
}

export async function createUserAddress(address: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>): Promise<UserAddress | null> {
  const { data, error } = await supabase
    .from('user_addresses')
    .insert(address)
    .select()
    .single();

  if (error) {
    console.error('Error creating user address:', error);
    return null;
  }

  return data;
}

export async function updateUserAddress(addressId: string, updates: Partial<UserAddress>): Promise<boolean> {
  const { error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', addressId);

  if (error) {
    console.error('Error updating user address:', error);
    return false;
  }

  return true;
}

export async function deleteUserAddress(addressId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId);

  if (error) {
    console.error('Error deleting user address:', error);
    return false;
  }

  return true;
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  return data;
}

// ============================================================================
// RESTAURANTS
// ============================================================================

export async function getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
  let query = supabase
    .from('restaurants')
    .select(`
      *,
      restaurant_hours(*)
    `)
    .eq('is_active', true);

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
    query = query.eq('is_promoted', filters.promoted);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,cuisine.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Order by promoted first, then by rating
  query = query.order('is_promoted', { ascending: false })
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
    .select(`
      *,
      restaurant_hours(*)
    `)
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
    .select(`
      *,
      restaurant_hours(*)
    `)
    .eq('owner_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user restaurant:', error);
    return null;
  }

  return data;
}

export async function createRestaurant(restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews'>): Promise<Restaurant | null> {
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

export async function updateRestaurant(restaurantId: string, updates: Partial<Restaurant>): Promise<boolean> {
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

// ============================================================================
// MENU ITEMS
// ============================================================================

export async function getMenuItemsByRestaurant(restaurantId: string, filters?: MenuItemFilters): Promise<MenuItem[]> {
  let query = supabase
    .from('menu_items')
    .select(`
      *,
      restaurant:restaurants(*),
      category_info:categories(*)
    `)
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true);

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.popular !== undefined) {
    query = query.eq('is_popular', filters.popular);
  }

  if (filters?.priceRange) {
    query = query.gte('price', filters.priceRange[0])
                 .lte('price', filters.priceRange[1]);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Order by popular first, then by sort order
  query = query.order('is_popular', { ascending: false })
              .order('sort_order');

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }

  return data || [];
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      restaurant:restaurants(*),
      category_info:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }

  return data;
}

export async function createMenuItem(menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(menuItem)
    .select()
    .single();

  if (error) {
    console.error('Error creating menu item:', error);
    return null;
  }

  return data;
}

export async function updateMenuItem(menuItemId: string, updates: Partial<MenuItem>): Promise<boolean> {
  const { error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', menuItemId);

  if (error) {
    console.error('Error updating menu item:', error);
    return false;
  }

  return true;
}

export async function deleteMenuItem(menuItemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', menuItemId);

  if (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }

  return true;
}

// ============================================================================
// ORDERS
// ============================================================================

export async function createOrder(
  userId: string,
  restaurantId: string,
  deliveryAddressId: string | null,
  deliveryAddress: string,
  items: { menuItemId: string; quantity: number; unitPrice: number; specialInstructions?: string }[],
  subtotal: number,
  deliveryFee: number,
  taxAmount: number,
  tipAmount: number,
  total: number,
  paymentMethod: string = 'card',
  deliveryInstructions?: string
): Promise<Order | null> {
  // Start a transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      restaurant_id: restaurantId,
      delivery_address_id: deliveryAddressId,
      delivery_address: deliveryAddress,
      subtotal,
      delivery_fee: deliveryFee,
      tax_amount: taxAmount,
      tip_amount: tipAmount,
      total,
      payment_method: paymentMethod,
      delivery_instructions: deliveryInstructions,
      status: 'pending',
      payment_status: 'pending'
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
    unit_price: item.unitPrice,
    total_price: item.unitPrice * item.quantity,
    special_instructions: item.specialInstructions
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Rollback order creation
    await supabase.from('orders').delete().eq('id', order.id);
    return null;
  }

  // Create delivery record
  const { error: deliveryError } = await supabase
    .from('deliveries')
    .insert({
      order_id: order.id,
      pickup_address: deliveryAddress, // This should be restaurant address
      delivery_address: deliveryAddress,
      delivery_fee: deliveryFee,
      driver_earnings: deliveryFee * 0.8, // 80% to driver
      status: 'pending'
    });

  if (deliveryError) {
    console.error('Error creating delivery:', deliveryError);
  }

  return order;
}

export async function getUserOrders(userId: string, filters?: OrderFilters): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      restaurant:restaurants(*),
      delivery_address_info:user_addresses(*),
      order_items(
        *,
        menu_item:menu_items(*)
      ),
      delivery:deliveries(
        *,
        driver:delivery_drivers(
          *,
          user:users(*)
        )
      )
    `)
    .eq('user_id', userId);

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.restaurant) {
    query = query.eq('restaurant_id', filters.restaurant);
  }

  if (filters?.dateRange) {
    query = query.gte('created_at', filters.dateRange[0])
                 .lte('created_at', filters.dateRange[1]);
  }

  if (filters?.minTotal) {
    query = query.gte('total', filters.minTotal);
  }

  if (filters?.maxTotal) {
    query = query.lte('total', filters.maxTotal);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }

  return data || [];
}

export async function getRestaurantOrders(restaurantId: string, filters?: OrderFilters): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      user:users(*),
      delivery_address_info:user_addresses(*),
      order_items(
        *,
        menu_item:menu_items(*)
      ),
      delivery:deliveries(
        *,
        driver:delivery_drivers(
          *,
          user:users(*)
        )
      )
    `)
    .eq('restaurant_id', restaurantId);

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.dateRange) {
    query = query.gte('created_at', filters.dateRange[0])
                 .lte('created_at', filters.dateRange[1]);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching restaurant orders:', error);
    return [];
  }

  return data || [];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      restaurant:restaurants(*),
      user:users(*),
      delivery_address_info:user_addresses(*),
      order_items(
        *,
        menu_item:menu_items(*)
      ),
      delivery:deliveries(
        *,
        driver:delivery_drivers(
          *,
          user:users(*)
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

export async function updateOrderStatus(orderId: string, status: string, additionalData?: any): Promise<boolean> {
  const updateData: any = { status };
  
  // Add timestamp fields based on status
  switch (status) {
    case 'confirmed':
      updateData.confirmed_at = new Date().toISOString();
      break;
    case 'preparing':
      updateData.confirmed_at = updateData.confirmed_at || new Date().toISOString();
      break;
    case 'ready':
      updateData.prepared_at = new Date().toISOString();
      break;
    case 'picked_up':
      updateData.picked_up_at = new Date().toISOString();
      break;
    case 'delivered':
      updateData.delivered_at = new Date().toISOString();
      break;
    case 'cancelled':
      updateData.cancelled_at = new Date().toISOString();
      if (additionalData?.cancellation_reason) {
        updateData.cancellation_reason = additionalData.cancellation_reason;
      }
      break;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }

  return true;
}

// ============================================================================
// DELIVERY DRIVERS
// ============================================================================

export async function getDriverByUserId(userId: string): Promise<DeliveryDriver | null> {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .select(`
      *,
      user:users(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching driver:', error);
    return null;
  }

  return data;
}

export async function createDriverProfile(
  userId: string,
  licenseNumber: string,
  vehicleType: 'bicycle' | 'motorcycle' | 'car' | 'scooter',
  vehicleDetails?: {
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    licensePlate?: string;
  }
): Promise<DeliveryDriver | null> {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .insert({
      user_id: userId,
      license_number: licenseNumber,
      vehicle_type: vehicleType,
      vehicle_make: vehicleDetails?.make,
      vehicle_model: vehicleDetails?.model,
      vehicle_year: vehicleDetails?.year,
      vehicle_color: vehicleDetails?.color,
      license_plate: vehicleDetails?.licensePlate,
      is_online: false,
      is_available: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating driver profile:', error);
    return null;
  }

  return data;
}

export async function updateDriverOnlineStatus(driverId: string, isOnline: boolean): Promise<boolean> {
  const updateData: any = { 
    is_online: isOnline,
    last_location_update: new Date().toISOString()
  };

  const { error } = await supabase
    .from('delivery_drivers')
    .update(updateData)
    .eq('id', driverId);

  if (error) {
    console.error('Error updating driver online status:', error);
    return false;
  }

  return true;
}

export async function updateDriverLocation(
  driverId: string, 
  latitude: number, 
  longitude: number
): Promise<boolean> {
  const { error } = await supabase
    .from('delivery_drivers')
    .update({
      current_latitude: latitude,
      current_longitude: longitude,
      last_location_update: new Date().toISOString()
    })
    .eq('id', driverId);

  if (error) {
    console.error('Error updating driver location:', error);
    return false;
  }

  return true;
}

// ============================================================================
// DELIVERIES
// ============================================================================

export async function getAvailableDeliveries(): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      order:orders(
        *,
        restaurant:restaurants(*),
        user:users(*),
        order_items(
          *,
          menu_item:menu_items(*)
        )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching available deliveries:', error);
    return [];
  }

  return data || [];
}

export async function getDriverDeliveries(driverId: string): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      order:orders(
        *,
        restaurant:restaurants(*),
        user:users(*),
        order_items(
          *,
          menu_item:menu_items(*)
        )
      )
    `)
    .eq('driver_id', driverId)
    .in('status', ['assigned', 'picked_up', 'on_the_way'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching driver deliveries:', error);
    return [];
  }

  return data || [];
}

export async function acceptDelivery(deliveryId: string, driverId: string): Promise<boolean> {
  const { error } = await supabase
    .from('deliveries')
    .update({
      driver_id: driverId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    })
    .eq('id', deliveryId)
    .eq('status', 'pending'); // Only accept if still pending

  if (error) {
    console.error('Error accepting delivery:', error);
    return false;
  }

  return true;
}

export async function updateDeliveryStatus(deliveryId: string, status: string): Promise<boolean> {
  const updateData: any = { status };
  
  switch (status) {
    case 'picked_up':
      updateData.picked_up_at = new Date().toISOString();
      break;
    case 'on_the_way':
      updateData.picked_up_at = updateData.picked_up_at || new Date().toISOString();
      break;
    case 'delivered':
      updateData.delivered_at = new Date().toISOString();
      break;
    case 'cancelled':
      updateData.cancelled_at = new Date().toISOString();
      break;
  }

  const { error } = await supabase
    .from('deliveries')
    .update(updateData)
    .eq('id', deliveryId);

  if (error) {
    console.error('Error updating delivery status:', error);
    return false;
  }

  // Update corresponding order status
  if (status === 'picked_up') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('order_id')
      .eq('id', deliveryId)
      .single();

    if (delivery) {
      await updateOrderStatus(delivery.order_id, 'picked_up');
    }
  } else if (status === 'on_the_way') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('order_id')
      .eq('id', deliveryId)
      .single();

    if (delivery) {
      await updateOrderStatus(delivery.order_id, 'on_the_way');
    }
  } else if (status === 'delivered') {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('order_id')
      .eq('id', deliveryId)
      .single();

    if (delivery) {
      await updateOrderStatus(delivery.order_id, 'delivered');
    }
  }

  return true;
}

// ============================================================================
// ANALYTICS & STATS
// ============================================================================

export async function getRestaurantStats(restaurantId: string): Promise<RestaurantStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Get today's orders
  const { data: todayOrders, error: ordersError } = await supabase
    .from('orders')
    .select('total, status')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', todayISO);

  // Get restaurant info
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('rating, total_reviews')
    .eq('id', restaurantId)
    .single();

  // Get popular menu items
  const { data: popularItems, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_popular', true)
    .limit(5);

  // Get recent orders
  const { data: recentOrders, error: recentError } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(*),
      order_items(
        *,
        menu_item:menu_items(*)
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordersError || restaurantError) {
    console.error('Error fetching restaurant stats:', ordersError || restaurantError);
    return { 
      todayRevenue: 0, 
      todayOrders: 0, 
      avgOrderValue: 0, 
      rating: 0,
      totalOrders: 0,
      totalRevenue: 0,
      popularItems: [],
      recentOrders: []
    };
  }

  const revenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const orderCount = todayOrders?.length || 0;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  return {
    todayRevenue: revenue,
    todayOrders: orderCount,
    avgOrderValue,
    rating: restaurant?.rating || 0,
    totalOrders: restaurant?.total_reviews || 0,
    totalRevenue: 0, // This would need a separate query for all-time revenue
    popularItems: popularItems || [],
    recentOrders: recentOrders || []
  };
}

export async function getDriverStats(driverId: string): Promise<DeliveryStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Get today's completed deliveries
  const { data: todayDeliveries, error: deliveriesError } = await supabase
    .from('deliveries')
    .select('driver_earnings, delivered_at, picked_up_at')
    .eq('driver_id', driverId)
    .eq('status', 'delivered')
    .gte('delivered_at', todayISO);

  // Get driver info
  const { data: driver, error: driverError } = await supabase
    .from('delivery_drivers')
    .select('rating, total_deliveries, total_earnings')
    .eq('id', driverId)
    .single();

  if (deliveriesError || driverError) {
    console.error('Error fetching driver stats:', deliveriesError || driverError);
    return { 
      todayEarnings: 0, 
      completedDeliveries: 0, 
      avgDeliveryTime: 0, 
      rating: 0,
      totalEarnings: 0,
      totalDeliveries: 0,
      onlineHours: 0
    };
  }

  const earnings = todayDeliveries?.reduce((sum, delivery) => sum + delivery.driver_earnings, 0) || 0;
  const deliveryCount = todayDeliveries?.length || 0;

  // Calculate average delivery time
  let avgDeliveryTime = 0;
  if (todayDeliveries && todayDeliveries.length > 0) {
    const totalTime = todayDeliveries.reduce((sum, delivery) => {
      if (delivery.picked_up_at && delivery.delivered_at) {
        const pickupTime = new Date(delivery.picked_up_at).getTime();
        const deliveryTime = new Date(delivery.delivered_at).getTime();
        return sum + (deliveryTime - pickupTime);
      }
      return sum;
    }, 0);
    avgDeliveryTime = Math.round(totalTime / (deliveryCount * 60000)); // Convert to minutes
  }

  return {
    todayEarnings: earnings,
    completedDeliveries: deliveryCount,
    avgDeliveryTime,
    rating: driver?.rating || 0,
    totalEarnings: driver?.total_earnings || 0,
    totalDeliveries: driver?.total_deliveries || 0,
    onlineHours: 8 // This would need tracking of online/offline times
  };
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function createReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review | null> {
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

export async function getRestaurantReviews(restaurantId: string, limit: number = 10): Promise<Review[]> {
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

export async function getDriverReviews(driverId: string, limit: number = 10): Promise<Review[]> {
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

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

export async function searchRestaurants(query: string, filters?: RestaurantFilters): Promise<Restaurant[]> {
  return getRestaurants({ ...filters, search: query });
}

export async function searchMenuItems(query: string, restaurantId?: string): Promise<MenuItem[]> {
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

export async function getFeaturedRestaurants(limit: number = 6): Promise<Restaurant[]> {
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

export async function getPopularMenuItems(limit: number = 10): Promise<MenuItem[]> {
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