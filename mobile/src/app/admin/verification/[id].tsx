import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react-native";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "makazii_admin_token";

const C = {
  background: "#0B0F10",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  white: "#F4F7F7",
  muted: "#9CA5A7",
  border: "#252C2E",
  danger: "#FF7777",
  warning: "#F5C451",
};

type Property = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  purpose?: string | null;
  longStayType?: string | null;
  shortStayType?: string | null;
  stayMode?: string | null;
  status?: string | null;
  verified?: boolean | null;
  available?: boolean | null;
  monthlyRent?: number | string | null;
  deposit?: number | string | null;
  viewingFee?: number | string | null;
  inspectionFee?: number | string | null;
  serviceCharge?: number | string | null;
  dayRate?: number | string | null;
  nightRate?: number | string | null;
  dayNightRate?: number | string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  rooms?: number | null;
  maxGuests?: number | null;
  location?: string | null;
  address?: string | null;
  county?: { name?: string | null } | string | null;
  countyRelation?: { name?: string | null } | null;
  constituency?: { name?: string | null } | string | null;
  ward?: { name?: string | null } | string | null;
  place?: { name?: string | null } | null;
  source?: string | null;
  propertySource?: string | null;
  createdAt?: string | null;
  submittedAt?: string | null;
  verificationNotes?: string | null;
  verificationNote?: string | null;
  createdBy?: {
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  marketer?: {
    name?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  } | null;
  landlord?: { name?: string | null } | null;
  images?: (string | {
      id?: string;
      url?: string | null;
      imageUrl?: string | null;
      path?: string | null;
      altText?: string | null;
    })[];
  amenities?: (string | {
      name?: string | null;
      title?: string | null;
      amenity?: { name?: string | null } | null;
    })[];
};

