import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Home,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { VideoView, useVideoPlayer } from 'expo-video';

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

type BackendImage = {
  id: string;
  url: string;
  altText?: string | null;
  category?: string | null;
  sortOrder?: number | null;
  isPrimary?: boolean;
};

type BackendAmenity = {
  id: string;
  name: string;
  category?: string | null;
};

type BackendProperty = {
  id: string;
  title: string;
  description?: string | null;

  purpose: 'LONG_STAY' | 'SHORT_STAY';
  longStayType?: string | null;
  shortStayType?: string | null;

  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  inspectionFee?: number | null;
  serviceCharge?: number | null;

  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;
  stayMode?: string | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  maxGuests?: number | null;
  rooms?: number | null;
  furnishing?: string | null;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  place?: {
    id: string;
    name: string;
  } | null;

  latitude?: number | null;
  longitude?: number | null;

  available: boolean;
  verified: boolean;

  videoUrl?: string | null;
  videoMimeType?: string | null;

  images?: BackendImage[];
  amenities?: BackendAmenity[];
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: BackendProperty;
};

function PropertyDetailVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={styles.heroVideo}
      nativeControls
      contentFit="contain"
    />
  );
}

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) {
    return 'Price unavailable';
  }

  return `KSh ${Number(value).toLocaleString()}`;
}

