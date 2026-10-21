import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
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
  FileCheck2,
  MapPin,
  Plus,
  RefreshCw,
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

export default function MarketerDashboardScreen() {
  const {
    currentMarketer,
    isAuthenticated,
    isLoading,
    refreshCurrentMarketer,
    myProperties,
    myViewings,
    isDashboardLoading,
    refreshMarketerDashboard,
  } = useMarketers();

  const [isRefreshing, setIsRefreshing] =
    React.useState(false);

  /*
   * Restore the marketer profile when this dashboard opens.
   * Login may save the token after the root provider has
   * already completed its initial session restoration.
   */
  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      const marketer = await refreshCurrentMarketer();

      if (cancelled || !marketer) {
        return;
      }

      await refreshMarketerDashboard();
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    refreshCurrentMarketer,
    refreshMarketerDashboard,
  ]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshMarketerDashboard();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshMarketerDashboard]);

  /*
   * Build a readable coverage label from the real
   * backend geography.
   */
  const coverageLabel = useMemo(() => {
    if (!currentMarketer?.coverage) {
      return 'No coverage assigned';
    }

    const county =
      currentMarketer.coverage.county?.name;

    const constituency =
      currentMarketer.coverage.constituency?.name;

    if (constituency && county) {
      return `${constituency}, ${county}`;
    }

    if (county) {
      return county;
    }

    if (constituency) {
      return constituency;
    }

    return 'Coverage assigned';
  }, [currentMarketer]);

  const coverageDescription = useMemo(() => {
    if (!currentMarketer?.coverage) {
      return 'Your coverage area has not been assigned yet.';
    }

    const wardCount =
      currentMarketer.coverage.wards?.length ?? 0;

    if (wardCount > 0) {
      return `${wardCount} ward${
        wardCount === 1 ? '' : 's'
      } assigned to your coverage area.`;
    }

    return 'Manage and market properties assigned to your area.';
  }, [currentMarketer]);

  /*
   * Backend property statistics.
   */
  const propertyStats = currentMarketer?.statistics
    ?.properties;

  const viewingStats = currentMarketer?.statistics
    ?.viewings;

  const totalProperties =
    propertyStats?.total ?? 0;

  const publishedProperties =
    propertyStats?.active ?? 0;

  const underReview =
    propertyStats?.pendingVerification ?? 0;

  const draftProperties =
    propertyStats?.draft ?? 0;

  const changesRequired =
    propertyStats?.changesRequired ?? 0;

  const rejectedProperties =
    propertyStats?.rejected ?? 0;

  const rentedProperties =
    propertyStats?.rented ?? 0;

  const inactiveProperties =
    propertyStats?.inactive ?? 0;

  const totalViewings =
    viewingStats?.total ?? 0;

  const assignedWards =
    currentMarketer?.coverage?.wards?.length ?? 0;

  /*
   * Real properties returned by:
   * GET /api/marketer/properties
   *
   * Backend already orders these by updatedAt DESC.
   */
  const recentProperties =
    myProperties.slice(0, 3);

  /*
   * Only APPROVED and RESCHEDULED viewings with a
   * future scheduledAt time belong in Upcoming Viewings.
   *
   * COMPLETED viewings are intentionally excluded.
   */
  const upcomingViewings = useMemo(() => {
    const now = Date.now();

    return myViewings
      .filter((viewing) => {
        if (
          viewing.status !== 'APPROVED' &&
          viewing.status !== 'RESCHEDULED'
        ) {
          return false;
        }

        if (!viewing.scheduledAt) {
          return false;
        }

        return (
          new Date(
            viewing.scheduledAt
          ).getTime() > now
        );
      })
      .sort(
        (a, b) =>
          new Date(
            a.scheduledAt ?? ''
          ).getTime() -
          new Date(
            b.scheduledAt ?? ''
          ).getTime()
      )
      .slice(0, 3);
  }, [myViewings]);

  const formatDate = useCallback(
    (value: string | null) => {
      if (!value) {
        return 'Date not scheduled';
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return 'Date not scheduled';
      }

      return new Intl.DateTimeFormat(
        'en-KE',
        {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Africa/Nairobi',
        }
      ).format(date);
    },
    []
  );

  /*
   * Account status comes directly from the backend.
   */
  const accountStatus =
    currentMarketer?.user?.accountStatus ??
    (currentMarketer?.user?.isActive
      ? 'ACTIVE'
      : 'INACTIVE');

  const isActive =
    currentMarketer?.user?.isActive === true;

  /*
   * Current authenticated marketer's name.
   */
  const firstName =
    currentMarketer?.user?.firstName?.trim() ||
    'Marketer';

  /*
   * Loading state.
   */
  if (
    isLoading &&
    !currentMarketer
  ) {
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

  /*
   * No authenticated marketer.
   *
   * This should normally be handled by the marketer
   * authentication flow, but keeping this state here
   * prevents the dashboard from showing fake data.
   */
  if (
    !currentMarketer ||
    !isAuthenticated
  ) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <UserRound
            size={28}
            color={COLORS.lime}
            strokeWidth={2}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Marketer account required
        </Text>

        <Text style={styles.emptyDescription}>
          Sign in with your marketer account to access
          the MAKAZII marketer dashboard.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace('/marketer/login')}
        >
          <Text style={styles.emptyButtonText}>
            Go to login
          </Text>

          <ArrowRight
            size={17}
            color={COLORS.background}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.lime}
            colors={[COLORS.lime]}
            progressBackgroundColor={COLORS.card}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>
              MAKAZII
            </Text>

            <Text style={styles.portalLabel}>
              MARKETER PORTAL
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
              ]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                size={18}
                color={COLORS.muted}
                strokeWidth={2}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/marketer/profile')
              }
            >
              <UserRound
                size={20}
                color={COLORS.white}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.eyebrow}>
            MARKETER DASHBOARD
          </Text>

          <Text style={styles.greetingTitle}>
            Good day, {firstName}.
          </Text>

          <Text style={styles.greetingSubtitle}>
            Manage your properties, viewings and
            listings from one place.
          </Text>
        </View>

        {/* Coverage / Status card */}
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

              <Text
                style={styles.heroArea}
                numberOfLines={2}
              >
                {coverageLabel}
              </Text>

              <Text style={styles.heroDescription}>
                {coverageDescription}
              </Text>
            </View>

            <View
              style={[
                styles.activeBadge,
                !isActive &&
                  styles.inactiveBadge,
              ]}
            >
              <View
                style={[
                  styles.activeDot,
                  !isActive &&
                    styles.inactiveDot,
                ]}
              />

              <Text
                style={[
                  styles.activeBadgeText,
                  !isActive &&
                    styles.inactiveBadgeText,
                ]}
              >
                {accountStatus}
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
            value={totalProperties}
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
            value={totalViewings}
            helper="Total viewings"
            iconBackground={COLORS.blueSoft}
          />

          <StatCard
            icon={
              <MapPin
                size={20}
                color={COLORS.orange}
                strokeWidth={2}
              />
            }
            label="Coverage"
            value={assignedWards}
            helper={
              assignedWards === 1
                ? 'Assigned ward'
                : 'Assigned wards'
            }
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
            helper="Active listings"
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
              router.push(
                '/marketer/properties/add'
              )
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
              router.push(
                '/marketer/properties'
              )
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
            description="Check customer visits"
            onPress={() =>
              router.push(
                '/marketer/viewings'
              )
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
              router.push(
                '/marketer/verification'
              )
            }
          />

          <ActionCard
            icon={
              <FileCheck2
                size={21}
                color={COLORS.lime}
                strokeWidth={2}
              />
            }
            title="My Application"
            description="Review your submitted application"
            onPress={() =>
              router.push('/marketer/application')
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

        {/* Additional property status */}
        <View style={styles.statusSummaryCard}>
          <StatusSummaryRow
            label="Changes required"
            value={changesRequired}
            color={COLORS.orange}
          />

          <View style={styles.statusSummaryDivider} />

          <StatusSummaryRow
            label="Rented"
            value={rentedProperties}
            color={COLORS.green}
          />

          <View style={styles.statusSummaryDivider} />

          <StatusSummaryRow
            label="Inactive"
            value={inactiveProperties}
            color={COLORS.muted}
          />

          <View style={styles.statusSummaryDivider} />

          <StatusSummaryRow
            label="Rejected"
            value={rejectedProperties}
            color={COLORS.red}
          />
        </View>

        {/* Recent properties */}
        <View style={styles.sectionHeaderWithAction}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent properties
            </Text>

            <Text style={styles.sectionSubtitle}>
              Manage your latest listings
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push(
                '/marketer/properties'
              )
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
          {isDashboardLoading &&
          recentProperties.length === 0 ? (
            <View style={styles.loadingList}>
              <ActivityIndicator
                size="small"
                color={COLORS.lime}
              />

              <Text style={styles.loadingListText}>
                Loading your properties...
              </Text>
            </View>
          ) : recentProperties.length === 0 ? (
            <View style={styles.emptyList}>
              <View style={styles.emptyListIcon}>
                <Building2
                  size={20}
                  color={COLORS.muted}
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.emptyListTitle}>
                No properties yet
              </Text>

              <Text style={styles.emptyListDescription}>
                Properties you create will appear here
                after they are saved to your marketer account.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.listActionButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push(
                    '/marketer/properties/add'
                  )
                }
              >
                <Text style={styles.listActionText}>
                  Add property
                </Text>

                <Plus
                  size={15}
                  color={COLORS.lime}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          ) : (
            <View>
              {recentProperties.map(
                (property, index) => (
                  <React.Fragment
                    key={property.id}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.propertyListRow,
                        pressed &&
                          styles.propertyListRowPressed,
                      ]}
                      onPress={() =>
                        router.push(
                          `/marketer/properties/${property.id}`
                        )
                      }
                    >
                      <View
                        style={styles.propertyListIcon}
                      >
                        <Building2
                          size={19}
                          color={COLORS.lime}
                          strokeWidth={2}
                        />
                      </View>

                      <View
                        style={styles.propertyListContent}
                      >
                        <Text
                          style={styles.propertyListTitle}
                          numberOfLines={1}
                        >
                          {property.title}
                        </Text>

                        <Text
                          style={styles.propertyListLocation}
                          numberOfLines={1}
                        >
                          {property.countyRelation?.name ??
                            property.county ??
                            'Location not specified'}
                        </Text>

                        <Text
                          style={styles.propertyListMeta}
                        >
                          {property.status.replace(
                            /_/g,
                            ' '
                          )}
                        </Text>
                      </View>

                      <ChevronRight
                        size={18}
                        color={COLORS.muted}
                        strokeWidth={2}
                      />
                    </Pressable>

                    {index <
                      recentProperties.length - 1 && (
                      <View
                        style={
                          styles.propertyListDivider
                        }
                      />
                    )}
                  </React.Fragment>
                )
              )}
            </View>
          )}
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
              router.push(
                '/marketer/viewings'
              )
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
          {isDashboardLoading &&
          upcomingViewings.length === 0 ? (
            <View style={styles.loadingList}>
              <ActivityIndicator
                size="small"
                color={COLORS.blue}
              />

              <Text style={styles.loadingListText}>
                Loading your viewing schedule...
              </Text>
            </View>
          ) : upcomingViewings.length === 0 ? (
            <View style={styles.emptyList}>
              <View
                style={[
                  styles.emptyListIcon,
                  {
                    backgroundColor:
                      COLORS.blueSoft,
                  },
                ]}
              >
                <Clock3
                  size={20}
                  color={COLORS.blue}
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.emptyListTitle}>
                No upcoming viewings
              </Text>

              <Text style={styles.emptyListDescription}>
                Approved and rescheduled customer visits
                with a future appointment time will appear
                here.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.listActionButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push(
                    '/marketer/viewings'
                  )
                }
              >
                <Text style={styles.listActionText}>
                  Open viewings
                </Text>

                <ArrowRight
                  size={15}
                  color={COLORS.lime}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          ) : (
            <View>
              {upcomingViewings.map(
                (viewing, index) => (
                  <React.Fragment
                    key={viewing.id}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.viewingListRow,
                        pressed &&
                          styles.viewingListRowPressed,
                      ]}
                      onPress={() =>
                        router.push(
                          '/marketer/viewings'
                        )
                      }
                    >
                      <View
                        style={styles.viewingListIcon}
                      >
                        <CalendarDays
                          size={18}
                          color={COLORS.blue}
                          strokeWidth={2}
                        />
                      </View>

                      <View
                        style={styles.viewingListContent}
                      >
                        <Text
                          style={styles.viewingListTitle}
                          numberOfLines={1}
                        >
                          {viewing.property?.title ??
                            'Property viewing'}
                        </Text>

                        <Text
                          style={styles.viewingListDate}
                        >
                          {formatDate(
                            viewing.scheduledAt
                          )}
                        </Text>

                        <Text
                          style={styles.viewingListCustomer}
                          numberOfLines={1}
                        >
                          {viewing.renter
                            ? `${viewing.renter.firstName} ${viewing.renter.lastName}`
                            : 'Customer details available'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.viewingStatusBadge,
                          viewing.status ===
                            'RESCHEDULED' &&
                            styles.viewingRescheduledBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.viewingStatusText,
                            viewing.status ===
                              'RESCHEDULED' &&
                              styles.viewingRescheduledText,
                          ]}
                        >
                          {viewing.status ===
                          'RESCHEDULED'
                            ? 'RESCHEDULED'
                            : 'APPROVED'}
                        </Text>
                      </View>
                    </Pressable>

                    {index <
                      upcomingViewings.length - 1 && (
                      <View
                        style={
                          styles.propertyListDivider
                        }
                      />
                    )}
                  </React.Fragment>
                )
              )}
            </View>
          )}
        </View>

        {/* Verification reminder */}
        <Pressable
          style={({ pressed }) => [
            styles.verificationCard,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push(
              '/marketer/verification'
            )
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

            <Text
              style={styles.verificationDescription}
            >
              Make sure property information and photos
              are accurate before submitting a listing
              for approval.
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
          {
            backgroundColor:
              iconBackground,
          },
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
        pressed &&
          styles.actionCardPressed,
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
          {
            backgroundColor:
              background,
          },
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

function StatusSummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statusSummaryRow}>
      <View style={styles.statusSummaryLabelBlock}>
        <View
          style={[
            styles.statusSummaryDot,
            {
              backgroundColor: color,
            },
          ]}
        />

        <Text style={styles.statusSummaryLabel}>
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.statusSummaryValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>
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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202B11',
    marginBottom: 18,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 9,
    maxWidth: 340,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
  },

  emptyButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
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

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
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

  inactiveBadge: {
    backgroundColor: COLORS.redSoft,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 5,
  },

  inactiveDot: {
    backgroundColor: COLORS.red,
  },

  activeBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
  },

  inactiveBadgeText: {
    color: COLORS.red,
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

  statusSummaryCard: {
    marginTop: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusSummaryRow: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusSummaryLabelBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusSummaryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 9,
  },

  statusSummaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  statusSummaryValue: {
    fontSize: 14,
    fontWeight: '800',
  },

  statusSummaryDivider: {
    height: 1,
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

  emptyList: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 26,
  },

  emptyListIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
    marginBottom: 11,
  },

  emptyListTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  emptyListDescription: {
    maxWidth: 310,
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },

  listActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  listActionText: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '700',
  },

  loadingList: {
    minHeight: 145,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  loadingListText: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  propertyListRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  propertyListRowPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.cardSoft,
  },

  propertyListIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202B11',
    marginRight: 12,
  },

  propertyListContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  propertyListTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  propertyListLocation: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
  },

  propertyListMeta: {
    marginTop: 4,
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  propertyListDivider: {
    height: 1,
    marginLeft: 69,
    backgroundColor: COLORS.border,
  },

  viewingListRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  viewingListRowPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.cardSoft,
  },

  viewingListIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blueSoft,
    marginRight: 12,
  },

  viewingListContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  viewingListTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  viewingListDate: {
    marginTop: 4,
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: '600',
  },

  viewingListCustomer: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
  },

  viewingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.greenSoft,
  },

  viewingRescheduledBadge: {
    backgroundColor: COLORS.orangeSoft,
  },

  viewingStatusText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  viewingRescheduledText: {
    color: COLORS.orange,
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