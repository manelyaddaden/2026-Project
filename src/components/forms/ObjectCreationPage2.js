import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../../styles/styles';
import { colors } from '../../utils/constants';
import { BottomNav } from '../common/BottomNav';
import { LeftSidebar } from '../common/LeftSidebar';

// Object Creation - Page 2: Description and Image
export function ObjectCreationPage2({ onBack, onSubmit, objectData, setObjectData, onNavigate, currentPage }) {
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

          {/* Action Buttons */}
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
