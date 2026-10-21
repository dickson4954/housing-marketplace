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
import {
  ArrowLeft,
  Activity,
  Building2,
  MapPin,
  RefreshCw,
  CalendarClock,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react-native';
import { API_BASE_URL } from '@/config/api';

const C = {
  bg: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  text: '#F5F7F7',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#62D39B',
  amber: '#F5C66A',
  red: '#FF7777',
};

type PropertyRecord = {
  id: string;
  title?: string | null;
  status?: string | null;
  purpose?: string | null;
  county?: string | null;
  town?: string | null;
  area?: string | null;
  createdAt?: string;
};

type ViewingRecord = {
  id: string;
  status?: string | null;
  requestedDate?: string | null;
  preferredTime?: string | null;
  scheduledAt?: string | null;
  createdAt?: string;
  property?: {
    id?: string;
    title?: string | null;
    county?: string | null;
    town?: string | null;
  } | null;
};

type MarketerDetail = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    accountStatus?: string | null;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  coverage?: {
    county?: { name?: string } | null;
    constituency?: { name?: string } | null;
  } | null;
  properties?: PropertyRecord[];
  viewings?: ViewingRecord[];
  _count?: {
    properties?: number;
    viewings?: number;
    places?: number;
  };
};

async function getAdminToken() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem('makazii_admin_token');
  }
  return SecureStore.getItemAsync('makazii_admin_token');
}

function dateLabel(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pretty(value?: string | null) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColor(value?: string | null) {
  const status = (value ?? '').toUpperCase();
  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'CONFIRMED'].includes(status)) {
    return C.green;
  }
  if (['PENDING', 'ASSIGNED', 'PAID', 'AWAITING_ASSIGNMENT'].includes(status)) {
    return C.amber;
  }
  if (['INACTIVE', 'SUSPENDED', 'CANCELLED', 'REJECTED', 'DECLINED'].includes(status)) {
    return C.red;
  }
  return C.muted;
}

