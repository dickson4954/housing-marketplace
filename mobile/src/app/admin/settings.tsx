import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Lock,
  Megaphone,
  Menu,
  MoreHorizontal,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react-native';

import { API_BASE_URL } from '@/config/api';
import { useAdmin } from '@/context/AdminContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#0B0F10',
  sidebar: '#0E1314',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  text: '#E9EEEE',
  muted: '#9CA5A7',
  subtle: '#6F797B',
  sidebarText: '#7F898B',
  border: '#252C2E',
  success: '#7BE495',
  warning: '#FFC857',
  danger: '#FF6B6B',
};

type SettingsSection =
  | 'Profile'
  | 'Notifications'
  | 'Platform'
  | 'Security'
  | 'Team';

type AdminNotification = {
  id: string;
  read?: boolean;
};

type NotificationsResponse = {
  success?: boolean;
  data?: AdminNotification[];
  count?: number;
  message?: string;
};

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    route: '/admin/dashboard',
  },
  {
    label: 'Properties',
    icon: Building2,
    route: '/admin/properties',
  },
  {
    label: 'Viewings',
    icon: CalendarDays,
    route: '/admin/viewings',
  },
  {
    label: 'Verification',
    icon: ShieldCheck,
    route: '/admin/verification',
  },
  {
    label: 'Landlords',
    icon: UserRound,
    route: '/admin/landlords',
  },
  {
    label: 'Marketers',
    icon: Megaphone,
    route: '/admin/marketers',
  },
  {
    label: 'Users',
    icon: UsersRound,
    route: '/admin/users',
  },
  {
    label: 'Notifications',
    icon: Bell,
    route: '/admin/notifications',
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    route: '/admin/settings',
  },
];

function getAdminDisplayName(admin: any) {
  const fullName = [
    admin?.firstName,
    admin?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || admin?.name || 'Admin';
}

function getAdminInitial(admin: any) {
  const name = getAdminDisplayName(admin);

  return name.charAt(0).toUpperCase() || 'A';
}

async function getAdminToken() {
  if (typeof window !== 'undefined') {
    const browserToken =
      window.localStorage?.getItem(
        'makazii_admin_token',
      );

    if (browserToken) {
      return browserToken;
    }
  }

  try {
    const SecureStore = await import(
      'expo-secure-store'
    );

    const token =
      await SecureStore.getItemAsync(
        'makazii_admin_token',
      );

    if (token) {
      return token;
    }
  } catch {
    // SecureStore is not available in every environment.
  }

  throw new Error(
    'Your administrator session has expired. Please sign in again.',
  );
}

async function adminFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = await getAdminToken();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  let result: unknown = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'message' in result &&
      typeof result.message === 'string'
        ? result.message
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return result;
}

