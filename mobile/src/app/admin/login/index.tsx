import { useState } from 'react';
import { router } from 'expo-router';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

import { useAdmin } from '@/context/AdminContext';

const ADMIN_TOKEN_KEY = 'makazii_admin_token';

type AdminLoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      role: string;
      isActive: boolean;
      emailVerifiedAt?: string | null;
      createdAt: string;
      updatedAt: string;
    };
  };
};

async function saveAdminToken(token: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        ADMIN_TOKEN_KEY,
        token
      );
    }

    return;
  }

  await SecureStore.setItemAsync(
    ADMIN_TOKEN_KEY,
    token
  );
}

export default function AdminLogin() {
  const { refreshCurrentAdmin, resetLogoutState } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adminLogin}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailOrPhone: trimmedEmail,
            password,
          }),
        }
      );

      let result: AdminLoginResponse;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          'The server returned an invalid response.'
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Incorrect email or password.'
        );
      }

      const token = result.data?.token;

      if (!token) {
        throw new Error(
          'Login succeeded but no authentication token was returned.'
        );
      }

      await saveAdminToken(token);
      resetLogoutState();

      const admin = await refreshCurrentAdmin();

      if (!admin) {
        throw new Error(
          'Unable to verify your administrator session. Please try signing in again.'
        );
      }

      router.replace('/admin/dashboard');
    } catch (loginError) {
      console.error(
        'Admin login error:',
        loginError
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.container}>
          {/* BRAND */}
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>
                M
              </Text>
            </View>

            <View>
              <Text style={styles.logo}>
                MAKAZII
              </Text>

              <Text style={styles.logoSub}>
                TEAM PORTAL
              </Text>
            </View>
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <ShieldCheck
                size={27}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.eyebrow}>
              SECURE ACCESS
            </Text>

            <Text style={styles.title}>
              Welcome back.
            </Text>

            <Text style={styles.description}>
              Sign in to manage properties, viewings,
              verification and the Makazii marketplace.
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>
                EMAIL ADDRESS
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@makazii.test"
                  placeholderTextColor="#697274"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isSubmitting}
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>
                  PASSWORD
                </Text>

                <Text style={styles.secureLabel}>
                  SECURE ACCESS
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <LockKeyhole
                  size={18}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#697274"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  style={styles.passwordInput}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  hitSlop={10}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff
                      size={19}
                      color="#8F999B"
                    />
                  ) : (
                    <Eye
                      size={19}
                      color="#8F999B"
                    />
                  )}
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.loginButton,
                pressed &&
                  !isSubmitting &&
                  styles.loginPressed,
                isSubmitting &&
                  styles.loginDisabled,
              ]}
            >
              {isSubmitting ? (
                <>
                  <Text style={styles.loginText}>
                    Signing in...
                  </Text>

                  <View style={styles.loginArrow}>
                    <ActivityIndicator
                      size="small"
                      color="#D7FF5F"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.loginText}>
                    Sign in to portal
                  </Text>

                  <View style={styles.loginArrow}>
                    <ArrowRight
                      size={20}
                      color="#D7FF5F"
                      strokeWidth={2.5}
                    />
                  </View>
                </>
              )}
            </Pressable>
          </View>

          {/* SECURITY INFORMATION */}
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <LockKeyhole
                size={16}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                MANAGEMENT ACCESS
              </Text>

              <Text style={styles.securityText}>
                Your credentials are verified securely
                by the Makazii backend. Admin access is
                restricted to authorized team accounts.
              </Text>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              MAKAZII ADMINISTRATION
            </Text>

            <Text style={styles.footerDot}>
              •
            </Text>

            <Text style={styles.footerText}>
              SECURE TEAM ACCESS
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  brandMarkText: {
    color: '#101410',
    fontSize: 22,
    fontWeight: '900',
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 3,
  },

  logoSub: {
    color: '#687174',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 2,
  },

  header: {
    marginTop: 28,
  },

  iconCircle: {
    width: 53,
    height: 53,
    borderRadius: 18,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#293133',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  eyebrow: {
    color: '#8E989A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '800',
    letterSpacing: -1.5,
  },

  description: {
    color: '#8E989A',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 11,
    maxWidth: 390,
  },

  form: {
    marginTop: 25,
  },

  field: {
    marginBottom: 17,
  },

  label: {
    color: '#A4ADAF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 8,
  },

  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  secureLabel: {
    color: '#657074',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#293133',
    backgroundColor: '#14191B',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },

  passwordInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
    marginLeft: 10,
  },

  errorBox: {
    borderRadius: 13,
    backgroundColor:
      'rgba(255, 90, 90, 0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255, 90, 90, 0.2)',
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 15,
  },

  errorText: {
    color: '#FF8D8D',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },

  loginButton: {
    height: 60,
    borderRadius: 18,
    backgroundColor: '#D7FF5F',
    paddingLeft: 19,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },

  loginPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  loginDisabled: {
    opacity: 0.65,
  },

  loginText: {
    color: '#101410',
    fontSize: 15,
    fontWeight: '900',
  },

  loginArrow: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#101410',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityCard: {
    marginTop: 20,
    borderRadius: 17,
    backgroundColor: '#111719',
    borderWidth: 1,
    borderColor: '#232B2D',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#181F21',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: '#D7FF5F',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  securityText: {
    color: '#788285',
    fontSize: 10,
    lineHeight: 15,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingTop: 15,
  },

  footerText: {
    color: '#424B4D',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  footerDot: {
    color: '#D7FF5F',
    fontSize: 8,
  },
});