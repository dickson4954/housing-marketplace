import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import BusinessAddressPinPicker from './BusinessAddressPinPicker';

import {
  BusinessIdImage,
  BusinessLocationEvidenceType,
  BusinessLocationEvidenceUpload,
  BusinessLocationInput,
  BusinessLocationType,
  PublicGeographyCounty,
  PublicGeographyConstituency,
  PublicGeographyWard,
  PublicGeographyPlace,
  getPublicGeographyCounties,
  getPublicGeographyConstituencies,
  getPublicGeographyWards,
  getPublicGeographyPlaces,
} from '../lib/businessOwnerApi';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
  green: '#73D99A',
};

const MAX_EVIDENCE = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type LocationOption = {
  value: string;
  label: string;
};

type SelectorKey =
  | 'locationType'
  | 'county'
  | 'constituency'
  | 'ward'
  | 'place'
  | 'evidenceType';

const LOCATION_TYPES: {
  value: BusinessLocationType;
  label: string;
  description: string;
}[] = [
  {
    value: 'FIXED_PREMISES',
    label: 'Permanent premises',
    description: 'Shop, office, workshop or other fixed workplace',
  },
  {
    value: 'HOME_BASED',
    label: 'Home-based business',
    description: 'Business operated from a residential property',
  },
  {
    value: 'MARKET_STALL',
    label: 'Market stall',
    description: 'A stall or allocated space in a market',
  },
  {
    value: 'MOBILE',
    label: 'Mobile business',
    description: 'You operate at changing customer or service locations',
  },
  {
    value: 'ONLINE_ONLY',
    label: 'Online-only business',
    description: 'You operate online without customer-facing premises',
  },
  {
    value: 'DELIVERY_ONLY',
    label: 'Delivery-only business',
    description: 'You primarily serve customers through delivery',
  },
  {
    value: 'SHARED_PREMISES',
    label: 'Shared premises',
    description: 'You operate from premises shared with another business',
  },
  {
    value: 'TEMPORARY_POPUP',
    label: 'Temporary or pop-up',
    description: 'A temporary shop, event space or pop-up location',
  },
];

const PHYSICAL_TYPES: BusinessLocationType[] = [
  'FIXED_PREMISES',
  'HOME_BASED',
  'MARKET_STALL',
  'SHARED_PREMISES',
  'TEMPORARY_POPUP',
];

const PHYSICAL_EVIDENCE: {
  value: BusinessLocationEvidenceType;
  label: string;
}[] = [
  { value: 'EXTERIOR_PHOTO', label: 'Exterior premises photo' },
  { value: 'INTERIOR_PHOTO', label: 'Interior premises photo' },
  { value: 'BUSINESS_SIGNAGE', label: 'Business signage photo' },
  { value: 'PROOF_OF_OCCUPANCY', label: 'Proof of occupancy photo' },
  { value: 'BUSINESS_REGISTRATION', label: 'Business registration document' },
  { value: 'OPERATING_LICENSE', label: 'Operating licence document' },
  { value: 'UTILITY_BILL', label: 'Utility bill photo' },
  { value: 'LOCATION_MAP', label: 'Location or service-area map' },
  { value: 'OTHER', label: 'Other supporting evidence' },
];

const NON_PHYSICAL_EVIDENCE = PHYSICAL_EVIDENCE.filter(item =>
  [
    'BUSINESS_REGISTRATION',
    'OPERATING_LICENSE',
    'LOCATION_MAP',
    'OTHER',
  ].includes(item.value),
);

export function createInitialBusinessLocation(): BusinessLocationInput {
  return {
    name: 'Main operating location',
    locationType: 'FIXED_PREMISES',
    countyId: null,
    constituencyId: null,
    wardId: null,
    placeId: null,
    locality: '',
    street: '',
    building: '',
    floor: '',
    unit: '',
    addressLine1: '',
    addressLine2: '',
    directions: '',
    postalCode: '',
    addressPinLatitude: null,
    addressPinLongitude: null,
    latitude: null,
    longitude: null,
    gpsConsent: false,
    isPubliclyDiscoverable: false,
    publicLocationLabel: '',
  };
}

