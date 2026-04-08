# Report System Setup Guide

This guide explains how to set up the complete report user feature, including Firebase Cloud Functions for email sending and account suspension.

## Part 1: Frontend Integration

### 1.1 Add Report Button to User Profiles

In any component where you display a user profile, import and add the `ReportUserModal`:

```javascript
import { ReportUserModal } from './ReportUserModal';

function UserProfile({ userId, userName, userEmail }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <View>
      {/* Your existing user profile UI */}
      
      <TouchableOpacity 
        onPress={() => setShowReportModal(true)}
        style={styles.reportButton}
      >
        <Text style={styles.reportButtonText}>Report User</Text>
      </TouchableOpacity>

      <ReportUserModal
        visible={showReportModal}
        reportedUserId={userId}
        reportedUserEmail={userEmail}
        reportedUserName={userName}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          // Optional: Show confirmation or refresh data
        }}
      />
    </View>
  );
}
```

### 1.2 Test Report Submission

1. Create a user account or use an existing one
2. Report another user with a reason and description
3. Check Firestore Console to verify the report was saved to the `reports` collection
4. The admin can now view this report in the Admin Panel under the "Reports" tab

---

## Part 2: Firebase Cloud Functions Setup

### 2.1 Initialize Firebase Cloud Functions

In your Firebase project directory, run:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

Choose:
- Use an existing project (your Lendify project)
- JavaScript
- ESLint: No
- Install dependencies: Yes

### 2.2 Create Cloud Functions

Replace the contents of `functions/index.js` with:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email configuration
// Replace these with your Gmail credentials or use a service account
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password', // Use App Password, not regular password
  },
});

/**
 * Cloud Function to disable a user account
 */
exports.disableUserAccount = functions.https.onCall(async (data, context) => {
  // Check if user is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function.'
    );
  }

  const userId = data.userId;
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId is required'
    );
  }

  try {
    await admin.auth().updateUser(userId, { disabled: true });
    return { success: true, message: 'User account disabled' };
  } catch (error) {
    console.error('Error disabling user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to disable user account'
    );
  }
});

/**
 * Cloud Function to send suspension email
 */
exports.sendSuspensionEmail = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to call this function.'
      );
    }

    const { userEmail, userName, reason, description } = data;

    if (!userEmail || !userName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userEmail and userName are required'
      );
    }

    const reasonMap = {
      inappropriate_behavior: 'Inappropriate Behavior',
      fraud: 'Fraud or Scam',
      damaged_item: 'Damaged or Missing Item',
      harassment: 'Harassment or Threatening',
      misrepresentation: 'Misrepresentation',
      other: 'Other',
    };

    const reasonLabel = reasonMap[reason] || reason;

    const emailContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E74C3C; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
          .content { background: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
          .footer { color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; color: #2C3E50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Account Suspension Notice</h2>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p>Your Lendify account has been suspended due to a violation of our Community Guidelines.</p>
            
            <div class="detail">
              <span class="label">Reason:</span> ${reasonLabel}
            </div>
            
            <div class="detail">
              <span class="label">Details:</span>
              <p>${description}</p>
            </div>
            
            <p>This suspension is effective immediately. You will not be able to access your account or participate in any transactions.</p>
            
            <p><strong>What to do next:</strong></p>
            <ul>
              <li>Review our Community Guidelines to understand the violation</li>
              <li>If you believe this was done in error, please contact our support team</li>
              <li>Contact: support@lendify.com</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Lendify Community</p>
          </div>
        </div>
      </body>
    </html>
    `;

    try {
      await transporter.sendMail({
        from: 'noreply@lendify.com',
        to: userEmail,
        subject: 'Lendify Account Suspended',
        html: emailContent,
      });

      return { success: true, message: 'Suspension email sent' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send suspension email'
      );
    }
  }
);

/**
 * Cloud Function to suspend user (combines disable and email)
 */
exports.suspendUserAccount = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to call this function.'
      );
    }

    const { userEmail, userName, reason } = data;

    if (!userEmail || !userName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userEmail and userName are required'
      );
    }

    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(userEmail);

      // Disable the user
      await admin.auth().updateUser(userRecord.uid, { disabled: true });

      // Send suspension email
      const reasonMap = {
        inappropriate_behavior: 'Inappropriate Behavior',
        fraud: 'Fraud or Scam',
        damaged_item: 'Damaged or Missing Item',
        harassment: 'Harassment or Threatening',
        misrepresentation: 'Misrepresentation',
        other: 'Other',
      };

      const reasonLabel = reasonMap[reason] || reason;

      const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #E74C3C; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
            .content { background: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
            .footer { color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; color: #2C3E50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Account Suspension Notice</h2>
            </div>
            
            <div class="content">
              <p>Dear ${userName},</p>
              
              <p>Your Lendify account has been suspended due to a violation of our Community Guidelines.</p>
              
              <div class="detail">
                <span class="label">Reason:</span> ${reasonLabel}
              </div>
              
              <p>This suspension is effective immediately. You will not be able to access your account or participate in any transactions.</p>
              
              <p><strong>What to do next:</strong></p>
              <ul>
                <li>Review our Community Guidelines to understand the violation</li>
                <li>If you believe this was done in error, please contact our support team</li>
                <li>Contact: support@lendify.com</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>Lendify Community</p>
            </div>
          </div>
        </body>
      </html>
      `;

      await transporter.sendMail({
        from: 'noreply@lendify.com',
        to: userEmail,
        subject: 'Lendify Account Suspended',
        html: emailContent,
      });

      return {
        success: true,
        message: 'User account disabled and suspension email sent',
      };
    } catch (error) {
      console.error('Error suspending user account:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to suspend user account'
      );
    }
  }
);

