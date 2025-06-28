import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Star, X } from 'lucide-react-native';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { getCategories } from '@/utils/database';
import { Category } from '@/types/database';

export default function Filters() {
  const params = useLocalSearchParams();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDeliveryFee, setMaxDeliveryFee] = useState<number>(50);
  const [showPromotedOnly, setShowPromotedOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadCurrentFilters();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentFilters = () => {
    // Load current filter values from params
    if (params.selectedCuisines) {
      try {
        setSelectedCuisines(JSON.parse(params.selectedCuisines as string));
      } catch (e) {
        console.error('Error parsing selectedCuisines:', e);
      }
    }
    if (params.minRating) {
      setMinRating(parseFloat(params.minRating as string));
    }
    if (params.maxDeliveryFee) {
      setMaxDeliveryFee(parseFloat(params.maxDeliveryFee as string));
    }
    if (params.showPromotedOnly) {
      setShowPromotedOnly(params.showPromotedOnly === 'true');
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const setRating = (rating: number) => {
    setMinRating(rating === minRating ? 0 : rating);
  };

  const deliveryFeeOptions = [
    { label: 'Any', value: 50 },
    { label: 'Under $5', value: 5 },
    { label: 'Under $3', value: 3 },
    { label: 'Free delivery', value: 0 },
  ];

  const applyFilters = () => {
    router.setParams({
      selectedCuisines: JSON.stringify(selectedCuisines),
      minRating: minRating.toString(),
      maxDeliveryFee: maxDeliveryFee.toString(),
      showPromotedOnly: showPromotedOnly.toString(),
    });
    router.back();
  };

  const clearFilters = () => {
    setSelectedCuisines([]);
    setMinRating(0);
    setMaxDeliveryFee(50);
    setShowPromotedOnly(false);
  };

  const hasActiveFilters = selectedCuisines.length > 0 || minRating > 0 || maxDeliveryFee < 50 || showPromotedOnly;

  // Get unique cuisines from categories
  const cuisines = [...new Set(categories.map(cat => cat.name))];

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Filters" 
        showBackButton 
        rightComponent={
          hasActiveFilters ? (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cuisine Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisine</Text>
          <View style={styles.cuisineGrid}>
            {cuisines.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.cuisineChip,
                  selectedCuisines.includes(cuisine) && styles.selectedChip
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text style={[
                  styles.cuisineChipText,
                  selectedCuisines.includes(cuisine) && styles.selectedChipText
                ]}>
                  {cuisine}
                </Text>
                {selectedCuisines.includes(cuisine) && (
                  <X size={16} color="#FFFFFF" style={styles.chipIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rating Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingOption}
                onPress={() => setRating(rating)}
              >
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      color={star <= rating ? "#FFB800" : "#E5E7EB"}
                      fill={star <= rating ? "#FFB800" : "transparent"}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>{rating}+ stars</Text>
                <View style={[
                  styles.radioButton,
                  minRating === rating && styles.selectedRadio
                ]}>
                  {minRating === rating && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Fee Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Fee</Text>
          <View style={styles.deliveryFeeContainer}>
            {deliveryFeeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.deliveryFeeOption}
                onPress={() => setMaxDeliveryFee(option.value)}
              >
                <Text style={styles.deliveryFeeText}>{option.label}</Text>
                <View style={[
                  styles.radioButton,
                  maxDeliveryFee === option.value && styles.selectedRadio
                ]}>
                  {maxDeliveryFee === option.value && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promoted Only Filter */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.promotedToggle}
            onPress={() => setShowPromotedOnly(!showPromotedOnly)}
          >
            <View>
              <Text style={styles.promotedTitle}>Promoted restaurants only</Text>
              <Text style={styles.promotedSubtitle}>Show only featured restaurants</Text>
            </View>
            <View style={[
              styles.toggle,
              showPromotedOnly && styles.toggleActive
            ]}>
              <View style={[
                styles.toggleThumb,
                showPromotedOnly && styles.toggleThumbActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={`Apply Filters${hasActiveFilters ? ` (${[
            selectedCuisines.length > 0 && selectedCuisines.length,
            minRating > 0 && '1',
            maxDeliveryFee < 50 && '1',
            showPromotedOnly && '1'
          ].filter(Boolean).reduce((a, b) => Number(a) + Number(b), 0)})` : ''}`}
          onPress={applyFilters}
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
  clearText: {
    fontSize: 16,
    color: '#FF6B35',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedChip: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  cuisineChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  chipIcon: {
    marginLeft: 4,
  },
  ratingContainer: {
    gap: 12,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  ratingText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#FF6B35',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  deliveryFeeContainer: {
    gap: 12,
  },
  deliveryFeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deliveryFeeText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  promotedToggle: {
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
  promotedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  promotedSubtitle: {
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});