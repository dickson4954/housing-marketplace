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
  Banknote,
  CheckCircle2,
  Clock3,
  Percent,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import {
  getBusinessFinanceCommission,
  getBusinessFinanceOverview,
  getBusinessFinanceReconciliation,
  getBusinessFinanceTransactions,
  type BusinessFinanceCommissionOrder,
  type BusinessFinanceOverview,
  type BusinessFinancePagination,
  type BusinessFinanceReconciliationOrder,
  type BusinessFinanceTransaction,
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

type FinanceTab = 'overview' | 'transactions' | 'commission' | 'reconciliation';

const TABS: { label: string; value: FinanceTab }[] = [
  { label: 'Overview', value: 'overview' },
  { label: 'Transactions', value: 'transactions' },
  { label: 'Commission', value: 'commission' },
  { label: 'Reconciliation', value: 'reconciliation' },
];

function money(amount: number, currency = 'KES') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safeAmount.toLocaleString('en-KE')}`;
}

function dateLabel(value?: string | null) {
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

function humanize(value?: string | null) {
  return value ? value.replace(/_/g, ' ').toLowerCase() : 'Not recorded';
}

function statusColor(value?: string | null) {
  const status = (value || '').toUpperCase();
  if (['SUCCESS', 'PAID', 'COMPLETED'].includes(status)) return C.green;
  if (['PENDING', 'PROCESSING', 'UNPAID'].includes(status)) return C.amber;
  if (['FAILED', 'REFUNDED', 'CANCELLED', 'REJECTED'].includes(status)) {
    return C.red;
  }
  return C.muted;
}

function StatusPill({ value }: { value: string }) {
  const color = statusColor(value);

  return (
    <View style={[styles.statusPill, { borderColor: `${color}66` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{humanize(value)}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = C.lime,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}18` }]}>
        {icon}
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function SectionHeading({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDetail}>{detail}</Text>
    </View>
  );
}

