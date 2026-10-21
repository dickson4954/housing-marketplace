import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  MapPin,
  Plus,
  TrendingUp,
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
  blue: '#6FA8FF',
  blueSoft: '#18283D',
  red: '#FF6B6B',
  redSoft: '#381C1C',
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
  iconBackground: string;
};

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
};

type PropertyRowProps = {
  title: string;
  location: string;
  status: string;
  statusColor: string;
  statusBackground: string;
};

type ViewingRowProps = {
  time: string;
  date: string;
  property: string;
  customer: string;
};

export default function MarketerDashboardScreen() {
  const { marketers } = useMarketers();

  const marketer = useMemo(() => {
    return (
      marketers.find(
        (item) => item.status === 'Active' && item.portalAccess,
      ) ?? marketers[0]
    );
  }, [marketers]);

  if (!marketer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />
        <Text style={styles.loadingText}>
          Loading marketer portal...
        </Text>
      </View>
    );
  }

  const publishedProperties = Math.max(marketer.properties - 3, 0);
  const underReview = Math.min(3, marketer.properties);
  const draftProperties = Math.min(2, marketer.properties);

  const propertyStatusData: PropertyRowProps[] = [
    {
      title: 'Kilimani Bedsitter',
      location: 'Kilimani, Nairobi',
      status: 'Published',
      statusColor: COLORS.green,
      statusBackground: COLORS.greenSoft,
    },
    {
      title: '1 Bedroom Apartment',
      location: 'Kileleshwa, Nairobi',
      status: 'Under review',
      statusColor: COLORS.orange,
      statusBackground: COLORS.orangeSoft,
    },
    {
      title: 'Modern Bedsitter',
      location: 'Roysambu, Nairobi',
      status: 'Draft',
      statusColor: COLORS.blue,
      statusBackground: COLORS.blueSoft,
    },
  ];

  const upcomingViewings: ViewingRowProps[] = [
    {
      time: '10:30 AM',
      date: 'Today',
      property: 'Kilimani Bedsitter',
      customer: 'James Mwangi',
    },
    {
      time: '2:00 PM',
      date: 'Tomorrow',
      property: '1 Bedroom Apartment',
      customer: 'Mary Wanjiku',
    },
    {
      time: '12:00 PM',
      date: 'Saturday',
      property: 'Modern Bedsitter',
      customer: 'Brian Otieno',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>MAKAZII</Text>
            <Text style={styles.portalLabel}>
              MARKETER PORTAL
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/marketer/profile')}
          >
            <UserRound
              size={20}
              color={COLORS.white}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.eyebrow}>MARKETER DASHBOARD</Text>

          <Text style={styles.greetingTitle}>
            Good day, {marketer.name.split(' ')[0]}.
          </Text>

          <Text style={styles.greetingSubtitle}>
            Manage your properties, viewings and listings
            from one place.
          </Text>
        </View>

        {/* Area / Status card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <MapPin
                size={22}
                color={COLORS.lime}
                strokeWidth={2}
              />
            </View>

            <View style={styles.heroTextBlock}>
              <Text style={styles.heroLabel}>
                YOUR COVERAGE AREA
              </Text>

              <Text style={styles.heroArea}>
                {marketer.area}
              </Text>

              <Text style={styles.heroDescription}>
                Manage and market properties assigned to your
                area.
              </Text>
            </View>

            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>
                {marketer.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Overview */}
        <SectionHeader
          title="Overview"
          subtitle="Your current performance"
        />

        <View style={styles.statsGrid}>
          <StatCard
            icon={
              <Building2
                size={20}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            label="Properties"
            value={marketer.properties}
            helper="Total assigned"
            iconBackground="#253016"
          />

          <StatCard
            icon={
              <CalendarDays
                size={20}
                color={COLORS.blue}
                strokeWidth={2}
              />
            }
            label="Viewings"
            value={marketer.viewings}
            helper="This month"
            iconBackground={COLORS.blueSoft}
          />

          <StatCard
            icon={
              <UserRound
                size={20}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            label="Landlords"
            value={marketer.landlords}
            helper="Your network"
            iconBackground={COLORS.orangeSoft}
          />

          <StatCard
            icon={
              <TrendingUp
                size={20}
                color={COLORS.green}
                strokeWidth={2}
              />
            }
            label="Active"
            value={publishedProperties}
            helper="Published listings"
            iconBackground={COLORS.greenSoft}
          />
        </View>

        {/* Quick actions */}
        <SectionHeader
          title="Quick actions"
          subtitle="Get things done faster"
        />

        <View style={styles.actionsGrid}>
          <ActionCard
            icon={
              <Plus
                size={22}
                color={COLORS.background}
                strokeWidth={2.5}
              />
            }
            title="Add Property"
            description="Create a new listing"
            onPress={() =>
              router.push('/marketer/properties/add')
            }
          />

          <ActionCard
            icon={
              <Building2
                size={21}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="My Properties"
            description="Manage your listings"
            onPress={() =>
              router.push('/marketer/properties')
            }
          />

          <ActionCard
            icon={
              <CalendarDays
                size={21}
                color={COLORS.blue}
                strokeWidth={2}
              />
            }
            title="Viewings"
            description="Check upcoming visits"
            onPress={() =>
              router.push('/marketer/viewings')
            }
          />

          <ActionCard
            icon={
              <FileCheck2
                size={21}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            title="Verification"
            description="Track submissions"
            onPress={() =>
              router.push('/marketer/verification')
            }
          />
        </View>

        {/* Property status */}
        <SectionHeader
          title="Property status"
          subtitle="Your listing pipeline"
        />

        <View style={styles.pipelineCard}>
          <PipelineItem
            label="Published"
            value={publishedProperties}
            color={COLORS.green}
            background={COLORS.greenSoft}
          />

          <View style={styles.pipelineDivider} />

          <PipelineItem
            label="Under review"
            value={underReview}
            color={COLORS.orange}
            background={COLORS.orangeSoft}
          />

          <View style={styles.pipelineDivider} />

          <PipelineItem
            label="Drafts"
            value={draftProperties}
            color={COLORS.blue}
            background={COLORS.blueSoft}
          />
        </View>

        {/* Recent properties */}
        <View style={styles.sectionHeaderWithAction}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent properties
            </Text>
            <Text style={styles.sectionSubtitle}>
              Your latest listings
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push('/marketer/properties')
            }
          >
            <Text style={styles.viewAllText}>
              View all
            </Text>

            <ArrowRight
              size={15}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {propertyStatusData.map((property, index) => (
            <React.Fragment key={`${property.title}-${index}`}>
              <PropertyRow {...property} />

              {index < propertyStatusData.length - 1 && (
                <View style={styles.listDivider} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Upcoming viewings */}
        <View style={styles.sectionHeaderWithAction}>
          <View>
            <Text style={styles.sectionTitle}>
              Upcoming viewings
            </Text>
            <Text style={styles.sectionSubtitle}>
              Scheduled customer visits
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push('/marketer/viewings')
            }
          >
            <Text style={styles.viewAllText}>
              View all
            </Text>

            <ArrowRight
              size={15}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        <View style={styles.listCard}>
          {upcomingViewings.map((viewing, index) => (
            <React.Fragment
              key={`${viewing.property}-${viewing.time}`}
            >
              <ViewingRow {...viewing} />

              {index < upcomingViewings.length - 1 && (
                <View style={styles.listDivider} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Verification reminder */}
        <Pressable
          style={({ pressed }) => [
            styles.verificationCard,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push('/marketer/verification')
          }
        >
          <View style={styles.verificationIcon}>
            <FileCheck2
              size={21}
              color={COLORS.orange}
              strokeWidth={2}
            />
          </View>

          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>
              Keep your listings verified
            </Text>

            <Text style={styles.verificationDescription}>
              Make sure property information and photos are
              accurate before submitting a listing for
              approval.
            </Text>
          </View>

          <ChevronRight
            size={20}
            color={COLORS.muted}
            strokeWidth={2}
          />
        </Pressable>

        {/* Footer */}
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
    </View>
  );
}

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

function StatCard({
  icon,
  label,
  value,
  helper,
  iconBackground,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          { backgroundColor: iconBackground },
        ]}
      >
        {icon}
      </View>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statHelper}>
        {helper}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onPress,
}: ActionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.actionTopRow}>
        <View style={styles.actionIcon}>
          {icon}
        </View>

        <ChevronRight
          size={18}
          color={COLORS.muted}
          strokeWidth={2}
        />
      </View>

      <Text style={styles.actionTitle}>
        {title}
      </Text>

      <Text style={styles.actionDescription}>
        {description}
      </Text>
    </Pressable>
  );
}

function PipelineItem({
  label,
  value,
  color,
  background,
}: {
  label: string;
  value: number;
  color: string;
  background: string;
}) {
  return (
    <View style={styles.pipelineItem}>
      <View
        style={[
          styles.pipelineIcon,
          { backgroundColor: background },
        ]}
      >
        <CheckCircle2
          size={17}
          color={color}
          strokeWidth={2}
        />
      </View>

      <Text style={styles.pipelineValue}>
        {value}
      </Text>

      <Text style={styles.pipelineLabel}>
        {label}
      </Text>
    </View>
  );
}

function PropertyRow({
  title,
  location,
  status,
  statusColor,
  statusBackground,
}: PropertyRowProps) {
  return (
    <View style={styles.propertyRow}>
      <View style={styles.propertyIcon}>
        <Building2
          size={19}
          color={COLORS.lime}
          strokeWidth={2}
        />
      </View>

      <View style={styles.propertyInfo}>
        <Text
          style={styles.propertyTitle}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin
            size={12}
            color={COLORS.muted}
            strokeWidth={2}
          />

          <Text
            style={styles.locationText}
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusBackground },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: statusColor },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}

function ViewingRow({
  time,
  date,
  property,
  customer,
}: ViewingRowProps) {
  return (
    <View style={styles.viewingRow}>
      <View style={styles.timeBlock}>
        <View style={styles.timeIcon}>
          <Clock3
            size={17}
            color={COLORS.blue}
            strokeWidth={2}
          />
        </View>

        <Text style={styles.timeText}>
          {time}
        </Text>
      </View>

      <View style={styles.viewingInfo}>
        <Text
          style={styles.viewingProperty}
          numberOfLines={1}
        >
          {property}
        </Text>

        <Text
          style={styles.viewingCustomer}
          numberOfLines={1}
        >
          {customer}
        </Text>
      </View>

      <View style={styles.dateBadge}>
        <Text style={styles.dateText}>
          {date}
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

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '500',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  brandBlock: {
    flex: 1,
  },

  brand: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  portalLabel: {
    marginTop: 3,
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pressed: {
    opacity: 0.72,
  },

  greetingSection: {
    marginBottom: 22,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.7,
    marginBottom: 8,
  },

  greetingTitle: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  greetingSubtitle: {
    marginTop: 8,
    maxWidth: 360,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },

  heroCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202B11',
    marginRight: 13,
  },

  heroTextBlock: {
    flex: 1,
    paddingRight: 8,
  },

  heroLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  heroArea: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '700',
  },

  heroDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.greenSoft,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 5,
  },

  activeBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
  },

  sectionHeader: {
    marginBottom: 13,
  },

  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 13,
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
    fontSize: 12,
    lineHeight: 17,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48.2%',
    minHeight: 151,
    padding: 15,
    marginBottom: 10,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  statValue: {
    marginTop: 4,
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  statHelper: {
    marginTop: 2,
    color: '#737D80',
    fontSize: 10,
    fontWeight: '500',
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionCard: {
    width: '48.2%',
    minHeight: 144,
    padding: 15,
    marginBottom: 10,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  actionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  actionTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  actionDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  pipelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pipelineItem: {
    flex: 1,
    alignItems: 'center',
  },

  pipelineIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  pipelineValue: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
  },

  pipelineLabel: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
  },

  pipelineDivider: {
    width: 1,
    height: 65,
    backgroundColor: COLORS.border,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
  },

  viewAllText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '700',
  },

  listCard: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  listDivider: {
    height: 1,
    marginLeft: 66,
    backgroundColor: COLORS.border,
  },

  propertyRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  propertyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202B11',
    marginRight: 11,
  },

  propertyInfo: {
    flex: 1,
    minWidth: 0,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 4,
  },

  locationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
  },

  statusBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },

  viewingRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  timeBlock: {
    width: 72,
    alignItems: 'center',
    marginRight: 10,
  },

  timeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blueSoft,
    marginBottom: 5,
  },

  timeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },

  viewingInfo: {
    flex: 1,
    minWidth: 0,
  },

  viewingProperty: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  viewingCustomer: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10,
  },

  dateBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  dateText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '600',
  },

  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  verificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orangeSoft,
    marginRight: 12,
  },

  verificationContent: {
    flex: 1,
    paddingRight: 8,
  },

  verificationTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  verificationDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 42,
    paddingBottom: 10,
  },

  footerLine: {
    width: 50,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.lime,
    marginBottom: 15,
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
