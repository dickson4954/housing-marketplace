import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Video,
  X,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

const COLORS = {
  background: '#080B0C',
  sidebar: '#0E1314',
  card: '#121718',
  cardSoft: '#1A2122',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  mutedDark: '#657073',
  border: '#252C2E',
  green: '#7BE495',
  red: '#FF6B6B',
  orange: '#FFC857',
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

type County = {
  id: string;
  name: string;
  sourceId?: string | null;
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

type Amenity = {
  id: string;
  name: string;
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
    isActive?: boolean;
  };
};

type PropertyImage = {
  id: string;
  url: string;
};

type Option<T extends string> = {
  value: T;
  label: string;
};

const PURPOSE_OPTIONS: Option<Purpose>[] = [
  {
    value: 'LONG_STAY',
    label: 'Long Stay',
  },
  {
    value: 'SHORT_STAY',
    label: 'Short Stay',
  },
];

const LONG_STAY_OPTIONS: Option<LongStayType>[] = [
  {
    value: 'SINGLE_ROOM',
    label: 'Single Room',
  },
  {
    value: 'BEDSITTER',
    label: 'Bedsitter',
  },
  {
    value: 'STUDIO',
    label: 'Studio',
  },
  {
    value: 'ONE_BEDROOM',
    label: '1 Bedroom',
  },
  {
    value: 'TWO_BEDROOM',
    label: '2 Bedroom',
  },
  {
    value: 'THREE_BEDROOM',
    label: '3 Bedroom',
  },
  {
    value: 'FOUR_PLUS_BEDROOM',
    label: '4+ Bedroom',
  },
  {
    value: 'HOUSE',
    label: 'House',
  },
  {
    value: 'APARTMENT',
    label: 'Apartment',
  },
];

const SHORT_STAY_OPTIONS: Option<ShortStayType>[] = [
  {
    value: 'BNB',
    label: 'BnB',
  },
  {
    value: 'LODGE',
    label: 'Lodge',
  },
  {
    value: 'GUEST_HOUSE',
    label: 'Guest House',
  },
  {
    value: 'HOTEL_ROOM',
    label: 'Hotel Room',
  },
  {
    value: 'SERVICED_APARTMENT',
    label: 'Serviced Apartment',
  },
  {
    value: 'FURNISHED_APARTMENT',
    label: 'Furnished Apartment',
  },
  {
    value: 'HOLIDAY_HOME',
    label: 'Holiday Home',
  },
  {
    value: 'VILLA',
    label: 'Villa',
  },
  {
    value: 'COTTAGE',
    label: 'Cottage',
  },
  {
    value: 'HOSTEL',
    label: 'Hostel',
  },
  {
    value: 'PRIVATE_ROOM',
    label: 'Private Room',
  },
];

const STAY_MODE_OPTIONS: Option<StayMode>[] = [
  {
    value: 'DAY',
    label: 'Day Stay',
  },
  {
    value: 'OVERNIGHT',
    label: 'Overnight',
  },
  {
    value: 'DAY_AND_NIGHT',
    label: 'Day & Night',
  },
  {
    value: 'FLEXIBLE',
    label: 'Flexible',
  },
];

const FURNISHING_OPTIONS: Option<FurnishingType>[] = [
  {
    value: 'UNFURNISHED',
    label: 'Unfurnished',
  },
  {
    value: 'SEMI_FURNISHED',
    label: 'Semi Furnished',
  },
  {
    value: 'FURNISHED',
    label: 'Furnished',
  },
];

const ADMIN_TOKEN_KEY = 'makazii_admin_token';

async function getAdminToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(
      ADMIN_TOKEN_KEY,
    );
  }

  return SecureStore.getItemAsync(
    ADMIN_TOKEN_KEY,
  );
}

function getApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

async function parseResponse(response: Response) {
  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.data?.message ||
        `Request failed with status ${response.status}.`,
    );
  }

  return data;
}

function responseData(data: any) {
  if (data?.data !== undefined) {
    return data.data;
  }

  return data;
}

