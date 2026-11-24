import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  Home,
  ShieldCheck,
} from 'lucide-react-native';

import { useCustomer } from '@/context/CustomerContext';
import {
  getCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
  type CustomerNotification,
} from '@/lib/notifications';

const C = {
  bg: '#0B0F10',
  card: '#14191B',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF7777',
};

type Filter = 'all' | 'unread';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return `Today · ${date.toLocaleTimeString('en-KE', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }

  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear()
      ? undefined
      : 'numeric',
  });
}

function NotificationIcon({ type }: { type: string }) {
  const props = {
    size: 19,
    color: C.lime,
    strokeWidth: 1.9,
  } as const;

  if (type.startsWith('VIEWING_')) return <CalendarDays {...props} />;
  if (type.startsWith('INSPECTION_')) return <Home {...props} />;
  if (type.startsWith('BOOKING_')) return <Clock3 {...props} />;
  if (type.startsWith('PAYMENT_')) return <CreditCard {...props} />;
  if (type.startsWith('PROPERTY_')) return <ShieldCheck {...props} />;

  if (
    type.includes('FAILED') ||
    type.includes('REJECTED')
  ) {
    return <AlertCircle {...props} color={C.danger} />;
  }

  if (
    type.includes('COMPLETED') ||
    type.includes('APPROVED')
  ) {
    return <CheckCircle2 {...props} />;
  }

  return <Bell {...props} />;
}

export default function NotificationsScreen() {
  const {
    isAuthenticated,
    isLoading: customerLoading,
  } = useCustomer();

  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  const load = useCallback(async (
    nextPage = 1,
    replace = true,
    selectedFilter: Filter = filter,
  ) => {
    try {
      setError('');

      const result = await getCustomerNotifications({
        page: nextPage,
        limit: 20,
        unread: selectedFilter === 'unread' ? true : undefined,
      });

      setItems(current =>
        replace
          ? result.notifications
          : [...current, ...result.notifications],
      );

      setUnreadCount(result.unreadCount);
      setPage(result.pagination.page);
      setHasMore(result.pagination.hasMore);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load notifications.',
      );
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      if (customerLoading) return undefined;

      if (!isAuthenticated) {
        router.replace('/onboarding/customer/login');
        return undefined;
      }

      let active = true;

      setLoading(true);

      load(1, true, filter).finally(() => {
        if (active) setLoading(false);
      });

      return () => {
        active = false;
      };
    }, [customerLoading, isAuthenticated, filter, load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(1, true, filter);
    setRefreshing(false);
  }, [filter, load]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || error) return;

    setLoadingMore(true);
    await load(page + 1, false, filter);
    setLoadingMore(false);
  }, [
    loading,
    loadingMore,
    hasMore,
    error,
    page,
    filter,
    load,
  ]);

  const markRead = useCallback(async (
    item: CustomerNotification,
  ) => {
    if (item.readAt || updatingIds.includes(item.id)) return;

    setUpdatingIds(current => [...current, item.id]);

    try {
      await markCustomerNotificationRead(item.id);

      setItems(current =>
        current.map(notification =>
          notification.id === item.id
            ? {
                ...notification,
                readAt: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount(current => Math.max(0, current - 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update notification.',
      );
    } finally {
      setUpdatingIds(current =>
        current.filter(id => id !== item.id),
      );
    }
  }, [updatingIds]);

  const markAllRead = useCallback(async () => {
    if (!unreadCount || markingAll) return;

    setMarkingAll(true);

    try {
      await markAllCustomerNotificationsRead();

      const readAt = new Date().toISOString();

      setItems(current =>
        current.map(item => ({ ...item, readAt })),
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to mark notifications as read.',
      );
    } finally {
      setMarkingAll(false);
    }
  }, [unreadCount, markingAll]);

  const renderItem = useCallback(({
    item,
  }: {
    item: CustomerNotification;
  }) => {
    const unread = !item.readAt;
    const updating = updatingIds.includes(item.id);

    return (
      <Pressable
        onPress={() => markRead(item)}
        style={({ pressed }) => [
          styles.notification,
          unread && styles.unreadNotification,
          pressed && { opacity: 0.75 },
        ]}
      >
        <View style={styles.iconWrap}>
          <NotificationIcon type={item.type} />
        </View>

        <View style={styles.notificationBody}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle}>
              {item.title}
            </Text>
            {unread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message}>
            {item.message}
          </Text>

          <Text style={styles.date}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {updating && (
          <ActivityIndicator color={C.lime} size="small" />
        )}
      </Pressable>
    );
  }, [markRead, updatingIds]);

  if (customerLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={C.lime} size="large" />
          <Text style={styles.muted}>Checking your account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={23} color={C.white} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.heading}>Notifications</Text>
        </View>

        <View style={styles.countBadge}>
          <Bell size={16} color={C.lime} />
          <Text style={styles.countText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.filters}>
          {(['all', 'unread'] as Filter[]).map(option => (
            <Pressable
              key={option}
              onPress={() => setFilter(option)}
              style={[
                styles.filterButton,
                filter === option && styles.activeFilter,
              ]}
            >
              <Text style={[
                styles.filterText,
                filter === option && styles.activeFilterText,
              ]}>
                {option === 'all'
                  ? 'All'
                  : `Unread${unreadCount ? ` (${unreadCount})` : ''}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={markAllRead}
          disabled={!unreadCount || markingAll}
          style={styles.markAll}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color={C.lime} />
          ) : (
            <CheckCheck
              size={16}
              color={unreadCount ? C.lime : C.muted}
            />
          )}
          <Text style={[
            styles.markAllText,
            !unreadCount && { color: C.muted },
          ]}>
            Mark all read
          </Text>
        </Pressable>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <AlertCircle size={17} color={C.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          items.length ? styles.list : styles.emptyList
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={C.lime}
            colors={[C.lime]}
            progressBackgroundColor={C.card}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.lime} size="large" />
              <Text style={styles.muted}>Loading notifications…</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Bell size={28} color={C.lime} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'unread'
                  ? 'You’re all caught up'
                  : 'No notifications yet'}
              </Text>
              <Text style={styles.emptyMessage}>
                {filter === 'unread'
                  ? 'There are no unread updates at the moment.'
                  : 'Updates about your homes, bookings and payments will appear here.'}
              </Text>
              {filter === 'unread' && (
                <Pressable
                  onPress={() => setFilter('all')}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>
                    View all notifications
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={C.lime} />
              <Text style={styles.muted}>Loading more…</Text>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 13,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  heading: {
    color: C.white,
    fontSize: 23,
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 54,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: '#202A16',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countText: {
    color: C.lime,
    fontSize: 13,
    fontWeight: '800',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filters: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
  },
  activeFilter: {
    backgroundColor: C.lime,
  },
  filterText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  activeFilterText: {
    color: C.bg,
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  markAllText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 125,
    gap: 10,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 125,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    padding: 15,
    borderRadius: 19,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  unreadNotification: {
    backgroundColor: '#171F19',
    borderColor: '#354329',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#202A16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.lime,
    marginTop: 5,
  },
  message: {
    color: '#B8C0C1',
    fontSize: 12,
    lineHeight: 18,
  },
  date: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  muted: {
    color: C.muted,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: '#202A16',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 270,
  },
  viewAllButton: {
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.lime,
  },
  viewAllText: {
    color: C.bg,
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#2B191B',
    borderWidth: 1,
    borderColor: '#553033',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#F3B7B7',
    fontSize: 11,
    flex: 1,
  },
  retry: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
});
