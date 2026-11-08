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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from 'lucide-react-native';

export default function CustomerResetPasswordScreen() {
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

  const handleReset = () => {
    if (isSubmitting) {
      return;
    }

    setError('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Your new password must be at least 6 characters.'
      );
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    /*
     * FRONTEND PROTOTYPE:
     * Later the backend will validate the recovery
     * token/code and update the customer's password.
     */
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 900);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <Check
            size={40}
            color="#0B0F10"
            strokeWidth={3}
          />
        </View>

        <Text style={styles.successEyebrow}>
          PASSWORD UPDATED
        </Text>

        <Text style={styles.successTitle}>
          You&apos;re all set.
        </Text>

        <Text style={styles.successText}>
          Your MAKAZII password has been changed
          successfully.
          {'\n\n'}
          You can now log in with your new password.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.replace(
              '/onboarding/customer/login'
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            Go to login
          </Text>
        </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
      style={{ flex: 1 }}
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
                Reset password
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
              Create a new
              {'\n'}
              password.
            </Text>

            <Text style={styles.description}>
              Choose a new password for your MAKAZII
              account. Your password should be at
              least 6 characters long.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                NEW PASSWORD
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
                  placeholder="Enter new password"
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
                  disabled={isSubmitting}
                  hitSlop={8}
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                CONFIRM NEW PASSWORD
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
                  placeholder="Confirm new password"
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
                  disabled={isSubmitting}
                  hitSlop={8}
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
              onPress={handleReset}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#0B0F10"
                  />

                  <Text style={styles.primaryButtonText}>
                    Updating password...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Update password
                  </Text>

                  <Check
                    size={18}
                    color="#0B0F10"
                    strokeWidth={2.8}
                  />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.securityNote}>
            <LockKeyhole
              size={15}
              color="#657073"
              strokeWidth={2}
            />

            <Text style={styles.securityText}>
              Never share your MAKAZII password with
              anyone.
            </Text>
          </View>
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
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
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
    textAlign: 'center',
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
    marginBottom: 28,
  },
});
