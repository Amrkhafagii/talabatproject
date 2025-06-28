import { supabase } from '../supabase';
import { Delivery } from '@/types/database';
import { updateOrderStatus } from './orders';

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