import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
  CheckCircle2,
  ImagePlus,
  MapPin,
  RefreshCw,
  Upload,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  text: '#E9EEEE',
  muted: '#9CA5A7',
  border: '#252C2E',
  success: '#7BE495',
  danger: '#FF6B6B',
};

type County = {
  id: string;
  name: string;
  sourceId?: string;
  coverImageUrl?: string | null;
};

type SelectedImage = ImagePicker.ImagePickerAsset;

async function getAdminToken() {
  if (typeof window !== 'undefined') {
    const token = window.localStorage?.getItem('makazii_admin_token');
    if (token) return token;
  }

  const token = await SecureStore.getItemAsync('makazii_admin_token');

  if (!token) {
    throw new Error('Your administrator session has expired. Please sign in again.');
  }

  return token;
}

export default function AdminCountiesScreen() {
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedCountyId, setSelectedCountyId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [uploadingCountyId, setUploadingCountyId] = useState<string | null>(null);

  const fetchCounties = useCallback(async (): Promise<County[]> => {
    const token = await getAdminToken();
    const response = await fetch(`${API_BASE_URL}/admin/counties`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.message || 'Unable to load counties.');
    }

    const items = json?.data?.counties;

    if (!Array.isArray(items)) {
      throw new Error('The server returned an unexpected counties response.');
    }

    return items.map((item: any) => ({
      id: String(item.id),
      name: String(item.name),
      sourceId: item.sourceId ? String(item.sourceId) : undefined,
      coverImageUrl:
        typeof item.coverImageUrl === 'string' ? item.coverImageUrl : null,
    }));
  }, []);

  const loadCounties = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const items = await fetchCounties();
      setCounties(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load counties.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCounties]);

  useEffect(() => {
    let active = true;

    async function loadInitialCounties() {
      try {
        const items = await fetchCounties();

        if (active) {
          setCounties(items);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load counties.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialCounties();

    return () => {
      active = false;
    };
  }, [fetchCounties]);

  const chooseImage = async (county: County) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Gallery permission required',
          'Allow access to your photo library to choose a county cover.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (result.canceled || !result.assets.length) return;

      setSelectedCountyId(county.id);
      setSelectedImage(result.assets[0]);
    } catch (e) {
      Alert.alert(
        'Image selection failed',
        e instanceof Error ? e.message : 'Could not open the photo library.',
      );
    }
  };

  const uploadCover = async (county: County) => {
    if (selectedCountyId !== county.id || !selectedImage) {
      Alert.alert('Choose an image', `Select a cover image for ${county.name} first.`);
      return;
    }

    setUploadingCountyId(county.id);

    try {
      const token = await getAdminToken();
      const form = new FormData();
      const asset = selectedImage;
      const fileName = asset.fileName || `${county.name.toLowerCase()}-cover.jpg`;

      if (Platform.OS === 'web') {
        // Browser: append a real Blob to FormData.
        const fileResponse = await fetch(asset.uri);

        if (!fileResponse.ok) {
          throw new Error('Could not read the selected image.');
        }

        const blob = await fileResponse.blob();
        form.append('image', blob, fileName);
      } else {
        // Android/iOS: use Expo's supported File implementation.
        const imageFile = new ExpoFile(asset.uri);

        if (!imageFile.exists) {
          throw new Error(
            'The selected image file could not be found. Please choose it again.',
          );
        }

        form.append('image', imageFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/counties/${encodeURIComponent(county.id)}/cover`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: form,
        },
      );

      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(json?.message || 'County cover upload failed.');
      }

      const updatedCover =
        json?.data?.county?.coverImageUrl ??
        json?.county?.coverImageUrl ??
        json?.coverImageUrl;

      if (typeof updatedCover !== 'string' || !updatedCover) {
        await loadCounties(true);
      } else {
        setCounties((previous) =>
          previous.map((item) =>
            item.id === county.id
              ? { ...item, coverImageUrl: updatedCover }
              : item,
          ),
        );
      }

      setSelectedImage(null);
      setSelectedCountyId(null);

      Alert.alert('Cover updated', `${county.name} now has its new cover image.`);
    } catch (e) {
      Alert.alert(
        'Upload failed',
        e instanceof Error ? e.message : 'Could not upload this county cover.',
      );
    } finally {
      setUploadingCountyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to admin dashboard"
          onPress={() => router.replace('/admin/dashboard' as any)}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={COLORS.white} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>PLATFORM CONTENT</Text>
          <Text style={styles.title}>County covers</Text>
          <Text style={styles.subtitle}>
            Manage the photos shown on the customer home screen.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh counties"
          onPress={() => void loadCounties(true)}
          style={styles.refreshButton}
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={COLORS.lime} />
          ) : (
            <RefreshCw size={18} color={COLORS.lime} />
          )}
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <MapPin size={21} color={COLORS.lime} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>
            {counties.length} counties
          </Text>
          <Text style={styles.summarySubtitle}>
            {counties.filter((county) => county.coverImageUrl).length} have a cover image
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.lime} />
          <Text style={styles.mutedText}>Loading counties…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>Could not load counties</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void loadCounties()}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {counties.map((county) => {
            const isSelected = selectedCountyId === county.id && !!selectedImage;
            const isUploading = uploadingCountyId === county.id;

            return (
              <View key={county.id} style={styles.countyCard}>
                {isSelected ? (
                  <Image
                    source={{ uri: selectedImage!.uri }}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                ) : county.coverImageUrl ? (
                  <Image
                    source={{ uri: county.coverImageUrl }}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}>
                    <MapPin size={30} color={COLORS.muted} />
                    <Text style={styles.placeholderText}>No cover uploaded</Text>
                  </View>
                )}

                <View style={styles.countyDetails}>
                  <View style={styles.countyHeading}>
                    <Text style={styles.countyName}>{county.name}</Text>
                    {county.coverImageUrl ? (
                      <View style={styles.statusPill}>
                        <CheckCircle2 size={13} color={COLORS.success} />
                        <Text style={styles.statusText}>Cover set</Text>
                      </View>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <Text style={styles.selectionText}>
                      New image selected. Upload to publish it.
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>
                      {county.coverImageUrl
                        ? 'Choose a replacement photo whenever needed.'
                        : 'Choose a photo to display on the customer home screen.'}
                    </Text>
                  )}

                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => void chooseImage(county)}
                      disabled={!!uploadingCountyId}
                      style={styles.secondaryButton}
                    >
                      <ImagePlus size={16} color={COLORS.lime} />
                      <Text style={styles.secondaryButtonText}>
                        {county.coverImageUrl ? 'Change photo' : 'Choose photo'}
                      </Text>
                    </Pressable>

                    {isSelected ? (
                      <Pressable
                        onPress={() => void uploadCover(county)}
                        disabled={!!uploadingCountyId}
                        style={[
                          styles.primaryButton,
                          uploadingCountyId ? styles.disabledButton : null,
                        ]}
                      >
                        {isUploading ? (
                          <ActivityIndicator size="small" color={COLORS.background} />
                        ) : (
                          <Upload size={16} color={COLORS.background} />
                        )}
                        <Text style={styles.primaryButtonText}>
                          {isUploading ? 'Uploading…' : 'Upload'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'web' ? 22 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: { color: COLORS.white, fontSize: 25, fontWeight: '900' },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    padding: 15,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1 },
  summaryTitle: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  summarySubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 36, gap: 15 },
  countyCard: {
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 20,
  },
  cover: { width: '100%', height: 180, backgroundColor: COLORS.cardSoft },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 9 },
  placeholderText: { color: COLORS.muted, fontSize: 12 },
  countyDetails: { padding: 15 },
  countyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  countyName: { color: COLORS.white, fontSize: 17, fontWeight: '900' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#15271C',
  },
  statusText: { color: COLORS.success, fontSize: 10, fontWeight: '800' },
  helperText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  selectionText: { color: COLORS.lime, fontSize: 12, lineHeight: 18, marginTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryButtonText: { color: COLORS.background, fontSize: 12, fontWeight: '900' },
  disabledButton: { opacity: 0.65 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mutedText: { color: COLORS.muted, fontSize: 13 },
  errorPanel: {
    margin: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  errorTitle: { color: COLORS.white, fontSize: 17, fontWeight: '900' },
  errorText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
});
