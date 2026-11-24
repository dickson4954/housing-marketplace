import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Check, ChevronDown, CirclePlus, Clock3, ImagePlus,
  Package, Pencil, Plus, RefreshCw, Search, ShoppingBag, SlidersHorizontal,
  Trash2, TrendingUp, Upload, X,
} from 'lucide-react-native';
import { API_BASE_URL } from '@/config/api';
import {
  archiveBusinessCatalogueItem,
  createBusinessCatalogueCategory,
  createBusinessCatalogueItem,
  createBusinessCatalogueVariant,
  updateBusinessCatalogueVariant,
  deactivateBusinessCatalogueVariant,
  getBusinessCatalogue,
  getBusinessSetup,
  type BusinessSetupResponse,
  getBusinessInventoryMovements,
  publishBusinessCatalogueItem,
  adjustBusinessCatalogueInventory,
  removeBusinessCatalogueCategoryImage,
  removeBusinessCatalogueItemImage,
  updateBusinessCatalogueCategory,
  updateBusinessCatalogueItem,
  uploadBusinessCatalogueCategoryImage,
  uploadBusinessCatalogueItemImages,
  type BusinessCatalogueCategory,
  type BusinessCatalogueItem,
  type BusinessCatalogueVariant,
  type BusinessInventoryMovement,
  type BusinessIdImage,
} from '@/lib/businessOwnerApi';
import { getBusinessCatalogueConfig } from '@/lib/businessCatalogueConfig';

const C = {
  bg: '#0B0F10', card: '#14191B', soft: '#181E20', lime: '#D7FF5F',
  white: '#FFFFFF', muted: '#9CA5A7', border: '#252C2E',
  green: '#73D99A', red: '#FF6B6B', amber: '#F4C66A',
};

type Filter = 'ALL' | 'PRODUCT' | 'SERVICE' | 'MENU_ITEM';

function formatJsonField(value: unknown): string {
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

function parseOptionalJsonObject(
  value: string,
  label: string,
): Record<string, unknown> | null {
  if (!value.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} must contain valid JSON.`);
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    throw new Error(`${label} must be a JSON object using key-value pairs.`);
  }

  return parsed as Record<string, unknown>;
}

function getCatalogueStockSummary(item: BusinessCatalogueItem): {
  label: string;
  tone: 'out' | 'low' | 'good';
} | null {
  const threshold = Math.max(0, item.lowStockThreshold ?? 0);
  const trackedVariants = (item.variants ?? []).filter(
    (variant) => variant.isActive !== false && variant.trackInventory === true,
  );

  if (trackedVariants.length > 0) {
    const outOfStock = trackedVariants.filter(
      (variant) => (variant.stockQuantity ?? 0) <= 0,
    ).length;
    const lowStock = trackedVariants.filter((variant) => {
      const quantity = variant.stockQuantity ?? 0;
      return quantity > 0 && quantity <= threshold;
    }).length;

    if (outOfStock > 0) {
      return {
        label: `${outOfStock} variant${outOfStock === 1 ? '' : 's'} out of stock`,
        tone: 'out',
      };
    }
    if (lowStock > 0) {
      return {
        label: `${lowStock} variant${lowStock === 1 ? '' : 's'} low on stock`,
        tone: 'low',
      };
    }
    return {
      label: `${trackedVariants.length} tracked variant${trackedVariants.length === 1 ? '' : 's'} in stock`,
      tone: 'good',
    };
  }

  if (item.trackInventory !== true) return null;

  const quantity = item.stockQuantity ?? 0;
  if (quantity <= 0) return { label: 'Out of stock', tone: 'out' };
  if (quantity <= threshold) return { label: 'Low stock', tone: 'low' };
  return { label: 'In stock', tone: 'good' };
}

function money(value?: number | null, currency = 'KES') {
  if (value == null) return 'Price not set';

  const code = (currency || 'KES').trim().toUpperCase() || 'KES';
  const amount = Number(value);

  if (!Number.isFinite(amount)) return 'Price unavailable';

  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString('en-KE')}`;
  }
}

function hasActiveTrackedVariantInventory(item: BusinessCatalogueItem): boolean {
  return (item.variants ?? []).some(
    (variant) => variant.isActive !== false && variant.trackInventory === true,
  );
}

function publicImage(path: string) {
  return `${API_BASE_URL}${path}`;
}

