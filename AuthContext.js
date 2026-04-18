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
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Check if admin
        if (authUser.email === 'adminpanel@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        // Fetch username, phone, and borough from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
            setPhoneNumber(userDoc.data().phoneNumber || null);
            setBorough(userDoc.data().borough || null);
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
                setUsername('Admin');
              } catch (createError) {
                console.error('Error creating admin user record:', createError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUsername(null);
        setPhoneNumber(null);
        setBorough(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
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