export function validateBusinessLocationForm(
  location: BusinessLocationInput,
  evidence: BusinessLocationEvidenceUpload[],
): string {
  if (!location.name.trim()) {
    return 'Enter a name for this operating location.';
  }

  if (evidence.length > MAX_EVIDENCE) {
    return 'Upload no more than eight location evidence images.';
  }

  if (PHYSICAL_TYPES.includes(location.locationType)) {
    if (
      !location.countyId ||
      !location.constituencyId ||
      !location.wardId
    ) {
      return 'Select the county, constituency and ward for these premises.';
    }

    if (!location.locality.trim()) {
      return 'Enter the town, estate or locality for these premises.';
    }

    if (
      !location.street.trim() &&
      !location.building.trim() &&
      !location.addressLine1.trim() &&
      !location.unit.trim()
    ) {
      return 'Enter a street, building, shop/stall number or detailed address.';
    }

    const photos = evidence.filter(item =>
      [
        'EXTERIOR_PHOTO',
        'INTERIOR_PHOTO',
        'BUSINESS_SIGNAGE',
      ].includes(item.evidenceType),
    );

    if (photos.length < 2) {
      return 'Upload at least two premises photos: exterior, interior or business signage.';
    }
  } else {
    if (!location.locality.trim()) {
      return 'Enter the town, locality or service area where this business operates.';
    }

    const documents = evidence.filter(item =>
      [
        'BUSINESS_REGISTRATION',
        'OPERATING_LICENSE',
        'LOCATION_MAP',
        'OTHER',
      ].includes(item.evidenceType),
    );

    if (documents.length < 1) {
      return 'Upload at least one suitable business document or operating/service-area map.';
    }
  }

  return '';
}

