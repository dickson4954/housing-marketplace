import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

type County = {
  id: string;
  name: string;
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

type CreateMarketerResponse = {
  success: boolean;
  message?: string;
  data?: {
    marketer?: {
      id: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        role: string;
        isActive: boolean;
      };
      coverage?: {
        id: string;
        countyId: string;
        constituencyId: string;
        wardIds: string[];
        county?: {
          id: string;
          name: string;
        };
        constituency?: {
          id: string;
          name: string;
        };
      };
    };
  };
};

const ADMIN_TOKEN_KEY = 'makazii_admin_token';

async function getAdminToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAdminToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const text = await response.text();

  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

async function loadCounties(): Promise<County[]> {
  const result = await apiRequest<{
    success: boolean;
    data?: County[];
    counties?: County[];
  }>(API_ENDPOINTS.geographyCounties);

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.counties)) {
    return result.counties;
  }

  return [];
}

async function loadConstituencies(
  countyId: string
): Promise<Constituency[]> {
  const result = await apiRequest<{
    success: boolean;
    data?: Constituency[];
    constituencies?: Constituency[];
  }>(
    API_ENDPOINTS.geographyConstituencies(countyId)
  );

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.constituencies)) {
    return result.constituencies;
  }

  return [];
}

async function loadWards(
  constituencyId: string
): Promise<Ward[]> {
  const result = await apiRequest<{
    success: boolean;
    data?: Ward[];
    wards?: Ward[];
  }>(
    API_ENDPOINTS.geographyWards(constituencyId)
  );

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.wards)) {
    return result.wards;
  }

  return [];
}

