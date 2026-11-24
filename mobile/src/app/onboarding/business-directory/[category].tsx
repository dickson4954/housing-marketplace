import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  Home,
  Store,
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

type BusinessOption = {
  label: string;
  category: BusinessCategory;
};

type CategoryConfig = {
  title: string;
  description: string;
  groups: {
    title: string;
    items: BusinessOption[];
  }[];
};

const CATEGORY_CONFIG: Record<BusinessCategory, CategoryConfig> = {
  SHOPPING: {
    title: 'Shopping & Retail',
    description: 'Choose the type of shop or retail business you operate.',
    groups: [
      {
        title: 'Grocery & Market Shops',
        items: [
          { label: 'Grocery shop', category: 'SHOPPING' },
          { label: 'Fresh vegetables & fruits', category: 'SHOPPING' },
          { label: 'Market trader / market stall', category: 'SHOPPING' },
          { label: 'Cereals & grains shop', category: 'SHOPPING' },
          { label: 'Butchery', category: 'SHOPPING' },
          { label: 'Fish shop', category: 'SHOPPING' },
          { label: 'Milk & dairy shop', category: 'SHOPPING' },
          { label: 'Foodstuff wholesaler', category: 'SHOPPING' },
        ],
      },
      {
        title: 'Supermarkets & General Shops',
        items: [
          { label: 'Supermarket', category: 'SHOPPING' },
          { label: 'Mini supermarket', category: 'SHOPPING' },
          { label: 'Mini-mart', category: 'SHOPPING' },
          { label: 'Convenience store', category: 'SHOPPING' },
          { label: 'General shop / duka', category: 'SHOPPING' },
          { label: 'Wholesale shop', category: 'SHOPPING' },
        ],
      },
      {
        title: 'Hardware & Building Materials',
        items: [
          { label: 'Hardware shop', category: 'SHOPPING' },
          { label: 'Building materials shop', category: 'SHOPPING' },
          { label: 'Paint shop', category: 'SHOPPING' },
          { label: 'Plumbing supplies', category: 'SHOPPING' },
          { label: 'Timber yard', category: 'SHOPPING' },
          { label: 'Roofing materials', category: 'SHOPPING' },
          { label: 'Tools & equipment shop', category: 'SHOPPING' },
        ],
      },
      {
        title: 'Electrical & Electronics',
        items: [
          { label: 'Electrical supplies shop', category: 'SHOPPING' },
          { label: 'Electronics shop', category: 'SHOPPING' },
          { label: 'Phones & accessories shop', category: 'SHOPPING' },
          { label: 'Computer shop', category: 'SHOPPING' },
          { label: 'Solar equipment shop', category: 'SHOPPING' },
          { label: 'Electrical appliances shop', category: 'SHOPPING' },
        ],
      },
      {
        title: 'Fashion, Beauty & Accessories',
        items: [
          { label: 'Clothing shop / boutique', category: 'SHOPPING' },
          { label: 'Shoes & footwear shop', category: 'SHOPPING' },
          { label: 'Cosmetics & beauty products', category: 'SHOPPING' },
          { label: 'Jewellery & accessories', category: 'SHOPPING' },
          { label: 'Bags & leather goods', category: 'SHOPPING' },
        ],
      },
      {
        title: 'Drinks & Specialist Retail',
        items: [
          { label: 'Wines & spirits shop', category: 'SHOPPING' },
          { label: 'Soft drinks & beverages shop', category: 'SHOPPING' },
          { label: 'Furniture shop', category: 'SHOPPING' },
          { label: 'Household goods shop', category: 'SHOPPING' },
          { label: 'Agrovet', category: 'SHOPPING' },
          { label: 'Stationery & bookshop', category: 'SHOPPING' },
          { label: 'Chemist / pharmacy', category: 'SHOPPING' },
          { label: 'Motor vehicle parts shop', category: 'SHOPPING' },
        ],
      },
    ],
  },
  FOOD_HOSPITALITY: {
    title: 'Food & Hospitality',
    description: 'Choose the type of food, accommodation or hospitality business.',
    groups: [
      {
        title: 'Food & Dining',
        items: [
          { label: 'Restaurant', category: 'FOOD_HOSPITALITY' },
          { label: 'Café / coffee shop', category: 'FOOD_HOSPITALITY' },
          { label: 'Fast food outlet', category: 'FOOD_HOSPITALITY' },
          { label: 'Bakery', category: 'FOOD_HOSPITALITY' },
          { label: 'Catering business', category: 'FOOD_HOSPITALITY' },
          { label: 'Food truck / street food', category: 'FOOD_HOSPITALITY' },
          { label: 'Bar / pub', category: 'FOOD_HOSPITALITY' },
        ],
      },
      {
        title: 'Accommodation',
        items: [
          { label: 'Hotel', category: 'FOOD_HOSPITALITY' },
          { label: 'Lodge / guest house', category: 'FOOD_HOSPITALITY' },
        ],
      },
    ],
  },
  SERVICES: {
    title: 'Services & Professionals',
    description: 'Choose the service or professional activity closest to your business.',
    groups: [
      {
        title: 'Personal Care & Lifestyle',
        items: [
          { label: 'Salon / hairdresser', category: 'SERVICES' },
          { label: 'Barbershop', category: 'SERVICES' },
          { label: 'Beauty spa', category: 'SERVICES' },
          { label: 'Laundry / dry cleaning', category: 'SERVICES' },
        ],
      },
      {
        title: 'Technical & Professional Services',
        items: [
          { label: 'Cyber café', category: 'SERVICES' },
          { label: 'Phone & electronics repair', category: 'SERVICES' },
          { label: 'Vehicle repair / garage', category: 'SERVICES' },
          { label: 'Cleaning services', category: 'SERVICES' },
          { label: 'Professional services', category: 'SERVICES' },
          { label: 'Other service business', category: 'SERVICES' },
        ],
      },
    ],
  },
  MOBILITY_DELIVERY: {
    title: 'Mobility & Delivery',
    description: 'Choose the transport, courier or logistics activity you provide.',
    groups: [
      {
        title: 'Transport & Logistics',
        items: [
          { label: 'Courier business', category: 'MOBILITY_DELIVERY' },
          { label: 'Parcel delivery', category: 'MOBILITY_DELIVERY' },
          { label: 'Passenger transport', category: 'MOBILITY_DELIVERY' },
          { label: 'Logistics business', category: 'MOBILITY_DELIVERY' },
          { label: 'Goods delivery business', category: 'MOBILITY_DELIVERY' },
          { label: 'Moving & relocation services', category: 'MOBILITY_DELIVERY' },
        ],
      },
    ],
  },
  OTHER: {
    title: 'Other Businesses',
    description: 'Use this option if your business does not fit another division.',
    groups: [
      {
        title: 'Other',
        items: [
          { label: 'Other business', category: 'OTHER' },
        ],
      },
    ],
  },
};

