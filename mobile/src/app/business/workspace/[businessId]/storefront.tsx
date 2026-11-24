import React, { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Eye,
  LayoutGrid,
  Monitor,
  Palette,
  Save,
  Sparkles,
  Store,
  Upload,
} from 'lucide-react-native';

import {
  getBusinessSetup,
  getBusinessStorefrontPreview,
  publishBusinessStorefront,
  updateBusinessStorefront,
  uploadBusinessStorefrontImage,
  removeBusinessStorefrontImage,
  type BusinessStorefrontImageKind,
  type BusinessSetupResponse,
  type BusinessStorefront,
  type BusinessStorefrontInput,
} from '@/lib/businessOwnerApi';
import { resolveStorefrontAssetUrl } from '@/lib/publicBusinessStorefrontApi';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#73D99A',
  danger: '#FF6B6B',
  amber: '#F4C66A',
};

type ThemeKey = BusinessStorefront['themeKey'];
type LayoutKey = BusinessStorefront['layoutKey'];

const THEMES: {
  key: ThemeKey;
  name: string;
  description: string;
  background: string;
  text: string;
  primary: string;
  accent: string;
}[] = [
  {
    key: 'MIDNIGHT',
    name: 'Midnight',
    description: 'Dark, bold and modern',
    background: '#0B0F10',
    text: '#FFFFFF',
    primary: '#D7FF5F',
    accent: '#D7FF5F',
  },
  {
    key: 'MINIMAL',
    name: 'Minimal',
    description: 'Clean and understated',
    background: '#F4F5F0',
    text: '#17201B',
    primary: '#52745D',
    accent: '#B9D8A6',
  },
  {
    key: 'EDITORIAL',
    name: 'Editorial',
    description: 'Elegant and refined',
    background: '#F0E8DA',
    text: '#33291F',
    primary: '#9B6945',
    accent: '#D8B995',
  },
  {
    key: 'BOLD',
    name: 'Bold',
    description: 'Vibrant and expressive',
    background: '#17112B',
    text: '#FFFFFF',
    primary: '#A78BFA',
    accent: '#F472B6',
  },
];

const LAYOUTS: {
  key: LayoutKey;
  name: string;
  description: string;
}[] = [
  {
    key: 'CLASSIC',
    name: 'Classic',
    description: 'A balanced storefront with a clear introduction.',
  },
  {
    key: 'GRID',
    name: 'Product grid',
    description: 'A compact grid designed for browsing a catalogue.',
  },
  {
    key: 'FEATURED',
    name: 'Featured',
    description: 'A prominent hero section for highlighted products.',
  },
];

const DEFAULT_THEME = THEMES[0];

function defaultDraft(): BusinessStorefrontInput {
  return {
    themeKey: 'MIDNIGHT',
    layoutKey: 'CLASSIC',
    primaryColor: DEFAULT_THEME.primary,
    accentColor: DEFAULT_THEME.accent,
    backgroundColor: DEFAULT_THEME.background,
    textColor: DEFAULT_THEME.text,
  };
}

function makeDraft(storefront: BusinessStorefront | null): BusinessStorefrontInput {
  if (!storefront) return defaultDraft();

  return {
    themeKey: storefront.themeKey,
    layoutKey: storefront.layoutKey,
    primaryColor: storefront.primaryColor,
    accentColor: storefront.accentColor,
    backgroundColor: storefront.backgroundColor,
    textColor: storefront.textColor,
    customSettings: storefront.customSettings ?? undefined,
  };
}

