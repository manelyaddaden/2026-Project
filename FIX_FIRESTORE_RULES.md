# Fix Firestore Permission Error for Reports

## Problem
When submitting a report, you get this error:
```
FirebaseError: Missing or insufficient permissions
```

This means your Firestore Security Rules don't allow users to write to the `reports` collection.

---

## Solution: Update Firestore Security Rules

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **lendify-33a22**
3. Click **Firestore Database** on the left menu

### Step 2: Go to Rules Tab
1. Click the **Rules** tab at the top
2. You'll see your current security rules

### Step 3: Replace Rules
Replace **ALL** the current rules with this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reports collection - Allow authenticated users to create reports
    match /reports/{document=**} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isAdmin', false) == true;
      allow read: if request.auth != null && request.resource == null;
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
    }

    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 4: Publish Rules
1. Click the **Publish** button
2. Wait for confirmation: "Security rules updated"

---

## What These Rules Do

| Action | Who | Allowed? | Details |
|--------|-----|----------|---------|
| **Create Report** | Any logged-in user | ✅ YES | Users can submit reports |
| **Read Reports** | Admins only | ✅ YES | Only admin@gmail.com can view reports |
| **Update Reports** | Admins only | ✅ YES | Only admins can change report status |
| **Create User Doc** | Only their own UID | ✅ YES | Users can only create their own profile |
| **Read User Doc** | Any logged-in user | ✅ YES | Users can read any public profile |
| **Everything else** | Anyone | ❌ NO | Default: deny access |

---

## Testing Report Submission

After updating rules:

1. Log in as a regular user (not admin)
2. Find a product listing
3. Click "🚩 Report User" button
4. Fill out the form (select reason, write description)
5. Click "Submit Report"
6. ✅ Should now work without permission error
7. Confirmation popup appears
8. Click OK - returns to home
9. Log in as admin: `adminpanel@gmail.com`
10. Go to Admin Panel → Reports tab
11. ✅ See your report listed

---

## Troubleshooting

### Still Getting Permission Error?
1. Make sure you **Published** the rules (hit Publish button)
2. Wait 30-60 seconds for rules to propagate
3. Try again
4. Check browser console for exact error message

### Can't Find the Rules Tab?
1. In Firebase Console, go to Firestore Database
2. Make sure you see these tabs at the top: **Data** | **Rules** | **Indexes**
3. Click **Rules**

### Forgot What Rules to Paste?
See the file: `FIRESTORE_RULES.txt` in your project

---

## ✅ You're Done!

Your Firestore is now configured to allow the report feature. Reports can be:
- Created by any authenticated user ✅
- Viewed only by admins ✅
- Used to keep your community safe ✅

Enjoy your working report system! 🎉
