import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ArrowLeft, CheckCircle2, MapPin, Trash2, VideoOff } from 'lucide-react-native';

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { useShortlist } from '@/context/ShortlistContext';
import type { BackendProperty } from '@/types/backendProperty';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF7777',
};

function getProperties(payload: unknown): BackendProperty[] {
  if (Array.isArray(payload)) return payload as BackendProperty[];

  if (payload && typeof payload === 'object') {
    const value = payload as {
      data?: unknown;
      properties?: unknown;
    };

    if (Array.isArray(value.properties)) {
      return value.properties as BackendProperty[];
    }

    if (Array.isArray(value.data)) {
      return value.data as BackendProperty[];
    }

    if (value.data && typeof value.data === 'object') {
      const nested = value.data as { properties?: unknown };
      if (Array.isArray(nested.properties)) {
        return nested.properties as BackendProperty[];
      }
    }
  }

  return [];
}

function getLocation(property: BackendProperty): string {
  return [
    property.area,
    property.town,
    property.county,
  ].filter((part) => typeof part === 'string' && part.trim()).join(', ')
    || property.place?.name
    || 'Location not provided';
}

function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return 'Not provided';

  return `KES ${Number(value).toLocaleString('en-KE', {
    maximumFractionDigits: 0,
  })}`;
}

function getPrice(property: BackendProperty): string {
  const purpose = (property.purpose ?? '').toLowerCase();
  const stayType = (property.shortStayType ?? '').toLowerCase();

  if (purpose.includes('short') || stayType) {
    if (property.dayNightRate != null) {
      return `${money(property.dayNightRate)} / day & night`;
    }
    if (property.nightRate != null) {
      return `${money(property.nightRate)} / night`;
    }
    if (property.dayRate != null) {
      return `${money(property.dayRate)} / day`;
    }
  }

  if (property.monthlyRent != null) {
    return `${money(property.monthlyRent)} / month`;
  }
  if (property.nightRate != null) {
    return `${money(property.nightRate)} / night`;
  }
  if (property.dayRate != null) {
    return `${money(property.dayRate)} / day`;
  }

  return 'Price not provided';
}

function ValueRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  );
}

