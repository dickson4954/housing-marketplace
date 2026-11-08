import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  Phone,
} from 'lucide-react-native';

import { useCustomer } from '@/context/CustomerContext';

export default function CustomerLoginScreen() {
  const {
    login,
    resendVerification,
  } = useCustomer();

  const [emailOrPhone, setEmailOrPhone] =
    useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [success, setSuccess] = useState(false);
  const [showVerificationAction, setShowVerificationAction] =
    useState(false);
  const [isResendingVerification, setIsResendingVerification] =
    useState(false);
  const [verificationMessage, setVerificationMessage] =
    useState('');

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    setError('');
    setVerificationMessage('');
    setShowVerificationAction(false);

    const trimmedEmailOrPhone =
      emailOrPhone.trim();

    if (!trimmedEmailOrPhone) {
      setError(
        'Please enter your email or phone number.'
      );
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        emailOrPhone:
          trimmedEmailOrPhone,
        password,
      });

      if (!result.success) {
        setError(result.message);

        if (
          result.message
            .toLowerCase()
            .includes('verify your email')
        ) {
          setShowVerificationAction(
            true
          );
        }

        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.replace('/home');
      }, 900);
    } catch (loginError) {
      console.error(
        'Customer login error:',
        loginError
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to log in. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToVerification =
    async () => {
      const trimmedEmail =
        emailOrPhone.trim();

      if (!trimmedEmail) {
        setError(
          'Enter your email address first.'
        );
        return;
      }

      if (
        !trimmedEmail.includes('@')
      ) {
        setError(
          'Email verification requires your email address.'
        );
        return;
      }

      setError('');
      setVerificationMessage('');
      setIsResendingVerification(true);

      try {
        const result =
          await resendVerification(
            trimmedEmail
          );

        if (!result.success) {
          setError(result.message);
          return;
        }

        setVerificationMessage(
          'A new verification code has been generated. Check the MAKAZII backend terminal during development.'
        );

        router.push({
          pathname:
            '/onboarding/customer/verify-email',
          params: {
            email: trimmedEmail,
          },
        });
      } catch (verificationError) {
        console.error(
          'Customer verification resend error:',
          verificationError
        );

        setError(
          verificationError instanceof Error
            ? verificationError.message
            : 'Unable to send a verification code.'
        );
      } finally {
        setIsResendingVerification(
          false
        );
      }
    };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <LogIn
            size={40}
            color="#0B0F10"
            strokeWidth={2.8}
          />
        </View>

        <Text style={styles.successEyebrow}>
          LOGIN SUCCESSFUL
        </Text>

        <Text style={styles.successTitle}>
          Welcome
        </Text>

        <Text style={styles.successText}>
          You&apos;re signed in to MAKAZII.
          {'\n\n'}
          Taking you to your home search...
        </Text>

        <View style={styles.successLoader}>
          <ActivityIndicator
            size="small"
            color="#D7FF5F"
          />

          <Text style={styles.successLoaderText}>
            Opening MAKAZII...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={
                isSubmitting ||
                isResendingVerification
              }
            >
              <ArrowLeft
                size={21}
                color="#FFFFFF"
                strokeWidth={2.2}
              />
            </Pressable>

            <View>
              <Text style={styles.headerEyebrow}>
                MAKAZII
              </Text>

              <Text style={styles.headerTitle}>
                Log in
              </Text>
            </View>
          </View>

          {/* Intro */}
          <View style={styles.intro}>
            <View style={styles.loginIcon}>
              <LogIn
                size={27}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.title}>
              Welcome
              {'\n'}
              back.
            </Text>

            <Text style={styles.description}>
              Log in to continue your home search
              and pick up where you left off.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email / Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                EMAIL OR PHONE NUMBER
              </Text>

              <View style={styles.inputWrapper}>
                {emailOrPhone.includes('@') ? (
                  <Mail
                    size={19}
                    color="#697274"
                    strokeWidth={2}
                  />
                ) : (
                  <Phone
                    size={19}
                    color="#697274"
                    strokeWidth={2}
                  />
                )}

                <TextInput
                  value={emailOrPhone}
                  onChangeText={(value) => {
                    setEmailOrPhone(value);
                    setError('');
                    setVerificationMessage('');
                    setShowVerificationAction(
                      false
                    );
                  }}
                  placeholder="Email or phone number"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  keyboardType={
                    emailOrPhone.includes('@')
                      ? 'email-address'
                      : 'default'
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={
                    !isSubmitting &&
                    !isResendingVerification
                  }
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  PASSWORD
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      '/onboarding/customer/forgot-password'
                    )
                  }
                  disabled={
                    isSubmitting ||
                    isResendingVerification
                  }
                >
                  <Text style={styles.forgotText}>
                    Forgot password?
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputWrapper}>
                <LockKeyhole
                  size={19}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError('');
                    setVerificationMessage('');
                    setShowVerificationAction(
                      false
                    );
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={
                    !isSubmitting &&
                    !isResendingVerification
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  hitSlop={10}
                  disabled={
                    isSubmitting ||
                    isResendingVerification
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={19}
                      color="#697274"
                    />
                  ) : (
                    <Eye
                      size={19}
                      color="#697274"
                    />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Verification action */}
            {showVerificationAction ? (
              <View
                style={
                  styles.verificationBox
                }
              >
                <Text
                  style={
                    styles.verificationTitle
                  }
                >
                  Email not verified
                </Text>

                <Text
                  style={
                    styles.verificationText
                  }
                >
                  Verify your email before logging
                  in. We can generate a new
                  verification code for you.
                </Text>

                <Pressable
                  onPress={
                    handleGoToVerification
                  }
                  disabled={
                    isResendingVerification
                  }
                  style={
                    styles.verificationButton
                  }
                >
                  {isResendingVerification ? (
                    <ActivityIndicator
                      size="small"
                      color="#0B0F10"
                    />
                  ) : (
                    <Text
                      style={
                        styles.verificationButtonText
                      }
                    >
                      Verify my email
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {verificationMessage ? (
              <Text
                style={
                  styles.verificationMessage
                }
              >
                {verificationMessage}
              </Text>
            ) : null}

            {/* Login button */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed &&
                  styles.loginButtonPressed,
                isSubmitting &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={
                isSubmitting ||
                isResendingVerification
              }
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#0B0F10"
                  />

                  <Text style={styles.loginButtonText}>
                    Logging in...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    Log In
                  </Text>

                  <ArrowRight
                    size={20}
                    color="#0B0F10"
                    strokeWidth={2.6}
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* Sign up */}
          <View style={styles.signupPrompt}>
            <Text style={styles.signupPromptText}>
              Don&apos;t have a MAKAZII account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace(
                  '/onboarding/customer/signup'
                )
              }
              disabled={
                isSubmitting ||
                isResendingVerification
              }
            >
              <Text style={styles.signupLink}>
                Create one
              </Text>
            </Pressable>
          </View>

          {/* Security note */}
          <View style={styles.securityCard}>
            <LockKeyhole
              size={17}
              color="#D7FF5F"
              strokeWidth={2}
            />

            <Text style={styles.securityText}>
              Your account keeps your shortlist,
              visits and activity connected to you.
            </Text>
          </View>

          <Text style={styles.footer}>
            MAKAZII • FIND YOUR PLACE
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
  },

  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 0,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerEyebrow: {
    color: '#D7FF5F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 3,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  intro: {
    marginBottom: 30,
  },

  loginIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginBottom: 12,
  },

  description: {
    color: '#9CA5A7',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 500,
  },

  form: {
    width: '100%',
  },

  fieldGroup: {
    marginBottom: 18,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  label: {
    color: '#9CA5A7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  forgotText: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },

  inputWrapper: {
    minHeight: 58,
    borderRadius: 17,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 11,
    paddingVertical: 0,
  },

  errorBox: {
    backgroundColor: '#351D20',
    borderWidth: 1,
    borderColor: '#5A292F',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 17,
  },

  errorText: {
    color: '#FF9A9A',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  verificationBox: {
    backgroundColor: '#171D17',
    borderWidth: 1,
    borderColor: '#35432A',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 17,
  },

  verificationTitle: {
    color: '#D7FF5F',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },

  verificationText: {
    color: '#9CA5A7',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 13,
  },

  verificationButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  verificationButtonText: {
    color: '#0B0F10',
    fontSize: 12,
    fontWeight: '900',
  },

  verificationMessage: {
    color: '#D7FF5F',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },

  loginButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: '#D7FF5F',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loginButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: '#0B0F10',
    fontSize: 15,
    fontWeight: '900',
  },

  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 25,
    gap: 5,
  },

  signupPromptText: {
    color: '#697274',
    fontSize: 12,
    fontWeight: '600',
  },

  signupLink: {
    color: '#D7FF5F',
    fontSize: 12,
    fontWeight: '900',
  },

  securityCard: {
    marginTop: 25,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    flexDirection: 'row',
    alignItems: 'center',
  },

  securityText: {
    flex: 1,
    color: '#697274',
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 10,
  },

  footer: {
    color: '#3F4749',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 25,
  },

  successScreen: {
    flex: 1,
    backgroundColor: '#0B0F10',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  successEyebrow: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 9,
  },

  successTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.7,
    textAlign: 'center',
    marginBottom: 13,
  },

  successText: {
    color: '#9CA5A7',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 390,
  },

  successLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 10,
  },

  successLoaderText: {
    color: '#697274',
    fontSize: 12,
    fontWeight: '600',
  },
});
