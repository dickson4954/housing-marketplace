import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Wallet,
  X,
} from 'lucide-react-native';
import {
  getBusinessOrders,
  getBusinessOrdersCommandCentre,
  type BusinessOrdersCommandCentre,
  type BusinessOrderStatus,
  type BusinessOrderSummary,
  type BusinessOrdersPagination,
} from '../../../../lib/businessOwnerApi';

const C = {
  bg: '#0B0F10',
  card: '#14191B',
  soft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#73D99A',
  amber: '#F4C66A',
  red: '#FF6B6B',
};

const FILTERS: {
  label: string;
  value: BusinessOrderStatus | undefined;
}[] = [
  { label: 'All', value: undefined },
  { label: 'Awaiting', value: 'PENDING_ACCEPTANCE' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function formatMoney(amount: number, currency = 'KES') {
  return `${currency} ${Math.max(0, amount).toLocaleString('en-KE')}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_ACCEPTANCE: 'Awaiting acceptance',
    ACCEPTED: 'Accepted',
    PROCESSING: 'Processing',
    READY: 'Ready',
    DISPATCHED: 'Dispatched',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
  };

  return labels[status] || status.replace(/_/g, ' ').toLowerCase();
}

function statusColor(status: string) {
  if (['COMPLETED', 'READY'].includes(status)) return C.green;
  if (['PENDING_ACCEPTANCE', 'PROCESSING', 'ACCEPTED'].includes(status)) {
    return C.amber;
  }
  if (['CANCELLED', 'REJECTED'].includes(status)) return C.red;
  if (status === 'DISPATCHED') return C.lime;
  return C.muted;
}

function paymentColor(status: string) {
  if (status === 'PAID') return C.green;
  if (status === 'PENDING') return C.amber;
  if (['FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(status)) {
    return C.red;
  }
  return C.muted;
}

function OrderCard({
  order,
  onPress,
}: {
  order: BusinessOrderSummary;
  onPress: () => void;
}) {
  const accent = statusColor(order.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.orderCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open order ${order.orderNumber}`}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderIcon}>
          <ShoppingBag size={19} color={C.lime} />
        </View>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <ChevronRight size={19} color={C.muted} />
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.customerRow}>
        <View style={styles.customerAvatar}>
          <Text style={styles.customerInitial}>
            {(order.customerName || 'C').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerCopy}>
          <Text style={styles.customerName} numberOfLines={1}>
            {order.customerName || 'Marketplace customer'}
          </Text>
          <Text style={styles.itemCount}>
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={styles.orderAmountWrap}>
          <Text style={styles.orderAmount}>
            {formatMoney(order.totalAmount, order.currency)}
          </Text>
          <Text style={styles.amountCaption}>Order total</Text>
        </View>
      </View>

      <View style={styles.orderBottom}>
        <View style={[styles.statusPill, { borderColor: `${accent}55` }]}>
          <View style={[styles.statusDot, { backgroundColor: accent }]} />
          <Text style={[styles.statusText, { color: accent }]}>
            {statusLabel(order.status)}
          </Text>
        </View>

        <View style={styles.paymentWrap}>
          <Text style={styles.paymentCaption}>Payment</Text>
          <Text style={[styles.paymentValue, { color: paymentColor(order.paymentStatus) }]}>
            {order.paymentStatus.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {order.reconciliationRequired ? (
        <View style={styles.warningRow}>
          <AlertCircle size={14} color={C.amber} />
          <Text style={styles.warningText}>
            Payment reconciliation requires attention
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function CommandMetric({
  label,
  value,
  detail,
  accent = C.lime,
}: {
  label: string;
  value: number;
  detail: string;
  accent?: string;
}) {
  return (
    <View style={styles.commandMetric}>
      <View style={[styles.commandMetricDot, { backgroundColor: accent }]} />
      <Text style={styles.commandMetricValue}>
        {value.toLocaleString("en-KE")}
      </Text>
      <Text style={styles.commandMetricLabel}>{label}</Text>
      <Text style={styles.commandMetricDetail}>{detail}</Text>
    </View>
  );
}

export default function BusinessOrdersScreen() {
  const params = useLocalSearchParams<{
    businessId: string | string[];
  }>();

  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const [orders, setOrders] = useState<BusinessOrderSummary[]>([]);
  const [commandCentre, setCommandCentre] =
    useState<BusinessOrdersCommandCentre | null>(null);
  const [commandLoading, setCommandLoading] = useState(true);
  const [pagination, setPagination] = useState<BusinessOrdersPagination | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<BusinessOrderStatus | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(
      (`/business/workspace/${encodeURIComponent(businessId || '')}`) as any,
    );
  };

  const loadOrders = useCallback(async (
    page: number,
    append: boolean,
    showRefresh = false,
  ) => {
    if (!businessId) {
      setError('The business workspace could not be identified.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const sequence = ++requestSequence.current;

    if (showRefresh) setRefreshing(true);
    else if (append) setLoadingMore(true);
    else setLoading(true);

    if (!append) setError('');

    try {
      const result = await getBusinessOrders(businessId, {
        page,
        limit: 20,
        status: activeFilter,
        search: search || undefined,
      });

      if (sequence !== requestSequence.current) return;

      setOrders((current) =>
        append ? [...current, ...result.orders] : result.orders,
      );
      setPagination(result.pagination);
      setError('');
    } catch (requestError) {
      if (sequence !== requestSequence.current) return;

      const message = requestError instanceof Error
        ? requestError.message
        : 'Unable to load business orders. Please try again.';

      setError(message);
      if (!append) {
        setOrders([]);
        setPagination(null);
      }
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [businessId, activeFilter, search]);

  const loadCommandCentre = useCallback(async () => {
    if (!businessId) {
      setCommandLoading(false);
      return;
    }

    try {
      const result = await getBusinessOrdersCommandCentre(businessId);
      setCommandCentre(result);
    } catch (requestError) {
      console.warn(
        "Unable to load Orders Command Centre:",
        requestError instanceof Error ? requestError.message : requestError,
      );
      setCommandCentre(null);
    } finally {
      setCommandLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCommandCentre();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadCommandCentre]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOrders(1, false);
    }, search ? 350 : 0);

    return () => {
      clearTimeout(timer);
      requestSequence.current += 1;
    };
  }, [loadOrders, search]);

  const refresh = () => {
    void loadOrders(1, false, true);
    void loadCommandCentre();
  };

  const loadMore = () => {
    if (!pagination?.hasNextPage || loadingMore || loading) return;
    void loadOrders(pagination.page + 1, true);
  };

  const openOrder = (orderId: string) => {
    router.push(
      (`/business/workspace/${encodeURIComponent(businessId || '')}/orders/${encodeURIComponent(orderId)}`) as any,
    );
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back to business workspace"
        >
          <ArrowLeft size={19} color={C.white} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>BUSINESS OPERATIONS</Text>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>

        <Pressable
          style={styles.headerButton}
          onPress={refresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh orders"
        >
          <RefreshCw size={17} color={C.lime} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={C.lime}
            colors={[C.lime]}
            progressBackgroundColor={C.card}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <ShoppingBag size={22} color={C.lime} />
            </View>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>PRODUCT ORDERS</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Your order</Text>
          <Text style={styles.heroTitleAccent}>inbox.</Text>
          <Text style={styles.heroDescription}>
            View customer purchases, check verified payment status and follow
            each order through its fulfilment journey.
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <CheckCircle2 size={14} color={C.green} />
              <Text style={styles.heroFooterText}>Authorised workspace</Text>
            </View>
            <View style={styles.heroFooterItem}>
              <Package size={14} color={C.lime} />
              <Text style={styles.heroFooterText}>Business products only</Text>
            </View>
          </View>
        </View>

        <View style={styles.commandSection}>
          <View style={styles.commandHeading}>
            <View>
              <Text style={styles.commandEyebrow}>LIVE BUSINESS OVERVIEW</Text>
              <Text style={styles.commandTitle}>Order performance</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {commandLoading ? (
            <View style={styles.commandLoading}>
              <ActivityIndicator size="small" color={C.lime} />
              <Text style={styles.commandLoadingText}>
                Loading business totals…
              </Text>
            </View>
          ) : commandCentre ? (
            <>
              <View style={styles.commandGrid}>
                <CommandMetric
                  label="All orders"
                  value={commandCentre.totalOrders}
                  detail="Lifetime orders"
                />
                <CommandMetric
                  label="Awaiting action"
                  value={commandCentre.awaitingAcceptance}
                  detail="Need acceptance"
                  accent={C.amber}
                />
                <CommandMetric
                  label="In progress"
                  value={commandCentre.processing}
                  detail="Accepted to dispatched"
                  accent="#80B7FF"
                />
                <CommandMetric
                  label="Completed"
                  value={commandCentre.completed}
                  detail="Fulfilled orders"
                  accent={C.green}
                />
                <CommandMetric
                  label="Unpaid"
                  value={commandCentre.unpaidOrders}
                  detail="Not yet settled"
                  accent={C.amber}
                />
                <CommandMetric
                  label="Needs attention"
                  value={commandCentre.attentionRequired}
                  detail="Payment reconciliation"
                  accent={C.red}
                />
              </View>

              <View style={styles.financialPanel}>
                <View style={styles.financialHeader}>
                  <View>
                    <Text style={styles.financialEyebrow}>VERIFIED PAYMENT SNAPSHOT</Text>
                    <Text style={styles.financialTitle}>Paid orders</Text>
                  </View>
                  <View style={styles.paidCount}>
                    <CheckCircle2 size={13} color={C.green} />
                    <Text style={styles.paidCountText}>
                      {commandCentre.paidOrderCount} paid
                    </Text>
                  </View>
                </View>

                <Text style={styles.paidValue}>
                  {formatMoney(commandCentre.paidOrderValue)}
                </Text>
                <Text style={styles.paidCaption}>
                  Total value of paid orders excluding orders requiring reconciliation
                </Text>

                <View style={styles.financialDivider} />

                <View style={styles.financialBreakdown}>
                  <View style={styles.financialItem}>
                    <Text style={styles.financialItemLabel}>Commission snapshot</Text>
                    <Text style={styles.financialItemValue}>
                      {formatMoney(commandCentre.commissionSnapshotTotal)}
                    </Text>
                  </View>
                  <View style={styles.financialItem}>
                    <Text style={styles.financialItemLabel}>Seller payable estimate</Text>
                    <Text style={[styles.financialItemValue, { color: C.green }]}>
                      {formatMoney(commandCentre.sellerPayableEstimateTotal)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.financialDisclaimer}>
                  Estimates only; this is not a payout or settlement statement.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.commandUnavailable}>
              <AlertCircle size={17} color={C.amber} />
              <Text style={styles.commandUnavailableText}>
                Business totals are temporarily unavailable. Your order inbox can still be used.
              </Text>
              <Pressable onPress={() => void loadCommandCentre()}>
                <Text style={styles.commandRetry}>Retry</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.inboxHeading}>
          <View>
            <Text style={styles.sectionTitle}>Order inbox</Text>
            <Text style={styles.sectionSubtitle}>
              {pagination
                ? `${pagination.total.toLocaleString('en-KE')} orders found`
                : 'Your business order activity'}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {pagination ? pagination.total : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={17} color={C.muted} />
          <TextInput
            value={searchInput}
            onChangeText={(value) => {
              setSearchInput(value);
              setSearch(value.trim());
            }}
            placeholder="Search order number"
            placeholderTextColor="#697477"
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {searchInput.length > 0 ? (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <X size={17} color={C.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
        >
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter.value;

            return (
              <Pressable
                key={filter.label}
                onPress={() => setActiveFilter(filter.value)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={C.lime} />
            <Text style={styles.stateTitle}>Loading your orders</Text>
            <Text style={styles.stateDescription}>
              Retrieving orders for this authorised business workspace.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconError}>
              <AlertCircle size={24} color={C.red} />
            </View>
            <Text style={styles.stateTitle}>Orders could not be loaded</Text>
            <Text style={styles.stateDescription}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <RefreshCw size={15} color={C.bg} />
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={28} color={C.lime} />
            </View>
            <Text style={styles.stateTitle}>
              {search || activeFilter ? 'No matching orders' : 'No orders yet'}
            </Text>
            <Text style={styles.stateDescription}>
              {search || activeFilter
                ? 'Try another order number or select a different status filter.'
                : 'Customer product orders placed with this business will appear here.'}
            </Text>
            {(search || activeFilter) ? (
              <Pressable style={styles.clearButton} onPress={() => {
                clearSearch();
                setActiveFilter(undefined);
              }}>
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.orderList}>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => openOrder(order.id)}
              />
            ))}

            {pagination?.hasNextPage ? (
              <Pressable
                style={styles.loadMoreButton}
                onPress={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={C.lime} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more orders</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.commissionCard}>
          <View style={styles.commissionIcon}>
            <Wallet size={19} color={C.lime} />
          </View>
          <View style={styles.commissionCopy}>
            <Text style={styles.commissionTitle}>Marketplace commission</Text>
            <Text style={styles.commissionRate}>10%</Text>
            <Text style={styles.commissionDescription}>
              Applied to product subtotal after discounts. Delivery fees and
              taxes are excluded. Seller payable figures are estimates.
            </Text>
          </View>
        </View>

        <View style={styles.footerNote}>
          <CheckCircle2 size={16} color={C.green} />
          <Text style={styles.footerText}>
            This inbox covers business product orders only. Property rentals,
            viewings, inspections and short-stay bookings remain separate.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 2,
  },
  content: { padding: 18, paddingBottom: 55, gap: 17 },
  hero: {
    backgroundColor: '#171F19',
    borderColor: '#354326',
    borderWidth: 1,
    borderRadius: 23,
    padding: 19,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#303C21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#26321E',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 5,
    backgroundColor: C.lime,
  },
  heroBadgeText: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: C.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    color: C.lime,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroDescription: {
    color: '#B3BCB5',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },
  heroFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    borderTopWidth: 1,
    borderTopColor: '#354326',
    marginTop: 17,
    paddingTop: 13,
  },
  heroFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroFooterText: { color: '#D3D9D2', fontSize: 10, fontWeight: '700' },
  commandSection: { gap: 12 },
  commandHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commandEyebrow: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  commandTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#31513D',
    backgroundColor: '#17271D',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  liveText: { color: C.green, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  commandMetric: {
    width: '48%',
    flexGrow: 1,
    minHeight: 112,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 13,
  },
  commandMetricDot: { width: 7, height: 7, borderRadius: 5, marginBottom: 10 },
  commandMetricValue: {
    color: C.white,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  commandMetricLabel: {
    color: '#E7EBE8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  commandMetricDetail: { color: C.muted, fontSize: 9, marginTop: 4 },
  commandLoading: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  commandLoadingText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  financialPanel: {
    backgroundColor: '#171F19',
    borderWidth: 1,
    borderColor: '#354326',
    borderRadius: 18,
    padding: 16,
  },
  financialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  financialEyebrow: {
    color: '#A8B59D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  financialTitle: { color: C.white, fontSize: 14, fontWeight: '900', marginTop: 4 },
  paidCount: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paidCountText: { color: C.green, fontSize: 10, fontWeight: '800' },
  paidValue: {
    color: C.lime,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 17,
  },
  paidCaption: { color: '#AEB9AE', fontSize: 9, lineHeight: 15, marginTop: 4 },
  financialDivider: { height: 1, backgroundColor: '#354326', marginVertical: 14 },
  financialBreakdown: { flexDirection: 'row', gap: 12 },
  financialItem: { flex: 1 },
  financialItemLabel: { color: '#AEB9AE', fontSize: 9, lineHeight: 14 },
  financialItemValue: { color: C.white, fontSize: 12, fontWeight: '900', marginTop: 5 },
  financialDisclaimer: { color: '#849083', fontSize: 8, lineHeight: 13, marginTop: 12 },
  commandUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 13,
  },
  commandUnavailableText: { color: C.muted, fontSize: 10, lineHeight: 15, flex: 1 },
  commandRetry: { color: C.lime, fontSize: 10, fontWeight: '900' },
  inboxHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: C.white, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { color: C.muted, fontSize: 11, marginTop: 4 },
  countBadge: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { color: C.lime, fontSize: 13, fontWeight: '900' },
  searchBox: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 13,
  },
  searchInput: { flex: 1, color: C.white, fontSize: 13, paddingVertical: 12 },
  filterStrip: { gap: 8, paddingRight: 8 },
  filterChip: {
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.lime, borderColor: C.lime },
  filterText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: C.bg },
  orderList: { gap: 11 },
  orderCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 14,
  },
  cardPressed: { opacity: 0.78 },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdentity: { flex: 1 },
  orderNumber: { color: C.white, fontSize: 13, fontWeight: '900' },
  orderDate: { color: C.muted, fontSize: 10, marginTop: 4 },
  orderDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 13,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  customerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#293321',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: { color: C.lime, fontSize: 13, fontWeight: '900' },
  customerCopy: { flex: 1 },
  customerName: { color: C.white, fontSize: 12, fontWeight: '800' },
  itemCount: { color: C.muted, fontSize: 10, marginTop: 3 },
  orderAmountWrap: { alignItems: 'flex-end' },
  orderAmount: { color: C.white, fontSize: 13, fontWeight: '900' },
  amountCaption: { color: C.muted, fontSize: 9, marginTop: 3 },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexShrink: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  paymentWrap: { alignItems: 'flex-end' },
  paymentCaption: { color: C.muted, fontSize: 9 },
  paymentValue: { fontSize: 10, fontWeight: '900', marginTop: 3 },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  warningText: { color: C.amber, fontSize: 10, fontWeight: '700', flex: 1 },
  stateCard: {
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 19,
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  stateIconError: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#342020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#293321',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.lime,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 18,
  },
  retryButtonText: { color: C.bg, fontSize: 11, fontWeight: '900' },
  clearButton: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 16,
  },
  clearButtonText: { color: C.lime, fontSize: 11, fontWeight: '800' },
  loadMoreButton: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  loadMoreText: { color: C.lime, fontSize: 12, fontWeight: '900' },
  commissionCard: {
    flexDirection: 'row',
    gap: 13,
    backgroundColor: '#171F19',
    borderWidth: 1,
    borderColor: '#354326',
    borderRadius: 17,
    padding: 15,
  },
  commissionIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#303C21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionCopy: { flex: 1 },
  commissionTitle: { color: C.white, fontSize: 12, fontWeight: '900' },
  commissionRate: { color: C.lime, fontSize: 22, fontWeight: '900', marginTop: 4 },
  commissionDescription: {
    color: '#B3BCB5',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 2,
    marginTop: 1,
  },
  footerText: { flex: 1, color: C.muted, fontSize: 10, lineHeight: 16 },
});
