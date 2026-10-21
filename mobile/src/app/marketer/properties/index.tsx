import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import * as SecureStore from 'expo-secure-store';

import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileEdit,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  XCircle,
} from 'lucide-react-native';

import { API_BASE_URL } from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#65D98A',
  amber: '#F2C94C',
  red: '#FF7070',
  blue: '#72A7FF',
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

type LongStayType =
  | 'SINGLE_ROOM'
  | 'BEDSITTER'
  | 'STUDIO'
  | 'ONE_BEDROOM'
  | 'TWO_BEDROOM'
  | 'THREE_BEDROOM'
  | 'FOUR_PLUS_BEDROOM'
  | 'HOUSE'
  | 'APARTMENT';

type ShortStayType =
  | 'BNB'
  | 'LODGE'
  | 'GUEST_HOUSE'
  | 'HOTEL_ROOM'
  | 'SERVICED_APARTMENT'
  | 'FURNISHED_APARTMENT'
  | 'HOLIDAY_HOME'
  | 'VILLA'
  | 'COTTAGE'
  | 'HOSTEL'
  | 'PRIVATE_ROOM';

type BackendImage = {
  id: string;
  url: string;
  sortOrder?: number;
  isPrimary?: boolean;
  createdAt?: string;
};

type BackendProperty = {
  id: string;
  title: string;
  description?: string | null;

  purpose: PropertyPurpose;

  longStayType?: LongStayType | null;
  shortStayType?: ShortStayType | null;

  stayMode?:
    | 'DAY'
    | 'OVERNIGHT'
    | 'DAY_AND_NIGHT'
    | 'FLEXIBLE'
    | null;

  furnishing?:
    | 'UNFURNISHED'
    | 'SEMI_FURNISHED'
    | 'FURNISHED'
    | null;

  status: PropertyStatus;

  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  serviceCharge?: number | null;

  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  maxGuests?: number | null;
  rooms?: number | null;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  available: boolean;
  verified: boolean;

  verifiedAt?: string | null;

  images?: BackendImage[];

  amenities?: {
    amenity?: {
      id: string;
      name: string;
    };
  }[];

  statusHistory?: {
    id: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    createdAt: string;
  }[];

  _count?: {
    images?: number;
    amenities?: number;
    viewingRequests?: number;
    shortlists?: number;
  };
};

type Filter =
  | 'ALL'
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'CHANGES_REQUIRED'
  | 'ACTIVE'
  | 'RENTED'
  | 'REJECTED';

async function getToken() {
  try {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      return (
        window.localStorage.getItem(
          'makazii_marketer_token',
        ) || null
      );
    }

    return await SecureStore.getItemAsync(
      'makazii_marketer_token',
    );
  } catch {
    return null;
  }
}

async function fetchProperties(): Promise<
  BackendProperty[]
> {
  const token = await getToken();

  if (!token) {
    throw new Error('MARKETER_AUTH_REQUIRED');
  }

  const response = await fetch(
    `${API_BASE_URL}/marketer/properties`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        'Failed to load properties.',
    );
  }

  return Array.isArray(result.data)
    ? result.data
    : [];
}

