import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

interface FormToggleProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function FormToggle<T extends FieldValues>({
  control,
  name,
  label,
  description,
  style,
  disabled = false,
}: FormToggleProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={[styles.container, style]}>
          <TouchableOpacity
            style={[
              styles.toggleContainer,
              disabled && styles.toggleDisabled
            ]}
            onPress={() => !disabled && onChange(!value)}
            disabled={disabled}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.label}>{label}</Text>
              {description && (
                <Text style={styles.description}>{description}</Text>
              )}
            </View>
            <View style={[
              styles.toggle,
              value && styles.toggleActive,
              disabled && styles.toggleDisabledState
            ]}>
              <View style={[
                styles.toggleThumb,
                value && styles.toggleThumbActive
              ]} />
            </View>
          </TouchableOpacity>
          
          {error && (
            <Text style={styles.errorText}>{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  toggleContainer: {
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
  toggleDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
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
  toggleDisabledState: {
    backgroundColor: '#D1D5DB',
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
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    marginLeft: 4,
  },
});