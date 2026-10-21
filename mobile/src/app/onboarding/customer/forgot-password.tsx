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
  KeyRound,
  Mail,
  Phone,
} from 'lucide-react-native';

export default function CustomerForgotPasswordScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContinue = () => {
    if (isSubmitting) {
      return;
    }

    setError('');

    const value = emailOrPhone.trim();

    if (!value) {
      setError(
        'Please enter your email address or phone number.'
      );
      return;
    }

    const digits = value.replace(/\D/g, '');

    if (
      !value.includes('@') &&
      digits.length < 9
    ) {
      setError('Please enter a valid email or phone number.');
      return;
    }

    if (
      value.includes('@') &&
      !value.includes('.')
    ) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    /*
     * FRONTEND PROTOTYPE:
     * Later this will call the backend password-reset
     * endpoint. The backend will verify the account and
     * send the appropriate recovery code/link.
     */
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 900);
  };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <Check
            size={40}
            color="#0B0F10"
            strokeWidth={3}
          />
        </View>

        <Text style={styles.successEyebrow}>
          RECOVERY REQUESTED
        </Text>

        <Text style={styles.successTitle}>
          Check your account.
        </Text>

        <Text style={styles.successText}>
          If a MAKAZII account exists with the
          information you provided, recovery
          instructions will be sent to you.
          {'\n\n'}
          For security, we don't reveal whether an
          account exists.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push(
              '/onboarding/customer/reset-password'
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            Continue to reset password
          </Text>

          <ArrowRight
            size={18}
            color="#0B0F10"
            strokeWidth={2.5}
          />
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.replace(
              '/onboarding/customer/login'
            )
          }
        >
          <Text style={styles.secondaryButtonText}>
            Back to login
          </Text>
        </Pressable>
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isSubmitting}
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
                Password recovery
              </Text>
            </View>
          </View>

          <View style={styles.intro}>
            <View style={styles.iconCircle}>
              <KeyRound
                size={28}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.title}>
              Forgot your
              {'\n'}
              password?
            </Text>

            <Text style={styles.description}>
              Enter the email address or phone number
              linked to your MAKAZII account and we'll
              help you regain access.
            </Text>
          </View>

          <View style={styles.form}>
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
                  editable={!isSubmitting}
                />
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
              style={[
                styles.primaryButton,
                isSubmitting
                  ? styles.primaryButtonDisabled
                  : null,
              ]}
              onPress={handleContinue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#0B0F10"
                  />

                  <Text style={styles.primaryButtonText}>
                    Checking...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Continue
                  </Text>

                  <ArrowRight
                    size={18}
                    color="#0B0F10"
                    strokeWidth={2.5}
                  />
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.loginLink}
              onPress={() =>
                router.replace(
                  '/onboarding/customer/login'
                )
              }
              disabled={isSubmitting}
            >
              <Text style={styles.loginLinkText}>
                Remember your password?{' '}
                <Text style={styles.loginLinkAccent}>
                  Log in
                </Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.securityNote}>
            <KeyRound
              size={15}
              color="#657073"
              strokeWidth={2}
            />

            <Text style={styles.securityText}>
              Your account information stays private.
            </Text>
          </View>
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
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 58,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerEyebrow: {
    color: '#D7FF5F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 3,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  intro: {
    marginBottom: 38,
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 39,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginBottom: 16,
  },

  description: {
    color: '#9CA5A7',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 540,
  },

  form: {
    gap: 20,
  },

  fieldGroup: {
    gap: 9,
  },

  label: {
    color: '#9CA5A7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  inputWrapper: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#252C2E',
    backgroundColor: '#14191B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    gap: 12,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 56,
  },

  errorBox: {
    backgroundColor: '#351D20',
    borderWidth: 1,
    borderColor: '#5A292D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  errorText: {
    color: '#FF7070',
    fontSize: 13,
    lineHeight: 19,
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#D7FF5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },

  primaryButtonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: '#0B0F10',
    fontSize: 14,
    fontWeight: '900',
  },

  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  loginLinkText: {
    color: '#657073',
    fontSize: 13,
  },

  loginLinkAccent: {
    color: '#D7FF5F',
    fontWeight: '800',
  },

  securityNote: {
    marginTop: 44,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#252C2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  securityText: {
    color: '#657073',
    fontSize: 11,
  },

  successScreen: {
    flex: 1,
    backgroundColor: '#0B0F10',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  successEyebrow: {
    color: '#D7FF5F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
  },

  successTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },

  successText: {
    color: '#9CA5A7',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 470,
  },

  secondaryButton: {
    minHeight: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
