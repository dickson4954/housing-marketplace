import React, { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react-native";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

async function saveToken(token: string) {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export default function LandlordLogin() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setError("");

    if (!emailOrPhone.trim()) {
      setError("Enter the email address or phone number linked to your account.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/landlord/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          password,
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to sign in. Check your details and try again.");
      }

      const token = result?.data?.token;
      if (typeof token !== "string" || !token) {
        throw new Error("The server did not return an authentication token. Please contact support.");
      }

      await saveToken(token);

      // Check the backend application status before choosing the destination.
      try {
        const statusResponse = await fetch(
          `${API_BASE_URL}/auth/landlord/application-status`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const statusResult = await statusResponse.json().catch(() => null);

        if (
          statusResponse.ok &&
          statusResult?.success &&
          statusResult?.data &&
          String(statusResult.data.applicationStatus || "").toUpperCase() ===
            "APPROVED"
        ) {
          router.replace("/landlord/dashboard" as any);
        } else {
          router.replace("/landlord/application" as any);
        }
      } catch {
        // If status cannot be verified, never send the landlord to the dashboard.
        router.replace("/landlord/application" as any);
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Unable to connect to Makazii. Check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={19} color="#FFFFFF" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
          <Text style={styles.brand}>MAKAZII</Text>
          <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.description}>
            Sign in to track your application and manage your property submissions.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL OR PHONE NUMBER</Text>
            <View style={styles.inputWrap}>
              <UserRound size={18} color="#9CA5A7" />
              <TextInput
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                placeholder="Email address or phone"
                placeholderTextColor="#697274"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <LockKeyhole size={18} color="#9CA5A7" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#697274"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                {showPassword ? <EyeOff size={19} color="#9CA5A7" /> : <Eye size={19} color="#9CA5A7" />}
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [styles.primaryButton, (pressed || loading) && styles.dimmed]}
          >
            {loading ? <ActivityIndicator color="#101410" /> : <Text style={styles.primaryText}>Log in to Makazii</Text>}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Makazii?</Text>
            <Pressable onPress={() => router.push("/landlord/apply" as any)}>
              <Text style={styles.link}>Apply as a landlord</Text>
            </Pressable>
          </View>

          <Text style={styles.privacy}>
            Your application and identity verification are reviewed separately. Logging in does not mean your application is approved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B0F10" },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingTop: 18, paddingBottom: 36, justifyContent: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 30 },
  backText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  brandMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#D7FF5F", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brandMarkText: { color: "#101410", fontSize: 25, fontWeight: "900" },
  brand: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: 3 },
  eyebrow: { color: "#9CA5A7", fontSize: 11, fontWeight: "800", letterSpacing: 2, marginTop: 23 },
  title: { color: "#FFFFFF", fontSize: 31, fontWeight: "900", marginTop: 9 },
  description: { color: "#9CA5A7", fontSize: 14, lineHeight: 22, marginTop: 9, marginBottom: 29 },
  field: { marginBottom: 19 },
  label: { color: "#C6CDCE", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 9 },
  inputWrap: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: "#252C2E", backgroundColor: "#14191B" },
  input: { flex: 1, color: "#FFFFFF", fontSize: 14, paddingVertical: 13, outlineStyle: "none" as any },
  error: { color: "#FF8C8C", fontSize: 13, lineHeight: 19, marginBottom: 15 },
  primaryButton: { minHeight: 54, backgroundColor: "#D7FF5F", borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 5 },
  primaryText: { color: "#101410", fontSize: 15, fontWeight: "900" },
  dimmed: { opacity: 0.7 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 25 },
  footerText: { color: "#9CA5A7", fontSize: 13 },
  link: { color: "#D7FF5F", fontSize: 13, fontWeight: "800" },
  privacy: { color: "#778183", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 25 },
});
