import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  Star,
  ThumbsUp,
} from 'lucide-react-native';

import { API_BASE_URL } from '@/config/api';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  warning: '#FFB84D',
  danger: '#FF6B6B',
  success: '#7FE08A',
};

const MARKETER_TOKEN_KEY = 'makazii_marketer_token';

type Filter = 'All' | 'Ratings' | 'Concerns';

type FeedbackCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

type FeedbackProperty = {
  id: string;
  title: string;
  purpose: string;
  longStayType: string | null;
  shortStayType: string | null;
  monthlyRent: number | null;
  viewingFee: number | null;
  dayRate: number | null;
  nightRate: number | null;
  dayNightRate: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  beds: number | null;
  rooms: number | null;
  maxGuests: number | null;
  furnishing: string | null;
  county: string | null;
  town: string | null;
  area: string | null;
  available: boolean;
  verified: boolean;
  status: string;
};

type FeedbackViewing = {
  id: string;
  propertyId: string;
  renterId: string;
  status: string;
  requestedDate: string | null;
  preferredTime: string | null;
  scheduledAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
};

type MarketerRating = {
  id: string;
  category: string;
  rating: number | null;
  message: string;
  propertyId: string | null;
  viewingId: string | null;
  marketerId: string | null;
  createdAt: string;
  customer: FeedbackCustomer | null;
  property: FeedbackProperty | null;
  viewing: FeedbackViewing | null;
};

type MarketerConcern = {
  id: string;
  category: string;
  customerCategory: string | null;
  message: string;
  propertyId: string | null;
  viewingId: string | null;
  marketerId: string | null;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: FeedbackCustomer | null;
  property: FeedbackProperty | null;
  viewing: FeedbackViewing | null;
};

type FeedbackResponse = {
  success: boolean;
  message?: string;
  data?: {
    ratings?: MarketerRating[];
    concerns?: MarketerConcern[];
    ratingCount?: number;
    concernCount?: number;
    openConcernCount?: number;
  };
};

