import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  GripVertical,
  ImagePlus,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  XCircle,
} from 'lucide-react-native';

import { useProperties } from '@/context/PropertyContext';
import { useMarketers } from '@/context/MarketerContext';
import {
  NearbyPlace,
  Property,
  PropertyAvailability,
  PropertyImage,
  PropertySource,
  PropertyStatus,
  VerificationStatus,
} from '@/types/property';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
  warning: '#FFB84D',
  success: '#70E000',
  blue: '#6EA8FE',
};

const PROPERTY_TYPES = [
  'Bedsitter',
  'Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  'Other',
];

const COUNTIES = [
  'Nairobi',
  'Meru',
  'Kiambu',
  'Machakos',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Uasin Gishu',
  'Nyeri',
  'Embu',
  'Tharaka Nithi',
  'Kirinyaga',
  'Murang’a',
  'Kakamega',
  'Bungoma',
  'Other',
];

const AMENITY_OPTIONS = [
  'Water Included',
  'Electricity',
  'Parking',
  'Security',
  'CCTV',
  'Borehole',
  'Wi-Fi',
  'Balcony',
  'Kitchen',
  'Prepaid Electricity',
  'Gated Compound',
  '24/7 Security',
  'Laundry Area',
  'Garden',
];

const NEARBY_TYPES = [
  'School',
  'Hospital',
  'Mall',
  'Market',
  'Restaurant',
  'Transport',
  'Police Station',
  'Church',
  'Mosque',
  'Other',
];

const AVAILABILITY_OPTIONS: {
  label: string;
  value: PropertyAvailability;
}[] = [
  {
    label: 'Available',
    value: 'available',
  },
  {
    label: 'Occupied',
    value: 'occupied',
  },
  {
    label: 'Temporarily unavailable',
    value: 'temporarily_unavailable',
  },
];

const VERIFICATION_OPTIONS: {
  label: string;
  value: VerificationStatus;
}[] = [
  {
    label: 'Pending',
    value: 'pending',
  },
  {
    label: 'Verified',
    value: 'verified',
  },
  {
    label: 'Rejected',
    value: 'rejected',
  },
];

const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  changes_required: 'Changes Required',
  published: 'Published',
  rejected: 'Rejected',
  hidden: 'Hidden',
  archived: 'Archived',
};

