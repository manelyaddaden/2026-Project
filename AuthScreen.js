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

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signUp } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
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

    setLoading(true);
    const result = await signUp(email, password, username, phoneNumber);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Sign Up Failed', result.error);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setPhoneNumber('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative Header */}
          <View style={styles.decorativeHeader}>
            <View style={styles.headerBlob1} />
            <View style={styles.headerBlob2} />
          </View>

          {/* Logo and Title Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>🎁</Text>
            </View>
            <Text style={styles.appTitle}>Lendify</Text>
            <Text style={styles.tagline}>Share. Borrow. Save.</Text>
          </View>

          {/* Subtitle with Icon */}
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

          {/* Divider with or text */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social/Features Info */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  // Decorative Header
  decorativeHeader: {
    height: 120,
    position: 'relative',
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerBlob1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.secondary,
    opacity: 0.1,
    top: -50,
    right: -30,
  },
  headerBlob2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
    opacity: 0.08,
    top: -40,
    left: -40,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
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
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Subtitle with Icon
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  subtitleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },

  // Form Container
  formContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.lightBg,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 8,
    fontWeight: '500',
  },

  // Button Styles
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
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
    fontSize: 20,
    fontWeight: '700',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Toggle Container
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  toggleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleLink: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },

  // Info Container
  infoContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  infoIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  infoText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    color: colors.lightText,
    fontSize: 13,
    fontWeight: '600',
  },

  // Features Container
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    paddingBottom: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.lightText,
    textAlign: 'center',
  },
});
