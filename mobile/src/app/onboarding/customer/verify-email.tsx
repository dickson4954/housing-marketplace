import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react-native';

import { useCustomer } from '@/context/CustomerContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
};

export default function CustomerVerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
  }>();

  const {
    verifyEmail,
    resendVerification,
  } = useCustomer();

  const email =
    typeof params.email === 'string'
      ? params.email.trim()
      : '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isResending, setIsResending] =
    useState(false);
  const [resendMessage, setResendMessage] =
    useState('');

  const [countdown, setCountdown] =
    useState(0);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((current) =>
        current > 0 ? current - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleCodeChange = (value: string) => {
    const digits = value
      .replace(/\D/g, '')
      .slice(0, 6);

    setCode(digits);
    setError('');
    setResendMessage('');
  };

  const handleVerify = async () => {
    setError('');
    setResendMessage('');

    if (!email) {
      setError(
        'Your email address is missing. Please return to signup and try again.'
      );
      return;
    }

    if (code.length !== 6) {
      setError(
        'Please enter the 6-digit verification code.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyEmail({
        email,
        code,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.replace(
          '/onboarding/customer/login'
        );
      }, 1200);
    } catch (verificationError) {
      console.error(
        'Customer email verification error:',
        verificationError
      );

      setError(
        verificationError instanceof Error
          ? verificationError.message
          : 'Unable to verify your email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMessage('');

    if (!email) {
      setError(
        'Your email address is missing. Please return to signup and try again.'
      );
      return;
    }

    if (countdown > 0) {
      return;
    }

    setIsResending(true);

    try {
      const result =
        await resendVerification(email);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setCode('');
      setResendMessage(
        'A new verification code has been generated.'
      );
      setCountdown(60);
    } catch (resendError) {
      console.error(
        'Customer verification resend error:',
        resendError
      );

      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Unable to resend the verification code.'
      );
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <CheckCircle2
            size={42}
            color={COLORS.lime}
            strokeWidth={2}
          />
        </View>

        <Text style={styles.successTitle}>
          Email verified
        </Text>

        <Text style={styles.successText}>
          Your MAKAZII account is now verified.
        </Text>

        <Text style={styles.successSubtext}>
          Taking you to login...
        </Text>

        <ActivityIndicator
          size="small"
          color={COLORS.lime}
          style={styles.successLoader}
        />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
      style={{ flex: 1 }}
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
        <View style={styles.content}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.backText}>
              Back
            </Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.mailIcon}>
              <Mail
                size={30}
                color={COLORS.lime}
                strokeWidth={2}
              />
            </View>

            <Text style={styles.title}>
              Verify your email
            </Text>

            <Text style={styles.subtitle}>
              We need to verify your email address
              before you can log in to MAKAZII.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Verification code
            </Text>

            <Text style={styles.emailText}>
              {email || 'Email address unavailable'}
            </Text>

            <TextInput
              value={code}
              onChangeText={handleCodeChange}
              placeholder="000000"
              placeholderTextColor="#596164"
              keyboardType="number-pad"
              maxLength={6}
              editable={!isSubmitting}
              style={styles.codeInput}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
            />

            <Text style={styles.helperText}>
              Enter the 6-digit code sent to your
              email address.
            </Text>

            {error ? (
              <Text style={styles.errorText}>
                {error}
              </Text>
            ) : null}

            {resendMessage ? (
              <Text style={styles.resendMessage}>
                {resendMessage}
              </Text>
            ) : null}

            <Pressable
              style={[
                styles.verifyButton,
                (isSubmitting ||
                  code.length !== 6) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={
                isSubmitting ||
                code.length !== 6
              }
            >
              {isSubmitting ? (
                <ActivityIndicator
                  color={COLORS.background}
                />
              ) : (
                <Text style={styles.verifyButtonText}>
                  Verify email
                </Text>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>
                Didn&apos;t receive the code?
              </Text>

              <Pressable
                onPress={handleResend}
                disabled={
                  isResending ||
                  countdown > 0
                }
              >
                {isResending ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.lime}
                  />
                ) : (
                  <Text
                    style={[
                      styles.resendButton,
                      countdown > 0 &&
                        styles.resendDisabled,
                    ]}
                  >
                    {countdown > 0
                      ? `Resend in ${countdown}s`
                      : 'Resend code'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.developmentNotice}>
            <Text style={styles.noticeTitle}>
              Development mode
            </Text>

            <Text style={styles.noticeText}>
              During development, your verification
              code is printed in the MAKAZII backend
              terminal. Real email delivery will be
              connected later without changing this
              verification flow.
            </Text>
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
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 34,
  },

  backText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  mailIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 410,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
  },

  label: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },

  emailText: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 18,
  },

  codeInput: {
    height: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 9,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  helperText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
  },

  resendMessage: {
    color: COLORS.lime,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
  },

  verifyButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  verifyButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '800',
  },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 22,
  },

  resendLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },

  resendButton: {
    color: COLORS.lime,
    fontSize: 13,
    fontWeight: '800',
  },

  resendDisabled: {
    color: COLORS.muted,
  },

  developmentNotice: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111617',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  noticeTitle: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  noticeText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  successContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  successTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  successText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 10,
  },

  successSubtext: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
  },

  successLoader: {
    marginTop: 14,
  },
});
