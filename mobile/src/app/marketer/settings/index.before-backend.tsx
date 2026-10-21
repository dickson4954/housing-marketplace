import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleCheck,
  Eye,
  KeyRound,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserRound,
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

export default function MarketerSettingsScreen() {
  const { marketers } = useMarketers();

  const marketer = useMemo(() => {
    return (
      marketers.find(
        (item) => item.status === 'Active' && item.portalAccess,
      ) ?? marketers[0]
    );
  }, [marketers]);

  const [notifications, setNotifications] = useState(true);
  const [viewingAlerts, setViewingAlerts] = useState(true);
  const [propertyUpdates, setPropertyUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handlePasswordChange = () => {
    Alert.alert(
      'Change password',
      'Password management will be connected to the backend when marketer authentication is implemented.',
      [{ text: 'OK' }],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of the marketer portal?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            router.replace('/onboarding/role-selection');
          },
        },
      ],
    );
  };

  if (!marketer) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>MAKAZII</Text>
        <Text style={styles.loadingText}>
          Loading settings...
        </Text>
      </View>
    );
  }

  const isActive =
    marketer.status === 'Active' && marketer.portalAccess;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
              strokeWidth={2.2}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MARKETER PORTAL</Text>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/marketer/profile')}
          >
            <UserRound
              size={19}
              color={COLORS.white}
              strokeWidth={2.1}
            />
          </Pressable>
        </View>

        {/* ACCOUNT STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <ShieldCheck
              size={23}
              color={
                isActive
                  ? COLORS.green
                  : COLORS.orange
              }
              strokeWidth={2}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {isActive
                ? 'Account active'
                : 'Account pending'}
            </Text>

            <Text style={styles.statusText}>
              {isActive
                ? 'Your marketer portal access is currently active.'
                : 'Your marketer account is waiting for activation.'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isActive
                ? styles.statusBadgeActive
                : styles.statusBadgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isActive
                  ? styles.statusBadgeActiveText
                  : styles.statusBadgePendingText,
              ]}
            >
              {marketer.status}
            </Text>
          </View>
        </View>

        {/* ACCOUNT */}
        <SectionTitle
          title="Account"
          subtitle="Manage your marketer portal account"
        />

        <View style={styles.card}>
          <SettingRow
            icon={
              <UserRound
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Profile"
            description="Update your personal and work information"
            onPress={() =>
              router.push('/marketer/profile')
            }
          />

          <Divider />

          <SettingRow
            icon={
              <KeyRound
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Password"
            description="Change your marketer portal password"
            onPress={handlePasswordChange}
          />

          <Divider />

          <SettingRow
            icon={
              <Smartphone
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Contact information"
            description={
              marketer.phone ||
              'No phone number added'
            }
            onPress={() =>
              router.push('/marketer/profile')
            }
          />
        </View>

        {/* NOTIFICATIONS */}
        <SectionTitle
          title="Notifications"
          subtitle="Choose what you want to be notified about"
        />

        <View style={styles.card}>
          <PreferenceRow
            icon={
              <Bell
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Push notifications"
            description="Receive important portal notifications"
            value={notifications}
            onValueChange={setNotifications}
          />

          <Divider />

          <PreferenceRow
            icon={
              <Eye
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Viewing alerts"
            description="Get notified about new viewing requests"
            value={viewingAlerts}
            onValueChange={setViewingAlerts}
          />

          <Divider />

          <PreferenceRow
            icon={
              <CircleCheck
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Property updates"
            description="Updates about submitted properties"
            value={propertyUpdates}
            onValueChange={setPropertyUpdates}
          />

          <Divider />

          <PreferenceRow
            icon={
              <ShieldCheck
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Security alerts"
            description="Important account and security activity"
            value={securityAlerts}
            onValueChange={setSecurityAlerts}
          />
        </View>

        {/* PORTAL INFORMATION */}
        <SectionTitle
          title="Portal information"
          subtitle="Your current marketer account details"
        />

        <View style={styles.infoCard}>
          <InfoItem
            label="Username"
            value={
              marketer.username ||
              'Not assigned'
            }
          />

          <Divider />

          <InfoItem
            label="Coverage area"
            value={
              marketer.area ||
              'Not assigned'
            }
          />

          <Divider />

          <InfoItem
            label="Properties"
            value={String(marketer.properties ?? 0)}
          />

          <Divider />

          <InfoItem
            label="Landlords"
            value={String(marketer.landlords ?? 0)}
          />

          <Divider />

          <InfoItem
            label="Viewings"
            value={String(marketer.viewings ?? 0)}
          />

          <Divider />

          <InfoItem
            label="Joined"
            value={
              marketer.joined ||
              'Not available'
            }
          />
        </View>

        {/* SECURITY */}
        <SectionTitle
          title="Security"
          subtitle="Keep your marketer account protected"
        />

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <ShieldCheck
              size={22}
              color={COLORS.green}
              strokeWidth={2}
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              MAKAZII portal security
            </Text>

            <Text style={styles.securityText}>
              Your marketer account gives you access to
              property, landlord and viewing information.
              Keep your login details private and do not
              share your temporary or permanent password.
            </Text>
          </View>
        </View>

        {/* LOGOUT */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
          onPress={handleLogout}
        >
          <LogOut
            size={19}
            color={COLORS.red}
            strokeWidth={2.2}
          />

          <Text style={styles.logoutText}>
            Log out
          </Text>
        </Pressable>

        {/* FOOTER */}
        <Text style={styles.footerText}>
          MAKAZII MARKETER PORTAL
        </Text>

        <Text style={styles.footerVersion}>
          Frontend portal • Backend authentication coming later
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION TITLE */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>
        {title}
      </Text>

      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* SETTING ROW */
/* -------------------------------------------------------------------------- */

function SettingRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactElement;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        pressed ? styles.pressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <ChevronRight
        size={19}
        color={COLORS.muted}
        strokeWidth={2}
      />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* PREFERENCE ROW */
/* -------------------------------------------------------------------------- */

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: React.ReactElement;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.settingIcon}>
        {icon}
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.border,
          true: COLORS.lime,
        }}
        thumbColor={
          Platform.OS === 'android'
            ? value
              ? COLORS.background
              : COLORS.muted
            : undefined
        }
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* INFORMATION ITEM */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* DIVIDER */
/* -------------------------------------------------------------------------- */

function Divider() {
  return <View style={styles.divider} />;
}

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },

  loadingTitle: {
    color: COLORS.lime,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },

  loadingText: {
    color: COLORS.muted,
    marginTop: 8,
    fontSize: 14,
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
  },

  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  statusContent: {
    flex: 1,
    minWidth: 0,
  },

  statusTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  statusText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginLeft: 10,
  },

  statusBadgeActive: {
    backgroundColor: COLORS.greenSoft,
  },

  statusBadgePending: {
    backgroundColor: COLORS.orangeSoft,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  statusBadgeActiveText: {
    color: COLORS.green,
  },

  statusBadgePendingText: {
    color: COLORS.orange,
  },

  sectionTitle: {
    marginBottom: 12,
    marginTop: 5,
  },

  sectionHeading: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 28,
  },

  settingRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  settingContent: {
    flex: 1,
    minWidth: 0,
  },

  settingTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  settingDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 71,
  },

  preferenceRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 28,
  },

  infoItem: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 12,
    gap: 20,
  },

  infoLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  infoValue: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },

  securityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: '#245235',
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
  },

  securityIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#1D442C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  securityText: {
    color: '#B9DCC4',
    fontSize: 12,
    lineHeight: 18,
  },

  logoutButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A2527',
    backgroundColor: COLORS.redSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
  },

  logoutText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.72,
  },

  footerText: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginTop: 34,
  },

  footerVersion: {
    color: '#596264',
    textAlign: 'center',
    fontSize: 10,
    marginTop: 6,
  },
});
