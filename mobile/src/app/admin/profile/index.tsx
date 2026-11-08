import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Check,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserRound,
} from 'lucide-react-native';

import { useAdmin } from '@/context/AdminContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  rose: '#FF6B81',
};

function formatDate(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function initials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0) ?? '';
  const last = lastName?.trim().charAt(0) ?? '';

  return `${first}${last}`.toUpperCase() || 'A';
}

export default function AdminProfileScreen() {
  const {
    currentAdmin,
    isLoading,
    updateAdminProfile,
    changeAdminPassword,
    logout,
  } = useAdmin();

  const [editingProfile, setEditingProfile] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const adminInitials = useMemo(
    () => initials(currentAdmin?.firstName, currentAdmin?.lastName),
    [currentAdmin?.firstName, currentAdmin?.lastName],
  );

  const beginEditing = () => {
    if (!currentAdmin) return;

    setFirstName(currentAdmin.firstName);
    setLastName(currentAdmin.lastName);
    setEmail(currentAdmin.email);
    setPhone(currentAdmin.phone ?? '');
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    setEditingProfile(false);
  };

  const saveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('First name required', 'Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Last name required', 'Please enter your last name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    setSavingProfile(true);

    try {
      await updateAdminProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      setEditingProfile(false);

      Alert.alert(
        'Profile updated',
        'Your administrator profile has been updated successfully.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to update profile',
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating your profile.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(
        'Current password required',
        'Enter your current password.',
      );
      return;
    }

    if (!newPassword) {
      Alert.alert('New password required', 'Enter your new password.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        'Password too short',
        'Your new password must be at least 8 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'The new password and confirmation do not match.',
      );
      return;
    }

    setChangingPassword(true);

    try {
      await changeAdminPassword(
        currentPassword,
        newPassword,
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      Alert.alert(
        'Password changed',
        'Your administrator password has been changed successfully.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to change password',
        error instanceof Error
          ? error.message
          : 'Something went wrong while changing your password.',
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of the administrator account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            router.replace('/');
            await logout();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color={COLORS.lime} />
        <Text style={styles.loadingText}>Loading administrator profile...</Text>
      </SafeAreaView>
    );
  }

  if (!currentAdmin) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top", "left", "right"]}>
        <ShieldCheck size={42} color={COLORS.lime} />
        <Text style={styles.emptyTitle}>Administrator session required</Text>
        <Text style={styles.emptyText}>
          Please sign in again to access your administrator profile.
        </Text>

        <Pressable
          onPress={() => router.replace('/admin/login')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Go to admin login</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={21} color={COLORS.white} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>ACCOUNT</Text>
              <Text style={styles.title}>Admin Profile</Text>
            </View>
          </View>

          {/* Profile hero */}
          <View style={styles.profileHero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{adminInitials}</Text>
            </View>

            <View style={styles.profileHeroText}>
              <Text style={styles.profileName}>
                {currentAdmin.firstName} {currentAdmin.lastName}
              </Text>

              <Text style={styles.profileEmail}>{currentAdmin.email}</Text>

              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {currentAdmin.isActive ? 'Active account' : 'Inactive account'}
                </Text>
              </View>
            </View>
          </View>

          {/* Personal information */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Personal information</Text>
              <Text style={styles.sectionSubtitle}>
                Your administrator account details
              </Text>
            </View>

            {!editingProfile && (
              <Pressable onPress={beginEditing} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            {editingProfile ? (
              <>
                <InputField
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  icon={<UserRound size={18} color={COLORS.muted} />}
                  autoCapitalize="words"
                />

                <InputField
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  icon={<UserRound size={18} color={COLORS.muted} />}
                  autoCapitalize="words"
                />

                <InputField
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  icon={<Mail size={18} color={COLORS.muted} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <InputField
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  icon={<Phone size={18} color={COLORS.muted} />}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />

                <View style={styles.editActions}>
                  <Pressable
                    onPress={cancelEditing}
                    disabled={savingProfile}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={saveProfile}
                    disabled={savingProfile}
                    style={[
                      styles.saveButton,
                      savingProfile && styles.disabledButton,
                    ]}
                  >
                    {savingProfile ? (
                      <ActivityIndicator size="small" color={COLORS.background} />
                    ) : (
                      <>
                        <Check size={17} color={COLORS.background} />
                        <Text style={styles.saveButtonText}>Save changes</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <InfoRow
                  icon={<User size={18} color={COLORS.muted} />}
                  label="Full name"
                  value={`${currentAdmin.firstName} ${currentAdmin.lastName}`}
                />

                <InfoRow
                  icon={<Mail size={18} color={COLORS.muted} />}
                  label="Email address"
                  value={currentAdmin.email}
                />

                <InfoRow
                  icon={<Phone size={18} color={COLORS.muted} />}
                  label="Phone number"
                  value={currentAdmin.phone || 'Not provided'}
                />
              </>
            )}
          </View>

          {/* Account information */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Account information</Text>
              <Text style={styles.sectionSubtitle}>
                Administrator access details
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <InfoRow
              icon={<ShieldCheck size={18} color={COLORS.muted} />}
              label="Role"
              value="Administrator"
            />

            <InfoRow
              icon={<UserRound size={18} color={COLORS.muted} />}
              label="Admin ID"
              value={currentAdmin.id}
              compactValue
            />

            <InfoRow
              icon={<Check size={18} color={COLORS.muted} />}
              label="Account status"
              value={currentAdmin.isActive ? 'Active' : 'Inactive'}
              valueAccent={currentAdmin.isActive}
            />

            <InfoRow
              icon={<UserRound size={18} color={COLORS.muted} />}
              label="Joined"
              value={formatDate(currentAdmin.createdAt)}
              showDivider={false}
            />
          </View>

          {/* Security */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your administrator password
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Pressable
              onPress={() => setShowPasswordSection((value) => !value)}
              style={styles.securityRow}
            >
              <View style={styles.securityIcon}>
                <KeyRound size={19} color={COLORS.lime} />
              </View>

              <View style={styles.securityText}>
                <Text style={styles.securityTitle}>Change password</Text>
                <Text style={styles.securitySubtitle}>
                  Update your administrator login password
                </Text>
              </View>

              <ChevronRight
                size={20}
                color={COLORS.muted}
                style={{
                  transform: [
                    { rotate: showPasswordSection ? '90deg' : '0deg' },
                  ],
                }}
              />
            </Pressable>

            {showPasswordSection && (
              <View style={styles.passwordForm}>
                <InputField
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  icon={<KeyRound size={18} color={COLORS.muted} />}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <InputField
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  icon={<KeyRound size={18} color={COLORS.muted} />}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <InputField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  icon={<KeyRound size={18} color={COLORS.muted} />}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <Pressable
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                  style={[
                    styles.primaryButton,
                    changingPassword && styles.disabledButton,
                  ]}
                >
                  {changingPassword ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.background}
                    />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Change password
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* Logout */}
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <View style={styles.logoutIcon}>
              <LogOut size={19} color={COLORS.rose} />
            </View>

            <View style={styles.logoutText}>
              <Text style={styles.logoutTitle}>Log out</Text>
              <Text style={styles.logoutSubtitle}>
                End this administrator session
              </Text>
            </View>

            <ChevronRight size={20} color={COLORS.muted} />
          </Pressable>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function InputField({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputContainer}>
        {icon}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          placeholder={label}
          placeholderTextColor={COLORS.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={COLORS.lime}
        />
      </View>
    </View>
  );
}

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  showDivider?: boolean;
  compactValue?: boolean;
  valueAccent?: boolean;
};

function InfoRow({
  icon,
  label,
  value,
  showDivider = true,
  compactValue = false,
  valueAccent = false,
}: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        !showDivider && styles.infoRowLast,
      ]}
    >
      <View style={styles.infoIcon}>{icon}</View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text
          style={[
            styles.infoValue,
            compactValue && styles.compactValue,
            valueAccent && styles.accentValue,
          ]}
          numberOfLines={compactValue ? 2 : undefined}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.muted,
    fontSize: 14,
  },

  emptyTitle: {
    marginTop: 16,
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 360,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  profileHero: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  avatarText: {
    color: COLORS.background,
    fontSize: 22,
    fontWeight: '900',
  },

  profileHeroText: {
    flex: 1,
  },

  profileName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },

  profileEmail: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.lime,
    marginRight: 7,
  },

  statusText: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  editButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  editButtonText: {
    color: COLORS.lime,
    fontSize: 13,
    fontWeight: '800',
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    marginBottom: 28,
    overflow: 'hidden',
  },

  infoRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
    paddingVertical: 12,
  },

  infoLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },

  infoValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  compactValue: {
    fontSize: 12,
    fontWeight: '500',
  },

  accentValue: {
    color: COLORS.lime,
  },

  inputGroup: {
    paddingTop: 16,
  },

  inputLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },

  editActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 18,
    paddingBottom: 18,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.6,
  },

  securityRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  securityText: {
    flex: 1,
  },

  securityTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  securitySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  passwordForm: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 18,
  },

  primaryButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  logoutButton: {
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  logoutText: {
    flex: 1,
  },

  logoutTitle: {
    color: COLORS.rose,
    fontSize: 14,
    fontWeight: '800',
  },

  logoutSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  bottomSpace: {
    height: 40,
  },
});
