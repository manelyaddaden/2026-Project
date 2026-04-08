import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { styles } from '../../styles/styles';

// Date Range Picker Component
export function DateRangePicker({ label, startDate, endDate, onSelect, showConfirmButton = true }) {
  const [tempStartDate, setTempStartDate] = useState(startDate ? new Date(startDate) : new Date());
  const [tempEndDate, setTempEndDate] = useState(endDate ? new Date(endDate) : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000));
  const [selecting, setSelecting] = useState('start');

  const handleDateChange = (day, isStart) => {
    const newDate = new Date(isStart ? tempStartDate : tempEndDate);
    newDate.setDate(newDate.getDate() + day);
    if (isStart) {
      setTempStartDate(newDate);
    } else {
      setTempEndDate(newDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleConfirm = () => {
    onSelect(tempStartDate.toISOString().split('T')[0], tempEndDate.toISOString().split('T')[0]);
  };

  const isSelectingStart = selecting === 'start';

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateRangeContainer}>
        {/* Start Date */}
        <View style={styles.dateRangeSection}>
          <Text style={styles.dateRangeLabel}>From</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => handleDateChange(-1, true)}
            >
              <Text style={styles.dateNavText}>◀</Text>
            </TouchableOpacity>
            <Pressable
              style={[styles.dateDisplay, isSelectingStart && styles.dateDisplayActive]}
              onPress={() => setSelecting('start')}
            >
              <Text style={styles.dateDisplayText}>{formatDate(tempStartDate)}</Text>
            </Pressable>
            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => handleDateChange(1, true)}
            >
              <Text style={styles.dateNavText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Date */}
        <View style={styles.dateRangeSection}>
          <Text style={styles.dateRangeLabel}>To</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => handleDateChange(-1, false)}
            >
              <Text style={styles.dateNavText}>◀</Text>
            </TouchableOpacity>
            <Pressable
              style={[styles.dateDisplay, !isSelectingStart && styles.dateDisplayActive]}
              onPress={() => setSelecting('end')}
            >
              <Text style={styles.dateDisplayText}>{formatDate(tempEndDate)}</Text>
            </Pressable>
            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => handleDateChange(1, false)}
            >
              <Text style={styles.dateNavText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {showConfirmButton && (
        <TouchableOpacity
          style={styles.dateConfirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.dateConfirmText}>Confirm Dates</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
