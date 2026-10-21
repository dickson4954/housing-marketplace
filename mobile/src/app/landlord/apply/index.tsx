import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileImage,
  ShieldCheck,
  Upload,
} from 'lucide-react-native';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

type CountyOption = {
  id: string;
  name: string;
};

type IdImage = {
  uri: string;
  name: string;
  type: string;
};

type ChoiceProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: ChoiceProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.choiceWrap}>
        {options.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.choice,
                selected && styles.choiceSelected,
              ]}
            >
              {selected ? (
                <Check
                  size={14}
                  color="#101410"
                  strokeWidth={3}
                />
              ) : null}

              <Text
                style={[
                  styles.choiceText,
                  selected && styles.choiceTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function LandlordSignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [idFront, setIdFront] = useState<IdImage | null>(null);
  const [idBack, setIdBack] = useState<IdImage | null>(null);

  const [ownership, setOwnership] = useState('Property owner');
  const [propertyCount, setPropertyCount] = useState('1 property');
  const [propertyType, setPropertyType] = useState('Long-stay rentals');
  const [selectedPropertyCountyIds, setSelectedPropertyCountyIds] =
    useState<string[]>([]);
  const [counties, setCounties] = useState<CountyOption[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(true);
  const [countyLoadError, setCountyLoadError] = useState('');
  const [countyRetry, setCountyRetry] = useState(0);
  const [countyExpansionIntent, setCountyExpansionIntent] = useState(
    'Still deciding',
  );
  const [listingIntent, setListingIntent] = useState(
    'I want to list gradually',
  );
  const [propertyAvailability, setPropertyAvailability] =
    useState('Available now');
  const [viewingFeePreference, setViewingFeePreference] =
    useState('Open to discussing');
  const [servicePreference, setServicePreference] =
    useState('Viewing coordination');
  const [listingPackageBudgetKsh, setListingPackageBudgetKsh] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCounties = async () => {
      setCountiesLoading(true);
      setCountyLoadError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.geographyCounties}`,
          { headers: { Accept: 'application/json' } },
        );

        const payload = await response.json();
        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || 'Unable to load counties.',
          );
        }

        const rows = payload?.data?.counties;
        if (!Array.isArray(rows)) {
          throw new Error('The county response was not in the expected format.');
        }

        const validCounties: CountyOption[] = rows
          .filter(
            (item: any) =>
              typeof item?.id === 'string' &&
              typeof item?.name === 'string',
          )
          .map((item: any) => ({ id: item.id, name: item.name }));

        if (!cancelled) {
          setCounties(validCounties);
        }
      } catch (error) {
        if (!cancelled) {
          setCountyLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load counties. Please try again.',
          );
        }
      } finally {
        if (!cancelled) setCountiesLoading(false);
      }
    };

    void loadCounties();
    return () => {
      cancelled = true;
    };
  }, [countyRetry]);

  const togglePropertyCounty = (countyId: string) => {
    setSelectedPropertyCountyIds((current) =>
      current.includes(countyId)
        ? current.filter((id) => id !== countyId)
        : [...current, countyId],
    );
  };

  const pickIdImage = async (
    side: 'front' | 'back',
  ) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo-library access so you can select a clear image of your national ID.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const extension =
        mimeType === 'image/png'
          ? 'png'
          : mimeType === 'image/webp'
            ? 'webp'
            : 'jpg';

      const image: IdImage = {
        uri: asset.uri,
        name: `national-id-${side}.${extension}`,
        type: mimeType,
      };

      if (side === 'front') {
        setIdFront(image);
      } else {
        setIdBack(image);
      }
    } catch {
      Alert.alert(
        'Unable to select image',
        'Please try selecting the ID image again.',
      );
    }
  };

  const validateForm = () => {
    if (firstName.trim().length < 2) {
      Alert.alert('Check your details', 'Enter your first name.');
      return false;
    }

    if (lastName.trim().length < 2) {
      Alert.alert('Check your details', 'Enter your last name.');
      return false;
    }

    if (!email.trim().includes('@')) {
      Alert.alert('Check your details', 'Enter a valid email address.');
      return false;
    }

    if (phone.trim().length < 9) {
      Alert.alert(
        'Check your details',
        'Enter a valid phone number.',
      );
      return false;
    }

    if (
      nationalIdNumber.trim().length < 5 ||
      nationalIdNumber.trim().length > 30
    ) {
      Alert.alert(
        'Check your details',
        'Enter a valid national ID number.',
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Your password must contain at least 6 characters.',
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please enter the same password in both fields.',
      );
      return false;
    }

    if (!idFront || !idBack) {
      Alert.alert(
        'National ID required',
        'Please upload clear images of both the front and back of your national ID.',
      );
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (submitting || !validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('phone', phone.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('nationalIdNumber', nationalIdNumber.trim());

      formData.append(
        'questionnaire',
        JSON.stringify({
          ownership,
          propertyCount,
          propertyCounties: counties
            .filter((county) =>
              selectedPropertyCountyIds.includes(county.id),
            )
            .map(({ id, name }) => ({ id, name })),
          propertyCountyCount: selectedPropertyCountyIds.length || null,
          countyExpansionIntent,
          listingIntent,
          propertyType,
          propertyAvailability,
          viewingFeePreference,
          servicePreference,
          listingPackageBudgetKsh: listingPackageBudgetKsh.trim() || null,
          additionalDetails: additionalDetails.trim(),
        }),
      );

      formData.append('idFront', {
        uri: idFront!.uri,
        name: idFront!.name,
        type: idFront!.type,
      } as any);

      formData.append('idBack', {
        uri: idBack!.uri,
        name: idBack!.name,
        type: idBack!.type,
      } as any);

      const response = await fetch(
        `${API_BASE_URL}/auth/landlord/signup`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to create your landlord account.',
        );
      }

      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Please check your connection and try again.';

      Alert.alert('Registration unsuccessful', message);
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep = () => {
    if (step === 0) {
      if (firstName.trim().length < 2) {
        Alert.alert('Check your details', 'Enter your first name.');
        return false;
      }
      if (lastName.trim().length < 2) {
        Alert.alert('Check your details', 'Enter your last name.');
        return false;
      }
      if (!email.trim().includes('@')) {
        Alert.alert('Check your details', 'Enter a valid email address.');
        return false;
      }
      if (phone.trim().length < 9) {
        Alert.alert('Check your details', 'Enter a valid phone number.');
        return false;
      }
      if (password.length < 6) {
        Alert.alert('Password too short', 'Your password must contain at least 6 characters.');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Passwords do not match', 'Please enter the same password in both fields.');
        return false;
      }
    }

    if (step === 1) {
      if (
        nationalIdNumber.trim().length < 5 ||
        nationalIdNumber.trim().length > 30
      ) {
        Alert.alert('Check your details', 'Enter a valid national ID number.');
        return false;
      }
      if (!idFront || !idBack) {
        Alert.alert(
          'National ID required',
          'Please upload clear images of both the front and back of your national ID.',
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    void handleSignup();
  };

  const handleStepBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((current) => current - 1);
  };

  const renderImageUpload = (
    side: 'front' | 'back',
    image: IdImage | null,
  ) => (
    <Pressable
      onPress={() => pickIdImage(side)}
      style={({ pressed }) => [
        styles.uploadCard,
        image && styles.uploadCardComplete,
        pressed && styles.pressed,
      ]}
    >
      {image ? (
        <Image
          source={{ uri: image.uri }}
          style={styles.idPreview}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.uploadIcon}>
          <FileImage size={25} color="#D7FF5F" />
        </View>
      )}

      <View style={styles.uploadTextWrap}>
        <Text style={styles.uploadTitle}>
          {side === 'front' ? 'Front of national ID' : 'Back of national ID'}
        </Text>
        <Text style={styles.uploadSubtitle}>
          {image ? 'Image selected · Tap to change' : 'Choose a clear image'}
        </Text>
      </View>

      <View style={styles.uploadAction}>
        {image ? (
          <Check size={18} color="#D7FF5F" />
        ) : (
          <Upload size={18} color="#D7FF5F" />
        )}
      </View>
    </Pressable>
  );

  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.successSafeArea}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <ShieldCheck size={43} color="#D7FF5F" />
            </View>

            <Text style={styles.eyebrow}>APPLICATION RECEIVED</Text>
            <Text style={styles.successTitle}>
              Thank you for choosing{'\n'}
              <Text style={styles.accent}>Makazii.</Text>
            </Text>

            <Text style={styles.successDescription}>
              Your landlord account has been created. Our team must review
              your application and verify your national ID before your
              landlord application can be approved.
            </Text>

            <View style={styles.pendingCard}>
              <View style={styles.pendingRow}>
                <View style={styles.pendingDot} />
                <View style={styles.pendingTextWrap}>
                  <Text style={styles.pendingTitle}>
                    Landlord application
                  </Text>
                  <Text style={styles.pendingSubtitle}>
                    Pending admin review
                  </Text>
                </View>
              </View>

              <View style={styles.pendingDivider} />

              <View style={styles.pendingRow}>
                <View style={styles.pendingDot} />
                <View style={styles.pendingTextWrap}>
                  <Text style={styles.pendingTitle}>
                    Identity verification
                  </Text>
                  <Text style={styles.pendingSubtitle}>
                    National ID awaiting verification
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.privacyNote}>
              Your ID images are submitted for verification and are not
              displayed as public property images.
            </Text>

            <Pressable
              onPress={() => router.replace('/landlord/login' as any)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Continue to landlord login
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Pressable
              onPress={handleStepBack}
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={21} color="#FFFFFF" />
            </Pressable>

            <View style={styles.headerBrand}>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>FIND YOUR PLACE</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>


          <View style={styles.progressArea}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((step + 1) / 5) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.stepLabels}>
              {['Personal', 'Identity', 'Property', 'Preferences', 'Review'].map(
                (label, index) => (
                  <Text
                    key={label}
                    style={[
                      styles.stepLabel,
                      index === step && styles.stepLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                ),
              )}
            </View>
            <Text style={styles.stepCaption}>STEP {step + 1} OF 5</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {step === 0 && (
              <>
            <Text style={styles.eyebrow}>LANDLORD REGISTRATION</Text>
            <Text style={styles.title}>
              Put your property{'\n'}in the right hands.
            </Text>
            <Text style={styles.description}>
              Create your account and tell us about your property. Our team
              reviews your application and identity before approval.
            </Text>

            <View style={styles.infoBanner}>
              <ShieldCheck size={21} color="#D7FF5F" />
              <Text style={styles.infoText}>
                Your ID documents are securely submitted for verification.
                They are not public listing images.
              </Text>
            </View>

            <SectionTitle number="01" title="Your details" />

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Field
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Field
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 07XX XXX XXX"
              keyboardType="phone-pad"
            />

            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="National ID number"
              value={nationalIdNumber}
              onChangeText={setNationalIdNumber}
              placeholder="Enter your ID number"
              autoCapitalize="characters"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
            />

            <Field
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter your password again"
              secureTextEntry
              autoCapitalize="none"
            />

            
              </>
            )}

            {step === 1 && (
              <>
<SectionTitle number="02" title="Identity verification" />

            <Text style={styles.sectionDescription}>
              Upload clear, readable images of both sides of your national ID.
              Both images are required to submit your application.
            </Text>

            {renderImageUpload('front', idFront)}
            {renderImageUpload('back', idBack)}

            
              </>
            )}

            {step === 2 && (
              <>
<SectionTitle number="03" title="About your property" />

            <Text style={styles.sectionDescription}>
              Your answers help us understand your needs and how Makazii can
              support you.
            </Text>

            <ChoiceGroup
              label="What best describes you?"
              options={[
                'Property owner',
                'Authorized agent',
                'Family representative',
              ]}
              value={ownership}
              onChange={setOwnership}
            />

            <ChoiceGroup
              label="How many properties do you currently manage or expect to list?"
              options={[
                '1 property',
                '2–5 properties',
                '6–20 properties',
                '21–50 properties',
                '50+ properties',
              ]}
              value={propertyCount}
              onChange={setPropertyCount}
            />

            <View style={styles.field}>
              <Text style={styles.label}>
                Which counties do you currently have properties in?
              </Text>
              <Text style={styles.countyHint}>
                Select all that apply. You can add properties in other counties later.
              </Text>

              {countiesLoading ? (
                <View style={styles.countyMessage}>
                  <ActivityIndicator color="#D7FF5F" />
                  <Text style={styles.countyMessageText}>
                    Loading counties...
                  </Text>
                </View>
              ) : countyLoadError ? (
                <View style={styles.countyErrorBox}>
                  <Text style={styles.countyErrorText}>
                    {countyLoadError}
                  </Text>
                  <Pressable
                    onPress={() => setCountyRetry((value) => value + 1)}
                    style={styles.countyRetryButton}
                  >
                    <Text style={styles.countyRetryText}>Try again</Text>
                  </Pressable>
                </View>
              ) : counties.length === 0 ? (
                <Text style={styles.countyMessageText}>
                  No counties are available yet. You can continue your application.
                </Text>
              ) : (
                <View style={styles.choiceWrap}>
                  {counties.map((county) => {
                    const selected = selectedPropertyCountyIds.includes(
                      county.id,
                    );
                    return (
                      <Pressable
                        key={county.id}
                        onPress={() => togglePropertyCounty(county.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        style={[
                          styles.countyChoice,
                          selected && styles.countyChoiceSelected,
                        ]}
                      >
                        {selected ? (
                          <Check size={14} color="#D7FF5F" strokeWidth={3} />
                        ) : null}
                        <Text
                          style={[
                            styles.countyChoiceText,
                            selected && styles.countyChoiceTextSelected,
                          ]}
                        >
                          {county.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Text style={styles.countySelectedCount}>
                {selectedPropertyCountyIds.length === 0
                  ? 'No counties selected (optional)'
                  : `${selectedPropertyCountyIds.length} ${selectedPropertyCountyIds.length === 1 ? 'county' : 'counties'} selected`}
              </Text>
            </View>

            <ChoiceGroup
              label="Do you plan to expand into other counties?"
              options={[
                'Yes, I plan to expand',
                'No, current counties only',
                'Still deciding',
              ]}
              value={countyExpansionIntent}
              onChange={setCountyExpansionIntent}
            />

            <ChoiceGroup
              label="How do you intend to list on MAKAZII?"
              options={[
                'I am ready to list now',
                'I want to list gradually',
                'I am still exploring',
              ]}
              value={listingIntent}
              onChange={setListingIntent}
            />

            <Text style={styles.countyHint}>
              These answers help us plan support. They do not limit how many
              properties you can submit or which counties you can use later.
            </Text>

            <ChoiceGroup
              label="What kind of property do you have?"
              options={[
                'Long-stay rentals',
                'Short-stay / BnB',
                'Both',
              ]}
              value={propertyType}
              onChange={setPropertyType}
            />

            <ChoiceGroup
              label="When will your property be available?"
              options={[
                'Available now',
                'Available soon',
                'Just exploring',
              ]}
              value={propertyAvailability}
              onChange={setPropertyAvailability}
            />

            
              </>
            )}

            {step === 3 && (
              <>
<SectionTitle number="04" title="Your preferences" />

            <Text style={styles.sectionDescription}>
              We have not fixed a single fee model here. Your answers help
              us understand which approach you would consider.
            </Text>

            <ChoiceGroup
              label="Would you consider a fee for a coordinated property viewing?"
              options={[
                'Yes',
                'No',
                'Open to discussing',
              ]}
              value={viewingFeePreference}
              onChange={setViewingFeePreference}
            />

            <ChoiceGroup
              label="Which service approach would you prefer?"
              options={[
                'Viewing coordination',
                'Listing package',
                'Discuss options with me',
              ]}
              value={servicePreference}
              onChange={setServicePreference}
            />

            <Field
              label="What amount would you consider for a listing package? (optional)"
              value={listingPackageBudgetKsh}
              onChangeText={setListingPackageBudgetKsh}
              placeholder="Enter an amount in KSh, e.g. 5000"
              keyboardType="numeric"
            />

            <Text style={styles.sectionDescription}>
              This is only to understand your budget preference. It is not
              an agreed price, payment request, or commitment to pay.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>
                Anything else we should know? (optional)
              </Text>
              <TextInput
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
                placeholder="Tell us what support you need..."
                placeholderTextColor="#687274"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
                maxLength={1000}
              />
            </View>

            
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.eyebrow}>FINAL STEP</Text>
                <Text style={styles.title}>Review your application.</Text>
                <Text style={styles.description}>
                  Check your details before submitting. Use Back if you need
                  to correct anything.
                </Text>

                <SectionTitle number="01" title="Personal details" />
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewLabel}>Full name</Text>
                  <Text style={styles.reviewValue}>
                    {[firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || 'Not entered'}
                  </Text>
                  <Text style={styles.reviewLabel}>Phone</Text>
                  <Text style={styles.reviewValue}>{phone || 'Not entered'}</Text>
                  <Text style={styles.reviewLabel}>Email</Text>
                  <Text style={styles.reviewValue}>{email || 'Not entered'}</Text>
                </View>

                <SectionTitle number="02" title="Identity verification" />
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewLabel}>National ID number</Text>
                  <Text style={styles.reviewValue}>
                    {nationalIdNumber || 'Not entered'}
                  </Text>
                  <Text style={styles.reviewLabel}>Front image</Text>
                  <Text style={styles.reviewValue}>
                    {idFront ? 'Selected' : 'Not selected'}
                  </Text>
                  <Text style={styles.reviewLabel}>Back image</Text>
                  <Text style={styles.reviewValue}>
                    {idBack ? 'Selected' : 'Not selected'}
                  </Text>
                </View>

                <SectionTitle number="03" title="Property details" />
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewLabel}>Ownership</Text>
                  <Text style={styles.reviewValue}>{ownership}</Text>
                  <Text style={styles.reviewLabel}>Property count</Text>
                  <Text style={styles.reviewValue}>{propertyCount}</Text>
                  <Text style={styles.reviewLabel}>Property counties</Text>
                  <Text style={styles.reviewValue}>
                    {counties
                      .filter((county) => selectedPropertyCountyIds.includes(county.id))
                      .map((county) => county.name)
                      .join(', ') || 'None selected'}
                  </Text>
                  <Text style={styles.reviewLabel}>Property type</Text>
                  <Text style={styles.reviewValue}>{propertyType}</Text>
                  <Text style={styles.reviewLabel}>Availability</Text>
                  <Text style={styles.reviewValue}>{propertyAvailability}</Text>
                  <Text style={styles.reviewLabel}>Listing plan</Text>
                  <Text style={styles.reviewValue}>{listingIntent}</Text>
                  <Text style={styles.reviewLabel}>Expansion plan</Text>
                  <Text style={styles.reviewValue}>{countyExpansionIntent}</Text>
                </View>

                <SectionTitle number="04" title="Listing preferences" />
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewLabel}>Viewing fee preference</Text>
                  <Text style={styles.reviewValue}>{viewingFeePreference}</Text>
                  <Text style={styles.reviewLabel}>Preferred service</Text>
                  <Text style={styles.reviewValue}>{servicePreference}</Text>
                  <Text style={styles.reviewLabel}>Listing budget</Text>
                  <Text style={styles.reviewValue}>
                    {listingPackageBudgetKsh.trim()
                      ? `KSh ${listingPackageBudgetKsh.trim()}`
                      : 'Not specified'}
                  </Text>
                  <Text style={styles.reviewLabel}>Additional details</Text>
                  <Text style={styles.reviewValue}>
                    {additionalDetails.trim() || 'None provided'}
                  </Text>
                </View>

<View style={styles.reviewNotice}>
              <Text style={styles.reviewNoticeTitle}>
                What happens next?
              </Text>
              <Text style={styles.reviewNoticeText}>
                1. Submit your details and ID images.
                {'\n'}2. Makazii reviews your application and identity separately.
                {'\n'}3. Once approved, you can proceed with property submission.
                {'\n'}4. Each submitted property is reviewed before it goes live.
              </Text>
            </View>

            
                <Text style={styles.termsNote}>
                  By submitting, you confirm that your details are accurate
                  and that you are authorized to submit this application.
                </Text>
              </>
            )}
          </ScrollView>

          <View style={styles.bottomBar}>
            {step > 0 ? (
              <Pressable
                onPress={handleStepBack}
                disabled={submitting}
                style={styles.secondaryButton}
              >
                <ArrowLeft size={18} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleNext}
              disabled={submitting}
              style={[
                styles.primaryButton,
                styles.nextButton,
                submitting && styles.buttonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#101410" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {step === 4 ? 'Submit Application' : 'Continue'}
                  </Text>
                  {step === 4 ? (
                    <Check size={19} color="#101410" />
                  ) : (
                    <ChevronDown
                      size={19}
                      color="#101410"
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    />
                  )}
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#687274"
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },
  safeArea: {
    flex: 1,
  },
  successSafeArea: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  keyboard: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#202729',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
  },
  headerBrand: {
    alignItems: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoSub: {
    color: '#7F898B',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginTop: 3,
  },
  progressArea: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 7,
    backgroundColor: '#0B0F10',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#252C2E',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#D7FF5F',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepLabel: {
    color: '#687274',
    fontSize: 9,
    fontWeight: '700',
  },
  stepLabelActive: {
    color: '#D7FF5F',
  },
  stepCaption: {
    color: '#9CA5A7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#0B0F10',
    borderTopWidth: 1,
    borderTopColor: '#252C2E',
  },
  secondaryButton: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#30383A',
    backgroundColor: '#14191B',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  nextButton: {
    flex: 1,
    marginTop: 0,
  },
  reviewCard: {
    padding: 15,
    marginBottom: 8,
    backgroundColor: '#14191B',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#252C2E',
  },
  reviewLabel: {
    color: '#9CA5A7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 9,
  },
  reviewValue: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 44,
  },
  eyebrow: {
    color: '#A9B28B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  accent: {
    color: '#D7FF5F',
  },
  description: {
    color: '#9CA5A7',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginTop: 20,
    marginBottom: 6,
    backgroundColor: '#14191B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#303A32',
  },
  infoText: {
    flex: 1,
    color: '#C0C8C9',
    fontSize: 11,
    lineHeight: 17,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 29,
    marginBottom: 17,
  },
  sectionNumber: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '900',
    backgroundColor: '#20291B',
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionDescription: {
    color: '#9CA5A7',
    fontSize: 12,
    lineHeight: 19,
    marginTop: -7,
    marginBottom: 16,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  field: {
    marginBottom: 17,
  },
  label: {
    color: '#D9DEDF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 51,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#2B3335',
    borderRadius: 13,
  },
  textArea: {
    minHeight: 105,
  },
  countyHint: {
    color: '#9CA5A7',
    fontSize: 11,
    lineHeight: 17,
    marginTop: -3,
    marginBottom: 11,
  },
  countyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  countyMessageText: {
    color: '#9CA5A7',
    fontSize: 12,
    lineHeight: 18,
  },
  countyErrorBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#241819',
    borderWidth: 1,
    borderColor: '#573536',
    gap: 10,
  },
  countyErrorText: {
    color: '#F0B9B9',
    fontSize: 12,
    lineHeight: 18,
  },
  countyRetryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#D7FF5F',
  },
  countyRetryText: {
    color: '#101410',
    fontSize: 12,
    fontWeight: '800',
  },
  countyChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#2B3335',
  },
  countyChoiceSelected: {
    borderColor: '#D7FF5F',
    backgroundColor: '#20291B',
  },
  countyChoiceText: {
    color: '#C0C8C9',
    fontSize: 12,
    fontWeight: '600',
  },
  countyChoiceTextSelected: {
    color: '#D7FF5F',
  },
  countySelectedCount: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 11,
  },
  uploadCard: {
    minHeight: 93,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 11,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#2B3335',
    borderRadius: 16,
  },
  uploadCardComplete: {
    borderColor: '#596C35',
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idPreview: {
    width: 76,
    height: 62,
    borderRadius: 9,
    backgroundColor: '#252C2E',
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  uploadSubtitle: {
    color: '#9CA5A7',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  uploadAction: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#2B3335',
    borderRadius: 12,
  },
  choiceSelected: {
    backgroundColor: '#D7FF5F',
    borderColor: '#D7FF5F',
  },
  choiceText: {
    color: '#C4CCCD',
    fontSize: 11,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: '#101410',
  },
  reviewNotice: {
    padding: 16,
    marginTop: 11,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#303A32',
    borderRadius: 16,
  },
  reviewNoticeTitle: {
    color: '#D7FF5F',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 9,
  },
  reviewNoticeText: {
    color: '#B5BFC0',
    fontSize: 11,
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 18,
    backgroundColor: '#D7FF5F',
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#101410',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  termsNote: {
    color: '#707A7C',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 13,
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20291B',
    borderWidth: 1,
    borderColor: '#3C4C2A',
    marginBottom: 26,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  successDescription: {
    color: '#A5AFB0',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 15,
  },
  pendingCard: {
    width: '100%',
    padding: 17,
    marginTop: 25,
    backgroundColor: '#14191B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2B3335',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D7FF5F',
  },
  pendingTextWrap: {
    flex: 1,
  },
  pendingTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pendingSubtitle: {
    color: '#9CA5A7',
    fontSize: 11,
    marginTop: 4,
  },
  pendingDivider: {
    height: 1,
    backgroundColor: '#2B3335',
    marginVertical: 16,
  },
  privacyNote: {
    color: '#7F898B',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 17,
  },
});
