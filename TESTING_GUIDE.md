# Testing Guide - Report Feature & Logout Fix

## ✅ Test 1: Report Feature (After Firestore Rules Update)

### Setup
- You need TWO accounts:
  - Regular user account (any email)
  - Admin account: `adminpanel@gmail.com`

### Steps
1. **Log in as regular user**
   ```
   Email: youruser@example.com
   ```

2. **Find a product listing and click on it**

3. **Click "🚩 Report User" button** at the bottom

4. **Fill out report form:**
   - Select reason: "Fraud or Scam"
   - Write description: "This user is not trustworthy"
   - Click "Submit Report"

5. **Expected Result:**
   - ✅ NO error in console
   - ✅ Popup appears: "Report Submitted ✓"
   - ✅ Click OK → Returns to home page

6. **Verify in Admin Panel:**
   - Log out
   - Log in as: `adminpanel@gmail.com`
   - Click "Admin Panel" (should open automatically)
   - Click "Reports" tab
   - ✅ See your report in the list

---

## ✅ Test 2: Logout Button

### Setup
- Logged in as admin: `adminpanel@gmail.com`
- Admin Panel is open

### Steps
1. **Click "Logout" button** in top-right of Admin Panel header

2. **Confirm dialog appears:**
   - "Are you sure you want to logout?"
   - Click "Logout" button

3. **Expected Result:**
   - ✅ Admin Panel closes
   - ✅ Auth Screen appears (login form)
   - ✅ Ready to log in again
   - ✅ No console errors

4. **Can log back in:**
   - Enter email: `adminpanel@gmail.com`
   - Enter password
   - Click Login
   - ✅ Admin Panel opens again

---

## ✅ Test 3: Objects Tab Scrolling

### Setup
- Logged in as admin
- Admin Panel open

### Steps
1. **Click "Objects" tab** (if not already selected)

2. **Look at object count:**
   - Should say "Objects (7)" or more

3. **Try to scroll down:**
   - Scroll with your finger/mouse on the objects list
   - ✅ All objects visible (not just first 3)
   - ✅ Can scroll to see all items

---

## Common Issues & Fixes

### Issue: Report Submit Still Shows Permission Error

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lendify-33a22`
3. Click Firestore Database → Rules tab
4. Paste the new rules from `FIX_FIRESTORE_RULES.md`
5. Click **Publish**
6. Wait 30 seconds
7. Try report again

### Issue: Logout Doesn't Work

**Solution:**
1. Make sure you're clicking the "Logout" button in Admin Panel header
2. Click "Logout" in the confirmation dialog
3. If still not working:
   - Check browser console for errors
   - Try hard refresh: Ctrl+Shift+R or Cmd+Shift+R
   - Restart the dev server

### Issue: Can't See Reports in Admin Panel

**Solution:**
1. Make sure you're logged in as: `adminpanel@gmail.com`
2. Make sure you actually submitted a report (test from regular user first)
3. Check Firestore Console directly:
   - Go to Firebase > Firestore Database
   - Click `reports` collection
   - You should see your reports there
4. If you see reports in Firestore but not in app:
   - Refresh the app
   - Check for console errors

---

## How to Apply Firestore Rules Update

### Option 1: Quick Copy-Paste (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project: `lendify-33a22`
3. Firestore Database → Rules
4. Select ALL current rules and delete
5. Paste the rules from `FIX_FIRESTORE_RULES.md`
6. Click **Publish**

### Option 2: Use Firebase CLI
```bash
firebase login
firebase deploy --only firestore:rules
```

---

## Success Checklist

- [ ] Firestore rules updated and published
- [ ] Can submit reports without permission error
- [ ] Report appears in admin panel
- [ ] Logout button works perfectly
- [ ] Returns to auth screen after logout
- [ ] Can scroll all objects in Objects tab
- [ ] Everything working! 🎉

---

## Questions?

- **Firestore rules**: See `FIX_FIRESTORE_RULES.md`
- **Report feature**: See `REPORT_FEATURE_SUMMARY.md`
- **Integration guide**: See `REPORT_INTEGRATION_GUIDE.md`
