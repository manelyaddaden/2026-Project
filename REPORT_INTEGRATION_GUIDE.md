# Report System Integration Guide

## Overview

This guide explains how to integrate the Report User feature into your Lendify app with complete code examples.

## Components Added

1. **ReportUserModal.js** - Modal form for reporting users
2. **reportService.js** - Service functions for Firestore and Cloud Functions
3. **AdminPanel.js** (updated) - Added Reports tab with full management interface
4. **reportTestUtils.js** - Development utilities for testing

---

## Step 1: Import ReportUserModal in Your App

First, add the import at the top of the files where you want to show the Report button:

```javascript
import { ReportUserModal } from './ReportUserModal';
```

---

## Step 2: Add Report Button to User Profile View

In your **ProfilePage** component or any user profile view, add state for the report modal:

```javascript
const [showReportModal, setShowReportModal] = useState(false);
```

Then add the Report button to your UI (example for ProfilePage):

```javascript
{/* Add this button in the profile header or action buttons area */}
<TouchableOpacity
  style={styles.reportUserButton}
  onPress={() => setShowReportModal(true)}
>
  <Text style={styles.reportUserButtonText}>Report User</Text>
</TouchableOpacity>
```

And add the modal component at the end of your component (before the return closing tag):

```javascript
{/* Add this near the end of ProfilePage component */}
<ReportUserModal
  visible={showReportModal}
  reportedUserId={user.uid}
  reportedUserEmail={user.email}
  reportedUserName={user.username}
  onClose={() => setShowReportModal(false)}
  onSuccess={() => {
    // Optional: Show message or refresh
    Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
  }}
/>
```

### Styling for Report Button

Add these styles to your stylesheet:

```javascript
reportUserButton: {
  backgroundColor: colors.error,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginTop: 12,
},
reportUserButtonText: {
  color: '#FFFFFF',
  fontWeight: '700',
  fontSize: 14,
  textAlign: 'center',
},
```

---

## Step 3: Add Report Button to User Cards (for Listings)

If you have user listings or user cards (e.g., in search results, messages, etc.), add a Report option:

### Example: In a User List Item

```javascript
function UserListItem({ user, onReport }) {
  return (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.username}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => onReport(user)}
      >
        <Text style={styles.reportButtonText}>Report</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Then in the parent component:

```javascript
const [userToReport, setUserToReport] = useState(null);
const [showReportModal, setShowReportModal] = useState(false);

const handleReportUser = (user) => {
  setUserToReport(user);
  setShowReportModal(true);
};

return (
  <View>
    <FlatList
      data={users}
      renderItem={({ item }) => (
        <UserListItem 
          user={item} 
          onReport={handleReportUser}
        />
      )}
      keyExtractor={(item) => item.id}
    />

    {userToReport && (
      <ReportUserModal
        visible={showReportModal}
        reportedUserId={userToReport.id}
        reportedUserEmail={userToReport.email}
        reportedUserName={userToReport.username}
        onClose={() => {
          setShowReportModal(false);
          setUserToReport(null);
        }}
        onSuccess={() => {
          setUserToReport(null);
        }}
      />
    )}
  </View>
);
```

---

## Step 4: Set Up Admin Access

The Admin Panel automatically shows the Reports tab when you log in as admin.

**To access the Admin Panel:**
1. Make sure you're logged in as `adminpanel@gmail.com`
2. The Admin Panel will display automatically
3. Click on the "Reports" tab to see all reports

**To enable admin features in the app:**
- The app checks for admin status in AuthContext
- Admin is identified by email: `adminpanel@gmail.com`

---

## Step 5: View and Manage Reports

### Accessing Reports (Admin)

1. Log in as `adminpanel@gmail.com`
2. Navigate to Admin Panel
3. Click on "Reports" tab
4. You'll see all user reports with:
   - Reported user name and email
   - Reporter name and email
   - Report reason and description
   - Report date
   - Current status (Pending/Resolved)

### Managing Reports

**On each report card:**

- **Suspend Account** button (red) - Disables the reported user's account immediately
- **Send Email** button (blue) - Sends suspension notification to the user

**In Report Details (click on a report to expand):**
- Full report information
- Action buttons with confirmation dialogs
- Report status display

---

## Step 6: Complete Example Integration

Here's a complete example showing how to integrate everything in your App.js:

```javascript
import { ReportUserModal } from './ReportUserModal';

function MainApp() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [userToReport, setUserToReport] = useState(null);

  // When viewing another user's profile or in a user card
  const handleReportUser = (userId, userEmail, userName) => {
    setUserToReport({
      id: userId,
      email: userEmail,
      name: userName,
    });
    setShowReportModal(true);
  };

  // When user closes the report modal
  const handleReportClose = () => {
    setShowReportModal(false);
    setUserToReport(null);
  };

  // After successful report
  const handleReportSuccess = () => {
    setUserToReport(null);
    // Optional: Show message, refresh list, etc.
  };

  return (
    <View style={styles.container}>
      {/* Your app content */}
      
      {/* Report Modal */}
      {userToReport && (
        <ReportUserModal
          visible={showReportModal}
          reportedUserId={userToReport.id}
          reportedUserEmail={userToReport.email}
          reportedUserName={userToReport.name}
          onClose={handleReportClose}
          onSuccess={handleReportSuccess}
        />
      )}
    </View>
  );
}
```

---

## Step 7: Testing Without Cloud Functions (Development)

During development, you can test report creation without setting up Cloud Functions:

1. **Create a test report:**
   - Use the ReportUserModal with any user
   - Submit the form
   - Check Firestore Console to verify it was saved

2. **View reports in Admin Panel:**
   - Open Firestore Console
   - Go to the "reports" collection
   - You should see your test report

3. **Set up Cloud Functions later:**
   - Follow the steps in REPORT_SYSTEM_SETUP.md
   - Then suspension and email features will work

---

## Step 8: Security Rules

Update your Firestore security rules to:
1. Allow any authenticated user to create reports
2. Allow only admins to read/update reports

```
match /reports/{document=**} {
  // Allow authenticated users to create reports
  allow create: if request.auth != null;
  
  // Allow admins to read all reports
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
  
  // Allow admins to update report status
  allow update: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

---

## Summary: What's Available Now

✓ **Users can:**
- Report other users with a reason and description
- See real-time form validation
- Get confirmation that report was submitted

✓ **Admins can:**
- View all reports in a dedicated tab
- See reporter and reported user information
- View report reason and detailed description
- Click on reports to see full details
- Suspend user accounts with one click
- Send suspension notification emails
- Mark reports as resolved
- Logout securely

✓ **Reports data includes:**
- Report ID and timestamp
- Reporter name and email
- Reported user name and email
- Report reason (from predefined list)
- Description (detailed explanation)
- Status (Pending/Resolved)

---

## Troubleshooting

**Q: Report button not showing?**
A: Make sure you added the `ReportUserModal` component import and the button to your UI.

**Q: Reports not appearing in admin panel?**
A: 
- Check Firestore console to see if reports are being saved
- Make sure you're logged in as admin@example.com
- Check browser console for errors

**Q: Suspension not working?**
A: Cloud Functions need to be set up. Follow REPORT_SYSTEM_SETUP.md

**Q: Email not sending?**
A: Cloud Functions and Nodemailer configuration needed. See REPORT_SYSTEM_SETUP.md

---

## Next Steps

1. Add the Report button to your user profile views
2. Test creating a report
3. Verify it appears in Admin Panel
4. Set up Cloud Functions for suspension and emails
5. Test the complete workflow

See **REPORT_SYSTEM_SETUP.md** for Cloud Functions setup!
