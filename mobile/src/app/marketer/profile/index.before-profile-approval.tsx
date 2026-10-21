import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CircleCheck,
  Eye,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react-native';

import { useMarketers } from '@/context/MarketerContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#43D17A',
  greenSoft: '#163322',
  orange: '#FFB454',
  orangeSoft: '#352817',
  red: '#FF6B6B',
  redSoft: '#381C1C',
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatAccountStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'Active';

    case 'INACTIVE':
      return 'Inactive';

    case 'SUSPENDED':
      return 'Suspended';

    default:
      return status || 'Unknown';
  }
}

function getStatusColors(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return {
        text: COLORS.green,
        background: COLORS.greenSoft,
      };

    case 'SUSPENDED':
      return {
        text: COLORS.red,
        background: COLORS.redSoft,
      };

    case 'INACTIVE':
    default:
      return {
        text: COLORS.orange,
        background: COLORS.orangeSoft,
      };
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not provided';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* =========================================================
   SCREEN
   ========================================================= */

export default function MarketerProfileScreen() {
  const {
    currentMarketer,
    isAuthenticated,
    isLoading,
    refreshCurrentMarketer,
    updateMyProfile,
  } = useMarketers();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [notifications, setNotifications] = useState(true);
  const [viewingReminders, setViewingReminders] = useState(true);

  /* =======================================================
     LOAD / REFRESH PROFILE
     ======================================================= */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!currentMarketer) {
      refreshCurrentMarketer();
    }
  }, [
    currentMarketer,
    isAuthenticated,
    refreshCurrentMarketer,
  ]);

  /* =======================================================
     SYNC EDITABLE FIELDS
     ======================================================= */

  useEffect(() => {
    if (!currentMarketer) {
      return;
    }

    setFirstName(
      currentMarketer.user.firstName ?? '',
    );

    setLastName(
      currentMarketer.user.lastName ?? '',
    );

    setPhone(
      currentMarketer.user.phone ?? '',
    );

    setEmail(
      currentMarketer.user.email ?? '',
    );
  }, [currentMarketer]);

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    isLoading ||
    (!currentMarketer && isAuthenticated)
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text style={styles.loadingText}>
          Loading marketer profile...
        </Text>
      </View>
    );
  }

  /* =======================================================
     NO AUTHENTICATED MARKETER
     ======================================================= */

  if (!currentMarketer) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <ShieldCheck
            size={26}
            color={COLORS.lime}
            strokeWidth={2}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Marketer account required
        </Text>

        <Text style={styles.emptyDescription}>
          Please sign in with your MAKAZII marketer
          account to view your profile.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.replace('/marketer/login')
          }
        >
          <Text style={styles.emptyButtonText}>
            Sign in
          </Text>
        </Pressable>
      </View>
    );
  }

  const marketer = currentMarketer;
  const user = marketer.user;
  const coverage = marketer.coverage;

  const status = formatAccountStatus(
    user.accountStatus,
  );

  const statusColors =
    getStatusColors(user.accountStatus);

  const isActive =
    user.isActive &&
    user.accountStatus?.toUpperCase() ===
      'ACTIVE';

  const initials =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase(),
      )
      .join('');

  const wards = coverage?.wards ?? [];

  const propertyStats =
    marketer.statistics?.properties;

  const viewingStats =
    marketer.statistics?.viewings;

  /* =======================================================
     EDITING
     ======================================================= */

  const startEditing = () => {
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setEmail(user.email ?? '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setEmail(user.email ?? '');
    setEditing(false);
  };

  /* =======================================================
     SAVE
     ======================================================= */

  const handleSave = async () => {
    const trimmedFirstName =
      firstName.trim();

    const trimmedLastName =
      lastName.trim();

    const trimmedPhone =
      phone.trim();

    const trimmedEmail =
      email.trim().toLowerCase();

    if (trimmedFirstName.length < 2) {
      Alert.alert(
        'First name required',
        'Please enter your first name.',
      );
      return;
    }

    if (trimmedLastName.length < 2) {
      Alert.alert(
        'Last name required',
        'Please enter your last name.',
      );
      return;
    }

    if (trimmedPhone.length < 9) {
      Alert.alert(
        'Phone number required',
        'Please enter a valid phone number.',
      );
      return;
    }

    if (!trimmedEmail) {
      Alert.alert(
        'Email required',
        'Please enter your email address.',
      );
      return;
    }

    setSaving(true);

    try {
      await updateMyProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phone: trimmedPhone,
        email: trimmedEmail,
      });

      setEditing(false);

      Alert.alert(
        'Profile updated',
        'Your marketer profile has been updated successfully.',
      );
    } catch (error) {
      console.error(
        'MARKETER PROFILE UPDATE ERROR:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update your profile. Please try again.';

      Alert.alert(
        'Update failed',
        message,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={20}
              color={COLORS.white}
              strokeWidth={2}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Profile
            </Text>

            <Text style={styles.headerSubtitle}>
              Marketer account
            </Text>
          </View>

          {!editing ? (
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
              onPress={startEditing}
            >
              <Text style={styles.editButtonText}>
                Edit
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
              onPress={cancelEditing}
              disabled={saving}
            >
              <X
                size={18}
                color={COLORS.muted}
                strokeWidth={2}
              />
            </Pressable>
          )}
        </View>

        {/* =================================================
            PROFILE HERO
            ================================================= */}

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials || 'M'}
            </Text>

            {isActive && (
              <View style={styles.avatarCheck}>
                <Check
                  size={11}
                  color={COLORS.background}
                  strokeWidth={3}
                />
              </View>
            )}
          </View>

          <Text style={styles.profileName}>
            {`${user.firstName} ${user.lastName}`.trim() ||
              'MAKAZII Marketer'}
          </Text>

          <Text style={styles.profileRole}>
            MAKAZII Marketer
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusColors.background,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    statusColors.text,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusColors.text,
                },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* =================================================
            PORTAL ACCESS
            ================================================= */}

        <View style={styles.accountStatusCard}>
          <View style={styles.accountStatusIcon}>
            <ShieldCheck
              size={21}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.accountStatusContent}>
            <Text style={styles.accountStatusTitle}>
              Portal access
            </Text>

            <Text
              style={styles.accountStatusDescription}
            >
              {user.isActive
                ? 'Your marketer portal access is active.'
                : 'Your marketer portal access is currently inactive.'}
            </Text>
          </View>

          <View
            style={[
              styles.accessBadge,
              {
                backgroundColor: user.isActive
                  ? COLORS.greenSoft
                  : COLORS.redSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.accessBadgeText,
                {
                  color: user.isActive
                    ? COLORS.green
                    : COLORS.red,
                },
              ]}
            >
              {user.isActive
                ? 'ACTIVE'
                : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* =================================================
            PERSONAL INFORMATION
            ================================================= */}

        <SectionHeader
          title="Personal information"
          subtitle="Your basic account details"
        />

        <View style={styles.card}>
          <ProfileField
            icon={
              <UserRound
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="First name"
            value={firstName}
            editing={editing}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
          />

          <Divider />

          <ProfileField
            icon={
              <UserRound
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Last name"
            value={lastName}
            editing={editing}
            onChangeText={setLastName}
            placeholder="Enter your last name"
          />

          <Divider />

          <ProfileField
            icon={
              <PhoneIcon />
            }
            label="Phone number"
            value={phone}
            editing={editing}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <Divider />

          <ProfileField
            icon={
              <Mail
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Email address"
            value={email}
            editing={editing}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* =================================================
            APPROVED COVERAGE
            ================================================= */}

        <SectionHeader
          title="Approved coverage"
          subtitle="Your assigned MAKAZII operating area"
        />

        <View style={styles.card}>
          <ReadOnlyRow
            icon={
              <MapPin
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="County"
            value={
              coverage?.county?.name ||
              'Not assigned'
            }
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <MapPin
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Constituency"
            value={
              coverage?.constituency?.name ||
              'Not assigned'
            }
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <MapPin
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Ward 1"
            value={
              wards[0]?.name ||
              'Not assigned'
            }
          />

          {wards.length > 1 && (
            <>
              <Divider />

              <ReadOnlyRow
                icon={
                  <MapPin
                    size={18}
                    color={COLORS.lime}
                    strokeWidth={2}
                  />
                }
                label="Ward 2"
                value={
                  wards[1]?.name ||
                  'Not assigned'
                }
              />
            </>
          )}

          <View style={styles.coverageNotice}>
            <ShieldCheck
              size={16}
              color={COLORS.lime}
              strokeWidth={2}
            />

            <Text style={styles.coverageNoticeText}>
              Your approved coverage is managed by
              MAKAZII. It cannot be changed from
              your profile.
            </Text>
          </View>
        </View>

        {/* =================================================
            ACCOUNT INFORMATION
            ================================================= */}

        <SectionHeader
          title="Account information"
          subtitle="Information managed by MAKAZII"
        />

        <View style={styles.card}>
          <ReadOnlyRow
            icon={
              <UserRound
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Account ID"
            value={marketer.id}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <CircleCheck
                size={18}
                color={
                  statusColors.text
                }
                strokeWidth={2}
              />
            }
            label="Account status"
            value={status}
            valueColor={
              statusColors.text
            }
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <ShieldCheck
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Portal access"
            value={
              user.isActive
                ? 'Active'
                : 'Inactive'
            }
            valueColor={
              user.isActive
                ? COLORS.green
                : COLORS.red
            }
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <BriefcaseBusiness
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Total properties"
            value={String(
              propertyStats?.total ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <Eye
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Total viewings"
            value={String(
              viewingStats?.total ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <MapPin
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Assigned places"
            value={String(
              marketer.statistics
                ?.assignedPlaces ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <CircleCheck
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Joined"
            value={formatDate(
              user.createdAt,
            )}
          />
        </View>

        {/* =================================================
            PROPERTY ACTIVITY
            ================================================= */}

        <SectionHeader
          title="Property activity"
          subtitle="Current statistics from your marketer account"
        />

        <View style={styles.statsGrid}>
          <StatCard
            label="Total"
            value={
              propertyStats?.total ?? 0
            }
          />

          <StatCard
            label="Draft"
            value={
              propertyStats?.draft ?? 0
            }
          />

          <StatCard
            label="Pending review"
            value={
              propertyStats
                ?.pendingVerification ?? 0
            }
          />

          <StatCard
            label="Changes required"
            value={
              propertyStats
                ?.changesRequired ?? 0
            }
          />

          <StatCard
            label="Active"
            value={
              propertyStats?.active ?? 0
            }
          />

          <StatCard
            label="Rented"
            value={
              propertyStats?.rented ?? 0
            }
          />
        </View>

        {/* =================================================
            VIEWING ACTIVITY
            ================================================= */}

        <SectionHeader
          title="Viewing activity"
          subtitle="Viewing requests associated with your account"
        />

        <View style={styles.card}>
          <ReadOnlyRow
            icon={
              <Eye
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Total requests"
            value={String(
              viewingStats?.total ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <CircleCheck
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Requested"
            value={String(
              viewingStats?.requested ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <CircleCheck
                size={18}
                color={COLORS.green}
                strokeWidth={2}
              />
            }
            label="Confirmed"
            value={String(
              viewingStats?.confirmed ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <CircleCheck
                size={18}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Completed"
            value={String(
              viewingStats?.completed ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <X
                size={18}
                color={COLORS.red}
                strokeWidth={2}
              />
            }
            label="Cancelled"
            value={String(
              viewingStats?.cancelled ?? 0,
            )}
          />

          <Divider />

          <ReadOnlyRow
            icon={
              <X
                size={18}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            label="Declined"
            value={String(
              viewingStats?.declined ?? 0,
            )}
          />
        </View>

        {/* =================================================
            STATUS REASON
            ================================================= */}

        {user.statusReason?.trim() && (
          <>
            <SectionHeader
              title="Account notice"
              subtitle="Information from MAKAZII administration"
            />

            <View
              style={[
                styles.noticeCard,
                {
                  borderColor:
                    statusColors.text,
                },
              ]}
            >
              <ShieldCheck
                size={19}
                color={statusColors.text}
                strokeWidth={2}
              />

              <View
                style={
                  styles.noticeContent
                }
              >
                <Text
                  style={[
                    styles.noticeTitle,
                    {
                      color:
                        statusColors.text,
                    },
                  ]}
                >
                  {status === 'Active'
                    ? 'Account information'
                    : 'Account status notice'}
                </Text>

                <Text
                  style={styles.noticeText}
                >
                  {user.statusReason}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* =================================================
            PREFERENCES
            ================================================= */}

        <SectionHeader
          title="Preferences"
          subtitle="Choose what you want to receive"
        />

        <View style={styles.card}>
          <PreferenceRow
            title="Portal notifications"
            description="Receive updates about your marketer account."
            value={notifications}
            onValueChange={
              setNotifications
            }
          />

          <Divider />

          <PreferenceRow
            title="Viewing reminders"
            description="Receive reminders for upcoming property visits."
            value={viewingReminders}
            onValueChange={
              setViewingReminders
            }
          />
        </View>

        {/* =================================================
            SAVE BUTTON
            ================================================= */}

        {editing && (
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
              saving &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.background
                }
              />
            ) : (
              <Save
                size={18}
                color={COLORS.background}
                strokeWidth={2.5}
              />
            )}

            <Text
              style={styles.saveButtonText}
            >
              {saving
                ? 'Saving...'
                : 'Save changes'}
            </Text>
          </Pressable>
        )}

        {/* =================================================
            FOOTER
            ================================================= */}

        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerBrand}>
            MAKAZII
          </Text>

          <Text style={styles.footerText}>
            Find your place.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   PHONE ICON
   ========================================================= */

function PhoneIcon() {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: COLORS.lime,
          fontSize: 17,
          fontWeight: '700',
        }}
      >
        ☎
      </Text>
    </View>
  );
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

/* =========================================================
   PROFILE FIELD
   ========================================================= */

function ProfileField({
  icon,
  label,
  value,
  editing,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?:
    | 'default'
    | 'phone-pad'
    | 'email-address';
  autoCapitalize?:
    | 'none'
    | 'sentences';
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.fieldIcon}>
        {icon}
      </View>

      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>
          {label}
        </Text>

        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#687174"
            keyboardType={
              keyboardType ?? 'default'
            }
            autoCapitalize={
              autoCapitalize ??
              'sentences'
            }
            style={styles.textInput}
          />
        ) : (
          <Text style={styles.fieldValue}>
            {value || 'Not provided'}
          </Text>
        )}
      </View>
    </View>
  );
}

/* =========================================================
   READ ONLY ROW
   ========================================================= */

function ReadOnlyRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.fieldIcon}>
        {icon}
      </View>

      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.fieldValue,
            valueColor && {
              color: valueColor,
            },
          ]}
        >
          {value || 'Not provided'}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* =========================================================
   PREFERENCE ROW
   ========================================================= */

function PreferenceRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceContent}>
        <Text style={styles.preferenceTitle}>
          {title}
        </Text>

        <Text
          style={
            styles.preferenceDescription
          }
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
        trackColor={{
          false: '#30383A',
          true: '#62752B',
        }}
        thumbColor={
          value
            ? COLORS.lime
            : '#AAB2B4'
        }
        ios_backgroundColor="#30383A"
      />
    </View>
  );
}

/* =========================================================
   DIVIDER
   ========================================================= */

function Divider() {
  return (
    <View style={styles.divider} />
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 55,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor:
      COLORS.background,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 18,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },

  emptyButton: {
    minWidth: 130,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
  },

  emptyButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },

  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  headerSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '500',
  },

  editButton: {
    minWidth: 58,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.lime,
  },

  editButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },

  cancelButton: {
    width: 42,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  pressed: {
    opacity: 0.72,
  },

  profileHero: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      '#263015',
    borderWidth: 2,
    borderColor:
      COLORS.lime,
    position: 'relative',
  },

  avatarText: {
    color: COLORS.lime,
    fontSize: 27,
    fontWeight: '800',
  },

  avatarCheck: {
    position: 'absolute',
    right: -1,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.lime,
    borderWidth: 2,
    borderColor:
      COLORS.card,
  },

  profileName: {
    marginTop: 13,
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  profileRole: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '500',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  accountStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 28,
    borderRadius: 19,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  accountStatusIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      '#202B11',
    marginRight: 12,
  },

  accountStatusContent: {
    flex: 1,
    paddingRight: 8,
  },

  accountStatusTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  accountStatusDescription: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
  },

  accessBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  card: {
    overflow: 'visible',
    marginBottom: 27,
    borderRadius: 20,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },

  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.cardSoft,
    marginRight: 12,
  },

  fieldContent: {
    flex: 1,
    minWidth: 0,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform:
      'uppercase',
    marginBottom: 5,
  },

  fieldValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },

  textInput: {
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },

  coverageNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    margin: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor:
      '#202B11',
    borderWidth: 1,
    borderColor:
      '#394B19',
  },

  coverageNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    marginLeft: 67,
    backgroundColor:
      COLORS.border,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 27,
  },

  statCard: {
    width: '31.5%',
    minHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  statValue: {
    color: COLORS.lime,
    fontSize: 22,
    fontWeight: '800',
  },

  statLabel: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    marginBottom: 27,
    borderRadius: 18,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
  },

  noticeContent: {
    flex: 1,
    marginLeft: 11,
  },

  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },

  noticeText: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  preferenceRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  preferenceContent: {
    flex: 1,
    paddingRight: 14,
  },

  preferenceTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  preferenceDescription: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  saveButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: -7,
    marginBottom: 27,
    borderRadius: 16,
    backgroundColor:
      COLORS.lime,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },

  footerLine: {
    width: 50,
    height: 2,
    borderRadius: 1,
    backgroundColor:
      COLORS.lime,
    marginBottom: 14,
  },

  footerBrand: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },

  footerText: {
    marginTop: 4,
    color: '#687174',
    fontSize: 10,
  },
});
