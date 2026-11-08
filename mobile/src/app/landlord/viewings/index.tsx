import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  RefreshCw,
  Wallet,
} from "lucide-react-native";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

const COLORS = {
  background: "#0B0F10",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  text: "#F4F6F6",
  muted: "#9CA5A7",
  border: "#252C2E",
  amber: "#FFC875",
  red: "#FF8C8C",
  blue: "#9BC7FF",
  green: "#A7E5B2",
};

type ViewingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_ASSIGNMENT"
  | "ASSIGNED"
  | "APPROVED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED"
  | "CONFIRMED"
  | string;

type ViewingPayment = {
  id: string;
  amount: number;
  currency?: string;
  status?: string;
  paidAt?: string | null;
  createdAt?: string;
};

type ViewingProperty = {
  id: string;
  title?: string;
  purpose?: string;
  longStayType?: string | null;
  monthlyRent?: number | null;
  viewingFee?: number | null;
  county?: string;
  town?: string;
  area?: string;
  status?: string;
  images?: {
    id: string;
    url: string;
    isPrimary?: boolean;
  }[];
};

type LandlordViewing = {
  id: string;
  requestedDate?: string | null;
  preferredTime?: string | null;
  scheduledAt?: string | null;
  notes?: string | null;
  status?: ViewingStatus;
  requestedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  payments?: ViewingPayment[];
  property?: ViewingProperty;
};

type FilterKey = "ALL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
  } catch {}

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

