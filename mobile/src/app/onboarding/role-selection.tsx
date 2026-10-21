import { router } from 'expo-router';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Building2,
  Home,
  Megaphone,
  ShieldCheck,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RoleSelection() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* TOP */}
        <View style={styles.top}>
          <View>
            <Text style={styles.logo}>MAKAZII</Text>
            <Text style={styles.logoSub}>FIND YOUR PLACE</Text>
          </View>

          <Text style={styles.step}>04 / 04</Text>
        </View>

        {/* PROGRESS */}
        <View style={styles.progress}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressCurrent} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.eyebrow}>ONE LAST STEP</Text>

          <Text style={styles.title}>
            How will you use{'\n'}
            <Text style={styles.accent}>Makazii?</Text>
          </Text>

          <Text style={styles.description}>
            Choose where you want to go. Find a home or
            access the Makazii team portals.
          </Text>

          {/* CUSTOMER */}
          <Pressable
            onPress={() =>
              router.replace('/onboarding/customer')
            }
            style={({ pressed }) => [
              styles.customerCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.iconBox}>
              <Home
                size={28}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.customerLabel}>
                FIND A HOME
              </Text>

              <Text style={styles.customerTitle}>
                I'm looking for a home
              </Text>

              <Text style={styles.customerDescription}>
                Browse rentals and find a place that fits
                your needs.
              </Text>
            </View>

            <View style={styles.customerArrow}>
              <ArrowRight
                size={18}
                color="#101410"
                strokeWidth={2.5}
              />
            </View>
          </Pressable>

          {/* LANDLORD */}
          <Pressable
            onPress={() => router.push('/landlord' as any)}
            style={({ pressed }) => [
              styles.landlordCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.landlordIconBox}>
              <Building2
                size={25}
                color="#D7FF5F"
                strokeWidth={2}
              />
            </View>

            <View style={styles.landlordCardContent}>
              <Text style={styles.landlordLabel}>LIST YOUR PROPERTY</Text>
              <Text style={styles.landlordTitle}>I'm a landlord</Text>
              <Text style={styles.landlordDescription}>
                Register, verify your identity, and submit your property for review.
              </Text>
            </View>

            <View style={styles.landlordArrow}>
              <ArrowRight
                size={18}
                color="#D7FF5F"
                strokeWidth={2.5}
              />
            </View>
          </Pressable>

          {/* TEAM PORTALS */}
          <View style={styles.teamRow}>
            {/* ADMIN */}
            <Pressable
              onPress={() => router.replace('/admin/login')}
              style={({ pressed }) => [
                styles.teamCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.teamIconBox}>
                <ShieldCheck
                  size={25}
                  color="#D7FF5F"
                  strokeWidth={2}
                />
              </View>

              <View style={styles.teamCardContent}>
                <Text style={styles.teamLabel}>
                  ADMIN
                </Text>

                <Text style={styles.teamTitle}>
                  Administration
                </Text>

                <Text style={styles.teamDescription}>
                  Manage the Makazii marketplace.
                </Text>
              </View>

              <View style={styles.teamArrow}>
                <ArrowRight
                  size={17}
                  color="#D7FF5F"
                  strokeWidth={2.5}
                />
              </View>
            </Pressable>

            {/* MARKETER */}
            <Pressable
              onPress={() =>
                router.replace('/marketer')
              }
              style={({ pressed }) => [
                styles.teamCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.teamIconBox}>
                <Megaphone
                  size={25}
                  color="#D7FF5F"
                  strokeWidth={2}
                />
              </View>

              <View style={styles.teamCardContent}>
                <Text style={styles.teamLabel}>
                  MARKETER
                </Text>

                <Text style={styles.teamTitle}>
                  Marketer Portal
                </Text>

                <Text style={styles.teamDescription}>
                  Manage your listings and activities.
                </Text>
              </View>

              <View style={styles.teamArrow}>
                <ArrowRight
                  size={17}
                  color="#D7FF5F"
                  strokeWidth={2.5}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerText}>
            MAKAZII · FIND YOUR PLACE
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 18,
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
    color: 'rgba(255,255,255,0.45)',
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

  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },

  progressActive: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  progressCurrent: {
    flex: 1.6,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D7FF5F',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  eyebrow: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
  },

  title: {
    color: '#FFFFFF',
    fontSize: width < 380 ? 38 : 44,
    lineHeight: width < 380 ? 43 : 49,
    fontWeight: '800',
    letterSpacing: -1.7,
  },

  accent: {
    color: '#D7FF5F',
  },

  description: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 15,
    maxWidth: 390,
  },

  /* CUSTOMER */

  customerCard: {
    minHeight: 148,
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#D7FF5F',
    borderWidth: 1,
    borderColor: '#D7FF5F',
    marginTop: 25,
    justifyContent: 'space-between',
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#101410',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardContent: {
    marginTop: 9,
    paddingRight: 48,
  },

  customerLabel: {
    color: '#4F5B3B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  customerTitle: {
    color: '#101410',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },

  customerDescription: {
    color: 'rgba(16,20,16,0.62)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 5,
  },

  customerArrow: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* LANDLORD */

  landlordCard: {
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 20,
    padding: 13,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#39432D',
    marginTop: 10,
  },

  landlordIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#20291B',
    borderWidth: 1,
    borderColor: '#3C4C2A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  landlordCardContent: {
    flex: 1,
    paddingRight: 2,
  },

  landlordLabel: {
    color: '#A9B28B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  landlordTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },

  landlordDescription: {
    color: '#9CA5A7',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },

  landlordArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#0B0F10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#39432D',
  },

  /* TEAM */

  teamRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  teamCard: {
    flex: 1,
    minHeight: 155,
    borderRadius: 20,
    padding: 13,
    backgroundColor: '#14191B',
    borderWidth: 1,
    borderColor: '#2B3335',
    justifyContent: 'space-between',
  },

  teamIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#0B0F10',
    borderWidth: 1,
    borderColor: '#293133',
    alignItems: 'center',
    justifyContent: 'center',
  },

  teamCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 5,
    paddingRight: 8,
  },

  teamLabel: {
    color: '#7F898B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  teamTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },

  teamDescription: {
    color: '#7F898B',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },

  teamArrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#0B0F10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2B3335',
  },

  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  /* FOOTER */

  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },

  footerLine: {
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D7FF5F',
    marginBottom: 10,
  },

  footerText: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});