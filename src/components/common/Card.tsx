import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  noPadding?: boolean;
}

export default function Card({ children, style, onPress, noPadding }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, noPadding && styles.noPadding, style]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  noPadding: { padding: 0, overflow: 'hidden' },
});