function formatStatus(status?: string) {
  return (status || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColor(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
    case "CONFIRMED":
      return COLORS.green;
    case "COMPLETED":
      return COLORS.lime;
    case "PAID":
    case "ASSIGNED":
    case "AWAITING_ASSIGNMENT":
      return COLORS.blue;
    case "PENDING_PAYMENT":
    case "RESCHEDULED":
      return COLORS.amber;
    case "CANCELLED":
    case "DECLINED":
      return COLORS.red;
    default:
      return COLORS.muted;
  }
}

function paymentLabel(payment?: ViewingPayment) {
  if (!payment) return "No payment record";

  switch ((payment.status || "").toUpperCase()) {
    case "PAID":
    case "SUCCESS":
    case "COMPLETED":
      return "Paid";
    case "PENDING":
      return "Payment pending";
    case "FAILED":
      return "Payment failed";
    case "REFUNDED":
      return "Refunded";
    case "CANCELLED":
      return "Payment cancelled";
    default:
      return formatStatus(payment.status || "UNKNOWN");
  }
}

function paymentColor(payment?: ViewingPayment) {
  if (!payment) return COLORS.muted;

  switch ((payment.status || "").toUpperCase()) {
    case "PAID":
    case "SUCCESS":
    case "COMPLETED":
      return COLORS.green;
    case "PENDING":
      return COLORS.amber;
    case "FAILED":
    case "CANCELLED":
      return COLORS.red;
    default:
      return COLORS.muted;
  }
}

function money(value?: number | null, currency = "KES") {
  if (value == null || !Number.isFinite(Number(value))) return "Not set";
  return `${currency === "KES" ? "KSh" : currency} ${Number(value).toLocaleString("en-KE")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} · ${date.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function matchesFilter(viewing: LandlordViewing, filter: FilterKey) {
  const status = (viewing.status || "").toUpperCase();

  if (filter === "ALL") return true;
  if (filter === "COMPLETED") return status === "COMPLETED";
  if (filter === "CANCELLED") {
    return status === "CANCELLED" || status === "DECLINED";
  }

  return !["COMPLETED", "CANCELLED", "DECLINED"].includes(status);
}

function latestPayment(viewing: LandlordViewing) {
  if (!viewing.payments?.length) return undefined;

  return [...viewing.payments].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  })[0];
}

export default function LandlordViewings() {
  const [viewings, setViewings] = useState<LandlordViewing[]>([]);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadViewings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const token = await getToken();

      if (!token) {
        setViewings([]);
        setError("Your landlord session has expired. Please sign in again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.landlordViewings}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        throw new Error(
          result?.message || "We couldn't load your viewing requests."
        );
      }

      const list = result?.data?.viewings;

      if (!Array.isArray(list)) {
        throw new Error("The server returned an unexpected viewing response.");
      }

      setViewings(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading viewings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadViewings();
    }, [loadViewings])
  );

  const filteredViewings = useMemo(
    () => viewings.filter((viewing) => matchesFilter(viewing, filter)),
    [viewings, filter]
  );

  const inProgressCount = useMemo(
    () => viewings.filter((viewing) => matchesFilter(viewing, "IN_PROGRESS")).length,
    [viewings]
  );

  const completedCount = useMemo(
    () => viewings.filter((viewing) => matchesFilter(viewing, "COMPLETED")).length,
    [viewings]
  );

  const paidCount = useMemo(
    () =>
      viewings.filter((viewing) => {
        const status = (latestPayment(viewing)?.status || "").toUpperCase();
        return ["PAID", "SUCCESS", "COMPLETED"].includes(status);
      }).length,
    [viewings]
  );

  const renderViewing = (viewing: LandlordViewing) => {
    const property = viewing.property;
    const payment = latestPayment(viewing);
    const status = (viewing.status || "UNKNOWN").toUpperCase();
    const location = [property?.area, property?.town, property?.county]
      .filter(Boolean)
      .join(", ");
    const schedule = formatDateTime(viewing.scheduledAt);
    const requestedDate = formatDateTime(viewing.requestedDate);
    const imageUrl = property?.images?.[0]?.url;

    return (
      <View key={viewing.id} style={styles.viewingCard}>
        <View style={styles.propertyRow}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.propertyImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.propertyImage, styles.imagePlaceholder]}>
              <Eye size={25} color={COLORS.muted} />
            </View>
          )}

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {property?.title || "Property viewing"}
            </Text>

            {!!location && (
              <View style={styles.inlineInfo}>
                <MapPin size={13} color={COLORS.muted} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {location}
                </Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor(status) },
                ]}
              />
              <Text style={[styles.statusText, { color: statusColor(status) }]}>
                {formatStatus(status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <CalendarDays size={16} color={COLORS.muted} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>
                {schedule ? "Scheduled visit" : "Requested date"}
              </Text>
              <Text style={styles.detailValue}>
                {schedule || requestedDate || formatDate(viewing.requestedDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Clock3 size={16} color={COLORS.muted} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>Preferred time</Text>
              <Text style={styles.detailValue}>
                {viewing.preferredTime || "Not specified"}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Wallet size={16} color={COLORS.muted} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>Viewing fee</Text>
              <Text style={styles.detailValue}>
                {money(payment?.amount ?? property?.viewingFee, payment?.currency || "KES")}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <CheckCircle2 size={16} color={paymentColor(payment)} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>Payment status</Text>
              <Text style={[styles.detailValue, { color: paymentColor(payment) }]}>
                {paymentLabel(payment)}
              </Text>
            </View>
          </View>
        </View>

        {!!viewing.notes?.trim() && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Request note</Text>
            <Text style={styles.noteText}>{viewing.notes.trim()}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.referenceWrap}>
            <Text style={styles.referenceLabel}>Request submitted</Text>
            <Text style={styles.referenceValue}>
              {formatDate(viewing.createdAt)}
            </Text>
          </View>

          <View style={styles.readOnlyTag}>
            <Text style={styles.readOnlyText}>View only</Text>
            <ChevronRight size={14} color={COLORS.muted} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={21} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
          <Text style={styles.headerTitle}>Viewings</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh viewings"
          onPress={() => void loadViewings(true)}
          disabled={loading || refreshing}
          style={styles.refreshButton}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.lime} />
          ) : (
            <RefreshCw size={18} color={COLORS.lime} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadViewings(true)}
            tintColor={COLORS.lime}
            colors={[COLORS.lime]}
            progressBackgroundColor={COLORS.card}
          />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Viewing activity</Text>
          <Text style={styles.introText}>
            Follow requests for your properties and check their payment and
            scheduling status. Makazii coordinates the viewing process.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{viewings.length}</Text>
            <Text style={styles.summaryLabel}>Total requests</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{inProgressCount}</Text>
            <Text style={styles.summaryLabel}>In progress</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.paymentSummary}>
          <View style={styles.paymentIcon}>
            <Wallet size={18} color={COLORS.lime} />
          </View>
          <View style={styles.paymentSummaryText}>
            <Text style={styles.paymentSummaryTitle}>Viewing payments</Text>
            <Text style={styles.paymentSummaryDescription}>
              {paidCount} {paidCount === 1 ? "request has" : "requests have"} a
              recorded successful payment.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your requests</Text>
          <Text style={styles.sectionCount}>{filteredViewings.length}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((item) => {
            const selected = filter === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.lime} />
            <Text style={styles.stateTitle}>Loading your viewings</Text>
            <Text style={styles.stateDescription}>
              Getting the latest requests from Makazii.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <RefreshCw size={22} color={COLORS.amber} />
            </View>
            <Text style={styles.stateTitle}>Couldn&apos;t load viewings</Text>
            <Text style={styles.stateDescription}>{error}</Text>
            <Pressable
              onPress={() => void loadViewings(true)}
              style={styles.retryButton}
            >
              <RefreshCw size={15} color={COLORS.background} />
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : filteredViewings.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <CalendarDays size={24} color={COLORS.lime} />
            </View>
            <Text style={styles.stateTitle}>
              {viewings.length === 0
                ? "No viewing requests yet"
                : "No requests in this category"}
            </Text>
            <Text style={styles.stateDescription}>
              {viewings.length === 0
                ? "When customers request viewings for your properties, they will appear here."
                : "Try another filter to see your other viewing requests."}
            </Text>
            {viewings.length > 0 && filter !== "ALL" && (
              <Pressable
                onPress={() => setFilter("ALL")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Show all requests</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.viewingList}>
            {filteredViewings.map(renderViewing)}
          </View>
        )}

        <View style={styles.privacyNote}>
          <CheckCircle2 size={16} color={COLORS.lime} />
          <Text style={styles.privacyText}>
            Viewing approvals and customer coordination are managed by Makazii.
            Customer contact details are not shown on this screen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 13,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 38,
  },
  intro: {
    marginBottom: 20,
  },
  introTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 7,
  },
  introText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 13,
    justifyContent: "center",
  },
  summaryNumber: {
    color: COLORS.lime,
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 4,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  paymentSummary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 27,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#252E1A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentSummaryText: {
    flex: 1,
  },
  paymentSummaryTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  paymentSummaryDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionCount: {
    color: COLORS.background,
    backgroundColor: COLORS.lime,
    overflow: "hidden",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 9,
  },
  filters: {
    gap: 8,
    paddingBottom: 17,
  },
  filterChip: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },
  filterText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: COLORS.background,
  },
  viewingList: {
    gap: 14,
  },
  viewingCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
    padding: 14,
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  propertyImage: {
    width: 96,
    height: 104,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  propertyInfo: {
    flex: 1,
    paddingLeft: 13,
    paddingTop: 2,
  },
  propertyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 8,
  },
  inlineInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },
  locationText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
    marginLeft: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.cardSoft,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  detailGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  detailLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 13,
    padding: 12,
    marginTop: 17,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.lime,
  },
  noteLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  noteText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  referenceWrap: {
    flex: 1,
  },
  referenceLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 4,
  },
  referenceValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },
  readOnlyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
  },
  readOnlyText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  stateCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: "center",
    marginTop: 3,
  },
  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  stateDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.lime,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 19,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryButton: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 17,
  },
  secondaryButtonText: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: "800",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 22,
    paddingHorizontal: 3,
  },
  privacyText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
});
