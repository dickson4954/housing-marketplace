import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  ChevronLeft,
  Users,
  Sun,
  Moon,
  Sparkles,
  Clock3,
  Wallet,
  ShieldCheck,
  CalendarDays,
  Check,
} from 'lucide-react-native';

import {
  StayDateRangePicker,
  TimePickerField,
  getLocalDateString,
  isValidDateString,
} from '@/components/DateTimeFields';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

type StayMode = 'DAY' | 'OVERNIGHT' | 'DAY_AND_NIGHT' | 'FLEXIBLE';
type RateType = 'DAY' | 'OVERNIGHT' | 'DAY_AND_NIGHT';

type Property = {
  id: string;
  title: string;
  purpose: string;
  available: boolean;
  verified: boolean;
  maxGuests?: number | null;
  stayMode?: StayMode | null;
  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;
};

type BookingResponse = {
  success: boolean;
  message?: string;
  data?: {
    booking: { id: string; status: string };
    payment: { id: string; amount: number; currency: string };
    pricing: {
      totalAmount: number;
      depositAmount: number;
      balanceAmount: number;
      currency: string;
      depositPercentage?: number;
    };
  };
};

type PaymentResponse = {
  success: boolean;
  message?: string;
  data?: {
    payment: {
      id: string;
      status: string;
      stayBooking?: { id?: string; status?: string };
    };
  };
};

type InitiatePaymentResponse = {
  success: boolean;
  message?: string;
  data?: {
    payment?: { id?: string; status?: string };
    customerMessage?: string;
    alreadyPaid?: boolean;
  };
};

const C = {
  bg: '#0B0F10',
  card: '#14191B',
  lime: '#D7FF5F',
  text: '#F4F7F2',
  muted: '#9CA5A7',
  border: '#252C2E',
};

const money = (value: number, currency = 'KES') =>
  `${currency} ${Number(value || 0).toLocaleString('en-KE')}`;

