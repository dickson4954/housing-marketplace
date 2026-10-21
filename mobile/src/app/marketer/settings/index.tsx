import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useMarketers } from '@/context/MarketerContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B7A',
  success: '#7CFFB2',
};

function formatStatus(status?: string | null) {
  if (!status) return 'Unknown';

  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: number | string | undefined | null;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>
        {value ?? 0}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>
        {value === null ||
        value === undefined ||
        String(value).trim() === ''
          ? '—'
          : String(value)}
      </Text>
    </View>
  );
}

export default function MarketerSettingsScreen() {
  const router = useRouter();

  const {
    currentMarketer,
    isAuthenticated,
    isLoading,
    changePassword,
    logout,
  } = useMarketers();

  const [passwordModalVisible, setPasswordModalVisible] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [passwordError, setPasswordError] =
    useState('');

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const fullName = useMemo(() => {
    if (!currentMarketer) return '';

    return [
      currentMarketer.user.firstName,
      currentMarketer.user.lastName,
    ]
      .filter(Boolean)
      .join(' ');
  }, [currentMarketer]);

  const initials = useMemo(() => {
    if (!currentMarketer) return 'M';

    const first =
      currentMarketer.user.firstName?.charAt(0) || '';

    const last =
      currentMarketer.user.lastName?.charAt(0) || '';

    return `${first}${last}`.toUpperCase() || 'M';
  }, [currentMarketer]);

  const accountStatus =
    currentMarketer?.user.accountStatus;

  const accountIsActive =
    Boolean(
      currentMarketer?.user.isActive &&
        accountStatus === 'ACTIVE',
    );

  const coverage = currentMarketer?.coverage;

  const wards = coverage?.wards ?? [];

  const statistics = currentMarketer?.statistics;

  const properties = statistics?.properties;
  const viewings = statistics?.viewings;

  const closePasswordModal = () => {
    if (passwordSaving) return;

    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const openPasswordModal = () => {
    setPasswordError('');
    setPasswordModalVisible(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!currentPassword.trim()) {
      setPasswordError(
        'Please enter your current password.',
      );
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError(
        'Please enter your new password.',
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'Your new password must be at least 8 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'The new passwords do not match.',
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        'Your new password must be different from your current password.',
      );
      return;
    }

    try {
      setPasswordSaving(true);

      await changePassword({
        currentPassword,
        newPassword,
      });

      closePasswordModal();

      Alert.alert(
        'Password changed',
        'Your marketer account password has been updated successfully.',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to change your password.';

      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out of your marketer account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } finally {
              router.replace('/');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text style={styles.loadingText}>
          Loading your marketer account...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated || !currentMarketer) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>!</Text>
        </View>

        <Text style={styles.emptyTitle}>
          Marketer session unavailable
        </Text>

        <Text style={styles.emptyText}>
          Your marketer session is no longer available.
          Please sign in again to continue.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.replace(
              '/onboarding/role-selection',
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            Continue to sign in
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                MARKETER ACCOUNT
              </Text>

              <Text style={styles.title}>
                Settings
              </Text>

              <Text style={styles.subtitle}>
                Manage your account, coverage and
                security.
              </Text>
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initials}
              </Text>
            </View>
          </View>

          {/* ACCOUNT */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.sectionTitle}>
                  Account
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Your authenticated marketer profile
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  accountIsActive
                    ? styles.statusBadgeActive
                    : styles.statusBadgeInactive,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    accountIsActive
                      ? styles.statusDotActive
                      : styles.statusDotInactive,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    accountIsActive
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {formatStatus(accountStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.profileSummary}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>
                  {initials}
                </Text>
              </View>

              <View style={styles.profileSummaryText}>
                <Text style={styles.profileName}>
                  {fullName || 'Marketer'}
                </Text>

                <Text style={styles.profileEmail}>
                  {currentMarketer.user.email ||
                    'No email provided'}
                </Text>

                <Text style={styles.profileId}>
                  Marketer ID: {currentMarketer.id}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <InfoRow
              label="First name"
              value={currentMarketer.user.firstName}
            />

            <InfoRow
              label="Last name"
              value={currentMarketer.user.lastName}
            />

            <InfoRow
              label="Phone"
              value={
                currentMarketer.user.phone ||
                'Not provided'
              }
            />

            <InfoRow
              label="Email"
              value={
                currentMarketer.user.email ||
                'Not provided'
              }
            />

            <InfoRow
              label="Role"
              value={formatStatus(
                currentMarketer.user.role,
              )}
            />

            <InfoRow
              label="Portal access"
              value={
                currentMarketer.user.isActive
                  ? 'Enabled'
                  : 'Disabled'
              }
            />

            <InfoRow
              label="Joined"
              value={formatDate(
                currentMarketer.user.createdAt,
              )}
            />

            {currentMarketer.user.statusReason ? (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>
                  ACCOUNT STATUS NOTE
                </Text>

                <Text style={styles.reasonText}>
                  {currentMarketer.user.statusReason}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/marketer/profile')
              }
            >
              <Text style={styles.secondaryButtonText}>
                Manage profile
              </Text>

              <Text style={styles.secondaryButtonArrow}>
                →
              </Text>
            </Pressable>
          </View>

          {/* COVERAGE */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.sectionTitle}>
                  Assigned coverage
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Your approved property registration
                  area
                </Text>
              </View>

              <View style={styles.coverageCount}>
                <Text style={styles.coverageCountText}>
                  {wards.length}/2
                </Text>
              </View>
            </View>

            <InfoRow
              label="County"
              value={
                coverage?.county?.name ||
                'Not assigned'
              }
            />

            <InfoRow
              label="Constituency"
              value={
                coverage?.constituency?.name ||
                'Not assigned'
              }
            />

            <View style={styles.coverageSection}>
              <Text style={styles.coverageLabel}>
                ASSIGNED WARDS
              </Text>

              {wards.length > 0 ? (
                <View style={styles.chipWrap}>
                  {wards.map(
                    (ward: {
                      id: string;
                      name: string;
                    }) => (
                      <View
                        key={ward.id}
                        style={styles.coverageChip}
                      >
                        <View
                          style={styles.coverageChipDot}
                        />

                        <Text
                          style={styles.coverageChipText}
                        >
                          {ward.name}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>
                  No wards assigned.
                </Text>
              )}
            </View>

            <View style={styles.infoNotice}>
              <Text style={styles.infoNoticeIcon}>
                i
              </Text>

              <Text style={styles.infoNoticeText}>
                Coverage is controlled by MAKAZII
                administration. Contact an administrator
                if your assigned area needs to change.
              </Text>
            </View>
          </View>

          {/* PROPERTY ACTIVITY */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Property activity
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your current property portfolio
            </Text>

            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {properties?.total ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Total
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {properties?.active ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Active
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {properties?.draft ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Draft
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {properties?.pendingVerification ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Pending
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <StatRow
              label="Changes required"
              value={properties?.changesRequired ?? 0}
            />

            <StatRow
              label="Rented"
              value={properties?.rented ?? 0}
            />

            <StatRow
              label="Inactive"
              value={properties?.inactive ?? 0}
            />

            <StatRow
              label="Rejected"
              value={properties?.rejected ?? 0}
            />
          </View>

          {/* VIEWING ACTIVITY */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Viewing activity
            </Text>

            <Text style={styles.sectionSubtitle}>
              Viewing requests connected to your
              properties
            </Text>

            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {viewings?.total ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Total
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {viewings?.paid ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Paid
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {viewings?.assigned ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Assigned
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {viewings?.approved ?? 0}
                </Text>

                <Text style={styles.statBoxLabel}>
                  Approved
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <StatRow
              label="Rescheduled"
              value={viewings?.rescheduled ?? 0}
            />

            <StatRow
              label="Completed"
              value={viewings?.completed ?? 0}
            />

            <StatRow
              label="Cancelled"
              value={viewings?.cancelled ?? 0}
            />
          </View>

          {/* SECURITY */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Security
            </Text>

            <Text style={styles.sectionSubtitle}>
              Keep your marketer account protected.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.pressed,
              ]}
              onPress={openPasswordModal}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>
                  •••
                </Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  Change password
                </Text>

                <Text style={styles.actionSubtitle}>
                  Update your account password
                </Text>
              </View>

              <Text style={styles.actionArrow}>
                →
              </Text>
            </Pressable>
          </View>

          {/* SIGN OUT */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Sign out of marketer portal
            </Text>
          </Pressable>

          <Text style={styles.footerText}>
            MAKAZII Marketer Portal
          </Text>

          <Text style={styles.footerSubtext}>
            Your account and coverage are managed securely
            through MAKAZII.
          </Text>
        </ScrollView>
      </View>

      {/* PASSWORD MODAL */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  Change password
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter your current password and choose a
                  new one.
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closePasswordModal}
                disabled={passwordSaving}
              >
                <Text style={styles.closeButtonText}>
                  ×
                </Text>
              </Pressable>
            </View>

            {passwordError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {passwordError}
                </Text>
              </View>
            ) : null}

            {/* CURRENT PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Current password
              </Text>

              <View style={styles.passwordInputWrap}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!passwordSaving}
                />

                <Pressable
                  style={styles.showButton}
                  onPress={() =>
                    setShowCurrentPassword(
                      (value) => !value,
                    )
                  }
                  disabled={passwordSaving}
                >
                  <Text style={styles.showButtonText}>
                    {showCurrentPassword
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* NEW PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                New password
              </Text>

              <View style={styles.passwordInputWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!passwordSaving}
                />

                <Pressable
                  style={styles.showButton}
                  onPress={() =>
                    setShowNewPassword(
                      (value) => !value,
                    )
                  }
                  disabled={passwordSaving}
                >
                  <Text style={styles.showButtonText}>
                    {showNewPassword
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* CONFIRM PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Confirm new password
              </Text>

              <View style={styles.passwordInputWrap}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat new password"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!passwordSaving}
                />

                <Pressable
                  style={styles.showButton}
                  onPress={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  disabled={passwordSaving}
                >
                  <Text style={styles.showButtonText}>
                    {showConfirmPassword
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.passwordHint}>
              Use at least 8 characters. Your current
              password and new password must be different.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.pressed,
                ]}
                onPress={closePasswordModal}
                disabled={passwordSaving}
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveButton,
                  pressed && styles.pressed,
                  passwordSaving &&
                    styles.modalSaveButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? (
                  <ActivityIndicator
                    color={COLORS.background}
                  />
                ) : (
                  <Text style={styles.modalSaveText}>
                    Change password
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 120,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.muted,
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 16,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  title: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 7,
    maxWidth: 280,
    lineHeight: 19,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '900',
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  cardHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusBadgeActive: {
    backgroundColor: 'rgba(215,255,95,0.08)',
    borderColor: 'rgba(215,255,95,0.25)',
  },

  statusBadgeInactive: {
    backgroundColor: 'rgba(255,107,122,0.08)',
    borderColor: 'rgba(255,107,122,0.25)',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusDotActive: {
    backgroundColor: COLORS.lime,
  },

  statusDotInactive: {
    backgroundColor: COLORS.danger,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  statusTextActive: {
    color: COLORS.lime,
  },

  statusTextInactive: {
    color: COLORS.danger,
  },

  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeAvatarText: {
    color: COLORS.lime,
    fontSize: 20,
    fontWeight: '900',
  },

  profileSummaryText: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  profileEmail: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  profileId: {
    color: '#6F797B',
    fontSize: 10,
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
  },

  infoLabel: {
    color: COLORS.muted,
    fontSize: 12,
    flex: 0.85,
  },

  infoValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.15,
  },

  reasonBox: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },

  reasonLabel: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  reasonText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  secondaryButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  secondaryButtonArrow: {
    color: COLORS.lime,
    fontSize: 19,
    fontWeight: '700',
  },

  coverageCount: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverageCountText: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '900',
  },

  coverageSection: {
    marginTop: 12,
  },

  coverageLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  coverageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(215,255,95,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(215,255,95,0.2)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  coverageChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lime,
    marginRight: 7,
  },

  coverageChipText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  noDataText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(215,255,95,0.05)',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },

  infoNoticeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    color: COLORS.background,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '900',
    marginRight: 9,
  },

  infoNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },

  statBox: {
    width: '48%',
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statNumber: {
    color: COLORS.lime,
    fontSize: 24,
    fontWeight: '900',
  },

  statBoxLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    marginTop: 16,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIconText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  actionContent: {
    flex: 1,
    marginLeft: 12,
  },

  actionTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  actionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  actionArrow: {
    color: COLORS.lime,
    fontSize: 19,
    fontWeight: '700',
    paddingHorizontal: 8,
  },

  logoutButton: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,107,122,0.3)',
    backgroundColor: 'rgba(255,107,122,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  footerText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 24,
  },

  footerSubtext: {
    color: '#687173',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  pressed: {
    opacity: 0.72,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyIconText: {
    color: COLORS.lime,
    fontSize: 22,
    fontWeight: '900',
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },

  primaryButton: {
    minHeight: 50,
    backgroundColor: COLORS.lime,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginTop: 20,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  modalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 310,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    color: COLORS.white,
    fontSize: 23,
    lineHeight: 24,
  },

  errorBox: {
    backgroundColor: 'rgba(255,107,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,122,0.25)',
    borderRadius: 13,
    padding: 11,
    marginBottom: 14,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 18,
  },

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },

  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    minHeight: 50,
  },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  showButton: {
    paddingHorizontal: 12,
  },

  showButtonText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '800',
  },

  passwordHint: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 1,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  modalCancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  modalSaveButton: {
    flex: 1.35,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSaveButtonDisabled: {
    opacity: 0.65,
  },

  modalSaveText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },
});