import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  ShieldCheck,
  User,
  Wallet,
  X,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
  green: '#62D39B',
  greenSoft: '#183128',
  orange: '#FFB45B',
  orangeSoft: '#342818',
};

type BackendImage = {
  id: string;
  url: string;
  altText?: string | null;
  category?: string | null;
  sortOrder?: number | null;
  isPrimary?: boolean;
};

type BackendAmenity = {
  id: string;
  name: string;
  category?: string | null;
};

type BackendProperty = {
  id: string;
  title: string;
  description?: string | null;

  purpose: 'LONG_STAY' | 'SHORT_STAY';
  longStayType?: string | null;
  shortStayType?: string | null;

  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  serviceCharge?: number | null;

  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;
  stayMode?: string | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  maxGuests?: number | null;
  rooms?: number | null;
  furnishing?: string | null;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  place?: {
    id: string;
    name: string;
  } | null;

  latitude?: number | null;
  longitude?: number | null;

  available: boolean;
  verified: boolean;

  images?: BackendImage[];
  amenities?: BackendAmenity[];
};

type PropertyResponse = {
  success: boolean;
  message?: string;
  data?: BackendProperty;
};

type RequestType =
  | 'view_only'
  | 'view_and_rent';

type ViewingResponse = {
  success: boolean;
  message?: string;
  data?: {
    viewing?: {
      id: string;
      status?: string;
    };
  };
};

type PaymentResponse = {
  success: boolean;
  message?: string;
  data?: {
    payment?: {
      id?: string | null;
      reference?: string | null;
      status?: string | null;
      amount?: number | null;
    };
  };
};

function formatCurrency(
  amount: number | null | undefined,
): string {
  if (
    amount == null ||
    Number.isNaN(Number(amount))
  ) {
    return 'KSh 0';
  }

  return `KSh ${Number(amount).toLocaleString()}`;
}

function getPropertyLocation(
  property: BackendProperty,
): string {
  const parts = [
    property.area,
    property.town,
    property.county,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return property.place?.name || 'Kenya';
}

function getPropertyImage(
  property: BackendProperty,
): string {
  const images = [
    ...(property.images ?? []),
  ].sort(
    (a, b) =>
      (a.sortOrder ?? 0) -
      (b.sortOrder ?? 0),
  );

  const primary =
    images.find(
      (image) => image.isPrimary,
    ) ?? images[0];

  return primary?.url ?? '';
}

function getPropertyType(
  property: BackendProperty,
): string {
  const raw =
    property.purpose === 'LONG_STAY'
      ? property.longStayType
      : property.shortStayType;

  if (!raw) {
    return property.purpose === 'LONG_STAY'
      ? 'Long Stay'
      : 'Short Stay';
  }

  return raw
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDateForDisplay(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'en-KE',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Nairobi',
    },
  ).format(date);
}

function toDateKey(date: Date): string {
  const year = new Intl.DateTimeFormat(
    'en-KE',
    {
      year: 'numeric',
      timeZone: 'Africa/Nairobi',
    },
  ).format(date);

  const month = new Intl.DateTimeFormat(
    'en-KE',
    {
      month: '2-digit',
      timeZone: 'Africa/Nairobi',
    },
  ).format(date);

  const day = new Intl.DateTimeFormat(
    'en-KE',
    {
      day: '2-digit',
      timeZone: 'Africa/Nairobi',
    },
  ).format(date);

  return `${year}-${month}-${day}`;
}

function getKenyaToday(): Date {
  const now = new Date();

  const kenyaString =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Africa/Nairobi',
      },
    ).format(now);

  return new Date(
    `${kenyaString}T00:00:00+03:00`,
  );
}

function getAvailableDates(): {
  label: string;
  dateKey: string;
  date: Date;
}[] {
  const today = getKenyaToday();

  return Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(
        today.getTime() +
          index * 24 * 60 * 60 * 1000,
      );

      const dateKey = toDateKey(date);

      let label = new Intl.DateTimeFormat(
        'en-KE',
        {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          timeZone: 'Africa/Nairobi',
        },
      ).format(date);

      if (index === 0) {
        label = 'Today';
      } else if (index === 1) {
        label = 'Tomorrow';
      }

      return {
        label,
        dateKey,
        date,
      };
    },
  );
}

const VIEWING_TIMES = [
  '09:00',
  '10:30',
  '12:00',
  '14:00',
  '16:00',
];

function formatTimeForDisplay(
  time: string,
): string {
  const [hourString, minute] =
    time.split(':');

  const hour = Number(hourString);

  if (hour === 0) {
    return `12:${minute} AM`;
  }

  if (hour < 12) {
    return `${hour}:${minute} AM`;
  }

  if (hour === 12) {
    return `12:${minute} PM`;
  }

  return `${hour - 12}:${minute} PM`;
}

function isFutureViewingSlot(
  dateKey: string,
  time: string,
): boolean {
  const requested = new Date(
    `${dateKey}T${time}:00+03:00`,
  );

  return (
    requested.getTime() >
    Date.now() + 5 * 60 * 1000
  );
}

function MpesaMark({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <View
      style={[
        styles.mpesaMark,
        small &&
          styles.mpesaMarkSmall,
      ]}
    >
      <Text
        style={[
          styles.mpesaMarkText,
          small &&
            styles.mpesaMarkTextSmall,
        ]}
      >
        M-PESA
      </Text>
    </View>
  );
}

