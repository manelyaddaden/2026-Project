import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { realtimeDb } from './firebaseConfig';
import { ref, set, onValue, remove } from 'firebase/database';
import { supabase } from './supabaseConfig';

// Color scheme - Modern, mature, professional
const colors = {
  primary: '#2E5090',
  secondary: '#4A90E2',
  accent: '#1ABC9C',
  background: '#FFFFFF',
  lightBg: '#F5F7FA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  border: '#D5DCEC',
  success: '#27AE60',
  warning: '#E67E22',
};

// Category Grid Component - Horizontal 2-line layout
function CategoryGrid({ label, value, options, onSelect }) {
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

// Radio Button Group Component
function RadioGroup({ label, value, options, onSelect }) {
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

// Date Range Picker Component
function DateRangePicker({ label, startDate, endDate, onSelect, showConfirmButton = true }) {
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

// Object Creation - Page 1: Basic Information
function ObjectCreationPage1({ onNext, objectData, setObjectData, onNavigate, currentPage }) {
  const categoryOptions = [
    { emoji: '🔧', label: 'Tools', value: 'tools' },
    { emoji: '⚽', label: 'Sports', value: 'sports' },
    { emoji: '🍳', label: 'Kitchen', value: 'kitchen' },
    { emoji: '🌱', label: 'Garden', value: 'garden' },
    { emoji: '💻', label: 'Electronics', value: 'electronics' },
    { emoji: '📚', label: 'Books', value: 'books' },
    { emoji: '🎮', label: 'Games', value: 'games' },
    { emoji: '👕', label: 'Clothing', value: 'clothing' },
  ];

  const conditionOptions = [
    { label: 'Like New', value: 'like-new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' },
  ];

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
    <View style={styles.homeContainer}>
      <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />
      
      <View style={styles.homeContent}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={() => {}}>
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
        contentContainerStyle={styles.scrollContent}
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
                // Only allow numbers and decimal point
                const filtered = text.replace(/[^0-9.]/g, '');
                // Prevent multiple decimal points
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
      <View style={styles.buttonContainer}>
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
    </View>
  );
}

// Function to upload image to Supabase and get URL
async function uploadImageToSupabase(imageUri) {
  try {
    // Generate unique filename (no nested path in filename)
    const timestamp = Date.now();
    const filename = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    console.log('🔄 Attempting to upload image to Supabase...');
    
    // Fetch the image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    console.log('📸 Image blob size:', blob.size, 'bytes');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
      });
    
    if (error) {
      console.error('❌ Supabase upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to upload image: ' + error.message);
    }
    
    console.log('✅ File uploaded, getting public URL...');
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to generate public URL');
    }
    
    console.log('✅ Image uploaded to Supabase:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Image upload error:', error);
    throw error;
  }
}

