import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react-native';

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

type Booking = {
  id: string;
  checkInDate: string;
  checkOutDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  guests: number;
  stayMode: string;
  status: string;
  totalAmount: number | string;
  currency: string;
  depositAmount: number | string;
  balanceAmount: number | string;
  amountPaid: number | string;
  depositPaidAt?: string | null;
  balancePaidAt?: string | null;
  confirmedAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  property?: {
    id: string;
    title: string;
    county?: string | null;
    town?: string | null;
    area?: string | null;
    bedrooms?: number | null;
    images?: Array<{ id: string; url: string; isPrimary?: boolean }>;
  } | null;
};

type BookingsResponse = {
  success: boolean;
  message?: string;
  data?: {
    bookings?: Booking[];
  };
};

type InitiatePaymentResponse = {
  success: boolean;
  message?: string;
  data?: {
    payment?: {
      id?: string;
      status?: string;
    };
    customerMessage?: string;
  };
};

type PaymentStatusResponse = {
  success: boolean;
  message?: string;
  data?: {
    payment?: {
      id: string;
      status: string;
    };
  };
};

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  success: '#8BE28B',
  warning: '#FFD166',
  danger: '#FF6B6B',
  blue: '#72B7FF',
};

const money = (value: number | string | null | undefined, currency = 'KES') =>
  `${currency} ${Number(value || 0).toLocaleString('en-KE')}`;