function PropertySummary({
  property,
}: {
  property: BackendProperty;
}) {
  const image =
    getPropertyImage(property);

  const location =
    getPropertyLocation(property);

  return (
    <View style={styles.propertyCard}>
      <View
        style={
          styles.propertyImageContainer
        }
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.propertyImageFallback
            }
          >
            <Home
              size={28}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>
        )}

        {property.verified && (
          <View
            style={
              styles.propertyVerifiedBadge
            }
          >
            <ShieldCheck
              size={13}
              color={COLORS.background}
              strokeWidth={2.3}
            />

            <Text
              style={
                styles.propertyVerifiedText
              }
            >
              VERIFIED
            </Text>
          </View>
        )}
      </View>

      <View
        style={
          styles.propertyInformation
        }
      >
        <Text style={styles.propertyType}>
          {getPropertyType(property)}
        </Text>

        <Text
          style={styles.propertyTitle}
          numberOfLines={2}
        >
          {property.title}
        </Text>

        <View
          style={styles.propertyLocation}
        >
          <MapPin
            size={14}
            color={COLORS.lime}
            strokeWidth={2}
          />

          <Text
            style={
              styles.propertyLocationText
            }
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>

        <View
          style={styles.propertyPriceRow}
        >
          <Text
            style={styles.propertyRent}
          >
            {formatCurrency(
              property.monthlyRent,
            )}
          </Text>

          <Text
            style={
              styles.propertyPerMonth
            }
          >
            / month
          </Text>
        </View>
      </View>
    </View>
  );
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {children}

      {required && (
        <Text style={styles.required}>
          {' '}
          *
        </Text>
      )}
    </Text>
  );
}

