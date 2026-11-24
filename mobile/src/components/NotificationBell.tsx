import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bell } from 'lucide-react-native';

import { useCustomer } from '@/context/CustomerContext';
import { getCustomerUnreadNotificationCount } from '@/lib/notifications';

const C = {
  card: '#14191B',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  bg: '#0B0F10',
};

export default function NotificationBell() {
  const { isAuthenticated, isLoading } = useCustomer();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    if (isLoading || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);

    try {
      const count = await getCustomerUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Keep the header usable if the notification service is unavailable.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [refreshCount]),
  );

  const openNotifications = () => {
    if (isAuthenticated) {
      router.push('/notifications' as never);
      return;
    }

    router.push('/onboarding/customer/login');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : 'Notifications'
      }
      onPress={openNotifications}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={C.lime} />
      ) : (
        <Bell
          size={20}
          color={C.white}
          strokeWidth={1.8}
        />
      )}

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.lime,
    borderWidth: 1.5,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: C.bg,
    fontSize: 9,
    fontWeight: '900',
  },
});