export default function AddMarketerScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const compactLayout = windowWidth < 760;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] =
    useState('');
  const [notes, setNotes] = useState('');

  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] =
    useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedCountyId, setSelectedCountyId] =
    useState('');
  const [
    selectedConstituencyId,
    setSelectedConstituencyId,
  ] = useState('');
  const [selectedWardIds, setSelectedWardIds] =
    useState<string[]>([]);

  const [countyOpen, setCountyOpen] = useState(false);
  const [constituencyOpen, setConstituencyOpen] =
    useState(false);

  const [loadingCounties, setLoadingCounties] =
    useState(true);
  const [loadingConstituencies, setLoadingConstituencies] =
    useState(false);
  const [loadingWards, setLoadingWards] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [successData, setSuccessData] =
    useState<CreateMarketerResponse['data'] | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        setLoadingCounties(true);

        const token = await getAdminToken();

        if (!token) {
          if (mounted) {
            setErrorMessage(
              'Your admin session has expired. Please log in again.'
            );
          }

          return;
        }

        const data = await loadCounties();

        if (mounted) {
          setCounties(data);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load counties.'
          );
        }
      } finally {
        if (mounted) {
          setLoadingCounties(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCountyId) return;

    let mounted = true;

    async function fetchConstituencies() {
      try {
        setLoadingConstituencies(true);
        setConstituencyOpen(false);

        const data = await loadConstituencies(
          selectedCountyId
        );

        if (mounted) {
          setConstituencies(data);
        }
      } catch (error) {
        if (mounted) {
          setConstituencies([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load constituencies.'
          );
        }
      } finally {
        if (mounted) {
          setLoadingConstituencies(false);
        }
      }
    }

    fetchConstituencies();

    return () => {
      mounted = false;
    };
  }, [selectedCountyId]);

  useEffect(() => {
    if (!selectedConstituencyId) return;

    let mounted = true;

    async function fetchWards() {
      try {
        setLoadingWards(true);

        const data = await loadWards(
          selectedConstituencyId
        );

        if (mounted) {
          setWards(data);
        }
      } catch (error) {
        if (mounted) {
          setWards([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load wards.'
          );
        }
      } finally {
        if (mounted) {
          setLoadingWards(false);
        }
      }
    }

    fetchWards();

    return () => {
      mounted = false;
    };
  }, [selectedConstituencyId]);

  const selectedCounty = useMemo(
    () =>
      counties.find(
        (county) => county.id === selectedCountyId
      ),
    [counties, selectedCountyId]
  );

  const selectedConstituency = useMemo(
    () =>
      constituencies.find(
        (item) => item.id === selectedConstituencyId
      ),
    [constituencies, selectedConstituencyId]
  );

  const selectedWards = useMemo(
    () =>
      wards.filter((ward) =>
        selectedWardIds.includes(ward.id)
      ),
    [wards, selectedWardIds]
  );

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const canSubmit =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    email.trim().length > 3 &&
    temporaryPassword.length >= 6 &&
    selectedCountyId.length > 0 &&
    selectedConstituencyId.length > 0 &&
    selectedWardIds.length >= 1 &&
    selectedWardIds.length <= 2 &&
    !saving;

  function resetForm() {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setTemporaryPassword('');
    setNotes('');

    setSelectedCountyId('');
    setSelectedConstituencyId('');
    setSelectedWardIds([]);

    setConstituencies([]);
    setWards([]);

    setCountyOpen(false);
    setConstituencyOpen(false);
    setErrorMessage('');
    setSuccessData(null);
  }

  function toggleWard(wardId: string) {
    setErrorMessage('');

    setSelectedWardIds((current) => {
      if (current.includes(wardId)) {
        return current.filter((id) => id !== wardId);
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, wardId];
    });
  }

  function selectCounty(countyId: string) {
    setErrorMessage('');

    setSelectedCountyId(countyId);
    setSelectedConstituencyId('');
    setSelectedWardIds([]);
    setConstituencies([]);
    setWards([]);

    setCountyOpen(false);
  }

  function selectConstituency(
    constituencyId: string
  ) {
    setErrorMessage('');

    setSelectedConstituencyId(constituencyId);
    setSelectedWardIds([]);
    setWards([]);

    setConstituencyOpen(false);
  }

  async function handleCreate() {
    if (saving) {
      return;
    }

    setErrorMessage('');

    if (firstName.trim().length < 2) {
      setErrorMessage(
        'Enter the marketer first name.'
      );
      return;
    }

    if (lastName.trim().length < 2) {
      setErrorMessage(
        'Enter the marketer last name.'
      );
      return;
    }

    if (!email.trim()) {
      setErrorMessage(
        'Enter the marketer email address.'
      );
      return;
    }

    if (temporaryPassword.length < 6) {
      setErrorMessage(
        'Temporary password must contain at least 6 characters.'
      );
      return;
    }

    if (!selectedCountyId) {
      setErrorMessage('Select a county.');
      return;
    }

    if (!selectedConstituencyId) {
      setErrorMessage(
        'Select a constituency.'
      );
      return;
    }

    if (selectedWardIds.length < 1) {
      setErrorMessage(
        'Select at least one ward.'
      );
      return;
    }

    if (selectedWardIds.length > 2) {
      setErrorMessage(
        'A marketer can cover a maximum of two wards.'
      );
      return;
    }

    try {
      setSaving(true);

      const result =
        await apiRequest<CreateMarketerResponse>(
          '/admin/marketers',
          {
            method: 'POST',
            body: JSON.stringify({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim() || undefined,
              password: temporaryPassword,
              notes: notes.trim() || undefined,
              countyId: selectedCountyId,
              constituencyId:
                selectedConstituencyId,
              wardIds: selectedWardIds,
            }),
          }
        );

      if (!result.success) {
        throw new Error(
          result.message ||
            'Unable to create marketer.'
        );
      }

      setSuccessData(result.data || null);

      if (Platform.OS === 'web') {
        return;
      }

      Alert.alert(
        'Marketer created',
        result.message ||
          'The marketer was created and is pending approval.'
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create marketer.';

      setErrorMessage(message);

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Could not create marketer',
          message
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (successData?.marketer) {
    const marketer = successData.marketer;
    const createdUser = marketer.user;
    const coverage = marketer.coverage;

    const successCounty =
      coverage?.county?.name ||
      selectedCounty?.name ||
      'Selected county';

    const successConstituency =
      coverage?.constituency?.name ||
      selectedConstituency?.name ||
      'Selected constituency';

    const successWardNames =
      selectedWards.length > 0
        ? selectedWards.map((ward) => ward.name)
        : coverage?.wardIds || [];

    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={
            styles.successContainer
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>
              ✓
            </Text>
          </View>

          <Text style={styles.successTitle}>
            Marketer created
          </Text>

          <Text style={styles.successSubtitle}>
            The marketer account has been created
            successfully and is now waiting for
            admin approval.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successStatusRow}>
              <View>
                <Text style={styles.successLabel}>
                  ACCOUNT STATUS
                </Text>

                <Text
                  style={styles.pendingStatus}
                >
                  PENDING APPROVAL
                </Text>
              </View>

              <View style={styles.pendingDot} />
            </View>

            <View style={styles.divider} />

            <InfoRow
              label="MARKETER"
              value={
                createdUser
                  ? `${createdUser.firstName} ${createdUser.lastName}`
                  : fullName
              }
            />

            <InfoRow
              label="LOGIN EMAIL"
              value={
                createdUser?.email ||
                email.trim().toLowerCase()
              }
            />

            {createdUser?.phone ||
            phone.trim() ? (
              <InfoRow
                label="PHONE"
                value={
                  createdUser?.phone ||
                  phone.trim()
                }
              />
            ) : null}

            <InfoRow
              label="COUNTY"
              value={successCounty}
            />

            <InfoRow
              label="CONSTITUENCY"
              value={successConstituency}
            />

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>
                WARDS
              </Text>

              <View style={styles.wardSummary}>
                {successWardNames.map(
                  (wardName, index) => (
                    <View
                      key={`${wardName}-${index}`}
                      style={styles.summaryWard}
                    >
                      <Text
                        style={
                          styles.summaryWardText
                        }
                      >
                        {wardName}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>

          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>
              What happens next?
            </Text>

            <Text style={styles.noticeText}>
              1. The marketer remains inactive.
            </Text>

            <Text style={styles.noticeText}>
              2. An admin reviews the account and
              assigned coverage.
            </Text>

            <Text style={styles.noticeText}>
              3. Once approved, the marketer can
              sign in and manage properties within
              the assigned wards.
            </Text>
          </View>

          <View style={styles.successActions}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={resetForm}
            >
              <Text
                style={styles.primaryButtonText}
              >
                Add Another Marketer
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                router.replace(
                  '/admin/marketers'
                )
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                View Marketers
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace(
                '/admin/marketers'
              )
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              ADMIN / MARKETERS
            </Text>

            <Text style={styles.title}>
              Add Marketer
            </Text>

            <Text style={styles.subtitle}>
              Create a marketer account and assign
              the exact Kenya coverage area they
              will manage.
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>
                !
              </Text>
            </View>

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View style={[styles.layout, compactLayout && styles.layoutCompact]}>
          <View style={[styles.mainColumn, compactLayout && styles.mainColumnCompact]}>
            <Section
              number="01"
              title="Personal Information"
              description="Basic information for the marketer account."
            >
              <View style={[styles.fieldGrid, compactLayout && styles.fieldGridCompact]}>
                <Field
                  label="FIRST NAME"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. John"
                  autoCapitalize="words"
                  editable={!saving}
                />

                <Field
                  label="LAST NAME"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g. Mwangi"
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <Field
                label="PHONE NUMBER"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 0712345678"
                keyboardType="phone-pad"
                editable={!saving}
              />

              <Field
                label="EMAIL ADDRESS"
                value={email}
                onChangeText={setEmail}
                placeholder="marketer@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
            </Section>

            <Section
              number="02"
              title="Account Access"
              description="The email becomes the marketer's login identity."
            >
              <Field
                label="TEMPORARY PASSWORD"
                value={temporaryPassword}
                onChangeText={setTemporaryPassword}
                placeholder="Minimum 6 characters"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              <View style={styles.passwordHint}>
                <Text
                  style={styles.passwordHintIcon}
                >
                  🔒
                </Text>

                <Text
                  style={styles.passwordHintText}
                >
                  The password is sent securely to
                  the backend and stored as a
                  password hash. It is never stored
                  in plain text.
                </Text>
              </View>
            </Section>

            <Section
              number="03"
              title="Coverage Area"
              description="Assign one constituency and one or two wards within it."
            >
              <View style={styles.coverageRule}>
                <View
                  style={styles.coverageRuleIcon}
                >
                  <Text
                    style={
                      styles.coverageRuleIconText
                    }
                  >
                    ✓
                  </Text>
                </View>

                <View
                  style={styles.coverageRuleCopy}
                >
                  <Text
                    style={
                      styles.coverageRuleTitle
                    }
                  >
                    Coverage is hierarchical
                  </Text>

                  <Text
                    style={
                      styles.coverageRuleText
                    }
                  >
                    County → Constituency →
                    Ward(s)
                  </Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  COUNTY
                </Text>

                <Pressable
                  disabled={
                    loadingCounties || saving
                  }
                  style={({ pressed }) => [
                    styles.select,
                    pressed &&
                      styles.selectPressed,
                    loadingCounties &&
                      styles.disabled,
                  ]}
                  onPress={() =>
                    setCountyOpen(
                      (current) => !current
                    )
                  }
                >
                  <Text
                    style={[
                      styles.selectText,
                      !selectedCounty &&
                        styles.placeholderText,
                    ]}
                  >
                    {loadingCounties
                      ? 'Loading counties...'
                      : selectedCounty?.name ||
                        'Select county'}
                  </Text>

                  {loadingCounties ? (
                    <ActivityIndicator
                      size="small"
                      color="#D7FF5F"
                    />
                  ) : (
                    <Text
                      style={styles.chevron}
                    >
                      {countyOpen ? '⌃' : '⌄'}
                    </Text>
                  )}
                </Pressable>

                {countyOpen &&
                !loadingCounties ? (
                  <View
                    style={
                      styles.optionsContainer
                    }
                  >
                    <ScrollView
                      nestedScrollEnabled
                      style={
                        styles.optionsScroll
                      }
                    >
                      {counties.map((county) => {
                        const active =
                          county.id ===
                          selectedCountyId;

                        return (
                          <Pressable
                            key={county.id}
                            style={[
                              styles.option,
                              active &&
                                styles.optionActive,
                            ]}
                            onPress={() =>
                              selectCounty(
                                county.id
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.optionText,
                                active &&
                                  styles.optionTextActive,
                              ]}
                            >
                              {county.name}
                            </Text>

                            {active ? (
                              <Text
                                style={
                                  styles.check
                                }
                              >
                                ✓
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  CONSTITUENCY
                </Text>

                <Pressable
                  disabled={
                    !selectedCountyId ||
                    loadingConstituencies ||
                    saving
                  }
                  style={({ pressed }) => [
                    styles.select,
                    pressed &&
                      styles.selectPressed,
                    (!selectedCountyId ||
                      loadingConstituencies) &&
                      styles.disabled,
                  ]}
                  onPress={() =>
                    setConstituencyOpen(
                      (current) => !current
                    )
                  }
                >
                  <Text
                    style={[
                      styles.selectText,
                      !selectedConstituency &&
                        styles.placeholderText,
                    ]}
                  >
                    {loadingConstituencies
                      ? 'Loading constituencies...'
                      : selectedConstituency?.name ||
                        (!selectedCountyId
                          ? 'Select county first'
                          : 'Select constituency')}
                  </Text>

                  {loadingConstituencies ? (
                    <ActivityIndicator
                      size="small"
                      color="#D7FF5F"
                    />
                  ) : (
                    <Text
                      style={styles.chevron}
                    >
                      {constituencyOpen
                        ? '⌃'
                        : '⌄'}
                    </Text>
                  )}
                </Pressable>

                {constituencyOpen &&
                selectedCountyId &&
                !loadingConstituencies ? (
                  <View
                    style={
                      styles.optionsContainer
                    }
                  >
                    <ScrollView
                      nestedScrollEnabled
                      style={
                        styles.optionsScroll
                      }
                    >
                      {constituencies.map(
                        (constituency) => {
                          const active =
                            constituency.id ===
                            selectedConstituencyId;

                          return (
                            <Pressable
                              key={
                                constituency.id
                              }
                              style={[
                                styles.option,
                                active &&
                                  styles.optionActive,
                              ]}
                              onPress={() =>
                                selectConstituency(
                                  constituency.id
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  active &&
                                    styles.optionTextActive,
                                ]}
                              >
                                {
                                  constituency.name
                                }
                              </Text>

                              {active ? (
                                <Text
                                  style={
                                    styles.check
                                  }
                                >
                                  ✓
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        }
                      )}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              <View style={styles.field}>
                <View
                  style={styles.wardHeader}
                >
                  <Text style={styles.fieldLabel}>
                    WARDS
                  </Text>

                  <Text
                    style={styles.wardCounter}
                  >
                    {selectedWardIds.length}/2
                  </Text>
                </View>

                {!selectedConstituencyId ? (
                  <View
                    style={
                      styles.emptySelection
                    }
                  >
                    <Text
                      style={
                        styles.emptySelectionText
                      }
                    >
                      Select a constituency to load
                      its wards.
                    </Text>
                  </View>
                ) : loadingWards ? (
                  <View
                    style={
                      styles.loadingBox
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#D7FF5F"
                    />

                    <Text
                      style={
                        styles.loadingText
                      }
                    >
                      Loading wards...
                    </Text>
                  </View>
                ) : wards.length === 0 ? (
                  <View
                    style={
                      styles.emptySelection
                    }
                  >
                    <Text
                      style={
                        styles.emptySelectionText
                      }
                    >
                      No wards were returned for
                      this constituency.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={styles.wardList}
                  >
                    {wards.map((ward) => {
                      const selected =
                        selectedWardIds.includes(
                          ward.id
                        );

                      const disabled =
                        !selected &&
                        selectedWardIds.length >=
                          2;

                      return (
                        <Pressable
                          key={ward.id}
                          disabled={
                            disabled || saving
                          }
                          onPress={() =>
                            toggleWard(
                              ward.id
                            )
                          }
                          style={({ pressed }) => [
                            styles.wardOption,
                            selected &&
                              styles.wardOptionSelected,
                            disabled &&
                              styles.wardOptionDisabled,
                            pressed &&
                              styles.wardPressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selected &&
                                styles.checkboxSelected,
                            ]}
                          >
                            {selected ? (
                              <Text
                                style={
                                  styles.checkboxText
                                }
                              >
                                ✓
                              </Text>
                            ) : null}
                          </View>

                          <Text
                            style={[
                              styles.wardName,
                              selected &&
                                styles.wardNameSelected,
                              disabled &&
                                styles.wardNameDisabled,
                            ]}
                          >
                            {ward.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View
                style={styles.coverageSummary}
              >
                <Text
                  style={styles.summaryTitle}
                >
                  ASSIGNMENT PREVIEW
                </Text>

                <Text
                  style={styles.summaryPath}
                >
                  {selectedCounty?.name ||
                    'County'}
                  {'  ›  '}
                  {selectedConstituency?.name ||
                    'Constituency'}
                </Text>

                <View
                  style={styles.summaryWards}
                >
                  {selectedWards.length ===
                  0 ? (
                    <Text
                      style={
                        styles.summaryEmpty
                      }
                    >
                      No wards selected
                    </Text>
                  ) : (
                    selectedWards.map(
                      (ward) => (
                        <View
                          key={ward.id}
                          style={
                            styles.summaryWard
                          }
                        >
                          <Text
                            style={
                              styles.summaryWardText
                            }
                          >
                            {ward.name}
                          </Text>
                        </View>
                      )
                    )
                  )}
                </View>
              </View>
            </Section>

            <Section
              number="04"
              title="Internal Notes"
              description="Optional information visible to administrators."
            >
              <Field
                label="ADMIN NOTES"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add internal notes about this marketer..."
                multiline
                numberOfLines={5}
                editable={!saving}
              />
            </Section>

            <View style={styles.bottomActions}>
              <Pressable
                disabled={saving}
                onPress={() =>
                  router.replace(
                    '/admin/marketers'
                  )
                }
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.buttonPressed,
                    saving &&
                      styles.disabled,
                ]}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={!canSubmit}
                onPress={handleCreate}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed &&
                    styles.buttonPressed,
                  !canSubmit &&
                    styles.createButtonDisabled,
                ]}
              >
                {saving ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#0B0F10"
                    />

                    <Text
                      style={
                        styles.createButtonText
                      }
                    >
                      Creating...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    Create Marketer
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={[styles.sideColumn, compactLayout && styles.sideColumnCompact]}>
            <View style={styles.previewCard}>
              <Text style={styles.previewEyebrow}>
                ACCOUNT PREVIEW
              </Text>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName
                    ? firstName
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                    : 'M'}
                  {lastName
                    ? lastName
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                    : ''}
                </Text>
              </View>

              <Text style={styles.previewName}>
                {fullName || 'New Marketer'}
              </Text>

              <Text style={styles.previewEmail}>
                {email ||
                  'marketer@example.com'}
              </Text>

              <View
                style={styles.previewPending}
              >
                <View
                  style={styles.pendingDotSmall}
                />

                <Text
                  style={
                    styles.previewPendingText
                  }
                >
                  PENDING APPROVAL
                </Text>
              </View>

              <View style={styles.previewDivider} />

              <PreviewRow
                label="County"
                value={
                  selectedCounty?.name ||
                  'Not assigned'
                }
              />

              <PreviewRow
                label="Constituency"
                value={
                  selectedConstituency?.name ||
                  'Not assigned'
                }
              />

              <PreviewRow
                label="Wards"
                value={
                  selectedWards.length > 0
                    ? selectedWards
                        .map(
                          (ward) => ward.name
                        )
                        .join(', ')
                    : 'Not assigned'
                }
              />
            </View>

            <View style={styles.workflowCard}>
              <Text style={styles.workflowTitle}>
                MARKETER WORKFLOW
              </Text>

              <WorkflowStep
                number="1"
                title="Create"
                description="Admin creates the marketer account and coverage."
                active
              />

              <WorkflowStep
                number="2"
                title="Pending Approval"
                description="Account remains inactive until reviewed."
              />

              <WorkflowStep
                number="3"
                title="Approve"
                description="Admin activates the marketer account."
              />

              <WorkflowStep
                number="4"
                title="Manage Properties"
                description="Approved marketer manages properties within assigned wards."
              />
            </View>

            <View style={styles.securityCard}>
              <Text style={styles.securityIcon}>
                🔐
              </Text>

              <View style={styles.securityCopy}>
                <Text
                  style={styles.securityTitle}
                >
                  Secure account creation
                </Text>

                <Text
                  style={styles.securityText}
                >
                  The password is processed by the
                  backend and stored securely as a
                  hash.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text
            style={styles.sectionNumberText}
          >
            {number}
          </Text>
        </View>

        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text
            style={styles.sectionDescription}
          >
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.sectionBody}>
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
  secureTextEntry,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: React.ComponentProps<
    typeof TextInput
  >['keyboardType'];
  autoCapitalize?: React.ComponentProps<
    typeof TextInput
  >['autoCapitalize'];
  autoCorrect?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#687274"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
          !editable &&
            styles.inputDisabled,
        ]}
      />
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewRowLabel}>
        {label}
      </Text>

      <Text
        style={styles.previewRowValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function WorkflowStep({
  number,
  title,
  description,
  active,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <View style={styles.workflowStep}>
      <View
        style={[
          styles.workflowNumber,
          active &&
            styles.workflowNumberActive,
        ]}
      >
        <Text
          style={[
            styles.workflowNumberText,
            active &&
              styles.workflowNumberTextActive,
          ]}
        >
          {number}
        </Text>
      </View>

      <View style={styles.workflowCopy}>
        <Text style={styles.workflowStepTitle}>
          {title}
        </Text>

        <Text
          style={styles.workflowStepDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080B0C',
  },

  page: {
    width: '100%',
    maxWidth: 1500,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 26,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 34,
    marginTop: -4,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 7,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  subtitle: {
    color: '#9CA5A7',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 720,
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#241719',
    borderWidth: 1,
    borderColor: '#593235',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  errorIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  errorIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  errorText: {
    flex: 1,
    color: '#FFD9D9',
    fontSize: 13,
    lineHeight: 19,
  },

  layout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 22,
  },

  layoutCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  mainColumn: {
    flex: 1,
    minWidth: 0,
  },

    mainColumnCompact: {
      width: '100%',
    },

  sideColumn: {
    width: 330,
    gap: 18,
  },

    sideColumnCompact: {
      width: '100%',
    },

  section: {
    backgroundColor: '#121718',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'visible',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#252C2E',
  },

  sectionNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1A2122',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  sectionNumberText: {
    color: '#D7FF5F',
    fontSize: 12,
    fontWeight: '900',
  },

  sectionHeaderCopy: {
    flex: 1,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  sectionDescription: {
    color: '#7F898B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  sectionBody: {
    padding: 20,
  },

  fieldGrid: {
    flexDirection: 'row',
    gap: 14,
  },

  fieldGridCompact: {
    flexDirection: 'column',
    gap: 0,
  },

  field: {
    flex: 1,
    marginBottom: 17,
    minWidth: 0,
  },

  fieldLabel: {
    color: '#8F999B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  input: {
    minHeight: 50,
    backgroundColor: '#181E20',
    borderWidth: 1,
    borderColor: '#2A3234',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },

  multilineInput: {
    minHeight: 120,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  inputDisabled: {
    opacity: 0.6,
  },

  passwordHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#101516',
    borderRadius: 12,
    padding: 12,
    marginTop: -2,
  },

  passwordHintIcon: {
    fontSize: 14,
    marginRight: 9,
  },

  passwordHintText: {
    flex: 1,
    color: '#818B8D',
    fontSize: 11,
    lineHeight: 17,
  },

  coverageRule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B1C',
    borderWidth: 1,
    borderColor: '#293132',
    borderRadius: 13,
    padding: 13,
    marginBottom: 19,
  },

  coverageRuleIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  coverageRuleIconText: {
    color: '#0B0F10',
    fontWeight: '900',
  },

  coverageRuleCopy: {
    flex: 1,
  },

  coverageRuleTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  coverageRuleText: {
    color: '#8B9597',
    fontSize: 11,
    marginTop: 3,
  },

  select: {
    minHeight: 50,
    backgroundColor: '#181E20',
    borderWidth: 1,
    borderColor: '#2A3234',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectPressed: {
    borderColor: '#D7FF5F',
  },

  selectText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },

  placeholderText: {
    color: '#687274',
  },

  chevron: {
    color: '#A5AFB1',
    fontSize: 19,
    marginLeft: 10,
  },

  disabled: {
    opacity: 0.5,
  },

  optionsContainer: {
    backgroundColor: '#181E20',
    borderWidth: 1,
    borderColor: '#313A3C',
    borderRadius: 12,
    marginTop: 7,
    overflow: 'hidden',
    maxHeight: 245,
  },

  optionsScroll: {
    maxHeight: 245,
  },

  option: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#252C2E',
  },

  optionActive: {
    backgroundColor: '#20282A',
  },

  optionText: {
    flex: 1,
    color: '#B7C0C2',
    fontSize: 13,
  },

  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  check: {
    color: '#D7FF5F',
    fontSize: 17,
    fontWeight: '900',
    marginLeft: 10,
  },

  wardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  wardCounter: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },

  wardList: {
    gap: 8,
  },

  wardOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181E20',
    borderWidth: 1,
    borderColor: '#2A3234',
    borderRadius: 12,
    paddingHorizontal: 13,
  },

  wardOptionSelected: {
    backgroundColor: '#20282A',
    borderColor: '#D7FF5F',
  },

  wardOptionDisabled: {
    opacity: 0.4,
  },

  wardPressed: {
    opacity: 0.75,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#465052',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  checkboxSelected: {
    backgroundColor: '#D7FF5F',
    borderColor: '#D7FF5F',
  },

  checkboxText: {
    color: '#0B0F10',
    fontSize: 14,
    fontWeight: '900',
  },

  wardName: {
    flex: 1,
    color: '#B9C2C4',
    fontSize: 13,
  },

  wardNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  wardNameDisabled: {
    color: '#5E6769',
  },

  emptySelection: {
    backgroundColor: '#101516',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 12,
    padding: 16,
  },

  emptySelectionText: {
    color: '#737D7F',
    fontSize: 12,
    lineHeight: 18,
  },

  loadingBox: {
    minHeight: 52,
    backgroundColor: '#101516',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  loadingText: {
    color: '#8A9496',
    fontSize: 12,
    marginLeft: 10,
  },

  coverageSummary: {
    backgroundColor: '#101516',
    borderWidth: 1,
    borderColor: '#293234',
    borderRadius: 13,
    padding: 14,
    marginTop: 2,
  },

  summaryTitle: {
    color: '#707A7C',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  summaryPath: {
    color: '#D8DEDF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },

  summaryWards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },

  summaryEmpty: {
    color: '#606A6C',
    fontSize: 11,
  },

  summaryWard: {
    backgroundColor: '#20282A',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  summaryWardText: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '700',
  },

  previewCard: {
    backgroundColor: '#121718',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 18,
    padding: 20,
  },

  previewEyebrow: {
    color: '#707A7C',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
    marginBottom: 12,
  },

  avatarText: {
    color: '#0B0F10',
    fontSize: 21,
    fontWeight: '900',
  },

  previewName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  previewEmail: {
    color: '#788284',
    fontSize: 11,
    marginTop: 4,
  },

  previewPending: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24251A',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginTop: 13,
  },

  pendingDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC857',
    marginRight: 7,
  },

  previewPendingText: {
    color: '#D9C478',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  previewDivider: {
    height: 1,
    backgroundColor: '#252C2E',
    marginVertical: 18,
  },

  previewRow: {
    marginBottom: 14,
  },

  previewRowLabel: {
    color: '#687274',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  previewRowValue: {
    color: '#DCE1E2',
    fontSize: 12,
    lineHeight: 17,
  },

  workflowCard: {
    backgroundColor: '#121718',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 18,
    padding: 20,
  },

  workflowTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 18,
  },

  workflowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 17,
  },

  workflowNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: '#1A2122',
    borderWidth: 1,
    borderColor: '#30393B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  workflowNumberActive: {
    backgroundColor: '#D7FF5F',
    borderColor: '#D7FF5F',
  },

  workflowNumberText: {
    color: '#899294',
    fontSize: 11,
    fontWeight: '900',
  },

  workflowNumberTextActive: {
    color: '#0B0F10',
  },

  workflowCopy: {
    flex: 1,
  },

  workflowStepTitle: {
    color: '#E4E8E9',
    fontSize: 12,
    fontWeight: '800',
  },

  workflowStepDescription: {
    color: '#727C7E',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#101516',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 16,
    padding: 15,
  },

  securityIcon: {
    fontSize: 19,
    marginRight: 10,
  },

  securityCopy: {
    flex: 1,
  },

  securityTitle: {
    color: '#D8DEDF',
    fontSize: 11,
    fontWeight: '800',
  },

  securityText: {
    color: '#687274',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 2,
  },

  cancelButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30383A',
    backgroundColor: '#121718',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#AAB3B5',
    fontSize: 13,
    fontWeight: '700',
  },

  createButton: {
    minHeight: 50,
    paddingHorizontal: 23,
    borderRadius: 12,
    backgroundColor: '#D7FF5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  createButtonDisabled: {
    opacity: 0.35,
  },

  createButtonText: {
    color: '#0B0F10',
    fontSize: 13,
    fontWeight: '900',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  successContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 70,
  },

  successIcon: {
    width: 74,
    height: 74,
    borderRadius: 25,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },

  successIconText: {
    color: '#0B0F10',
    fontSize: 35,
    fontWeight: '900',
  },

  successTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    textAlign: 'center',
  },

  successSubtitle: {
    color: '#8E989A',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 540,
    alignSelf: 'center',
    marginTop: 9,
    marginBottom: 25,
  },

  successCard: {
    backgroundColor: '#121718',
    borderWidth: 1,
    borderColor: '#252C2E',
    borderRadius: 18,
    padding: 20,
  },

  successStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  successLabel: {
    color: '#687274',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  pendingStatus: {
    color: '#FFC857',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFC857',
  },

  divider: {
    height: 1,
    backgroundColor: '#252C2E',
    marginVertical: 18,
  },

  infoRow: {
    marginBottom: 15,
  },

  infoLabel: {
    color: '#687274',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 5,
  },

  infoValue: {
    color: '#E2E7E8',
    fontSize: 13,
    lineHeight: 18,
  },

  infoBlock: {
    marginBottom: 4,
  },

  wardSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },

  noticeCard: {
    backgroundColor: '#141B1C',
    borderWidth: 1,
    borderColor: '#293234',
    borderRadius: 16,
    padding: 17,
    marginTop: 15,
  },

  noticeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
  },

  noticeText: {
    color: '#818B8D',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 3,
  },

  successActions: {
    gap: 10,
    marginTop: 18,
  },

  primaryButton: {
    minHeight: 51,
    borderRadius: 12,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#0B0F10',
    fontSize: 13,
    fontWeight: '900',
  },

  secondaryButton: {
    minHeight: 51,
    borderRadius: 12,
    backgroundColor: '#121718',
    borderWidth: 1,
    borderColor: '#30383A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#D7FF5F',
    fontSize: 13,
    fontWeight: '800',
  },
});
