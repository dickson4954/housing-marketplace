import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronDown,
  Check,
  CheckCircle2,
  ImagePlus,
  MapPin,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react-native';

import { useMarketers } from '@/context/MarketerContext';
import { API_BASE_URL } from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
};

type IdType = 'National ID' | 'Passport';

type GeographyItem = {
  id: string;
  sourceId?: string | null;
  name: string;
};

type County = GeographyItem;

type Constituency = GeographyItem & {
  countyId: string;
};

type Ward = GeographyItem & {
  constituencyId: string;
};

async function fetchGeography<T>(
  path: string,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
  );

  let json: any;

  try {
    json = await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid geography response.',
    );
  }

  if (!response.ok || !json.success) {
    throw new Error(
      json.message ||
        'Unable to load geography data.',
    );
  }

  return json;
}

type ApplicationData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;

  idType: IdType;
  idNumber: string;
  idFront: string | null;
  idBack: string | null;

  county: string;
  countyId: string;
  constituency: string;
  constituencyId: string;
  wardIds: string[];
  wardNames: string[];
  timeInSelectedAreas: string;

  experience: 'Yes' | 'No' | '';
  experienceType: string;
  experienceLength: string;
  experienceDescription: string;

  occupation: string;
  workingWithAgency: 'Yes' | 'No' | '';
  agencyName: string;

  motivation: string;
  contribution: string;

  propertiesPerMonth: string;
  sourcingMethods: string[];

  knowsLandlords: 'Yes' | 'No' | '';
  landlordNetwork: string;

  comfortableCommunication: 'Yes' | 'No' | '';
  communicationMethods: string[];

  availability: string;
  followsProcedures: 'Yes' | 'No' | '';

  referenceName: string;
  referencePhone: string;
  referenceRelationship: string;

  declaration: boolean;
};

const INITIAL_DATA: ApplicationData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',

  idType: 'National ID',
  idNumber: '',
  idFront: null,
  idBack: null,

  county: '',
  countyId: '',
  constituency: '',
  constituencyId: '',
  wardIds: [],
  wardNames: [],
  timeInSelectedAreas: '',

  experience: '',
  experienceType: '',
  experienceLength: '',
  experienceDescription: '',

  occupation: '',
  workingWithAgency: '',
  agencyName: '',

  motivation: '',
  contribution: '',

  propertiesPerMonth: '',
  sourcingMethods: [],

  knowsLandlords: '',
  landlordNetwork: '',

  comfortableCommunication: '',
  communicationMethods: [],

  availability: '',
  followsProcedures: '',

  referenceName: '',
  referencePhone: '',
  referenceRelationship: '',

  declaration: false,
};

const STEPS = [
  'Personal',
  'Identity',
  'Location',
  'Experience',
  'Review',
];

const TIME_IN_AREA_OPTIONS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  'More than 5 years',
];

const EXPERIENCE_TYPES = [
  'Property marketing',
  'Property management',
  'Real-estate agency',
  'Property sourcing',
  'Property sales',
  'Rental management',
  'Other',
];

const EXPERIENCE_LENGTHS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  'More than 5 years',
];

const OCCUPATIONS = [
  'Real-estate agent',
  'Self-employed',
  'Student',
  'Employed',
  'Business owner',
  'Property manager',
  'Other',
];

const PROPERTY_RANGES = [
  '1–5',
  '6–10',
  '11–20',
  'More than 20',
  'Not sure',
];

const SOURCING_METHODS = [
  'Local landlords',
  'Visiting properties',
  'Referrals',
  'Social media',
  'Real-estate networks',
  'Property agents',
  'Other',
];

const COMMUNICATION_METHODS = [
  'Phone',
  'WhatsApp',
  'SMS',
  'Email',
  'In person',
];

const AVAILABILITY_OPTIONS = [
  'Full-time',
  'Part-time',
  'A few hours per week',
  'Flexible / as needed',
];

