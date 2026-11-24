import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Truck,
  Utensils,
  Wrench,
} from 'lucide-react-native';

import type { BusinessCategory } from '@/components/BusinessQuestionnaire';

const C = {
  background: '#0B0F10',
  card: '#141A1C',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#293234',
};

type DirectoryCategory = {
  id: BusinessCategory | 'REAL_ESTATE';
  title: string;
  description: string;
  icon: 'shopping' | 'food' | 'services' | 'mobility' | 'other' | 'property';
  count: string;
};

const CATEGORIES: DirectoryCategory[] = [
  {
    id: 'SHOPPING',
    title: 'Shopping & Retail',
    description: 'Shops, supermarkets, products and specialist retail',
    icon: 'shopping',
    count: 'Retail and product businesses',
  },
  {
    id: 'FOOD_HOSPITALITY',
    title: 'Food & Hospitality',
    description: 'Restaurants, cafés, hotels, lodges and catering',
    icon: 'food',
    count: 'Food and accommodation',
  },
  {
    id: 'SERVICES',
    title: 'Services & Professionals',
    description: 'Beauty, repairs, personal and professional services',
    icon: 'services',
    count: 'Local and professional services',
  },
  {
    id: 'MOBILITY_DELIVERY',
    title: 'Mobility & Delivery',
    description: 'Transport, courier, logistics and delivery businesses',
    icon: 'mobility',
    count: 'Transport and logistics',
  },
  {
    id: 'OTHER',
    title: 'Other Businesses',
    description: 'A business or industry not listed in the divisions above',
    icon: 'other',
    count: 'Other business activities',
  },
  {
    id: 'REAL_ESTATE',
    title: 'Real Estate',
    description: 'Register as a landlord or apply as a property marketer',
    icon: 'property',
    count: 'Separate property registration paths',
  },
];

function CategoryIcon({ name }: { name: DirectoryCategory['icon'] }) {
  const props = { size: 22, color: C.lime, strokeWidth: 1.9 };

  switch (name) {
    case 'shopping':
      return <ShoppingBag {...props} />;
    case 'food':
      return <Utensils {...props} />;
    case 'services':
      return <Sparkles {...props} />;
    case 'mobility':
      return <Truck {...props} />;
    case 'other':
      return <Wrench {...props} />;
    case 'property':
      return <Building2 {...props} />;
  }
}

export default function BusinessDirectoryScreen() {
  const openCategory = (category: DirectoryCategory['id']) => {
    router.push({
      pathname: '/onboarding/business-directory/[category]',
      params: { category },
    } as never);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={19} color={C.white} />
            </Pressable>
            <View style={styles.brand}>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>BUSINESS DIRECTORY</Text>
            </View>
            <View style={styles.headerIcon}>
              <BriefcaseBusiness size={18} color={C.lime} />
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>YOUR BUSINESS JOURNEY STARTS HERE</Text>
            <Text style={styles.title}>
              Choose your
              {'\n'}
              <Text style={styles.accent}>business division.</Text>
            </Text>
            <Text style={styles.description}>
              Select the division that best matches your business. You will
              choose your specific business type on the next screen.
            </Text>
          </View>

          <View style={styles.categoryList}>
            {CATEGORIES.map((category, index) => (
              <Pressable
                key={category.id}
                onPress={() => openCategory(category.id)}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.categoryIcon}>
                  <CategoryIcon name={category.icon} />
                </View>

                <View style={styles.categoryCopy}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    {category.id === 'REAL_ESTATE' ? (
                      <View style={styles.separateBadge}>
                        <Text style={styles.separateBadgeText}>SEPARATE</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                  <Text style={styles.categoryCount}>{category.count}</Text>
                </View>

                <ChevronRight size={19} color={C.lime} />
              </Pressable>
            ))}
          </View>

          <View style={styles.note}>
            <Text style={styles.noteTitle}>One owner. Separate business reviews.</Text>
            <Text style={styles.noteText}>
              Each business application is assessed independently. Approval
              of an owner or another business does not automatically approve
              every business they register.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/business/login' as never)}
            style={styles.signIn}
          >
            <Text style={styles.signInText}>Already registered?</Text>
            <Text style={styles.signInLink}>Business sign in</Text>
            <ChevronRight size={16} color={C.lime} />
          </Pressable>

          <Text style={styles.footer}>MAKAZII · GROW WITH CONFIDENCE</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 9,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flex: 1, alignItems: 'center' },
  logo: {
    color: C.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2.8,
  },
  logoSub: {
    color: '#849091',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { marginTop: 36, marginBottom: 23 },
  eyebrow: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    color: C.white,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.3,
    marginTop: 13,
  },
  accent: { color: C.lime },
  description: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 11,
  },
  categoryList: { gap: 10 },
  categoryCard: {
    minHeight: 91,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCopy: { flex: 1 },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  categoryTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
  },
  categoryDescription: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  categoryCount: {
    color: '#7E898A',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 5,
  },
  separateBadge: {
    backgroundColor: '#252D20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  separateBadgeText: {
    color: C.lime,
    fontSize: 7,
    fontWeight: '900',
  },
  note: {
    marginTop: 19,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#121819',
    borderWidth: 1,
    borderColor: C.border,
  },
  noteTitle: { color: C.white, fontSize: 11, fontWeight: '900' },
  noteText: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  signIn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 17,
  },
  signInText: { color: C.muted, fontSize: 10 },
  signInLink: { color: C.lime, fontSize: 10, fontWeight: '900' },
  footer: {
    color: '#596365',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    textAlign: 'center',
    marginTop: 7,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
