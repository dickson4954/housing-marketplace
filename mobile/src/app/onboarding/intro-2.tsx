import { router } from 'expo-router';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function IntroTwo() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=90',
        }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          {/* TOP */}
          <View style={styles.top}>
            <View>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>FIND YOUR PLACE</Text>
            </View>

            <Text style={styles.step}>02 / 04</Text>
          </View>

          {/* CONTENT */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.line}>
              <View style={styles.lineInactive} />
              <View style={styles.lineActive} />
              <View style={styles.lineInactive} />
              <View style={styles.lineInactive} />
            </View>

            <Text style={styles.eyebrow}>EXPLORE KENYA</Text>

            <Text style={styles.title}>
              Find your next{'\n'}
              <Text style={styles.accent}>neighborhood.</Text>
            </Text>

            <Text style={styles.description}>
              Search across Kenya by county, town and area.
              Whether you're relocating, starting school or
              looking for your next family home, start where
              you want to live.
            </Text>

            {/* LOCATION PREVIEW */}
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Text style={styles.pin}>⌖</Text>
              </View>

              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>
                  EXPLORE LOCATIONS
                </Text>

                <Text style={styles.locationValue}>
                  Nairobi · Meru · Mombasa
                </Text>
              </View>

              <Text style={styles.locationArrow}>→</Text>
            </View>
          </ScrollView>

          {/* BOTTOM */}
          <View style={styles.bottom}>
            <Pressable
              onPress={() => router.push('/onboarding/intro-3')}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>Continue</Text>

              <View style={styles.arrowBox}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/onboarding/role-selection')}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },

  background: {
    flex: 1,
    width,
    height,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(8, 12, 14, 0.64)',
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },

  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 3.5,
  },

  logoSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 3,
  },

  step: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 5,
  },

  contentScroll: {
    flex: 1,
  },

  content: {
    marginTop: height * 0.06,
    marginBottom: 25,
  },

  line: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },

  lineActive: {
    width: 45,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D7FF5F',
  },

  lineInactive: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  eyebrow: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
  },

  title: {
    color: '#FFFFFF',
    fontSize: width < 380 ? 42 : 48,
    lineHeight: width < 380 ? 46 : 52,
    fontWeight: '800',
    letterSpacing: -1.8,
  },

  accent: {
    color: '#D7FF5F',
  },

  description: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 18,
    maxWidth: 390,
  },

  locationCard: {
    marginTop: 22,
    minHeight: 67,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pin: {
    color: '#D7FF5F',
    fontSize: 24,
  },

  locationText: {
    flex: 1,
    marginLeft: 12,
  },

  locationLabel: {
    color: '#777777',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  locationValue: {
    color: '#161616',
    fontSize: 12,
    fontWeight: '700',
  },

  locationArrow: {
    color: '#222222',
    fontSize: 21,
    marginRight: 8,
  },

  bottom: {
    paddingBottom: 10,
  },

  button: {
    height: 62,
    borderRadius: 19,
    backgroundColor: '#D7FF5F',
    paddingLeft: 21,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  buttonText: {
    color: '#101410',
    fontSize: 16,
    fontWeight: '800',
  },

  arrowBox: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#D7FF5F',
    fontSize: 23,
    fontWeight: '600',
  },

  skipButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },

  skipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
  },
});