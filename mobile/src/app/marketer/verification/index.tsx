import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  orange: '#F5B94C',
  red: '#FF6B6B',
  green: '#72D572',
  blue: '#65B8FF',
};

type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'CHANGES_REQUIRED'
  | 'ACTIVE'
  | 'RENTED'
  | 'INACTIVE'
  | 'REJECTED';

type PropertyPurpose =
  | 'LONG_STAY'
  | 'SHORT_STAY';

type BackendProperty = {
  id: string;
  title: string;
  purpose: PropertyPurpose;
  status: PropertyStatus;
  available: boolean;
  verified: boolean;
  county?: string | null;
  town?: string | null;
  area?: string | null;
  countyRelation?: {
    id: string;
    name: string;
  } | null;
  constituency?: {
    id: string;
    name: string;
  } | null;
  ward?: {
    id: string;
    name: string;
  } | null;
  place?: {
    id: string;
    name: string;
  } | null;
  images?: {
    id: string;
    url: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }[];
};

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type FilterKey =
  | 'all'
  | 'pending'
  | 'approved'
  | 'changes'
  | 'rejected';

function formatStatus(status?: string | null) {
  if (!status) {
    return 'Unknown';
  }

  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getStatusConfig(status: PropertyStatus) {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Approved',
        color: COLORS.green,
        background:
          'rgba(114, 213, 114, 0.12)',
        icon: CheckCircle2,
      };

    case 'CHANGES_REQUIRED':
      return {
        label: 'Changes Required',
        color: COLORS.orange,
        background:
          'rgba(245, 185, 76, 0.12)',
        icon: AlertCircle,
      };

    case 'REJECTED':
      return {
        label: 'Rejected',
        color: COLORS.red,
        background:
          'rgba(255, 107, 107, 0.12)',
        icon: XCircle,
      };

    case 'PENDING_VERIFICATION':
      return {
        label: 'Pending Review',
        color: COLORS.blue,
        background:
          'rgba(101, 184, 255, 0.12)',
        icon: Clock3,
      };

    case 'DRAFT':
      return {
        label: 'Draft',
        color: COLORS.muted,
        background:
          'rgba(156, 165, 167, 0.10)',
        icon: FileCheck2,
      };

    default:
      return {
        label: formatStatus(status),
        color: COLORS.muted,
        background:
          'rgba(156, 165, 167, 0.10)',
        icon: FileCheck2,
      };
  }
}

function getVerificationCategory(
  status: PropertyStatus,
): FilterKey {
  switch (status) {
    case 'PENDING_VERIFICATION':
      return 'pending';

    case 'ACTIVE':
      return 'approved';

    case 'CHANGES_REQUIRED':
      return 'changes';

    case 'REJECTED':
      return 'rejected';

    default:
      return 'all';
  }
}

function getPropertyLocation(
  property: BackendProperty,
) {
  if (property.area && property.town) {
    return `${property.area}, ${property.town}`;
  }

  if (property.area) {
    return property.area;
  }

  if (property.town) {
    return property.town;
  }

  if (property.ward?.name) {
    return property.ward.name;
  }

  if (property.county) {
    return property.county;
  }

  if (property.countyRelation?.name) {
    return property.countyRelation.name;
  }

  return 'MAKAZII property';
}

function getPurposeLabel(
  purpose: PropertyPurpose,
) {
  return purpose === 'SHORT_STAY'
    ? 'Short stay'
    : 'Long stay';
}

async function getMarketerToken() {
  const keys = [
    'marketerToken',
    'marketer_token',
    'accessToken',
    'token',
  ];

  for (const key of keys) {
    const token =
      await SecureStore.getItemAsync(key);

    if (token) {
      return token;
    }
  }

  return null;
}

async function fetchMarketerProperties(): Promise<
  BackendProperty[]
