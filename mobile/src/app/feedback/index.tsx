import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  MessageCircleWarning,
  Star,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react-native';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF7A7A',
};

export default function FeedbackHomeScreen() {
  const {
    viewingId,
    propertyId,
    propertyTitle,
  } = useLocalSearchParams<{
    viewingId?: string;
    propertyId?: string;
    propertyTitle?: string;
  }>();

  const goToRate = () => {
    router.push({
      pathname: '../feedback/rate',
      params: {
        viewingId: viewingId || '',
        propertyId: propertyId || '',
        propertyTitle: propertyTitle || '',
      },
    });
  };

  const goToConcern = () => {
    router.push({
      pathname: '../feedback/concern',
      params: {
        viewingId: viewingId || '',
        propertyId: propertyId || '',
        propertyTitle: propertyTitle || '',
      },
    });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/visits');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={21} color={COLORS.white} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MAKAZII</Text>
            <Text style={styles.title}>Your feedback matters</Text>
          </View>
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <MessageCircleWarning
              size={25}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.introContent}>
            <Text style={styles.introTitle}>
              Help us improve your experience
            </Text>

            <Text style={styles.introText}>
              Tell us how your viewing went or let us know if something needs
              our attention. Your feedback goes directly to the MAKAZII team.
            </Text>
          </View>
        </View>

        {/* Property being reviewed */}
        {propertyTitle ? (
          <View style={styles.propertyCard}>
            <View style={styles.propertyDot} />

            <View style={styles.propertyInfo}>
              <Text style={styles.propertyLabel}>VIEWING PROPERTY</Text>

              <Text
                style={styles.propertyTitle}
                numberOfLines={2}
              >
                {propertyTitle}
              </Text>

              {viewingId ? (
                <Text style={styles.viewingId}>
                  Viewing reference: {viewingId}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Feedback options */}
        <Text style={styles.sectionTitle}>How would you like to respond?</Text>

        <View style={styles.options}>
          {/* Rating */}
          <Pressable
            onPress={goToRate}
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.pressedCard,
            ]}
          >
            <View style={[styles.optionIcon, styles.ratingIcon]}>
              <Star
                size={25}
                color={COLORS.lime}
                fill={COLORS.lime}
                strokeWidth={1.8}
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Rate your viewing</Text>

              <Text style={styles.optionDescription}>
                Share your experience by giving the viewing a rating and,
                optionally, leaving a comment.
              </Text>
            </View>

            <ChevronRight
              size={21}
              color={COLORS.muted}
              strokeWidth={2}
            />
          </Pressable>

          {/* Concern */}
          <Pressable
            onPress={goToConcern}
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.pressedCard,
            ]}
          >
            <View style={[styles.optionIcon, styles.concernIcon]}>
              <MessageCircleWarning
                size={25}
                color={COLORS.danger}
                strokeWidth={1.9}
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Report a concern</Text>

              <Text style={styles.optionDescription}>
                Tell MAKAZII about an issue with the property, viewing,
                information, safety, or representative.
              </Text>
            </View>

            <ChevronRight
              size={21}
              color={COLORS.muted}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* Trust section */}
        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <ShieldCheck
              size={23}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>
              Your feedback is sent to MAKAZII
            </Text>

            <Text style={styles.trustText}>
              Concerns are reviewed by the MAKAZII management team. We use
              customer feedback to improve property information, viewing
              experiences, and service quality.
            </Text>
          </View>
        </View>

        {/* Helpful note */}
        <View style={styles.note}>
          <ThumbsUp
            size={18}
            color={COLORS.muted}
            strokeWidth={1.9}
          />

          <Text style={styles.noteText}>
            You can submit a rating, report a concern, or do both.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 4,
  },

  title: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  introCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    marginBottom: 14,
  },

  introIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(215,255,95,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },

  introText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 28,
  },

  propertyDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.lime,
    marginRight: 12,
  },

  propertyInfo: {
    flex: 1,
  },

  propertyLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },

  viewingId: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  options: {
    gap: 12,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 112,
  },

  pressedCard: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  ratingIcon: {
    backgroundColor: 'rgba(215,255,95,0.10)',
  },

  concernIcon: {
    backgroundColor: 'rgba(255,122,122,0.10)',
  },

  optionContent: {
    flex: 1,
    paddingRight: 8,
  },

  optionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  optionDescription: {
    color: COLORS.muted,
    fontSize: 12.5,
    lineHeight: 19,
  },

  trustCard: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  trustIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: 'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  trustContent: {
    flex: 1,
  },

  trustTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  trustText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },

  noteText: {
    color: COLORS.muted,
    fontSize: 11.5,
    marginLeft: 7,
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.7,
  },
});