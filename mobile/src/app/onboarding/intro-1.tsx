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

export default function IntroOne() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90',
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

            <Text style={styles.step}>01 / 04</Text>
          </View>

          {/* CONTENT */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.line}>
              <View style={styles.lineActive} />
              <View style={styles.lineInactive} />
              <View style={styles.lineInactive} />
              <View style={styles.lineInactive} />
            </View>

            <Text style={styles.eyebrow}>FIND YOUR FIT</Text>

            <Text style={styles.title}>
              Homes that{'\n'}
              <Text style={styles.accent}>fit your life.</Text>
            </Text>

            <Text style={styles.description}>
              From affordable single rooms and bedsitters to
              spacious family homes, discover rentals that
              match the way you live.
            </Text>
          </ScrollView>

          {/* BOTTOM */}
          <View style={styles.bottom}>
            <Pressable
              onPress={() => router.push('/onboarding/intro-2')}
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
    backgroundColor: 'rgba(8, 12, 14, 0.62)',
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
    marginTop: height * 0.08,
    marginBottom: 30,
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
    fontSize: width < 380 ? 43 : 49,
    lineHeight: width < 380 ? 47 : 53,
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