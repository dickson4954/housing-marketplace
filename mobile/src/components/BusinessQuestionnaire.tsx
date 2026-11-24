import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type BusinessCategory =
  | 'SHOPPING'
  | 'FOOD_HOSPITALITY'
  | 'SERVICES'
  | 'MOBILITY_DELIVERY'
  | 'OTHER';

export type BusinessQuestion = {
  key: string;
  label: string;
  placeholder: string;
  options?: string[];
  multiple?: boolean;
};

export const CATEGORY_QUESTIONS: Record<
  BusinessCategory,
  BusinessQuestion[]
> = {
  SHOPPING: [
    {
      key: 'businessType',
      label: 'What kind of seller are you?',
      placeholder: 'Select your seller type',
      options: ['Retail', 'Wholesale', 'Both retail and wholesale'],
    },
    {
      key: 'productCategories',
      label: 'What products do you sell?',
      placeholder: 'Describe your products, e.g. groceries, phones, clothing or hardware',
    },
    {
      key: 'salesChannels',
      label: 'Where do you currently sell?',
      placeholder: 'Select all applicable channels',
      multiple: true,
      options: ['Physical shop', 'Online store', 'Social media', 'Marketplace platforms', 'Other'],
    },
    {
      key: 'branchCount',
      label: 'How many business locations do you operate?',
      placeholder: 'Select number of locations',
      options: ['1', '2–5', '6–10', 'More than 10'],
    },
    {
      key: 'inventoryManagement',
      label: 'How do you manage your stock?',
      placeholder: 'Select your stock management method',
      options: ['Manual records', 'POS system', 'Inventory software', 'Not currently tracked'],
    },
  ],

  FOOD_HOSPITALITY: [
    {
      key: 'outletType',
      label: 'What type of food business do you operate?',
      placeholder: 'Select all applicable outlet types',
      multiple: true,
      options: ['Restaurant', 'Café', 'Hotel', 'Bakery', 'Catering', 'Food truck or street food', 'Other'],
    },
    {
      key: 'cuisine',
      label: 'What food or cuisine do you offer?',
      placeholder: 'Describe your menu, cuisine or speciality',
    },
    {
      key: 'serviceModes',
      label: 'How do customers receive your food?',
      placeholder: 'Select all applicable service modes',
      multiple: true,
      options: ['Dine-in', 'Takeaway', 'Delivery', 'Drive-through', 'Catering'],
    },
    {
      key: 'deliveryAvailability',
      label: 'Do you offer delivery?',
      placeholder: 'Select delivery arrangement',
      options: ['In-house delivery', 'Third-party delivery', 'Both', 'No delivery'],
    },
    {
      key: 'branchCount',
      label: 'How many outlets do you operate?',
      placeholder: 'Select number of outlets',
      options: ['1', '2–5', '6–10', 'More than 10'],
    },
  ],

  SERVICES: [
    {
      key: 'serviceTypes',
      label: 'What services do you provide?',
      placeholder: 'Describe your services, e.g. hair styling, barbering, branding or repairs',
    },
    {
      key: 'serviceDelivery',
      label: 'Where do you serve your customers?',
      placeholder: 'Select all applicable service locations',
      multiple: true,
      options: ['At my business premises', 'At customer locations', 'Online or remotely', 'Both physical and online'],
    },
    {
      key: 'appointmentBased',
      label: 'Do customers need appointments?',
      placeholder: 'Select appointment arrangement',
      options: ['Yes, appointments required', 'Walk-ins accepted', 'Both appointments and walk-ins'],
    },
    {
      key: 'teamSize',
      label: 'How many people provide the service?',
      placeholder: 'Select team size',
      options: ['Just me', '2–5', '6–10', '11–20', 'More than 20'],
    },
    {
      key: 'serviceAreas',
      label: 'Which areas do you serve?',
      placeholder: 'Enter towns, counties or regions you serve',
    },
  ],

  MOBILITY_DELIVERY: [
    {
      key: 'serviceTypes',
      label: 'What mobility or delivery services do you provide?',
      placeholder: 'Describe your services, e.g. parcel delivery, courier or passenger transport',
    },
    {
      key: 'deliveryTypes',
      label: 'What do you transport?',
      placeholder: 'Select all applicable transport categories',
      multiple: true,
      options: ['Food', 'Parcels and documents', 'Groceries', 'Passengers', 'Furniture and bulky goods', 'Other'],
    },
    {
      key: 'coverageAreas',
      label: 'Which areas do you cover?',
      placeholder: 'Describe your operating locations and coverage',
    },
    {
      key: 'fleetSize',
      label: 'How many vehicles or riders do you operate?',
      placeholder: 'Select fleet or rider size',
      options: ['1', '2–5', '6–10', '11–20', 'More than 20'],
    },
    {
      key: 'fulfilmentModel',
      label: 'How do you manage deliveries?',
      placeholder: 'Select your fulfilment model',
      options: ['Our own riders or drivers', 'Independent riders or drivers', 'Third-party partners', 'Combination of these'],
    },
  ],

  OTHER: [
    {
      key: 'industry',
      label: 'Which industry is your business closest to?',
      placeholder: 'Describe your industry or business category',
    },
    {
      key: 'activityType',
      label: 'What does your business offer?',
      placeholder: 'Select your main activity',
      options: ['Products', 'Services', 'Both products and services'],
    },
    {
      key: 'customerType',
      label: 'Who are your main customers?',
      placeholder: 'Select all applicable customer groups',
      multiple: true,
      options: ['Individuals', 'Families', 'Small businesses', 'Large companies', 'Government and institutions', 'Other'],
    },
    {
      key: 'operatingArea',
      label: 'Where do you operate?',
      placeholder: 'Enter towns, counties or regions where you operate',
    },
  ],
};

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSelected: '#202A18',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
};

