import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type LatLng, type Region } from 'react-native-maps';

type Props = {
  visible: boolean;
  initialLatitude: number | null;
  initialLongitude: number | null;
  onClose: () => void;
  onConfirm: (coordinate: LatLng) => void;
};

const KENYA_REGION: Region = {
  latitude: -0.0236,
  longitude: 37.9062,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

const C = {
  background: '#0B0F10',
  card: '#14191B',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
};

export default function BusinessAddressPinPicker({
  visible,
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}: Props) {
  const [coordinate, setCoordinate] = useState<LatLng | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setMapReady(false);
    setCoordinate(
      initialLatitude != null && initialLongitude != null
        ? {
            latitude: initialLatitude,
            longitude: initialLongitude,
          }
        : null,
    );
  }, [visible, initialLatitude, initialLongitude]);

  const initialRegion: Region =
    initialLatitude != null && initialLongitude != null
      ? {
          latitude: initialLatitude,
          longitude: initialLongitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }
      : KENYA_REGION;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>BUSINESS PREMISES</Text>
            <Text style={styles.title}>Pin your location</Text>
            <Text style={styles.subtitle}>
              Move the map to your actual premises, then tap to place a pin.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close map"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            onMapReady={() => setMapReady(true)}
            onPress={(event) => setCoordinate(event.nativeEvent.coordinate)}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass
            toolbarEnabled={false}
            mapType="standard"
          >
            {coordinate && (
              <Marker
                coordinate={coordinate}
                draggable
                onDragEnd={(event) =>
                  setCoordinate(event.nativeEvent.coordinate)
                }
                title="Business premises"
                description="Drag this pin to adjust its position"
              />
            )}
          </MapView>

          {!mapReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={C.lime} />
              <Text style={styles.loadingText}>Preparing map…</Text>
            </View>
          )}

          <View pointerEvents="none" style={styles.mapHint}>
            <Text style={styles.mapHintText}>
              Tap anywhere on the map to place your pin
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {coordinate ? (
            <View style={styles.coordinateCard}>
              <Text style={styles.coordinateLabel}>SELECTED MAP POSITION</Text>
              <Text style={styles.coordinateValue}>
                {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No pin selected yet. Tap the map at your business premises.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={!coordinate}
              onPress={() => coordinate && onConfirm(coordinate)}
              style={({ pressed }) => [
                styles.primaryButton,
                !coordinate && styles.disabledButton,
                pressed && coordinate && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Confirm pin</Text>
            </Pressable>
          </View>

          <Text style={styles.privacyNote}>
            This is a manually selected premises reference. It does not enable
            live tracking or device GPS sharing.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: C.white,
    fontSize: 23,
    fontWeight: '800',
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 12,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 12,
  },
  mapHint: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    alignItems: 'center',
  },
  mapHintText: {
    color: C.white,
    backgroundColor: 'rgba(11,15,16,0.9)',
    overflow: 'hidden',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  coordinateCard: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  coordinateLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  coordinateValue: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  secondaryButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1.5,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.lime,
  },
  primaryButtonText: {
    color: C.background,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.75,
  },
  privacyNote: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 11,
  },
});
