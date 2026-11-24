import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquareText,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react-native';
import {
  getBusinessOrderDetails,
  type BusinessOrderDetails,
  type BusinessOrderEvent,
} from '../../../../../lib/businessOwnerApi';

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

function money(amount: number, currency = 'KES') {
  return `${currency} ${Math.max(0, amount).toLocaleString('en-KE')}`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return 'Not recorded';

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

function readable(value: string | null | undefined) {
  if (!value) return 'Not specified';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function orderStatusColor(status: string) {
  if (['COMPLETED', 'READY'].includes(status)) return C.green;
  if (['PENDING_ACCEPTANCE', 'ACCEPTED', 'PROCESSING'].includes(status)) {
    return C.amber;
  }
  if (['CANCELLED', 'REJECTED'].includes(status)) return C.red;
  if (status === 'DISPATCHED') return C.lime;
  return C.muted;
}

function paymentStatusColor(status: string) {
  if (status === 'PAID') return C.green;
  if (status === 'PENDING') return C.amber;
  if (['FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(status)) {
    return C.red;
  }
  return C.muted;
}

function eventTitle(event: BusinessOrderEvent) {
  const known: Record<string, string> = {
    ORDER_CREATED: 'Order received',
    ORDER_ACCEPTED: 'Order accepted',
    ORDER_PROCESSING: 'Processing started',
    ORDER_READY: 'Order ready',
    ORDER_DISPATCHED: 'Order dispatched',
    ORDER_COMPLETED: 'Order completed',
    ORDER_CANCELLED: 'Order cancelled',
    ORDER_REJECTED: 'Order rejected',
    PAYMENT_CONFIRMED: 'Payment confirmed',
    PAYMENT_FAILED: 'Payment failed',
  };

  return known[event.eventType] || readable(event.eventType);
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
  strong,
}: {
  label: string;
  value: string;
  valueColor?: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          valueColor ? { color: valueColor } : null,
          strong ? styles.detailValueStrong : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function BusinessOrderDetailsScreen() {
  const params = useLocalSearchParams<{
    businessId: string | string[];
    orderId: string | string[];
  }>();

  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  const [order, setOrder] = useState<BusinessOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(
      (`/business/workspace/${encodeURIComponent(businessId || '')}/orders`) as any,
    );
  };

  const loadOrder = useCallback(async (refresh = false) => {
    if (!businessId || !orderId) {
      setError('The business or order could not be identified.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await getBusinessOrderDetails(businessId, orderId);
      setOrder(result);
      setError('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load this order. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadOrder]);

  const currency = order?.currency || 'KES';
  const statusColor = order ? orderStatusColor(order.status) : C.muted;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to orders"
        >
          <ArrowLeft size={20} color={C.white} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>BUSINESS WORKSPACE</Text>
          <Text style={styles.headerTitle}>Order details</Text>
        </View>

        <Pressable
          onPress={() => void loadOrder(true)}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh order"
        >
          <RefreshCw size={18} color={C.lime} />
        </Pressable>
      </View>

      {loading && !order ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.lime} />
          <Text style={styles.stateText}>Loading order details...</Text>
        </View>
      ) : error && !order ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <AlertCircle size={25} color={C.red} />
          </View>
          <Text style={styles.stateTitle}>Unable to load order</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable
            onPress={() => void loadOrder()}
            style={styles.retryButton}
          >
            <RefreshCw size={15} color={C.bg} />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : order ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadOrder(true)}
              tintColor={C.lime}
              colors={[C.lime]}
            />
          }
        >
          {error ? (
            <View style={styles.inlineError}>
              <AlertCircle size={15} color={C.red} />
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <ShoppingBag size={22} color={C.lime} />
              </View>
              <View style={styles.heroIdentity}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderDate}>
                  Placed {dateLabel(order.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <Text style={styles.totalCaption}>ORDER TOTAL</Text>
            <Text style={styles.totalAmount}>
              {money(order.totalAmount, currency)}
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  { borderColor: `${statusColor}66` },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {readable(order.status)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  {
                    borderColor: `${paymentStatusColor(order.paymentStatus)}66`,
                  },
                ]}
              >
                <Wallet
                  size={12}
                  color={paymentStatusColor(order.paymentStatus)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: paymentStatusColor(order.paymentStatus) },
                  ]}
                >
                  {readable(order.paymentStatus)}
                </Text>
              </View>
            </View>

            {order.reconciliationRequired ? (
              <View style={styles.reconciliationNotice}>
                <AlertCircle size={16} color={C.amber} />
                <Text style={styles.reconciliationText}>
                  This payment requires reconciliation attention.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionTitle title="Customer" subtitle="Marketplace order" />
            <View style={styles.panel}>
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerInitial}>
                    {(order.customerName || 'C').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.customerCopy}>
                  <Text style={styles.customerName}>
                    {order.customerName || 'Marketplace customer'}
                  </Text>
                  <Text style={styles.customerCaption}>
                    Customer details are protected
                  </Text>
                </View>
              </View>

              {order.customerNote ? (
                <View style={styles.noteBox}>
                  <View style={styles.noteHeading}>
                    <MessageSquareText size={15} color={C.lime} />
                    <Text style={styles.noteTitle}>Customer note</Text>
                  </View>
                  <Text style={styles.noteText}>{order.customerNote}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle
              title="Items ordered"
              subtitle={`${order.items.length} ${order.items.length === 1 ? 'item' : 'items'} in this seller order`}
            />

            <View style={styles.panel}>
              {order.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    index < order.items.length - 1 ? styles.itemDivider : null,
                  ]}
                >
                  <View style={styles.itemIcon}>
                    <Package size={19} color={C.lime} />
                  </View>

                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>
                      {item.itemNameSnapshot}
                    </Text>
                    {item.variantNameSnapshot ? (
                      <Text style={styles.itemMeta}>
                        {item.variantNameSnapshot}
                      </Text>
                    ) : null}
                    {item.skuSnapshot ? (
                      <Text style={styles.itemMeta}>SKU: {item.skuSnapshot}</Text>
                    ) : null}
                    <Text style={styles.itemQuantity}>
                      {item.quantity} × {money(item.unitPriceAmount, item.currency)}
                    </Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    {money(item.lineTotalAmount, item.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Payment breakdown" />
            <View style={styles.panel}>
              <DetailRow
                label="Items subtotal"
                value={money(order.itemsSubtotalAmount, currency)}
              />
              <DetailRow
                label="Delivery"
                value={money(order.deliveryFeeAmount, currency)}
              />
              <DetailRow
                label="Discount"
                value={`− ${money(order.discountAmount, currency)}`}
              />
              <DetailRow
                label="Tax"
                value={money(order.taxAmount, currency)}
              />
              <View style={styles.breakdownDivider} />
              <DetailRow
                label="Customer order total"
                value={money(order.totalAmount, currency)}
                strong
              />
              <View style={styles.breakdownDivider} />
              <DetailRow
                label={`Marketplace commission (${(order.commissionRateBps / 100).toFixed(2)}%)`}
                value={`− ${money(order.commissionAmount, currency)}`}
                valueColor={C.amber}
              />
              <View style={styles.sellerEstimate}>
                <View style={styles.estimateCopy}>
                  <Text style={styles.estimateTitle}>
                    Seller payable estimate
                  </Text>
                  <Text style={styles.estimateCaption}>
                    Estimated after marketplace commission
                  </Text>
                </View>
                <Text style={styles.estimateAmount}>
                  {money(order.sellerPayableEstimateAmount, currency)}
                </Text>
              </View>
              <Text style={styles.disclaimer}>
                This is an estimate, not a payout confirmation. Actual settlement
                and reconciliation are handled separately.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Fulfilment" />
            <View style={styles.panel}>
              <View style={styles.infoIconRow}>
                <View style={styles.smallIcon}>
                  <Truck size={17} color={C.lime} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>Fulfilment type</Text>
                  <Text style={styles.infoValue}>
                    {readable(order.fulfilmentType)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoIconRow}>
                <View style={styles.smallIcon}>
                  <CheckCircle2 size={17} color={C.lime} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>Fulfilment status</Text>
                  <Text style={styles.infoValue}>
                    {readable(order.fulfilmentStatus)}
                  </Text>
                </View>
              </View>

              {order.scheduledFor ? (
                <View style={styles.infoIconRow}>
                  <View style={styles.smallIcon}>
                    <CalendarDays size={17} color={C.lime} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>Scheduled for</Text>
                    <Text style={styles.infoValue}>
                      {dateLabel(order.scheduledFor)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {order.trackingReference ? (
                <View style={styles.infoIconRow}>
                  <View style={styles.smallIcon}>
                    <MapPin size={17} color={C.lime} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>Tracking reference</Text>
                    <Text style={styles.infoValue}>
                      {order.trackingReference}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Order timeline" subtitle="Recorded order events" />

            <View style={styles.panel}>
              {order.events.length ? (
                order.events.map((event, index) => {
                  const isLast = index === order.events.length - 1;

                  return (
                    <View key={event.id} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineDot,
                            isLast ? styles.timelineDotActive : null,
                          ]}
                        />
                        {!isLast ? <View style={styles.timelineLine} /> : null}
                      </View>

                      <View style={styles.timelineCopy}>
                        <Text style={styles.timelineTitle}>
                          {eventTitle(event)}
                        </Text>
                        {event.toStatus ? (
                          <Text style={styles.timelineMeta}>
                            {readable(event.toStatus)}
                          </Text>
                        ) : null}
                        <Text style={styles.timelineDate}>
                          {dateLabel(event.createdAt)}
                        </Text>
                        {event.actorNameSnapshot ? (
                          <Text style={styles.timelineActor}>
                            By {event.actorNameSnapshot}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyTimeline}>
                  <Clock3 size={20} color={C.muted} />
                  <Text style={styles.emptyTimelineText}>
                    No timeline events have been recorded yet.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footerNote}>
            <ReceiptText size={15} color={C.muted} />
            <Text style={styles.footerText}>
              This screen displays product marketplace orders only. Property
              rentals, viewings, inspections and short-stay bookings use their
              separate workflows.
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 19,
    paddingTop: 9,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  headerEyebrow: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 18, paddingBottom: 42 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#342020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.lime,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 12,
    marginTop: 19,
  },
  retryText: { color: C.bg, fontSize: 12, fontWeight: '900' },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#30221A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 13,
  },
  inlineErrorText: { color: C.amber, fontSize: 11, flex: 1 },
  heroCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 21,
    padding: 17,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#293321',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIdentity: { flex: 1 },
  orderNumber: { color: C.white, fontSize: 14, fontWeight: '900' },
  orderDate: { color: C.muted, fontSize: 10, marginTop: 5 },
  heroDivider: { height: 1, backgroundColor: C.border, marginVertical: 17 },
  totalCaption: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  totalAmount: {
    color: C.white,
    fontSize: 29,
    fontWeight: '900',
    marginTop: 5,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900' },
  reconciliationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#30291A',
    borderRadius: 11,
    padding: 11,
    marginTop: 14,
  },
  reconciliationText: { color: C.amber, fontSize: 10, flex: 1, lineHeight: 16 },
  section: { marginTop: 23 },
  sectionHeading: { marginBottom: 11 },
  sectionTitle: { color: C.white, fontSize: 15, fontWeight: '900' },
  sectionSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  panel: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 15,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#293321',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: { color: C.lime, fontSize: 16, fontWeight: '900' },
  customerCopy: { flex: 1 },
  customerName: { color: C.white, fontSize: 13, fontWeight: '800' },
  customerCaption: { color: C.muted, fontSize: 10, marginTop: 4 },
  noteBox: {
    backgroundColor: C.soft,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },
  noteHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  noteTitle: { color: C.white, fontSize: 11, fontWeight: '800' },
  noteText: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 12 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#293321',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCopy: { flex: 1 },
  itemName: { color: C.white, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  itemMeta: { color: C.muted, fontSize: 10, marginTop: 3 },
  itemQuantity: { color: C.muted, fontSize: 10, marginTop: 6 },
  itemTotal: {
    color: C.white,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
    paddingTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  detailLabel: { color: C.muted, fontSize: 11, flex: 1 },
  detailValue: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  detailValueStrong: { fontSize: 13, fontWeight: '900' },
  breakdownDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  sellerEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#20291B',
    borderWidth: 1,
    borderColor: '#354326',
    borderRadius: 13,
    padding: 12,
    marginTop: 9,
  },
  estimateCopy: { flex: 1 },
  estimateTitle: { color: C.white, fontSize: 11, fontWeight: '900' },
  estimateCaption: { color: C.muted, fontSize: 9, marginTop: 4 },
  estimateAmount: { color: C.lime, fontSize: 15, fontWeight: '900' },
  disclaimer: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 10 },
  infoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  smallIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: { flex: 1 },
  infoLabel: { color: C.muted, fontSize: 10 },
  infoValue: { color: C.white, fontSize: 12, fontWeight: '800', marginTop: 4 },
  timelineRow: { flexDirection: 'row', minHeight: 66 },
  timelineRail: { width: 23, alignItems: 'center' },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.muted,
    marginTop: 4,
  },
  timelineDotActive: { backgroundColor: C.lime, width: 12, height: 12, borderRadius: 6 },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: C.border,
    marginTop: 4,
    marginBottom: 1,
  },
  timelineCopy: { flex: 1, paddingBottom: 17 },
  timelineTitle: { color: C.white, fontSize: 11, fontWeight: '900' },
  timelineMeta: { color: C.lime, fontSize: 10, marginTop: 4 },
  timelineDate: { color: C.muted, fontSize: 9, marginTop: 5 },
  timelineActor: { color: C.muted, fontSize: 9, marginTop: 4 },
  emptyTimeline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  emptyTimelineText: { color: C.muted, fontSize: 11, flex: 1 },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 23,
    paddingHorizontal: 2,
  },
  footerText: { color: C.muted, fontSize: 10, lineHeight: 16, flex: 1 },
});
