import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { User, Store, Truck } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  runOnJS
} from 'react-native-reanimated';

interface UserTypeOption {
  id: 'customer' | 'restaurant' | 'delivery';
  title: string;
  description: string;
  icon: typeof User;
  color: string;
  gradient: string[];
}

interface UserTypeSelectorProps {
  selectedType: 'customer' | 'restaurant' | 'delivery';
  onSelect: (type: 'customer' | 'restaurant' | 'delivery') => void;
}

const userTypeOptions: UserTypeOption[] = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'Order delicious food from your favorite restaurants',
    icon: User,
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'],
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Manage your restaurant, menu, and incoming orders',
    icon: Store,
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'delivery',
    title: 'Delivery Driver',
    description: 'Deliver food to customers and earn money on your schedule',
    icon: Truck,
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
  },
];

export default function UserTypeSelector({ selectedType, onSelect }: UserTypeSelectorProps) {
  // Shared values for each card
  const animationValues = useRef(
    userTypeOptions.reduce((acc, option) => {
      acc[option.id] = {
        scale: useSharedValue(1),
        elevation: useSharedValue(0),
        borderOpacity: useSharedValue(0),
        iconScale: useSharedValue(1),
        glowOpacity: useSharedValue(0),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  // Trigger haptic feedback (only on mobile platforms)
  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      // For mobile platforms, you would use:
      // import * as Haptics from 'expo-haptics';
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // For now, we'll simulate with a console log
      console.log('Haptic feedback triggered');
    }
  };

  // Animation for card selection
  const animateCardSelection = (cardId: string, isSelected: boolean) => {
    const animations = animationValues[cardId];
    
    if (isSelected) {
      // Selection animation sequence
      animations.scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1.02, { damping: 15, stiffness: 300 }),
        withTiming(1, { duration: 150 })
      );

      // Icon pulse animation
      animations.iconScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );

      // Glow effect
      animations.glowOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 500 })
      );

      // Elevation animation (Android shadow)
      animations.elevation.value = withTiming(8, { duration: 200 });

      // Border animation (using opacity instead of borderWidth)
      animations.borderOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // Deselection animation
      animations.scale.value = withTiming(1, { duration: 200 });
      animations.elevation.value = withTiming(0, { duration: 200 });
      animations.borderOpacity.value = withTiming(0, { duration: 200 });
      animations.iconScale.value = withTiming(1, { duration: 200 });
    }
  };

  // Handle card press
  const handleCardPress = (option: UserTypeOption) => {
    // Trigger haptic feedback
    runOnJS(triggerHapticFeedback)();
    
    // Animate all cards
    userTypeOptions.forEach((opt) => {
      animateCardSelection(opt.id, opt.id === option.id);
    });
    
    // Call the selection handler
    runOnJS(onSelect)(option.id);
  };

  // Initialize animations when selectedType changes
  useEffect(() => {
    userTypeOptions.forEach((option) => {
      animateCardSelection(option.id, option.id === selectedType);
    });
  }, [selectedType]);

  return (
    <View style={styles.container}>
      {userTypeOptions.map((option) => {
        const IconComponent = option.icon;
        const isSelected = selectedType === option.id;
        const animations = animationValues[option.id];

        const animatedCardStyle = useAnimatedStyle(() => ({
          transform: [{ scale: animations.scale.value }],
          elevation: animations.elevation.value,
        }));

        const animatedBorderStyle = useAnimatedStyle(() => ({
          opacity: animations.borderOpacity.value,
        }));

        const animatedIconStyle = useAnimatedStyle(() => ({
          transform: [{ scale: animations.iconScale.value }],
        }));

        const animatedGlowStyle = useAnimatedStyle(() => ({
          opacity: animations.glowOpacity.value,
        }));

        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.8}
            onPress={() => handleCardPress(option)}
          >
            <Animated.View
              style={[
                styles.card,
                animatedCardStyle,
                {
                  backgroundColor: isSelected ? `${option.color}08` : '#FFFFFF',
                },
              ]}
            >
              {/* Animated border overlay */}
              <Animated.View
                style={[
                  styles.borderOverlay,
                  animatedBorderStyle,
                  {
                    borderColor: option.color,
                  },
                ]}
              />

              {/* Glow effect overlay */}
              <Animated.View
                style={[
                  styles.glowOverlay,
                  animatedGlowStyle,
                  {
                    backgroundColor: `${option.color}20`,
                  },
                ]}
              />

              <View style={styles.cardContent}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    animatedIconStyle,
                    {
                      backgroundColor: isSelected ? option.color : '#F3F4F6',
                    },
                  ]}
                >
                  <IconComponent
                    size={28}
                    color={isSelected ? '#FFFFFF' : '#6B7280'}
                  />
                </Animated.View>

                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.title,
                      { color: isSelected ? option.color : '#111827' },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      { color: isSelected ? '#374151' : '#6B7280' },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>

                {/* Selection indicator */}
                {isSelected && (
                  <Animated.View
                    style={[
                      styles.selectionIndicator,
                      { backgroundColor: option.color },
                    ]}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </Animated.View>
                )}
              </View>

              {/* Ripple effect for visual feedback */}
              <Animated.View
                style={[
                  styles.rippleEffect,
                  animatedGlowStyle,
                  {
                    backgroundColor: `${option.color}15`,
                  },
                ]}
              />
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  selectionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  rippleEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});