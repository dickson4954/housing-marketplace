import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { useShortlist } from '@/context/ShortlistContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BackendProperty, BackendPropertyAmenity } from '@/types/backendProperty';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  dark: '#101415',
  rose: '#FF6B81',
};

type Purpose = 'LONG_STAY' | 'SHORT_STAY';


type Property = BackendProperty;

type County = {
  id: string;
  name: string;
  code?: string | null;
};

type Constituency = {
  id: string;
  name: string;
  countyId?: string;
};

type Ward = {
  id: string;
  name: string;
  constituencyId?: string;
};

type Place = {
  id: string;
  name: string;
  countyId?: string;
};

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'newest';

type SelectOption = {
  id: string;
  label: string;
};

type FilterState = {
  purpose: Purpose;

  countyId: string;
  countyName: string;

  constituencyId: string;
  constituencyName: string;

  wardId: string;
  wardName: string;

  placeId: string;
  placeName: string;

  propertyType: string;

  minPrice: string;
  maxPrice: string;

  bedrooms: string;
  bathrooms: string;

  furnishing: string;

  amenities: string[];

  shortStayType: string;
  stayMode: string;

  guests: string;
  rooms: string;

  checkIn: string;
  checkOut: string;
};

const EMPTY_FILTERS: FilterState = {
  purpose: 'LONG_STAY',

  countyId: '',
  countyName: '',

  constituencyId: '',
  constituencyName: '',

  wardId: '',
  wardName: '',

  placeId: '',
  placeName: '',

  propertyType: '',

  minPrice: '',
  maxPrice: '',

  bedrooms: '',
  bathrooms: '',

  furnishing: '',

  amenities: [],

  shortStayType: '',
  stayMode: '',

  guests: '',
  rooms: '',

  checkIn: '',
  checkOut: '',
};

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: 'Studio' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4+' },
];

const BATHROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
];

const FURNISHING_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi furnished' },
  { value: 'FURNISHED', label: 'Furnished' },
];

const SHORT_STAY_TYPES = [
  { value: '', label: 'Any' },
  { value: 'BNB', label: 'B&B' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'APARTMENT', label: 'Apartment' },
];

const STAY_MODES = [
  { value: '', label: 'Any' },
  { value: 'DAY', label: 'Day' },
  { value: 'NIGHT', label: 'Night' },
  { value: 'DAY_AND_NIGHT', label: 'Day & night' },
];

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Price on request';
  }

  return `KSh ${Number(value).toLocaleString('en-KE')}`;
}

function cleanLabel(value?: string | null) {
  if (!value) return '';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPropertyType(property: Property) {
  if (property.purpose === 'SHORT_STAY') {
    return cleanLabel(property.shortStayType) || 'Short stay';
  }

  if (property.longStayType) {
    return cleanLabel(property.longStayType);
  }

  if (property.bedrooms === 0) {
    return 'Studio';
  }

  if (property.bedrooms === 1) {
    return '1 Bedroom';
  }

  if (property.bedrooms) {
    return `${property.bedrooms} Bedrooms`;
  }

  return 'Home';
}

function getLocation(property: Property) {
  return [
    property.place?.name,
    property.area,
    property.town,
    property.county,
  ]
    .filter(Boolean)
    .filter(
      (value, index, array) => array.indexOf(value) === index,
    )
    .join(', ');
}

function getPrimaryImage(property: Property) {
  if (!property.images?.length) {
    return null;
  }

  const primary = property.images.find((image) => image.isPrimary);

  if (primary?.url) {
    return primary.url;
  }

  const sorted = [...property.images].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  );

  return sorted[0]?.url || null;
}

function getPrice(property: Property) {
  if (property.purpose === 'SHORT_STAY') {
    if (property.dayNightRate) {
      return `${formatMoney(property.dayNightRate)} / stay`;
    }

    if (property.nightRate) {
      return `${formatMoney(property.nightRate)} / night`;
    }

    if (property.dayRate) {
      return `${formatMoney(property.dayRate)} / day`;
    }
  }

  if (property.monthlyRent) {
    return `${formatMoney(property.monthlyRent)} / month`;
  }

  return 'Price on request';
}

function getComparablePrice(property: Property) {
  if (property.purpose === 'SHORT_STAY') {
    return (
      property.nightRate ||
      property.dayRate ||
      property.dayNightRate ||
      Number.MAX_SAFE_INTEGER
    );
  }

  return property.monthlyRent || Number.MAX_SAFE_INTEGER;
}

function getBedroomLabel(value: string) {
  if (!value) return '';

  if (value === '0') {
    return 'Studio';
  }

  if (value === '4') {
    return '4+ bedrooms';
  }

  return `${value} bedroom${value === '1' ? '' : 's'}`;
}

