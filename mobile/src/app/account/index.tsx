import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  FileText,
  Flag,
  HelpCircle,
  Home,
  Info,
  LockKeyhole,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  mutedDark: '#657073',
  border: '#252C2E',

  green: '#62D39B',
  greenSoft: '#183128',

  blue: '#72B7FF',
  blueSoft: '#182A3B',

  orange: '#FFB45B',
  orangeSoft: '#342818',

  red: '#FF7070',
  redSoft: '#351D20',
};

function AccountRow({
  icon,
  title,
  description,
  onPress,
  accent = COLORS.lime,
  showArrow = true,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  accent?: string;
  showArrow?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: `${accent}18`,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>
          {description}
        </Text>
      </View>

      {showArrow && (
        <ChevronRight
          size={20}
          color={COLORS.mutedDark}
          strokeWidth={2}
        />
      )}
    </Pressable>
  );
}

function PortalCard({
  icon,
  title,
  description,
  onPress,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.portalCard,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.portalIcon,
          {
            backgroundColor: `${accent}18`,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.portalContent}>
        <View style={styles.portalTitleRow}>
          <Text style={styles.portalTitle}>
            {title}
          </Text>

          <View style={styles.loginBadge}>
            <LockKeyhole
              size={11}
              color={COLORS.muted}
              strokeWidth={2.5}
            />

            <Text style={styles.loginBadgeText}>
              LOGIN
            </Text>
          </View>
        </View>

        <Text style={styles.portalDescription}>
          {description}
        </Text>

        <View style={styles.portalAction}>
          <Text
            style={[
              styles.portalActionText,
              { color: accent },
            ]}
          >
            Sign in
          </Text>

          <ArrowRight
            size={16}
            color={accent}
            strokeWidth={2.5}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const openAdminLogin = () => {
    router.push('/admin/login');
  };

  const openMarketerLogin = () => {
    router.push('/marketer/login');
  };

  const openLandlordPortal = () => {
    router.push('/landlord');
  };

  const openFeedback = () => {
    router.push('/feedback');
  };

  const openHelp = () => {
    Alert.alert(
      'MAKAZII Help & Support',
      'Need help with a property, viewing, payment, or your account?\n\nContact the MAKAZII team and we will assist you.',
      [
        {
          text: 'Close',
          style: 'cancel',
        },
      ],
    );
  };

  const openReportProblem = () => {
    router.push('/feedback/concern');
  };

  const openContact = () => {
    Alert.alert(
      'Contact MAKAZII',
      'For assistance with your property search, viewing, or rental process, please contact the MAKAZII team.',
      [
        {
          text: 'Close',
          style: 'cancel',
        },
      ],
    );
  };

  const openAbout = () => {
    Alert.alert(
      'About MAKAZII',
      'MAKAZII helps people find homes, arrange property viewings, and move through the rental process with a coordinated experience.',
      [
        {
          text: 'Close',
          style: 'cancel',
        },
      ],
    );
  };

  const openTerms = () => {
    Alert.alert(
      'Terms & Conditions',
      'MAKAZII terms and conditions will be available here.',
      [
        {
          text: 'Close',
          style: 'cancel',
        },
      ],
    );
  };

  const openPrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'MAKAZII privacy information will be available here.',
      [
        {
          text: 'Close',
          style: 'cancel',
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              MAKAZII
            </Text>

            <Text style={styles.title}>
              Account
            </Text>

            <Text style={styles.subtitle}>
              Help, feedback and access to MAKAZII
              portals.
            </Text>
          </View>

          <View style={styles.profileIcon}>
            <UserRound
              size={24}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>
        </View>

        {/* Quick support card */}
        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <CircleHelp
              size={25}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>
              Need help?
            </Text>

            <Text style={styles.supportText}>
              Get assistance with properties,
              viewings, payments or anything else
              on MAKAZII.
            </Text>
          </View>

          <Pressable
            onPress={openHelp}
            style={({ pressed }) => [
              styles.helpButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.helpButtonText}>
              Help
            </Text>
          </Pressable>
        </View>

        {/* MAKAZII Team */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              MAKAZII Team
            </Text>

            <Text style={styles.sectionSubtitle}>
              Staff portals require authorized login
              credentials.
            </Text>
          </View>

          <ShieldCheck
            size={20}
            color={COLORS.mutedDark}
            strokeWidth={2}
          />
        </View>

        <View style={styles.portalList}>
          <PortalCard
            icon={
              <ShieldCheck
                size={24}
                color={COLORS.green}
                strokeWidth={2}
              />
            }
            title="Admin Portal"
            description="Manage properties, viewings, marketers, landlords, verification and the MAKAZII platform."
            accent={COLORS.green}
            onPress={openAdminLogin}
          />

          <PortalCard
            icon={
              <Megaphone
                size={24}
                color={COLORS.blue}
                strokeWidth={2}
              />
            }
            title="Marketer Portal"
            description="Manage assigned properties, viewing requests and marketer activities."
            accent={COLORS.blue}
            onPress={openMarketerLogin}
          />

          <PortalCard
            icon={
              <Home
                size={24}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            title="Landlord Portal"
            description="Access your landlord account, manage properties and track property activity."
            accent={COLORS.orange}
            onPress={openLandlordPortal}
          />
        </View>

        {/* Support */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Support
            </Text>

            <Text style={styles.sectionSubtitle}>
              We are here to help.
            </Text>
          </View>

          <MessageSquareText
            size={20}
            color={COLORS.mutedDark}
            strokeWidth={2}
          />
        </View>

        <View style={styles.listCard}>
          <AccountRow
            icon={
              <MessageSquareText
                size={21}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="Feedback"
            description="Share your experience and tell us how we can improve MAKAZII."
            onPress={openFeedback}
            accent={COLORS.lime}
          />

          <View style={styles.divider} />

          <AccountRow
            icon={
              <Flag
                size={21}
                color={COLORS.red}
                strokeWidth={2}
              />
            }
            title="Report a Problem"
            description="Report a problem with a property, viewing, payment or experience."
            onPress={openReportProblem}
            accent={COLORS.red}
          />

          <View style={styles.divider} />

          <AccountRow
            icon={
              <HelpCircle
                size={21}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            title="Help & Support"
            description="Get assistance with properties, viewings, payments or your account."
            onPress={openHelp}
            accent={COLORS.orange}
          />

          <View style={styles.divider} />

          <AccountRow
            icon={
              <MessageSquareText
                size={21}
                color={COLORS.green}
                strokeWidth={2}
              />
            }
            title="Contact MAKAZII"
            description="Contact the MAKAZII team when you need assistance."
            onPress={openContact}
            accent={COLORS.green}
          />
        </View>

        {/* Information */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Information
            </Text>

            <Text style={styles.sectionSubtitle}>
              Learn more about MAKAZII.
            </Text>
          </View>

          <Info
            size={20}
            color={COLORS.mutedDark}
            strokeWidth={2}
          />
        </View>

        <View style={styles.listCard}>
          <AccountRow
            icon={
              <Info
                size={21}
                color={COLORS.blue}
                strokeWidth={2}
              />
            }
            title="About MAKAZII"
            description="Learn about MAKAZII and how the platform works."
            onPress={openAbout}
            accent={COLORS.blue}
          />

          <View style={styles.divider} />

          <AccountRow
            icon={
              <FileText
                size={21}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            title="Terms & Conditions"
            description="Read the terms that apply when using MAKAZII."
            onPress={openTerms}
            accent={COLORS.orange}
          />

          <View style={styles.divider} />

          <AccountRow
            icon={
              <ShieldQuestion
                size={21}
                color={COLORS.green}
                strokeWidth={2}
              />
            }
            title="Privacy Policy"
            description="Learn how your information is handled."
            onPress={openPrivacy}
            accent={COLORS.green}
          />
        </View>

        {/* Staff access note */}
        <View style={styles.securityNote}>
          <LockKeyhole
            size={17}
            color={COLORS.muted}
            strokeWidth={2}
          />

          <Text style={styles.securityText}>
            Admin and marketer areas are protected by
            login credentials. Customers cannot access
            staff dashboards without authorization.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            MAKAZII
          </Text>

          <Text style={styles.footerText}>
            FIND YOUR PLACE
          </Text>
        </View>

        {/* Space for floating navigation */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 170,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },

  title: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    maxWidth: 270,
  },

  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 28,
  },

  supportIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#202A16',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  supportContent: {
    flex: 1,
    paddingRight: 8,
  },

  supportTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },

  supportText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  helpButton: {
    minWidth: 58,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },

  helpButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 11,
    marginTop: 3,
  },

  portalList: {
    gap: 10,
    marginBottom: 28,
  },

  portalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
    minHeight: 112,
  },

  portalIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  portalContent: {
    flex: 1,
  },

  portalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  portalTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },

  loginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  loginBadgeText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  portalDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },

  portalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  portalActionText: {
    fontSize: 11,
    fontWeight: '800',
  },

  listCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 28,
  },

  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rowContent: {
    flex: 1,
    paddingRight: 8,
  },

  rowTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  rowDescription: {
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 28,
  },

  securityText: {
    flex: 1,
    color: COLORS.mutedDark,
    fontSize: 10,
    lineHeight: 15,
    marginLeft: 9,
  },

  footer: {
    alignItems: 'center',
    marginTop: 4,
  },

  footerBrand: {
    color: COLORS.mutedDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerText: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 3,
  },

  bottomSpace: {
    height: 20,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
