import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/styles';

// Category Grid Component - Horizontal 2-line layout
export function CategoryGrid({ label, value, options, onSelect }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.categoryGridContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.categoryGridItem,
              value === option.value && styles.categoryGridItemSelected
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={styles.categoryGridEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.categoryGridLabel,
              value === option.value && styles.categoryGridLabelSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