export default function BusinessStorefrontScreen() {
  const params = useLocalSearchParams<{ businessId: string | string[] }>();
  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const [setup, setSetup] = useState<BusinessSetupResponse | null>(null);
  const [draft, setDraft] = useState<BusinessStorefrontInput>(defaultDraft);
  const [previewProfile, setPreviewProfile] = useState<BusinessSetupResponse['profile']>(null);
  const [previewCatalogue, setPreviewCatalogue] = useState<
    NonNullable<Awaited<ReturnType<typeof getBusinessStorefrontPreview>>['preview']['catalogue']>
  >({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [uploadingBrandAsset, setUploadingBrandAsset] =
    useState<BusinessStorefrontImageKind | null>(null);
  const [removingBrandAsset, setRemovingBrandAsset] =
    useState<BusinessStorefrontImageKind | null>(null);

  // Keep the editable draft intact while refreshing server-backed preview data.
  const hasHydratedDraft = useRef(false);
  const designerScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const sectionOffsets = useRef({ theme: 0, colours: 0, brand: 0 });

  const scrollToEditor = useCallback(
    (section: keyof typeof sectionOffsets.current) => {
      designerScrollRef.current?.scrollTo({
        y: Math.max(0, sectionOffsets.current[section] - 12),
        animated: true,
      });
    },
    [],
  );

  const openBusinessProfile = useCallback(() => {
    if (!businessId) return;
    router.push(
      `/business/workspace/${encodeURIComponent(businessId)}/setup`,
    );
  }, [businessId]);

  const openCatalogue = useCallback(() => {
    if (!businessId) return;
    router.push(
      `/business/workspace/${encodeURIComponent(businessId)}/catalogue`,
    );
  }, [businessId]);

  const load = useCallback(async () => {
    if (!businessId) {
      setError('The business could not be identified.');
      setLoading(false);
      return;
    }

    if (!hasHydratedDraft.current) setLoading(true);
    setError('');

    try {
      const result = await getBusinessSetup(businessId);
      setSetup(result);
      setPublishedAt(result.storefront?.publishedAt ?? null);

      // Hydrate the draft only once. Returning from another editor must not
      // overwrite unsaved theme, layout or colour selections.
      if (!hasHydratedDraft.current) {
        setDraft(makeDraft(result.storefront));
        hasHydratedDraft.current = true;
      }

      try {
        const preview = await getBusinessStorefrontPreview(businessId);
        setPreviewProfile(preview.preview.profile ?? result.profile);
        setPreviewCatalogue(
          preview.preview.catalogue ?? { categories: [], items: [] },
        );
        setPreviewMessage('');
      } catch {
        // The designer itself remains usable if preview data is temporarily
        // unavailable. Profile details are still available from setup.
        setPreviewProfile(result.profile);
        setPreviewMessage(
          'Your design is editable. Live catalogue data could not be refreshed just now.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load storefront settings.',
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const refreshBrandingSetup = async () => {
    if (!businessId) return;

    const latest = await getBusinessSetup(businessId);
    setSetup(latest);
    setPublishedAt(latest.storefront?.publishedAt ?? null);

    try {
      const preview = await getBusinessStorefrontPreview(businessId);
      setPreviewProfile(preview.preview.profile ?? latest.profile);
      setPreviewCatalogue(
        preview.preview.catalogue ?? { categories: [], items: [] },
      );
    } catch {
      setPreviewProfile(latest.profile);
    }
  };

  const chooseBrandAsset = async (kind: BusinessStorefrontImageKind) => {
    if (!businessId || uploadingBrandAsset || removingBrandAsset || saving || publishing) {
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo access required',
          'Allow MAKAZII to access your photos so you can choose your storefront image.',
        );
        return;
      }

      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (selection.canceled || !selection.assets?.[0]) return;

      const asset = selection.assets[0];
      setUploadingBrandAsset(kind);
      setError('');
      setPreviewMessage('');

      await uploadBusinessStorefrontImage(businessId, kind, {
        uri: asset.uri,
        name: asset.fileName || `${kind}-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        type: asset.mimeType || 'image/jpeg',
        file: asset.file ?? undefined,
      });

      await refreshBrandingSetup();
      setPreviewMessage(
        kind === 'logo'
          ? 'Your draft logo has been uploaded and the live preview has been refreshed.'
          : 'Your draft banner has been uploaded and the live preview has been refreshed.',
      );
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Unable to upload this storefront image.';
      setError(message);
      Alert.alert('Image upload failed', message);
    } finally {
      setUploadingBrandAsset(null);
    }
  };

  const confirmRemoveBrandAsset = (kind: BusinessStorefrontImageKind) => {
    if (!businessId || uploadingBrandAsset || removingBrandAsset || saving || publishing) {
      return;
    }

    Alert.alert(
      kind === 'logo' ? 'Remove storefront logo?' : 'Remove storefront banner?',
      'This removes the image from your editable draft. Your already-published storefront image is not changed until you publish an updated storefront.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove image',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setRemovingBrandAsset(kind);
              setError('');
              setPreviewMessage('');

              try {
                await removeBusinessStorefrontImage(businessId, kind);
                await refreshBrandingSetup();
                setPreviewMessage(
                  kind === 'logo'
                    ? 'The draft logo has been removed.'
                    : 'The draft banner has been removed.',
                );
              } catch (err) {
                const message = err instanceof Error
                  ? err.message
                  : 'Unable to remove this storefront image.';
                setError(message);
                Alert.alert('Image not removed', message);
              } finally {
                setRemovingBrandAsset(null);
              }
            })();
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectTheme = (theme: typeof THEMES[number]) => {
    setDraft((current) => ({
      ...current,
      themeKey: theme.key,
      primaryColor: theme.primary,
      accentColor: theme.accent,
      backgroundColor: theme.background,
      textColor: theme.text,
    }));
    setPreviewMessage('');
  };

  const selectLayout = (layout: LayoutKey) => {
    setDraft((current) => ({ ...current, layoutKey: layout }));
    const selectedLayout = LAYOUTS.find((item) => item.key === layout);
    setPreviewMessage(
      `${selectedLayout?.name ?? layout} layout is now shown in your live draft preview. Save when you are ready.`,
    );
  };

  const saveDraft = async (): Promise<boolean> => {
    if (!businessId || saving || publishing) return false;

    setSaving(true);
    setError('');
    setPreviewMessage('');

    try {
      const draftToSave = { ...draft };
      await updateBusinessStorefront(businessId, draftToSave);
      const latest = await getBusinessSetup(businessId);
      setSetup(latest);
      setPublishedAt(latest.storefront?.publishedAt ?? null);
      setPreviewMessage('Your draft has been saved. It is not public until you publish it.');
      return true;
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Unable to save storefront settings.';
      setError(message);
      Alert.alert('Draft not saved', message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAndPreview = async () => {
    const saved = await saveDraft();
    if (!saved || !businessId) return;

    setPreviewLoading(true);
    setError('');

    try {
      const result = await getBusinessStorefrontPreview(businessId);
      setPreviewProfile(result.preview.profile);
      setPreviewCatalogue(result.preview.catalogue ?? { categories: [], items: [] });
      setPreviewMessage(
        result.published
          ? 'Preview loaded from your saved storefront draft.'
          : 'Your saved storefront draft is ready to preview.',
      );
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Unable to load storefront preview.';
      setError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const publish = async () => {
    if (!businessId || saving || publishing) return;

    Alert.alert(
      'Publish your storefront?',
      'This will make your saved storefront design the published version. You can edit and publish an updated version later.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Publish storefront',
          onPress: () => {
            void (async () => {
              setPublishing(true);
              setError('');

              try {
                // Always persist the latest design before publishing.
                await updateBusinessStorefront(businessId, draft);
                const result = await publishBusinessStorefront(businessId);
                setPublishedAt(result.publishedAt);

                const latest = await getBusinessSetup(businessId);
                setSetup(latest);
                setPublishedAt(latest.storefront?.publishedAt ?? result.publishedAt);

                try {
                  const preview = await getBusinessStorefrontPreview(businessId);
                  setPreviewProfile(preview.preview.profile ?? latest.profile);
                  setPreviewCatalogue(
                    preview.preview.catalogue ?? { categories: [], items: [] },
                  );
                } catch {
                  setPreviewProfile(latest.profile);
                }

                setPreviewMessage('Your storefront is published. The public storefront now uses this published version.');

                Alert.alert(
                  'Storefront published',
                  result.message || 'Your storefront has been published successfully.',
                );
              } catch (err) {
                const message = err instanceof Error
                  ? err.message
                  : 'Unable to publish your storefront.';
                setError(message);
                Alert.alert('Publication unsuccessful', message);
              } finally {
                setPublishing(false);
              }
            })();
          },
        },
      ],
    );
  };

  const theme = THEMES.find((item) => item.key === draft.themeKey) ?? DEFAULT_THEME;
  const displayName =
    previewProfile?.publicDisplayName ||
    setup?.business.name ||
    'Your business';
  const tagline = previewProfile?.tagline || 'Welcome to our storefront';
  const description =
    previewProfile?.publicDescription ||
    setup?.business.description ||
    'Your business introduction will appear here. Complete your public business profile to personalise this section.';

  const sampleCategories = [
    { id: 'preview-category-1', name: 'Featured collection', description: 'Highlight your most popular offering', imageUrl: null },
    { id: 'preview-category-2', name: 'New arrivals', description: 'Show customers what is new', imageUrl: null },
    { id: 'preview-category-3', name: 'Popular choices', description: 'Make popular options easy to find', imageUrl: null },
  ];

  const sampleItems = [
    {
      id: 'preview-item-1',
      name: 'Signature offering',
      category: { name: 'Featured collection' },
      shortDescription: 'A sample description to demonstrate your storefront layout.',
      description: 'An illustrative example only.',
      priceAmount: null,
      currency: 'KSh',
      isFeatured: true,
      images: [],
    },
    {
      id: 'preview-item-2',
      name: 'Customer favourite',
      category: { name: 'Popular choices' },
      shortDescription: 'An example catalogue item. Replace it with your own offering.',
      description: 'An illustrative example only.',
      priceAmount: null,
      currency: 'KSh',
      isFeatured: false,
      images: [],
    },
    {
      id: 'preview-item-3',
      name: 'Latest addition',
      category: { name: 'New arrivals' },
      shortDescription: 'A second example to show how your content will be arranged.',
      description: 'An illustrative example only.',
      priceAmount: null,
      currency: 'KSh',
      isFeatured: false,
      images: [],
    },
  ];

  const displayCategories = previewCatalogue.categories.length
    ? previewCatalogue.categories
    : sampleCategories;

  const displayItems = previewCatalogue.items.length
    ? previewCatalogue.items
    : sampleItems;

  const usingSamplePreview =
    previewCatalogue.categories.length === 0 &&
    previewCatalogue.items.length === 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.lime} />
          <Text style={styles.loadingTitle}>Preparing your designer</Text>
          <Text style={styles.mutedText}>Loading your business appearance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!setup) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <Store size={30} color={C.danger} />
          <Text style={styles.loadingTitle}>Storefront unavailable</Text>
          <Text style={styles.mutedText}>{error || 'Unable to load storefront settings.'}</Text>
          <Pressable style={styles.primaryButton} onPress={() => {
            setLoading(true);
            void load();
          }}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.linkText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={19} color={C.white} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MAKAZII BUSINESS</Text>
          <Text style={styles.headerTitle}>Storefront Designer</Text>
        </View>
        <View style={styles.headerIcon}>
          <Palette size={19} color={C.lime} />
        </View>
      </View>

      <ScrollView
        ref={designerScrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introTop}>
            <View style={styles.introIcon}>
              <Sparkles size={21} color={C.lime} />
            </View>
            <View style={styles.draftPill}>
              <View style={styles.draftDot} />
              <Text style={styles.draftPillText}>
                {setup.storefront?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT DESIGN'}
              </Text>
            </View>
          </View>
          <Text style={styles.introTitle}>Make your business stand out.</Text>
          <Text style={styles.introDescription}>
            Build a storefront that reflects your brand. Changes remain drafts until you publish.
          </Text>
        </View>

        <View
          style={styles.sectionHeading}
          onLayout={(event) => {
            sectionOffsets.current.theme = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionIcon}>
            <Palette size={17} color={C.lime} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Choose your theme</Text>
            <Text style={styles.sectionDescription}>
              Select the visual identity that suits your business.
            </Text>
          </View>
        </View>

        <View style={styles.themeGrid}>
          {THEMES.map((item) => {
            const selected = draft.themeKey === item.key;

            return (
              <Pressable
                key={item.key}
                style={[
                  styles.themeCard,
                  selected && styles.themeCardSelected,
                ]}
                onPress={() => selectTheme(item)}
              >
                <View
                  style={[
                    styles.themeSample,
                    { backgroundColor: item.background },
                  ]}
                >
                  <View style={styles.themeSampleTop}>
                    <View style={[styles.themeSampleLogo, { backgroundColor: item.primary }]} />
                    <View style={[styles.themeSampleLine, { backgroundColor: item.text }]} />
                  </View>
                  <View style={[styles.themeSampleHero, { backgroundColor: item.accent }]} />
                  <View style={styles.themeSampleBottom}>
                    <View style={[styles.themeSampleSmall, { backgroundColor: item.text }]} />
                    <View style={[styles.themeSampleSmall, { backgroundColor: item.primary }]} />
                    <View style={[styles.themeSampleSmall, { backgroundColor: item.accent }]} />
                  </View>
                </View>
                <View style={styles.themeInfo}>
                  <View style={styles.themeNameRow}>
                    <Text style={styles.themeName}>{item.name}</Text>
                    {selected && <Check size={15} color={C.lime} />}
                  </View>
                  <Text style={styles.themeDescription}>{item.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <LayoutGrid size={17} color={C.lime} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Storefront layout</Text>
            <Text style={styles.sectionDescription}>
              Choose how your storefront content is arranged.
            </Text>
          </View>
        </View>

        <View style={styles.layoutList}>
          {LAYOUTS.map((item, index) => {
            const selected = draft.layoutKey === item.key;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.layoutCard,
                  selected && styles.layoutCardSelected,
                ]}
                onPress={() => selectLayout(item.key)}
              >
                <View style={styles.layoutVisual}>
                  {index === 0 ? (
                    <>
                      <View style={styles.layoutClassicHeader} />
                      <View style={styles.layoutClassicBody}>
                        <View style={styles.layoutClassicImage} />
                        <View style={styles.layoutClassicLines}>
                          <View />
                          <View />
                          <View />
                        </View>
                      </View>
                    </>
                  ) : index === 1 ? (
                    <View style={styles.layoutGridVisual}>
                      {[0, 1, 2, 3].map((n) => <View key={n} />)}
                    </View>
                  ) : (
                    <>
                      <View style={styles.layoutFeaturedHero} />
                      <View style={styles.layoutFeaturedLines}>
                        <View />
                        <View />
                      </View>
                    </>
                  )}
                </View>
                <View style={styles.layoutCopy}>
                  <Text style={styles.layoutName}>{item.name}</Text>
                  <Text style={styles.layoutDescription}>{item.description}</Text>
                  {selected && (
                    <Text style={styles.layoutSelectedLabel}>SELECTED</Text>
                  )}
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View
          style={styles.sectionHeading}
          onLayout={(event) => {
            sectionOffsets.current.colours = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionIcon}>
            <Palette size={17} color={C.lime} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Brand colours</Text>
            <Text style={styles.sectionDescription}>
              Fine-tune your storefront colour palette.
            </Text>
          </View>
        </View>

        <View style={styles.colourCard}>
          {([
            ['Primary colour', 'primaryColor'],
            ['Accent colour', 'accentColor'],
            ['Background colour', 'backgroundColor'],
            ['Text colour', 'textColor'],
          ] as const).map(([label, key]) => (
            <View style={styles.colourRow} key={key}>
              <View style={styles.colourLabelGroup}>
                <View
                  style={[
                    styles.colourSwatch,
                    { backgroundColor: String(draft[key] ?? '#FFFFFF') },
                  ]}
                />
                <Text style={styles.colourLabel}>{label}</Text>
              </View>
              <TextInput
                value={String(draft[key] ?? '')}
                onChangeText={(value) => {
                  setDraft((current) => ({ ...current, [key]: value }));
                  setPreviewMessage('');
                }}
                autoCapitalize="characters"
                maxLength={7}
                placeholder="#FFFFFF"
                placeholderTextColor="#687174"
                style={styles.colourInput}
              />
            </View>
          ))}
          <Text style={styles.colourHint}>
            Enter a valid six-digit HEX colour, including the # symbol.
          </Text>
        </View>

        <View
          style={styles.sectionHeading}
          onLayout={(event) => {
            sectionOffsets.current.brand = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionIcon}>
            <Store size={17} color={C.lime} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Brand identity</Text>
            <Text style={styles.sectionDescription}>
              Add your business logo and storefront banner.
            </Text>
          </View>
        </View>

        <View style={styles.brandAssetsCard}>
          <View style={styles.brandAssetRow}>
            <View style={styles.brandAssetPreview}>
              {resolveStorefrontAssetUrl(setup?.storefront?.logoUrl) ? (
                <Image
                  source={{ uri: resolveStorefrontAssetUrl(setup?.storefront?.logoUrl)! }}
                  style={styles.brandLogoImage}
                  resizeMode="cover"
                />
              ) : (
                <Store size={25} color={C.muted} />
              )}
            </View>
            <View style={styles.brandAssetCopy}>
              <Text style={styles.brandAssetTitle}>Business logo</Text>
              <Text style={styles.brandAssetDescription}>
                Square image recommended. JPG, PNG or WebP, up to 10 MB.
              </Text>
              <View style={styles.brandAssetActions}>
                <Pressable
                  style={styles.brandAssetButton}
                  onPress={() => void chooseBrandAsset('logo')}
                  disabled={!!uploadingBrandAsset || !!removingBrandAsset}
                >
                  {uploadingBrandAsset === 'logo'
                    ? <ActivityIndicator size="small" color={C.background} />
                    : <Upload size={13} color={C.background} />}
                  <Text style={styles.brandAssetButtonText}>
                    {uploadingBrandAsset === 'logo' ? 'Uploading' : setup?.storefront?.logoUrl ? 'Replace' : 'Upload'}
                  </Text>
                </Pressable>
                {!!setup?.storefront?.logoUrl && (
                  <Pressable
                    style={styles.brandAssetRemove}
                    onPress={() => confirmRemoveBrandAsset('logo')}
                    disabled={!!uploadingBrandAsset || !!removingBrandAsset}
                  >
                    <Text style={styles.brandAssetRemoveText}>
                      {removingBrandAsset === 'logo' ? 'Removing...' : 'Remove'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <View style={styles.brandAssetDivider} />

          <View style={styles.bannerAssetPreview}>
            {resolveStorefrontAssetUrl(setup?.storefront?.bannerUrl) ? (
              <Image
                source={{ uri: resolveStorefrontAssetUrl(setup?.storefront?.bannerUrl)! }}
                style={styles.bannerAssetImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerAssetPlaceholder}>
                <Upload size={18} color={C.muted} />
                <Text style={styles.bannerAssetPlaceholderText}>No banner image uploaded</Text>
              </View>
            )}
          </View>
          <Text style={styles.brandAssetTitle}>Storefront banner</Text>
          <Text style={styles.brandAssetDescription}>
            A wide landscape image works best for your storefront hero.
          </Text>
          <View style={styles.brandAssetActions}>
            <Pressable
              style={styles.brandAssetButton}
              onPress={() => void chooseBrandAsset('banner')}
              disabled={!!uploadingBrandAsset || !!removingBrandAsset}
            >
              {uploadingBrandAsset === 'banner'
                ? <ActivityIndicator size="small" color={C.background} />
                : <Upload size={13} color={C.background} />}
              <Text style={styles.brandAssetButtonText}>
                {uploadingBrandAsset === 'banner' ? 'Uploading' : setup?.storefront?.bannerUrl ? 'Replace banner' : 'Upload banner'}
              </Text>
            </Pressable>
            {!!setup?.storefront?.bannerUrl && (
              <Pressable
                style={styles.brandAssetRemove}
                onPress={() => confirmRemoveBrandAsset('banner')}
                disabled={!!uploadingBrandAsset || !!removingBrandAsset}
              >
                <Text style={styles.brandAssetRemoveText}>
                  {removingBrandAsset === 'banner' ? 'Removing...' : 'Remove'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Monitor size={17} color={C.lime} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Storefront preview</Text>
            <Text style={styles.sectionDescription}>
              See how your selected design will look.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.previewFrame,
            { backgroundColor: draft.backgroundColor ?? theme.background },
          ]}
        >
          {/* Storefront browser header */}
          <View style={styles.previewBrowserBar}>
            <View style={styles.browserDots}>
              <View style={styles.browserDotOne} />
              <View style={styles.browserDotTwo} />
              <View style={styles.browserDotThree} />
            </View>
            <Text style={styles.previewBrowserLabel}>MAKAZII STOREFRONT</Text>
            <View style={styles.previewLiveIndicator}>
              <View style={styles.previewLiveDot} />
              <Text style={styles.previewLiveText}>
                {draft.layoutKey === 'CLASSIC'
                  ? 'CLASSIC LAYOUT'
                  : draft.layoutKey === 'GRID'
                    ? 'PRODUCT GRID'
                    : 'FEATURED LAYOUT'}{' · LIVE PREVIEW'}
              </Text>
            </View>
          </View>

          <View style={styles.previewContent}>
            {/* Brand identity */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit your business logo and brand identity"
              onPress={() => scrollToEditor('brand')}
              style={styles.previewBrandRow}
            >
              <View
                style={[
                  styles.previewLogo,
                  { backgroundColor: draft.primaryColor ?? theme.primary },
                ]}
              >
                {resolveStorefrontAssetUrl(setup?.storefront?.logoUrl) ? (
                  <Image
                    source={{ uri: resolveStorefrontAssetUrl(setup?.storefront?.logoUrl)! }}
                    style={styles.previewLogoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Store
                    size={19}
                    color={draft.backgroundColor ?? theme.background}
                  />
                )}
              </View>

              <View style={styles.previewBrandCopy}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.previewBrandName,
                    { color: draft.textColor ?? theme.text },
                  ]}
                >
                  {displayName}
                </Text>
                <Text
                  style={[
                    styles.previewBrandCaption,
                    { color: draft.textColor ?? theme.text },
                  ]}
                >
                  YOUR BUSINESS ON MAKAZII
                </Text>
              </View>

              <View
                style={[
                  styles.previewMenuButton,
                  { borderColor: `${draft.textColor ?? theme.text}35` },
                ]}
              >
                <Text
                  style={[
                    styles.previewMenuText,
                    { color: draft.textColor ?? theme.text },
                  ]}
                >
                  MENU
                </Text>
              </View>
            </Pressable>

            {/* Customer navigation */}
            <View
              style={[
                styles.previewNavigation,
                { borderColor: `${draft.textColor ?? theme.text}25` },
              ]}
            >
              {['HOME', 'CATEGORIES', 'ABOUT'].map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.previewNavItem,
                    index === 0 && {
                      borderBottomColor: draft.primaryColor ?? theme.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewNavText,
                      {
                        color: draft.textColor ?? theme.text,
                        opacity: index === 0 ? 1 : 0.62,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            {/* Hero */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit your storefront banner and brand identity"
              onPress={() => scrollToEditor('brand')}
              style={[
                styles.previewHero,
                { backgroundColor: draft.accentColor ?? theme.accent },
              ]}
            >
              {resolveStorefrontAssetUrl(setup?.storefront?.bannerUrl) ? (
                <Image
                  source={{ uri: resolveStorefrontAssetUrl(setup?.storefront?.bannerUrl)! }}
                  style={styles.previewHeroImage}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.previewHeroContent}>
                <Text
                  style={[
                    styles.previewTag,
                    { color: draft.backgroundColor ?? theme.background },
                  ]}
                >
                  DISCOVER SOMETHING DIFFERENT
                </Text>

                <Text
                  style={[
                    styles.previewHeadline,
                    { color: draft.backgroundColor ?? theme.background },
                  ]}
                >
                  {tagline}
                </Text>

                <Text
                  style={[
                    styles.previewHeroDescription,
                    { color: draft.backgroundColor ?? theme.background },
                  ]}
                >
                  Explore what {displayName} has to offer.
                </Text>

                <View
                  style={[
                    styles.previewAction,
                    { backgroundColor: draft.primaryColor ?? theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewActionText,
                      { color: draft.backgroundColor ?? theme.background },
                    ]}
                  >
                    EXPLORE STOREFRONT
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.previewHeroDecoration,
                  { borderColor: `${draft.backgroundColor ?? theme.background}35` },
                ]}
              />
            </Pressable>

            {/* Introduction */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit business name, tagline and description"
              onPress={openBusinessProfile}
              style={styles.previewWelcome}
            >
              <Text
                style={[
                  styles.previewEyebrow,
                  { color: draft.primaryColor ?? theme.primary },
                ]}
              >
                WELCOME TO OUR BUSINESS
              </Text>
              <Text
                style={[
                  styles.previewSectionTitle,
                  { color: draft.textColor ?? theme.text },
                ]}
              >
                A little about us
              </Text>
              <Text
                style={[
                  styles.previewDescription,
                  { color: draft.textColor ?? theme.text },
                ]}
              >
                {description}
              </Text>
            </Pressable>

            {/* Category browsing preview */}
            <View style={styles.previewSearchRow}>
              <View
                style={[
                  styles.previewSearchField,
                  {
                    backgroundColor: `${draft.textColor ?? theme.text}0A`,
                    borderColor: `${draft.textColor ?? theme.text}20`,
                  },
                ]}
              >
                <Text style={[styles.previewSearchIcon, { color: draft.textColor ?? theme.text }]}>
                  ⌕
                </Text>
                <Text style={[styles.previewSearchText, { color: draft.textColor ?? theme.text }]}>
                  Search products and services
                </Text>
              </View>
              <View
                style={[
                  styles.previewBag,
                  { backgroundColor: draft.primaryColor ?? theme.primary },
                ]}
              >
                <Text style={[styles.previewBagText, { color: draft.backgroundColor ?? theme.background }]}>
                  BAG
                </Text>
              </View>
            </View>

            <View style={styles.previewSectionHeader}>
              <View style={styles.previewSectionHeadingCopy}>
                <Text
                  style={[
                    styles.previewEyebrow,
                    { color: draft.primaryColor ?? theme.primary },
                  ]}
                >
                  FIND WHAT YOU NEED
                </Text>
                <Text
                  style={[
                    styles.previewSectionTitle,
                    { color: draft.textColor ?? theme.text },
                  ]}
                >
                  Browse categories
                </Text>
              </View>
              <Text
                style={[
                  styles.previewSmallLink,
                  { color: draft.primaryColor ?? theme.primary },
                ]}
              >
                EXPLORE
              </Text>
            </View>

            <View
              style={[
                styles.previewCategoryGrid,
                draft.layoutKey === 'CLASSIC' && styles.previewCategoryGridClassic,
                draft.layoutKey === 'GRID' && styles.previewCategoryGridGrid,
              ]}
            >
              {displayCategories.map((item) => {
                const imageUrl = resolveStorefrontAssetUrl(item.imageUrl);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit category ${item.name} in catalogue management`}
                    onPress={openCatalogue}
                    style={[
                      styles.previewCategoryTile,
                      draft.layoutKey === 'CLASSIC' && styles.previewCategoryTileClassic,
                      draft.layoutKey === 'GRID' && styles.previewCategoryTileGrid,
                      {
                        backgroundColor: `${draft.textColor ?? theme.text}0A`,
                        borderColor: `${draft.textColor ?? theme.text}20`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.previewCategoryIcon,
                        { backgroundColor: `${draft.primaryColor ?? theme.primary}20` },
                      ]}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ width: '100%', height: '100%', borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={[styles.previewCategoryIconText, { color: draft.primaryColor ?? theme.primary }]}>
                          ✦
                        </Text>
                      )}
                    </View>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.previewCategoryName,
                        { color: draft.textColor ?? theme.text },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.previewCategoryMeta,
                        { color: draft.textColor ?? theme.text },
                      ]}
                    >
                      {item.description || 'Explore this category'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {previewCatalogue.categories.length === 0 && !usingSamplePreview && (
              <Text style={styles.previewDisclaimer}>
                No active catalogue categories yet. Add categories in Catalogue Management to display them here.
              </Text>
            )}

            {/* Collection */}
            <View style={styles.previewSectionHeader}>
              <View style={styles.previewSectionHeadingCopy}>
                <Text
                  style={[
                    styles.previewEyebrow,
                    { color: draft.primaryColor ?? theme.primary },
                  ]}
                >
                  {draft.layoutKey === 'FEATURED'
                    ? 'A CLOSER LOOK'
                    : 'EXPLORE OUR OFFERING'}
                </Text>
                <Text
                  style={[
                    styles.previewSectionTitle,
                    { color: draft.textColor ?? theme.text },
                  ]}
                >
                  {draft.layoutKey === 'FEATURED'
                    ? 'Featured collection'
                    : draft.layoutKey === 'GRID'
                      ? 'Explore our catalogue'
                      : 'Discover our collection'}
                </Text>
              </View>
              <Text
                style={[
                  styles.previewSmallLink,
                  { color: draft.primaryColor ?? theme.primary },
                ]}
              >
                VIEW ALL
              </Text>
            </View>

            {draft.layoutKey === 'FEATURED' && displayItems.length > 0 && (() => {
              const featuredItem =
                displayItems.find((item) => item.isFeatured) ??
                displayItems[0];
              const featuredImage = resolveStorefrontAssetUrl(
                featuredItem.images?.[0]?.imageUrl,
              );
              const featuredPrice =
                featuredItem.priceAmount !== null &&
                featuredItem.priceAmount !== undefined
                  ? `${featuredItem.currency || 'KSh'} ${Number(featuredItem.priceAmount).toLocaleString('en-KE')}`
                  : 'Price on request';

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${featuredItem.name} in catalogue management`}
                  onPress={openCatalogue}
                  style={[
                    styles.previewFeaturedCard,
                    {
                      backgroundColor: `${draft.textColor ?? theme.text}0C`,
                      borderColor: `${draft.textColor ?? theme.text}20`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewFeaturedImage,
                      { backgroundColor: `${draft.accentColor ?? theme.accent}35` },
                    ]}
                  >
                    {featuredImage ? (
                      <Image
                        source={{ uri: featuredImage }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Store size={34} color={draft.textColor ?? theme.text} />
                    )}
                  </View>
                  <View style={styles.previewFeaturedDetails}>
                    <Text style={[styles.previewProductCategory, { color: draft.primaryColor ?? theme.primary }]}>
                      {featuredItem.category?.name || 'FEATURED ITEM'}
                    </Text>
                    <Text style={[styles.previewFeaturedTitle, { color: draft.textColor ?? theme.text }]}>
                      {featuredItem.name}
                    </Text>
                    <Text style={[styles.previewFeaturedDescription, { color: draft.textColor ?? theme.text }]}>
                      {featuredItem.shortDescription || featuredItem.description || 'Explore this catalogue item.'}
                    </Text>
                    <Text style={[styles.previewFeaturedPrice, { color: draft.primaryColor ?? theme.primary }]}>
                      {featuredPrice}
                    </Text>
                  </View>
                </Pressable>
              );
            })()}

            <View
              style={[
                styles.previewProducts,
                draft.layoutKey === 'CLASSIC' && styles.previewProductsClassic,
                draft.layoutKey === 'GRID' && styles.previewProductsGrid,
              ]}
            >
              {displayItems
                .filter((item, index) => {
                  if (draft.layoutKey !== 'FEATURED') return true;
                  const featuredIndex = displayItems.findIndex(
                    (entry) => entry.isFeatured,
                  );
                  return index !== (featuredIndex >= 0 ? featuredIndex : 0);
                })
                .map((item) => {
                const imageUrl = resolveStorefrontAssetUrl(
                  item.images?.[0]?.imageUrl,
                );
                const price =
                  item.priceAmount !== null && item.priceAmount !== undefined
                    ? `${item.currency || 'KSh'} ${Number(item.priceAmount).toLocaleString('en-KE')}`
                    : 'Price on request';

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name} in catalogue management`}
                    onPress={openCatalogue}
                    style={[
                      styles.previewProduct,
                      draft.layoutKey === 'CLASSIC' && styles.previewProductClassic,
                      draft.layoutKey === 'GRID' && styles.previewProductGrid,
                      {
                        backgroundColor: `${draft.textColor ?? theme.text}0A`,
                        borderColor: `${draft.textColor ?? theme.text}20`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.previewProductImage,
                        draft.layoutKey === 'CLASSIC' && styles.previewProductImageClassic,
                        draft.layoutKey === 'GRID' && styles.previewProductImageGrid,
                        { backgroundColor: `${draft.accentColor ?? theme.accent}35` },
                      ]}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Store size={25} color={draft.textColor ?? theme.text} />
                      )}
                    </View>

                    <View
                      style={[
                        styles.previewProductDetails,
                        draft.layoutKey === 'CLASSIC' && styles.previewProductDetailsClassic,
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewProductCategory,
                          { color: draft.primaryColor ?? theme.primary },
                        ]}
                      >
                        {item.category?.name || 'CATALOGUE ITEM'}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.previewProductName,
                          { color: draft.textColor ?? theme.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        numberOfLines={3}
                        style={[
                          styles.previewProductDescription,
                          { color: draft.textColor ?? theme.text },
                        ]}
                      >
                        {item.shortDescription || item.description || 'View this item in the business catalogue.'}
                      </Text>
                      <View style={styles.previewProductBottom}>
                        <Text
                          style={[
                            styles.previewProductPrice,
                            { color: draft.textColor ?? theme.text },
                          ]}
                        >
                          {price}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {usingSamplePreview && (
              <Text style={styles.previewDisclaimer}>
                Illustrative preview only. These examples are not real catalogue items and will not be published. Add your own categories and products in Catalogue Management.
              </Text>
            )}
            {!usingSamplePreview && previewCatalogue.items.length === 0 && (
              <Text style={styles.previewDisclaimer}>
                No published catalogue items yet. Publish catalogue items to show real products and services in your storefront.
              </Text>
            )}

            {/* Business information */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit business contact and location information"
              onPress={openBusinessProfile}
              style={[
                styles.previewInfoCard,
                {
                  backgroundColor: `${draft.textColor ?? theme.text}0A`,
                  borderColor: `${draft.textColor ?? theme.text}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.previewEyebrow,
                  { color: draft.primaryColor ?? theme.primary },
                ]}
              >
                GET TO KNOW US
              </Text>
              <Text
                style={[
                  styles.previewSectionTitle,
                  { color: draft.textColor ?? theme.text },
                ]}
              >
                Business information
              </Text>

              {!!previewProfile?.contactPhone && (
                <View style={styles.previewInfoRow}>
                  <Text
                    style={[
                      styles.previewInfoLabel,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    PHONE
                  </Text>
                  <Text
                    style={[
                      styles.previewInfoValue,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    {previewProfile.contactPhone}
                  </Text>
                </View>
              )}

              {!!previewProfile?.contactEmail && (
                <View style={styles.previewInfoRow}>
                  <Text
                    style={[
                      styles.previewInfoLabel,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    EMAIL
                  </Text>
                  <Text
                    style={[
                      styles.previewInfoValue,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    {previewProfile.contactEmail}
                  </Text>
                </View>
              )}

              {!!(
                previewProfile?.addressLine ||
                previewProfile?.ward ||
                previewProfile?.constituency ||
                previewProfile?.county
              ) && (
                <View style={styles.previewInfoRow}>
                  <Text
                    style={[
                      styles.previewInfoLabel,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    LOCATION
                  </Text>
                  <Text
                    style={[
                      styles.previewInfoValue,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    {[
                      previewProfile?.addressLine,
                      previewProfile?.ward,
                      previewProfile?.constituency,
                      previewProfile?.county,
                    ].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}

              {!previewProfile?.contactPhone &&
                !previewProfile?.contactEmail &&
                !previewProfile?.addressLine &&
                !previewProfile?.ward &&
                !previewProfile?.constituency &&
                !previewProfile?.county && (
                  <Text
                    style={[
                      styles.previewDescription,
                      { color: draft.textColor ?? theme.text },
                    ]}
                  >
                    Your public business contact and location details will appear here when added to your business profile.
                  </Text>
                )}
            </Pressable>
          </View>

          {/* Storefront footer */}
          <View
            style={[
              styles.previewFooter,
              { borderTopColor: `${draft.textColor ?? theme.text}25` },
            ]}
          >
            <Text
              style={[
                styles.previewFooterBrand,
                { color: draft.textColor ?? theme.text },
              ]}
            >
              {displayName}
            </Text>
            <Text
              style={[
                styles.previewFooterText,
                { color: draft.textColor ?? theme.text },
              ]}
            >
              DISCOVER • CONNECT • SHOP
            </Text>
            <Text
              style={[
                styles.previewFooterText,
                { color: draft.textColor ?? theme.text },
              ]}
            >
              POWERED BY MAKAZII
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.outlineButton, (saving || previewLoading) && styles.disabledButton]}
          onPress={saveAndPreview}
          disabled={saving || previewLoading || publishing}
        >
          {previewLoading || saving
            ? <ActivityIndicator color={C.lime} />
            : <Eye size={17} color={C.lime} />}
          <Text style={styles.outlineButtonText}>
            {previewLoading ? 'Loading preview...' : saving ? 'Saving draft...' : 'Save draft'}
          </Text>
        </Pressable>

        {!!previewMessage && (
          <View style={styles.successMessage}>
            <Check size={15} color={C.green} />
            <Text style={styles.successMessageText}>{previewMessage}</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.publishCard}>
          <View style={styles.publishIcon}>
            <Upload size={19} color={C.lime} />
          </View>
          <Text style={styles.publishTitle}>Ready to go live?</Text>
          <Text style={styles.publishDescription}>
            Publishing replaces the current public storefront snapshot with your latest saved design.
          </Text>

          {publishedAt ? (
            <Text style={styles.publishedStatus}>
              Previously published: {new Date(publishedAt).toLocaleDateString()}
            </Text>
          ) : (
            <Text style={styles.unpublishedStatus}>This storefront has not been published yet.</Text>
          )}

          <Pressable
            style={[styles.publishButton, (publishing || saving) && styles.disabledButton]}
            onPress={publish}
            disabled={publishing || saving}
          >
            {publishing
              ? <ActivityIndicator color={C.background} />
              : <Upload size={17} color={C.background} />}
            <Text style={styles.publishButtonText}>
              {publishing ? 'Publishing...' : 'Publish storefront'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Check size={14} color={C.green} />
          <Text style={styles.footerText}>
            Your storefront appearance does not change your business operations, membership permissions or tenant data boundaries.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  header: {
    minHeight: 67,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  headerTitle: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 3 },
  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 58,
  },
  intro: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: '#30393B',
    borderRadius: 26,
    padding: 21,
    marginBottom: 30,
  },
  introTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  introIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#242D2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#242B1B',
  },
  draftDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: C.lime },
  draftPillText: { color: C.lime, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  introTitle: {
    color: C.white,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
    marginTop: 21,
  },
  introDescription: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: C.white, fontSize: 15, fontWeight: '900' },
  sectionDescription: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 31,
  },
  themeCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#171E20',
    borderWidth: 1,
    borderColor: '#30393B',
    borderRadius: 19,
    overflow: 'hidden',
  },
  themeCardSelected: { borderColor: C.lime, borderWidth: 2 },
  themeSample: {
    height: 105,
    padding: 13,
  },
  themeSampleTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  themeSampleLogo: { width: 15, height: 15, borderRadius: 5 },
  themeSampleLine: { width: 43, height: 5, borderRadius: 3, opacity: 0.8 },
  themeSampleHero: { height: 27, borderRadius: 6, marginTop: 8 },
  themeSampleBottom: { flexDirection: 'row', gap: 5, marginTop: 7 },
  themeSampleSmall: { width: 20, height: 8, borderRadius: 3 },
  themeInfo: {
    padding: 13,
  },
  themeNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeName: { color: C.white, fontSize: 12, fontWeight: '900' },
  themeDescription: { color: C.muted, fontSize: 9, marginTop: 4 },
  layoutList: {
    gap: 11,
    marginBottom: 31,
  },
  layoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#171E20',
    borderWidth: 1,
    borderColor: '#30393B',
    borderRadius: 18,
    padding: 14,
  },
  layoutCardSelected: {
    borderColor: C.lime,
    borderWidth: 1.5,
    backgroundColor: '#D7FF5F12',
  },
  layoutSelectedLabel: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
  },
  layoutVisual: {
    width: 76,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#242D2F',
    padding: 8,
    overflow: 'hidden',
  },
  layoutClassicHeader: { height: 8, borderRadius: 3, backgroundColor: '#778184' },
  layoutClassicBody: { flexDirection: 'row', gap: 5, marginTop: 6 },
  layoutClassicImage: { width: 25, height: 34, borderRadius: 3, backgroundColor: '#7F9290' },
  layoutClassicLines: { flex: 1, gap: 5, paddingTop: 2 },
  layoutGridVisual: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  layoutFeaturedHero: { height: 29, borderRadius: 4, backgroundColor: '#899A70' },
  layoutFeaturedLines: { gap: 5, marginTop: 6 },
  layoutCopy: { flex: 1 },
  layoutName: { color: C.white, fontSize: 12, fontWeight: '900' },
  layoutDescription: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.lime },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.lime },
  colourCard: {
    backgroundColor: '#171E20',
    borderWidth: 1,
    borderColor: '#30393B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
  },
  colourRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  colourLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  colourSwatch: { width: 19, height: 19, borderRadius: 6, borderWidth: 1, borderColor: '#586164' },
  colourLabel: { color: C.white, fontSize: 11, fontWeight: '700' },
  colourInput: {
    width: 94,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.white,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '800',
  },
  colourHint: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 10 },
  brandAssetsCard: {
    backgroundColor: '#171E20',
    borderWidth: 1,
    borderColor: '#30393B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
  },
  brandAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  brandAssetPreview: {
    width: 76,
    height: 76,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#242D2F',
    borderWidth: 1,
    borderColor: '#394446',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImage: { width: '100%', height: '100%' },
  brandAssetCopy: { flex: 1 },
  brandAssetTitle: { color: C.white, fontSize: 11, fontWeight: '900' },
  brandAssetDescription: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  brandAssetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 10,
  },
  brandAssetButton: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  brandAssetButtonText: { color: C.background, fontSize: 9, fontWeight: '900' },
  brandAssetRemove: { paddingVertical: 7, paddingHorizontal: 3 },
  brandAssetRemoveText: { color: C.danger, fontSize: 9, fontWeight: '800' },
  brandAssetDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },
  bannerAssetPreview: {
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#242D2F',
    borderWidth: 1,
    borderColor: '#394446',
    marginBottom: 13,
  },
  bannerAssetImage: { width: '100%', height: '100%' },
  bannerAssetPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  bannerAssetPlaceholderText: { color: C.muted, fontSize: 9 },
  previewLogoImage: { width: '100%', height: '100%', borderRadius: 12 },
  previewHeroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.34,
  },
  previewFrame: {
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#394446',
    marginBottom: 16,
    backgroundColor: '#101617',
  },
  previewBrowserBar: {
    minHeight: 39,
    backgroundColor: '#252B2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 7,
  },
  browserDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  browserDotOne: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#FF7777' },
  browserDotTwo: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#F5C96B' },
  browserDotThree: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#76D99A' },
  previewBrowserLabel: {
    color: '#AAB2B4',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  previewLiveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.lime },
  previewLiveText: { color: '#D7FF5F', fontSize: 6, fontWeight: '900' },
  previewContent: {
    padding: 16,
  },
  previewBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 47,
  },
  previewLogo: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBrandCopy: { flex: 1 },
  previewBrandName: { fontSize: 13, fontWeight: '900' },
  previewBrandCaption: {
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 0.9,
    opacity: 0.55,
    marginTop: 3,
  },
  previewMenuButton: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  previewMenuText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  previewNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginTop: 9,
    marginBottom: 13,
    gap: 18,
  },
  previewNavItem: { paddingVertical: 9 },
  previewNavText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  previewHero: {
    minHeight: 195,
    borderRadius: 18,
    padding: 19,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  previewHeroContent: { zIndex: 1, maxWidth: '88%' },
  previewTag: { fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  previewHeadline: { fontSize: 22, lineHeight: 27, fontWeight: '900', marginTop: 10 },
  previewHeroDescription: { fontSize: 9, lineHeight: 15, marginTop: 7, opacity: 0.8 },
  previewAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 7,
    marginTop: 14,
  },
  previewActionText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  previewHeroDecoration: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 70,
    borderWidth: 19,
    right: -39,
    bottom: -46,
  },
  previewWelcome: {
    marginTop: 26,
    marginBottom: 25,
  },
  previewEyebrow: { fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  previewSectionTitle: { fontSize: 15, fontWeight: '900', marginTop: 5 },
  previewDescription: { fontSize: 9, lineHeight: 16, marginTop: 7, opacity: 0.76 },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 11,
    gap: 8,
  },
  previewSectionHeadingCopy: { flex: 1 },
  previewSmallLink: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5, paddingBottom: 3 },
  previewSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
    marginBottom: 17,
  },
  previewSearchField: {
    flex: 1,
    minHeight: 39,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewSearchIcon: { fontSize: 19, fontWeight: '700' },
  previewSearchText: { fontSize: 8, opacity: 0.6 },
  previewBag: {
    width: 42,
    height: 39,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBagText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  previewCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewCategoryGridClassic: {
    flexDirection: 'column',
  },
  previewCategoryGridGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewCategoryTile: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 104,
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
  },
  previewCategoryTileClassic: {
    width: '100%',
    flexBasis: '100%',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewCategoryTileGrid: {
    width: '31%',
    flexGrow: 0,
    flexBasis: '31%',
    minHeight: 78,
    padding: 7,
    borderRadius: 9,
  },
  previewCategoryIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  previewCategoryIconText: { fontSize: 17, fontWeight: '800' },
  previewCategoryName: { fontSize: 9, fontWeight: '900' },
  previewCategoryMeta: { fontSize: 7, opacity: 0.6, marginTop: 4 },
  previewDisclaimer: {
    color: '#899395',
    fontSize: 7,
    lineHeight: 12,
    marginTop: 9,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  previewFeaturedCard: {
    borderWidth: 1,
    borderRadius: 17,
    overflow: 'hidden',
    marginBottom: 13,
  },
  previewFeaturedImage: {
    minHeight: 155,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewFeaturedDetails: { padding: 13 },
  previewFeaturedTitle: { fontSize: 13, lineHeight: 18, fontWeight: '900', marginTop: 6 },
  previewFeaturedDescription: { fontSize: 8, lineHeight: 14, marginTop: 6, opacity: 0.72 },
  previewFeaturedPrice: { fontSize: 9, fontWeight: '900', marginTop: 10 },
  previewProducts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    marginTop: 5,
  },
  previewProductsClassic: {
    flexDirection: 'column',
  },
  previewProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  previewProduct: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  previewProductClassic: {
    width: '100%',
    flexBasis: '100%',
    flexDirection: 'row',
  },
  previewProductGrid: {
    width: '48%',
    flexGrow: 0,
    flexBasis: '48%',
    borderRadius: 9,
  },
  previewProductImage: {
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  previewProductImageClassic: {
    width: '34%',
    minHeight: 112,
  },
  previewProductImageGrid: {
    minHeight: 88,
  },
  previewImageLabel: {
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  previewProductDetails: {
    padding: 11,
  },
  previewProductDetailsClassic: {
    flex: 1,
    justifyContent: 'center',
  },
  previewProductCategory: { fontSize: 6, fontWeight: '900', letterSpacing: 0.7 },
  previewProductName: { fontSize: 9, lineHeight: 13, fontWeight: '900', marginTop: 5 },
  previewProductDescription: { fontSize: 7, lineHeight: 12, marginTop: 5, opacity: 0.72 },
  previewProductBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  previewProductPrice: { fontSize: 8, fontWeight: '900' },
  previewProductAdd: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewProductAddText: { fontSize: 17, lineHeight: 20, fontWeight: '700' },
  previewInfoCard: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginTop: 19,
  },
  previewInfoRow: {
    borderTopWidth: 1,
    borderTopColor: '#80808025',
    paddingTop: 9,
    marginTop: 9,
  },
  previewInfoLabel: { fontSize: 6, fontWeight: '900', letterSpacing: 0.8, opacity: 0.6 },
  previewInfoValue: { fontSize: 9, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  previewFooter: {
    paddingHorizontal: 13,
    paddingVertical: 17,
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 6,
  },
  previewFooterBrand: { fontSize: 11, fontWeight: '900' },
  previewFooterText: { fontSize: 6, fontWeight: '900', letterSpacing: 0.9, opacity: 0.65 },
  outlineButton: {
    minHeight: 49,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#66743A',
    backgroundColor: '#171D12',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  outlineButtonText: { color: C.lime, fontSize: 10, fontWeight: '900' },
  successMessage: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  successMessageText: { flex: 1, color: C.green, fontSize: 10, lineHeight: 16 },
  errorBox: { backgroundColor: '#2B1718', borderWidth: 1, borderColor: '#633034', borderRadius: 12, padding: 12, marginTop: 13 },
  errorText: { color: C.danger, fontSize: 10, lineHeight: 16 },
  publishCard: {
    backgroundColor: '#171E20',
    borderWidth: 1,
    borderColor: '#46502B',
    borderRadius: 23,
    padding: 20,
    marginTop: 30,
  },
  publishIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  publishTitle: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 13 },
  publishDescription: { color: C.muted, fontSize: 10, lineHeight: 17, marginTop: 6 },
  publishedStatus: { color: C.green, fontSize: 9, fontWeight: '800', marginTop: 13 },
  unpublishedStatus: { color: C.amber, fontSize: 9, fontWeight: '800', marginTop: 13 },
  publishButton: {
    minHeight: 53,
    borderRadius: 16,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 18,
  },
  publishButtonText: { color: C.background, fontSize: 11, fontWeight: '900' },
  disabledButton: { opacity: 0.6 },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 23, paddingHorizontal: 3 },
  footerText: { flex: 1, color: C.muted, fontSize: 9, lineHeight: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 27 },
  loadingTitle: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  mutedText: { color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  primaryButton: {
    minHeight: 47,
    paddingHorizontal: 22,
    borderRadius: 13,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonText: { color: C.background, fontSize: 11, fontWeight: '900' },
  backLink: { padding: 14 },
  linkText: { color: C.lime, fontSize: 11, fontWeight: '800' },
});
