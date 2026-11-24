import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  Wrench,
} from 'lucide-react-native';

import {
  addBusinessForOwner,
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
type Category = BusinessCategory;

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


const REQUESTED_MODULES: Record<Category, string[]> = {
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

export default function RegisterAdditionalBusinessScreen() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<Category | ''>('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<BusinessLocationInput>(
    () => createInitialBusinessLocation(),
  );
  const [locationEvidence, setLocationEvidence] = useState<
    BusinessLocationEvidenceUpload[]
  >([]);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedCategory = useMemo(
    () => CATEGORIES.find(item => item.id === category),
    [category],
  );

  const questions = category
    ? CATEGORY_QUESTIONS[category]
    : [];

  const updateAnswer = (key: string, value: string) => {
    setAnswers(previous => ({
      ...previous,
      [key]: value,
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!businessName.trim()) {
        return 'Enter your business name.';
      }

      if (!category) {
        return 'Select a business category.';
      }

      if (category === 'OTHER' && !suggestedCategory.trim()) {
        return 'Describe the closest business category.';
      }
    }

    if (step === 1) {
      if (!description.trim()) {
        return 'Describe what your business does.';
      }

      const missing = questions.find(
        question => !answers[question.key]?.trim(),
      );

      if (missing) {
        return `Please complete: ${missing.label}`;
      }
    }

    if (step === 2) {
      return validateBusinessLocationForm(location, locationEvidence);
    }

    if (step === 3 && !declaration) {
      return 'Please confirm that the information is accurate.';
    }

    return '';
  };

  const buildBusinessInput = (): FirstBusinessInput => {
    if (!category) {
      throw new Error('Select a business category first.');
    }

    const categoryLabel =
      selectedCategory?.title || 'Other business';

    return {
      name: businessName.trim(),
      category,
      categoryLabel,
      description: description.trim(),
      suggestedCategory:
        category === 'OTHER'
          ? suggestedCategory.trim()
          : undefined,
      operatingModel: {
        category,
        ...answers,
      },
      requestedModules: REQUESTED_MODULES[category],
      questionnaire: {
        category,
        businessName: businessName.trim(),
        description: description.trim(),
        suggestedCategory:
          suggestedCategory.trim() || null,
        answers,
      },
    };
  };

  const handleContinue = () => {
    const validationError = validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setStep(current => Math.min(current + 1, 3));
  };

  const handleSubmit = async () => {
    const validationError = validateStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addBusinessForOwner(
        buildBusinessInput(),
        location,
        locationEvidence,
      );
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit this business application.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={42} color={C.green} />
          </View>

          <Text style={styles.successEyebrow}>
            APPLICATION SUBMITTED
          </Text>

          <Text style={styles.successTitle}>
            Your new business is in review.
          </Text>

          <Text style={styles.successDescription}>
            {businessName} has been submitted under your existing
            business-owner account. It will be reviewed separately
            from your other businesses.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/business/application')}
          >
            <Text style={styles.primaryButtonText}>
              Return to application centre
            </Text>
            <ArrowRight size={18} color={C.background} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (step > 0) {
                setStep(current => current - 1);
                setError('');
              } else {
                router.back();
              }
            }}
          >
            <ArrowLeft size={20} color={C.white} />
          </Pressable>

          <View style={styles.topHeading}>
            <Text style={styles.topEyebrow}>
              BUSINESS NETWORK
            </Text>
            <Text style={styles.topTitle}>
              Add a business
            </Text>
          </View>

          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>
              {step + 1}/4
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((step + 1) / 4) * 100}%` },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>
              SAME OWNER ACCOUNT
            </Text>

            <Text style={styles.introTitle}>
              {step === 0
                ? 'Tell us about this business.'
                : step === 1
                  ? 'How does it operate?'
                  : step === 2
                    ? 'Where does it operate?'
                    : 'Review and submit.'}
            </Text>

            <Text style={styles.introDescription}>
              {step === 0
                ? 'Register another business without creating another owner account or repeating identity verification.'
                : step === 1
                  ? 'These details help MAKAZII configure the appropriate business workspace.'
                  : step === 2
                    ? 'Provide the real operating location and supporting evidence for this business.'
                    : 'Check your details and confirm that this application is accurate.'}
            </Text>
          </View>

          {step === 0 ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>BUSINESS NAME</Text>
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Enter the registered or trading name"
                  placeholderTextColor={C.muted}
                  style={styles.input}
                  autoCapitalize="words"
                  maxLength={120}
                />
              </View>

              <Text style={styles.fieldLabel}>
                SELECT BUSINESS CATEGORY
              </Text>

              <View style={styles.categoryList}>
                {CATEGORIES.map(item => {
                  const Icon = item.icon;
                  const active = category === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setCategory(item.id);
                        setAnswers({});
                        setError('');
                      }}
                      style={[
                        styles.categoryCard,
                        active && styles.categoryCardActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          active && styles.categoryIconActive,
                        ]}
                      >
                        <Icon
                          size={21}
                          color={active ? C.background : C.lime}
                        />
                      </View>

                      <View style={styles.categoryCopy}>
                        <Text style={styles.categoryTitle}>
                          {item.title}
                        </Text>
                        <Text style={styles.categoryDescription}>
                          {item.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          active && styles.radioOuterActive,
                        ]}
                      >
                        {active ? (
                          <View style={styles.radioInner} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {category === 'OTHER' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    SUGGESTED INDUSTRY OR CATEGORY
                  </Text>
                  <TextInput
                    value={suggestedCategory}
                    onChangeText={setSuggestedCategory}
                    placeholder="e.g. Agriculture, education, events"
                    placeholderTextColor={C.muted}
                    style={styles.input}
                    maxLength={120}
                  />
                  <Text style={styles.helperText}>
                    The administration team can review your suggested
                    category for possible inclusion in MAKAZII.
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <View style={styles.selectedCategory}>
                <Building2 size={19} color={C.lime} />
                <Text style={styles.selectedCategoryText}>
                  {selectedCategory?.title}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  BUSINESS DESCRIPTION
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your business and what customers can expect."
                  placeholderTextColor={C.muted}
                  style={[styles.input, styles.multilineInput]}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>

              {category ? (
                  <BusinessQuestionnaire
                    category={category}
                    answers={answers}
                    onAnswerChange={updateAnswer}
                  />
                ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View style={{ marginBottom: 16, gap: 8 }}>
                <Text style={styles.reviewEyebrow}>
                  PRIMARY OPERATING LOCATION
                </Text>
                <Text style={styles.noticeDescription}>
                  Each business must provide its own operating location and verification evidence.
                </Text>
              </View>

              <BusinessLocationForm
                value={location}
                onChange={setLocation}
                evidence={locationEvidence}
                onEvidenceChange={setLocationEvidence}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewEyebrow}>
                  BUSINESS DETAILS
                </Text>

                <ReviewRow
                  label="Business name"
                  value={businessName}
                />

                <ReviewRow
                  label="Category"
                  value={selectedCategory?.title || ''}
                />

                {category === 'OTHER' ? (
                  <ReviewRow
                    label="Suggested category"
                    value={suggestedCategory}
                  />
                ) : null}

                <ReviewRow
                  label="Description"
                  value={description}
                />

                <View style={styles.reviewDivider} />

                <Text style={styles.reviewEyebrow}>
                  OPERATING DETAILS
                </Text>

                {questions.map(question => (
                  <ReviewRow
                    key={question.key}
                    label={question.label}
                    value={answers[question.key] || ''}
                  />
                ))}
              </View>

              <View style={styles.reviewCard}>
                <Text style={styles.reviewEyebrow}>
                  PRIMARY OPERATING LOCATION
                </Text>
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
              </View>

              <View style={styles.identityNotice}>
                <CheckCircle2 size={20} color={C.green} />
                <View style={styles.noticeCopy}>
                  <Text style={styles.noticeTitle}>
                    Existing identity verification
                  </Text>
                  <Text style={styles.noticeDescription}>
                    This business will use your existing approved
                    owner profile and verified National ID. No
                    duplicate identity application is created.
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.declarationRow}
                onPress={() => setDeclaration(value => !value)}
              >
                <View
                  style={[
                    styles.checkbox,
                    declaration && styles.checkboxActive,
                  ]}
                >
                  {declaration ? (
                    <CheckCircle2 size={16} color={C.background} />
                  ) : null}
                </View>

                <Text style={styles.declarationText}>
                  I confirm that the information provided is
                  accurate and that I am authorised to register
                  this business.
                </Text>
              </Pressable>
            </>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {step < 3 ? (
              <Pressable
                style={styles.primaryButton}
                onPress={handleContinue}
              >
                <Text style={styles.primaryButtonText}>
                  Continue
                </Text>
                <ArrowRight size={18} color={C.background} />
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  submitting && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={C.background} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Submit business application
                    </Text>
                    <ArrowRight size={18} color={C.background} />
                  </>
                )}
              </Pressable>
            )}

            {step > 0 ? (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setStep(current => current - 1);
                  setError('');
                }}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>
                  Back
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.footer}>
            <ChevronDown size={15} color={C.muted} />
            <Text style={styles.footerText}>
              Each business is reviewed independently. Your existing
              businesses and customer account remain separate.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  topBar: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeading: {
    flex: 1,
  },
  topEyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  topTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  stepCounter: {
    backgroundColor: C.cardSoft,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stepCounterText: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    height: 3,
    backgroundColor: C.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: C.lime,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 45,
  },
  intro: {
    marginBottom: 26,
  },
  introEyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  introTitle: {
    color: C.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  introDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 9,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 9,
  },
  input: {
    minHeight: 53,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    color: C.white,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: 14,
  },
  answerInput: {
    minHeight: 76,
  },
  helperText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  categoryList: {
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 13,
  },
  categoryCardActive: {
    borderColor: C.lime,
    backgroundColor: '#1B2118',
  },
  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    backgroundColor: C.lime,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
  },
  categoryDescription: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: C.lime,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.lime,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: C.cardSoft,
    borderRadius: 13,
    padding: 13,
    marginBottom: 22,
  },
  selectedCategoryText: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '800',
  },
  reviewCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    padding: 16,
  },
  reviewEyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },
  reviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  reviewLabel: {
    color: C.muted,
    fontSize: 10,
    marginBottom: 5,
  },
  reviewValue: {
    color: C.white,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 19,
  },
  identityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#15221A',
    borderRadius: 15,
    padding: 14,
    marginTop: 17,
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    color: C.green,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  noticeDescription: {
    color: C.white,
    fontSize: 11,
    lineHeight: 18,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 20,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: C.muted,
    borderRadius: 6,
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
    fontSize: 11,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#281719',
    borderWidth: 1,
    borderColor: '#593034',
    borderRadius: 13,
    padding: 13,
    marginTop: 15,
  },
  errorText: {
    color: C.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 11,
    marginTop: 25,
  },
  primaryButton: {
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: C.background,
    fontSize: 12,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    minHeight: 47,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 24,
  },
  footerText: {
    flex: 1,
    color: C.muted,
    fontSize: 10,
    lineHeight: 17,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 27,
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: '#15221A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 27,
  },
  successEyebrow: {
    color: C.green,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  successTitle: {
    color: C.white,
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },
  successDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
});