export default function MarketerApplyScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isUpdateMode = params.mode === 'update';

  const [step, setStep] = useState(0);
  const [data, setData] =
    useState<ApplicationData>(INITIAL_DATA);
  const [submitting, setSubmitting] =
    useState(false);
  const [loadingApplication, setLoadingApplication] =
    useState(false);

  const {
    submitApplication,
    updateApplicantMarketerApplication,
    refreshMyApplicationStatus,
  } = useMarketers();

  const update = <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (!isUpdateMode) {
      return;
    }

    let mounted = true;

    const loadSavedApplication = async () => {
      setLoadingApplication(true);

      try {
        const application = await refreshMyApplicationStatus();

        if (!application) {
          throw new Error(
            'We could not find your saved application. Please return to your application status and try again.',
          );
        }

        if (application.status !== 'ACTION_REQUIRED') {
          throw new Error(
            'This application is no longer awaiting corrections. Please return to your application status.',
          );
        }

        if (!mounted) {
          return;
        }

        setData({
          firstName: application.firstName ?? '',
          lastName: application.lastName ?? '',
          phone: application.phone ?? '',
          email: application.email ?? '',

          idType: application.idType ?? 'National ID',
          idNumber: application.idNumber ?? '',
          // Identity document references are private and not returned by the API.
          idFront: null,
          idBack: null,

          county: application.county ?? '',
          countyId: application.countyId ?? '',
          constituency: application.constituency ?? '',
          constituencyId: application.constituencyId ?? '',
          wardIds: application.wardIds ?? [],
          wardNames: application.wardNames ?? [],
          timeInSelectedAreas: application.timeInSelectedAreas ?? '',

          experience: application.hasRealEstateExperience ? 'Yes' : 'No',
          experienceType: application.experienceAreas?.[0] ?? '',
          experienceLength: application.experienceDuration ?? '',
          experienceDescription: application.experienceDescription ?? '',

          occupation: application.currentOccupation ?? '',
          workingWithAgency: application.workingWithAnotherAgency ? 'Yes' : 'No',
          agencyName: application.currentAgencyName ?? '',

          motivation: application.motivation ?? '',
          contribution: application.contribution ?? '',

          propertiesPerMonth: String(
            application.expectedPropertiesPerMonth ?? '',
          ),
          sourcingMethods: application.propertySources ?? [],

          knowsLandlords: application.knowsLandlords ? 'Yes' : 'No',
          landlordNetwork:
            application.approximateLandlordCount == null
              ? ''
              : String(application.approximateLandlordCount),

          comfortableCommunication:
            application.comfortableCommunicating ? 'Yes' : 'No',
          communicationMethods: application.communicationMethods ?? [],

          availability: application.timeAvailability ?? '',
          followsProcedures: application.willingToFollowProcedures ? 'Yes' : 'No',

          referenceName: application.referenceName ?? '',
          referencePhone: application.referencePhone ?? '',
          referenceRelationship: application.referenceRelationship ?? '',

          // Require the applicant to acknowledge the declaration again.
          declaration: false,
        });
      } catch (error) {
        console.error(
          'Failed to load marketer application for correction:',
          error,
        );

        if (mounted) {
          Alert.alert(
            'Unable to load application',
            error instanceof Error
              ? error.message
              : 'Please return to your application status and try again.',
            [
              {
                text: 'Return to status',
                onPress: () =>
                  router.replace('/marketer/application'),
              },
            ],
          );
        }
      } finally {
        if (mounted) {
          setLoadingApplication(false);
        }
      }
    };

    void loadSavedApplication();

    return () => {
      mounted = false;
    };
  }, [isUpdateMode, refreshMyApplicationStatus]);

  const progress = useMemo(() => {
    return (
      ((step + 1) / STEPS.length) *
      100
    );
  }, [step]);

  const pickImageFromGallery = async (
    side: 'front' | 'back',
  ) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Gallery permission required',
        'Please allow MAKAZII to access your photos so you can select your ID image.',
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.85,
          aspect: [4, 3],
        },
      );

    if (
      result.canceled ||
      !result.assets?.length
    ) {
      return;
    }

    const uri = result.assets[0].uri;

    if (side === 'front') {
      update('idFront', uri);
    } else {
      update('idBack', uri);
    }
  };

  const takePicture = async (
    side: 'front' | 'back',
  ) => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'Please allow MAKAZII to use your camera so you can take a picture of your ID.',
      );
      return;
    }

    const result =
      await ImagePicker.launchCameraAsync(
        {
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.85,
          aspect: [4, 3],
        },
      );

    if (
      result.canceled ||
      !result.assets?.length
    ) {
      return;
    }

    const uri = result.assets[0].uri;

    if (side === 'front') {
      update('idFront', uri);
    } else {
      update('idBack', uri);
    }
  };

  const removeImage = (
    side: 'front' | 'back',
  ) => {
    if (side === 'front') {
      update('idFront', null);
    } else {
      update('idBack', null);
    }
  };

  const toggleArrayValue = (
    key:
      | 'sourcingMethods'
      | 'communicationMethods',
    value: string,
  ) => {
    setData((current) => {
      const currentValues =
        current[key];

      return {
        ...current,
        [key]: currentValues.includes(
          value,
        )
          ? currentValues.filter(
              (item) => item !== value,
            )
          : [...currentValues, value],
      };
    });
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!data.firstName.trim()) {
        Alert.alert(
          'Missing information',
          'Enter your first name.',
        );
        return false;
      }

      if (!data.lastName.trim()) {
        Alert.alert(
          'Missing information',
          'Enter your last name.',
        );
        return false;
      }

      if (
        data.phone.trim().length <
        9
      ) {
        Alert.alert(
          'Invalid phone number',
          'Enter a valid phone number.',
        );
        return false;
      }

      if (!data.email.trim()) {
        Alert.alert(
          'Missing information',
          'Enter your email address.',
        );
        return false;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          data.email.trim(),
        )
      ) {
        Alert.alert(
          'Invalid email',
          'Enter a valid email address.',
        );
        return false;
      }

      return true;
    }

    if (step === 1 && isUpdateMode) {
      return true;
    }

    if (step === 1) {
      if (!data.idNumber.trim()) {
        Alert.alert(
          'Missing ID number',
          `Enter your ${
            data.idType === 'Passport'
              ? 'passport'
              : 'National ID'
          } number.`,
        );
        return false;
      }

      if (!data.idFront) {
        Alert.alert(
          'ID image required',
          `Please provide a picture of your ${
            data.idType === 'Passport'
              ? 'passport identification page'
              : 'ID front side'
          }.`,
        );
        return false;
      }

      if (
        data.idType ===
          'National ID' &&
        !data.idBack
      ) {
        Alert.alert(
          'ID back required',
          'Please provide a picture of the back side of your National ID.',
        );
        return false;
      }

      return true;
    }

    if (step === 2) {
      if (!data.countyId) {
        Alert.alert(
          'Missing county',
          'Select your county.',
        );
        return false;
      }

      if (!data.constituencyId) {
        Alert.alert(
          'Missing constituency',
          'Select your constituency.',
        );
        return false;
      }

      if (
        data.wardIds.length < 1
      ) {
        Alert.alert(
          'Select a ward',
          'Select at least one ward where you can actively cover properties.',
        );
        return false;
      }

      if (
        data.wardIds.length > 2
      ) {
        Alert.alert(
          'Maximum 2 wards',
          'Select no more than 2 wards.',
        );
        return false;
      }

      if (
        !data.timeInSelectedAreas
      ) {
        Alert.alert(
          'Local experience',
          'Select how long you have lived or worked in your selected areas.',
        );
        return false;
      }

      return true;
    }

    if (step === 3) {
      if (!data.experience) {
        Alert.alert(
          'Experience',
          'Please tell us whether you have worked in real estate.',
        );
        return false;
      }

      if (data.experience === 'Yes') {
        if (!data.experienceType) {
          Alert.alert(
            'Experience area',
            'Please select the area of real estate you have worked in.',
          );
          return false;
        }

        if (
          !data.experienceLength
        ) {
          Alert.alert(
            'Experience length',
            'Please select how long you have worked in real estate.',
          );
          return false;
        }
      }

      if (
        data.experience === 'No' &&
        !data.experienceLength
      ) {
        Alert.alert(
          'Experience length',
          'Please select the option that best describes your experience level.',
        );
        return false;
      }

      if (
        !data.experienceDescription.trim()
      ) {
        Alert.alert(
          'Experience description',
          'Please briefly describe your experience, or tell us that you are new to real estate.',
        );
        return false;
      }

      if (!data.occupation) {
        Alert.alert(
          'Current occupation',
          'Please select your current occupation.',
        );
        return false;
      }

      if (
        !data.motivation.trim()
      ) {
        Alert.alert(
          'Missing answer',
          'Tell us why you want to become a MAKAZII marketer.',
        );
        return false;
      }

      if (
        !data.contribution.trim()
      ) {
        Alert.alert(
          'Missing answer',
          'Tell us what you believe you can contribute to MAKAZII.',
        );
        return false;
      }

      if (!data.propertiesPerMonth) {
        Alert.alert(
          'Property sourcing',
          'Select how many properties you expect to source per month.',
        );
        return false;
      }

      if (
        data.sourcingMethods.length ===
        0
      ) {
        Alert.alert(
          'Property sourcing methods',
          'Select at least one way you expect to find available properties.',
        );
        return false;
      }

      if (!data.knowsLandlords) {
        Alert.alert(
          'Landlord network',
          'Please tell us whether you know landlords or property owners.',
        );
        return false;
      }

      if (
        data.knowsLandlords ===
        'Yes'
      ) {
        const count =
          Number(
            data.landlordNetwork.trim(),
          );

        if (
          !data.landlordNetwork.trim()
        ) {
          Alert.alert(
            'Landlord network',
            'Enter approximately how many landlords or property owners you know.',
          );
          return false;
        }

        if (
          !Number.isInteger(count) ||
          count < 0
        ) {
          Alert.alert(
            'Invalid landlord count',
            'Enter a valid whole number.',
          );
          return false;
        }
      }

      if (
        !data.comfortableCommunication
      ) {
        Alert.alert(
          'Customer interaction',
          'Please tell us whether you are comfortable communicating with renters and landlords.',
        );
        return false;
      }

      if (
        data.communicationMethods
          .length === 0
      ) {
        Alert.alert(
          'Communication methods',
          'Select at least one communication method.',
        );
        return false;
      }

      if (!data.availability) {
        Alert.alert(
          'Availability',
          'Select how much time you can dedicate.',
        );
        return false;
      }

      if (!data.followsProcedures) {
        Alert.alert(
          'MAKAZII procedures',
          'Please confirm whether you are willing to follow MAKAZII verification and customer-service procedures.',
        );
        return false;
      }

      if (
        !data.referenceName.trim()
      ) {
        Alert.alert(
          'Reference required',
          'Enter the name of your reference.',
        );
        return false;
      }

      if (
        data.referencePhone.trim()
          .length < 9
      ) {
        Alert.alert(
          'Reference phone required',
          'Enter a valid phone number for your reference.',
        );
        return false;
      }

      if (
        !data.referenceRelationship.trim()
      ) {
        Alert.alert(
          'Reference relationship',
          'Tell us how the reference is related to you.',
        );
        return false;
      }

      return true;
    }

    if (step === 4) {
      if (!data.declaration) {
        Alert.alert(
          'Confirmation required',
          'Please confirm that the information provided is accurate and that the identification document belongs to you.',
        );
        return false;
      }

      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (
      step <
      STEPS.length - 1
    ) {
      setStep(
        (current) => current + 1,
      );
      return;
    }

    submitApplicationForm();
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
      return;
    }

    setStep(
      (current) => current - 1,
    );
  };

  const submitApplicationForm =
    async () => {
      if (submitting) {
        return;
      }

      setSubmitting(true);

      try {
        const input = {
            firstName:
              data.firstName.trim(),

            lastName:
              data.lastName.trim(),

            phone:
              data.phone.trim(),

            email:
              data.email
                .trim()
                .toLowerCase(),

            idType:
              data.idType,

            idNumber:
              data.idNumber.trim(),

            idFront: data.idFront
              ? {
                  uri: data.idFront,
                  name:
                    data.idType ===
                    'Passport'
                      ? 'passport-identification-page.jpg'
                      : 'national-id-front.jpg',
                  type: 'image/jpeg',
                }
              : null,

            idBack: data.idBack
              ? {
                  uri: data.idBack,
                  name: 'national-id-back.jpg',
                  type: 'image/jpeg',
                }
              : null,

            county:
              data.county.trim(),

            countyId:
              data.countyId,

            constituency:
              data.constituency.trim(),

            constituencyId:
              data.constituencyId,

            wardIds:
              data.wardIds,

            wardNames:
              data.wardNames,

            timeInSelectedAreas:
              data.timeInSelectedAreas,

            hasRealEstateExperience:
              data.experience ===
              'Yes',

            experienceAreas:
              data.experienceType
                ? [data.experienceType]
                : [],

            experienceDuration:
              data.experienceLength,

            experienceDescription:
              data.experienceDescription.trim(),

            currentOccupation:
              data.occupation,

            workingWithAnotherAgency:
              data.workingWithAgency ===
              'Yes',

            currentAgencyName:
              data.agencyName.trim(),

            motivation:
              data.motivation.trim(),

            contribution:
              data.contribution.trim(),

            expectedPropertiesPerMonth:
              data.propertiesPerMonth,

            propertySources:
              data.sourcingMethods,

            knowsLandlords:
              data.knowsLandlords ===
              'Yes',

            approximateLandlordCount:
              data.knowsLandlords ===
              'Yes'
                ? Number(
                    data.landlordNetwork.trim(),
                  )
                : null,

            comfortableCommunicating:
              data.comfortableCommunication ===
              'Yes',

            communicationMethods:
              data.communicationMethods,

            timeAvailability:
              data.availability,

            willingToFollowProcedures:
              data.followsProcedures ===
              'Yes',

            referenceName:
              data.referenceName.trim(),

            referencePhone:
              data.referencePhone.trim(),

            referenceRelationship:
              data.referenceRelationship.trim(),

            declarationAccepted:
              data.declaration,
          };

        const application = isUpdateMode
          ? await updateApplicantMarketerApplication(input)
          : await submitApplication(input);

        router.replace({
          pathname:
            '/marketer/application',
          params: {
            id: application.id,
          },
        });
      } catch (error) {
        console.error(
          'Marketer application submission failed:',
          error,
        );

        Alert.alert(
          'Submission failed',
          error instanceof Error
            ? error.message
            : 'We could not submit your application right now. Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (isUpdateMode && loadingApplication) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[
          styles.container,
          { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.lime} />
        <Text style={{ color: COLORS.muted, marginTop: 14 }}>
          Loading your saved application...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <ArrowLeft
            size={20}
            color={COLORS.white}
          />
        </Pressable>

        <View
          style={styles.brandWrap}
        >
          <Text style={styles.brand}>
            MAKAZII
          </Text>

          <Text
            style={
              styles.brandLabel
            }
          >
            MARKETER APPLICATION
          </Text>
        </View>

        <Text
          style={styles.stepCounter}
        >
          {step + 1}/
          {STEPS.length}
        </Text>
      </View>

      <View
        style={styles.progressArea}
      >
        <View
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <View
          style={styles.stepLabels}
        >
          {STEPS.map(
            (item, index) => (
              <Text
                key={item}
                style={[
                  styles.stepLabel,
                  index === step &&
                    styles.stepLabelActive,
                ]}
              >
                {item}
              </Text>
            ),
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {step === 0 && (
          <PersonalStep
            data={data}
            update={update}
          />
        )}

        {step === 1 && (
          <IdentityStep
            data={data}
            update={update}
            isUpdateMode={isUpdateMode}
            onTakePicture={
              takePicture
            }
            onPickGallery={
              pickImageFromGallery
            }
            onRemoveImage={
              removeImage
            }
          />
        )}

        {step === 2 && (
          <LocationStep
            data={data}
            update={update}
          />
        )}

        {step === 3 && (
          <ExperienceStep
            data={data}
            update={update}
            toggleArrayValue={
              toggleArrayValue
            }
          />
        )}

        {step === 4 && (
          <ReviewStep
            data={data}
            update={update}
          />
        )}
      </ScrollView>

      <View
        style={styles.bottomBar}
      >
        <Pressable
          onPress={handleNext}
          disabled={submitting}
          style={({ pressed }) => [
            styles.nextButton,
            pressed &&
              styles.nextButtonPressed,
            submitting &&
              styles.disabledButton,
          ]}
        >
          <Text
            style={
              styles.nextButtonText
            }
          >
            {submitting
              ? 'Submitting...'
              : step ===
                  STEPS.length - 1
                ? 'Submit Application'
                : 'Continue'}
          </Text>

          {step <
            STEPS.length - 1 &&
          !submitting ? (
            <ArrowRight
              size={20}
              color={
                COLORS.background
              }
              strokeWidth={2.5}
            />
          ) : (
            <Check
              size={20}
              color={
                COLORS.background
              }
              strokeWidth={2.5}
            />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* PERSONAL                                                                    */
/* -------------------------------------------------------------------------- */

function PersonalStep({
  data,
  update,
}: {
  data: ApplicationData;
  update: <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => void;
}) {
  return (
    <View>
      <StepHeader
        icon={
          <UserRound
            size={22}
            color={COLORS.lime}
          />
        }
        eyebrow="STEP 1"
        title="Tell us about yourself"
        description="Start with the basic information we need to identify and contact you."
      />

      <Field
        label="First name"
        value={data.firstName}
        onChangeText={(value) =>
          update(
            'firstName',
            value,
          )
        }
        placeholder="e.g. Brian"
      />

      <Field
        label="Last name"
        value={data.lastName}
        onChangeText={(value) =>
          update(
            'lastName',
            value,
          )
        }
        placeholder="e.g. Kamau"
      />

      <Field
        label="Phone number"
        value={data.phone}
        onChangeText={(value) =>
          update(
            'phone',
            value,
          )
        }
        placeholder="e.g. 0712 345 678"
        keyboardType="phone-pad"
      />

      <Field
        label="Email address"
        value={data.email}
        onChangeText={(value) =>
          update(
            'email',
            value,
          )
        }
        placeholder="e.g. brian@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <InfoCard
        icon={
          <ShieldCheck
            size={19}
            color={COLORS.lime}
          />
        }
        title="Your information"
        text="Your application information will be used for MAKAZII's review process. Sensitive identity documents will only be accessible to authorized administrators."
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* IDENTITY                                                                    */
/* -------------------------------------------------------------------------- */

function IdentityStep({
  data,
  update,
  onTakePicture,
  onPickGallery,
  onRemoveImage,
  isUpdateMode,
}: {
  data: ApplicationData;
  update: <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => void;
  onTakePicture: (
    side: 'front' | 'back',
  ) => void;
  onPickGallery: (
    side: 'front' | 'back',
  ) => void;
  onRemoveImage: (
    side: 'front' | 'back',
  ) => void;
  isUpdateMode: boolean;
}) {
  if (isUpdateMode) {
    return (
      <View>
        <StepHeader
          icon={<ShieldCheck size={22} color={COLORS.lime} />}
          eyebrow="STEP 2"
          title="Identity details"
          description="Your existing identity details are protected during ordinary corrections."
        />
        <InfoCard
          icon={<ShieldCheck size={19} color={COLORS.lime} />}
          title="Identity details are locked"
          text={`Document: ${data.idType}\nID / passport number: ${data.idNumber}\n\nTo change your identification type, number, or uploaded document, please contact MAKAZII support. You do not need to upload your ID again for these corrections.`}
        />
      </View>
    );
  }

  return (
    <View>
      <StepHeader
        icon={
          <ShieldCheck
            size={22}
            color={COLORS.lime}
          />
        }
        eyebrow="STEP 2"
        title="Verify your identity"
        description="Provide a clear picture of your identification document. You can take a new picture or choose one from your gallery."
      />

      <Text
        style={styles.fieldLabel}
      >
        Identification type
      </Text>

      <View
        style={styles.choiceRow}
      >
        <ChoiceButton
          label="National ID"
          selected={
            data.idType ===
            'National ID'
          }
          onPress={() => {
            update(
              'idType',
              'National ID',
            );
            update(
              'idFront',
              null,
            );
            update(
              'idBack',
              null,
            );
          }}
        />

        <ChoiceButton
          label="Passport"
          selected={
            data.idType ===
            'Passport'
          }
          onPress={() => {
            update(
              'idType',
              'Passport',
            );
            update(
              'idFront',
              null,
            );
            update(
              'idBack',
              null,
            );
          }}
        />
      </View>

      <Field
        label={
          data.idType ===
          'Passport'
            ? 'Passport number'
            : 'National ID number'
        }
        value={data.idNumber}
        onChangeText={(value) =>
          update(
            'idNumber',
            value,
          )
        }
        placeholder={
          data.idType ===
          'Passport'
            ? 'Enter passport number'
            : 'Enter ID number'
        }
      />

      <DocumentUpload
        title={
          data.idType ===
          'Passport'
            ? 'Passport identification page'
            : 'National ID — front side'
        }
        image={data.idFront}
        onTakePicture={() =>
          onTakePicture(
            'front',
          )
        }
        onPickGallery={() =>
          onPickGallery(
            'front',
          )
        }
        onRemove={() =>
          onRemoveImage(
            'front',
          )
        }
      />

      {data.idType ===
        'National ID' && (
        <DocumentUpload
          title="National ID — back side"
          image={data.idBack}
          onTakePicture={() =>
            onTakePicture(
              'back',
            )
          }
          onPickGallery={() =>
            onPickGallery(
              'back',
            )
          }
          onRemove={() =>
            onRemoveImage(
              'back',
            )
          }
        />
      )}

      <InfoCard
        icon={
          <ShieldCheck
            size={19}
            color={COLORS.lime}
          />
        }
        title="Keep your document clear"
        text="Make sure all text and numbers are readable and the entire document is visible. Your identity images are private application documents."
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* LOCATION                                                                    */
/* -------------------------------------------------------------------------- */

function LocationStep({
  data,
  update,
}: {
  data: ApplicationData;
  update: <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => void;
}) {
  const [counties, setCounties] =
    useState<County[]>([]);

  const [
    constituencies,
    setConstituencies,
  ] = useState<
    Constituency[]
  >([]);

  const [wards, setWards] =
    useState<Ward[]>([]);

  const [
    loadingCounties,
    setLoadingCounties,
  ] = useState(false);

  const [
    loadingConstituencies,
    setLoadingConstituencies,
  ] = useState(false);

  const [
    loadingWards,
    setLoadingWards,
  ] = useState(false);

  const [
    countyModalVisible,
    setCountyModalVisible,
  ] = useState(false);

  const [
    constituencyModalVisible,
    setConstituencyModalVisible,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCounties =
      async () => {
        setLoadingCounties(
          true,
        );

        try {
          const response =
            await fetchGeography<{
              data: {
                counties: County[];
              };
            }>(
              '/geography/counties',
            );

          if (mounted) {
            setCounties(
              response.data
                .counties,
            );
          }
        } catch (error) {
          console.error(
            'Failed to load counties:',
            error,
          );

          if (mounted) {
            Alert.alert(
              'Unable to load counties',
              'Please check your connection and try again.',
            );
          }
        } finally {
          if (mounted) {
            setLoadingCounties(
              false,
            );
          }
        }
      };

    loadCounties();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data.countyId || !data.constituencyId) {
      return;
    }

    let mounted = true;

    const loadSelectedGeography = async () => {
      try {
        const constituencyResponse = await fetchGeography<{
          data: { constituencies: Constituency[] };
        }>(
          `/geography/counties/${data.countyId}/constituencies`,
        );

        const wardResponse = await fetchGeography<{
          data: { wards: Ward[] };
        }>(
          `/geography/constituencies/${data.constituencyId}/wards`,
        );

        if (mounted) {
          setConstituencies(
            constituencyResponse.data.constituencies,
          );
          setWards(wardResponse.data.wards);
        }
      } catch (error) {
        console.error(
          'Failed to restore selected application geography:',
          error,
        );
      }
    };

    void loadSelectedGeography();

    return () => {
      mounted = false;
    };
  }, [data.countyId, data.constituencyId]);

  const selectCounty = async (
    county: County,
  ) => {
    update(
      'county',
      county.name,
    );
    update(
      'countyId',
      county.id,
    );

    update(
      'constituency',
      '',
    );
    update(
      'constituencyId',
      '',
    );
    update(
      'wardIds',
      [],
    );
    update(
      'wardNames',
      [],
    );
    setConstituencies(
      [],
    );
    setWards([]);

    setCountyModalVisible(
      false,
    );

    setLoadingConstituencies(
      true,
    );

    try {
      const constituencyResponse =
        await fetchGeography<{
          data: {
            constituencies:
              Constituency[];
          };
        }>(
          `/geography/counties/${county.id}/constituencies`,
        );

      setConstituencies(
        constituencyResponse
          .data
          .constituencies,
      );
    } catch (error) {
      console.error(
        'Failed to load county geography:',
        error,
      );

      Alert.alert(
        'Unable to load location data',
        'We could not load constituencies for this county.',
      );
    } finally {
      setLoadingConstituencies(
        false,
      );
    }
  };

  const selectConstituency =
    async (
      constituency: Constituency,
    ) => {
      update(
        'constituency',
        constituency.name,
      );

      update(
        'constituencyId',
        constituency.id,
      );

      update(
        'wardIds',
        [],
      );

      update(
        'wardNames',
        [],
      );

      setWards([]);

      setConstituencyModalVisible(
        false,
      );

      setLoadingWards(true);

      try {
        const response =
          await fetchGeography<{
            data: {
              wards: Ward[];
            };
          }>(
            `/geography/constituencies/${constituency.id}/wards`,
          );

        setWards(
          response.data.wards,
        );
      } catch (error) {
        console.error(
          'Failed to load wards:',
          error,
        );

        Alert.alert(
          'Unable to load wards',
          'We could not load wards for this constituency.',
        );
      } finally {
        setLoadingWards(
          false,
        );
      }
    };

  const toggleWard = (
    ward: Ward,
  ) => {
    setDataSafeWardSelection(
      ward,
      data,
      update,
    );
  };

  return (
    <View>
      <StepHeader
        icon={
          <MapPin
            size={22}
            color={COLORS.lime}
          />
        }
        eyebrow="STEP 3"
        title="Where can you work?"
        description="Choose the county, constituency and up to two wards where you have local knowledge and can actively source properties."
      />

      <Text
        style={styles.fieldLabel}
      >
        County
      </Text>

      <Pressable
        onPress={() =>
          setCountyModalVisible(
            true,
          )
        }
        style={
          styles.selectorButton
        }
      >
        <View
          style={
            styles.selectorTextWrap
          }
        >
          <MapPin
            size={18}
            color={COLORS.lime}
          />

          <Text
            style={[
              styles.selectorText,
              !data.county &&
                styles.selectorPlaceholder,
            ]}
          >
            {data.county ||
              'Select your county'}
          </Text>
        </View>

        {loadingCounties ? (
          <ActivityIndicator
            size="small"
            color={COLORS.lime}
          />
        ) : (
          <ChevronDown
            size={18}
            color={COLORS.muted}
          />
        )}
      </Pressable>

      {data.countyId && (
        <>
          <Text
            style={
              styles.fieldLabel
            }
          >
            Constituency
          </Text>

          <Pressable
            onPress={() => {
              if (
                !loadingConstituencies &&
                constituencies.length >
                  0
              ) {
                setConstituencyModalVisible(
                  true,
                );
              }
            }}
            style={[
              styles.selectorButton,
              loadingConstituencies &&
                styles.selectorDisabled,
            ]}
          >
            <View
              style={
                styles.selectorTextWrap
              }
            >
              <MapPin
                size={18}
                color={COLORS.lime}
              />

              <Text
                style={[
                  styles.selectorText,
                  !data.constituency &&
                    styles.selectorPlaceholder,
                ]}
              >
                {loadingConstituencies
                  ? 'Loading constituencies...'
                  : data.constituency ||
                    'Select your constituency'}
              </Text>
            </View>

            {loadingConstituencies ? (
              <ActivityIndicator
                size="small"
                color={COLORS.lime}
              />
            ) : (
              <ChevronDown
                size={18}
                color={
                  COLORS.muted
                }
              />
            )}
          </Pressable>
        </>
      )}

      {data.constituencyId && (
        <>
          <Text
            style={
              styles.fieldLabel
            }
          >
            Wards
          </Text>

          <Text
            style={
              styles.helperText
            }
          >
            Select 1 or 2 wards where
            you can actively source
            and verify properties.
          </Text>

          {loadingWards ? (
            <View
              style={
                styles.loadingRow
              }
            >
              <ActivityIndicator
                size="small"
                color={COLORS.lime}
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading wards...
              </Text>
            </View>
          ) : wards.length ===
            0 ? (
            <View
              style={
                styles.emptyLocationCard
              }
            >
              <Text
                style={
                  styles.emptyLocationText
                }
              >
                No wards were found
                for this constituency.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.chipWrap
              }
            >
              {wards.map(
                (ward) => {
                  const selected =
                    data.wardIds.includes(
                      ward.id,
                    );

                  return (
                    <Pressable
                      key={ward.id}
                      onPress={() =>
                        toggleWard(
                          ward,
                        )
                      }
                      style={[
                        styles.chip,
                        selected &&
                          styles.chipSelected,
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

                      <Text
                        style={[
                          styles.chipText,
                          selected &&
                            styles.chipTextSelected,
                        ]}
                      >
                        {
                          ward.name
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          )}

          <Text
            style={
              styles.selectionCount
            }
          >
            {data.wardIds.length}/2
            wards selected
          </Text>
        </>
      )}

      <Text
        style={styles.fieldLabel}
      >
        How long have you lived or
        worked in these areas?
      </Text>

      <View
        style={styles.chipWrap}
      >
        {TIME_IN_AREA_OPTIONS.map(
          (item) => {
            const selected =
              data.timeInSelectedAreas ===
              item;

            return (
              <Pressable
                key={item}
                onPress={() =>
                  update(
                    'timeInSelectedAreas',
                    item,
                  )
                }
                style={[
                  styles.chip,
                  selected &&
                    styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <InfoCard
        icon={
          <MapPin
            size={19}
            color={COLORS.lime}
          />
        }
        title="Why we ask this"
        text="MAKAZII uses local marketers to source and verify properties in specific places. Your county, constituency, wards and local experience help us understand where you can contribute."
      />

      <Modal
        visible={
          countyModalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setCountyModalVisible(
            false,
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Select county
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Choose where you
                  will work.
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setCountyModalVisible(
                    false,
                  )
                }
                style={
                  styles.modalCloseButton
                }
              >
                <X
                  size={19}
                  color={
                    COLORS.white
                  }
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.modalList
              }
            >
              {counties.map(
                (county) => {
                  const selected =
                    data.countyId ===
                    county.id;

                  return (
                    <Pressable
                      key={
                        county.id
                      }
                      onPress={() =>
                        selectCounty(
                          county,
                        )
                      }
                      style={[
                        styles.modalOption,
                        selected &&
                          styles.modalOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          selected &&
                            styles.modalOptionTextSelected,
                        ]}
                      >
                        {
                          county.name
                        }
                      </Text>

                      {selected && (
                        <Check
                          size={18}
                          color={
                            COLORS.lime
                          }
                          strokeWidth={
                            3
                          }
                        />
                      )}
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          constituencyModalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setConstituencyModalVisible(
            false,
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Select constituency
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Choose your
                  constituency.
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setConstituencyModalVisible(
                    false,
                  )
                }
                style={
                  styles.modalCloseButton
                }
              >
                <X
                  size={19}
                  color={
                    COLORS.white
                  }
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.modalList
              }
            >
              {constituencies.map(
                (
                  constituency,
                ) => {
                  const selected =
                    data.constituencyId ===
                    constituency.id;

                  return (
                    <Pressable
                      key={
                        constituency.id
                      }
                      onPress={() =>
                        selectConstituency(
                          constituency,
                        )
                      }
                      style={[
                        styles.modalOption,
                        selected &&
                          styles.modalOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          selected &&
                            styles.modalOptionTextSelected,
                        ]}
                      >
                        {
                          constituency.name
                        }
                      </Text>

                      {selected && (
                        <Check
                          size={18}
                          color={
                            COLORS.lime
                          }
                          strokeWidth={
                            3
                          }
                        />
                      )}
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function setDataSafeWardSelection(
  ward: Ward,
  data: ApplicationData,
  update: <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => void,
) {
  const exists =
    data.wardIds.includes(
      ward.id,
    );

  if (exists) {
    const index =
      data.wardIds.indexOf(
        ward.id,
      );

    update(
      'wardIds',
      data.wardIds.filter(
        (id) => id !== ward.id,
      ),
    );

    update(
      'wardNames',
      data.wardNames.filter(
        (_, nameIndex) =>
          nameIndex !== index,
      ),
    );

    return;
  }

  if (
    data.wardIds.length >= 2
  ) {
    Alert.alert(
      'Maximum 2 wards',
      'Select no more than 2 wards.',
    );
    return;
  }

  update(
    'wardIds',
    [
      ...data.wardIds,
      ward.id,
    ],
  );

  update(
    'wardNames',
    [
      ...data.wardNames,
      ward.name,
    ],
  );
}

/* -------------------------------------------------------------------------- */
/* EXPERIENCE                                                                  */
/* -------------------------------------------------------------------------- */

function ExperienceStep({
  data,
  update,
  toggleArrayValue,
}: {
  data: ApplicationData;
  update: <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => void;
  toggleArrayValue: (
    key:
      | 'sourcingMethods'
      | 'communicationMethods',
    value: string,
  ) => void;
}) {
  return (
    <View>
      <StepHeader
        icon={
          <UserRound
            size={22}
            color={COLORS.lime}
          />
        }
        eyebrow="STEP 4"
        title="Tell us about your experience"
        description="You don't have to be an experienced real-estate professional. Local knowledge and strong landlord connections also matter."
      />

      <Question
        label="Have you worked in real estate?"
        options={['Yes', 'No']}
        value={data.experience}
        onChange={(value) => {
          const selected =
            value as
              | 'Yes'
              | 'No';

          update(
            'experience',
            selected,
          );

          if (
            selected ===
            'No'
          ) {
            update(
              'experienceType',
              '',
            );

            update(
              'experienceLength',
              'No prior experience',
            );
          } else if (
            data.experienceLength ===
            'No prior experience'
          ) {
            update(
              'experienceLength',
              '',
            );
          }
        }}
      />

      {data.experience ===
        'Yes' && (
        <>
          <Text
            style={
              styles.fieldLabel
            }
          >
            Experience area
          </Text>

          <View
            style={
              styles.chipWrap
            }
          >
            {EXPERIENCE_TYPES.map(
              (item) => {
                const selected =
                  data.experienceType ===
                  item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      update(
                        'experienceType',
                        item,
                      )
                    }
                    style={[
                      styles.chip,
                      selected &&
                        styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>

          <Text
            style={
              styles.fieldLabel
            }
          >
            How long?
          </Text>

          <View
            style={
              styles.chipWrap
            }
          >
            {EXPERIENCE_LENGTHS.map(
              (item) => {
                const selected =
                  data.experienceLength ===
                  item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      update(
                        'experienceLength',
                        item,
                      )
                    }
                    style={[
                      styles.chip,
                      selected &&
                        styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
        </>
      )}

      <Field
        label={
          data.experience ===
          'Yes'
            ? 'Tell us briefly about your experience'
            : 'Tell us about your experience level'
        }
        value={
          data.experienceDescription
        }
        onChangeText={(value) =>
          update(
            'experienceDescription',
            value,
          )
        }
        placeholder={
          data.experience ===
          'Yes'
            ? 'Describe your real-estate experience...'
            : 'For example: I am new to real estate but I have strong local knowledge and know property owners in my area.'
        }
        multiline
      />

      <Text
        style={styles.fieldLabel}
      >
        Current occupation
      </Text>

      <View
        style={styles.chipWrap}
      >
        {OCCUPATIONS.map(
          (item) => {
            const selected =
              data.occupation ===
              item;

            return (
              <Pressable
                key={item}
                onPress={() =>
                  update(
                    'occupation',
                    item,
                  )
                }
                style={[
                  styles.chip,
                  selected &&
                    styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <Question
        label="Are you currently working with another real-estate company or agency?"
        options={['Yes', 'No']}
        value={
          data.workingWithAgency
        }
        onChange={(value) =>
          update(
            'workingWithAgency',
            value as
              | 'Yes'
              | 'No',
          )
        }
      />

      {data.workingWithAgency ===
        'Yes' && (
        <Field
          label="Company / agency name"
          value={data.agencyName}
          onChangeText={(value) =>
            update(
              'agencyName',
              value,
            )
          }
          placeholder="Enter company or agency"
        />
      )}

      <Field
        label="Why do you want to become a MAKAZII marketer?"
        value={data.motivation}
        onChangeText={(value) =>
          update(
            'motivation',
            value,
          )
        }
        placeholder="Tell us what motivates you..."
        multiline
      />

      <Field
        label="What do you believe you can contribute to MAKAZII?"
        value={data.contribution}
        onChangeText={(value) =>
          update(
            'contribution',
            value,
          )
        }
        placeholder="Tell us what you can bring..."
        multiline
      />

      <Text
        style={styles.fieldLabel}
      >
        How many properties do you
        expect to source per month?
      </Text>

      <View
        style={styles.chipWrap}
      >
        {PROPERTY_RANGES.map(
          (item) => {
            const selected =
              data.propertiesPerMonth ===
              item;

            return (
              <Pressable
                key={item}
                onPress={() =>
                  update(
                    'propertiesPerMonth',
                    item,
                  )
                }
                style={[
                  styles.chip,
                  selected &&
                    styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <Text
        style={styles.fieldLabel}
      >
        How do you find available
        rentals?
      </Text>

      <View
        style={styles.chipWrap}
      >
        {SOURCING_METHODS.map(
          (item) => {
            const selected =
              data.sourcingMethods.includes(
                item,
              );

            return (
              <Pressable
                key={item}
                onPress={() =>
                  toggleArrayValue(
                    'sourcingMethods',
                    item,
                  )
                }
                style={[
                  styles.chip,
                  selected &&
                    styles.chipSelected,
                ]}
              >
                {selected && (
                  <Check
                    size={13}
                    color={
                      COLORS.background
                    }
                    strokeWidth={3}
                  />
                )}

                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <Question
        label="Do you know landlords or property owners in your selected places?"
        options={['Yes', 'No']}
        value={
          data.knowsLandlords
        }
        onChange={(value) =>
          update(
            'knowsLandlords',
            value as
              | 'Yes'
              | 'No',
          )
        }
      />

      {data.knowsLandlords ===
        'Yes' && (
        <Field
          label="Approximately how many?"
          value={
            data.landlordNetwork
          }
          onChangeText={(value) =>
            update(
              'landlordNetwork',
              value.replace(
                /[^\d]/g,
                '',
              ),
            )
          }
          placeholder="e.g. 10"
          keyboardType="numeric"
        />
      )}

      <Question
        label="Are you comfortable communicating directly with renters and landlords?"
        options={['Yes', 'No']}
        value={
          data.comfortableCommunication
        }
        onChange={(value) =>
          update(
            'comfortableCommunication',
            value as
              | 'Yes'
              | 'No',
          )
        }
      />

      <Text
        style={styles.fieldLabel}
      >
        Preferred communication
        methods
      </Text>

      <View
        style={styles.chipWrap}
      >
        {COMMUNICATION_METHODS.map(
          (item) => {
            const selected =
              data.communicationMethods.includes(
                item,
              );

            return (
              <Pressable
                key={item}
                onPress={() =>
                  toggleArrayValue(
                    'communicationMethods',
                    item,
                  )
                }
                style={[
                  styles.chip,
                  selected &&
                    styles.chipSelected,
                ]}
              >
                {selected && (
                  <Check
                    size={13}
                    color={
                      COLORS.background
                    }
                    strokeWidth={3}
                  />
                )}

                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <Text
        style={styles.fieldLabel}
      >
        How much time can you
        dedicate?
      </Text>

      <View
        style={styles.chipWrap}
      >
        {AVAILABILITY_OPTIONS.map(
          (item) => {
            const selected =
              data.availability ===
              item;

            return (
              <Pressable
                key={item}
                onPress={() =>
                  update(
                    'availability',
                    item,
                  )
                }
                style={[
                  styles.chip,
                  selected &&
                    styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected &&
                      styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <Question
        label="Are you willing to follow MAKAZII property verification and customer-service procedures?"
        options={['Yes', 'No']}
        value={
          data.followsProcedures
        }
        onChange={(value) =>
          update(
            'followsProcedures',
            value as
              | 'Yes'
              | 'No',
          )
        }
      />

      <View
        style={styles.referenceHeader}
      >
        <Text
          style={styles.referenceTitle}
        >
          Reference
        </Text>

        <Text
          style={
            styles.referenceDescription
          }
        >
          Provide someone who can
          vouch for your work,
          character, or local
          knowledge. This information
          is required for the
          application review.
        </Text>
      </View>

      <Field
        label="Reference name"
        value={data.referenceName}
        onChangeText={(value) =>
          update(
            'referenceName',
            value,
          )
        }
        placeholder="e.g. John Kamau"
      />

      <Field
        label="Reference phone"
        value={data.referencePhone}
        onChangeText={(value) =>
          update(
            'referencePhone',
            value,
          )
        }
        placeholder="e.g. 0712 345 678"
        keyboardType="phone-pad"
      />

      <Field
        label="Relationship to you"
        value={
          data.referenceRelationship
        }
        onChangeText={(value) =>
          update(
            'referenceRelationship',
            value,
          )
        }
        placeholder="e.g. Former employer"
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* REVIEW                                                                      */
/* -------------------------------------------------------------------------- */

function ReviewStep({
  data,
  update,
}: {
  data: ApplicationData;
  update: <
    K extends keyof ApplicationData
  >(
    key: K,
    value: ApplicationData[K],
  ) => void;
}) {
  return (
    <View>
      <StepHeader
        icon={
          <CheckCircle2
            size={22}
            color={COLORS.lime}
          />
        }
        eyebrow="STEP 5"
        title="Review your application"
        description="Check your information before submitting your application to MAKAZII."
      />

      <ReviewSection title="Personal details">
        <ReviewRow
          label="Name"
          value={`${data.firstName} ${data.lastName}`}
        />

        <ReviewRow
          label="Phone"
          value={data.phone}
        />

        <ReviewRow
          label="Email"
          value={data.email}
        />
      </ReviewSection>

      <ReviewSection title="Identity">
        <ReviewRow
          label="Document"
          value={data.idType}
        />

        <ReviewRow
          label="ID / Passport number"
          value={data.idNumber}
        />

        <ReviewRow
          label="Front / identification image"
          value={
            data.idFront
              ? 'Provided'
              : 'Missing'
          }
        />

        {data.idType ===
          'National ID' && (
          <ReviewRow
            label="Back image"
            value={
              data.idBack
                ? 'Provided'
                : 'Missing'
            }
          />
        )}
      </ReviewSection>

      <ReviewSection title="Location">
        <ReviewRow
          label="County"
          value={
            data.county ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Constituency"
          value={
            data.constituency ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Wards"
          value={
            data.wardNames.length
              ? data.wardNames.join(
                  ', ',
                )
              : 'Not provided'
          }
        />

        <ReviewRow
          label="Time in selected areas"
          value={
            data.timeInSelectedAreas ||
            'Not provided'
          }
        />
      </ReviewSection>

      <ReviewSection title="Experience">
        <ReviewRow
          label="Real-estate experience"
          value={
            data.experience ||
            'Not provided'
          }
        />

        {data.experience ===
          'Yes' && (
          <>
            <ReviewRow
              label="Experience area"
              value={
                data.experienceType ||
                'Not provided'
              }
            />

            <ReviewRow
              label="Experience length"
              value={
                data.experienceLength ||
                'Not provided'
              }
            />
          </>
        )}

        {data.experience ===
          'No' && (
          <ReviewRow
            label="Experience length"
            value={
              data.experienceLength ||
              'Not provided'
            }
          />
        )}

        <ReviewRow
          label="Experience description"
          value={
            data.experienceDescription ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Occupation"
          value={
            data.occupation ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Properties / month"
          value={
            data.propertiesPerMonth ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Sourcing methods"
          value={
            data.sourcingMethods
              .length
              ? data.sourcingMethods.join(
                  ', ',
                )
              : 'Not provided'
          }
        />

        <ReviewRow
          label="Landlord connections"
          value={
            data.knowsLandlords ||
            'Not provided'
          }
        />

        {data.knowsLandlords ===
          'Yes' && (
          <ReviewRow
            label="Approximate landlords"
            value={
              data.landlordNetwork ||
              'Not provided'
            }
          />
        )}

        <ReviewRow
          label="Communication"
          value={
            data.comfortableCommunication ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Communication methods"
          value={
            data.communicationMethods
              .length
              ? data.communicationMethods.join(
                  ', ',
                )
              : 'Not provided'
          }
        />

        <ReviewRow
          label="Availability"
          value={
            data.availability ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Follow procedures"
          value={
            data.followsProcedures ||
            'Not provided'
          }
        />
      </ReviewSection>

      <ReviewSection title="Reference">
        <ReviewRow
          label="Name"
          value={
            data.referenceName ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Phone"
          value={
            data.referencePhone ||
            'Not provided'
          }
        />

        <ReviewRow
          label="Relationship"
          value={
            data.referenceRelationship ||
            'Not provided'
          }
        />
      </ReviewSection>

      <Pressable
        onPress={() =>
          update(
            'declaration',
            !data.declaration,
          )
        }
        style={
          styles.declarationRow
        }
      >
        <View
          style={[
            styles.checkbox,
            data.declaration &&
              styles.checkboxSelected,
          ]}
        >
          {data.declaration && (
            <Check
              size={15}
              color={
                COLORS.background
              }
              strokeWidth={3}
            />
          )}
        </View>

        <Text
          style={
            styles.declarationText
          }
        >
          I confirm that the
          information I have provided
          is accurate, the
          identification document
          belongs to me, and I
          understand that my
          application must be reviewed
          before I receive marketer
          portal access.
        </Text>
      </Pressable>

      <InfoCard
        icon={
          <ShieldCheck
            size={19}
            color={COLORS.lime}
          />
        }
        title="What happens next?"
        text="Your application will be submitted for administrator review. After submission, you can track its status from the application status screen. You will receive marketer portal access only after approval."
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* REUSABLE COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */

function StepHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={styles.stepHeader}
    >
      <View
        style={
          styles.stepHeaderIcon
        }
      >
        {icon}
      </View>

      <Text
        style={styles.stepEyebrow}
      >
        {eyebrow}
      </Text>

      <Text
        style={
          styles.stepTitleMain
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.stepDescriptionMain
        }
      >
        {description}
      </Text>
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
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string,
  ) => void;
  placeholder: string;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad'
    | 'numeric';
  multiline?: boolean;
  autoCapitalize?:
    | 'none'
    | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text
        style={styles.fieldLabel}
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
        placeholderTextColor="#687173"
        keyboardType={
          keyboardType
        }
        multiline={multiline}
        autoCapitalize={
          autoCapitalize
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceButton,
        selected &&
          styles.choiceButtonSelected,
      ]}
    >
      <View
        style={[
          styles.radio,
          selected &&
            styles.radioSelected,
        ]}
      >
        {selected && (
          <View
            style={
              styles.radioDot
            }
          />
        )}
      </View>

      <Text
        style={[
          styles.choiceText,
          selected &&
            styles.choiceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Question({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <View
      style={styles.question}
    >
      <Text
        style={styles.fieldLabel}
      >
        {label}
      </Text>

      <View
        style={styles.choiceRow}
      >
        {options.map(
          (option) => (
            <ChoiceButton
              key={option}
              label={option}
              selected={
                value ===
                option
              }
              onPress={() =>
                onChange(
                  option,
                )
              }
            />
          ),
        )}
      </View>
    </View>
  );
}

function DocumentUpload({
  title,
  image,
  onTakePicture,
  onPickGallery,
  onRemove,
}: {
  title: string;
  image: string | null;
  onTakePicture: () => void;
  onPickGallery: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={styles.documentCard}
    >
      <Text
        style={
          styles.documentTitle
        }
      >
        {title}
      </Text>

      {image ? (
        <View
          style={
            styles.imagePreviewWrap
          }
        >
          <Image
            source={{
              uri: image,
            }}
            style={
              styles.documentImage
            }
            resizeMode="cover"
          />

          <Pressable
            onPress={onRemove}
            style={
              styles.removeImageButton
            }
          >
            <X
              size={17}
              color={
                COLORS.white
              }
            />
          </Pressable>

          <View
            style={
              styles.imageProvidedBadge
            }
          >
            <CheckCircle2
              size={14}
              color={
                COLORS.background
              }
            />

            <Text
              style={
                styles.imageProvidedText
              }
            >
              Image added
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={
            styles.emptyDocument
          }
        >
          <ImagePlus
            size={27}
            color={
              COLORS.muted
            }
            strokeWidth={1.7}
          />

          <Text
            style={
              styles.emptyDocumentTitle
            }
          >
            No image added
          </Text>

          <Text
            style={
              styles.emptyDocumentText
            }
          >
            Take a clear picture
            or select one from
            your gallery.
          </Text>
        </View>
      )}

      <View
        style={
          styles.documentActions
        }
      >
        <Pressable
          onPress={
            onTakePicture
          }
          style={
            styles.documentAction
          }
        >
          <Camera
            size={18}
            color={
              COLORS.lime
            }
            strokeWidth={2}
          />

          <Text
            style={
              styles.documentActionText
            }
          >
            {image
              ? 'Take again'
              : 'Take a picture'}
          </Text>
        </Pressable>

        <Pressable
          onPress={
            onPickGallery
          }
          style={
            styles.documentAction
          }
        >
          <ImagePlus
            size={18}
            color={
              COLORS.lime
            }
            strokeWidth={2}
          />

          <Text
            style={
              styles.documentActionText
            }
          >
            {image
              ? 'Choose another'
              : 'Gallery'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View
      style={styles.infoCard}
    >
      <View
        style={styles.infoIcon}
      >
        {icon}
      </View>

      <View
        style={
          styles.infoContent
        }
      >
        <Text
          style={styles.infoTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.infoText}
        >
          {text}
        </Text>
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
    <View
      style={
        styles.reviewSection
      }
    >
      <Text
        style={
          styles.reviewSectionTitle
        }
      >
        {title}
      </Text>

      <View
        style={styles.reviewCard}
      >
        {children}
      </View>
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
    <View
      style={styles.reviewRow}
    >
      <Text
        style={
          styles.reviewLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.reviewValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  topBar: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  pressed: {
    opacity: 0.7,
  },

  brandWrap: {
    flex: 1,
    marginLeft: 12,
  },

  brand: {
    color: COLORS.lime,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  brandLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 2,
  },

  stepCounter: {
    color: COLORS.white,
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
    backgroundColor:
      COLORS.cardSoft,
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor:
      COLORS.lime,
    borderRadius: 999,
  },

  stepLabels: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    marginTop: 9,
  },

  stepLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  stepLabelActive: {
    color: COLORS.lime,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 120,
  },

  stepHeader: {
    marginBottom: 24,
  },

  stepHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  stepEyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 6,
  },

  stepTitleMain: {
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  stepDescriptionMain: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },

  field: {
    marginBottom: 17,
  },

  fieldLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    color: COLORS.white,
    paddingHorizontal: 15,
    fontSize: 14,
  },

  multilineInput: {
    minHeight: 115,
    paddingTop: 14,
    textAlignVertical:
      'top',
  },

  choiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  choiceButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
  },

  choiceButtonSelected: {
    borderColor:
      COLORS.lime,
    backgroundColor:
      '#20271A',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor:
      COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  radioSelected: {
    borderColor:
      COLORS.lime,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      COLORS.lime,
  },

  choiceText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  choiceTextSelected: {
    color: COLORS.white,
  },

  selectorButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 17,
  },

  selectorDisabled: {
    opacity: 0.7,
  },

  selectorTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },

  selectorText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },

  selectorPlaceholder: {
    color: COLORS.muted,
    fontWeight: '600',
  },

  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },

  chip: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  chipSelected: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  chipText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  chipTextSelected: {
    color: COLORS.background,
  },

  selectionCount: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: -9,
    marginBottom: 18,
  },

  loadingRow: {
    minHeight: 60,
    borderRadius: 14,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  emptyLocationCard: {
    borderRadius: 14,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: 15,
    marginBottom: 18,
  },

  emptyLocationText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },

  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    marginTop: 5,
    marginBottom: 18,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.card,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },

  infoText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  documentCard: {
    borderRadius: 17,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: 14,
    marginBottom: 17,
  },

  documentTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
  },

  emptyDocument: {
    minHeight: 145,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  emptyDocumentTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 9,
  },

  emptyDocumentText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 240,
  },

  imagePreviewWrap: {
    height: 190,
    borderRadius: 13,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor:
      COLORS.background,
  },

  documentImage: {
    width: '100%',
    height: '100%',
  },

  removeImageButton: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(0,0,0,0.7)',
  },

  imageProvidedBadge: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  imageProvidedText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },

  documentActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },

  documentAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  documentActionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  question: {
    marginBottom: 6,
  },

  referenceHeader: {
    marginTop: 6,
    marginBottom: 14,
    padding: 15,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  referenceTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },

  referenceDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  reviewSection: {
    marginBottom: 17,
  },

  reviewSectionTitle: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  reviewCard: {
    borderRadius: 16,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    overflow: 'hidden',
  },

  reviewRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },

  reviewLabel: {
    width: 125,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
  },

  reviewValue: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'right',
  },

  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 15,
    borderRadius: 16,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 15,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor:
      COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  checkboxSelected: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  declarationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor:
      COLORS.background,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  nextButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor:
      COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  nextButtonPressed: {
    opacity: 0.82,
  },

  disabledButton: {
    opacity: 0.55,
  },

  nextButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    maxHeight: '82%',
    backgroundColor:
      COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 25,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalList: {
    paddingBottom: 10,
    gap: 8,
  },

  modalOption: {
    minHeight: 50,
    paddingHorizontal: 14,
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
  },

  modalOptionSelected: {
    borderColor:
      COLORS.lime,
  },

  modalOptionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  modalOptionTextSelected: {
    color: COLORS.lime,
  },
});