function toNumber(value: string) {
  const parsed = Number(value.replace(/,/g, '').trim());

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function formatDate(value?: string) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeImages(images: PropertyImage[] = []) {
  const sorted = [...images].sort((a, b) => a.order - b.order);

  if (!sorted.length) {
    return [];
  }

  const coverIndex = sorted.findIndex((image) => image.isCover);

  return sorted.map((image, index) => ({
    ...image,
    order: index,
    isCover: coverIndex >= 0 ? index === coverIndex : index === 0,
  }));
}

export default function AdminPropertyDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const propertyId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const {
    getPropertyById,
    updateProperty,
    approveProperty,
    requestPropertyChanges,
    rejectProperty,
  } = useProperties();

  const { marketers } = useMarketers();

  const property = propertyId
    ? getPropertyById(propertyId)
    : undefined;

  const [initializedId, setInitializedId] = useState<string | null>(
    null,
  );

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');

  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [viewingFee, setViewingFee] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');

  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [size, setSize] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [furnishing, setFurnishing] = useState<
    Property['furnishing']
  >('Unfurnished');

  const [county, setCounty] = useState('');
  const [town, setTown] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');

  const [amenities, setAmenities] = useState<string[]>([]);

  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [nearbyName, setNearbyName] = useState('');
  const [nearbyType, setNearbyType] = useState('');
  const [nearbyDistance, setNearbyDistance] = useState('');

  const [images, setImages] = useState<PropertyImage[]>([]);

  const [source, setSource] = useState<PropertySource>({
    type: 'internal',
  });

  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('pending');

  const [verificationNotes, setVerificationNotes] = useState('');

  const [availability, setAvailability] =
    useState<PropertyAvailability>('available');

  const [featured, setFeatured] = useState(false);

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCountyPicker, setShowCountyPicker] = useState(false);
  const [showAvailabilityPicker, setShowAvailabilityPicker] =
    useState(false);
  const [showVerificationPicker, setShowVerificationPicker] =
    useState(false);
  const [showNearbyTypePicker, setShowNearbyTypePicker] =
    useState(false);

  const [reviewAction, setReviewAction] = useState<
    'changes' | 'reject' | null
  >(null);

  const [reviewNotes, setReviewNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const orderedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        return a.order - b.order;
      }),
    [images],
  );

  const marketer = useMemo(() => {
    if (!property?.marketerId) {
      return undefined;
    }

    return marketers.find(
      (item) => item.id === property.marketerId,
    );
  }, [marketers, property?.marketerId]);

  useEffect(() => {
    if (!property || initializedId === property.id) {
      return;
    }

    setTitle(property.title ?? '');
    setType(property.type ?? '');
    setDescription(property.description ?? '');

    setRent(
      property.rent ? String(property.rent) : '',
    );

    setDeposit(
      property.deposit ? String(property.deposit) : '',
    );

    setViewingFee(
      property.viewingFee !== undefined
        ? String(property.viewingFee)
        : '',
    );

    setServiceCharge(
      property.serviceCharge
        ? String(property.serviceCharge)
        : '',
    );

    setBedrooms(
      property.bedrooms !== undefined
        ? String(property.bedrooms)
        : '',
    );

    setBathrooms(
      property.bathrooms !== undefined
        ? String(property.bathrooms)
        : '',
    );

    setSize(
      property.size !== undefined
        ? String(property.size)
        : '',
    );

    setFloor(
      property.floor !== undefined
        ? String(property.floor)
        : '',
    );

    setTotalFloors(
      property.totalFloors !== undefined
        ? String(property.totalFloors)
        : '',
    );

    setFurnishing(
      property.furnishing ?? 'Unfurnished',
    );

    setCounty(property.location?.county ?? '');
    setTown(property.location?.town ?? '');
    setArea(property.location?.area ?? '');
    setLandmark(property.location?.landmark ?? '');
    setAddress(property.location?.address ?? '');

    setAmenities([...(property.amenities ?? [])]);

    setNearby([...(property.nearby ?? [])]);

    setImages(normalizeImages(property.images ?? []));

    setSource(
      property.source ?? {
        type: 'internal',
      },
    );

    setLandlordName(property.landlord?.name ?? '');
    setLandlordPhone(property.landlord?.phone ?? '');
    setLandlordEmail(property.landlord?.email ?? '');

    setVerificationStatus(
      property.verificationStatus ?? 'pending',
    );

    setVerificationNotes(
      property.verificationNotes ?? '',
    );

    setAvailability(
      property.availability ?? 'available',
    );

    setFeatured(Boolean(property.featured));

    setInitializedId(property.id);
  }, [property, initializedId]);

  if (!property) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>
          Property not found
        </Text>

        <Text style={styles.notFoundText}>
          This property may have been removed or the ID is invalid.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={18}
            color={COLORS.background}
          />

          <Text style={styles.primaryButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const isUnderReview =
    property.status === 'under_review';

  const canReview =
    property.status === 'under_review';

  const canEdit =
    property.status !== 'published' &&
    property.status !== 'under_review';

  const validate = () => {
    if (!title.trim()) {
      Alert.alert(
        'Missing title',
        'Please enter a property title.',
      );
      return false;
    }

    if (!type.trim()) {
      Alert.alert(
        'Missing property type',
        'Please select a property type.',
      );
      return false;
    }

    if (toNumber(rent) <= 0) {
      Alert.alert(
        'Invalid rent',
        'Rent must be greater than zero.',
      );
      return false;
    }

    if (toNumber(deposit) < 0) {
      Alert.alert(
        'Invalid deposit',
        'Deposit cannot be negative.',
      );
      return false;
    }

    if (toNumber(viewingFee) < 0) {
      Alert.alert(
        'Invalid viewing fee',
        'Viewing fee cannot be negative.',
      );
      return false;
    }

    if (!county.trim()) {
      Alert.alert(
        'Missing county',
        'Please select a county.',
      );
      return false;
    }

    if (!town.trim()) {
      Alert.alert(
        'Missing town',
        'Please enter the town.',
      );
      return false;
    }

    if (!area.trim()) {
      Alert.alert(
        'Missing area',
        'Please enter the area.',
      );
      return false;
    }

    if (toNumber(bedrooms) < 0) {
      Alert.alert(
        'Invalid bedrooms',
        'Bedrooms cannot be negative.',
      );
      return false;
    }

    if (toNumber(bathrooms) <= 0) {
      Alert.alert(
        'Invalid bathrooms',
        'Bathrooms must be greater than zero.',
      );
      return false;
    }

    if (description.trim().length < 20) {
      Alert.alert(
        'Description too short',
        'Please provide at least 20 characters describing the property.',
      );
      return false;
    }

    if (!images.length) {
      Alert.alert(
        'No photos',
        'Please add at least one property photo.',
      );
      return false;
    }

    return true;
  };

  const buildUpdates = (): Partial<Property> => {
    const normalizedImages = normalizeImages(images);

    return {
      title: title.trim(),
      type: type.trim(),
      description: description.trim(),

      rent: toNumber(rent),
      deposit: toNumber(deposit),
      viewingFee: toNumber(viewingFee),
      serviceCharge:
        toNumber(serviceCharge) > 0
          ? toNumber(serviceCharge)
          : undefined,

      bedrooms: toNumber(bedrooms),
      bathrooms: toNumber(bathrooms),
      size:
        toNumber(size) > 0
          ? toNumber(size)
          : undefined,

      floor:
        toNumber(floor) > 0
          ? toNumber(floor)
          : undefined,

      totalFloors:
        toNumber(totalFloors) > 0
          ? toNumber(totalFloors)
          : undefined,

      furnishing,

      location: {
        county: county.trim(),
        town: town.trim(),
        area: area.trim(),
        landmark: landmark.trim() || undefined,
        address: address.trim() || undefined,
      },

      amenities,
      nearby,
      images: normalizedImages,

      source: {
        ...source,
      },

      landlord:
        landlordName.trim() || landlordPhone.trim()
          ? {
              name: landlordName.trim(),
              phone: landlordPhone.trim(),
              email:
                landlordEmail.trim() || undefined,
            }
          : undefined,

      verificationStatus,
      verificationNotes:
        verificationNotes.trim() || undefined,

      availability,
      featured,

      updatedAt: new Date().toISOString(),
    };
  };

  const saveChanges = () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      updateProperty(
        property.id,
        buildUpdates(),
      );

      Alert.alert(
        'Saved',
        'Property changes have been saved successfully.',
        [
          {
            text: 'View Property',
            onPress: () =>
              router.push(
                `/property/${property.id}` as any,
              ),
          },
          {
            text: 'Stay Here',
            style: 'cancel',
          },
        ],
      );
    } finally {
      setSaving(false);
    }
  };

  const openReviewAction = (
    action: 'changes' | 'reject',
  ) => {
    setReviewNotes(
      property.adminReviewNotes ??
        property.verificationNotes ??
        '',
    );

    setReviewAction(action);
  };

  const closeReviewAction = () => {
    if (reviewing) {
      return;
    }

    setReviewAction(null);
    setReviewNotes('');
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve property?',
      'Approving this property will mark it as verified and publish it for customers.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve & Publish',
          onPress: () => {
            try {
              setReviewing(true);

              approveProperty(property.id);

              Alert.alert(
                'Property approved',
                'The property is now verified and published.',
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      router.back(),
                  },
                ],
              );
            } finally {
              setReviewing(false);
            }
          },
        },
      ],
    );
  };

  const handleReviewAction = () => {
    if (!reviewAction) {
      return;
    }

    if (!reviewNotes.trim()) {
      Alert.alert(
        'Review note required',
        reviewAction === 'changes'
          ? 'Tell the marketer what needs to be corrected.'
          : 'Please provide a reason for rejecting this property.',
      );

      return;
    }

    try {
      setReviewing(true);

      if (reviewAction === 'changes') {
        requestPropertyChanges(
          property.id,
          reviewNotes.trim(),
        );
      }

      if (reviewAction === 'reject') {
        rejectProperty(
          property.id,
          reviewNotes.trim(),
        );
      }

      const message =
        reviewAction === 'changes'
          ? 'The property has been returned to the marketer for changes.'
          : 'The property has been rejected.';

      setReviewAction(null);
      setReviewNotes('');

      Alert.alert(
        'Review updated',
        message,
        [
          {
            text: 'OK',
            onPress: () =>
              router.back(),
          },
        ],
      );
    } finally {
      setReviewing(false);
    }
  };

  const pickImages = async () => {
    if (!canEdit) {
      Alert.alert(
        'Editing locked',
        'This property cannot be edited while it is under review or already published.',
      );
      return;
    }

    const remaining = 5 - images.length;

    if (remaining <= 0) {
      Alert.alert(
        'Photo limit reached',
        'A property can have a maximum of 5 photos.',
      );
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access to add property photos.',
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.85,
      });

    if (result.canceled) {
      return;
    }

    const newImages: PropertyImage[] =
      result.assets.map((asset, index) => ({
        id: createId('IMG'),
        uri: asset.uri,
        isCover:
          images.length === 0 && index === 0,
        order: images.length + index,
      }));

    setImages((current) =>
      normalizeImages([
        ...current,
        ...newImages,
      ]),
    );
  };

  const removeImage = (id: string) => {
    if (!canEdit) {
      return;
    }

    const remaining = images.filter(
      (image) => image.id !== id,
    );

    setImages(normalizeImages(remaining));
  };

  const setCoverImage = (id: string) => {
    if (!canEdit) {
      return;
    }

    setImages((current) =>
      normalizeImages(
        current.map((image) => ({
          ...image,
          isCover: image.id === id,
        })),
      ),
    );
  };

  const moveImage = (
    id: string,
    direction: 'up' | 'down',
  ) => {
    if (!canEdit) {
      return;
    }

    const current = [...orderedImages];
    const index = current.findIndex(
      (image) => image.id === id,
    );

    if (index === -1) {
      return;
    }

    const targetIndex =
      direction === 'up'
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= current.length
    ) {
      return;
    }

    const temp = current[index];

    current[index] = current[targetIndex];
    current[targetIndex] = temp;

    setImages(normalizeImages(current));
  };

  const toggleAmenity = (amenity: string) => {
    if (!canEdit) {
      return;
    }

    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter(
            (item) => item !== amenity,
          )
        : [...current, amenity],
    );
  };

  const addNearby = () => {
    if (!canEdit) {
      return;
    }

    if (!nearbyName.trim()) {
      Alert.alert(
        'Missing place',
        'Enter the nearby place name.',
      );
      return;
    }

    if (!nearbyType) {
      Alert.alert(
        'Missing type',
        'Select the nearby place type.',
      );
      return;
    }

    if (!nearbyDistance.trim()) {
      Alert.alert(
        'Missing distance',
        'Enter the distance.',
      );
      return;
    }

    setNearby((current) => [
      ...current,
      {
        id: createId('NEAR'),
        name: nearbyName.trim(),
        type: nearbyType,
        distance: nearbyDistance.trim(),
      },
    ]);

    setNearbyName('');
    setNearbyType('');
    setNearbyDistance('');
  };

  const removeNearby = (id: string) => {
    if (!canEdit) {
      return;
    }

    setNearby((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    );
  };

  const renderPickerModal = (
    visible: boolean,
    titleText: string,
    options: string[],
    selected: string,
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {titleText}
            </Text>

            <Pressable
              onPress={onClose}
              style={styles.iconButton}
            >
              <X
                size={20}
                color={COLORS.white}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const active =
                option === selected;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                  style={[
                    styles.optionRow,
                    active &&
                      styles.optionRowActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option}
                  </Text>

                  {active && (
                    <Check
                      size={18}
                      color={COLORS.lime}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const statusColor =
    property.status === 'published'
      ? COLORS.success
      : property.status === 'under_review'
        ? COLORS.warning
        : property.status === 'changes_required'
          ? COLORS.blue
          : property.status === 'rejected'
            ? COLORS.danger
            : COLORS.muted;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>
              ADMIN / PROPERTY
            </Text>

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {property.title}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                borderColor: statusColor,
              },
            ]}
          >
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
                styles.statusBadgeText,
                {
                  color: statusColor,
                },
              ]}
            >
              {STATUS_LABELS[property.status]}
            </Text>
          </View>
        </View>

        {/* REVIEW CARD */}
        <View
          style={[
            styles.reviewCard,
            isUnderReview &&
              styles.reviewCardAttention,
          ]}
        >
          <View style={styles.reviewHeader}>
            <View
              style={[
                styles.reviewIcon,
                {
                  backgroundColor: isUnderReview
                    ? 'rgba(255,184,77,0.12)'
                    : 'rgba(215,255,95,0.10)',
                },
              ]}
            >
              {isUnderReview ? (
                <FileCheck2
                  size={22}
                  color={COLORS.warning}
                />
              ) : (
                <ShieldCheck
                  size={22}
                  color={COLORS.lime}
                />
              )}
            </View>

            <View style={styles.reviewHeaderText}>
              <Text style={styles.reviewTitle}>
                {isUnderReview
                  ? 'Property needs your review'
                  : 'Property review status'}
              </Text>

              <Text style={styles.reviewSubtitle}>
                {isUnderReview
                  ? 'Review the details before deciding whether this property should go live.'
                  : `Current status: ${STATUS_LABELS[property.status]}`}
              </Text>
            </View>
          </View>

          <View style={styles.reviewMeta}>
            <View style={styles.reviewMetaItem}>
              <Text style={styles.reviewMetaLabel}>
                Submitted
              </Text>

              <Text style={styles.reviewMetaValue}>
                {formatDate(property.submittedAt)}
              </Text>
            </View>

            <View style={styles.reviewMetaDivider} />

            <View style={styles.reviewMetaItem}>
              <Text style={styles.reviewMetaLabel}>
                Verification
              </Text>

              <Text style={styles.reviewMetaValue}>
                {property.verificationStatus
                  .replace('_', ' ')}
              </Text>
            </View>
          </View>

          {canReview && (
            <View style={styles.reviewActions}>
              <Pressable
                style={[
                  styles.reviewButton,
                  styles.approveButton,
                ]}
                onPress={handleApprove}
                disabled={reviewing}
              >
                <Check
                  size={18}
                  color={COLORS.background}
                />

                <Text style={styles.approveButtonText}>
                  Approve & Publish
                </Text>
              </Pressable>

              <View style={styles.reviewSecondaryRow}>
                <Pressable
                  style={[
                    styles.reviewButton,
                    styles.changesButton,
                  ]}
                  onPress={() =>
                    openReviewAction(
                      'changes',
                    )
                  }
                  disabled={reviewing}
                >
                  <FileCheck2
                    size={17}
                    color={COLORS.white}
                  />

                  <Text style={styles.secondaryButtonText}>
                    Request Changes
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.reviewButton,
                    styles.rejectButton,
                  ]}
                  onPress={() =>
                    openReviewAction(
                      'reject',
                    )
                  }
                  disabled={reviewing}
                >
                  <XCircle
                    size={17}
                    color={COLORS.white}
                  />

                  <Text style={styles.secondaryButtonText}>
                    Reject
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {property.adminReviewNotes ? (
            <View style={styles.existingNotes}>
              <Text style={styles.existingNotesLabel}>
                ADMIN REVIEW NOTE
              </Text>

              <Text style={styles.existingNotesText}>
                {property.adminReviewNotes}
              </Text>
            </View>
          ) : null}
        </View>

        {/* SUBMITTED BY */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="00"
            title="Submission information"
            subtitle="Who submitted this property"
          />

          <View style={styles.personCard}>
            <View style={styles.personIcon}>
              <UserRound
                size={22}
                color={COLORS.lime}
              />
            </View>

            <View style={styles.personInfo}>
              <Text style={styles.personLabel}>
                MARKETER
              </Text>

              <Text style={styles.personName}>
                {marketer?.name ??
                  property.marketerName ??
                  'Unknown marketer'}
              </Text>

              <Text style={styles.personDetails}>
                {marketer?.id ??
                  property.marketerId ??
                  'No marketer ID'}
              </Text>

              {marketer?.phone ? (
                <Text style={styles.personDetails}>
                  {marketer.phone}
                </Text>
              ) : null}

              {marketer?.area ? (
                <Text style={styles.personDetails}>
                  Area: {marketer.area}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* BASIC INFORMATION */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="01"
            title="Basic information"
            subtitle="Core property details"
          />

          <Field
            label="Property title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Modern Bedsitter in Kilimani"
            editable={canEdit}
          />

          <Text style={styles.fieldLabel}>
            Property type
          </Text>

          <Pressable
            style={[
              styles.selectField,
              !canEdit &&
                styles.disabledField,
            ]}
            onPress={() =>
              canEdit &&
              setShowTypePicker(true)
            }
          >
            <Text
              style={[
                styles.selectText,
                !type &&
                  styles.placeholderText,
              ]}
            >
              {type || 'Select property type'}
            </Text>

            <ChevronDown
              size={19}
              color={COLORS.muted}
            />
          </Pressable>

          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the property..."
            multiline
            numberOfLines={6}
            editable={canEdit}
            textAlignVertical="top"
          />
        </View>

        {/* PRICING */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="02"
            title="Pricing"
            subtitle="Rental and payment details"
          />

          <View style={styles.twoColumns}>
            <Field
              label="Monthly rent"
              value={rent}
              onChangeText={setRent}
              placeholder="15000"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />

            <Field
              label="Deposit"
              value={deposit}
              onChangeText={setDeposit}
              placeholder="15000"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />
          </View>

          <Field
            label="Viewing fee"
            value={viewingFee}
            onChangeText={setViewingFee}
            placeholder="500"
            keyboardType="numeric"
            editable={canEdit}
          />

          <Field
            label="Service charge"
            value={serviceCharge}
            onChangeText={setServiceCharge}
            placeholder="0"
            keyboardType="numeric"
            editable={canEdit}
          />
        </View>

        {/* SPECIFICATIONS */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="03"
            title="Property specifications"
            subtitle="Physical characteristics"
          />

          <View style={styles.twoColumns}>
            <Field
              label="Bedrooms"
              value={bedrooms}
              onChangeText={setBedrooms}
              placeholder="1"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />

            <Field
              label="Bathrooms"
              value={bathrooms}
              onChangeText={setBathrooms}
              placeholder="1"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />
          </View>

          <View style={styles.twoColumns}>
            <Field
              label="Size (m²)"
              value={size}
              onChangeText={setSize}
              placeholder="35"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />

            <Field
              label="Floor"
              value={floor}
              onChangeText={setFloor}
              placeholder="2"
              keyboardType="numeric"
              editable={canEdit}
              flex={1}
            />
          </View>

          <Field
            label="Total floors"
            value={totalFloors}
            onChangeText={setTotalFloors}
            placeholder="5"
            keyboardType="numeric"
            editable={canEdit}
          />

          <Text style={styles.fieldLabel}>
            Furnishing
          </Text>

          <View style={styles.segmentRow}>
            {[
              'Furnished',
              'Unfurnished',
              'Partly Furnished',
            ].map((option) => {
              const active =
                furnishing === option;

              return (
                <Pressable
                  key={option}
                  disabled={!canEdit}
                  onPress={() =>
                    setFurnishing(
                      option as Property['furnishing'],
                    )
                  }
                  style={[
                    styles.segmentButton,
                    active &&
                      styles.segmentButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active &&
                        styles.segmentTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* LOCATION */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="04"
            title="Location"
            subtitle="Where the property is located"
          />

          <Text style={styles.fieldLabel}>
            County
          </Text>

          <Pressable
            style={[
              styles.selectField,
              !canEdit &&
                styles.disabledField,
            ]}
            onPress={() =>
              canEdit &&
              setShowCountyPicker(true)
            }
          >
            <Text
              style={[
                styles.selectText,
                !county &&
                  styles.placeholderText,
              ]}
            >
              {county || 'Select county'}
            </Text>

            <ChevronDown
              size={19}
              color={COLORS.muted}
            />
          </Pressable>

          <Field
            label="Town"
            value={town}
            onChangeText={setTown}
            placeholder="e.g. Nairobi"
            editable={canEdit}
          />

          <Field
            label="Area"
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Kilimani"
            editable={canEdit}
          />

          <Field
            label="Landmark"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Near Yaya Centre"
            editable={canEdit}
          />

          <Field
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Building / street / estate"
            editable={canEdit}
          />
        </View>

        {/* AMENITIES */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="05"
            title="Amenities"
            subtitle="Facilities available"
          />

          <View style={styles.chipGrid}>
            {AMENITY_OPTIONS.map((amenity) => {
              const active =
                amenities.includes(amenity);

              return (
                <Pressable
                  key={amenity}
                  disabled={!canEdit}
                  onPress={() =>
                    toggleAmenity(amenity)
                  }
                  style={[
                    styles.chip,
                    active &&
                      styles.chipActive,
                  ]}
                >
                  {active && (
                    <Check
                      size={14}
                      color={COLORS.background}
                    />
                  )}

                  <Text
                    style={[
                      styles.chipText,
                      active &&
                        styles.chipTextActive,
                    ]}
                  >
                    {amenity}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* NEARBY */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="06"
            title="Nearby places"
            subtitle="Useful places around the property"
          />

          {nearby.map((place) => (
            <View
              key={place.id}
              style={styles.nearbyCard}
            >
              <View style={styles.nearbyIcon}>
                <MapPin
                  size={18}
                  color={COLORS.lime}
                />
              </View>

              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>
                  {place.name}
                </Text>

                <Text style={styles.nearbyDetails}>
                  {place.type} • {place.distance}
                </Text>
              </View>

              {canEdit && (
                <Pressable
                  onPress={() =>
                    removeNearby(place.id)
                  }
                  style={styles.smallDangerButton}
                >
                  <Trash2
                    size={17}
                    color={COLORS.danger}
                  />
                </Pressable>
              )}
            </View>
          ))}

          {canEdit && (
            <View style={styles.nearbyForm}>
              <Field
                label="Place name"
                value={nearbyName}
                onChangeText={setNearbyName}
                placeholder="e.g. Yaya Centre"
                editable
              />

              <Text style={styles.fieldLabel}>
                Type
              </Text>

              <Pressable
                style={styles.selectField}
                onPress={() =>
                  setShowNearbyTypePicker(true)
                }
              >
                <Text
                  style={[
                    styles.selectText,
                    !nearbyType &&
                      styles.placeholderText,
                  ]}
                >
                  {nearbyType ||
                    'Select place type'}
                </Text>

                <ChevronDown
                  size={19}
                  color={COLORS.muted}
                />
              </Pressable>

              <Field
                label="Distance"
                value={nearbyDistance}
                onChangeText={setNearbyDistance}
                placeholder="e.g. 500m"
                editable
              />

              <Pressable
                style={styles.outlineButton}
                onPress={addNearby}
              >
                <Plus
                  size={17}
                  color={COLORS.lime}
                />

                <Text style={styles.outlineButtonText}>
                  Add nearby place
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* PHOTOS */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="07"
            title="Property photos"
            subtitle="Maximum 5 photos"
          />

          {canEdit && (
            <Pressable
              style={styles.photoUpload}
              onPress={pickImages}
            >
              <View style={styles.photoUploadIcon}>
                <ImagePlus
                  size={23}
                  color={COLORS.lime}
                />
              </View>

              <View style={styles.photoUploadText}>
                <Text style={styles.photoUploadTitle}>
                  Add photos
                </Text>

                <Text style={styles.photoUploadSubtitle}>
                  {images.length}/5 photos added
                </Text>
              </View>

              <Plus
                size={20}
                color={COLORS.lime}
              />
            </Pressable>
          )}

          {!images.length ? (
            <View style={styles.emptyPhotos}>
              <ImagePlus
                size={25}
                color={COLORS.muted}
              />

              <Text style={styles.emptyPhotosText}>
                No photos added yet.
              </Text>
            </View>
          ) : (
            <View style={styles.photoList}>
              {orderedImages.map(
                (image, index) => (
                  <View
                    key={image.id}
                    style={styles.photoItem}
                  >
                    <Image
                      source={{
                        uri: image.uri,
                      }}
                      style={styles.propertyImage}
                    />

                    <View
                      style={styles.photoInfo}
                    >
                      <View style={styles.photoTitleRow}>
                        <Text
                          style={styles.photoNumber}
                        >
                          PHOTO {index + 1}
                        </Text>

                        {image.isCover && (
                          <View
                            style={styles.coverBadge}
                          >
                            <Text
                              style={
                                styles.coverBadgeText
                              }
                            >
                              COVER
                            </Text>
                          </View>
                        )}
                      </View>

                      {canEdit && (
                        <View
                          style={
                            styles.photoControls
                          }
                        >
                          <Pressable
                            style={
                              styles.photoControl
                            }
                            onPress={() =>
                              moveImage(
                                image.id,
                                'up',
                              )
                            }
                          >
                            <ChevronUp
                              size={16}
                              color={
                                COLORS.white
                              }
                            />
                          </Pressable>

                          <Pressable
                            style={
                              styles.photoControl
                            }
                            onPress={() =>
                              moveImage(
                                image.id,
                                'down',
                              )
                            }
                          >
                            <ChevronDown
                              size={16}
                              color={
                                COLORS.white
                              }
                            />
                          </Pressable>

                          {!image.isCover && (
                            <Pressable
                              style={
                                styles.photoControl
                              }
                              onPress={() =>
                                setCoverImage(
                                  image.id,
                                )
                              }
                            >
                              <Text
                                style={
                                  styles.makeCoverText
                                }
                              >
                                Make cover
                              </Text>
                            </Pressable>
                          )}

                          <Pressable
                            style={[
                              styles.photoControl,
                              styles.deletePhotoControl,
                            ]}
                            onPress={() =>
                              removeImage(
                                image.id,
                              )
                            }
                          >
                            <Trash2
                              size={16}
                              color={
                                COLORS.danger
                              }
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                ),
              )}
            </View>
          )}
        </View>

        {/* SOURCE */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="08"
            title="Property source"
            subtitle="Internal information for management"
          />

          <View style={styles.sourceTypeRow}>
            {[
              'landlord',
              'marketer',
              'internal',
            ].map((sourceType) => {
              const active =
                source.type === sourceType;

              return (
                <Pressable
                  key={sourceType}
                  disabled={!canEdit}
                  onPress={() =>
                    setSource((current) => ({
                      ...current,
                      type: sourceType as PropertySource['type'],
                    }))
                  }
                  style={[
                    styles.sourceTypeButton,
                    active &&
                      styles.sourceTypeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sourceTypeText,
                      active &&
                        styles.sourceTypeTextActive,
                    ]}
                  >
                    {sourceType
                      .charAt(0)
                      .toUpperCase() +
                      sourceType.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Source name"
            value={source.name ?? ''}
            onChangeText={(value) =>
              setSource((current) => ({
                ...current,
                name: value,
              }))
            }
            placeholder="Source / contact name"
            editable={canEdit}
          />

          <Field
            label="Source phone"
            value={source.phone ?? ''}
            onChangeText={(value) =>
              setSource((current) => ({
                ...current,
                phone: value,
              }))
            }
            placeholder="Phone number"
            keyboardType="phone-pad"
            editable={canEdit}
          />

          <Field
            label="Internal source notes"
            value={source.notes ?? ''}
            onChangeText={(value) =>
              setSource((current) => ({
                ...current,
                notes: value,
              }))
            }
            placeholder="Internal notes..."
            multiline
            numberOfLines={4}
            editable={canEdit}
            textAlignVertical="top"
          />

          <View style={styles.internalLandlord}>
            <Text style={styles.internalTitle}>
              INTERNAL LANDLORD INFORMATION
            </Text>

            <Text style={styles.internalSubtitle}>
              This information is for MAKAZII management and is not shown to customers.
            </Text>

            <Field
              label="Landlord name"
              value={landlordName}
              onChangeText={setLandlordName}
              placeholder="Full landlord name"
              editable={canEdit}
            />

            <Field
              label="Landlord phone"
              value={landlordPhone}
              onChangeText={setLandlordPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              editable={canEdit}
            />

            <Field
              label="Landlord email"
              value={landlordEmail}
              onChangeText={setLandlordEmail}
              placeholder="Email address"
              keyboardType="email-address"
              editable={canEdit}
            />
          </View>
        </View>

        {/* VERIFICATION */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="09"
            title="Verification"
            subtitle="Property verification information"
          />

          <Text style={styles.fieldLabel}>
            Verification status
          </Text>

          <Pressable
            style={styles.selectField}
            onPress={() =>
              setShowVerificationPicker(true)
            }
          >
            <Text style={styles.selectText}>
              {
                VERIFICATION_OPTIONS.find(
                  (item) =>
                    item.value ===
                    verificationStatus,
                )?.label
              }
            </Text>

            <ChevronDown
              size={19}
              color={COLORS.muted}
            />
          </Pressable>

          <Field
            label="Verification notes"
            value={verificationNotes}
            onChangeText={setVerificationNotes}
            placeholder="Verification notes..."
            multiline
            numberOfLines={4}
            editable={canEdit}
            textAlignVertical="top"
          />

          {property.verifiedBy ? (
            <View style={styles.verificationMeta}>
              <Text style={styles.verificationMetaLabel}>
                Verified by
              </Text>

              <Text style={styles.verificationMetaValue}>
                {property.verifiedBy}
              </Text>

              <Text style={styles.verificationMetaLabel}>
                Verified date
              </Text>

              <Text style={styles.verificationMetaValue}>
                {formatDate(
                  property.verifiedDate,
                )}
              </Text>
            </View>
          ) : null}
        </View>

        {/* AVAILABILITY */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="10"
            title="Availability"
            subtitle="Current property availability"
          />

          <View style={styles.availabilityList}>
            {AVAILABILITY_OPTIONS.map(
              (option) => {
                const active =
                  availability ===
                  option.value;

                return (
                  <Pressable
                    key={option.value}
                    disabled={!canEdit}
                    onPress={() =>
                      setAvailability(
                        option.value,
                      )
                    }
                    style={[
                      styles.availabilityOption,
                      active &&
                        styles.availabilityOptionActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        active &&
                          styles.radioActive,
                      ]}
                    >
                      {active && (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.availabilityText,
                        active &&
                          styles.availabilityTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
        </View>

        {/* PUBLISHING */}
        <View style={styles.sectionCard}>
          <SectionHeader
            number="11"
            title="Publishing"
            subtitle="Customer visibility settings"
          />

          <View style={styles.publishRow}>
            <View style={styles.publishInfo}>
              <Text style={styles.publishTitle}>
                Featured property
              </Text>

              <Text style={styles.publishSubtitle}>
                Highlight this property in featured sections.
              </Text>
            </View>

            <Switch
              value={featured}
              onValueChange={
                canEdit
                  ? setFeatured
                  : undefined
              }
              trackColor={{
                false: COLORS.border,
                true: COLORS.lime,
              }}
              thumbColor={
                featured
                  ? COLORS.background
                  : COLORS.muted
              }
            />
          </View>

          <View style={styles.workflowInfo}>
            <ShieldCheck
              size={19}
              color={COLORS.lime}
            />

            <Text style={styles.workflowText}>
              Publishing is controlled by the admin review workflow. A marketer cannot publish a property directly.
            </Text>
          </View>
        </View>

        {/* SAVE */}
        {canEdit && (
          <Pressable
            style={styles.saveButton}
            onPress={saveChanges}
            disabled={saving}
          >
            <Save
              size={19}
              color={COLORS.background}
            />

            <Text style={styles.saveButtonText}>
              {saving
                ? 'Saving...'
                : 'Save Property Changes'}
            </Text>
          </Pressable>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* REVIEW NOTE MODAL */}
      <Modal
        visible={reviewAction !== null}
        transparent
        animationType="slide"
        onRequestClose={closeReviewAction}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {reviewAction === 'changes'
                    ? 'Request changes'
                    : 'Reject property'}
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  {reviewAction ===
                  'changes'
                    ? 'Tell the marketer exactly what needs to be corrected.'
                    : 'Provide the reason this property cannot proceed.'}
                </Text>
              </View>

              <Pressable
                onPress={closeReviewAction}
                style={styles.iconButton}
              >
                <X
                  size={20}
                  color={COLORS.white}
                />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>
              Review note
            </Text>

            <TextInput
              value={reviewNotes}
              onChangeText={setReviewNotes}
              placeholder={
                reviewAction === 'changes'
                  ? 'Example: Please update the rent, add clearer photos and confirm the exact location.'
                  : 'Explain why this property is being rejected.'
              }
              placeholderTextColor={
                COLORS.muted
              }
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              style={styles.reviewInput}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={closeReviewAction}
                disabled={reviewing}
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
                  styles.modalConfirmButton,
                  reviewAction === 'reject' &&
                    styles.modalRejectButton,
                ]}
                onPress={
                  handleReviewAction
                }
                disabled={reviewing}
              >
                {reviewAction ===
                  'changes' ? (
                  <FileCheck2
                    size={18}
                    color={COLORS.background}
                  />
                ) : (
                  <XCircle
                    size={18}
                    color={COLORS.white}
                  />
                )}

                <Text
                  style={[
                    styles.modalConfirmText,
                    reviewAction ===
                      'reject' &&
                      styles.modalRejectText,
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

      {renderPickerModal(
        showTypePicker,
        'Property type',
        PROPERTY_TYPES,
        type,
        setType,
        () => setShowTypePicker(false),
      )}

      {renderPickerModal(
        showCountyPicker,
        'County',
        COUNTIES,
        county,
        setCounty,
        () => setShowCountyPicker(false),
      )}

      {renderPickerModal(
        showNearbyTypePicker,
        'Nearby place type',
        NEARBY_TYPES,
        nearbyType,
        setNearbyType,
        () =>
          setShowNearbyTypePicker(false),
      )}

      {renderPickerModal(
        showVerificationPicker,
        'Verification status',
        VERIFICATION_OPTIONS.map(
          (item) => item.label,
        ),
        VERIFICATION_OPTIONS.find(
          (item) =>
            item.value ===
            verificationStatus,
        )?.label ?? 'Pending',
        (label) => {
          const option =
            VERIFICATION_OPTIONS.find(
              (item) =>
                item.label === label,
            );

          if (option) {
            setVerificationStatus(
              option.value,
            );
          }
        },
        () =>
          setShowVerificationPicker(false),
      )}

      {renderPickerModal(
        showAvailabilityPicker,
        'Availability',
        AVAILABILITY_OPTIONS.map(
          (item) => item.label,
        ),
        AVAILABILITY_OPTIONS.find(
          (item) =>
            item.value === availability,
        )?.label ?? 'Available',
        (label) => {
          const option =
            AVAILABILITY_OPTIONS.find(
              (item) =>
                item.label === label,
            );

          if (option) {
            setAvailability(
              option.value,
            );
          }
        },
        () =>
          setShowAvailabilityPicker(false),
      )}
    </View>
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
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
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
  multiline = false,
  numberOfLines,
  editable = true,
  textAlignVertical,
  flex,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'phone-pad'
    | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  flex?: number;
}) {
  return (
    <View
      style={[
        styles.fieldContainer,
        flex ? { flex } : undefined,
      ]}
    >
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        textAlignVertical={textAlignVertical}
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
          !editable &&
            styles.disabledField,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
  },

  headerEyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: COLORS.card,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  reviewCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  reviewCardAttention: {
    borderColor: 'rgba(255,184,77,0.45)',
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  reviewIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewHeaderText: {
    flex: 1,
  },

  reviewTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  reviewSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  reviewMetaItem: {
    flex: 1,
  },

  reviewMetaDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },

  reviewMetaLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  reviewMetaValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  reviewActions: {
    marginTop: 18,
    gap: 10,
  },

  reviewSecondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },

  reviewButton: {
    minHeight: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },

  approveButton: {
    backgroundColor: COLORS.lime,
  },

  approveButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  changesButton: {
    flex: 1,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rejectButton: {
    flex: 1,
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.30)',
  },

  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  existingNotes: {
    marginTop: 16,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 13,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  existingNotesLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  existingNotesText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
  },

  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  sectionNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionNumberText: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  fieldContainer: {
    marginBottom: 15,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 7,
    textTransform: 'uppercase',
  },

  input: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    paddingHorizontal: 14,
    color: COLORS.white,
    fontSize: 13,
  },

  multilineInput: {
    minHeight: 110,
    paddingTop: 13,
  },

  selectField: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  selectText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  placeholderText: {
    color: COLORS.muted,
    fontWeight: '500',
  },

  disabledField: {
    opacity: 0.55,
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 5,
  },

  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  segmentButtonActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  segmentText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  segmentTextActive: {
    color: COLORS.background,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  chipActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  chipText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  chipTextActive: {
    color: COLORS.background,
  },

  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },

  nearbyIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nearbyInfo: {
    flex: 1,
    marginLeft: 10,
  },

  nearbyName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  nearbyDetails: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  smallDangerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,107,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nearbyForm: {
    marginTop: 8,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  outlineButton: {
    minHeight: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  outlineButtonText: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '800',
  },

  photoUpload: {
    minHeight: 72,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.lime,
    backgroundColor: 'rgba(215,255,95,0.04)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14,
  },

  photoUploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(215,255,95,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoUploadText: {
    flex: 1,
  },

  photoUploadTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  photoUploadSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  emptyPhotos: {
    minHeight: 120,
    borderRadius: 15,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  emptyPhotosText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  photoList: {
    gap: 10,
  },

  photoItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    overflow: 'hidden',
  },

  propertyImage: {
    width: 110,
    height: 110,
    backgroundColor: COLORS.background,
  },

  photoInfo: {
    flex: 1,
    padding: 11,
  },

  photoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  photoNumber: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  coverBadge: {
    backgroundColor: COLORS.lime,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },

  coverBadgeText: {
    color: COLORS.background,
    fontSize: 8,
    fontWeight: '900',
  },

  photoControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 15,
  },

  photoControl: {
    minWidth: 34,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  deletePhotoControl: {
    borderColor:
      'rgba(255,107,107,0.25)',
  },

  makeCoverText: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '800',
  },

  sourceTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 17,
  },

  sourceTypeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sourceTypeButtonActive: {
    borderColor: COLORS.lime,
    backgroundColor:
      'rgba(215,255,95,0.08)',
  },

  sourceTypeText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  sourceTypeTextActive: {
    color: COLORS.lime,
  },

  internalLandlord: {
    marginTop: 5,
    backgroundColor: COLORS.background,
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  internalTitle: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },

  internalSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 15,
  },

  verificationMeta: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 13,
    padding: 13,
    gap: 5,
  },

  verificationMetaLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  verificationMetaValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },

  availabilityList: {
    gap: 8,
  },

  availabilityOption: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 11,
  },

  availabilityOptionActive: {
    borderColor: COLORS.lime,
    backgroundColor:
      'rgba(215,255,95,0.06)',
  },

  radio: {
    width: 19,
    height: 19,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioActive: {
    borderColor: COLORS.lime,
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: COLORS.lime,
  },

  availabilityText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  availabilityTextActive: {
    color: COLORS.white,
  },

  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  publishInfo: {
    flex: 1,
  },

  publishTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  publishSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  workflowInfo: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor:
      'rgba(215,255,95,0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(215,255,95,0.15)',
    borderRadius: 13,
    padding: 12,
    marginTop: 17,
  },

  workflowText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 14,
  },

  personIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor:
      'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  personInfo: {
    flex: 1,
    marginLeft: 12,
  },

  personLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  personName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },

  personDetails: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  saveButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  primaryButton: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '900',
  },

  notFound: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  notFoundTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },

  notFoundText: {
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },

  bottomSpace: {
    height: 20,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    maxHeight: '75%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reviewModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 290,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optionRow: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  optionRowActive: {
    borderColor: COLORS.lime,
    backgroundColor:
      'rgba(215,255,95,0.06)',
  },

  optionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  optionTextActive: {
    color: COLORS.lime,
    fontWeight: '800',
  },

  reviewInput: {
    minHeight: 145,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 20,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  modalCancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  modalConfirmButton: {
    flex: 1.5,
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  modalConfirmText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },

  modalRejectButton: {
    backgroundColor: COLORS.danger,
  },

  modalRejectText: {
    color: COLORS.white,
  },
});