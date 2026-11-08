import { useState } from 'react';
import { router } from 'expo-router';
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
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Megaphone,
  UserRound,
} from 'lucide-react-native';

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

const MARKETER_TOKEN_KEY = 'makazii_marketer_token';

async function saveMarketerToken(token: string) {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.localStorage
  ) {
    window.localStorage.setItem(MARKETER_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(MARKETER_TOKEN_KEY, token);
}

export default function MarketerLogin() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    setError('');

    const identifier = emailOrPhone.trim();

    if (!identifier) {
      setError('Enter your email address or phone number.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.marketerLogin}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailOrPhone: identifier,
            password,
          }),
        },
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            'Unable to sign in. Please check your details and try again.',
        );
      }

      const token = result?.data?.token;

      if (!token || typeof token !== 'string') {
        throw new Error(
          'Login succeeded, but no authentication token was returned.',
        );
      }

      await saveMarketerToken(token);

      router.replace('/marketer/dashboard');
    } catch (err) {
      console.error('MARKETER LOGIN ERROR:', err);

      if (err instanceof TypeError) {
        setError(
          'Unable to connect to Makazii. Check that the backend is running and try again.',
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to sign in. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* BRAND */}
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>M</Text>
            </View>

            <View>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>MARKETER PORTAL</Text>
            </View>
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Megaphone
                size={27}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.eyebrow}>MARKETER ACCESS</Text>

            <Text style={styles.title}>Welcome back.</Text>

            <Text style={styles.description}>
              Sign in to manage your properties, assist
              customers and handle your Makazii activities.
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            {/* EMAIL / PHONE */}
            <View style={styles.field}>
              <Text style={styles.label}>
                EMAIL OR PHONE NUMBER
              </Text>

              <View style={styles.inputContainer}>
                <UserRound
                  size={18}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={emailOrPhone}
                  onChangeText={(value) => {
                    setEmailOrPhone(value);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Email or phone number"
                  placeholderTextColor="#697274"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>

              <View style={styles.inputContainer}>
                <LockKeyhole
                  size={18}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#697274"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.passwordInput}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <Pressable
                  onPress={() =>
                    setShowPassword((current) => !current)
                  }
                  disabled={loading}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
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

            {/* ERROR */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* LOGIN */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in as marketer"
              style={({ pressed }) => [
                styles.loginButton,
                pressed && !loading && styles.loginPressed,
                loading && styles.loginDisabled,
              ]}
            >
              {loading ? (
                <>
                  <View style={styles.loadingContent}>
                    <ActivityIndicator
                      size="small"
                      color="#101410"
                    />

                    <Text style={styles.loginText}>
                      Signing in...
                    </Text>
                  </View>

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
                    Sign in as marketer
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

          {/* ACCESS INFORMATION */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <LockKeyhole
                size={16}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                SECURE MARKETER ACCESS
              </Text>

              <Text style={styles.infoText}>
                Your marketer account must be approved and
                active before you can sign in.
              </Text>

              <Text style={styles.infoText}>
                Use the email address or phone number linked
                to your Makazii marketer account.
              </Text>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              MAKAZII MARKETER
            </Text>

            <Text style={styles.footerDot}>•</Text>

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
    marginLeft: 10,
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
    backgroundColor: 'rgba(255, 90, 90, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 90, 0.2)',
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 15,
  },

  errorText: {
    color: '#FF8D8D',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
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
    opacity: 0.72,
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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

  infoCard: {
    marginTop: 20,
    borderRadius: 17,
    backgroundColor: '#111719',
    borderWidth: 1,
    borderColor: '#232B2D',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#181F21',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: '#D7FF5F',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  infoText: {
    color: '#788285',
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 3,
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