export default function MarketerFeedbackScreen() {
  const [ratings, setRatings] = useState<MarketerRating[]>([]);
  const [concerns, setConcerns] = useState<MarketerConcern[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFeedback = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage(null);

      const token = await SecureStore.getItemAsync(MARKETER_TOKEN_KEY);

      if (!token) {
        setErrorMessage('Your marketer session has expired. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/marketer/feedback`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const body = (await response.json()) as FeedbackResponse;

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync(MARKETER_TOKEN_KEY);
        setRatings([]);
        setConcerns([]);
        setErrorMessage('Your marketer session has expired. Please log in again.');
        return;
      }

      if (!response.ok || !body.success) {
        throw new Error(
          body.message || 'Failed to load marketer feedback.',
        );
      }

      setRatings(body.data?.ratings ?? []);
      setConcerns(body.data?.concerns ?? []);
    } catch (error) {
      console.error('Marketer feedback load error:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load marketer feedback.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFeedback();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadFeedback]);

  const ratingCount = ratings.length;
  const concernCount = concerns.length;

  const averageRating = useMemo(() => {
    const validRatings = ratings.filter(
      (rating) =>
        typeof rating.rating === 'number' &&
        rating.rating >= 1 &&
        rating.rating <= 5,
    );

    if (validRatings.length === 0) {
      return '0.0';
    }

    const total = validRatings.reduce(
      (sum, rating) => sum + (rating.rating ?? 0),
      0,
    );

    return (total / validRatings.length).toFixed(1);
  }, [ratings]);

  const openConcerns = useMemo(
    () =>
      concerns.filter((concern) => {
        const status = concern.status.toUpperCase();

        return (
          status === 'OPEN' ||
          status === 'UNDER_REVIEW' ||
          status === 'IN_PROGRESS'
        );
      }).length,
    [concerns],
  );

  const feedbackItems = useMemo(() => {
    const ratingItems = ratings.map((rating) => ({
      id: `rating-${rating.id}`,
      type: 'rating' as const,
      createdAt: rating.createdAt,
      rating,
    }));

    const concernItems = concerns.map((concern) => ({
      id: `concern-${concern.id}`,
      type: 'concern' as const,
      createdAt: concern.createdAt,
      concern,
    }));

    const items = [...ratingItems, ...concernItems];

    if (filter === 'Ratings') {
      return items
        .filter((item) => item.type === 'rating')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
    }

    if (filter === 'Concerns') {
      return items
        .filter((item) => item.type === 'concern')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
    }

    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  }, [ratings, concerns, filter]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) {
      return 'Date unavailable';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCustomerName = (
    customer: FeedbackCustomer | null,
  ) => {
    if (!customer) {
      return 'Customer';
    }

    const fullName = `${customer.firstName ?? ''} ${
      customer.lastName ?? ''
    }`.trim();

    return fullName || 'Customer';
  };

  const getCustomerInitial = (
    customer: FeedbackCustomer | null,
  ) => {
    const name = getCustomerName(customer);

    return name.charAt(0).toUpperCase();
  };

  const formatCategory = (value: string | null | undefined) => {
    if (!value) {
      return 'General';
    }

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getConcernStatusLabel = (status: string) => {
    return formatCategory(status);
  };

  const renderStars = (ratingValue: number) => {
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={15}
            color={
              index < ratingValue
                ? COLORS.warning
                : COLORS.border
            }
            fill={
              index < ratingValue
                ? COLORS.warning
                : 'transparent'
            }
            strokeWidth={1.8}
          />
        ))}
      </View>
    );
  };

  const renderRating = (item: {
    type: 'rating';
    rating: MarketerRating;
  }) => {
    const rating = item.rating;
    const customerName = getCustomerName(rating.customer);
    const stars = rating.rating ?? 0;

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.typeIconRating}>
            <ThumbsUp size={18} color={COLORS.lime} />
          </View>

          <View style={styles.cardTopContent}>
            <View style={styles.titleRow}>
              <Text style={styles.feedbackTitle}>
                Customer Rating
              </Text>

              <View style={styles.ratingBadge}>
                <Star
                  size={12}
                  color={COLORS.warning}
                  fill={COLORS.warning}
                />

                <Text style={styles.ratingBadgeText}>
                  {stars}/5
                </Text>
              </View>
            </View>

            <Text
              style={styles.propertyName}
              numberOfLines={1}
            >
              {rating.property?.title ?? 'Property unavailable'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getCustomerInitial(rating.customer)}
            </Text>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {customerName}
            </Text>

            <Text style={styles.dateText}>
              {formatDate(rating.createdAt)}
            </Text>
          </View>
        </View>

        {stars > 0 ? renderStars(stars) : null}

        {rating.message ? (
          <View style={styles.commentBox}>
            <MessageSquareText
              size={16}
              color={COLORS.muted}
              style={styles.commentIcon}
            />

            <Text style={styles.commentText}>
              {rating.message}
            </Text>
          </View>
        ) : (
          <Text style={styles.noComment}>
            No written comment
          </Text>
        )}
      </View>
    );
  };

  const renderConcern = (item: {
    type: 'concern';
    concern: MarketerConcern;
  }) => {
    const concern = item.concern;

    const status = concern.status.toUpperCase();

    const statusStyle =
      status === 'RESOLVED'
        ? styles.statusResolved
        : status === 'DISMISSED'
          ? styles.statusDismissed
          : status === 'UNDER_REVIEW' ||
              status === 'IN_PROGRESS'
            ? styles.statusReview
            : styles.statusOpen;

    const statusTextStyle =
      status === 'RESOLVED'
        ? styles.statusResolvedText
        : status === 'DISMISSED'
          ? styles.statusDismissedText
          : status === 'UNDER_REVIEW' ||
              status === 'IN_PROGRESS'
            ? styles.statusReviewText
            : styles.statusOpenText;

    const customerName = getCustomerName(
      concern.customer,
    );

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.typeIconConcern}>
            <AlertTriangle
              size={18}
              color={COLORS.warning}
            />
          </View>

          <View style={styles.cardTopContent}>
            <View style={styles.titleRow}>
              <Text style={styles.feedbackTitle}>
                Customer Concern
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  statusStyle,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    statusTextStyle,
                  ]}
                >
                  {getConcernStatusLabel(
                    concern.status,
                  )}
                </Text>
              </View>
            </View>

            <Text
              style={styles.propertyName}
              numberOfLines={1}
            >
              {concern.property?.title ??
                'Property unavailable'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.categoryRow}>
          <Text style={styles.categoryLabel}>
            Category
          </Text>

          <Text style={styles.categoryValue}>
            {formatCategory(
              concern.customerCategory ??
                concern.category,
            )}
          </Text>
        </View>

        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getCustomerInitial(concern.customer)}
            </Text>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {customerName}
            </Text>

            <Text style={styles.dateText}>
              {formatDate(concern.createdAt)}
            </Text>
          </View>
        </View>

        {concern.message ? (
          <View style={styles.concernBox}>
            <Text style={styles.concernText}>
              {concern.message}
            </Text>
          </View>
        ) : null}

        {concern.adminResponse ? (
          <View style={styles.adminNoteBox}>
            <Text style={styles.adminNoteLabel}>
              Admin response
            </Text>

            <Text style={styles.adminNoteText}>
              {concern.adminResponse}
            </Text>

            {concern.respondedAt ? (
              <Text style={styles.adminResponseDate}>
                Responded {formatDate(concern.respondedAt)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const renderItem = ({
    item,
  }: {
    item: (typeof feedbackItems)[number];
  }) => {
    if (item.type === 'rating') {
      return renderRating(item);
    }

    return renderConcern(item);
  };

  const handleLoginRedirect = () => {
    router.replace('/marketer/login');
  };

  const renderHeader = () => (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Star
              size={19}
              color={COLORS.warning}
              fill={COLORS.warning}
            />
          </View>

          <Text style={styles.statValue}>
            {averageRating}
          </Text>

          <Text style={styles.statLabel}>
            Average rating
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <ThumbsUp
              size={19}
              color={COLORS.lime}
            />
          </View>

          <Text style={styles.statValue}>
            {ratingCount}
          </Text>

          <Text style={styles.statLabel}>
            Ratings
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <AlertTriangle
              size={19}
              color={COLORS.warning}
            />
          </View>

          <Text style={styles.statValue}>
            {concernCount}
          </Text>

          <Text style={styles.statLabel}>
            Concerns
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MessageSquareText
              size={19}
              color={COLORS.danger}
            />
          </View>

          <Text style={styles.statValue}>
            {openConcerns}
          </Text>

          <Text style={styles.statLabel}>
            Needs attention
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <MessageSquareText
            size={18}
            color={COLORS.lime}
          />
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            Feedback about your properties
          </Text>

          <Text style={styles.infoText}>
            Review ratings and concerns submitted by
            customers who viewed properties you manage.
          </Text>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <AlertTriangle
              size={18}
              color={COLORS.danger}
            />
          </View>

          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>
              Unable to load feedback
            </Text>

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

            <Pressable
              onPress={
                errorMessage.includes('session')
                  ? handleLoginRedirect
                  : () => void loadFeedback(true)
              }
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <RefreshCw
                size={14}
                color={COLORS.background}
              />

              <Text style={styles.retryButtonText}>
                {errorMessage.includes('session')
                  ? 'Log in again'
                  : 'Try again'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Feedback
          </Text>

          <Text style={styles.sectionSubtitle}>
            {feedbackItems.length} item
            {feedbackItems.length === 1 ? '' : 's'}
          </Text>
        </View>

        <ChevronRight
          size={18}
          color={COLORS.muted}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.filterContainer
        }
      >
        {(['All', 'Ratings', 'Concerns'] as Filter[]).map(
          (option) => {
            const active = filter === option;

            return (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                style={({ pressed }) => [
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                  pressed && styles.pressed,
                ]}
              >
                {option === 'Ratings' ? (
                  <Star
                    size={15}
                    color={
                      active
                        ? COLORS.background
                        : COLORS.muted
                    }
                    fill={
                      active
                        ? COLORS.background
                        : 'transparent'
                    }
                  />
                ) : option === 'Concerns' ? (
                  <AlertTriangle
                    size={15}
                    color={
                      active
                        ? COLORS.background
                        : COLORS.muted
                    }
                  />
                ) : null}

                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
            />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Customer Feedback
            </Text>

            <Text style={styles.headerSubtitle}>
              Ratings and concerns from your properties
            </Text>
          </View>
        </View>

        <View style={styles.loadingState}>
          <ActivityIndicator
            size="large"
            color={COLORS.lime}
          />

          <Text style={styles.loadingTitle}>
            Loading feedback
          </Text>

          <Text style={styles.loadingText}>
            Getting the latest customer feedback...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft
            size={21}
            color={COLORS.white}
          />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Customer Feedback
          </Text>

          <Text style={styles.headerSubtitle}>
            Ratings and concerns from your properties
          </Text>
        </View>

        <Pressable
          onPress={() => void loadFeedback(true)}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
          ]}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator
              size="small"
              color={COLORS.lime}
            />
          ) : (
            <RefreshCw
              size={18}
              color={COLORS.lime}
            />
          )}
        </Pressable>
      </View>

      <FlatList
        data={feedbackItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadFeedback(true)}
            tintColor={COLORS.lime}
            colors={[COLORS.lime]}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MessageSquareText
                size={28}
                color={COLORS.muted}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No feedback yet
            </Text>

            <Text style={styles.emptyText}>
              Customer ratings and concerns about your
              properties will appear here after completed
              viewings.
            </Text>

            <Pressable
              onPress={() => void loadFeedback(true)}
              style={({ pressed }) => [
                styles.emptyRefreshButton,
                pressed && styles.pressed,
              ]}
            >
              <RefreshCw
                size={15}
                color={COLORS.background}
              />

              <Text style={styles.emptyRefreshText}>
                Refresh
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerSpace} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 16,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  statCard: {
    width: '48.5%',
    minHeight: 118,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '800',
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginTop: 14,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },

  infoText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  errorCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,107,107,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
    padding: 14,
    marginTop: 14,
  },

  errorIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  retryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.lime,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 10,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 14,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  filterButtonActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  filterTextActive: {
    color: COLORS.background,
  },

  feedbackCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  typeIconRating: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  typeIconConcern: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,184,77,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardTopContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  feedbackTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },

  propertyName: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  ratingBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusOpen: {
    backgroundColor: 'rgba(255,107,107,0.1)',
  },

  statusReview: {
    backgroundColor: 'rgba(255,184,77,0.1)',
  },

  statusResolved: {
    backgroundColor: 'rgba(127,224,138,0.1)',
  },

  statusDismissed: {
    backgroundColor: COLORS.cardSoft,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  statusOpenText: {
    color: COLORS.danger,
  },

  statusReviewText: {
    color: COLORS.warning,
  },

  statusResolvedText: {
    color: COLORS.success,
  },

  statusDismissedText: {
    color: COLORS.muted,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: '800',
  },

  customerInfo: {
    flex: 1,
  },

  customerName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  dateText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 13,
  },

  commentBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 12,
    padding: 11,
    marginTop: 12,
  },

  commentIcon: {
    marginRight: 8,
    marginTop: 1,
  },

  commentText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
  },

  noComment: {
    color: COLORS.muted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 12,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 12,
  },

  categoryLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },

  categoryValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },

  concernBox: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  concernText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 19,
  },

  adminNoteBox: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.lime,
    paddingLeft: 10,
    marginTop: 12,
  },

  adminNoteLabel: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  adminNoteText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  adminResponseDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 55,
    paddingBottom: 40,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  emptyRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.lime,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 14,
  },

  emptyRefreshText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },

  footerSpace: {
    height: 30,
  },

  pressed: {
    opacity: 0.75,
  },
});