async function submitPropertyForVerification(
  propertyId: string,
) {
  const token = await getToken();

  if (!token) {
    throw new Error('MARKETER_AUTH_REQUIRED');
  }

  const response = await fetch(
    `${API_BASE_URL}/marketer/properties/${encodeURIComponent(
      propertyId,
    )}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'PENDING_VERIFICATION',
      }),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        'Failed to submit property for verification.',
    );
  }

  return result.data as BackendProperty;
}

function statusLabel(
  status: PropertyStatus,
) {
  switch (status) {
    case 'DRAFT':
      return 'Draft';

    case 'PENDING_VERIFICATION':
      return 'Under Review';

    case 'CHANGES_REQUIRED':
      return 'Changes Required';

    case 'ACTIVE':
      return 'Approved';

    case 'RENTED':
      return 'Rented';

    case 'INACTIVE':
      return 'Inactive';

    case 'REJECTED':
      return 'Rejected';

    default:
      return status;
  }
}

function statusColor(
  status: PropertyStatus,
) {
  switch (status) {
    case 'ACTIVE':
      return COLORS.green;

    case 'PENDING_VERIFICATION':
      return COLORS.amber;

    case 'CHANGES_REQUIRED':
      return COLORS.blue;

    case 'REJECTED':
      return COLORS.red;

    case 'RENTED':
      return COLORS.red;

    default:
      return COLORS.muted;
  }
}

function StatusIcon({
  status,
}: {
  status: PropertyStatus;
}) {
  switch (status) {
    case 'ACTIVE':
      return (
        <CheckCircle2
          size={15}
          color={COLORS.green}
        />
      );

    case 'PENDING_VERIFICATION':
      return (
        <Clock3
          size={15}
          color={COLORS.amber}
        />
      );

    case 'CHANGES_REQUIRED':
      return (
        <RefreshCw
          size={15}
          color={COLORS.blue}
        />
      );

    case 'REJECTED':
      return (
        <XCircle
          size={15}
          color={COLORS.red}
        />
      );

    default:
      return (
        <FileEdit
          size={15}
          color={COLORS.muted}
        />
      );
  }
}

function formatLongStayType(
  value?: LongStayType | null,
) {
  if (!value) {
    return 'Long-stay property';
  }

  switch (value) {
    case 'SINGLE_ROOM':
      return 'Single Room';

    case 'BEDSITTER':
      return 'Bedsitter';

    case 'STUDIO':
      return 'Studio';

    case 'ONE_BEDROOM':
      return '1 Bedroom';

    case 'TWO_BEDROOM':
      return '2 Bedroom';

    case 'THREE_BEDROOM':
      return '3 Bedroom';

    case 'FOUR_PLUS_BEDROOM':
      return '4+ Bedroom';

    case 'HOUSE':
      return 'House';

    case 'APARTMENT':
      return 'Apartment';

    default:
      return value;
  }
}

function formatShortStayType(
  value?: ShortStayType | null,
) {
  if (!value) {
    return 'Short-stay property';
  }

  switch (value) {
    case 'BNB':
      return 'B&B';

    case 'LODGE':
      return 'Lodge';

    case 'GUEST_HOUSE':
      return 'Guest House';

    case 'HOTEL_ROOM':
      return 'Hotel Room';

    case 'SERVICED_APARTMENT':
      return 'Serviced Apartment';

    case 'FURNISHED_APARTMENT':
      return 'Furnished Apartment';

    case 'HOLIDAY_HOME':
      return 'Holiday Home';

    case 'VILLA':
      return 'Villa';

    case 'COTTAGE':
      return 'Cottage';

    case 'HOSTEL':
      return 'Hostel';

    case 'PRIVATE_ROOM':
      return 'Private Room';

    default:
      return value;
  }
}

function formatPurpose(
  property: BackendProperty,
) {
  if (property.purpose === 'SHORT_STAY') {
    return formatShortStayType(
      property.shortStayType,
    );
  }

  return formatLongStayType(
    property.longStayType,
  );
}

function formatStayMode(
  value?: BackendProperty['stayMode'],
) {
  switch (value) {
    case 'DAY':
      return 'Day';

    case 'OVERNIGHT':
      return 'Overnight';

    case 'DAY_AND_NIGHT':
      return 'Day & Night';

    case 'FLEXIBLE':
      return 'Flexible';

    default:
      return null;
  }
}

function getPrimaryRate(
  property: BackendProperty,
) {
  if (property.purpose === 'LONG_STAY') {
    if (
      property.monthlyRent !== null &&
      property.monthlyRent !== undefined
    ) {
      return {
        label: 'Monthly',
        value: property.monthlyRent,
      };
    }

    return {
      label: 'Monthly',
      value: 0,
    };
  }

  if (
    property.stayMode === 'DAY' &&
    property.dayRate
  ) {
    return {
      label: 'Day',
      value: property.dayRate,
    };
  }

  if (
    property.stayMode === 'OVERNIGHT' &&
    property.nightRate
  ) {
    return {
      label: 'Night',
      value: property.nightRate,
    };
  }

  if (
    property.stayMode === 'DAY_AND_NIGHT' &&
    property.dayNightRate
  ) {
    return {
      label: 'Day + Night',
      value: property.dayNightRate,
    };
  }

  if (property.dayRate) {
    return {
      label: 'Day',
      value: property.dayRate,
    };
  }

  if (property.nightRate) {
    return {
      label: 'Night',
      value: property.nightRate,
    };
  }

  if (property.dayNightRate) {
    return {
      label: 'Day + Night',
      value: property.dayNightRate,
    };
  }

  return {
    label: 'Rate',
    value: 0,
  };
}

function formatMoney(
  value?: number | null,
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  return `KSh ${Number(
    value,
  ).toLocaleString()}`;
}

function getReviewNote(
  property: BackendProperty,
) {
  if (
    property.status !==
      'CHANGES_REQUIRED' &&
    property.status !== 'REJECTED'
  ) {
    return null;
  }

  const history =
    property.statusHistory || [];

  const entry = history.find(
    (item) =>
      (
        item.toStatus ===
          property.status ||
        item.fromStatus ===
          property.status
      ) && item.note,
  );

  return entry?.note || null;
}

function PropertyCard({
  property,
  onSubmitForReview,
  submitting,
}: {
  property: BackendProperty;
  onSubmitForReview: (
    property: BackendProperty,
  ) => void;
  submitting: boolean;
}) {
  const color = statusColor(
    property.status,
  );

  const reviewNote =
    getReviewNote(property);

  const imageCount =
    property._count?.images ??
    property.images?.length ??
    0;

  const canSubmit =
    property.status === 'DRAFT' ||
    property.status ===
      'CHANGES_REQUIRED';

  const isChangesRequired =
    property.status ===
    'CHANGES_REQUIRED';

  const primaryRate =
    getPrimaryRate(property);

  const propertyType =
    formatPurpose(property);

  return (
    <View style={styles.propertyCard}>
      <Pressable
        onPress={() =>
          router.push(
            `/marketer/properties/${property.id}`,
          )
        }
      >
        <View style={styles.propertyTop}>
          <View style={styles.propertyIcon}>
            <Building2
              size={21}
              color={COLORS.lime}
            />
          </View>

          <View style={styles.propertyMain}>
            <Text
              style={styles.propertyTitle}
              numberOfLines={1}
            >
              {property.title ||
                'Untitled Property'}
            </Text>

            <Text
              style={styles.propertyLocation}
              numberOfLines={1}
            >
              {[
                property.county,
                property.town,
                property.area,
              ]
                .filter(Boolean)
                .join(' • ') ||
                'Location not specified'}
            </Text>
          </View>

          <ChevronRight
            size={19}
            color={COLORS.muted}
          />
        </View>

        <View style={styles.propertyDivider} />

        <View style={styles.propertyMeta}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>
              {primaryRate.label}
            </Text>

            <Text
              style={styles.metaValue}
              numberOfLines={1}
            >
              {formatMoney(
                primaryRate.value,
              )}
            </Text>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>
              Type
            </Text>

            <Text
              style={styles.metaValue}
              numberOfLines={1}
            >
              {propertyType}
            </Text>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>
              Status
            </Text>

            <View
              style={[
                styles.statusPill,
                {
                  borderColor: `${color}55`,
                },
              ]}
            >
              <StatusIcon
                status={property.status}
              />

              <Text
                style={[
                  styles.statusText,
                  { color },
                ]}
                numberOfLines={1}
              >
                {statusLabel(
                  property.status,
                )}
              </Text>
            </View>
          </View>
        </View>

        {property.purpose ===
        'SHORT_STAY' ? (
          <View
            style={styles.shortStayInfo}
          >
            <View
              style={styles.shortStayItem}
            >
              <Clock3
                size={13}
                color={COLORS.lime}
              />

              <Text
                style={styles.shortStayText}
              >
                {formatStayMode(
                  property.stayMode,
                ) || 'Stay mode'}
              </Text>
            </View>

            <View
              style={styles.shortStayItem}
            >
              <BedDouble
                size={13}
                color={COLORS.muted}
              />

              <Text
                style={styles.shortStayText}
              >
                {property.rooms ?? 0}{' '}
                {property.rooms === 1
                  ? 'room'
                  : 'rooms'}
              </Text>
            </View>

            <View
              style={styles.shortStayItem}
            >
              <Users
                size={13}
                color={COLORS.muted}
              />

              <Text
                style={styles.shortStayText}
              >
                {property.maxGuests ??
                  0}{' '}
                guests
              </Text>
            </View>
          </View>
        ) : null}
      </Pressable>

      {reviewNote ? (
        <View
          style={styles.reviewNotice}
        >
          <View
            style={
              styles.reviewNoticeHeader
            }
          >
            <AlertCircle
              size={14}
              color={
                property.status ===
                'REJECTED'
                  ? COLORS.red
                  : COLORS.blue
              }
            />

            <Text
              style={[
                styles.reviewNoticeLabel,
                {
                  color:
                    property.status ===
                    'REJECTED'
                      ? COLORS.red
                      : COLORS.blue,
                },
              ]}
            >
              ADMIN FEEDBACK
            </Text>
          </View>

          <Text
            style={styles.reviewNoticeText}
            numberOfLines={5}
          >
            {reviewNote}
          </Text>
        </View>
      ) : null}

      <View style={styles.propertyFooter}>
        <Text style={styles.footerText}>
          {imageCount} photo
          {imageCount === 1 ? '' : 's'}
        </Text>

        {property.bedrooms !==
          null &&
        property.bedrooms !==
          undefined ? (
          <Text
            style={styles.footerText}
          >
            {property.bedrooms}{' '}
            bedroom
            {property.bedrooms === 1
              ? ''
              : 's'}
          </Text>
        ) : null}

        {property.bathrooms !==
          null &&
        property.bathrooms !==
          undefined ? (
          <Text
            style={styles.footerText}
          >
            {property.bathrooms}{' '}
            bathroom
            {property.bathrooms === 1
              ? ''
              : 's'}
          </Text>
        ) : null}

        {property.purpose ===
        'SHORT_STAY' ? (
          <Text
            style={styles.footerText}
          >
            {property.maxGuests ??
              0}{' '}
            guests
          </Text>
        ) : null}
      </View>

      <View
        style={styles.availabilityRow}
      >
        <View
          style={[
            styles.availabilityDot,
            {
              backgroundColor:
                property.available
                  ? COLORS.green
                  : COLORS.red,
            },
          ]}
        />

        <Text
          style={[
            styles.availabilityText,
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

        {property.verified ? (
          <View
            style={styles.verifiedBadge}
          >
            <CheckCircle2
              size={12}
              color={COLORS.green}
            />

            <Text
              style={
                styles.verifiedText
              }
            >
              Verified
            </Text>
          </View>
        ) : null}
      </View>

      {canSubmit ? (
        <View
          style={styles.actionArea}
        >
          {isChangesRequired ? (
            <Pressable
              style={
                styles.editButton
              }
              onPress={() =>
                router.push(
                  `/marketer/properties/${property.id}`,
                )
              }
              disabled={submitting}
            >
              <FileEdit
                size={16}
                color={COLORS.white}
              />

              <Text
                style={
                  styles.editButtonText
                }
              >
                Review & Edit
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              styles.submitButton,
              isChangesRequired &&
                styles.submitButtonWithEdit,
              submitting &&
                styles.submitButtonDisabled,
            ]}
            onPress={() =>
              onSubmitForReview(
                property,
              )
            }
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.background
                }
              />
            ) : (
              <Send
                size={16}
                color={
                  COLORS.background
                }
              />
            )}

            <Text
              style={
                styles.submitButtonText
              }
            >
              {submitting
                ? 'Submitting...'
                : isChangesRequired
                  ? 'Resubmit for Review'
                  : 'Submit for Review'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {property.status ===
      'PENDING_VERIFICATION' ? (
        <View
          style={
            styles.waitingNotice
          }
        >
          <Clock3
            size={15}
            color={COLORS.amber}
          />

          <Text
            style={
              styles.waitingNoticeText
            }
          >
            Submitted and waiting
            for admin verification.
          </Text>
        </View>
      ) : null}

      {property.status ===
      'ACTIVE' ? (
        <View
          style={
            styles.approvedNotice
          }
        >
          <CheckCircle2
            size={15}
            color={COLORS.green}
          />

          <Text
            style={
              styles.approvedNoticeText
            }
          >
            Approved by Makazii
            admin.
          </Text>
        </View>
      ) : null}

      {property.status ===
      'RENTED' ? (
        <View
          style={styles.rentedNotice}
        >
          <AlertCircle
            size={15}
            color={COLORS.red}
          />

          <Text
            style={
              styles.rentedNoticeText
            }
          >
            This property is
            rented and locked from
            editing.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MarketerPropertiesScreen() {
  const [
    properties,
    setProperties,
  ] = useState<
    BackendProperty[]
  >([]);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<Filter>('ALL');

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    submittingPropertyId,
    setSubmittingPropertyId,
  ] = useState<string | null>(
    null,
  );

  const load = useCallback(
    async () => {
      try {
        setError('');

        const data =
          await fetchProperties();

        setProperties(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load your properties.';

        if (
          message ===
          'MARKETER_AUTH_REQUIRED'
        ) {
          setError(
            'Your marketer session is missing. Please log in again.',
          );
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSubmitForReview =
    useCallback(
      (
        property: BackendProperty,
      ) => {
        const isResubmission =
          property.status ===
          'CHANGES_REQUIRED';

        Alert.alert(
          isResubmission
            ? 'Resubmit Property?'
            : 'Submit Property for Review?',
          isResubmission
            ? 'Once submitted, this property will return to admin review. Make sure you have addressed the requested changes.'
            : 'Once submitted, the Makazii admin team will review this property before it can be approved.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: isResubmission
                ? 'Resubmit'
                : 'Submit',
              onPress:
                async () => {
                  try {
                    setSubmittingPropertyId(
                      property.id,
                    );

                    setError('');

                    await submitPropertyForVerification(
                      property.id,
                    );

                    await load();

                    Alert.alert(
                      'Submitted',
                      'Your property has been submitted for Makazii admin verification.',
                    );
                  } catch (err) {
                    const message =
                      err instanceof
                      Error
                        ? err.message
                        : 'Failed to submit property for verification.';

                    if (
                      message ===
                      'MARKETER_AUTH_REQUIRED'
                    ) {
                      setError(
                        'Your marketer session is missing. Please log in again.',
                      );
                    } else {
                      Alert.alert(
                        'Submission Failed',
                        message,
                      );
                    }
                  } finally {
                    setSubmittingPropertyId(
                      null,
                    );
                  }
                },
            },
          ],
        );
      },
      [load],
    );

  const counts = useMemo(() => {
    return {
      ALL: properties.length,

      DRAFT: properties.filter(
        (item) =>
          item.status ===
          'DRAFT',
      ).length,

      PENDING_VERIFICATION:
        properties.filter(
          (item) =>
            item.status ===
            'PENDING_VERIFICATION',
        ).length,

      CHANGES_REQUIRED:
        properties.filter(
          (item) =>
            item.status ===
            'CHANGES_REQUIRED',
        ).length,

      ACTIVE: properties.filter(
        (item) =>
          item.status ===
          'ACTIVE',
      ).length,

      RENTED: properties.filter(
        (item) =>
          item.status ===
          'RENTED',
      ).length,

      REJECTED: properties.filter(
        (item) =>
          item.status ===
          'REJECTED',
      ).length,
    };
  }, [properties]);

  const filteredProperties =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return properties.filter(
        (property) => {
          const matchesFilter =
            activeFilter ===
              'ALL' ||
            property.status ===
              activeFilter;

          const propertyType =
            formatPurpose(
              property,
            );

          const matchesSearch =
            !query ||
            property.title
              ?.toLowerCase()
              .includes(query) ||
            property.county
              ?.toLowerCase()
              .includes(query) ||
            property.town
              ?.toLowerCase()
              .includes(query) ||
            property.area
              ?.toLowerCase()
              .includes(query) ||
            propertyType
              .toLowerCase()
              .includes(query) ||
            property.purpose
              .toLowerCase()
              .includes(query);

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      properties,
      activeFilter,
      search,
    ]);

  const filters: {
    key: Filter;
    label: string;
  }[] = [
    {
      key: 'ALL',
      label: `All (${counts.ALL})`,
    },
    {
      key: 'DRAFT',
      label: `Drafts (${counts.DRAFT})`,
    },
    {
      key:
        'PENDING_VERIFICATION',
      label: `Review (${counts.PENDING_VERIFICATION})`,
    },
    {
      key:
        'CHANGES_REQUIRED',
      label: `Changes (${counts.CHANGES_REQUIRED})`,
    },
    {
      key: 'ACTIVE',
      label: `Approved (${counts.ACTIVE})`,
    },
    {
      key: 'RENTED',
      label: `Rented (${counts.RENTED})`,
    },
    {
      key: 'REJECTED',
      label: `Rejected (${counts.REJECTED})`,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading your properties...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(
                true,
              );
              load();
            }}
            tintColor={
              COLORS.lime
            }
          />
        }
      >
        <View
          style={styles.header}
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={20}
              color={
                COLORS.white
              }
            />
          </Pressable>

          <View
            style={styles.headerText}
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              MARKETER PORTAL
            </Text>

            <Text
              style={styles.title}
            >
              My Properties
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Manage your listings
              and track admin
              review.
            </Text>
          </View>

          <Pressable
            style={
              styles.addButton
            }
            onPress={() =>
              router.push(
                '/marketer/properties/add',
              )
            }
          >
            <Plus
              size={20}
              color={
                COLORS.background
              }
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              Add
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <AlertCircle
              size={20}
              color={
                COLORS.red
              }
            />

            <View
              style={
                styles.errorContent
              }
            >
              <Text
                style={
                  styles.errorTitle
                }
              >
                Could not load
                properties
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </View>

            <Pressable
              style={
                styles.retryButton
              }
              onPress={load}
            >
              <RefreshCw
                size={16}
                color={
                  COLORS.lime
                }
              />
            </Pressable>
          </View>
        ) : null}

        <View
          style={styles.searchBox}
        >
          <Search
            size={19}
            color={
              COLORS.muted
            }
          />

          <TextInput
            value={search}
            onChangeText={
              setSearch
            }
            placeholder="Search your properties"
            placeholderTextColor={
              COLORS.muted
            }
            style={
              styles.searchInput
            }
          />
        </View>

        <View
          style={styles.filters}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            {filters.map(
              (filter) => {
                const active =
                  activeFilter ===
                  filter.key;

                return (
                  <Pressable
                    key={
                      filter.key
                    }
                    style={[
                      styles.filter,
                      active &&
                        styles.filterActive,
                    ]}
                    onPress={() =>
                      setActiveFilter(
                        filter.key,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {
                        filter.label
                      }
                    </Text>
                  </Pressable>
                );
              },
            )}
          </ScrollView>
        </View>

        <View
          style={
            styles.summaryCard
          }
        >
          <View>
            <Text
              style={
                styles.summaryLabel
              }
            >
              YOUR LISTINGS
            </Text>

            <Text
              style={
                styles.summaryNumber
              }
            >
              {counts.ALL}
            </Text>

            <Text
              style={
                styles.summaryText
              }
            >
              properties in your
              portfolio
            </Text>
          </View>

          <View
            style={
              styles.summaryIcon
            }
          >
            <Building2
              size={30}
              color={
                COLORS.lime
              }
            />
          </View>
        </View>

        <View
          style={
            styles.workflowCard
          }
        >
          <View
            style={
              styles.workflowHeader
            }
          >
            <Text
              style={
                styles.workflowTitle
              }
            >
              Approval workflow
            </Text>

            <Text
              style={
                styles.workflowCaption
              }
            >
              Admin controls
              publication
            </Text>
          </View>

          <View
            style={
              styles.workflowRow
            }
          >
            <View
              style={
                styles.workflowStep
              }
            >
              <View
                style={
                  styles.workflowDot
                }
              >
                <FileEdit
                  size={14}
                  color={
                    COLORS.background
                  }
                />
              </View>

              <Text
                style={
                  styles.workflowStepText
                }
              >
                Draft
              </Text>
            </View>

            <View
              style={
                styles.workflowLine
              }
            />

            <View
              style={
                styles.workflowStep
              }
            >
              <View
                style={
                  styles.workflowDot
                }
              >
                <Clock3
                  size={14}
                  color={
                    COLORS.background
                  }
                />
              </View>

              <Text
                style={
                  styles.workflowStepText
                }
              >
                Review
              </Text>
            </View>

            <View
              style={
                styles.workflowLine
              }
            />

            <View
              style={
                styles.workflowStep
              }
            >
              <View
                style={
                  styles.workflowDot
                }
              >
                <CheckCircle2
                  size={14}
                  color={
                    COLORS.background
                  }
                />
              </View>

              <Text
                style={
                  styles.workflowStepText
                }
              >
                Approved
              </Text>
            </View>
          </View>
        </View>

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Listings
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              {
                filteredProperties.length
              }{' '}
              result
              {filteredProperties.length ===
              1
                ? ''
                : 's'}
            </Text>
          </View>
        </View>

        {filteredProperties.length ===
        0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Building2
                size={28}
                color={
                  COLORS.muted
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              {search ||
              activeFilter !==
                'ALL'
                ? 'No matching properties'
                : 'No properties yet'}
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {search ||
              activeFilter !==
                'ALL'
                ? 'Try another search or status filter.'
                : 'Add a property and submit it to the Makazii admin team for review.'}
            </Text>

            {!search &&
            activeFilter ===
              'ALL' ? (
              <Pressable
                style={
                  styles.emptyButton
                }
                onPress={() =>
                  router.push(
                    '/marketer/properties/add',
                  )
                }
              >
                <Plus
                  size={18}
                  color={
                    COLORS.background
                  }
                />

                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  Add Property
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          filteredProperties.map(
            (property) => (
              <PropertyCard
                key={
                  property.id
                }
                property={
                  property
                }
                onSubmitForReview={
                  handleSubmitForReview
                }
                submitting={
                  submittingPropertyId ===
                  property.id
                }
              />
            ),
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 130,
  },

  loading: {
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
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  addButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  addButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      '#FF707033',
    backgroundColor:
      '#FF70700D',
    marginBottom: 14,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  retryButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    height: '100%',
  },

  filters: {
    marginBottom: 18,
  },

  filter: {
    paddingHorizontal: 13,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    justifyContent:
      'center',
    marginRight: 8,
  },

  filterActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  filterTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },

  summaryCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  summaryNumber: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },

  summaryText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      '#D7FF5F18',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  workflowCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 24,
  },

  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 16,
  },

  workflowTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  workflowCaption: {
    color: COLORS.muted,
    fontSize: 9,
  },

  workflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  workflowStep: {
    alignItems: 'center',
  },

  workflowDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  workflowStepText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 5,
  },

  workflowLine: {
    flex: 1,
    height: 1,
    backgroundColor:
      COLORS.border,
    marginHorizontal: 8,
    marginBottom: 18,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  propertyCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  propertyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  propertyIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor:
      '#D7FF5F12',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  propertyMain: {
    flex: 1,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  propertyLocation: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  propertyDivider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical: 15,
  },

  propertyMeta: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    gap: 10,
  },

  metaBlock: {
    flex: 1,
    minWidth: 0,
  },

  metaLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 5,
  },

  metaValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  statusPill: {
    alignSelf:
      'flex-start',
    minHeight: 27,
    maxWidth: '100%',
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },

  shortStayInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  shortStayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  shortStayText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },

  reviewNotice: {
    marginTop: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor:
      '#72A7FF0D',
    borderWidth: 1,
    borderColor:
      '#72A7FF22',
  },

  reviewNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },

  reviewNoticeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  reviewNoticeText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  propertyFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 15,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
  },

  availabilityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
  },

  verifiedBadge: {
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor:
      '#65D98A0D',
    borderWidth: 1,
    borderColor:
      '#65D98A22',
  },

  verifiedText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '700',
  },

  actionArea: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  editButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 7,
  },

  editButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  submitButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 7,
  },

  submitButtonWithEdit: {
    flex: 1,
  },

  submitButtonDisabled: {
    opacity: 0.55,
  },

  submitButtonText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '800',
  },

  waitingNotice: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor:
      '#F2C94C0D',
    borderWidth: 1,
    borderColor:
      '#F2C94C22',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  waitingNoticeText: {
    flex: 1,
    color: COLORS.amber,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  approvedNotice: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor:
      '#65D98A0D',
    borderWidth: 1,
    borderColor:
      '#65D98A22',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  approvedNoticeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '600',
  },

  rentedNotice: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor:
      '#FF70700D',
    borderWidth: 1,
    borderColor:
      '#FF707022',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  rentedNoticeText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: 14,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 290,
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  emptyButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
});
