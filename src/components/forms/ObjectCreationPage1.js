import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { styles } from '../../styles/styles';
import { colors, categoryOptions, conditionOptions } from '../../utils/constants';
import { CategoryGrid } from '../common/CategoryGrid';
import { RadioGroup } from './RadioGroup';
import { DateRangePicker } from './DateRangePicker';
import { BottomNav } from '../common/BottomNav';
import { LeftSidebar } from '../common/LeftSidebar';

// Object Creation - Page 1: Basic Information
export function ObjectCreationPage1({ onNext, objectData, setObjectData, onNavigate, currentPage, onCancel }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const handleNext = () => {
    if (!objectData.name.trim()) {
      Alert.alert('Required', 'Please enter the object name');
      return;
    }
    if (!objectData.category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }
    if (!objectData.condition) {
      Alert.alert('Required', 'Please select the condition');
      return;
    }
    if (!objectData.startDate || !objectData.endDate) {
      Alert.alert('Required', 'Please select availability dates');
      return;
    }
    if (!objectData.pricePerDay || objectData.pricePerDay <= 0) {
      Alert.alert('Required', 'Please enter a valid price per day');
      return;
    }
    onNext();
  };

  return (
    <View style={isPhone ? styles.homeContainerMobile : styles.homeContainer}>
      {!isPhone && <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />}
      
      <View style={styles.homeContent}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          
          {/* Header */}
          <View style={styles.pageHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.pageTitle}>New Object</Text>
              <Text style={styles.pageSubtitle}>Step 1 of 2</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.pageContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={isPhone ? styles.scrollContentWithBottomNav : styles.scrollContent}
          >
            {/* Object Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Object Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Power Drill, Mountain Bike"
                placeholderTextColor={colors.lightText}
                value={objectData.name}
                onChangeText={(text) => setObjectData({...objectData, name: text})}
                maxLength={50}
              />
              <Text style={styles.charCount}>{objectData.name.length}/50</Text>
            </View>

            {/* Category Grid */}
            <CategoryGrid
              label="Category *"
              value={objectData.category}
              options={categoryOptions}
              onSelect={(category) => setObjectData({...objectData, category})}
            />

            {/* Condition Radio Buttons */}
            <RadioGroup
              label="Condition *"
              value={objectData.condition}
              options={conditionOptions}
              onSelect={(condition) => setObjectData({...objectData, condition})}
            />

            {/* Availability Date Range Picker */}
            <DateRangePicker
              label="Availability Period *"
              startDate={objectData.startDate}
              endDate={objectData.endDate}
              onSelect={(start, end) => setObjectData({...objectData, startDate: start, endDate: end})}
              showConfirmButton={false}
            />

            {/* Price Per Day */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price per Day (CAD$) *</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceSymbol}>CA$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.lightText}
                  keyboardType="number-pad"
                  value={objectData.pricePerDay}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    const parts = filtered.split('.');
                    const finalText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered;
                    setObjectData({...objectData, pricePerDay: finalText});
                  }}
                />
              </View>
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Next Button */}
          <View style={[styles.buttonContainer, isPhone && styles.buttonContainerAboveBottomNav]}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
      {isPhone && <BottomNav currentPage={currentPage} onNavigate={onNavigate} />}
    </View>
  );
}