function dateLabel(value?: string | null) {
  if (!value) return 'Not specified';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function dateTimeLabel(value?: string | null) {
  if (!value) return 'Not recorded';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusColor(status: string) {
  if (['CONFIRMED', 'CHECKED_IN', 'STAYING', 'COMPLETED', 'CHECKED_OUT'].includes(status)) {
    return C.success;
  }

  if (['CANCELLED', 'EXPIRED'].includes(status)) {
    return C.danger;
  }

  if (status === 'PENDING_PAYMENT') return C.warning;

  return C.blue;
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function StayBookingsSection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

  const loadBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await SecureStore.getItemAsync('makazii_customer_token');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.customerStayBookings}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json() as BookingsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not load your stay bookings.');
      }

      setBookings(result.data?.bookings ?? []);
    } catch (error) {
      console.error('Stay bookings loading error:', error);
      Alert.alert(
        'Unable to load bookings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings]),
  );

  const payBalance = async (booking: Booking) => {
    const deposit = Number(booking.depositAmount || 0);
    const balance = Number(booking.balanceAmount || 0);
    const paid = Number(booking.amountPaid || 0);
    const balanceAlreadyPaid = Math.max(0, paid - deposit);
    const outstanding = Math.max(0, balance - balanceAlreadyPaid);

    if (outstanding <= 0) {
      Alert.alert('No balance due', 'Your accommodation payment is complete.');
      return;
    }

    const normalizedPhone = phoneNumber.replace(/\s/g, '');

    if (!/^(\+?254|0)?[17]\d{8}$/.test(normalizedPhone)) {
      Alert.alert(
        'Invalid M-Pesa number',
        'Enter a valid Kenyan mobile number before continuing.',
      );
      return;
    }

    Alert.alert(
      'Pay booking balance',
      `Outstanding accommodation balance: ${money(outstanding, booking.currency)}\n\nThe payment will be sent to your phone through Safaricom M-Pesa. Your booking will only be updated after payment confirmation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue to M-Pesa',
          onPress: () => {
            void startBalancePayment(booking, normalizedPhone);
          },
        },
      ],
    );
  };

  const startBalancePayment = async (booking: Booking, phone: string) => {
    setPayingBookingId(booking.id);

    try {
      const token = await SecureStore.getItemAsync('makazii_customer_token');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.initiateStayBookingBalancePayment(booking.id)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: phone }),
        },
      );

      const result = await response.json() as InitiatePaymentResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'The M-Pesa balance payment could not be started.',
        );
      }

      const paymentId = result.data?.payment?.id;

      if (!paymentId) {
        throw new Error(
          'The payment response did not contain a payment ID. Do not pay again. Refresh your bookings or contact support.',
        );
      }

      Alert.alert(
        'M-Pesa request sent',
        result.message ||
          result.data?.customerMessage ||
          'Check your phone and enter your M-Pesa PIN. MAKAZII will verify the payment with Safaricom.',
      );

      let finalStatus = '';

      for (let attempt = 0; attempt < 24; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.customerPaymentStatus(paymentId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          },
        );

        const statusResult =
          await statusResponse.json() as PaymentStatusResponse;

        if (!statusResponse.ok || !statusResult.success) {
          throw new Error(
            statusResult.message ||
              'Could not verify the payment. Check your booking before attempting another payment.',
          );
        }

        finalStatus = statusResult.data?.payment?.status || '';

        if (finalStatus === 'SUCCESS') {
          await loadBookings(false);

          Alert.alert(
            'Balance payment received',
            'Safaricom has confirmed your M-Pesa payment. Your booking payment record has been refreshed.',
          );
          return;
        }

        if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(finalStatus)) {
          throw new Error(
            'Safaricom did not confirm this payment. Check your booking status before attempting another payment.',
          );
        }
      }

      Alert.alert(
        'Payment still processing',
        'Safaricom has not yet provided final confirmation. Do not pay again. Refresh your bookings shortly to check the updated balance.',
      );
    } catch (error) {
      Alert.alert(
        'Balance payment',
        error instanceof Error ? error.message : 'Unable to complete payment.',
      );
    } finally {
      setPayingBookingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={C.lime} />
        <Text style={styles.mutedText}>Loading your stay bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your stay bookings</Text>
          <Text style={styles.sectionSubtitle}>
            Accommodation reservations, payments and check-in details
          </Text>
        </View>

        <Pressable
          onPress={() => void loadBookings(false)}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          {refreshing
            ? <ActivityIndicator size="small" color={C.lime} />
            : <Text style={styles.refreshText}>Refresh</Text>}
        </Pressable>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <CalendarDays size={30} color={C.lime} />
          </View>
          <Text style={styles.emptyTitle}>No stay bookings yet</Text>
          <Text style={styles.emptyDescription}>
            When you reserve a short-stay property, your booking, deposit and
            accommodation balance will appear here.
          </Text>
        </View>
      ) : (
        bookings.map(booking => {
          const property = booking.property;
          const imageUrl = property?.images?.[0]?.url;
          const total = Number(booking.totalAmount || 0);
          const paid = Number(booking.amountPaid || 0);
          const deposit = Number(booking.depositAmount || 0);
          const balanceAlreadyPaid = Math.max(0, paid - deposit);
          const balanceRemaining = Math.max(
            0,
            Number(booking.balanceAmount || 0) - balanceAlreadyPaid,
          );
          const remaining =
            paid < deposit
              ? Math.max(0, total - paid)
              : balanceRemaining;
          const color = statusColor(booking.status);
          const isPaying = payingBookingId === booking.id;
          const canPayBalance =
            balanceRemaining > 0 &&
            paid > 0 &&
            ['PAID', 'AWAITING_ASSIGNMENT', 'ASSIGNED', 'CONFIRMED'].includes(booking.status);

          return (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.propertyHeader}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.propertyImage} />
                ) : (
                  <View style={[styles.propertyImage, styles.imageFallback]}>
                    <CalendarDays size={24} color={C.muted} />
                  </View>
                )}

                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={2}>
                    {property?.title || 'Short-stay reservation'}
                  </Text>

                  <View style={styles.locationRow}>
                    <MapPin size={13} color={C.muted} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {[property?.area, property?.town, property?.county]
                        .filter(Boolean)
                        .join(', ') || 'Location not available'}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { borderColor: color }]}>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={[styles.statusText, { color }]}>
                      {statusLabel(booking.status)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <CalendarDays size={15} color={C.lime} />
                  <Text style={styles.detailLabel}>Check-in</Text>
                  <Text style={styles.detailValue}>{dateLabel(booking.checkInDate)}</Text>
                  {booking.startTime ? (
                    <Text style={styles.detailHint}>{booking.startTime}</Text>
                  ) : null}
                </View>

                <View style={styles.detailItem}>
                  <CalendarDays size={15} color={C.lime} />
                  <Text style={styles.detailLabel}>Check-out</Text>
                  <Text style={styles.detailValue}>
                    {dateLabel(booking.checkOutDate)}
                  </Text>
                  {booking.endTime ? (
                    <Text style={styles.detailHint}>{booking.endTime}</Text>
                  ) : null}
                </View>

                <View style={styles.detailItem}>
                  <Users size={15} color={C.lime} />
                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>{booking.guests}</Text>
                </View>
              </View>

              {(booking.checkedInAt || booking.checkedOutAt) ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.paymentHeading}>Stay activity</Text>

                  {booking.checkedInAt ? (
                    <View style={styles.paymentNote}>
                      <CheckCircle2 size={15} color={C.success} />
                      <Text style={styles.paymentNoteText}>
                        Actual check-in recorded: {dateTimeLabel(booking.checkedInAt)}
                      </Text>
                    </View>
                  ) : null}

                  {booking.checkedOutAt ? (
                    <View style={styles.paymentNote}>
                      <CheckCircle2 size={15} color={C.success} />
                      <Text style={styles.paymentNoteText}>
                        Actual check-out recorded: {dateTimeLabel(booking.checkedOutAt)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.divider} />

              <Text style={styles.paymentHeading}>Payment summary</Text>

              <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>Total accommodation cost</Text>
                <Text style={styles.moneyValue}>
                  {money(total, booking.currency)}
                </Text>
              </View>

              <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>Deposit required</Text>
                <Text style={styles.moneyValue}>
                  {money(deposit, booking.currency)}
                </Text>
              </View>

              <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>Amount received</Text>
                <Text style={[styles.moneyValue, { color: C.success }]}>
                  {money(paid, booking.currency)}
                </Text>
              </View>

              <View style={[styles.moneyRow, styles.balanceRow]}>
                <Text style={styles.balanceLabel}>Outstanding balance</Text>
                <Text style={styles.balanceValue}>
                  {money(remaining, booking.currency)}
                </Text>
              </View>

              {booking.depositPaidAt ? (
                <View style={styles.paymentNote}>
                  <CheckCircle2 size={15} color={C.success} />
                  <Text style={styles.paymentNoteText}>
                    Deposit confirmed
                  </Text>
                </View>
              ) : booking.status === 'PENDING_PAYMENT' ? (
                <View style={styles.paymentNote}>
                  <Clock3 size={15} color={C.warning} />
                  <Text style={styles.pendingNoteText}>
                    Waiting for deposit payment confirmation
                  </Text>
                </View>
              ) : null}

              {booking.balancePaidAt ? (
                <View style={styles.paymentNote}>
                  <CheckCircle2 size={15} color={C.success} />
                  <Text style={styles.paymentNoteText}>
                    Full accommodation balance confirmed
                  </Text>
                </View>
              ) : null}

              {canPayBalance ? (
                <View style={styles.balancePayment}>
                  <Text style={styles.inputLabel}>M-Pesa phone number</Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="e.g. 07XX XXX XXX"
                    placeholderTextColor={C.muted}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    style={styles.phoneInput}
                  />

                  <Pressable
                    style={[styles.payButton, isPaying && styles.disabledButton]}
                    onPress={() => void payBalance(booking)}
                    disabled={isPaying || payingBookingId !== null}
                  >
                    {isPaying ? (
                      <ActivityIndicator color={C.background} />
                    ) : (
                      <>
                        <Wallet size={17} color={C.background} />
                        <Text style={styles.payButtonText}>
                          Pay remaining balance
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Text style={styles.paymentDisclaimer}>
                    Payment is verified through Safaricom Daraja. Your booking
                    is only updated after confirmed payment.
                  </Text>
                </View>
              ) : null}

              {booking.status === 'CONFIRMED' && remaining > 0 ? (
                <Text style={styles.checkInNotice}>
                  Pay the outstanding balance before check-in. Check-in is
                  recorded by an authorized MAKAZII representative.
                </Text>
              ) : null}

              {booking.status === 'CONFIRMED' && remaining === 0 ? (
                <View style={styles.paymentNote}>
                  <CheckCircle2 size={15} color={C.success} />
                  <Text style={styles.paymentNoteText}>
                    Payment complete. Your booking is confirmed.
                  </Text>
                </View>
              ) : null}

              {['CHECKED_IN', 'STAYING'].includes(booking.status) ? (
                <View style={styles.paymentNote}>
                  <CheckCircle2 size={15} color={C.success} />
                  <Text style={styles.paymentNoteText}>
                    Your stay is in progress.
                  </Text>
                </View>
              ) : null}

              {booking.status === 'CHECKED_OUT' ? (
                <View style={styles.paymentNote}>
                  <CheckCircle2 size={15} color={C.success} />
                  <Text style={styles.paymentNoteText}>
                    Check-out recorded. Your booking is awaiting completion.
                  </Text>
                </View>
              ) : null}

              {booking.status === 'COMPLETED' ? (
                <View style={styles.paymentNote}>
                  <CheckCircle2 size={15} color={C.success} />
                  <Text style={styles.paymentNoteText}>
                    This stay has been completed.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.bookingReference}>
                Booking reference: {booking.id}
              </Text>
            </View>
          );
        })
      )}

      <View style={styles.inspectionNotice}>
        <CreditCard size={17} color={C.warning} />
        <Text style={styles.inspectionNoticeText}>
          Physical property inspection fees are separate from accommodation
          payments and are not deducted from your stay booking.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  centerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mutedText: {
    color: C.muted,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  sectionHeading: {
    flex: 1,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  refreshButton: {
    minWidth: 68,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
  },
  refreshText: {
    color: C.lime,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  bookingCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    padding: 15,
    gap: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyImage: {
    width: 88,
    height: 88,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    gap: 7,
  },
  propertyTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '900',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: C.muted,
    fontSize: 11,
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailItem: {
    flex: 1,
    gap: 5,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 10,
  },
  detailValue: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  detailHint: {
    color: C.muted,
    fontSize: 10,
  },
  paymentHeading: {
    color: C.white,
    fontSize: 14,
    fontWeight: '900',
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  moneyLabel: {
    color: C.muted,
    fontSize: 12,
    flex: 1,
  },
  moneyValue: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  balanceRow: {
    backgroundColor: C.cardSoft,
    borderRadius: 11,
    padding: 11,
    marginTop: 2,
  },
  balanceLabel: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  balanceValue: {
    color: C.lime,
    fontSize: 14,
    fontWeight: '900',
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  paymentNoteText: {
    color: C.success,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  pendingNoteText: {
    color: C.warning,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  balancePayment: {
    backgroundColor: C.cardSoft,
    borderRadius: 13,
    padding: 12,
    gap: 9,
  },
  inputLabel: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  phoneInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: C.white,
    fontSize: 14,
    backgroundColor: C.background,
  },
  payButton: {
    minHeight: 47,
    borderRadius: 12,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    color: C.background,
    fontSize: 12,
    fontWeight: '900',
  },
  paymentDisclaimer: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  checkInNotice: {
    color: C.warning,
    fontSize: 11,
    lineHeight: 17,
  },
  bookingReference: {
    color: C.muted,
    fontSize: 9,
  },
  inspectionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 12,
  },
  inspectionNoticeText: {
    flex: 1,
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
