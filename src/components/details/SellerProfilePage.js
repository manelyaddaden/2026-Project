import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { realtimeDb, db } from '../../firebaseConfig';
import { styles } from '../../styles/styles';
import { colors } from '../../utils/constants';
import { legacySellerKeyFromUsername, formatReviewDate } from '../../utils/sellerHelpers';
import { BottomNav } from '../common/BottomNav';

// Seller Profile Page Component
export function SellerProfilePage({ sellerUsername, sellerUid, onBack, objects, onProductSelect, onNavigate }) {
  const [sellerData, setSellerData] = useState(null);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch seller data from Firestore
    const fetchSellerData = async () => {
      try {
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
              if (!reviews.find(r => r.createdAt === review.createdAt)) {
                reviews.push(review);
              }
            });
          }
        }

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
