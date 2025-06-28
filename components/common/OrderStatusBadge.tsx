import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CircleCheck as CheckCircle, Truck, Package, Circle as XCircle } from 'lucide-react-native';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    icon: CheckCircle,
  },
  preparing: {
    label: 'Preparing',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    icon: Package,
  },
  ready: {
    label: 'Ready',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    icon: CheckCircle,
  },
  picked_up: {
    label: 'Picked Up',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    icon: Truck,
  },
  on_the_way: {
    label: 'On the Way',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    icon: XCircle,
  },
};

export default function OrderStatusBadge({ 
  status, 
  size = 'medium', 
  showIcon = true 
}: OrderStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const IconComponent = config.icon;

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 10,
      iconSize: 12,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
      iconSize: 14,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
      iconSize: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: config.backgroundColor,
        paddingHorizontal: currentSize.paddingHorizontal,
        paddingVertical: currentSize.paddingVertical,
      }
    ]}>
      {showIcon && (
        <IconComponent 
          size={currentSize.iconSize} 
          color={config.color} 
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        {
          color: config.color,
          fontSize: currentSize.fontSize,
        }
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
  },
});