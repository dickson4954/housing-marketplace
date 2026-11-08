import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react-native";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

type Audience = "ADMIN" | "LANDLORD" | "MARKETER";
type Action = "confirm" | "check-in" | "check-out" | "complete";

type Booking = {
  id: string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  guests?: number;
  stayMode?: string;
  status: string;
  totalAmount?: number | string | null;
  currency?: string;
  depositAmount?: number | string | null;
  balanceAmount?: number | string | null;
  amountPaid?: number | string | null;
  depositPaidAt?: string | null;
  balancePaidAt?: string | null;
  confirmedAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt?: string;
  renter?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  property?: {
    id?: string;
    title?: string;
    county?: string | null;
    town?: string | null;
    area?: string | null;
    bedrooms?: number | null;
    images?: Array<{ id: string; url: string }>;
  } | null;
  payments?: Array<{
    id: string;
    amount: number | string;
    currency?: string;
    method?: string;
    provider?: string;
    purpose?: string;
    reference?: string | null;
    status?: string;
    paidAt?: string | null;
    createdAt?: string;
  }>;
};

type ResponseData = {
  success?: boolean;
  message?: string;
  data?: {
    bookings?: Booking[];
    booking?: Booking;
  };
};

const C = {
  background: "#0B0F10",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  white: "#FFFFFF",
  text: "#F1F4F4",
  muted: "#9CA5A7",
  border: "#252C2E",
  green: "#8BE2A5",
  blue: "#8FC5FF",
  amber: "#FFD080",
  red: "#FF8585",
};

const TOKEN_KEYS: Record<Audience, string> = {
  ADMIN: "makazii_admin_token",
  LANDLORD: "makazii_landlord_token",
  MARKETER: "makazii_marketer_token",
};

const FILTERS = [
  "ALL",
  "AWAITING",
  "CONFIRMED",
  "IN_PROGRESS",
  "CHECKED_OUT",
  "COMPLETED",
  "CANCELLED",
] as const;

type Filter = (typeof FILTERS)[number];

function label(value?: string | null) {
  return (value || "Not specified")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value?: string | null) {
  if (!value) return "Not scheduled";

  // Date-only values must not shift to the previous day in UTC-negative zones.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dateTimeLabel(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function money(value: number | string | null | undefined, currency = "KES") {
  return `${currency} ${Number(value || 0).toLocaleString("en-KE")}`;
}

function getStatusColor(status: string) {
  if (["CONFIRMED", "CHECKED_IN", "STAYING", "COMPLETED"].includes(status)) {
    return C.green;
  }
  if (status === "CHECKED_OUT") return C.blue;
  if (["CANCELLED", "EXPIRED"].includes(status)) return C.red;
  if (status === "PENDING_PAYMENT") return C.amber;
  return C.muted;
}

function matchesFilter(status: string, filter: Filter) {
  switch (filter) {
    case "ALL":
      return true;
    case "AWAITING":
      return ["PAID", "AWAITING_ASSIGNMENT", "ASSIGNED"].includes(status);
    case "IN_PROGRESS":
      return ["CHECKED_IN", "STAYING"].includes(status);
    case "CANCELLED":
      return ["CANCELLED", "EXPIRED"].includes(status);
    default:
      return status === filter;
  }
}

async function getToken(audience: Audience) {
  const key = TOKEN_KEYS[audience];

  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
    } catch {
      return null;
    }
  }

  try {
    const secureToken = await SecureStore.getItemAsync(key);
    if (secureToken) return secureToken;
  } catch {
    // Secure storage may not be available on every platform.
  }

  if (Platform.OS !== "web") {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(key);
      }
    } catch {
      // No browser storage available.
    }
  }

  return null;
}

