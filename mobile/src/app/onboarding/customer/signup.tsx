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
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from 'lucide-react-native';

import { useCustomer } from '@/context/CustomerContext';

export default function CustomerSignupScreen() {
  const { signUp } = useCustomer();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (isSubmitting) {
      return;
    }

    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        'Your name must contain at least 2 characters.'
      );
      return;
    }

    if (!trimmedPhone) {
      setError('Please enter your phone number.');
      return;
    }

    if (trimmedPhone.replace(/\D/g, '').length < 9) {
      setError(
        'Please enter a valid phone number.'
      );
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    if (!password) {
      setError('Please create a password.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        'Please confirm your password.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp({
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(true);

      // Signup creates the account but does not log
      // the customer in. The next step is email
      // verification.
      setTimeout(() => {
        router.replace({
          pathname:
            '/onboarding/customer/verify-email',
          params: {
            email: trimmedEmail,
          },
        });
      }, 900);
    } catch (error) {
      console.error(
        'Customer signup error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create your account.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <Check
            size={42}
            color="#0B0F10"
            strokeWidth={3}
          />
        </View>

        <Text style={styles.successEyebrow}>
          ACCOUNT CREATED
        </Text>

        <Text style={styles.successTitle}>
          Welcome to MAKAZII.
        </Text>

        <Text style={styles.successText}>
          Your account has been created
          successfully.
          {'\n\n'}
          Please log in to continue.
        </Text>

        <View style={styles.successLoader}>
          <ActivityIndicator
            size="small"
            color="#D7FF5F"
          />

          <Text style={styles.successLoaderText}>
            Taking you to login...
          </Text>
        </View>
      </View>
    );
  }

  return (
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
                Create account
              </Text>
            </View>
          </View>

          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.title}>
              Let's get you
              {'\n'}
              settled in.
            </Text>

            <Text style={styles.description}>
              Create your MAKAZII account to keep
              your home search, shortlist and
              visits connected.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                FULL NAME
              </Text>

              <View style={styles.inputWrapper}>
                <User
                  size={19}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    setError('');
                  }}
                  placeholder="e.g. Dickson Murithi"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                PHONE NUMBER
              </Text>

              <View style={styles.inputWrapper}>
                <Phone
                  size={19}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    setError('');
                  }}
                  placeholder="e.g. 0712 345 678"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                EMAIL ADDRESS
              </Text>

              <View style={styles.inputWrapper}>
                <Mail
                  size={19}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                PASSWORD
              </Text>

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
                  }}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  hitSlop={10}
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

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                CONFIRM PASSWORD
              </Text>

              <View style={styles.inputWrapper}>
                <LockKeyhole
                  size={19}
                  color="#697274"
                  strokeWidth={2}
                />

                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setError('');
                  }}
                  placeholder="Enter your password again"
                  placeholderTextColor="#697274"
                  style={styles.input}
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  hitSlop={10}
                >
                  {showConfirmPassword ? (
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

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to
              MAKAZII's Terms & Conditions and
              Privacy Policy.
            </Text>

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed &&
                  styles.submitButtonPressed,
                isSubmitting &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#0B0F10"
                  />

                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    Creating account...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    Create Account
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

          {/* Login link */}
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Already have a MAKAZII account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace(
                  '/onboarding/customer/login'
                )
              }
              disabled={isSubmitting}
            >
              <Text style={styles.loginLink}>
                Log in
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            MAKAZII • FIND YOUR PLACE
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
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
    marginBottom: 28,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '900',
    letterSpacing: -1,
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
    marginBottom: 17,
  },

  label: {
    color: '#9CA5A7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  inputWrapper: {
    minHeight: 56,
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
    marginBottom: 16,
  },

  errorText: {
    color: '#FF9A9A',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  termsText: {
    color: '#697274',
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 18,
  },

  submitButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: '#D7FF5F',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  submitButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    color: '#0B0F10',
    fontSize: 15,
    fontWeight: '900',
  },

  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 25,
    gap: 5,
  },

  loginPromptText: {
    color: '#697274',
    fontSize: 12,
    fontWeight: '600',
  },

  loginLink: {
    color: '#D7FF5F',
    fontSize: 12,
    fontWeight: '900',
  },

  footer: {
    color: '#3F4749',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 26,
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