import { supabase } from '../supabase';
import { UserAddress } from '@/types/database';

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