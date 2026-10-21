import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, router, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "makazii_landlord_token";

const C = {
  background: "#0B0F10",
  panel: "#111718",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  white: "#FFFFFF",
  muted: "#9CA5A7",
  border: "#252C2E",
  red: "#FF8A8A",
};

const navigation = [
  { label: "Dashboard", icon: "▦", route: "/landlord/dashboard" },
  { label: "My Properties", icon: "⌂", route: "/landlord/properties" },
  { label: "Add Property", icon: "+", route: "/landlord/properties/add" },
  { label: "Viewings", icon: "◷", route: "/landlord/viewings" },
  { label: "Payments", icon: "↗", route: "/landlord/payments" },
  { label: "My Concerns", icon: "◇", route: "/landlord/concerns" },
  { label: "Account", icon: "○", route: "/landlord/account" },
] as const;

function pageTitle(pathname: string) {
  if (pathname.includes("/properties/add")) return "Add Property";
  if (pathname.includes("/properties/")) return "Property Details";
  if (pathname.startsWith("/landlord/properties")) return "My Properties";
  if (pathname.startsWith("/landlord/viewings")) return "Viewings";
  if (pathname.startsWith("/landlord/payments")) return "Payments";
  if (pathname.startsWith("/landlord/concerns")) return "My Concerns";
  if (pathname.startsWith("/landlord/account")) return "Account Settings";
  return "Dashboard";
}

function isPortalRoute(pathname: string) {
  return (
    pathname.startsWith("/landlord/dashboard") ||
    pathname.startsWith("/landlord/properties") ||
    pathname.startsWith("/landlord/viewings") ||
    pathname.startsWith("/landlord/payments") ||
    pathname.startsWith("/landlord/concerns") ||
    pathname.startsWith("/landlord/account")
  );
}

