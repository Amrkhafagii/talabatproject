import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import FormSelect from '@/components/ui/FormSelect';
import FormToggle from '@/components/ui/FormToggle';
import { useAuth } from '@/contexts/AuthContext';
import { createUserAddress, getUserAddresses } from '@/utils/database';
import { addressSchema, AddressFormData } from '@/utils/validation/schemas';

const addressTypeOptions = [
  { label: 'Home', value: 'Home' },
  { label: 'Work', value: 'Work' },
  { label: 'Other', value: 'Other' },
];

export default function AddAddress() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: {
      label: 'Home',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      deliveryInstructions: '',
      isDefault: false,
    },
  });

  const selectedLabel = watch('label');

  useEffect(() => {
    // Check if this will be the first address (auto-default)
    checkIfFirstAddress();
  }, [user]);

  const checkIfFirstAddress = async () => {
    if (!user) return;

    try {
      const existingAddresses = await getUserAddresses(user.id);
      if (existingAddresses.length === 0) {
        setValue('isDefault', true);
      }
    } catch (error) {
      console.error('Error checking existing addresses:', error);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!user) return;

    setSaving(true);

    try {
      const newAddress = {
        user_id: user.id,
        label: data.label,
        address_line_1: data.addressLine1,
        address_line_2: data.addressLine2 || undefined,
        city: data.city,
        state: data.state.toUpperCase(),
        postal_code: data.postalCode,
        country: 'US',
        is_default: data.isDefault || false,
        delivery_instructions: data.deliveryInstructions || undefined,
      };

      const success = await createUserAddress(newAddress);
      
      if (success) {
        Alert.alert('Success', 'Address added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Address" showBackButton />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Type Selection */}
        <View style={styles.section}>
          <FormSelect
            control={control}
            name="label"
            label="Address Type"
            options={addressTypeOptions}
          />
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <FormField
            control={control}
            name="addressLine1"
            label="Street Address"
            placeholder="123 Main Street"
            autoCapitalize="words"
          />

          <FormField
            control={control}
            name="addressLine2"
            label="Apartment, Suite, etc. (Optional)"
            placeholder="Apt 4B, Suite 100, etc."
            autoCapitalize="words"
          />

          <View style={styles.rowContainer}>
            <FormField
              control={control}
              name="city"
              label="City"
              placeholder="New York"
              autoCapitalize="words"
              style={styles.flex1}
            />

            <FormField
              control={control}
              name="state"
              label="State"
              placeholder="NY"
              autoCapitalize="characters"
              maxLength={2}
              style={[styles.flex1, styles.marginLeft]}
            />
          </View>

          <FormField
            control={control}
            name="postalCode"
            label="Postal Code"
            placeholder="10001"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <FormField
            control={control}
            name="deliveryInstructions"
            label="Delivery Instructions (Optional)"
            placeholder="e.g., Ring doorbell, Leave at door, Call when arrived..."
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Set as Default */}
        <View style={styles.section}>
          <FormToggle
            control={control}
            name="isDefault"
            label="Set as default address"
            description="Use this address for future orders"
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={saving ? "Saving..." : "Save Address"}
          onPress={handleSubmit(onSubmit)}
          disabled={saving || !isValid}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});