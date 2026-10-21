import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Navigation,
  ShieldCheck,
  Sofa,
  Sparkles,
  Star,
  Users,
  Wifi,
  Zap,
  Droplets,
  Car,
  LockKeyhole,
  ShowerHead,
} from 'lucide-react-native';

import type { BackendProperty } from '@/types/backendProperty';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

import { useShortlist } from '@/context/ShortlistContext';

function formatCurrency(amount: number) {
  return `KSh ${amount.toLocaleString()}`;
}

function AmenityIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();

  if (normalized.includes('water')) {
    return <Droplets size={18} color="#D7FF5F" />;
  }

  if (normalized.includes('electric')) {
    return <Zap size={18} color="#D7FF5F" />;
  }

  if (normalized.includes('parking')) {
    return <Car size={18} color="#D7FF5F" />;
  }

  if (
    normalized.includes('wi-fi') ||
    normalized.includes('wifi')
  ) {
    return <Wifi size={18} color="#D7FF5F" />;
  }

  if (normalized.includes('shower')) {
    return <ShowerHead size={18} color="#D7FF5F" />;
  }

  if (
    normalized.includes('security') ||
    normalized.includes('cctv') ||
    normalized.includes('gate')
  ) {
    return <LockKeyhole size={18} color="#D7FF5F" />;
  }

  if (normalized.includes('furnished')) {
    return <Sofa size={18} color="#D7FF5F" />;
  }

  return <Check size={18} color="#D7FF5F" />;
}

