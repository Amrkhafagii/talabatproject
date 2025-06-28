import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Chrome as Home, Briefcase, Heart } from 'lucide-react-native';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAddresses, updateUserAddress } from '@/utils/database';
import { UserAddress } from '@/types/database';

const addressTypes = [
  { id: 'Home', icon: Home, label: 'Home' },
  { id: 'Work', icon: Briefcase, label: 'Work' },
  { id: 'Other', icon: Heart, label: 'Other' },
];

export default function EditAddress() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const addressId = params.addressId as string;

  const [address, setAddress] = useState<UserAddress | null>(null);
  const [selectedType, setSelectedType] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && addressId) {
      loadAddress();
    }
  }, [user, addressId]);

  const loadAddress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const addresses = await getUserAddresses(user.id);
      const foundAddress = addresses.find(addr => addr.id === addressId);
      
      if (foundAddress) {
        setAddress(foundAddress);
        
        // Determine address type
        const standardTypes = ['Home', 'Work'];
        if (standardTypes.includes(foundAddress.label)) {
          setSelectedType(foundAddress.label);
        } else {
          setSelectedType('Other');
          setCustomLabel(foundAddress.label);
        }
        
        setAddressLine1(foundAddress.address_line_1);
        setAddressLine2(foundAddress.address_line_2 || '');
        setCity(foundAddress.city);
        setState(foundAddress.state);
        setPostalCode(foundAddress.postal_code);
        setDeliveryInstructions(foundAddress.delivery_instructions || '');
      } else {
        Alert.alert('Error', 'Address not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error loading address:', error);
      Alert.alert('Error', 'Failed to load address');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !address) return;

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

      const updates: Partial<UserAddress> = {
        label: selectedType === 'Other' ? customLabel.trim() || 'Other' : selectedType,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        delivery_instructions: deliveryInstructions.trim() || undefined,
        updated_at: new Date().toISOString(),
      };

      const success = await updateUserAddress(address.id, updates);
      
      if (success) {
        Alert.alert('Success', 'Address updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Edit Address" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading address...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!address) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Edit Address" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Address not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Address" showBackButton />

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

        {/* Default Address Info */}
        {address.is_default && (
          <View style={styles.defaultInfo}>
            <Text style={styles.defaultInfoText}>
              This is your default delivery address
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={saving ? "Saving..." : "Save Changes"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
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
  defaultInfo: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  defaultInfoText: {
    fontSize: 14,
    color: '#065F46',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});