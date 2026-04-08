import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { db, realtimeDb } from './firebaseConfig';
import { AuthContext } from './AuthContext';
import {
  fetchAllReports,
  listenToReports,
  suspendUserAccount,
  sendSuspensionEmail,
  updateReportStatus,
} from './reportService';

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
  error: '#E74C3C',
};

export function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingObjects, setLoadingObjects] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [suspendingUserId, setSuspendingUserId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const { logout, isAdmin, user } = useContext(AuthContext);

  // Security check - only admin should access this screen (check on mount only)
  useEffect(() => {
    // Only check on component mount, not on every user/isAdmin change
    if (!isAdmin || user?.email !== 'adminpanel@gmail.com') {
      Alert.alert('Access Denied', 'You do not have permission to access this screen.');
      logout();
    }
  }, []); // Empty dependency array means this only runs on mount

  // Fetch all users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        usersSnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to fetch users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch all objects from Realtime Database
  useEffect(() => {
    const objectsRef = ref(realtimeDb, 'objects');
    const unsubscribe = onValue(
      objectsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const objectsList = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value,
          }));
          setObjects(objectsList);
        } else {
          setObjects([]);
        }
        setLoadingObjects(false);
      },
      (error) => {
        console.error('Error fetching objects:', error);
        Alert.alert('Error', 'Failed to fetch objects');
        setLoadingObjects(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch and listen to reports
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const reportsData = await fetchAllReports();
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
        Alert.alert('Error', 'Failed to fetch reports');
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReportsData();

    // Set up listener for real-time updates
    const unsubscribe = listenToReports((reportsData) => {
      setReports(reportsData);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          // Close any open modals
          setShowReportDetails(false);
          // Clear any selected content
          setSelectedReport(null);
          // Perform logout
          const result = await logout();
          if (!result.success) {
            Alert.alert('Error', result.error || 'Logout failed');
          }
          // If logout was successful, the app will automatically show AuthScreen
          // because the user and isAdmin states will be null/false in AuthContext
        },
      },
    ]);
  };

  const handleSuspendAccount = (report) => {
    Alert.alert(
      'Suspend Account',
      `Are you sure you want to suspend ${report.reportedUserName || report.reportedUserEmail}?\n\nReason: ${report.reason}`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Suspend',
          onPress: async () => {
            setSuspendingUserId(report.reportedUserId);
            try {
              await suspendUserAccount(
                report.reportedUserEmail,
                report.reportedUserName,
                report.reason
              );
              Alert.alert('Success', 'User account has been suspended.');
              await updateReportStatus(report.id, 'resolved');
            } catch (error) {
              console.error('Error suspending account:', error);
              Alert.alert('Error', `Failed to suspend account: ${error.message}`);
            } finally {
              setSuspendingUserId(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSendSuspensionEmail = (report) => {
    Alert.alert(
      'Send Suspension Email',
      `Send suspension notification to ${report.reportedUserName || report.reportedUserEmail}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Send Email',
          onPress: async () => {
            setSuspendingUserId(report.reportedUserId);
            try {
              await sendSuspensionEmail(
                report.reportedUserEmail,
                report.reportedUserName,
                report.reason,
                report.description
              );
              Alert.alert('Success', 'Suspension email has been sent.');
            } catch (error) {
              console.error('Error sending email:', error);
              Alert.alert('Error', `Failed to send email: ${error.message}`);
            } finally {
              setSuspendingUserId(null);
            }
          },
        },
      ]
    );
  };

  // User item component
  const UserItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.username || 'N/A'}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Email:</Text>
        <Text style={styles.itemValue}>{item.email}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Phone:</Text>
        <Text style={styles.itemValue}>{item.phoneNumber || 'N/A'}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Borough:</Text>
        <Text style={styles.itemValue}>{item.borough || 'N/A'}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Created:</Text>
        <Text style={styles.itemValue}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
    </View>
  );

  // Object item component
  const ObjectItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name || 'N/A'}</Text>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={styles.badgeText}>{item.category || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Owner:</Text>
        <Text style={styles.itemValue}>{item.username || 'N/A'}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Price/Day:</Text>
        <Text style={styles.itemValue}>${item.pricePerDay || '0'}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Condition:</Text>
        <Text style={styles.itemValue}>{item.condition || 'N/A'}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Available:</Text>
        <Text style={styles.itemValue}>
          {item.startDate} to {item.endDate}
        </Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>Description:</Text>
        <Text style={[styles.itemValue, { fontStyle: 'italic' }]}>
          {item.description || 'No description'}
        </Text>
      </View>
    </View>
  );

  // Report item component
  const ReportItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.reportCard, item.status === 'resolved' && styles.reportCardResolved]}
      onPress={() => {
        setSelectedReport(item);
        setShowReportDetails(true);
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <Text style={styles.reportTitle}>Report #{item.id.substring(0, 8)}</Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 'pending' && { backgroundColor: colors.warning },
              item.status === 'resolved' && { backgroundColor: colors.success },
            ]}
          >
            <Text style={styles.statusBadgeText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.reportDate}>
          {item.timestamp
            ? new Date(item.timestamp.toDate?.() || item.timestamp).toLocaleDateString()
            : 'N/A'}
        </Text>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.reportLabel}>Reported User:</Text>
        <Text style={styles.reportUserName}>{item.reportedUserName}</Text>
        <Text style={styles.reportUserEmail}>{item.reportedUserEmail}</Text>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.reportLabel}>Reporter:</Text>
        <Text style={styles.reportUserName}>{item.reporterName}</Text>
        <Text style={styles.reportUserEmail}>{item.reporterEmail}</Text>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.reportLabel}>Reason:</Text>
        <Text style={styles.reportReason}>{item.reason}</Text>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.reportLabel}>Description:</Text>
        <Text style={[styles.reportDescription, { maxHeight: 60 }]}>
          {item.description}
        </Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.reportButtonsContainer}>
          <TouchableOpacity
            style={[styles.reportButton, styles.suspendButton]}
            onPress={() => handleSuspendAccount(item)}
            disabled={suspendingUserId === item.reportedUserId}
          >
            {suspendingUserId === item.reportedUserId ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.suspendButtonText}>Suspend Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportButton, styles.emailButton]}
            onPress={() => handleSendSuspensionEmail(item)}
            disabled={suspendingUserId === item.reportedUserId}
          >
            <Text style={styles.emailButtonText}>Send Email</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>System Management</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'reports' && styles.tabTextActive,
            ]}
          >
            Reports ({reports.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'users' && styles.tabTextActive,
            ]}
          >
            Users ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'objects' && styles.tabActive]}
          onPress={() => setActiveTab('objects')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'objects' && styles.tabTextActive,
            ]}
          >
            Objects ({objects.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'reports' ? (
          // Reports Tab
          <>
            {loadingReports ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading reports...</Text>
              </View>
            ) : reports.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reports found</Text>
              </View>
            ) : (
              <FlatList
                data={reports}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ReportItem item={item} />}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true}
              />
            )}
          </>
        ) : activeTab === 'users' ? (
          // Users Tab
          <>
            {loadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : users.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <UserItem item={item} />}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true}
              />
            )}
          </>
        ) : (
          // Objects Tab
          <>
            {loadingObjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading objects...</Text>
              </View>
            ) : objects.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No objects found</Text>
              </View>
            ) : (
              <FlatList
                data={objects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ObjectItem item={item} />}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true}
              />
            )}
          </>
        )}
      </View>

      {/* Report Details Modal */}
      <Modal
        visible={showReportDetails}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReportDetails(false)}>
              <Text style={styles.modalCloseButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedReport && (
              <>
                {/* Report Status */}
                <View
                  style={[
                    styles.statusSection,
                    selectedReport.status === 'pending' &&
                      { backgroundColor: '#FFF9E6' },
                    selectedReport.status === 'resolved' &&
                      { backgroundColor: '#E6F9F0' },
                  ]}
                >
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      selectedReport.status === 'pending' &&
                        { color: colors.warning },
                      selectedReport.status === 'resolved' &&
                        { color: colors.success },
                    ]}
                  >
                    {selectedReport.status?.toUpperCase()}
                  </Text>
                </View>

                {/* Reported User Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Reported User</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.reportedUserName}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.reportedUserEmail}
                    </Text>
                  </View>
                </View>

                {/* Reporter Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Reporter</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.reporterName}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.reporterEmail}
                    </Text>
                  </View>
                </View>

                {/* Report Reason */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Reason</Text>
                  <Text style={styles.detailReason}>{selectedReport.reason}</Text>
                </View>

                {/* Report Description */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.detailDescription}>
                    {selectedReport.description}
                  </Text>
                </View>

                {/* Report Date */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Submitted</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport.timestamp
                      ? new Date(
                          selectedReport.timestamp.toDate?.() ||
                            selectedReport.timestamp
                        ).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>

                {/* Action Buttons */}
                {selectedReport.status === 'pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => {
                        handleSuspendAccount(selectedReport);
                        setShowReportDetails(false);
                      }}
                    >
                      <Text style={styles.suspendButtonText}>
                        Suspend Account
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.emailButton]}
                      onPress={() => {
                        handleSendSuspensionEmail(selectedReport);
                        setShowReportDetails(false);
                      }}
                    >
                      <Text style={styles.emailButtonText}>Send Email</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.lightBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightText,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemLabel: {
    fontWeight: '600',
    color: colors.lightText,
    fontSize: 12,
    minWidth: 80,
  },
  itemValue: {
    color: colors.text,
    fontSize: 12,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.lightText,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.lightText,
    fontSize: 16,
    fontWeight: '500',
  },
  reportCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportCardResolved: {
    opacity: 0.6,
    backgroundColor: '#F9F9F9',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  reportDate: {
    fontSize: 12,
    color: colors.lightText,
  },
  reportSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.lightText,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reportUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  reportUserEmail: {
    fontSize: 12,
    color: colors.lightText,
  },
  reportReason: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  reportDescription: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  reportButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reportButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suspendButton: {
    backgroundColor: colors.error,
  },
  suspendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emailButton: {
    backgroundColor: colors.secondary,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Modal Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusSection: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.lightText,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailSection: {
    backgroundColor: colors.lightBg,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightText,
    minWidth: 70,
  },
  detailValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  detailReason: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  detailDescription: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
