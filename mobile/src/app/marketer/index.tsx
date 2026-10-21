import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#63D391',
  greenSoft: '#14271D',
};

export default function MarketerEntryScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>MAKAZII</Text>
            <Text style={styles.portalLabel}>
              MARKETER PORTAL
            </Text>
          </View>

          <View style={styles.brandIcon}>
            <BriefcaseBusiness
              size={21}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>
            WORK WITH MAKAZII
          </Text>

          <Text style={styles.title}>
            Help people find their next home.
          </Text>

          <Text style={styles.subtitle}>
            Join the MAKAZII marketer network and help us
            discover, verify, and connect people with quality
            rental homes in your area.
          </Text>
        </View>

        {/* Existing marketer */}
        <Pressable
          onPress={() => router.push('/marketer/login')}
          style={({ pressed }) => [
            styles.primaryCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.cardIconPrimary}>
            <UserRound
              size={21}
              color={COLORS.background}
              strokeWidth={2.2}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardEyebrow}>
              ALREADY A MARKETER?
            </Text>

            <Text style={styles.cardTitle}>
              Sign in to your portal
            </Text>

            <Text style={styles.cardDescription}>
              Access your properties, viewings, verification,
              and marketer activities.
            </Text>
          </View>

          <View style={styles.arrowCirclePrimary}>
            <ArrowRight
              size={18}
              color={COLORS.background}
              strokeWidth={2.4}
            />
          </View>
        </Pressable>

        {/* New applicant */}
        <Pressable
          onPress={() => router.push('/marketer/apply')}
          style={({ pressed }) => [
            styles.secondaryCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.cardIconSecondary}>
            <BriefcaseBusiness
              size={21}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardEyebrow}>
              WANT TO WORK WITH MAKAZII?
            </Text>

            <Text style={styles.cardTitle}>
              Apply to become a marketer
            </Text>

            <Text style={styles.cardDescription}>
              Tell us about yourself, the areas you know,
              and how you can help MAKAZII grow.
            </Text>
          </View>

          <View style={styles.arrowCircleSecondary}>
            <ArrowRight
              size={18}
              color={COLORS.lime}
              strokeWidth={2.4}
            />
          </View>
        </Pressable>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            How it works
          </Text>

          <View style={styles.stepsCard}>
            <Step
              number="01"
              title="Apply"
              description="Submit your information and the areas you can cover."
            />

            <View style={styles.stepDivider} />

            <Step
              number="02"
              title="Review"
              description="The MAKAZII team reviews your application."
            />

            <View style={styles.stepDivider} />

            <Step
              number="03"
              title="Get approved"
              description="Once approved, your marketer portal is unlocked."
            />
          </View>
        </View>

        {/* Trust / review information */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <ShieldCheck
              size={19}
              color={COLORS.green}
              strokeWidth={2}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Applications are reviewed before access is granted
            </Text>

            <Text style={styles.infoText}>
              Most applications are reviewed within 2 business
              days. You will be able to check your application
              status after submitting.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerBrand}>
            MAKAZII
          </Text>

          <Text style={styles.footerText}>
            FIND YOUR PLACE
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>

      <CheckCircle2
        size={17}
        color={COLORS.lime}
        strokeWidth={1.8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 42,
  },

  brandBlock: {
    flex: 1,
  },

  brand: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  portalLabel: {
    marginTop: 4,
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  intro: {
    marginBottom: 28,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.7,
    marginBottom: 9,
  },

  title: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 11,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },

  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 21,
    backgroundColor: COLORS.lime,
    marginBottom: 12,
  },

  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  cardIconPrimary: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C2E94F',
    marginRight: 13,
  },

  cardIconSecondary: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202B11',
    marginRight: 13,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  cardEyebrow: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  cardTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  primaryCardText: {
    color: COLORS.background,
  },

  cardDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
  },

  arrowCirclePrimary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  arrowCircleSecondary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  section: {
    marginTop: 30,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  stepsCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 65,
  },

  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 11,
  },

  stepNumberText: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '800',
  },

  stepContent: {
    flex: 1,
    paddingRight: 8,
  },

  stepTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  stepDescription: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  stepDivider: {
    height: 1,
    marginLeft: 45,
    backgroundColor: COLORS.border,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 15,
    borderRadius: 19,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: '#244332',
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#193022',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: COLORS.white,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },

  infoText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 42,
    paddingBottom: 10,
  },

  footerLine: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.lime,
    marginBottom: 14,
  },

  footerBrand: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },

  footerText: {
    marginTop: 4,
    color: '#687174',
    fontSize: 9,
    letterSpacing: 1.4,
  },
});