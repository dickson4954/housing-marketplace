import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  Home,
  LogIn,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
} from 'lucide-react-native';

const C = {
  background: '#0B0F10',
  card: '#141A1C',
  cardSoft: '#1B2223',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#293234',
};

export default function MarketplaceEntryScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Home size={21} color="#101410" strokeWidth={2.7} />
            </View>
            <View>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>ONE MARKETPLACE. MORE POSSIBILITIES.</Text>
            </View>
            <View style={styles.countryBadge}>
              <Text style={styles.countryText}>KE</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.eyebrow}>
              <View style={styles.dot} />
              <Text style={styles.eyebrowText}>WELCOME TO MAKAZII</Text>
            </View>

            <Text style={styles.title}>
              Everything you need.
              {'\n'}
              <Text style={styles.accent}>Discover it here.</Text>
            </Text>

            <Text style={styles.description}>
              Find places to live, discover products and services, or bring
              your business closer to the people who need it.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>HOW WOULD YOU LIKE TO CONTINUE?</Text>

          <View style={styles.pathCard}>
            <View style={styles.pathTop}>
              <View style={styles.customerIcon}>
                <ShoppingBag size={23} color={C.lime} />
              </View>
              <View style={styles.pathBadge}>
                <Text style={styles.pathBadgeText}>EXPLORE MAKAZII</Text>
              </View>
            </View>

            <Text style={styles.pathTitle}>I'm here to discover</Text>
            <Text style={styles.pathDescription}>
              Explore homes, shopping, food, beauty and services from one
              connected marketplace.
            </Text>

            <Pressable
              onPress={() => router.push('/onboarding/customer/signup' as never)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <UserPlus size={19} color="#101410" />
              <Text style={styles.primaryButtonText}>Create a customer account</Text>
              <ArrowRight size={19} color="#101410" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/onboarding/customer/login' as never)}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.pressed,
              ]}
            >
              <LogIn size={17} color={C.lime} />
              <Text style={styles.loginButtonText}>I already have an account · Log in</Text>
            </Pressable>
          </View>

          <View style={styles.pathCard}>
            <View style={styles.pathTop}>
              <View style={styles.businessIcon}>
                <BriefcaseBusiness size={23} color={C.lime} />
              </View>
              <View style={styles.pathBadge}>
                <Text style={styles.pathBadgeText}>GROW WITH MAKAZII</Text>
              </View>
            </View>

            <Text style={styles.pathTitle}>I'm here for my business</Text>
            <Text style={styles.pathDescription}>
              Register your business, choose its industry and apply for your
              own MAKAZII business workspace.
            </Text>

            <Pressable
              onPress={() => router.push('/onboarding/business-directory' as never)}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Explore business categories</Text>
              <ArrowRight size={19} color={C.lime} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/business/login' as never)}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.pressed,
              ]}
            >
              <LogIn size={17} color={C.lime} />
              <Text style={styles.loginButtonText}>Already registered? Business sign in</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>MAKAZII · MADE FOR EVERYDAY LIFE</Text>

            <Pressable
              onPress={() => router.push('/admin/login' as never)}
              hitSlop={12}
              style={styles.adminLink}
            >
              <ShieldCheck size={13} color="#657071" />
              <Text style={styles.adminText}>Platform administration</Text>
              <ChevronRight size={13} color="#657071" />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logoMark: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: C.white,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  logoSub: {
    color: '#7E898A',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
  },
  countryBadge: {
    marginLeft: 'auto',
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryText: { color: C.lime, fontSize: 10, fontWeight: '900' },
  hero: { marginTop: 42, marginBottom: 28 },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#182119',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.lime,
    marginRight: 8,
  },
  eyebrowText: {
    color: C.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    color: C.white,
    fontSize: 37,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: 18,
  },
  accent: { color: C.lime },
  description: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    maxWidth: 390,
  },
  sectionLabel: {
    color: '#758081',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  pathCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 21,
    padding: 17,
    marginBottom: 13,
  },
  pathTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  customerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#20291B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathBadge: {
    backgroundColor: C.cardSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pathBadgeText: {
    color: '#AAB4A0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pathTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  pathDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 16,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: C.lime,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
  primaryButtonText: {
    flex: 1,
    color: '#101410',
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: '#3A472B',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '900',
  },
  loginButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },
  loginButtonText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 11,
    gap: 11,
  },
  footerText: {
    color: '#596365',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
  },
  adminText: {
    color: '#657071',
    fontSize: 9,
    fontWeight: '700',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
