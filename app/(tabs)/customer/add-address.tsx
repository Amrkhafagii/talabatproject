import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Chrome as Home, Briefcase, Heart } from 'lucide-react-native';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { createUserAddress, getUserAddresses } from '@/utils/database';

const addressTypes = [
  { id: 'Home', icon: Home, label: 'Home' },
  { id: 'Work', icon: Briefcase, label: 'Work' },
  { id: 'Other', icon: Heart, label: 'Other' },
];

export default function AddAddress() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!addressLine1.trim()) {
      Alert.alert('Error', 'Please enter the street address');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter the city');
      return;
    }
    if (!state.trim()) {
      Alert.alert('Error', 'Please enter the state');
      return;
    }
    if (!postalCode.trim()) {
      Alert.alert('Error', 'Please enter the postal code');
      return;
    }

    try {
      setSaving(true);

      // Check if this will be the first address (auto-default)
      const existingAddresses = await getUserAddresses(user.id);
      const isFirstAddress = existingAddresses.length === 0;

      const newAddress = {
        user_id: user.id,
        label: selectedType === 'Other' ? customLabel.trim() || 'Other' : selectedType,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: 'US', // Default to US for now
        is_default: isFirstAddress || setAsDefault,
        delivery_instructions: deliveryInstructions.trim() || undefined,
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
          <Text style={styles.sectionTitle}>Address Type</Text>
          <View style={styles.typeContainer}>
            {addressTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && styles.selectedType
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <IconComponent 
                    size={24} 
                    color={selectedType === type.id ? '#FF6B35' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.typeText,
                    selectedType === type.id && styles.selectedTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedType === 'Other' && (
            <View style={styles.customLabelContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter custom label (e.g., Friend's House)"
                value={customLabel}
                onChangeText={setCustomLabel}
                autoCapitalize="words"
              />
            </View>
          )}
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main Street"
              value={addressLine1}
              onChangeText={setAddressLine1}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Apartment, Suite, etc.</Text>
            <TextInput
              style={styles.input}
              placeholder="Apt 4B, Suite 100, etc."
              value={addressLine2}
              onChangeText={setAddressLine2}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="New York"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="NY"
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Postal Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="10001"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Ring doorbell, Leave at door, Call when arrived..."
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Set as Default */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.defaultToggle}
            onPress={() => setSetAsDefault(!setAsDefault)}
          >
            <View>
              <Text style={styles.defaultTitle}>Set as default address</Text>
              <Text style={styles.defaultSubtitle}>Use this address for future orders</Text>
            </View>
            <View style={[
              styles.toggle,
              setAsDefault && styles.toggleActive
            ]}>
              <View style={[
                styles.toggleThumb,
                setAsDefault && styles.toggleThumbActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={saving ? "Saving..." : "Save Address"}
          onPress={handleSave}
          disabled={saving}
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedType: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7F5',
  },
  typeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 8,
  },
  selectedTypeText: {
    color: '#FF6B35',
  },
  customLabelContainer: {
    marginTop: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
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
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  defaultTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  defaultSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#FF6B35',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});