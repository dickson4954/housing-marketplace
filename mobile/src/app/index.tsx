import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

export default function IndexScreen() {
  useEffect(() => {
    router.replace('/onboarding/intro-1' as never);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#D7FF5F" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F10',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