function getLocation(property: BackendProperty): string {
  const parts = [
    property.area,
    property.town,
    property.county,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return property.place?.name || 'Kenya';
}

function getPropertyType(property: BackendProperty): string {
  if (property.purpose === 'SHORT_STAY') {
    return (
      property.shortStayType
        ?.replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
      'Short Stay'
    );
  }

  return (
    property.longStayType
      ?.replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    'Long Stay'
  );
}

function getPrimaryImage(
  property: BackendProperty,
): BackendImage | undefined {
  const images = [...(property.images ?? [])].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  return (
    images.find((image) => image.isPrimary) ??
    images[0]
  );
}

function getPriceLabel(
  property: BackendProperty,
): string {
  if (property.purpose === 'LONG_STAY') {
    return formatCurrency(property.monthlyRent);
  }

  if (property.stayMode === 'OVERNIGHT') {
    return formatCurrency(property.nightRate);
  }

  if (property.stayMode === 'DAY') {
    return formatCurrency(property.dayRate);
  }

  if (property.stayMode === 'DAY_AND_NIGHT') {
    return formatCurrency(property.dayNightRate);
  }

  return (
    formatCurrency(property.dayNightRate) !==
    'Price unavailable'
      ? formatCurrency(property.dayNightRate)
      : formatCurrency(property.nightRate)
  );
}

function getPriceSuffix(
  property: BackendProperty,
): string {
  if (property.purpose === 'LONG_STAY') {
    return '/ month';
  }

  if (property.stayMode === 'DAY') {
    return '/ day';
  }

  if (property.stayMode === 'OVERNIGHT') {
    return '/ night';
  }

  if (property.stayMode === 'DAY_AND_NIGHT') {
    return '/ day + night';
  }

  return '/ stay';
}

function DetailItem({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      {icon}

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function PropertyDetailsScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const propertyId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [property, setProperty] =
    useState<BackendProperty | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const primaryImage = useMemo(
    () => (property ? getPrimaryImage(property) : undefined),
    [property],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      if (!propertyId) {
        setError('Property ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.propertyById(
            propertyId,
          )}`,
        );

        const payload: ApiResponse =
          await response.json();

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(
            payload.message ||
              'We could not load this property.',
          );
        }

        if (!cancelled) {
          setProperty(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load property.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const handleRequestViewing = async () => {
    if (!property) {
      return;
    }

    if (property.purpose !== 'LONG_STAY') {
      Alert.alert(
        'Viewing not available',
        'Short-stay inspection and booking will use the short-stay workflow.',
      );
      return;
    }

    const token = await SecureStore.getItemAsync(
      'makazii_customer_token',
    );

    if (!token) {
      Alert.alert(
        'Login required',
        'Please log in to your MAKAZII customer account before requesting a viewing.',
        [
          {
            text: 'Log in',
            onPress: () =>
              router.push(
                '/onboarding/customer/login',
              ),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );

      return;
    }

    router.push({ pathname: '/viewing/[propertyId]', params: { propertyId: property.id } });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color={COLORS.lime}
          />

          <Text style={styles.stateText}>
            Loading property...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.errorScreen}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
            />
          </Pressable>

          <View style={styles.errorContent}>
            <View style={styles.errorIcon}>
              <Home
                size={30}
                color={COLORS.lime}
              />
            </View>

            <Text style={styles.errorTitle}>
              Property unavailable
            </Text>

            <Text style={styles.errorDescription}>
              {error ||
                'This property is no longer available.'}
            </Text>

            <Pressable
              style={styles.browseButton}
              onPress={() => router.replace('/search')}
            >
              <Text style={styles.browseButtonText}>
                Back to search
              </Text>

              <ChevronRight
                size={18}
                color={COLORS.background}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const location = getLocation(property);
  const propertyType = getPropertyType(property);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.hero}>
            {property.videoUrl ? (
              <PropertyDetailVideo uri={property.videoUrl} />
            ) : primaryImage?.url ? (
              <Image
                source={{ uri: primaryImage.url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroFallback}>
                <Home
                  size={48}
                  color={COLORS.lime}
                />
              </View>
            )}

            {!property.videoUrl ? (
              <>
                <View
                  pointerEvents="none"
                  style={styles.heroOverlay}
                />
                <View style={styles.videoUnavailableBadge}>
                  <Text style={styles.videoUnavailableText}>
                    Property video unavailable
                  </Text>
                </View>
              </>
            ) : null}

            <Pressable
              style={styles.heroBackButton}
              onPress={() => router.back()}
            >
              <ArrowLeft
                size={21}
                color={COLORS.white}
                strokeWidth={2.4}
              />
            </Pressable>

            {property.verified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck
                  size={14}
                  color={COLORS.background}
                  strokeWidth={2.4}
                />

                <Text style={styles.verifiedText}>
                  VERIFIED
                </Text>
              </View>
            )}
          </View>

          {property.images?.length ? (
            <View style={styles.supportingPhotos}>
              {property.images
                .filter((item) => item.url && item.url !== primaryImage?.url)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .slice(0, 3)
                .map((item) => (
                  <Image
                    key={item.id}
                    source={{ uri: item.url }}
                    style={styles.supportingPhoto}
                    resizeMode="cover"
                  />
                ))}
            </View>
          ) : null}

          <View style={styles.content}>
            <View style={styles.typeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {propertyType}
                </Text>
              </View>

              {property.purpose === 'LONG_STAY' && (
                <View style={styles.availableBadge}>
                  <CheckCircle2
                    size={14}
                    color={COLORS.lime}
                  />

                  <Text style={styles.availableText}>
                    AVAILABLE
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>
              {property.title}
            </Text>

            <View style={styles.locationRow}>
              <MapPin
                size={17}
                color={COLORS.lime}
                strokeWidth={2}
              />

              <Text style={styles.locationText}>
                {location}
              </Text>
            </View>

            <View style={styles.priceCard}>
              <View>
                <Text style={styles.priceLabel}>
                  {property.purpose === 'LONG_STAY'
                    ? 'MONTHLY RENT'
                    : 'STAY PRICE'}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    {getPriceLabel(property)}
                  </Text>

                  <Text style={styles.priceSuffix}>
                    {getPriceSuffix(property)}
                  </Text>
                </View>
              </View>

              {property.purpose === 'LONG_STAY' &&
                property.viewingFee != null &&
                property.viewingFee > 0 ? (
                  <View style={styles.viewingFee}>
                    <Text style={styles.viewingFeeLabel}>
                      MAKAZII viewing fee
                    </Text>
                    <Text style={styles.viewingFeeValue}>
                      {formatCurrency(property.viewingFee)}
                    </Text>
                  </View>
                ) : property.purpose === 'SHORT_STAY' &&
                  property.inspectionFee != null &&
                  property.inspectionFee > 0 ? (
                  <View style={styles.viewingFee}>
                    <Text style={styles.viewingFeeLabel}>
                      MAKAZII inspection fee
                    </Text>
                    <Text style={styles.viewingFeeValue}>
                      {formatCurrency(property.inspectionFee)}
                    </Text>
                  </View>
                ) : null}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>
                Property details
              </Text>

              <View style={styles.detailsGrid}>
                {property.bedrooms != null &&
                  property.bedrooms > 0 && (
                    <DetailItem
                      icon={
                        <BedDouble
                          size={18}
                          color={COLORS.lime}
                        />
                      }
                      value={`${property.bedrooms} ${
                        property.bedrooms === 1
                          ? 'Bedroom'
                          : 'Bedrooms'
                      }`}
                    />
                  )}

                {property.bathrooms != null &&
                  property.bathrooms > 0 && (
                    <DetailItem
                      icon={
                        <Bath
                          size={18}
                          color={COLORS.lime}
                        />
                      }
                      value={`${property.bathrooms} ${
                        property.bathrooms === 1
                          ? 'Bathroom'
                          : 'Bathrooms'
                      }`}
                    />
                  )}

                {property.beds != null &&
                  property.beds > 0 && (
                    <DetailItem
                      icon={
                        <BedDouble
                          size={18}
                          color={COLORS.lime}
                        />
                      }
                      value={`${property.beds} ${
                        property.beds === 1
                          ? 'Bed'
                          : 'Beds'
                      }`}
                    />
                  )}

                {property.maxGuests != null &&
                  property.maxGuests > 0 && (
                    <DetailItem
                      icon={
                        <Users
                          size={18}
                          color={COLORS.lime}
                        />
                      }
                      value={`Up to ${property.maxGuests} ${
                        property.maxGuests === 1
                          ? 'Guest'
                          : 'Guests'
                      }`}
                    />
                  )}

                {property.rooms != null &&
                  property.rooms > 0 && (
                    <DetailItem
                      icon={
                        <Home
                          size={18}
                          color={COLORS.lime}
                        />
                      }
                      value={`${property.rooms} ${
                        property.rooms === 1
                          ? 'Room'
                          : 'Rooms'
                      }`}
                    />
                  )}
              </View>
            </View>

            {property.description?.trim() && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  About this property
                </Text>

                <Text style={styles.description}>
                  {property.description.trim()}
                </Text>
              </View>
            )}

            {property.amenities &&
              property.amenities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Amenities
                  </Text>

                  <View style={styles.amenities}>
                    {property.amenities.map(
                      (amenity) => (
                        <View
                          key={amenity.id}
                          style={styles.amenity}
                        >
                          <CheckCircle2
                            size={15}
                            color={COLORS.lime}
                          />

                          <Text
                            style={styles.amenityText}
                          >
                            {amenity.name}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

            <View style={styles.protectionCard}>
              <ShieldCheck
                size={22}
                color={COLORS.lime}
                strokeWidth={2}
              />

              <View
                style={
                  styles.protectionContent
                }
              >
                <Text
                  style={styles.protectionTitle}
                >
                  MAKAZII verified
                </Text>

                <Text
                  style={
                    styles.protectionDescription
                  }
                >
                  Property details are verified before
                  they are made available on the
                  marketplace. MAKAZII coordinates the
                  viewing process with you.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.bottomPrice}>
            <Text style={styles.bottomPriceLabel}>
              {getPriceLabel(property)}
            </Text>

            <Text style={styles.bottomPriceSuffix}>
              {getPriceSuffix(property)}
            </Text>
          </View>

          {property.purpose === 'LONG_STAY' ? (
            <Pressable
              style={styles.viewHomeButton}
              onPress={handleRequestViewing}
            >
              <CalendarDays
                size={19}
                color={COLORS.background}
                strokeWidth={2.3}
              />

              <Text
                style={styles.viewHomeButtonText}
              >
                View Home
              </Text>
            </Pressable>
          ) : property.purpose === 'SHORT_STAY' ? (
            <View style={{ flexDirection: 'row', flex: 1, gap: 8 }}>
              <Pressable
                style={[styles.viewHomeButton, { flex: 1, paddingHorizontal: 10 }]}
                onPress={() => {
                  router.push({
                    pathname: '/inspection/[propertyId]',
                    params: { propertyId: property.id },
                  });
                }}
              >
                <CalendarDays
                  size={18}
                  color={COLORS.background}
                  strokeWidth={2.3}
                />
                <Text style={styles.viewHomeButtonText}>Check Stay</Text>
              </Pressable>

              <Pressable
                style={[styles.viewHomeButton, { flex: 1, paddingHorizontal: 10 }]}
                onPress={() => {
                  router.push({
                    pathname: '/stay-booking/[propertyId]' as any,
                    params: { propertyId: property.id },
                  });
                }}
              >
                <Text style={styles.viewHomeButtonText}>Book Stay</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingBottom: 125,
  },

  hero: {
    height: 330,
    position: 'relative',
    backgroundColor: COLORS.card,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },

  videoUnavailableBadge: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(11,15,16,0.88)',
  },

  videoUnavailableText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  supportingPhotos: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

  supportingPhoto: {
    flex: 1,
    height: 82,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
  },

  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  heroBackButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  verifiedBadge: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.lime,
  },

  verifiedText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typeText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#17251E',
  },

  availableText: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  title: {
    color: COLORS.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },

  locationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },

  priceCard: {
    marginTop: 20,
    padding: 17,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  priceLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 5,
  },

  price: {
    color: COLORS.lime,
    fontSize: 23,
    fontWeight: '900',
  },

  priceSuffix: {
    color: COLORS.muted,
    fontSize: 12,
  },

  viewingFee: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  viewingFeeLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  viewingFeeValue: {
    marginTop: 3,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  detailsCard: {
    marginTop: 18,
    padding: 17,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  detailsGrid: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  detailItem: {
    width: '47%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
  },

  detailValue: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  section: {
    marginTop: 24,
  },

  description: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
  },

  amenities: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  amenityText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },

  protectionCard: {
    marginTop: 24,
    padding: 15,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#121D18',
    borderWidth: 1,
    borderColor: '#233C30',
  },

  protectionContent: {
    flex: 1,
  },

  protectionTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  protectionDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  bottomPrice: {
    flex: 1,
  },

  bottomPriceLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },

  bottomPriceSuffix: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 11,
  },

  viewHomeButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.lime,
  },

  viewHomeButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  stateText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
  },

  errorScreen: {
    flex: 1,
  },

  backButton: {
    margin: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -50,
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  errorTitle: {
    marginTop: 20,
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },

  errorDescription: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  browseButton: {
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.lime,
  },

  browseButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },
});
