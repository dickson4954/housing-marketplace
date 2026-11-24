import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Increase this version only when the introductory onboarding flow
 * materially changes and existing users should see it again.
 *
 * Ordinary app updates must keep the same version.
 */
export const MARKETPLACE_ONBOARDING_VERSION = '6';

export const MARKETPLACE_ONBOARDING_KEY =
  'makazii_marketplace_onboarding_completed_version';

export async function hasCompletedMarketplaceOnboarding(): Promise<boolean> {
  try {
    const completedVersion = await AsyncStorage.getItem(
      MARKETPLACE_ONBOARDING_KEY,
    );

    return completedVersion === MARKETPLACE_ONBOARDING_VERSION;
  } catch (error) {
    console.warn('Could not read marketplace onboarding state:', error);
    return false;
  }
}

export async function completeMarketplaceOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      MARKETPLACE_ONBOARDING_KEY,
      MARKETPLACE_ONBOARDING_VERSION,
    );
  } catch (error) {
    console.warn('Could not save marketplace onboarding state:', error);
  }
}