> {
  const token = await getMarketerToken();

  if (!token) {
    throw new Error(
      'Your marketer session has expired. Please sign in again.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/marketer/properties`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  let result: ApiResult<BackendProperty[]> =
    {
      success: false,
    };

  try {
    result = await response.json();
  } catch {
    result = {
      success: false,
      message:
        'The server returned an invalid response.',
    };
  }

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error(
      'Your marketer session has expired. Please sign in again.',
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        'Unable to load your properties.',
    );
  }

  return Array.isArray(result.data)
    ? result.data
    : [];
}

export default function MarketerVerificationScreen() {
  const router = useRouter();

  const [properties, setProperties] =
    useState<BackendProperty[]>([]);

  const [filter, setFilter] =
    useState<FilterKey>('all');

  const [isLoading, setIsLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const loadProperties = useCallback(
    async (
      showLoader = true,
    ) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        setError('');

        const data =
          await fetchMarketerProperties();

        setProperties(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load your properties.';

        setError(message);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProperties();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadProperties]);

  const handleRefresh = useCallback(
    async () => {
      setRefreshing(true);
      await loadProperties(false);
    },
    [loadProperties],
  );

  const counts = useMemo(() => {
    return {
      pending: properties.filter(
        (property) =>
          property.status ===
          'PENDING_VERIFICATION',
      ).length,

      approved: properties.filter(
        (property) =>
          property.status === 'ACTIVE',
      ).length,

      changes: properties.filter(
        (property) =>
          property.status ===
          'CHANGES_REQUIRED',
      ).length,

      rejected: properties.filter(
        (property) =>
          property.status === 'REJECTED',
      ).length,
    };
  }, [properties]);

  const filteredProperties =
    useMemo(() => {
      if (filter === 'all') {
        return properties;
      }

      return properties.filter(
        (property) =>
          getVerificationCategory(
            property.status,
          ) === filter,
      );
    }, [filter, properties]);

  const handlePropertyPress = (
    property: BackendProperty,
  ) => {
    router.push(
      `/marketer/properties/${property.id}`,
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text style={styles.loadingTitle}>
          Loading verification...
        </Text>

        <Text style={styles.loadingText}>
          Fetching your latest property review
          statuses.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.lime}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
              strokeWidth={2}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              MARKAZII PORTAL
            </Text>

            <Text style={styles.title}>
              Verification
            </Text>

            <Text style={styles.subtitle}>
              Track the review status of properties
              you have submitted.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
            ]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator
                size="small"
                color={COLORS.lime}
              />
            ) : (
              <RefreshCw
                size={19}
                color={COLORS.lime}
                strokeWidth={2}
              />
            )}
          </Pressable>
        </View>

        {/* ERROR */}
        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <AlertCircle
                size={20}
                color={COLORS.red}
                strokeWidth={2}
              />
            </View>

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Unable to load properties
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={() =>
                  void loadProperties()
                }
              >
                <RefreshCw
                  size={14}
                  color={COLORS.background}
                  strokeWidth={2.4}
                />

                <Text
                  style={styles.retryButtonText}
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <ShieldCheck
              size={25}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              Property verification
            </Text>

            <Text style={styles.summaryText}>
              Your properties are reviewed by MAKAZII
              administration before they become
              customer-visible.
            </Text>
          </View>

          <View style={styles.totalBadge}>
            <Text style={styles.totalNumber}>
              {properties.length}
            </Text>

            <Text style={styles.totalLabel}>
              Properties
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <Text
              style={[
                styles.miniNumber,
                {
                  color: COLORS.blue,
                },
              ]}
            >
              {counts.pending}
            </Text>

            <Text style={styles.miniLabel}>
              Pending
            </Text>
          </View>

          <View style={styles.miniStat}>
            <Text
              style={[
                styles.miniNumber,
                {
                  color: COLORS.green,
                },
              ]}
            >
              {counts.approved}
            </Text>

            <Text style={styles.miniLabel}>
              Approved
            </Text>
          </View>

          <View style={styles.miniStat}>
            <Text
              style={[
                styles.miniNumber,
                {
                  color: COLORS.orange,
                },
              ]}
            >
              {counts.changes}
            </Text>

            <Text style={styles.miniLabel}>
              Changes
            </Text>
          </View>

          <View
            style={[
              styles.miniStat,
              {
                borderRightWidth: 0,
              },
            ]}
          >
            <Text
              style={[
                styles.miniNumber,
                {
                  color: COLORS.red,
                },
              ]}
            >
              {counts.rejected}
            </Text>

            <Text style={styles.miniLabel}>
              Rejected
            </Text>
          </View>
        </View>

        {/* SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            My properties
          </Text>

          <Text style={styles.sectionSubtitle}>
            Current backend verification status
          </Text>
        </View>

        {/* FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filters
          }
        >
          {[
            ['all', 'All'],
            ['pending', 'Pending'],
            ['approved', 'Approved'],
            ['changes', 'Changes'],
            ['rejected', 'Rejected'],
          ].map(([key, label]) => (
            <Pressable
              key={key}
              style={[
                styles.filterButton,
                filter === key &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setFilter(
                  key as FilterKey,
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  filter === key &&
                    styles.filterTextActive,
                ]}
              >
                {label}
              </Text>

              {key !== 'all' ? (
                <Text
                  style={[
                    styles.filterCount,
                    filter === key &&
                      styles.filterCountActive,
                  ]}
                >
                  {key === 'pending'
                    ? counts.pending
                    : key === 'approved'
                      ? counts.approved
                      : key === 'changes'
                        ? counts.changes
                        : counts.rejected}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>

        {/* PROPERTY LIST */}
        <View style={styles.list}>
          {filteredProperties.length > 0 ? (
            filteredProperties.map(
              (property) => {
                const status =
                  getStatusConfig(
                    property.status,
                  );

                const StatusIcon =
                  status.icon;

                const location =
                  getPropertyLocation(
                    property,
                  );

                return (
                  <Pressable
                    key={property.id}
                    style={({
                      pressed,
                    }) => [
                      styles.propertyCard,
                      pressed &&
                        styles.pressed,
                    ]}
                    onPress={() =>
                      handlePropertyPress(
                        property,
                      )
                    }
                  >
                    <View
                      style={
                        styles.propertyHeader
                      }
                    >
                      <View
                        style={
                          styles.propertyIcon
                        }
                      >
                        <FileCheck2
                          size={20}
                          color={
                            COLORS.lime
                          }
                          strokeWidth={2}
                        />
                      </View>

                      <View
                        style={
                          styles.propertyMain
                        }
                      >
                        <Text
                          style={
                            styles.propertyTitle
                          }
                          numberOfLines={1}
                        >
                          {property.title}
                        </Text>

                        <View
                          style={
                            styles.locationRow
                          }
                        >
                          <MapPin
                            size={12}
                            color={
                              COLORS.muted
                            }
                            strokeWidth={2}
                          />

                          <Text
                            style={
                              styles.locationText
                            }
                            numberOfLines={1}
                          >
                            {location}
                          </Text>
                        </View>
                      </View>

                      <ChevronRight
                        size={18}
                        color={
                          COLORS.muted
                        }
                        strokeWidth={2}
                      />
                    </View>

                    <View
                      style={styles.divider}
                    />

                    <View
                      style={styles.statusRow}
                    >
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              status.background,
                          },
                        ]}
                      >
                        <StatusIcon
                          size={14}
                          color={
                            status.color
                          }
                          strokeWidth={
                            2.2
                          }
                        />

                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                status.color,
                            },
                          ]}
                        >
                          {status.label}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.propertyState
                        }
                      >
                        <Text
                          style={
                            styles.propertyStateLabel
                          }
                        >
                          Property type
                        </Text>

                        <Text
                          style={
                            styles.propertyStateValue
                          }
                        >
                          {getPurposeLabel(
                            property.purpose,
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.propertyMeta}
                    >
                      <View
                        style={
                          styles.metaItem
                        }
                      >
                        <Text
                          style={
                            styles.metaLabel
                          }
                        >
                          Availability
                        </Text>

                        <Text
                          style={[
                            styles.metaValue,
                            {
                              color:
                                property.available
                                  ? COLORS.green
                                  : COLORS.red,
                            },
                          ]}
                        >
                          {property.available
                            ? 'Available'
                            : 'Unavailable'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.metaItem
                        }
                      >
                        <Text
                          style={
                            styles.metaLabel
                          }
                        >
                          Verified
                        </Text>

                        <Text
                          style={[
                            styles.metaValue,
                            {
                              color:
                                property.verified
                                  ? COLORS.green
                                  : COLORS.muted,
                            },
                          ]}
                        >
                          {property.verified
                            ? 'Yes'
                            : 'No'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.cardFooter}
                    >
                      <Text
                        style={
                          styles.propertyId
                        }
                      >
                        Property #
                        {property.id}
                      </Text>

                      <Text
                        style={styles.viewText}
                      >
                        View property
                      </Text>
                    </View>
                  </Pressable>
                );
              },
            )
          ) : (
            <View
              style={styles.emptyCard}
            >
              <View
                style={styles.emptyIcon}
              >
                <ShieldCheck
                  size={30}
                  color={
                    COLORS.lime
                  }
                  strokeWidth={1.8}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                No properties found
              </Text>

              <Text
                style={styles.emptyText}
              >
                {properties.length === 0
                  ? 'You have not registered any properties yet.'
                  : 'There are no properties matching this verification category.'}
              </Text>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.emptyButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  router.push(
                    '/marketer/properties',
                  )
                }
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  View my properties
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* WORKFLOW INFO */}
        <View style={styles.infoCard}>
          <ShieldCheck
            size={19}
            color={COLORS.lime}
            strokeWidth={2}
          />

          <View
            style={styles.infoContent}
          >
            <Text
              style={styles.infoTitle}
            >
              How verification works
            </Text>

            <Text
              style={styles.infoText}
            >
              Submit a draft when the property is
              ready. MAKAZII administration reviews
              it and can approve it, request changes,
              or reject it. Marketers cannot publish
              properties directly.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text
            style={styles.footerText}
          >
            MAKAZII MARKETER PORTAL
          </Text>

          <Text
            style={styles.footerSubtext}
          >
            Find your place. Help others find theirs.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 50,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.lime,
    marginBottom: 3,
  },

  title: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 310,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor:
      'rgba(255,107,107,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(255,107,107,0.22)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },

  errorIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,107,107,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  retryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.lime,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
  },

  summaryIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor:
      'rgba(215,255,95,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  summaryText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  totalBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    minWidth: 65,
  },

  totalNumber: {
    color: COLORS.lime,
    fontSize: 23,
    fontWeight: '800',
  },

  totalLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 25,
    overflow: 'hidden',
  },

  miniStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  miniNumber: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 3,
  },

  miniLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
  },

  filters: {
    gap: 8,
    paddingBottom: 14,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButtonActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  filterTextActive: {
    color: COLORS.background,
  },

  filterCount: {
    color: '#687174',
    fontSize: 10,
    fontWeight: '900',
  },

  filterCountActive: {
    color: COLORS.background,
  },

  list: {
    gap: 12,
  },

  propertyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  propertyIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor:
      'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  propertyMain: {
    flex: 1,
    minWidth: 0,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  locationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  propertyState: {
    alignItems: 'flex-end',
  },

  propertyStateLabel: {
    color: '#687174',
    fontSize: 9,
    marginBottom: 3,
  },

  propertyStateValue: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  propertyMeta: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    color: '#687174',
    fontSize: 9,
    marginBottom: 4,
  },

  metaValue: {
    fontSize: 10,
    fontWeight: '800',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  propertyId: {
    color: '#687174',
    fontSize: 9,
  },

  viewText: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
  },

  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor:
      'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 7,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 370,
    marginBottom: 18,
  },

  emptyButton: {
    backgroundColor: COLORS.lime,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },

  emptyButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor:
      'rgba(215,255,95,0.045)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      'rgba(215,255,95,0.13)',
    padding: 16,
    marginTop: 18,
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },

  infoText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 35,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  footerSubtext: {
    color: '#687174',
    fontSize: 10,
    marginTop: 5,
  },

  pressed: {
    opacity: 0.72,
  },
});