function PropertyVideo({ uri }: { uri?: string | null }) {
  const player = useVideoPlayer(uri || null, (instance) => {
    instance.loop = true;
  });

  if (!uri) {
    return (
      <View style={styles.noVideo}>
        <VideoOff size={24} color={C.muted} />
        <Text style={styles.noVideoTitle}>No video uploaded</Text>
        <Text style={styles.noVideoText}>
          This listing does not currently have a property video.
        </Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      contentFit="cover"
    />
  );
}

function CompareCard({
  property,
  index,
  onRemove,
}: {
  property: BackendProperty;
  index: number;
  onRemove: () => void;
}) {
  const photos = (property.images ?? [])
    .filter((image) => Boolean(image.url))
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

  const amenities = property.amenities ?? [];
  const availability =
    property.available === true
      ? 'Available'
      : property.available === false
        ? 'Not available'
        : 'Not specified';

  return (
    <View style={styles.propertyCard}>
      <View style={styles.cardTop}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>HOME {index + 1}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${property.title || 'property'} from comparison`}
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeButton}
        >
          <Trash2 size={17} color={C.danger} />
        </Pressable>
      </View>

      <Text style={styles.propertyTitle}>
        {property.title || 'Untitled property'}
      </Text>

      <View style={styles.locationRow}>
        <MapPin size={15} color={C.muted} />
        <Text style={styles.locationText}>{getLocation(property)}</Text>
      </View>

      <Text style={styles.price}>{getPrice(property)}</Text>

      <View style={styles.videoSection}>
        <Text style={styles.sectionTitle}>PROPERTY VIDEO</Text>
        <PropertyVideo uri={property.videoUrl} />
      </View>

      {photos.length > 0 && (
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>
            PHOTOS · {photos.length}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>

        <ValueRow label="Bedrooms" value={property.bedrooms == null ? 'Not provided' : String(property.bedrooms)} />
        <ValueRow label="Bathrooms" value={property.bathrooms == null ? 'Not provided' : String(property.bathrooms)} />
        <ValueRow label="Rooms" value={property.rooms == null ? 'Not provided' : String(property.rooms)} />
        <ValueRow label="Beds" value={property.beds == null ? 'Not provided' : String(property.beds)} />
        <ValueRow label="Max guests" value={property.maxGuests == null ? 'Not provided' : String(property.maxGuests)} />
        <ValueRow label="Furnishing" value={property.furnishing || 'Not provided'} />
        <ValueRow label="Stay type" value={property.longStayType || property.shortStayType || property.purpose || 'Not specified'} />
        <ValueRow label="Availability" value={availability} />

        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Verification</Text>
          <View style={styles.verification}>
            <CheckCircle2
              size={15}
              color={property.verified === true ? C.lime : C.muted}
            />
            <Text style={styles.valueText}>
              {property.verified === true
                ? 'Verified'
                : property.verified === false
                  ? 'Not verified'
                  : 'Not specified'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.amenitiesSection}>
        <Text style={styles.sectionTitle}>AMENITIES</Text>
        {amenities.length > 0 ? (
          <View style={styles.amenities}>
            {amenities.map((amenity) => (
              <View key={amenity.id} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.mutedText}>
            No amenities have been provided for this listing.
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => router.push({
          pathname: '/property/[id]',
          params: { id: property.id },
        })}
        style={styles.viewButton}
      >
        <Text style={styles.viewButtonText}>View full property</Text>
      </Pressable>
    </View>
  );
}

export default function CompareScreen() {
  const {
    comparisonIds,
    removeFromComparison,
    clearComparison,
  } = useShortlist();

  const [properties, setProperties] = useState<BackendProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.properties}`,
        { headers: { Accept: 'application/json' } },
      );

      if (!response.ok) {
        throw new Error('Unable to load properties for comparison. Please try again.');
      }

      const payload: unknown = await response.json();
      setProperties(getProperties(payload));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load properties right now.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProperties();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadProperties]);

  const selectedProperties = useMemo(() => {
    const byId = new Map(properties.map((property) => [property.id, property]));
    return comparisonIds
      .slice(0, 3)
      .map((id) => byId.get(id))
      .filter((property): property is BackendProperty => Boolean(property));
  }, [properties, comparisonIds]);

  const missingCount = comparisonIds.length - selectedProperties.length;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={21} color={C.white} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>MAKAZII · DECIDE BETTER</Text>
          <Text style={styles.heading}>Compare homes</Text>
          <Text style={styles.subheading}>
            {comparisonIds.length} of 3 homes selected
          </Text>
        </View>

        {comparisonIds.length > 0 && (
          <Pressable
            onPress={clearComparison}
            accessibilityRole="button"
            accessibilityLabel="Clear comparison"
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={C.lime} size="large" />
          <Text style={styles.mutedText}>Loading real property details…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Could not load homes</Text>
          <Text style={styles.mutedText}>{error}</Text>
          <Pressable onPress={() => void loadProperties()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : comparisonIds.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No homes selected</Text>
          <Text style={styles.mutedText}>
            Add up to three homes from Discover or Shortlist to compare them here.
          </Text>
          <Pressable onPress={() => router.replace('/discover')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Explore homes</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {missingCount > 0 && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                {missingCount} selected {missingCount === 1 ? 'listing is' : 'listings are'} not present in the current property response. It may have been removed or is no longer available.
              </Text>
            </View>
          )}

          {selectedProperties.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.stateTitle}>Selected homes not found</Text>
              <Text style={styles.mutedText}>
                Refresh the property list or remove these selections and choose other homes.
              </Text>
              <Pressable onPress={clearComparison} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Clear selection</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
              snapToAlignment="start"
              decelerationRate="fast"
            >
              {selectedProperties.map((property, index) => (
                <CompareCard
                  key={property.id}
                  property={property}
                  index={index}
                  onRemove={() => removeFromComparison(property.id)}
                />
              ))}
            </ScrollView>
          )}

          <Text style={styles.footerNote}>
            Compare only the details supplied by each listing. “Not provided” means that information was not included in the property data.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: C.lime,
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: '900',
  },
  heading: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  subheading: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },
  clearButton: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  clearText: {
    color: C.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingTop: 17,
    paddingBottom: 35,
  },
  cardsRow: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 13,
  },
  propertyCard: {
    width: 310,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#202A15',
  },
  numberText: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyTitle: {
    color: C.white,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
  },
  locationText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  price: {
    color: C.lime,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 12,
  },
  videoSection: {
    marginTop: 20,
  },
  sectionTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  video: {
    width: '100%',
    height: 170,
    borderRadius: 13,
    backgroundColor: '#080A0B',
    overflow: 'hidden',
  },
  noVideo: {
    minHeight: 130,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  noVideoTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  noVideoText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  photoSection: {
    marginTop: 18,
  },
  photo: {
    width: 110,
    height: 85,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: C.cardSoft,
  },
  details: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  valueLabel: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
  },
  valueText: {
    flex: 1,
    color: C.white,
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '700',
  },
  verification: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 5,
  },
  amenitiesSection: {
    marginTop: 18,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  amenityChip: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
  },
  amenityText: {
    color: C.white,
    fontSize: 11,
  },
  mutedText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  viewButton: {
    marginTop: 20,
    minHeight: 45,
    borderRadius: 12,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    color: C.background,
    fontSize: 13,
    fontWeight: '900',
  },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 12,
    minHeight: 45,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: C.background,
    fontSize: 13,
    fontWeight: '900',
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.lime,
  },
  retryText: {
    color: C.lime,
    fontWeight: '800',
  },
  notice: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: C.card,
  },
  noticeText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  footerNote: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
