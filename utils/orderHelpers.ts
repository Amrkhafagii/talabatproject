import { Order } from '@/types/database';

export function getOrderItems(order: Order): string[] {
  if (!order.order_items) return [];
  return order.order_items.map(item => 
    `${item.menu_item?.name || 'Unknown Item'} x${item.quantity}`
  );
}

function calculateOrderTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
    case 'preparing':
      return '#F59E0B';
    case 'ready':
    case 'picked_up':
    case 'on_the_way':
      return '#3B82F6';
    case 'delivered':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'picked_up':
      return 'Picked Up';
    case 'on_the_way':
      return 'On the Way';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}