export default function LandlordLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const portal = isPortalRoute(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const navigate = (route: string) => {
    setMenuOpen(false);
    if (pathname !== route) router.push(route as any);
  };

  const signOut = async () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error("Unable to clear browser landlord session:", error);
    }

    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Unable to clear secure landlord session:", error);
    }

    setConfirmLogout(false);
    setMenuOpen(false);
    router.replace("/" as any);
  };

  const sidebar = (
    <View style={[styles.sidebar, desktop && styles.desktopSidebar]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to landlord dashboard"
        onPress={() => navigate("/landlord/dashboard")}
        style={styles.brandBlock}
      >
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>M</Text>
        </View>
        <View>
          <Text style={styles.brand}>MAKAZII</Text>
          <Text style={styles.brandCaption}>LANDLORD PORTAL</Text>
        </View>
      </Pressable>

      <View style={styles.workspaceBadge}>
        <View style={styles.onlineDot} />
        <Text style={styles.workspaceText}>LANDLORD WORKSPACE</Text>
      </View>

      <Text style={styles.sectionLabel}>WORKSPACE</Text>

      <ScrollView
        style={styles.navigationScroll}
        contentContainerStyle={styles.navigationContent}
        showsVerticalScrollIndicator={false}
      >
        {navigation.map((item) => {
          const active =
            pathname === item.route ||
            (item.route === "/landlord/properties" &&
              pathname.startsWith("/landlord/properties/") &&
              !pathname.includes("/properties/add"));

          return (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => navigate(item.route)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
            >
              <View
                style={[
                  styles.navIconBox,
                  active && styles.navIconBoxActive,
                ]}
              >
                <Text
                  style={[
                    styles.navIcon,
                    active && styles.navIconActive,
                  ]}
                >
                  {item.icon}
                </Text>
              </View>
              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {active ? <View style={styles.activeIndicator} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Need assistance?</Text>
          <Text style={styles.helpText}>
            Contact Makazii if you need help with your properties or account.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmLogout(true)}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.navItemPressed,
          ]}
        >
          <Text style={styles.signOutIcon}>↪</Text>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.versionText}>MAKAZII · PROPERTY MANAGEMENT</Text>
      </View>
    </View>
  );

  if (!portal) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.background },
          animation: "fade",
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {desktop ? sidebar : null}

      <View style={styles.main}>
        <View style={styles.topbar}>
          {!desktop ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu"
              onPress={() => setMenuOpen(true)}
              style={styles.menuButton}
            >
              <Text style={styles.menuButtonText}>☰</Text>
            </Pressable>
          ) : null}

          <View style={styles.topbarTitleWrap}>
            <Text style={styles.topbarEyebrow}>LANDLORD WORKSPACE</Text>
            <Text style={styles.topbarTitle}>{pageTitle(pathname)}</Text>
          </View>

          <View style={styles.secureBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.secureBadgeText}>
              {desktop ? "SECURE PORTAL" : "SECURE"}
            </Text>
          </View>
        </View>

        <View style={styles.pageArea}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.background },
              animation: "fade",
            }}
          />
        </View>
      </View>

      {!desktop && menuOpen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
          statusBarTranslucent
        >
          <View style={styles.mobileOverlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close navigation menu"
              style={styles.backdrop}
              onPress={() => setMenuOpen(false)}
            />
            <View style={styles.mobileDrawer}>
              <View style={styles.mobileDrawerHeader}>
                <Text style={styles.mobileDrawerHeading}>Navigation</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  onPress={() => setMenuOpen(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>
              {sidebar}
            </View>
          </View>
        </Modal>
      ) : null}

      <Modal
        visible={confirmLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLogout(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Text style={styles.confirmIconText}>↪</Text>
            </View>
            <Text style={styles.confirmTitle}>Sign out?</Text>
            <Text style={styles.confirmDescription}>
              You will leave your landlord workspace and need to sign in again
              to manage your properties.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void signOut()}
              style={styles.confirmSignOut}
            >
              <Text style={styles.confirmSignOutText}>Yes, sign out</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmLogout(false)}
              style={styles.cancelSignOut}
            >
              <Text style={styles.cancelSignOutText}>Stay signed in</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: C.background,
    minHeight: 0,
  },
  sidebar: {
    width: 286,
    flex: 1,
    backgroundColor: C.panel,
    borderRightWidth: 1,
    borderRightColor: C.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  desktopSidebar: {
    flex: 0,
    height: "100%",
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    marginBottom: 22,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: C.background,
    fontSize: 24,
    fontWeight: "900",
  },
  brand: {
    color: C.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandCaption: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  workspaceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#19211A",
    borderColor: "#303D24",
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 28,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.lime,
  },
  workspaceText: {
    color: C.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sectionLabel: {
    color: "#697476",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 12,
    paddingLeft: 8,
  },
  navigationScroll: { flex: 1, minHeight: 0 },
  navigationContent: { gap: 6, paddingBottom: 12 },
  navItem: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "#20291A",
    borderColor: "#384528",
  },
  navItemPressed: { opacity: 0.75 },
  navIconBox: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "#1A2022",
    alignItems: "center",
    justifyContent: "center",
  },
  navIconBoxActive: { backgroundColor: C.lime },
  navIcon: {
    color: C.muted,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  navIconActive: { color: C.background },
  navLabel: {
    flex: 1,
    color: "#B0B8BA",
    fontSize: 13,
    fontWeight: "600",
  },
  navLabelActive: { color: C.lime, fontWeight: "800" },
  activeIndicator: {
    width: 4,
    height: 23,
    borderRadius: 3,
    backgroundColor: C.lime,
    position: "absolute",
    right: -1,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 17,
    marginTop: 10,
  },
  helpCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 13,
    marginBottom: 14,
  },
  helpTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  helpText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#482C2C",
    backgroundColor: "#211718",
  },
  signOutIcon: { color: C.red, fontSize: 20, fontWeight: "800" },
  signOutText: { color: C.red, fontSize: 13, fontWeight: "800" },
  versionText: {
    color: "#606B6D",
    fontSize: 8,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 13,
  },
  main: { flex: 1, minWidth: 0, minHeight: 0, backgroundColor: C.background },
  topbar: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "#0E1314",
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: { color: C.lime, fontSize: 21, fontWeight: "800" },
  topbarTitleWrap: { flex: 1 },
  topbarEyebrow: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  topbarTitle: { color: C.white, fontSize: 19, fontWeight: "900" },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  secureBadgeText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  pageArea: { flex: 1, minHeight: 0 },
  mobileOverlay: { flex: 1, flexDirection: "row" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  mobileDrawer: {
    width: 286,
    maxWidth: "88%",
    height: "100%",
    backgroundColor: C.panel,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  mobileDrawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: C.panel,
  },
  mobileDrawerHeading: { color: C.white, fontSize: 16, fontWeight: "800" },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { color: C.white, fontSize: 25, lineHeight: 28 },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
  },
  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#2B1B1C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmIconText: { color: C.red, fontSize: 27, fontWeight: "800" },
  confirmTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 9,
  },
  confirmDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  confirmSignOut: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#A83D42",
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmSignOutText: { color: C.white, fontSize: 14, fontWeight: "900" },
  cancelSignOut: { paddingVertical: 14, alignItems: "center" },
  cancelSignOutText: { color: C.muted, fontSize: 13, fontWeight: "700" },
});