function parseApiList<T>(payload: any): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  const data = payload?.data;

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  for (const key of [
    "counties",
    "constituencies",
    "wards",
    "places",
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>

      {subtitle ? (
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceChip,
        selected && styles.choiceChipSelected,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? COLORS.dark : COLORS.muted}
        />
      ) : null}

      <Text
        style={[
          styles.choiceChipText,
          selected && styles.choiceChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PropertyVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={styles.propertyVideo}
      nativeControls
      contentFit="cover"
    />
  );
}

function PropertyCard({
  property,
  isShortStay,
  isShortlisted,
  onToggleShortlist,
  onPress,
}: {
  property: Property;
  isShortStay: boolean;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  onPress: () => void;
}) {
  const image = getPrimaryImage(property);

  return (
    <Pressable
      style={styles.propertyCard}
      onPress={onPress}
    >
      <View style={styles.propertyImageWrap}>
        {property.videoUrl ? (
          <PropertyVideo uri={property.videoUrl} />
        ) : image ? (
          <Image
            source={{ uri: image }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="home-outline"
              size={42}
              color={COLORS.muted}
            />
            <Text style={styles.placeholderText}>MAKAZII</Text>
          </View>
        )}

        {!property.videoUrl ? (
          <View style={styles.videoUnavailableBadge}>
            <Ionicons name="videocam-off-outline" size={14} color={COLORS.white} />
            <Text style={styles.videoUnavailableText}>Property video unavailable</Text>
          </View>
        ) : null}

        <View style={styles.imageTopRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {formatPropertyType(property)}
            </Text>
          </View>

          <Pressable
            style={styles.heartButton}
            onPress={(event) => {
              event.stopPropagation();
              onToggleShortlist();
            }}
          >
            <Ionicons
              name={
                isShortlisted
                  ? 'heart'
                  : 'heart-outline'
              }
              size={20}
              color={
                isShortlisted
                  ? COLORS.rose
                  : COLORS.white
              }
            />
          </Pressable>
        </View>

        {property.verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={COLORS.lime}
            />

            <Text style={styles.verifiedText}>
              Verified
            </Text>
          </View>
        ) : null}
      </View>

      {property.videoUrl && property.images?.length ? (
        <View style={styles.supportingPhotos}>
          {property.images
            .filter((item) => item.url && item.url !== image)
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

      <View style={styles.propertyContent}>
        <View style={styles.propertyPriceRow}>
          <Text
            style={styles.propertyPrice}
            numberOfLines={1}
          >
            {getPrice(property)}
          </Text>
        </View>

        <Text
          style={styles.propertyTitle}
          numberOfLines={2}
        >
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color={COLORS.muted}
          />

          <Text
            style={styles.locationText}
            numberOfLines={1}
          >
            {getLocation(property) || 'Kenya'}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          {!isShortStay && property.bedrooms !== null &&
          property.bedrooms !== undefined ? (
            <DetailItem
              icon="bed-outline"
              label={
                property.bedrooms === 0
                  ? 'Studio'
                  : `${property.bedrooms} bed`
              }
            />
          ) : null}

          {property.bathrooms !== null &&
          property.bathrooms !== undefined ? (
            <DetailItem
              icon="water-outline"
              label={`${property.bathrooms} bath`}
            />
          ) : null}

          {isShortStay &&
          property.rooms !== null &&
          property.rooms !== undefined ? (
            <DetailItem
              icon="business-outline"
              label={`${property.rooms} rooms`}
            />
          ) : null}

          {isShortStay &&
          property.maxGuests !== null &&
          property.maxGuests !== undefined ? (
            <DetailItem
              icon="people-outline"
              label={`${property.maxGuests} guests`}
            />
          ) : null}
        </View>

        <View style={styles.cardBottomRow}>
          <Text
            style={styles.viewingFee}
            numberOfLines={1}
          >
            {isShortStay
              ? property.inspectionFee != null
                ? `Inspection ${formatMoney(property.inspectionFee)}`
                : 'Inspection fee unavailable'
              : property.viewingFee != null
                ? `Viewing ${formatMoney(property.viewingFee)}`
                : 'Request a viewing'}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={COLORS.lime}
          />
        </View>
      </View>
    </Pressable>
  );
}

function DetailItem({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Ionicons
        name={icon}
        size={14}
        color={COLORS.muted}
      />

      <Text style={styles.detailText}>
        {label}
      </Text>
    </View>
  );
}

function SelectBox({
  label,
  value,
  placeholder,
  disabled,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>{label}</Text>

      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.selectBox,
          disabled && styles.selectBoxDisabled,
        ]}
      >
        <Text
          style={[
            styles.selectValue,
            !value && styles.selectPlaceholder,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={18}
          color={
            disabled
              ? '#596163'
              : COLORS.muted
          }
        />
      </Pressable>
    </View>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{
    purpose?: string;
    query?: string;
    county?: string;
    longStayType?: string;
    propertyType?: string;
    bedrooms?: string;
  }>();

  const { shortlistedIds, toggleShortlist } =
    useShortlist();

  const [properties, setProperties] = useState<
    Property[]
  >([]);

  const [counties, setCounties] = useState<County[]>(
    [],
  );

  const [constituencies, setConstituencies] =
    useState<Constituency[]>([]);

  const [wards, setWards] = useState<Ward[]>([]);

  const [places, setPlaces] = useState<Place[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingGeography, setLoadingGeography] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [draftFilters, setDraftFilters] =
    useState<FilterState>(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);

  const [showFilters, setShowFilters] =
    useState(false);

  const [sort, setSort] =
    useState<SortOption>('recommended');

  const [selectionModal, setSelectionModal] =
    useState<{
      type:
        | 'county'
        | 'constituency'
        | 'ward'
        | 'place';
      title: string;
    } | null>(null);

  const [apiError, setApiError] =
    useState<string | null>(null);

  const [initializedParams, setInitializedParams] =
    useState(false);

  /*
   * -----------------------------
   * Load properties
   * -----------------------------
   */

  const loadProperties = useCallback(async (
    showSpinner = true,
  ) => {

    try {
      if (showSpinner) {
        setLoading(true);
      }

      setApiError(null);

      const response = await fetch(
        `${API_BASE_URL}/properties`,
      );

      if (!response.ok) {
        throw new Error(
          `Properties request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      const list = parseApiList<Property>(
        payload,
      );

      setProperties(
        list.filter(
          (property) =>
            property.available === true &&
            property.verified === true,
        ),
      );
    } catch (error) {
      console.error(
        'MAKAZII properties error:',
        error,
      );

      setApiError(
        'Unable to load properties right now.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * -----------------------------
   * Geography
   * -----------------------------
   */

  const loadCounties = useCallback(async () => {

    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.geographyCounties}`,
      );

      if (!response.ok) {
        throw new Error(
          `Counties request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      setCounties(
        parseApiList<County>(payload),
      );
    } catch (error) {
      console.error(
        'MAKAZII counties error:',
        error,
      );
    }
  }, []);

  const loadConstituencies = useCallback(async (
    countyId: string,
  ) => {

    if (!countyId) {
      setConstituencies([]);
      return;
    }

    try {
      setLoadingGeography(true);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.geographyConstituencies(
          countyId,
        )}`,
      );

      if (!response.ok) {
        throw new Error(
          `Constituencies request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      setConstituencies(
        parseApiList<Constituency>(payload),
      );
    } catch (error) {
      console.error(
        'MAKAZII constituencies error:',
        error,
      );

      setConstituencies([]);
    } finally {
      setLoadingGeography(false);
    }
  }, []);

  const loadWards = useCallback(async (
    constituencyId: string,
  ) => {

    if (!constituencyId) {
      setWards([]);
      return;
    }

    try {
      setLoadingGeography(true);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.geographyWards(
          constituencyId,
        )}`,
      );

      if (!response.ok) {
        throw new Error(
          `Wards request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      setWards(
        parseApiList<Ward>(payload),
      );
    } catch (error) {
      console.error(
        'MAKAZII wards error:',
        error,
      );

      setWards([]);
    } finally {
      setLoadingGeography(false);
    }
  }, []);

  const loadPlaces = useCallback(async (
    countyId: string,
  ) => {

    if (!countyId) {
      setPlaces([]);
      return;
    }

    try {
      setLoadingGeography(true);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.geographyPlaces(
          countyId,
        )}`,
      );

      if (!response.ok) {
        throw new Error(
          `Places request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      setPlaces(
        parseApiList<Place>(payload),
      );
    } catch (error) {
      console.error(
        'MAKAZII places error:',
        error,
      );

      setPlaces([]);
    } finally {
      setLoadingGeography(false);
    }
  }, []);

  /*
   * -----------------------------
   * Initial loading
   * -----------------------------
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProperties();
      void loadCounties();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadProperties, loadCounties]);

  /*
   * -----------------------------
   * Home -> Search parameters
   * -----------------------------
   */

  useEffect(() => {
    if (initializedParams) {
      return;
    }

    const timer = setTimeout(() => {
      const incomingPurpose =
        params.purpose === 'SHORT_STAY'
          ? 'SHORT_STAY'
          : 'LONG_STAY';

      const incomingQuery =
        typeof params.query === 'string'
          ? params.query
          : '';

      const incomingCounty =
        typeof params.county === 'string'
          ? params.county
          : '';

      const incomingLongStayType =
        typeof params.longStayType === 'string'
          ? params.longStayType
          : '';

      const incomingPropertyType =
        typeof params.propertyType === 'string'
          ? params.propertyType
          : '';

      const incomingBedrooms =
        typeof params.bedrooms === 'string'
          ? params.bedrooms
          : '';

      setSearchText(incomingQuery);

      const nextFilters: FilterState = {
        ...EMPTY_FILTERS,
        purpose: incomingPurpose,
        propertyType:
          incomingPropertyType ||
          incomingLongStayType,
        bedrooms: incomingBedrooms,
      };

      if (incomingCounty) {
        const matchingCounty =
          counties.find(
            (county) =>
              county.name.toLowerCase() ===
                incomingCounty.toLowerCase() ||
              county.id === incomingCounty,
          );

        if (matchingCounty) {
          nextFilters.countyId =
            matchingCounty.id;
          nextFilters.countyName =
            matchingCounty.name;
        }
      }

      setDraftFilters(nextFilters);
      setAppliedFilters(nextFilters);
      setInitializedParams(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    counties,
    initializedParams,
    params.bedrooms,
    params.county,
    params.longStayType,
    params.propertyType,
    params.purpose,
    params.query,
  ]);

  /*
   * Load dependent geography whenever
   * the county/constituency changes.
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!draftFilters.countyId) {
        setConstituencies([]);
        setPlaces([]);
        return;
      }

      void loadConstituencies(draftFilters.countyId);
      void loadPlaces(draftFilters.countyId);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    draftFilters.countyId,
    loadConstituencies,
    loadPlaces,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!draftFilters.constituencyId) {
        setWards([]);
        return;
      }

      void loadWards(draftFilters.constituencyId);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    draftFilters.constituencyId,
    loadWards,
  ]);

  /*
   * -----------------------------
   * Amenities from backend data
   * -----------------------------
   */

  const availableAmenities =
    useMemo(() => {
      const map = new Map<
        string,
        BackendPropertyAmenity
      >();

      properties.forEach((property) => {
        property.amenities?.forEach(
          (amenity) => {
            const key =
              amenity.id || amenity.name;

            if (!map.has(key)) {
              map.set(key, amenity);
            }
          },
        );
      });

      return Array.from(map.values()).sort(
        (a, b) =>
          a.name.localeCompare(b.name),
      );
    }, [properties]);

  /*
   * -----------------------------
   * Quick chips
   * -----------------------------
   */

  const quickLocations = useMemo(() => {
    return counties.slice(0, 8);
  }, [counties]);

  const quickPropertyTypes =
    useMemo(() => {
      const map = new Map<
        string,
        string
      >();

      properties.forEach((property) => {
        if (
          property.purpose !==
          appliedFilters.purpose
        ) {
          return;
        }

        const value =
          property.purpose ===
          'SHORT_STAY'
            ? property.shortStayType
            : property.longStayType;

        if (value) {
          map.set(value, cleanLabel(value));
        }
      });

      return Array.from(
        map.entries(),
      )
        .slice(0, 8)
        .map(([value, label]) => ({
          value,
          label,
        }));
    }, [
      appliedFilters.purpose,
      properties,
    ]);

  /*
   * -----------------------------
   * Search filtering
   * -----------------------------
   */

  const filteredProperties =
    useMemo(() => {
      const query =
        searchText.trim().toLowerCase();

      let result = properties.filter(
        (property) => {
          if (
            property.purpose !==
            appliedFilters.purpose
          ) {
            return false;
          }

          /*
           * Free-text search
           */
          if (query) {
            const searchable = [
              property.title,
              property.description,
              property.county,
              property.town,
              property.area,
              property.place?.name,
              property.longStayType,
              property.shortStayType,
              ...(property.amenities || []).map(
                (amenity) => amenity.name,
              ),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            if (!searchable.includes(query)) {
              return false;
            }
          }

          /*
           * County
           */
          if (
            appliedFilters.countyName &&
            (
              property.county || ''
            ).toLowerCase() !==
              appliedFilters.countyName.toLowerCase()
          ) {
            return false;
          }

          /*
           * Place
           */
          if (
            appliedFilters.placeName &&
            (
              property.place?.name || ''
            ).toLowerCase() !==
              appliedFilters.placeName.toLowerCase()
          ) {
            return false;
          }

          /*
           * Property type
           */
          if (
            appliedFilters.propertyType
          ) {
            const selected =
              appliedFilters.propertyType.toLowerCase();

            const longType =
              (
                property.longStayType ||
                ''
              ).toLowerCase();

            const shortType =
              (
                property.shortStayType ||
                ''
              ).toLowerCase();

            const formattedType =
              formatPropertyType(
                property,
              ).toLowerCase();

            if (
              !longType.includes(selected) &&
              !shortType.includes(selected) &&
              !formattedType.includes(selected)
            ) {
              return false;
            }
          }

          /*
           * Price
           */
          const price =
            getComparablePrice(property);

          if (
            appliedFilters.minPrice &&
            price <
              Number(
                appliedFilters.minPrice,
              )
          ) {
            return false;
          }

          if (
            appliedFilters.maxPrice &&
            price >
              Number(
                appliedFilters.maxPrice,
              )
          ) {
            return false;
          }

          /*
           * Bedrooms
           */
          if (
            appliedFilters.bedrooms
          ) {
            const selectedBedrooms =
              Number(
                appliedFilters.bedrooms,
              );

            const bedrooms =
              property.bedrooms ?? 0;

            if (
              appliedFilters.bedrooms ===
              '4'
            ) {
              if (bedrooms < 4) {
                return false;
              }
            } else if (
              bedrooms !==
              selectedBedrooms
            ) {
              return false;
            }
          }

          /*
           * Bathrooms
           */
          if (
            appliedFilters.bathrooms
          ) {
            const selectedBathrooms =
              Number(
                appliedFilters.bathrooms,
              );

            const bathrooms =
              property.bathrooms ?? 0;

            if (
              bathrooms <
              selectedBathrooms
            ) {
              return false;
            }
          }

          /*
           * Furnishing
           */
          if (
            appliedFilters.furnishing &&
            property.furnishing !==
              appliedFilters.furnishing
          ) {
            return false;
          }

          /*
           * Amenities
           */
          if (
            appliedFilters.amenities.length
          ) {
            const propertyAmenityNames =
              (
                property.amenities || []
              ).map((amenity) =>
                amenity.name.toLowerCase(),
              );

            const hasAllAmenities =
              appliedFilters.amenities.every(
                (selectedAmenity) =>
                  propertyAmenityNames.includes(
                    selectedAmenity.toLowerCase(),
                  ),
              );

            if (!hasAllAmenities) {
              return false;
            }
          }

          /*
           * Short stay type
           */
          if (
            appliedFilters.shortStayType &&
            property.shortStayType !==
              appliedFilters.shortStayType
          ) {
            return false;
          }

          /*
           * Stay mode
           */
          if (
            appliedFilters.stayMode &&
            property.stayMode !==
              appliedFilters.stayMode
          ) {
            return false;
          }

          /*
           * Guests
           */
          if (
            appliedFilters.guests
          ) {
            const guests =
              property.maxGuests ?? 0;

            if (
              guests <
              Number(
                appliedFilters.guests,
              )
            ) {
              return false;
            }
          }

          /*
           * Rooms
           */
          if (
            appliedFilters.rooms
          ) {
            const rooms =
              property.rooms ?? 0;

            if (
              rooms <
              Number(
                appliedFilters.rooms,
              )
            ) {
              return false;
            }
          }

          return true;
        },
      );

      result = [...result];

      if (sort === 'price_low') {
        result.sort(
          (a, b) =>
            getComparablePrice(a) -
            getComparablePrice(b),
        );
      }

      if (sort === 'price_high') {
        result.sort(
          (a, b) =>
            getComparablePrice(b) -
            getComparablePrice(a),
        );
      }

      if (sort === 'newest') {
        /*
         * The customer API intentionally does not
         * expose internal timestamps, so preserve
         * backend order for newest/recommended.
         */
        result = result;
      }

      return result;
    }, [
      appliedFilters,
      properties,
      searchText,
      sort,
    ]);

  /*
   * -----------------------------
   * Filter actions
   * -----------------------------
   */

  function updateDraft(
    changes: Partial<FilterState>,
  ) {
    setDraftFilters((current) => ({
      ...current,
      ...changes,
    }));
  }

  function selectPurpose(
    purpose: Purpose,
  ) {
    setDraftFilters({
      ...EMPTY_FILTERS,
      purpose,
    });

    setAppliedFilters({
      ...EMPTY_FILTERS,
      purpose,
    });
  }

  function selectCounty(
    county: County,
  ) {
    updateDraft({
      countyId: county.id,
      countyName: county.name,

      constituencyId: '',
      constituencyName: '',

      wardId: '',
      wardName: '',

      placeId: '',
      placeName: '',
    });

    setSelectionModal(null);
  }

  function selectConstituency(
    constituency: Constituency,
  ) {
    updateDraft({
      constituencyId:
        constituency.id,
      constituencyName:
        constituency.name,

      wardId: '',
      wardName: '',
    });

    setSelectionModal(null);
  }

  function selectWard(ward: Ward) {
    updateDraft({
      wardId: ward.id,
      wardName: ward.name,
    });

    setSelectionModal(null);
  }

  function selectPlace(place: Place) {
    updateDraft({
      placeId: place.id,
      placeName: place.name,
    });

    setSelectionModal(null);
  }

  function applyFilters() {
    setAppliedFilters({
      ...draftFilters,
    });

    setShowFilters(false);
  }

  function resetFilters() {
    const reset: FilterState = {
      ...EMPTY_FILTERS,
      purpose:
        appliedFilters.purpose,
    };

    setDraftFilters(reset);
    setAppliedFilters(reset);
    setSearchText('');
  }

  function removeFilter(
    key: keyof FilterState,
  ) {
    const next = {
      ...appliedFilters,
    };

    if (
      key === 'purpose'
    ) {
      return;
    }

    if (
      key === 'amenities'
    ) {
      next.amenities = [];
    } else {
      (next as any)[key] = '';
    }

    setAppliedFilters(next);
    setDraftFilters(next);
  }

  function toggleAmenity(
    amenityName: string,
  ) {
    setDraftFilters((current) => {
      const exists =
        current.amenities.includes(
          amenityName,
        );

      return {
        ...current,
        amenities: exists
          ? current.amenities.filter(
              (item) =>
                item !== amenityName,
            )
          : [
              ...current.amenities,
              amenityName,
            ],
      };
    });
  }

  function goToProperty(
    propertyId: string,
  ) {
    router.push(
      `/properties/${propertyId}` as any,
    );
  }

  function isShortlisted(
    propertyId: string,
  ) {
    return shortlistedIds.includes(propertyId);
  }

  /*
   * -----------------------------
   * Active filter chips
   * -----------------------------
   */

  const activeFilterChips =
    useMemo(() => {
      const chips: {
        key: keyof FilterState;
        label: string;
      }[] = [];

      if (
        appliedFilters.countyName
      ) {
        chips.push({
          key: 'countyName',
          label:
            appliedFilters.countyName,
        });
      }

      if (
        appliedFilters.constituencyName
      ) {
        chips.push({
          key: 'constituencyName',
          label:
            appliedFilters.constituencyName,
        });
      }

      if (
        appliedFilters.wardName
      ) {
        chips.push({
          key: 'wardName',
          label:
            appliedFilters.wardName,
        });
      }

      if (
        appliedFilters.placeName
      ) {
        chips.push({
          key: 'placeName',
          label:
            appliedFilters.placeName,
        });
      }

      if (
        appliedFilters.propertyType
      ) {
        chips.push({
          key: 'propertyType',
          label: cleanLabel(
            appliedFilters.propertyType,
          ),
        });
      }

      if (
        appliedFilters.bedrooms
      ) {
        chips.push({
          key: 'bedrooms',
          label:
            getBedroomLabel(
              appliedFilters.bedrooms,
            ),
        });
      }

      if (
        appliedFilters.bathrooms
      ) {
        chips.push({
          key: 'bathrooms',
          label: `${appliedFilters.bathrooms}+ bathrooms`,
        });
      }

      if (
        appliedFilters.furnishing
      ) {
        chips.push({
          key: 'furnishing',
          label: cleanLabel(
            appliedFilters.furnishing,
          ),
        });
      }

      if (
        appliedFilters.minPrice
      ) {
        chips.push({
          key: 'minPrice',
          label: `From ${formatMoney(
            Number(
              appliedFilters.minPrice,
            ),
          )}`,
        });
      }

      if (
        appliedFilters.maxPrice
      ) {
        chips.push({
          key: 'maxPrice',
          label: `Up to ${formatMoney(
            Number(
              appliedFilters.maxPrice,
            ),
          )}`,
        });
      }

      if (
        appliedFilters.shortStayType
      ) {
        chips.push({
          key: 'shortStayType',
          label: cleanLabel(
            appliedFilters.shortStayType,
          ),
        });
      }

      if (
        appliedFilters.stayMode
      ) {
        chips.push({
          key: 'stayMode',
          label: cleanLabel(
            appliedFilters.stayMode,
          ),
        });
      }

      if (
        appliedFilters.guests
      ) {
        chips.push({
          key: 'guests',
          label: `${appliedFilters.guests}+ guests`,
        });
      }

      if (
        appliedFilters.rooms
      ) {
        chips.push({
          key: 'rooms',
          label: `${appliedFilters.rooms}+ rooms`,
        });
      }

      if (
        appliedFilters.checkIn
      ) {
        chips.push({
          key: 'checkIn',
          label: `From ${appliedFilters.checkIn}`,
        });
      }

      if (
        appliedFilters.checkOut
      ) {
        chips.push({
          key: 'checkOut',
          label: `Until ${appliedFilters.checkOut}`,
        });
      }

      appliedFilters.amenities.forEach(
        (amenity) => {
          chips.push({
            key: 'amenities',
            label: amenity,
          });
        },
      );

      return chips;
    }, [appliedFilters]);

  /*
   * -----------------------------
   * Geography selection modal
   * -----------------------------
   */

  function getSelectionOptions():
    SelectOption[] {
    if (!selectionModal) {
      return [];
    }

    if (
      selectionModal.type ===
      'county'
    ) {
      return counties.map((item) => ({
        id: item.id,
        label: item.name,
      }));
    }

    if (
      selectionModal.type ===
      'constituency'
    ) {
      return constituencies.map(
        (item) => ({
          id: item.id,
          label: item.name,
        }),
      );
    }

    if (
      selectionModal.type === 'ward'
    ) {
      return wards.map((item) => ({
        id: item.id,
        label: item.name,
      }));
    }

    return places.map((item) => ({
      id: item.id,
      label: item.name,
    }));
  }

  function handleSelection(
    option: SelectOption,
  ) {
    if (!selectionModal) {
      return;
    }

    if (
      selectionModal.type ===
      'county'
    ) {
      const item = counties.find(
        (county) =>
          county.id === option.id,
      );

      if (item) {
        selectCounty(item);
      }

      return;
    }

    if (
      selectionModal.type ===
      'constituency'
    ) {
      const item =
        constituencies.find(
          (constituency) =>
            constituency.id ===
            option.id,
        );

      if (item) {
        selectConstituency(item);
      }

      return;
    }

    if (
      selectionModal.type === 'ward'
    ) {
      const item = wards.find(
        (ward) =>
          ward.id === option.id,
      );

      if (item) {
        selectWard(item);
      }

      return;
    }

    const item = places.find(
      (place) =>
        place.id === option.id,
    );

    if (item) {
      selectPlace(item);
    }
  }

  /*
   * -----------------------------
   * Render
   * -----------------------------
   */

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) =>
          item.id
        }
        numColumns={1}
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProperties(false);
            }}
            tintColor={COLORS.lime}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                onPress={() =>
                  router.replace('/home')
                }
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color={COLORS.white}
                />
              </Pressable>

              <View style={styles.headerTitleWrap}>
                <Text style={styles.eyebrow}>
                  EXPLORE
                </Text>

                <Text style={styles.headerTitle}>
                  Find your place
                </Text>
              </View>

              <Pressable
                style={styles.filterHeaderButton}
                onPress={() =>
                  setShowFilters(true)
                }
              >
                <Ionicons
                  name="options-outline"
                  size={21}
                  color={COLORS.dark}
                />
              </Pressable>
            </View>

            <View style={styles.searchBar}>
              <View style={styles.searchIconBox}>
                <Ionicons
                  name="search"
                  size={20}
                  color={COLORS.dark}
                />
              </View>

              <TextInput
                value={searchText}
                onChangeText={
                  setSearchText
                }
                placeholder="Search county, town, home..."
                placeholderTextColor={
                  '#7C8587'
                }
                style={styles.searchInput}
                returnKeyType="search"
              />

              {searchText ? (
                <Pressable
                  onPress={() =>
                    setSearchText('')
                  }
                  style={
                    styles.clearSearch
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.muted}
                  />
                </Pressable>
              ) : null}

              <Pressable
                style={styles.filterButton}
                onPress={() =>
                  setShowFilters(true)
                }
              >
                <Ionicons
                  name="options"
                  size={20}
                  color={COLORS.dark}
                />
              </Pressable>
            </View>

            <View style={styles.purposeSwitch}>
              <Pressable
                style={[
                  styles.purposeOption,
                  appliedFilters.purpose ===
                    'LONG_STAY' &&
                    styles.purposeOptionActive,
                ]}
                onPress={() =>
                  selectPurpose(
                    'LONG_STAY',
                  )
                }
              >
                <Ionicons
                  name="home-outline"
                  size={17}
                  color={
                    appliedFilters.purpose ===
                    'LONG_STAY'
                      ? COLORS.dark
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.purposeText,
                    appliedFilters.purpose ===
                      'LONG_STAY' &&
                      styles.purposeTextActive,
                  ]}
                >
                  Long Stay
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.purposeOption,
                  appliedFilters.purpose ===
                    'SHORT_STAY' &&
                    styles.purposeOptionActive,
                ]}
                onPress={() =>
                  selectPurpose(
                    'SHORT_STAY',
                  )
                }
              >
                <Ionicons
                  name="bed-outline"
                  size={17}
                  color={
                    appliedFilters.purpose ===
                    'SHORT_STAY'
                      ? COLORS.dark
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.purposeText,
                    appliedFilters.purpose ===
                      'SHORT_STAY' &&
                      styles.purposeTextActive,
                  ]}
                >
                  Short Stay
                </Text>
              </Pressable>
            </View>

            <SectionTitle
              title="Quick search"
              subtitle="Start with a popular location or property type"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.horizontalChips
              }
            >
              {quickLocations.map(
                (county) => (
                  <ChoiceChip
                    key={county.id}
                    label={county.name}
                    selected={
                      appliedFilters.countyId ===
                      county.id
                    }
                    onPress={() => {
                      const next = {
                        ...appliedFilters,
                        countyId:
                          county.id,
                        countyName:
                          county.name,
                        constituencyId:
                          '',
                        constituencyName:
                          '',
                        wardId: '',
                        wardName: '',
                        placeId: '',
                        placeName: '',
                      };

                      setAppliedFilters(
                        next,
                      );
                      setDraftFilters(
                        next,
                      );
                    }}
                    icon="location-outline"
                  />
                ),
              )}

              {quickPropertyTypes.map(
                (type) => (
                  <ChoiceChip
                    key={type.value}
                    label={type.label}
                    selected={
                      appliedFilters.propertyType ===
                      type.value
                    }
                    onPress={() => {
                      const next = {
                        ...appliedFilters,
                        propertyType:
                          type.value,
                      };

                      setAppliedFilters(
                        next,
                      );
                      setDraftFilters(
                        next,
                      );
                    }}
                    icon="home-outline"
                  />
                ),
              )}
            </ScrollView>

            {activeFilterChips.length >
            0 ? (
              <View style={styles.activeFilters}>
                <View
                  style={
                    styles.activeFilterHeader
                  }
                >
                  <Text
                    style={
                      styles.activeFilterTitle
                    }
                  >
                    Active filters
                  </Text>

                  <Pressable
                    onPress={resetFilters}
                  >
                    <Text
                      style={
                        styles.resetText
                      }
                    >
                      Reset
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.activeFilterScroll
                  }
                >
                  {activeFilterChips.map(
                    (
                      chip,
                      index,
                    ) => (
                      <View
                        key={`${chip.key}-${chip.label}-${index}`}
                        style={
                          styles.activeFilterChip
                        }
                      >
                        <Text
                          style={
                            styles.activeFilterChipText
                          }
                        >
                          {
                            chip.label
                          }
                        </Text>

                        <Pressable
                          onPress={() =>
                            removeFilter(
                              chip.key,
                            )
                          }
                        >
                          <Ionicons
                            name="close"
                            size={14}
                            color={
                              COLORS.dark
                            }
                          />
                        </Pressable>
                      </View>
                    ),
                  )}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.resultsHeader}>
              <View>
                <Text
                  style={
                    styles.resultsTitle
                  }
                >
                  {loading
                    ? 'Finding homes...'
                    : `${filteredProperties.length} ${
                        filteredProperties.length ===
                        1
                          ? 'place'
                          : 'places'
                      }`}
                </Text>

                <Text
                  style={
                    styles.resultsSubtitle
                  }
                >
                  {appliedFilters.purpose ===
                  'SHORT_STAY'
                    ? 'Short stays'
                    : 'Long-term homes'}
                  {appliedFilters.countyName
                    ? ` in ${appliedFilters.countyName}`
                    : ''}
                </Text>
              </View>

              <Pressable
                style={styles.sortButton}
                onPress={() => {
                  setSort((current) => {
                    if (
                      current ===
                      'recommended'
                    ) {
                      return 'price_low';
                    }

                    if (
                      current ===
                      'price_low'
                    ) {
                      return 'price_high';
                    }

                    return 'recommended';
                  });
                }}
              >
                <Ionicons
                  name="swap-vertical"
                  size={16}
                  color={COLORS.muted}
                />

                <Text
                  style={
                    styles.sortText
                  }
                >
                  {sort ===
                  'price_low'
                    ? 'Price low'
                    : sort ===
                      'price_high'
                    ? 'Price high'
                    : 'Recommended'}
                </Text>
              </Pressable>
            </View>

            {apiError ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={22}
                  color={COLORS.rose}
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
                    Could not load homes
                  </Text>

                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {apiError}
                  </Text>

                  <Pressable
                    onPress={() =>
                      loadProperties()
                    }
                  >
                    <Text
                      style={
                        styles.retryText
                      }
                    >
                      Try again
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            isShortStay={
              item.purpose ===
              'SHORT_STAY'
            }
            isShortlisted={Boolean(
              isShortlisted(item.id),
            )}
            onToggleShortlist={() =>
              void toggleShortlist(item.id)
            }
            onPress={() =>
              goToProperty(item.id)
            }
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View
              style={styles.loadingState}
            >
              <ActivityIndicator
                size="large"
                color={COLORS.lime}
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Finding verified places...
              </Text>
            </View>
          ) : (
            <View
              style={styles.emptyState}
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="search-outline"
                  size={34}
                  color={COLORS.lime}
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No places found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try changing your search or
                removing some filters.
              </Text>

              <Pressable
                style={
                  styles.emptyButton
                }
                onPress={resetFilters}
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  Clear filters
                </Text>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          <View
            style={
              styles.bottomInformation
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={COLORS.lime}
            />

            <View
              style={
                styles.bottomInformationText
              }
            >
              <Text
                style={
                  styles.bottomInformationTitle
                }
              >
                Verified by MAKAZII
              </Text>

              <Text
                style={
                  styles.bottomInformationBody
                }
              >
                We help coordinate your viewing.
                Landlord and property uploader
                contact details are not shown
                before the approved viewing flow.
              </Text>
            </View>
          </View>
        }
      />

      {/* --------------------------------
          FILTER MODAL
      --------------------------------- */}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowFilters(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() =>
              setShowFilters(false)
            }
          />

          <View
            style={styles.filterSheet}
          >
            <View
              style={
                styles.filterSheetHandle
              }
            />

            <View
              style={
                styles.filterSheetHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.filterSheetTitle
                  }
                >
                  Filters
                </Text>

                <Text
                  style={
                    styles.filterSheetSubtitle
                  }
                >
                  Refine your search
                </Text>
              </View>

              <Pressable
                style={
                  styles.filterClose
                }
                onPress={() =>
                  setShowFilters(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.white}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filterContent
              }
            >
              <FilterSection title="Stay type">
                <View
                  style={
                    styles.optionGrid
                  }
                >
                  <ChoiceChip
                    label="Long Stay"
                    selected={
                      draftFilters.purpose ===
                      'LONG_STAY'
                    }
                    onPress={() =>
                      updateDraft({
                        purpose:
                          'LONG_STAY',
                      })
                    }
                    icon="home-outline"
                  />

                  <ChoiceChip
                    label="Short Stay"
                    selected={
                      draftFilters.purpose ===
                      'SHORT_STAY'
                    }
                    onPress={() =>
                      updateDraft({
                        purpose:
                          'SHORT_STAY',
                      })
                    }
                    icon="bed-outline"
                  />
                </View>
              </FilterSection>

              <FilterSection title="Location">
                <SelectBox
                  label="County"
                  value={
                    draftFilters.countyName
                  }
                  placeholder="Select county"
                  onPress={() =>
                    setSelectionModal({
                      type: 'county',
                      title:
                        'Select county',
                    })
                  }
                />

                <SelectBox
                  label="Constituency / Subcounty"
                  value={
                    draftFilters.constituencyName
                  }
                  placeholder={
                    draftFilters.countyId
                      ? 'Select constituency'
                      : 'Select county first'
                  }
                  disabled={
                    !draftFilters.countyId
                  }
                  onPress={() =>
                    setSelectionModal({
                      type:
                        'constituency',
                      title:
                        'Select constituency',
                    })
                  }
                />

                <SelectBox
                  label="Ward"
                  value={
                    draftFilters.wardName
                  }
                  placeholder={
                    draftFilters.constituencyId
                      ? 'Select ward'
                      : 'Select constituency first'
                  }
                  disabled={
                    !draftFilters.constituencyId
                  }
                  onPress={() =>
                    setSelectionModal({
                      type: 'ward',
                      title:
                        'Select ward',
                    })
                  }
                />

                <SelectBox
                  label="Place"
                  value={
                    draftFilters.placeName
                  }
                  placeholder={
                    draftFilters.countyId
                      ? 'Select place'
                      : 'Select county first'
                  }
                  disabled={
                    !draftFilters.countyId
                  }
                  onPress={() =>
                    setSelectionModal({
                      type: 'place',
                      title:
                        'Select place',
                    })
                  }
                />

                {loadingGeography ? (
                  <View
                    style={
                      styles.geographyLoading
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.lime
                      }
                    />

                    <Text
                      style={
                        styles.geographyLoadingText
                      }
                    >
                      Loading location options...
                    </Text>
                  </View>
                ) : null}
              </FilterSection>

              {draftFilters.purpose ===
              'LONG_STAY' ? (
                <>
                  <FilterSection title="Property type">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {quickPropertyTypes.map(
                        (type) => (
                          <ChoiceChip
                            key={
                              type.value
                            }
                            label={
                              type.label
                            }
                            selected={
                              draftFilters.propertyType ===
                              type.value
                            }
                            onPress={() =>
                              updateDraft({
                                propertyType:
                                  type.value,
                              })
                            }
                            icon="home-outline"
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>

                  <FilterSection title="Bedrooms">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {BEDROOM_OPTIONS.map(
                        (option) => (
                          <ChoiceChip
                            key={
                              option.value
                            }
                            label={
                              option.label
                            }
                            selected={
                              draftFilters.bedrooms ===
                              option.value
                            }
                            onPress={() =>
                              updateDraft({
                                bedrooms:
                                  option.value,
                              })
                            }
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>

                  <FilterSection title="Bathrooms">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {BATHROOM_OPTIONS.map(
                        (option) => (
                          <ChoiceChip
                            key={
                              option.value
                            }
                            label={
                              option.label
                            }
                            selected={
                              draftFilters.bathrooms ===
                              option.value
                            }
                            onPress={() =>
                              updateDraft({
                                bathrooms:
                                  option.value,
                              })
                            }
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>

                  <FilterSection title="Furnishing">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {FURNISHING_OPTIONS.map(
                        (option) => (
                          <ChoiceChip
                            key={
                              option.value
                            }
                            label={
                              option.label
                            }
                            selected={
                              draftFilters.furnishing ===
                              option.value
                            }
                            onPress={() =>
                              updateDraft({
                                furnishing:
                                  option.value,
                              })
                            }
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>
                </>
              ) : (
                <>
                  <FilterSection title="Short stay type">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {SHORT_STAY_TYPES.map(
                        (option) => (
                          <ChoiceChip
                            key={
                              option.value
                            }
                            label={
                              option.label
                            }
                            selected={
                              draftFilters.shortStayType ===
                              option.value
                            }
                            onPress={() =>
                              updateDraft({
                                shortStayType:
                                  option.value,
                              })
                            }
                            icon="bed-outline"
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>

                  <FilterSection title="Stay mode">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {STAY_MODES.map(
                        (option) => (
                          <ChoiceChip
                            key={
                              option.value
                            }
                            label={
                              option.label
                            }
                            selected={
                              draftFilters.stayMode ===
                              option.value
                            }
                            onPress={() =>
                              updateDraft({
                                stayMode:
                                  option.value,
                              })
                            }
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>

                  <FilterSection title="Dates">
                    <View
                      style={
                        styles.dateRow
                      }
                    >
                      <View
                        style={
                          styles.dateInputWrap
                        }
                      >
                        <Text
                          style={
                            styles.filterLabel
                          }
                        >
                          Check in
                        </Text>

                        <TextInput
                          value={
                            draftFilters.checkIn
                          }
                          onChangeText={(
                            value,
                          ) =>
                            updateDraft({
                              checkIn:
                                value,
                            })
                          }
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={
                            '#697274'
                          }
                          style={
                            styles.dateInput
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.dateInputWrap
                        }
                      >
                        <Text
                          style={
                            styles.filterLabel
                          }
                        >
                          Check out
                        </Text>

                        <TextInput
                          value={
                            draftFilters.checkOut
                          }
                          onChangeText={(
                            value,
                          ) =>
                            updateDraft({
                              checkOut:
                                value,
                            })
                          }
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={
                            '#697274'
                          }
                          style={
                            styles.dateInput
                          }
                        />
                      </View>
                    </View>
                  </FilterSection>

                  <FilterSection title="Guests">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {[
                        '1',
                        '2',
                        '3',
                        '4',
                        '5',
                        '6',
                        '8',
                        '10',
                      ].map(
                        (value) => (
                          <ChoiceChip
                            key={value}
                            label={`${value}+`}
                            selected={
                              draftFilters.guests ===
                              value
                            }
                            onPress={() =>
                              updateDraft({
                                guests:
                                  value,
                              })
                            }
                            icon="people-outline"
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>

                  <FilterSection title="Rooms">
                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {[
                        '1',
                        '2',
                        '3',
                        '4',
                        '5',
                        '8',
                        '10',
                      ].map(
                        (value) => (
                          <ChoiceChip
                            key={value}
                            label={`${value}+`}
                            selected={
                              draftFilters.rooms ===
                              value
                            }
                            onPress={() =>
                              updateDraft({
                                rooms:
                                  value,
                              })
                            }
                            icon="business-outline"
                          />
                        ),
                      )}
                    </View>
                  </FilterSection>
                </>
              )}

              <FilterSection title="Budget">
                <View
                  style={
                    styles.priceRow
                  }
                >
                  <View
                    style={
                      styles.priceInputWrap
                    }
                  >
                    <Text
                      style={
                        styles.pricePrefix
                      }
                    >
                      KSh
                    </Text>

                    <TextInput
                      value={
                        draftFilters.minPrice
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateDraft({
                          minPrice:
                            value.replace(
                              /[^0-9]/g,
                              '',
                            ),
                        })
                      }
                      keyboardType="numeric"
                      placeholder="Minimum"
                      placeholderTextColor={
                        '#697274'
                      }
                      style={
                        styles.priceInput
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.priceDash
                    }
                  >
                    —
                  </Text>

                  <View
                    style={
                      styles.priceInputWrap
                    }
                  >
                    <Text
                      style={
                        styles.pricePrefix
                      }
                    >
                      KSh
                    </Text>

                    <TextInput
                      value={
                        draftFilters.maxPrice
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateDraft({
                          maxPrice:
                            value.replace(
                              /[^0-9]/g,
                              '',
                            ),
                        })
                      }
                      keyboardType="numeric"
                      placeholder="Maximum"
                      placeholderTextColor={
                        '#697274'
                      }
                      style={
                        styles.priceInput
                      }
                    />
                  </View>
                </View>
              </FilterSection>

              <FilterSection title="Amenities">
                {availableAmenities.length ===
                0 ? (
                  <View
                    style={
                      styles.noAmenities
                    }
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={18}
                      color={
                        COLORS.muted
                      }
                    />

                    <Text
                      style={
                        styles.noAmenitiesText
                      }
                    >
                      Amenities will appear
                      here as they are added to
                      verified properties.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.optionGrid
                    }
                  >
                    {availableAmenities.map(
                      (amenity) => (
                        <ChoiceChip
                          key={
                            amenity.id ||
                            amenity.name
                          }
                          label={
                            amenity.name
                          }
                          selected={draftFilters.amenities.includes(
                            amenity.name,
                          )}
                          onPress={() =>
                            toggleAmenity(
                              amenity.name,
                            )
                          }
                          icon="checkmark-circle-outline"
                        />
                      ),
                    )}
                  </View>
                )}
              </FilterSection>
            </ScrollView>

            <View
              style={
                styles.filterFooter
              }
            >
              <Pressable
                style={
                  styles.clearButton
                }
                onPress={resetFilters}
              >
                <Text
                  style={
                    styles.clearButtonText
                  }
                >
                  Reset
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.applyButton
                }
                onPress={applyFilters}
              >
                <Text
                  style={
                    styles.applyButtonText
                  }
                >
                  Show{' '}
                  {filteredProperties.length}{' '}
                  places
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.dark}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --------------------------------
          GEOGRAPHY SELECT MODAL
      --------------------------------- */}

      <Modal
        visible={
          selectionModal !== null
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setSelectionModal(null)
        }
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() =>
              setSelectionModal(null)
            }
          />

          <View
            style={
              styles.selectionSheet
            }
          >
            <View
              style={
                styles.filterSheetHandle
              }
            />

            <View
              style={
                styles.filterSheetHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.filterSheetTitle
                  }
                >
                  {selectionModal?.title}
                </Text>

                <Text
                  style={
                    styles.filterSheetSubtitle
                  }
                >
                  Select one option
                </Text>
              </View>

              <Pressable
                style={
                  styles.filterClose
                }
                onPress={() =>
                  setSelectionModal(
                    null,
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.white}
                />
              </Pressable>
            </View>

            <FlatList
              data={getSelectionOptions()}
              keyExtractor={(item) =>
                item.id
              }
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.selectionList
              }
              renderItem={({
                item,
              }) => (
                <Pressable
                  style={
                    styles.selectionRow
                  }
                  onPress={() =>
                    handleSelection(
                      item,
                    )
                  }
                >
                  <View
                    style={
                      styles.selectionIcon
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={
                        COLORS.lime
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.selectionText
                    }
                  >
                    {item.label}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={
                      COLORS.muted
                    }
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <View
                  style={
                    styles.selectionEmpty
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={34}
                    color={
                      COLORS.muted
                    }
                  />

                  <Text
                    style={
                      styles.selectionEmptyTitle
                    }
                  >
                    No options available
                  </Text>

                  <Text
                    style={
                      styles.selectionEmptyText
                    }
                  >
                    Choose the previous
                    location level first.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitleWrap: {
    flex: 1,
    marginLeft: 13,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  filterHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lime,
  },

  searchBar: {
    minHeight: 64,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    marginBottom: 14,
  },

  searchIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lime,
  },

  searchInput: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 12,
    minWidth: 0,
  },

  clearSearch: {
    padding: 5,
    marginRight: 2,
  },

  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark,
  },

  purposeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 17,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  purposeOption: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  purposeOptionActive: {
    backgroundColor: COLORS.lime,
  },

  purposeText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },

  purposeTextActive: {
    color: COLORS.dark,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 12,
  },

  sectionTitleText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  horizontalChips: {
    paddingRight: 20,
    gap: 8,
  },

  choiceChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  choiceChipSelected: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  choiceChipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  choiceChipTextSelected: {
    color: COLORS.dark,
  },

  activeFilters: {
    marginTop: 20,
  },

  activeFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  activeFilterTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  resetText: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '800',
  },

  activeFilterScroll: {
    gap: 7,
    paddingRight: 20,
  },

  activeFilterChip: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  activeFilterChipText: {
    color: COLORS.dark,
    fontSize: 11,
    fontWeight: '800',
  },

  resultsHeader: {
    marginTop: 26,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultsTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  resultsSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  sortButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  sortText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  propertyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  propertyImageWrap: {
    height: 245,
    position: 'relative',
    backgroundColor: COLORS.cardSoft,
  },

  propertyImage: {
    width: '100%',
    height: '100%',
  },

  propertyVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.dark,
  },

  supportingPhotos: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: COLORS.card,
  },

  supportingPhoto: {
    flex: 1,
    height: 72,
    borderRadius: 9,
    backgroundColor: COLORS.cardSoft,
  },

  videoUnavailableBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(11,15,16,0.88)',
  },

  videoUnavailableText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  placeholderText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
  },

  imageTopRow: {
    position: 'absolute',
    top: 13,
    left: 13,
    right: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  typeBadge: {
    paddingHorizontal: 11,
    minHeight: 30,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.78)',
  },

  typeBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,16,0.75)',
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: 13,
    left: 13,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(11,15,16,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  verifiedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  propertyContent: {
    padding: 16,
  },

  propertyPriceRow: {
    marginBottom: 6,
  },

  propertyPrice: {
    color: COLORS.lime,
    fontSize: 16,
    fontWeight: '900',
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },

  locationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  detailText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  cardBottomRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  viewingFee: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  loadingState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },

  emptyState: {
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 17,
  },

  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 45,
    paddingHorizontal: 20,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: '900',
  },

  bottomInformation: {
    marginTop: 18,
    padding: 17,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
  },

  bottomInformationText: {
    flex: 1,
  },

  bottomInformationTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  bottomInformationBody: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  errorBox: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 11,
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
    marginTop: 3,
  },

  retryText: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },

  /*
   * Filter sheet
   */

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },

  filterSheet: {
    maxHeight: '92%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },

  selectionSheet: {
    maxHeight: '82%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },

  filterSheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 10,
  },

  filterSheetHeader: {
    paddingHorizontal: 19,
    paddingTop: 15,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  filterSheetTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },

  filterSheetSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  filterClose: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterContent: {
    padding: 19,
    paddingBottom: 120,
  },

  filterSection: {
    marginBottom: 25,
  },

  filterSectionTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 11,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  filterField: {
    marginBottom: 13,
  },

  filterLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },

  selectBox: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectBoxDisabled: {
    opacity: 0.45,
  },

  selectValue: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 10,
  },

  selectPlaceholder: {
    color: COLORS.muted,
  },

  geographyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },

  geographyLoadingText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 9,
  },

  dateInputWrap: {
    flex: 1,
  },

  dateInput: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  priceInputWrap: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pricePrefix: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },

  priceInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 7,
  },

  priceDash: {
    color: COLORS.muted,
    fontSize: 16,
  },

  noAmenities: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  noAmenitiesText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  filterFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 25 : 13,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 10,
  },

  clearButton: {
    width: 90,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  clearButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  applyButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    gap: 8,
  },

  applyButtonText: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: '900',
  },

  /*
   * Geography selector
   */

  selectionList: {
    padding: 17,
    paddingBottom: 35,
  },

  selectionRow: {
    minHeight: 58,
    paddingHorizontal: 11,
    marginBottom: 8,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  selectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  selectionText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  selectionEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 30,
  },

  selectionEmptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },

  selectionEmptyText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
});
