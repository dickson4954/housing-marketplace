
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  LogIn,
  UserPlus,
} from "lucide-react-native";

const STEPS = [
  {
    number: "01",
    title: "Apply",
    description: "Create your account and submit your landlord details and ID.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Review",
    description: "The Makazii team reviews your landlord application.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Get approved",
    description: "Once approved, access your portal and submit properties.",
    icon: CheckCircle2,
  },
];

export default function LandlordEntry() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.back,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={19} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Building2 size={23} color="#D7FF5F" />
          </View>
          <View>
            <Text style={styles.brand}>MAKAZII</Text>
            <Text style={styles.brandSubtitle}>PROPERTY PARTNER PORTAL</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
        <Text style={styles.title}>Your property.</Text>
        <Text style={styles.titleAccent}>Your opportunity.</Text>

        <Text style={styles.description}>
          Join Makazii to present your property to potential tenants. Apply
          for a landlord account or sign in to continue with an existing
          application.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/landlord/apply" as any)}
        >
          <View style={styles.primaryIcon}>
            <UserPlus size={23} color="#101410" />
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.primaryTitle}>Apply as a landlord</Text>
            <Text style={styles.primaryDescription}>
              New to Makazii? Create an account and submit your application.
            </Text>
            <Text style={styles.primaryAction}>
              START YOUR APPLICATION <ArrowRight size={14} color="#D7FF5F" />
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.loginCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/landlord/login" as any)}
        >
          <View style={styles.loginIcon}>
            <LogIn size={22} color="#D7FF5F" />
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.loginTitle}>Already a landlord?</Text>
            <Text style={styles.loginDescription}>
              Sign in to check your application, verification and property
              updates.
            </Text>
          </View>

          <ArrowRight size={20} color="#D7FF5F" />
        </Pressable>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
          <Text style={styles.sectionHint}>Three simple steps</Text>
        </View>

        <View style={styles.stepsCard}>
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;

            return (
              <View key={step.number}>
                <View style={styles.stepRow}>
                  <View style={styles.stepIcon}>
                    <StepIcon size={19} color="#D7FF5F" />
                  </View>

                  <View style={styles.stepBody}>
                    <Text style={styles.stepNumber}>
                      STEP {step.number}
                    </Text>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>
                  </View>
                </View>

                {index < STEPS.length - 1 ? (
                  <View style={styles.stepDivider} />
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.notice}>
          <Building2 size={19} color="#D7FF5F" />
          <Text style={styles.noticeText}>
            Landlord approval and property approval are separate. Every
            property must be reviewed by Makazii before it appears in the
            marketplace. ID verification may also be required.
          </Text>
        </View>

        <Text style={styles.footer}>
          A better way to connect properties with people.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B0F10",
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 24,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181E20",
    borderWidth: 1,
    borderColor: "#303A35",
  },
  brand: {
    color: "#D7FF5F",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 3,
  },
  brandSubtitle: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginTop: 4,
  },
  eyebrow: {
    color: "#9CA5A7",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 30,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  titleAccent: {
    color: "#D7FF5F",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 0,
  },
  description: {
    color: "#9CA5A7",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 25,
  },
  primaryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    padding: 17,
    borderRadius: 19,
    backgroundColor: "#181E20",
    borderWidth: 1,
    borderColor: "#D7FF5F",
    marginBottom: 12,
  },
  primaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#D7FF5F",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  primaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  primaryDescription: {
    color: "#AEB7B8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  primaryAction: {
    color: "#D7FF5F",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 13,
    flexDirection: "row",
  },
  loginCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
  },
  loginIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#202729",
    alignItems: "center",
    justifyContent: "center",
  },
  loginTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  loginDescription: {
    color: "#9CA5A7",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 29,
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  sectionHint: {
    color: "#778183",
    fontSize: 11,
  },
  stepsCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  stepIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#202729",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBody: {
    flex: 1,
    paddingTop: 1,
  },
  stepNumber: {
    color: "#D7FF5F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  stepTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  stepDescription: {
    color: "#9CA5A7",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  stepDivider: {
    height: 1,
    backgroundColor: "#252C2E",
    marginVertical: 15,
    marginLeft: 52,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#181E20",
    marginTop: 14,
  },
  noticeText: {
    color: "#C6CDCE",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    color: "#667173",
    fontSize: 11,
    textAlign: "center",
    marginTop: 22,
  },
  pressed: {
    opacity: 0.78,
  },
});