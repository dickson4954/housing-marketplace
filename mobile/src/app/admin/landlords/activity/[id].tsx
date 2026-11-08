import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, RefreshCw, Building2, Eye, CalendarCheck, Wallet } from 'lucide-react-native';
import { API_BASE_URL } from '@/config/api';

const C = {
  bg: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  text: '#F5F7F7',
  muted: '#9CA5A7',
  border: '#252C2E',
  red: '#FF7777',
  amber: '#F5C66A',
};

type StatusCount = { status: string; count: number };
type RecentProperty = {
  id: string;
  title?: string | null;
  status?: string | null;
  purpose?: string | null;
  county?: string | null;
  town?: string | null;
  createdAt?: string;
};
type PropertyHistory = {
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  changedById?: string | null;
  createdAt?: string;
};
type LandlordDetail = {
  id: string;
  applicationStatus?: string;
  idVerificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    accountStatus?: string | null;
    isActive?: boolean;
    statusHistory?: {
      status?: string;
      reason?: string | null;
      changedById?: string | null;
      createdAt?: string;
    }[];
  };
  properties?: {
    id: string;
    title?: string | null;
    status?: string | null;
    createdAt?: string;
    statusHistory?: PropertyHistory[];
  }[];
};
type Performance = {
  properties?: {
    total?: number;
    byStatus?: StatusCount[];
    recent?: RecentProperty[];
  };
  viewings?: { total?: number; completed?: number; cancelled?: number };
  inspections?: { total?: number; completed?: number; cancelled?: number };
  bookings?: { total?: number; completed?: number; cancelled?: number };
  payments?: {
    status?: string;
    currency?: string;
    count?: number;
    amount?: number | string;
  }[];
  note?: string;
};

async function getAdminToken() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem('makazii_admin_token');
  }
  return SecureStore.getItemAsync('makazii_admin_token');
}

async function apiRequest(path: string) {
  const token = await getAdminToken();
  if (!token) throw new Error('Admin session has expired. Please sign in again.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status}).`);
  }
  return payload;
}

function readable(value?: string | null) {
  return String(value || 'Not recorded').replace(/_/g, ' ');
}

function dateLabel(value?: string) {
  if (!value) return 'Date not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function money(value: number | string | null | undefined, currency?: string) {
  const amount = Number(value ?? 0);
  return `${currency || 'KES'} ${amount.toLocaleString('en-KE', {
    maximumFractionDigits: 2,
  })}`;
}