type ApiBody = {
  success?: boolean;
  message?: string;
  error?: string;
  property?: Property;
  data?: Property | { property?: Property };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    throw new Error("Your admin session was not found. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const raw = await response.text();
  let body: any = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed (${response.status}).`
    );
  }

  return body as T;
}

function unwrapProperty(body: ApiBody): Property | null {
  const data = body?.data;
  const candidate =
    body?.property ||
    (data && "property" in data ? data.property : data);

  return candidate && typeof candidate === "object" && "id" in candidate
    ? (candidate as Property)
    : null;
}

function titleOf(p: Property) {
  return p.title || p.name || "Untitled Property";
}

function nameOf(value: Property["county"]) {
  if (typeof value === "string") return value;
  return value?.name || "";
}

function locationOf(p: Property) {
  const parts = [
    nameOf(p.ward),
    nameOf(p.constituency),
    nameOf(p.countyRelation) || nameOf(p.county),
    p.place?.name,
    p.location,
    p.address,
  ].filter(Boolean);

  return [...new Set(parts)].join(", ") || "Location not provided";
}

function money(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `KES ${number.toLocaleString("en-KE")}`;
}

function dateOf(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function imageUri(image: NonNullable<Property["images"]>[number]) {
  if (typeof image === "string") return image;
  return image?.url || image?.imageUrl || image?.path || "";
}

function statusLabel(status?: string | null) {
  return (status || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

export default function VerificationPropertyDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [noteModal, setNoteModal] = useState<"REJECTED" | "CHANGES_REQUIRED" | null>(null);
  const [note, setNote] = useState("");

  const loadProperty = useCallback(async () => {
    if (!id) {
      setLoading(false);
      Alert.alert("Missing property", "No property ID was provided.");
      return;
    }

    try {
      const response = await request<ApiBody>(
        `/admin/properties/${encodeURIComponent(id)}`
      );
      const loaded = unwrapProperty(response);

      if (!loaded) {
        throw new Error("The server did not return the property details.");
      }

      setProperty(loaded);
    } catch (error) {
      Alert.alert(
        "Unable to load property",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProperty();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadProperty]);

  const submitDecision = async (
    status: "ACTIVE" | "REJECTED" | "CHANGES_REQUIRED",
    decisionNote?: string
  ) => {
    if (!property || actionLoading) return;

    setActionLoading(true);
    try {
      const response = await request<ApiBody>(
        `/admin/properties/${encodeURIComponent(property.id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            ...(decisionNote?.trim()
              ? {
                  note: decisionNote.trim(),
                  verificationNote: decisionNote.trim(),
                }
              : {}),
          }),
        }
      );

      const updated = unwrapProperty(response);
      setProperty((current) =>
        current
          ? {
              ...current,
              ...(updated || {}),
              status,
              verified: status === "ACTIVE",
              available: status === "ACTIVE" ? true : current.available,
              verificationNotes: decisionNote?.trim() || current.verificationNotes,
              verificationNote: decisionNote?.trim() || current.verificationNote,
            }
          : current
      );
      setNoteModal(null);
      setNote("");

      Alert.alert(
        "Verification updated",
        status === "ACTIVE"
          ? "The property has been approved and is now active."
          : status === "REJECTED"
            ? "The property has been rejected."
            : "The property has been returned for corrections.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/admin/verification" as never),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Action failed",
        error instanceof Error ? error.message : "Unable to update verification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openNoteDecision = (status: "REJECTED" | "CHANGES_REQUIRED") => {
    setNote("");
    setNoteModal(status);
  };

  const confirmNoteDecision = () => {
    if (!noteModal) return;
    if (!note.trim()) {
      Alert.alert(
        "Reason required",
        "Please enter a reason before continuing."
      );
      return;
    }
    void submitDecision(noteModal, note);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.lime} />
        <Text style={styles.loadingText}>Loading property details…</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <ShieldCheck size={38} color={C.muted} />
        <Text style={styles.emptyTitle}>Property details unavailable</Text>
        <Text style={styles.emptyText}>
          Check your connection and try loading the property again.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => {
          setLoading(true);
          void loadProperty();
        }}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Verification</Text>
        </Pressable>
      </View>
    );
  }

  const images = (property.images || [])
    .map((item) => ({ item, uri: imageUri(item) }))
    .filter((entry) => !!entry.uri);

  const amenities = (property.amenities || [])
    .map((item) =>
      typeof item === "string"
        ? item
        : item.amenity?.name || item.name || item.title || ""
    )
    .filter(Boolean);

  const submitter =
    property.marketer?.user &&
    [property.marketer.user.firstName, property.marketer.user.lastName]
      .filter(Boolean)
      .join(" ") ||
    property.marketer?.name ||
    [property.createdBy?.firstName, property.createdBy?.lastName]
      .filter(Boolean)
      .join(" ") ||
    property.createdBy?.name ||
    property.landlord?.name ||
    "—";

  const canDecide =
    property.status === "PENDING_VERIFICATION" ||
    property.status === "CHANGES_REQUIRED";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to verification queue"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <ArrowLeft size={21} color={C.white} />
        </Pressable>
        <View style={styles.topBarText}>
          <Text style={styles.eyebrow}>MAKAZII ADMIN</Text>
          <Text style={styles.pageTitle}>Property Details</Text>
        </View>
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            setRefreshing(true);
            void loadProperty();
          }}
        >
          {refreshing ? (
            <ActivityIndicator color={C.lime} />
          ) : (
            <RefreshCw size={18} color={C.lime} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageStrip}
            >
              {images.map(({ item, uri }, index) => (
                <Image
                  key={(typeof item === "string" ? uri : item.id) || `${uri}-${index}`}
                  source={{ uri }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noImage}>
              <ImageIcon size={38} color="#667174" />
              <Text style={styles.noImageText}>No property images</Text>
            </View>
          )}

          <View style={styles.heroBody}>
            <View style={styles.statusLine}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{statusLabel(property.status)}</Text>
              </View>
              {property.verified ? (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color={C.lime} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.propertyTitle}>{titleOf(property)}</Text>
            <View style={styles.locationLine}>
              <MapPin size={16} color={C.lime} />
              <Text style={styles.locationText}>{locationOf(property)}</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{property.bedrooms ?? "—"}</Text>
                <Text style={styles.summaryLabel}>Bedrooms</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{property.bathrooms ?? "—"}</Text>
                <Text style={styles.summaryLabel}>Bathrooms</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{property.rooms ?? "—"}</Text>
                <Text style={styles.summaryLabel}>Rooms</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{property.maxGuests ?? "—"}</Text>
                <Text style={styles.summaryLabel}>Guests</Text>
              </View>
            </View>
          </View>
        </View>

        <Section title="Property Information">
          <Row label="Purpose" value={property.purpose} />
          <Row label="Long-stay type" value={property.longStayType} />
          <Row label="Short-stay type" value={property.shortStayType} />
          <Row label="Stay mode" value={property.stayMode} />
          <Row label="Beds" value={property.beds == null ? "—" : String(property.beds)} />
          <Row label="Availability" value={property.available ? "Available" : "Not available"} />
        </Section>

        <Section title="Location">
          <Row label="County" value={nameOf(property.countyRelation) || nameOf(property.county)} />
          <Row label="Constituency" value={nameOf(property.constituency)} />
          <Row label="Ward" value={nameOf(property.ward)} />
          <Row label="Place" value={property.place?.name} />
          <Row label="Location" value={property.location} />
          <Row label="Address" value={property.address} />
        </Section>

        <Section title="Pricing">
          <Row label="Monthly rent" value={money(property.monthlyRent)} />
          <Row label="Deposit" value={money(property.deposit)} />
          {property.purpose?.toUpperCase() === "SHORT_STAY" ? (
            <Row label="Inspection fee" value={money(property.inspectionFee)} />
          ) : (
            <Row label="Viewing fee" value={money(property.viewingFee)} />
          )}
          <Row label="Service charge" value={money(property.serviceCharge)} />
          <Row label="Day rate" value={money(property.dayRate)} />
          <Row label="Night rate" value={money(property.nightRate)} />
          <Row label="Day & night rate" value={money(property.dayNightRate)} />
        </Section>

        <Section title="Submission">
          <Row label="Source" value={property.source || property.propertySource} />
          <Row label="Submitted by" value={submitter} />
          <Row label="Submitted" value={dateOf(property.submittedAt || property.createdAt)} />
        </Section>

        {property.description ? (
          <Section title="Description">
            <Text style={styles.description}>{property.description}</Text>
          </Section>
        ) : null}

        <Section title="Amenities">
          {amenities.length ? (
            <View style={styles.amenitiesWrap}>
              {amenities.map((amenity, index) => (
                <View key={`${amenity}-${index}`} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedText}>No amenities recorded.</Text>
          )}
        </Section>

        {property.verificationNotes || property.verificationNote ? (
          <Section title="Verification Notes">
            <Text style={styles.noteDisplay}>
              {property.verificationNotes || property.verificationNote}
            </Text>
          </Section>
        ) : null}

        {canDecide ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Verification Decision</Text>
            <Text style={styles.actionDescription}>
              Review the information before approving or returning this property.
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.decisionButton, styles.rejectButton]}
                disabled={actionLoading}
                onPress={() => openNoteDecision("REJECTED")}
              >
                <XCircle size={17} color={C.danger} />
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>

              <Pressable
                style={[styles.decisionButton, styles.changesButton]}
                disabled={actionLoading}
                onPress={() => openNoteDecision("CHANGES_REQUIRED")}
              >
                <RefreshCw size={16} color={C.warning} />
                <Text style={styles.changesText}>Request Changes</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.approveButton, actionLoading && styles.disabledButton]}
              disabled={actionLoading}
              onPress={() =>
                Alert.alert(
                  "Approve Property",
                  "Approve this property and make it active?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Approve", onPress: () => void submitDecision("ACTIVE") },
                  ]
                )
              }
            >
              {actionLoading ? (
                <ActivityIndicator color="#071000" />
              ) : (
                <Check size={18} color="#071000" />
              )}
              <Text style={styles.approveText}>
                {actionLoading ? "Updating…" : "Approve Property"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.readOnlyNotice}>
            <ShieldCheck size={19} color={C.muted} />
            <Text style={styles.readOnlyText}>
              This property is currently {statusLabel(property.status).toLowerCase()}.
              Verification actions are available for pending or returned properties.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!noteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionLoading) setNoteModal(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.noteModal}>
            <View style={styles.noteModalHeader}>
              <Text style={styles.noteModalTitle}>
                {noteModal === "REJECTED" ? "Reject Property" : "Request Changes"}
              </Text>
              <Pressable
                onPress={() => setNoteModal(null)}
                disabled={actionLoading}
                style={styles.iconButton}
              >
                <X size={19} color={C.white} />
              </Pressable>
            </View>
            <Text style={styles.noteModalDescription}>
              {noteModal === "REJECTED"
                ? "Explain why this property is being rejected."
                : "Explain what the submitter needs to correct."}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Enter your reason..."
              placeholderTextColor="#687174"
              multiline
              textAlignVertical="top"
              editable={!actionLoading}
              style={styles.noteInput}
            />
            <View style={styles.noteActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setNoteModal(null)}
                disabled={actionLoading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={confirmNoteDecision}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#071000" />
                ) : null}
                <Text style={styles.confirmText}>
                  {actionLoading ? "Submitting…" : "Confirm"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { color: C.muted, marginTop: 14, fontSize: 13 },
  emptyTitle: { color: C.white, fontSize: 18, fontWeight: "900", marginTop: 16 },
  emptyText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  topBarText: { flex: 1 },
  eyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  pageTitle: { color: C.white, fontSize: 20, fontWeight: "900", marginTop: 3 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 36, gap: 14, maxWidth: 1000, width: "100%", alignSelf: "center" },
  heroCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  imageStrip: { width: "100%" },
  heroImage: { width: 340, height: 230, backgroundColor: C.cardSoft },
  noImage: {
    height: 190,
    backgroundColor: C.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  noImageText: { color: C.muted, fontSize: 12 },
  heroBody: { padding: 17 },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 9, flexWrap: "wrap" },
  statusBadge: {
    borderRadius: 30,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: "#252C2E",
  },
  statusText: { color: C.white, fontSize: 10, fontWeight: "900" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  verifiedText: { color: C.lime, fontSize: 11, fontWeight: "800" },
  propertyTitle: {
    color: C.white,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 30,
    marginTop: 13,
  },
  locationLine: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 9 },
  locationText: { color: C.muted, fontSize: 12, lineHeight: 19, flex: 1 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 18 },
  summaryItem: {
    flexGrow: 1,
    minWidth: 90,
    backgroundColor: C.cardSoft,
    borderRadius: 12,
    padding: 12,
  },
  summaryValue: { color: C.lime, fontSize: 20, fontWeight: "900" },
  summaryLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 3,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#22292B",
  },
  infoLabel: { color: C.muted, fontSize: 12, flex: 1 },
  infoValue: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    flex: 1.2,
  },
  description: { color: "#D1D7D8", fontSize: 13, lineHeight: 21 },
  amenitiesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    backgroundColor: C.cardSoft,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  amenityText: { color: "#D1D7D8", fontSize: 11, fontWeight: "700" },
  mutedText: { color: C.muted, fontSize: 12 },
  noteDisplay: {
    color: "#E5D6AE",
    backgroundColor: "#292313",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    lineHeight: 19,
  },
  actionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#38432A",
    backgroundColor: C.card,
    gap: 12,
  },
  actionTitle: { color: C.white, fontSize: 16, fontWeight: "900" },
  actionDescription: { color: C.muted, fontSize: 12, lineHeight: 19 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  decisionButton: {
    minHeight: 45,
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    flexGrow: 1,
  },
  rejectButton: { backgroundColor: "#2A1A1C", borderWidth: 1, borderColor: "#583033" },
  rejectText: { color: C.danger, fontSize: 12, fontWeight: "900" },
  changesButton: { backgroundColor: "#292313", borderWidth: 1, borderColor: "#584A26" },
  changesText: { color: C.warning, fontSize: 12, fontWeight: "900" },
  approveButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: C.lime,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: C.lime,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: { color: "#071000", fontWeight: "900" },
  approveText: { color: "#071000", fontSize: 13, fontWeight: "900" },
  disabledButton: { opacity: 0.6 },
  readOnlyNotice: {
    padding: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  readOnlyText: { color: C.muted, fontSize: 12, lineHeight: 19, flex: 1 },
  backButton: { padding: 12, marginTop: 5 },
  backText: { color: C.lime, fontWeight: "800", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  noteModal: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },
  noteModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  noteModalTitle: { color: C.white, fontSize: 18, fontWeight: "900", flex: 1 },
  noteModalDescription: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 10, marginBottom: 14 },
  noteInput: {
    minHeight: 120,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#30383A",
    borderRadius: 12,
    backgroundColor: "#0F1415",
    color: C.white,
    padding: 13,
    fontSize: 13,
    lineHeight: 20,
  },
  noteActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 15 },
  cancelButton: {
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: C.muted, fontSize: 12, fontWeight: "800" },
  confirmButton: {
    minHeight: 43,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: C.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  confirmText: { color: "#071000", fontSize: 12, fontWeight: "900" },
});
