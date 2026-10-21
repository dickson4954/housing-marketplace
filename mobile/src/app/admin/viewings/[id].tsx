import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Home,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { API_BASE_URL } from '@/config/api';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF6B6B',
  warning: '#FFC857',
  success: '#7BE495',
};

type Person = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Marketer = {
  id?: string | null;
  user?: Person | null;
};

type Payment = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  method?: string | null;
  provider?: string | null;
  reference?: string | null;
  providerReference?: string | null;
  status?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
};

type History = {
  id: string;
  status?: string | null;
  note?: string | null;
  createdAt?: string | null;
};

type Property = {
  id: string;
  title?: string | null;
  description?: string | null;
  purpose?: string | null;
  longStayType?: string | null;
  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  serviceCharge?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: string | null;
  available?: boolean | null;
  verified?: boolean | null;
  status?: string | null;
  county?: string | null;
  town?: string | null;
  area?: string | null;
  countyRelation?: { name?: string | null } | null;
  constituency?: { name?: string | null } | null;
  ward?: { name?: string | null } | null;
  images?: { id?: string; url?: string | null; isPrimary?: boolean }[];
  marketer?: Marketer | null;
};

type Viewing = {
  id: string;
  propertyId: string;
  renterId: string;
  status: string;
  requestedDate?: string | null;
  preferredTime?: string | null;
  scheduledAt?: string | null;
  notes?: string | null;
  requestedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  assignedAt?: string | null;
  confirmedAt?: string | null;
  completedAt?: string | null;
  renter?: Person | null;
  property?: Property | null;
  assignedMarketer?: Marketer | null;
  payments?: Payment[];
  statusHistory?: History[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: { viewing?: Viewing };
};

async function getAdminToken(): Promise<string | null> {
  const key = 'makazii_admin_token';

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAdminToken();

  if (!token) {
    throw new Error('Your admin session has expired. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let body: any = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(
      typeof body.message === 'string'
        ? body.message
        : `Request failed (${response.status})`,
    );
  }

  return body as T;
}

function personName(person?: Person | null) {
  const name = [person?.firstName, person?.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim();

  return name || 'Not provided';
}

function marketerName(marketer?: Marketer | null) {
  return personName(marketer?.user);
}

function propertyLocation(property?: Property | null) {
  if (!property) return 'Location unavailable';

  const parts = [
    property.area,
    property.town,
    property.ward?.name,
    property.constituency?.name,
    property.countyRelation?.name || property.county,
  ].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  return parts.length ? [...new Set(parts)].join(', ') : 'Location not provided';
}

function money(amount?: number | null, currency = 'KES') {
  if (amount === null || amount === undefined) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-KE')}`;
}

function dateTime(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pretty(value?: string | null) {
  if (!value) return '—';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text selectable style={styles.fieldValue}>{value?.trim() || '—'}</Text>
    </View>
  );
}

export default function AdminViewingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const viewingId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  const loadViewing = useCallback(async (showLoader = true) => {
    if (!viewingId) {
      setError('Viewing ID is missing.');
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await apiRequest<ApiResponse>(
        `/admin/viewings/${encodeURIComponent(viewingId)}`,
      );

      if (!response.data?.viewing) {
        throw new Error(response.message || 'The backend returned no viewing details.');
      }

      setViewing(response.data.viewing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load viewing details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewingId]);

  useEffect(() => {
    void loadViewing();
  }, [loadViewing]);

  const approveViewing = () => {
    if (!viewing || viewing.status !== 'PAID') return;

    Alert.alert(
      'Approve viewing?',
      'The backend will assign the property source marketer and update this viewing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setApproving(true);

              const response = await apiRequest<ApiResponse>(
                `/admin/viewings/${encodeURIComponent(viewing.id)}/approve`,
                { method: 'POST' },
              );

              if (response.data?.viewing) {
                setViewing(response.data.viewing);
              } else {
                await loadViewing(false);
              }

              Alert.alert(
                'Viewing approved',
                response.message || 'The viewing approval request succeeded.',
              );
            } catch (err) {
              Alert.alert(
                'Approval failed',
                err instanceof Error ? err.message : 'Unable to approve this viewing.',
              );
            } finally {
              setApproving(false);
            }
          },
        },
      ],
    );
  };

  const property = viewing?.property;
  const primaryImage =
    property?.images?.find((image) => image.isPrimary)?.url ||
    property?.images?.[0]?.url;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.lime} />
        <Text style={styles.mutedText}>Loading viewing details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={C.white} />
        </Pressable>
        <View style={styles.topBarText}>
          <Text style={styles.pageTitle}>Viewing details</Text>
          <Text numberOfLines={1} style={styles.pageSubtitle}>
            {viewing?.id || viewingId}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setRefreshing(true);
            void loadViewing(false);
          }}
          style={styles.backButton}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={C.lime} />
          ) : (
            <RefreshCw size={18} color={C.white} />
          )}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadViewing()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !viewing ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Viewing details are unavailable.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadViewing(false);
              }}
              tintColor={C.lime}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusCard}>
            <View style={styles.statusTop}>
              <Text style={styles.eyebrow}>CURRENT STATUS</Text>
              <View
                style={[
                  styles.statusBadge,
                  viewing.status === 'PAID' && styles.paidBadge,
                  viewing.status === 'COMPLETED' && styles.completedBadge,
                  ['CANCELLED', 'DECLINED'].includes(viewing.status) && styles.cancelledBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>{pretty(viewing.status)}</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              {viewing.status === 'PAID'
                ? 'Payment is recorded. This request is ready for admin approval.'
                : `This viewing is currently ${pretty(viewing.status).toLowerCase()}.`}
            </Text>
            <Field label="Request created" value={dateTime(viewing.createdAt)} />
          </View>

          <Section title="Property" icon={<Home size={19} color={C.lime} />}>
            {primaryImage ? (
              <Image source={{ uri: primaryImage }} style={styles.propertyImage} />
            ) : (
              <View style={[styles.propertyImage, styles.imagePlaceholder]}>
                <Home size={34} color={C.muted} />
              </View>
            )}
            <Text style={styles.propertyTitle}>{property?.title || 'Untitled property'}</Text>
            <View style={styles.locationLine}>
              <MapPin size={16} color={C.lime} />
              <Text style={styles.locationText}>{propertyLocation(property)}</Text>
            </View>
            <Field label="Property ID" value={property?.id} />
            <Field label="Purpose" value={pretty(property?.purpose)} />
            <Field label="Accommodation type" value={pretty(property?.longStayType)} />
            <Field label="Monthly rent" value={money(property?.monthlyRent)} />
            <Field label="Deposit" value={money(property?.deposit)} />
            <Field label="Viewing fee" value={money(property?.viewingFee)} />
            <Field label="Service charge" value={money(property?.serviceCharge)} />
            <Field label="Bedrooms" value={property?.bedrooms?.toString()} />
            <Field label="Bathrooms" value={property?.bathrooms?.toString()} />
            <Field label="Furnishing" value={pretty(property?.furnishing)} />
            <Field label="Availability" value={property?.available === undefined ? '—' : property.available ? 'Available' : 'Unavailable'} />
            <Field label="Verification" value={property?.verified === undefined ? '—' : property.verified ? 'Verified' : 'Not verified'} />
            {property?.description ? <Field label="Description" value={property.description} /> : null}
          </Section>

          <Section title="Customer" icon={<UserRound size={19} color={C.lime} />}>
            <Field label="Name" value={personName(viewing.renter)} />
            <Field label="Email" value={viewing.renter?.email} />
            <Field label="Phone" value={viewing.renter?.phone} />
            <Field label="Customer ID" value={viewing.renter?.id || viewing.renterId} />
            <Field label="Requested by" value={pretty(viewing.requestedBy)} />
          </Section>

          <Section title="Viewing arrangements" icon={<CalendarDays size={19} color={C.lime} />}>
            <Field label="Requested date" value={dateTime(viewing.requestedDate)} />
            <Field label="Preferred time" value={viewing.preferredTime} />
            <Field label="Scheduled at" value={dateTime(viewing.scheduledAt)} />
            <Field label="Notes from customer" value={viewing.notes} />
            <Field label="Last updated" value={dateTime(viewing.updatedAt)} />
          </Section>

          <Section title="Payment records" icon={<CreditCard size={19} color={C.lime} />}>
            {viewing.payments?.length ? (
              viewing.payments.map((payment) => (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentTop}>
                    <Text style={styles.paymentAmount}>
                      {money(payment.amount, payment.currency || 'KES')}
                    </Text>
                    <Text style={styles.paymentStatus}>{pretty(payment.status)}</Text>
                  </View>
                  <Field label="Provider" value={payment.provider || payment.method} />
                  <Field label="Payment reference" value={payment.reference} />
                  <Field label="Provider reference" value={payment.providerReference} />
                  <Field label="Paid at" value={dateTime(payment.paidAt)} />
                  <Field label="Created at" value={dateTime(payment.createdAt)} />
                </View>
              ))
            ) : (
              <Text style={styles.mutedText}>No payment record is attached to this viewing.</Text>
            )}
          </Section>

          <Section title="Representative" icon={<ShieldCheck size={19} color={C.lime} />}>
            {viewing.assignedMarketer ? (
              <>
                <Field label="Name" value={marketerName(viewing.assignedMarketer)} />
                <Field label="Phone" value={viewing.assignedMarketer.user?.phone} />
                <Field label="Email" value={viewing.assignedMarketer.user?.email} />
                <Field label="Marketer ID" value={viewing.assignedMarketer.id} />
                <Field label="Assigned at" value={dateTime(viewing.assignedAt)} />
              </>
            ) : (
              <Text style={styles.mutedText}>
                No representative has been assigned yet.
              </Text>
            )}
            {property?.marketer ? (
              <Field label="Property source marketer" value={marketerName(property.marketer)} />
            ) : null}
          </Section>

          <Section title="Status history" icon={<Clock3 size={19} color={C.lime} />}>
            {viewing.statusHistory?.length ? (
              viewing.statusHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyStatus}>{pretty(item.status)}</Text>
                    <Text style={styles.historyDate}>{dateTime(item.createdAt)}</Text>
                    {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.mutedText}>No status history is available.</Text>
            )}
          </Section>

          {viewing.status === 'PAID' ? (
            <Pressable
              onPress={approveViewing}
              disabled={approving}
              style={[styles.approveButton, approving && styles.disabledButton]}
            >
              {approving ? (
                <ActivityIndicator color={C.background} />
              ) : (
                <CheckCircle2 size={19} color={C.background} />
              )}
              <Text style={styles.approveButtonText}>
                {approving ? 'Approving...' : 'Approve & Assign Source Marketer'}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
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
  topBarText: { flex: 1, minWidth: 0 },
  pageTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  pageSubtitle: { color: C.muted, fontSize: 11, marginTop: 4 },
  content: { padding: 18, gap: 16, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  statusCard: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  statusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  statusBadge: { backgroundColor: C.cardSoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  paidBadge: { backgroundColor: '#29331B' },
  completedBadge: { backgroundColor: '#193526' },
  cancelledBadge: { backgroundColor: '#3A2222' },
  statusBadgeText: { color: C.white, fontSize: 12, fontWeight: '800' },
  statusDescription: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 12, marginBottom: 12 },
  section: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 3 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  propertyImage: { width: '100%', height: 210, borderRadius: 14, backgroundColor: C.cardSoft },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  propertyTitle: { color: C.white, fontSize: 19, fontWeight: '800' },
  locationLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  locationText: { flex: 1, color: C.muted, fontSize: 13, lineHeight: 19 },
  field: { borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 8, gap: 4 },
  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '600' },
  fieldValue: { color: C.white, fontSize: 13, lineHeight: 19 },
  paymentCard: { backgroundColor: C.cardSoft, borderRadius: 13, padding: 13, gap: 4 },
  paymentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  paymentAmount: { color: C.lime, fontSize: 17, fontWeight: '800' },
  paymentStatus: { color: C.white, fontSize: 11, fontWeight: '800' },
  mutedText: { color: C.muted, fontSize: 13, lineHeight: 20 },
  historyItem: { flexDirection: 'row', gap: 12, paddingVertical: 9 },
  historyDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.lime, marginTop: 5 },
  historyContent: { flex: 1, gap: 4 },
  historyStatus: { color: C.white, fontSize: 13, fontWeight: '800' },
  historyDate: { color: C.muted, fontSize: 11 },
  historyNote: { color: C.muted, fontSize: 12, lineHeight: 18 },
  approveButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  approveButtonText: { color: C.background, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  disabledButton: { opacity: 0.65 },
  errorBox: { margin: 18, padding: 18, backgroundColor: C.card, borderRadius: 16, gap: 12 },
  errorText: { color: C.danger, fontSize: 13, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.cardSoft, borderRadius: 10 },
  retryText: { color: C.lime, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: C.background },
  bottomSpace: { height: 28 },
});
