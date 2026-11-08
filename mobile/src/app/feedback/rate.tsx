import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  Star,
} from 'lucide-react-native';

import { useFeedback } from '@/context/FeedbackContext';
import { useViewing } from '@/context/ViewingContext';
import { useProperties } from '@/context/PropertyContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
};

const RATING_LABELS: Record<number, string> = {
  1: 'Very poor',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export default function RateViewingScreen() {
  const {
    viewingId,
    propertyId,
    propertyTitle,
  } = useLocalSearchParams<{
    viewingId?: string;
    propertyId?: string;
    propertyTitle?: string;
  }>();

  const { addRating, hasRatingForViewing } = useFeedback();
  const { getViewingRequestById } = useViewing();
  const { getPropertyById } = useProperties();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const viewing = useMemo(() => {
    if (!viewingId) {
      return undefined;
    }

    return getViewingRequestById(viewingId);
  }, [viewingId, getViewingRequestById]);

  const property = useMemo(() => {
    const id = propertyId || viewing?.propertyId;

    if (!id) {
      return undefined;
    }

    return getPropertyById(id);
  }, [propertyId, viewing?.propertyId, getPropertyById]);

  const resolvedPropertyId =
    propertyId || viewing?.propertyId || '';

  /*
   * viewing.property may be either:
   * - a string
   * - a Property object
   *
   * We always convert it into a title string before
   * passing it to FeedbackContext or rendering it.
   */
  const resolvedPropertyTitle = useMemo(() => {
    if (propertyTitle) {
      return propertyTitle;
    }

    if (property?.title) {
      return property.title;
    }

    if (viewing?.property) {
      if (typeof viewing.property === 'string') {
        return viewing.property;
      }

      if (
        typeof viewing.property === 'object' &&
        'title' in viewing.property &&
        typeof viewing.property.title === 'string'
      ) {
        return viewing.property.title;
      }
    }

    return 'Property viewing';
  }, [
    propertyTitle,
    property?.title,
    viewing?.property,
  ]);

  const alreadyRated = viewingId
    ? hasRatingForViewing(viewingId)
    : false;

  const customerName = viewing?.name || '';
  const customerPhone = viewing?.phone || '';

  const ratingLabel =
    stars > 0 ? RATING_LABELS[stars] : 'Tap a star to rate';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/visits');
    }
  };

  const handleSubmit = async () => {
    if (alreadyRated) {
      Alert.alert(
        'Already rated',
        'You have already submitted a rating for this viewing.',
      );
      return;
    }

    if (!resolvedPropertyId) {
      Alert.alert(
        'Property not found',
        'We could not identify the property for this viewing.',
      );
      return;
    }

    if (!viewingId) {
      Alert.alert(
        'Viewing required',
        'Please open feedback from one of your viewing records.',
      );
      return;
    }

    if (stars < 1) {
      Alert.alert(
        'Choose a rating',
        'Please select between 1 and 5 stars.',
      );
      return;
    }

    if (!customerName.trim()) {
      Alert.alert(
        'Customer information missing',
        'We could not find the name attached to this viewing.',
      );
      return;
    }

    setSubmitting(true);

    try {
      await addRating({
        propertyId: resolvedPropertyId,
        propertyTitle: resolvedPropertyTitle,
        viewingId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        stars,
        comment: comment.trim() || undefined,
      });

      Alert.alert(
        'Thank you!',
        'Your rating has been submitted successfully.',
        [
          {
            text: 'Done',
            onPress: () => router.replace('/visits'),
          },
        ],
      );
    } catch {
      Alert.alert(
        'Something went wrong',
        'We could not submit your rating. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
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
            <ArrowLeft
              size={21}
              color={COLORS.white}
              strokeWidth={2.2}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MAKAZII</Text>
            <Text style={styles.title}>Rate your viewing</Text>
          </View>
        </View>

        {/* Property */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyIcon}>
            <CheckCircle2
              size={22}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyLabel}>
              VIEWING PROPERTY
            </Text>

            <Text
              style={styles.propertyTitle}
              numberOfLines={2}
            >
              {resolvedPropertyTitle}
            </Text>

            {viewingId ? (
              <Text style={styles.reference}>
                Viewing: {viewingId}
              </Text>
            ) : null}
          </View>
        </View>

        {alreadyRated ? (
          <View style={styles.alreadyRatedCard}>
            <CheckCircle2
              size={24}
              color={COLORS.lime}
              strokeWidth={2}
            />

            <View style={styles.alreadyRatedContent}>
              <Text style={styles.alreadyRatedTitle}>
                Rating already submitted
              </Text>

              <Text style={styles.alreadyRatedText}>
                Thank you. You have already rated this viewing.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Rating */}
            <View style={styles.ratingCard}>
              <Text style={styles.ratingQuestion}>
                How was your viewing?
              </Text>

              <Text style={styles.ratingHint}>
                Your honest feedback helps us improve MAKAZII.
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const selected = star <= stars;

                  return (
                    <Pressable
                      key={star}
                      onPress={() => setStars(star)}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${star} out of 5 stars`}
                      style={({ pressed }) => [
                        styles.starButton,
                        pressed && styles.starPressed,
                      ]}
                    >
                      <Star
                        size={42}
                        color={
                          selected
                            ? COLORS.lime
                            : COLORS.muted
                        }
                        fill={
                          selected
                            ? COLORS.lime
                            : 'transparent'
                        }
                        strokeWidth={1.7}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.ratingLabel}>
                {ratingLabel}
              </Text>
            </View>

            {/* Comment */}
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>
                Tell us more
                <Text style={styles.optional}>
                  {'  '}Optional
                </Text>
              </Text>

              <Text style={styles.sectionDescription}>
                What did you like about the viewing? Was there
                anything we could improve?
              </Text>

              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Write your feedback..."
                placeholderTextColor="#687174"
                multiline
                maxLength={500}
                textAlignVertical="top"
                style={styles.textInput}
              />

              <Text style={styles.characterCount}>
                {comment.length}/500
              </Text>
            </View>

            {/* Customer information */}
            <View style={styles.customerCard}>
              <Text style={styles.customerTitle}>
                Submitted with your viewing details
              </Text>

              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>
                  Name
                </Text>

                <Text style={styles.customerValue}>
                  {customerName || 'Not available'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>
                  Phone
                </Text>

                <Text style={styles.customerValue}>
                  {customerPhone || 'Not available'}
                </Text>
              </View>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed &&
                  !submitting &&
                  styles.submitPressed,
                submitting && styles.submitDisabled,
              ]}
            >
              <Star
                size={20}
                color={COLORS.background}
                fill={COLORS.background}
                strokeWidth={2}
              />

              <Text style={styles.submitText}>
                {submitting
                  ? 'Submitting...'
                  : 'Submit rating'}
              </Text>
            </Pressable>

            <Text style={styles.privacyText}>
              Your feedback is shared with the MAKAZII team to
              improve the service.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
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

  pressed: {
    opacity: 0.7,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 3,
  },

  title: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },

  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(215,255,95,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
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
    lineHeight: 20,
    fontWeight: '700',
  },

  reference: {
    color: COLORS.muted,
    fontSize: 10.5,
    marginTop: 4,
  },

  alreadyRatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(215,255,95,0.25)',
    padding: 18,
    marginTop: 4,
  },

  alreadyRatedContent: {
    flex: 1,
    marginLeft: 13,
  },

  alreadyRatedTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  alreadyRatedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  ratingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
  },

  ratingQuestion: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },

  ratingHint: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 23,
    gap: 7,
  },

  starButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  starPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.75,
  },

  ratingLabel: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 13,
  },

  commentSection: {
    marginTop: 24,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  optional: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
  },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 11,
  },

  textInput: {
    minHeight: 145,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 14,
  },

  characterCount: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
  },

  customerCard: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 22,
  },

  customerTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },

  customerLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },

  customerValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  submitButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    gap: 9,
  },

  submitPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  submitDisabled: {
    opacity: 0.55,
  },

  submitText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '800',
  },

  privacyText: {
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 11,
    paddingHorizontal: 20,
  },
});