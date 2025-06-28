export interface Category {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  image: string;
  promoted: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  total: number;
  status: 'preparing' | 'ready' | 'on_the_way' | 'delivered';
  delivery_address: string;
  created_at: string;
  restaurant?: Restaurant;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: string;
  menu_item?: MenuItem;
}

export interface RestaurantStats {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  rating: number;
}

export interface DeliveryDriver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  is_online: boolean;
  current_location?: string;
  rating: number;
  total_deliveries: number;
  created_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  driver_id?: string;
  pickup_address: string;
  delivery_address: string;
  distance: string;
  estimated_time: string;
  delivery_fee: number;
  status: 'available' | 'assigned' | 'picked_up' | 'delivered';
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
  order?: Order;
  driver?: DeliveryDriver;
}

export interface DeliveryStats {
  todayEarnings: number;
  completedDeliveries: number;
  avgDeliveryTime: number;
  rating: number;
}