type Props = {
  category: BusinessCategory;
  answers: Record<string, string>;
  onAnswerChange: (key: string, value: string) => void;
};

export default function BusinessQuestionnaire({
  category,
  answers,
  onAnswerChange,
}: Props) {
  const questions = CATEGORY_QUESTIONS[category];

  const toggleOption = (
    question: BusinessQuestion,
    option: string,
  ) => {
    const current = (answers[question.key] || '')
      .split(' • ')
      .filter(Boolean);

    if (!question.multiple) {
      onAnswerChange(question.key, option);
      return;
    }

    const next = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];

    onAnswerChange(question.key, next.join(' • '));
  };

  return (
    <View>
      {questions.map((question, index) => {
        const selected = (answers[question.key] || '')
          .split(' • ')
          .filter(Boolean);

        return (
          <View key={question.key} style={styles.question}>
            <Text style={styles.questionNumber}>
              QUESTION {String(index + 1).padStart(2, '0')}
            </Text>

            <Text style={styles.label}>{question.label}</Text>

            {question.options ? (
              <>
                <Text style={styles.hint}>
                  {question.multiple
                    ? 'Choose all that apply.'
                    : 'Choose one option.'}
                </Text>

                <View style={styles.options}>
                  {question.options.map(option => {
                    const active = selected.includes(option);

                    return (
                      <Pressable
                        key={option}
                        onPress={() => toggleOption(question, option)}
                        accessibilityRole={
                          question.multiple ? 'checkbox' : 'radio'
                        }
                        accessibilityState={{ checked: active }}
                        style={[
                          styles.option,
                          active && styles.optionActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.indicator,
                            active && styles.indicatorActive,
                            !question.multiple && styles.radio,
                          ]}
                        >
                          {active ? (
                            <View
                              style={[
                                styles.indicatorInner,
                                !question.multiple && styles.radioInner,
                              ]}
                            />
                          ) : null}
                        </View>

                        <Text
                          style={[
                            styles.optionText,
                            active && styles.optionTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <TextInput
                value={answers[question.key] || ''}
                onChangeText={value =>
                  onAnswerChange(question.key, value)
                }
                placeholder={question.placeholder}
                placeholderTextColor={COLORS.muted}
                multiline
                textAlignVertical="top"
                maxLength={500}
                style={styles.input}
              />
            )}

            {question.options && (
              <Text style={styles.selectedHint}>
                {selected.length
                  ? `Selected: ${selected.join(', ')}`
                  : 'No option selected yet'}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  question: {
    marginBottom: 25,
  },
  questionNumber: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  label: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 5,
  },
  hint: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 11,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 43,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: COLORS.cardSelected,
    borderColor: COLORS.lime,
  },
  indicator: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorActive: {
    borderColor: COLORS.lime,
    backgroundColor: COLORS.lime,
  },
  indicatorInner: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: COLORS.background,
  },
  radio: {
    borderRadius: 20,
  },
  radioInner: {
    borderRadius: 20,
  },
  optionText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.lime,
    fontWeight: '800',
  },
  input: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    color: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 13,
    marginTop: 8,
  },
  selectedHint: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 8,
  },
});
