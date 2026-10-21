import React, { useCallback, useState } from "react";
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
import { useFocusEffect, router } from "expo-router";
import { ArrowLeft, MessageSquareWarning, RefreshCw } from "lucide-react-native";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

type Concern = {
  id: string;
  category: string;
  customerCategory?: string | null;
  message: string;
  status: string;
  createdAt: string;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  property?: {
    id: string;
    title: string;
    town?: string | null;
    area?: string | null;
  } | null;
  viewing?: {
    status?: string;
    requestedDate?: string | null;
    scheduledAt?: string | null;
  } | null;
};

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
  } catch {
    // Fall back to secure storage.
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readableStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) =>
    letter.toUpperCase(),
  );
}

function readableDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function LandlordConcernsScreen() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadConcerns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const token = await getToken();

      if (!token) {
        router.replace("/landlord/login" as any);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/landlord/problem-reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to load your property concerns.",
        );
      }

      const result = payload?.data?.concerns ?? payload?.concerns;

      if (!Array.isArray(result)) {
        throw new Error("The server returned an unexpected concerns response.");
      }

      setConcerns(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load concerns. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadConcerns();
    }, [loadConcerns]),
  );

  const openCount = concerns.filter((item) => item.status === "OPEN").length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadConcerns(true)}
            tintColor="#D7FF5F"
            colors={["#D7FF5F"]}
          />
        }
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={19} color="#D7FF5F" />
          <Text style={styles.backText}>Dashboard</Text>
        </Pressable>

        <Text style={styles.brand}>MAKAZII</Text>
        <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
        <Text style={styles.heading}>My concerns</Text>
        <Text style={styles.subtitle}>
          Review customer concerns about your properties and their viewing
          experiences. Makazii manages official responses and resolution.
        </Text>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <MessageSquareWarning size={23} color="#D7FF5F" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>YOUR PROPERTY CONCERNS</Text>
            <Text style={styles.summaryValue}>
              {concerns.length} {concerns.length === 1 ? "report" : "reports"}
            </Text>
          </View>
          <View style={styles.openPill}>
            <Text style={styles.openPillText}>{openCount} open</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#D7FF5F" />
            <Text style={styles.stateText}>Loading concerns...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>Couldn't load concerns</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadConcerns()}
            >
              <RefreshCw size={16} color="#0B0F10" />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : concerns.length === 0 ? (
          <View style={styles.stateBox}>
            <MessageSquareWarning size={32} color="#9CA5A7" />
            <Text style={styles.emptyTitle}>No concerns yet</Text>
            <Text style={styles.stateText}>
              Customer concerns linked to your properties will appear here.
            </Text>
          </View>
        ) : (
          concerns.map((concern) => {
            const customerName = [
              concern.customer?.firstName,
              concern.customer?.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            const propertyLocation = [
              concern.property?.area,
              concern.property?.town,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <View key={concern.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.categoryWrap}>
                    <Text style={styles.category}>
                      {concern.customerCategory || concern.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      concern.status === "RESOLVED" ||
                      concern.status === "CLOSED"
                        ? styles.resolvedPill
                        : concern.status === "IN_PROGRESS"
                          ? styles.progressPill
                          : styles.pendingPill,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {readableStatus(concern.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.message}>{concern.message}</Text>

                <View style={styles.divider} />

                <Text style={styles.detailLabel}>PROPERTY</Text>
                <Text style={styles.propertyTitle}>
                  {concern.property?.title || "Property details unavailable"}
                </Text>
                {propertyLocation ? (
                  <Text style={styles.location}>{propertyLocation}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Reported by</Text>
                  <Text style={styles.metaValue}>
                    {customerName || "Customer"}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Submitted</Text>
                  <Text style={styles.metaValue}>
                    {readableDate(concern.createdAt)}
                  </Text>
                </View>

                {concern.viewing ? (
                  <View style={styles.viewingNote}>
                    <Text style={styles.viewingLabel}>RELATED VIEWING</Text>
                    <Text style={styles.viewingValue}>
                      {readableStatus(concern.viewing.status || "Unknown")}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.footerNote}>
                  For an official response or resolution update, contact the
                  Makazii administration team.
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0F10" },
  content: { padding: 22, paddingTop: 28, paddingBottom: 48 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 9,
    paddingVertical: 8,
    marginBottom: 22,
  },
  backText: { color: "#D7FF5F", fontSize: 13, fontWeight: "700" },
  brand: {
    color: "#D7FF5F",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
  },
  eyebrow: {
    color: "#9CA5A7",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 25,
    letterSpacing: 2,
  },
  heading: {
    color: "#F4F7F7",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 9,
  },
  subtitle: {
    color: "#9CA5A7",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 24,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#20291A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryText: { flex: 1 },
  summaryLabel: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryValue: {
    color: "#F4F7F7",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4,
  },
  openPill: {
    backgroundColor: "#292D1D",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  openPillText: { color: "#D7FF5F", fontSize: 11, fontWeight: "800" },
  card: {
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryWrap: { flex: 1, paddingTop: 5 },
  category: {
    color: "#D7FF5F",
    fontSize: 13,
    fontWeight: "800",
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingPill: { backgroundColor: "#332A19" },
  progressPill: { backgroundColor: "#1E2E38" },
  resolvedPill: { backgroundColor: "#203026" },
  statusText: { color: "#F4F7F7", fontSize: 10, fontWeight: "800" },
  message: {
    color: "#E7EBEB",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 15,
  },
  divider: { height: 1, backgroundColor: "#252C2E", marginVertical: 16 },
  detailLabel: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  propertyTitle: {
    color: "#F4F7F7",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
  },
  location: { color: "#9CA5A7", fontSize: 12, marginTop: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 13,
  },
  metaLabel: { color: "#9CA5A7", fontSize: 12 },
  metaValue: {
    color: "#E7EBEB",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  viewingNote: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#181E20",
    padding: 11,
    borderRadius: 10,
    marginTop: 15,
  },
  viewingLabel: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  viewingValue: { color: "#E7EBEB", fontSize: 11, fontWeight: "700" },
  footerNote: {
    color: "#9CA5A7",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 16,
  },
  stateBox: {
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  stateText: {
    color: "#9CA5A7",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  errorTitle: { color: "#F4F7F7", fontSize: 16, fontWeight: "800" },
  emptyTitle: { color: "#F4F7F7", fontSize: 17, fontWeight: "800" },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D7FF5F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 5,
  },
  retryText: { color: "#0B0F10", fontWeight: "900", fontSize: 12 },
});
