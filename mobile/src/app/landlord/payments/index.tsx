import { SafeAreaView } from "react-native-safe-area-context";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED"
  | string;

type PaymentType = "VIEWING" | "INSPECTION" | "BOOKING";

type LandlordPayment = {
  id: string;
  amount: number;
  currency: string;
  method: string | null;
  provider: string | null;
  reference: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  type: PaymentType;
  property: {
    id: string;
    title: string;
    purpose: string;
  } | null;
};

type PaymentSummary = {
  recordsReturned: number;
  successfulCount: number;
  successfulAmount: number;
  pendingCount: number;
  pendingAmount: number;
};

type PaymentFilter = "ALL" | "SUCCESS" | "PENDING" | "OTHER";

const EMPTY_SUMMARY: PaymentSummary = {
  recordsReturned: 0,
  successfulCount: 0,
  successfulAmount: 0,
  pendingCount: 0,
  pendingAmount: 0,
};

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
  } catch {
    // Use secure storage when local storage is unavailable.
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

function formatMoney(amount: number, currency = "KES") {
  return `${currency} ${Number(amount || 0).toLocaleString("en-KE")}`;
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readable(value: string | null | undefined) {
  if (!value) return "Not provided";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColors(status: PaymentStatus) {
  switch (status) {
    case "SUCCESS":
      return { background: "#24351A", text: "#D7FF5F" };
    case "PENDING":
    case "PROCESSING":
      return { background: "#332D1B", text: "#F4D477" };
    case "FAILED":
    case "CANCELLED":
      return { background: "#392222", text: "#FF9D9D" };
    case "REFUNDED":
      return { background: "#202E3B", text: "#A9D5FF" };
    default:
      return { background: "#252C2E", text: "#C1C9CA" };
  }
}

function paymentTypeLabel(type: PaymentType) {
  switch (type) {
    case "VIEWING":
      return "Property viewing fee";
    case "INSPECTION":
      return "Stay inspection fee";
    case "BOOKING":
      return "Short-stay booking payment";
    default:
      return "Property-related payment";
  }
}

export default function LandlordPayments() {
  const [payments, setPayments] = useState<LandlordPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>(EMPTY_SUMMARY);
  const [filter, setFilter] = useState<PaymentFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = await getToken();

      if (!token) {
        router.replace("/landlord/login" as any);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/landlord/payments`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/landlord/login" as any);
        return;
      }

      if (response.status === 403) {
        throw new Error(
          result?.message ||
            "Your landlord account does not currently have access to payments.",
        );
      }

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(
          result?.message || "Unable to load payment records.",
        );
      }

      setPayments(
        Array.isArray(result.data.payments) ? result.data.payments : [],
      );
      setSummary({
        ...EMPTY_SUMMARY,
        ...(result.data.summary || {}),
      });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Unable to connect to Makazii. Check your internet connection."
          : err instanceof Error
            ? err.message
            : "Unable to load payment records.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPayments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    if (filter === "SUCCESS") {
      return payments.filter((payment) => payment.status === "SUCCESS");
    }

    if (filter === "PENDING") {
      return payments.filter(
        (payment) =>
          payment.status === "PENDING" ||
          payment.status === "PROCESSING",
      );
    }

    if (filter === "OTHER") {
      return payments.filter(
        (payment) =>
          !["SUCCESS", "PENDING", "PROCESSING"].includes(payment.status),
      );
    }

    return payments;
  }, [filter, payments]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#D7FF5F" />
        <Text style={styles.mutedText}>Loading payment records...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPayments(true)}
            tintColor="#D7FF5F"
            colors={["#D7FF5F"]}
          />
        }
      >
        <Pressable
          onPress={() => router.replace("/landlord/dashboard" as any)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹  Dashboard</Text>
        </Pressable>

        <Text style={styles.brand}>MAKAZII</Text>
        <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
        <Text style={styles.heading}>Payments</Text>
        <Text style={styles.subtitle}>
          Review customer payment records linked to your properties.
        </Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Know what these figures mean</Text>
          <Text style={styles.noticeText}>
            These are recorded customer payments associated with your
            properties. They are not a statement of your earnings, money owed
            to you, platform fees, or payouts.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Payments unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadPayments()}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.cardEyebrow}>
                SUCCESSFUL RECORDS · RECENT HISTORY
              </Text>
              <Text style={styles.summaryAmount}>
                {formatMoney(summary.successfulAmount)}
              </Text>
              <Text style={styles.summaryCaption}>
                Recorded successful payments in the returned history
              </Text>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View style={styles.summaryStat}>
                  <Text style={styles.statValue}>
                    {summary.successfulCount}
                  </Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.summaryStat}>
                  <Text style={styles.statValue}>
                    {summary.pendingCount}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.summaryStat}>
                  <Text style={styles.statValue}>
                    {summary.recordsReturned}
                  </Text>
                  <Text style={styles.statLabel}>Records</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Payment history</Text>
                <Text style={styles.sectionSubtitle}>
                  Most recent records first · Up to 100 records
                </Text>
              </View>

              <Pressable onPress={() => void loadPayments(true)}>
                <Text style={styles.refreshText}>Refresh</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {(
                [
                  ["ALL", "All"],
                  ["SUCCESS", "Successful"],
                  ["PENDING", "Pending"],
                  ["OTHER", "Other"],
                ] as [PaymentFilter, string][]
              ).map(([value, label]) => {
                const selected = filter === value;

                return (
                  <Pressable
                    key={value}
                    onPress={() => setFilter(value)}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selected && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredPayments.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>KSh</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {payments.length === 0
                    ? "No payment records yet"
                    : "No matching payments"}
                </Text>
                <Text style={styles.emptyText}>
                  {payments.length === 0
                    ? "When a customer payment is recorded for a viewing, inspection, or booking linked to your properties, it will appear here."
                    : "Try another filter to see your other payment records."}
                </Text>
                {payments.length === 0 ? (
                  <Pressable
                    style={styles.outlineButton}
                    onPress={() => void loadPayments(true)}
                  >
                    <Text style={styles.outlineButtonText}>
                      Check again
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.paymentList}>
                {filteredPayments.map((payment) => {
                  const colors = statusColors(payment.status);

                  return (
                    <View key={payment.id} style={styles.paymentCard}>
                      <View style={styles.paymentTop}>
                        <View style={styles.paymentIcon}>
                          <Text style={styles.paymentIconText}>
                            {payment.type === "VIEWING"
                              ? "V"
                              : payment.type === "INSPECTION"
                                ? "I"
                                : "B"}
                          </Text>
                        </View>

                        <View style={styles.paymentHeading}>
                          <Text style={styles.paymentTitle}>
                            {paymentTypeLabel(payment.type)}
                          </Text>
                          <Text style={styles.propertyTitle}>
                            {payment.property?.title || "Property"}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: colors.background },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: colors.text },
                            ]}
                          >
                            {readable(payment.status)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.paymentAmount}>
                        {formatMoney(payment.amount, payment.currency)}
                      </Text>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Recorded</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(payment.createdAt)}
                        </Text>
                      </View>

                      {payment.paidAt ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Paid at</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(payment.paidAt)}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Method</Text>
                        <Text style={styles.detailValue}>
                          {readable(payment.method || payment.provider)}
                        </Text>
                      </View>

                      {payment.reference ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Reference</Text>
                          <Text
                            style={styles.detailValue}
                            numberOfLines={1}
                          >
                            {payment.reference}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.policyCard}>
              <Text style={styles.policyTitle}>
                Landlord fees and payouts
              </Text>
              <Text style={styles.policyText}>
                Your property listing charges, any optional platform fee, and
                landlord payouts will be shown separately once those policies
                and transaction records are configured. The customer payment
                history above does not establish that money is payable to you.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0F10" },
  content: { padding: 22, paddingTop: 12, paddingBottom: 48 },
  centered: {
    flex: 1,
    backgroundColor: "#0B0F10",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 26,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: { color: "#D7FF5F", fontSize: 14, fontWeight: "700" },
  brand: {
    color: "#D7FF5F",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
  },
  eyebrow: {
    color: "#9CA5A7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 8,
  },
  heading: {
    color: "#F4F7F7",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 10,
  },
  subtitle: {
    color: "#9CA5A7",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  notice: {
    backgroundColor: "#181E20",
    borderWidth: 1,
    borderColor: "#343D35",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  noticeTitle: {
    color: "#D7FF5F",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
  },
  noticeText: { color: "#B3BCBD", fontSize: 12, lineHeight: 19 },
  summaryCard: {
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 22,
    padding: 19,
    marginBottom: 28,
  },
  cardEyebrow: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  summaryAmount: {
    color: "#D7FF5F",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 12,
  },
  summaryCaption: {
    color: "#9CA5A7",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#252C2E",
    marginVertical: 18,
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryStat: { flex: 1, alignItems: "center" },
  statValue: { color: "#F4F7F7", fontSize: 20, fontWeight: "800" },
  statLabel: {
    color: "#9CA5A7",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },
  statDivider: { width: 1, height: 32, backgroundColor: "#252C2E" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: { color: "#F4F7F7", fontSize: 20, fontWeight: "800" },
  sectionSubtitle: { color: "#858F91", fontSize: 10, marginTop: 5 },
  refreshText: { color: "#D7FF5F", fontSize: 12, fontWeight: "800" },
  filters: { gap: 8, paddingBottom: 17 },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#30383A",
    backgroundColor: "#14191B",
  },
  filterChipActive: {
    backgroundColor: "#D7FF5F",
    borderColor: "#D7FF5F",
  },
  filterText: { color: "#B3BCBD", fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: "#111510" },
  paymentList: { gap: 13 },
  paymentCard: {
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 19,
    padding: 15,
  },
  paymentTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconText: { color: "#D7FF5F", fontSize: 14, fontWeight: "900" },
  paymentHeading: { flex: 1 },
  paymentTitle: { color: "#F4F7F7", fontSize: 12, fontWeight: "800" },
  propertyTitle: {
    color: "#929C9E",
    fontSize: 10,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: 105,
  },
  statusText: { fontSize: 9, fontWeight: "800" },
  paymentAmount: {
    color: "#F4F7F7",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 19,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "#202628",
  },
  detailLabel: { color: "#858F91", fontSize: 10, flex: 0.8 },
  detailValue: {
    color: "#C7CECF",
    fontSize: 10,
    flex: 1.5,
    textAlign: "right",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconText: { color: "#D7FF5F", fontSize: 12, fontWeight: "900" },
  emptyTitle: {
    color: "#F4F7F7",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: "#9CA5A7",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 9,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#D7FF5F",
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 18,
  },
  outlineButtonText: { color: "#D7FF5F", fontSize: 12, fontWeight: "800" },
  policyCard: {
    backgroundColor: "#111617",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginTop: 24,
  },
  policyTitle: { color: "#E4E9E9", fontSize: 13, fontWeight: "800" },
  policyText: {
    color: "#929C9E",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: "#231819",
    borderColor: "#583033",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  errorTitle: { color: "#FFB0B0", fontSize: 16, fontWeight: "800" },
  errorText: {
    color: "#D4B7B7",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#D7FF5F",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 15,
  },
  retryText: { color: "#111510", fontSize: 12, fontWeight: "900" },
  mutedText: { color: "#9CA5A7", marginTop: 12, fontSize: 13 },
});