export default function MarketerActivityScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [detail, setDetail] = useState<MarketerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadActivity = useCallback(async (refresh = false) => {
    if (!id) {
      setError('No marketer ID was provided.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const token = await getAdminToken();
      if (!token) {
        throw new Error('Your admin session is missing. Please sign in again.');
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/marketers/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok || body?.success === false) {
        throw new Error(body?.message || 'Unable to load marketer activity.');
      }

      const marketer = body?.data?.marketer ?? body?.marketer;
      if (!marketer) {
        throw new Error('The server did not return marketer details.');
      }

      setDetail(marketer as MarketerDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const properties = detail?.properties ?? [];
  const viewings = detail?.viewings ?? [];
  const viewingCounts = viewings.reduce<Record<string, number>>((counts, item) => {
    const key = (item.status || 'UNKNOWN').toUpperCase();
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  const fullName = [
    detail?.user?.firstName,
    detail?.user?.lastName,
  ].filter(Boolean).join(' ') || 'Marketer';

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.lime} />
          <Text style={s.muted}>Loading marketer activity…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadActivity(true)}
            tintColor={C.lime}
            colors={[C.lime]}
          />
        }
      >
        <View style={s.topBar}>
          <Pressable style={s.backButton} onPress={() => router.back()}>
            <ArrowLeft size={19} color={C.text} />
          </Pressable>
          <View style={s.topCopy}>
            <Text style={s.eyebrow}>ADMIN / MARKETERS</Text>
            <Text style={s.title}>Marketer activity</Text>
          </View>
          <Pressable
            style={s.refreshButton}
            onPress={() => void loadActivity(true)}
            disabled={refreshing}
          >
            <RefreshCw size={18} color={C.lime} />
          </Pressable>
        </View>

        {!!error && (
          <View style={s.errorPanel}>
            <Text style={s.errorTitle}>Could not load activity</Text>
            <Text style={s.errorText}>{error}</Text>
            <Pressable style={s.retryButton} onPress={() => void loadActivity()}>
              <Text style={s.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {detail && (
          <>
            <View style={s.profileCard}>
              <View style={s.profileIcon}>
                <Activity size={23} color={C.lime} />
              </View>
              <View style={s.profileCopy}>
                <Text style={s.name}>{fullName}</Text>
                <Text style={s.muted}>{detail.user?.email || 'No email recorded'}</Text>
                <Text style={s.muted}>{detail.user?.phone || 'No phone recorded'}</Text>
              </View>
              <View style={[
                s.statusPill,
                { borderColor: statusColor(detail.user?.accountStatus) },
              ]}>
                <Text style={[
                  s.statusText,
                  { color: statusColor(detail.user?.accountStatus) },
                ]}>
                  {pretty(detail.user?.accountStatus)}
                </Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>Performance overview</Text>
            <View style={s.statsGrid}>
              <Stat icon={<Building2 size={18} color={C.lime} />} label="Properties" value={detail._count?.properties ?? properties.length} />
              <Stat icon={<CalendarClock size={18} color={C.lime} />} label="Viewings" value={detail._count?.viewings ?? viewings.length} />
              <Stat icon={<MapPin size={18} color={C.lime} />} label="Assigned places" value={detail._count?.places ?? 0} />
              <Stat icon={<CheckCircle2 size={18} color={C.lime} />} label="Completed viewings" value={viewingCounts.COMPLETED ?? 0} />
            </View>

            <Panel title="Coverage">
              <Info label="County" value={detail.coverage?.county?.name || 'Not assigned'} />
              <Info label="Constituency" value={detail.coverage?.constituency?.name || 'Not assigned'} />
              <Info label="Registered" value={dateLabel(detail.user?.createdAt || detail.createdAt)} />
              <Info label="Last updated" value={dateLabel(detail.user?.updatedAt || detail.updatedAt)} />
            </Panel>

            <Panel title="Viewing activity">
              {Object.keys(viewingCounts).length > 0 ? (
                Object.entries(viewingCounts).sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => (
                  <View key={status} style={s.statusRow}>
                    <View style={[s.statusDot, { backgroundColor: statusColor(status) }]} />
                    <Text style={s.rowLabel}>{pretty(status)}</Text>
                    <Text style={s.rowValue}>{count}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.muted}>No viewing activity has been recorded.</Text>
              )}

              {viewings.length > 0 && (
                <>
                  <View style={s.divider} />
                  <Text style={s.subheading}>Recent viewings</Text>
                  {viewings.slice(0, 8).map((item) => (
                    <View key={item.id} style={s.activityRow}>
                      <View style={s.activityIcon}>
                        <Clock3 size={17} color={C.lime} />
                      </View>
                      <View style={s.activityCopy}>
                        <Text style={s.rowLabel} numberOfLines={2}>
                          {item.property?.title || 'Property viewing'}
                        </Text>
                        <Text style={s.muted}>
                          {dateLabel(item.scheduledAt || item.requestedDate || item.createdAt)}
                        </Text>
                        {!!(item.property?.town || item.property?.county) && (
                          <Text style={s.muted}>
                            {[item.property?.town, item.property?.county].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </View>
                      <Text style={[
                        s.viewingStatus,
                        { color: statusColor(item.status) },
                      ]}>
                        {pretty(item.status)}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </Panel>

            <Panel title={`Properties (${detail._count?.properties ?? properties.length})`}>
              {properties.length ? properties.slice(0, 10).map((property) => (
                <Pressable
                  key={property.id}
                  style={s.activityRow}
                  onPress={() => router.push({
                    pathname: '/admin/properties/[id]',
                    params: { id: property.id },
                  } as never)}
                >
                  <View style={s.activityIcon}>
                    <Building2 size={17} color={C.lime} />
                  </View>
                  <View style={s.activityCopy}>
                    <Text style={s.rowLabel} numberOfLines={2}>
                      {property.title || 'Untitled property'}
                    </Text>
                    <Text style={s.muted}>
                      {[property.area, property.town, property.county].filter(Boolean).join(', ') || 'Location not provided'}
                    </Text>
                    <Text style={s.muted}>Added {dateLabel(property.createdAt)}</Text>
                  </View>
                  <View style={s.propertyStatus}>
                    <Text style={[
                      s.statusText,
                      { color: statusColor(property.status) },
                    ]}>
                      {pretty(property.status)}
                    </Text>
                  </View>
                </Pressable>
              )) : (
                <Text style={s.muted}>No properties are currently associated with this marketer.</Text>
              )}
              {properties.length > 10 && (
                <Text style={s.muted}>Showing the 10 most recent properties.</Text>
              )}
            </Panel>

            {!!detail.notes && (
              <Panel title="Admin notes">
                <Text style={s.bodyText}>{detail.notes}</Text>
              </Panel>
            )}

            <Text style={s.footerNote}>
              This is a read-only activity view. Account and property changes remain in their respective admin screens.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <View style={s.statCard}>
      <View style={s.statIcon}>{icon}</View>
      <Text style={s.statValue}>{value.toLocaleString('en-KE')}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.panel}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.muted}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  topCopy: { flex: 1 },
  eyebrow: { color: C.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  title: { color: C.text, fontSize: 22, fontWeight: '800', marginTop: 3 },
  refreshButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15 },
  profileIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cardSoft },
  profileCopy: { flex: 1, gap: 3 },
  name: { color: C.text, fontSize: 17, fontWeight: '800' },
  muted: { color: C.muted, fontSize: 12, lineHeight: 18 },
  statusPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '800' },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', flexGrow: 1, minWidth: 130, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, gap: 7 },
  statIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: C.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: C.muted, fontSize: 12 },
  panel: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  infoValue: { color: C.text, fontSize: 12, fontWeight: '700', textAlign: 'right', flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  rowLabel: { color: C.text, fontSize: 13, fontWeight: '700', flex: 1 },
  rowValue: { color: C.text, fontSize: 14, fontWeight: '800' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 3 },
  subheading: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  activityIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1, gap: 3 },
  viewingStatus: { fontSize: 10, fontWeight: '800', maxWidth: 92, textAlign: 'right' },
  propertyStatus: { maxWidth: 90, alignItems: 'flex-end' },
  bodyText: { color: C.muted, fontSize: 13, lineHeight: 20 },
  footerNote: { color: C.muted, fontSize: 11, lineHeight: 17, paddingHorizontal: 3 },
  errorPanel: { backgroundColor: C.card, borderColor: C.red, borderWidth: 1, borderRadius: 16, padding: 15, gap: 9 },
  errorTitle: { color: C.text, fontWeight: '800', fontSize: 15 },
  errorText: { color: C.muted, fontSize: 12, lineHeight: 18 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: C.lime, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  retryText: { color: C.bg, fontSize: 12, fontWeight: '800' },
});
