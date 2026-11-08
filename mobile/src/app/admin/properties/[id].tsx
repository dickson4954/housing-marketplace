import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileCheck2,
  Image as ImageIcon,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react-native';

import { API_BASE_URL, API_ENDPOINTS } from '../../../config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
  warning: '#FFC857',
  success: '#7BE495',
  blue: '#6EA8FE',
};

type Purpose = 'LONG_STAY' | 'SHORT_STAY';

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

type StayMode =
  | 'DAY'
  | 'OVERNIGHT'
  | 'DAY_AND_NIGHT'
  | 'FLEXIBLE';

type FurnishingType =
  | 'UNFURNISHED'
  | 'SEMI_FURNISHED'
  | 'FURNISHED';

type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'CHANGES_REQUIRED'
  | 'ACTIVE'
  | 'RENTED'
  | 'INACTIVE'
  | 'REJECTED';

type GeographyItem = {
  id: string;
  name: string;
  sourceId?: string | null;
};

type Amenity = {
  id: string;
  name: string;
};

type BackendImage = {
  id: string;
  url: string;
  publicId?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

type Marketer = {
  id: string;
  region?: string | null;
  notes?: string | null;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string;
    accountStatus?: string | null;
    isActive?: boolean;
  } | null;
};

type BackendProperty = {
  id: string;
  title: string;
  description?: string | null;

  purpose: Purpose;

  longStayType?: LongStayType | null;
  shortStayType?: ShortStayType | null;
  stayMode?: StayMode | null;
  furnishing?: FurnishingType | null;

  status: PropertyStatus;

  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  inspectionFee?: number | null;
  serviceCharge?: number | null;

  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  maxGuests?: number | null;
  rooms?: number | null;

  countyId: string;
  constituencyId: string;
  wardId: string;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  placeId?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  available: boolean;
  verified: boolean;

  marketerId?: string | null;

  images?: BackendImage[];

  amenities?: {
    propertyId?: string;
    amenityId?: string;
    amenity: Amenity;
  }[];

  countyRelation?: GeographyItem | null;
  constituency?: GeographyItem | null;
  ward?: GeographyItem | null;

  marketer?: Marketer | null;

  createdAt: string;
  updatedAt: string;

  statusHistory?: {
    id: string;
    fromStatus?: PropertyStatus | null;
    toStatus: PropertyStatus;
    note?: string | null;
    createdAt: string;
    changedBy?: {
      id: string;
      email?: string | null;
      phone?: string | null;
    } | null;
  }[];

  _count?: {
    viewingRequests?: number;
    shortlists?: number;
  };
};

const PURPOSE_OPTIONS: {
  id: Purpose;
  name: string;
}[] = [
  {
    id: 'LONG_STAY',
    name: 'Long Stay',
  },
  {
    id: 'SHORT_STAY',
    name: 'Short Stay',
  },
];

const LONG_STAY_OPTIONS: {
  id: LongStayType;
  name: string;
}[] = [
  {
    id: 'SINGLE_ROOM',
    name: 'Single Room',
  },
  {
    id: 'BEDSITTER',
    name: 'Bedsitter',
  },
  {
    id: 'STUDIO',
    name: 'Studio',
  },
  {
    id: 'ONE_BEDROOM',
    name: '1 Bedroom',
  },
  {
    id: 'TWO_BEDROOM',
    name: '2 Bedroom',
  },
  {
    id: 'THREE_BEDROOM',
    name: '3 Bedroom',
  },
  {
    id: 'FOUR_PLUS_BEDROOM',
    name: '4+ Bedrooms',
  },
  {
    id: 'HOUSE',
    name: 'House',
  },
  {
    id: 'APARTMENT',
    name: 'Apartment',
  },
];

const SHORT_STAY_OPTIONS: {
  id: ShortStayType;
  name: string;
}[] = [
  {
    id: 'BNB',
    name: 'B&B',
  },
  {
    id: 'LODGE',
    name: 'Lodge',
  },
  {
    id: 'GUEST_HOUSE',
    name: 'Guest House',
  },
  {
    id: 'HOTEL_ROOM',
    name: 'Hotel Room',
  },
  {
    id: 'SERVICED_APARTMENT',
    name: 'Serviced Apartment',
  },
  {
    id: 'FURNISHED_APARTMENT',
    name: 'Furnished Apartment',
  },
  {
    id: 'HOLIDAY_HOME',
    name: 'Holiday Home',
  },
  {
    id: 'VILLA',
    name: 'Villa',
  },
  {
    id: 'COTTAGE',
    name: 'Cottage',
  },
  {
    id: 'HOSTEL',
    name: 'Hostel',
  },
  {
    id: 'PRIVATE_ROOM',
    name: 'Private Room',
  },
];

const STAY_MODE_OPTIONS: {
  id: StayMode;
  name: string;
}[] = [
  {
    id: 'DAY',
    name: 'Day',
  },
  {
    id: 'OVERNIGHT',
    name: 'Overnight',
  },
  {
    id: 'DAY_AND_NIGHT',
    name: 'Day & Night',
  },
  {
    id: 'FLEXIBLE',
    name: 'Flexible',
  },
];

const FURNISHING_OPTIONS: {
  id: FurnishingType;
  name: string;
}[] = [
  {
    id: 'UNFURNISHED',
    name: 'Unfurnished',
  },
  {
    id: 'SEMI_FURNISHED',
    name: 'Semi Furnished',
  },
  {
    id: 'FURNISHED',
    name: 'Furnished',
  },
];

const STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: 'Draft',
  PENDING_VERIFICATION: 'Pending Verification',
  CHANGES_REQUIRED: 'Changes Required',
  ACTIVE: 'Published / Active',
  RENTED: 'Rented',
  INACTIVE: 'Inactive',
  REJECTED: 'Rejected',
};

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  return `KSh ${Number(value).toLocaleString('en-KE')}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEnum(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
}

function numberOrNull(value: string) {
  const cleaned = value.replace(/,/g, '').trim();

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function numberOrUndefined(value: string) {
  const cleaned = value.replace(/,/g, '').trim();

  if (!cleaned) {
    return undefined;
  }

  const parsed = Number(cleaned);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

function getStatusColor(status: PropertyStatus) {
  switch (status) {
    case 'ACTIVE':
      return COLORS.success;
    case 'PENDING_VERIFICATION':
      return COLORS.warning;
    case 'CHANGES_REQUIRED':
      return COLORS.blue;
    case 'REJECTED':
      return COLORS.danger;
    default:
      return COLORS.muted;
  }
}

function getPurposeLabel(purpose?: Purpose) {
  return purpose === 'SHORT_STAY'
    ? 'Short Stay'
    : 'Long Stay';
}

function getPropertyTypeLabel(
  property: BackendProperty | null,
) {
  if (!property) {
    return 'Unknown';
  }

  if (property.purpose === 'SHORT_STAY') {
    return (
      SHORT_STAY_OPTIONS.find(
        (item) =>
          item.id === property.shortStayType,
      )?.name ??
      formatEnum(property.shortStayType)
    );
  }

  return (
    LONG_STAY_OPTIONS.find(
      (item) =>
        item.id === property.longStayType,
    )?.name ??
    formatEnum(property.longStayType)
  );
}

function marketerName(marketer?: Marketer | null) {
  if (!marketer?.user) {
    return 'No marketer assigned';
  }

  const name = [
    marketer.user.firstName,
    marketer.user.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    name ||
    marketer.user.email ||
    marketer.user.phone ||
    'Unnamed marketer'
  );
}

async function getAdminToken(): Promise<string | null> {
  return SecureStore.getItemAsync(
    'makazii_admin_token',
  );
}

async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const token = await getAdminToken();

  if (!token) {
    throw new Error(
      'Admin session has expired. Please log in again.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      body?.message ||
        body?.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return body;
}

function unwrapArray(
  result: any,
  key?: string,
) {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    key &&
    Array.isArray(result?.data?.[key])
  ) {
    return result.data[key];
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (
    key &&
    Array.isArray(result?.[key])
  ) {
    return result[key];
  }

  return [];
}

export default function AdminPropertyDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const propertyId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [property, setProperty] =
    useState<BackendProperty | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] =
    useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const [purpose, setPurpose] =
    useState<Purpose>('LONG_STAY');

  const [longStayType, setLongStayType] =
    useState<LongStayType | ''>('');

  const [shortStayType, setShortStayType] =
    useState<ShortStayType | ''>('');

  const [stayMode, setStayMode] =
    useState<StayMode | ''>('');

  const [furnishing, setFurnishing] =
    useState<FurnishingType | ''>('');

  const [monthlyRent, setMonthlyRent] =
    useState('');
  const [deposit, setDeposit] =
    useState('');
  const [viewingFee, setViewingFee] =
    useState('');
  const [inspectionFee, setInspectionFee] =
    useState('');
  const [serviceCharge, setServiceCharge] =
    useState('');

  const [dayRate, setDayRate] =
    useState('');
  const [nightRate, setNightRate] =
    useState('');
  const [dayNightRate, setDayNightRate] =
    useState('');

  const [bedrooms, setBedrooms] =
    useState('');
  const [bathrooms, setBathrooms] =
    useState('');
  const [beds, setBeds] = useState('');
  const [maxGuests, setMaxGuests] =
    useState('');
  const [rooms, setRooms] = useState('');

  const [countyId, setCountyId] =
    useState('');
  const [constituencyId, setConstituencyId] =
    useState('');
  const [wardId, setWardId] = useState('');

  const [counties, setCounties] = useState<
    GeographyItem[]
  >([]);
  const [constituencies, setConstituencies] =
    useState<GeographyItem[]>([]);
  const [wards, setWards] = useState<
    GeographyItem[]
  >([]);

  const [amenities, setAmenities] = useState<
    Amenity[]
  >([]);
  const [
    selectedAmenityIds,
    setSelectedAmenityIds,
  ] = useState<string[]>([]);

  const [marketers, setMarketers] = useState<
    Marketer[]
  >([]);
  const [
    selectedMarketerId,
    setSelectedMarketerId,
  ] = useState('');

  const [
    showPurposePicker,
    setShowPurposePicker,
  ] = useState(false);

  const [
    showPropertyTypePicker,
    setShowPropertyTypePicker,
  ] = useState(false);

  const [
    showStayModePicker,
    setShowStayModePicker,
  ] = useState(false);

  const [
    showFurnishingPicker,
    setShowFurnishingPicker,
  ] = useState(false);

  const [
    showCountyPicker,
    setShowCountyPicker,
  ] = useState(false);

  const [
    showConstituencyPicker,
    setShowConstituencyPicker,
  ] = useState(false);

  const [
    showWardPicker,
    setShowWardPicker,
  ] = useState(false);

  const [
    showMarketerPicker,
    setShowMarketerPicker,
  ] = useState(false);

  const [reviewAction, setReviewAction] =
    useState<
      'changes' | 'reject' | null
    >(null);

  const [reviewNotes, setReviewNotes] =
    useState('');

  const [error, setError] = useState('');

  const selectedCounty = useMemo(
    () =>
      counties.find(
        (item) => item.id === countyId,
      ),
    [counties, countyId],
  );

  const selectedConstituency = useMemo(
    () =>
      constituencies.find(
        (item) =>
          item.id === constituencyId,
      ),
    [constituencies, constituencyId],
  );

  const selectedWard = useMemo(
    () =>
      wards.find(
        (item) => item.id === wardId,
      ),
    [wards, wardId],
  );

  const selectedMarketer = useMemo(
    () =>
      marketers.find(
        (item) =>
          item.id === selectedMarketerId,
      ),
    [marketers, selectedMarketerId],
  );

  const selectedTypeLabel = useMemo(() => {
    if (purpose === 'SHORT_STAY') {
      return (
        SHORT_STAY_OPTIONS.find(
          (item) =>
            item.id === shortStayType,
        )?.name ??
        formatEnum(shortStayType)
      );
    }

    return (
      LONG_STAY_OPTIONS.find(
        (item) =>
          item.id === longStayType,
      )?.name ??
      formatEnum(longStayType)
    );
  }, [
    purpose,
    shortStayType,
    longStayType,
  ]);

  const statusColor = property
    ? getStatusColor(property.status)
    : COLORS.muted;

  const canEdit =
    property !== null &&
    property.status !== 'RENTED';

  const loadProperty = useCallback(async (
    showLoader = true,
  ) => {
    if (!propertyId) {
      setError('Property ID is missing.');
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await apiRequest(
        `/admin/properties/${propertyId}`,
      );

      const data = result?.data ?? result;

      if (!data) {
        throw new Error(
          'Property was not returned by the backend.',
        );
      }

      setProperty(data);

      setTitle(data.title ?? '');
      setDescription(
        data.description ?? '',
      );

      setPurpose(
        data.purpose === 'SHORT_STAY'
          ? 'SHORT_STAY'
          : 'LONG_STAY',
      );

      setLongStayType(
        data.longStayType ?? '',
      );

      setShortStayType(
        data.shortStayType ?? '',
      );

      setStayMode(data.stayMode ?? '');
      setFurnishing(
        data.furnishing ?? '',
      );

      setMonthlyRent(
        data.monthlyRent !== null &&
          data.monthlyRent !== undefined
          ? String(data.monthlyRent)
          : '',
      );

      setDeposit(
        data.deposit !== null &&
          data.deposit !== undefined
          ? String(data.deposit)
          : '',
      );

      setViewingFee(
        data.viewingFee !== null &&
          data.viewingFee !== undefined
          ? String(data.viewingFee)
          : '',
      );

      setInspectionFee(
        data.inspectionFee !== null &&
          data.inspectionFee !== undefined
          ? String(data.inspectionFee)
          : '',
      );

      setServiceCharge(
        data.serviceCharge !== null &&
          data.serviceCharge !== undefined
          ? String(data.serviceCharge)
          : '',
      );

      setDayRate(
        data.dayRate !== null &&
          data.dayRate !== undefined
          ? String(data.dayRate)
          : '',
      );

      setNightRate(
        data.nightRate !== null &&
          data.nightRate !== undefined
          ? String(data.nightRate)
          : '',
      );

      setDayNightRate(
        data.dayNightRate !== null &&
          data.dayNightRate !== undefined
          ? String(data.dayNightRate)
          : '',
      );

      setBedrooms(
        data.bedrooms !== null &&
          data.bedrooms !== undefined
          ? String(data.bedrooms)
          : '',
      );

      setBathrooms(
        data.bathrooms !== null &&
          data.bathrooms !== undefined
          ? String(data.bathrooms)
          : '',
      );

      setBeds(
        data.beds !== null &&
          data.beds !== undefined
          ? String(data.beds)
          : '',
      );

      setMaxGuests(
        data.maxGuests !== null &&
          data.maxGuests !== undefined
          ? String(data.maxGuests)
          : '',
      );

      setRooms(
        data.rooms !== null &&
          data.rooms !== undefined
          ? String(data.rooms)
          : '',
      );

      setCountyId(data.countyId ?? '');
      setConstituencyId(
        data.constituencyId ?? '',
      );
      setWardId(data.wardId ?? '');

      setSelectedMarketerId(
        data.marketerId ??
          data.marketer?.id ??
          '',
      );

      setSelectedAmenityIds(
        (data.amenities ?? [])
          .map(
            (item: any) =>
              item.amenityId ??
              item.amenity?.id,
          )
          .filter(Boolean),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load property.',
      );
    } finally {
      setLoading(false);
    }
    }, [propertyId]);

  const loadCounties = useCallback(async () => {
    try {
      const result = await apiRequest(
        API_ENDPOINTS.geographyCounties,
      );

      setCounties(
        unwrapArray(result),
      );
    } catch (requestError) {
      console.error(
        'Unable to load counties:',
        requestError,
      );
    }
    }, []);

  const loadConstituencies = useCallback(async (
    selectedId: string,
  ) => {
    if (!selectedId) {
      setConstituencies([]);
      return;
    }

    try {
      const result = await apiRequest(
        API_ENDPOINTS.geographyConstituencies(
          selectedId,
        ),
      );

      setConstituencies(
        unwrapArray(result),
      );
    } catch (requestError) {
      console.error(
        'Unable to load constituencies:',
        requestError,
      );
      setConstituencies([]);
    }
    }, []);

  const loadWards = useCallback(async (
    selectedId: string,
  ) => {
    if (!selectedId) {
      setWards([]);
      return;
    }

    try {
      const result = await apiRequest(
        API_ENDPOINTS.geographyWards(
          selectedId,
        ),
      );

      setWards(
        unwrapArray(result),
      );
    } catch (requestError) {
      console.error(
        'Unable to load wards:',
        requestError,
      );
      setWards([]);
    }
    }, []);

  const loadAmenities = useCallback(async () => {
    try {
      const result = await apiRequest(
        '/admin/amenities',
      );

      setAmenities(
        unwrapArray(result),
      );
    } catch (requestError) {
      console.error(
        'Unable to load amenities:',
        requestError,
      );
      setAmenities([]);
    }
    }, []);

  const loadMarketers = useCallback(async () => {
    try {
      const result = await apiRequest(
        '/admin/marketers',
      );

      const list = unwrapArray(
        result,
        'marketers',
      ).filter(
        (item: Marketer) =>
          item?.user?.isActive !== false,
      );

      setMarketers(list);
    } catch (requestError) {
      console.error(
        'Unable to load marketers:',
        requestError,
      );
      setMarketers([]);
    }
    }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProperty();
      loadCounties();
      loadAmenities();
      loadMarketers();
    }, 0);

    return () => clearTimeout(timer);
  }, [propertyId, loadProperty, loadCounties, loadAmenities, loadMarketers]);

  useEffect(() => {
    if (!countyId) return;

    const timer = setTimeout(() => {
      loadConstituencies(countyId);
    }, 0);

    return () => clearTimeout(timer);
  }, [countyId, loadConstituencies]);

  useEffect(() => {
    if (!constituencyId) return;

    const timer = setTimeout(() => {
      loadWards(constituencyId);
    }, 0);

    return () => clearTimeout(timer);
  }, [constituencyId, loadWards]);

  const refresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        loadProperty(false),
        loadCounties(),
        loadAmenities(),
        loadMarketers(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const validate = () => {
    if (!title.trim()) {
      Alert.alert(
        'Missing title',
        'Enter a property title.',
      );
      return false;
    }

    if (purpose === 'LONG_STAY') {
      if (!longStayType) {
        Alert.alert(
          'Missing property type',
          'Select the long-stay property type.',
        );
        return false;
      }

      const rentValue =
        numberOrNull(monthlyRent);

      if (
        rentValue === null ||
        rentValue <= 0
      ) {
        Alert.alert(
          'Invalid monthly rent',
          'Monthly rent must be greater than zero.',
        );
        return false;
      }

      if (
        deposit.trim() &&
        (numberOrNull(deposit) ?? -1) < 0
      ) {
        Alert.alert(
          'Invalid deposit',
          'Deposit cannot be negative.',
        );
        return false;
      }

      if (
        viewingFee.trim() &&
        (numberOrNull(viewingFee) ?? -1) < 0
      ) {
        Alert.alert(
          'Invalid viewing fee',
          'Viewing fee cannot be negative.',
        );
        return false;
      }

      if (
        serviceCharge.trim() &&
        (numberOrNull(
          serviceCharge,
        ) ?? -1) < 0
      ) {
        Alert.alert(
          'Invalid service charge',
          'Service charge cannot be negative.',
        );
        return false;
      }
    }

    if (purpose === 'SHORT_STAY') {
      if (!shortStayType) {
        Alert.alert(
          'Missing property type',
          'Select the short-stay property type.',
        );
        return false;
      }

      if (!stayMode) {
        Alert.alert(
          'Missing stay mode',
          'Select how the short-stay property is charged.',
        );
        return false;
      }

      const inspectionFeeValue =
        numberOrNull(inspectionFee);

      if (
        inspectionFeeValue === null ||
        inspectionFeeValue <= 0
      ) {
        Alert.alert(
          'Invalid inspection fee',
          'Inspection fee must be greater than zero.',
        );
        return false;
      }

      const guestValue =
        numberOrNull(maxGuests);
      const roomsValue =
        numberOrNull(rooms);

      if (
        guestValue === null ||
        guestValue <= 0
      ) {
        Alert.alert(
          'Invalid maximum guests',
          'Maximum guests must be greater than zero.',
        );
        return false;
      }

      if (
        roomsValue === null ||
        roomsValue <= 0
      ) {
        Alert.alert(
          'Invalid rooms',
          'Number of rooms must be greater than zero.',
        );
        return false;
      }

      const day =
        numberOrNull(dayRate);
      const night =
        numberOrNull(nightRate);
      const dayNight =
        numberOrNull(dayNightRate);

      if (
        stayMode === 'DAY' &&
        (day === null || day <= 0)
      ) {
        Alert.alert(
          'Invalid day rate',
          'Day rate must be greater than zero.',
        );
        return false;
      }

      if (
        stayMode === 'OVERNIGHT' &&
        (night === null || night <= 0)
      ) {
        Alert.alert(
          'Invalid overnight rate',
          'Overnight rate must be greater than zero.',
        );
        return false;
      }

      if (
        stayMode === 'DAY_AND_NIGHT' &&
        (dayNight === null ||
          dayNight <= 0)
      ) {
        Alert.alert(
          'Invalid day & night rate',
          'Day & Night rate must be greater than zero.',
        );
        return false;
      }

      if (
        stayMode === 'FLEXIBLE' &&
        (day === null || day <= 0) &&
        (night === null ||
          night <= 0) &&
        (dayNight === null ||
          dayNight <= 0)
      ) {
        Alert.alert(
          'Missing short-stay pricing',
          'Flexible pricing requires at least one valid rate.',
        );
        return false;
      }
    }

    const numericFields = [
      {
        name: 'Bedrooms',
        value: bedrooms,
      },
      {
        name: 'Bathrooms',
        value: bathrooms,
      },
      {
        name: 'Beds',
        value: beds,
      },
    ];

    for (const field of numericFields) {
      if (
        field.value.trim() &&
        (numberOrNull(field.value) ?? -1) <
          0
      ) {
        Alert.alert(
          `Invalid ${field.name.toLowerCase()}`,
          `${field.name} cannot be negative.`,
        );
        return false;
      }
    }

    if (!countyId) {
      Alert.alert(
        'Missing county',
        'Select the property county.',
      );
      return false;
    }

    if (!constituencyId) {
      Alert.alert(
        'Missing constituency',
        'Select the property constituency.',
      );
      return false;
    }

    if (!wardId) {
      Alert.alert(
        'Missing ward',
        'Select the property ward.',
      );
      return false;
    }

    if (!selectedMarketerId) {
      Alert.alert(
        'Missing marketer',
        'Assign an active marketer to this property.',
      );
      return false;
    }

    return true;
  };

  const saveChanges = async () => {
    if (!propertyId || !property) {
      return;
    }

    if (!canEdit) {
      Alert.alert(
        'Property locked',
        'A rented property cannot be edited.',
      );
      return;
    }

    if (!validate()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description:
          description.trim() || null,

        purpose,

        longStayType:
          purpose === 'LONG_STAY'
            ? longStayType || undefined
            : undefined,

        shortStayType:
          purpose === 'SHORT_STAY'
            ? shortStayType || undefined
            : undefined,

        stayMode:
          purpose === 'SHORT_STAY'
            ? stayMode || undefined
            : undefined,

        furnishing:
          furnishing || undefined,

        monthlyRent:
          purpose === 'LONG_STAY'
            ? numberOrUndefined(
                monthlyRent,
              )
            : undefined,

        deposit:
          purpose === 'LONG_STAY'
            ? numberOrUndefined(deposit)
            : undefined,

        viewingFee:
          purpose === 'LONG_STAY'
            ? numberOrUndefined(
                viewingFee,
              )
            : undefined,

        inspectionFee:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(inspectionFee)
            : undefined,

        serviceCharge:
          purpose === 'LONG_STAY'
            ? numberOrUndefined(
                serviceCharge,
              )
            : undefined,

        dayRate:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(dayRate)
            : undefined,

        nightRate:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(
                nightRate,
              )
            : undefined,

        dayNightRate:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(
                dayNightRate,
              )
            : undefined,

        bedrooms:
          numberOrUndefined(bedrooms),

        bathrooms:
          numberOrUndefined(bathrooms),

        beds:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(beds)
            : undefined,

        maxGuests:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(
                maxGuests,
              )
            : undefined,

        rooms:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(rooms)
            : undefined,

        countyId,
        constituencyId,
        wardId,

        marketerId:
          selectedMarketerId,

        amenityIds:
          selectedAmenityIds,
      };

      const result = await apiRequest(
        `/admin/properties/${propertyId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      );

      const updated =
        result?.data ?? result;

      setProperty(updated);

      Alert.alert(
        'Property saved',
        'The property has been updated successfully.',
      );

      await loadProperty(false);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save property.';

      setError(message);

      Alert.alert(
        'Save failed',
        message,
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    status: PropertyStatus,
    note?: string,
  ) => {
    if (!propertyId) {
      return;
    }

    setReviewing(true);
    setError('');

    try {
      const result = await apiRequest(
        `/admin/properties/${propertyId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status,
            note:
              note?.trim() || undefined,
          }),
        },
      );

      const updated =
        result?.data ?? result;

      setProperty(updated);

      await loadProperty(false);

      Alert.alert(
        'Status updated',
        `Property is now ${STATUS_LABELS[status]}.`,
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update property status.';

      setError(message);

      Alert.alert(
        'Status update failed',
        message,
      );
    } finally {
      setReviewing(false);
    }
  };

  const updateAvailability = async (
    available: boolean,
  ) => {
    if (!propertyId || !property) {
      return;
    }

    if (property.status === 'RENTED') {
      Alert.alert(
        'Property rented',
        'A rented property cannot be returned to available.',
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await apiRequest(
        `/admin/properties/${propertyId}/availability`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            available,
          }),
        },
      );

      const updated =
        result?.data ?? result;

      setProperty(updated);

      await loadProperty(false);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update availability.';

      setError(message);

      Alert.alert(
        'Availability update failed',
        message,
      );
    } finally {
      setSaving(false);
    }
  };

  const submitReviewAction = async () => {
    if (!reviewAction) {
      return;
    }

    const note = reviewNotes.trim();

    if (!note) {
      Alert.alert(
        'Review note required',
        'Please explain the reason for this action.',
      );
      return;
    }

    const targetStatus: PropertyStatus =
      reviewAction === 'changes'
        ? 'CHANGES_REQUIRED'
        : 'REJECTED';

    await changeStatus(
      targetStatus,
      note,
    );

    setReviewAction(null);
    setReviewNotes('');
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve property?',
      'This will move the property to ACTIVE. Customers can see it only when the customer-facing availability rules are satisfied.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: () =>
            changeStatus(
              'ACTIVE',
              'Property approved and activated by admin.',
            ),
        },
      ],
    );
  };

  const requestChanges = () => {
    setReviewNotes('');
    setReviewAction('changes');
  };

  const rejectProperty = () => {
    setReviewNotes('');
    setReviewAction('reject');
  };

  const markAsRented = () => {
    Alert.alert(
      'Mark property as rented?',
      'This will move the property to RENTED and make it unavailable.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Rented',
          style: 'destructive',
          onPress: () =>
            changeStatus(
              'RENTED',
              'Property marked as rented by admin.',
            ),
        },
      ],
    );
  };

  const deactivateProperty = () => {
    Alert.alert(
      'Deactivate property?',
      'The property will no longer be active for customers.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deactivate',
          onPress: () =>
            changeStatus(
              'INACTIVE',
              'Property deactivated by admin.',
            ),
        },
      ],
    );
  };

  const toggleAmenity = (id: string) => {
    if (!canEdit) {
      return;
    }

    setSelectedAmenityIds(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) => item !== id,
            )
          : [...current, id],
    );
  };

  const selectPurpose = (
    item: { id: string; name: string },
  ) => {
    if (!canEdit) {
      return;
    }

    const next = item.id as Purpose;

    setPurpose(next);
    setShowPurposePicker(false);

    if (next === 'LONG_STAY') {
      setShortStayType('');
      setStayMode('');
      setDayRate('');
      setNightRate('');
      setDayNightRate('');
      setBeds('');
      setMaxGuests('');
      setRooms('');
      setInspectionFee('');
    } else {
      setLongStayType('');
      setMonthlyRent('');
      setDeposit('');
      setViewingFee('');
      setServiceCharge('');
    }
  };

  const selectPropertyType = (
    item: { id: string; name: string },
  ) => {
    if (!canEdit) {
      return;
    }

    if (purpose === 'LONG_STAY') {
      setLongStayType(
        item.id as LongStayType,
      );
    } else {
      setShortStayType(
        item.id as ShortStayType,
      );
    }

    setShowPropertyTypePicker(false);
  };

  const selectStayMode = (
    item: { id: string; name: string },
  ) => {
    if (!canEdit) {
      return;
    }

    setStayMode(item.id as StayMode);

    if (item.id === 'DAY') {
      setNightRate('');
      setDayNightRate('');
    }

    if (item.id === 'OVERNIGHT') {
      setDayRate('');
      setDayNightRate('');
    }

    if (item.id === 'DAY_AND_NIGHT') {
      setDayRate('');
      setNightRate('');
    }

    setShowStayModePicker(false);
  };

  const selectFurnishing = (
    item: { id: string; name: string },
  ) => {
    if (!canEdit) {
      return;
    }

    setFurnishing(item.id as FurnishingType);
    setShowFurnishingPicker(false);
  };

  const selectCounty = (
    item: GeographyItem,
  ) => {
    if (!canEdit) {
      return;
    }

    setCountyId(item.id);
    setConstituencyId('');
    setWardId('');
    setConstituencies([]);
    setWards([]);
    setShowCountyPicker(false);
  };

  const selectConstituency = (
    item: GeographyItem,
  ) => {
    if (!canEdit) {
      return;
    }

    setConstituencyId(item.id);
    setWardId('');
    setWards([]);
    setShowConstituencyPicker(
      false,
    );
  };

  const selectWard = (
    item: GeographyItem,
  ) => {
    if (!canEdit) {
      return;
    }

    setWardId(item.id);
    setShowWardPicker(false);
  };

  const selectMarketer = (
    item: Marketer,
  ) => {
    if (!canEdit) {
      return;
    }

    setSelectedMarketerId(item.id);
    setShowMarketerPicker(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text style={styles.loadingText}>
          Loading property...
        </Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <XCircle
            size={30}
            color={COLORS.danger}
          />
        </View>

        <Text style={styles.errorTitle}>
          Property not found
        </Text>

        <Text style={styles.errorText}>
          {error ||
            'The requested property could not be loaded.'}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={18}
            color={COLORS.background}
          />

          <Text
            style={
              styles.primaryButtonText
            }
          >
            Back to Properties
          </Text>
        </Pressable>
      </View>
    );
  }

  const pricingSummary =
    property.purpose ===
    'SHORT_STAY'
      ? property.stayMode === 'DAY'
        ? formatMoney(
            property.dayRate,
          )
        : property.stayMode ===
          'OVERNIGHT'
        ? formatMoney(
            property.nightRate,
          )
        : property.stayMode ===
          'DAY_AND_NIGHT'
        ? formatMoney(
            property.dayNightRate,
          )
        : 'Flexible pricing'
      : formatMoney(
          property.monthlyRent,
        );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={20}
            color={COLORS.white}
          />
        </Pressable>

        <View style={styles.topBarTitleWrap}>
          <Text
            style={
              styles.topBarEyebrow
            }
          >
            PROPERTY MANAGEMENT
          </Text>

          <Text
            style={styles.topBarTitle}
            numberOfLines={1}
          >
            {property.title}
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={refresh}
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
              color={COLORS.white}
            />
          )}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <XCircle
            size={18}
            color={COLORS.danger}
          />

          <Text
            style={styles.errorBannerText}
          >
            {error}
          </Text>

          <Pressable
            onPress={() => setError('')}
          >
            <X
              size={17}
              color={COLORS.muted}
            />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.lime}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      statusColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      statusColor,
                  },
                ]}
              >
                {
                  STATUS_LABELS[
                    property.status
                  ]
                }
              </Text>
            </View>

            <Text
              style={styles.propertyId}
              numberOfLines={1}
            >
              ID: {property.id}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {property.title}
          </Text>

          <Text style={styles.heroType}>
            {getPurposeLabel(
              property.purpose,
            )}{' '}
            • {getPropertyTypeLabel(
              property,
            )}
          </Text>

          <View style={styles.heroStats}>
            <MiniStat
              label={
                property.purpose ===
                'LONG_STAY'
                  ? 'MONTHLY RENT'
                  : 'STAY PRICE'
              }
              value={pricingSummary}
            />

            <MiniStat
              label={
                property.purpose === 'SHORT_STAY'
                  ? 'INSPECTION FEE'
                  : 'VIEWING FEE'
              }
              value={formatMoney(
                property.purpose === 'SHORT_STAY'
                  ? property.inspectionFee
                  : property.viewingFee,
              )}
            />

            <MiniStat
              label="DEPOSIT"
              value={formatMoney(
                property.deposit,
              )}
            />
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text
            style={styles.actionTitle}
          >
            PROPERTY WORKFLOW
          </Text>

          <Text
            style={styles.actionSubtitle}
          >
            Manage the official backend property lifecycle.
          </Text>

          <View style={styles.actionGrid}>
            {property.status ===
            'PENDING_VERIFICATION' ? (
              <>
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.approveButton,
                  ]}
                  onPress={
                    handleApprove
                  }
                  disabled={reviewing}
                >
                  <Check
                    size={17}
                    color={
                      COLORS.background
                    }
                  />

                  <Text
                    style={
                      styles.approveButtonText
                    }
                  >
                    Approve
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.actionButton
                  }
                  onPress={
                    requestChanges
                  }
                  disabled={reviewing}
                >
                  <FileCheck2
                    size={17}
                    color={
                      COLORS.white
                    }
                  />

                  <Text
                    style={
                      styles.actionButtonText
                    }
                  >
                    Request Changes
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionButton,
                    styles.rejectButton,
                  ]}
                  onPress={
                    rejectProperty
                  }
                  disabled={reviewing}
                >
                  <XCircle
                    size={17}
                    color={
                      COLORS.white
                    }
                  />

                  <Text
                    style={
                      styles.actionButtonText
                    }
                  >
                    Reject
                  </Text>
                </Pressable>
              </>
            ) : null}

            {property.status ===
            'DRAFT' ? (
              <Pressable
                style={[
                  styles.actionButton,
                  styles.approveButton,
                ]}
                onPress={() =>
                  changeStatus(
                    'PENDING_VERIFICATION',
                    'Property submitted for verification by admin.',
                  )
                }
                disabled={reviewing}
              >
                <ShieldCheck
                  size={17}
                  color={
                    COLORS.background
                  }
                />

                <Text
                  style={
                    styles.approveButtonText
                  }
                >
                  Submit for Verification
                </Text>
              </Pressable>
            ) : null}

            {property.status ===
            'CHANGES_REQUIRED' ? (
              <Pressable
                style={[
                  styles.actionButton,
                  styles.approveButton,
                ]}
                onPress={() =>
                  changeStatus(
                    'PENDING_VERIFICATION',
                    'Property resubmitted after requested changes.',
                  )
                }
                disabled={reviewing}
              >
                <ShieldCheck
                  size={17}
                  color={
                    COLORS.background
                  }
                />

                <Text
                  style={
                    styles.approveButtonText
                  }
                >
                  Resubmit for Verification
                </Text>
              </Pressable>
            ) : null}

            {property.status ===
            'ACTIVE' ? (
              <>
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.rentedButton,
                  ]}
                  onPress={
                    markAsRented
                  }
                  disabled={reviewing}
                >
                  <Text
                    style={
                      styles.rentedButtonText
                    }
                  >
                    Mark as Rented
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.actionButton
                  }
                  onPress={
                    deactivateProperty
                  }
                  disabled={reviewing}
                >
                  <Text
                    style={
                      styles.actionButtonText
                    }
                  >
                    Deactivate
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        <Section
          number="01"
          title="Basic information"
          subtitle="Core property details"
        >
          <Field
            label="Property title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Modern Bedsitter"
            editable={canEdit}
          />

          <Text
            style={styles.fieldLabel}
          >
            Purpose
          </Text>

          <SelectField
            value={getPurposeLabel(
              purpose,
            )}
            placeholder="Select purpose"
            disabled={!canEdit}
            onPress={() =>
              setShowPurposePicker(
                true,
              )
            }
          />

          <Text
            style={styles.fieldLabel}
          >
            Property type
          </Text>

          <SelectField
            value={
              selectedTypeLabel ===
              'Not set'
                ? ''
                : selectedTypeLabel
            }
            placeholder="Select property type"
            disabled={!canEdit}
            onPress={() =>
              setShowPropertyTypePicker(
                true,
              )
            }
          />

          {purpose ===
          'SHORT_STAY' ? (
            <>
              <Text
                style={
                  styles.fieldLabel
                }
              >
                Stay mode
              </Text>

              <SelectField
                value={
                  STAY_MODE_OPTIONS.find(
                    (item) =>
                      item.id ===
                      stayMode,
                  )?.name ?? ''
                }
                placeholder="Select stay mode"
                disabled={!canEdit}
                onPress={() =>
                  setShowStayModePicker(
                    true,
                  )
                }
              />
            </>
          ) : null}

          <Text
            style={styles.fieldLabel}
          >
            Furnishing
          </Text>

          <SelectField
            value={
              FURNISHING_OPTIONS.find(
                (item) =>
                  item.id ===
                  furnishing,
              )?.name ?? ''
            }
            placeholder="Select furnishing"
            disabled={!canEdit}
            onPress={() =>
              setShowFurnishingPicker(
                true,
              )
            }
          />

          <Field
            label="Description"
            value={description}
            onChangeText={
              setDescription
            }
            placeholder="Describe the property..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={canEdit}
          />
        </Section>

        <Section
          number="02"
          title={
            purpose ===
            'LONG_STAY'
              ? 'Long-stay pricing'
              : 'Short-stay pricing'
          }
          subtitle={
            purpose ===
            'LONG_STAY'
              ? 'Monthly rental pricing and customer fees'
              : 'Rates based on the selected stay mode'
          }
        >
          {purpose ===
          'LONG_STAY' ? (
            <>
              <View
                style={
                  styles.twoColumns
                }
              >
                <Field
                  label="Monthly rent"
                  value={
                    monthlyRent
                  }
                  onChangeText={
                    setMonthlyRent
                  }
                  placeholder="25000"
                  keyboardType="numeric"
                  editable={
                    canEdit
                  }
                  flex={1}
                />

                <Field
                  label="Viewing fee"
                  value={
                    viewingFee
                  }
                  onChangeText={
                    setViewingFee
                  }
                  placeholder="500"
                  keyboardType="numeric"
                  editable={
                    canEdit
                  }
                  flex={1}
                />
              </View>

              <View
                style={
                  styles.twoColumns
                }
              >
                <Field
                  label="Deposit"
                  value={deposit}
                  onChangeText={
                    setDeposit
                  }
                  placeholder="25000"
                  keyboardType="numeric"
                  editable={
                    canEdit
                  }
                  flex={1}
                />

                <Field
                  label="Service charge"
                  value={
                    serviceCharge
                  }
                  onChangeText={
                    setServiceCharge
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  editable={
                    canEdit
                  }
                  flex={1}
                />
              </View>

              <View
                style={
                  styles.infoBox
                }
              >
                <Text
                  style={
                    styles.infoBoxTitle
                  }
                >
                  CUSTOMER PAYMENT INFORMATION
                </Text>

                <Text
                  style={
                    styles.infoBoxText
                  }
                >
                  Monthly rent is the recurring
                  rental amount. Viewing fee is
                  charged when a customer requests
                  a viewing. Deposit and service
                  charge are stored on the property
                  record.
                </Text>
              </View>
            </>
          ) : (
            <>
              <Field
                label="Inspection fee"
                value={inspectionFee}
                onChangeText={setInspectionFee}
                placeholder="500"
                keyboardType="numeric"
                editable={canEdit}
              />

              {stayMode ===
              'DAY' ? (
                <Field
                  label="Day rate"
                  value={dayRate}
                  onChangeText={
                    setDayRate
                  }
                  placeholder="1500"
                  keyboardType="numeric"
                  editable={canEdit}
                />
              ) : null}

              {stayMode ===
              'OVERNIGHT' ? (
                <Field
                  label="Overnight rate"
                  value={nightRate}
                  onChangeText={
                    setNightRate
                  }
                  placeholder="2500"
                  keyboardType="numeric"
                  editable={canEdit}
                />
              ) : null}

              {stayMode ===
              'DAY_AND_NIGHT' ? (
                <Field
                  label="Day & Night rate"
                  value={
                    dayNightRate
                  }
                  onChangeText={
                    setDayNightRate
                  }
                  placeholder="4000"
                  keyboardType="numeric"
                  editable={canEdit}
                />
              ) : null}

              {stayMode ===
              'FLEXIBLE' ? (
                <View
                  style={
                    styles.twoColumns
                  }
                >
                  <Field
                    label="Day rate"
                    value={dayRate}
                    onChangeText={
                      setDayRate
                    }
                    placeholder="1500"
                    keyboardType="numeric"
                    editable={
                      canEdit
                    }
                    flex={1}
                  />

                  <Field
                    label="Overnight rate"
                    value={
                      nightRate
                    }
                    onChangeText={
                      setNightRate
                    }
                    placeholder="2500"
                    keyboardType="numeric"
                    editable={
                      canEdit
                    }
                    flex={1}
                  />
                </View>
              ) : null}

              {stayMode ===
              'FLEXIBLE' ? (
                <Field
                  label="Day & Night rate"
                  value={
                    dayNightRate
                  }
                  onChangeText={
                    setDayNightRate
                  }
                  placeholder="4000"
                  keyboardType="numeric"
                  editable={canEdit}
                />
              ) : null}

              <View
                style={
                  styles.infoBox
                }
              >
                <Text
                  style={
                    styles.infoBoxTitle
                  }
                >
                  SHORT-STAY PRICING
                </Text>

                <Text
                  style={
                    styles.infoBoxText
                  }
                >
                  The backend stores separate day,
                  overnight and day-and-night rates.
                  The selected stay mode determines
                  which rate is required.
                </Text>
              </View>
            </>
          )}
        </Section>

        <Section
          number="03"
          title="Property specifications"
          subtitle={
            purpose ===
            'SHORT_STAY'
              ? 'Rooms, beds and maximum guests'
              : 'Bedrooms and bathrooms'
          }
        >
          <View
            style={styles.twoColumns}
          >
            <Field
              label="Bedrooms"
              value={bedrooms}
              onChangeText={
                setBedrooms
              }
              placeholder="1"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />

            <Field
              label="Bathrooms"
              value={bathrooms}
              onChangeText={
                setBathrooms
              }
              placeholder="1"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />
          </View>

          {purpose ===
          'SHORT_STAY' ? (
            <>
              <View
                style={
                  styles.twoColumns
                }
              >
                <Field
                  label="Rooms"
                  value={rooms}
                  onChangeText={
                    setRooms
                  }
                  placeholder="1"
                  keyboardType="numeric"
                  editable={
                    canEdit
                  }
                  flex={1}
                />

                <Field
                  label="Beds"
                  value={beds}
                  onChangeText={
                    setBeds
                  }
                  placeholder="1"
                  keyboardType="numeric"
                  editable={
                    canEdit
                  }
                  flex={1}
                />
              </View>

              <Field
                label="Maximum guests"
                value={maxGuests}
                onChangeText={
                  setMaxGuests
                }
                placeholder="2"
                keyboardType="numeric"
                editable={canEdit}
              />

              <View
                style={
                  styles.infoBox
                }
              >
                <Text
                  style={
                    styles.infoBoxTitle
                  }
                >
                  SHORT-STAY CAPACITY
                </Text>

                <Text
                  style={
                    styles.infoBoxText
                  }
                >
                  Rooms and maximum guests are required
                  by the backend for short-stay properties.
                  This is especially important for B&B,
                  guest-house, lodge and holiday-home
                  listings.
                </Text>
              </View>
            </>
          ) : null}
        </Section>

        <Section
          number="04"
          title="Location"
          subtitle="Kenya's official county → constituency → ward hierarchy"
        >
          <Text
            style={styles.fieldLabel}
          >
            County
          </Text>

          <SelectField
            value={
              selectedCounty?.name ??
              property.county ??
              ''
            }
            placeholder="Select county"
            disabled={!canEdit}
            onPress={() =>
              setShowCountyPicker(
                true,
              )
            }
          />

          <Text
            style={styles.fieldLabel}
          >
            Constituency
          </Text>

          <SelectField
            value={
              selectedConstituency?.name ??
              property.constituency?.name ??
              ''
            }
            placeholder="Select constituency"
            disabled={
              !canEdit ||
              !countyId
            }
            onPress={() =>
              setShowConstituencyPicker(
                true,
              )
            }
          />

          <Text
            style={styles.fieldLabel}
          >
            Ward
          </Text>

          <SelectField
            value={
              selectedWard?.name ??
              property.ward?.name ??
              ''
            }
            placeholder="Select ward"
            disabled={
              !canEdit ||
              !constituencyId
            }
            onPress={() =>
              setShowWardPicker(
                true,
              )
            }
          />

          <View
            style={
              styles.locationSummary
            }
          >
            <Text
              style={
                styles.locationSummaryLabel
              }
            >
              PROPERTY LOCATION
            </Text>

            <Text
              style={
                styles.locationSummaryText
              }
            >
              {selectedCounty?.name ??
                property.countyRelation
                  ?.name ??
                property.county ??
                'County not available'}
              {'  ›  '}
              {selectedConstituency
                ?.name ??
                property.constituency
                  ?.name ??
                'Constituency not available'}
              {'  ›  '}
              {selectedWard?.name ??
                property.ward?.name ??
                'Ward not available'}
            </Text>
          </View>
        </Section>

        <Section
          number="05"
          title="Source marketer"
          subtitle="Internal property ownership/source assignment"
        >
          <Text
            style={styles.fieldLabel}
          >
            Assigned marketer
          </Text>

          <SelectField
            value={
              selectedMarketer
                ? marketerName(
                    selectedMarketer,
                  )
                : property.marketer
                ? marketerName(
                    property.marketer,
                  )
                : ''
            }
            placeholder="Select active marketer"
            disabled={!canEdit}
            onPress={() =>
              setShowMarketerPicker(
                true,
              )
            }
          />

          {selectedMarketer ? (
            <View
              style={
                styles.marketerCard
              }
            >
              <View
                style={
                  styles.marketerAvatar
                }
              >
                <Text
                  style={
                    styles.marketerAvatarText
                  }
                >
                  {(
                    selectedMarketer.user
                      ?.firstName?.[0] ??
                    'M'
                  ).toUpperCase()}
                </Text>
              </View>

              <View
                style={
                  styles.marketerDetails
                }
              >
                <Text
                  style={
                    styles.marketerName
                  }
                >
                  {marketerName(
                    selectedMarketer,
                  )}
                </Text>

                {selectedMarketer
                  .user?.phone ? (
                  <Text
                    style={
                      styles.marketerMeta
                    }
                  >
                    {
                      selectedMarketer
                        .user.phone
                    }
                  </Text>
                ) : null}

                {selectedMarketer
                  .user?.email ? (
                  <Text
                    style={
                      styles.marketerMeta
                    }
                  >
                    {
                      selectedMarketer
                        .user.email
                    }
                  </Text>
                ) : null}

                {selectedMarketer
                  .region ? (
                  <Text
                    style={
                      styles.marketerRegion
                    }
                  >
                    Region: {
                      selectedMarketer.region
                    }
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View
              style={
                styles.warningBox
              }
            >
              <Text
                style={
                  styles.warningBoxTitle
                }
              >
                MARKETER REQUIRED
              </Text>

              <Text
                style={
                  styles.warningBoxText
                }
              >
                Every property must have an active
                marketer assigned before it can be
                properly managed through the MAKAZII
                property workflow.
              </Text>
            </View>
          )}

          <View
            style={
              styles.internalNotice
            }
          >
            <ShieldCheck
              size={18}
              color={COLORS.lime}
            />

            <Text
              style={
                styles.internalNoticeText
              }
            >
              Marketer assignment is internal
              administration data. It is not customer-facing
              property information.
            </Text>
          </View>
        </Section>

        <Section
          number="06"
          title="Amenities"
          subtitle="Amenities stored in the backend"
        >
          {amenities.length ===
          0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Text
                style={
                  styles.emptyCardText
                }
              >
                No amenities were returned by the backend.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.chipGrid
              }
            >
              {amenities.map(
                (amenity) => {
                  const active =
                    selectedAmenityIds.includes(
                      amenity.id,
                    );

                  return (
                    <Pressable
                      key={
                        amenity.id
                      }
                      disabled={
                        !canEdit
                      }
                      onPress={() =>
                        toggleAmenity(
                          amenity.id,
                        )
                      }
                      style={[
                        styles.chip,
                        active &&
                          styles.chipActive,
                        !canEdit &&
                          styles.disabledChip,
                      ]}
                    >
                      {active ? (
                        <Check
                          size={
                            14
                          }
                          color={
                            COLORS.background
                          }
                        />
                      ) : null}

                      <Text
                        style={[
                          styles.chipText,
                          active &&
                            styles.chipTextActive,
                        ]}
                      >
                        {
                          amenity.name
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          )}
        </Section>

        <Section
          number="07"
          title="Property images"
          subtitle="Images currently stored on the backend"
        >
          {!property.images?.length ? (
            <View
              style={
                styles.emptyImages
              }
            >
              <ImageIcon
                size={30}
                color={
                  COLORS.muted
                }
              />

              <Text
                style={
                  styles.emptyImagesTitle
                }
              >
                No property images
              </Text>

              <Text
                style={
                  styles.emptyImagesText
                }
              >
                No images have been stored on this
                property yet. Image storage/upload can
                be connected separately.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.imageGrid
              }
            >
              {[
                ...(property.images ??
                  []),
              ]
                .sort(
                  (a, b) =>
                    (a.sortOrder ??
                      0) -
                    (b.sortOrder ??
                      0),
                )
                .map(
                  (
                    image,
                    index,
                  ) => (
                    <View
                      key={
                        image.id
                      }
                      style={
                        styles.imageCard
                      }
                    >
                      <View
                        style={
                          styles.imagePreview
                        }
                      >
                        {image.url ? (
                          <Image
                            source={{
                              uri: image.url,
                            }}
                            style={
                              styles.propertyImage
                            }
                            resizeMode="cover"
                          />
                        ) : (
                          <ImageIcon
                            size={
                              28
                            }
                            color={
                              COLORS.muted
                            }
                          />
                        )}
                      </View>

                      <View
                        style={
                          styles.imageInfo
                        }
                      >
                        <Text
                          style={
                            styles.imageNumber
                          }
                        >
                          PHOTO{' '}
                          {index +
                            1}
                        </Text>

                        {image.isPrimary ? (
                          <View
                            style={
                              styles.coverBadge
                            }
                          >
                            <Text
                              style={
                                styles.coverBadgeText
                              }
                            >
                              PRIMARY
                            </Text>
                          </View>
                        ) : null}

                        {image.altText ? (
                          <Text
                            style={
                              styles.imageAltText
                            }
                            numberOfLines={
                              2
                            }
                          >
                            {
                              image.altText
                            }
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ),
                )}
            </View>
          )}

          <View
            style={
              styles.storageNotice
            }
          >
            <ShieldCheck
              size={18}
              color={COLORS.lime}
            />

            <Text
              style={
                styles.storageNoticeText
              }
            >
              These images are read from the real property
              record. This screen does not create fake local
              image records.
            </Text>
          </View>
        </Section>

        <Section
          number="08"
          title="Availability"
          subtitle="Whether the property is currently available"
        >
          <View
            style={
              styles.availabilityRow
            }
          >
            <View
              style={
                styles.availabilityInfo
              }
            >
              <Text
                style={
                  styles.availabilityTitle
                }
              >
                {property.available
                  ? 'Available'
                  : 'Unavailable'}
              </Text>

              <Text
                style={
                  styles.availabilitySubtitle
                }
              >
                {property.available
                  ? 'The property is currently marked available.'
                  : 'The property is currently marked unavailable.'}
              </Text>
            </View>

            <Pressable
              disabled={
                !canEdit ||
                saving
              }
              onPress={() =>
                updateAvailability(
                  !property.available,
                )
              }
              style={[
                styles.toggleButton,
                property.available &&
                  styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  property.available &&
                    styles.toggleTextActive,
                ]}
              >
                {property.available
                  ? 'Available'
                  : 'Unavailable'}
              </Text>
            </Pressable>
          </View>

          {property.status ===
          'RENTED' ? (
            <View
              style={
                styles.rentedNotice
              }
            >
              <Text
                style={
                  styles.rentedNoticeTitle
                }
              >
                RENTED PROPERTY
              </Text>

              <Text
                style={
                  styles.rentedNoticeText
                }
              >
                A rented property cannot be returned to an
                available state. Its history remains in the
                system.
              </Text>
            </View>
          ) : null}
        </Section>

        <Section
          number="09"
          title="Property workflow"
          subtitle="Backend status and review history"
        >
          <View
            style={
              styles.workflowCard
            }
          >
            <View
              style={
                styles.workflowStatus
              }
            >
              <View
                style={[
                  styles.workflowDot,
                  {
                    backgroundColor:
                      statusColor,
                  },
                ]}
              />

              <Text
                style={
                  styles.workflowStatusText
                }
              >
                {
                  STATUS_LABELS[
                    property.status
                  ]
                }
              </Text>
            </View>

            <Text
              style={
                styles.workflowDescription
              }
            >
              Customers should only receive properties that
              are ACTIVE and available according to the
              customer-facing marketplace rules.
            </Text>
          </View>

          <View
            style={styles.metaGrid}
          >
            <Meta
              label="PURPOSE"
              value={getPurposeLabel(
                property.purpose,
              )}
            />

            <Meta
              label="PROPERTY TYPE"
              value={getPropertyTypeLabel(
                property,
              )}
            />

            <Meta
              label="CREATED"
              value={formatDateTime(
                property.createdAt,
              )}
            />

            <Meta
              label="LAST UPDATED"
              value={formatDateTime(
                property.updatedAt,
              )}
            />

            <Meta
              label="VIEWING REQUESTS"
              value={String(
                property._count
                  ?.viewingRequests ??
                  0,
              )}
            />

            <Meta
              label="SHORTLISTS"
              value={String(
                property._count
                  ?.shortlists ?? 0,
              )}
            />
          </View>

          {property.statusHistory
            ?.length ? (
            <View
              style={
                styles.historyList
              }
            >
              {property.statusHistory
                .slice()
                .reverse()
                .map(
                  (history) => (
                    <View
                      key={
                        history.id
                      }
                      style={
                        styles.historyItem
                      }
                    >
                      <View
                        style={
                          styles.historyDot
                        }
                      />

                      <View
                        style={
                          styles.historyContent
                        }
                      >
                        <Text
                          style={
                            styles.historyStatus
                          }
                        >
                          {history.fromStatus
                            ? `${STATUS_LABELS[history.fromStatus]} → `
                            : ''}
                          {
                            STATUS_LABELS[
                              history.toStatus
                            ]
                          }
                        </Text>

                        <Text
                          style={
                            styles.historyDate
                          }
                        >
                          {formatDateTime(
                            history.createdAt,
                          )}
                        </Text>

                        {history.note ? (
                          <Text
                            style={
                              styles.historyNote
                            }
                          >
                            {
                              history.note
                            }
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ),
                )}
            </View>
          ) : (
            <View
              style={
                styles.emptyCard
              }
            >
              <Text
                style={
                  styles.emptyCardText
                }
              >
                No workflow history is available.
              </Text>
            </View>
          )}
        </Section>

        {canEdit ? (
          <Pressable
            style={styles.saveButton}
            onPress={
              saveChanges
            }
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.background
                }
              />
            ) : (
              <Save
                size={19}
                color={
                  COLORS.background
                }
              />
            )}

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? 'Saving...'
                : 'Save Property Changes'}
            </Text>
          </Pressable>
        ) : null}

        {property.status ===
        'RENTED' ? (
          <View
            style={
              styles.lockedCard
            }
          >
            <ShieldCheck
              size={20}
              color={
                COLORS.muted
              }
            />

            <View
              style={
                styles.lockedContent
              }
            >
              <Text
                style={
                  styles.lockedTitle
                }
              >
                Property is locked
              </Text>

              <Text
                style={
                  styles.lockedText
                }
              >
                RENTED properties remain in the system for
                historical records and cannot be returned to
                an active or available state.
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>

      <PickerModal
        visible={
          showPurposePicker
        }
        title="Property purpose"
        options={
          PURPOSE_OPTIONS
        }
        selectedId={
          purpose
        }
        onSelect={
          selectPurpose
        }
        onClose={() =>
          setShowPurposePicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showPropertyTypePicker
        }
        title={
          purpose ===
          'SHORT_STAY'
            ? 'Short-stay property type'
            : 'Long-stay property type'
        }
        options={
          purpose ===
          'SHORT_STAY'
            ? SHORT_STAY_OPTIONS
            : LONG_STAY_OPTIONS
        }
        selectedId={
          purpose ===
          'SHORT_STAY'
            ? shortStayType
            : longStayType
        }
        onSelect={
          selectPropertyType
        }
        onClose={() =>
          setShowPropertyTypePicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showStayModePicker
        }
        title="Stay mode"
        options={
          STAY_MODE_OPTIONS
        }
        selectedId={
          stayMode
        }
        onSelect={
          selectStayMode
        }
        onClose={() =>
          setShowStayModePicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showFurnishingPicker
        }
        title="Furnishing"
        options={
          FURNISHING_OPTIONS
        }
        selectedId={
          furnishing
        }
        onSelect={
          selectFurnishing
        }
        onClose={() =>
          setShowFurnishingPicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showCountyPicker
        }
        title="County"
        options={
          counties
        }
        selectedId={
          countyId
        }
        onSelect={
          selectCounty
        }
        onClose={() =>
          setShowCountyPicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showConstituencyPicker
        }
        title="Constituency"
        options={
          constituencies
        }
        selectedId={
          constituencyId
        }
        onSelect={
          selectConstituency
        }
        onClose={() =>
          setShowConstituencyPicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showWardPicker
        }
        title="Ward"
        options={
          wards
        }
        selectedId={
          wardId
        }
        onSelect={
          selectWard
        }
        onClose={() =>
          setShowWardPicker(
            false,
          )
        }
      />

      <PickerModal
        visible={
          showMarketerPicker
        }
        title="Assigned marketer"
        options={marketers.map(
          (item) => ({
            id: item.id,
            name: marketerName(
              item,
            ),
          }),
        )}
        selectedId={
          selectedMarketerId
        }
        onSelect={(item) => {
          const marketer =
            marketers.find(
              (entry) =>
                entry.id ===
                item.id,
            );

          if (marketer) {
            selectMarketer(
              marketer,
            );
          }
        }}
        onClose={() =>
          setShowMarketerPicker(
            false,
          )
        }
      />

      <Modal
        visible={
          reviewAction !== null
        }
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!reviewing) {
            setReviewAction(null);
          }
        }}
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.reviewModal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.modalHeaderText
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {reviewAction ===
                  'changes'
                    ? 'Request changes'
                    : 'Reject property'}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {reviewAction ===
                  'changes'
                    ? 'Tell the submitter exactly what needs to be corrected.'
                    : 'Provide the reason the property is being rejected.'}
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={() =>
                  !reviewing &&
                  setReviewAction(
                    null,
                  )
                }
              >
                <X
                  size={20}
                  color={
                    COLORS.white
                  }
                />
              </Pressable>
            </View>

            <Text
              style={
                styles.fieldLabel
              }
            >
              Review note
            </Text>

            <TextInput
              value={
                reviewNotes
              }
              onChangeText={
                setReviewNotes
              }
              placeholder={
                reviewAction ===
                'changes'
                  ? 'Explain what needs to be corrected...'
                  : 'Explain why this property is being rejected...'
              }
              placeholderTextColor={
                COLORS.muted
              }
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              style={
                styles.reviewInput
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                style={
                  styles.modalCancel
                }
                onPress={() =>
                  setReviewAction(
                    null,
                  )
                }
                disabled={
                  reviewing
                }
              >
                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalConfirm,
                  reviewAction ===
                    'reject' &&
                    styles.modalConfirmReject,
                ]}
                onPress={
                  submitReviewAction
                }
                disabled={
                  reviewing
                }
              >
                {reviewing ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      reviewAction ===
                      'reject'
                        ? COLORS.white
                        : COLORS.background
                    }
                  />
                ) : reviewAction ===
                  'changes' ? (
                  <FileCheck2
                    size={18}
                    color={
                      COLORS.background
                    }
                  />
                ) : (
                  <XCircle
                    size={18}
                    color={
                      COLORS.white
                    }
                  />
                )}

                <Text
                  style={[
                    styles.modalConfirmText,
                    reviewAction ===
                      'reject' &&
                      styles.modalConfirmRejectText,
                  ]}
                >
                  {reviewing
                    ? 'Saving...'
                    : reviewAction ===
                        'changes'
                    ? 'Send Changes Request'
                    : 'Reject Property'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.miniStat}
    >
      <Text
        style={
          styles.miniStatLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.miniStatValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.sectionCard
      }
    >
      <View
        style={
          styles.sectionHeader
        }
      >
        <View
          style={
            styles.sectionNumber
          }
        >
          <Text
            style={
              styles.sectionNumberText
            }
          >
            {number}
          </Text>
        </View>

        <View
          style={
            styles.sectionHeading
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.sectionSubtitle
            }
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.sectionBody
        }
      >
        {children}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  textAlignVertical,
  editable = true,
  flex,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string,
  ) => void;
  placeholder?: string;
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?:
    | 'auto'
    | 'top'
    | 'bottom'
    | 'center';
  editable?: boolean;
  flex?: number;
}) {
  return (
    <View
      style={[
        styles.field,
        flex
          ? {
              flex,
            }
          : undefined,
      ]}
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          COLORS.muted
        }
        keyboardType={
          keyboardType ??
          'default'
        }
        multiline={
          multiline
        }
        numberOfLines={
          numberOfLines
        }
        textAlignVertical={
          textAlignVertical
        }
        editable={
          editable
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
          !editable &&
            styles.disabledInput,
        ]}
      />
    </View>
  );
}

function SelectField({
  value,
  placeholder,
  disabled,
  onPress,
}: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.selectField,
        disabled &&
          styles.disabledInput,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        style={[
          styles.selectText,
          (!value ||
            value ===
              placeholder) &&
            styles.selectPlaceholder,
        ]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>

      <ChevronDown
        size={19}
        color={
          disabled
            ? '#5E6668'
            : COLORS.muted
        }
      />
    </Pressable>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: {
    id: string;
    name: string;
  }[];
  selectedId: string;
  onSelect: (item: {
    id: string;
    name: string;
  }) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.modalBackdrop
        }
      >
        <View
          style={
            styles.pickerModal
          }
        >
          <View
            style={
              styles.pickerHeader
            }
          >
            <View>
              <Text
                style={
                  styles.pickerEyebrow
                }
              >
                SELECT
              </Text>

              <Text
                style={
                  styles.pickerTitle
                }
              >
                {title}
              </Text>
            </View>

            <Pressable
              style={
                styles.closeButton
              }
              onPress={
                onClose
              }
            >
              <X
                size={20}
                color={
                  COLORS.white
                }
              />
            </Pressable>
          </View>

          {options.length ===
          0 ? (
            <View
              style={
                styles.emptyPicker
              }
            >
              <Text
                style={
                  styles.emptyPickerText
                }
              >
                No options available.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={
                styles.pickerScroll
              }
              contentContainerStyle={
                styles.pickerContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {options.map(
                (item) => {
                  const selected =
                    item.id ===
                    selectedId;

                  return (
                    <Pressable
                      key={
                        item.id
                      }
                      style={[
                        styles.pickerOption,
                        selected &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() =>
                        onSelect(
                          item,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selected &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {
                          item.name
                        }
                      </Text>

                      {selected ? (
                        <Check
                          size={
                            18
                          }
                          color={
                            COLORS.background
                          }
                        />
                      ) : null}
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.metaItem}
    >
      <Text
        style={
          styles.metaLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metaValue
        }
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
    padding: 24,
  },

  loadingText: {
    marginTop: 14,
    color: COLORS.muted,
    fontSize: 14,
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,107,107,0.10)',
    marginBottom: 18,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 520,
  },

  primaryButton: {
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
  },

  topBar: {
    minHeight: 76,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    backgroundColor:
      COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  topBarTitleWrap: {
    flex: 1,
  },

  topBarEyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  topBarTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },

  errorBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      'rgba(255,107,107,0.25)',
    backgroundColor:
      'rgba(255,107,107,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  errorBannerText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 19,
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 20,
    gap: 18,
  },

  heroCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 22,
    padding: 22,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    marginRight: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  propertyId: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'right',
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 20,
  },

  heroType: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 7,
  },

  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },

  miniStat: {
    flex: 1,
    minWidth: 150,
    padding: 14,
    borderRadius: 15,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  miniStatLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  miniStatValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 7,
  },

  actionCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 22,
    padding: 20,
  },

  actionTitle: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  actionSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },

  actionButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  approveButton: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  approveButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  actionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  rejectButton: {
    backgroundColor:
      'rgba(255,107,107,0.12)',
    borderColor:
      'rgba(255,107,107,0.30)',
  },

  rentedButton: {
    backgroundColor:
      'rgba(255,200,87,0.12)',
    borderColor:
      'rgba(255,200,87,0.30)',
  },

  rentedButtonText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '900',
  },

  sectionCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 22,
    overflow: 'hidden',
  },

  sectionHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  sectionNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(215,255,95,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(215,255,95,0.20)',
  },

  sectionNumberText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
  },

  sectionHeading: {
    flex: 1,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  sectionBody: {
    padding: 20,
    gap: 14,
  },

  field: {
    minWidth: 0,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 7,
    marginTop: 2,
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    color: COLORS.white,
    fontSize: 14,
  },

  multilineInput: {
    minHeight: 130,
    paddingTop: 13,
  },

  disabledInput: {
    opacity: 0.55,
  },

  selectField: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
  },

  selectText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  selectPlaceholder: {
    color: COLORS.muted,
    fontWeight: '500',
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },

  infoBox: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      'rgba(215,255,95,0.18)',
    backgroundColor:
      'rgba(215,255,95,0.05)',
  },

  infoBoxTitle: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  infoBoxText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  locationSummary: {
    padding: 15,
    borderRadius: 15,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  locationSummaryLabel: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  locationSummaryText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  marketerCard: {
    padding: 15,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  marketerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  marketerAvatarText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '900',
  },

  marketerDetails: {
    flex: 1,
  },

  marketerName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  marketerMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  marketerRegion: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  warningBox: {
    padding: 15,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,200,87,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(255,200,87,0.22)',
  },

  warningBoxTitle: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  warningBoxText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  internalNotice: {
    padding: 14,
    borderRadius: 14,
    backgroundColor:
      'rgba(215,255,95,0.05)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  internalNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  chipActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  disabledChip: {
    opacity: 0.5,
  },

  chipText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },

  chipTextActive: {
    color: COLORS.background,
    fontWeight: '900',
  },

  emptyCard: {
    padding: 18,
    borderRadius: 15,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  emptyCardText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  emptyImages: {
    padding: 28,
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: 'center',
  },

  emptyImagesTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyImagesText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 500,
  },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  imageCard: {
    width: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  imagePreview: {
    height: 130,
    backgroundColor:
      COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  propertyImage: {
    width: '100%',
    height: '100%',
  },

  imageInfo: {
    padding: 11,
  },

  imageNumber: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  coverBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor:
      COLORS.lime,
  },

  coverBadgeText: {
    color: COLORS.background,
    fontSize: 8,
    fontWeight: '900',
  },

  imageAltText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },

  storageNotice: {
    marginTop: 2,
    padding: 14,
    borderRadius: 14,
    backgroundColor:
      'rgba(215,255,95,0.05)',
    flexDirection: 'row',
    gap: 10,
  },

  storageNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  availabilityRow: {
    padding: 16,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  availabilityInfo: {
    flex: 1,
  },

  availabilityTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  availabilitySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  toggleButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleButtonActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  toggleText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },

  toggleTextActive: {
    color: COLORS.background,
  },

  rentedNotice: {
    padding: 15,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,107,107,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(255,107,107,0.20)',
  },

  rentedNoticeTitle: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  rentedNoticeText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  workflowCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  workflowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  workflowDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },

  workflowStatusText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  workflowDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  metaItem: {
    flex: 1,
    minWidth: 145,
    padding: 14,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  metaLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  metaValue: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 6,
  },

  historyList: {
    gap: 0,
  },

  historyItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginTop: 5,
    backgroundColor:
      COLORS.lime,
  },

  historyContent: {
    flex: 1,
  },

  historyStatus: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  historyDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  historyNote: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  saveButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  lockedCard: {
    padding: 17,
    borderRadius: 17,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  lockedContent: {
    flex: 1,
  },

  lockedTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  lockedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  bottomSpace: {
    height: 50,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  pickerModal: {
    maxHeight: '82%',
    backgroundColor:
      COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  pickerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 15,
  },

  pickerEyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  pickerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerScroll: {
    flexGrow: 0,
  },

  pickerContent: {
    padding: 16,
    gap: 8,
  },

  pickerOption: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 10,
  },

  pickerOptionSelected: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  pickerOptionText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  pickerOptionTextSelected: {
    color: COLORS.background,
    fontWeight: '900',
  },

  emptyPicker: {
    padding: 30,
    alignItems: 'center',
  },

  emptyPickerText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  reviewModal: {
    backgroundColor:
      COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    gap: 15,
    marginBottom: 18,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  reviewInput: {
    minHeight: 150,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    color: COLORS.white,
    fontSize: 14,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  modalCancel: {
    minHeight: 48,
    flex: 1,
    borderRadius: 13,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  modalConfirm: {
    minHeight: 48,
    flex: 2,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  modalConfirmReject: {
    backgroundColor:
      COLORS.danger,
  },

  modalConfirmText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },

  modalConfirmRejectText: {
    color: COLORS.white,
  },
});
