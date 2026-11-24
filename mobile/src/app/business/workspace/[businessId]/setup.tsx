import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Globe,
  MapPin,
  Palette,
  Phone,
  Save,
  Store,
  X,
} from 'lucide-react-native';

import { API_BASE_URL } from '@/config/api';

import {
  getBusinessSetup,
  updateBusinessProfile,
  type BusinessProfileInput,
  type BusinessSetupResponse,
} from '@/lib/businessOwnerApi';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#73D99A',
  danger: '#FF6B6B',
};

type FieldName = keyof BusinessProfileInput;

type GeographyItem = {
  id: string;
  sourceId?: string | null;
  name: string;
};

type County = GeographyItem;
type Constituency = GeographyItem & { countyId: string };
type Ward = GeographyItem & { constituencyId: string };

async function fetchGeography<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new Error('Unable to connect to location services. Check your connection and retry.');
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new Error('The server returned an invalid location response.');
  }

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Unable to load location data.');
  }

  return json as T;
}

const FIELDS: {
  key: FieldName;
  label: string;
  placeholder: string;
  multiline?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'url';
}[] = [
  {
    key: 'publicDisplayName',
    label: 'PUBLIC BUSINESS NAME',
    placeholder: 'How customers should see your business',
  },
  {
    key: 'tagline',
    label: 'TAGLINE',
    placeholder: 'A short line that describes your business',
  },
  {
    key: 'publicDescription',
    label: 'ABOUT YOUR BUSINESS',
    placeholder: 'Tell customers what you offer and what makes you different',
    multiline: true,
  },
  {
    key: 'contactPhone',
    label: 'PUBLIC PHONE NUMBER',
    placeholder: '+254 7XX XXX XXX',
    keyboard: 'phone-pad',
  },
  {
    key: 'contactEmail',
    label: 'PUBLIC EMAIL',
    placeholder: 'hello@yourbusiness.co.ke',
    keyboard: 'email-address',
  },
  {
    key: 'websiteUrl',
    label: 'WEBSITE',
    placeholder: 'https://yourbusiness.co.ke',
    keyboard: 'url',
  },
  {
    key: 'addressLine',
    label: 'PHYSICAL ADDRESS',
    placeholder: 'Building, street or location',
  },
  {
    key: 'county',
    label: 'COUNTY',
    placeholder: 'e.g. Nairobi',
  },
  {
    key: 'constituency',
    label: 'CONSTITUENCY',
    placeholder: 'Your constituency',
  },
  {
    key: 'ward',
    label: 'WARD',
    placeholder: 'Your ward',
  },
];

function emptyProfile(): BusinessProfileInput {
  return {
    publicDisplayName: '',
    tagline: '',
    publicDescription: '',
    contactPhone: '',
    contactEmail: '',
    websiteUrl: '',
    addressLine: '',
    county: '',
    constituency: '',
    ward: '',
  };
}

function toInput(profile: BusinessSetupResponse['profile']): BusinessProfileInput {
  return {
    publicDisplayName: profile?.publicDisplayName ?? '',
    tagline: profile?.tagline ?? '',
    publicDescription: profile?.publicDescription ?? '',
    contactPhone: profile?.contactPhone ?? '',
    contactEmail: profile?.contactEmail ?? '',
    websiteUrl: profile?.websiteUrl ?? '',
    addressLine: profile?.addressLine ?? '',
    county: profile?.county ?? '',
    constituency: profile?.constituency ?? '',
    ward: profile?.ward ?? '',
  };
}

