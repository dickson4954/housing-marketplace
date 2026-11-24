import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  Truck,
  Wrench,
  Store,
  X,
} from 'lucide-react-native';

import {
  registerBusinessOwner,
  type BusinessIdImage,
  type BusinessLocationEvidenceUpload,
  type BusinessLocationInput,
  type FirstBusinessInput,
} from '@/lib/businessOwnerApi';

import BusinessLocationForm, {
  createInitialBusinessLocation,
  validateBusinessLocationForm,
} from '@/components/BusinessLocationForm';


import BusinessQuestionnaire, {
  CATEGORY_QUESTIONS,
  type BusinessCategory,
} from '@/components/BusinessQuestionnaire';
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

const STEPS = [
  'Personal',
  'Identity',
  'Category',
  'Business',
  'Premises',
  'Review',
];

type Category = BusinessCategory;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  nationalIdNumber: string;
  idFront: BusinessIdImage | null;
  idBack: BusinessIdImage | null;
  category: Category | '';
  businessName: string;
  description: string;
  suggestedCategory: string;
  answers: Record<string, string>;
  declaration: boolean;
};

const INITIAL: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  nationalIdNumber: '',
  idFront: null,
  idBack: null,
  category: '',
  businessName: '',
  description: '',
  suggestedCategory: '',
  answers: {},
  declaration: false,
};

const isBusinessCategory = (value?: string): value is Category =>
  value === 'SHOPPING' ||
  value === 'FOOD_HOSPITALITY' ||
  value === 'SERVICES' ||
  value === 'MOBILITY_DELIVERY' ||
  value === 'OTHER';

const CATEGORIES: {
  id: Category;
  title: string;
  description: string;
  icon: typeof ShoppingBag;
}[] = [
  {
    id: 'SHOPPING',
    title: 'Shopping & Retail',
    description: 'Shops, supermarkets, fashion, electronics and products.',
    icon: ShoppingBag,
  },
  {
    id: 'FOOD_HOSPITALITY',
    title: 'Food & Hospitality',
    description: 'Restaurants, cafés, caterers and food outlets.',
    icon: Utensils,
  },
  {
    id: 'SERVICES',
    title: 'Services',
    description: 'Beauty, salons, professional and other services.',
    icon: Wrench,
  },
  {
    id: 'MOBILITY_DELIVERY',
    title: 'Mobility & Delivery',
    description: 'Riders, transport, delivery and logistics.',
    icon: Truck,
  },
  {
    id: 'OTHER',
    title: 'Other business',
    description: 'A business that does not fit the categories above.',
    icon: Store,
  },
];


