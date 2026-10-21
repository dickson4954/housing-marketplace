import { router } from 'expo-router';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleExplore = () => {
  router.push('/onboarding/intro-1');
};

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=90',
        }}
        style={styles.image}
        resizeMode="cover"
      >
        {/* DARK IMAGE OVERLAY */}
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>FIND YOUR PLACE</Text>
            </View>

            <View style={styles.countryBadge}>
              <Text style={styles.countryText}>KE</Text>
            </View>
          </View>

          {/* MAIN CONTENT */}
          <View style={styles.middle}>
            {/* EYEBROW */}
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />

              <Text style={styles.eyebrowText}>
                HOMES ACROSS KENYA
              </Text>
            </View>

            {/* TITLE */}
            <Text style={styles.title}>
              Find a place{'\n'}
              <Text style={styles.titleAccent}>
                to call home.
              </Text>
            </Text>

            {/* DESCRIPTION */}
            <Text style={styles.description}>
              Discover real rental homes in the places you want
              to live. Search by location, price and what
              matters to you.
            </Text>

            {/* SEARCH PREVIEW */}
            <View style={styles.searchPreview}>
              <View style={styles.searchIcon}>
                <Text style={styles.pin}>⌖</Text>
              </View>

              <View style={styles.searchTextContainer}>
                <Text style={styles.searchLabel}>
                  WHERE
                </Text>

                <Text style={styles.searchValue}>
                  Nairobi, Meru, Mombasa...
                </Text>
              </View>

              <View style={styles.searchArrow}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
          </View>

          {/* BOTTOM CONTENT */}
          <View style={styles.bottom}>
            {/* PRIMARY CTA */}
            <Pressable
              onPress={handleExplore}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                Explore homes
              </Text>

              <View style={styles.buttonArrow}>
                <Text style={styles.buttonArrowText}>
                  ↗
                </Text>
              </View>
            </Pressable>

            {/* TRUST ITEMS */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Text style={styles.trustNumber}>
                  01
                </Text>

                <Text style={styles.trustText}>
                  REAL HOMES
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.trustItem}>
                <Text style={styles.trustNumber}>
                  02
                </Text>

                <Text style={styles.trustText}>
                  REAL LOCATIONS
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.trustItem}>
                <Text style={styles.trustNumber}>
                  03
                </Text>

                <Text style={styles.trustText}>
                  VERIFIED INFO
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  /* --------------------------------
     CONTAINER
  -------------------------------- */

  container: {
    flex: 1,
    backgroundColor: '#111111',
  },

  image: {
    width,
    height,
    flex: 1,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(8, 12, 14, 0.57)',
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },

  /* --------------------------------
     HEADER
  -------------------------------- */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 4,
  },

  logoSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 4,
  },

  countryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* --------------------------------
     MIDDLE CONTENT
  -------------------------------- */

  middle: {
    marginTop: height * 0.08,
    marginBottom: 25,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D7FF5F',
    marginRight: 9,
  },

  eyebrowText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  title: {
    color: '#FFFFFF',
    fontSize: width < 380 ? 45 : 52,
    lineHeight: width < 380 ? 49 : 55,
    fontWeight: '800',
    letterSpacing: -2,
  },

  titleAccent: {
    color: '#D7FF5F',
  },

  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 19,
    maxWidth: 390,
  },

  /* --------------------------------
     SEARCH PREVIEW
  -------------------------------- */

  searchPreview: {
    marginTop: 24,
    height: 67,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  searchIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pin: {
    color: '#D7FF5F',
    fontSize: 25,
  },

  searchTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  searchLabel: {
    color: '#777777',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  searchValue: {
    color: '#161616',
    fontSize: 13,
    fontWeight: '600',
  },

  searchArrow: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#111111',
    fontSize: 22,
  },

  /* --------------------------------
     BOTTOM
  -------------------------------- */

  bottom: {
    paddingBottom: 10,
  },

  button: {
    height: 64,
    borderRadius: 19,
    backgroundColor: '#D7FF5F',
    paddingLeft: 22,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  buttonText: {
    color: '#101410',
    fontSize: 17,
    fontWeight: '800',
  },

  buttonArrow: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonArrowText: {
    color: '#D7FF5F',
    fontSize: 23,
    fontWeight: '600',
  },

  /* --------------------------------
     TRUST ITEMS
  -------------------------------- */

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 19,
  },

  trustItem: {
    alignItems: 'center',
    flex: 1,
  },

  trustNumber: {
    color: '#D7FF5F',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },

  trustText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