export default function BusinessSetupScreen() {
  const params = useLocalSearchParams<{ businessId: string | string[] }>();
  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const [setup, setSetup] = useState<BusinessSetupResponse | null>(null);
  const [form, setForm] = useState<BusinessProfileInput>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingCounties, setLoadingCounties] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [geographyError, setGeographyError] = useState('');
  const [countyId, setCountyId] = useState('');
  const [constituencyId, setConstituencyId] = useState('');
  const [wardId, setWardId] = useState('');
  const [locationModal, setLocationModal] = useState<'county' | 'constituency' | 'ward' | null>(null);
  const [geographyRestored, setGeographyRestored] = useState(false);

  const loadCounties = useCallback(async () => {
    setLoadingCounties(true);
    setGeographyError('');
    try {
      const result = await fetchGeography<{ data: { counties: County[] } }>('/geography/counties');
      setCounties(result.data.counties);
    } catch (err) {
      setGeographyError(err instanceof Error ? err.message : 'Unable to load counties.');
    } finally {
      setLoadingCounties(false);
    }
  }, []);

  const loadConstituencies = useCallback(async (id: string) => {
    setLoadingConstituencies(true);
    setGeographyError('');
    try {
      const result = await fetchGeography<{ data: { constituencies: Constituency[] } }>(
        `/geography/counties/${encodeURIComponent(id)}/constituencies`,
      );
      setConstituencies(result.data.constituencies);
      return result.data.constituencies;
    } catch (err) {
      setGeographyError(err instanceof Error ? err.message : 'Unable to load constituencies.');
      setConstituencies([]);
      return [];
    } finally {
      setLoadingConstituencies(false);
    }
  }, []);

  const loadWards = useCallback(async (id: string) => {
    setLoadingWards(true);
    setGeographyError('');
    try {
      const result = await fetchGeography<{ data: { wards: Ward[] } }>(
        `/geography/constituencies/${encodeURIComponent(id)}/wards`,
      );
      setWards(result.data.wards);
      return result.data.wards;
    } catch (err) {
      setGeographyError(err instanceof Error ? err.message : 'Unable to load wards.');
      setWards([]);
      return [];
    } finally {
      setLoadingWards(false);
    }
  }, []);

  useEffect(() => {
    void loadCounties();
  }, [loadCounties]);

  useEffect(() => {
    if (!setup || !counties.length || geographyRestored) return;

    let cancelled = false;

    const restore = async () => {
      const profile = setup.profile;
      if (!profile?.county) {
        setGeographyRestored(true);
        return;
      }

      const county = counties.find(
        (item) => item.name.toLowerCase() === profile.county?.trim().toLowerCase(),
      );

      if (!county) {
        setGeographyRestored(true);
        return;
      }

      setCountyId(county.id);
      const availableConstituencies = await loadConstituencies(county.id);
      if (cancelled) return;

      const constituency = availableConstituencies.find(
        (item) => item.name.toLowerCase() === profile.constituency?.trim().toLowerCase(),
      );

      if (constituency) {
        setConstituencyId(constituency.id);
        const availableWards = await loadWards(constituency.id);
        if (cancelled) return;

        const ward = availableWards.find(
          (item) => item.name.toLowerCase() === profile.ward?.trim().toLowerCase(),
        );
        if (ward) setWardId(ward.id);
      }

      if (!cancelled) setGeographyRestored(true);
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [setup, counties, geographyRestored, loadConstituencies, loadWards]);

  const chooseCounty = async (county: County) => {
    setCountyId(county.id);
    setConstituencyId('');
    setWardId('');
    setConstituencies([]);
    setWards([]);
    setGeographyRestored(true);
    updateField('county', county.name);
    updateField('constituency', '');
    updateField('ward', '');
    setLocationModal(null);
    await loadConstituencies(county.id);
  };

  const chooseConstituency = async (item: Constituency) => {
    setConstituencyId(item.id);
    setWardId('');
    setWards([]);
    setGeographyRestored(true);
    updateField('constituency', item.name);
    updateField('ward', '');
    setLocationModal(null);
    await loadWards(item.id);
  };

  const chooseWard = (item: Ward) => {
    setWardId(item.id);
    updateField('ward', item.name);
    setLocationModal(null);
  };

  const load = useCallback(async () => {
    if (!businessId) {
      setError('The business could not be identified.');
      setLoading(false);
      return;
    }

    setError('');

    try {
      const result = await getBusinessSetup(businessId);
      setSetup(result);
      setForm(toInput(result.profile));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load business setup.',
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateField = (key: FieldName, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    if (!businessId || saving) return;

    const displayName = form.publicDisplayName?.trim();

    if (!displayName) {
      Alert.alert(
        'Business name required',
        'Enter the public business name before saving.',
      );
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const payload: BusinessProfileInput = {};

      for (const field of FIELDS) {
        const value = form[field.key];
        payload[field.key] =
          typeof value === 'string' && value.trim()
            ? value.trim()
            : null;
      }

      await updateBusinessProfile(businessId, payload);
      setSaved(true);
      router.replace((`/business/workspace/${encodeURIComponent(businessId)}/storefront`) as any);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Unable to save your business profile.';
      setError(message);
      Alert.alert('Could not save profile', message);
    } finally {
      setSaving(false);
    }
  };

  const openStorefront = () => {
    if (!businessId) return;
    router.push((`/business/workspace/${encodeURIComponent(businessId)}/storefront`) as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.lime} />
          <Text style={styles.loadingTitle}>Loading business setup</Text>
          <Text style={styles.mutedText}>Securing your business workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!setup) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <Building2 size={30} color={C.danger} />
          <Text style={styles.loadingTitle}>Setup unavailable</Text>
          <Text style={styles.mutedText}>{error || 'Business details could not be loaded.'}</Text>
          <Pressable style={styles.primaryButton} onPress={() => {
            setLoading(true);
            void load();
          }}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.linkText}>Go back to workspace</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={19} color={C.white} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MAKAZII BUSINESS</Text>
          <Text style={styles.headerTitle}>Business setup</Text>
        </View>
        <View style={styles.headerIcon}>
          <Building2 size={19} color={C.lime} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Store size={25} color={C.lime} />
            </View>
            <Text style={styles.heroEyebrow}>YOUR BUSINESS IDENTITY</Text>
            <Text style={styles.heroTitle}>{setup.business.name}</Text>
            <Text style={styles.heroDescription}>
              Configure the information customers will see when they discover your business on MAKAZII.
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>APPROVED BUSINESS WORKSPACE</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressIcon}>
              <Check size={17} color={C.green} />
            </View>
            <View style={styles.progressCopy}>
              <Text style={styles.progressTitle}>Business approved</Text>
              <Text style={styles.progressDescription}>
                Your business is approved. Profile and storefront changes are saved as drafts until you publish your storefront.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Building2 size={17} color={C.lime} />
            </View>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Public business profile</Text>
              <Text style={styles.sectionDescription}>
                Add the details customers need to recognise and contact your business.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {FIELDS.map((field, index) => (
              <View
                key={field.key}
                style={[
                  styles.fieldBlock,
                  index === FIELDS.length - 1 && styles.lastField,
                ]}
              >
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.key === 'county' || field.key === 'constituency' || field.key === 'ward' ? (
                  <Pressable
                    style={styles.locationSelect}
                    disabled={
                      (field.key === 'county' && loadingCounties) ||
                      (field.key === 'constituency' && (!countyId || loadingConstituencies)) ||
                      (field.key === 'ward' && (!constituencyId || loadingWards))
                    }
                    onPress={() => {
                      setGeographyError('');
                      setLocationModal(field.key as 'county' | 'constituency' | 'ward');
                    }}
                  >
                    <Text style={[
                      styles.locationSelectText,
                      !form[field.key] && styles.locationPlaceholder,
                    ]}>
                      {String(form[field.key] || (
                        field.key === 'county' ? 'Select county' :
                        field.key === 'constituency' ? 'Select constituency' : 'Select ward'
                      ))}
                    </Text>
                    {(field.key === 'county' && loadingCounties) ||
                    (field.key === 'constituency' && loadingConstituencies) ||
                    (field.key === 'ward' && loadingWards)
                      ? <ActivityIndicator size="small" color={C.lime} />
                      : <ChevronDown size={17} color={C.muted} />}
                  </Pressable>
                ) : (
                <TextInput
                  value={String(form[field.key] ?? '')}
                  onChangeText={(value) => updateField(field.key, value)}
                  placeholder={field.placeholder}
                  placeholderTextColor="#687174"
                  keyboardType={field.keyboard ?? 'default'}
                  autoCapitalize={
                    field.keyboard === 'email-address' || field.keyboard === 'url'
                      ? 'none'
                      : 'sentences'
                  }
                  multiline={field.multiline}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                  style={[
                    styles.input,
                    field.multiline && styles.multilineInput,
                  ]}
                />
                )}
              </View>
            ))}
          </View>

          {!!geographyError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{geographyError}</Text>
              <Pressable
                onPress={() => {
                  if (locationModal === 'county') void loadCounties();
                  else if (locationModal === 'constituency' && countyId) void loadConstituencies(countyId);
                  else if (locationModal === 'ward' && constituencyId) void loadWards(constituencyId);
                  else void loadCounties();
                }}
                style={styles.retryLocation}
              >
                <Text style={styles.retryLocationText}>Retry loading locations</Text>
              </Pressable>
            </View>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryButton, saving && styles.disabledButton]}
            onPress={save}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={C.background} />
              : <Save size={17} color={C.background} />}
            <Text style={styles.primaryButtonText}>
              {saving ? 'Saving profile...' : 'Save business profile'}
            </Text>
          </Pressable>

          {saved && (
            <View style={styles.savedRow}>
              <Check size={15} color={C.green} />
              <Text style={styles.savedText}>Your profile draft is saved.</Text>
            </View>
          )}

          <View style={styles.nextSection}>
            <View style={styles.nextIcon}>
              <Palette size={20} color={C.lime} />
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.nextEyebrow}>NEXT STEP</Text>
              <Text style={styles.nextTitle}>Design your storefront</Text>
              <Text style={styles.nextDescription}>
                Choose your visual identity, colours and storefront layout. Preview before publishing.
              </Text>
            </View>
            <ArrowRight size={18} color={C.lime} />
          </View>

          <Pressable style={styles.storefrontButton} onPress={openStorefront}>
            <Palette size={17} color={C.background} />
            <Text style={styles.storefrontButtonText}>Open Storefront Designer</Text>
            <ArrowRight size={16} color={C.background} />
          </Pressable>

          <View style={styles.footer}>
            <Phone size={14} color={C.muted} />
            <Text style={styles.footerText}>
              Only add contact details that you intend to make public to customers.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={locationModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>
                  {locationModal === 'county' ? 'Select county' :
                   locationModal === 'constituency' ? 'Select constituency' : 'Select ward'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {locationModal === 'county' ? 'Choose the county where your business is located.' :
                   locationModal === 'constituency' ? 'Choose a constituency in the selected county.' :
                   'Choose a ward in the selected constituency.'}
                </Text>
              </View>
              <Pressable style={styles.modalCloseButton} onPress={() => setLocationModal(null)}>
                <X size={19} color={C.white} />
              </Pressable>
            </View>

            {(locationModal === 'county' && loadingCounties) ||
             (locationModal === 'constituency' && loadingConstituencies) ||
             (locationModal === 'ward' && loadingWards) ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={C.lime} />
                <Text style={styles.mutedText}>Loading locations...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                {(locationModal === 'county' ? counties :
                  locationModal === 'constituency' ? constituencies : wards).map((item) => {
                  const selected = item.id === (
                    locationModal === 'county' ? countyId :
                    locationModal === 'constituency' ? constituencyId : wardId
                  );
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.modalOption, selected && styles.modalOptionSelected]}
                      onPress={() => {
                        if (locationModal === 'county') void chooseCounty(item as County);
                        else if (locationModal === 'constituency') void chooseConstituency(item as Constituency);
                        else chooseWard(item as Ward);
                      }}
                    >
                      <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                        {item.name}
                      </Text>
                      {selected && <Check size={18} color={C.lime} />}
                    </Pressable>
                  );
                })}
                {((locationModal === 'county' && counties.length === 0) ||
                  (locationModal === 'constituency' && constituencies.length === 0) ||
                  (locationModal === 'ward' && wards.length === 0)) && (
                  <Text style={styles.modalEmpty}>
                    No locations are available. Close this window and retry loading.
                  </Text>
                )}
              </ScrollView>
            )}

            {!!geographyError && (
              <Text style={styles.modalError}>{geographyError}</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: C.background },
  header: {
    minHeight: 67,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  headerTitle: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 3 },
  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 18, paddingBottom: 42 },
  hero: {
    backgroundColor: C.card,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.border,
    padding: 19,
    marginBottom: 14,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  heroEyebrow: { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  heroTitle: { color: C.white, fontSize: 24, fontWeight: '900', marginTop: 8 },
  heroDescription: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  statusText: { color: C.green, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  progressCard: {
    flexDirection: 'row',
    gap: 11,
    padding: 14,
    backgroundColor: '#142019',
    borderColor: '#294633',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 25,
  },
  progressIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#20372A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCopy: { flex: 1 },
  progressTitle: { color: C.white, fontSize: 11, fontWeight: '900' },
  progressDescription: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 13 },
  sectionIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: C.white, fontSize: 15, fontWeight: '900' },
  sectionDescription: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  formCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  fieldBlock: { paddingTop: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  lastField: { borderBottomWidth: 0 },
  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 9 },
  locationSelect: {
    minHeight: 47,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationSelectText: { color: C.white, fontSize: 12, flex: 1 },
  locationPlaceholder: { color: '#687174' },
  retryLocation: { marginTop: 8, alignSelf: 'flex-start' },
  retryLocationText: { color: C.lime, fontSize: 11, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  modalCard: {
    maxHeight: '78%',
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalHeaderCopy: { flex: 1, paddingRight: 12 },
  modalTitle: { color: C.white, fontSize: 16, fontWeight: '900' },
  modalSubtitle: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  modalCloseButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: { marginTop: 10 },
  modalOption: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  modalOptionSelected: { backgroundColor: '#D7FF5F18' },
  modalOptionText: { color: C.white, fontSize: 12 },
  modalOptionTextSelected: { color: C.lime, fontWeight: '900' },
  modalLoading: { minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 10 },
  modalEmpty: { color: C.muted, fontSize: 11, textAlign: 'center', padding: 20 },
  modalError: { color: C.danger, fontSize: 11, marginTop: 10 },
  input: {
    minHeight: 47,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.white,
    paddingHorizontal: 13,
    fontSize: 12,
  },
  multilineInput: { minHeight: 104, paddingTop: 12 },
  errorBox: {
    backgroundColor: '#2B1718',
    borderWidth: 1,
    borderColor: '#633034',
    borderRadius: 12,
    padding: 12,
    marginBottom: 13,
  },
  errorText: { color: C.danger, fontSize: 11, lineHeight: 17 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: C.background, fontSize: 12, fontWeight: '900' },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  savedText: { color: C.green, fontSize: 10, fontWeight: '800' },
  nextSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 14,
    marginTop: 27,
  },
  nextIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: { flex: 1 },
  nextEyebrow: { color: C.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  nextTitle: { color: C.white, fontSize: 12, fontWeight: '900', marginTop: 4 },
  nextDescription: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  storefrontButton: {
    minHeight: 51,
    borderRadius: 15,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 12,
  },
  storefrontButtonText: { color: C.background, fontSize: 11, fontWeight: '900' },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 22, paddingHorizontal: 3 },
  footerText: { flex: 1, color: C.muted, fontSize: 9, lineHeight: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 27 },
  loadingTitle: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  mutedText: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  primaryButtonTextUnused: { color: C.background },
  backLink: { padding: 14, marginTop: 6 },
  linkText: { color: C.lime, fontSize: 11, fontWeight: '800' },
});
