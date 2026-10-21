import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Home,
  LogIn,
  UserPlus,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CustomerWelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoMark}>
            <Home
              size={21}
              color="#0B0F10"
              strokeWidth={2.6}
            />
          </View>

          <View>
            <Text style={styles.logoText}>MAKAZII</Text>
            <Text style={styles.logoSubtitle}>
              FIND YOUR PLACE
            </Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>

          <View style={styles.heroIcon}>
            <Home
              size={36}
              color="#D7FF5F"
              strokeWidth={1.8}
            />
          </View>

          <Text style={styles.eyebrow}>
            WELCOME TO MAKAZII
          </Text>

          <Text style={styles.title}>
            Find a place
            {'\n'}
            that feels like home.
          </Text>

          <Text style={styles.description}>
            Discover homes, save your favourites,
            request viewings and keep your search
            connected wherever you go.
          </Text>

          {/* Primary action */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              router.push('/onboarding/customer/signup')
            }
          >
            <View style={styles.primaryIcon}>
              <UserPlus
                size={20}
                color="#0B0F10"
                strokeWidth={2.5}
              />
            </View>

            <View style={styles.primaryText}>
              <Text style={styles.primaryTitle}>
                Create an account
              </Text>

              <Text style={styles.primarySubtitle}>
                Start your home search
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <ArrowRight
                size={19}
                color="#0B0F10"
                strokeWidth={2.7}
              />
            </View>
          </Pressable>

          {/* Login below */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                router.push('/onboarding/customer/login')
              }
              hitSlop={10}
            >
              <View style={styles.loginLink}>
                <LogIn
                  size={15}
                  color="#D7FF5F"
                  strokeWidth={2.5}
                />

                <Text style={styles.loginLinkText}>
                  Log in
                </Text>
              </View>
            </Pressable>
          </View>

        </View>

        {/* Bottom */}
        <View style={styles.bottomArea}>
          <View style={styles.divider} />

          <Text style={styles.bottomTitle}>
            YOUR SEARCH, YOUR WAY
          </Text>

          <Text style={styles.bottomText}>
            Save properties, manage your visits and
            keep your MAKAZII activity connected.
          </Text>

          <Text style={styles.versionText}>
            MAKAZII • FIND YOUR PLACE
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#D7FF5F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  logoSubtitle: {
    color: '#697274',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 1,
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',

    /*
     * Keeps the welcome section lower on the screen
     * instead of sitting directly under the header.
     */
    paddingTop: 75,
    paddingBottom: 35,
  },

  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  eyebrow: {
    color: '#D7FF5F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: '#FFFFFF',
    fontSize: width < 380 ? 35 : 40,
    lineHeight: width < 380 ? 41 : 46,
    fontWeight: '900',
    letterSpacing: -1.4,
    marginBottom: 16,
  },

  description: {
    color: '#9CA5A7',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 450,
    marginBottom: 28,
  },

  primaryButton: {
    minHeight: 72,
    borderRadius: 21,
    backgroundColor: '#D7FF5F',
    paddingLeft: 13,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  primaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  primaryText: {
    flex: 1,
  },

  primaryTitle: {
    color: '#0B0F10',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },

  primarySubtitle: {
    color: '#4C571F',
    fontSize: 11,
    fontWeight: '700',
  },

  arrowCircle: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },

  loginText: {
    color: '#697274',
    fontSize: 12,
    fontWeight: '600',
  },

  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  loginLinkText: {
    color: '#D7FF5F',
    fontSize: 12,
    fontWeight: '900',
  },

  bottomArea: {
    alignItems: 'center',
    paddingTop: 10,
  },

  divider: {
    width: 38,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#252C2E',
    marginBottom: 12,
  },

  bottomTitle: {
    color: '#596163',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  bottomText: {
    color: '#41494B',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    maxWidth: 340,
  },

  versionText: {
    color: '#303739',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
  },
});
