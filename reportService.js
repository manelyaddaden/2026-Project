import { db, auth } from './firebaseConfig';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

const functions = getFunctions();

/**
 * Fetch all reports from Firestore
 */
export const fetchAllReports = async () => {
  try {
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(reportsQuery);
    const reports = [];
    snapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return reports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

/**
 * Listen to reports in real-time
 */
export const listenToReports = (callback) => {
  try {
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reports = [];
      snapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(reports);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error listening to reports:', error);
    throw error;
  }
};

/**
 * Update report status
 */
export const updateReportStatus = async (reportId, status) => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

/**
 * Send suspension email and disable user account
 * This should be called from a Cloud Function for security
 */
export const suspendUserAccount = async (userEmail, userName, reason) => {
  try {
    // Call Cloud Function to suspend user and send email
    const suspendUser = httpsCallable(functions, 'suspendUserAccount');
    const result = await suspendUser({
      userEmail: userEmail,
      userName: userName,
      reason: reason,
    });
    return result.data;
  } catch (error) {
    console.error('Error suspending user account:', error);
    throw error;
  }
};

/**
 * Send suspension notification email
 * This should be called from a Cloud Function for security
 */
export const sendSuspensionEmail = async (
  userEmail,
  userName,
  reason,
  description
) => {
  try {
    // Call Cloud Function to send email
    const sendEmail = httpsCallable(functions, 'sendSuspensionEmail');
    const result = await sendEmail({
      userEmail: userEmail,
      userName: userName,
      reason: reason,
      description: description,
    });
    return result.data;
  } catch (error) {
    console.error('Error sending suspension email:', error);
    throw error;
  }
};

/**
 * Get user by email (to be used with Cloud Function)
 */
export const getUserByEmail = async (email) => {
  try {
    // This requires a Cloud Function because Firebase Auth doesn't expose
    // a client-side method to look up users by email
    const getUser = httpsCallable(functions, 'getUserByEmail');
    const result = await getUser({ email: email });
    return result.data;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Disable user account (must be done via Cloud Function)
 */
export const disableUserAccount = async (userId) => {
  try {
    const disableUser = httpsCallable(functions, 'disableUserAccount');
    const result = await disableUser({ userId: userId });
    return result.data;
  } catch (error) {
    console.error('Error disabling user account:', error);
    throw error;
  }
};