export default function ViewingScreen(): React.JSX.Element {
  const params =
    useLocalSearchParams<{
      propertyId?:
        | string
        | string[];
    }>();

  const propertyId = Array.isArray(
    params.propertyId,
  )
    ? params.propertyId[0]
    : params.propertyId;

  const [
    property,
    setProperty,
  ] =
    useState<BackendProperty | null>(
      null,
    );

  const [
    loadingProperty,
    setLoadingProperty,
  ] = useState(true);

  const [
    propertyError,
    setPropertyError,
  ] = useState('');

  const [
    name,
    setName,
  ] = useState('');

  const [
    phone,
    setPhone,
  ] = useState('');

  const [
    selectedDate,
    setSelectedDate,
  ] = useState('');

  const [
    selectedTime,
    setSelectedTime,
  ] = useState('');

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    showTimes,
    setShowTimes,
  ] = useState(false);

  const [
    requestType,
    setRequestType,
  ] =
    useState<RequestType>(
      'view_only',
    );

  const [
    showPayment,
    setShowPayment,
  ] = useState(false);

  const [
    processingPayment,
    setProcessingPayment,
  ] = useState(false);

  const [
    mpesaPhone,
    setMpesaPhone,
  ] = useState('');

  const [
    ,
    setViewingId,
  ] = useState<string | null>(
    null,
  );

  const [
    paymentReference,
    setPaymentReference,
  ] = useState<string | null>(
    null,
  );

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const dates = useMemo(
    () => getAvailableDates(),
    [],
  );

  const viewingFee =
    property?.viewingFee ?? 0;

  const totalAmount =
    viewingFee;

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      if (!propertyId) {
        setPropertyError(
          'Property ID is missing.',
        );
        setLoadingProperty(false);
        return;
      }

      try {
        setLoadingProperty(true);
        setPropertyError('');

        const response =
          await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.propertyById(
              propertyId,
            )}`,
          );

        const payload: PropertyResponse =
          await response.json();

        if (
          !response.ok ||
          !payload.success ||
          !payload.data
        ) {
          throw new Error(
            payload.message ||
              'Property not found.',
          );
        }

        if (!cancelled) {
          setProperty(
            payload.data,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPropertyError(
            error instanceof Error
              ? error.message
              : 'Failed to load property.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProperty(
            false,
          );
        }
      }
    }

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const isFormValid =
    name.trim().length >= 2 &&
    phone.trim().length >= 9 &&
    selectedDate.length > 0 &&
    selectedTime.length > 0;

  const requestTypeLabel =
    requestType === 'view_only'
      ? 'View Only'
      : 'View & Rent';

  const validateForm =
    (): boolean => {
      if (!property) {
        Alert.alert(
          'Property unavailable',
          'We could not find the property you selected.',
        );
        return false;
      }

      if (
        property.purpose !==
        'LONG_STAY'
      ) {
        Alert.alert(
          'Not available here',
          'Short-stay properties use the inspection and booking workflow.',
        );
        return false;
      }

      if (
        name.trim().length < 2
      ) {
        Alert.alert(
          'Name required',
          'Please enter your full name.',
        );
        return false;
      }

      if (
        phone.trim().length < 9
      ) {
        Alert.alert(
          'Phone number required',
          'Please enter a valid Kenyan phone number.',
        );
        return false;
      }

      if (!selectedDate) {
        Alert.alert(
          'Choose a date',
          'Please select your preferred viewing date.',
        );
        return false;
      }

      if (!selectedTime) {
        Alert.alert(
          'Choose a time',
          'Please select your preferred viewing time.',
        );
        return false;
      }

      if (
        !isFutureViewingSlot(
          selectedDate,
          selectedTime,
        )
      ) {
        Alert.alert(
          'Choose a future time',
          'Please select a viewing time that is still in the future.',
        );
        return false;
      }

      if (
        viewingFee <= 0
      ) {
        Alert.alert(
          'Viewing fee unavailable',
          'This property does not currently have a valid viewing fee.',
        );
        return false;
      }

      return true;
    };

  const handleContinueToPayment =
    () => {
      if (!validateForm()) {
        return;
      }

      setMpesaPhone(
        phone.trim(),
      );
      setShowPayment(true);
    };

  const normalizeMpesaPhone = (): string | null => {
    const digits = mpesaPhone.replace(/\D/g, '');

    let nationalPhone = digits;

    if (digits.startsWith('254')) {
      nationalPhone = digits.slice(3);
    } else if (digits.startsWith('0')) {
      nationalPhone = digits.slice(1);
    }

    if (!/^[17]\d{8}$/.test(nationalPhone)) {
      return null;
    }

    return `254${nationalPhone}`;
  };

  const validateMpesaPayment = (): boolean => {
    if (!normalizeMpesaPhone()) {
      Alert.alert(
        'Valid M-PESA number required',
        'Enter a valid Kenyan Safaricom-compatible mobile number, for example 712 345 678 or 0712 345 678.',
      );
      return false;
    }

    return true;
  };

  const handleMpesaPayment =
    async () => {
      if (!property) {
        return;
      }

      if (!validateMpesaPayment()) {
        return;
      }

      setProcessingPayment(true);

      try {
        const token =
          await SecureStore.getItemAsync(
            'makazii_customer_token',
          );

        if (!token) {
          setProcessingPayment(false);

          Alert.alert(
            'Login required',
            'Please log in to your MAKAZII account before requesting a viewing.',
            [
              {
                text: 'Log in',
                onPress: () =>
                  router.replace(
                    '/onboarding/customer/login',
                  ),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ],
          );

          return;
        }

        const requestedDate =
          selectedDate;

        const preferredTime =
          selectedTime;

        /*
         * 1. Create the viewing request.
         *
         * Backend status:
         * PENDING_PAYMENT
         */
        const viewingResponse =
          await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.customerViewings}`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                propertyId:
                  property.id,
                requestedDate,
                preferredTime,
                notes:
                  notes.trim() ||
                  undefined,
              }),
            },
          );

        const viewingPayload =
          (await viewingResponse.json()) as ViewingResponse;

        if (
          !viewingResponse.ok ||
          !viewingPayload.success ||
          !viewingPayload.data
            ?.viewing?.id
        ) {
          throw new Error(
            viewingPayload.message ||
              'We could not create the viewing request.',
          );
        }

        const createdViewingId =
          viewingPayload.data
            .viewing.id;

        setViewingId(
          createdViewingId,
        );

        /*
         * Safaricom must receive the customer's actual phone number.
         * A successful STK request is not proof that money was paid.
         */
        const normalizedPhone = normalizeMpesaPhone();

        if (!normalizedPhone) {
          throw new Error('Enter a valid Kenyan M-Pesa phone number.');
        }

        const paymentResponse =
          await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.initiateViewingPayment(
              createdViewingId,
            )}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                method: 'MPESA',
                phoneNumber: normalizedPhone,
              }),
            },
          );

        const paymentPayload =
          (await paymentResponse.json()) as PaymentResponse;

        if (
          !paymentResponse.ok ||
          !paymentPayload.success ||
          !paymentPayload.data?.payment
        ) {
          throw new Error(
            paymentPayload.message ||
              'Safaricom could not initiate the M-Pesa payment.',
          );
        }

        const payment = paymentPayload.data.payment;

        if (!payment.id) {
          throw new Error(
            'The payment was created but its status reference was missing. Do not start another payment; contact support.',
          );
        }

        setPaymentReference(payment.reference ?? null);

        /*
         * Wait for the backend to receive and process Safaricom's
         * callback. Never confirm payment from the STK response alone.
         *
         * 30 checks x 3 seconds = approximately 90 seconds.
         */
        let paymentSucceeded = payment.status === 'SUCCESS';

        for (
          let attempt = 0;
          attempt < 30 && !paymentSucceeded;
          attempt += 1
        ) {
          await new Promise<void>((resolve) =>
            setTimeout(resolve, 3000),
          );

          const statusResponse = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.customerPaymentStatus(
              payment.id,
            )}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const statusPayload =
            (await statusResponse.json()) as PaymentResponse;

          if (
            !statusResponse.ok ||
            !statusPayload.success ||
            !statusPayload.data?.payment
          ) {
            throw new Error(
              statusPayload.message ||
                'We could not verify the payment status. Do not pay again; check your Visits screen or contact support.',
            );
          }

          const paymentStatus =
            statusPayload.data.payment.status?.toUpperCase();

          if (paymentStatus === 'SUCCESS') {
            paymentSucceeded = true;
            break;
          }

          if (
            paymentStatus === 'FAILED' ||
            paymentStatus === 'CANCELLED' ||
            paymentStatus === 'EXPIRED'
          ) {
            throw new Error(
              'Safaricom did not complete this payment. Check your M-Pesa messages before trying again.',
            );
          }
        }

        if (!paymentSucceeded) {
          setProcessingPayment(false);
          setShowPayment(false);

          Alert.alert(
            'Payment confirmation pending',
            'The M-Pesa request was sent, but confirmation has not arrived yet. Do not pay again. Check your M-Pesa messages and the Visits screen before taking further action.',
          );

          return;
        }

        // Only a backend-confirmed SUCCESS reaches the receipt screen.
        setProcessingPayment(false);
        setShowPayment(false);
        setSubmitted(true);
      } catch (error) {
        setProcessingPayment(
          false,
        );

        Alert.alert(
          'Payment could not be completed',
          error instanceof Error
            ? error.message
            : 'Something went wrong while processing your viewing payment.',
        );
      }
    };


  if (loadingProperty) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <View
          style={styles.loadingScreen}
        >
          <ActivityIndicator
            size="large"
            color={COLORS.lime}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading property...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <View
          style={styles.notFoundContainer}
        >
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
              strokeWidth={2.2}
            />
          </Pressable>

          <View
            style={
              styles.notFoundContent
            }
          >
            <View
              style={
                styles.notFoundIcon
              }
            >
              <Home
                size={30}
                color={COLORS.lime}
                strokeWidth={2}
              />
            </View>

            <Text
              style={
                styles.notFoundTitle
              }
            >
              Property unavailable
            </Text>

            <Text
              style={
                styles.notFoundDescription
              }
            >
              {propertyError ||
                'We could not find the home you selected.'}
            </Text>

            <Pressable
              style={
                styles.browseButton
              }
              onPress={() =>
                router.replace(
                  '/search',
                )
              }
            >
              <Text
                style={
                  styles.browseButtonText
                }
              >
                Browse homes
              </Text>

              <ChevronRight
                size={18}
                color={
                  COLORS.background
                }
                strokeWidth={2.5}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    const image =
      getPropertyImage(
        property,
      );

    const selectedDateObject =
      dates.find(
        (item) =>
          item.dateKey ===
          selectedDate,
      );

    const displayDate =
      selectedDateObject
        ? formatDateForDisplay(
            selectedDateObject.date,
          )
        : selectedDate;

    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <View
          style={
            styles.successContainer
          }
        >
          <View
            style={
              styles.successTopBar
            }
          >
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.replace(
                  '/home',
                )
              }
            >
              <ArrowLeft
                size={21}
                color={COLORS.white}
                strokeWidth={2.2}
              />
            </Pressable>

            <Text
              style={
                styles.successHeader
              }
            >
              MAKAZII
            </Text>

            <View
              style={
                styles.headerSpacer
              }
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.successScrollContent
            }
          >
            <View
              style={
                styles.successContent
              }
            >
              <View
                style={
                  styles.successIcon
                }
              >
                <Check
                  size={38}
                  color={
                    COLORS.background
                  }
                  strokeWidth={3}
                />
              </View>

              <Text
                style={
                  styles.successEyebrow
                }
              >
                PAYMENT RECEIVED
              </Text>

              <Text
                style={
                  styles.successTitle
                }
              >
                Your viewing request has been submitted.
              </Text>

              <Text
                style={
                  styles.successDescription
                }
              >
                Thanks, {name.trim()}.
                Your viewing request
                has been created and
                your M-PESA payment
                is now awaiting
                confirmation. Once
                payment is confirmed,
                MAKAZII will review
                the request.
              </Text>

              <View
                style={
                  styles.successReceiptCard
                }
              >
                <View
                  style={
                    styles.successReceiptHeader
                  }
                >
                  <MpesaMark small />

                  <View
                    style={
                      styles.successReceiptHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.successReceiptLabel
                      }
                    >
                      M-PESA PAYMENT
                    </Text>

                    <Text
                      style={
                        styles.successReceiptStatus
                      }
                    >
                      Payment received
                    </Text>
                  </View>

                  <Check
                    size={18}
                    color={
                      COLORS.green
                    }
                    strokeWidth={2.8}
                  />
                </View>

                <View
                  style={
                    styles.successReceiptDivider
                  }
                />

                <View
                  style={
                    styles.successReceiptAmountRow
                  }
                >
                  <Text
                    style={
                      styles.successReceiptAmountLabel
                    }
                  >
                    Viewing fee
                  </Text>

                  <Text
                    style={
                      styles.successReceiptAmount
                    }
                  >
                    {formatCurrency(
                      totalAmount,
                    )}
                  </Text>
                </View>

                <Text
                  style={
                    styles.successReceiptPhone
                  }
                >
                  M-PESA number:{' '}
                  {mpesaPhone}
                </Text>

                {paymentReference && (
                  <Text
                    style={
                      styles.successReceiptReference
                    }
                  >
                    Reference:{' '}
                    {paymentReference}
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.appointmentCard
                }
              >
                <View
                  style={
                    styles.appointmentIcon
                  }
                >
                  <CalendarDays
                    size={20}
                    color={
                      COLORS.lime
                    }
                  />
                </View>

                <View
                  style={
                    styles.appointmentText
                  }
                >
                  <Text
                    style={
                      styles.appointmentLabel
                    }
                  >
                    REQUESTED VIEWING
                  </Text>

                  <Text
                    style={
                      styles.appointmentDate
                    }
                  >
                    {displayDate}
                  </Text>

                  <Text
                    style={
                      styles.appointmentTime
                    }
                  >
                    {formatTimeForDisplay(
                      selectedTime,
                    )}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.successPropertyCard
                }
              >
                {image ? (
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={
                      styles.successPropertyImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.successPropertyIcon
                    }
                  >
                    <Home
                      size={20}
                      color={
                        COLORS.lime
                      }
                      strokeWidth={2}
                    />
                  </View>
                )}

                <View
                  style={
                    styles.successPropertyText
                  }
                >
                  <Text
                    style={
                      styles.successPropertyTitle
                    }
                    numberOfLines={2}
                  >
                    {property.title}
                  </Text>

                  <Text
                    style={
                      styles.successPropertyLocation
                    }
                  >
                    {getPropertyLocation(
                      property,
                    )}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.nextStepCard
                }
              >
                <ShieldCheck
                  size={20}
                  color={
                    COLORS.lime
                  }
                />

                <View
                  style={
                    styles.nextStepText
                  }
                >
                  <Text
                    style={
                      styles.nextStepTitle
                    }
                  >
                    What happens next?
                  </Text>

                  <Text
                    style={
                      styles.nextStepDescription
                    }
                  >
                    Once your payment is
                    confirmed, MAKAZII
                    will review the
                    request and assign
                    the appropriate
                    representative.
                    The representative&apos;s
                    contact details become
                    available to you after
                    assignment.
                  </Text>
                </View>
              </View>

              <Pressable
                style={
                  styles.visitsButton
                }
                onPress={() =>
                  router.push(
                    '/visits',
                  )
                }
              >
                <Text
                  style={
                    styles.visitsButtonText
                  }
                >
                  Go to My Visits
                </Text>

                <ChevronRight
                  size={18}
                  color={
                    COLORS.background
                  }
                  strokeWidth={2.5}
                />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View
            style={styles.header}
          >
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.back()
              }
            >
              <ArrowLeft
                size={21}
                color={COLORS.white}
                strokeWidth={2.2}
              />
            </Pressable>

            <View
              style={
                styles.headerCenter
              }
            >
              <Text
                style={
                  styles.headerTitle
                }
              >
                Request Viewing
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Choose a time to visit
              </Text>
            </View>

            <View
              style={
                styles.headerSpacer
              }
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.scrollContent
            }
          >
            <PropertySummary
              property={property}
            />

            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Your details
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <User
                  size={18}
                  color={
                    COLORS.muted
                  }
                />

                <TextInput
                  value={name}
                  onChangeText={
                    setName
                  }
                  placeholder="Full name"
                  placeholderTextColor={
                    COLORS.muted
                  }
                  style={
                    styles.input
                  }
                  autoCapitalize="words"
                />
              </View>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Text
                  style={
                    styles.phonePrefix
                  }
                >
                  +254
                </Text>

                <TextInput
                  value={phone}
                  onChangeText={
                    setPhone
                  }
                  placeholder="712 345 678"
                  placeholderTextColor={
                    COLORS.muted
                  }
                  style={
                    styles.input
                  }
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                What do you want to do?
              </Text>

              <View
                style={
                  styles.requestTypeRow
                }
              >
                <Pressable
                  style={[
                    styles.requestTypeCard,
                    requestType ===
                      'view_only' &&
                      styles.requestTypeCardActive,
                  ]}
                  onPress={() =>
                    setRequestType(
                      'view_only',
                    )
                  }
                >
                  <View
                    style={[
                      styles.radio,
                      requestType ===
                        'view_only' &&
                        styles.radioActive,
                    ]}
                  >
                    {requestType ===
                      'view_only' && (
                      <View
                        style={
                          styles.radioDot
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.requestTypeText
                    }
                  >
                    <Text
                      style={
                        styles.requestTypeTitle
                      }
                    >
                      View Only
                    </Text>

                    <Text
                      style={
                        styles.requestTypeDescription
                      }
                    >
                      I just want to see the property.
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[
                    styles.requestTypeCard,
                    requestType ===
                      'view_and_rent' &&
                      styles.requestTypeCardActive,
                  ]}
                  onPress={() =>
                    setRequestType(
                      'view_and_rent',
                    )
                  }
                >
                  <View
                    style={[
                      styles.radio,
                      requestType ===
                        'view_and_rent' &&
                        styles.radioActive,
                    ]}
                  >
                    {requestType ===
                      'view_and_rent' && (
                      <View
                        style={
                          styles.radioDot
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.requestTypeText
                    }
                  >
                    <Text
                      style={
                        styles.requestTypeTitle
                      }
                    >
                      View & Rent
                    </Text>

                    <Text
                      style={
                        styles.requestTypeDescription
                      }
                    >
                      I may proceed with renting.
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeadingRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Choose a date
                  </Text>

                  <Text
                    style={
                      styles.sectionHint
                    }
                  >
                    Select your preferred day.
                  </Text>
                </View>

                <CalendarDays
                  size={20}
                  color={
                    COLORS.lime
                }
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.dateRow
                }
              >
                {dates.map(
                  (item) => {
                    const selected =
                      selectedDate ===
                      item.dateKey;

                    return (
                      <Pressable
                        key={
                          item.dateKey
                        }
                        style={[
                          styles.dateCard,
                          selected &&
                            styles.dateCardActive,
                        ]}
                        onPress={() => {
                          setSelectedDate(
                            item.dateKey,
                          );

                          if (
                            selectedTime &&
                            !isFutureViewingSlot(
                              item.dateKey,
                              selectedTime,
                            )
                          ) {
                            setSelectedTime(
                              '',
                            );
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.dateLabel,
                            selected &&
                              styles.dateLabelActive,
                          ]}
                        >
                          {item.label}
                        </Text>

                        <Text
                          style={[
                            styles.dateValue,
                            selected &&
                              styles.dateValueActive,
                          ]}
                        >
                          {item.date
                            .toLocaleDateString(
                              'en-KE',
                              {
                                day: 'numeric',
                                month: 'short',
                                timeZone:
                                  'Africa/Nairobi',
                              },
                            )}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>
            </View>

            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeadingRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Preferred time
                  </Text>

                  <Text
                    style={
                      styles.sectionHint
                    }
                  >
                    Choose an available time.
                  </Text>
                </View>

                <Clock3
                  size={20}
                  color={
                    COLORS.lime
                  }
                />
              </View>

              <Pressable
                style={
                  styles.timeSelector
                }
                onPress={() =>
                  setShowTimes(
                    !showTimes,
                  )
                }
              >
                <View
                  style={
                    styles.timeSelectorLeft
                  }
                >
                  <Clock3
                    size={18}
                    color={
                      selectedTime
                        ? COLORS.lime
                        : COLORS.muted
                    }
                  />

                  <Text
                    style={[
                      styles.timeSelectorText,
                      !selectedTime &&
                        styles.timeSelectorPlaceholder,
                    ]}
                  >
                    {selectedTime
                      ? formatTimeForDisplay(
                          selectedTime,
                        )
                      : 'Select a time'}
                  </Text>
                </View>

                <ChevronDown
                  size={19}
                  color={
                    COLORS.muted
                  }
                />
              </Pressable>

              {showTimes && (
                <View
                  style={
                    styles.timeList
                  }
                >
                  {VIEWING_TIMES.map(
                    (time) => {
                      const disabled =
                        !selectedDate ||
                        !isFutureViewingSlot(
                          selectedDate,
                          time,
                        );

                      const selected =
                        selectedTime ===
                        time;

                      return (
                        <Pressable
                          key={time}
                          disabled={
                            disabled
                          }
                          style={[
                            styles.timeOption,
                            selected &&
                              styles.timeOptionActive,
                            disabled &&
                              styles.timeOptionDisabled,
                          ]}
                          onPress={() => {
                            setSelectedTime(
                              time,
                            );
                            setShowTimes(
                              false,
                            );
                          }}
                        >
                          <Clock3
                            size={17}
                            color={
                              selected
                                ? COLORS.background
                                : disabled
                                ? '#51595B'
                                : COLORS.muted
                            }
                          />

                          <Text
                            style={[
                              styles.timeOptionText,
                              selected &&
                                styles.timeOptionTextActive,
                              disabled &&
                                styles.timeOptionTextDisabled,
                            ]}
                          >
                            {formatTimeForDisplay(
                              time,
                            )}
                          </Text>

                          {selected && (
                            <Check
                              size={17}
                              color={
                                COLORS.background
                              }
                            />
                          )}
                        </Pressable>
                      );
                    },
                  )}

                  {!selectedDate && (
                    <Text
                      style={
                        styles.timeHelp
                      }
                    >
                      Select a date first.
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View
              style={
                styles.section
              }
            >
              <FieldLabel>
                Notes for MAKAZII
              </FieldLabel>

              <TextInput
                value={notes}
                onChangeText={
                  setNotes
                }
                placeholder="Anything we should know about your visit?"
                placeholderTextColor={
                  COLORS.muted
                }
                style={
                  styles.notesInput
                }
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              <Text
                style={
                  styles.characterCount
                }
              >
                {notes.length}/500
              </Text>
            </View>

            <View
              style={
                styles.feeCard
              }
            >
              <View
                style={
                  styles.feeIcon
                }
              >
                <Wallet
                  size={20}
                  color={
                    COLORS.lime
                  }
                />
              </View>

              <View
                style={
                  styles.feeInformation
                }
              >
                <Text
                  style={
                    styles.feeTitle
                  }
                >
                  Viewing fee
                </Text>

                <Text
                  style={
                    styles.feeDescription
                  }
                >
                  This MAKAZII fee covers
                  coordination and processing of
                  your viewing request. Monthly
                  rent is handled separately.
                </Text>
              </View>

              <Text
                style={
                  styles.feeAmount
                }
              >
                {formatCurrency(
                  viewingFee,
                )}
              </Text>
            </View>

            <View
              style={
                styles.securityNotice
              }
            >
              <ShieldCheck
                size={19}
                color={
                  COLORS.lime
                }
              />

              <Text
                style={
                  styles.securityNoticeText
                }
              >
                MAKAZII controls the
                viewing process. Property
                owner or representative
                contact details are not
                shared until the viewing
                has been assigned.
              </Text>
            </View>

            <View
              style={
                styles.bottomSpace
              }
            />
          </ScrollView>

          <View
            style={
              styles.bottomBar
            }
          >
            <View
              style={
                styles.bottomAmount
              }
            >
              <Text
                style={
                  styles.bottomAmountLabel
                }
              >
                Viewing fee
              </Text>

              <Text
                style={
                  styles.bottomAmountValue
                }
              >
                {formatCurrency(
                  totalAmount,
                )}
              </Text>
            </View>

            <Pressable
              style={[
                styles.continueButton,
                !isFormValid &&
                  styles.continueButtonDisabled,
              ]}
              disabled={
                !isFormValid
              }
              onPress={
                handleContinueToPayment
              }
            >
              <Text
                style={
                  styles.continueButtonText
                }
              >
                Continue to Payment
              </Text>

              <ChevronRight
                size={18}
                color={
                  COLORS.background
                }
                strokeWidth={2.6}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={showPayment}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (
            !processingPayment
          ) {
            setShowPayment(false);
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
              styles.paymentModal
            }
          >
            <View
              style={
                styles.modalHandle
              }
            />

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
                  Pay viewing fee
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {requestTypeLabel}
                </Text>
              </View>

              <Pressable
                style={
                  styles.modalClose
                }
                disabled={
                  processingPayment
                }
                onPress={() =>
                  setShowPayment(
                    false,
                  )
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

            <View
              style={
                styles.paymentAmountCard
              }
            >
              <MpesaMark />

              <View
                style={
                  styles.paymentAmountInformation
                }
              >
                <Text
                  style={
                    styles.paymentAmountLabel
                  }
                >
                  AMOUNT
                </Text>

                <Text
                  style={
                    styles.paymentAmount
                  }
                >
                  {formatCurrency(
                    totalAmount,
                  )}
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.mpesaInputLabel
              }
            >
              M-PESA phone number
            </Text>

            <View
              style={
                styles.mpesaInputContainer
              }
            >
              <Text
                style={
                  styles.mpesaPrefix
                }
              >
                +254
              </Text>

              <TextInput
                value={mpesaPhone}
                onChangeText={
                  setMpesaPhone
                }
                placeholder="712 345 678"
                placeholderTextColor={
                  COLORS.muted
                }
                keyboardType="phone-pad"
                style={
                  styles.mpesaInput
                }
                editable={
                  !processingPayment
                }
              />
            </View>

            <View
              style={
                styles.stkNotice
              }
            >
              <ShieldCheck
                size={18}
                color={
                  COLORS.lime
                }
              />

              <Text
                style={
                  styles.stkNoticeText
                }
              >
                We&apos;ll start the M-PESA
                payment process. Your
                request remains pending
                until the backend confirms
                payment.
              </Text>
            </View>

            <Pressable
              style={[
                styles.payButton,
                processingPayment &&
                  styles.payButtonDisabled,
              ]}
              disabled={
                processingPayment
              }
              onPress={
                handleMpesaPayment
              }
            >
              {processingPayment ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.background
                    }
                  />

                  <Text
                    style={
                      styles.payButtonText
                    }
                  >
                    Starting payment...
                  </Text>
                </>
              ) : (
                <>
                  <Wallet
                    size={19}
                    color={
                      COLORS.background
                    }
                  />

                  <Text
                    style={
                      styles.payButtonText
                    }
                  >
                    Start M-PESA Payment
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
  },

  headerSpacer: {
    width: 44,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },

  propertyCard: {
    flexDirection: 'row',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    overflow: 'hidden',
  },

  propertyImageContainer: {
    width: 112,
    height: 132,
    position: 'relative',
  },

  propertyImage: {
    width: '100%',
    height: '100%',
  },

  propertyImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.cardSoft,
  },

  propertyVerifiedBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor:
      COLORS.lime,
  },

  propertyVerifiedText: {
    color:
      COLORS.background,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  propertyInformation: {
    flex: 1,
    padding: 13,
  },

  propertyType: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  propertyTitle: {
    marginTop: 5,
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },

  propertyLocation: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  propertyLocationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
  },

  propertyPriceRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  propertyRent: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  propertyPerMonth: {
    color: COLORS.muted,
    fontSize: 10,
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  sectionHint: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
  },

  inputContainer: {
    marginTop: 11,
    minHeight: 53,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
  },

  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    minHeight: 50,
  },

  phonePrefix: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: '900',
  },

  requestTypeRow: {
    marginTop: 12,
    gap: 9,
  },

  requestTypeCard: {
    minHeight: 72,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
  },

  requestTypeCardActive: {
    borderColor:
      COLORS.lime,
    backgroundColor:
      '#151B16',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor:
      COLORS.muted,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  radioActive: {
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

  requestTypeText: {
    flex: 1,
  },

  requestTypeTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  requestTypeDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  dateRow: {
    gap: 9,
    paddingTop: 13,
    paddingRight: 10,
  },

  dateCard: {
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  dateCardActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  dateLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  dateLabelActive: {
    color:
      COLORS.background,
  },

  dateValue: {
    marginTop: 5,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  dateValueActive: {
    color:
      COLORS.background,
  },

  timeSelector: {
    marginTop: 12,
    minHeight: 55,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
  },

  timeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  timeSelectorText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  timeSelectorPlaceholder: {
    color: COLORS.muted,
    fontWeight: '500',
  },

  timeList: {
    marginTop: 8,
    padding: 7,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
    gap: 5,
  },

  timeOption: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  timeOptionActive: {
    backgroundColor:
      COLORS.lime,
  },

  timeOptionDisabled: {
    opacity: 0.55,
  },

  timeOptionText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  timeOptionTextActive: {
    color:
      COLORS.background,
  },

  timeOptionTextDisabled: {
    color: '#51595B',
  },

  timeHelp: {
    padding: 10,
    color: COLORS.muted,
    fontSize: 11,
  },

  fieldLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  required: {
    color: COLORS.lime,
  },

  notesInput: {
    marginTop: 10,
    minHeight: 110,
    padding: 14,
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 20,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 15,
  },

  characterCount: {
    marginTop: 5,
    textAlign: 'right',
    color: COLORS.muted,
    fontSize: 10,
  },

  feeCard: {
    marginTop: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 16,
  },

  feeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      '#1D2717',
  },

  feeInformation: {
    flex: 1,
  },

  feeTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  feeDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  feeAmount: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: '900',
  },

  securityNotice: {
    marginTop: 13,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor:
      '#121D18',
    borderWidth: 1,
    borderColor:
      '#233C30',
    borderRadius: 14,
  },

  securityNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  bottomSpace: {
    height: 95,
  },

  bottomBar: {
    paddingHorizontal: 17,
    paddingTop: 11,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor:
      COLORS.background,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  bottomAmount: {
    flex: 1,
  },

  bottomAmountLabel: {
    color: COLORS.muted,
    fontSize: 10,
  },

  bottomAmountValue: {
    marginTop: 2,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  continueButton: {
    minHeight: 51,
    paddingHorizontal: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
    backgroundColor:
      COLORS.lime,
  },

  continueButtonDisabled: {
    opacity: 0.35,
  },

  continueButtonText: {
    color:
      COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      'rgba(0,0,0,0.68)',
  },

  paymentModal: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 25,
    backgroundColor:
      COLORS.card,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor:
      COLORS.border,
  },

  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 3,
    backgroundColor:
      COLORS.border,
  },

  modalHeader: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },

  modalSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.cardSoft,
  },

  mpesaMark: {
    minWidth: 72,
    minHeight: 35,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.white,
  },

  mpesaMarkSmall: {
    minWidth: 57,
    minHeight: 29,
  },

  mpesaMarkText: {
    color: '#1B8E45',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  mpesaMarkTextSmall: {
    fontSize: 9,
  },

  paymentAmountCard: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor:
      COLORS.cardSoft,
    borderRadius: 15,
  },

  paymentAmountInformation: {
    flex: 1,
  },

  paymentAmountLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  paymentAmount: {
    marginTop: 3,
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },

  mpesaInputLabel: {
    marginTop: 18,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  mpesaInputContainer: {
    marginTop: 9,
    minHeight: 53,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 14,
  },

  mpesaPrefix: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: '900',
  },

  mpesaInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    minHeight: 50,
  },

  stkNotice: {
    marginTop: 13,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor:
      '#121D18',
    borderWidth: 1,
    borderColor:
      '#233C30',
    borderRadius: 13,
  },

  stkNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  payButton: {
    marginTop: 16,
    minHeight: 53,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
    backgroundColor:
      COLORS.lime,
  },

  payButtonDisabled: {
    opacity: 0.65,
  },

  payButtonText: {
    color:
      COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 13,
  },

  notFoundContainer: {
    flex: 1,
  },

  notFoundContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
    paddingHorizontal: 30,
    marginTop: -45,
  },

  notFoundIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  notFoundTitle: {
    marginTop: 19,
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },

  notFoundDescription: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  browseButton: {
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor:
      COLORS.lime,
  },

  browseButtonText: {
    color:
      COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  successContainer: {
    flex: 1,
  },

  successTopBar: {
    minHeight: 65,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  successHeader: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  successScrollContent: {
    padding: 20,
    paddingBottom: 45,
  },

  successContent: {
    alignItems: 'center',
  },

  successIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.lime,
  },

  successEyebrow: {
    marginTop: 17,
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  successTitle: {
    marginTop: 8,
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  successDescription: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  successReceiptCard: {
    width: '100%',
    marginTop: 20,
    padding: 15,
    borderRadius: 17,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  successReceiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  successReceiptHeaderText: {
    flex: 1,
  },

  successReceiptLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  successReceiptStatus: {
    marginTop: 3,
    color: COLORS.green,
    fontSize: 11,
  },

  successReceiptDivider: {
    height: 1,
    marginVertical: 13,
    backgroundColor:
      COLORS.border,
  },

  successReceiptAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  successReceiptAmountLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },

  successReceiptAmount: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },

  successReceiptPhone: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 10,
  },

  successReceiptReference: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
  },

  appointmentCard: {
    width: '100%',
    marginTop: 11,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  appointmentIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      '#1D2717',
  },

  appointmentText: {
    flex: 1,
  },

  appointmentLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  appointmentDate: {
    marginTop: 3,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  appointmentTime: {
    marginTop: 2,
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '800',
  },

  successPropertyCard: {
    width: '100%',
    marginTop: 11,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 10,
    borderRadius: 16,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  successPropertyImage: {
    width: 62,
    height: 58,
    borderRadius: 11,
  },

  successPropertyIcon: {
    width: 62,
    height: 58,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      COLORS.cardSoft,
  },

  successPropertyText: {
    flex: 1,
  },

  successPropertyTitle: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  successPropertyLocation: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
  },

  nextStepCard: {
    width: '100%',
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    backgroundColor:
      '#121D18',
    borderWidth: 1,
    borderColor:
      '#233C30',
  },

  nextStepText: {
    flex: 1,
  },

  nextStepTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  nextStepDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  visitsButton: {
    width: '100%',
    marginTop: 16,
    minHeight: 52,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
    backgroundColor:
      COLORS.lime,
  },

  visitsButtonText: {
    color:
      COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },
});
