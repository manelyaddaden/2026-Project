import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Development/Testing utilities for the report system
 * Use these functions to test the report feature without Cloud Functions
 */

/**
 * Create a test report directly (for testing without Cloud Functions)
 */
export const createTestReport = async (
  reporterUid,
  reporterName,
  reporterEmail,
  reportedUserId,
  reportedUserEmail,
  reportedUserName,
  reason = 'fraud',
  description = 'Test report for development'
) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      reporterId: reporterUid,
      reporterName: reporterName,
      reporterEmail: reporterEmail,
      reportedUserId: reportedUserId,
      reportedUserEmail: reportedUserEmail,
      reportedUserName: reportedUserName,
      reason: reason,
      description: description,
      timestamp: serverTimestamp(),
      status: 'pending',
    });
    console.log('Test report created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test report:', error);
    throw error;
  }
};

/**
 * Log available reports for debugging
 */
export const logReports = async () => {
  try {
    const reportsSnapshot = await getDocs(collection(db, 'reports'));
    console.log('=== REPORTS ===');
    reportsSnapshot.forEach((doc) => {
      console.log('ID:', doc.id);
      console.log('Data:', doc.data());
      console.log('---');
    });
  } catch (error) {
    console.error('Error logging reports:', error);
  }
};

// For quick testing in React Native console:
// First import this:
// import * as testUtils from './reportTestUtils';

// Then call in console:
// testUtils.createTestReport(
//   'uid123',
//   'Test Reporter',
//   'reporter@example.com',
//   'uid456',
//   'reported@example.com',
//   'Reported User',
//   'fraud',
//   'This is a test report for development purposes'
// )
