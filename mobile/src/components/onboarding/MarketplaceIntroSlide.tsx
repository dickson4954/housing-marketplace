import React from 'react';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Props = {
  step: number;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  features: string[];
  nextRoute: string;
};

export default function MarketplaceIntroSlide({
  step,
  eyebrow,
  title,
  accent,
  description,
  image,
  features,
  nextRoute,
}: Props) {
  const finishSlide = () => router.replace(nextRoute as never);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: image }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>MAKAZII</Text>
              <Text style={styles.logoSub}>ONE MARKETPLACE. MORE POSSIBILITIES.</Text>
            </View>

            <Pressable onPress={() => router.replace('/onboarding/marketplace-entry' as never)}>
              <Text style={styles.skip}>SKIP</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressRow}>
              {[1, 2, 3, 4].map((item) => (
                <View
                  key={item}
                  style={[
                    styles.progressTrack,
                    item <= step && styles.progressActive,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.step}>0{step} / 04</Text>
            <Text style={styles.eyebrow}>{eyebrow}</Text>

            <Text style={styles.title}>
              {title}{'\n'}
              <Text style={styles.accent}>{accent}</Text>
            </Text>

            <Text style={styles.description}>{description}</Text>

            <View style={styles.featureCard}>
              {features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <CheckCircle2 size={17} color="#D7FF5F" strokeWidth={2.2} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={finishSlide}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.continueText}>
                {step === 4 ? 'Get started' : 'Continue'}
              </Text>
              <View style={styles.arrowBox}>
                <ArrowRight size={21} color="#D7FF5F" strokeWidth={2.5} />
              </View>
            </Pressable>

            <Text style={styles.footerText}>
              DISCOVER · SHOP · CONNECT · GROW
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },
  background: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5, 10, 11, 0.72)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3.5,
  },
  logoSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginTop: 4,
  },
  skip: {
    color: '#D7FF5F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    padding: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 35,
    paddingBottom: 25,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 25,
  },
  progressTrack: {
    height: 4,
    flex: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressActive: {
    backgroundColor: '#D7FF5F',
  },
  step: {
    color: '#D7FF5F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 18,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: width < 380 ? 39 : 47,
    lineHeight: width < 380 ? 45 : 53,
    fontWeight: '900',
    letterSpacing: -1.8,
  },
  accent: {
    color: '#D7FF5F',
  },
  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 18,
    maxWidth: 410,
  },
  featureCard: {
    backgroundColor: 'rgba(17,24,24,0.86)',
    borderColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 17,
    marginTop: 25,
    gap: 15,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingBottom: 12,
  },
  continueButton: {
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
  continueText: {
    color: '#101410',
    fontSize: 16,
    fontWeight: '900',
  },
  arrowBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#101410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.42)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 16,
  },
});