function formatEnum(value: string | null | undefined) {
  if (!value) {
    return '';
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

function numberOrUndefined(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const number = Number(trimmed);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return number;
}

export default function AdminAddPropertyPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1000;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] =
    useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [amenities, setAmenities] =
    useState<Amenity[]>([]);

  const [marketers, setMarketers] =
    useState<Marketer[]>([]);

  const [loadingConstituencies, setLoadingConstituencies] =
    useState(false);

  const [loadingWards, setLoadingWards] =
    useState(false);

  const [loadingAmenities, setLoadingAmenities] =
    useState(false);

  const [loadingMarketers, setLoadingMarketers] =
    useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const [purpose, setPurpose] =
    useState<Purpose | null>(null);

  const [longStayType, setLongStayType] =
    useState<LongStayType | null>(null);

  const [shortStayType, setShortStayType] =
    useState<ShortStayType | null>(null);

  const [stayMode, setStayMode] =
    useState<StayMode | null>(null);

  const [furnishing, setFurnishing] =
    useState<FurnishingType | null>(null);

  const [monthlyRent, setMonthlyRent] =
    useState('');

  const [deposit, setDeposit] = useState('');
  const [viewingFee, setViewingFee] =
    useState('');
  const [inspectionFee, setInspectionFee] =
    useState('');
  const [serviceCharge, setServiceCharge] =
    useState('');

  const [dayRate, setDayRate] = useState('');
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

  const [selectedCountyId, setSelectedCountyId] =
    useState('');

  const [
    selectedConstituencyId,
    setSelectedConstituencyId,
  ] = useState('');

  const [selectedWardId, setSelectedWardId] =
    useState('');

  const [selectedAmenityIds, setSelectedAmenityIds] =
    useState<string[]>([]);

  const [selectedMarketerId, setSelectedMarketerId] =
    useState('');

  const [imageUrl, setImageUrl] = useState('');

  const [images, setImages] =
    useState<PropertyImage[]>([]);

  const [propertyVideo, setPropertyVideo] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [purposeOpen, setPurposeOpen] =
    useState(false);

  const [propertyTypeOpen, setPropertyTypeOpen] =
    useState(false);

  const [stayModeOpen, setStayModeOpen] =
    useState(false);

  const [furnishingOpen, setFurnishingOpen] =
    useState(false);

  const [countyOpen, setCountyOpen] =
    useState(false);

  const [
    constituencyOpen,
    setConstituencyOpen,
  ] = useState(false);

  const [wardOpen, setWardOpen] =
    useState(false);

  const [marketerOpen, setMarketerOpen] =
    useState(false);

  const selectedCounty = useMemo(
    () =>
      counties.find(
        (item) =>
          item.id === selectedCountyId,
      ) ?? null,
    [counties, selectedCountyId],
  );

  const selectedConstituency = useMemo(
    () =>
      constituencies.find(
        (item) =>
          item.id === selectedConstituencyId,
      ) ?? null,
    [
      constituencies,
      selectedConstituencyId,
    ],
  );

  const selectedWard = useMemo(
    () =>
      wards.find(
        (item) =>
          item.id === selectedWardId,
      ) ?? null,
    [wards, selectedWardId],
  );

  const selectedMarketer = useMemo(
    () =>
      marketers.find(
        (item) =>
          item.id === selectedMarketerId,
      ) ?? null,
    [marketers, selectedMarketerId],
  );

  const selectedMarketerName = useMemo(() => {
    if (!selectedMarketer?.user) {
      return null;
    }

    const first =
      selectedMarketer.user.firstName ?? '';

    const last =
      selectedMarketer.user.lastName ?? '';

    const fullName =
      `${first} ${last}`.trim();

    return (
      fullName ||
      selectedMarketer.user.email ||
      selectedMarketer.user.phone ||
      'Unnamed marketer'
    );
  }, [selectedMarketer]);

  const selectedTypeLabel = useMemo(() => {
    if (purpose === 'LONG_STAY') {
      return (
        LONG_STAY_OPTIONS.find(
          (item) =>
            item.value === longStayType,
        )?.label ?? 'Not selected'
      );
    }

    if (purpose === 'SHORT_STAY') {
      return (
        SHORT_STAY_OPTIONS.find(
          (item) =>
            item.value === shortStayType,
        )?.label ?? 'Not selected'
      );
    }

    return 'Not selected';
  }, [
    purpose,
    longStayType,
    shortStayType,
  ]);





  async function loadInitialData() {
    try {
      setLoading(true);

      const token = await getAdminToken();

      if (!token) {
        Alert.alert(
          'Session expired',
          'Please log in to the admin portal again.',
        );

        router.replace('/admin/login');
        return;
      }

      setLoadingAmenities(true);
      setLoadingMarketers(true);

      const [
        countyResponse,
        amenityResponse,
        marketerResponse,
      ] = await Promise.all([
        fetch(
          getApiUrl(
            API_ENDPOINTS.geographyCounties,
          ),
        ),
        fetch(
          getApiUrl('/admin/amenities'),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        fetch(
          getApiUrl('/admin/marketers'),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ]);

      const countyData =
        await parseResponse(countyResponse);

      const amenityData =
        await parseResponse(amenityResponse);

      const marketerData =
        await parseResponse(marketerResponse);

      const countyPayload =
        responseData(countyData);

      const amenityPayload =
        responseData(amenityData);

      const marketerPayload =
        responseData(marketerData);

      const countyList: County[] =
        Array.isArray(countyPayload)
          ? countyPayload
          : countyPayload?.counties ?? [];

      const amenityList: Amenity[] =
        Array.isArray(amenityPayload)
          ? amenityPayload
          : amenityPayload?.amenities ?? [];

      const marketerList: Marketer[] =
        Array.isArray(marketerPayload)
          ? marketerPayload
          : marketerPayload?.marketers ?? [];

      setCounties(countyList);
      setAmenities(amenityList);

      setMarketers(
        marketerList.filter(
          (marketer) =>
            marketer.user?.isActive !== false,
        ),
      );
    } catch (error) {
      Alert.alert(
        'Unable to load form',
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
      setLoadingAmenities(false);
      setLoadingMarketers(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData();
    }, 0);

    return () => clearTimeout(timer);
  }, []);


  async function loadConstituencies(
    countyId: string,
  ) {
    try {
      setLoadingConstituencies(true);

      const response = await fetch(
        getApiUrl(
          API_ENDPOINTS.geographyConstituencies(
            countyId,
          ),
        ),
      );

      const data =
        await parseResponse(response);

      const payload =
        responseData(data);

      const list: Constituency[] =
        Array.isArray(payload)
          ? payload
          : payload?.constituencies ?? [];

      setConstituencies(list);
    } catch (error) {
      setConstituencies([]);

      Alert.alert(
        'Unable to load constituencies',
        getErrorMessage(error),
      );
    } finally {
      setLoadingConstituencies(false);
    }
  }

  async function loadWards(
    constituencyId: string,
  ) {
    try {
      setLoadingWards(true);

      const response = await fetch(
        getApiUrl(
          API_ENDPOINTS.geographyWards(
            constituencyId,
          ),
        ),
      );

      const data =
        await parseResponse(response);

      const payload =
        responseData(data);

      const list: Ward[] =
        Array.isArray(payload)
          ? payload
          : payload?.wards ?? [];

      setWards(list);
    } catch (error) {
      setWards([]);

      Alert.alert(
        'Unable to load wards',
        getErrorMessage(error),
      );
    } finally {
      setLoadingWards(false);
    }
  }

  function handlePurposeChange(value: Purpose) {
    setPurpose(value);
    setPurposeOpen(false);
    setPropertyTypeOpen(false);
    setStayModeOpen(false);

    if (value === 'LONG_STAY') {
      setInspectionFee('');
      setShortStayType(null);
      setStayMode(null);
      setDayRate('');
      setNightRate('');
      setDayNightRate('');
      setBeds('');
      setMaxGuests('');
      setRooms('');
    }

    if (value === 'SHORT_STAY') {
      setViewingFee('');
      setLongStayType(null);
      setMonthlyRent('');
      setDeposit('');
      setViewingFee('');
      setServiceCharge('');
    }
  }

  function handleStayModeChange(value: StayMode) {
    setStayMode(value);

    if (value === 'DAY') {
      setNightRate('');
      setDayNightRate('');
    }

    if (value === 'OVERNIGHT') {
      setDayRate('');
      setDayNightRate('');
    }

    if (value === 'DAY_AND_NIGHT') {
      setDayRate('');
      setNightRate('');
    }
  }

  function handleCountyChange(
    county: County,
  ) {
    setSelectedCountyId(county.id);

    setSelectedConstituencyId('');
    setSelectedWardId('');

    setConstituencies([]);
    setWards([]);

    setCountyOpen(false);
    setConstituencyOpen(false);
    setWardOpen(false);

    loadConstituencies(county.id);
  }

  function handleConstituencyChange(
    constituency: Constituency,
  ) {
    setSelectedConstituencyId(
      constituency.id,
    );

    setSelectedWardId('');
    setWards([]);

    setConstituencyOpen(false);
    setWardOpen(false);

    loadWards(constituency.id);
  }

  function handleWardChange(ward: Ward) {
    setSelectedWardId(ward.id);
    setWardOpen(false);
  }

  function toggleAmenity(
    amenityId: string,
  ) {
    setSelectedAmenityIds((current) =>
      current.includes(amenityId)
        ? current.filter(
            (id) => id !== amenityId,
          )
        : [...current, amenityId],
    );
  }

  function addImage() {
    const url = imageUrl.trim();

    if (!url) {
      Alert.alert(
        'Image URL required',
        'Enter the URL of the property image first.',
      );
      return;
    }

    const alreadyExists = images.some(
      (image) => image.url === url,
    );

    if (alreadyExists) {
      Alert.alert(
        'Image already added',
        'This image URL has already been added.',
      );
      return;
    }

    setImages((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        url,
      },
    ]);

    setImageUrl('');
  }

  function removeImage(imageId: string) {
    setImages((current) =>
      current.filter(
        (image) => image.id !== imageId,
      ),
    );
  }

  function validateForm() {
    if (!propertyVideo) {
      return 'Please select a property video.';
    }

    if (!title.trim()) {
      return 'Property title is required.';
    }

    if (!description.trim()) {
      return 'Property description is required.';
    }

    if (!purpose) {
      return 'Please select Long Stay or Short Stay.';
    }

    if (purpose === 'LONG_STAY') {
      if (!longStayType) {
        return 'Please select the long-stay property type.';
      }

      if (
        !monthlyRent.trim() ||
        Number(monthlyRent) <= 0
      ) {
        return 'Enter a valid monthly rent.';
      }

      if (
        deposit.trim() &&
        Number(deposit) < 0
      ) {
        return 'Deposit cannot be negative.';
      }

      if (
        viewingFee.trim() &&
        Number(viewingFee) < 0
      ) {
        return 'Viewing fee cannot be negative.';
      }

      if (
        serviceCharge.trim() &&
        Number(serviceCharge) < 0
      ) {
        return 'Service charge cannot be negative.';
      }
    }

    if (purpose === 'SHORT_STAY') {
      if (!shortStayType) {
        return 'Please select the short-stay property type.';
      }

      if (!stayMode) {
        return 'Please select the stay mode.';
      }

      if (
        !inspectionFee.trim() ||
        Number(inspectionFee) <= 0
      ) {
        return 'Enter a valid short-stay inspection fee.';
      }

      if (
        !maxGuests.trim() ||
        Number(maxGuests) <= 0
      ) {
        return 'Enter the maximum number of guests.';
      }

      if (
        !rooms.trim() ||
        Number(rooms) <= 0
      ) {
        return 'Enter the number of rooms.';
      }

      if (
        beds.trim() &&
        Number(beds) < 0
      ) {
        return 'Beds cannot be negative.';
      }

      if (stayMode === 'DAY') {
        if (
          !dayRate.trim() ||
          Number(dayRate) <= 0
        ) {
          return 'Enter the day rate.';
        }
      }

      if (stayMode === 'OVERNIGHT') {
        if (
          !nightRate.trim() ||
          Number(nightRate) <= 0
        ) {
          return 'Enter the overnight rate.';
        }
      }

      if (stayMode === 'DAY_AND_NIGHT') {
        if (
          !dayNightRate.trim() ||
          Number(dayNightRate) <= 0
        ) {
          return 'Enter the day & night rate.';
        }
      }

      if (stayMode === 'FLEXIBLE') {
        const hasRate =
          Number(dayRate) > 0 ||
          Number(nightRate) > 0 ||
          Number(dayNightRate) > 0;

        if (!hasRate) {
          return 'For flexible stays, enter at least one valid rate.';
        }
      }
    }

    if (
      bedrooms.trim() &&
      Number(bedrooms) < 0
    ) {
      return 'Bedrooms cannot be negative.';
    }

    if (
      bathrooms.trim() &&
      Number(bathrooms) < 0
    ) {
      return 'Bathrooms cannot be negative.';
    }

    if (!selectedCountyId) {
      return 'Please select a county.';
    }

    if (!selectedConstituencyId) {
      return 'Please select a constituency.';
    }

    if (!selectedWardId) {
      return 'Please select a ward.';
    }

    if (!selectedMarketerId) {
      return 'Please assign an active marketer.';
    }

    return null;
  }


  async function choosePropertyVideo() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Allow gallery access to select the property video.',
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsMultipleSelection: false,
          videoMaxDuration: 120,
          quality: 0.8,
        });

      if (!result.canceled && result.assets.length > 0) {
        setPropertyVideo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(
        'Video selection failed',
        error instanceof Error
          ? error.message
          : 'Could not select the property video.',
      );
    }
  }

  async function uploadPropertyVideo(token: string) {
    if (!propertyVideo) {
      throw new Error('Select a property video before submitting.');
    }

    const form = new FormData();
    const uri = propertyVideo.uri;
    const name = propertyVideo.fileName || 'property-video.mp4';
    const mimeType = propertyVideo.mimeType || 'video/mp4';

    if (Platform.OS === 'web') {
      const fileResponse = await fetch(uri);

      if (!fileResponse.ok) {
        throw new Error('Could not read the selected video file.');
      }

      const blob = await fileResponse.blob();
      form.append('video', blob, name);
    } else {
      form.append('video', { uri, name, type: mimeType } as any);
    }

    const response = await fetch(
      getApiUrl(API_ENDPOINTS.adminPropertyVideos),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: form,
      },
    );

    const json = (await response.json()) as {
      success?: boolean;
      message?: string;
      video?: {
        url: string;
        publicId: string;
        mimeType: string;
      };
    };

    if (!response.ok || !json.success || !json.video?.url ||
        !json.video.publicId || !json.video.mimeType) {
      throw new Error(
        json.message || 'Failed to upload the property video.',
      );
    }

    return {
      videoUrl: json.video.url,
      videoPublicId: json.video.publicId,
      videoMimeType: json.video.mimeType,
    };
  }

  async function saveProperty() {
    const validationError =
      validateForm();

    if (validationError) {
      Alert.alert(
        'Missing information',
        validationError,
      );
      return;
    }

    try {
      setSaving(true);

      const token = await getAdminToken();

      if (!token) {
        Alert.alert(
          'Session expired',
          'Please log in again.',
        );

        router.replace('/admin/login');
        return;
      }

      const uploadedVideo = await uploadPropertyVideo(token);

      const payload = {
        videoUrl: uploadedVideo.videoUrl,
        videoPublicId: uploadedVideo.videoPublicId,
        videoMimeType: uploadedVideo.videoMimeType,
        title: title.trim(),

        description:
          description.trim(),

        purpose,

        longStayType:
          purpose === 'LONG_STAY'
            ? longStayType
            : undefined,

        shortStayType:
          purpose === 'SHORT_STAY'
            ? shortStayType
            : undefined,

        stayMode:
          purpose === 'SHORT_STAY'
            ? stayMode
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
            ? numberOrUndefined(
                deposit,
              )
            : undefined,

        viewingFee:
          purpose === 'LONG_STAY'
            ? numberOrUndefined(
                viewingFee,
              )
            : undefined,

        inspectionFee:
          purpose === 'SHORT_STAY'
            ? numberOrUndefined(
                inspectionFee,
              )
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

        countyId:
          selectedCountyId,

        constituencyId:
          selectedConstituencyId,

        wardId:
          selectedWardId,

        available: true,

        verified: false,

        marketerId:
          selectedMarketerId,

        amenityIds:
          selectedAmenityIds,

        images: images.map(
          (image, index) => ({
            url: image.url,
            altText: title.trim(),
            sortOrder: index,
            isPrimary: index === 0,
          }),
        ),
      };

      const response = await fetch(
        getApiUrl('/admin/properties'),
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      await parseResponse(response);

      Alert.alert(
        'Property created',
        'The property has been created as a draft and assigned to the selected marketer.',
        [
          {
            text: 'View properties',
            onPress: () =>
              router.replace(
                '/admin/properties',
              ),
          },
          {
            text: 'Add another',
            onPress: resetForm,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to create property',
        getErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');

    setPurpose(null);
    setLongStayType(null);
    setShortStayType(null);
    setStayMode(null);
    setFurnishing(null);

    setMonthlyRent('');
    setDeposit('');
    setViewingFee('');
    setInspectionFee('');
    setServiceCharge('');

    setDayRate('');
    setNightRate('');
    setDayNightRate('');

    setBedrooms('');
    setBathrooms('');
    setBeds('');
    setMaxGuests('');
    setRooms('');

    setSelectedCountyId('');
    setSelectedConstituencyId('');
    setSelectedWardId('');
    setSelectedMarketerId('');

    setConstituencies([]);
    setWards([]);

    setSelectedAmenityIds([]);
    setImages([]);
    setImageUrl('');
    setPropertyVideo(null);

    setPurposeOpen(false);
    setPropertyTypeOpen(false);
    setStayModeOpen(false);
    setFurnishingOpen(false);
    setCountyOpen(false);
    setConstituencyOpen(false);
    setWardOpen(false);
    setMarketerOpen(false);
  }

  function renderFieldLabel(
    label: string,
    required = true,
  ) {
    return (
      <Text style={styles.fieldLabel}>
        {label.toUpperCase()}
        {required ? ' *' : ''}
      </Text>
    );
  }

  function renderSimpleDropdown<T extends string>(
    value: T | null,
    placeholder: string,
    open: boolean,
    setOpen: (value: boolean) => void,
    options: Option<T>[],
    onSelect: (value: T) => void,
  ) {
    const selected = options.find(
      (item) => item.value === value,
    );

    return (
      <View style={styles.dropdownWrapper}>
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setOpen(!open)}
        >
          <Text
            style={[
              styles.dropdownText,
              !selected &&
                styles.dropdownPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selected?.label ??
              placeholder}
          </Text>

          <ChevronDown
            size={19}
            color={COLORS.muted}
          />
        </Pressable>

        {open && (
          <View
            style={styles.dropdownOptions}
          >
            <ScrollView
              nestedScrollEnabled
              style={
                styles.dropdownOptionsScroll
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {options.map((item) => {
                const isSelected =
                  item.value === value;

                return (
                  <Pressable
                    key={item.value}
                    style={[
                      styles.dropdownOption,
                      isSelected &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {isSelected && (
                      <Check
                        size={17}
                        color={
                          COLORS.lime
                        }
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  function renderDataDropdown<T extends {
    id: string;
    name: string;
  }>(
    value: T | null,
    placeholder: string,
    open: boolean,
    setOpen: (value: boolean) => void,
    options: T[],
    onSelect: (item: T) => void,
    disabled = false,
    loadingValue = false,
  ) {
    return (
      <View style={styles.dropdownWrapper}>
        <Pressable
          disabled={disabled}
          style={[
            styles.dropdownButton,
            disabled &&
              styles.dropdownDisabled,
          ]}
          onPress={() =>
            setOpen(!open)
          }
        >
          <Text
            style={[
              styles.dropdownText,
              !value &&
                styles.dropdownPlaceholder,
            ]}
            numberOfLines={1}
          >
            {loadingValue
              ? 'Loading...'
              : value?.name ??
                placeholder}
          </Text>

          {loadingValue ? (
            <ActivityIndicator
              size="small"
              color={COLORS.muted}
            />
          ) : (
            <ChevronDown
              size={19}
              color={COLORS.muted}
            />
          )}
        </Pressable>

        {open && !disabled && (
          <View
            style={styles.dropdownOptions}
          >
            <ScrollView
              nestedScrollEnabled
              style={
                styles.dropdownOptionsScroll
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {options.length === 0 ? (
                <View
                  style={
                    styles.dropdownEmpty
                  }
                >
                  <Text
                    style={
                      styles.dropdownEmptyText
                    }
                  >
                    No options available.
                  </Text>
                </View>
              ) : (
                options.map((item) => {
                  const selected =
                    value?.id === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.dropdownOption,
                        selected &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() =>
                        onSelect(item)
                      }
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          selected &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>

                      {selected && (
                        <Check
                          size={17}
                          color={
                            COLORS.lime
                          }
                        />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  function renderMarketerDropdown() {
    return (
      <View style={styles.dropdownWrapper}>
        <Pressable
          style={styles.dropdownButton}
          onPress={() =>
            setMarketerOpen(!marketerOpen)
          }
          disabled={loadingMarketers}
        >
          <View
            style={styles.dropdownSelectedContent}
          >
            {loadingMarketers ? (
              <Text
                style={[
                  styles.dropdownText,
                  styles.dropdownPlaceholder,
                ]}
              >
                Loading active marketers...
              </Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.dropdownText,
                    !selectedMarketer &&
                      styles.dropdownPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedMarketerName ??
                    'Select a marketer'}
                </Text>
              </>
            )}
          </View>

          {loadingMarketers ? (
            <ActivityIndicator
              size="small"
              color={COLORS.muted}
            />
          ) : (
            <ChevronDown
              size={19}
              color={COLORS.muted}
            />
          )}
        </Pressable>

        {marketerOpen && (
          <View
            style={styles.dropdownOptions}
          >
            <ScrollView
              nestedScrollEnabled
              style={
                styles.dropdownOptionsScroll
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {marketers.length === 0 ? (
                <View
                  style={
                    styles.dropdownEmpty
                  }
                >
                  <Text
                    style={
                      styles.dropdownEmptyText
                    }
                  >
                    No active marketers available.
                  </Text>
                </View>
              ) : (
                marketers.map((marketer) => {
                  const first =
                    marketer.user?.firstName ??
                    '';

                  const last =
                    marketer.user?.lastName ??
                    '';

                  const name =
                    `${first} ${last}`.trim() ||
                    marketer.user?.email ||
                    marketer.user?.phone ||
                    'Unnamed marketer';

                  const selected =
                    marketer.id ===
                    selectedMarketerId;

                  return (
                    <Pressable
                      key={marketer.id}
                      style={[
                        styles.marketerOption,
                        selected &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedMarketerId(
                          marketer.id,
                        );
                        setMarketerOpen(
                          false,
                        );
                      }}
                    >
                      <View
                        style={
                          styles.marketerOptionInfo
                        }
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selected &&
                              styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {name}
                        </Text>

                        {marketer.region && (
                          <Text
                            style={
                              styles.marketerRegion
                            }
                          >
                            {marketer.region}
                          </Text>
                        )}
                      </View>

                      {selected && (
                        <Check
                          size={17}
                          color={
                            COLORS.lime
                          }
                        />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loadingScreen}
        >
          <ActivityIndicator
            size="large"
            color={COLORS.lime}
          />

          <Text
            style={styles.loadingText}
          >
            Loading property form...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <View style={styles.app}>
        <View style={styles.topBar}>
          <View
            style={styles.topBarLeft}
          >
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.back()
              }
            >
              <ArrowLeft
                size={20}
                color={COLORS.white}
              />
            </Pressable>

            <View>
              <Text
                style={styles.breadcrumb}
              >
                ADMIN / PROPERTIES
              </Text>

              <Text
                style={styles.topTitle}
              >
                Add property
              </Text>
            </View>
          </View>

          <View
            style={styles.draftBadge}
          >
            <View
              style={styles.draftDot}
            />

            <Text
              style={styles.draftText}
            >
              DRAFT
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={[
            styles.page,
            isDesktop &&
              styles.pageDesktop,
          ]}
        >
          <View
            style={styles.pageHeader}
          >
            <Text
              style={styles.eyebrow}
            >
              PROPERTY MANAGEMENT
            </Text>

            <Text
              style={styles.pageTitle}
            >
              Add a property
            </Text>

            <Text
              style={
                styles.pageDescription
              }
            >
              Create a property from anywhere
              in Kenya. Assign it to an active
              Makazii marketer before saving it
              as a draft.
            </Text>
          </View>

          <View
            style={[
              styles.contentGrid,
              isDesktop &&
                styles.contentGridDesktop,
            ]}
          >
            <View
              style={styles.mainColumn}
            >
              {/* PROPERTY DETAILS */}
              <View
                style={styles.card}
              >
                <SectionHeader
                  number="01"
                  title="Property details"
                  subtitle="Choose how this property will be offered on Makazii."
                />

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Property title',
                  )}

                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Modern 2 Bedroom Apartment"
                    placeholderTextColor={
                      COLORS.mutedDark
                    }
                    style={styles.input}
                  />
                </View>

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Purpose',
                  )}

                  {renderSimpleDropdown(
                    purpose,
                    'Select purpose',
                    purposeOpen,
                    setPurposeOpen,
                    PURPOSE_OPTIONS,
                    handlePurposeChange,
                  )}
                </View>

                {purpose && (
                  <View
                    style={styles.formGroup}
                  >
                    {renderFieldLabel(
                      purpose ===
                        'LONG_STAY'
                        ? 'Long-stay property type'
                        : 'Short-stay property type',
                    )}

                    {renderSimpleDropdown(
                      purpose ===
                        'LONG_STAY'
                        ? longStayType
                        : shortStayType,
                      'Select property type',
                      propertyTypeOpen,
                      setPropertyTypeOpen,
                      purpose ===
                        'LONG_STAY'
                        ? LONG_STAY_OPTIONS
                        : SHORT_STAY_OPTIONS,
                      (value) => {
                        if (
                          purpose ===
                          'LONG_STAY'
                        ) {
                          setLongStayType(
                            value as LongStayType,
                          );
                        } else {
                          setShortStayType(
                            value as ShortStayType,
                          );
                        }

                        setPropertyTypeOpen(
                          false,
                        );
                      },
                    )}
                  </View>
                )}

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Furnishing',
                    false,
                  )}

                  {renderSimpleDropdown(
                    furnishing,
                    'Select furnishing',
                    furnishingOpen,
                    setFurnishingOpen,
                    FURNISHING_OPTIONS,
                    setFurnishing,
                  )}
                </View>

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Description',
                  )}

                  <TextInput
                    value={description}
                    onChangeText={
                      setDescription
                    }
                    placeholder="Describe the property, condition, features and anything customers should know..."
                    placeholderTextColor={
                      COLORS.mutedDark
                    }
                    multiline
                    numberOfLines={7}
                    textAlignVertical="top"
                    style={[
                      styles.input,
                      styles.textArea,
                    ]}
                  />

                  <Text
                    style={
                      styles.characterCount
                    }
                  >
                    {description.length}{' '}
                    characters
                  </Text>
                </View>
              </View>

              {/* PRICING */}
              <View
                style={styles.card}
              >
                <SectionHeader
                  number="02"
                  title="Pricing & capacity"
                  subtitle={
                    purpose ===
                    'SHORT_STAY'
                      ? 'Set the short-stay rates and guest capacity.'
                      : purpose ===
                        'LONG_STAY'
                      ? 'Set the monthly rental charges.'
                      : 'Select a purpose to configure pricing.'
                  }
                />

                {purpose ===
                  'LONG_STAY' && (
                  <>
                    <View
                      style={[
                        styles.row,
                        !isDesktop &&
                          styles.rowMobile,
                      ]}
                    >
                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Monthly rent',
                        )}

                        <TextInput
                          value={
                            monthlyRent
                          }
                          onChangeText={
                            setMonthlyRent
                          }
                          placeholder="e.g. 25000"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Deposit',
                          false,
                        )}

                        <TextInput
                          value={
                            deposit
                          }
                          onChangeText={
                            setDeposit
                          }
                          placeholder="e.g. 25000"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>
                    </View>

                    <View
                      style={[
                        styles.row,
                        !isDesktop &&
                          styles.rowMobile,
                      ]}
                    >
                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Viewing fee',
                          false,
                        )}

                        <TextInput
                          value={
                            viewingFee
                          }
                          onChangeText={
                            setViewingFee
                          }
                          placeholder="e.g. 500"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Service charge',
                          false,
                        )}

                        <TextInput
                          value={
                            serviceCharge
                          }
                          onChangeText={
                            setServiceCharge
                          }
                          placeholder="e.g. 2000"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>
                    </View>
                  </>
                )}

                {purpose ===
                  'SHORT_STAY' && (
                  <>
                    <View
                      style={
                        styles.formGroup
                      }
                    >
                      {renderFieldLabel(
                        'Stay mode',
                      )}

                      {renderSimpleDropdown(
                        stayMode,
                        'Select stay mode',
                        stayModeOpen,
                        setStayModeOpen,
                        STAY_MODE_OPTIONS,
                        handleStayModeChange,
                      )}
                    </View>

                    {stayMode && (
                      <View
                        style={
                          styles.rateBox
                        }
                      >
                        <Text
                          style={
                            styles.rateBoxTitle
                          }
                        >
                          {formatEnum(
                            stayMode,
                          )}{' '}
                          pricing
                        </Text>

                        {stayMode ===
                          'DAY' && (
                          <View
                            style={
                              styles.formGroup
                            }
                          >
                            {renderFieldLabel(
                              'Day rate',
                            )}

                            <TextInput
                              value={
                                dayRate
                              }
                              onChangeText={
                                setDayRate
                              }
                              placeholder="e.g. 2500"
                              placeholderTextColor={
                                COLORS.mutedDark
                              }
                              keyboardType="numeric"
                              style={
                                styles.input
                              }
                            />
                          </View>
                        )}

                        {stayMode ===
                          'OVERNIGHT' && (
                          <View
                            style={
                              styles.formGroup
                            }
                          >
                            {renderFieldLabel(
                              'Overnight rate',
                            )}

                            <TextInput
                              value={
                                nightRate
                              }
                              onChangeText={
                                setNightRate
                              }
                              placeholder="e.g. 3500"
                              placeholderTextColor={
                                COLORS.mutedDark
                              }
                              keyboardType="numeric"
                              style={
                                styles.input
                              }
                            />
                          </View>
                        )}

                        {stayMode ===
                          'DAY_AND_NIGHT' && (
                          <View
                            style={
                              styles.formGroup
                            }
                          >
                            {renderFieldLabel(
                              'Day & night rate',
                            )}

                            <TextInput
                              value={
                                dayNightRate
                              }
                              onChangeText={
                                setDayNightRate
                              }
                              placeholder="e.g. 5000"
                              placeholderTextColor={
                                COLORS.mutedDark
                              }
                              keyboardType="numeric"
                              style={
                                styles.input
                              }
                            />
                          </View>
                        )}

                        {stayMode ===
                          'FLEXIBLE' && (
                          <View
                            style={[
                              styles.row,
                              !isDesktop &&
                                styles.rowMobile,
                            ]}
                          >
                            <View
                              style={
                                styles.rowField
                              }
                            >
                              {renderFieldLabel(
                                'Day rate',
                                false,
                              )}

                              <TextInput
                                value={
                                  dayRate
                                }
                                onChangeText={
                                  setDayRate
                                }
                                placeholder="Optional"
                                placeholderTextColor={
                                  COLORS.mutedDark
                                }
                                keyboardType="numeric"
                                style={
                                  styles.input
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.rowField
                              }
                            >
                              {renderFieldLabel(
                                'Night rate',
                                false,
                              )}

                              <TextInput
                                value={
                                  nightRate
                                }
                                onChangeText={
                                  setNightRate
                                }
                                placeholder="Optional"
                                placeholderTextColor={
                                  COLORS.mutedDark
                                }
                                keyboardType="numeric"
                                style={
                                  styles.input
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.rowField
                              }
                            >
                              {renderFieldLabel(
                                'Day & night',
                                false,
                              )}

                              <TextInput
                                value={
                                  dayNightRate
                                }
                                onChangeText={
                                  setDayNightRate
                                }
                                placeholder="Optional"
                                placeholderTextColor={
                                  COLORS.mutedDark
                                }
                                keyboardType="numeric"
                                style={
                                  styles.input
                                }
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    <View
                      style={styles.formGroup}
                    >
                      {renderFieldLabel(
                        'Inspection fee (KSh)',
                      )}

                      <TextInput
                        value={inspectionFee}
                        onChangeText={setInspectionFee}
                        placeholder="e.g. 500"
                        placeholderTextColor={
                          COLORS.mutedDark
                        }
                        keyboardType="numeric"
                        style={styles.input}
                      />

                      <Text style={styles.helper}>
                        One-time short-stay inspection charge, separate
                        from accommodation rates.
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.row,
                        !isDesktop &&
                          styles.rowMobile,
                      ]}
                    >
                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Rooms',
                        )}

                        <TextInput
                          value={rooms}
                          onChangeText={
                            setRooms
                          }
                          placeholder="e.g. 6"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Beds',
                          false,
                        )}

                        <TextInput
                          value={beds}
                          onChangeText={
                            setBeds
                          }
                          placeholder="e.g. 8"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.rowField
                        }
                      >
                        {renderFieldLabel(
                          'Maximum guests',
                        )}

                        <TextInput
                          value={
                            maxGuests
                          }
                          onChangeText={
                            setMaxGuests
                          }
                          placeholder="e.g. 12"
                          placeholderTextColor={
                            COLORS.mutedDark
                          }
                          keyboardType="numeric"
                          style={
                            styles.input
                          }
                        />
                      </View>
                    </View>
                  </>
                )}

                <View
                  style={[
                    styles.row,
                    !isDesktop &&
                      styles.rowMobile,
                  ]}
                >
                  <View
                    style={
                      styles.rowField
                    }
                  >
                    {renderFieldLabel(
                      'Bedrooms',
                      false,
                    )}

                    <TextInput
                      value={
                        bedrooms
                      }
                      onChangeText={
                        setBedrooms
                      }
                      placeholder="e.g. 2"
                      placeholderTextColor={
                        COLORS.mutedDark
                      }
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.rowField
                    }
                  >
                    {renderFieldLabel(
                      'Bathrooms',
                      false,
                    )}

                    <TextInput
                      value={
                        bathrooms
                      }
                      onChangeText={
                        setBathrooms
                      }
                      placeholder="e.g. 2"
                      placeholderTextColor={
                        COLORS.mutedDark
                      }
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                    />
                  </View>
                </View>
              </View>

              {/* LOCATION */}
              <View
                style={styles.card}
              >
                <SectionHeader
                  number="03"
                  title="Property location"
                  subtitle="Select the official Kenya geography for this property."
                />

                <View
                  style={
                    styles.locationNotice
                  }
                >
                  <View
                    style={
                      styles.locationNoticeIcon
                    }
                  >
                    <Check
                      size={16}
                      color={
                        COLORS.background
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.locationNoticeText
                    }
                  >
                    Every property must belong
                    to one county, constituency
                    and ward.
                  </Text>
                </View>

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'County',
                  )}

                  {renderDataDropdown(
                    selectedCounty,
                    'Select county',
                    countyOpen,
                    setCountyOpen,
                    counties,
                    handleCountyChange,
                  )}
                </View>

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Constituency',
                  )}

                  {renderDataDropdown(
                    selectedConstituency,
                    selectedCountyId
                      ? 'Select constituency'
                      : 'Select a county first',
                    constituencyOpen,
                    setConstituencyOpen,
                    constituencies,
                    handleConstituencyChange,
                    !selectedCountyId,
                    loadingConstituencies,
                  )}
                </View>

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Ward',
                  )}

                  {renderDataDropdown(
                    selectedWard,
                    selectedConstituencyId
                      ? 'Select ward'
                      : 'Select a constituency first',
                    wardOpen,
                    setWardOpen,
                    wards,
                    handleWardChange,
                    !selectedConstituencyId,
                    loadingWards,
                  )}
                </View>

                {selectedCounty &&
                  selectedConstituency &&
                  selectedWard && (
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
                        SELECTED LOCATION
                      </Text>

                      <Text
                        style={
                          styles.locationSummaryValue
                        }
                      >
                        {selectedCounty.name}
                        {'  •  '}
                        {
                          selectedConstituency.name
                        }
                        {'  •  '}
                        {selectedWard.name}
                      </Text>
                    </View>
                  )}
              </View>

              {/* MARKETER */}
              <View
                style={styles.card}
              >
                <SectionHeader
                  number="04"
                  title="Source marketer"
                  subtitle="Assign the property to the active Makazii marketer responsible for it."
                />

                <View
                  style={
                    styles.marketerNotice
                  }
                >
                  <View
                    style={
                      styles.marketerNoticeIcon
                    }
                  >
                    <Check
                      size={16}
                      color={
                        COLORS.background
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.marketerNoticeText
                    }
                  >
                    The marketer is an internal
                    assignment. Customers do not
                    see this assignment.
                  </Text>
                </View>

                <View
                  style={styles.formGroup}
                >
                  {renderFieldLabel(
                    'Assigned marketer',
                  )}

                  {renderMarketerDropdown()}
                </View>

                {selectedMarketer && (
                  <View
                    style={
                      styles.selectedMarketerCard
                    }
                  >
                    <View
                      style={
                        styles.selectedMarketerAvatar
                      }
                    >
                      <Text
                        style={
                          styles.selectedMarketerAvatarText
                        }
                      >
                        {(
                          selectedMarketer.user
                            ?.firstName ??
                          'M'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.selectedMarketerInfo
                      }
                    >
                      <Text
                        style={
                          styles.selectedMarketerName
                        }
                      >
                        {selectedMarketerName}
                      </Text>

                      {selectedMarketer
                        .region && (
                        <Text
                          style={
                            styles.selectedMarketerMeta
                          }
                        >
                          {
                            selectedMarketer.region
                          }
                        </Text>
                      )}

                      <View
                        style={
                          styles.activePill
                        }
                      >
                        <View
                          style={
                            styles.activeDot
                          }
                        />

                        <Text
                          style={
                            styles.activePillText
                          }
                        >
                          ACTIVE
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* AMENITIES */}
              <View
                style={styles.card}
              >
                <SectionHeader
                  number="05"
                  title="Amenities"
                  subtitle="Select the facilities and features available at this property."
                />

                {loadingAmenities ? (
                  <View
                    style={
                      styles.inlineLoading
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
                        styles.inlineLoadingText
                      }
                    >
                      Loading amenities...
                    </Text>
                  </View>
                ) : amenities.length ===
                  0 ? (
                  <View
                    style={
                      styles.emptyBox
                    }
                  >
                    <Text
                      style={
                        styles.emptyBoxText
                      }
                    >
                      No amenities are currently
                      available.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.amenitiesGrid
                    }
                  >
                    {amenities.map(
                      (amenity) => {
                        const selected =
                          selectedAmenityIds.includes(
                            amenity.id,
                          );

                        return (
                          <Pressable
                            key={
                              amenity.id
                            }
                            style={[
                              styles.amenityChip,
                              selected &&
                                styles.amenityChipSelected,
                            ]}
                            onPress={() =>
                              toggleAmenity(
                                amenity.id,
                              )
                            }
                          >
                            <View
                              style={[
                                styles.checkbox,
                                selected &&
                                  styles.checkboxSelected,
                              ]}
                            >
                              {selected && (
                                <Check
                                  size={13}
                                  color={
                                    COLORS.background
                                  }
                                  strokeWidth={
                                    3
                                  }
                                />
                              )}
                            </View>

                            <Text
                              style={[
                                styles.amenityText,
                                selected &&
                                  styles.amenityTextSelected,
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

                {selectedAmenityIds.length >
                  0 && (
                  <Text
                    style={
                      styles.selectionCount
                    }
                  >
                    {
                      selectedAmenityIds.length
                    }{' '}
                    amenit
                    {selectedAmenityIds.length ===
                    1
                      ? 'y'
                      : 'ies'}{' '}
                    selected
                  </Text>
                )}
              </View>

              {/* IMAGES */}
              <View
                style={styles.card}
              >
                <SectionHeader
                  number="06"
                  title="Property images"
                  subtitle="Add image URLs for the property. S3 upload can be connected separately."
                />

                <View
                  style={
                    styles.imageUrlRow
                  }
                >
                  <TextInput
                    value={imageUrl}
                    onChangeText={
                      setImageUrl
                    }
                    placeholder="https://example.com/property-image.jpg"
                    placeholderTextColor={
                      COLORS.mutedDark
                    }
                    autoCapitalize="none"
                    keyboardType="url"
                    style={[
                      styles.input,
                      styles.imageUrlInput,
                    ]}
                  />

                  <Pressable
                    style={
                      styles.addImageButton
                    }
                    onPress={addImage}
                  >
                    <Plus
                      size={18}
                      color={
                        COLORS.background
                      }
                    />

                    <Text
                      style={
                        styles.addImageButtonText
                      }
                    >
                      Add
                    </Text>
                  </Pressable>
                </View>


                <View
                  style={{
                    marginTop: 18,
                    marginBottom: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 14,
                    backgroundColor: COLORS.cardSoft,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Video size={20} color={COLORS.lime} />
                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '700' }}>
                      Property video (required)
                    </Text>
                  </View>

                  <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
                    Choose an actual video of this property. Maximum duration: 2 minutes.
                  </Text>

                  <Pressable
                    onPress={choosePropertyVideo}
                    style={{
                      marginTop: 12,
                      padding: 13,
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: COLORS.lime,
                    }}
                  >
                    <Text style={{ color: COLORS.background, fontWeight: '800' }}>
                      {propertyVideo ? 'Change property video' : 'Choose property video'}
                    </Text>
                  </Pressable>

                  {propertyVideo ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ color: COLORS.green, fontSize: 12, fontWeight: '700' }}>
                        Video selected
                      </Text>
                      <Text style={{ color: COLORS.white, fontSize: 12, marginTop: 4 }}>
                        {propertyVideo.fileName || 'Selected property video'}
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 4 }}>
                        {propertyVideo.duration
                          ? `${Math.round(propertyVideo.duration / 1000)} seconds`
                          : propertyVideo.mimeType || 'Video file'}
                      </Text>
                      <Pressable
                        onPress={() => setPropertyVideo(null)}
                        style={{ alignSelf: 'flex-start', paddingVertical: 8 }}
                      >
                        <Text style={{ color: COLORS.red, fontSize: 12 }}>
                          Remove video
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={{ color: COLORS.orange, fontSize: 12, marginTop: 10 }}>
                      A real video is required before this property can be created.
                    </Text>
                  )}
                </View>

                {images.length === 0 ? (
                  <View
                    style={
                      styles.imageEmpty
                    }
                  >
                    <View
                      style={
                        styles.imageEmptyIcon
                      }
                    >
                      <ImagePlus
                        size={22}
                        color={
                          COLORS.lime
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.imageEmptyTitle
                      }
                    >
                      No images added yet
                    </Text>

                    <Text
                      style={
                        styles.imageEmptyText
                      }
                    >
                      Add a public image URL
                      above. The first image
                      becomes the primary image.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.imageGrid
                    }
                  >
                    {images.map(
                      (image, index) => (
                        <View
                          key={
                            image.id
                          }
                          style={
                            styles.imageCard
                          }
                        >
                          <Image
                            source={{
                              uri: image.url,
                            }}
                            style={
                              styles.imagePreview
                            }
                          />

                          {index ===
                            0 && (
                            <View
                              style={
                                styles.primaryBadge
                              }
                            >
                              <Text
                                style={
                                  styles.primaryBadgeText
                                }
                              >
                                PRIMARY
                              </Text>
                            </View>
                          )}

                          <Pressable
                            style={
                              styles.removeImageButton
                            }
                            onPress={() =>
                              removeImage(
                                image.id,
                              )
                            }
                          >
                            <Trash2
                              size={15}
                              color={
                                COLORS.white
                              }
                            />
                          </Pressable>
                        </View>
                      ),
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* SUMMARY */}
            <View
              style={styles.sideColumn}
            >
              <View
                style={
                  styles.summaryCard
                }
              >
                <Text
                  style={
                    styles.summaryEyebrow
                  }
                >
                  PROPERTY SUMMARY
                </Text>

                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Ready to save?
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  The property will be created
                  as a draft. The assigned marketer
                  can work with the property while
                  the admin controls verification
                  and publishing.
                </Text>

                <View
                  style={
                    styles.summaryDivider
                  }
                />

                <SummaryRow
                  label="Purpose"
                  value={
                    purpose
                      ? purpose ===
                        'LONG_STAY'
                        ? 'Long Stay'
                        : 'Short Stay'
                      : 'Not selected'
                  }
                />

                <SummaryRow
                  label="Property type"
                  value={
                    selectedTypeLabel
                  }
                />

                {purpose ===
                  'LONG_STAY' && (
                  <>
                    <SummaryRow
                      label="Monthly rent"
                      value={
                        monthlyRent
                          ? `KES ${Number(
                              monthlyRent,
                            ).toLocaleString(
                              'en-KE',
                            )}`
                          : 'Not set'
                      }
                    />

                    <SummaryRow
                      label="Viewing fee"
                      value={
                        viewingFee
                          ? `KES ${Number(
                              viewingFee,
                            ).toLocaleString(
                              'en-KE',
                            )}`
                          : 'Not set'
                      }
                    />
                  </>
                )}

                {purpose ===
                  'SHORT_STAY' && (
                  <>
                    <SummaryRow
                      label="Stay mode"
                      value={
                        stayMode
                          ? formatEnum(
                              stayMode,
                            )
                          : 'Not selected'
                      }
                    />

                    <SummaryRow
                      label="Rooms"
                      value={
                        rooms ||
                        'Not set'
                      }
                    />

                    <SummaryRow
                      label="Max guests"
                      value={
                        maxGuests ||
                        'Not set'
                      }
                    />

                    <SummaryRow
                      label="Inspection fee"
                      value={
                        inspectionFee
                          ? `KES ${Number(
                              inspectionFee,
                            ).toLocaleString(
                              'en-KE',
                            )}`
                          : 'Not set'
                      }
                    />
                  </>
                )}

                <View
                  style={
                    styles.summaryDivider
                  }
                />

                <View
                  style={
                    styles.summaryLocation
                  }
                >
                  <Text
                    style={
                      styles.summaryLocationLabel
                    }
                  >
                    LOCATION
                  </Text>

                  <Text
                    style={
                      styles.summaryLocationValue
                    }
                  >
                    {selectedCounty?.name ??
                      'County not selected'}
                  </Text>

                  <Text
                    style={
                      styles.summaryLocationSubvalue
                    }
                  >
                    {selectedConstituency?.name ??
                      'Constituency not selected'}
                  </Text>

                  <Text
                    style={
                      styles.summaryLocationSubvalue
                    }
                  >
                    {selectedWard?.name ??
                      'Ward not selected'}
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryDivider
                  }
                />

                <View
                  style={
                    styles.assignedSummary
                  }
                >
                  <Text
                    style={
                      styles.summaryLocationLabel
                    }
                  >
                    ASSIGNED MARKETER
                  </Text>

                  <Text
                    style={
                      styles.assignedSummaryName
                    }
                  >
                    {selectedMarketerName ??
                      'No marketer selected'}
                  </Text>

                  {selectedMarketer?.region && (
                    <Text
                      style={
                        styles.summaryLocationSubvalue
                      }
                    >
                      {
                        selectedMarketer.region
                      }
                    </Text>
                  )}
                </View>

                <View
                  style={
                    styles.summaryDivider
                  }
                />

                <View
                  style={
                    styles.checkList
                  }
                >
                  <ChecklistItem
                    label="Property title"
                    complete={
                      !!title.trim()
                    }
                  />

                  <ChecklistItem
                    label="Purpose & type"
                    complete={
                      !!purpose &&
                      !!(
                        purpose ===
                        'LONG_STAY'
                          ? longStayType
                          : shortStayType
                      )
                    }
                  />

                  <ChecklistItem
                    label="Pricing"
                    complete={
                      purpose ===
                      'LONG_STAY'
                        ? Number(
                            monthlyRent,
                          ) > 0
                        : purpose ===
                          'SHORT_STAY'
                        ? !!stayMode &&
                          (Number(
                            dayRate,
                          ) > 0 ||
                            Number(
                              nightRate,
                            ) > 0 ||
                            Number(
                              dayNightRate,
                            ) > 0)
                        : false
                    }
                  />

                  <ChecklistItem
                    label="Location"
                    complete={
                      !!selectedCountyId &&
                      !!selectedConstituencyId &&
                      !!selectedWardId
                    }
                  />

                  <ChecklistItem
                    label="Marketer assigned"
                    complete={
                      !!selectedMarketerId
                    }
                  />

                  <ChecklistItem
                    label="Description"
                    complete={
                      !!description.trim()
                    }
                  />
                </View>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving &&
                      styles.saveButtonDisabled,
                  ]}
                  disabled={saving}
                  onPress={
                    saveProperty
                  }
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
                      size={18}
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
                      : 'Save as draft'}
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.cancelButton
                  }
                  disabled={saving}
                  onPress={() =>
                    router.back()
                  }
                >
                  <X
                    size={17}
                    color={
                      COLORS.muted
                    }
                  />

                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>

              <View
                style={
                  styles.workflowCard
                }
              >
                <View
                  style={
                    styles.workflowIcon
                  }
                >
                  <Check
                    size={18}
                    color={
                      COLORS.lime
                    }
                  />
                </View>

                <View
                  style={
                    styles.workflowContent
                  }
                >
                  <Text
                    style={
                      styles.workflowTitle
                    }
                  >
                    Admin-controlled workflow
                  </Text>

                  <Text
                    style={
                      styles.workflowText
                    }
                  >
                    New properties are created
                    as DRAFT. The admin controls
                    verification and publishing.
                    The assigned marketer is an
                    internal source assignment.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={styles.cardHeader}
    >
      <View
        style={styles.stepNumber}
      >
        <Text
          style={
            styles.stepNumberText
          }
        >
          {number}
        </Text>
      </View>

      <View
        style={styles.cardHeaderText}
      >
        <Text
          style={styles.cardTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.cardSubtitle}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.summaryRow}
    >
      <Text
        style={styles.summaryLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.summaryValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function ChecklistItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <View
      style={styles.checkListItem}
    >
      <View
        style={[
          styles.checkCircle,
          complete &&
            styles.checkCircleComplete,
        ]}
      >
        {complete && (
          <Check
            size={11}
            color={
              COLORS.background
            }
            strokeWidth={3}
          />
        )}
      </View>

      <Text
        style={[
          styles.checkListText,
          complete &&
            styles.checkListTextComplete,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  app: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
    gap: 14,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },

  topBar: {
    minHeight: 76,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    backgroundColor:
      COLORS.sidebar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  breadcrumb: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  topTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },

  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      '#2D291B',
    borderWidth: 1,
    borderColor:
      '#514A27',
  },

  draftDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      COLORS.orange,
  },

  draftText: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  page: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    paddingBottom: 70,
  },

  pageDesktop: {
    paddingHorizontal: 36,
  },

  pageHeader: {
    marginBottom: 24,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  pageDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 760,
    marginTop: 8,
  },

  contentGrid: {
    gap: 18,
  },

  contentGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  mainColumn: {
    flex: 1,
    gap: 18,
    minWidth: 0,
  },

  sideColumn: {
    width: '100%',
    gap: 18,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },

  cardHeaderText: {
    flex: 1,
  },

  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      '#242D1B',
    borderWidth: 1,
    borderColor:
      '#46552A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
  },

  card: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    padding: 20,
  },

  cardTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },

  formGroup: {
    marginBottom: 18,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 11,
    backgroundColor:
      COLORS.cardSoft,
    color: COLORS.white,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  helper: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  textArea: {
    minHeight: 150,
    paddingTop: 13,
  },

  characterCount: {
    color: COLORS.mutedDark,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },

  rowMobile: {
    flexDirection: 'column',
    gap: 0,
  },

  rowField: {
    flex: 1,
  },

  dropdownWrapper: {
    position: 'relative',
    zIndex: 30,
  },

  dropdownButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 11,
    backgroundColor:
      COLORS.cardSoft,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  dropdownSelectedContent: {
    flex: 1,
  },

  dropdownDisabled: {
    opacity: 0.48,
  },

  dropdownText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
  },

  dropdownPlaceholder: {
    color: COLORS.mutedDark,
  },

  dropdownOptions: {
    marginTop: 6,
    maxHeight: 280,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    backgroundColor:
      '#111718',
    overflow: 'hidden',
    zIndex: 100,
  },

  dropdownOptionsScroll: {
    maxHeight: 278,
  },

  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      '#202729',
  },

  dropdownOptionSelected: {
    backgroundColor:
      '#202A18',
  },

  dropdownOptionText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
  },

  dropdownOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },

  dropdownEmpty: {
    padding: 18,
    alignItems: 'center',
  },

  dropdownEmptyText: {
    color: COLORS.mutedDark,
    fontSize: 12,
  },

  rateBox: {
    padding: 15,
    marginBottom: 18,
    borderRadius: 13,
    backgroundColor:
      '#151B1C',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  rateBoxTitle: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },

  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor:
      '#172018',
    borderWidth: 1,
    borderColor:
      '#293D2B',
  },

  locationNoticeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationNoticeText: {
    flex: 1,
    color: '#B8C7B9',
    fontSize: 12,
    lineHeight: 18,
  },

  locationSummary: {
    padding: 14,
    borderRadius: 12,
    backgroundColor:
      '#151B1C',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  locationSummaryLabel: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  locationSummaryValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  marketerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor:
      '#181C24',
    borderWidth: 1,
    borderColor:
      '#303744',
  },

  marketerNoticeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  marketerNoticeText: {
    flex: 1,
    color: '#B8BEC8',
    fontSize: 12,
    lineHeight: 18,
  },

  marketerOption: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      '#202729',
  },

  marketerOptionInfo: {
    flex: 1,
    paddingRight: 12,
  },

  marketerRegion: {
    color: COLORS.mutedDark,
    fontSize: 11,
    marginTop: 3,
  },

  selectedMarketerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 13,
    backgroundColor:
      '#172018',
    borderWidth: 1,
    borderColor:
      '#33432A',
  },

  selectedMarketerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedMarketerAvatarText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '900',
  },

  selectedMarketerInfo: {
    flex: 1,
  },

  selectedMarketerName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  selectedMarketerMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  activePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor:
      '#203021',
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      COLORS.green,
  },

  activePillText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  amenityChipSelected: {
    backgroundColor:
      '#202A18',
    borderColor:
      '#4D6127',
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1,
    borderColor:
      '#475153',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  amenityText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  amenityTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },

  selectionCount: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 13,
  },

  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },

  inlineLoadingText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  emptyBox: {
    padding: 20,
    borderRadius: 12,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: 'center',
  },

  emptyBoxText: {
    color: COLORS.mutedDark,
    fontSize: 12,
  },

  imageUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  imageUrlInput: {
    flex: 1,
  },

  addImageButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  addImageButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },

  imageEmpty: {
    minHeight: 150,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor:
      '#465153',
    backgroundColor:
      '#111718',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  imageEmptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor:
      '#202A18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  imageEmptyTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  imageEmptyText: {
    color: COLORS.mutedDark,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 430,
  },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  imageCard: {
    width: 145,
    height: 110,
    borderRadius: 11,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor:
      COLORS.cardSoft,
  },

  imagePreview: {
    width: '100%',
    height: '100%',
  },

  primaryBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor:
      COLORS.lime,
  },

  primaryBadgeText: {
    color: COLORS.background,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    padding: 20,
  },

  summaryEyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 7,
  },

  summaryTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },

  summaryDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  summaryDivider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical: 17,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 12,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },

  summaryValue: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  summaryLocation: {
    padding: 13,
    borderRadius: 11,
    backgroundColor:
      COLORS.cardSoft,
  },

  assignedSummary: {
    padding: 13,
    borderRadius: 11,
    backgroundColor:
      '#172018',
    borderWidth: 1,
    borderColor:
      '#33432A',
  },

  assignedSummaryName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  summaryLocationLabel: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  summaryLocationValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  summaryLocationSubvalue: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  checkList: {
    gap: 11,
  },

  checkListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  checkCircle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      '#424B4D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleComplete: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  checkListText: {
    color: COLORS.mutedDark,
    fontSize: 12,
  },

  checkListTextComplete: {
    color: COLORS.muted,
  },

  saveButton: {
    minHeight: 51,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  cancelButton: {
    minHeight: 45,
    marginTop: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  cancelButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  workflowCard: {
    flexDirection: 'row',
    gap: 11,
    padding: 15,
    borderRadius: 15,
    backgroundColor:
      '#121918',
    borderWidth: 1,
    borderColor:
      '#28352C',
  },

  workflowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor:
      '#202A18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  workflowContent: {
    flex: 1,
  },

  workflowTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  workflowText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
});