type Props = {
  value: BusinessLocationInput;
  onChange: (value: BusinessLocationInput) => void;
  evidence: BusinessLocationEvidenceUpload[];
  onEvidenceChange: (value: BusinessLocationEvidenceUpload[]) => void;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || label}
        placeholderTextColor={C.muted}
        style={[styles.input, multiline && styles.multilineInput]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize="sentences"
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.select, disabled && styles.disabledSelect]}
      >
        <Text
          style={[
            styles.selectText,
            !value && styles.placeholderText,
          ]}
        >
          {loading ? 'Loading options...' : value || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={C.lime} />
        ) : (
          <Text style={styles.chevron}>⌄</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function BusinessLocationForm({
  value,
  onChange,
  evidence,
  onEvidenceChange,
}: Props) {
  const [counties, setCounties] = useState<PublicGeographyCounty[]>([]);
  const [constituencies, setConstituencies] = useState<
    PublicGeographyConstituency[]
  >([]);
  const [wards, setWards] = useState<PublicGeographyWard[]>([]);
  const [places, setPlaces] = useState<PublicGeographyPlace[]>([]);
  const [loadingCounties, setLoadingCounties] = useState(true);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [geographyError, setGeographyError] = useState('');
  const [selector, setSelector] = useState<SelectorKey | null>(null);
  const [evidenceType, setEvidenceType] =
    useState<BusinessLocationEvidenceType>('EXTERIOR_PHOTO');
  const [uploading, setUploading] = useState(false);
  const [addressPinPickerVisible, setAddressPinPickerVisible] =
    useState(false);

  const physical = PHYSICAL_TYPES.includes(value.locationType);

  const update = (changes: Partial<BusinessLocationInput>) => {
    onChange({ ...value, ...changes });
  };

  useEffect(() => {
    let active = true;

    getPublicGeographyCounties()
      .then(result => {
        if (active) {
          setCounties(result);
          setGeographyError('');
        }
      })
      .catch(error => {
        if (active) {
          setGeographyError(
            error instanceof Error
              ? error.message
              : 'Unable to load counties.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingCounties(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!value.countyId) {
      setConstituencies([]);
      setPlaces([]);
      return;
    }

    let active = true;
    setLoadingConstituencies(true);
    setLoadingPlaces(true);

    Promise.all([
      getPublicGeographyConstituencies(value.countyId),
      getPublicGeographyPlaces(value.countyId),
    ])
      .then(([constituencyResults, placeResults]) => {
        if (active) {
          setConstituencies(constituencyResults);
          setPlaces(placeResults);
          setGeographyError('');
        }
      })
      .catch(error => {
        if (active) {
          setGeographyError(
            error instanceof Error
              ? error.message
              : 'Unable to load county location options.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoadingConstituencies(false);
          setLoadingPlaces(false);
        }
      });

    return () => {
      active = false;
    };
  }, [value.countyId]);

  useEffect(() => {
    if (!value.constituencyId) {
      setWards([]);
      return;
    }

    let active = true;
    setLoadingWards(true);

    getPublicGeographyWards(value.constituencyId)
      .then(result => {
        if (active) {
          setWards(result);
          setGeographyError('');
        }
      })
      .catch(error => {
        if (active) {
          setGeographyError(
            error instanceof Error
              ? error.message
              : 'Unable to load wards.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingWards(false);
      });

    return () => {
      active = false;
    };
  }, [value.constituencyId]);

  const options = useMemo<LocationOption[]>(() => {
    switch (selector) {
      case 'locationType':
        return LOCATION_TYPES.map(item => ({
          value: item.value,
          label: item.label,
        }));
      case 'county':
        return counties.map(item => ({
          value: item.id,
          label: item.name,
        }));
      case 'constituency':
        return constituencies.map(item => ({
          value: item.id,
          label: item.name,
        }));
      case 'ward':
        return wards.map(item => ({
          value: item.id,
          label: item.name,
        }));
      case 'place':
        return places.map(item => ({
          value: item.id,
          label: item.name,
        }));
      case 'evidenceType':
        return (physical ? PHYSICAL_EVIDENCE : NON_PHYSICAL_EVIDENCE).map(
          item => ({
            value: item.value,
            label: item.label,
          }),
        );
      default:
        return [];
    }
  }, [selector, counties, constituencies, wards, places, physical]);

  const selectorTitle = useMemo(() => {
    switch (selector) {
      case 'locationType':
        return 'Operating arrangement';
      case 'county':
        return 'Select county';
      case 'constituency':
        return 'Select constituency';
      case 'ward':
        return 'Select ward';
      case 'place':
        return 'Select town or place';
      case 'evidenceType':
        return 'Choose evidence type';
      default:
        return '';
    }
  }, [selector]);

  const selectedValue = (key: SelectorKey) => {
    switch (key) {
      case 'locationType':
        return value.locationType;
      case 'county':
        return value.countyId || '';
      case 'constituency':
        return value.constituencyId || '';
      case 'ward':
        return value.wardId || '';
      case 'place':
        return value.placeId || '';
      case 'evidenceType':
        return evidenceType;
    }
  };

  const selectOption = (selected: LocationOption) => {
    switch (selector) {
      case 'locationType':
        update({
          locationType: selected.value as BusinessLocationType,
          countyId: null,
          constituencyId: null,
          wardId: null,
          placeId: null,
        });
        break;
      case 'county':
        update({
          countyId: selected.value,
          constituencyId: null,
          wardId: null,
          placeId: null,
        });
        break;
      case 'constituency':
        update({
          constituencyId: selected.value,
          wardId: null,
        });
        break;
      case 'ward':
        update({ wardId: selected.value });
        break;
      case 'place':
        update({ placeId: selected.value });
        break;
      case 'evidenceType':
        setEvidenceType(selected.value as BusinessLocationEvidenceType);
        break;
    }

    setSelector(null);
  };

  const pickEvidence = async () => {
    if (evidence.length >= MAX_EVIDENCE) {
      Alert.alert('Evidence limit reached', 'You can upload up to eight images.');
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo access required',
        'Allow photo-library access to attach premises evidence.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      Alert.alert('Unsupported image', 'Choose a JPEG, PNG or WebP image.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      Alert.alert('Image too large', 'Each evidence image must be 10 MB or smaller.');
      return;
    }

    const image: BusinessIdImage = {
      uri: asset.uri,
      name: asset.fileName || `location-evidence-${Date.now()}.jpg`,
      mimeType,
      type: mimeType,
      ...(asset.file ? { file: asset.file } : {}),
    };

    onEvidenceChange([
      ...evidence,
      {
        evidenceType,
        image,
      },
    ]);
  };

  const removeEvidence = (index: number) => {
    onEvidenceChange(evidence.filter((_, itemIndex) => itemIndex !== index));
  };

  const countyName =
    counties.find(item => item.id === value.countyId)?.name || '';
  const constituencyName =
    constituencies.find(item => item.id === value.constituencyId)?.name || '';
  const wardName = wards.find(item => item.id === value.wardId)?.name || '';
  const placeName = places.find(item => item.id === value.placeId)?.name || '';

  const evidenceLabel = (type: BusinessLocationEvidenceType) =>
    PHYSICAL_EVIDENCE.find(item => item.value === type)?.label || type;

  return (
    <View style={styles.container}>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Where does this business operate?</Text>
        <Text style={styles.introText}>
          Provide accurate operating details. This helps MAKAZII verify the
          business and build customer trust. Your private address details are
          not automatically published.
        </Text>
      </View>

      <Field
        label="Location name"
        value={value.name}
        onChange={text => update({ name: text })}
        placeholder="e.g. Main shop, Nairobi branch"
      />

      <SelectField
        label="Operating arrangement"
        value={
          LOCATION_TYPES.find(item => item.value === value.locationType)?.label
        }
        placeholder="Choose how your business operates"
        onPress={() => setSelector('locationType')}
      />

      <Text style={styles.helperText}>
        {
          LOCATION_TYPES.find(item => item.value === value.locationType)
            ?.description
        }
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operating area</Text>
        <Text style={styles.sectionDescription}>
          Use the official county structure so the location can be checked
          accurately.
        </Text>

        <SelectField
          label="County"
          value={countyName}
          placeholder="Select county"
          onPress={() => setSelector('county')}
          loading={loadingCounties}
        />

        {physical && (
          <>
            <SelectField
              label="Constituency"
              value={constituencyName}
              placeholder={
                value.countyId ? 'Select constituency' : 'Select county first'
              }
              onPress={() => setSelector('constituency')}
              disabled={!value.countyId}
              loading={loadingConstituencies}
            />

            <SelectField
              label="Ward"
              value={wardName}
              placeholder={
                value.constituencyId
                  ? 'Select ward'
                  : 'Select constituency first'
              }
              onPress={() => setSelector('ward')}
              disabled={!value.constituencyId}
              loading={loadingWards}
            />
          </>
        )}

        <SelectField
          label="Town or place (optional)"
          value={placeName}
          placeholder={
            value.countyId ? 'Select a town or place' : 'Select county first'
          }
          onPress={() => setSelector('place')}
          disabled={!value.countyId}
          loading={loadingPlaces}
        />

        <Field
          label={physical ? 'Town, estate or locality' : 'Town or service area'}
          value={value.locality}
          onChange={text => update({ locality: text })}
          placeholder="e.g. Kianjai, Westlands, CBD"
        />
      </View>

      {physical && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premises address</Text>
          <Text style={styles.sectionDescription}>
            Give enough detail for an independent physical verification.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Map pin (optional)</Text>
            <Pressable
              onPress={() => setAddressPinPickerVisible(true)}
              style={{
                minHeight: 50,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.cardSoft,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ color: C.white, fontSize: 14, fontWeight: '700' }}>
                  {value.addressPinLatitude != null &&
                  value.addressPinLongitude != null
                    ? 'Premises pin selected'
                    : 'Choose premises location'}
                </Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
                  {value.addressPinLatitude != null &&
                  value.addressPinLongitude != null
                    ? `${value.addressPinLatitude.toFixed(6)}, ${value.addressPinLongitude.toFixed(6)}`
                    : 'Select the position on the map'}
                </Text>
              </View>
              <Text style={{ color: C.lime, fontWeight: '800' }}>
                {value.addressPinLatitude != null &&
                value.addressPinLongitude != null
                  ? 'Adjust'
                  : 'Open map  ›'}
              </Text>
            </Pressable>

            {value.addressPinLatitude != null &&
              value.addressPinLongitude != null && (
                <Pressable
                  onPress={() =>
                    update({
                      addressPinLatitude: null,
                      addressPinLongitude: null,
                    })
                  }
                  style={{ alignSelf: 'flex-start', paddingVertical: 9 }}
                >
                  <Text style={{ color: C.danger, fontSize: 12, fontWeight: '700' }}>
                    Remove map pin
                  </Text>
                </Pressable>
              )}
          </View>

          <BusinessAddressPinPicker
            visible={addressPinPickerVisible}
            initialLatitude={value.addressPinLatitude}
            initialLongitude={value.addressPinLongitude}
            onClose={() => setAddressPinPickerVisible(false)}
            onConfirm={coordinate => {
              update({
                addressPinLatitude: coordinate.latitude,
                addressPinLongitude: coordinate.longitude,
              });
              setAddressPinPickerVisible(false);
            }}
          />

          <Field
            label="Street or road"
            value={value.street}
            onChange={text => update({ street: text })}
            placeholder="Street or road name"
          />
          <Field
            label="Building"
            value={value.building}
            onChange={text => update({ building: text })}
            placeholder="Building or shopping centre"
          />
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Field
                label="Floor"
                value={value.floor}
                onChange={text => update({ floor: text })}
                placeholder="Floor"
              />
            </View>
            <View style={styles.column}>
              <Field
                label="Shop, stall or unit"
                value={value.unit}
                onChange={text => update({ unit: text })}
                placeholder="Unit number"
              />
            </View>
          </View>
          <Field
            label="Additional address detail"
            value={value.addressLine1}
            onChange={text => update({ addressLine1: text })}
            placeholder="Plot number or another precise address detail"
          />
          <Field
            label="Address line 2 (optional)"
            value={value.addressLine2}
            onChange={text => update({ addressLine2: text })}
            placeholder="Additional address information"
          />
          <Field
            label="Directions (optional)"
            value={value.directions}
            onChange={text => update({ directions: text })}
            placeholder="Landmarks or directions to the premises"
            multiline
          />
          <Field
            label="Postal code (optional)"
            value={value.postalCode}
            onChange={text => update({ postalCode: text })}
            placeholder="Postal code"
          />
        </View>
      )}

      {!physical && (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>No fixed customer-facing premises?</Text>
          <Text style={styles.noticeText}>
            That is supported. Declare the actual town, locality or service
            area where the business operates and provide suitable supporting
            evidence below.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location evidence</Text>
        <Text style={styles.sectionDescription}>
          {physical
            ? 'At least two photos are required. Show the outside, inside or business signage.'
            : 'Upload at least one business registration, operating licence, service-area map or other suitable evidence.'}
        </Text>

        <SelectField
          label="Evidence type"
          value={evidenceLabel(evidenceType)}
          placeholder="Choose evidence type"
          onPress={() => setSelector('evidenceType')}
        />

        <Pressable
          onPress={pickEvidence}
          disabled={uploading || evidence.length >= MAX_EVIDENCE}
          style={[
            styles.uploadButton,
            evidence.length >= MAX_EVIDENCE && styles.disabledSelect,
          ]}
        >
          <Text style={styles.uploadIcon}>＋</Text>
          <View style={styles.uploadCopy}>
            <Text style={styles.uploadTitle}>Add evidence image</Text>
            <Text style={styles.uploadSubtitle}>
              JPEG, PNG or WebP · Maximum 10 MB each
            </Text>
          </View>
          <Text style={styles.uploadArrow}>›</Text>
        </Pressable>

        <Text style={styles.evidenceCount}>
          {evidence.length} of {MAX_EVIDENCE} images selected
        </Text>

        {evidence.map((item, index) => (
          <View key={`${item.image.uri}-${index}`} style={styles.evidenceRow}>
            <Image
              source={{ uri: item.image.uri }}
              style={styles.evidenceThumbnail}
            />
            <View style={styles.evidenceInfo}>
              <Text style={styles.evidenceName}>
                {evidenceLabel(item.evidenceType)}
              </Text>
              <Text style={styles.evidenceFile} numberOfLines={1}>
                {item.image.name || 'Selected image'}
              </Text>
            </View>
            <Pressable
              onPress={() => removeEvidence(index)}
              hitSlop={10}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public location visibility</Text>
        <Text style={styles.sectionDescription}>
          This is separate from verification. You decide whether an approved
          and verified location may appear in public business discovery.
        </Text>

        <Pressable
          onPress={() =>
            update({ isPubliclyDiscoverable: !value.isPubliclyDiscoverable })
          }
          style={styles.toggleRow}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Show this location publicly</Text>
            <Text style={styles.toggleDescription}>
              Optional. Your private street and unit details are not exposed
              by this setting.
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              value.isPubliclyDiscoverable && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                value.isPubliclyDiscoverable && styles.toggleKnobActive,
              ]}
            />
          </View>
        </Pressable>

        {value.isPubliclyDiscoverable && (
          <Field
            label="Public location label"
            value={value.publicLocationLabel}
            onChange={text => update({ publicLocationLabel: text })}
            placeholder="e.g. Westlands, Nairobi"
          />
        )}
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Your location privacy</Text>
        <Text style={styles.privacyText}>
          GPS sharing is not enabled in this form. No coordinates are collected.
          Evidence is submitted for private verification and is not a public
          photo gallery.
        </Text>
      </View>

      {!!geographyError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{geographyError}</Text>
          <Pressable
            onPress={() => {
              setLoadingCounties(true);
              getPublicGeographyCounties()
                .then(setCounties)
                .catch(error =>
                  setGeographyError(
                    error instanceof Error ? error.message : 'Retry failed.',
                  ),
                )
                .finally(() => setLoadingCounties(false));
            }}
          >
            <Text style={styles.retryText}>Retry loading counties</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={selector !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelector(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelector(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectorTitle}</Text>
            <ScrollView
              style={styles.optionList}
              keyboardShouldPersistTaps="handled"
            >
              {options.map(option => {
                const active =
                  selector !== null &&
                  selectedValue(selector) === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => selectOption(option)}
                    style={[
                      styles.optionRow,
                      active && styles.optionRowActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {active && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                );
              })}
              {!options.length && (
                <Text style={styles.emptyOptions}>
                  No options available. Check your connection and try again.
                </Text>
              )}
            </ScrollView>
            <Pressable
              onPress={() => setSelector(null)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 17,
    paddingBottom: 18,
  },
  introCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 17,
    gap: 8,
  },
  introTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  introText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 15,
    gap: 13,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -7,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    color: '#D8DEDF',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: C.white,
    backgroundColor: C.cardSoft,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 86,
    paddingTop: 12,
  },
  select: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    backgroundColor: C.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectText: {
    color: C.white,
    fontSize: 14,
    flex: 1,
  },
  placeholderText: {
    color: C.muted,
  },
  chevron: {
    color: C.lime,
    fontSize: 22,
    marginTop: -5,
  },
  disabledSelect: {
    opacity: 0.45,
  },
  helperText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -12,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
  noticeCard: {
    borderWidth: 1,
    borderColor: '#34402A',
    backgroundColor: '#171E14',
    borderRadius: 15,
    padding: 15,
    gap: 7,
  },
  noticeTitle: {
    color: C.lime,
    fontWeight: '800',
    fontSize: 14,
  },
  noticeText: {
    color: '#C0C9B4',
    fontSize: 12,
    lineHeight: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#64733D',
    backgroundColor: '#1B2117',
    borderRadius: 14,
    padding: 13,
    gap: 12,
  },
  uploadIcon: {
    color: C.lime,
    fontSize: 25,
    fontWeight: '400',
  },
  uploadCopy: {
    flex: 1,
    gap: 3,
  },
  uploadTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
  uploadSubtitle: {
    color: C.muted,
    fontSize: 11,
  },
  uploadArrow: {
    color: C.lime,
    fontSize: 23,
  },
  evidenceCount: {
    color: C.muted,
    fontSize: 11,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 9,
    backgroundColor: C.cardSoft,
  },
  evidenceThumbnail: {
    width: 49,
    height: 49,
    borderRadius: 9,
    backgroundColor: C.border,
  },
  evidenceInfo: {
    flex: 1,
    gap: 4,
  },
  evidenceName: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  evidenceFile: {
    color: C.muted,
    fontSize: 10,
  },
  removeButton: {
    padding: 6,
  },
  removeText: {
    color: C.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleCopy: {
    flex: 1,
    gap: 5,
  },
  toggleTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#343B3D',
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#60752A',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
    backgroundColor: C.lime,
  },
  privacyCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#111718',
    gap: 6,
  },
  privacyTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  privacyText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  errorCard: {
    backgroundColor: '#281819',
    borderColor: '#633638',
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    gap: 8,
  },
  errorText: {
    color: '#FFB3B3',
    fontSize: 12,
    lineHeight: 18,
  },
  retryText: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalSheet: {
    maxHeight: '78%',
    backgroundColor: '#141A1C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 25,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#566062',
    alignSelf: 'center',
    marginBottom: 17,
  },
  modalTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
  },
  optionList: {
    flexGrow: 0,
  },
  optionRow: {
    minHeight: 49,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  optionRowActive: {
    backgroundColor: '#222B1A',
    borderRadius: 10,
  },
  optionText: {
    color: '#DCE1E2',
    fontSize: 14,
  },
  optionTextActive: {
    color: C.lime,
    fontWeight: '800',
  },
  optionCheck: {
    color: C.lime,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyOptions: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 20,
  },
  modalClose: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    marginTop: 14,
  },
  modalCloseText: {
    color: C.lime,
    fontSize: 13,
    fontWeight: '800',
  },
});
