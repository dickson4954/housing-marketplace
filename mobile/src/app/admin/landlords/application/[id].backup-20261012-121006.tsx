import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ArrowLeft, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react-native';
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

type LandlordRecord = {
  id: string;
  questionnaire?: Record<string, unknown> | null;
  applicationStatus?: string;
  idVerificationStatus?: string;
  idVerificationMessage?: string | null;
  reviewNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    accountStatus?: string | null;
    isActive?: boolean;
    createdAt?: string;
  };
  properties?: Property[];
};

type ActionKind =
  | 'REVIEW'
  | 'ID_VERIFIED'
  | 'ID_REVIEW'
  | 'ID_REJECTED'
  | 'REQUEST_CHANGES'
  | 'APPROVE'
  | 'REJECT';

async function getAdminToken() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem('makazii_admin_token');
  }
  return SecureStore.getItemAsync('makazii_admin_token');
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await getAdminToken();
  if (!token) throw new Error('Admin session has expired. Please sign in again.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status}).`);
  }
  return payload;
}

function pretty(value?: string | null) {
  return String(value || 'Not provided').replace(/_/g, ' ');
}

function formatMoney(value?: number | null) {
  if (value == null) return 'Not set';
  return `KES ${Number(value).toLocaleString('en-KE')}`;
}

