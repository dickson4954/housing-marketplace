import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  MapPin,
  Clock3,
  Sparkles,
  CalendarCheck,
  Check,
} from 'lucide-react-native';

import {
  DatePickerField,
  TimePickerField,
  getLocalDateString,
  isValidDateString,
} from '@/components/DateTimeFields';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#62D39B',
  danger: '#FF6B6B',
};

type Property = {
  id: string;
  title: string;
  purpose: 'LONG_STAY' | 'SHORT_STAY';
  inspectionFee?: number | null;
  available: boolean;
  verified: boolean;
  county?: string | null;
  town?: string | null;
  area?: string | null;
};

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type Inspection = {
  id: string;
  status?: string;
};

type Payment = {
  id: string;
  reference?: string | null;
  amount?: number | null;
  status?: string | null;
};

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  let national = digits;

  if (digits.startsWith('254')) {
    national = digits.slice(3);
  } else if (digits.startsWith('0')) {
    national = digits.slice(1);
  }

  return /^[17]\d{8}$/.test(national) ? `254${national}` : null;
}

function currency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return 'Unavailable';
  }

  return `KSh ${Number(value).toLocaleString('en-KE')}`;
}

export default function StayInspectionScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ propertyId?: string | string[] }>();
  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.propertyById(propertyId)}`,
        );
        const payload = (await response.json()) as ApiResult<Property>;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message || 'Could not load this property.');
        }

        if (!cancelled) {
          setProperty(payload.data);
        }
      } catch (error) {
        if (!cancelled) {
          Alert.alert(
            'Property unavailable',
            error instanceof Error ? error.message : 'Could not load property.',
            [{ text: 'Go back', onPress: () => router.back() }],
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProperty();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  async function handlePayment() {
    if (!property || submitting) {
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      Alert.alert('Invalid M-Pesa number', 'Enter a valid Kenyan Safaricom number.');
      return;
    }

    if (!isValidDateString(requestedDate) || requestedDate < getLocalDateString()) {
      Alert.alert('Choose an inspection date', 'Select today or a future date for your inspection.');
      return;
    }

    if (!preferredTime.trim()) {
      Alert.alert('Choose a preferred time', 'Select your preferred inspection time.');
      return;
    }

    setSubmitting(true);

    try {
      const token = await SecureStore.getItemAsync('makazii_customer_token');

      if (!token) {
        Alert.alert(
          'Login required',
          'Log in to your MAKAZII customer account before requesting an inspection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log in', onPress: () => router.push('/onboarding/customer/login') },
          ],
        );
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const inspectionResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.customerStayInspections}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            propertyId: property.id,
            // Noon UTC preserves the selected calendar date in East Africa.
            requestedDate: `${requestedDate}T12:00:00.000Z`,
            preferredTime: preferredTime.trim(),
            notes: notes.trim() || undefined,
          }),
        },
      );

      const inspectionPayload = (
        await inspectionResponse.json()
      ) as ApiResult<{ inspection?: Inspection }>;

      if (
        !inspectionResponse.ok ||
        !inspectionPayload.success ||
        !inspectionPayload.data?.inspection?.id
      ) {
        throw new Error(
          inspectionPayload.message || 'Could not create the inspection request.',
        );
      }

      const inspection = inspectionPayload.data.inspection;

      if (
        inspection.status &&
        inspection.status !== 'PENDING_PAYMENT'
      ) {
        Alert.alert(
          'Inspection already exists',
          `This inspection is currently ${inspection.status.replace(/_/g, ' ')}. Check your Visits screen for its status. No new payment was initiated.`,
        );
        return;
      }

      const paymentResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.initiateInspectionPayment(inspection.id)}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            method: 'MPESA',
            phoneNumber: normalizedPhone,
          }),
        },
      );

      const paymentPayload = (
        await paymentResponse.json()
      ) as ApiResult<{ payment?: Payment }>;

      if (
        !paymentResponse.ok ||
        !paymentPayload.success ||
        !paymentPayload.data?.payment?.id
      ) {
        throw new Error(
          paymentPayload.message || 'Could not initiate M-Pesa payment.',
        );
      }

      const payment = paymentPayload.data.payment;

      if (payment.status?.toUpperCase() === 'SUCCESS') {
        setPaymentReference(payment.reference || '');
        setPaid(true);
        return;
      }

      let paymentSucceeded = false;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.customerPaymentStatus(payment.id)}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const statusPayload = (
          await statusResponse.json()
        ) as ApiResult<{ payment?: Payment }>;

        if (
          !statusResponse.ok ||
          !statusPayload.success ||
          !statusPayload.data?.payment
        ) {
          throw new Error(
            statusPayload.message ||
              'Could not verify payment. Do not pay again; check your Visits screen.',
          );
        }

        const status = statusPayload.data.payment.status?.toUpperCase();

        if (status === 'SUCCESS') {
          paymentSucceeded = true;
          setPaymentReference(
            statusPayload.data.payment.reference || payment.reference || '',
          );
          break;
        }

        if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(status || '')) {
          throw new Error(
            'Safaricom did not complete this payment. Check your M-Pesa messages before trying again.',
          );
        }
      }

      if (paymentSucceeded) {
        setPaid(true);
      } else {
        Alert.alert(
          'Confirmation pending',
          'The M-Pesa request was sent, but payment confirmation has not arrived. Do not pay again. Check your M-Pesa messages and Visits screen.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Payment could not be completed',
        error instanceof Error ? error.message : 'An unexpected payment error occurred.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.lime} />
          <Text style={styles.muted}>Loading property...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property || property.purpose !== 'SHORT_STAY') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Short-stay property unavailable</Text>
          <Pressable onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!property.available || !property.verified || !property.inspectionFee || property.inspectionFee <= 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Inspection unavailable</Text>
          <Text style={styles.muted}>
            This property is not currently available for a paid inspection.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (paid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <CheckCircle2 size={58} color={COLORS.green} />
          <Text style={styles.eyebrow}>PAYMENT CONFIRMED</Text>
          <Text style={styles.title}>Inspection payment received</Text>
          <Text style={styles.muted}>
            The backend has confirmed your M-Pesa payment. MAKAZII will review your inspection request.
          </Text>
          {!!paymentReference && (
            <Text style={styles.reference}>Reference: {paymentReference}</Text>
          )}
          <Pressable onPress={() => router.replace('/visits')} style={styles.button}>
            <Text style={styles.buttonText}>View my requests</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={COLORS.white} size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Stay inspection</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Sparkles color={COLORS.lime} size={13} />
                <Text style={styles.heroBadgeText}>PERSONAL PROPERTY TOUR</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <CheckCircle2 color={COLORS.green} size={14} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>SHORT-STAY INSPECTION</Text>
            <Text style={styles.propertyTitle}>{property.title}</Text>

            <View style={styles.locationRow}>
              <MapPin color={COLORS.muted} size={15} />
              <Text style={styles.locationText}>
                {[property.area, property.town, property.county]
                  .filter(Boolean)
                  .join(', ') || 'Location available on request'}
              </Text>
            </View>

            <Text style={styles.heroDescription}>
              Schedule a visit to experience the property before making your stay decision.
            </Text>
          </View>

          <View style={styles.feeCard}>
            <View style={styles.feeIconWrap}>
              <CalendarCheck color={COLORS.lime} size={23} />
            </View>
            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>ONE-TIME INSPECTION FEE</Text>
              <Text style={styles.feeAmount}>{currency(property.inspectionFee)}</Text>
              <Text style={styles.feeCaption}>
                Paid separately from any accommodation booking
              </Text>
            </View>
            <View style={styles.feePaidBadge}>
              <Text style={styles.feePaidText}>INSPECTION</Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <CalendarDays color={COLORS.lime} size={18} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>Plan your inspection</Text>
              <Text style={styles.sectionSubtitle}>
                Choose when you would prefer to visit
              </Text>
            </View>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.fieldHeading}>
              <Text style={styles.fieldTitle}>Preferred date</Text>
              <Text style={styles.fieldRequired}>REQUIRED</Text>
            </View>

            <DatePickerField
              label="Select inspection date"
              value={requestedDate}
              minimumDate={getLocalDateString()}
              disabled={submitting}
              onChange={setRequestedDate}
            />

            <View style={styles.cardDivider} />

            <View style={styles.fieldHeading}>
              <Text style={styles.fieldTitle}>Preferred time</Text>
              <Text style={styles.fieldRequired}>REQUIRED</Text>
            </View>

            <TimePickerField
              label="Select inspection time"
              value={preferredTime}
              disabled={submitting}
              onChange={setPreferredTime}
            />
          </View>

          <View style={styles.scheduleHint}>
            <Clock3 color={COLORS.lime} size={17} />
            <Text style={styles.scheduleHintText}>
              Your selected date and time are preferences, not a confirmed appointment.
              MAKAZII will review and confirm your inspection schedule.
            </Text>
          </View>

          <Text style={styles.label}>Notes for MAKAZII (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything we should know?"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, styles.notesInput]}
            multiline
            textAlignVertical="top"
            editable={!submitting}
          />

          <Text style={styles.label}>M-Pesa phone number</Text>
          <View style={styles.phoneField}>
            <Text style={styles.phonePrefix}>+254</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="712 345 678"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              editable={!submitting}
            />
          </View>

          <View style={styles.notice}>
            <ShieldCheck color={COLORS.lime} size={20} />
            <Text style={styles.noticeText}>
              An M-Pesa prompt will be sent to your phone. Your inspection remains pending until MAKAZII receives confirmed payment from Safaricom.
            </Text>
          </View>

          <Pressable
            style={[styles.button, submitting && styles.disabledButton]}
            disabled={submitting}
            onPress={handlePayment}
          >
            {submitting ? (
              <>
                <ActivityIndicator color={COLORS.background} />
                <Text style={styles.buttonText}>Processing payment...</Text>
              </>
            ) : (
              <>
                <Wallet color={COLORS.background} size={19} />
                <Text style={styles.buttonText}>Request inspection & pay</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.footer}>
            Only proceed when you are ready to complete the inspection fee payment.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 19,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 23,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#222B20',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1B2A24',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
  },
  verifiedText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '800',
  },
  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 9,
  },
  propertyTitle: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  locationText: {
    color: COLORS.muted,
    fontSize: 12,
    flex: 1,
  },
  heroDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 15,
  },
  title: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  muted: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191F1D',
    borderWidth: 1,
    borderColor: '#35402B',
    borderRadius: 19,
    padding: 16,
    marginBottom: 28,
    gap: 12,
  },
  feeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#293321',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeInfo: {
    flex: 1,
  },
  feeLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  feeAmount: {
    color: COLORS.lime,
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4,
  },
  feeCaption: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  feePaidBadge: {
    backgroundColor: '#293321',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
  },
  feePaidText: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  appointmentCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    padding: 16,
  },
  fieldHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  fieldRequired: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 17,
  },
  scheduleHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#191F1D',
    borderWidth: 1,
    borderColor: '#303A2A',
    padding: 14,
    borderRadius: 15,
    marginTop: 14,
  },
  scheduleHintText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
  },
  label: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 23,
  },
  input: {
    color: COLORS.white,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 105,
  },
  phoneField: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 16,
  },
  phonePrefix: {
    color: COLORS.lime,
    fontSize: 15,
    fontWeight: '900',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    color: COLORS.white,
    paddingVertical: 15,
    fontSize: 15,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 23,
  },
  noticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 19,
  },
  button: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 17,
  },
  reference: {
    color: COLORS.green,
    marginTop: 12,
    fontWeight: '800',
  },
});
