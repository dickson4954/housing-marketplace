import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  MessageCircle,
  Search,
  Star,
  XCircle,
} from 'lucide-react-native';

import {
  ConcernStatus,
  useFeedback,
} from '@/context/FeedbackContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  danger: '#FF7A7A',
  warning: '#FFCC66',
  success: '#75E6A5',
};

type FilterType = 'All' | 'Ratings' | 'Concerns';

const STATUS_OPTIONS: ConcernStatus[] = [
  'Open',
  'Under Review',
  'Resolved',
  'Dismissed',
];

export default function AdminFeedbackScreen() {
  const {
    ratings,
    concerns,
    refreshAdminFeedback,
    updateAdminConcern,
    getOpenConcernsCount,
    getPendingConcernsCount,
    getResolvedConcernsCount,
  } = useFeedback();

  const [filter, setFilter] =
    useState<FilterType>('All');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [statusModalVisible, setStatusModalVisible] =
    useState(false);

  const [selectedConcernId, setSelectedConcernId] =
    useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<ConcernStatus>('Open');

  const [adminNote, setAdminNote] =
    useState('');

  useEffect(() => {
    void refreshAdminFeedback().catch(
      (error) => {
        console.error(
          'Failed to load admin feedback:',
          error,
        );

        Alert.alert(
          'Unable to load feedback',
          error instanceof Error
            ? error.message
            : 'We could not load customer feedback. Please try again.',
        );
      },
    );
  }, [refreshAdminFeedback]);

  const totalRatings = ratings.length;
  const totalConcerns = concerns.length;
  const totalFeedback =
    totalRatings + totalConcerns;

  const averageRating = useMemo(() => {
    if (ratings.length === 0) {
      return 0;
    }

    const total = ratings.reduce(
      (sum, rating) => sum + rating.stars,
      0,
    );

    return total / ratings.length;
  }, [ratings]);

  const openConcerns =
    getOpenConcernsCount();

  const pendingConcerns =
    getPendingConcernsCount();

  const resolvedConcerns =
    getResolvedConcernsCount();

  const filteredItems = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    const ratingItems =
      filter === 'Concerns'
        ? []
        : ratings.map((rating) => ({
            id: rating.id,
            type: 'rating' as const,
            createdAt: rating.createdAt,
            data: rating,
          }));

    const concernItems =
      filter === 'Ratings'
        ? []
        : concerns.map((concern) => ({
            id: concern.id,
            type: 'concern' as const,
            createdAt: concern.createdAt,
            data: concern,
          }));

    return [...ratingItems, ...concernItems]
      .filter((item) => {
        if (!query) {
          return true;
        }

        if (item.type === 'rating') {
          return (
            item.data.propertyTitle
              .toLowerCase()
              .includes(query) ||
            item.data.customerName
              .toLowerCase()
              .includes(query) ||
            item.data.comment
              ?.toLowerCase()
              .includes(query)
          );
        }

        return (
          item.data.propertyTitle
            .toLowerCase()
            .includes(query) ||
          item.data.customerName
            .toLowerCase()
            .includes(query) ||
          item.data.category
            .toLowerCase()
            .includes(query) ||
          item.data.description
            .toLowerCase()
            .includes(query) ||
          item.data.status
            .toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [
    ratings,
    concerns,
    filter,
    searchQuery,
  ]);

  const openStatusModal = (
    concernId: string,
  ) => {
    const concern = concerns.find(
      (item) => item.id === concernId,
    );

    if (!concern) {
      return;
    }

    setSelectedConcernId(concernId);
    setSelectedStatus(concern.status);
    setAdminNote(concern.adminNotes || '');
    setStatusModalVisible(true);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
    setSelectedConcernId(null);
    setSelectedStatus('Open');
    setAdminNote('');
  };

  const handleSaveConcern = async () => {
    if (!selectedConcernId) {
      return;
    }

    try {
      await updateAdminConcern(
        selectedConcernId,
        {
          status: selectedStatus,
          adminNotes:
            adminNote.trim() || undefined,
        },
      );

      closeStatusModal();

      Alert.alert(
        'Concern updated',
        'The customer concern has been updated successfully.',
      );
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error
          ? error.message
          : 'We could not update this concern. Please try again.',
      );
    }
  };

  const getStatusColor = (
    status: ConcernStatus,
  ) => {
    switch (status) {
      case 'Open':
        return COLORS.danger;

      case 'Under Review':
        return COLORS.warning;

      case 'Resolved':
        return COLORS.success;

      case 'Dismissed':
        return COLORS.muted;

      default:
        return COLORS.muted;
    }
  };

  const getStatusIcon = (
    status: ConcernStatus,
  ) => {
    switch (status) {
      case 'Open':
        return (
          <CircleAlert
            size={15}
            color={COLORS.danger}
            strokeWidth={2}
          />
        );

      case 'Under Review':
        return (
          <Clock3
            size={15}
            color={COLORS.warning}
            strokeWidth={2}
          />
        );

      case 'Resolved':
        return (
          <CheckCircle2
            size={15}
            color={COLORS.success}
            strokeWidth={2}
          />
        );

      case 'Dismissed':
        return (
          <XCircle
            size={15}
            color={COLORS.muted}
            strokeWidth={2}
          />
        );

      default:
        return null;
    }
  };

  const renderRating = (
    rating: (typeof ratings)[number],
  ) => {
    return (
      <View style={styles.feedbackCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <View style={styles.ratingBadge}>
              <Star
                size={15}
                color={COLORS.lime}
                fill={COLORS.lime}
                strokeWidth={1.8}
              />
            </View>

            <View>
              <Text style={styles.typeLabel}>
                CUSTOMER RATING
              </Text>

              <Text style={styles.customerName}>
                {rating.customerName}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            {formatDate(rating.createdAt)}
          </Text>
        </View>

        <View style={styles.propertyRow}>
          <Text style={styles.propertyLabel}>
            PROPERTY
          </Text>

          <Text
            style={styles.propertyTitle}
            numberOfLines={2}
          >
            {rating.propertyTitle}
          </Text>
        </View>

        <View style={styles.starsDisplay}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={19}
              color={
                star <= rating.stars
                  ? COLORS.lime
                  : COLORS.border
              }
              fill={
                star <= rating.stars
                  ? COLORS.lime
                  : 'transparent'
              }
              strokeWidth={1.7}
            />
          ))}

          <Text style={styles.ratingNumber}>
            {rating.stars}/5
          </Text>
        </View>

        {rating.comment ? (
          <View style={styles.commentBox}>
            <MessageCircle
              size={16}
              color={COLORS.muted}
              strokeWidth={1.8}
            />

            <Text style={styles.commentText}>
              {rating.comment}
            </Text>
          </View>
        ) : (
          <Text style={styles.noComment}>
            No written comment provided.
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.referenceText}>
            Viewing: {rating.viewingId}
          </Text>
        </View>
      </View>
    );
  };

  const renderConcern = (
    concern: (typeof concerns)[number],
  ) => {
    const statusColor =
      getStatusColor(concern.status);

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <View style={styles.concernBadge}>
              <AlertTriangle
                size={15}
                color={COLORS.danger}
                strokeWidth={2}
              />
            </View>

            <View>
              <Text style={styles.typeLabel}>
                CUSTOMER CONCERN
              </Text>

              <Text style={styles.customerName}>
                {concern.customerName}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            {formatDate(concern.createdAt)}
          </Text>
        </View>

        <View style={styles.propertyRow}>
          <Text style={styles.propertyLabel}>
            PROPERTY
          </Text>

          <Text
            style={styles.propertyTitle}
            numberOfLines={2}
          >
            {concern.propertyTitle}
          </Text>
        </View>

        <View style={styles.categoryRow}>
          <View style={styles.categoryPill}>
            <Text
              style={styles.categoryPillText}
            >
              {concern.category}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                borderColor: statusColor,
                backgroundColor: `${statusColor}12`,
              },
            ]}
          >
            {getStatusIcon(concern.status)}

            <Text
              style={[
                styles.statusText,
                {
                  color: statusColor,
                },
              ]}
            >
              {concern.status}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionLabel}>
            CUSTOMER DESCRIPTION
          </Text>

          <Text style={styles.descriptionText}>
            {concern.description}
          </Text>
        </View>

        {concern.adminNotes ? (
          <View style={styles.adminNotesBox}>
            <Text style={styles.adminNotesLabel}>
              ADMIN NOTES
            </Text>

            <Text style={styles.adminNotesText}>
              {concern.adminNotes}
            </Text>
          </View>
        ) : null}

        <View style={styles.concernActions}>
          <Text style={styles.referenceText}>
            Viewing:{' '}
            {concern.viewingId || 'N/A'}
          </Text>

          <Pressable
            onPress={() =>
              openStatusModal(concern.id)
            }
            style={({ pressed }) => [
              styles.statusButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.statusButtonText}>
              Manage concern
            </Text>

            <ChevronDown
              size={16}
              color={COLORS.background}
              strokeWidth={2.2}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderItem = ({
    item,
  }: {
    item: (typeof filteredItems)[number];
  }) => {
    if (item.type === 'rating') {
      return renderRating(item.data);
    }

    return renderConcern(item.data);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(
                '/admin/dashboard',
              );
            }
          }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft
            size={21}
            color={COLORS.white}
            strokeWidth={2.2}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>
            MAKAZII ADMIN
          </Text>

          <Text style={styles.title}>
            Customer Feedback
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <MessageCircle
            size={21}
            color={COLORS.lime}
            strokeWidth={2}
          />
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={
          <>
            {/* Summary */}
            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Total"
                value={totalFeedback}
                icon={
                  <MessageCircle
                    size={18}
                    color={COLORS.lime}
                    strokeWidth={2}
                  />
                }
              />

              <SummaryCard
                label="Ratings"
                value={totalRatings}
                icon={
                  <Star
                    size={18}
                    color={COLORS.lime}
                    fill={COLORS.lime}
                    strokeWidth={1.8}
                  />
                }
              />

              <SummaryCard
                label="Open"
                value={openConcerns}
                icon={
                  <CircleAlert
                    size={18}
                    color={COLORS.danger}
                    strokeWidth={2}
                  />
                }
              />

              <SummaryCard
                label="Resolved"
                value={resolvedConcerns}
                icon={
                  <CheckCircle2
                    size={18}
                    color={COLORS.success}
                    strokeWidth={2}
                  />
                }
              />
            </View>

            {/* Rating overview */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <Star
                  size={23}
                  color={COLORS.lime}
                  fill={COLORS.lime}
                  strokeWidth={1.7}
                />
              </View>

              <View
                style={styles.overviewContent}
              >
                <Text style={styles.overviewLabel}>
                  AVERAGE CUSTOMER RATING
                </Text>

                <View
                  style={styles.averageRow}
                >
                  <Text
                    style={styles.averageNumber}
                  >
                    {averageRating.toFixed(1)}
                  </Text>

                  <View
                    style={styles.averageStars}
                  >
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <Star
                          key={star}
                          size={16}
                          color={
                            star <=
                            Math.round(
                              averageRating,
                            )
                              ? COLORS.lime
                              : COLORS.border
                          }
                          fill={
                            star <=
                            Math.round(
                              averageRating,
                            )
                              ? COLORS.lime
                              : 'transparent'
                          }
                          strokeWidth={1.7}
                        />
                      ),
                    )}
                  </View>
                </View>

                <Text
                  style={
                    styles.overviewSubtext
                  }
                >
                  Based on {totalRatings}{' '}
                  {totalRatings === 1
                    ? 'rating'
                    : 'ratings'}
                </Text>
              </View>

              <View style={styles.pendingBox}>
                <Text
                  style={styles.pendingNumber}
                >
                  {pendingConcerns}
                </Text>

                <Text
                  style={styles.pendingLabel}
                >
                  Needs review
                </Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Search
                size={19}
                color={COLORS.muted}
                strokeWidth={2}
              />

              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search property, customer or concern..."
                placeholderTextColor="#687174"
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>

            {/* Filters */}
            <View style={styles.filters}>
              {(
                [
                  'All',
                  'Ratings',
                  'Concerns',
                ] as FilterType[]
              ).map((item) => {
                const active =
                  filter === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setFilter(item)
                    }
                    style={({ pressed }) => [
                      styles.filterButton,
                      active &&
                        styles.filterButtonActive,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={styles.resultsHeader}
            >
              <Text
                style={styles.resultsTitle}
              >
                {filter === 'All'
                  ? 'All feedback'
                  : filter}
              </Text>

              <Text
                style={styles.resultsCount}
              >
                {filteredItems.length}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MessageCircle
                size={28}
                color={COLORS.muted}
                strokeWidth={1.8}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No feedback found
            </Text>

            <Text style={styles.emptyText}>
              There is no customer feedback
              matching your current filter or
              search.
            </Text>
          </View>
        }
      />

      {/* Manage concern modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeStatusModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={closeStatusModal}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text
                  style={styles.modalTitle}
                >
                  Manage concern
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  Update the status and add an
                  internal note for this concern.
                </Text>
              </View>

              <Pressable
                onPress={closeStatusModal}
                style={({ pressed }) => [
                  styles.modalClose,
                  pressed && styles.pressed,
                ]}
              >
                <XCircle
                  size={21}
                  color={COLORS.muted}
                  strokeWidth={1.8}
                />
              </Pressable>
            </View>

            {/* Status */}
            <Text style={styles.modalSectionLabel}>
              CONCERN STATUS
            </Text>

            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map(
                (status) => {
                  const color =
                    getStatusColor(status);

                  const active =
                    selectedStatus === status;

                  return (
                    <Pressable
                      key={status}
                      onPress={() =>
                        setSelectedStatus(
                          status,
                        )
                      }
                      style={({ pressed }) => [
                        styles.statusOption,
                        active &&
                          styles.statusOptionActive,
                        pressed &&
                          styles.statusOptionPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusIconBox,
                          {
                            backgroundColor:
                              active
                                ? `${color}18`
                                : COLORS.card,
                          },
                        ]}
                      >
                        {getStatusIcon(status)}
                      </View>

                      <Text
                        style={[
                          styles.statusOptionText,
                          {
                            color: active
                              ? color
                              : COLORS.white,
                          },
                        ]}
                      >
                        {status}
                      </Text>

                      <View
                        style={[
                          styles.radioOuter,
                          active &&
                            styles.radioOuterActive,
                          {
                            borderColor: active
                              ? color
                              : COLORS.border,
                          },
                        ]}
                      >
                        {active ? (
                          <View
                            style={[
                              styles.radioInner,
                              {
                                backgroundColor:
                                  color,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>

            {/* Admin note */}
            <Text
              style={[
                styles.modalSectionLabel,
                styles.adminNoteSectionLabel,
              ]}
            >
              INTERNAL ADMIN NOTE
            </Text>

            <TextInput
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="Add an internal note about this concern..."
              placeholderTextColor="#687174"
              style={styles.adminNoteInput}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />

            <Text style={styles.characterCount}>
              {adminNote.length}/1000
            </Text>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={closeStatusModal}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.modalActionPressed,
                ]}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveConcern}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.modalActionPressed,
                ]}
              >
                <CheckCircle2
                  size={17}
                  color={COLORS.background}
                  strokeWidth={2.2}
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save changes
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactElement;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        {icon}
      </View>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  pressed: {
    opacity: 0.7,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  title: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      'rgba(215,255,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 45,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  summaryCard: {
    width: '48.5%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
  },

  summaryIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  summaryValue: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
  },

  overviewIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor:
      'rgba(215,255,95,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  overviewContent: {
    flex: 1,
  },

  overviewLabel: {
    color: COLORS.muted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
  },

  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  averageNumber: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginRight: 7,
  },

  averageStars: {
    flexDirection: 'row',
    gap: 2,
  },

  overviewSubtext: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  pendingBox: {
    alignItems: 'center',
    paddingLeft: 13,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },

  pendingNumber: {
    color: COLORS.warning,
    fontSize: 20,
    fontWeight: '800',
  },

  pendingLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 1,
  },

  searchBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginTop: 18,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12.5,
    marginLeft: 9,
    height: '100%',
  },

  filters: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginTop: 12,
  },

  filterButton: {
    flex: 1,
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },

  filterButtonActive: {
    backgroundColor: COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 11.5,
    fontWeight: '700',
  },

  filterTextActive: {
    color: COLORS.background,
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },

  resultsTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  resultsCount: {
    minWidth: 27,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    color: COLORS.muted,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },

  feedbackCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  ratingBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(215,255,95,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  concernBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,122,122,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  typeLabel: {
    color: COLORS.muted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 3,
  },

  customerName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  dateText: {
    color: COLORS.muted,
    fontSize: 9.5,
    marginLeft: 8,
  },

  propertyRow: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  propertyLabel: {
    color: COLORS.muted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  starsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    gap: 3,
  },

  ratingNumber: {
    color: COLORS.lime,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 13,
    padding: 12,
    marginTop: 13,
  },

  commentText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
  },

  noComment: {
    color: COLORS.muted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 13,
  },

  cardFooter: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  referenceText: {
    color: COLORS.muted,
    fontSize: 9.5,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 13,
  },

  categoryPill: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryPillText: {
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: '600',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 5,
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  descriptionBox: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 13,
    padding: 12,
    marginTop: 12,
  },

  descriptionLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },

  descriptionText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 19,
  },

  adminNotesBox: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.lime,
    paddingLeft: 10,
    marginTop: 12,
  },

  adminNotesLabel: {
    color: COLORS.lime,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },

  adminNotesText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  concernActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lime,
    minHeight: 35,
    borderRadius: 11,
    paddingHorizontal: 11,
    gap: 5,
  },

  statusButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '800',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 65,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  modalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSectionLabel: {
    color: COLORS.muted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 20,
    marginBottom: 9,
  },

  statusOptions: {
    gap: 8,
  },

  statusOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },

  statusOptionActive: {
    borderColor: COLORS.lime,
    backgroundColor:
      'rgba(215,255,95,0.05)',
  },

  statusOptionPressed: {
    opacity: 0.7,
  },

  statusIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  statusOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },

  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterActive: {
    borderWidth: 1.5,
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  adminNoteSectionLabel: {
    marginTop: 18,
  },

  adminNoteInput: {
    minHeight: 105,
    maxHeight: 150,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
  },

  characterCount: {
    color: COLORS.muted,
    fontSize: 9,
    textAlign: 'right',
    marginTop: 5,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },

  modalActionPressed: {
    opacity: 0.7,
  },
});