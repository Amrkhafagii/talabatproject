import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, Star } from 'lucide-react-native';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getRestaurantByUserId, createMenuItem, getCategories } from '@/utils/database';
import { Restaurant, Category } from '@/types/database';

const defaultCategories = ['Mains', 'Sides', 'Beverages', 'Desserts', 'Appetizers', 'Salads'];

export default function AddMenuItem() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Mains');
  const [preparationTime, setPreparationTime] = useState('15');
  const [isPopular, setIsPopular] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [restaurantData, categoriesData] = await Promise.all([
        getRestaurantByUserId(user.id),
        getCategories()
      ]);

      if (!restaurantData) {
        Alert.alert('Error', 'Restaurant not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setRestaurant(restaurantData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      Alert.alert('Error', 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the item name');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter the item description');
      return false;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (!preparationTime.trim() || isNaN(parseInt(preparationTime)) || parseInt(preparationTime) <= 0) {
      Alert.alert('Error', 'Please enter a valid preparation time');
      return false;
    }
    if (!imageUrl.trim()) {
      Alert.alert('Error', 'Please enter an image URL');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!restaurant || !validateForm()) return;

    try {
      setSaving(true);

      const newMenuItem = {
        restaurant_id: restaurant.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        image: imageUrl.trim(),
        category: category,
        is_popular: isPopular,
        is_available: isAvailable,
        preparation_time: parseInt(preparationTime),
        sort_order: 0,
        calories: undefined,
        allergens: undefined,
        ingredients: undefined
      };

      const success = await createMenuItem(newMenuItem);

      if (success) {
        Alert.alert('Success', 'Menu item added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add menu item');
      }
    } catch (err) {
      console.error('Error adding menu item:', err);
      Alert.alert('Error', 'Failed to add menu item');
    } finally {
      setSaving(false);
    }
  };

  const availableCategories = categories.length > 0 
    ? categories.map(cat => cat.name)
    : defaultCategories;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Add Menu Item" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Menu Item" showBackButton />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Image</Text>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={32} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>Add Image</Text>
              </View>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter image URL (e.g., from Pexels)"
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHelp}>
            Use a high-quality image URL from Pexels or other sources
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Margherita Pizza"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your dish, ingredients, and what makes it special..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.flex1]}>
              <Text style={styles.inputLabel}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="12.99"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.flex1, styles.marginLeft]}>
              <Text style={styles.inputLabel}>Prep Time (min) *</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                value={preparationTime}
                onChangeText={setPreparationTime}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {availableCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.selectedCategory
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  category === cat && styles.selectedCategoryText
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <TouchableOpacity
            style={styles.optionToggle}
            onPress={() => setIsPopular(!isPopular)}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Mark as Popular</Text>
              <Text style={styles.optionSubtitle}>
                Popular items are highlighted and appear first in the menu
              </Text>
            </View>
            <View style={[
              styles.toggle,
              isPopular && styles.toggleActive
            ]}>
              <View style={[
                styles.toggleThumb,
                isPopular && styles.toggleThumbActive
              ]}>
                {isPopular && <Star size={12} color="#FFFFFF" fill="#FFFFFF" />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionToggle}
            onPress={() => setIsAvailable(!isAvailable)}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Available for Order</Text>
              <Text style={styles.optionSubtitle}>
                Customers can order this item when available
              </Text>
            </View>
            <View style={[
              styles.toggle,
              isAvailable && styles.toggleActive
            ]}>
              <View style={[
                styles.toggleThumb,
                isAvailable && styles.toggleThumbActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={saving ? "Adding Item..." : "Add Menu Item"}
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
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
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
    height: 100,
    paddingTop: 12,
  },
  inputHelp: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategory: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  optionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitle: {
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
    justifyContent: 'center',
    alignItems: 'center',
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