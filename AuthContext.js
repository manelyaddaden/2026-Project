import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [borough, setBorough] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    // Set a 10 second timeout to allow app to load even if Firebase is slow
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Firebase auth check timed out - proceeding with app load');
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!isMounted) return;

      try {
        if (authUser) {
          setUser(authUser);
          // Check if admin
          if (authUser.email === 'adminpanel@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          // Fetch username, phone, and borough from Firestore with timeout
          try {
            const userDoc = await Promise.race([
              getDoc(doc(db, 'users', authUser.uid)),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore getDoc timeout')), 8000)
              ),
            ]);
            if (userDoc.exists()) {
              if (isMounted) {
                setUsername(userDoc.data().username);
                setPhoneNumber(userDoc.data().phoneNumber || null);
                setBorough(userDoc.data().borough || null);
              }
            } else {
              // For admin, create a basic record if it doesn't exist
              if (authUser.email === 'adminpanel@gmail.com') {
                try {
                  await setDoc(doc(db, 'users', authUser.uid), {
                    username: 'Admin',
                    email: authUser.email,
                    phoneNumber: '',
                    borough: '',
                    createdAt: new Date().toISOString(),
                    isAdmin: true,
                  });
                  if (isMounted) {
                    setUsername('Admin');
                  }
                } catch (createError) {
                  console.error('Error creating admin user record:', createError);
                }
              }
            }
          } catch (firestoreError) {
            console.warn('Firestore fetch error (app will still load):', firestoreError.message);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setUsername(null);
            setPhoneNumber(null);
            setBorough(null);
            setIsAdmin(false);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, username, phoneNumber, borough) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Store username, phone, and borough in Firestore
      await setDoc(doc(db, 'users', uid), {
        username: username,
        email: email,
        phoneNumber: phoneNumber || '',
        borough: borough || '',
        createdAt: new Date().toISOString(),
      });

      // Don't set user state here - let onAuthStateChanged handle it
      return { success: true };
    } catch (error) {
      console.error('SignUp error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Don't set user state here - let onAuthStateChanged handle it
      // Just return success
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUsername(null);
      setIsAdmin(false);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        phoneNumber,
        borough,
        loading,
        isAdmin,
        signUp,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
