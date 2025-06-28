import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

interface RememberMeCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function RememberMeCheckbox({ 
  checked, 
  onToggle, 
  disabled = false 
}: RememberMeCheckboxProps) {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        disabled && styles.checkboxDisabled
      ]}>
        {checked && (
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          Remember me
        </Text>
        <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
          Keep me signed in on this device
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkboxDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  descriptionDisabled: {
    color: '#9CA3AF',
  },
});