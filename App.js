import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { realtimeDb } from './firebaseConfig';
import { ref, set, onValue, get, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { supabase } from './supabaseConfig';
import { AuthProvider, AuthContext } from './AuthContext';
import { AuthScreen } from './AuthScreen';
import { AdminPanel } from './AdminPanel';
import { ReportUserModal } from './ReportUserModal';

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

function legacySellerKeyFromUsername(username) {
  if (!username) return null;
  return 'legacy_' + String(username).replace(/[.#$\[\]\/\s]/g, '_');
}

function getSellerKeyForProduct(product, sellerUsernameFallback) {
  if (!product) return null;
  // Use ownerUid if available and not null/empty
  if (product.ownerUid && product.ownerUid.trim?.() !== '') {
    return product.ownerUid;
  }
  // Fall back to username-based key
  const sellerName = product.username || sellerUsernameFallback;
  if (!sellerName) return null;
  return legacySellerKeyFromUsername(sellerName);
}

function isViewerTheSeller(product, viewerUid, viewerUsername, sellerUsernameFallback) {
  if (!product) return false;
  if (product.ownerUid && viewerUid) return product.ownerUid === viewerUid;
  const sellerName = product.username || sellerUsernameFallback;
  if (sellerName && viewerUsername) return sellerName === viewerUsername;
  return false;
}

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
function ObjectCreationPage1({ onNext, objectData, setObjectData, onNavigate, currentPage, onCancel }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

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

      {/* Next Button — extra bottom inset so tab bar does not cover it */}
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
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const [imageUri, setImageUri] = useState(objectData.image);

  // Sync imageUri with objectData.image to prevent state desync
  useEffect(() => {
    setImageUri(objectData.image);
  }, [objectData.image]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // Android's edit UI only shows Back + resize/crop — skip it; image still previews in-app
      allowsEditing: Platform.OS === 'ios',
      ...(Platform.OS === 'ios' ? { aspect: [4, 3] } : {}),
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
      allowsEditing: Platform.OS === 'ios',
      ...(Platform.OS === 'ios' ? { aspect: [4, 3] } : {}),
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
    <View style={isPhone ? styles.homeContainerMobile : styles.homeContainer}>
      {!isPhone && <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />}
      
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
        contentContainerStyle={isPhone ? styles.scrollContentWithBottomNav : styles.scrollContent}
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

      {/* Action Buttons — extra bottom inset so tab bar does not cover Post / Back */}
      <View style={[styles.buttonContainer, isPhone && styles.buttonContainerAboveBottomNav]}>
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
      {isPhone && <BottomNav currentPage={currentPage} onNavigate={onNavigate} />}
    </View>
  );
}

// Product Detail Screen Component
function ProductDetailScreen({ product, onBack, username, onSellerSelect }) {
  const { user, username: authUsername } = useContext(AuthContext);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [sellerPhoneNumber, setSellerPhoneNumber] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

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

  const categoryLabel = categoryOptions.find(c => c.value === product.category)?.label;
  const categoryEmoji = categoryOptions.find(c => c.value === product.category)?.emoji;
  // Get a valid seller identifier
  const sellerKey = getSellerKeyForProduct(product, username);
  // Check if current viewer is the seller of this product
  const iAmSeller = isViewerTheSeller(product, user?.uid, authUsername, username);
  // Determine if review button should be enabled
  const canReview = !iAmSeller && !myReview && !!sellerKey;

  useEffect(() => {
    if (!user?.uid || !product?.id) {
      setMyReview(null);
      return;
    }
    const r = ref(realtimeDb, `itemReviews/${product.id}/${user.uid}`);
    const unsub = onValue(r, (snapshot) => {
      setMyReview(snapshot.val());
    });
    return () => unsub();
  }, [product?.id, user?.uid]);

  // Fetch seller phone number
  useEffect(() => {
    if (!product?.ownerUid && !product?.username) {
      setSellerPhoneNumber(null);
      return;
    }
    const fetchSellerPhone = async () => {
      try {
        if (product?.ownerUid) {
          const userDoc = await getDoc(doc(db, 'users', product.ownerUid));
          if (userDoc.exists()) {
            setSellerPhoneNumber(userDoc.data().phoneNumber || null);
          }
        }
      } catch (error) {
        console.error('Error fetching seller phone:', error);
        setSellerPhoneNumber(null);
      }
    };
    fetchSellerPhone();
  }, [product?.ownerUid, product?.username]);

  const openReviewModal = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to leave a review.');
      return;
    }
    if (iAmSeller) {
      Alert.alert('Cannot review own item', 'You cannot review your own listings.');
      return;
    }
    if (myReview) {
      Alert.alert('Already reviewed', 'You can only leave one review per item. Edit or delete your review to change it.');
      return;
    }
    if (!sellerKey) {
      Alert.alert('Unable to submit', 'This seller cannot receive reviews at this time. Please ensure the listing has valid seller information.');
      return;
    }
    setReviewStars(5);
    setReviewComment('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in to submit a review.');
      return;
    }
    if (!sellerKey) {
      Alert.alert('Error', 'Cannot determine seller information. Please try viewing the item again.');
      return;
    }
    const comment = reviewComment.trim();
    if (reviewStars < 1 || reviewStars > 5) {
      Alert.alert('Rating', 'Please choose a star rating from 1 to 5.');
      return;
    }
    if (!comment) {
      Alert.alert('Comment required', 'Please write a short comment about your experience.');
      return;
    }
    if (comment.length > 500) {
      Alert.alert('Comment too long', 'Please keep your comment under 500 characters.');
      return;
    }

    setSubmittingReview(true);
    try {
      const itemPath = `itemReviews/${product.id}/${user.uid}`;
      const existing = await get(ref(realtimeDb, itemPath));
      if (existing.exists()) {
        Alert.alert('Already reviewed', 'You can only leave one review per item.');
        setSubmittingReview(false);
        return;
      }
      const compositeKey = `${product.id}_${user.uid}`;
      const createdAt = new Date().toISOString();
      const payload = {
        stars: reviewStars,
        comment,
        createdAt,
        reviewerName: authUsername || 'Member',
        reviewerUid: user.uid,
        sellerKey,
        itemId: product.id,
      };
      await update(ref(realtimeDb), {
        [itemPath]: payload,
        [`sellerReviews/${sellerKey}/${compositeKey}`]: payload,
      });
      setReviewModalVisible(false);
      setReviewComment('');
      Alert.alert('Thank you', 'Your review was submitted.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <View style={styles.homeContainerMobile}>
      <View style={styles.homeContent}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

          <Modal
            visible={reviewModalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => !submittingReview && setReviewModalVisible(false)}
          >
            <Pressable
              style={styles.reviewModalOverlay}
              onPress={() => !submittingReview && setReviewModalVisible(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.reviewModalAvoid}
              >
                <Pressable style={styles.reviewModalCard} onPress={(e) => e.stopPropagation()}>
                  <Text style={styles.reviewModalTitle}>Rate this seller</Text>
                  <Text style={styles.reviewModalSubtitle}>How was your experience?</Text>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setReviewStars(n)}
                        style={styles.reviewStarHit}
                        disabled={submittingReview}
                      >
                        <Text
                          style={[
                            styles.reviewStarEmoji,
                            n > reviewStars && styles.reviewStarEmojiDim,
                          ]}
                        >
                          ⭐
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.reviewModalLabel}>Comment</Text>
                  <TextInput
                    style={styles.reviewModalInput}
                    placeholder="Share a brief note about the lender…"
                    placeholderTextColor={colors.lightText}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    maxLength={500}
                    editable={!submittingReview}
                  />
                  <Text style={styles.reviewCommentCount}>{reviewComment.length}/500</Text>
                  <View style={styles.reviewModalActions}>
                    <TouchableOpacity
                      style={styles.reviewModalCancel}
                      onPress={() => setReviewModalVisible(false)}
                      disabled={submittingReview}
                    >
                      <Text style={styles.reviewModalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.reviewModalSubmit,
                        submittingReview && styles.reviewModalSubmitDisabled,
                      ]}
                      onPress={submitReview}
                      disabled={submittingReview}
                    >
                      <Text style={styles.reviewModalSubmitText}>
                        {submittingReview ? 'Submitting…' : 'Submit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </KeyboardAvoidingView>
            </Pressable>
          </Modal>

          {/* Header */}
          <View style={styles.categoryHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backHeaderButton}>
              <Text style={styles.backHeaderButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.categoryHeaderContent}>
              <Text style={styles.categoryHeaderEmoji}>{categoryEmoji}</Text>
              <View>
                <Text style={styles.categoryHeaderTitle}>Product Details</Text>
                <Text style={styles.categoryHeaderCount}>{categoryLabel}</Text>
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.pageContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Product Image */}
            <View style={styles.detailImageContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.detailImage}
              />
            </View>

            {/* Product Info Card */}
            <View style={styles.detailCard}>
              {/* Title and Price */}
              <View style={styles.detailHeader}>
                <View style={styles.detailTitleSection}>
                  <Text style={styles.detailTitle}>{product.name}</Text>
                  <Text style={styles.detailPrice}>CA${parseFloat(product.pricePerDay).toFixed(2)}/day</Text>
                </View>
              </View>

              {/* Basic Info Grid */}
              <View style={styles.detailInfoGrid}>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Condition</Text>
                  <Text style={styles.detailInfoValue}>{product.condition}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Category</Text>
                  <Text style={styles.detailInfoValue}>{categoryLabel}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Available From</Text>
                  <Text style={styles.detailInfoValue}>{product.startDate}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Available Until</Text>
                  <Text style={styles.detailInfoValue}>{product.endDate}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Borough</Text>
                  <Text style={styles.detailInfoValue}>{product.borough || 'N/A'}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Description</Text>
                <Text style={styles.detailDescription}>{product.description}</Text>
              </View>

              {/* Owner Info - Clickable */}
              <TouchableOpacity 
                style={styles.detailOwnerCard}
                onPress={() => onSellerSelect && onSellerSelect(product.username || username, product.ownerUid)}
                activeOpacity={0.7}
              >
                <View style={styles.ownerInfoContainer}>
                  <View style={styles.ownerAvatar}>
                    <Text style={styles.ownerAvatarText}>👤</Text>
                  </View>
                  <View style={styles.ownerDetails}>
                    <Text style={styles.ownerLabel}>Posted by</Text>
                    <Text style={styles.ownerName}>{product.username || username || 'Anonymous'}</Text>
                  </View>
                  <Text style={styles.ownerArrow}>→</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.detailRateSellerButton,
                  !canReview && styles.detailRateSellerButtonDisabled,
                ]}
                onPress={openReviewModal}
                disabled={!canReview}
              >
                <Text style={styles.detailRateSellerIcon}>⭐</Text>
                <Text style={styles.detailRateSellerText}>
                  {iAmSeller ? 'Your own item' : myReview ? 'You reviewed this seller' : 'Rate this seller'}
                </Text>
              </TouchableOpacity>

              {/* Contact Button */}
              <TouchableOpacity 
                style={styles.detailActionButton}
                onPress={() => {
                  if (sellerPhoneNumber) {
                    Alert.alert(
                      'Contact Lender',
                      `Phone: ${sellerPhoneNumber}\n\nYou can call or send a message to arrange the rental.`,
                      [{ text: 'Close', style: 'default' }]
                    );
                  } else {
                    Alert.alert(
                      'Contact Info Unavailable',
                      'This lender has not provided a phone number yet.',
                      [{ text: 'OK', style: 'default' }]
                    );
                  }
                }}
              >
                <Text style={styles.detailActionButtonIcon}>📱</Text>
                <Text style={styles.detailActionButtonText}>Contact Lender</Text>
              </TouchableOpacity>

              {/* Report User Button */}
              {!iAmSeller && (
                <TouchableOpacity 
                  style={[styles.detailActionButton, styles.detailReportButton]}
                  onPress={() => setShowReportModal(true)}
                >
                  <Text style={styles.detailActionButtonIcon}>🚩</Text>
                  <Text style={styles.detailActionButtonText}>Report User</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Report User Modal */}
          <ReportUserModal
            visible={showReportModal}
            reportedUserId={product.ownerUid || ''}
            reportedUserEmail={product.ownerEmail || ''}
            reportedUserName={product.username || username || 'Unknown User'}
            onClose={() => setShowReportModal(false)}
            onNavigateHome={() => {
              setShowReportModal(false);
              onBack();
            }}
            onSuccess={() => {
              // Additional success handling if needed
            }}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

function formatReviewDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function ProfilePage({ onNavigate, currentPage }) {
  const { user, username, logout } = useContext(AuthContext);
  const [reviewsUid, setReviewsUid] = useState({});
  const [reviewsLegacy, setReviewsLegacy] = useState({});

  const legacyKey = legacySellerKeyFromUsername(username);

  useEffect(() => {
    if (!user?.uid) return;
    const r1 = ref(realtimeDb, `sellerReviews/${user.uid}`);
    const unsub1 = onValue(r1, (snap) => {
      setReviewsUid(snap.val() || {});
    });
    return () => unsub1();
  }, [user?.uid]);

  useEffect(() => {
    if (!legacyKey) {
      setReviewsLegacy({});
      return;
    }
    const r2 = ref(realtimeDb, `sellerReviews/${legacyKey}`);
    const unsub2 = onValue(r2, (snap) => {
      setReviewsLegacy(snap.val() || {});
    });
    return () => unsub2();
  }, [legacyKey]);

  const mergedReviews = useMemo(() => {
    const byKey = new Map();
    Object.entries(reviewsLegacy).forEach(([k, v]) => byKey.set(k, v));
    Object.entries(reviewsUid).forEach(([k, v]) => byKey.set(k, v));
    const list = Array.from(byKey.values());
    list.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    return list;
  }, [reviewsUid, reviewsLegacy]);

  const reviewCount = mergedReviews.length;
  const averageStars =
    reviewCount > 0
      ? mergedReviews.reduce((s, r) => s + (Number(r.stars) || 0), 0) / reviewCount
      : 0;

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (!result.success) {
            Alert.alert('Error', result.error || 'Logout failed');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.homeContainerMobile}>
      <View style={styles.homeContent}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>
                {username ? `@${username}` : 'Your account'}
              </Text>
            </View>
            <View style={styles.userSection}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {mergedReviews.length === 0 ? (
            <ScrollView
              style={styles.pageContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.profileSummaryCard}>
                <View style={styles.profileRatingRow}>
                  <Text style={styles.profileRatingStars}>
                    {reviewCount === 0 ? '—' : `${averageStars.toFixed(1)} ★`}
                  </Text>
                  <Text style={styles.profileRatingMeta}>
                    {reviewCount === 0
                      ? 'No reviews yet'
                      : `${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
                  </Text>
                </View>
                {user?.email ? (
                  <Text style={styles.profileEmail}>{user.email}</Text>
                ) : null}
              </View>

              <Text style={styles.profileSectionTitle}>Reviews about you</Text>
              <View style={styles.profileEmptyReviews}>
                <Text style={styles.profileEmptyEmoji}>💬</Text>
                <Text style={styles.profileEmptyTitle}>No reviews yet</Text>
                <Text style={styles.profileEmptyText}>
                  When borrowers rate you on their item pages, reviews will show up here.
                </Text>
              </View>
            </ScrollView>
          ) : (
            <>
              <View style={styles.profileSummaryCard}>
                <View style={styles.profileRatingRow}>
                  <Text style={styles.profileRatingStars}>
                    {reviewCount === 0 ? '—' : `${averageStars.toFixed(1)} ★`}
                  </Text>
                  <Text style={styles.profileRatingMeta}>
                    {reviewCount === 0
                      ? 'No reviews yet'
                      : `${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
                  </Text>
                </View>
                {user?.email ? (
                  <Text style={styles.profileEmail}>{user.email}</Text>
                ) : null}
              </View>

              <Text style={styles.profileSectionTitle}>Reviews about you</Text>
              <FlatList
                data={mergedReviews}
                keyExtractor={(item, index) =>
                  `${item.itemId || 'x'}_${item.reviewerUid || index}`
                }
                style={styles.profileReviewsList}
                contentContainerStyle={styles.profileReviewsListContent}
                scrollEnabled={true}
                renderItem={({ item }) => (
                  <View style={styles.profileReviewCard}>
                    <View style={styles.profileReviewHeader}>
                      <Text style={styles.profileReviewName} numberOfLines={1}>
                        {item.reviewerName || 'Member'}
                      </Text>
                      <Text style={styles.profileReviewDate}>
                        {formatReviewDate(item.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.profileReviewStars}>
                      {'⭐'.repeat(Math.min(5, Math.max(0, Number(item.stars) || 0)))}
                    </Text>
                    <Text style={styles.profileReviewComment}>{item.comment}</Text>
                  </View>
                )}
              />
            </>
          )}
        </SafeAreaView>
      </View>
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </View>
  );
}

// Seller Profile Page Component
function SellerProfilePage({ sellerUsername, sellerUid, onBack, objects, onProductSelect, onNavigate }) {
  const [sellerData, setSellerData] = useState(null);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch seller data from Firestore
    const fetchSellerData = async () => {
      try {
        // Get seller phone number from Firestore
        const userDoc = await getDoc(doc(db, 'users', sellerUid));
        if (userDoc.exists()) {
          setSellerData({
            username: sellerUsername,
            phone: userDoc.data().phoneNumber || '',
            email: userDoc.data().email || '',
            uid: sellerUid,
          });
        }
      } catch (error) {
        console.error('Error fetching seller data:', error);
      }
    };

    // Fetch seller reviews from Firebase Realtime Database
    const fetchSellerReviews = async () => {
      try {
        // Try by UID first
        const reviewsRef = ref(realtimeDb, `sellerReviews/${sellerUid}`);
        const snapshot = await get(reviewsRef);
        const reviews = [];
        
        if (snapshot.exists()) {
          const reviewsObj = snapshot.val();
          Object.values(reviewsObj).forEach(review => {
            reviews.push(review);
          });
        }

        // Also try legacy username-based key
        const legacyKey = legacySellerKeyFromUsername(sellerUsername);
        if (legacyKey) {
          const legacyRef = ref(realtimeDb, `sellerReviews/${legacyKey}`);
          const legacySnapshot = await get(legacyRef);
          if (legacySnapshot.exists()) {
            const legacyReviews = legacySnapshot.val();
            Object.values(legacyReviews).forEach(review => {
              // Check if not already added
              if (!reviews.find(r => r.createdAt === review.createdAt)) {
                reviews.push(review);
              }
            });
          }
        }

        // Sort by date (newest first)
        reviews.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });

        setSellerReviews(reviews);
      } catch (error) {
        console.error('Error fetching seller reviews:', error);
      }
    };

    fetchSellerData();
    fetchSellerReviews();
    setLoading(false);
  }, [sellerUid, sellerUsername]);

  const sellerItems = objects.filter(
    obj => obj.username === sellerUsername || obj.ownerUid === sellerUid
  );

  const averageRating =
    sellerReviews.length > 0
      ? sellerReviews.reduce((sum, review) => sum + (Number(review.stars) || 0), 0) / sellerReviews.length
      : 0;

  return (
    <View style={styles.homeContainerMobile}>
      <View style={styles.homeContent}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

          {/* Header */}
          <View style={styles.categoryHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backHeaderButton}>
              <Text style={styles.backHeaderButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.categoryHeaderContent}>
              <Text style={styles.categoryHeaderEmoji}>👤</Text>
              <View>
                <Text style={styles.categoryHeaderTitle}>Seller Profile</Text>
                <Text style={styles.categoryHeaderCount}>{sellerUsername}</Text>
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.pageContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Seller Info Card */}
            <View style={styles.sellerProfileCard}>
              <View style={styles.sellerHeaderSection}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarText}>👤</Text>
                </View>
                <View style={styles.sellerNameSection}>
                  <Text style={styles.sellerName}>{sellerUsername}</Text>
                  <View style={styles.sellerRatingRow}>
                    <Text style={styles.sellerRating}>
                      {sellerReviews.length === 0 ? '—' : `${averageRating.toFixed(1)} ★`}
                    </Text>
                    <Text style={styles.sellerReviewCount}>
                      {sellerReviews.length === 0
                        ? 'No reviews'
                        : `${sellerReviews.length} review${sellerReviews.length === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Contact Info */}
              {sellerData && (
                <View style={styles.sellerContactInfo}>
                  {sellerData.phone && (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactIcon}>📱</Text>
                      <Text style={styles.contactText}>{sellerData.phone}</Text>
                    </View>
                  )}
                  {sellerData.email && (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactIcon}>✉️</Text>
                      <Text style={styles.contactText} numberOfLines={1}>{sellerData.email}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Items Section */}
            <Text style={styles.profileSectionTitle}>Items posted ({sellerItems.length})</Text>
            {sellerItems.length > 0 ? (
              <View style={styles.sellerItemsGrid}>
                {sellerItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.sellerItemCard}
                    onPress={() => onProductSelect(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.imageUrl || item.image }}
                      style={styles.sellerItemImage}
                    />
                    <View style={styles.sellerItemContent}>
                      <Text style={styles.sellerItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.sellerItemPrice}>CA${parseFloat(item.pricePerDay).toFixed(2)}/day</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📭</Text>
                <Text style={styles.emptyStateTitle}>No items posted</Text>
              </View>
            )}

            {/* Reviews Section */}
            <Text style={styles.profileSectionTitle}>Reviews ({sellerReviews.length})</Text>
            {sellerReviews.length === 0 ? (
              <View style={styles.profileEmptyReviews}>
                <Text style={styles.profileEmptyEmoji}>💬</Text>
                <Text style={styles.profileEmptyTitle}>No reviews yet</Text>
                <Text style={styles.profileEmptyText}>
                  Be the first to review this seller
                </Text>
              </View>
            ) : (
              sellerReviews.map((review, index) => (
                <View key={index} style={styles.profileReviewCard}>
                  <View style={styles.profileReviewHeader}>
                    <Text style={styles.profileReviewName} numberOfLines={1}>
                      {review.reviewerName || 'Member'}
                    </Text>
                    <Text style={styles.profileReviewDate}>
                      {formatReviewDate(review.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.profileReviewStars}>
                    {'⭐'.repeat(Math.min(5, Math.max(0, Number(review.stars) || 0)))}
                  </Text>
                  <Text style={styles.profileReviewComment}>{review.comment}</Text>
                </View>
              ))
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </View>
      <BottomNav currentPage="sellerProfile" onNavigate={onNavigate} />
    </View>
  );
}

// Category Page Component
function CategoryPage({ categoryValue, onBack, objects, onNavigate, currentPage, onProductSelect }) {
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
    <View style={styles.homeContainerMobile}>
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
            <TouchableOpacity 
              style={styles.objectCard}
              onPress={() => onProductSelect(item)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.imageUrl || item.image }}
                style={styles.objectCardImage}
              />
              <View style={styles.objectCardContent}>
                <Text style={styles.objectCardName}>{item.name}</Text>
                <Text style={styles.objectCardCondition}>Condition: {item.condition}</Text>
                <View style={styles.objectCardFooter}>
                  <Text style={styles.objectCardPrice}>CA${parseFloat(item.pricePerDay).toFixed(2)}/day</Text>
                </View>
              </View>
            </TouchableOpacity>
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
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </View>
  );
}

// Safety Guidelines Page
function SafetyGuidelinesPage({ onNavigate, currentPage }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const safetyTips = [
    {
      number: '1',
      title: 'Meet in Safe, Public Locations',
      icon: '📍',
      description: 'Always choose well-lit, busy public places for exchanges. Avoid meeting at private residences, especially for first-time interactions.',
      highlight: 'In Montreal, the SPVM provides designated meeting points equipped with surveillance cameras. Check: https://spvm.qc.ca/en/Fiches/Details/Safe-Trading-Zones'
    },
    {
      number: '2',
      title: 'Bring Someone With You',
      icon: '👥',
      description: 'If possible, go with a friend or family member, especially when meeting someone for the first time.'
    },
    {
      number: '3',
      title: 'Inform Someone You Trust',
      icon: '📱',
      description: 'Let a trusted person know where you are going, who you are meeting, and what time you expect to return.'
    },
    {
      number: '4',
      title: 'Check the Item Carefully',
      icon: '🔍',
      description: 'Before completing the exchange, inspect the item thoroughly to ensure it matches the description and is in acceptable condition.'
    },
    {
      number: '5',
      title: 'Avoid Sharing Personal Information',
      icon: '🔐',
      description: 'Do not share sensitive personal information such as your home address, financial details, or identification documents.'
    },
    {
      number: '6',
      title: 'Trust Your Instincts',
      icon: '⚠️',
      description: 'If something feels off or unsafe, cancel the meeting immediately. Your safety is more important than any transaction.'
    },
    {
      number: '7',
      title: 'Report Suspicious Behavior',
      icon: '🚨',
      description: 'If you encounter inappropriate or suspicious activity, report the user through the app. Lendify may take action, including account suspension.'
    },
  ];

  return (
    <View style={isPhone ? styles.homeContainerMobile : styles.homeContainer}>
      {!isPhone && <LeftSidebar currentPage={currentPage} onNavigate={onNavigate} />}
      
      <View style={styles.homeContent}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          
          {/* Header */}
          <View style={styles.safetyHeader}>
            <View style={styles.safetyHeaderContent}>
              <Text style={styles.safetyHeaderIcon}>🛡️</Text>
              <View style={styles.safetyHeaderText}>
                <Text style={styles.safetyTitle}>Safety Guidelines</Text>
                <Text style={styles.safetySubtitle}>Your safety is our priority</Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.safetyContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={isPhone ? styles.scrollContentWithBottomNav : styles.scrollContent}
          >
            {/* Intro Message */}
            <View style={styles.safetyIntro}>
              <Text style={styles.safetyIntroText}>
                While Lendify is not involved in transactions between users, we strongly encourage you to follow these safety recommendations when meeting others and exchanging items.
              </Text>
            </View>

            {/* Safety Tips List */}
            <View style={styles.safetyTipsContainer}>
              {safetyTips.map((tip, index) => (
                <View key={index} style={styles.safetyTipCard}>
                  <View style={styles.safetyTipHeader}>
                    <View style={styles.safetyTipIconContainer}>
                      <Text style={styles.safetyTipCircleNumber}>{tip.number}</Text>
                      <Text style={styles.safetyTipIcon}>{tip.icon}</Text>
                    </View>
                    <Text style={styles.safetyTipTitle}>{tip.title}</Text>
                  </View>
                  <Text style={styles.safetyTipDescription}>{tip.description}</Text>
                  {tip.highlight && (
                    <View style={styles.safetyHighlight}>
                      <Text style={styles.safetyHighlightText}>{tip.highlight}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Bottom CTA */}
            <View style={styles.safetyCtaContainer}>
              <View style={styles.safetyCtaBox}>
                <Text style={styles.safetyCtaIcon}>💚</Text>
                <Text style={styles.safetyCtaTitle}>Stay Safe Out There!</Text>
                <Text style={styles.safetyCtaText}>
                  Enjoy sharing with your neighbors with confidence. If you have any safety concerns, don't hesitate to reach out.
                </Text>
              </View>
            </View>

            <View style={styles.spacer} />
          </ScrollView>
        </SafeAreaView>
      </View>
      {isPhone && <BottomNav currentPage={currentPage} onNavigate={onNavigate} />}
    </View>
  );
}

// Bottom Navigation Component
function BottomNav({ currentPage, onNavigate }) {
  return (
    <View style={styles.bottomNavBar}>
      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'home' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('home')}
      >
        <Text style={styles.bottomNavIcon}>🏠</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'home' && styles.bottomNavLabelActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'myItems' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('myItems')}
      >
        <Text style={styles.bottomNavIcon}>📦</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'myItems' && styles.bottomNavLabelActive]}>My Items</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, (currentPage === 'creation1' || currentPage === 'creation2') && styles.bottomNavItemActive]}
        onPress={() => onNavigate('creation1')}
      >
        <Text style={styles.bottomNavIcon}>➕</Text>
        <Text style={[styles.bottomNavLabel, (currentPage === 'creation1' || currentPage === 'creation2') && styles.bottomNavLabelActive]}>Add</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'profile' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('profile')}
      >
        <Text style={styles.bottomNavIcon}>👤</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'profile' && styles.bottomNavLabelActive]}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bottomNavItem, currentPage === 'safety' && styles.bottomNavItemActive]}
        onPress={() => onNavigate('safety')}
      >
        <Text style={styles.bottomNavIcon}>🛡️</Text>
        <Text style={[styles.bottomNavLabel, currentPage === 'safety' && styles.bottomNavLabelActive]}>Safety</Text>
      </TouchableOpacity>
    </View>
  );
}

// Left Sidebar Navigation
function LeftSidebar({ currentPage, onNavigate }) {
  return (
    <View style={styles.leftSidebar}>
      <View style={styles.sidebarBrand}>
        <Text style={styles.sidebarBrandText}>LF</Text>
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
          style={[styles.sidebarNavItem, currentPage === 'myItems' && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('myItems')}
        >
          <Text style={styles.sidebarNavIcon}>📦</Text>
          <Text style={styles.sidebarNavLabel}>My Items</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sidebarNavItem, (currentPage === 'creation1' || currentPage === 'creation2') && styles.sidebarNavItemActive]}
          onPress={() => onNavigate('creation1')}
        >
          <Text style={styles.sidebarNavIcon}>➕</Text>
          <Text style={styles.sidebarNavLabel}>Add Item</Text>
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

// My Items Page Component
function MyItemsPage({ objects, username, onNavigate, currentPage, onProductSelect, onDeleteItem }) {
  const userItems = objects.filter(obj => obj.username === username);

  return (
    <View style={styles.homeContainerMobile}>
      <View style={styles.homeContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Items</Text>
            <Text style={styles.headerSubtitle}>{userItems.length} posted</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {userItems.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.objectsGridContainer}>
                {userItems.map((item) => (
                  <View key={item.id} style={styles.objectGridItem}>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity 
                        style={styles.objectCard}
                        onPress={() => onProductSelect(item)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.objectCardImage}
                        />
                        <View style={styles.objectCardContent}>
                          <Text style={styles.objectCardName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.objectCardPrice}>CA${parseFloat(item.pricePerDay).toFixed(2)}/day</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDeleteItem(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteButtonText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📭</Text>
              <Text style={styles.emptyStateTitle}>No items posted yet</Text>
              <Text style={styles.emptyStateText}>Start sharing items to build your collection</Text>
            </View>
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </View>
  );
}

// Home Page Component
function HomePage({ onCreateObject, onCategorySelect, objects, onNavigate, currentPage, onProductSelect, selectedBorough, onBoroughSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { username, logout, borough } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Error', 'Failed to logout: ' + result.error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

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

  const MONTREAL_BOROUGHS = [
    'All Boroughs',
    'Ahuntsic–Cartierville',
    'Anjou',
    'Côte-des-Neiges–Notre-Dame-de-Grâce',
    'Lachine',
    'LaSalle',
    'Le Plateau-Mont-Royal',
    'Le Sud-Ouest',
    'L\'Île-Bizard–Sainte-Geneviève',
    'Mercier–Hochelaga-Maisonneuve',
    'Montréal-Nord',
    'Outremont',
    'Pierrefonds–Roxboro',
    'Rivière-des-Prairies–Pointe-aux-Trembles',
    'Rosemont–La Petite-Patrie',
    'Saint-Laurent',
    'Saint-Léonard',
    'Verdun',
    'Ville-Marie',
    'Villeray–Saint-Michel–Parc-Extension',
  ];

  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          obj.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBorough = !selectedBorough || selectedBorough === 'All Boroughs' || obj.borough === selectedBorough;
    return matchesSearch && matchesBorough;
  });

  return (
    <View style={styles.homeContainer}>
      <View style={styles.homeContent}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lendify</Text>
          <Text style={styles.headerSubtitle}>Share with your community</Text>
        </View>
        <View style={styles.userSection}>
          <Text style={styles.username}>👤 {username}</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
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

        {/* Borough Filter with Scroll Arrows */}
        <View style={styles.boroughFilterContainer}>
          <Text style={styles.boroughFilterLabel}>📍 Filter by Borough:</Text>
          <View style={styles.boroughScrollWrapper}>
            <Text style={styles.boroughScrollArrow}>◀</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              scrollIndicatorInsets={{ bottom: -10 }}
              contentContainerStyle={styles.boroughScrollContent}
            >
              {MONTREAL_BOROUGHS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[
                    styles.boroughFilterButton,
                    (selectedBorough === b || (selectedBorough === null && b === 'All Boroughs')) && styles.boroughFilterButtonActive
                  ]}
                  onPress={() => onBoroughSelect?.(b === 'All Boroughs' ? null : b)}
                >
                  <Text style={[
                    styles.boroughFilterButtonText,
                    (selectedBorough === b || (selectedBorough === null && b === 'All Boroughs')) && styles.boroughFilterButtonTextActive
                  ]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.boroughScrollArrow}>▶</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesGrid}
            contentContainerStyle={styles.categoriesGridContent}
          >
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
          </ScrollView>
        </View>

        {/* Available Items Section */}
        {filteredObjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Items ({filteredObjects.length})</Text>
            <View style={styles.objectsGridContainer}>
              {filteredObjects.map((item) => (
                <View key={item.id} style={[styles.objectGridItem, isDesktop && styles.objectGridItemDesktop]}>
                  <TouchableOpacity 
                    style={styles.objectCard}
                    onPress={() => onProductSelect(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.objectCardImage}
                    />
                    <View style={styles.objectCardContent}>
                      <Text style={styles.objectCardName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.objectCardPrice}>CA${parseFloat(item.pricePerDay).toFixed(2)}/day</Text>
                    </View>
                  </TouchableOpacity>
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
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </View>
  );
}

// Main App Component
function MainApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [objects, setObjects] = useState([]);
  const [selectedBorough, setSelectedBorough] = useState(null);
  const { username, user, borough } = useContext(AuthContext);
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

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentPage('productDetail');
  };

  const handleBackFromProductDetail = () => {
    setSelectedProduct(null);
    setCurrentPage('home');
  };

  const handleSellerSelect = (sellerUsername, sellerUid) => {
    setSelectedSeller({ username: sellerUsername, uid: sellerUid });
    setCurrentPage('sellerProfile');
  };

  const handleBackFromSellerProfile = () => {
    setSelectedSeller(null);
    setCurrentPage('home');
  };

  const handleCancelCreation = () => {
    // Reset creation form and return to home
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
  };

  const handleDeleteItem = (itemId) => {
    console.log('Delete clicked for item:', itemId);
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('User confirmed delete for:', itemId);
            try {
              const itemRef = ref(realtimeDb, `objects/${itemId}`);
              set(itemRef, null).then(() => {
                console.log('Item deleted from Firebase');
                setObjects(objects.filter(obj => obj.id !== itemId));
                Alert.alert('Success', 'Item deleted successfully');
              });
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item: ' + error.message);
            }
          },
        },
      ]
    );
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
            username: username,
            ownerUid: user?.uid || null,
            borough: borough || '',
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

  const handleBoroughSelect = (selectedB) => {
    setSelectedBorough(selectedB);
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
          onProductSelect={handleProductSelect}
          selectedBorough={selectedBorough}
          onBoroughSelect={handleBoroughSelect}
        />
      )}
      {currentPage === 'myItems' && (
        <MyItemsPage 
          objects={objects}
          username={username}
          onNavigate={handleNavigation}
          currentPage={currentPage}
          onProductSelect={handleProductSelect}
          onDeleteItem={handleDeleteItem}
        />
      )}
      {currentPage === 'profile' && (
        <ProfilePage onNavigate={handleNavigation} currentPage={currentPage} />
      )}
      {currentPage === 'category' && (
        <CategoryPage
          categoryValue={selectedCategory}
          onBack={handleBackToHome}
          objects={objects}
          onNavigate={handleNavigation}
          currentPage={currentPage}
          onProductSelect={handleProductSelect}
        />
      )}
      {currentPage === 'productDetail' && selectedProduct && (
        <ProductDetailScreen
          product={selectedProduct}
          onBack={handleBackFromProductDetail}
          username={objects.find(obj => obj.id === selectedProduct.id)?.username}
          onSellerSelect={handleSellerSelect}
        />
      )}
      {currentPage === 'sellerProfile' && selectedSeller && (
        <SellerProfilePage
          sellerUsername={selectedSeller.username}
          sellerUid={selectedSeller.uid}
          onBack={handleBackFromSellerProfile}
          objects={objects}
          onProductSelect={handleProductSelect}
          onNavigate={handleNavigation}
        />
      )}
      {currentPage === 'creation1' && (
        <ObjectCreationPage1
          onNext={handleNextPage}
          objectData={objectData}
          setObjectData={setObjectData}
          onNavigate={handleNavigation}
          currentPage={currentPage}
          onCancel={handleCancelCreation}
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
      {currentPage === 'safety' && (
        <SafetyGuidelinesPage
          onNavigate={handleNavigation}
          currentPage={currentPage}
        />
      )}
    </>
  );
}

// Main App wrapper with authentication
function AppContent() {
  const { user, loading, logout, isAdmin } = useContext(AuthContext);

  console.log('AppContent - user:', user?.email || 'null', 'loading:', loading, 'isAdmin:', isAdmin);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (isAdmin) {
    return <AdminPanel />;
  }

  return <MainApp />;
}

// Root App component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithBottomNav: {
    paddingBottom: 120,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
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
  userSection: {
    alignItems: 'flex-end',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    zIndex: 1,
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
  /** Clears fixed BottomNav (~72px) on phone so Post / Continue stay tappable */
  buttonContainerAboveBottomNav: {
    paddingBottom: 100,
    marginBottom: 0,
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

  // Borough Filter Styles
  boroughFilterContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  boroughFilterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  boroughScrollContent: {
    paddingRight: 16,
  },
  boroughFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 8,
  },
  boroughFilterButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  boroughFilterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  boroughFilterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  boroughScrollWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boroughScrollArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 6,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  categoryCard: {
    width: 182,
    height: 70,
    backgroundColor: colors.background,
    marginRight: 8,
    padding: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryCardEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  categoryCardName: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  categoriesGridContent: {
    paddingRight: 8,
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
    marginBottom: 16,
  },
  objectGridItemDesktop: {
    width: '31%',
  },
  objectCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  objectCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.lightBg,
    resizeMode: 'contain',
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
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
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
  homeContainerMobile: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 72,
  },
  bottomNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 100,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  bottomNavItemActive: {
    backgroundColor: 'rgba(46, 80, 144, 0.12)',
  },
  bottomNavIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.lightText,
  },
  bottomNavLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 96,
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
    position: 'relative',
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
    width: '20%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  categoryGridItemSelected: {
    backgroundColor: 'rgba(46, 80, 144, 0.1)',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  categoryGridEmoji: {
    fontSize: 18,
  },
  categoryGridLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  categoryGridLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Product Detail Styles
  detailImageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  detailCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailTitleSection: {
    gap: 8,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  detailPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  detailInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  detailInfoItem: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  detailInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightText,
    marginBottom: 6,
    textAlign: 'center',
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  detailOwnerCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.lightBg,
  },
  ownerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarText: {
    fontSize: 28,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightText,
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  ownerArrow: {
    fontSize: 18,
    color: colors.secondary,
    fontWeight: '700',
  },
  detailActionButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  detailActionButtonIcon: {
    fontSize: 20,
  },
  detailActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  detailReportButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
  },
  detailRateSellerButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  detailRateSellerButtonDisabled: {
    opacity: 0.55,
    borderColor: colors.border,
  },
  detailRateSellerIcon: {
    fontSize: 18,
  },
  detailRateSellerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reviewModalAvoid: {
    width: '100%',
  },
  reviewModalCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  reviewModalSubtitle: {
    fontSize: 14,
    color: colors.lightText,
    marginBottom: 16,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  reviewStarHit: {
    padding: 6,
  },
  reviewStarEmoji: {
    fontSize: 32,
  },
  reviewStarEmojiDim: {
    opacity: 0.22,
  },
  reviewModalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  reviewModalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: colors.lightBg,
    marginBottom: 8,
  },
  reviewCommentCount: {
    fontSize: 12,
    color: colors.lightText,
    textAlign: 'right',
    marginBottom: 20,
  },
  reviewModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.lightBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  reviewModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  reviewModalSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  reviewModalSubmitDisabled: {
    opacity: 0.7,
  },
  reviewModalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  profileSummaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRatingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileRatingStars: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  profileRatingMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightText,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.text,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  profileReviewsList: {
    flex: 1,
  },
  profileReviewsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  profileReviewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  profileReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  profileReviewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  profileReviewDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightText,
  },
  profileReviewStars: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileReviewComment: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  profileEmptyReviews: {
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  profileEmptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  profileEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  profileEmptyText: {
    fontSize: 14,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Seller Profile Styles
  sellerProfileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sellerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    fontSize: 32,
  },
  sellerNameSection: {
    flex: 1,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerRating: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  sellerReviewCount: {
    fontSize: 14,
    color: colors.lightText,
    fontWeight: '600',
  },
  sellerContactInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactIcon: {
    fontSize: 18,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  sellerItemsGrid: {
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  sellerItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sellerItemImage: {
    width: 100,
    height: 100,
  },
  sellerItemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  sellerItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sellerItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  // Safety Guidelines Styles
  safetyHeader: {
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
  safetyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  safetyHeaderIcon: {
    fontSize: 40,
  },
  safetyHeaderText: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  safetySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  safetyContent: {
    flex: 1,
  },
  safetyIntro: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  safetyIntroText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    fontWeight: '500',
  },
  safetyTipsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    gap: 14,
  },
  safetyTipCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  safetyTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  safetyTipIconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyTipCircleNumber: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  safetyTipIcon: {
    fontSize: 32,
  },
  safetyTipTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  safetyTipDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  safetyHighlight: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(26, 188, 156, 0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  safetyHighlightText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  safetyCtaContainer: {
    marginHorizontal: 16,
    marginBottom: 40,
  },
  safetyCtaBox: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  safetyCtaIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  safetyCtaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  safetyCtaText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },
});