export default function LandlordApplicationDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const landlordId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [landlord, setLandlord] = useState<LandlordRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLandlord = useCallback(async () => {
    if (!landlordId) {
      setError('Missing landlord application ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(
        `/admin/landlords/${encodeURIComponent(landlordId)}`,
      );
      setLandlord(result.landlord ?? result.data?.landlord ?? result.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load landlord application.');
    } finally {
      setLoading(false);
    }
  }, [landlordId]);

  useEffect(() => {
    void loadLandlord();
  }, [loadLandlord]);

  const performAction = async (kind: ActionKind) => {
    if (!landlord || busy) return;

    const note = message.trim();
    const needsMessage = ['ID_REVIEW', 'ID_REJECTED', 'REQUEST_CHANGES', 'REJECT'].includes(kind);

    if (needsMessage && !note) {
      setError('Enter a reason or explanation before continuing.');
      return;
    }

    if (
      kind === 'APPROVE' &&
      String(landlord.idVerificationStatus).toUpperCase() !== 'VERIFIED'
    ) {
      setError('Verify the landlord ID before approving this application.');
      return;
    }

    let endpoint = 'review';
    let body: Record<string, string> = {};

    switch (kind) {
      case 'REVIEW':
        endpoint = 'review';
        break;
      case 'ID_VERIFIED':
        endpoint = 'id-verification';
        body = { status: 'VERIFIED', ...(note ? { message: note } : {}) };
        break;
      case 'ID_REVIEW':
        endpoint = 'id-verification';
        body = { status: 'REVIEW', message: note };
        break;
      case 'ID_REJECTED':
        endpoint = 'id-verification';
        body = { status: 'REJECTED', message: note };
        break;
      case 'REQUEST_CHANGES':
        endpoint = 'request-changes';
        body = { message: note };
        break;
      case 'APPROVE':
        endpoint = 'approve';
        if (note) body = { adminNotes: note };
        break;
      case 'REJECT':
        endpoint = 'reject';
        body = { rejectionReason: note };
        break;
    }

    setBusy(true);
    setError('');
    try {
      await apiRequest(
        `/admin/landlords/${encodeURIComponent(landlord.id)}/${endpoint}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      );
      setMessage('');
      await loadLandlord();

      if (Platform.OS !== 'web') {
        Alert.alert('Landlord updated', 'The action was submitted successfully.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete this action.');
    } finally {
      setBusy(false);
    }
  };

  const name = [landlord?.user?.firstName, landlord?.user?.lastName]
    .filter(Boolean)
    .join(' ') || 'Landlord';

  const applicationStatus = String(landlord?.applicationStatus || 'PENDING').toUpperCase();
  const idStatus = String(landlord?.idVerificationStatus || 'PENDING').toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.center}>
          <ActivityIndicator color={C.lime} size="large" />
          <Text style={s.muted}>Loading landlord application…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!landlord) {
    return (
      <SafeAreaView style={s.screen}>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft color={C.text} size={19} />
          <Text style={s.backText}>Back to landlords</Text>
        </Pressable>
        <View style={s.center}>
          <Text style={s.error}>{error || 'Landlord application not found.'}</Text>
          <Button label="Try again" onPress={() => void loadLandlord()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft color={C.text} size={19} />
          <Text style={s.backText}>Back to landlords</Text>
        </Pressable>

        <View style={s.headingRow}>
          <View style={s.headingCopy}>
            <Text style={s.eyebrow}>ADMINISTRATION / LANDLORDS</Text>
            <Text style={s.title}>Landlord application</Text>
            <Text style={s.muted}>Review applicant information, verify identity and make a decision.</Text>
          </View>
          <Pressable style={s.refreshButton} onPress={() => void loadLandlord()}>
            <RefreshCw color={C.lime} size={18} />
          </Pressable>
        </View>

        {!!error && <Text style={s.error}>{error}</Text>}

        <View style={s.heroCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={s.heroCopy}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.muted}>{landlord.user?.email || 'No email provided'}</Text>
            <Text style={s.muted}>{landlord.user?.phone || 'No phone provided'}</Text>
          </View>
          <View style={s.statusStack}>
            <Status value={applicationStatus} />
            <Status value={`ID ${idStatus}`} />
          </View>
        </View>

        <View style={s.twoColumns}>
          <View style={s.panel}>
            <Text style={s.sectionTitle}>Applicant information</Text>
            <Info label="Application ID" value={landlord.id} />
            <Info label="Full name" value={name} />
            <Info label="Phone" value={landlord.user?.phone} />
            <Info label="Email" value={landlord.user?.email} />
            <Info label="Account status" value={landlord.user?.accountStatus} />
            <Info label="Submitted" value={landlord.createdAt ? new Date(landlord.createdAt).toLocaleString() : undefined} />
            <Info label="Last updated" value={landlord.updatedAt ? new Date(landlord.updatedAt).toLocaleString() : undefined} />
          </View>

          <View style={s.panel}>
            <Text style={s.sectionTitle}>Verification and review</Text>
            <Info label="Application status" value={pretty(applicationStatus)} />
            <Info label="ID verification" value={pretty(idStatus)} />
            <Info label="ID review message" value={landlord.idVerificationMessage} />
            <Info label="Admin notes" value={landlord.reviewNotes} />
            <View style={s.statusNotice}>
              <CheckCircle2 color={idStatus === 'VERIFIED' ? C.lime : C.amber} size={18} />
              <Text style={s.noticeText}>
                {idStatus === 'VERIFIED'
                  ? 'Identity is verified. Approval is available if the application meets the requirements.'
                  : 'Identity must be verified before this application can be approved.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.panel}>
          <Text style={s.sectionTitle}>Submitted questionnaire</Text>
          {landlord.questionnaire && Object.keys(landlord.questionnaire).length ? (
            Object.entries(landlord.questionnaire).map(([key, value]) => (
              <Info
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ')}
                value={
                  value == null
                    ? 'Not provided'
                    : typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)
                }
              />
            ))
          ) : (
            <Text style={s.muted}>No questionnaire details were returned for this application.</Text>
          )}
        </View>

        <View style={s.panel}>
          <View style={s.sectionHeadingRow}>
            <View>
              <Text style={s.sectionTitle}>Properties</Text>
              <Text style={s.muted}>{landlord.properties?.length ?? 0} properties associated with this landlord</Text>
            </View>
            <Pressable
              style={s.outlineButton}
              onPress={() =>
                router.push({
                  pathname: '/admin/landlords/properties/[id]',
                  params: { id: landlord.id },
                } as never)
              }
            >
              <Text style={s.outlineButtonText}>View all</Text>
              <ChevronRight color={C.lime} size={16} />
            </Pressable>
          </View>

          {(landlord.properties ?? []).slice(0, 4).map((property) => (
            <Pressable
              key={property.id}
              style={s.propertyRow}
              onPress={() =>
                router.push({
                  pathname: '/admin/properties/[id]',
                  params: { id: property.id },
                } as never)
              }
            >
              <View style={s.propertyCopy}>
                <Text style={s.propertyTitle}>{property.title || 'Untitled property'}</Text>
                <Text style={s.muted}>
                  {[property.area, property.town, property.county].filter(Boolean).join(', ') || 'Location not provided'}
                </Text>
                <Text style={s.propertyMeta}>{pretty(property.status)} · {property.verified ? 'Verified' : 'Not verified'}</Text>
              </View>
              <View style={s.propertyRight}>
                <Text style={s.propertyPrice}>
                  {formatMoney(property.monthlyRent ?? property.dayRate ?? property.nightRate)}
                </Text>
                <ChevronRight color={C.muted} size={18} />
              </View>
            </Pressable>
          ))}

          {!landlord.properties?.length && (
            <Text style={s.muted}>No properties have been associated with this landlord yet.</Text>
          )}
        </View>

        <View style={s.panel}>
          <Text style={s.sectionTitle}>Review actions</Text>
          <Text style={s.muted}>For actions that require an explanation, enter the reason below before selecting the action.</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Internal note or explanation…"
            placeholderTextColor={C.muted}
            multiline
            textAlignVertical="top"
            style={s.messageInput}
          />
          {busy && <ActivityIndicator color={C.lime} style={{ marginBottom: 12 }} />}

          <View style={s.actionGrid}>
            <ActionButton label="Start review" onPress={() => void performAction('REVIEW')} disabled={busy} />
            <ActionButton label="Verify ID" onPress={() => void performAction('ID_VERIFIED')} disabled={busy} primary />
            <ActionButton label="Flag ID for review" onPress={() => void performAction('ID_REVIEW')} disabled={busy} />
            <ActionButton label="Reject ID" onPress={() => void performAction('ID_REJECTED')} disabled={busy} danger />
            <ActionButton label="Request changes" onPress={() => void performAction('REQUEST_CHANGES')} disabled={busy} />
            <ActionButton label="Approve application" onPress={() => void performAction('APPROVE')} disabled={busy} primary />
            <ActionButton label="Reject application" onPress={() => void performAction('REJECT')} disabled={busy} danger />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Status({ value }: { value: string }) {
  const upper = value.toUpperCase();
  const color = upper.includes('APPROVED') || upper.includes('VERIFIED') || upper.includes('ACTIVE')
    ? C.lime
    : upper.includes('REJECTED') || upper.includes('SUSPENDED')
      ? C.red
      : C.amber;

  return (
    <View style={[s.status, { borderColor: color }]}>
      <Text style={[s.statusText, { color }]}>{pretty(value)}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text selectable style={s.infoValue}>{value == null || value === '' ? 'Not provided' : String(value)}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  primary,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        s.actionButton,
        primary && s.primaryButton,
        danger && s.dangerButton,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[s.actionButtonText, primary && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return <ActionButton label={label} onPress={onPress} primary />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 22, paddingBottom: 48, gap: 18, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: C.text, fontWeight: '600' },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: C.lime, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: C.text, fontSize: 28, fontWeight: '800' },
  muted: { color: C.muted, fontSize: 13, lineHeight: 20 },
  refreshButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  heroCard: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 20 },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.bg, fontSize: 23, fontWeight: '900' },
  heroCopy: { flex: 1, minWidth: 170, gap: 3 },
  name: { color: C.text, fontSize: 21, fontWeight: '800' },
  statusStack: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  status: { borderWidth: 1, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.cardSoft },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  panel: { flex: 1, minWidth: 280, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 18, gap: 14 },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  sectionHeadingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  infoRow: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 10, gap: 5 },
  infoLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoValue: { color: C.text, fontSize: 14, lineHeight: 20 },
  statusNotice: { flexDirection: 'row', gap: 10, backgroundColor: C.cardSoft, borderRadius: 12, padding: 12, alignItems: 'flex-start' },
  noticeText: { color: C.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  outlineButton: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  outlineButtonText: { color: C.lime, fontSize: 12, fontWeight: '800' },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  propertyCopy: { flex: 1, gap: 4 },
  propertyTitle: { color: C.text, fontWeight: '800', fontSize: 14 },
  propertyMeta: { color: C.muted, fontSize: 11, textTransform: 'capitalize' },
  propertyRight: { alignItems: 'flex-end', gap: 6 },
  propertyPrice: { color: C.lime, fontWeight: '800', fontSize: 12 },
  messageInput: { minHeight: 96, backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.text, padding: 13 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  actionButton: { minHeight: 42, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 11, backgroundColor: C.cardSoft, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  primaryButton: { backgroundColor: C.lime, borderColor: C.lime },
  dangerButton: { borderColor: '#7D3838' },
  actionButtonText: { color: C.text, fontWeight: '800', fontSize: 12 },
  error: { color: C.red, backgroundColor: '#281819', borderRadius: 10, padding: 12, lineHeight: 19 },
});
