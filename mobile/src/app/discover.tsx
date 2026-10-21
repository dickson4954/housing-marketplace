import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ArrowDownUp,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Heart,
  Home,
  MapPin,
  Play,
  Share2,
  ShieldCheck,
  VideoOff,
  Wallet,
} from 'lucide-react-native';

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { useShortlist } from '@/context/ShortlistContext';
import PropertyEngagement from '@/components/PropertyEngagement';
import { recordPropertyVideoView } from '@/lib/customerEngagement';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  rose: '#FF6B81',
  dark: '#101415',
};

type PropertyImage = {
  id?: string;
  url?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

type PropertyAmenity = {
  id?: string;
  name?: string | null;
  category?: string | null;
};

type Property = {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  videoMimeType?: string | null;
  purpose?: string | null;
  longStayType?: string | null;
  shortStayType?: string | null;
  monthlyRent?: number | string | null;
  dayRate?: number | string | null;
  nightRate?: number | string | null;
  dayNightRate?: number | string | null;
  viewingFee?: number | string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  county?: string | null;
  town?: string | null;
  area?: string | null;
  place?: { name?: string | null } | null;
  uploaderName?: string | null;
  publishedAt?: string | null;
  verifiedAt?: string | null;
  createdAt?: string | null;
  amenities?: PropertyAmenity[];
  available?: boolean;
  verified?: boolean;
  images?: PropertyImage[];
};

type SortOption = 'latest' | 'price-low' | 'price-high';

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 'Price on request';
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `KSh ${amount.toLocaleString('en-KE')}`
    : 'Price on request';
}

function getNumericPrice(property: Property): number {
  const isShortStay = property.purpose?.toUpperCase() === 'SHORT_STAY';

  const value = isShortStay
    ? property.dayNightRate ?? property.nightRate ?? property.dayRate
    : property.monthlyRent;

  if (value === null || value === undefined || value === '') {
    return Number.POSITIVE_INFINITY;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : Number.POSITIVE_INFINITY;
}

function getPrice(property: Property) {
  if (property.purpose?.toUpperCase() === 'SHORT_STAY') {
    if (property.dayNightRate != null) {
      return `${formatMoney(property.dayNightRate)} / day + night`;
    }

    if (property.nightRate != null) {
      return `${formatMoney(property.nightRate)} / night`;
    }

    if (property.dayRate != null) {
      return `${formatMoney(property.dayRate)} / day`;
    }

    return 'Price on request';
  }

  return `${formatMoney(property.monthlyRent)} / month`;
}

function getLocation(property: Property) {
  const parts = [
    property.area,
    property.town,
    property.county,
    property.place?.name,
  ].filter(
    (value): value is string =>
      typeof value === 'string' && Boolean(value.trim()),
  );

  return [...new Set(parts)].join(', ') || 'Location not provided';
}

function getPropertyType(property: Property) {
  const rawType =
    property.purpose?.toUpperCase() === 'SHORT_STAY'
      ? property.shortStayType
      : property.longStayType;

  if (!rawType?.trim()) {
    return property.purpose?.toUpperCase() === 'SHORT_STAY'
      ? 'Short stay'
      : 'Long stay';
  }

  return rawType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPublishedDate(value?: string | null) {
  if (!value) return null;

  const publishedAt = new Date(value);

  if (Number.isNaN(publishedAt.getTime())) return null;

  const elapsed = Date.now() - publishedAt.getTime();

  // Do not show a relative label for a future timestamp.
  if (elapsed < 0) return null;

  const minutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);

  if (minutes < 1) return 'Added just now';
  if (hours < 1) return `Added ${minutes}m ago`;
  if (hours < 24) return `Added ${hours}h ago`;
  if (days === 1) return 'Added yesterday';
  if (days < 7) return `Added ${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `Added ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Added ${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  const years = Math.floor(days / 365);
  return `Added ${years} ${years === 1 ? 'year' : 'years'} ago`;
}
function getInitials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function PropertyVideo({
  uri,
  propertyId,
}: {
  uri: string | null;
  propertyId: string;
}) {
  const recordedRef = useRef(false);

  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = false;
  });

  useEffect(() => {
    recordedRef.current = false;

    if (!uri) return;

    const subscription = player.addListener('playingChange', (event) => {
      if (event.isPlaying && !recordedRef.current) {
        recordedRef.current = true;

        void recordPropertyVideoView(propertyId).catch((error) => {
          console.error('Failed to record property video view:', error);
        });
      }
    });

    return () => subscription.remove();
  }, [player, propertyId, uri]);

  if (!uri) {
    return (
      <View style={[styles.videoFrame, styles.noVideo]}>
        <VideoOff size={30} color={C.muted} />

        <Text style={styles.noVideoTitle}>Video not available</Text>

        <Text style={styles.noVideoText}>
          This listing does not have an uploaded video yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.videoFrame}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls
        allowsPictureInPicture={false}
      />

      <View pointerEvents="none" style={styles.videoBadge}>
        <Play size={12} color={C.dark} fill={C.dark} />
        <Text style={styles.videoBadgeText}>PROPERTY VIDEO</Text>
      </View>
    </View>
  );
}

function DetailChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.detailChip}>
      {icon}
      <Text style={styles.detailChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DiscoverCard({
  property,
  isShortlisted,
  onToggleShortlist,
  isComparing,
  onToggleCompare,
}: {
  property: Property;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  isComparing: boolean;
  onToggleCompare: () => void;
}) {
  const photos = (property.images ?? [])
    .filter((photo) => Boolean(photo.url))
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .slice(0, 3);

  const publishedDate = formatPublishedDate(
    property.publishedAt || property.verifiedAt,
  );
  const amenities = (property.amenities ?? [])
    .filter((amenity) => Boolean(amenity.name?.trim()))
    .slice(0, 3);

  const openProperty = useCallback(() => {
    router.push(`/property/${property.id}`);
  }, [property.id]);

  const shareProperty = useCallback(async () => {
    try {
      await Share.share({
        title: property.title,
        message:
          `${property.title}\n` +
          `${getLocation(property)}\n` +
          `${getPrice(property)}\n` +
          'Discover this property on MAKAZII.',
      });
    } catch (error) {
      console.error('Property sharing failed:', error);
    }
  }, [property]);

  return (
    <View style={styles.card}>
      {/* The real property video leads the card. */}
      <PropertyVideo
        uri={property.videoUrl || null}
        propertyId={property.id}
      />

      {photos.length > 0 ? (
        <View style={styles.photosSection}>
          <View style={styles.photosHeadingRow}>
            <Text style={styles.sectionLabel}>PROPERTY PHOTOS</Text>
            <Text style={styles.photoCount}>
              {photos.length} {photos.length === 1 ? 'PHOTO' : 'PHOTOS'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosRow}
          >
            {photos.map((photo, index) => (
              <Pressable
                key={
                  photo.id ??
                  photo.url ??
                  `${property.id}-photo-${index}`
                }
                onPress={openProperty}
                accessibilityRole="button"
                accessibilityLabel={`Open property photo ${index + 1}`}
                style={styles.photoFrame}
              >
                <Image
                  source={{ uri: photo.url! }}
                  style={styles.photo}
                  resizeMode="cover"
                  accessibilityLabel={
                    photo.altText || `Property photo ${index + 1}`
                  }
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.noPhotos}>
          No supporting photos have been uploaded.
        </Text>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.headerText}>
          <View style={styles.typePill}>
            <Home size={12} color={C.lime} />
            <Text style={styles.typePillText}>
              {getPropertyType(property)}
            </Text>
          </View>

          <Text style={styles.propertyTitle} numberOfLines={2}>
            {property.title}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color={C.muted} />

            <Text style={styles.location} numberOfLines={2}>
              {getLocation(property)}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isShortlisted
              ? 'Remove property from shortlist'
              : 'Add property to shortlist'
          }
          accessibilityState={{ selected: isShortlisted }}
          onPress={onToggleShortlist}
          hitSlop={8}
          style={styles.heartButton}
        >
          <Heart
            size={21}
            color={isShortlisted ? C.lime : C.white}
            fill={isShortlisted ? C.lime : 'transparent'}
          />
        </Pressable>
      </View>

      {(property.uploaderName || publishedDate) && (
        <View style={styles.uploaderRow}>
          {property.uploaderName ? (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(property.uploaderName)}
                </Text>
              </View>

              <View style={styles.uploaderInfo}>
                <Text style={styles.uploaderName} numberOfLines={1}>
                  {property.uploaderName}
                </Text>

                {publishedDate ? (
                  <View style={styles.uploadDateRow}>
                    <CalendarDays size={11} color={C.muted} />
                    <Text style={styles.uploadDate}>{publishedDate}</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View style={styles.uploadDateRow}>
              <CalendarDays size={12} color={C.muted} />
              <Text style={styles.uploadDate}>{publishedDate}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.detailsSection}>
        <Text style={styles.sectionLabel}>PROPERTY DETAILS</Text>

        <View style={styles.detailsRow}>
          {property.bedrooms != null ? (
            <DetailChip
              icon={<BedDouble size={15} color={C.lime} />}
              label={`${property.bedrooms} ${
                property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'
              }`}
            />
          ) : null}

          {property.bathrooms != null ? (
            <DetailChip
              icon={<Bath size={15} color={C.lime} />}
              label={`${property.bathrooms} ${
                property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'
              }`}
            />
          ) : null}

          {amenities.map((amenity, index) => (
            <DetailChip
              key={amenity.id ?? `${amenity.name}-${index}`}
              icon={<CheckCircle2 size={14} color={C.lime} />}
              label={amenity.name!}
            />
          ))}
        </View>

        {property.viewingFee != null && property.viewingFee !== '' ? (
          <View style={styles.viewingFeeRow}>
            <Wallet size={15} color={C.muted} />
            <Text style={styles.viewingFeeLabel}>Viewing fee</Text>
            <Text style={styles.viewingFeeValue}>
              {formatMoney(property.viewingFee)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>
            {property.purpose?.toUpperCase() === 'SHORT_STAY'
              ? 'STAY PRICE'
              : 'MONTHLY RENT'}
          </Text>

          <Text style={styles.price}>{getPrice(property)}</Text>
        </View>

        {property.verified ? (
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={14} color={C.lime} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.engagementSection}>
        <PropertyEngagement propertyId={property.id} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isComparing }}
        onPress={onToggleCompare}
        style={({ pressed }) => [
          styles.compareButton,
          isComparing && styles.compareButtonActive,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.compareButtonText,
            isComparing && styles.compareButtonTextActive,
          ]}
        >
          {isComparing
            ? '✓ Added to comparison'
            : '+ Add to comparison'}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={openProperty}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>View property</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share property"
          onPress={shareProperty}
          style={({ pressed }) => [
            styles.shareButton,
            pressed && styles.pressed,
          ]}
        >
          <Share2 size={19} color={C.white} />
        </Pressable>
      </View>
    </View>
  );
}

function extractApiList<T = any>(
  payload: any,
  keys: string[] = [],
): T[] {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) return payload.data;

  const candidates = [
    ...(keys.length ? keys : []),
    "items",
    "results",
    "properties",
    "counties",
    "constituencies",
    "wards",
    "places",
  ];

  for (const key of candidates) {
    if (Array.isArray(payload?.data?.[key])) {
      return payload.data[key];
    }

    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

export default function DiscoverScreen() {
  const {
    isShortlisted,
    toggleShortlist,
    comparisonIds,
    isComparing,
    toggleCompare,
  } = useShortlist();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  const loadProperties = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.properties}`,
      );

      if (!response.ok) {
        throw new Error(
          `Properties request failed (${response.status}).`,
        );
      }

      const result = await response.json();

      const records = extractApiList<Property>(result, ["properties"]);

      setProperties(
        records.filter(
          (property) =>
            property.available === true &&
            property.verified === true,
        ),
      );
    } catch (requestError) {
      console.error(
        'Failed to load Discover properties:',
        requestError,
      );

      setError(
        'We could not load properties right now. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProperties();
    }, [loadProperties]),
  );

  const sortedProperties = useMemo(() => {
    const result = [...properties];

    if (sortBy === 'price-low' || sortBy === 'price-high') {
      const direction = sortBy === 'price-low' ? 1 : -1;

      return result.sort((a, b) => {
        const priceA = getNumericPrice(a);
        const priceB = getNumericPrice(b);
        const missingA = !Number.isFinite(priceA);
        const missingB = !Number.isFinite(priceB);

        // Keep properties without a price at the bottom in both orders.
        if (missingA && missingB) return 0;
        if (missingA) return 1;
        if (missingB) return -1;

        return (priceA - priceB) * direction;
      });
    }

    return result.sort((a, b) => {
      const valueA = a.publishedAt || a.verifiedAt || a.createdAt;
      const valueB = b.publishedAt || b.verifiedAt || b.createdAt;
      const dateA = valueA ? new Date(valueA).getTime() : 0;
      const dateB = valueB ? new Date(valueB).getTime() : 0;

      return dateB - dateA;
    });
  }, [properties, sortBy]);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Latest', value: 'latest' },
    { label: 'Price: low to high', value: 'price-low' },
    { label: 'Price: high to low', value: 'price-high' },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProperties(true)}
            tintColor={C.lime}
          />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.brand}>MAKAZII</Text>
          <Text style={styles.tagline}>FIND YOUR PLACE</Text>

          <Text style={styles.heading}>
            Discover homes through video.
          </Text>

          <Text style={styles.subtitle}>
            Watch real property videos, explore photos, compare homes,
            and shortlist places you love.
          </Text>
        </View>

        {comparisonIds.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/compare')}
            style={({ pressed }) => [
              styles.comparisonBanner,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.comparisonBannerText}>
              <Text style={styles.comparisonBannerTitle}>
                Compare selected homes
              </Text>

              <Text style={styles.comparisonBannerSubtitle}>
                {comparisonIds.length} of 3 selected
              </Text>
            </View>

            <Text style={styles.comparisonBannerAction}>
              Compare →
            </Text>
          </Pressable>
        ) : null}

        {!loading && !error && properties.length > 0 ? (
          <View style={styles.sortSection}>
            <View style={styles.sortHeading}>
              <View>
                <Text style={styles.sortTitle}>Explore properties</Text>
                <Text style={styles.sortSubtitle}>
                  {sortedProperties.length}{' '}
                  {sortedProperties.length === 1 ? 'home' : 'homes'} available
                </Text>
              </View>

              <View style={styles.sortIcon}>
                <ArrowDownUp size={16} color={C.lime} />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortOptions}
            >
              {sortOptions.map((option) => {
                const selected = sortBy === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSortBy(option.value)}
                    style={[
                      styles.sortChip,
                      selected && styles.sortChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortChipText,
                        selected && styles.sortChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={C.lime} size="large" />
            <Text style={styles.stateText}>
              Loading verified properties…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>Could not load Discover</Text>
            <Text style={styles.stateText}>{error}</Text>

            <Pressable
              onPress={() => void loadProperties()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : sortedProperties.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>
              No verified properties yet
            </Text>

            <Text style={styles.stateText}>
              Available, verified listings will appear here when they
              are published.
            </Text>
          </View>
        ) : (
          sortedProperties.map((property) => (
            <DiscoverCard
              key={property.id}
              property={property}
              isShortlisted={isShortlisted(property.id)}
              onToggleShortlist={() => {
                void toggleShortlist(property.id);
              }}
              isComparing={isComparing(property.id)}
              onToggleCompare={() => toggleCompare(property.id)}
            />
          ))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>MAKAZII</Text>
          <Text style={styles.footerTagline}>FIND YOUR PLACE</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 130,
  },
  pageHeader: {
    marginBottom: 23,
  },
  brand: {
    color: C.lime,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  tagline: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  heading: {
    color: C.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: 19,
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  comparisonBanner: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonBannerText: {
    flex: 1,
  },
  comparisonBannerTitle: {
    color: C.dark,
    fontSize: 14,
    fontWeight: '900',
  },
  comparisonBannerSubtitle: {
    color: C.dark,
    fontSize: 12,
    marginTop: 3,
  },
  comparisonBannerAction: {
    color: C.dark,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 10,
  },
  sortSection: {
    marginBottom: 14,
  },
  sortHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sortTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '900',
  },
  sortSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },
  sortIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptions: {
    gap: 8,
    paddingRight: 2,
  },
  sortChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  sortChipText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: C.dark,
    fontWeight: '900',
  },
  card: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },
  videoFrame: {
    width: '100%',
    height: 215,
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: '#080B0C',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: C.lime,
  },
  videoBadgeText: {
    color: C.dark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  noVideo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  noVideoTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  noVideoText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },
  photosSection: {
    marginTop: 13,
  },
  photosHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  photoCount: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  photosRow: {
    gap: 8,
  },
  photoFrame: {
    width: 102,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.cardSoft,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  noPhotos: {
    color: C.muted,
    fontSize: 11,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  typePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
    marginBottom: 7,
  },
  typePillText: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '800',
  },
  propertyTitle: {
    color: C.white,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 7,
  },
  location: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  heartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  avatar: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: '#26301B',
    borderWidth: 1,
    borderColor: '#3B4925',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  avatarText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '900',
  },
  uploaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  uploaderName: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  uploadDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  uploadDate: {
    color: C.muted,
    fontSize: 10,
  },
  detailsSection: {
    marginTop: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 9,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailChipText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  viewingFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  viewingFeeLabel: {
    color: C.muted,
    fontSize: 11,
    marginLeft: 7,
    flex: 1,
  },
  viewingFeeValue: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 8,
  },
  priceBlock: {
    flex: 1,
  },
  priceLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  price: {
    color: C.lime,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderColor: C.border,
    borderWidth: 1,
    backgroundColor: C.cardSoft,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  verifiedText: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '800',
  },
  engagementSection: {
    marginTop: 12,
  },
  compareButton: {
    minHeight: 42,
    marginTop: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareButtonActive: {
    borderColor: C.lime,
    backgroundColor: '#202A15',
  },
  compareButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  compareButtonTextActive: {
    color: C.lime,
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: C.dark,
    fontSize: 13,
    fontWeight: '900',
  },
  shareButton: {
    width: 48,
    minHeight: 46,
    borderRadius: 13,
    borderColor: C.border,
    borderWidth: 1,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  stateBox: {
    minHeight: 190,
    borderRadius: 18,
    borderColor: C.border,
    borderWidth: 1,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    marginTop: 8,
  },
  stateText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  errorTitle: {
    color: C.rose,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: C.lime,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryText: {
    color: C.dark,
    fontWeight: '900',
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerBrand: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  footerTagline: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 5,
  },
});
