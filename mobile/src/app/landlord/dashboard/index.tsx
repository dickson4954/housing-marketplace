import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_BASE_URL } from "@/config/api";
import { SafeAreaView } from "react-native-safe-area-context";

const TOKEN_KEY = "makazii_landlord_token";

const C = {
  background: "#0B0F10",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  white: "#FFFFFF",
  muted: "#9CA5A7",
  border: "#252C2E",
  green: "#43D17A",
  orange: "#FFB454",
  blue: "#6FA8FF",
};

const items = [
  {
    title: "My Properties",
    detail: "Manage your submitted listings and track their review status.",
    route: "/landlord/properties",
    icon: "⌂",
    tag: "LISTINGS",
    color: C.lime,
  },
  {
    title: "Add a Property",
    detail: "Submit another property for Makazii to review.",
    route: "/landlord/properties/add",
    icon: "+",
    tag: "NEW LISTING",
    color: C.green,
  },
  {
    title: "Viewings",
    detail: "Check requests and updates for property viewings.",
    route: "/landlord/viewings",
    icon: "◷",
    tag: "ACTIVITY",
    color: C.blue,
  },
  {
    title: "Stay Bookings",
    detail: "Manage accommodation reservations, guest arrivals, and departures.",
    route: "/landlord/stay-bookings",
    icon: "▣",
    tag: "ACCOMMODATION",
    color: C.lime,
  },
  {
    title: "My Concerns",
    detail: "Review concerns raised about your properties.",
    route: "/landlord/concerns",
    icon: "◇",
    tag: "SUPPORT",
    color: C.orange,
  },
  {
    title: "Payments",
    detail: "Review the available fee and payment information.",
    route: "/landlord/payments",
    icon: "↗",
    tag: "FINANCE",
    color: C.green,
  },
  {
    title: "Account Settings",
    detail: "Manage your landlord account and sign-in session.",
    route: "/landlord/account",
    icon: "○",
    tag: "ACCOUNT",
    color: C.blue,
  },
  {
    title: "Application Status",
    detail: "Review your landlord application information.",
    route: "/landlord/application",
    icon: "✓",
    tag: "VERIFICATION",
    color: C.lime,
  },
] as const;

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
  } catch {
    // Try secure storage below.
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export default function LandlordDashboard() {
  const { width } = useWindowDimensions();
  const wide = width >= 620;
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [propertyCounties, setPropertyCounties] = useState<
    { id: string; name: string }[]
  >([]);

  const checkApproval = useCallback(async () => {
    setChecking(true);
    setError("");

    try {
      const token = await getToken();

      if (!token) {
        router.replace("/landlord/login" as any);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/landlord/application-status`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        router.replace("/landlord/login" as any);
        return;
      }

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(
          result?.message || "Could not verify your landlord approval."
        );
      }

      if (
        String(result.data.applicationStatus || "").toUpperCase() !==
        "APPROVED"
      ) {
        router.replace("/landlord/application" as any);
        return;
      }

      const dashboardResponse = await fetch(
        `${API_BASE_URL}/landlord/dashboard/`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dashboardResult = await dashboardResponse.json().catch(() => null);

      if (
        !dashboardResponse.ok ||
        !dashboardResult?.success ||
        !dashboardResult?.data
      ) {
        throw new Error(
          dashboardResult?.message || "Could not load your approved counties."
        );
      }

      const savedCounties = dashboardResult.data.propertyCounties;

      setPropertyCounties(
        Array.isArray(savedCounties)
          ? savedCounties.filter(
              (county: any) =>
                county &&
                typeof county.id === "string" &&
                typeof county.name === "string"
            )
          : []
      );
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Unable to connect to Makazii. Check your internet connection."
          : err instanceof Error
            ? err.message
            : "Unable to verify your application."
      );
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkApproval();
    }, 0);

    return () => clearTimeout(timer);
  }, [checkApproval]);

  if (checking) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.lime} />
        <Text style={styles.loadingText}>
          Verifying your landlord approval...
        </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Dashboard unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => void checkApproval()}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={() => router.replace("/landlord/application" as any)}
        >
          <Text style={styles.secondaryButtonText}>
            View application status
          </Text>
        </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: wide ? 30 : 17 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroContent}>
          <View style={styles.approvedBadge}>
            <View style={styles.approvedDot} />
            <Text style={styles.approvedBadgeText}>LANDLORD APPROVED</Text>
          </View>

          <Text style={styles.heroTitle}>Your property space.</Text>
          <Text style={styles.heroSubtitle}>
            Manage your listings, stay on top of viewings, and keep your
            property information organized in one place.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/landlord/properties/add" as any)}
            style={({ pressed }) => [
              styles.heroButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.heroButtonText}>＋ Add a property</Text>
            <Text style={styles.heroButtonArrow}>↗</Text>
          </Pressable>
        </View>
        <View style={styles.heroDecoration}>
          <Text style={styles.heroDecorationText}>M</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>YOUR WORKSPACE</Text>
          <Text style={styles.sectionTitle}>Quick access</Text>
        </View>
        <Text style={styles.sectionHint}>Choose an action</Text>
      </View>

      <View style={styles.actionGrid}>
        {items.map((item) => (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [
              styles.actionCard,
              wide && styles.actionCardWide,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionCardTop}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${item.color}16` },
                ]}
              >
                <Text style={[styles.actionIconText, { color: item.color }]}>
                  {item.icon}
                </Text>
              </View>
              <Text style={styles.actionArrow}>↗</Text>
            </View>

            <Text style={styles.actionTag}>{item.tag}</Text>
            <Text style={styles.actionTitle}>{item.title}</Text>
            <Text style={styles.actionDetail}>{item.detail}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionEyebrow}>PROPERTY COVERAGE</Text>
          <Text style={styles.sectionTitle}>Your selected counties</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{propertyCounties.length}</Text>
        </View>
      </View>

      <View style={styles.countyPanel}>
        <View style={styles.countyPanelIcon}>
          <Text style={styles.countyPanelIconText}>⌖</Text>
        </View>
        <View style={styles.countyPanelBody}>
          <Text style={styles.countyPanelTitle}>
            {propertyCounties.length > 0
              ? "Your service areas"
              : "No counties recorded"}
          </Text>
          <Text style={styles.countyPanelText}>
            {propertyCounties.length > 0
              ? propertyCounties.map((county) => county.name).join("  ·  ")
              : "Your application has no saved counties. Contact Makazii to update your county selections before adding a property."}
          </Text>
        </View>
      </View>

      <View style={styles.notice}>
        <View style={styles.noticeIcon}>
          <Text style={styles.noticeIconText}>i</Text>
        </View>
        <View style={styles.noticeBody}>
          <Text style={styles.noticeTitle}>Property approval is required</Text>
          <Text style={styles.noticeText}>
            Every property you submit must be reviewed and approved by Makazii
            before it appears in the marketplace. Landlord approval does not
            automatically approve your property listings or national ID
            verification.
          </Text>
        </View>
      </View>

      <Text style={styles.footerText}>
        MAKAZII · FIND YOUR PLACE
      </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingTop: 12, paddingBottom: 42 },
  centered: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: C.muted,
    marginTop: 14,
    textAlign: "center",
    fontSize: 13,
  },
  hero: {
    minHeight: 235,
    backgroundColor: "#151D19",
    borderWidth: 1,
    borderColor: "#354329",
    borderRadius: 23,
    overflow: "hidden",
    marginBottom: 31,
    position: "relative",
    justifyContent: "center",
  },
  heroGlow: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 140,
    backgroundColor: "#26351B",
    right: -115,
    top: -105,
    opacity: 0.8,
  },
  heroContent: {
    padding: 24,
    maxWidth: 680,
    zIndex: 1,
  },
  approvedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#25321B",
    borderWidth: 1,
    borderColor: "#3A4A29",
    marginBottom: 18,
  },
  approvedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.lime,
  },
  approvedBadgeText: {
    color: C.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: {
    color: C.white,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: "#B4BFBA",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 20,
    maxWidth: 480,
  },
  heroButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: C.lime,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 11,
  },
  heroButtonText: {
    color: C.background,
    fontSize: 12,
    fontWeight: "900",
  },
  heroButtonArrow: {
    color: C.background,
    fontSize: 15,
    fontWeight: "900",
  },
  heroDecoration: {
    position: "absolute",
    right: 28,
    bottom: -32,
    width: 160,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.055,
    transform: [{ rotate: "-12deg" }],
  },
  heroDecorationText: {
    color: C.lime,
    fontSize: 185,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 12,
  },
  sectionHeadingWrap: { flex: 1 },
  sectionEyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 6,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionHint: {
    color: C.muted,
    fontSize: 11,
    paddingBottom: 3,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 31,
  },
  actionCard: {
    width: "100%",
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 17,
    padding: 17,
    minHeight: 184,
  },
  actionCardWide: { width: "48.5%" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  actionCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  actionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconText: { fontSize: 25, fontWeight: "800" },
  actionArrow: { color: "#788284", fontSize: 19 },
  actionTag: {
    color: "#778284",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  actionTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },
  actionDetail: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  countBadge: {
    minWidth: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countBadgeText: { color: C.lime, fontSize: 12, fontWeight: "900" },
  countyPanel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    padding: 17,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    marginBottom: 14,
  },
  countyPanelIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#20291A",
    alignItems: "center",
    justifyContent: "center",
  },
  countyPanelIconText: { color: C.lime, fontSize: 23, fontWeight: "800" },
  countyPanelBody: { flex: 1 },
  countyPanelTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
  },
  countyPanelText: { color: C.muted, fontSize: 12, lineHeight: 19 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 17,
    borderRadius: 17,
    backgroundColor: "#1B1C16",
    borderWidth: 1,
    borderColor: "#413D24",
    marginTop: 2,
  },
  noticeIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "#302F1B",
    alignItems: "center",
    justifyContent: "center",
  },
  noticeIconText: { color: C.lime, fontSize: 17, fontWeight: "900" },
  noticeBody: { flex: 1 },
  noticeTitle: {
    color: C.lime,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 7,
  },
  noticeText: { color: "#C1C4B6", fontSize: 12, lineHeight: 19 },
  footerText: {
    color: "#596365",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 27,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#352323",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  errorIconText: { color: "#FF8A8A", fontSize: 25, fontWeight: "900" },
  errorTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  errorText: {
    color: C.muted,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: C.lime,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: C.background,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryButton: {
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: C.lime,
    fontSize: 14,
    fontWeight: "800",
  },
});
