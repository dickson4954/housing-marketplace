import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Store } from 'lucide-react-native';

import {
  getPublicBusinessStorefront,
  resolveStorefrontAssetUrl,
  type PublicBusinessStorefront,
  type PublicStorefrontItem,
} from '@/lib/publicBusinessStorefrontApi';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
};

function money(item: PublicStorefrontItem) {
  if (item.priceAmount === null || item.priceAmount === undefined) {
    return 'Price on request';
  }

  const amount = Number(item.priceAmount);
  if (!Number.isFinite(amount)) return 'Price on request';

  return `${item.currency || 'KSh'} ${amount.toLocaleString('en-KE')}`;
}

export default function PublicBusinessStorefrontScreen() {
  const params = useLocalSearchParams<{ businessId: string | string[] }>();
  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const [record, setRecord] = useState<PublicBusinessStorefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    let active = true;

    async function load() {
      if (!businessId) {
        setError('This storefront could not be identified.');
        setLoading(false);
        return;
      }

      try {
        const result = await getPublicBusinessStorefront(businessId);
        if (active) setRecord(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load this storefront.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [businessId]);

  const snapshot = record?.storefront;
  const theme = snapshot?.storefront;
  const profile = snapshot?.profile;
  const catalogue = snapshot?.catalogue;

  const background = theme?.backgroundColor || C.background;
  const foreground = theme?.textColor || C.white;
  const primary = theme?.primaryColor || C.lime;
  const layoutKey = theme?.layoutKey ?? 'CLASSIC';

  const items = useMemo(() => {
    const all = catalogue?.items ?? [];
    if (selectedCategory === 'ALL') return all;
    return all.filter((item) => item.categoryId === selectedCategory);
  }, [catalogue?.items, selectedCategory]);

  const logoUrl = resolveStorefrontAssetUrl(theme?.logoUrl);
  const bannerUrl = resolveStorefrontAssetUrl(theme?.bannerUrl);
  const location = [
    profile?.ward,
    profile?.constituency,
    profile?.county,
  ].filter(Boolean).join(', ');

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: C.background }]}>
        <View style={styles.center}>
          <ActivityIndicator color={C.lime} size="large" />
          <Text style={styles.muted}>Loading storefront…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !snapshot || !theme) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorPage}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={19} color={C.white} />
          </Pressable>
          <Text style={styles.errorTitle}>Storefront unavailable</Text>
          <Text style={styles.muted}>
            {error || 'This business storefront is not currently available.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName =
    profile?.publicDisplayName ||
    snapshot.business.name;

  const featuredItem =
    layoutKey === 'FEATURED'
      ? items.find((item) => item.isFeatured) ?? items[0]
      : undefined;
  const remainingItems = featuredItem
    ? items.filter((item) => item.id !== featuredItem.id)
    : items;

  const renderProductCard = (
    item: PublicStorefrontItem,
    variant: 'classic' | 'grid' | 'featured',
  ) => {
    const imageUrl = resolveStorefrontAssetUrl(item.images?.[0]?.imageUrl);

    return (
      <View
        key={item.id}
        style={[
          styles.productCard,
          variant === 'classic' && styles.productCardClassic,
          variant === 'featured' && styles.productCardFeatured,
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.productImage,
              variant === 'classic' && styles.productImageClassic,
              variant === 'featured' && styles.productImageFeatured,
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.productImage,
              styles.productImageFallback,
              variant === 'classic' && styles.productImageClassic,
              variant === 'featured' && styles.productImageFeatured,
            ]}
          >
            <Store size={variant === 'featured' ? 36 : 27} color={primary} />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={[styles.productCategory, { color: primary }]}>
            {item.category?.name || 'CATALOGUE ITEM'}
          </Text>
          <Text
            style={[
              styles.productName,
              { color: foreground },
              variant === 'featured' && styles.featuredProductName,
            ]}
          >
            {item.name}
          </Text>
          {!!(item.shortDescription || item.description) && (
            <Text style={styles.productDescription} numberOfLines={3}>
              {item.shortDescription || item.description}
            </Text>
          )}
          <Text style={[styles.productPrice, { color: foreground }]}>
            {money(item)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={19} color={foreground} />
          </Pressable>
          <Text style={[styles.topBarLabel, { color: foreground }]}>
            MAKAZII STOREFRONT
          </Text>
        </View>

        <View style={styles.hero}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.banner} resizeMode="cover" />
          ) : (
            <View style={[styles.banner, { backgroundColor: theme.accentColor || C.cardSoft }]} />
          )}

          <View style={styles.identity}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Store size={25} color={primary} />
              </View>
            )}

            <View style={styles.identityText}>
              <Text style={[styles.businessName, { color: foreground }]}>
                {displayName}
              </Text>
              <Text style={[styles.categoryLabel, { color: primary }]}>
                {snapshot.business.categoryLabel || snapshot.business.category}
              </Text>
            </View>
          </View>

          {!!profile?.tagline && (
            <Text style={[styles.tagline, { color: foreground }]}>
              {profile.tagline}
            </Text>
          )}

          {!!(profile?.publicDescription || snapshot.business.description) && (
            <Text style={[styles.description, { color: foreground }]}>
              {profile?.publicDescription || snapshot.business.description}
            </Text>
          )}

          {!!location && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={primary} />
              <Text style={[styles.locationText, { color: foreground }]}>
                {location}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: primary }]}>BROWSE THE STORE</Text>
            <Text style={[styles.sectionTitle, { color: foreground }]}>
              Categories
            </Text>
          </View>
          <Text style={[styles.count, { color: foreground }]}>
            {catalogue?.categories.length ?? 0}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          <Pressable
            onPress={() => setSelectedCategory('ALL')}
            style={[
              styles.categoryChip,
              selectedCategory === 'ALL' && { borderColor: primary, backgroundColor: `${primary}18` },
            ]}
          >
            <Text style={[styles.categoryText, { color: foreground }]}>All items</Text>
          </Pressable>

          {(catalogue?.categories ?? []).map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && {
                  borderColor: primary,
                  backgroundColor: `${primary}18`,
                },
              ]}
            >
              <View style={styles.categoryChipContent}>
                {resolveStorefrontAssetUrl(category.imageUrl) ? (
                  <Image
                    source={{ uri: resolveStorefrontAssetUrl(category.imageUrl)! }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={[styles.categoryText, { color: foreground }]}>
                  {category.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: primary }]}>THE CATALOGUE</Text>
            <Text style={[styles.sectionTitle, { color: foreground }]}>
              Products & services
            </Text>
          </View>
          <Text style={[styles.count, { color: foreground }]}>
            {items.length}
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Store size={25} color={C.muted} />
            <Text style={[styles.emptyTitle, { color: foreground }]}>
              Nothing to display yet
            </Text>
            <Text style={styles.muted}>
              This catalogue does not have published items in this category.
            </Text>
          </View>
        ) : (
          <>
            {featuredItem && (
              <View style={styles.featuredSection}>
                {renderProductCard(featuredItem, 'featured')}
              </View>
            )}

            <View
              style={[
                styles.productGrid,
                layoutKey === 'CLASSIC' && styles.productList,
              ]}
            >
              {remainingItems.map((item) =>
                renderProductCard(
                  item,
                  layoutKey === 'CLASSIC' ? 'classic' : 'grid',
                ),
              )}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerBrand, { color: foreground }]}>{displayName}</Text>
          <Text style={styles.footerText}>DISCOVER • CONNECT • SHOP</Text>
          <Text style={styles.footerText}>POWERED BY MAKAZII</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 64,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: C.muted, fontSize: 12, lineHeight: 19, textAlign: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  hero: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    padding: 15,
    overflow: 'hidden',
  },
  banner: { width: '100%', height: 145, borderRadius: 14, backgroundColor: C.cardSoft },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 17,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 19,
    backgroundColor: C.cardSoft,
  },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  identityText: {
    flex: 1,
    gap: 3,
  },
  businessName: { fontSize: 20, fontWeight: '900' },
  categoryLabel: { fontSize: 10, fontWeight: '800', marginTop: 5 },
  tagline: { fontSize: 13, fontWeight: '700', marginTop: 15 },
  description: { fontSize: 12, lineHeight: 19, opacity: 0.8, marginTop: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  locationText: { fontSize: 11 },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 15,
  },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  sectionTitle: { fontSize: 19, fontWeight: '900', marginTop: 4 },
  count: { fontSize: 12, fontWeight: '800' },
  categoryList: {
    gap: 9,
    paddingBottom: 5,
    paddingRight: 4,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: C.card,
  },
  categoryChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  categoryImage: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: C.cardSoft,
  },
  categoryText: { fontSize: 11, fontWeight: '800' },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    justifyContent: 'space-between',
  },
  productList: { flexDirection: 'column' },
  productCard: {
    width: '48%',
    flexGrow: 0,
    flexBasis: '48%',
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  productCardClassic: {
    width: '100%',
    flexGrow: 0,
    flexBasis: '100%',
    flexDirection: 'row',
  },
  productCardFeatured: {
    width: '100%',
    flexGrow: 0,
    flexBasis: '100%',
    borderRadius: 23,
  },
  productImage: {
    width: '100%',
    height: 158,
    backgroundColor: C.cardSoft,
  },
  productImageClassic: {
    width: 124,
    height: 142,
  },
  productImageFeatured: {
    width: '100%',
    height: 235,
  },
  featuredSection: { marginBottom: 14 },
  featuredProductName: { fontSize: 19, lineHeight: 25 },
  productImageFallback: { alignItems: 'center', justifyContent: 'center' },
  productInfo: {
    padding: 14,
    gap: 2,
  },
  productCategory: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  productName: { fontSize: 13, lineHeight: 18, fontWeight: '900', marginTop: 6 },
  productDescription: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  productPrice: { fontSize: 12, fontWeight: '900', marginTop: 11 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    padding: 30,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    backgroundColor: C.card,
  },
  emptyTitle: { fontSize: 14, fontWeight: '900' },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 38,
    paddingTop: 23,
    gap: 3,
  },
  footerBrand: { fontSize: 12, fontWeight: '900' },
  footerText: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginTop: 6 },
  errorPage: { flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center', gap: 13 },
  errorTitle: { color: C.white, fontSize: 19, fontWeight: '900' },
});