function PaymentRow({
  item,
}: {
  item: BusinessFinanceTransaction;
}) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <View style={styles.recordIcon}>
          <Receipt size={18} color={C.lime} />
        </View>
        <View style={styles.recordIdentity}>
          <Text style={styles.recordTitle} numberOfLines={1}>
            {item.orderNumber}
          </Text>
          <Text style={styles.recordSubtitle}>
            {item.reference || item.providerReference || 'Payment reference unavailable'}
          </Text>
        </View>
        <StatusPill value={item.status} />
      </View>

      <View style={styles.recordDivider} />

      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>This business's order amount</Text>
        <Text style={styles.recordAmount}>
          {money(item.orderAmount, item.currency)}
        </Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Payment method</Text>
        <Text style={styles.recordValue}>
          {humanize(item.method || item.provider)}
        </Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Order payment status</Text>
        <Text style={[styles.recordValue, { color: statusColor(item.orderPaymentStatus) }]}>
          {humanize(item.orderPaymentStatus)}
        </Text>
      </View>
      <Text style={styles.recordDate}>{dateLabel(item.paidAt || item.createdAt)}</Text>

      {item.failureReason ? (
        <View style={styles.warningBox}>
          <AlertCircle size={14} color={C.amber} />
          <Text style={styles.warningText}>{item.failureReason}</Text>
        </View>
      ) : null}

      {item.status === 'REFUNDED' || item.refundedAt ? (
        <Text style={styles.refundNote}>
          Refund status recorded{item.refundedAt ? ` · ${dateLabel(item.refundedAt)}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

function CommissionRow({ item }: { item: BusinessFinanceCommissionOrder }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <View style={styles.recordIcon}>
          <Percent size={18} color={C.lime} />
        </View>
        <View style={styles.recordIdentity}>
          <Text style={styles.recordTitle}>{item.orderNumber}</Text>
          <Text style={styles.recordSubtitle}>Paid product order</Text>
        </View>
        <Text style={styles.rateText}>
          {item.commissionRatePercent.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.recordDivider} />
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Order value</Text>
        <Text style={styles.recordValue}>{money(item.totalAmount, item.currency)}</Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Product subtotal</Text>
        <Text style={styles.recordValue}>
          {money(item.itemsSubtotalAmount, item.currency)}
        </Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Saved commission</Text>
        <Text style={[styles.recordValue, { color: C.amber }]}>
          {money(item.commissionAmount, item.currency)}
        </Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Seller payable estimate</Text>
        <Text style={[styles.recordAmount, { color: C.green }]}>
          {money(item.sellerPayableEstimateAmount, item.currency)}
        </Text>
      </View>
      <Text style={styles.recordDate}>Paid {dateLabel(item.paidAt)}</Text>
    </View>
  );
}

function ReconciliationRow({
  item,
}: {
  item: BusinessFinanceReconciliationOrder;
}) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTop}>
        <View style={[styles.recordIcon, { backgroundColor: '#F4C66A18' }]}>
          <AlertCircle size={18} color={C.amber} />
        </View>
        <View style={styles.recordIdentity}>
          <Text style={styles.recordTitle}>{item.orderNumber}</Text>
          <Text style={styles.recordSubtitle}>
            {item.checkoutReference || 'Checkout reference unavailable'}
          </Text>
        </View>
        <StatusPill value={item.paymentStatus} />
      </View>

      <View style={styles.recordDivider} />
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>This seller order</Text>
        <Text style={styles.recordAmount}>
          {money(item.totalAmount, item.currency)}
        </Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Order status</Text>
        <Text style={styles.recordValue}>{humanize(item.status)}</Text>
      </View>
      <View style={styles.recordLine}>
        <Text style={styles.recordLabel}>Reconciliation flag</Text>
        <Text style={[styles.recordValue, {
          color: item.reconciliationRequired ? C.amber : C.muted,
        }]}>
          {item.reconciliationRequired ? 'Requires attention' : 'Unresolved payment'}
        </Text>
      </View>

      {item.reconciliationReason ? (
        <View style={styles.warningBox}>
          <AlertCircle size={14} color={C.amber} />
          <Text style={styles.warningText}>{item.reconciliationReason}</Text>
        </View>
      ) : null}

      <Text style={styles.recordDate}>
        Updated {dateLabel(item.updatedAt)}
      </Text>

      {item.payments.length > 0 ? (
        <View style={styles.attemptSection}>
          <Text style={styles.attemptHeading}>Payment attempts</Text>
          {item.payments.map((payment, index) => (
            <View key={`${payment.id}-${index}`} style={styles.attemptRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.attemptReference}>
                  {payment.reference || payment.providerReference || 'Reference unavailable'}
                </Text>
                <Text style={styles.attemptDate}>{dateLabel(payment.createdAt)}</Text>
              </View>
              <StatusPill value={payment.status} />
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noAttempt}>No ORDER payment attempt is recorded.</Text>
      )}
    </View>
  );
}

function EmptyState({
  title,
  detail,
  error,
  onRetry,
}: {
  title: string;
  detail: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        {error
          ? <AlertCircle size={24} color={C.red} />
          : <CheckCircle2 size={24} color={C.green} />}
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{detail}</Text>
      {onRetry ? (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <RefreshCw size={14} color={C.bg} />
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function BusinessFinanceScreen() {
  const params = useLocalSearchParams<{
    businessId: string | string[];
  }>();

  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [overview, setOverview] = useState<BusinessFinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<BusinessFinanceTransaction[]>([]);
  const [commissionOrders, setCommissionOrders] = useState<BusinessFinanceCommissionOrder[]>([]);
  const [commissionTotals, setCommissionTotals] = useState<{
    paidOrderValue: number;
    commissionAmount: number;
    sellerPayableEstimate: number;
  } | null>(null);
  const [reconciliationOrders, setReconciliationOrders] = useState<BusinessFinanceReconciliationOrder[]>([]);
  const [pagination, setPagination] = useState<BusinessFinancePagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(
      (`/business/workspace/${encodeURIComponent(businessId || '')}`) as any,
    );
  };

  const loadOverview = useCallback(async (refresh = false) => {
    if (!businessId) {
      setError('The business workspace could not be identified.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await getBusinessFinanceOverview(businessId);
      setOverview(result);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Finance overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  const loadTab = useCallback(async (
    page = 1,
    append = false,
    refresh = false,
  ) => {
    if (!businessId || activeTab === 'overview') return;

    if (append) setLoadingMore(true);
    else if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      if (activeTab === 'transactions') {
        const result = await getBusinessFinanceTransactions(businessId, { page, limit: 20 });
        setTransactions((current) => append ? [...current, ...result.transactions] : result.transactions);
        setPagination(result.pagination);
      } else if (activeTab === 'commission') {
        const result = await getBusinessFinanceCommission(businessId, { page, limit: 20 });
        setCommissionOrders((current) => append ? [...current, ...result.orders] : result.orders);
        setCommissionTotals(result.totals);
        setPagination(result.pagination);
      } else {
        const result = await getBusinessFinanceReconciliation(businessId, { page, limit: 20 });
        setReconciliationOrders((current) => append ? [...current, ...result.orders] : result.orders);
        setPagination(result.pagination);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Finance records.');
      if (!append) {
        if (activeTab === 'transactions') setTransactions([]);
        if (activeTab === 'commission') {
          setCommissionOrders([]);
          setCommissionTotals(null);
        }
        if (activeTab === 'reconciliation') setReconciliationOrders([]);
        setPagination(null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [businessId, activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') {
      void loadOverview();
    } else {
      void loadTab();
    }
  }, [activeTab, loadOverview, loadTab]);

  const refresh = () => {
    if (activeTab === 'overview') {
      void loadOverview(true);
    } else {
      void loadTab(1, false, true);
    }
  };

  const loadMore = () => {
    if (!pagination?.hasNextPage || loadingMore || loading) return;
    void loadTab(pagination.page + 1, true);
  };

  const currency = overview?.currency || 'KES';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={goBack}>
          <ArrowLeft size={19} color={C.white} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>BUSINESS WORKSPACE</Text>
          <Text style={styles.headerTitle}>Finance</Text>
        </View>
        <Pressable style={styles.headerButton} onPress={refresh}>
          <RefreshCw size={17} color={C.lime} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Wallet size={22} color={C.lime} />
            </View>
            <View style={styles.heroBadge}>
              <ShieldCheck size={12} color={C.green} />
              <Text style={styles.heroBadgeText}>PRODUCT MARKETPLACE</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Your business</Text>
          <Text style={styles.heroAccent}>finances.</Text>
          <Text style={styles.heroDescription}>
            Review verified product-order payments, saved marketplace commission,
            estimated seller earnings and payment records requiring attention.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabStrip}
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => {
                  setError('');
                  setPagination(null);
                  setActiveTab(tab.value);
                }}
                style={[styles.tab, selected && styles.tabActive]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={C.lime} />
            <Text style={styles.stateTitle}>Loading {activeTab}</Text>
            <Text style={styles.stateDescription}>
              Retrieving records for this authorised business.
            </Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Finance records unavailable"
            detail={error}
            error
            onRetry={refresh}
          />
        ) : activeTab === 'overview' ? (
          overview ? (
            <>
              <View style={styles.verifiedBanner}>
                <CheckCircle2 size={16} color={C.green} />
                <Text style={styles.verifiedText}>
                  Verified paid totals · {overview.verifiedPaidOrderCount} seller orders
                </Text>
              </View>

              <View style={styles.metricGrid}>
                <MetricCard
                  label="Paid order value"
                  value={money(overview.paidOrderValue, currency)}
                  detail="Verified successful payments"
                  icon={<Banknote size={18} color={C.green} />}
                  accent={C.green}
                />
                <MetricCard
                  label="Commission"
                  value={money(overview.commissionTotal, currency)}
                  detail="Saved order commission"
                  icon={<Percent size={18} color={C.lime} />}
                />
                <MetricCard
                  label="Seller payable estimate"
                  value={money(overview.sellerPayableEstimate, currency)}
                  detail="Not a payout or settlement"
                  icon={<Wallet size={18} color={C.green} />}
                  accent={C.green}
                />
                <MetricCard
                  label="All product orders"
                  value={overview.totalOrders.toLocaleString('en-KE')}
                  detail="Orders for this business"
                  icon={<Receipt size={18} color={C.lime} />}
                />
              </View>

              <SectionHeading
                title="Payment health"
                detail="Order-level records"
              />
              <View style={styles.healthCard}>
                <View style={styles.healthRow}>
                  <View style={styles.healthLabelWrap}>
                    <Clock3 size={16} color={C.amber} />
                    <Text style={styles.healthLabel}>Pending / unpaid orders</Text>
                  </View>
                  <Text style={[styles.healthValue, { color: C.amber }]}>
                    {overview.pendingOrders}
                  </Text>
                </View>
                <View style={styles.healthDivider} />
                <View style={styles.healthRow}>
                  <View style={styles.healthLabelWrap}>
                    <AlertCircle size={16} color={C.red} />
                    <Text style={styles.healthLabel}>Failed orders</Text>
                  </View>
                  <Text style={[styles.healthValue, { color: C.red }]}>
                    {overview.failedOrders}
                  </Text>
                </View>
                <View style={styles.healthDivider} />
                <View style={styles.healthRow}>
                  <View style={styles.healthLabelWrap}>
                    <AlertCircle size={16} color={C.amber} />
                    <Text style={styles.healthLabel}>Reconciliation required</Text>
                  </View>
                  <Text style={[styles.healthValue, { color: C.amber }]}>
                    {overview.reconciliationRequired}
                  </Text>
                </View>
                <View style={styles.healthDivider} />
                <View style={styles.healthRow}>
                  <View style={styles.healthLabelWrap}>
                    <Receipt size={16} color={C.muted} />
                    <Text style={styles.healthLabel}>Refunded payment records</Text>
                  </View>
                  <Text style={styles.healthValue}>{overview.refundedPayments}</Text>
                </View>
              </View>

              <SectionHeading
                title="Recent payment activity"
                detail="Latest marketplace payment attempts"
              />
              {overview.recentPayments.length === 0 ? (
                <EmptyState
                  title="No payment activity yet"
                  detail="Payment attempts for product orders belonging to this business will appear here."
                />
              ) : (
                overview.recentPayments.map((item, index) => (
                  <View key={`${item.id}-${item.orderNumber}-${index}`} style={styles.recordCard}>
                    <View style={styles.recordTop}>
                      <View style={styles.recordIcon}>
                        <Receipt size={18} color={C.lime} />
                      </View>
                      <View style={styles.recordIdentity}>
                        <Text style={styles.recordTitle}>{item.orderNumber}</Text>
                        <Text style={styles.recordSubtitle}>
                          {item.reference || item.providerReference || 'Reference unavailable'}
                        </Text>
                      </View>
                      <StatusPill value={item.status} />
                    </View>
                    <View style={styles.recordLine}>
                      <Text style={styles.recordLabel}>Business order amount</Text>
                      <Text style={styles.recordAmount}>
                        {money(item.orderAmount, item.currency)}
                      </Text>
                    </View>
                    <Text style={styles.recordDate}>
                      {dateLabel(item.paidAt || item.createdAt)}
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.disclaimerCard}>
                <ShieldCheck size={16} color={C.green} />
                <Text style={styles.disclaimerText}>{overview.financialBasis}</Text>
              </View>
            </>
          ) : (
            <EmptyState
              title="No overview available"
              detail="The Finance overview has not returned any data."
              onRetry={refresh}
              error
            />
          )
        ) : activeTab === 'transactions' ? (
          <>
            <SectionHeading
              title="Payment transactions"
              detail="Payment attempts linked to this business's seller orders"
            />
            {transactions.length === 0 ? (
              <EmptyState
                title="No transactions found"
                detail="Product-order payment attempts for this business will appear here."
              />
            ) : (
              transactions.map((item, index) => (
                <PaymentRow key={`${item.id}-${item.orderId}-${index}`} item={item} />
              ))
            )}
          </>
        ) : activeTab === 'commission' ? (
          <>
            <View style={styles.commissionSummary}>
              <Text style={styles.summaryEyebrow}>SAVED COMMISSION SNAPSHOTS</Text>
              <Text style={styles.summaryValue}>
                {money(commissionTotals?.commissionAmount ?? 0, currency)}
              </Text>
              <Text style={styles.summaryCaption}>
                Total saved commission across all verified paid seller orders
              </Text>
            </View>
            <SectionHeading
              title="Commission by order"
              detail="Immutable rate and amount saved on each paid seller order"
            />
            {commissionOrders.length === 0 ? (
              <EmptyState
                title="No commission records yet"
                detail="Eligible verified paid product orders will appear here."
              />
            ) : (
              commissionOrders.map((item) => (
                <CommissionRow key={item.id} item={item} />
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.reconciliationIntro}>
              <AlertCircle size={17} color={C.amber} />
              <Text style={styles.reconciliationIntroText}>
                Review unpaid, pending, failed or flagged product orders. This view
                is informational; it does not retry payments or change order status.
              </Text>
            </View>
            <SectionHeading
              title="Orders requiring review"
              detail="Payment status and recorded attempts"
            />
            {reconciliationOrders.length === 0 ? (
              <EmptyState
                title="No orders need review"
                detail="There are no unpaid, pending, failed or flagged product orders in this business's reconciliation list."
              />
            ) : (
              reconciliationOrders.map((item) => (
                <ReconciliationRow key={item.id} item={item} />
              ))
            )}
          </>
        )}

        {activeTab !== 'overview' && pagination ? (
          <View style={styles.paginationRow}>
            <Text style={styles.paginationText}>
              Showing {activeTab === 'transactions'
                ? transactions.length
                : activeTab === 'commission'
                  ? commissionOrders.length
                  : reconciliationOrders.length} of {pagination.total}
            </Text>
            {pagination.hasNextPage ? (
              <Pressable
                style={styles.loadMoreButton}
                onPress={loadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? <ActivityIndicator size="small" color={C.lime} />
                  : <Text style={styles.loadMoreText}>Load more</Text>}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footerNote}>
          <CheckCircle2 size={15} color={C.green} />
          <Text style={styles.footerText}>
            Finance covers product marketplace orders only. Property rentals,
            viewings, inspections, short-stay bookings and their payments are
            kept separate.
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
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#202729',
    gap: 13,
    backgroundColor: C.bg,
  },
  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#171E20',
    borderWidth: 1,
    borderColor: '#2B3436',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: '#899496',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  headerTitle: {
    color: C.white,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 55,
    gap: 19,
  },

  hero: {
    backgroundColor: '#151D19',
    borderColor: '#35452D',
    borderWidth: 1,
    borderRadius: 25,
    padding: 21,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  heroIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: '#D7FF5F1C',
    borderWidth: 1,
    borderColor: '#D7FF5F30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: '#0D1310',
    borderWidth: 1,
    borderColor: '#30402C',
  },
  heroBadgeText: {
    color: C.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  heroTitle: {
    color: C.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroAccent: {
    color: C.lime,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginTop: -3,
  },
  heroDescription: {
    color: '#AAB6AF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
    maxWidth: 330,
  },

  tabStrip: {
    gap: 9,
    paddingVertical: 3,
    paddingRight: 18,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#141A1C',
    borderWidth: 1,
    borderColor: '#283133',
  },
  tabActive: {
    backgroundColor: '#D7FF5F',
    borderColor: C.lime,
  },
  tabText: {
    color: '#9CA7A9',
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#111713',
    fontWeight: '900',
  },

  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 15,
    backgroundColor: '#142019',
    borderWidth: 1,
    borderColor: '#294936',
  },
  verifiedText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  metricCard: {
    width: '47%',
    minWidth: 130,
    flexGrow: 1,
    minHeight: 151,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#151C1E',
    borderWidth: 1,
    borderColor: '#293234',
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  metricLabel: {
    color: '#9CA8AA',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
  },
  metricValue: {
    color: C.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 7,
  },
  metricDetail: {
    color: '#758184',
    fontSize: 9,
    marginTop: 6,
    lineHeight: 14,
  },

  sectionHeading: {
    gap: 5,
    marginTop: 7,
    marginBottom: 1,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  sectionDetail: {
    color: '#879395',
    fontSize: 10,
    lineHeight: 15,
  },

  healthCard: {
    backgroundColor: '#151C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#293234',
    paddingHorizontal: 16,
  },
  healthRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  healthLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  healthLabel: {
    color: '#D2DADB',
    fontSize: 11,
    fontWeight: '600',
  },
  healthValue: {
    color: C.white,
    fontSize: 18,
    fontWeight: '900',
  },
  healthDivider: { height: 1, backgroundColor: '#293234' },

  recordCard: {
    backgroundColor: '#151C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3436',
    padding: 16,
    gap: 12,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  recordIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#D7FF5F16',
    borderWidth: 1,
    borderColor: '#D7FF5F20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIdentity: { flex: 1, gap: 4 },
  recordTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: '900',
  },
  recordSubtitle: {
    color: '#8D999B',
    fontSize: 9,
    lineHeight: 14,
  },
  recordDivider: {
    height: 1,
    backgroundColor: '#293234',
    marginVertical: 1,
  },
  recordLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordLabel: {
    color: '#8F9B9D',
    fontSize: 10,
    flex: 1,
  },
  recordValue: {
    color: '#E3E9E9',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  recordAmount: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  recordDate: {
    color: '#788588',
    fontSize: 9,
    marginTop: 2,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 30,
    backgroundColor: '#101618',
    borderWidth: 1,
    maxWidth: 125,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  rateText: {
    color: C.lime,
    fontSize: 16,
    fontWeight: '900',
  },

  commissionSummary: {
    padding: 20,
    borderRadius: 21,
    backgroundColor: '#172119',
    borderWidth: 1,
    borderColor: '#394B30',
    gap: 9,
  },
  summaryEyebrow: {
    color: '#A2B09E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  summaryValue: {
    color: C.lime,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  summaryCaption: {
    color: '#AAB7A8',
    fontSize: 10,
    lineHeight: 16,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#282216',
    borderWidth: 1,
    borderColor: '#59482B',
  },
  warningText: {
    color: '#EACB8D',
    fontSize: 10,
    lineHeight: 16,
    flex: 1,
  },
  refundNote: {
    color: C.amber,
    fontSize: 9,
    lineHeight: 15,
  },

  reconciliationIntro: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#282216',
    borderWidth: 1,
    borderColor: '#59482B',
  },
  reconciliationIntroText: {
    color: '#D9C99F',
    fontSize: 10,
    lineHeight: 17,
    flex: 1,
  },
  attemptSection: {
    borderTopWidth: 1,
    borderTopColor: '#293234',
    paddingTop: 13,
    gap: 11,
  },
  attemptHeading: {
    color: '#A4AFB1',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  attemptReference: {
    color: '#E1E7E7',
    fontSize: 9,
    fontWeight: '700',
  },
  attemptDate: {
    color: '#788588',
    fontSize: 8,
    marginTop: 4,
  },
  noAttempt: {
    color: '#8B9799',
    fontSize: 9,
    lineHeight: 15,
  },

  loadingCard: {
    minHeight: 205,
    backgroundColor: '#151C1E',
    borderWidth: 1,
    borderColor: '#293234',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  stateCard: {
    minHeight: 190,
    backgroundColor: '#151C1E',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#293234',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    gap: 11,
  },
  stateIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#1D2729',
    borderWidth: 1,
    borderColor: '#303C3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateDescription: {
    color: '#96A2A4',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.lime,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 13,
    marginTop: 6,
  },
  retryText: {
    color: '#111713',
    fontSize: 10,
    fontWeight: '900',
  },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  paginationText: {
    color: '#8F9B9D',
    fontSize: 10,
  },
  loadMoreButton: {
    minWidth: 105,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: '#182022',
    borderWidth: 1,
    borderColor: '#354144',
  },
  loadMoreText: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '900',
  },

  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    backgroundColor: '#142019',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#294936',
  },
  disclaimerText: {
    color: '#B0BDB3',
    fontSize: 9,
    lineHeight: 16,
    flex: 1,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#293234',
  },
  footerText: {
    color: '#879395',
    fontSize: 9,
    lineHeight: 16,
    flex: 1,
  },
});