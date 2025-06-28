import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Modal, ScrollView } from 'react-native';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { ChevronDown, Check } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  style?: ViewStyle;
  disabled?: boolean;
}

export default function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select an option',
  options,
  style,
  disabled = false,
}: FormSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedOption = options.find(option => option.value === value);

        return (
          <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
              style={[
                styles.selectContainer,
                error && styles.selectError,
                disabled && styles.selectDisabled
              ]}
              onPress={() => !disabled && setIsOpen(true)}
              disabled={disabled}
            >
              <Text style={[
                styles.selectText,
                !selectedOption && styles.placeholderText
              ]}>
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
            
            {error && (
              <Text style={styles.errorText}>{error.message}</Text>
            )}

            <Modal
              visible={isOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setIsOpen(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setIsOpen(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{label}</Text>
                  </View>
                  <ScrollView style={styles.optionsList}>
                    {options.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionItem,
                          value === option.value && styles.selectedOption
                        ]}
                        onPress={() => {
                          onChange(option.value);
                          setIsOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.optionText,
                          value === option.value && styles.selectedOptionText
                        ]}>
                          {option.label}
                        </Text>
                        {value === option.value && (
                          <Check size={20} color="#FF6B35" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  selectError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  selectDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#FFF7F5',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    flex: 1,
  },
  selectedOptionText: {
    color: '#FF6B35',
    fontFamily: 'Inter-SemiBold',
  },
});