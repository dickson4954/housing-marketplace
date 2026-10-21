import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const TOKEN_KEY = "makazii_landlord_token";

async function clearLandlordSession() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export default function LandlordAccount() {
  const handleLogout = () => {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out of your landlord account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            try {
              await clearLandlordSession();
            } catch (error) {
              console.error("LANDLORD LOGOUT ERROR:", error);
            } finally {
              router.replace("/" as any);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.brand}>MAKAZII</Text>
        <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
        <Text style={styles.heading}>My account</Text>
        <Text style={styles.description}>
          Manage your landlord portal session. You can sign out securely
          whenever you finish using MAKAZII.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account session</Text>
          <Text style={styles.cardDescription}>
            Signing out removes your saved landlord login session and returns
            you to the MAKAZII welcome screen.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/landlord/dashboard" as any)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back to landlord dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F10",
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 42,
  },
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
    letterSpacing: 2,
    marginTop: 36,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 10,
  },
  description: {
    color: "#9CA5A7",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#14191B",
    borderColor: "#252C2E",
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginTop: 30,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  cardDescription: {
    color: "#9CA5A7",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#211516",
    borderColor: "#713B3B",
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 22,
  },
  logoutText: {
    color: "#FF8A8A",
    fontSize: 15,
    fontWeight: "800",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 18,
  },
  backText: {
    color: "#D7FF5F",
    fontSize: 14,
    fontWeight: "700",
  },
});
