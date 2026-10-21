import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  RefreshCw,
  Search,
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
  red: '#FF7777',
  amber: '#F5C66A',
};

type Property = {
  id: string;
  title?: string | null;
  purpose?: string | null;
  status?: string | null;
  monthlyRent?: number | null;
  dayRate?: number | null;
  nightRate?: number | null;
  county?: string | null;
  town?: string | null;
  area?: string | null;
  verified?: boolean;
  available?: boolean;
  createdAt?: string;
};

type LandlordResponse = {
  id: string;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  properties?: Property[];
};

type Filter = 'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'RENTED';

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

function money(value?: number | null) {
  return value == null ? null : `KES ${Number(value).toLocaleString('en-KE')}`;
}

function pretty(value?: string | null) {
  return String(value || 'UNKNOWN').replace(/_/g, ' ');
}

function statusColor(value?: string | null) {
  const status = String(value || '').toUpperCase();
  if (['ACTIVE', 'PUBLISHED', 'APPROVED'].includes(status)) return C.lime;
  if (['REJECTED', 'INACTIVE', 'SUSPENDED'].includes(status)) return C.red;
  return C.amber;
}

export default function LandlordPropertiesScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const landlordId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [landlord, setLandlord] = useState<LandlordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    if (!landlordId) {
      setError('Missing landlord ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest(
        `/admin/landlords/${encodeURIComponent(landlordId)}`,
      );
      setLandlord(
        payload?.landlord ??
        payload?.data?.landlord ??
        payload?.data ??
        null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load landlord properties.');
    } finally {
      setLoading(false);
    }
  }, [landlordId]);

  useEffect(() => {
    void load();
  }, [load]);

  const properties = landlord?.properties ?? [];

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return properties.filter((property) => {
      const status = String(property.status || '').toUpperCase();

      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ACTIVE' && ['ACTIVE', 'PUBLISHED'].includes(status)) ||
        (filter === 'PENDING' && ['PENDING', 'PENDING_VERIFICATION', 'DRAFT', 'UNDER_REVIEW'].includes(status)) ||
        (filter === 'REJECTED' && status === 'REJECTED') ||
        (filter === 'RENTED' && status === 'RENTED');

      const searchable = [
        property.title,
        property.id,
        property.purpose,
        property.status,
        property.county,
        property.town,
        property.area,
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [properties, query, filter]);

  const landlordName = [
    landlord?.user?.firstName,
    landlord?.user?.lastName,
  ].filter(Boolean).join(' ') || 'Landlord';

  const filterOptions: { label: string; value: Filter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Rented', value: 'RENTED' },
  ];

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable
          style={s.backButton}
          onPress={() =>
            router.push({
              pathname: '/admin/landlords/application/[id]',
              params: { id: landlordId || '' },
            } as never)
          }
        >
          <ArrowLeft size={19} color={C.text} />
          <Text style={s.backText}>Back to landlord application</Text>
        </Pressable>

        <View style={s.headingRow}>
          <View style={s.headingCopy}>
            <Text style={s.eyebrow}>ADMINISTRATION / LANDLORDS</Text>
            <Text style={s.title}>Landlord properties</Text>
            <Text style={s.subtitle}>
              {landlordName} · {properties.length} total properties
            </Text>
          </View>
          <Pressable style={s.refreshButton} onPress={() => void load()}>
            <RefreshCw size={18} color={C.lime} />
          </Pressable>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.lime} />
            <Text style={s.muted}>Loading properties…</Text>
          </View>
        ) : error ? (
          <View style={s.emptyCard}>
            <Text style={s.error}>{error}</Text>
            <Pressable style={s.primaryButton} onPress={() => void load()}>
              <Text style={s.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={s.statsRow}>
              <Stat label="Total" value={properties.length} />
              <Stat
                label="Verified"
                value={properties.filter((p) => p.verified).length}
              />
              <Stat
                label="Available"
                value={properties.filter((p) => p.available).length}
              />
            </View>

            <View style={s.searchBox}>
              <Search size={18} color={C.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search title, location or property ID"
                placeholderTextColor={C.muted}
                style={s.searchInput}
                autoCapitalize="none"
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filters}
            >
              {filterOptions.map((option) => {
                const selected = filter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setFilter(option.value)}
                    style={[s.filterChip, selected && s.filterChipSelected]}
                  >
                    <Text style={[s.filterText, selected && s.filterTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={s.resultCount}>
              Showing {filteredProperties.length} of {properties.length} properties
            </Text>

            {filteredProperties.map((property) => {
              const location = [
                property.area,
                property.town,
                property.county,
              ].filter(Boolean).join(', ');

              const price =
                money(property.monthlyRent) ??
                money(property.dayRate) ??
                money(property.nightRate) ??
                'Price not set';

              return (
                <Pressable
                  key={property.id}
                  style={s.propertyCard}
                  onPress={() =>
                    router.push({
                      pathname: '/admin/properties/[id]',
                      params: { id: property.id },
                    } as never)
                  }
                >
                  <View style={s.propertyIcon}>
                    <Building2 size={22} color={C.lime} />
                  </View>

                  <View style={s.propertyInfo}>
                    <Text style={s.propertyTitle}>
                      {property.title || 'Untitled property'}
                    </Text>
                    <Text style={s.location}>
                      {location || 'Location not provided'}
                    </Text>
                    <Text style={s.propertyId} numberOfLines={1}>
                      ID: {property.id}
                    </Text>

                    <View style={s.badges}>
                      <View style={[s.badge, { borderColor: statusColor(property.status) }]}>
                        <Text style={[s.badgeText, { color: statusColor(property.status) }]}>
                          {pretty(property.status)}
                        </Text>
                      </View>
                      <View style={[s.badge, { borderColor: property.verified ? C.lime : C.amber }]}>
                        <Text style={[s.badgeText, { color: property.verified ? C.lime : C.amber }]}>
                          {property.verified ? 'VERIFIED' : 'NOT VERIFIED'}
                        </Text>
                      </View>
                      <View style={[s.badge, { borderColor: property.available ? C.lime : C.muted }]}>
                        <Text style={[s.badgeText, { color: property.available ? C.lime : C.muted }]}>
                          {property.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.propertyRight}>
                    <Text style={s.price}>{price}</Text>
                    <Text style={s.purpose}>{pretty(property.purpose)}</Text>
                    <ChevronRight size={20} color={C.muted} />
                  </View>
                </Pressable>
              );
            })}

            {filteredProperties.length === 0 && (
              <View style={s.emptyCard}>
                <Building2 size={30} color={C.muted} />
                <Text style={s.emptyTitle}>No matching properties</Text>
                <Text style={s.muted}>
                  Try another search term or status filter.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 22, paddingBottom: 48, gap: 18 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: C.text, fontWeight: '600' },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: C.lime, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: C.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20 },
  muted: { color: C.muted, fontSize: 13, lineHeight: 20 },
  refreshButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  center: { padding: 36, alignItems: 'center', justifyContent: 'center', gap: 12 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: 100, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, padding: 16, gap: 5 },
  statValue: { color: C.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 11, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 14, minHeight: 50 },
  searchInput: { flex: 1, color: C.text, fontSize: 13, paddingVertical: 12 },
  filters: { gap: 8, paddingVertical: 2 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 24, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterChipSelected: { backgroundColor: C.lime, borderColor: C.lime },
  filterText: { color: C.muted, fontSize: 12, fontWeight: '800' },
  filterTextSelected: { color: C.bg },
  resultCount: { color: C.muted, fontSize: 12 },
  propertyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 16 },
  propertyIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  propertyInfo: { flex: 1, minWidth: 140, gap: 5 },
  propertyTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  location: { color: C.muted, fontSize: 12 },
  propertyId: { color: C.muted, fontSize: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { fontSize: 9, fontWeight: '900' },
  propertyRight: { alignItems: 'flex-end', gap: 7, maxWidth: 150 },
  price: { color: C.lime, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  purpose: { color: C.muted, fontSize: 10, textTransform: 'capitalize', textAlign: 'right' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  error: { color: C.red, lineHeight: 20 },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: C.lime },
  primaryButtonText: { color: C.bg, fontSize: 12, fontWeight: '900' },
});
