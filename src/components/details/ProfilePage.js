import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../../firebaseConfig';
import { AuthContext } from '../../AuthContext';
import { styles } from '../../styles/styles';
import { colors } from '../../utils/constants';
import { legacySellerKeyFromUsername, formatReviewDate } from '../../utils/sellerHelpers';
import { BottomNav } from '../common/BottomNav';

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

export default ProfilePage;