export default function StaffStayBookingsScreen({
  audience,
}: {
  audience: Audience;
}) {
  const isAdmin = audience === "ADMIN";
  const isMarketer = audience === "MARKETER";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const endpoint = isAdmin
    ? API_ENDPOINTS.adminStayBookings
    : isMarketer
      ? API_ENDPOINTS.marketerStayBookings
      : API_ENDPOINTS.landlordStayBookings;

  const loadBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const token = await getToken(audience);

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await response.json()) as ResponseData;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load stay bookings.");
      }

      setBookings(result.data?.bookings ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Please try again.";
      setError(message);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [audience, endpoint]);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings]),
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        matchesFilter((booking.status || "").toUpperCase(), filter),
      ),
    [bookings, filter],
  );

  const runAction = async (booking: Booking, action: Action) => {
    // Marketers have read-only access to assigned bookings.
    if (isMarketer) return;

    const id = booking.id;

    const paths: Record<Action, string> = isAdmin
      ? {
          confirm: API_ENDPOINTS.confirmAdminStayBooking(id),
          "check-in": API_ENDPOINTS.checkInAdminStayBooking(id),
          "check-out": API_ENDPOINTS.checkOutAdminStayBooking(id),
          complete: API_ENDPOINTS.completeAdminStayBooking(id),
        }
      : {
          confirm: API_ENDPOINTS.confirmLandlordStayBooking(id),
          "check-in": API_ENDPOINTS.checkInLandlordStayBooking(id),
          "check-out": API_ENDPOINTS.checkOutLandlordStayBooking(id),
          complete: "",
        };

    const token = await getToken(audience);
    if (!token) {
      Alert.alert("Session expired", "Please sign in again.");
      return;
    }

    setBusyBookingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}${paths[action]}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = (await response.json()) as ResponseData;

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Could not ${action} this booking.`);
      }

      Alert.alert(
        "Booking updated",
        `The booking has been ${action === "check-in" ? "checked in" : action === "check-out" ? "checked out" : action === "complete" ? "completed" : "confirmed"} successfully.`,
      );

      await loadBookings(false);
    } catch (err) {
      Alert.alert(
        "Action unsuccessful",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusyBookingId(null);
    }
  };

  const confirmAction = (booking: Booking, action: Action) => {
    const descriptions: Record<Action, string> = {
      confirm: "Confirm this accommodation booking? The deposit must already be verified.",
      "check-in": "Record the guest's check-in? The full accommodation payment must be verified and the scheduled check-in time reached.",
      "check-out": "Record that the guest has checked out?",
      complete: "Mark this booking as completed?",
    };

    Alert.alert(
      action === "check-in"
        ? "Confirm guest check-in"
        : action === "check-out"
          ? "Confirm guest check-out"
          : action === "complete"
            ? "Complete booking"
            : "Confirm accommodation booking",
      descriptions[action],
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => void runAction(booking, action),
        },
      ],
    );
  };

  const renderAction = (
    booking: Booking,
    action: Action,
    title: string,
    Icon: React.ComponentType<any>,
    color = C.lime,
  ) => {
    const busy = busyBookingId === booking.id;

    return (
      <Pressable
        key={action}
        accessibilityRole="button"
        disabled={busyBookingId !== null}
        onPress={() => confirmAction(booking, action)}
        style={[styles.actionButton, { borderColor: color }]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Icon size={16} color={color} />
        )}
        <Text style={[styles.actionText, { color }]}>{title}</Text>
      </Pressable>
    );
  };

  const renderBooking = (booking: Booking) => {
    const status = (booking.status || "").toUpperCase();
    const total = Number(booking.totalAmount || 0);
    const paid = Number(booking.amountPaid || 0);
    const deposit = Number(booking.depositAmount || 0);
    const balance = Math.max(0, total - paid);
    const depositVerified = Boolean(booking.depositPaidAt) && paid >= deposit;
    const fullPaymentVerified = total > 0 && paid >= total;

    const guestName = [
      booking.renter?.firstName,
      booking.renter?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Guest";

    const property = booking.property;
    const location = [
      property?.area,
      property?.town,
      property?.county,
    ]
      .filter(Boolean)
      .join(", ");

    const canConfirm =
      ["PAID", "AWAITING_ASSIGNMENT", "ASSIGNED"].includes(status) &&
      depositVerified;

    const canCheckIn = status === "CONFIRMED" && fullPaymentVerified;
    const canCheckOut = ["CHECKED_IN", "STAYING"].includes(status);
    const canComplete = isAdmin && status === "CHECKED_OUT";

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.cardTop}>
          <View style={styles.propertyIcon}>
            <BedDouble size={21} color={C.lime} />
          </View>
          <View style={styles.propertyHeading}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {property?.title || "Accommodation booking"}
            </Text>
            <Text style={styles.locationText}>
              {location || "Location not provided"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { borderColor: getStatusColor(status) },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {label(status)}
            </Text>
          </View>
        </View>

        <View style={styles.guestBlock}>
          <Text style={styles.guestName}>{guestName}</Text>
          {!isMarketer && booking.renter?.email ? (
            <Text style={styles.guestEmail}>{booking.renter.email}</Text>
          ) : null}
          <Text style={styles.reference}>Booking: {booking.id}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <CalendarDays size={15} color={C.muted} />
            <Text style={styles.detailLabel}>Check-in</Text>
            <Text style={styles.detailValue}>
              {dateLabel(booking.checkInDate)}
            </Text>
            {booking.startTime ? (
              <Text style={styles.detailSub}>{booking.startTime}</Text>
            ) : null}
          </View>

          <View style={styles.detailItem}>
            <CalendarDays size={15} color={C.muted} />
            <Text style={styles.detailLabel}>Check-out</Text>
            <Text style={styles.detailValue}>
              {dateLabel(booking.checkOutDate)}
            </Text>
            {booking.endTime ? (
              <Text style={styles.detailSub}>{booking.endTime}</Text>
            ) : null}
          </View>

          <View style={styles.detailItem}>
            <ShieldCheck size={15} color={C.muted} />
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>{booking.guests ?? "—"}</Text>
          </View>

          <View style={styles.detailItem}>
            <Clock3 size={15} color={C.muted} />
            <Text style={styles.detailLabel}>Stay type</Text>
            <Text style={styles.detailValue}>{label(booking.stayMode)}</Text>
          </View>
        </View>

        {!isMarketer ? (
        <View style={styles.financialBlock}>
          <View style={styles.financialHeading}>
            <Wallet size={17} color={C.lime} />
            <Text style={styles.financialTitle}>Accommodation payments</Text>
          </View>

          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Total accommodation cost</Text>
            <Text style={styles.moneyValue}>
              {money(booking.totalAmount, booking.currency)}
            </Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Deposit required</Text>
            <Text style={styles.moneyValue}>
              {money(booking.depositAmount, booking.currency)}
            </Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Amount received</Text>
            <Text style={[styles.moneyValue, { color: C.green }]}>
              {money(booking.amountPaid, booking.currency)}
            </Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Outstanding</Text>
            <Text
              style={[
                styles.moneyValue,
                { color: balance > 0 ? C.amber : C.green },
              ]}
            >
              {money(balance, booking.currency)}
            </Text>
          </View>

          <View style={styles.paymentDates}>
            <Text style={styles.paymentDateText}>
              Deposit verified: {dateTimeLabel(booking.depositPaidAt)}
            </Text>
            <Text style={styles.paymentDateText}>
              Balance paid: {dateTimeLabel(booking.balancePaidAt)}
            </Text>
          </View>

          {booking.payments?.length ? (
            <View style={styles.transactionList}>
              <Text style={styles.transactionHeading}>Payment records</Text>
              {booking.payments.slice(0, 3).map((payment) => (
                <View key={payment.id} style={styles.transactionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transactionTitle}>
                      {label(payment.purpose || payment.method || "Payment")}
                    </Text>
                    <Text style={styles.transactionMeta}>
                      {payment.reference || payment.provider || "Payment reference unavailable"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.transactionAmount}>
                      {money(payment.amount, payment.currency || booking.currency)}
                    </Text>
                    <Text
                      style={[
                        styles.transactionStatus,
                        {
                          color:
                            payment.status === "SUCCESS" ? C.green : C.muted,
                        },
                      ]}
                    >
                      {label(payment.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        ) : null}

        <View style={styles.timestampBlock}>
          <Text style={styles.timestampText}>
            Confirmed: {dateTimeLabel(booking.confirmedAt)}
          </Text>
          <Text style={styles.timestampText}>
            Checked in: {dateTimeLabel(booking.checkedInAt)}
          </Text>
          <Text style={styles.timestampText}>
            Checked out: {dateTimeLabel(booking.checkedOutAt)}
          </Text>
        </View>

        {!isMarketer && (canConfirm || canCheckIn || canCheckOut || canComplete) ? (
          <View style={styles.actions}>
            {canConfirm
              ? renderAction(booking, "confirm", "Confirm booking", CheckCircle2)
              : null}
            {canCheckIn
              ? renderAction(booking, "check-in", "Check in guest", LogIn)
              : null}
            {canCheckOut
              ? renderAction(booking, "check-out", "Check out guest", LogOut, C.blue)
              : null}
            {canComplete
              ? renderAction(booking, "complete", "Complete booking", CheckCircle2, C.green)
              : null}
          </View>
        ) : null}

        {!isMarketer && status === "CONFIRMED" && !fullPaymentVerified ? (
          <Text style={styles.notice}>
            Check-in will become available after the full accommodation balance is verified.
          </Text>
        ) : null}

        {!isMarketer && ["PAID", "AWAITING_ASSIGNMENT", "ASSIGNED"].includes(status) &&
        !depositVerified ? (
          <Text style={styles.notice}>
            Confirmation is unavailable until the deposit payment is verified.
          </Text>
        ) : null}
      </View>
    );
  };

  const countFor = (selected: Filter) =>
    bookings.filter((booking) =>
      matchesFilter((booking.status || "").toUpperCase(), selected),
    ).length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={C.white} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>
            {isAdmin ? "ADMINISTRATION" : isMarketer ? "MARKETER PORTAL" : "LANDLORD PORTAL"}
          </Text>
          <Text style={styles.headerTitle}>Stay Bookings</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh bookings"
          onPress={() => void loadBookings(false)}
          disabled={loading || refreshing}
          style={styles.refreshButton}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={C.lime} />
          ) : (
            <RefreshCw size={19} color={C.lime} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadBookings(false)}
            tintColor={C.lime}
            colors={[C.lime]}
            progressBackgroundColor={C.card}
          />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            {isMarketer ? "Your assigned stay bookings" : "Accommodation management"}
          </Text>
          <Text style={styles.introDescription}>
            {isMarketer
              ? "View accommodation reservations for properties assigned to you. Booking confirmation, payment handling, and guest check-in and check-out are managed by the authorized property operator."
              : "Review reservations, verify payment progress, and record guest check-in and check-out. Payment verification and booking rules are enforced by the MAKAZII backend."}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{bookings.length}</Text>
            <Text style={styles.summaryLabel}>{isMarketer ? "Assigned bookings" : "Total bookings"}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {bookings.filter((b) => ["PAID", "AWAITING_ASSIGNMENT", "ASSIGNED"].includes(b.status)).length}
            </Text>
            <Text style={styles.summaryLabel}>{isMarketer ? "Awaiting operator" : "Awaiting confirmation"}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {bookings.filter((b) => ["CHECKED_IN", "STAYING"].includes(b.status)).length}
            </Text>
            <Text style={styles.summaryLabel}>Currently staying</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item === "ALL"
                    ? "All"
                    : item === "AWAITING"
                      ? "Awaiting"
                      : item === "IN_PROGRESS"
                        ? "In progress"
                        : label(item)}
                </Text>
                <Text
                  style={[
                    styles.filterCount,
                    active && styles.filterTextActive,
                  ]}
                >
                  {countFor(item)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={C.lime} />
            <Text style={styles.stateText}>Loading stay bookings...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Unable to load bookings</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable
              onPress={() => void loadBookings()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.centerState}>
            <BedDouble size={34} color={C.muted} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.stateText}>
              {filter === "ALL"
                ? "Stay bookings will appear here when customers make reservations."
                : "There are no bookings in this status filter."}
            </Text>
          </View>
        ) : (
          filteredBookings.map(renderBooking)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 13,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardSoft,
  },
  headerTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 50,
    gap: 15,
  },
  intro: {
    gap: 7,
  },
  introTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: "900",
  },
  introDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 9,
  },
  summaryCard: {
    flex: 1,
    minHeight: 83,
    padding: 11,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
  },
  summaryNumber: {
    color: C.lime,
    fontSize: 21,
    fontWeight: "900",
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 5,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: "#242D18",
    borderColor: C.lime,
  },
  filterText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  filterTextActive: {
    color: C.lime,
  },
  filterCount: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  bookingCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  propertyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  propertyHeading: {
    flex: 1,
  },
  propertyTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },
  locationText: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },
  guestBlock: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    gap: 3,
  },
  guestName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
  },
  guestEmail: {
    color: C.muted,
    fontSize: 10,
  },
  reference: {
    color: C.muted,
    fontSize: 9,
    marginTop: 3,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  detailItem: {
    width: "48%",
    minWidth: 120,
    flexGrow: 1,
    padding: 10,
    backgroundColor: C.cardSoft,
    borderRadius: 12,
    gap: 4,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 9,
  },
  detailValue: {
    color: C.white,
    fontSize: 12,
    fontWeight: "800",
  },
  detailSub: {
    color: C.muted,
    fontSize: 10,
  },
  financialBlock: {
    backgroundColor: C.cardSoft,
    borderRadius: 13,
    padding: 12,
    gap: 9,
  },
  financialHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  financialTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: "800",
  },
  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  moneyLabel: {
    color: C.muted,
    fontSize: 10,
    flex: 1,
  },
  moneyValue: {
    color: C.text,
    fontSize: 11,
    fontWeight: "800",
  },
  paymentDates: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    gap: 5,
  },
  paymentDateText: {
    color: C.muted,
    fontSize: 9,
  },
  transactionList: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 9,
    gap: 9,
  },
  transactionHeading: {
    color: C.text,
    fontSize: 10,
    fontWeight: "800",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  transactionTitle: {
    color: C.text,
    fontSize: 10,
    fontWeight: "700",
  },
  transactionMeta: {
    color: C.muted,
    fontSize: 8,
    marginTop: 3,
  },
  transactionAmount: {
    color: C.white,
    fontSize: 10,
    fontWeight: "800",
  },
  transactionStatus: {
    fontSize: 8,
    marginTop: 3,
  },
  timestampBlock: {
    gap: 5,
  },
  timestampText: {
    color: C.muted,
    fontSize: 9,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  actionButton: {
    minHeight: 39,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "800",
  },
  notice: {
    color: C.amber,
    fontSize: 10,
    lineHeight: 16,
    backgroundColor: "#2A2418",
    padding: 10,
    borderRadius: 9,
  },
  centerState: {
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    padding: 20,
  },
  stateText: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
  },
  errorTitle: {
    color: C.red,
    fontSize: 15,
    fontWeight: "800",
  },
  emptyTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: "800",
  },
  retryButton: {
    backgroundColor: C.lime,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    color: C.background,
    fontWeight: "900",
    fontSize: 11,
  },
});