export default function StayBookingScreen() {
  const params = useLocalSearchParams<{ propertyId?: string | string[] }>();
  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guests, setGuests] = useState('1');
  const [stayMode, setStayMode] = useState<StayMode>('OVERNIGHT');
  const [rateType, setRateType] = useState<RateType>('OVERNIGHT');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('10:00');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (!propertyId) throw new Error('Property ID is missing.');

        const token = await SecureStore.getItemAsync('makazii_customer_token');
        if (!token) {
          Alert.alert('Login required', 'Please log in to book a stay.', [
            { text: 'Log in', onPress: () => router.replace('/onboarding/customer/login') },
            { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
          ]);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.propertyById(propertyId)}`,
        );
        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || 'Unable to load this property.');
        }

        const item = result.data as Property;
        if (item.purpose !== 'SHORT_STAY' || !item.available || !item.verified) {
          throw new Error('This property is not currently available for booking.');
        }

        if (active) {
          setProperty(item);
          const mode = item.stayMode || 'OVERNIGHT';
          setStayMode(mode);
          setRateType(mode === 'FLEXIBLE' ? 'OVERNIGHT' : mode);
        }
      } catch (error) {
        if (active) {
          Alert.alert('Unable to book', error instanceof Error ? error.message : 'Please try again.');
          router.back();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [propertyId]);

  const effectiveRate = stayMode === 'FLEXIBLE' ? rateType : stayMode;
  const rate = useMemo(() => {
    if (!property) return 0;
    if (effectiveRate === 'DAY') return Number(property.dayRate || 0);
    if (effectiveRate === 'OVERNIGHT') return Number(property.nightRate || 0);
    return Number(property.dayNightRate || 0);
  }, [property, effectiveRate]);

  // Calculate the customer-facing estimate using calendar dates.
  // The backend remains authoritative when the booking is submitted.
  const stayDuration = useMemo(() => {
    if (effectiveRate === 'DAY') {
      return isValidDateString(checkInDate) ? 1 : 0;
    }

    if (
      !isValidDateString(checkInDate) ||
      !isValidDateString(checkOutDate) ||
      checkOutDate <= checkInDate
    ) {
      return 0;
    }

    const [startYear, startMonth, startDay] =
      checkInDate.split('-').map(Number);
    const [endYear, endMonth, endDay] =
      checkOutDate.split('-').map(Number);

    const start = Date.UTC(startYear, startMonth - 1, startDay);
    const end = Date.UTC(endYear, endMonth - 1, endDay);

    return Math.round((end - start) / 86400000);
  }, [effectiveRate, checkInDate, checkOutDate]);

  const estimatedTotal =
    rate > 0 && stayDuration > 0 ? rate * stayDuration : 0;

  const durationUnit = effectiveRate === 'DAY' ? 'day' : 'night';

  const submit = async () => {
    if (submitting || !propertyId) return;

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      Alert.alert('Invalid guests', 'Enter a valid number of guests.');
      return;
    }
    if (property?.maxGuests && guestCount > property.maxGuests) {
      Alert.alert('Guest limit', `This property allows up to ${property.maxGuests} guests.`);
      return;
    }
    if (!isValidDateString(checkInDate) || checkInDate < getLocalDateString()) {
      Alert.alert('Invalid check-in date', 'Choose today or a future check-in date.');
      return;
    }
    if (effectiveRate !== 'DAY') {
      if (!isValidDateString(checkOutDate)) {
        Alert.alert('Check-out required', 'Choose your check-out date.');
        return;
      }
      if (checkOutDate <= checkInDate) {
        Alert.alert('Invalid date range', 'Check-out must be after check-in.');
        return;
      }
    }
    // Same-day bookings must end after they start.
    // Overnight bookings can check out earlier on the clock because
    // checkout occurs on a later calendar date.
    if (effectiveRate === 'DAY' && endTime <= startTime) {
      Alert.alert('Invalid time', 'End time must be later than start time.');
      return;
    }
    if (!/^(\+?254|0)?[17]\d{8}$/.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert('Invalid M-Pesa number', 'Enter a valid Kenyan mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('makazii_customer_token');
      if (!token) throw new Error('Your session has expired. Please log in again.');

      const bookingBody = {
        propertyId,
        guests: guestCount,
        stayMode,
        rateType: effectiveRate,
        // Dates remain calendar dates for all booking types.
        // The backend stores the arrival and departure times separately.
        checkInDate,
        checkOutDate: effectiveRate === 'DAY' ? undefined : checkOutDate,
        startTime,
        endTime,
      };

      const bookingResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.createStayBooking}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingBody),
        },
      );
      const bookingResult = await bookingResponse.json() as BookingResponse;

      if (!bookingResponse.ok || !bookingResult.success || !bookingResult.data) {
        throw new Error(bookingResult.message || 'Booking could not be created.');
      }

      const { booking, pricing } = bookingResult.data;

      Alert.alert(
        'Review your booking deposit',
        `Total stay cost: ${money(pricing.totalAmount, pricing.currency)}\\n\\nDeposit (${pricing.depositPercentage ?? 30}%): ${money(pricing.depositAmount, pricing.currency)}\\nRemaining balance before check-in: ${money(pricing.balanceAmount, pricing.currency)}\\n\\nThe inspection fee, if applicable, is separate and is not deducted from this booking.`,
        [
          {
            text: 'Not now',
            style: 'cancel',
          },
          {
            text: 'Pay deposit',
            onPress: () => {
              void (async () => {
                setSubmitting(true);
                try {
                  const paymentResponse = await fetch(
                    `${API_BASE_URL}${API_ENDPOINTS.initiateStayBookingPayment(booking.id)}`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
                    },
                  );

                  const paymentResult =
                    await paymentResponse.json() as InitiatePaymentResponse;

                  if (!paymentResponse.ok || !paymentResult.success) {
                    throw new Error(
                      paymentResult.message ||
                      'The booking exists, but the M-Pesa request could not be started. Check booking status or contact support before trying again.',
                    );
                  }

                  const paymentId = paymentResult.data?.payment?.id;

                  if (!paymentId) {
                    throw new Error(
                      paymentResult.message ||
                      'The payment request response did not contain a payment ID. Do not submit another payment; contact support.',
                    );
                  }

                  Alert.alert(
                    'M-Pesa request sent',
                    paymentResult.message ||
                    'Check your phone and enter your M-Pesa PIN. MAKAZII will verify the payment with Safaricom.',
                  );

                  let finalStatus = '';

                  for (let attempt = 0; attempt < 24; attempt += 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    const statusResponse = await fetch(
                      `${API_BASE_URL}${API_ENDPOINTS.customerPaymentStatus(paymentId)}`,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );

                    const statusResult =
                      await statusResponse.json() as PaymentResponse;

                    if (!statusResponse.ok || !statusResult.success) {
                      throw new Error(
                        statusResult.message ||
                        'Could not verify payment status. Check your booking before making another payment.',
                      );
                    }

                    finalStatus = statusResult.data?.payment?.status || '';

                    if (finalStatus === 'SUCCESS') {
                      Alert.alert(
                        'Deposit received',
                        'Your M-Pesa deposit has been confirmed. Your booking status has been updated.',
                        [{ text: 'OK', onPress: () => router.replace('/visits') }],
                      );
                      return;
                    }

                    if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(finalStatus)) {
                      throw new Error(
                        'M-Pesa did not confirm this deposit. Check your booking status before attempting another payment.',
                      );
                    }
                  }

                  Alert.alert(
                    'Payment still processing',
                    'Safaricom has not yet provided final confirmation. Do not pay again. Your booking and payment status can be checked again shortly.',
                  );
                } catch (error) {
                  Alert.alert(
                    'Booking payment',
                    error instanceof Error
                      ? error.message
                      : 'Unable to complete the payment request.',
                  );
                } finally {
                  setSubmitting(false);
                }
              })();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Booking payment', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !property) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={C.lime} size="large" />
        <Text style={styles.muted}>Loading booking...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft color={C.text} size={24} />
        </Pressable>
        <Text style={styles.title}>Book your stay</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.propertyTitle}>{property.title}</Text>
        <Text style={styles.muted}>Choose your stay details and secure your booking with an M-Pesa deposit.</Text>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Choose your stay</Text>
          <Text style={styles.sectionSubtitle}>
            Select the accommodation option that suits your plans.
          </Text>
        </View>

        <View style={styles.modeGrid}>
          {([
            { id: 'DAY', title: 'Day stay', description: 'A few hours', icon: Sun },
            { id: 'OVERNIGHT', title: 'Overnight', description: 'One or more nights', icon: Moon },
            { id: 'DAY_AND_NIGHT', title: 'Day & night', description: 'Extended stay', icon: Clock3 },
            { id: 'FLEXIBLE', title: 'Flexible', description: 'Choose your rate', icon: Sparkles },
          ] as const).map(item => {
            const selected = stayMode === item.id;
            const Icon = item.icon;

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  const mode = item.id as StayMode;
                  setStayMode(mode);

                  if (mode !== 'FLEXIBLE') {
                    setRateType(mode);

                    if (mode === 'DAY') {
                      setStartTime('09:00');
                      setEndTime('17:00');
                    } else {
                      setStartTime('14:00');
                      setEndTime('10:00');
                    }
                  }
                }}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
              >
                <View style={styles.modeCardTop}>
                  <View style={[styles.modeIcon, selected && styles.modeIconSelected]}>
                    <Icon color={selected ? C.bg : C.lime} size={19} />
                  </View>
                  {selected && (
                    <View style={styles.modeCheck}>
                      <Check color={C.bg} size={13} strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>
                  {item.title}
                </Text>
                <Text style={styles.modeDescription}>{item.description}</Text>
              </Pressable>
            );
          })}
        </View>

        {stayMode === 'FLEXIBLE' && (
          <View style={styles.flexiblePanel}>
            <Text style={styles.flexibleTitle}>Choose your preferred rate</Text>
            <View style={styles.rateOptions}>
              {([
                { id: 'DAY', label: 'Day rate' },
                { id: 'OVERNIGHT', label: 'Night rate' },
                { id: 'DAY_AND_NIGHT', label: 'Day & night' },
              ] as const).map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setRateType(item.id);

                    if (item.id === 'DAY') {
                      setStartTime('09:00');
                      setEndTime('17:00');
                    } else {
                      setStartTime('14:00');
                      setEndTime('10:00');
                    }
                  }}
                  style={[
                    styles.rateOption,
                    rateType === item.id && styles.rateOptionSelected,
                  ]}
                >
                  <Text style={[
                    styles.rateOptionText,
                    rateType === item.id && styles.rateOptionTextSelected,
                  ]}>
                    {item.label}
                  </Text>
                  {rateType === item.id && <Check color={C.lime} size={16} />}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Who's coming?</Text>
          <Text style={styles.sectionSubtitle}>Set the number of guests for this stay.</Text>
        </View>

        <View style={styles.guestControl}>
          <View style={styles.guestIcon}>
            <Users color={C.lime} size={21} />
          </View>
          <View style={styles.guestInfo}>
            <Text style={styles.guestHeading}>Guests</Text>
            <Text style={styles.guestCaption}>
              {property.maxGuests ? `Up to ${property.maxGuests} guests` : 'Number of people'}
            </Text>
          </View>
          <Pressable
            disabled={Number(guests) <= 1 || submitting}
            onPress={() => setGuests(String(Math.max(1, Number(guests) - 1)))}
            style={[styles.guestButton, Number(guests) <= 1 && styles.guestButtonDisabled]}
          >
            <Text style={styles.guestButtonText}>−</Text>
          </Pressable>
          <Text style={styles.guestNumber}>{guests}</Text>
          <Pressable
            disabled={Number(guests) >= (property.maxGuests || 20) || submitting}
            onPress={() => setGuests(String(
              Math.min(property.maxGuests || 20, Number(guests) + 1)
            ))}
            style={[
              styles.guestButton,
              Number(guests) >= (property.maxGuests || 20) && styles.guestButtonDisabled,
            ]}
          >
            <Text style={styles.guestButtonText}>+</Text>
          </Pressable>
        </View>

        <StayDateRangePicker
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          minimumDate={getLocalDateString()}
          disabled={submitting}
          rangeEnabled={effectiveRate !== 'DAY'}
          onChange={(checkIn, checkOut) => {
            setCheckInDate(checkIn);
            setCheckOutDate(checkOut);
          }}
        />

        <>
          <TimePickerField
            label={effectiveRate === 'DAY' ? 'Start time' : 'Check-in time'}
            value={startTime}
            disabled={submitting}
            onChange={value => {
              setStartTime(value);

              // Only same-day bookings require checkout after check-in.
              if (effectiveRate === 'DAY' && endTime <= value) {
                setEndTime('');
              }
            }}
          />

          <TimePickerField
            label={effectiveRate === 'DAY' ? 'End time' : 'Check-out time'}
            value={endTime}
            minimumTime={effectiveRate === 'DAY' ? startTime : undefined}
            disabled={submitting}
            onChange={setEndTime}
          />
        </>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Payment details</Text>
          <Text style={styles.sectionSubtitle}>
            Enter the number that should receive the M-Pesa payment prompt.
          </Text>
        </View>

        <View style={styles.paymentInputCard}>
          <View style={styles.paymentInputIcon}>
            <Wallet color={C.lime} size={20} />
          </View>
          <View style={styles.paymentInputContent}>
            <Text style={styles.paymentInputLabel}>M-Pesa phone number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
              placeholderTextColor={C.muted}
              editable={!submitting}
            />
          </View>
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.priceTitle}>Your stay estimate</Text>
              <Text style={styles.priceCaption}>
                Automatically calculated from your selected dates
              </Text>
            </View>
            <View style={styles.priceIcon}>
              <Wallet color={C.lime} size={20} />
            </View>
          </View>

          <Text style={styles.price}>
            {money(rate)}
            <Text style={{ color: C.muted, fontSize: 13, fontWeight: '600' }}>
              {' '}/ {durationUnit}
            </Text>
          </Text>

          <View style={styles.priceDivider} />

          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoText}>Selected duration</Text>
            <Text style={{ color: C.text, fontSize: 12, fontWeight: '800' }}>
              {stayDuration > 0
                ? `${stayDuration} ${stayDuration === 1 ? durationUnit : `${durationUnit}s`}`
                : 'Select your dates'}
            </Text>
          </View>

          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentInfoText}>Rate calculation</Text>
            <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>
              {stayDuration > 0 && rate > 0
                ? `${money(rate)} × ${stayDuration}`
                : 'Waiting for dates'}
            </Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.paymentInfoRow}>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '900' }}>
              Estimated total
            </Text>
            <Text style={{
              color: C.lime,
              fontSize: 21,
              fontWeight: '900',
            }}>
              {estimatedTotal > 0 ? money(estimatedTotal) : '—'}
            </Text>
          </View>

          <View style={styles.paymentInfoRow}>
            <ShieldCheck color={C.lime} size={17} />
            <Text style={styles.paymentInfoText}>
              Your final total and deposit are verified securely by MAKAZII
              when you submit your booking.
            </Text>
          </View>

          <View style={styles.paymentInfoRow}>
            <CalendarDays color={C.muted} size={17} />
            <Text style={styles.paymentInfoText}>
              The remaining balance is due before check-in. Inspection fees
              are separate.
            </Text>
          </View>

          <Text style={styles.depositNote}>
            Your applicable deposit percentage and remaining balance will be
            displayed when you submit your booking.
          </Text>
        </View>

        <Pressable
          disabled={submitting}
          onPress={submit}
          style={[styles.submit, submitting && styles.submitDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <>
              <Text style={styles.submitText}>Continue to M-Pesa deposit</Text>
              <ChevronLeft
                color={C.bg}
                size={19}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </>
          )}
        </Pressable>
        <Text style={styles.secureNote}>
          <ShieldCheck color={C.muted} size={13} /> Secure payment through M-Pesa
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 13, gap: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  back: {
    width: 43, height: 43, borderRadius: 15, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  title: { color: C.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  content: { paddingHorizontal: 20, paddingTop: 23, paddingBottom: 55 },
  propertyTitle: { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8 },
  muted: { color: C.muted, lineHeight: 21, fontSize: 13 },
  sectionHeading: { marginTop: 27, marginBottom: 13 },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.35 },
  sectionSubtitle: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  modeCard: {
    width: '48.5%', minHeight: 126, padding: 13, borderRadius: 17,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  modeCardSelected: { borderColor: C.lime, backgroundColor: '#1B2417' },
  modeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  modeIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#222B2D', alignItems: 'center', justifyContent: 'center' },
  modeIconSelected: { backgroundColor: C.lime },
  modeCheck: { width: 21, height: 21, borderRadius: 11, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  modeTitleSelected: { color: C.lime },
  modeDescription: { color: C.muted, fontSize: 11, marginTop: 4 },
  flexiblePanel: { marginTop: 12, padding: 15, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  flexibleTitle: { color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 11 },
  rateOptions: { gap: 8 },
  rateOption: { minHeight: 43, paddingHorizontal: 12, borderRadius: 11, backgroundColor: '#1B2224', borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateOptionSelected: { borderColor: C.lime, backgroundColor: '#202B18' },
  rateOptionText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  rateOptionTextSelected: { color: C.lime },
  guestControl: {
    minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: C.card, borderRadius: 17, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 13,
  },
  guestIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#222B2D', alignItems: 'center', justifyContent: 'center' },
  guestInfo: { flex: 1 },
  guestHeading: { color: C.text, fontSize: 13, fontWeight: '800' },
  guestCaption: { color: C.muted, fontSize: 10, marginTop: 4 },
  guestButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#273033', alignItems: 'center', justifyContent: 'center' },
  guestButtonDisabled: { opacity: 0.35 },
  guestButtonText: { color: C.lime, fontSize: 22, fontWeight: '800', lineHeight: 25 },
  guestNumber: { color: C.text, fontSize: 16, fontWeight: '900', minWidth: 17, textAlign: 'center' },
  label: { color: C.text, fontWeight: '800', fontSize: 13, marginTop: 22, marginBottom: 9 },
  paymentInputCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
  },
  paymentInputIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#222B2D', alignItems: 'center', justifyContent: 'center' },
  paymentInputContent: { flex: 1 },
  paymentInputLabel: { color: C.text, fontSize: 12, fontWeight: '800', marginBottom: 5 },
  phoneInput: { color: C.text, fontSize: 15, paddingVertical: 5, paddingHorizontal: 0 },
  priceCard: { marginTop: 22, padding: 18, borderRadius: 19, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, gap: 12 },
  priceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceTitle: { color: C.text, fontWeight: '900', fontSize: 14 },
  priceCaption: { color: C.muted, fontSize: 10, marginTop: 4 },
  priceIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#222B2D', alignItems: 'center', justifyContent: 'center' },
  price: { color: C.lime, fontSize: 29, fontWeight: '900', letterSpacing: -0.7 },
  priceDivider: { height: 1, backgroundColor: C.border },
  paymentInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  paymentInfoText: { flex: 1, color: C.muted, fontSize: 11, lineHeight: 17 },
  depositNote: { color: C.text, fontSize: 10, lineHeight: 16, backgroundColor: '#202729', padding: 11, borderRadius: 10 },
  submit: {
    marginTop: 22, backgroundColor: C.lime, minHeight: 58, paddingHorizontal: 18,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: C.bg, fontWeight: '900', fontSize: 14 },
  secureNote: { color: C.muted, fontSize: 10, marginTop: 12, textAlign: 'center' },
});
