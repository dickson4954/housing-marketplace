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
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ShieldAlert,
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
  danger: '#FF7A7A',
};

const CONCERN_CATEGORIES = [
  'Property information',
  'Pricing',
  'Property availability',
  'Property condition',
  'Viewing experience',
  'Safety concern',
  'Suspicious listing',
  'Marketer/representative',
  'Other',
] as const;

type ConcernCategory = (typeof CONCERN_CATEGORIES)[number];

export default function ReportConcernScreen() {
  const {
    viewingId,
    propertyId,
    propertyTitle,
  } = useLocalSearchParams<{
    viewingId?: string;
    propertyId?: string;
    propertyTitle?: string;
  }>();

  const { addConcern } = useFeedback();
  const { getViewingRequestById } = useViewing();
  const { getPropertyById } = useProperties();

  const [category, setCategory] = useState<ConcernCategory | ''>('');
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);
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

  const customerName = viewing?.name || '';
  const customerPhone = viewing?.phone || '';

  const handleSelectCategory = (
    selectedCategory: ConcernCategory,
  ) => {
    setCategory(selectedCategory);
    setShowCategories(false);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/visits');
    }
  };

  const handleSubmit = async () => {
    if (!resolvedPropertyId) {
      Alert.alert(
        'Property not found',
        'We could not identify the property connected to this concern.',
      );
      return;
    }

    if (!viewingId) {
      Alert.alert(
        'Viewing required',
        'Please report a concern from one of your viewing records.',
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

    if (!category) {
      Alert.alert(
        'Choose a category',
        'Please select the type of concern you want to report.',
      );
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert(
        'More information needed',
        'Please describe the concern using at least 10 characters.',
      );
      return;
    }

    setSubmitting(true);

    try {
      await addConcern({
        propertyId: resolvedPropertyId,
        propertyTitle: resolvedPropertyTitle,
        viewingId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        category,
        description: description.trim(),
      });

      Alert.alert(
        'Concern submitted',
        'Thank you for bringing this to our attention. The MAKAZII team will review your concern.',
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
        'We could not submit your concern. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
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
            <Text style={styles.title}>Report a concern</Text>
          </View>
        </View>

        {/* Warning / intro */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <ShieldAlert
              size={25}
              color={COLORS.danger}
              strokeWidth={2}
            />
          </View>

          <View style={styles.introContent}>
            <Text style={styles.introTitle}>
              Something doesn't look right?
            </Text>

            <Text style={styles.introText}>
              Tell us what happened. Your concern will be sent to
              the MAKAZII team for review.
            </Text>
          </View>
        </View>

        {/* Property */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyIcon}>
            <CheckCircle2
              size={21}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyLabel}>
              PROPERTY
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

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What is the concern about?
          </Text>

          <Text style={styles.sectionDescription}>
            Choose the category that best describes the issue.
          </Text>

          <Pressable
            onPress={() =>
              setShowCategories((current) => !current)
            }
            style={({ pressed }) => [
              styles.categorySelector,
              pressed && styles.pressedCard,
              showCategories && styles.categorySelectorOpen,
            ]}
          >
            <View style={styles.categorySelectorLeft}>
              <View style={styles.categoryIcon}>
                <AlertTriangle
                  size={19}
                  color={
                    category
                      ? COLORS.lime
                      : COLORS.muted
                  }
                  strokeWidth={2}
                />
              </View>

              <Text
                style={[
                  styles.categoryText,
                  !category && styles.categoryPlaceholder,
                ]}
              >
                {category || 'Select a category'}
              </Text>
            </View>

            <ChevronDown
              size={20}
              color={COLORS.muted}
              strokeWidth={2}
              style={
                showCategories
                  ? styles.chevronOpen
                  : undefined
              }
            />
          </Pressable>

          {showCategories ? (
            <View style={styles.categoryMenu}>
              {CONCERN_CATEGORIES.map((item, index) => {
                const selected = category === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      handleSelectCategory(item)
                    }
                    style={({ pressed }) => [
                      styles.categoryOption,
                      index !==
                        CONCERN_CATEGORIES.length - 1 &&
                        styles.categoryOptionBorder,
                      selected &&
                        styles.categoryOptionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionRadio,
                        selected &&
                          styles.optionRadioSelected,
                      ]}
                    >
                      {selected ? (
                        <View
                          style={styles.optionRadioDot}
                        />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.categoryOptionText,
                        selected &&
                          styles.categoryOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Describe the concern
          </Text>

          <Text style={styles.sectionDescription}>
            Give us enough detail so our team can understand and
            investigate the issue.
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what happened..."
            placeholderTextColor="#687174"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={styles.textInput}
          />

          <Text style={styles.characterCount}>
            {description.length}/1000
          </Text>
        </View>

        {/* Customer details */}
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
          <ShieldAlert
            size={20}
            color={COLORS.background}
            strokeWidth={2.2}
          />

          <Text style={styles.submitText}>
            {submitting
              ? 'Submitting...'
              : 'Submit concern'}
          </Text>
        </Pressable>

        {/* Privacy / reassurance */}
        <View style={styles.reassurance}>
          <ShieldAlert
            size={17}
            color={COLORS.muted}
            strokeWidth={1.8}
          />

          <Text style={styles.reassuranceText}>
            Your concern is sent to MAKAZII management. We will
            review the information and take appropriate action.
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

  pressedCard: {
    opacity: 0.78,
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

  introCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,122,122,0.18)',
    padding: 17,
    marginBottom: 14,
  },

  introIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,122,122,0.10)',
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 25,
  },

  propertyIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: 'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 20,
    fontWeight: '700',
  },

  reference: {
    color: COLORS.muted,
    fontSize: 10.5,
    marginTop: 4,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 11,
  },

  categorySelector: {
    minHeight: 58,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categorySelectorOpen: {
    borderColor: 'rgba(215,255,95,0.45)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  categorySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  categoryIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  categoryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  categoryPlaceholder: {
    color: COLORS.muted,
    fontWeight: '500',
  },

  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },

  categoryMenu: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(215,255,95,0.45)',
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    overflow: 'hidden',
  },

  categoryOption: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  categoryOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  categoryOptionSelected: {
    backgroundColor: 'rgba(215,255,95,0.06)',
  },

  optionPressed: {
    opacity: 0.7,
  },

  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  optionRadioSelected: {
    borderColor: COLORS.lime,
  },

  optionRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.lime,
  },

  categoryOptionText: {
    color: COLORS.muted,
    fontSize: 12.5,
    flex: 1,
  },

  categoryOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },

  textInput: {
    minHeight: 165,
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
    marginTop: 0,
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

  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 13,
    paddingHorizontal: 8,
  },

  reassuranceText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    marginLeft: 7,
  },
});