import { supabase } from '../supabase';
import { DeliveryDriver } from '@/types/database';

export async function getDriverByUserId(userId: string): Promise<DeliveryDriver | null> {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .select('*')
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
  vehicleType: 'bicycle' | 'motorcycle' | 'car' | 'scooter' = 'car'
): Promise<DeliveryDriver | null> {
  const { data, error } = await supabase
    .from('delivery_drivers')
    .insert({
      user_id: userId,
      license_number: licenseNumber,
      vehicle_type: vehicleType,
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
  const { error } = await supabase
    .from('delivery_drivers')
    .update({ 
      is_online: isOnline
    })
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