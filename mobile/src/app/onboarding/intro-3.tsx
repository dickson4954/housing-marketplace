import { router } from 'expo-router';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function IntroThree() {
  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <Image
          source={{
          uri: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=90',
        }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          {/* TOP */}
          <View style={styles.top}>
            <View>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>FIND YOUR PLACE</Text>
            </View>

            <Text style={styles.step}>03 / 04</Text>
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
              <View style={styles.lineInactive} />
              <View style={styles.lineActive} />
              <View style={styles.lineInactive} />
            </View>

            <Text style={styles.eyebrow}>MAKAZII STANDARD</Text>

            <Text style={styles.title}>
              Real homes.{'\n'}
              <Text style={styles.accent}>Verified information.</Text>
            </Text>

            <Text style={styles.description}>
              We want you to know what you&apos;re looking at.
              Listings can include verified locations, real
              property photos, current rent information and
              the details you need before viewing.
            </Text>

            {/* VERIFICATION CARD */}
            <View style={styles.verificationCard}>
              <View style={styles.checkCircle}>
                <Text style={styles.check}>✓</Text>
              </View>

              <View style={styles.verificationText}>
                <Text style={styles.verifiedTitle}>
                  VERIFIED BY OUR TEAM
                </Text>

                <Text style={styles.verifiedDescription}>
                  Property information checked before listing.
                </Text>
              </View>
            </View>

            {/* SMALL FEATURES */}
            <View style={styles.featureRow}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⌖</Text>
                <Text style={styles.featureText}>LOCATION</Text>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>▣</Text>
                <Text style={styles.featureText}>PHOTOS</Text>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>DETAILS</Text>
              </View>
            </View>
          </ScrollView>

          {/* BOTTOM */}
          <View style={styles.bottom}>
            <Pressable
              onPress={() =>
                router.replace('/onboarding/role-selection')
              }
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
          </View>
        </SafeAreaView>
      </View>
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
    backgroundColor: 'rgba(8, 12, 14, 0.66)',
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
    marginTop: height * 0.035,
    marginBottom: 20,
  },

  line: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 25,
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
    marginBottom: 14,
  },

  title: {
    color: '#FFFFFF',
    fontSize: width < 380 ? 39 : 45,
    lineHeight: width < 380 ? 43 : 49,
    fontWeight: '800',
    letterSpacing: -1.6,
  },

  accent: {
    color: '#D7FF5F',
  },

  description: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 17,
    maxWidth: 390,
  },

  verificationCard: {
    marginTop: 20,
    minHeight: 70,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    color: '#D7FF5F',
    fontSize: 22,
    fontWeight: '900',
  },

  verificationText: {
    flex: 1,
    marginLeft: 12,
  },

  verifiedTitle: {
    color: '#171717',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  verifiedDescription: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '500',
  },

  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  feature: {
    flex: 1,
    alignItems: 'center',
  },

  featureIcon: {
    color: '#D7FF5F',
    fontSize: 17,
    marginBottom: 4,
  },

  featureText: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
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
});