function formatEnumLabel(value?: string | null) {
  if (!value) {
    return 'Property';
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');
}

function PropertyLoading() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.notFoundContainer}>
        <View style={styles.notFoundContent}>
          <View style={styles.notFoundIcon}>
            <MapPin size={30} color="#D7FF5F" />
          </View>

          <Text style={styles.notFoundTitle}>
            Loading property
          </Text>

          <Text style={styles.notFoundDescription}>
            Please wait while we load the latest property
            information.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function PropertyNotFound() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.notFoundContainer}>
        <TouchableOpacity
          style={styles.notFoundBackButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={21} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.notFoundContent}>
          <View style={styles.notFoundIcon}>
            <MapPin size={30} color="#D7FF5F" />
          </View>

          <Text style={styles.notFoundTitle}>
            Property not found
          </Text>

          <Text style={styles.notFoundDescription}>
            We could not find the home you selected. It may have
            been removed or is no longer available.
          </Text>

          <TouchableOpacity
            style={styles.notFoundButton}
            onPress={() => router.replace('/search')}
            activeOpacity={0.85}
          >
            <Text style={styles.notFoundButtonText}>
              Browse homes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function PropertyDetailsScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const propertyId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      if (!propertyId) {
        if (!cancelled) {
          setProperty(null);
          setLoading(false);
          setError('Property not found');
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.propertyById(propertyId)}`,
        );

        if (!response.ok) {
          throw new Error(`Property request failed: ${response.status}`);
        }

        const data = await response.json();
        const backendProperty: BackendProperty =
          data?.property ?? data?.data ?? data;

        if (!cancelled) {
          setProperty(backendProperty);
        }
      } catch (requestError) {
        console.error('Failed to load property:', requestError);
        if (!cancelled) {
          setProperty(null);
          setError('We could not load this property right now.');
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

  const [currentImage, setCurrentImage] = useState(0);

  const {
    isShortlisted,
    toggleShortlist,
  } = useShortlist();

  if (loading) {
    return <PropertyLoading />;
  }

  if (!property) {
    return <PropertyNotFound />;
  }

  const shortlisted = isShortlisted(property.id);

  const images = (property.images ?? [])
    .map((image) => image.url)
    .filter(Boolean);

  const isLongStay = property.purpose === 'LONG_STAY';
  const isShortStay = property.purpose === 'SHORT_STAY';

  const propertyType = isLongStay
    ? formatEnumLabel(property.longStayType)
    : isShortStay
      ? formatEnumLabel(property.shortStayType)
      : formatEnumLabel(property.purpose);

  const monthlyRent = property.monthlyRent ?? 0;
  const deposit = property.deposit ?? 0;
  const viewingFee = property.viewingFee ?? 0;
  const serviceCharge = property.serviceCharge ?? 0;

  const dayRate = property.dayRate ?? 0;
  const nightRate = property.nightRate ?? 0;
  const dayNightRate = property.dayNightRate ?? 0;

  const stayMode = property.stayMode
    ? formatEnumLabel(property.stayMode)
    : null;

  const placeName = property.place?.name;

  const amenities = (property.amenities ?? [])
    .map((amenity) => amenity.name)
    .filter(Boolean);

  const primaryShortStayPrice =
    property.stayMode === 'DAY'
      ? dayRate
      : property.stayMode === 'OVERNIGHT'
        ? nightRate
        : property.stayMode === 'DAY_AND_NIGHT'
          ? dayNightRate
          : dayNightRate || dayRate || nightRate;

  const safeCurrentImage =
    images.length > 0
      ? Math.min(currentImage, images.length - 1)
      : 0;

  const goToPreviousImage = () => {
    if (images.length <= 1) {
      return;
    }

    setCurrentImage((previous) =>
      previous === 0
        ? images.length - 1
        : previous - 1,
    );
  };

  const goToNextImage = () => {
    if (images.length <= 1) {
      return;
    }

    setCurrentImage((previous) =>
      previous === images.length - 1
        ? 0
        : previous + 1,
    );
  };

  /*
   * VIEWING FLOW
   *
   * The property ID is passed to the viewing request screen.
   *
   * Explore
   *   ↓
   * Property Details
   *   ↓
   * See it before you decide
   *   ↓
   * Viewing Request
   *   ↓
   * Visits
   */
  const requestViewing = () => {
    router.push({
      pathname: '/viewing/[propertyId]',
      params: {
        propertyId: property.id,
      },
    });
  };

  const handleShortlist = () => {
    toggleShortlist(property.id);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PHOTO GALLERY */}
          <View style={styles.gallery}>
            {images.length > 0 ? (
              <Image
                source={{
                  uri: images[safeCurrentImage],
                }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imageFallback}>
                <MapPin
                  size={40}
                  color="#D7FF5F"
                />

                <Text style={styles.imageFallbackText}>
                  Property image unavailable
                </Text>
              </View>
            )}

            <View style={styles.imageOverlay} />

            {/* GALLERY CONTROLS */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.roundButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <ArrowLeft
                  size={21}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roundButton,
                  shortlisted &&
                    styles.roundButtonSaved,
                ]}
                onPress={handleShortlist}
                activeOpacity={0.8}
              >
                <Heart
                  size={21}
                  color={
                    shortlisted
                      ? '#D7FF5F'
                      : '#FFFFFF'
                  }
                  fill={
                    shortlisted
                      ? '#D7FF5F'
                      : 'transparent'
                  }
                  strokeWidth={1.8}
                />
              </TouchableOpacity>
            </View>

            {/* VERIFIED BADGE */}
            {property.verified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck
                  size={15}
                  color="#0B0F10"
                />

                <Text
                  style={styles.verifiedBadgeText}
                >
                  VERIFIED
                </Text>
              </View>
            )}

            {/* PHOTO COUNTER */}
            {images.length > 0 && (
              <View style={styles.photoCounter}>
                <Text
                  style={styles.photoCounterText}
                >
                  {safeCurrentImage + 1} / {images.length}
                </Text>
              </View>
            )}

            {/* GALLERY ARROWS */}
            {images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.galleryArrow,
                    styles.galleryArrowLeft,
                  ]}
                  onPress={goToPreviousImage}
                  activeOpacity={0.8}
                >
                  <ChevronLeft
                    size={22}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.galleryArrow,
                    styles.galleryArrowRight,
                  ]}
                  onPress={goToNextImage}
                  activeOpacity={0.8}
                >
                  <ChevronRight
                    size={22}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* THUMBNAILS */}
          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.thumbnailContainer
              }
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={`${image}-${index}`}
                  onPress={() =>
                    setCurrentImage(index)
                  }
                  activeOpacity={0.85}
                  style={[
                    styles.thumbnail,
                    safeCurrentImage === index &&
                      styles.activeThumbnail,
                  ]}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* MAIN INFORMATION */}
          <View style={styles.content}>
            {/* TYPE + AVAILABILITY */}
            <View style={styles.typeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {propertyType}
                </Text>
              </View>

              {property.available && (
                <View style={styles.availableRow}>
                  <View style={styles.availableDot} />

                  <Text
                    style={styles.availableText}
                  >
                    {property.available ? 'Available now' : 'Currently unavailable'}
                  </Text>
                </View>
              )}
            </View>

            {/* TITLE */}
            <Text style={styles.title}>
              {property.title}
            </Text>

            {/* LOCATION */}
            <View style={styles.locationRow}>
              <MapPin
                size={18}
                color="#D7FF5F"
              />

              <Text style={styles.locationText}>
                {placeName
                  ? `${placeName}, ${property.area}`
                  : property.area}
                , {property.town}, {property.county}
              </Text>
            </View>

            {/* PRICE */}
            <View style={styles.priceBlock}>
              {isLongStay ? (
                <>
                  <View>
                    <Text style={styles.priceLabel}>
                      MONTHLY RENT
                    </Text>

                    <Text style={styles.price}>
                      {formatCurrency(monthlyRent)}
                    </Text>
                  </View>

                  {deposit > 0 && (
                    <View style={styles.depositBlock}>
                      <Text style={styles.priceLabel}>
                        DEPOSIT
                      </Text>

                      <Text style={styles.deposit}>
                        {formatCurrency(deposit)}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View>
                  <Text style={styles.priceLabel}>
                    {stayMode
                      ? `${stayMode.toUpperCase()} RATE`
                      : 'STAY RATE'}
                  </Text>

                  <Text style={styles.price}>
                    {primaryShortStayPrice > 0
                      ? formatCurrency(primaryShortStayPrice)
                      : 'Price on request'}
                  </Text>
                </View>
              )}
            </View>

            {/* PROPERTY STATS */}
            <View style={styles.statsCard}>
              {isLongStay ? (
                <>
                  <View style={styles.stat}>
                    <BedDouble
                      size={20}
                      color="#D7FF5F"
                    />

                    <Text style={styles.statValue}>
                      {property.bedrooms ?? '—'}
                    </Text>

                    <Text style={styles.statLabel}>
                      Bedroom
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.stat}>
                    <Bath
                      size={20}
                      color="#D7FF5F"
                    />

                    <Text style={styles.statValue}>
                      {property.bathrooms ?? '—'}
                    </Text>

                    <Text style={styles.statLabel}>
                      Bathroom
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.stat}>
                    <Sofa
                      size={20}
                      color="#D7FF5F"
                    />

                    <Text
                      style={styles.statValue}
                      numberOfLines={1}
                    >
                      {property.furnishing
                        ? formatEnumLabel(property.furnishing)
                        : '—'}
                    </Text>

                    <Text style={styles.statLabel}>
                      Furnishing
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.stat}>
                    <BedDouble
                      size={20}
                      color="#D7FF5F"
                    />

                    <Text style={styles.statValue}>
                      {property.rooms ?? '—'}
                    </Text>

                    <Text style={styles.statLabel}>
                      Rooms
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.stat}>
                    <BedDouble
                      size={20}
                      color="#D7FF5F"
                    />

                    <Text style={styles.statValue}>
                      {property.beds ?? '—'}
                    </Text>

                    <Text style={styles.statLabel}>
                      Beds
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.stat}>
                    <Users
                      size={20}
                      color="#D7FF5F"
                    />

                    <Text style={styles.statValue}>
                      {property.maxGuests ?? '—'}
                    </Text>

                    <Text style={styles.statLabel}>
                      Guests
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* SERVICE CHARGE */}
            {serviceCharge > 0 && (
              <View
                style={styles.serviceChargeRow}
              >
                <Text
                  style={
                    styles.serviceChargeLabel
                  }
                >
                  Service charge
                </Text>

                <Text
                  style={
                    styles.serviceChargeValue
                  }
                >
                  {formatCurrency(serviceCharge)}
                </Text>
              </View>
            )}

            {/* VIEWING FEE */}
            {viewingFee > 0 && (
              <View style={styles.serviceChargeRow}>
                <Text style={styles.serviceChargeLabel}>
                  Viewing fee
                </Text>

                <Text style={styles.serviceChargeValue}>
                  {formatCurrency(viewingFee)}
                </Text>
              </View>
            )}

            {/* VERIFICATION */}
            {property.verified && (
              <View
                style={styles.verificationCard}
              >
                <View
                  style={styles.verificationIcon}
                >
                  <ShieldCheck
                    size={24}
                    color="#D7FF5F"
                  />
                </View>

                <View
                  style={
                    styles.verificationTextContainer
                  }
                >
                  <Text
                    style={
                      styles.verificationTitle
                    }
                  >
                    Verified by Makazii
                  </Text>

                  <Text
                    style={
                      styles.verificationDescription
                    }
                  >
                    Our team has checked the property
                    information, location, availability
                    and listing details.
                  </Text>

      
                </View>
              </View>
            )}

            {/* DESCRIPTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={styles.sectionEyebrow}
                >
                  ABOUT THIS HOME
                </Text>

                <View style={styles.sectionLine} />
              </View>

              <Text style={styles.description}>
                {property.description}
              </Text>
            </View>

            {/* AMENITIES */}
            {amenities.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={styles.sectionEyebrow}
                  >
                    AMENITIES
                  </Text>

                  <View style={styles.sectionLine} />
                </View>

                <View style={styles.amenitiesGrid}>
                  {amenities.map(
                    (amenity, index) => (
                      <View
                        key={`${amenity}-${index}`}
                        style={styles.amenityItem}
                      >
                        <AmenityIcon
                          name={amenity}
                        />

                        <Text
                          style={styles.amenityText}
                        >
                          {amenity}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

            {/* LOCATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={styles.sectionEyebrow}
                >
                  LOCATION
                </Text>

                <View style={styles.sectionLine} />
              </View>

              <View style={styles.locationCard}>
                <View
                  style={styles.mapPlaceholder}
                >
                  <View
                    style={styles.mapGridLineOne}
                  />

                  <View
                    style={styles.mapGridLineTwo}
                  />

                  <View
                    style={styles.mapGridLineThree}
                  />

                  <View style={styles.mapPin}>
                    <MapPin
                      size={22}
                      color="#0B0F10"
                      fill="#D7FF5F"
                    />
                  </View>
                </View>

                <View
                  style={styles.locationCardBottom}
                >
                  <View
                    style={styles.locationCardText}
                  >
                    <Text
                      style={
                        styles.locationCardTitle
                      }
                    >
                      {placeName || property.area}
                    </Text>

                    <Text
                      style={
                        styles.locationCardSubtitle
                      }
                    >
                      {property.town},{' '}
                      {property.county}, Kenya
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.directionsButton}
                    activeOpacity={0.8}
                  >
                    <Navigation
                      size={16}
                      color="#D7FF5F"
                    />

                    <Text
                      style={styles.directionsText}
                    >
                      Directions
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* NEARBY */}

            {/* SEE IT BEFORE YOU DECIDE */}
            <TouchableOpacity
              style={styles.viewingInfoCard}
              onPress={requestViewing}
              activeOpacity={0.88}
            >
              <View style={styles.viewingInfoIcon}>
                <Sparkles
                  size={22}
                  color="#0B0F10"
                />
              </View>

              <View style={styles.viewingInfoText}>
                <Text
                  style={styles.viewingInfoTitle}
                >
                  See it before you decide
                </Text>

                <Text
                  style={
                    styles.viewingInfoDescription
                  }
                >
                  Request a viewing and a Makazii
                  representative will help arrange your
                  visit before you commit to the home.
                </Text>
              </View>

              <View
                style={styles.viewingInfoArrow}
              >
                <ChevronRight
                  size={21}
                  color="#0B0F10"
                  strokeWidth={2.8}
                />
              </View>
            </TouchableOpacity>

            {/* TRUST FOOTER */}
            <View style={styles.trustFooter}>
              <Star
                size={17}
                color="#D7FF5F"
              />

              <Text
                style={styles.trustFooterText}
              >
                Makazii helps you discover and arrange
                viewings for real homes across Kenya.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* PROPERTY ACTION BAR */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomPrice}>
            <Text
              style={styles.bottomPriceLabel}
            >
              {isLongStay
                ? 'MONTHLY'
                : stayMode
                  ? stayMode.toUpperCase()
                  : 'STAY'}
            </Text>

            <Text
              style={styles.bottomPriceValue}
            >
              {isLongStay
                ? formatCurrency(monthlyRent)
                : primaryShortStayPrice > 0
                  ? formatCurrency(primaryShortStayPrice)
                  : 'On request'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewingButton}
            onPress={requestViewing}
            activeOpacity={0.85}
          >
            <Text
              style={styles.viewingButtonText}
            >
              Request a Viewing
            </Text>

            <ChevronRight
              size={19}
              color="#0B0F10"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  container: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  /*
   * Space for the fixed property action bar
   * and the global MAKAZII navigation.
   */
  scrollContent: {
    paddingBottom: 235,
  },

  gallery: {
    width: '100%',
    height: 390,
    position: 'relative',
    backgroundColor: '#14191B',
  },

  mainImage: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14191B',
  },

  imageFallbackText: {
    color: '#70797B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },

  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },

  topControls: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  roundButtonSaved: {
    backgroundColor: 'rgba(215,255,95,0.10)',
    borderColor: 'rgba(215,255,95,0.30)',
  },

  verifiedBadge: {
    position: 'absolute',
    left: 20,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D7FF5F',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },

  verifiedBadgeText: {
    color: '#0B0F10',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  photoCounter: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    backgroundColor: 'rgba(11,15,16,0.78)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },

  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  galleryArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -21,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.68)',
  },

  galleryArrowLeft: {
    left: 15,
  },

  galleryArrowRight: {
    right: 15,
  },

  thumbnailContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },

  thumbnail: {
    width: 74,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242B2D',
  },

  activeThumbnail: {
    borderColor: '#D7FF5F',
    borderWidth: 2,
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  content: {
    paddingHorizontal: 20,
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  typeBadge: {
    backgroundColor: 'rgba(215,255,95,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(215,255,95,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  typeBadgeText: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D7FF5F',
  },

  availableText: {
    color: '#A6AFB1',
    fontSize: 12,
    fontWeight: '600',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 13,
    letterSpacing: -0.7,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },

  locationText: {
    flex: 1,
    color: '#A6AFB1',
    fontSize: 14,
    fontWeight: '600',
  },

  priceBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#242B2D',
  },

  priceLabel: {
    color: '#70797B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  price: {
    color: '#D7FF5F',
    fontSize: 27,
    fontWeight: '900',
  },

  depositBlock: {
    alignItems: 'flex-end',
  },

  deposit: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14191B',
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#202628',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  statLabel: {
    color: '#70797B',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#292F31',
  },

  serviceChargeRow: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#202628',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  serviceChargeLabel: {
    color: '#70797B',
    fontSize: 12,
    fontWeight: '600',
  },

  serviceChargeValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  verificationCard: {
    flexDirection: 'row',
    gap: 13,
    backgroundColor: 'rgba(215,255,95,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(215,255,95,0.18)',
    borderRadius: 14,
    padding: 15,
    marginTop: 18,
  },

  verificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,255,95,0.1)',
  },

  verificationTextContainer: {
    flex: 1,
  },

  verificationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  verificationDescription: {
    color: '#8E989A',
    fontSize: 12,
    lineHeight: 18,
  },

  verifiedMeta: {
    color: '#D7FF5F',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 7,
  },

  section: {
    marginTop: 30,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },

  sectionEyebrow: {
    color: '#D7FF5F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#242B2D',
  },

  description: {
    color: '#A6AFB1',
    fontSize: 14,
    lineHeight: 23,
  },

  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  amenityItem: {
    width: '48.5%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#202628',
    borderRadius: 10,
  },

  amenityText: {
    flex: 1,
    color: '#D8DEDF',
    fontSize: 12,
    fontWeight: '600',
  },

  locationCard: {
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#202628',
  },

  mapPlaceholder: {
    height: 175,
    backgroundColor: '#192022',
    overflow: 'hidden',
    position: 'relative',
  },

  mapGridLineOne: {
    position: 'absolute',
    width: '130%',
    height: 1,
    backgroundColor: '#2B3436',
    top: 48,
    left: -30,
    transform: [{ rotate: '12deg' }],
  },

  mapGridLineTwo: {
    position: 'absolute',
    width: '130%',
    height: 1,
    backgroundColor: '#2B3436',
    top: 115,
    left: -30,
    transform: [{ rotate: '-9deg' }],
  },

  mapGridLineThree: {
    position: 'absolute',
    width: 1,
    height: '150%',
    backgroundColor: '#2B3436',
    left: '52%',
    top: -30,
    transform: [{ rotate: '17deg' }],
  },

  mapPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7FF5F',
    borderWidth: 5,
    borderColor: 'rgba(11,15,16,0.18)',
  },

  locationCardBottom: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationCardText: {
    flex: 1,
  },

  locationCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  locationCardSubtitle: {
    color: '#70797B',
    fontSize: 12,
    marginTop: 3,
  },

  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(215,255,95,0.08)',
  },

  directionsText: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '800',
  },

  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#202628',
  },

  nearbyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14191B',
  },

  nearbyText: {
    flex: 1,
    marginLeft: 11,
  },

  nearbyName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  nearbyType: {
    color: '#70797B',
    fontSize: 11,
    marginTop: 3,
  },

  nearbyDistance: {
    color: '#A6AFB1',
    fontSize: 12,
    fontWeight: '700',
  },

  /*
   * VIEWING CTA
   *
   * This is intentionally a single clear action:
   * "See it before you decide".
   *
   * It opens the viewing request screen with
   * this property's ID.
   */
  viewingInfoCard: {
    marginTop: 30,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#D7FF5F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  viewingInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.1)',
  },

  viewingInfoText: {
    flex: 1,
  },

  viewingInfoTitle: {
    color: '#0B0F10',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },

  viewingInfoDescription: {
    color: '#263000',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
  },

  viewingInfoArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.10)',
  },

  trustFooter: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 10,
  },

  trustFooterText: {
    flex: 1,
    color: '#596264',
    fontSize: 10,
    lineHeight: 16,
  },

  /*
   * PROPERTY ACTION BAR
   *
   * This sits above the global MAKAZII tab navigation.
   */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 82,
    minHeight: 86,
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 13,
    backgroundColor: '#101516',
    borderTopWidth: 1,
    borderTopColor: '#242B2D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 20,
  },

  bottomPrice: {
    flex: 0.8,
  },

  bottomPriceLabel: {
    color: '#70797B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  bottomPriceValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  viewingButton: {
    flex: 1.5,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  viewingButtonText: {
    color: '#0B0F10',
    fontSize: 13,
    fontWeight: '900',
  },

  /* PROPERTY NOT FOUND */

  notFoundContainer: {
    flex: 1,
    backgroundColor: '#0B0F10',
    padding: 20,
  },

  notFoundBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#242B2D',
  },

  notFoundContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingBottom: 80,
  },

  notFoundIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,255,95,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(215,255,95,0.2)',
  },

  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
  },

  notFoundDescription: {
    color: '#8E989A',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },

  notFoundButton: {
    marginTop: 25,
    minHeight: 50,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notFoundButtonText: {
    color: '#0B0F10',
    fontSize: 13,
    fontWeight: '900',
  },
});
