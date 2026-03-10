import React, { useState } from 'react';
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

// Color scheme
const colors = {
  primary: '#6366F1',
  secondary: '#EC4899',
  background: '#FFFFFF',
  lightBg: '#F8F9FA',
  text: '#1F2937',
  lightText: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
};

// Dropdown Component
function Dropdown({ label, value, options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonActive]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownButtonText}>
          {value ? options.find(o => o.value === value)?.label || value : `Select ${label}`}
        </Text>
        <Text style={styles.dropdownIcon}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                value === option.value && styles.dropdownItemTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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

// Date Picker Component
function DatePickerInput({ label, value, onSelect }) {
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());

  const handleDateChange = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + day);
    setSelectedDate(newDate);
    onSelect(newDate.toISOString().split('T')[0]);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.datePickerContainer}>
        <TouchableOpacity
          style={styles.dateNavButton}
          onPress={() => handleDateChange(-1)}
        >
          <Text style={styles.dateNavText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateDisplayText}>{formatDate(selectedDate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.dateNavButton}
          onPress={() => handleDateChange(1)}
        >
          <Text style={styles.dateNavText}>▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Object Creation - Page 1: Basic Information
function ObjectCreationPage1({ onNext, objectData, setObjectData }) {
  const categoryOptions = [
    { label: 'Tools', value: 'tools' },
    { label: 'Sports', value: 'sports' },
    { label: 'Kitchen', value: 'kitchen' },
    { label: 'Garden', value: 'garden' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Books', value: 'books' },
    { label: 'Games', value: 'games' },
    { label: 'Clothing', value: 'clothing' },
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
    if (!objectData.availability) {
      Alert.alert('Required', 'Please select an availability date');
      return;
    }
    if (!objectData.pricePerDay || objectData.pricePerDay <= 0) {
      Alert.alert('Required', 'Please enter a valid price per day');
      return;
    }
    onNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Add New Object</Text>
        <Text style={styles.pageSubtitle}>Step 1 of 2: Basic Information</Text>
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

        {/* Category Dropdown */}
        <Dropdown
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

        {/* Availability Date Picker */}
        <DatePickerInput
          label="Availability Date *"
          value={objectData.availability}
          onSelect={(availability) => setObjectData({...objectData, availability})}
        />

        {/* Price Per Day */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per Day (€) *</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.priceSymbol}>€</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor={colors.lightText}
              keyboardType="decimal-pad"
              value={objectData.pricePerDay}
              onChangeText={(text) => setObjectData({...objectData, pricePerDay: text})}
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
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next Step →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Object Creation - Page 2: Description and Image
function ObjectCreationPage2({ onBack, onSubmit, objectData, setObjectData }) {
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
    if (!objectData.description.trim()) {
      Alert.alert('Required', 'Please enter a description');
      return;
    }
    if (!imageUri) {
      Alert.alert('Required', 'Please upload an image');
      return;
    }
    onSubmit();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Add New Object</Text>
        <Text style={styles.pageSubtitle}>Step 2 of 2: Description & Image</Text>
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
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Post Object ✓</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Home Page Component
function HomePage({ onCreateObject }) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 1, name: 'Tools', icon: '🔧' },
    { id: 2, name: 'Sports', icon: '⚽' },
    { id: 3, name: 'Kitchen', icon: '🍳' },
    { id: 4, name: 'Garden', icon: '🌱' },
    { id: 5, name: 'Electronics', icon: '💻' },
    { id: 6, name: 'Books', icon: '📚' },
    { id: 7, name: 'Games', icon: '🎮' },
  ];

  const nearbyItems = [
    { id: 1, name: 'Power Drill', owner: 'Sarah M.', distance: '0.3 km', available: true },
    { id: 2, name: 'Ladder', owner: 'John D.', distance: '0.5 km', available: true },
    { id: 3, name: 'Tent (4-person)', owner: 'Mike R.', distance: '0.8 km', available: false },
    { id: 4, name: 'Projector', owner: 'Emma L.', distance: '1.2 km', available: true },
  ];

  return (
    <>
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
            placeholder="What do you need to borrow?"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => console.log('Category pressed:', category.name)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Nearby</Text>
          {nearbyItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => console.log('Item pressed:', item.name)}
            >
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImageIcon}>📦</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemOwner}>👤 {item.owner}</Text>
                <Text style={styles.itemDistance}>📍 {item.distance} away</Text>
              </View>
              <View style={styles.itemStatus}>
                <View
                  style={[
                    styles.statusBadge,
                    item.available ? styles.availableBadge : styles.unavailableBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.available ? styles.availableText : styles.unavailableText,
                    ]}
                  >
                    {item.available ? 'Available' : 'In Use'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation with Create Button */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={onCreateObject}
        >
          <Text style={styles.navIcon}>➕</Text>
          <Text style={styles.navText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [objectData, setObjectData] = useState({
    name: '',
    category: '',
    condition: '',
    availability: new Date().toISOString().split('T')[0],
    pricePerDay: '',
    description: '',
    image: null,
  });

  const handleCreateObject = () => {
    setCurrentPage('creation1');
  };

  const handleNextPage = () => {
    setCurrentPage('creation2');
  };

  const handleBackPage = () => {
    setCurrentPage('creation1');
  };

  const handleSubmit = () => {
    console.log('Object submitted:', objectData);
    Alert.alert('Success', 'Your object has been posted!');
    // Reset data
    setObjectData({
      name: '',
      category: '',
      condition: '',
      availability: new Date().toISOString().split('T')[0],
      pricePerDay: '',
      description: '',
      image: null,
    });
    setCurrentPage('home');
  };

  return (
    <>
      {currentPage === 'home' && (
        <HomePage onCreateObject={handleCreateObject} />
      )}
      {currentPage === 'creation1' && (
        <ObjectCreationPage1
          onNext={handleNextPage}
          objectData={objectData}
          setObjectData={setObjectData}
        />
      )}
      {currentPage === 'creation2' && (
        <ObjectCreationPage2
          onBack={handleBackPage}
          onSubmit={handleSubmit}
          objectData={objectData}
          setObjectData={setObjectData}
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

  // Header Styles
  header: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },

  // Page Header (for creation pages)
  pageHeader: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  pageContent: {
    flex: 1,
  },

  // Input Styles
  inputGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textAreaInput: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 4,
    textAlign: 'right',
  },

  // Dropdown Styles
  dropdownButton: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonActive: {
    borderColor: colors.primary,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
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

  // Date Picker Styles
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateNavButton: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  dateDisplay: {
    flex: 1,
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateDisplayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },

  // Price Input Styles
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  priceSymbol: {
    fontSize: 18,
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
    borderRadius: 12,
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
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    borderRadius: 12,
    gap: 8,
  },
  imageButtonSecondary: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
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
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    flex: 0.4,
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    flex: 0.6,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#fff',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImageIcon: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemOwner: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  itemDistance: {
    fontSize: 13,
    color: '#666',
  },
  itemStatus: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
  },
  unavailableBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableText: {
    color: '#2E7D32',
  },
  unavailableText: {
    color: '#C62828',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 2,
  },
  navText: {
    fontSize: 10,
    color: '#999',
  },
  navTextActive: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },

  // Misc
  spacer: {
    height: 30,
  },
});
