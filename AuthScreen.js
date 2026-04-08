import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { AuthContext } from './AuthContext';

const colors = {
  primary: '#2E5090',
  secondary: '#4A90E2',
  accent: '#1ABC9C',
  background: '#FFFFFF',
  lightBg: '#F5F7FA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  border: '#D5DCEC',
  success: '#27AE60',
  error: '#E74C3C',
};

const MONTREAL_BOROUGHS = [
  'Ahuntsic–Cartierville',
  'Anjou',
  'Côte-des-Neiges–Notre-Dame-de-Grâce',
  'Lachine',
  'LaSalle',
  'Le Plateau-Mont-Royal',
  'Le Sud-Ouest',
  'L\'Île-Bizard–Sainte-Geneviève',
  'Mercier–Hochelaga-Maisonneuve',
  'Montréal-Nord',
  'Outremont',
  'Pierrefonds–Roxboro',
  'Rivière-des-Prairies–Pointe-aux-Trembles',
  'Rosemont–La Petite-Patrie',
  'Saint-Laurent',
  'Saint-Léonard',
  'Verdun',
  'Ville-Marie',
  'Villeray–Saint-Michel–Parc-Extension',
];

const TERMS_OF_USE = `Lendify – Terms of Use & Liability Disclaimer

By using the Lendify app, you acknowledge and agree to the following terms:

Lendify is a platform that connects users who wish to lend and borrow items. Lendify does not own, manage, inspect, or guarantee any items listed on the platform.

Users are solely responsible for their interactions, agreements, and transactions with other users.

Lendify is not responsible or liable for:

Any loss, theft, or damage to items
The condition, quality, or safety of any item
Any disputes between users
Any injury, harm, or damages resulting from the use of borrowed items
All transactions are made at your own risk.

Users are encouraged to communicate clearly, verify items before exchange, and agree on terms (such as deposits or return conditions) independently.

By using this app, you agree to release Lendify from any and all claims, liabilities, damages, or disputes arising from the use of the platform.

If you do not agree with these terms, please do not use the app.`;

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [borough, setBorough] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBoroughPicker, setShowBoroughPicker] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);

  const { login, signUp } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      setLoading(false);

      if (!result.success) {
        Alert.alert('Login Failed', result.error);
      }
      // If login successful, AppContent component will detect the user and navigate automatically
    } catch (error) {
      setLoading(false);
      console.error('Unexpected login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!borough) {
      Alert.alert('Error', 'Please select your Montreal borough');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, username, phoneNumber, borough);
      setLoading(false);

      if (!result.success) {
        Alert.alert('Sign Up Failed', result.error);
      }
      // If signup successful, AppContent component will detect the user and navigate automatically
    } catch (error) {
      setLoading(false);
      console.error('Unexpected signup error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setPhoneNumber('');
    setBorough('');
    setShowBoroughPicker(false);
  };

  const { width, height } = Dimensions.get('window');
  const isPhone = width < 768;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      {/* Modal-style centered card */}
      <View style={[styles.centerContainer, !isPhone && { justifyContent: 'center' }]}>
        <SafeAreaView style={isPhone ? styles.phoneContainer : styles.desktopContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Modal Card */}
              <View style={[styles.modalCard, !isPhone && { maxWidth: 500, alignSelf: 'center', width: '100%' }]}>
                {/* Logo and Title Section */}
                <View style={styles.logoSection}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoText}>🎁</Text>
                  </View>
                  <Text style={styles.appTitle}>Lendify</Text>
                  <Text style={styles.tagline}>Share. Borrow. Save.</Text>
                </View>

                {/* Subtitle */}
                <View style={styles.subtitleContainer}>
                  <Text style={styles.subtitleIcon}>{isLogin ? '👋' : '🌟'}</Text>
                  <Text style={styles.subtitle}>
                    {isLogin ? 'Welcome Back!' : 'Join Our Community'}
                  </Text>
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                  {!isLogin && (
                    <View style={styles.inputGroup}>
                      <View style={styles.inputLabelContainer}>
                        <Text style={styles.inputIcon}>👤</Text>
                        <Text style={styles.label}>Username</Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Choose a unique username"
                        placeholderTextColor={colors.lightText}
                        value={username}
                        onChangeText={setUsername}
                        editable={!loading}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelContainer}>
                      <Text style={styles.inputIcon}>✉️</Text>
                      <Text style={styles.label}>Email Address</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.lightText}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelContainer}>
                      <Text style={styles.inputIcon}>🔑</Text>
                      <Text style={styles.label}>Password</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.lightText}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!loading}
                    />
                    {!isLogin && (
                      <Text style={styles.helperText}>
                        ℹ️  Minimum 6 characters for security
                      </Text>
                    )}
                  </View>

                  {!isLogin && (
                    <>
                      <View style={styles.inputGroup}>
                        <View style={styles.inputLabelContainer}>
                          <Text style={styles.inputIcon}>📱</Text>
                          <Text style={styles.label}>Phone Number (Optional)</Text>
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="+1 (555) 123-4567"
                          placeholderTextColor={colors.lightText}
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="phone-pad"
                          editable={!loading}
                        />
                        <Text style={styles.helperText}>
                          ℹ️  Add your phone so buyers can contact you
                        </Text>
                      </View>

                      <View style={styles.inputGroup}>
                        <View style={styles.inputLabelContainer}>
                          <Text style={styles.inputIcon}>📍</Text>
                          <Text style={styles.label}>Montreal Borough *</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.input, styles.boroughPickerButton, !borough && { borderColor: colors.error }]}
                          onPress={() => setShowBoroughPicker(true)}
                          disabled={loading}
                        >
                          <Text style={[styles.boroughPickerText, !borough && { color: colors.lightText }]}>
                            {borough || 'Select your borough'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>
                          ℹ️  This helps us show you relevant nearby items
                        </Text>
                      </View>

                      {/* Borough Picker Modal */}
                      <Modal
                        visible={showBoroughPicker}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowBoroughPicker(false)}
                      >
                        <View style={styles.boroughModalOverlay}>
                          <View style={styles.boroughModalContent}>
                            <View style={styles.boroughModalHeader}>
                              <Text style={styles.boroughModalTitle}>Select Your Borough</Text>
                              <TouchableOpacity onPress={() => setShowBoroughPicker(false)}>
                                <Text style={styles.boroughModalCloseButton}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                              {MONTREAL_BOROUGHS.map((b) => (
                                <TouchableOpacity
                                  key={b}
                                  style={[
                                    styles.boroughOption,
                                    borough === b && styles.boroughOptionSelected
                                  ]}
                                  onPress={() => {
                                    setBorough(b);
                                    setShowBoroughPicker(false);
                                  }}
                                >
                                  <Text style={[
                                    styles.boroughOptionText,
                                    borough === b && styles.boroughOptionTextSelected
                                  ]}>
                                    {borough === b && '✓ '}{b}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </View>
                      </Modal>

                      {/* Terms of Use Section */}
                      <TouchableOpacity 
                        style={styles.termsContainer}
                        onPress={() => setTermsExpanded(!termsExpanded)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.termsHeader}>
                          <Text style={styles.termsIcon}>📋</Text>
                          <View style={styles.termsHeaderText}>
                            <Text style={styles.termsTitle}>Terms of Use & Disclaimer</Text>
                            <Text style={styles.termsSubtext}>Tap to read</Text>
                          </View>
                          <Text style={styles.termsExpandIcon}>{termsExpanded ? '▼' : '▶'}</Text>
                        </View>
                        
                        {termsExpanded && (
                          <ScrollView style={styles.termsContent} scrollEnabled={false}>
                            <Text style={styles.termsText}>{TERMS_OF_USE}</Text>
                          </ScrollView>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Primary Button */}
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={isLogin ? handleLogin : handleSignUp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buttonIcon}>{isLogin ? '→' : '✓'}</Text>
                    <Text style={styles.buttonText}>
                      {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Login' : 'Create Account')}
                    </Text>
                  </TouchableOpacity>

                  {/* Mode Toggle */}
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                      {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    </Text>
                    <TouchableOpacity
                      onPress={handleToggleMode}
                      disabled={loading}
                    >
                      <Text style={styles.toggleLink}>
                        {isLogin ? 'Sign Up' : 'Login'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoContainer}>
                  <Text style={styles.infoIcon}>{isLogin ? '🔐' : '🎯'}</Text>
                  <Text style={styles.infoText}>
                    {isLogin
                      ? 'Your account is secure and protected'
                      : 'Join thousands borrowing and sharing items'}
                  </Text>
                </View>

                {/* Features Info */}
                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>💚</Text>
                    <Text style={styles.featureText}>Community-driven</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>🛡️</Text>
                    <Text style={styles.featureText}>Safe & Secure</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureIcon}>💰</Text>
                    <Text style={styles.featureText}>Save Money</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundBlobs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  blobTop: {
    width: 300,
    height: 300,
    backgroundColor: colors.secondary,
    top: -100,
    right: -50,
  },
  blobBottom: {
    width: 250,
    height: 250,
    backgroundColor: colors.accent,
    bottom: -80,
    left: -60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 10,
  },
  phoneContainer: {
    flex: 1,
    width: '100%',
  },
  desktopContainer: {
    flex: 1,
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  logoText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 1,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.lightBg,
    fontWeight: '500',
  },
  boroughPickerButton: {
    justifyContent: 'center',
  },
  boroughPickerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  boroughModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.5)',
    justifyContent: 'flex-end',
  },
  boroughModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  boroughModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  boroughModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  boroughModalCloseButton: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.lightText,
  },
  boroughOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  boroughOptionSelected: {
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
  },
  boroughOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  boroughOptionTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 6,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  toggleText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleLink: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.lightText,
    textAlign: 'center',
  },
  termsContainer: {
    backgroundColor: 'rgba(46, 80, 144, 0.05)',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    marginVertical: 16,
    overflow: 'hidden',
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(46, 80, 144, 0.08)',
  },
  termsIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  termsHeaderText: {
    flex: 1,
  },
  termsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  termsSubtext: {
    fontSize: 11,
    color: colors.lightText,
    fontWeight: '500',
  },
  termsExpandIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  termsContent: {
    maxHeight: 200,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  termsText: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.text,
    fontWeight: '500',
  },
});