const CATEGORY_IDS: BusinessCategory[] = [
  'SHOPPING',
  'FOOD_HOSPITALITY',
  'SERVICES',
  'MOBILITY_DELIVERY',
  'OTHER',
];

export default function BusinessCategoryScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const categoryId = params.category || '';

  if (categoryId === 'REAL_ESTATE') {
    return <RealEstateOptions />;
  }

  if (!CATEGORY_IDS.includes(categoryId as BusinessCategory)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.invalid}>
          <Text style={styles.invalidTitle}>Category not found</Text>
          <Text style={styles.description}>
            Please return to the business directory and select a valid category.
          </Text>
          <Pressable
            onPress={() => router.replace('/onboarding/business-directory' as never)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Back to directory</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const category = categoryId as BusinessCategory;
  const config = CATEGORY_CONFIG[category];

  const continueToRegistration = (item: BusinessOption) => {
    router.push({
      pathname: '/business/register',
      params: {
        category: item.category,
        specificBusinessType: item.label,
      },
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
            <Text style={styles.headerTitle}>BUSINESS TYPES</Text>
            <View style={styles.headerIcon}>
              <Store size={18} color={C.lime} />
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>SELECT YOUR BUSINESS TYPE</Text>
            <Text style={styles.title}>
              {config.title}
            </Text>
            <Text style={styles.description}>{config.description}</Text>
          </View>

          {config.groups.map(group => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.options}>
                {group.items.map(item => (
                  <Pressable
                    key={item.label}
                    onPress={() => continueToRegistration(item)}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.optionIcon}>
                      <Store size={16} color={C.lime} />
                    </View>
                    <Text style={styles.optionText}>{item.label}</Text>
                    <ChevronRight size={18} color={C.lime} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.footerNote}>
            Next, provide your owner and business details. Shop setup and
            operational configuration happen later inside your approved
            business workspace.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RealEstateOptions() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={19} color={C.white} />
            </Pressable>
            <Text style={styles.headerTitle}>REAL ESTATE</Text>
            <View style={styles.headerIcon}>
              <Building2 size={18} color={C.lime} />
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>PROPERTY MARKETPLACE</Text>
            <Text style={styles.title}>How do you participate?</Text>
            <Text style={styles.description}>
              Choose the property pathway that matches your role. These
              applications remain separate from general business registration.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/landlord' as never)}
            style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}
          >
            <View style={styles.roleIcon}>
              <Building2 size={23} color={C.lime} />
            </View>
            <View style={styles.roleCopy}>
              <Text style={styles.roleTitle}>Landlord</Text>
              <Text style={styles.roleDescription}>
                Register and manage rental properties and short stays.
              </Text>
            </View>
            <ChevronRight size={19} color={C.lime} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/marketer' as never)}
            style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}
          >
            <View style={styles.roleIcon}>
              <Home size={23} color={C.lime} />
            </View>
            <View style={styles.roleCopy}>
              <Text style={styles.roleTitle}>Property Marketer</Text>
              <Text style={styles.roleDescription}>
                Apply to market properties on behalf of property owners.
              </Text>
            </View>
            <ChevronRight size={19} color={C.lime} />
          </Pressable>
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
  headerTitle: {
    color: C.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
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
  hero: { marginTop: 35, marginBottom: 23 },
  eyebrow: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    color: C.white,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 13,
  },
  description: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
  },
  group: { marginBottom: 19 },
  groupTitle: {
    color: '#879293',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 9,
    textTransform: 'uppercase',
  },
  options: { gap: 8 },
  option: {
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  footerNote: {
    color: '#7E898A',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
    marginBottom: 15,
  },
  roleCard: {
    minHeight: 100,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 11,
  },
  roleIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCopy: { flex: 1 },
  roleTitle: { color: C.white, fontSize: 14, fontWeight: '900' },
  roleDescription: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  invalid: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  invalidTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 50,
    backgroundColor: C.lime,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#101410', fontWeight: '900' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