export default function SettingsPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const {
    currentAdmin,
    isLoading: adminLoading,
    updateAdminProfile,
    changeAdminPassword,
    logout,
  } = useAdmin();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>('Profile');

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  useEffect(() => {
    if (!currentAdmin) return;

    const timer = setTimeout(() => {
      setFirstName(currentAdmin.firstName ?? '');
      setLastName(currentAdmin.lastName ?? '');
      setEmail(currentAdmin.email ?? '');
      setPhone(currentAdmin.phone ?? '');
    }, 0);

    return () => clearTimeout(timer);
  }, [currentAdmin]);

  useEffect(() => {
    let cancelled = false;

    const loadNotificationCount =
      async () => {
        try {
          setNotificationsLoading(true);

          const result =
            (await adminFetch(
              '/admin/notifications',
            )) as NotificationsResponse;

          if (cancelled) return;

          if (Array.isArray(result.data)) {
            const unread =
              result.data.filter(
                (notification) =>
                  notification.read !== true,
              ).length;

            setUnreadNotifications(
              unread,
            );
          } else if (
            typeof result.count === 'number'
          ) {
            setUnreadNotifications(
              result.count,
            );
          } else {
            setUnreadNotifications(0);
          }
        } catch {
          if (!cancelled) {
            setUnreadNotifications(0);
          }
        } finally {
          if (!cancelled) {
            setNotificationsLoading(false);
          }
        }
      };

    void loadNotificationCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const adminName = useMemo(
    () => getAdminDisplayName(currentAdmin),
    [currentAdmin],
  );

  const adminInitial = useMemo(
    () => getAdminInitial(currentAdmin),
    [currentAdmin],
  );

  const handleSaveProfile = async () => {
    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanEmail =
      email.trim();

    const cleanPhone =
      phone.trim();

    if (!cleanFirstName) {
      Alert.alert(
        'First name required',
        'Please enter your first name.',
      );
      return;
    }

    if (!cleanLastName) {
      Alert.alert(
        'Last name required',
        'Please enter your last name.',
      );
      return;
    }

    if (!cleanEmail) {
      Alert.alert(
        'Email required',
        'Please enter your email address.',
      );
      return;
    }

    if (
      !cleanEmail.includes('@') ||
      !cleanEmail.includes('.')
    ) {
      Alert.alert(
        'Invalid email',
        'Please enter a valid email address.',
      );
      return;
    }

    try {
      setProfileSaving(true);

      await updateAdminProfile({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
      });

      Alert.alert(
        'Profile updated',
        'Your administrator profile has been updated successfully.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to update profile',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert(
        'Current password required',
        'Enter your current administrator password.',
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        'Password too short',
        'Your new password must contain at least 8 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'The new password and confirmation password must match.',
      );
      return;
    }

    try {
      setPasswordSaving(true);

      await changeAdminPassword(
        currentPassword,
        newPassword,
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Password changed',
        'Your administrator password has been changed successfully.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to change password',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out of the administrator portal?',
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
              router.replace('/' as any);
              await logout();
            } catch (error) {
              Alert.alert(
                'Unable to sign out',
                error instanceof Error
                  ? error.message
                  : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const navigate = (route: string) => {
    setSidebarOpen(false);
    router.push(route as any);
  };

  if (adminLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top", "left", "right"]}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text style={styles.loadingText}>
          Loading administrator settings...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {!isDesktop && sidebarOpen ? (
        <View style={styles.mobileSidebarOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() =>
              setSidebarOpen(false)
            }
          />

          <View style={styles.mobileSidebar}>
            <View
              style={styles.mobileSidebarHeader}
            >
              <View>
                <Text
                  style={styles.mobileSidebarTitle}
                >
                  MAKAZII
                </Text>

                <Text
                  style={styles.mobileSidebarSubtitle}
                >
                  ADMIN PORTAL
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() =>
                  setSidebarOpen(false)
                }
              >
                <X
                  size={20}
                  color={COLORS.white}
                />
              </Pressable>
            </View>

            <SidebarContent
              activeRoute="/admin/settings"
              unreadNotifications={
                unreadNotifications
              }
              navigate={navigate}
            />
          </View>
        </View>
      ) : null}

      {isDesktop ? (
        <View style={styles.desktopSidebar}>
          <SidebarContent
            activeRoute="/admin/settings"
            unreadNotifications={
              unreadNotifications
            }
            navigate={navigate}
          />
        </View>
      ) : null}

      <View style={styles.main}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            {!isDesktop ? (
              <Pressable
                style={styles.menuButton}
                onPress={() =>
                  setSidebarOpen(true)
                }
              >
                <Menu
                  size={21}
                  color={COLORS.white}
                />
              </Pressable>
            ) : null}

            <View>
              <Text style={styles.breadcrumb}>
                ADMIN / SETTINGS
              </Text>

              <Text style={styles.topbarTitle}>
                Platform administration
              </Text>
            </View>
          </View>

          <View style={styles.topbarRight}>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                navigate(
                  '/admin/notifications',
                )
              }
            >
              <Bell
                size={19}
                color={COLORS.white}
              />

              {unreadNotifications > 0 ? (
                <View
                  style={styles.notificationBadge}
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {unreadNotifications > 99
                      ? '99+'
                      : unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <View style={styles.adminAvatar}>
              <Text
                style={styles.adminAvatarText}
              >
                {adminInitial}
              </Text>
            </View>

            {isDesktop ? (
              <View>
                <Text
                  style={styles.adminName}
                >
                  {adminName}
                </Text>

                <Text
                  style={styles.adminRole}
                >
                  {currentAdmin?.role ===
                  'ADMIN'
                    ? 'Platform administrator'
                    : currentAdmin?.role ||
                      'Administrator'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.content
          }
        >
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.eyebrow}>
                PLATFORM CONTROL
              </Text>

              <Text style={styles.pageTitle}>
                Settings
              </Text>

              <Text
                style={styles.pageSubtitle}
              >
                Manage your administrator account,
                security, notifications and access
                to Makazii operational areas.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.settingsLayout,
              !isDesktop &&
                styles.settingsLayoutMobile,
            ]}
          >
            <View
              style={[
                styles.settingsNavigation,
                !isDesktop &&
                  styles.settingsNavigationMobile,
              ]}
            >
              <Text
                style={styles.settingsNavTitle}
              >
                SETTINGS
              </Text>

              {(
                [
                  'Profile',
                  'Notifications',
                  'Platform',
                  'Security',
                  'Team',
                ] as SettingsSection[]
              ).map((section) => (
                <SettingsNavItem
                  key={section}
                  label={section}
                  active={
                    activeSection ===
                    section
                  }
                  onPress={() =>
                    setActiveSection(
                      section,
                    )
                  }
                />
              ))}
            </View>

            <View
              style={styles.settingsContent}
            >
              {activeSection ===
                'Profile' && (
                <ProfileSettings
                  firstName={firstName}
                  lastName={lastName}
                  email={email}
                  phone={phone}
                  setFirstName={
                    setFirstName
                  }
                  setLastName={
                    setLastName
                  }
                  setEmail={setEmail}
                  setPhone={setPhone}
                  saving={profileSaving}
                  onSave={
                    handleSaveProfile
                  }
                  admin={currentAdmin}
                />
              )}

              {activeSection ===
                'Notifications' && (
                <NotificationSettings
                  unreadNotifications={
                    unreadNotifications
                  }
                  loading={
                    notificationsLoading
                  }
                  onOpenNotifications={() =>
                    navigate(
                      '/admin/notifications',
                    )
                  }
                />
              )}

              {activeSection ===
                'Platform' && (
                <PlatformSettings />
              )}

              {activeSection ===
                'Security' && (
                <SecuritySettings
                  currentPassword={
                    currentPassword
                  }
                  newPassword={
                    newPassword
                  }
                  confirmPassword={
                    confirmPassword
                  }
                  setCurrentPassword={
                    setCurrentPassword
                  }
                  setNewPassword={
                    setNewPassword
                  }
                  setConfirmPassword={
                    setConfirmPassword
                  }
                  saving={
                    passwordSaving
                  }
                  onChangePassword={
                    handleChangePassword
                  }
                  onLogout={
                    handleLogout
                  }
                />
              )}

              {activeSection ===
                'Team' && (
                <TeamSettings
                  onMarketers={() =>
                    navigate(
                      '/admin/marketers',
                    )
                  }
                  onApplications={() =>
                    navigate(
                      '/admin/marketer-applications',
                    )
                  }
                />
              )}
            </View>
          </View>

          <View style={styles.accountNotice}>
            <ShieldCheck
              size={18}
              color={COLORS.lime}
            />

            <View
              style={
                styles.accountNoticeContent
              }
            >
              <Text
                style={
                  styles.accountNoticeTitle
                }
              >
                Backend-connected settings
              </Text>

              <Text
                style={
                  styles.accountNoticeText
                }
              >
                Administrator profile, password
                changes, authentication state and
                notifications use the Makazii
                backend. Platform-wide configuration
                that does not yet have a backend
                settings model is intentionally shown
                as unavailable rather than pretending
                changes were saved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SidebarContent({
  activeRoute,
  unreadNotifications,
  navigate,
}: {
  activeRoute: string;
  unreadNotifications: number;
  navigate: (route: string) => void;
}) {
  return (
    <View style={styles.sidebarContent}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>
          MAKAZII
        </Text>

        <Text style={styles.brandSubtitle}>
          ADMIN PORTAL
        </Text>

        <View style={styles.onlineRow}>
          <View style={styles.onlineDot} />

          <Text style={styles.onlineText}>
            PLATFORM ONLINE
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.sidebarScrollContent
        }
      >
        <View style={styles.navSection}>
          <Text style={styles.navLabel}>
            WORKSPACE
          </Text>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            const active =
              item.route === activeRoute;

            const isNotifications =
              item.route ===
              '/admin/notifications';

            return (
              <Pressable
                key={item.route}
                style={[
                  styles.navItem,
                  active &&
                    styles.navItemActive,
                ]}
                onPress={() =>
                  navigate(item.route)
                }
              >
                <Icon
                  size={18}
                  color={
                    active
                      ? COLORS.lime
                      : COLORS.sidebarText
                  }
                />

                <Text
                  style={[
                    styles.navItemText,
                    active &&
                      styles.navItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>

                {isNotifications &&
                unreadNotifications > 0 ? (
                  <View
                    style={
                      styles.navBadge
                    }
                  >
                    <Text
                      style={
                        styles.navBadgeText
                      }
                    >
                      {unreadNotifications >
                      99
                        ? '99+'
                        : unreadNotifications}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.sidebarBottom}>
        <View
          style={styles.adminMiniProfile}
        >
          <View style={styles.adminAvatar}>
            <Text
              style={styles.adminAvatarText}
            >
              A
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.adminName}>
              Administrator
            </Text>

            <Text style={styles.adminRole}>
              Makazii team
            </Text>
          </View>

          <MoreHorizontal
            size={18}
            color={COLORS.sidebarText}
          />
        </View>

        <Text style={styles.sidebarFooter}>
          MAKAZII · FIND YOUR PLACE
        </Text>
      </View>
    </View>
  );
}

function SettingsNavItem({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.settingsNavItem,
        active &&
          styles.settingsNavItemActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.settingsNavItemText,
          active &&
            styles.settingsNavItemTextActive,
        ]}
      >
        {label}
      </Text>

      <ChevronRight
        size={15}
        color={
          active
            ? COLORS.lime
            : COLORS.sidebarText
        }
      />
    </Pressable>
  );
}

function ProfileSettings({
  firstName,
  lastName,
  email,
  phone,
  setFirstName,
  setLastName,
  setEmail,
  setPhone,
  saving,
  onSave,
  admin,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setEmail: (value: string) => void;
  setPhone: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  admin: any;
}) {
  return (
    <View style={styles.settingsStack}>
      <SettingsCard
        title="Administrator profile"
        description="These details are stored in the Makazii administrator account."
        icon={UserRound}
      >
        <View style={styles.profileSummary}>
          <View style={styles.largeAvatar}>
            <Text
              style={styles.largeAvatarText}
            >
              {getAdminInitial(admin)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.profileSummaryName}
            >
              {getAdminDisplayName(admin)}
            </Text>

            <Text
              style={
                styles.profileSummaryEmail
              }
            >
              {admin?.email || 'No email'}
            </Text>

            <View
              style={
                styles.profileStatusRow
              }
            >
              <View
                style={
                  styles.profileStatusDot
                }
              />

              <Text
                style={
                  styles.profileStatusText
                }
              >
                {admin?.isActive === false
                  ? 'Inactive'
                  : 'Active administrator'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formGrid}>
          <View style={styles.formGridItem}>
            <SettingField
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
            />
          </View>

          <View style={styles.formGridItem}>
            <SettingField
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
            />
          </View>
        </View>

        <SettingField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@makazii.co.ke"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <SettingField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+254..."
          keyboardType="phone-pad"
        />

        <View style={styles.saveRow}>
          <Pressable
            style={[
              styles.primaryButton,
              saving &&
                styles.buttonDisabled,
            ]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={COLORS.background}
              />
            ) : (
              <Save
                size={16}
                color={COLORS.background}
              />
            )}

            <Text
              style={styles.primaryButtonText}
            >
              {saving
                ? 'Saving...'
                : 'Save profile'}
            </Text>
          </Pressable>
        </View>
      </SettingsCard>

      <View style={styles.infoNotice}>
        <ShieldCheck
          size={17}
          color={COLORS.lime}
        />

        <Text style={styles.infoNoticeText}>
          This profile is your authenticated
          administrator account. Changes are sent
          to the backend instead of being stored
          only on this screen.
        </Text>
      </View>
    </View>
  );
}

function NotificationSettings({
  unreadNotifications,
  loading,
  onOpenNotifications,
}: {
  unreadNotifications: number;
  loading: boolean;
  onOpenNotifications: () => void;
}) {
  return (
    <View style={styles.settingsStack}>
      <SettingsCard
        title="Notifications"
        description="Notifications are managed by the Makazii backend."
        icon={Bell}
      >
        <View style={styles.notificationSummary}>
          <View
            style={
              styles.notificationSummaryIcon
            }
          >
            <Bell
              size={22}
              color={COLORS.lime}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={
                styles.notificationSummaryTitle
              }
            >
              {loading
                ? 'Checking notifications...'
                : unreadNotifications === 0
                  ? 'You are all caught up'
                  : `${unreadNotifications} unread notification${
                      unreadNotifications ===
                      1
                        ? ''
                        : 's'
                    }`}
            </Text>

            <Text
              style={
                styles.notificationSummaryText
              }
            >
              View property, viewing,
              verification and other
              administrator notifications from
              the notifications workspace.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.outlineButton}
          onPress={onOpenNotifications}
        >
          <Bell
            size={16}
            color={COLORS.lime}
          />

          <Text
            style={
              styles.outlineButtonText
            }
          >
            Open notifications
          </Text>

          <ChevronRight
            size={16}
            color={COLORS.muted}
          />
        </Pressable>
      </SettingsCard>

      <View style={styles.infoNotice}>
        <Bell
          size={17}
          color={COLORS.lime}
        />

        <Text style={styles.infoNoticeText}>
          Notification delivery preferences such
          as email/SMS rules should only be added
          here once the backend has a persistent
          configuration for them.
        </Text>
      </View>
    </View>
  );
}

function PlatformSettings() {
  return (
    <View style={styles.settingsStack}>
      <SettingsCard
        title="Platform identity"
        description="Makazii platform identity is currently defined by the application."
        icon={SettingsIcon}
      >
        <ReadOnlyRow
          label="Platform name"
          value="MAKAZII"
        />

        <ReadOnlyRow
          label="Tagline"
          value="FIND YOUR PLACE"
        />

        <ReadOnlyRow
          label="Environment"
          value="Backend-connected"
        />
      </SettingsCard>

      <SettingsCard
        title="Configuration status"
        description="Platform-wide settings are intentionally not presented as editable until they have backend persistence."
        icon={ShieldCheck}
      >
        <View style={styles.unavailableBox}>
          <Lock
            size={18}
            color={COLORS.warning}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={styles.unavailableTitle}
            >
              Persistent platform settings are
              not implemented yet
            </Text>

            <Text
              style={styles.unavailableText}
            >
              Support contacts, viewing rules,
              automatic confirmation, property
              requirements and other global
              configuration need a backend
              settings model before they can
              safely be changed from this screen.
            </Text>
          </View>
        </View>
      </SettingsCard>
    </View>
  );
}

function SecuritySettings({
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  saving,
  onChangePassword,
  onLogout,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  saving: boolean;
  onChangePassword: () => void;
  onLogout: () => void;
}) {
  return (
    <View style={styles.settingsStack}>
      <SettingsCard
        title="Administrator password"
        description="Change the password used to authenticate this administrator account."
        icon={Lock}
      >
        <SettingField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
        />

        <SettingField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          secureTextEntry
        />

        <SettingField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
          secureTextEntry
        />

        <View style={styles.passwordHint}>
          <ShieldCheck
            size={15}
            color={COLORS.lime}
          />

          <Text
            style={styles.passwordHintText}
          >
            Use a strong password that is not
            shared with other Makazii accounts.
          </Text>
        </View>

        <View style={styles.saveRow}>
          <Pressable
            style={[
              styles.primaryButton,
              saving &&
                styles.buttonDisabled,
            ]}
            onPress={onChangePassword}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={COLORS.background}
              />
            ) : (
              <Lock
                size={16}
                color={COLORS.background}
              />
            )}

            <Text
              style={styles.primaryButtonText}
            >
              {saving
                ? 'Changing password...'
                : 'Change password'}
            </Text>
          </Pressable>
        </View>
      </SettingsCard>

      <SettingsCard
        title="Session"
        description="End the current administrator session on this device."
        icon={ShieldCheck}
      >
        <View style={styles.sessionRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={styles.sessionTitle}
            >
              Sign out of admin portal
            </Text>

            <Text
              style={styles.sessionText}
            >
              You will need to authenticate again
              before accessing administrator
              screens.
            </Text>
          </View>

          <Pressable
            style={styles.dangerButton}
            onPress={onLogout}
          >
            <Text
              style={styles.dangerButtonText}
            >
              Sign out
            </Text>
          </Pressable>
        </View>
      </SettingsCard>

      <View style={styles.infoNotice}>
        <Lock
          size={17}
          color={COLORS.lime}
        />

        <Text style={styles.infoNoticeText}>
          Password changes use the existing
          backend authentication workflow. Two-
          factor authentication and login-alert
          preferences should be added only after
          their backend security workflows exist.
        </Text>
      </View>
    </View>
  );
}

function TeamSettings({
  onMarketers,
  onApplications,
}: {
  onMarketers: () => void;
  onApplications: () => void;
}) {
  return (
    <View style={styles.settingsStack}>
      <SettingsCard
        title="Marketer operations"
        description="Manage active marketers and review applications through the dedicated backend workflows."
        icon={UsersRound}
      >
        <TeamActionRow
          icon={Megaphone}
          title="Marketers"
          description="View and manage approved marketer accounts."
          button="Manage marketers"
          onPress={onMarketers}
        />

        <TeamActionRow
          icon={FileText}
          title="Marketer applications"
          description="Review applications, identity verification and approval requirements."
          button="Review applications"
          onPress={onApplications}
        />
      </SettingsCard>

      <SettingsCard
        title="Administrator access"
        description="Administrator account management is intentionally restricted to the authentication and profile capabilities currently exposed by the backend."
        icon={ShieldCheck}
      >
        <View style={styles.unavailableBox}>
          <ShieldCheck
            size={18}
            color={COLORS.lime}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={styles.unavailableTitle}
            >
              No fake team members
            </Text>

            <Text
              style={styles.unavailableText}
            >
              This page does not create or display
              hardcoded administrator, operations or
              verification accounts. When multi-admin
              account management is added to the
              backend, it can be connected here.
            </Text>
          </View>
        </View>
      </SettingsCard>
    </View>
  );
}

function TeamActionRow({
  icon: Icon,
  title,
  description,
  button,
  onPress,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  button: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.teamActionRow}>
      <View style={styles.teamActionIcon}>
        <Icon
          size={18}
          color={COLORS.lime}
        />
      </View>

      <View style={styles.teamActionContent}>
        <Text style={styles.teamActionTitle}>
          {title}
        </Text>

        <Text
          style={styles.teamActionDescription}
        >
          {description}
        </Text>
      </View>

      <Pressable
        style={styles.outlineButtonSmall}
        onPress={onPress}
      >
        <Text
          style={
            styles.outlineButtonSmallText
          }
        >
          {button}
        </Text>

        <ChevronRight
          size={15}
          color={COLORS.lime}
        />
      </Pressable>
    </View>
  );
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.settingsCard}>
      <View
        style={styles.settingsCardHeader}
      >
        <View style={styles.settingsCardIcon}>
          <Icon
            size={18}
            color={COLORS.lime}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={styles.settingsCardTitle}
          >
            {title}
          </Text>

          <Text
            style={
              styles.settingsCardDescription
            }
          >
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.settingsCardBody}>
        {children}
      </View>
    </View>
  );
}

function SettingField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          COLORS.subtle
        }
        keyboardType={keyboardType}
        secureTextEntry={
          secureTextEntry
        }
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

function ReadOnlyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.readOnlyRow}>
      <Text style={styles.readOnlyLabel}>
        {label}
      </Text>

      <View style={styles.readOnlyValue}>
        <Text
          style={styles.readOnlyValueText}
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
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  desktopSidebar: {
    width: 245,
    backgroundColor: COLORS.sidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  mobileSidebarOverlay: {
    position: 'absolute',
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.72)',
  },

  mobileSidebar: {
    width: 285,
    height: '100%',
    backgroundColor: COLORS.sidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  mobileSidebarHeader: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  mobileSidebarTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },

  mobileSidebarSubtitle: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 3,
  },

  sidebarContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 24,
  },

  sidebarScrollContent: {
    paddingBottom: 20,
  },

  brandBlock: {
    paddingHorizontal: 10,
    paddingBottom: 25,
  },

  brand: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },

  brandSubtitle: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 7,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: COLORS.success,
  },

  onlineText: {
    color: COLORS.sidebarText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  navSection: {
    flex: 1,
  },

  navLabel: {
    color: COLORS.sidebarText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 10,
    marginBottom: 10,
  },

  navItem: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: '#1A211F',
  },

  navItemText: {
    flex: 1,
    color: COLORS.sidebarText,
    fontSize: 13,
    fontWeight: '600',
  },

  navItemTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },

  navBadge: {
    minWidth: 25,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 7,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBadgeText: {
    color: COLORS.background,
    fontSize: 9,
    fontWeight: '900',
  },

  sidebarBottom: {
    paddingTop: 15,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  adminMiniProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 18,
  },

  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminAvatarText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  adminName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  adminRole: {
    color: COLORS.sidebarText,
    fontSize: 10,
    marginTop: 2,
  },

  sidebarFooter: {
    color: COLORS.sidebarText,
    fontSize: 8,
    letterSpacing: 1,
    paddingHorizontal: 8,
  },

  main: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  topbar: {
    minHeight: 78,
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  breadcrumb: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  topbarTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },

  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: '900',
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 28,
    paddingBottom: 60,
  },

  pageHeader: {
    marginBottom: 25,
  },

  pageHeaderText: {
    flex: 1,
    maxWidth: 760,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  pageSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  settingsLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },

  settingsLayoutMobile: {
    flexDirection: 'column',
  },

  settingsNavigation: {
    width: 210,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 10,
  },

  settingsNavigationMobile: {
    width: '100%',
  },

  settingsNavTitle: {
    color: COLORS.sidebarText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    paddingHorizontal: 9,
    paddingVertical: 9,
  },

  settingsNavItem: {
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingsNavItemActive: {
    backgroundColor: '#1A211F',
  },

  settingsNavItemText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  settingsNavItemTextActive: {
    color: COLORS.lime,
    fontWeight: '900',
  },

  settingsContent: {
    flex: 1,
    width: '100%',
  },

  settingsStack: {
    gap: 15,
  },

  settingsCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    overflow: 'hidden',
  },

  settingsCardHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  settingsCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#20272A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsCardTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  settingsCardDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  settingsCardBody: {
    padding: 18,
  },

  profileSummary: {
    padding: 14,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  largeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeAvatarText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: '900',
  },

  profileSummaryName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  profileSummaryEmail: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },

  profileStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },

  profileStatusText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
  },

  formGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  formGridItem: {
    flex: 1,
  },

  field: {
    marginBottom: 16,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 7,
  },

  input: {
    minHeight: 45,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    color: COLORS.white,
    fontSize: 11,
  },

  saveRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },

  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  infoNotice: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34402C',
    backgroundColor: '#151B15',
    flexDirection: 'row',
    gap: 10,
  },

  infoNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  notificationSummary: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 14,
  },

  notificationSummaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#20272A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationSummaryTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  notificationSummaryText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  outlineButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  outlineButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  platformNotice: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
  },

  readOnlyRow: {
    marginBottom: 13,
  },

  readOnlyLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 7,
  },

  readOnlyValue: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#111618',
    justifyContent: 'center',
  },

  readOnlyValueText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  unavailableBox: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#554A2B',
    backgroundColor: '#1A1811',
    flexDirection: 'row',
    gap: 11,
  },

  unavailableTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  unavailableText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },

  passwordHint: {
    padding: 12,
    marginTop: -3,
    marginBottom: 13,
    borderRadius: 9,
    backgroundColor: '#151B15',
    borderWidth: 1,
    borderColor: '#34402C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  passwordHintText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 15,
  },

  sessionRow: {
    minHeight: 65,
    padding: 13,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sessionTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  sessionText: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  dangerButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.28)',
    backgroundColor:
      'rgba(255,107,107,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerButtonText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '900',
  },

  teamActionRow: {
    minHeight: 78,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  teamActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#20272A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  teamActionContent: {
    flex: 1,
  },

  teamActionTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  teamActionDescription: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  outlineButtonSmall: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  outlineButtonSmallText: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: '900',
  },

  accountNotice: {
    marginTop: 20,
    padding: 16,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#34402C',
    backgroundColor: '#151B15',
    flexDirection: 'row',
    gap: 11,
  },

  accountNoticeContent: {
    flex: 1,
  },

  accountNoticeTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  accountNoticeText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 4,
  },
});
