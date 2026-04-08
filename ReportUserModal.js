import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AuthContext } from './AuthContext';

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
  error: '#E74C3C',
};

const REPORT_REASONS = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'fraud', label: 'Fraud or Scam' },
  { value: 'damaged_item', label: 'Damaged or Missing Item' },
  { value: 'harassment', label: 'Harassment or Threatening' },
  { value: 'misrepresentation', label: 'Misrepresentation' },
  { value: 'other', label: 'Other' },
];

export function ReportUserModal({ visible, reportedUserId, reportedUserEmail, reportedUserName, onClose, onSuccess, onNavigateHome }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const { user, username } = useContext(AuthContext);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      // Save report to Firestore
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reporterName: username,
        reporterEmail: user.email,
        reportedUserId: reportedUserId,
        reportedUserEmail: reportedUserEmail,
        reportedUserName: reportedUserName,
        reason: selectedReason,
        description: description.trim(),
        timestamp: serverTimestamp(),
        status: 'pending', // pending, resolved, dismissed
      });

      setSelectedReason('');
      setDescription('');
      onClose();
      
      // Show success alert then navigate home
      Alert.alert(
        'Report Submitted ✓',
        'Thank you for helping keep our community safe. Your report has been submitted to our moderation team.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onNavigateHome) {
                onNavigateHome();
              }
              if (onSuccess) {
                onSuccess();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  const selectedReasonLabel = REPORT_REASONS.find(r => r.value === selectedReason)?.label || 'Select a reason';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Report User</Text>
            <Text style={styles.headerSubtitle}>
              Help us maintain a safe community
            </Text>
          </View>

          {/* Reported User Info */}
          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoLabel}>Reporting:</Text>
            <Text style={styles.userInfoName}>{reportedUserName || reportedUserEmail}</Text>
            <Text style={styles.userInfoEmail}>{reportedUserEmail}</Text>
          </View>

          {/* Reason Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reason for Report *</Text>
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => setShowReasonDropdown(!showReasonDropdown)}
            >
              <Text
                style={[
                  styles.reasonButtonText,
                  !selectedReason && { color: colors.lightText },
                ]}
              >
                {selectedReasonLabel}
              </Text>
              <Text style={styles.reasonButtonArrow}>
                {showReasonDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showReasonDropdown && (
              <View style={styles.dropdownList}>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.dropdownItem,
                      selectedReason === reason.value &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedReason(reason.value);
                      setShowReasonDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedReason === reason.value &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Please provide details about your report (minimum 10 characters)"
              placeholderTextColor={colors.lightText}
              multiline
              numberOfLines={5}
              maxLength={500}
              value={description}
              onChangeText={setDescription}
              editable={!loading}
            />
            <Text style={styles.characterCount}>
              {description.length}/500
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>⚠️ Important</Text>
            <Text style={styles.infoText}>
              False reports may result in action against your account. All
              reports are reviewed by our moderation team.
            </Text>
          </View>

          {/* Button Container */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.lightText,
  },
  userInfoCard: {
    backgroundColor: colors.lightBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  userInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightText,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userInfoName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 13,
    color: colors.lightText,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  reasonButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reasonButtonText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  reasonButtonArrow: {
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 8,
  },
  dropdownList: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.lightBg,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
    color: colors.secondary,
  },
  textInput: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 6,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 14,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spacing: {
    height: 20,
  },
});
