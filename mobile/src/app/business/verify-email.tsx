import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';

import {
  resendBusinessOwnerVerification,
  verifyBusinessOwnerEmail,
} from '@/lib/businessOwnerApi';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
  green: '#73D99A',
};

export default function BusinessVerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();

  const email =
    typeof params.email === 'string' ? params.email.trim() : '';

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
    setMessage('');
  }

  async function handleVerify() {
    if (!email) {
      setError('Your email address is missing. Return to Business Login.');
      return;
    }

    if (code.length !== 6) {
      setError('Enter the complete six-digit verification code.');
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await verifyBusinessOwnerEmail(email, code);
      setVerified(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to verify your email. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email || countdown > 0 || isResending) return;

    setError('');
    setMessage('');
    setIsResending(true);

    try {
      const result = await resendBusinessOwnerVerification(email);

      setMessage(
        result.message || 'A new verification code has been sent.',
      );
      setCountdown(60);
      setCode('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to resend the verification code.',
      );
    } finally {
      setIsResending(false);
    }
  }

  if (verified) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={39} color={C.lime} />
          </View>

          <Text style={styles.successEyebrow}>
            EMAIL CONFIRMED
          </Text>

          <Text style={styles.successTitle}>
            You're verified.
          </Text>

          <Text style={styles.successText}>
            Your email address has been verified successfully.
            You can now sign in to your business-owner account
            and follow your application.
          </Text>

          <View style={styles.successNotice}>
            <ShieldCheck size={19} color={C.lime} />
            <Text style={styles.successNoticeText}>
              Email verification does not automatically approve
              your business-owner application. Your identity and
              business applications will be reviewed separately.
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: '/business/login',
                params: { email },
              })
            }
          >
            <Text style={styles.primaryButtonText}>
              Continue to Business Login
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={19} color={C.white} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.mailIcon}>
                <Mail size={31} color={C.lime} strokeWidth={1.9} />
              </View>

              <Text style={styles.eyebrow}>
                BUSINESS ACCOUNT SECURITY
              </Text>

              <Text style={styles.title}>
                Verify your email
              </Text>

              <Text style={styles.subtitle}>
                Confirm your email address before signing in
                to your MAKAZII Business account.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>
                Verification code sent to
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
                editable={!isSubmitting && !!email}
                style={styles.codeInput}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                autoFocus
              />

              <Text style={styles.helperText}>
                Enter the six-digit code sent to your email.
              </Text>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {message ? (
                <Text style={styles.messageText}>{message}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  (isSubmitting || code.length !== 6 || !email) &&
                    styles.disabled,
                ]}
                onPress={handleVerify}
                disabled={
                  isSubmitting || code.length !== 6 || !email
                }
              >
                {isSubmitting ? (
                  <ActivityIndicator color={C.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Verify email
                  </Text>
                )}
              </Pressable>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>
                  Didn't receive the code?
                </Text>

                <Pressable
                  onPress={handleResend}
                  disabled={isResending || countdown > 0 || !email}
                >
                  {isResending ? (
                    <ActivityIndicator
                      size="small"
                      color={C.lime}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.resendButton,
                        (countdown > 0 || !email) &&
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

            <View style={styles.securityNote}>
              <ShieldCheck size={19} color={C.lime} />
              <Text style={styles.securityText}>
                Your verification protects your business account.
                Your National ID review and business approvals
                remain separate steps.
              </Text>
            </View>

            <Pressable
              style={styles.loginLink}
              onPress={() => router.replace('/business/login')}
            >
              <Text style={styles.loginLinkText}>
                Return to Business Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 23,
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
    gap: 9,
    paddingVertical: 9,
    marginBottom: 29,
  },
  backText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 29,
  },
  mailIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  eyebrow: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 11,
  },
  title: {
    color: C.white,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 390,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
  },
  label: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  emailText: {
    color: C.muted,
    fontSize: 14,
    marginBottom: 20,
  },
  codeInput: {
    height: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
    color: C.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 9,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  helperText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    color: C.danger,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
  },
  messageText: {
    color: C.green,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
  },
  primaryButton: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
  },
  primaryButtonText: {
    color: C.background,
    fontSize: 14,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.45,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 22,
  },
  resendLabel: {
    color: C.muted,
    fontSize: 12,
  },
  resendButton: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '900',
  },
  resendDisabled: {
    color: C.muted,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 22,
    paddingHorizontal: 7,
  },
  securityText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    flex: 1,
  },
  loginLink: {
    alignSelf: 'center',
    padding: 12,
    marginTop: 17,
  },
  loginLinkText: {
    color: C.lime,
    fontSize: 13,
    fontWeight: '800',
  },
  successContainer: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 23,
  },
  successEyebrow: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  successTitle: {
    color: C.white,
    fontSize: 31,
    fontWeight: '900',
    textAlign: 'center',
  },
  successText: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 410,
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 15,
    marginTop: 25,
    width: '100%',
    maxWidth: 440,
  },
  successNoticeText: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
  },
});