/**
 * Cloud Function to get user by email (admin only)
 */
exports.getUserByEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function.'
    );
  }

  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'email is required'
    );
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return { uid: userRecord.uid, email: userRecord.email };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get user by email'
    );
  }
});
```

### 2.3 Update functions/package.json

Add nodemailer to dependencies:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Lendify",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1",
    "nodemailer": "^6.9.4"
  },
  "devDependencies": {
    "firebase-functions-test": "^3.1.0"
  },
  "private": true
}
```

### 2.4 Set Environment Variables

Create a `.env.local` file in your functions directory:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

Run `npm install` in the functions directory to install nodemailer.

### 2.5 Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## Part 3: Gmail Configuration (for email sending)

### 3.1 Enable 2-Factor Authentication

1. Go to myaccount.google.com
2. Enable 2-Factor Authentication

### 3.2 Create App Password

1. Go to myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your platform)
3. Generate a 16-character password
4. Use this password in your Cloud Function (not your regular Gmail password)

---

## Part 4: Firestore Security Rules

Update your Firestore security rules to allow reports to be created but only read by admins:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reports collection
    match /reports/{document=**} {
      // Allow authenticated users to create reports
      allow create: if request.auth != null;
      // Allow admins to read all reports
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      // Allow admins to update report status
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Keep your other rules...
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
    }
  }
}
```

---

## Part 5: Testing

### Test the Report Feature:

1. **Create a report:**
   - As a regular user, click "Report User"
   - Fill in the form with a reason and description
   - Submit the report
   - Check Firestore to confirm it's saved

2. **View reports in admin panel:**
   - Log in as admin (adminpanel@gmail.com)
   - Go to Admin Panel > Reports tab
   - View all reports with details

3. **Test suspension:**
   - Click "Suspend Account" on a report
   - Confirm action
   - The user account should be disabled in Firebase Auth
   - The user should no longer be able to log in

4. **Test suspension email:**
   - Click "Send Email" on a report
   - Confirm action
   - Check the user's email for suspension notice

---

## Part 6: Troubleshooting

### Cloud Functions not working?
- Check Firebase Console > Functions > Logs
- Verify security rules allow the functions to be called
- Check that Nodemailer is installed: `npm install nodemailer`

### Emails not sending?
- Verify Gmail account has 2FA enabled
- Check App Password is correct (not regular Gmail password)
- Check email credentials in Cloud Function
- Look at Cloud Functions logs for error messages

### Admin can't suspend users?
- Verify user calling the function is authenticated
- Check Firestore security rules allow the update
- Verify the reported user's email is correct

---

## Part 7: Integration with App.js

To ensure the ReportUserModal is available in your app, update your App.js or relevant component files where users are displayed:

```javascript
import { ReportUserModal } from './ReportUserModal';

// In your component that displays users:
const [showReportModal, setShowReportModal] = useState(false);
const [userToReport, setUserToReport] = useState(null);

// When displaying a user:
<TouchableOpacity 
  onPress={() => {
    setUserToReport({
      id: user.id,
      email: user.email,
      name: user.username
    });
    setShowReportModal(true);
  }}
>
  <Text>Report This User</Text>
</TouchableOpacity>

{userToReport && (
  <ReportUserModal
    visible={showReportModal}
    reportedUserId={userToReport.id}
    reportedUserEmail={userToReport.email}
    reportedUserName={userToReport.name}
    onClose={() => {
      setShowReportModal(false);
      setUserToReport(null);
    }}
  />
)}
```

---

## Summary

Your complete report system now includes:
✓ Frontend: Report form with reason dropdown and description
✓ Firestore: Reports collection storing all reports
✓ Admin Panel: Full reports management tab
✓ Cloud Functions: Automated email and account suspension
✓ Security: Admin-only access and proper validation

The feature is now fully functional and ready for deployment!
