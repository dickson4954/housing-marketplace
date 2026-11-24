import React, { useState } from 'react';
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
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';

import { loginBusinessOwner } from '@/lib/businessOwnerApi';

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

export default function BusinessLoginScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    registered?: string;
  }>();

  const [identifier, setIdentifier] = useState(
    typeof params.email === 'string' ? params.email : '',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const registered = params.registered === '1';

  async function handleLogin() {
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setError('Enter your email address or phone number.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await loginBusinessOwner(cleanIdentifier, password);

      router.replace({
        pathname: '/business/application',
        params: {
          ownerProfile: result.businessOwner ? '1' : '0',
        },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.';

      setError(message);

      if (
        message.toLowerCase().includes('verify your email')
      ) {
        router.push({
          pathname: '/business/verify-email',
          params: { email: cleanIdentifier },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <View style={styles.logo}>
                <BriefcaseBusiness
                  size={30}
                  color={C.lime}
                  strokeWidth={1.9}
                />
              </View>

              <Text style={styles.eyebrow}>
                MAKAZII BUSINESS NETWORK
              </Text>

              <Text style={styles.title}>
                Welcome back.
              </Text>

              <Text style={styles.subtitle}>
                Sign in to manage your business applications
                and approved business workspaces.
              </Text>
            </View>

            {registered ? (
              <View style={styles.successNotice}>
                <ShieldCheck size={19} color={C.green} />
                <View style={styles.noticeCopy}>
                  <Text style={styles.noticeTitle}>
                    Application submitted
                  </Text>
                  <Text style={styles.noticeText}>
                    Your business-owner application has been
                    submitted. Verify your email, then sign in
                    to follow its progress.
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Business Login
              </Text>

              <Text style={styles.cardSubtitle}>
                Use the account linked to your business-owner
                application.
              </Text>

              <Text style={styles.label}>
                Email or phone number
              </Text>

              <View style={styles.inputWrap}>
                <Mail size={18} color={C.muted} />
                <TextInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    setError('');
                  }}
                  placeholder="Email address or phone"
                  placeholderTextColor="#697274"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>
                Password
              </Text>

              <View style={styles.inputWrap}>
                <LockKeyhole size={18} color={C.muted} />
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#697274"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  style={styles.input}
                />

                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={C.muted} />
                  ) : (
                    <Eye size={19} color={C.muted} />
                  )}
                </Pressable>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    {error}
                  </Text>

                  {error.toLowerCase().includes('verify') ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/business/verify-email',
                          params: { email: identifier.trim() },
                        })
                      }
                    >
                      <Text style={styles.inlineAction}>
                        Verify your email
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.loginButton,
                  isSubmitting && styles.disabled,
                ]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={C.background} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      Sign in to Business
                    </Text>
                    <ArrowRight size={19} color={C.background} />
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.securityNote}>
              <ShieldCheck size={17} color={C.lime} />
              <Text style={styles.securityText}>
                Your business session is separate from your
                MAKAZII customer session.
              </Text>
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                Don't have a business-owner application?
              </Text>

              <Pressable
                onPress={() => router.push('/business/register')}
              >
                <Text style={styles.registerLink}>
                  Register a business
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.customerLink}
              onPress={() =>
                router.push('/onboarding/customer/login')
              }
            >
              <Text style={styles.customerLinkText}>
                Looking for customer login?
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
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 42,
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
    marginBottom: 28,
  },
  backText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: C.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1,
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
  successNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#132019',
    borderWidth: 1,
    borderColor: '#294734',
    borderRadius: 17,
    padding: 15,
    marginBottom: 17,
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    color: C.green,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  noticeText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 21,
  },
  cardTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 23,
  },
  label: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
  },
  inputWrap: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: C.white,
    fontSize: 14,
    paddingVertical: 14,
  },
  errorBox: {
    backgroundColor: '#281719',
    borderWidth: 1,
    borderColor: '#593034',
    borderRadius: 13,
    padding: 13,
    marginBottom: 16,
  },
  errorText: {
    color: C.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  inlineAction: {
    color: C.lime,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 9,
  },
  loginButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 3,
  },
  loginButtonText: {
    color: C.background,
    fontSize: 14,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 22,
    paddingHorizontal: 8,
  },
  securityText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
    textAlign: 'center',
  },
  registerRow: {
    alignItems: 'center',
    gap: 9,
    marginTop: 28,
  },
  registerText: {
    color: C.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  registerLink: {
    color: C.lime,
    fontSize: 14,
    fontWeight: '900',
  },
  customerLink: {
    alignSelf: 'center',
    marginTop: 22,
    padding: 8,
  },
  customerLinkText: {
    color: C.muted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
