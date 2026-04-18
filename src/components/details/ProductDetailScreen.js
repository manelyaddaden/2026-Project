import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { ref, onValue, get, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { realtimeDb, db } from '../../firebaseConfig';
import { AuthContext } from '../../AuthContext';
import { ReportUserModal } from '../../ReportUserModal';
import { styles } from '../../styles/styles';
import { colors, categoryOptions } from '../../utils/constants';
import { getSellerKeyForProduct, isViewerTheSeller } from '../../utils/sellerHelpers';

// Product Detail Screen Component
export function ProductDetailScreen({ product, onBack, username, onSellerSelect }) {
  const { user, username: authUsername } = useContext(AuthContext);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [sellerPhoneNumber, setSellerPhoneNumber] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const categoryLabel = categoryOptions.find(c => c.value === product.category)?.label;
  const categoryEmoji = categoryOptions.find(c => c.value === product.category)?.emoji;
  const sellerKey = getSellerKeyForProduct(product, username);
  const iAmSeller = isViewerTheSeller(product, user?.uid, authUsername, username);
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
                  {iAmSeller ? 'Your own item' : myReview ? 'You reviewed this borrower' : 'Rate this borrower'}
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
            onSuccess={() => {}}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}