function imageAsset(asset: ImagePicker.ImagePickerAsset): BusinessIdImage {
  return {
    uri: asset.uri,
    name: asset.fileName || undefined,
    mimeType: asset.mimeType || 'image/jpeg',
    file: asset.file || undefined,
  };
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric'; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#697477"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

function Action({
  label, onPress, secondary, danger, disabled, icon,
}: {
  label: string; onPress: () => void; secondary?: boolean;
  danger?: boolean; disabled?: boolean; icon?: React.ReactNode;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        secondary && styles.actionSecondary,
        danger && styles.actionDanger,
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon}
      <Text style={[styles.actionText, secondary && { color: C.lime }, danger && { color: C.red }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function BusinessCatalogueScreen() {
  const params = useLocalSearchParams<{ businessId: string | string[] }>();
  const businessId = Array.isArray(params.businessId) ? params.businessId[0] : params.businessId;

  const [categories, setCategories] = useState<BusinessCatalogueCategory[]>([]);
  const [items, setItems] = useState<BusinessCatalogueItem[]>([]);
  const [businessSetup, setBusinessSetup] = useState<BusinessSetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<BusinessCatalogueItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<Filter>('PRODUCT');
  const [itemCategory, setItemCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [specificationsText, setSpecificationsText] = useState('');
  const [attributesText, setAttributesText] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [duration, setDuration] = useState('');
  const [preparation, setPreparation] = useState('');
  const [stock, setStock] = useState('0');
  const [lowStock, setLowStock] = useState('5');
  const [trackInventory, setTrackInventory] = useState(false);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [bookable, setBookable] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [selectedImages, setSelectedImages] = useState<BusinessIdImage[]>([]);
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantOptionsText, setVariantOptionsText] = useState('');
  const [variantTrackInventory, setVariantTrackInventory] = useState(false);
  const [variantAllowBackorder, setVariantAllowBackorder] = useState(false);
  const [editingVariant, setEditingVariant] = useState<BusinessCatalogueVariant | null>(null);
  const [editingVariantItemId, setEditingVariantItemId] = useState<string | null>(null);
  const [stockItem, setStockItem] = useState<BusinessCatalogueItem | null>(null);
  const [stockVariant, setStockVariant] = useState<BusinessCatalogueVariant | null>(null);
  const [stockVariantItemId, setStockVariantItemId] = useState<string | null>(null);
  const [stockChange, setStockChange] = useState('');
  const [stockReason, setStockReason] = useState('RESTOCK');
  const [stockNote, setStockNote] = useState('');
  const [historyItem, setHistoryItem] = useState<BusinessCatalogueItem | null>(null);
  const [historyVariant, setHistoryVariant] = useState<BusinessCatalogueVariant | null>(null);
  const [movements, setMovements] = useState<BusinessInventoryMovement[]>([]);

  const load = useCallback(async (quiet = false) => {
    if (!businessId) {
      setError('The business workspace could not be identified.');
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    setError('');
    try {
      const result = await getBusinessCatalogue(businessId);
      setCategories(result.categories || []);
      setItems(result.items || []);

      // Classification is supplementary: a setup request failure must not
      // prevent the existing catalogue from loading.
      try {
        const setup = await getBusinessSetup(businessId);
        setBusinessSetup(setup);
      } catch {
        // Retain the last successfully loaded classification.
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the catalogue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  const catalogueConfig = useMemo(
    () => getBusinessCatalogueConfig(businessSetup?.business),
    [businessSetup],
  );

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesType = filter === 'ALL' || item.type === filter;
    const matchesCategory = categoryFilter === 'ALL' || item.categoryId === categoryFilter;
    const term = search.trim().toLowerCase();
    const searchableText = [
      item.name,
      item.sku,
      item.shortDescription,
      item.description,
      JSON.stringify(item.specifications ?? {}) || '',
      JSON.stringify(item.attributes ?? {}) || '',
      ...(item.variants || []).flatMap((variant) => [
        variant.name,
        variant.sku,
        JSON.stringify(variant.options ?? {}) || '',
      ]),
    ].join(' ').toLowerCase();

    const matchesSearch = !term || searchableText.includes(term);
    return matchesType && matchesCategory && matchesSearch;
  }), [items, filter, categoryFilter, search]);

  function resetItemForm(item?: BusinessCatalogueItem) {
    setEditingVariant(null);
    setEditingVariantItemId(null);
    setVariantName('');
    setVariantPrice('');
    setVariantSku('');
    setVariantOptionsText('');
    setEditingItem(item || null);
    setItemName(item?.name || '');
    setItemType(item?.type || catalogueConfig.defaultType);
    setItemCategory(item?.categoryId || '');
    setShortDescription(item?.shortDescription || '');
    setDescription(item?.description || '');
    setSpecificationsText(formatJsonField(item?.specifications));
    setAttributesText(formatJsonField(item?.attributes));
    setSku(item?.sku || '');
    setPrice(item?.priceAmount != null ? String(item.priceAmount) : '');
    setComparePrice(item?.compareAtPriceAmount != null ? String(item.compareAtPriceAmount) : '');
    setDuration(item?.durationMinutes != null ? String(item.durationMinutes) : '');
    setPreparation(item?.preparationMinutes != null ? String(item.preparationMinutes) : '');
    setStock(String(item?.stockQuantity || 0));
    setLowStock(String(item?.lowStockThreshold ?? 5));
    setTrackInventory(Boolean(item?.trackInventory));
    setAllowBackorder(Boolean(item?.allowBackorder));
    setBookable(Boolean(item?.isBookable));
    setFeatured(Boolean(item?.isFeatured));
    setSelectedImages([]);
    setShowItemForm(true);
  }

  async function pickImages(maximum: number) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo-library access to add catalogue images.');
      return [];
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: maximum > 1,
      selectionLimit: maximum,
      quality: 0.85,
    });
    if (result.canceled) return [];
    return result.assets.map(imageAsset);
  }

  async function saveCategory() {
    if (!businessId || !categoryName.trim()) {
      Alert.alert('Category name required', 'Enter a name for this category.');
      return;
    }
    setBusy(true);
    try {
      if (editingCategory) {
        await updateBusinessCatalogueCategory(businessId, editingCategory, {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
        });
      } else {
        await createBusinessCatalogueCategory(businessId, {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
          displayOrder: categories.length,
        });
      }
      setCategoryName('');
      setCategoryDescription('');
      setEditingCategory(null);
      setShowCategoryForm(false);
      await load(true);
    } catch (e) {
      Alert.alert('Could not save category', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function chooseCategoryImage(category: BusinessCatalogueCategory) {
    if (!businessId) return;
    const images = await pickImages(1);
    if (!images.length) return;
    setBusy(true);
    try {
      await uploadBusinessCatalogueCategoryImage(businessId, category.id, images[0]);
      Alert.alert('Image uploaded', 'The category image has been saved.');
      await load(true);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function removeCategoryImage(category: BusinessCatalogueCategory) {
    if (!businessId || !category.imageStorageKey) return;
    Alert.alert('Remove category image?', `Remove the image for ${category.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeBusinessCatalogueCategoryImage(businessId, category.id);
            await load(true);
          } catch (e) {
            Alert.alert('Could not remove image', e instanceof Error ? e.message : 'Try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  async function saveItem() {
    if (!businessId || !itemName.trim()) {
      Alert.alert('Item name required', 'Enter a product, service or menu-item name.');
      return;
    }

    const validOptionalInteger = (value: string, minimum = 0) =>
      !value.trim() || (Number.isInteger(Number(value)) && Number(value) >= minimum);

    if (!validOptionalInteger(price) ||
        !validOptionalInteger(comparePrice) ||
        !validOptionalInteger(duration, 1) ||
        !validOptionalInteger(preparation, 1) ||
        !validOptionalInteger(lowStock)) {
      Alert.alert(
        'Check numeric fields',
        'Prices and low-stock threshold must be whole numbers of zero or more. Duration and preparation time must be positive whole numbers.',
      );
      return;
    }

    if (comparePrice.trim() && price.trim() && Number(comparePrice) < Number(price)) {
      Alert.alert('Invalid compare-at price', 'Compare-at price should not be lower than the selling price.');
      return;
    }

    if (!editingItem && trackInventory &&
        (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      Alert.alert('Invalid opening stock', 'Enter a whole-number quantity of zero or more.');
      return;
    }

    let specifications: Record<string, unknown> | null;
    let attributes: Record<string, unknown> | null;

    try {
      specifications = parseOptionalJsonObject(
        specificationsText,
        'Specifications',
      );
      attributes = parseOptionalJsonObject(attributesText, 'Attributes');
    } catch (e) {
      Alert.alert(
        'Check item details',
        e instanceof Error ? e.message : 'Check the JSON fields and try again.',
      );
      return;
    }

    const isNewItem = !editingItem;
    setBusy(true);

    try {
      const payload: Record<string, unknown> = {
        name: itemName.trim(),
        type: itemType,
        categoryId: itemCategory || null,
        shortDescription: shortDescription.trim() || null,
        description: description.trim() || null,
        specifications,
        attributes,
        sku: sku.trim() || null,
        currency: 'KES',
        priceAmount: price.trim() ? Number(price) : 0,
        compareAtPriceAmount: comparePrice.trim() ? Number(comparePrice) : null,
        durationMinutes: duration.trim() ? Number(duration) : null,
        preparationMinutes: preparation.trim() ? Number(preparation) : null,
        lowStockThreshold: lowStock.trim() ? Number(lowStock) : 0,
        trackInventory,
        allowBackorder,
        isBookable: bookable,
        isFeatured: featured,
      };

      let saved: BusinessCatalogueItem;
      if (editingItem) {
        saved = await updateBusinessCatalogueItem(businessId, editingItem.id, payload);
      } else {
        saved = await createBusinessCatalogueItem(businessId, payload);
      }

      // Retain the server-created ID immediately. A retry now updates this item
      // instead of creating another one if a later operation fails.
      setEditingItem(saved);

      if (isNewItem && trackInventory && Number(stock) > 0) {
        try {
          await adjustBusinessCatalogueInventory(businessId, saved.id, {
            quantityChange: Number(stock),
            reason: 'OPENING_STOCK',
            note: 'Opening stock',
          });
        } catch (stockError) {
          await load(true);
          Alert.alert(
            'Item saved; stock needs attention',
            `The item was created successfully, but opening stock was not recorded. Close this form and use Adjust stock on the item. ${stockError instanceof Error ? stockError.message : ''}`,
          );
          return;
        }
      }

      let uploadedCount = 0;
      const existingCount = saved.images?.length ?? editingItem?.images?.length ?? 0;
      const remaining = Math.max(0, 20 - existingCount);
      if (selectedImages.length > remaining) {
        Alert.alert('Image limit reached', `This item can have a maximum of 20 images. You can add ${remaining} more.`);
        await load(true);
        return;
      }

      for (let i = 0; i < selectedImages.length; i += 8) {
        const batch = selectedImages.slice(i, i + 8);
        await uploadBusinessCatalogueItemImages(businessId, saved.id, batch);
        uploadedCount += batch.length;
        setSelectedImages((current) => current.slice(batch.length));
      }

      setShowItemForm(false);
      setSelectedImages([]);
      setEditingItem(null);
      await load(true);
      Alert.alert(
        isNewItem ? 'Draft created' : 'Item updated',
        isNewItem
          ? 'Your item is saved as a draft. Publish it when it is ready.'
          : 'Your catalogue changes have been saved.',
      );
    } catch (e) {
      await load(true);
      Alert.alert(
        'Item saved with unfinished changes',
        `${e instanceof Error ? e.message : 'A later save step failed.'} Your item remains saved. Retry to finish uploading any remaining photos; it will update the existing item.`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function publishItem(item: BusinessCatalogueItem) {
    if (!businessId) return;
    Alert.alert('Publish catalogue item?', `${item.name} will become published in your catalogue.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: async () => {
        setBusy(true);
        try {
          await publishBusinessCatalogueItem(businessId, item.id);
          await load(true);
        } catch (e) {
          Alert.alert('Could not publish', e instanceof Error ? e.message : 'Try again.');
        } finally { setBusy(false); }
      }},
    ]);
  }

  async function archiveItem(item: BusinessCatalogueItem) {
    if (!businessId) return;
    Alert.alert(
      'Archive item?',
      `${item.name} will be archived in your catalogue. The currently published storefront may still show it until you publish the updated storefront.`,
      [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          await archiveBusinessCatalogueItem(businessId, item.id);
          await load(true);
        } catch (e) {
          Alert.alert('Could not archive', e instanceof Error ? e.message : 'Try again.');
        } finally { setBusy(false); }
      }},
    ]);
  }

  async function addVariant(item: BusinessCatalogueItem) {
    if (!businessId || !variantName.trim()) {
      Alert.alert('Variant name required', 'Enter a variant name first.');
      return;
    }
    if (variantPrice.trim() &&
        (!Number.isInteger(Number(variantPrice)) || Number(variantPrice) < 0)) {
      Alert.alert('Invalid variant price', 'Enter a whole-number price in KES.');
      return;
    }
    if (editingVariant && editingVariantItemId !== item.id) {
      Alert.alert('Select the correct item', 'This variant belongs to a different catalogue item.');
      return;
    }

    setBusy(true);
    try {
      const options = parseOptionalJsonObject(
        variantOptionsText,
        'Variant options',
      );

      const payload = {
        name: variantName.trim(),
        sku: variantSku.trim() || null,
        options,
        priceAmount: variantPrice.trim() ? Number(variantPrice) : null,
        displayOrder: editingVariant?.displayOrder ?? (item.variants?.length || 0),
        trackInventory: variantTrackInventory,
        allowBackorder: variantAllowBackorder,
        isActive: editingVariant?.isActive ?? true,
      };

      if (editingVariant) {
        await updateBusinessCatalogueVariant(
          businessId, item.id, editingVariant.id, payload,
        );
      } else {
        await createBusinessCatalogueVariant(businessId, item.id, payload);
      }

      const savedName = variantName.trim();
      setVariantName('');
      setVariantPrice('');
      setVariantSku('');
      setVariantOptionsText('');
      setVariantTrackInventory(false);
      setVariantAllowBackorder(false);
      setEditingVariant(null);
      setEditingVariantItemId(null);
      await load(true);
      Alert.alert(
        editingVariant ? 'Variant updated' : 'Variant added',
        `${savedName} · ${item.name}`,
      );
    } catch (e) {
      Alert.alert('Could not save variant', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function setVariantActive(
    item: BusinessCatalogueItem,
    variant: BusinessCatalogueVariant,
    nextActive: boolean,
  ) {
    if (!businessId) return;
    Alert.alert(
      nextActive ? 'Reactivate variant?' : 'Deactivate variant?',
      `${variant.name} will ${nextActive ? 'be available again' : 'no longer be available'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Reactivate' : 'Deactivate',
          style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              if (nextActive) {
                await updateBusinessCatalogueVariant(
                  businessId, item.id, variant.id, { isActive: true },
                );
              } else {
                await deactivateBusinessCatalogueVariant(businessId, item.id, variant.id);
              }
              if (editingVariant?.id === variant.id) {
                setEditingVariant(null);
                setEditingVariantItemId(null);
                setVariantName('');
                setVariantPrice('');
              }
              await load(true);
            } catch (e) {
              Alert.alert('Could not update variant', e instanceof Error ? e.message : 'Try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  async function toggleCategoryActive(category: BusinessCatalogueCategory) {
    if (!businessId) return;
    const nextActive = category.isActive === false;
    Alert.alert(
      nextActive ? 'Activate category?' : 'Deactivate category?',
      nextActive
        ? `${category.name} will be available for catalogue organisation.`
        : `${category.name} will be hidden from active catalogue categories.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Activate' : 'Deactivate',
          onPress: async () => {
            setBusy(true);
            try {
              await updateBusinessCatalogueCategory(businessId, category.id, {
                isActive: nextActive,
              });
              if (!nextActive && categoryFilter === category.id) {
                setCategoryFilter('ALL');
              }
              await load(true);
            } catch (e) {
              Alert.alert('Could not update category', e instanceof Error ? e.message : 'Try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  async function adjustStock(
    item: BusinessCatalogueItem,
    variant?: BusinessCatalogueVariant,
  ) {
    if (!businessId) return;

    if (variant && !variant.trackInventory) {
      Alert.alert('Inventory tracking is off', 'Enable tracking in the variant editor before adjusting its stock.');
      return;
    }

    const change = Number(stockChange);
    if (!Number.isInteger(change) || change === 0) {
      Alert.alert('Invalid adjustment', 'Enter a non-zero whole-number quantity. Use a minus sign to reduce stock.');
      return;
    }

    setBusy(true);
    try {
      await adjustBusinessCatalogueInventory(businessId, item.id, {
        quantityChange: change,
        reason: stockReason,
        note: stockNote.trim() || undefined,
        ...(variant ? { variantId: variant.id } : {}),
      });

      setStockChange('');
      setStockNote('');
      setStockItem(null);
      setStockVariant(null);
      setStockVariantItemId(null);
      await load(true);
      Alert.alert('Stock updated', `${variant ? `${variant.name} · ` : ''}The inventory movement has been recorded.`);
    } catch (e) {
      Alert.alert('Stock adjustment failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function showHistory(
    item: BusinessCatalogueItem,
    variant?: BusinessCatalogueVariant,
  ) {
    if (!businessId) return;

    setHistoryItem(item);
    setHistoryVariant(variant ?? null);
    setBusy(true);

    try {
      const allMovements = await getBusinessInventoryMovements(businessId, item.id);
      setMovements(
        variant
          ? allMovements.filter((movement) => movement.variantId === variant.id)
          : allMovements,
      );
    } catch (e) {
      setMovements([]);
      Alert.alert('History unavailable', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function removeItemImage(item: BusinessCatalogueItem, imageId: string) {
    if (!businessId) return;
    Alert.alert('Remove image?', 'This removes the image from this catalogue item.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          await removeBusinessCatalogueItemImage(businessId, item.id, imageId);
          await load(true);
        } catch (e) {
          Alert.alert('Could not remove image', e instanceof Error ? e.message : 'Try again.');
        } finally { setBusy(false); }
      }},
    ]);
  }

  const counts = {
    all: items.length,
    published: items.filter((item) => item.status === 'PUBLISHED').length,
    drafts: items.filter((item) => item.status === 'DRAFT').length,
    archived: items.filter((item) => item.status === 'ARCHIVED').length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={20} color={C.white} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>BUSINESS OPERATIONS</Text>
          <Text style={styles.title}>Catalogue</Text>
        </View>
        <Pressable style={styles.refresh} onPress={() => { setRefreshing(true); void load(true); }}>
          <RefreshCw size={18} color={C.lime} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} tintColor={C.lime} />}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}><ShoppingBag size={23} color={C.lime} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Your products & services</Text>
            <Text style={styles.muted}>Manage what customers can discover in your business catalogue.</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{counts.all}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{counts.published}</Text>
            <Text style={styles.statLabel}>PUBLISHED</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{counts.drafts}</Text>
            <Text style={styles.statLabel}>DRAFTS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{counts.archived}</Text>
            <Text style={styles.statLabel}>ARCHIVED</Text>
          </View>
        </View>

        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Action label="Try again" onPress={() => void load()} secondary /></View> : null}

        <View style={styles.sectionHead}>
          <View><Text style={styles.sectionTitle}>Categories</Text><Text style={styles.muted}>Organise your catalogue</Text></View>
          <Pressable style={styles.smallAdd} onPress={() => { setEditingCategory(null); setCategoryName(''); setCategoryDescription(''); setShowCategoryForm(!showCategoryForm); }}>
            <Plus size={16} color={C.bg} /><Text style={styles.smallAddText}>Add</Text>
          </Pressable>
        </View>

        {showCategoryForm && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{editingCategory ? 'Edit category' : 'New category'}</Text>
            <Field label="Category name" value={categoryName} onChangeText={setCategoryName} placeholder="e.g. Electronics" />
            <Field label="Description (optional)" value={categoryDescription} onChangeText={setCategoryDescription} placeholder="What belongs in this category?" multiline />
            <View style={styles.row}>
              <Action label="Cancel" secondary onPress={() => { setShowCategoryForm(false); setEditingCategory(null); }} />
              <Action label="Save category" onPress={() => void saveCategory()} disabled={busy} icon={<Check size={15} color={C.bg} />} />
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStrip}>
          <Pressable onPress={() => setCategoryFilter('ALL')} style={[styles.categoryChip, categoryFilter === 'ALL' && styles.chipActive]}>
            <Text style={[styles.categoryText, categoryFilter === 'ALL' && styles.chipTextActive]}>All categories</Text>
          </Pressable>
          {categories.filter((category) => category.isActive !== false).map((category) => (
            <Pressable key={category.id} onPress={() => setCategoryFilter(category.id)} style={[styles.categoryChip, categoryFilter === category.id && styles.chipActive]}>
              <Text style={[styles.categoryText, categoryFilter === category.id && styles.chipTextActive]}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {categories.length > 0 && (
          <View style={styles.categoryManageList}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryManageRow}>
                <View style={styles.categoryThumb}>
                  {category.imageStorageKey ? (
                    <Image
                      source={{ uri: publicImage(`/public/business-storefronts/images/categories/${category.id}`) }}
                      style={styles.categoryThumbImage}
                    />
                  ) : (
                    <Package size={17} color={C.lime} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryManageName}>{category.name}</Text>
                  <Text style={styles.muted}>{category.isActive === false ? 'Inactive' : 'Active category'}</Text>
                </View>
                <Pressable onPress={() => { setEditingCategory(category.id); setCategoryName(category.name); setCategoryDescription(category.description || ''); setShowCategoryForm(true); }}>
                  <Pencil size={17} color={C.lime} />
                </Pressable>
                <Pressable
                  onPress={() => void toggleCategoryActive(category)}
                  style={{ marginLeft: 12 }}
                  disabled={busy}
                >
                  <Text style={{ color: category.isActive === false ? C.green : C.amber, fontSize: 10, fontWeight: '800' }}>
                    {category.isActive === false ? 'ACTIVATE' : 'PAUSE'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void chooseCategoryImage(category)} style={{ marginLeft: 12 }} disabled={busy}>
                  <ImagePlus size={18} color={C.muted} />
                </Pressable>
                {category.imageStorageKey ? (
                  <Pressable onPress={() => void removeCategoryImage(category)} style={{ marginLeft: 8 }} disabled={busy}>
                    <Trash2 size={16} color={C.red} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHead}>
          <View><Text style={styles.sectionTitle}>Catalogue items</Text><Text style={styles.muted}>{visibleItems.length} matching items</Text></View>
          <Pressable style={styles.addItem} onPress={() => resetItemForm()}>
            <CirclePlus size={17} color={C.bg} /><Text style={styles.addItemText}>Add {catalogueConfig.itemSingular}</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={catalogueConfig.searchPlaceholder}
            placeholderTextColor="#697477"
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear catalogue search"
              hitSlop={10}
              style={styles.searchClear}
            >
              <X size={16} color={C.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
          {(['ALL', ...catalogueConfig.allowedTypes] as Filter[]).map((value) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterChip, filter === value && styles.chipActive]}>
              <Text style={[styles.categoryText, filter === value && styles.chipTextActive]}>
                {value === 'ALL' ? 'All' : catalogueConfig.typeLabels[value]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {showItemForm && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>
              {editingItem ? `Edit ${catalogueConfig.itemSingular}` : `Create ${catalogueConfig.itemSingular}`}
            </Text>
              <Pressable onPress={() => setShowItemForm(false)}><X size={20} color={C.muted} /></Pressable>
            </View>
            <Text style={styles.fieldLabel}>ITEM TYPE</Text>
            <View style={styles.typeRow}>
              {catalogueConfig.allowedTypes.map((type) => (
                <Pressable key={type} onPress={() => setItemType(type)} style={[styles.typeChip, itemType === type && styles.chipActive]}>
                  <Text style={[styles.typeText, itemType === type && styles.chipTextActive]}>
                    {catalogueConfig.typeLabels[type]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field label="Name *" value={itemName} onChangeText={setItemName} placeholder="Item name" />
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.categorySelect}>
              <Pressable
                onPress={() => {
                  const active = categories.filter((category) => category.isActive !== false);
                  if (!active.length) {
                    Alert.alert(
                      'No active categories',
                      'Create or activate a category first, or leave this item uncategorised.',
                    );
                    return;
                  }
                  setShowCategoryPicker((current) => !current);
                }}
                style={styles.categorySelectButton}
                accessibilityRole="button"
                accessibilityLabel="Choose catalogue category"
                accessibilityState={{ expanded: showCategoryPicker }}
              >
                <Text style={styles.categorySelectText}>
                  {categories.find((category) => category.id === itemCategory)?.name || 'Uncategorised'}
                </Text>
                <ChevronDown
                  size={17}
                  color={C.lime}
                  style={showCategoryPicker ? { transform: [{ rotate: '180deg' }] } : undefined}
                />
              </Pressable>
              {itemCategory ? (
                <Pressable
                  onPress={() => {
                    setItemCategory('');
                    setShowCategoryPicker(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear category"
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            {showCategoryPicker ? (
              <View style={styles.categoryPicker}>
                <Pressable
                  onPress={() => {
                    setItemCategory('');
                    setShowCategoryPicker(false);
                  }}
                  style={[
                    styles.categoryOption,
                    !itemCategory && styles.categoryOptionActive,
                  ]}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    !itemCategory && styles.categoryOptionTextActive,
                  ]}>
                    Uncategorised
                  </Text>
                  {!itemCategory ? <Check size={16} color={C.lime} /> : null}
                </Pressable>

                {categories
                  .filter((category) => category.isActive !== false)
                  .map((category) => {
                    const selected = itemCategory === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          setItemCategory(category.id);
                          setShowCategoryPicker(false);
                        }}
                        style={[
                          styles.categoryOption,
                          selected && styles.categoryOptionActive,
                        ]}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          selected && styles.categoryOptionTextActive,
                        ]}>
                          {category.name}
                        </Text>
                        {selected ? <Check size={16} color={C.lime} /> : null}
                      </Pressable>
                    );
                  })}
              </View>
            ) : null}
            <Field label="Short description" value={shortDescription} onChangeText={setShortDescription} placeholder="A quick summary" />
            <Field label="Full description" value={description} onChangeText={setDescription} placeholder="Details customers should know" multiline />
            <Field
              label="Specifications (JSON)"
              value={specificationsText}
              onChangeText={setSpecificationsText}
              placeholder={'{"material":"Cotton","weight":"500g","dimensions":"20 x 10 cm"}'}
              multiline
            />
            <Text style={styles.formHint}>
              Add details relevant to this offering, such as ingredients, materials, capacity, dimensions or technical specifications. Leave blank if not applicable.
            </Text>
            <Field
              label="Attributes (JSON)"
              value={attributesText}
              onChangeText={setAttributesText}
              placeholder={'{"colour":"Black","size":"Large","brand":"Example"}'}
              multiline
            />
            <Text style={styles.formHint}>
              Add structured characteristics such as colour, size, brand, model, condition or other searchable details.
            </Text>
            <Field label="SKU (optional)" value={sku} onChangeText={setSku} placeholder="Stock keeping unit" />
            <View style={styles.twoColumns}>
              <View style={{ flex: 1 }}><Field label="Price (KES)" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Field label="Compare-at price" value={comparePrice} onChangeText={setComparePrice} placeholder="Optional" keyboardType="numeric" /></View>
            </View>
            {itemType === 'SERVICE' && <Field label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="e.g. 60" keyboardType="numeric" />}
            {itemType === 'MENU_ITEM' && <Field label="Preparation time (minutes)" value={preparation} onChangeText={setPreparation} placeholder="e.g. 20" keyboardType="numeric" />}
            <Field label="Low-stock threshold" value={lowStock} onChangeText={setLowStock} keyboardType="numeric" />
            {[
              ['Track inventory', trackInventory, setTrackInventory],
              ['Allow backorders', allowBackorder, setAllowBackorder],
              ['Bookable service', bookable, setBookable],
              ['Featured item', featured, setFeatured],
            ].map(([label, value, setter]) => (
              <Pressable key={String(label)} style={styles.toggleRow} onPress={() => (setter as (v: boolean) => void)(!(value as boolean))}>
                <Text style={styles.toggleLabel}>{String(label)}</Text>
                <View style={[styles.toggle, value && styles.toggleOn]}><View style={[styles.toggleKnob, value && styles.toggleKnobOn]} /></View>
              </Pressable>
            ))}
            {trackInventory && !editingItem && (
              <Field label="Opening stock quantity" value={stock} onChangeText={setStock} keyboardType="numeric" />
            )}
            {trackInventory && editingItem ? (
              <Text style={styles.formHint}>Current stock: {editingItem.stockQuantity || 0}. Use Adjust stock on the item card to record stock changes.</Text>
            ) : null}
            <View style={styles.imagePickerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>ITEM PHOTOS</Text>
                <Text style={styles.muted}>{selectedImages.length} new photos selected · maximum 20 per item</Text>
              </View>
              <Action label="Choose photos" secondary onPress={async () => {
                const remaining = Math.max(0, 20 - (editingItem?.images?.length || 0) - selectedImages.length);
                if (!remaining) { Alert.alert('Image limit reached', 'An item can have up to 20 images.'); return; }
                const picked = await pickImages(Math.min(8, remaining));
                setSelectedImages((current) => [...current, ...picked].slice(0, 20));
              }} icon={<Upload size={15} color={C.lime} />} />
            </View>
            {selectedImages.length > 0 ? (
              <View style={styles.selectedImageGrid}>
                {selectedImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.selectedImageWrap}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <Pressable
                      style={styles.imageRemoveButton}
                      onPress={() => setSelectedImages((current) => current.filter((_, i) => i !== index))}
                    >
                      <X size={13} color={C.white} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.row}>
              <Action label="Cancel" secondary onPress={() => setShowItemForm(false)} />
              <Action label={busy ? 'Saving…' : 'Save draft'} onPress={() => void saveItem()} disabled={busy} icon={<Check size={15} color={C.bg} />} />
            </View>
            <Text style={styles.formHint}>New items are saved as drafts. Publishing is a separate action.</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.empty}><ActivityIndicator color={C.lime} size="large" /><Text style={styles.muted}>Loading your catalogue…</Text></View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.empty}>
            <Package size={32} color={C.muted} />
            <Text style={styles.emptyTitle}>No {catalogueConfig.itemPlural} found</Text>
            <Text style={styles.muted}>
              Add your first {catalogueConfig.itemSingular} to get started with {catalogueConfig.businessName}.
            </Text>
            <Action label="Create first item" onPress={() => resetItemForm()} />
          </View>
        ) : visibleItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemTop}>
              {item.images?.[0] ? (
                <Image source={{ uri: publicImage(`/public/business-storefronts/images/items/${item.images[0].id}`) }} style={styles.itemImage} />
              ) : <View style={styles.itemImagePlaceholder}><Package size={23} color={C.lime} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.muted}>
                  {item.category?.name || 'Uncategorised'} · {catalogueConfig.typeLabels[item.type]}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>{money(item.priceAmount, item.currency)}</Text>
                  {item.compareAtPriceAmount != null &&
                  item.compareAtPriceAmount > (item.priceAmount ?? 0) ? (
                    <Text style={styles.comparePrice}>
                      {money(item.compareAtPriceAmount, item.currency)}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[styles.statusPill, item.status === 'PUBLISHED' && styles.statusPublished, item.status === 'ARCHIVED' && styles.statusArchived]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            {item.images?.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemImageGallery}>
                {item.images.map((image) => (
                  <View key={image.id} style={styles.galleryImageWrap}>
                    <Image
                      source={{ uri: publicImage(`/public/business-storefronts/images/items/${image.id}`) }}
                      style={styles.galleryImage}
                    />
                    <Pressable
                      style={styles.imageRemoveButton}
                      onPress={() => void removeItemImage(item, image.id)}
                      disabled={busy}
                    >
                      <X size={13} color={C.white} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {item.shortDescription ? <Text style={styles.itemDescription}>{item.shortDescription}</Text> : null}
            <View style={styles.itemMeta}>
              {item.sku ? <Text style={styles.metaText}>SKU {item.sku}</Text> : null}
              {(() => {
                const stockSummary = getCatalogueStockSummary(item);
                return stockSummary ? (
                  <Text
                    style={[
                      styles.metaText,
                      styles.stockIndicator,
                      stockSummary.tone === 'out' && styles.stockOut,
                      stockSummary.tone === 'low' && styles.stockLow,
                      stockSummary.tone === 'good' && styles.stockGood,
                    ]}
                  >
                    {stockSummary.label}
                  </Text>
                ) : null;
              })()}
              {item.isFeatured ? (
                <Text style={[styles.metaText, styles.featuredIndicator]}>FEATURED</Text>
              ) : null}
              {item.variants?.length ? (
                <Text style={styles.metaText}>
                  {item.variants.filter((variant) => variant.isActive !== false).length} active variants
                </Text>
              ) : null}
            </View>
            <View style={styles.actionGrid}>
              <Action label="Edit" secondary onPress={() => resetItemForm(item)} icon={<Pencil size={14} color={C.lime} />} />
              {item.status === 'DRAFT' && <Action label="Publish" onPress={() => void publishItem(item)} icon={<Check size={14} color={C.bg} />} />}
              {item.status === 'PUBLISHED' && <Action label="Archive" danger secondary onPress={() => void archiveItem(item)} icon={<Trash2 size={14} color={C.red} />} />}
              {item.status !== 'ARCHIVED' && <Action label="Add photos" secondary onPress={async () => {
                const remaining = Math.max(0, 20 - (item.images?.length || 0));
                if (!remaining) { Alert.alert('Image limit reached', 'This item already has 20 images.'); return; }
                const picked = await pickImages(Math.min(8, remaining));
                if (!picked.length || !businessId) return;
                setBusy(true);
                try {
                  await uploadBusinessCatalogueItemImages(businessId, item.id, picked);
                  await load(true);
                } catch (e) { Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.'); }
                finally { setBusy(false); }
              }} icon={<ImagePlus size={14} color={C.lime} />} />}
              {item.trackInventory && !hasActiveTrackedVariantInventory(item) && <Action
                label="Adjust stock"
                secondary
                onPress={() => {
                  setStockVariant(null);
                  setStockVariantItemId(null);
                  setStockItem(item);
                  setStockChange('');
                  setStockReason('RESTOCK');
                  setStockNote('');
                }}
                icon={<TrendingUp size={14} color={C.lime} />}
              />}
              {item.trackInventory && !hasActiveTrackedVariantInventory(item) && <Action
                label="Stock history"
                secondary
                onPress={() => void showHistory(item)}
                icon={<Clock3 size={14} color={C.lime} />}
              />}
            </View>
            {stockItem?.id === item.id &&
              (!stockVariant || stockVariantItemId === item.id) && (
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>
                    Adjust stock · {item.name}{stockVariant ? ` · ${stockVariant.name}` : ''}
                  </Text>
                  <Pressable onPress={() => {
                    setStockItem(null);
                    setStockVariant(null);
                    setStockVariantItemId(null);
                  }}>
                    <X size={19} color={C.muted} />
                  </Pressable>
                </View>
                <Text style={styles.muted}>
                  Current stock: {stockVariant ? stockVariant.stockQuantity || 0 : item.stockQuantity || 0}. Use a positive number to add stock or a negative number to remove it.
                </Text>
                <Field
                  label="QUANTITY CHANGE"
                  value={stockChange}
                  onChangeText={setStockChange}
                  placeholder="e.g. 10 or -2"
                  keyboardType="numeric"
                />
                <Field
                  label="REASON"
                  value={stockReason}
                  onChangeText={setStockReason}
                  placeholder="RESTOCK, DAMAGE, SALE, CORRECTION..."
                />
                <Field
                  label="NOTE (OPTIONAL)"
                  value={stockNote}
                  onChangeText={setStockNote}
                  placeholder="Add a note for the inventory record"
                  multiline
                />
                <View style={styles.row}>
                  <Action label="Cancel" secondary onPress={() => {
                    setStockItem(null);
                    setStockVariant(null);
                    setStockVariantItemId(null);
                  }} />
                  <Action
                    label="Save adjustment"
                    onPress={() => void adjustStock(item, stockVariant ?? undefined)}
                    disabled={busy}
                    icon={<Check size={14} color={C.bg} />}
                  />
                </View>
              </View>
            )}

            {item.variants?.length ? (
              <View style={styles.variants}>
                <Text style={styles.fieldLabel}>VARIANTS</Text>
                {item.variants.map((variant) => (
                  <View key={variant.id} style={styles.variantRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.variantName}>{variant.name}</Text>
                      <Text style={styles.muted}>
                        {variant.priceAmount != null ? money(variant.priceAmount, item.currency) : 'Uses item price'}
                        {' · '}
                        {variant.isActive === false ? 'Inactive' : 'Active'}
                        {variant.trackInventory
                          ? ` · Stock: ${variant.stockQuantity || 0}`
                          : ' · Inventory not tracked'}
                      </Text>
                    </View>
                    {variant.trackInventory && variant.isActive !== false ? (
                      <>
                        <Pressable
                          accessibilityLabel={`Adjust stock for ${variant.name}`}
                          onPress={() => {
                            setStockItem(item);
                            setStockVariant(variant);
                            setStockVariantItemId(item.id);
                            setStockChange('');
                            setStockReason('RESTOCK');
                            setStockNote('');
                          }}
                          style={{ padding: 7 }}
                          disabled={busy}
                        >
                          <TrendingUp size={16} color={C.lime} />
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`View stock history for ${variant.name}`}
                          onPress={() => void showHistory(item, variant)}
                          style={{ padding: 7 }}
                          disabled={busy}
                        >
                          <Clock3 size={16} color={C.lime} />
                        </Pressable>
                      </>
                    ) : null}
                    <Pressable
                      onPress={() => {
                        setEditingVariant(variant);
                        setEditingVariantItemId(item.id);
                        setVariantName(variant.name);
                        setVariantPrice(variant.priceAmount != null ? String(variant.priceAmount) : '');
                        setVariantSku(variant.sku || '');
                        setVariantOptionsText(formatJsonField(variant.options));
                        setVariantTrackInventory(variant.trackInventory === true);
                        setVariantAllowBackorder(variant.allowBackorder === true);
                      }}
                      style={{ padding: 7 }}
                    >
                      <Pencil size={16} color={C.lime} />
                    </Pressable>
                    <Pressable
                      onPress={() => void setVariantActive(item, variant, variant.isActive === false)}
                      style={{ padding: 7 }}
                      disabled={busy}
                    >
                      {variant.isActive === false
                        ? <Check size={17} color={C.green} />
                        : <X size={17} color={C.red} />}
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            {item.status !== 'ARCHIVED' && (
              editingVariant && editingVariantItemId !== item.id ? null : (
                <View style={styles.variantForm}>
                  <Text style={styles.fieldLabel}>{editingVariant ? 'EDIT VARIANT' : 'ADD VARIANT'}</Text>
                  <Field label="Variant name" value={variantName} onChangeText={setVariantName} placeholder="e.g. Large / Blue / 1kg" />
                  <Field label="Variant SKU (optional)" value={variantSku} onChangeText={setVariantSku} placeholder="Unique variant stock code" />
                  <Field label="Variant price (optional)" value={variantPrice} onChangeText={setVariantPrice} placeholder="KES" keyboardType="numeric" />
                  <Field
                    label="Variant options (JSON)"
                    value={variantOptionsText}
                    onChangeText={setVariantOptionsText}
                    placeholder={'{"size":"Large","colour":"Black"}'}
                    multiline
                  />
                  <Text style={styles.formHint}>
                    Define the option values that distinguish this variant, such as size, colour, weight, pack size or model.
                  </Text>
                  {[
                    ['Track variant inventory', variantTrackInventory, setVariantTrackInventory],
                    ['Allow variant backorders', variantAllowBackorder, setVariantAllowBackorder],
                  ].map(([label, value, setter]) => (
                    <Pressable
                      key={String(label)}
                      style={styles.toggleRow}
                      onPress={() => {
                        const update = setter as (next: boolean) => void;
                        update(!(value as boolean));
                      }}
                    >
                      <Text style={styles.toggleLabel}>{String(label)}</Text>
                      <View style={[styles.toggle, value && styles.toggleOn]}>
                        <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
                      </View>
                    </Pressable>
                  ))}
                  <Text style={styles.formHint}>
                    Variant stock is managed separately from the parent product. Stock quantities can only be changed through inventory adjustments.
                  </Text>
                  <View style={styles.row}>
                    {editingVariant && (
                      <Action
                        label="Cancel edit"
                        secondary
                        onPress={() => {
                          setEditingVariant(null);
                          setEditingVariantItemId(null);
                          setVariantName('');
                          setVariantPrice('');
                          setVariantSku('');
                          setVariantOptionsText('');
                          setVariantTrackInventory(false);
                          setVariantAllowBackorder(false);
                        }}
                      />
                    )}
                    <Action
                      label={editingVariant ? 'Save variant' : 'Add variant'}
                      secondary
                      onPress={() => void addVariant(item)}
                      disabled={busy}
                      icon={<Check size={14} color={C.lime} />}
                    />
                  </View>
                </View>
              )
            )}
          </View>
        ))}

        {historyItem && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>
                Stock history · {historyItem.name}{historyVariant ? ` · ${historyVariant.name}` : ''}
              </Text>
              <Pressable onPress={() => {
                setHistoryItem(null);
                setHistoryVariant(null);
                setMovements([]);
              }}><X size={20} color={C.muted} /></Pressable>
            </View>
            {movements.length ? movements.map((movement) => (
              <View key={movement.id} style={styles.movementRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.variantName}>{movement.reason}</Text>
                  {!historyVariant && movement.variantId ? (
                    <Text style={styles.muted}>
                      Variant: {historyItem.variants?.find((variant) => variant.id === movement.variantId)?.name || 'Variant'}
                    </Text>
                  ) : null}
                  <Text style={styles.muted}>{movement.note || new Date(movement.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={[styles.movementAmount, { color: movement.quantityChange >= 0 ? C.green : C.red }]}>
                  {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                </Text>
                <Text style={styles.muted}>{movement.quantityBefore} → {movement.quantityAfter}</Text>
              </View>
            )) : <Text style={styles.muted}>No inventory movements recorded yet.</Text>}
          </View>
        )}
        {busy && <View style={styles.busyLine}><ActivityIndicator color={C.lime} /><Text style={styles.muted}>Updating catalogue…</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border, gap: 13 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  refresh: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: C.muted, fontSize: 9, letterSpacing: 1.5, fontWeight: '800' },
  title: { color: C.white, fontSize: 22, fontWeight: '900', marginTop: 2 },
  content: { padding: 18, paddingBottom: 55, gap: 17 },
  intro: { flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 19, padding: 16 },
  introIcon: { width: 47, height: 47, borderRadius: 15, backgroundColor: '#252E20', alignItems: 'center', justifyContent: 'center' },
  introTitle: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  muted: { color: C.muted, fontSize: 12, lineHeight: 18 },
  stats: { flexDirection: 'row', gap: 7 },
  stat: { flex: 1, minWidth: 0, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 12 },
  statValue: { color: C.white, fontSize: 21, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.35, marginTop: 5 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  sectionTitle: { color: C.white, fontSize: 18, fontWeight: '900' },
  smallAdd: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.lime, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  smallAddText: { color: C.bg, fontWeight: '900', fontSize: 12 },
  categoryStrip: { gap: 8, paddingVertical: 3 },
  categoryChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 30 },
  categoryText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  chipActive: { backgroundColor: C.lime, borderColor: C.lime },
  chipTextActive: { color: C.bg },
  categoryManageList: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 13 },
  categoryManageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  categoryThumb: { width: 37, height: 37, borderRadius: 12, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  categoryThumbImage: { width: '100%', height: '100%', borderRadius: 12 },
  selectedImageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  selectedImageWrap: { width: 66, height: 66, position: 'relative' },
  selectedImage: { width: 66, height: 66, borderRadius: 11, backgroundColor: C.soft },
  itemImageGallery: { gap: 9, paddingVertical: 2 },
  galleryImageWrap: { width: 76, height: 76, position: 'relative' },
  galleryImage: { width: 76, height: 76, borderRadius: 11, backgroundColor: C.soft },
  imageRemoveButton: { position: 'absolute', top: 4, right: 4, width: 23, height: 23, borderRadius: 12, backgroundColor: '#8D3038', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF55' },
  categoryManageName: { color: C.white, fontWeight: '800', fontSize: 13 },
  addItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.lime, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  addItemText: { color: C.bg, fontWeight: '900', fontSize: 12 },
  searchBox: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: C.white, paddingVertical: 12, fontSize: 13 },
  searchClear: { width: 28, height: 28, borderRadius: 10, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  filterStrip: { gap: 8 },
  filterChip: { borderWidth: 1, borderColor: C.border, borderRadius: 25, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: C.card },
  panel: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15, gap: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: C.white, fontSize: 16, fontWeight: '900' },
  fieldWrap: { gap: 6, flex: 1 },
  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  input: { backgroundColor: C.soft, borderWidth: 1, borderColor: C.border, borderRadius: 11, color: C.white, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13 },
  multiline: { minHeight: 75 },
  row: { flexDirection: 'row', gap: 9, justifyContent: 'flex-end' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.lime, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 10 },
  actionSecondary: { backgroundColor: C.soft, borderWidth: 1, borderColor: C.border },
  actionDanger: { backgroundColor: '#261719', borderColor: '#603035' },
  actionText: { color: C.bg, fontSize: 11, fontWeight: '900' },
  typeRow: { flexDirection: 'row', gap: 7 },
  typeChip: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 10, backgroundColor: C.soft },
  typeText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  categorySelect: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  categorySelectButton: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.soft, borderWidth: 1, borderColor: C.border, padding: 12, borderRadius: 11 },
  categoryPicker: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8, maxHeight: 220 },
  categoryOption: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.border, borderRadius: 8 },
  categoryOptionActive: { backgroundColor: C.soft },
  categoryOptionText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  categoryOptionTextActive: { color: C.lime, fontWeight: '800' },
  categorySelectText: { color: C.white, fontSize: 12 },
  clearText: { color: C.lime, fontSize: 11, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  toggleLabel: { color: C.white, fontSize: 12, fontWeight: '700' },
  toggle: { width: 42, height: 24, borderRadius: 15, backgroundColor: '#394144', justifyContent: 'center', padding: 3 },
  toggleOn: { backgroundColor: '#60782A' },
  toggleKnob: { width: 18, height: 18, borderRadius: 10, backgroundColor: C.white },
  toggleKnobOn: { alignSelf: 'flex-end', backgroundColor: C.lime },
  imagePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formHint: { color: C.muted, fontSize: 10, lineHeight: 16 },
  itemCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 16, gap: 14, shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  itemImage: { width: 82, height: 82, borderRadius: 17, backgroundColor: C.soft },
  itemImagePlaceholder: { width: 82, height: 82, borderRadius: 17, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  itemName: { color: C.white, fontWeight: '900', fontSize: 16, lineHeight: 21, marginBottom: 5 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 7 },
  itemPrice: { color: C.lime, fontSize: 16, fontWeight: '900' },
  comparePrice: { color: C.muted, fontSize: 11, fontWeight: '600', textDecorationLine: 'line-through' },
  statusPill: { backgroundColor: '#3A3020', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  statusPublished: { backgroundColor: '#1E382A' },
  statusArchived: { backgroundColor: '#3A2022' },
  statusText: { color: C.white, fontSize: 8, fontWeight: '900' },
  itemDescription: { color: C.muted, fontSize: 12, lineHeight: 18 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  metaText: { color: C.muted, fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  stockIndicator: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
  stockOut: { color: '#FFB4B4', backgroundColor: '#452326' },
  stockLow: { color: '#FFD58A', backgroundColor: '#45351F' },
  stockGood: { color: '#B9F2C8', backgroundColor: '#203B2B' },
  featuredIndicator: { color: C.lime, backgroundColor: '#303A1D', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  variants: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, gap: 8 },
  variantRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  variantName: { color: C.white, fontSize: 12, fontWeight: '800' },
  variantForm: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 11, gap: 9 },
  movementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 10 },
  movementAmount: { fontSize: 14, fontWeight: '900' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 35, gap: 12 },
  emptyTitle: { color: C.white, fontWeight: '900', fontSize: 16 },
  error: { backgroundColor: '#291A1B', borderWidth: 1, borderColor: '#603035', borderRadius: 14, padding: 13, gap: 10 },
  errorText: { color: '#FFB3B3', fontSize: 12, lineHeight: 18 },
  busyLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
});
