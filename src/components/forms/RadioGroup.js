import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/styles';

// Radio Button Group Component
export function RadioGroup({ label, value, options, onSelect }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.radioGroup}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioOption}
            onPress={() => onSelect(option.value)}
          >
            <View style={[
              styles.radioCircle,
              value === option.value && styles.radioCircleSelected
            ]}>
              {value === option.value && (
                <View style={styles.radioCircleInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