// Object Creation - Page 2: Description and Image
function ObjectCreationPage2({ onBack, onSubmit, objectData, setObjectData, onNavigate, currentPage }) {
  const [imageUri, setImageUri] = useState(objectData.image);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setObjectData({...objectData, image: result.assets[0].uri});
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setObjectData({...objectData, image: result.assets[0].uri});
    }
  };

  const handleSubmit = () => {
    console.log('ObjectCreationPage2 handleSubmit called');
    console.log('objectData:', objectData);
    console.log('imageUri:', imageUri);
    
    if (!objectData.description || !objectData.description.trim()) {
      Alert.alert('Required Field', 'Please enter a description');
      return;
    }
    
    if (!imageUri) {
      Alert.alert('Required Field', 'Please upload an image');
      return;
    }
    
    console.log('Validation passed, calling onSubmit()');
    onSubmit();
  };

  return (
    <View style={styles.homeContainer}>
      <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />
      
      <View style={styles.homeContent}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>New Object</Text>
          <Text style={styles.pageSubtitle}>Step 2 of 2</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.pageContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textAreaInput}
            placeholder="Describe your object in detail (condition, features, size, etc.)"
            placeholderTextColor={colors.lightText}
            value={objectData.description}
            onChangeText={(text) => setObjectData({...objectData, description: text})}
            maxLength={500}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{objectData.description.length}/500</Text>
        </View>

        {/* Image Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Object Photo *</Text>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.imageRemoveButton}
                onPress={() => {
                  setImageUri(null);
                  setObjectData({...objectData, image: null});
                }}
              >
                <Text style={styles.imageRemoveButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageUploadArea}>
              <Text style={styles.imageUploadIcon}>📸</Text>
              <Text style={styles.imageUploadText}>No image selected</Text>
            </View>
          )}

          <View style={styles.imageButtonContainer}>
            <TouchableOpacity
              style={[styles.imageButton, styles.imageButtonSecondary]}
              onPress={pickImage}
            >
              <Text style={styles.imageButtonIcon}>🖼️</Text>
              <Text style={styles.imageButtonText}>From Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageButton, styles.imageButtonSecondary]}
              onPress={takePhoto}
            >
              <Text style={styles.imageButtonIcon}>📷</Text>
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.85}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>Post ✓</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
      </View>
    </View>
  );
}

// Category Page Component
function CategoryPage({ categoryValue, onBack, objects, onNavigate, currentPage }) {
  const categoryOptions = [
    { emoji: '🔧', label: 'Tools', value: 'tools' },
    { emoji: '⚽', label: 'Sports', value: 'sports' },
    { emoji: '🍳', label: 'Kitchen', value: 'kitchen' },
    { emoji: '🌱', label: 'Garden', value: 'garden' },
    { emoji: '💻', label: 'Electronics', value: 'electronics' },
    { emoji: '📚', label: 'Books', value: 'books' },
    { emoji: '🎮', label: 'Games', value: 'games' },
    { emoji: '👕', label: 'Clothing', value: 'clothing' },
  ];

  const category = categoryOptions.find(c => c.value === categoryValue);
  const filteredObjects = objects.filter(obj => obj.category === categoryValue);

  return (
    <View style={styles.homeContainer}>
      <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />
      
      <View style={styles.homeContent}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.categoryHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backHeaderButton}>
          <Text style={styles.backHeaderButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.categoryHeaderContent}>
          <Text style={styles.categoryHeaderEmoji}>{category?.emoji}</Text>
          <View>
            <Text style={styles.categoryHeaderTitle}>{category?.label}</Text>
            <Text style={styles.categoryHeaderCount}>{filteredObjects.length} items</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {filteredObjects.length > 0 ? (
        <FlatList
          data={filteredObjects}
          renderItem={({ item }) => (
            <View style={styles.objectCard}>
              <Image
                source={{ uri: item.image }}
                style={styles.objectCardImage}
              />
              <View style={styles.objectCardContent}>
                <Text style={styles.objectCardName}>{item.name}</Text>
                <Text style={styles.objectCardCondition}>Condition: {item.condition}</Text>
                <View style={styles.objectCardFooter}>
                  <Text style={styles.objectCardPrice}>CA${parseFloat(item.pricePerDay).toFixed(2)}/day</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>📭</Text>
          <Text style={styles.emptyStateTitle}>No items in this category</Text>
          <Text style={styles.emptyStateText}>Check back later or try another category</Text>
        </View>
      )}
      </SafeAreaView>
      </View>
    </View>
  );
}

// Left Sidebar Navigation
function LeftSidebar({ currentPage, onNavigate }) {
  return (
    <View style={styles.leftSidebar}>
      <View style={styles.sidebarBrand}>
        <Text style={styles.sidebarBrandText}>NL</Text>
      </View>
      
      <View style={styles.sidebarNav}>
        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'home' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('home')}
        >
          <Text style={styles.sidebarNavIcon}>🏠</Text>
          <Text style={styles.sidebarNavLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'search' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('search')}
        >
          <Text style={styles.sidebarNavIcon}>🔍</Text>
          <Text style={styles.sidebarNavLabel}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, (currentPage === 'creation1' || currentPage === 'creation2') && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('creation1')}
        >
          <Text style={styles.sidebarNavIcon}>➕</Text>
          <Text style={styles.sidebarNavLabel}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'messages' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('messages')}
        >
          <Text style={styles.sidebarNavIcon}>💬</Text>
          <Text style={styles.sidebarNavLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, currentPage === 'profile' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('profile')}
        >
          <Text style={styles.sidebarNavIcon}>👤</Text>
          <Text style={styles.sidebarNavLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Home Page Component
function HomePage({ onCreateObject, onCategorySelect, objects, onNavigate, currentPage }) {
  const [searchQuery, setSearchQuery] = useState('');

  const categoryOptions = [
    { emoji: '🔧', label: 'Tools', value: 'tools' },
    { emoji: '⚽', label: 'Sports', value: 'sports' },
    { emoji: '🍳', label: 'Kitchen', value: 'kitchen' },
    { emoji: '🌱', label: 'Garden', value: 'garden' },
    { emoji: '💻', label: 'Electronics', value: 'electronics' },
    { emoji: '📚', label: 'Books', value: 'books' },
    { emoji: '🎮', label: 'Games', value: 'games' },
    { emoji: '👕', label: 'Clothing', value: 'clothing' },
  ];

  const filteredObjects = objects.filter(obj =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.homeContainer}>
      <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />
      
      <View style={styles.homeContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NeighborLend</Text>
        <Text style={styles.headerSubtitle}>Share with your community</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.lightText}
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoriesGrid}>
            {categoryOptions.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={styles.categoryCard}
                onPress={() => onCategorySelect(category.value)}
              >
                <Text style={styles.categoryCardEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryCardName}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Items Section */}
        {filteredObjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Items ({filteredObjects.length})</Text>
            <View style={styles.objectsGridContainer}>
              {filteredObjects.map((item) => (
                <View key={item.id} style={styles.objectGridItem}>
                  <View style={styles.objectCard}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.objectCardImage}
                    />
                    <View style={styles.objectCardContent}>
                      <Text style={styles.objectCardName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.objectCardPrice}>CA${parseFloat(item.pricePerDay).toFixed(2)}/day</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {searchQuery && filteredObjects.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No items found</Text>
            <Text style={styles.emptyStateText}>Try a different search term</Text>
          </View>
        )}

        {objects.length === 0 && !searchQuery && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🎉</Text>
            <Text style={styles.emptyStateTitle}>No items yet</Text>
            <Text style={styles.emptyStateText}>Be the first to share an item!</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
      </View>
    </View>
  );
}

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [objects, setObjects] = useState([]);
  const [objectData, setObjectData] = useState({
    name: '',
    category: '',
    condition: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pricePerDay: '',
    description: '',
    image: null,
  });

  // Load objects from Firebase on component mount
  useEffect(() => {
    const objectsRef = ref(realtimeDb, 'objects');
    const unsubscribe = onValue(objectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const objectsList = Object.values(data);
        setObjects(objectsList);
      } else {
        setObjects([]);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleCreateObject = () => {
    setCurrentPage('creation1');
  };

  const handleNextPage = () => {
    setCurrentPage('creation2');
  };

  const handleBackPage = () => {
    setCurrentPage('creation1');
  };

  const handleCategorySelect = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setCurrentPage('category');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedCategory(null);
  };

  const handleSubmit = () => {
    try {
      // Validate all required data before saving
      if (!objectData.name?.trim()) {
        Alert.alert('Validation Error', 'Object name is required');
        return;
      }
      if (!objectData.category) {
        Alert.alert('Validation Error', 'Category is required');
        return;
      }
      if (!objectData.condition) {
        Alert.alert('Validation Error', 'Condition is required');
        return;
      }
      if (!objectData.startDate || !objectData.endDate) {
        Alert.alert('Validation Error', 'Availability dates are required');
        return;
      }
      if (!objectData.pricePerDay || parseFloat(objectData.pricePerDay) <= 0) {
        Alert.alert('Validation Error', 'Valid price per day is required');
        return;
      }
      if (!objectData.description?.trim()) {
        Alert.alert('Validation Error', 'Description is required');
        return;
      }
      if (!objectData.image) {
        Alert.alert('Validation Error', 'An image is required');
        return;
      }

      // Show loading alert
      Alert.alert('Uploading...', 'Uploading your image to Supabase...');

      const objectId = Math.random().toString(36).substr(2, 9);
      
      // Upload image to Supabase first
      uploadImageToSupabase(objectData.image)
        .then((imageUrl) => {
          // Create object with Supabase image URL
          const newObject = {
            id: objectId,
            name: objectData.name.trim(),
            category: objectData.category,
            condition: objectData.condition,
            startDate: objectData.startDate,
            endDate: objectData.endDate,
            pricePerDay: objectData.pricePerDay.toString(),
            description: objectData.description.trim(),
            imageUrl: imageUrl, // Store Supabase image URL
            timestamp: new Date().toISOString(),
          };
          
          console.log('Saving object to Firebase with image URL:', newObject);
          
          // Save to Firebase Realtime Database
          const objectRef = ref(realtimeDb, 'objects/' + objectId);
          set(objectRef, newObject)
            .then(() => {
              console.log('✅ Object saved successfully to Firebase');
              // Only update local state after successful Firebase save
              setObjects([...objects, newObject]);
              
              // Create detailed confirmation message
              const categoryOptions = [
                { emoji: '🔧', label: 'Tools', value: 'tools' },
                { emoji: '⚽', label: 'Sports', value: 'sports' },
                { emoji: '🍳', label: 'Kitchen', value: 'kitchen' },
                { emoji: '🌱', label: 'Garden', value: 'garden' },
                { emoji: '💻', label: 'Electronics', value: 'electronics' },
                { emoji: '📚', label: 'Books', value: 'books' },
                { emoji: '🎮', label: 'Games', value: 'games' },
                { emoji: '👕', label: 'Clothing', value: 'clothing' },
              ];
              const categoryLabel = categoryOptions.find(c => c.value === objectData.category)?.label;
              
              const confirmationMessage = `✓ "${objectData.name}" posted!\n\n📂 Category: ${categoryLabel}\n💰 CA$${parseFloat(objectData.pricePerDay).toFixed(2)}/day\n📅 ${objectData.startDate} to ${objectData.endDate}\n\nYour item is now visible to neighbors!`;
              
              Alert.alert('Success', confirmationMessage);
              
              // Reset data
              setObjectData({
                name: '',
                category: '',
                condition: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                pricePerDay: '',
                description: '',
                image: null,
              });
              setCurrentPage('home');
            })
            .catch((error) => {
              console.error('❌ Firebase save error:', error);
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);
              console.error('Full error:', JSON.stringify(error, null, 2));
              Alert.alert('Error Saving Object', 'Failed to save object:\n' + error.message);
            });
        })
        .catch((error) => {
          console.error('❌ Image upload error:', error);
          Alert.alert('Upload Error', 'Failed to upload image:\n' + error.message);
        });
    } catch (error) {
      console.error('Unexpected error in handleSubmit:', error);
      Alert.alert('Unexpected Error', 'An unexpected error occurred: ' + error.message);
    }
  };

  const handleNavigation = (page) => {
    if (page === 'creation1') {
      handleCreateObject();
    } else {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {currentPage === 'home' && (
        <HomePage 
          onCreateObject={handleCreateObject}
          onCategorySelect={handleCategorySelect}
          objects={objects}
          onNavigate={handleNavigation}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'category' && (
        <CategoryPage
          categoryValue={selectedCategory}
          onBack={handleBackToHome}
          objects={objects}
          onNavigate={handleNavigation}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'creation1' && (
        <ObjectCreationPage1
          onNext={handleNextPage}
          objectData={objectData}
          setObjectData={setObjectData}
          onNavigate={handleNavigation}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'creation2' && (
        <ObjectCreationPage2
          onBack={handleBackPage}
          onSubmit={handleSubmit}
          objectData={objectData}
          setObjectData={setObjectData}
          onNavigate={handleNavigation}
          currentPage={currentPage}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Header Styles
  header: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Page Header (for creation pages)
  pageHeader: {
    backgroundColor: colors.primary,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Category Header
  categoryHeader: {
    backgroundColor: colors.primary,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backHeaderButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backHeaderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  categoryHeaderEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryHeaderCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Page Content
  pageContent: {
    flex: 1,
  },

  // Input Styles
  inputGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textAreaInput: {
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 6,
    textAlign: 'right',
  },

  // Dropdown Styles
  dropdownButton: {
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(46, 80, 144, 0.05)',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.lightText,
  },
  dropdownMenu: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Radio Button Styles
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },

  // Date Range Picker Styles
  dateRangeContainer: {
    gap: 14,
  },
  dateRangeSection: {
    gap: 8,
  },
  dateRangeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.lightText,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateNavButton: {
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  dateDisplay: {
    flex: 1,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateDisplayActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(46, 80, 144, 0.05)',
  },
  dateDisplayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dateConfirmButton: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  dateConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Price Input Styles
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  priceSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },

  // Image Upload Styles
  imageUploadArea: {
    backgroundColor: colors.lightBg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  imageUploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  imageUploadText: {
    fontSize: 16,
    color: colors.lightText,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageRemoveButtonText: {
    fontSize: 24,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  imageButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  imageButtonSecondary: {
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  imageButtonIcon: {
    fontSize: 20,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    flex: 0.35,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    flex: 0.65,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Home Page Specific Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 16,
    marginBottom: 12,
  },

  // Category Styles
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.background,
    margin: '1%',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryCardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryCardName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Object Grid Styles
  objectsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  objectGridItem: {
    width: '48%',
    margin: '1%',
  },
  objectCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  objectCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.lightBg,
  },
  objectCardContent: {
    padding: 12,
  },
  objectCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  objectCardCondition: {
    fontSize: 12,
    color: colors.lightText,
    marginBottom: 8,
  },
  objectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objectCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.lightText,
    textAlign: 'center',
  },

  // Navigation Styles
  bottomSpacing: {
    height: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    color: colors.lightText,
  },
  navTextActive: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  // Misc
  spacer: {
    height: 30,
  },

  // Left Sidebar Styles
  homeContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  homeContent: {
    flex: 1,
    flexDirection: 'column',
  },
  leftSidebar: {
    width: 80,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sidebarBrand: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarBrandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  sidebarNav: {
    gap: 16,
  },
  sidebarNavItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarNavItemActive: {
    backgroundColor: colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sidebarNavIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  sidebarNavLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Category Grid Styles
  categoryGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryGridItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  categoryGridItemSelected: {
    backgroundColor: 'rgba(46, 80, 144, 0.1)',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  categoryGridEmoji: {
    fontSize: 24,
  },
  categoryGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  categoryGridLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});