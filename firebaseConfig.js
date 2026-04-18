import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCQqXAD4Mv3FCyb_1nDR212040sK9l50Hs",
  authDomain: "lendify-33a22.firebaseapp.com",
  projectId: "lendify-33a22",
  storageBucket: "lendify-33a22.firebasestorage.app",
  messagingSenderId: "935209715452",
  appId: "1:935209715452:web:1cf478801c7ef71343b979",
  databaseURL: "https://lendify-33a22-default-rtdb.firebaseio.com"
};

// Prevent multiple Firebase app instances
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Use getAuth() instead of initializeAuth() to avoid re-initialization issues
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);