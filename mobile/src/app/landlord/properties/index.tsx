import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, router } from "expo-router";
import { ArrowLeft, Building2, ChevronRight, Plus, RefreshCw } from "lucide-react-native";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

type CountyOption = {
  id: string;
  name: string;
};

type Property = {
  id: string;
  title: string;
  description?: string | null;
  purpose?: string;
  status?: string;
  monthlyRent?: number | null;
  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;
  countyRelation?: { name?: string } | null;
  constituency?: { name?: string } | null;
  ward?: { name?: string } | null;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  statusHistory?: Array<{
    status?: string;
    note?: string | null;
    createdAt?: string;
  }>;
};

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(TOKEN_KEY);
    }
  } catch {}
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

function formatStatus(value?: string) {
  return (value || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColor(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "#D7FF5F";
    case "CHANGES_REQUIRED":
      return "#FFC875";
    case "REJECTED":
      return "#FF8C8C";
    case "RENTED":
      return "#9BC7FF";
    default:
      return "#B9C1C3";
  }
}

function money(value?: number | null) {
  if (value == null) return null;
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

export default function LandlordProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [propertyCounties, setPropertyCounties] = useState<CountyOption[]>([]);
  const [applicationStatus, setApplicationStatus] = useState("");
  const [countyLoadError, setCountyLoadError] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const loadProperties = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    setCountyLoadError("");
    setDashboardLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        setError("Your landlord session has expired. Please sign in again.");
        setProperties([]);
        setPropertyCounties([]);
        setApplicationStatus("");
        setDashboardLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.landlordProperties}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load your properties.");
      }

      const list = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.properties)
        ? result.properties
        : [];

      setProperties(list);

      // Load the landlord's saved county selections independently so a
      // dashboard error does not hide properties already loaded above.
      try {
        const dashboardResponse = await fetch(
          `${API_BASE_URL}/landlord/dashboard/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const dashboardResult = await dashboardResponse.json();
        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardResult.message || "Could not load your county selections."
          );
        }

        const dashboardData = dashboardResult.data;
        const savedCounties = dashboardData?.propertyCounties;
        setPropertyCounties(
          Array.isArray(savedCounties)
            ? savedCounties.filter(
                (county: unknown): county is CountyOption =>
                  typeof county === "object" &&
                  county !== null &&
                  "id" in county &&
                  "name" in county &&
                  typeof (county as CountyOption).id === "string" &&
                  typeof (county as CountyOption).name === "string"
              )
            : []
        );
        setApplicationStatus(
          typeof dashboardData?.application?.status === "string"
            ? dashboardData.application.status.toUpperCase()
            : ""
        );
      } catch (dashboardError) {
        setCountyLoadError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Could not load your county selections."
        );
      } finally {
        setDashboardLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your properties."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setDashboardLoading(false);
    }
  }, []);

  const handleAddProperty = useCallback(() => {
    if (dashboardLoading) return;

    if (countyLoadError) {
      Alert.alert(
        "County selections unavailable",
        "We could not verify your saved counties. Please retry before submitting a property.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: () => { void loadProperties(true); } },
        ]
      );
      return;
    }

    if (propertyCounties.length > 0) {
      router.push("/landlord/properties/add" as any);
      return;
    }

    if (applicationStatus === "APPROVED" || applicationStatus === "REJECTED") {
      Alert.alert(
        "No property counties saved",
        "Please contact Makazii support to update your county selections."
      );
      return;
    }

    router.push("/landlord/application" as any);
  }, [
    applicationStatus,
    countyLoadError,
    dashboardLoading,
    loadProperties,
    propertyCounties.length,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to landlord dashboard"
          style={styles.backButton}
          onPress={() => router.replace("/landlord/dashboard" as any)}
        >
          <ArrowLeft color="#F4F6F6" size={22} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
          <Text style={styles.heading}>My properties</Text>
        </View>

        <Pressable
          accessibilityLabel="Refresh properties"
          style={styles.refreshButton}
          onPress={() => loadProperties(true)}
        >
          <RefreshCw color="#D7FF5F" size={19} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProperties(true)}
            tintColor="#D7FF5F"
          />
        }
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Building2 color="#D7FF5F" size={25} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Your property portfolio</Text>
            <Text style={styles.muted}>
              Track submissions, administrator feedback, and property approval.
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.count}>{properties.length}</Text>
          </View>
        </View>

        <View style={styles.countyCard}>
          <View style={styles.countyHeader}>
            <View style={styles.countyIcon}>
              <Building2 color="#D7FF5F" size={20} />
            </View>
            <View style={styles.countyHeaderText}>
              <Text style={styles.countyTitle}>Your property counties</Text>
              <Text style={styles.muted}>
                Properties can only be submitted in your saved counties.
              </Text>
            </View>
          </View>

          {dashboardLoading ? (
            <View style={styles.countyLoading}>
              <ActivityIndicator color="#D7FF5F" size="small" />
              <Text style={styles.muted}>Checking your county selections...</Text>
            </View>
          ) : countyLoadError ? (
            <View style={styles.countyNotice}>
              <Text style={styles.countyWarning}>
                We could not verify your county selections.
              </Text>
              <Text style={styles.muted}>{countyLoadError}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => { void loadProperties(true); }}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : propertyCounties.length > 0 ? (
            <>
              <View style={styles.countyChips}>
                {propertyCounties.map((county) => (
                  <View key={county.id} style={styles.countyChip}>
                    <Text style={styles.countyChipText}>{county.name}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.countyFootnote}>
                Your Add Property form will only offer these counties.
              </Text>
            </>
          ) : (
            <View style={styles.countyNotice}>
              <Text style={styles.countyWarning}>
                No property counties saved yet.
              </Text>
              <Text style={styles.muted}>
                Choose the counties where you have properties before starting a submission.
              </Text>
              {applicationStatus === "APPROVED" ||
              applicationStatus === "REJECTED" ? (
                <Text style={styles.muted}>
                  Contact Makazii support to update your county selections.
                </Text>
              ) : (
                <Pressable
                  style={styles.chooseCountyButton}
                  onPress={() => router.push("/landlord/application" as any)}
                >
                  <Text style={styles.chooseCountyText}>Choose counties</Text>
                  <ChevronRight color="#0B0F10" size={18} />
                </Pressable>
              )}
            </View>
          )}
        </View>

        <Pressable
          style={styles.addButton}
          onPress={handleAddProperty}
          disabled={dashboardLoading}
        >
          <Plus color="#0B0F10" size={20} />
          <Text style={styles.addButtonText}>Submit a property</Text>
        </Pressable>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D7FF5F" />
            <Text style={styles.muted}>Loading your properties...</Text>
          </View>
        ) : error ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorTitle}>Unable to load properties</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => loadProperties()}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
            {error.toLowerCase().includes("session") ? (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.replace("/landlord/login" as any)}
              >
                <Text style={styles.secondaryButtonText}>Sign in</Text>
              </Pressable>
            ) : null}
          </View>
        ) : properties.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Building2 color="#9CA5A7" size={30} />
            </View>
            <Text style={styles.emptyTitle}>No properties yet</Text>
            <Text style={styles.muted}>
              Your submitted properties will appear here. Add a property to
              begin the administrator review process.
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={handleAddProperty}
              disabled={dashboardLoading}
            >
              <Plus color="#0B0F10" size={19} />
              <Text style={styles.addButtonText}>Add your first property</Text>
            </Pressable>
          </View>
        ) : (
          properties.map((property) => {
            const primaryImage =
              property.images?.find((image) => image.isPrimary) ||
              property.images?.[0];
            const price =
              property.purpose === "SHORT_STAY"
                ? money(property.dayRate ?? property.nightRate ?? property.dayNightRate)
                : money(property.monthlyRent);

            const location = [
              property.ward?.name,
              property.constituency?.name,
              property.countyRelation?.name,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <Pressable
                key={property.id}
                style={styles.propertyCard}
                onPress={() =>
                  router.push(
                    `/landlord/properties/${encodeURIComponent(property.id)}` as any
                  )
                }
              >
                {primaryImage?.url ? (
                  <Image
                    source={{ uri: primaryImage.url }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.propertyImage, styles.imageFallback]}>
                    <Building2 color="#697477" size={34} />
                    <Text style={styles.imageFallbackText}>No photo added</Text>
                  </View>
                )}

                <View style={styles.propertyBody}>
                  <View style={styles.propertyTitleRow}>
                    <Text style={styles.propertyTitle} numberOfLines={2}>
                      {property.title || "Untitled property"}
                    </Text>
                    <ChevronRight color="#9CA5A7" size={20} />
                  </View>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor(property.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColor(property.status) },
                      ]}
                    >
                      {formatStatus(property.status)}
                    </Text>
                  </View>

                  {location ? (
                    <Text style={styles.location} numberOfLines={2}>
                      {location}
                    </Text>
                  ) : null}

                  <View style={styles.bottomRow}>
                    <Text style={styles.typeText}>
                      {formatStatus(property.purpose)}
                    </Text>
                    {price ? <Text style={styles.price}>{price}</Text> : null}
                  </View>

                  {property.status === "PENDING_VERIFICATION" ? (
                    <Text style={styles.reviewHint}>
                      Awaiting administrator review
                    </Text>
                  ) : property.status === "CHANGES_REQUIRED" ? (
                    <Text style={styles.reviewHint}>
                      Open this property to review requested changes
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}

        <Text style={styles.footer}>
          MAKAZII reviews submitted properties before they become available to
          customers.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B0F10" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: "#9CA5A7",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
  },
  heading: { color: "#F4F6F6", fontSize: 25, fontWeight: "800", marginTop: 3 },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#14191B",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 18, paddingBottom: 38, gap: 15 },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    gap: 12,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  introText: { flex: 1, gap: 5 },
  introTitle: { color: "#F4F6F6", fontSize: 15, fontWeight: "800" },
  muted: { color: "#9CA5A7", fontSize: 13, lineHeight: 19 },
  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  count: { color: "#D7FF5F", fontWeight: "900", fontSize: 15 },
  addButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#D7FF5F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
  },
  addButtonText: { color: "#0B0F10", fontWeight: "900", fontSize: 14 },
  center: { paddingVertical: 50, alignItems: "center", gap: 14 },
  countyCard: {
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  countyHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  countyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  countyHeaderText: { flex: 1, gap: 4 },
  countyTitle: { color: "#F4F6F6", fontSize: 15, fontWeight: "800" },
  countyLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
  countyChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countyChip: {
    backgroundColor: "#202729",
    borderColor: "#3B4548",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countyChipText: { color: "#D7FF5F", fontSize: 12, fontWeight: "800" },
  countyFootnote: { color: "#9CA5A7", fontSize: 11, lineHeight: 16 },
  countyNotice: { gap: 10 },
  countyWarning: { color: "#FFC875", fontSize: 13, fontWeight: "800" },
  chooseCountyButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D7FF5F",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  chooseCountyText: { color: "#0B0F10", fontWeight: "900", fontSize: 12 },
  messageCard: {
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  errorTitle: { color: "#FF8C8C", fontSize: 16, fontWeight: "800" },
  retryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: "#252C2E",
    borderRadius: 12,
  },
  retryText: { color: "#D7FF5F", fontWeight: "800" },
  secondaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B4548",
  },
  secondaryButtonText: { color: "#F4F6F6", fontWeight: "700" },
  emptyCard: {
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    gap: 13,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#202729",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: "#F4F6F6", fontSize: 19, fontWeight: "900" },
  propertyCard: {
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    borderRadius: 20,
    overflow: "hidden",
  },
  propertyImage: { width: "100%", height: 185, backgroundColor: "#181E20" },
  imageFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  imageFallbackText: { color: "#9CA5A7", fontSize: 12 },
  propertyBody: { padding: 15, gap: 10 },
  propertyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  propertyTitle: {
    flex: 1,
    color: "#F4F6F6",
    fontSize: 17,
    fontWeight: "900",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "800" },
  location: { color: "#B4BDBF", fontSize: 12, lineHeight: 18 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#252C2E",
  },
  typeText: { color: "#9CA5A7", fontSize: 11, fontWeight: "700" },
  price: { color: "#D7FF5F", fontSize: 15, fontWeight: "900" },
  reviewHint: { color: "#FFC875", fontSize: 12, lineHeight: 17 },
  footer: {
    color: "#697477",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 12,
    paddingTop: 4,
  },
});