function Field({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#697477"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );
}

export default function BusinessRegisterScreen() {
  const params = useLocalSearchParams<{
    category?: string;
    specificBusinessType?: string;
  }>();

  const routeCategory = isBusinessCategory(params.category)
    ? params.category
    : '';

  const routeBusinessType =
    typeof params.specificBusinessType === 'string'
      ? params.specificBusinessType.trim()
      : '';

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(() => {
    const initialAnswers: Record<string, string> = routeBusinessType
      ? { specificBusinessType: routeBusinessType }
      : {};

    return {
      ...INITIAL,
      category: routeCategory,
      answers: initialAnswers,
    };
  });
  const [location, setLocation] = useState<BusinessLocationInput>(
    () => createInitialBusinessLocation(),
  );
  const [locationEvidence, setLocationEvidence] = useState<
    BusinessLocationEvidenceUpload[]
  >([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step],
  );

  const update = <K extends keyof FormData>(
    key: K,
    value: FormData[K],
  ) => {
    setData(current => ({ ...current, [key]: value }));
    setError('');
  };

  const updateAnswer = (key: string, value: string) => {
    setData(current => ({
      ...current,
      answers: {
        ...current.answers,
        [key]: value,
      },
    }));
    setError('');
  };

  const chooseImage = async (side: 'front' | 'back') => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Please allow photo library access to select your ID image.');
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.85,
          aspect: [4, 3],
        });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      const image: BusinessIdImage = {
        uri: asset.uri,
        name: asset.fileName || `national-id-${side}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        file: asset.file as Blob | undefined,
      };

      update(side === 'front' ? 'idFront' : 'idBack', image);
    } catch {
      setError('Unable to select the image. Please try again.');
    }
  };

  const takePicture = async (side: 'front' | 'back') => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setError('Please allow camera access to photograph your ID.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      update(
        side === 'front' ? 'idFront' : 'idBack',
        {
          uri: asset.uri,
          name: asset.fileName || `national-id-${side}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          file: asset.file as Blob | undefined,
        },
      );
    } catch {
      setError('Unable to capture the image. Please try again.');
    }
  };

  const selectIdImage = (side: 'front' | 'back') => {
    const title = side === 'front' ? 'Front of National ID' : 'Back of National ID';

    if (Platform.OS === 'web') {
      void chooseImage(side);
      return;
    }

    // Keep the selection actions simple and compatible with native devices.
    // The gallery is the default; the camera is also available below.
    void title;
    void chooseImage(side);
  };

  const validateStep = () => {
    if (step === 0) {
      if (
        data.firstName.trim().length < 2 ||
        data.lastName.trim().length < 2
      ) {
        return 'Enter your first and last name.';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        return 'Enter a valid email address.';
      }

      if (data.phone.trim().replace(/\D/g, '').length < 9) {
        return 'Enter a valid phone number.';
      }

      if (data.password.length < 8) {
        return 'Your password must contain at least 8 characters.';
      }

      if (data.password !== data.confirmPassword) {
        return 'Your password confirmation does not match.';
      }
    }

    if (step === 1) {
      if (data.nationalIdNumber.trim().length < 5) {
        return 'Enter a valid National ID number.';
      }

      if (!data.idFront || !data.idBack) {
        return 'Upload both the front and back of your National ID.';
      }
    }

    if (step === 2 && !data.category) {
      return 'Select the category that best describes your business.';
    }

    if (step === 3) {
      if (data.businessName.trim().length < 2) {
        return 'Enter your business name.';
      }

      if (data.businessName.trim().length > 150) {
        return 'Your business name must not exceed 150 characters.';
      }

      if (data.description.trim().length < 10) {
        return 'Please describe your business in at least 10 characters.';
      }

      if (
        data.category === 'OTHER' &&
        !data.suggestedCategory.trim()
      ) {
        return 'Suggest the category or industry closest to your business.';
      }

      const questions = CATEGORY_QUESTIONS[data.category as Category];

      const missing = questions.find(
        question => !data.answers[question.key]?.trim(),
      );

      if (missing) {
        return `Please complete: ${missing.label}`;
      }
    }

    if (step === 4) {
      return validateBusinessLocationForm(location, locationEvidence);
    }

    if (step === 5 && !data.declaration) {
      return 'Please confirm that the information you provided is accurate.';
    }

    return '';
  };

  const buildFirstBusiness = (): FirstBusinessInput => {
    const category = data.category as Category;

    const requestedModules: Record<Category, string[]> = {
      SHOPPING: [
        'PRODUCTS',
        'INVENTORY',
        'ORDERS',
        'PAYMENTS',
        'FULFILMENT',
        'CUSTOMERS',
        'REPORTS',
      ],
      FOOD_HOSPITALITY: [
        'MENU',
        'ORDERS',
        'PAYMENTS',
        'FULFILMENT',
        'CUSTOMERS',
        'REPORTS',
      ],
      SERVICES: [
        'SERVICES',
        'APPOINTMENTS',
        'PAYMENTS',
        'CUSTOMERS',
        'REPORTS',
      ],
      MOBILITY_DELIVERY: [
        'DELIVERY',
        'ORDERS',
        'PAYMENTS',
        'FLEET',
        'REPORTS',
      ],
      OTHER: [
        'BUSINESS_PROFILE',
        'PAYMENTS',
        'CUSTOMERS',
        'REPORTS',
      ],
    };

    const categoryLabel =
      CATEGORIES.find(item => item.id === category)?.title || 'Other business';

    return {
      name: data.businessName.trim(),
      category,
      categoryLabel,
      description: data.description.trim(),
      suggestedCategory:
        category === 'OTHER'
          ? data.suggestedCategory.trim()
          : undefined,
      operatingModel: {
        category,
        ...data.answers,
      },
      requestedModules: requestedModules[category],
      questionnaire: {
        category,
        businessName: data.businessName.trim(),
        description: data.description.trim(),
        specificBusinessType:
          data.answers.specificBusinessType || null,
        suggestedCategory: data.suggestedCategory.trim() || null,
        answers: data.answers,
      },
    };
  };

  const submit = async () => {
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const result = await registerBusinessOwner({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        nationalIdNumber: data.nationalIdNumber.trim(),
        idFront: data.idFront!,
        idBack: data.idBack!,
        firstBusiness: buildFirstBusiness(),
        location,
        locationEvidence,
      });

      if (result.verificationRequired) {
        router.replace({
          pathname: '/business/verify-email' as any,
          params: { email: data.email.trim().toLowerCase() },
        });
      } else {
        router.replace({
          pathname: '/business/login' as any,
          params: {
            email: data.email.trim().toLowerCase(),
            registered: '1',
          },
        });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'We could not submit your application. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    const validationError = validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    if (step < STEPS.length - 1) {
      setStep(current => current + 1);
    } else {
      void submit();
    }
  };

  const back = () => {
    setError('');

    if (step === 0) {
      router.back();
      return;
    }

    setStep(current => current - 1);
  };

  const selectedCategory = CATEGORIES.find(
    item => item.id === data.category,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={back} style={styles.backButton}>
            <ArrowLeft size={20} color={C.white} />
          </Pressable>

          <View style={styles.brandWrap}>
            <Text style={styles.brand}>MAKAZII</Text>
            <Text style={styles.brandLabel}>BUSINESS OWNER APPLICATION</Text>
          </View>

          <Text style={styles.stepCounter}>
            {step + 1}/{STEPS.length}
          </Text>
        </View>

        <View style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.stepLabels}>
            {STEPS.map((label, index) => (
              <Text
                key={label}
                style={[
                  styles.stepLabel,
                  index === step && styles.stepLabelActive,
                  index < step && styles.stepLabelComplete,
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <>
              <StepHeading
                eyebrow="01 / ACCOUNT"
                title="Let's get to know you."
                description="Create your business-owner application. If you already use MAKAZII as a customer, enter the same email and password so we can link your existing account."
                icon={<BriefcaseBusiness size={23} color={C.lime} />}
              />

              <View style={styles.notice}>
                <ShieldCheck size={19} color={C.lime} />
                <Text style={styles.noticeText}>
                  Existing customer? Your customer account and marketplace access will be preserved.
                </Text>
              </View>

              <Field
                label="First name"
                value={data.firstName}
                onChange={value => update('firstName', value)}
                placeholder="Your first name"
              />
              <Field
                label="Last name"
                value={data.lastName}
                onChange={value => update('lastName', value)}
                placeholder="Your last name"
              />
              <Field
                label="Email address"
                value={data.email}
                onChange={value => update('email', value)}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Phone number"
                value={data.phone}
                onChange={value => update('phone', value)}
                placeholder="e.g. 0712 345 678"
                keyboardType="phone-pad"
              />
              <Field
                label="Password"
                value={data.password}
                onChange={value => update('password', value)}
                placeholder="At least 8 characters"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
              />
              <Field
                label="Confirm password"
                value={data.confirmPassword}
                onChange={value => update('confirmPassword', value)}
                placeholder="Enter your password again"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() => setPasswordVisible(value => !value)}
                style={styles.inlineAction}
              >
                <Text style={styles.inlineActionText}>
                  {passwordVisible ? 'Hide passwords' : 'Show passwords'}
                </Text>
              </Pressable>
            </>
          )}

          {step === 1 && (
            <>
              <StepHeading
                eyebrow="02 / IDENTITY"
                title="Verify your identity."
                description="Your National ID details are submitted privately for MAKAZII administration review. They are not displayed on your public business profile."
                icon={<ShieldCheck size={23} color={C.lime} />}
              />

              <View style={styles.privacyCard}>
                <ShieldCheck size={21} color={C.lime} />
                <View style={styles.flex}>
                  <Text style={styles.privacyTitle}>Private identity documents</Text>
                  <Text style={styles.privacyText}>
                    Your ID images are uploaded to restricted storage for authorised verification.
                  </Text>
                </View>
              </View>

              <Field
                label="National ID number"
                value={data.nationalIdNumber}
                onChange={value => update('nationalIdNumber', value)}
                placeholder="Enter your National ID number"
                autoCapitalize="none"
              />

              <IdUploadCard
                title="Front of National ID"
                image={data.idFront}
                onGallery={() => selectIdImage('front')}
                onCamera={() => takePicture('front')}
                onRemove={() => update('idFront', null)}
              />

              <IdUploadCard
                title="Back of National ID"
                image={data.idBack}
                onGallery={() => selectIdImage('back')}
                onCamera={() => takePicture('back')}
                onRemove={() => update('idBack', null)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <StepHeading
                eyebrow="03 / MARKETPLACE DIVISION"
                title="What kind of business do you run?"
                description="Choose the closest division. Your business will be reviewed separately, and its workspace will be configured for its activities."
                icon={<Store size={23} color={C.lime} />}
              />

              <View style={styles.categoryList}>
                {CATEGORIES.map(item => {
                  const Icon = item.icon;
                  const active = data.category === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setData(current => ({
                          ...current,
                          category: item.id,
                          answers: {},
                          suggestedCategory: '',
                        }));
                        setError('');
                      }}
                      style={[
                        styles.categoryCard,
                        active && styles.categoryCardActive,
                      ]}
                    >
                      <View style={[
                        styles.categoryIcon,
                        active && styles.categoryIconActive,
                      ]}>
                        <Icon
                          size={23}
                          color={active ? C.background : C.lime}
                        />
                      </View>

                      <View style={styles.categoryCopy}>
                        <Text style={styles.categoryTitle}>{item.title}</Text>
                        <Text style={styles.categoryDescription}>
                          {item.description}
                        </Text>
                      </View>

                      <View style={[
                        styles.radioOuter,
                        active && styles.radioOuterActive,
                      ]}>
                        {active && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.helperText}>
                Real Estate landlord and marketer applications remain available through their dedicated registration paths.
              </Text>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeading
                eyebrow="04 / BUSINESS PROFILE"
                title="Tell us about your business."
                description="These details help us understand what you offer and prepare the right business tools."
                icon={<BriefcaseBusiness size={23} color={C.lime} />}
              />

              {selectedCategory && (
                <View style={styles.selectedCategory}>
                  <Text style={styles.selectedCategoryLabel}>SELECTED DIVISION</Text>
                  <Text style={styles.selectedCategoryTitle}>
                    {selectedCategory.title}
                  </Text>
                  {data.answers.specificBusinessType ? (
                    <>
                      <Text style={[styles.selectedCategoryLabel, { marginTop: 12 }]}>
                        BUSINESS TYPE
                      </Text>
                      <Text style={styles.selectedCategoryTitle}>
                        {data.answers.specificBusinessType}
                      </Text>
                    </>
                  ) : null}
                </View>
              )}

              <Field
                label="Business or trading name"
                value={data.businessName}
                onChange={value => update('businessName', value)}
                placeholder="Enter your business name"
              />

              <Field
                label="Business description"
                value={data.description}
                onChange={value => update('description', value)}
                placeholder="What does your business do? What do you offer?"
                multiline
              />

              {data.category === 'OTHER' && (
                <Field
                  label="Suggested business category"
                  value={data.suggestedCategory}
                  onChange={value => update('suggestedCategory', value)}
                  placeholder="Suggest the closest industry or category"
                />
              )}

              <Text style={styles.sectionLabel}>BUSINESS QUESTIONS</Text>

              {data.category ? (
                  <BusinessQuestionnaire
                    category={data.category}
                    answers={data.answers}
                    onAnswerChange={updateAnswer}
                  />
                ) : null}
            </>
          )}

          {step === 4 && (
            <>
              <StepHeading
                eyebrow="05 / OPERATING PREMISES"
                title="Where does your business operate?"
                description="Tell us where the business actually operates and provide evidence for verification."
                icon={<Store size={23} color={C.lime} />}
              />

              <BusinessLocationForm
                value={location}
                onChange={setLocation}
                evidence={locationEvidence}
                onEvidenceChange={setLocationEvidence}
              />
            </>
          )}

          {step === 5 && (
            <>
              <StepHeading
                eyebrow="06 / FINAL REVIEW"
                title="Review your application."
                description="Check your details before submitting. Your owner application and first business application will be submitted together."
                icon={<CheckCircle2 size={23} color={C.lime} />}
              />

              <ReviewSection title="PERSONAL DETAILS">
                <ReviewRow label="Applicant" value={`${data.firstName} ${data.lastName}`} />
                <ReviewRow label="Email" value={data.email} />
                <ReviewRow label="Phone" value={data.phone} />
                <ReviewRow label="National ID" value={`•••• ${data.nationalIdNumber.slice(-4)}`} />
                <ReviewRow label="ID images" value="Front and back attached" />
              </ReviewSection>

              <ReviewSection title="BUSINESS APPLICATION">
                <ReviewRow label="Division" value={selectedCategory?.title || ''} />
                {data.answers.specificBusinessType ? (
                  <ReviewRow
                    label="Business type"
                    value={data.answers.specificBusinessType}
                  />
                ) : null}
                <ReviewRow label="Business name" value={data.businessName} />
                <ReviewRow label="Description" value={data.description} />
                {data.category === 'OTHER' && (
                  <ReviewRow label="Suggested category" value={data.suggestedCategory} />
                )}
                {data.category &&
                  CATEGORY_QUESTIONS[data.category].map(question => (
                    <ReviewRow
                      key={question.key}
                      label={question.label}
                      value={data.answers[question.key] || ''}
                    />
                  ))}
              </ReviewSection>

              <ReviewSection title="PRIMARY OPERATING LOCATION">
                <ReviewRow label="Location name" value={location.name} />
                <ReviewRow
                  label="Operating arrangement"
                  value={location.locationType.replace(/_/g, ' ')}
                />
                <ReviewRow label="Town / locality" value={location.locality} />
                {location.street ? (
                  <ReviewRow label="Street" value={location.street} />
                ) : null}
                {location.building ? (
                  <ReviewRow label="Building" value={location.building} />
                ) : null}
                {location.unit ? (
                  <ReviewRow label="Shop / unit" value={location.unit} />
                ) : null}
                <ReviewRow
                  label="Evidence images"
                  value={`${locationEvidence.length} attached`}
                />
                <ReviewRow
                  label="Public discovery"
                  value={location.isPubliclyDiscoverable ? 'Opted in' : 'Not enabled'}
                />
              </ReviewSection>

              <View style={styles.reviewNotice}>
                <ShieldCheck size={21} color={C.lime} />
                <Text style={styles.reviewNoticeText}>
                  Your owner application and identity verification are reviewed independently from approval of each business. Operational tools unlock only after the required approvals.
                </Text>
              </View>

              <Pressable
                onPress={() => update('declaration', !data.declaration)}
                style={styles.declaration}
              >
                <View style={[
                  styles.checkbox,
                  data.declaration && styles.checkboxActive,
                ]}>
                  {data.declaration && <Check size={15} color={C.background} />}
                </View>
                <Text style={styles.declarationText}>
                  I confirm that the information provided is accurate, that I am authorised to submit these details, and that the identification document belongs to me.
                </Text>
              </Pressable>
            </>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <X size={17} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            onPress={next}
            disabled={submitting}
            style={[
              styles.nextButton,
              submitting && styles.disabledButton,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={C.background} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === STEPS.length - 1
                    ? 'Submit application'
                    : 'Continue'}
                </Text>
                {step === STEPS.length - 1 ? (
                  <Check size={20} color={C.background} />
                ) : (
                  <ArrowRight size={20} color={C.background} />
                )}
              </>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            {step === STEPS.length - 1
              ? 'Your application will be sent for review.'
              : 'Your progress stays on this screen until submission.'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepHeaderIcon}>{icon}</View>
      <Text style={styles.stepEyebrow}>{eyebrow}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  );
}

function IdUploadCard({
  title,
  image,
  onGallery,
  onCamera,
  onRemove,
}: {
  title: string;
  image: BusinessIdImage | null;
  onGallery: () => void;
  onCamera: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadHeader}>
        <Text style={styles.uploadTitle}>{title}</Text>
        {image && (
          <Pressable onPress={onRemove}>
            <X size={18} color={C.muted} />
          </Pressable>
        )}
      </View>

      {image ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          <View style={styles.imageSelected}>
            <CheckCircle2 size={15} color={C.green} />
            <Text style={styles.imageSelectedText}>Image selected</Text>
          </View>
        </View>
      ) : (
        <View style={styles.uploadPlaceholder}>
          <ImagePlus size={25} color={C.lime} />
          <Text style={styles.uploadHint}>Choose a clear, readable image</Text>
        </View>
      )}

      <View style={styles.uploadActions}>
        <Pressable onPress={onGallery} style={styles.uploadAction}>
          <ImagePlus size={16} color={C.lime} />
          <Text style={styles.uploadActionText}>Gallery</Text>
        </Pressable>
        {Platform.OS !== 'web' && (
          <Pressable onPress={onCamera} style={styles.uploadAction}>
            <Camera size={16} color={C.lime} />
            <Text style={styles.uploadActionText}>Camera</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: C.background },
  topBar: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: { flex: 1, marginLeft: 12 },
  brand: {
    color: C.lime,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  brandLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  stepCounter: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
  progressArea: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  progressTrack: {
    height: 5,
    borderRadius: 99,
    backgroundColor: C.cardSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.lime,
    borderRadius: 99,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  stepLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  stepLabelActive: { color: C.lime },
  stepLabelComplete: { color: C.green },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  stepHeader: { marginBottom: 24 },
  stepHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  stepEyebrow: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  stepTitle: {
    color: C.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  stepDescription: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#1B2118',
    borderWidth: 1,
    borderColor: '#39452B',
    borderRadius: 15,
    padding: 14,
    marginBottom: 22,
  },
  noticeText: {
    color: '#DCE7D0',
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
  field: { marginBottom: 17 },
  fieldLabel: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    color: C.white,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
  inlineAction: {
    alignSelf: 'flex-end',
    paddingVertical: 7,
    marginTop: -7,
    marginBottom: 12,
  },
  inlineActionText: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '800',
  },
  privacyCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 21,
  },
  privacyTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
  privacyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  uploadCard: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    marginBottom: 15,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  uploadTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
  },
  uploadPlaceholder: {
    minHeight: 105,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#465052',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadHint: { color: C.muted, fontSize: 12 },
  imagePreviewWrap: { gap: 9 },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    resizeMode: 'contain',
  },
  imageSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  imageSelectedText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '700',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
  },
  uploadAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadActionText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  categoryList: { gap: 11 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 17,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  categoryCardActive: {
    borderColor: C.lime,
    backgroundColor: '#1B2118',
  },
  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: { backgroundColor: C.lime },
  categoryCopy: { flex: 1 },
  categoryTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#667174',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: C.lime },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 99,
    backgroundColor: C.lime,
  },
  helperText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 18,
  },
  selectedCategory: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  selectedCategoryLabel: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  selectedCategoryTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 5,
  },
  sectionLabel: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 10,
    marginBottom: 16,
  },
  reviewSection: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    marginBottom: 14,
  },
  reviewSectionTitle: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 13,
  },
  reviewRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  reviewLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  reviewValue: {
    color: C.white,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  reviewNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: C.cardSoft,
    padding: 14,
    borderRadius: 15,
    marginBottom: 17,
  },
  reviewNoticeText: {
    color: C.muted,
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
  },
  declaration: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#647073',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  declarationText: {
    flex: 1,
    color: C.white,
    fontSize: 12,
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    backgroundColor: '#2A1718',
    borderWidth: 1,
    borderColor: '#633235',
    borderRadius: 13,
    marginTop: 15,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    color: '#FFB8B8',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  nextButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextButtonText: {
    color: C.background,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: { opacity: 0.65 },
  footerText: {
    color: C.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 9,
  },
});