export default function LandlordActivityScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const landlordId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [detail, setDetail] = useState<LandlordDetail | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadActivity = useCallback(async (refresh = false) => {
    if (!landlordId) {
      setError('Missing landlord ID.');
      setLoading(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const encodedId = encodeURIComponent(landlordId);
      const [detailResult, performanceResult] = await Promise.all([
        apiRequest(`/admin/landlords/${encodedId}`),
        apiRequest(`/admin/landlords/${encodedId}/performance`),
      ]);

      const landlord = detailResult.landlord ?? detailResult.data?.landlord ?? detailResult.data;
      const stats = performanceResult.data ?? performanceResult;

      if (!landlord) throw new Error('The landlord record was not returned by the server.');
      setDetail(landlord);
      setPerformance(stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load landlord activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [landlordId]);

  useEffect(() => {
    let active = true;

    async function loadInitialActivity() {
      if (!landlordId) {
        setError('Missing landlord ID.');
        setLoading(false);
        return;
      }

      try {
        const encodedId = encodeURIComponent(landlordId);
        const [detailResult, performanceResult] = await Promise.all([
          apiRequest(`/admin/landlords/${encodedId}`),
          apiRequest(`/admin/landlords/${encodedId}/performance`),
        ]);

        const landlord =
          detailResult.landlord ??
          detailResult.data?.landlord ??
          detailResult.data;
        const stats = performanceResult.data ?? performanceResult;

        if (!landlord) {
          throw new Error('The landlord record was not returned by the server.');
        }

        if (active) {
          setDetail(landlord);
          setPerformance(stats);
        }
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load landlord activity.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialActivity();

    return () => {
      active = false;
    };
  }, [landlordId]);

  const name = [detail?.user?.firstName, detail?.user?.lastName]
    .filter(Boolean).join(' ') || 'Landlord';

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.lime} />
          <Text style={s.muted}>Loading landlord activity…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadActivity(true)}
            tintColor={C.lime}
          />
        }
      >
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={C.lime} />
          <Text style={s.backText}>Back to landlord</Text>
        </Pressable>

        <View style={s.headingRow}>
          <View style={s.headingCopy}>
            <Text style={s.eyebrow}>ADMIN · LANDLORD RECORD</Text>
            <Text style={s.title}>Activity overview</Text>
            <Text style={s.muted}>{name}</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh landlord activity"
            style={s.refreshButton}
            onPress={() => void loadActivity(true)}
          >
            <RefreshCw size={18} color={C.lime} />
          </Pressable>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
            <Pressable style={s.retryButton} onPress={() => void loadActivity()}>
              <Text style={s.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {detail ? (
          <>
            <View style={s.panel}>
              <Text style={s.sectionTitle}>Account and application</Text>
              <View style={s.badgeRow}>
                <StatusBadge label={`Application · ${readable(detail.applicationStatus)}`} />
                <StatusBadge label={`ID check · ${readable(detail.idVerificationStatus)}`} />
                <StatusBadge label={`Account · ${readable(detail.user?.accountStatus)}`} />
              </View>
              <Info label="Registered" value={dateLabel(detail.user?.statusHistory?.length ? detail.createdAt : detail.createdAt)} />
              <Info label="Last account update" value={dateLabel(detail.updatedAt)} />
              <Info label="Account enabled" value={detail.user?.isActive == null ? 'Not recorded' : detail.user.isActive ? 'Yes' : 'No'} />
            </View>

            <Text style={s.sectionTitle}>Marketplace performance</Text>
            <View style={s.metricGrid}>
              <Metric icon={<Building2 size={18} color={C.lime} />} label="Properties" value={performance?.properties?.total ?? 0} />
              <Metric icon={<Eye size={18} color={C.lime} />} label="Viewings" value={performance?.viewings?.total ?? 0} />
              <Metric icon={<CalendarCheck size={18} color={C.lime} />} label="Inspections" value={performance?.inspections?.total ?? 0} />
              <Metric icon={<CalendarCheck size={18} color={C.lime} />} label="Bookings" value={performance?.bookings?.total ?? 0} />
            </View>

            <View style={s.panel}>
              <Text style={s.sectionTitle}>Property statuses</Text>
              {(performance?.properties?.byStatus ?? []).length ? (
                performance!.properties!.byStatus!.map((item) => (
                  <Info key={item.status} label={readable(item.status)} value={item.count} />
                ))
              ) : (
                <Text style={s.muted}>No property status counts recorded.</Text>
              )}
            </View>

            <View style={s.twoColumns}>
              <ActivityPanel
                title="Viewings"
                total={performance?.viewings?.total}
                completed={performance?.viewings?.completed}
                cancelled={performance?.viewings?.cancelled}
              />
              <ActivityPanel
                title="Inspections"
                total={performance?.inspections?.total}
                completed={performance?.inspections?.completed}
                cancelled={performance?.inspections?.cancelled}
              />
              <ActivityPanel
                title="Bookings"
                total={performance?.bookings?.total}
                completed={performance?.bookings?.completed}
                cancelled={performance?.bookings?.cancelled}
              />
            </View>

            <View style={s.panel}>
              <View style={s.inlineHeading}>
                <Wallet size={18} color={C.lime} />
                <Text style={s.sectionTitle}>Recorded customer payments</Text>
              </View>
              {(performance?.payments ?? []).length ? (
                performance!.payments!.map((item, index) => (
                  <View key={`${item.status}-${item.currency}-${index}`} style={s.paymentRow}>
                    <View style={s.flex}>
                      <Text style={s.rowTitle}>{readable(item.status)}</Text>
                      <Text style={s.muted}>{item.count ?? 0} payment record(s)</Text>
                    </View>
                    <Text style={s.amount}>{money(item.amount, item.currency)}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.muted}>No linked payment records found.</Text>
              )}
              <Text style={s.notice}>
                {performance?.note || 'These are recorded customer payments, not confirmed landlord earnings or payouts.'}
              </Text>
            </View>

            <View style={s.panel}>
              <Text style={s.sectionTitle}>Recent properties</Text>
              {(performance?.properties?.recent ?? []).length ? (
                performance!.properties!.recent!.map((property) => (
                  <Pressable
                    key={property.id}
                    style={s.propertyRow}
                    onPress={() => router.push({
                      pathname: '/admin/properties/[id]',
                      params: { id: property.id },
                    })}
                  >
                    <View style={s.flex}>
                      <Text style={s.rowTitle}>{property.title || 'Untitled property'}</Text>
                      <Text style={s.muted}>
                        {[property.town, property.county].filter(Boolean).join(', ') || 'Location not recorded'}
                      </Text>
                      <Text style={s.smallMuted}>
                        {readable(property.purpose)} · {dateLabel(property.createdAt)}
                      </Text>
                    </View>
                    <StatusBadge label={readable(property.status)} />
                  </Pressable>
                ))
              ) : (
                <Text style={s.muted}>This landlord has no associated properties yet.</Text>
              )}
            </View>

            <View style={s.panel}>
              <Text style={s.sectionTitle}>Property status history</Text>
              {(() => {
                const events = (detail.properties ?? []).flatMap((property) =>
                  (property.statusHistory ?? []).map((event) => ({
                    ...event,
                    propertyTitle: property.title || 'Untitled property',
                    propertyId: property.id,
                  })),
                ).sort((a, b) =>
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
                );

                if (!events.length) {
                  return <Text style={s.muted}>No property status history has been recorded.</Text>;
                }

                return events.slice(0, 20).map((event, index) => (
                  <View key={`${event.propertyId}-${event.createdAt}-${index}`} style={s.historyRow}>
                    <View style={s.historyDot} />
                    <View style={s.flex}>
                      <Text style={s.rowTitle}>{event.propertyTitle}</Text>
                      <Text style={s.historyStatus}>
                        {readable(event.fromStatus)} → {readable(event.toStatus)}
                      </Text>
                      {event.note ? <Text style={s.muted}>{event.note}</Text> : null}
                      <Text style={s.smallMuted}>{dateLabel(event.createdAt)}</Text>
                    </View>
                  </View>
                ));
              })()}
            </View>

            <View style={s.panel}>
              <Text style={s.sectionTitle}>Account status history</Text>
              {(detail.user?.statusHistory ?? []).length ? (
                detail.user!.statusHistory!.map((event, index) => (
                  <View key={`${event.createdAt}-${index}`} style={s.historyRow}>
                    <View style={s.historyDot} />
                    <View style={s.flex}>
                      <Text style={s.rowTitle}>{readable(event.status)}</Text>
                      {event.reason ? <Text style={s.muted}>{event.reason}</Text> : null}
                      <Text style={s.smallMuted}>{dateLabel(event.createdAt)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={s.muted}>No account status changes recorded.</Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View style={s.metric}>
      {icon}
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value == null || value === '' ? 'Not recorded' : String(value)}</Text>
    </View>
  );
}

function StatusBadge({ label }: { label: string }) {
  const upper = label.toUpperCase();
  const color = upper.includes('ACTIVE') || upper.includes('APPROVED') ||
    upper.includes('VERIFIED') || upper.includes('COMPLETED')
    ? C.lime
    : upper.includes('REJECTED') || upper.includes('CANCELLED') ||
      upper.includes('SUSPENDED') || upper.includes('INACTIVE')
      ? C.red
      : C.amber;

  return (
    <View style={[s.badge, { borderColor: color }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ActivityPanel({
  title,
  total,
  completed,
  cancelled,
}: {
  title: string;
  total?: number;
  completed?: number;
  cancelled?: number;
}) {
  return (
    <View style={[s.panel, s.activityPanel]}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Info label="Total" value={total ?? 0} />
      <Info label="Completed" value={completed ?? 0} />
      <Info label="Cancelled" value={cancelled ?? 0} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, backgroundColor: C.bg },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: C.text, fontWeight: '700' },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: C.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.text, fontSize: 27, fontWeight: '900' },
  muted: { color: C.muted, fontSize: 12, lineHeight: 19 },
  smallMuted: { color: C.muted, fontSize: 10, lineHeight: 16 },
  refreshButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  panel: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 17, gap: 12 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  badge: { borderWidth: 1, borderRadius: 30, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: C.cardSoft },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexGrow: 1, flexBasis: 130, minWidth: 120, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 15, gap: 7 },
  metricValue: { color: C.text, fontSize: 25, fontWeight: '900' },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  activityPanel: { flexGrow: 1, flexBasis: 220 },
  infoRow: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 9, gap: 4 },
  infoLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' },
  infoValue: { color: C.text, fontSize: 13, lineHeight: 19 },
  inlineHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 10 },
  flex: { flex: 1, gap: 4 },
  rowTitle: { color: C.text, fontSize: 13, fontWeight: '800' },
  amount: { color: C.lime, fontSize: 12, fontWeight: '900' },
  notice: { color: C.muted, fontSize: 11, lineHeight: 17, backgroundColor: C.cardSoft, padding: 11, borderRadius: 10 },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.lime, marginTop: 5 },
  historyStatus: { color: C.lime, fontSize: 11, fontWeight: '800' },
  errorBox: { backgroundColor: '#281819', borderRadius: 12, padding: 14, gap: 10 },
  errorText: { color: C.red, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: C.cardSoft, borderRadius: 9 },
  retryText: { color: C.lime, fontWeight: '800' },
});
