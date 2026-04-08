# Quick Reference Guide - Report System

## 🚀 Quick Start

### Step 1: Frontend (Immediate - No setup required)
```bash
# No installation needed!
# All files are included and use existing dependencies
```

### Step 2: Add to Your App
```javascript
// In any component where you want to show Report button:
import { ReportUserModal } from './ReportUserModal';

// Add state:
const [showReportModal, setShowReportModal] = useState(false);

// Add button:
<TouchableOpacity onPress={() => setShowReportModal(true)}>
  <Text>Report User</Text>
</TouchableOpacity>

// Add modal (in return JSX):
<ReportUserModal
  visible={showReportModal}
  reportedUserId={userId}
  reportedUserEmail={userEmail}
  reportedUserName={userName}
  onClose={() => setShowReportModal(false)}
/>
```

### Step 3: Test It
1. Create a report as a regular user
2. Open Firestore Console → reports collection
3. Verify report is saved
4. Log in as admin (adminpanel@gmail.com)
5. See reports in Admin Panel

### Step 4: Set Up Cloud Functions (Optional, for suspension/email)
See **REPORT_SYSTEM_SETUP.md** Part 2-3

---

## 📦 Dependencies

### Already Installed (No action needed):
```json
{
  "firebase": "^12.10.0"  // Includes Firestore, Auth, Functions
}
```

### For Cloud Functions (When setting up):
```bash
npm install nodemailer  // In functions directory only
```

---

## 🔗 Files Quick Reference

| File | Purpose | When to Use |
|------|---------|-----------|
| `ReportUserModal.js` | Report form | Import in your UI components |
| `reportService.js` | API functions | Already used by AdminPanel |
| `AdminPanel.js` | Admin interface | Opens automatically for admins |
| `reportTestUtils.js` | Dev utilities | Optional, for testing |
| `REPORT_SYSTEM_SETUP.md` | Cloud Functions setup | When ready for emails/suspension |
| `REPORT_INTEGRATION_GUIDE.md` | Integration steps | For adding Report button to UI |
| `REPORT_FEATURE_SUMMARY.md` | Overview | Reference guide |

---

## ✨ Key Features

### User Features:
- ✅ Report user with reason and description
- ✅ Form validation
- ✅ Confirmation message
- ✅ Real-time data storage

### Admin Features:
- ✅ View all reports
- ✅ Suspend accounts with one click
- ✅ Send suspension emails
- ✅ Track report status
- ✅ Full report details modal
- ✅ Secure logout

### Security:
- ✅ Authenticated users only
- ✅ Admin-only access to reports
- ✅ Firestore security rules
- ✅ Input validation

---

## 🎯 Common Tasks

### Add Report Button to Profile View
```javascript
<TouchableOpacity 
  style={styles.reportButton}
  onPress={() => setShowReportModal(true)}
>
  <Text>Report This User</Text>
</TouchableOpacity>
```

### View Reports as Admin
1. Log in: `adminpanel@gmail.com`
2. Go to Admin Panel (auto-opens)
3. Click Reports tab

### Handle Report Success
```javascript
<ReportUserModal
  ...
  onSuccess={() => {
    Alert.alert('Success', 'Report submitted');
  }}
/>
```

### Test Without Cloud Functions
Just create reports and view them in admin panel - suspension/email features require Cloud Functions (see setup guide).

---

## 🔍 API Reference

### ReportUserModal Props
```typescript
interface ReportUserModalProps {
  visible: boolean           // Show/hide modal
  reportedUserId: string    // UID of reported user
  reportedUserEmail: string // Email of reported user
  reportedUserName: string  // Name of reported user
  onClose: () => void       // Close handler
  onSuccess?: () => void    // Success callback (optional)
}
```

### ReportService Functions
```typescript
// Get all reports
fetchAllReports(): Promise<Report[]>

// Listen for real-time updates
listenToReports(callback): () => void

// Update report status
updateReportStatus(reportId: string, status: string): Promise<void>

// Suspend user account
suspendUserAccount(email: string, name: string, reason: string): Promise<any>

// Send suspension email
sendSuspensionEmail(email: string, name: string, reason: string, description: string): Promise<any>

// Disable user in Firebase Auth
disableUserAccount(userId: string): Promise<any>
```

### Report Data Structure
```typescript
interface Report {
  id: string                    // Document ID
  reporterId: string           // UID of reporter
  reporterName: string
  reporterEmail: string
  reportedUserId: string       // UID of reported user
  reportedUserEmail: string
  reportedUserName: string
  reason: string               // From dropdown
  description: string          // Free text
  timestamp: Timestamp         // Auto-set
  status: 'pending' | 'resolved' | 'dismissed'
}
```

---

## 🛠️ Troubleshooting

### "ReportUserModal not found"
→ Make sure file is in same directory as App.js

### "Reports not showing in admin panel"
→ Check Firestore Console > reports collection for data

### "Import errors for reportService"
→ Place reportService.js in same directory

### "Buttons not working"
→ Make sure you have state: `const [showReportModal, setShowReportModal] = useState(false);`

### "Admin panel won't open"
→ Log in as `adminpanel@gmail.com` exactly

---

## 📋 Checklist

- [ ] Import ReportUserModal where needed
- [ ] Add Report button to UI
- [ ] Add ReportUserModal component
- [ ] Test creating a report
- [ ] Check Firestore for saved report
- [ ] Log in as admin to verify in Admin Panel
- [ ] (Optional) Set up Cloud Functions for emails/suspension

---

## 💡 Pro Tips

1. **Test Early**: Create a test report before setting up Cloud Functions
2. **Use Admin Tools**: Check Firestore Console to understand data structure
3. **Deploy Later**: Cloud Functions can be added later without affecting report creation
4. **Monitor Logs**: Check Cloud Functions logs for any email sending issues
5. **Customize Reasons**: Edit REPORT_REASONS in ReportUserModal.js to add your own

---

## 📞 Quick Help

**Setup help?** → See REPORT_INTEGRATION_GUIDE.md
**Cloud Functions?** → See REPORT_SYSTEM_SETUP.md
**Full overview?** → See REPORT_FEATURE_SUMMARY.md
**Need examples?** → See REPORT_INTEGRATION_GUIDE.md Part 2

---

## 🎉 Ready to Go!

Your report system is ready to use. Start by following "Step 2: Add to Your App" above.

Good luck! 🚀
