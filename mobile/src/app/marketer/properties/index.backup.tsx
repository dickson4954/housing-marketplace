import React, {
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import {
  ArrowLeft,
  Building2,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileEdit,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react-native';

import { useProperties } from '@/context/PropertyContext';
import { useMarketers } from '@/context/MarketerContext';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',
  green: '#65D98A',
  amber: '#F2C94C',
  red: '#FF7070',
  blue: '#72A7FF',
};

type Filter =
  | 'all'
  | 'draft'
  | 'under_review'
  | 'changes_required'
  | 'published'
  | 'rejected';

function statusLabel(
  status: string,
) {
  switch (status) {
    case 'draft':
      return 'Draft';

    case 'under_review':
      return 'Under Review';

    case 'changes_required':
      return 'Changes Required';

    case 'published':
      return 'Published';

    case 'rejected':
      return 'Rejected';

    case 'hidden':
      return 'Hidden';

    default:
      return status;
  }
}

function StatusIcon({
  status,
}: {
  status: string;
}) {
  if (status === 'published') {
    return (
      <CircleCheck
        size={15}
        color={COLORS.green}
      />
    );
  }

  if (status === 'under_review') {
    return (
      <Clock3
        size={15}
        color={COLORS.amber}
      />
    );
  }

  if (
    status ===
    'changes_required'
  ) {
    return (
      <RotateCcw
        size={15}
        color={COLORS.blue}
      />
    );
  }

  if (status === 'rejected') {
    return (
      <XCircle
        size={15}
        color={COLORS.red}
      />
    );
  }

  return (
    <FileEdit
      size={15}
      color={COLORS.muted}
    />
  );
}

function getStatusColor(
  status: string,
) {
  switch (status) {
    case 'published':
      return COLORS.green;

    case 'under_review':
      return COLORS.amber;

    case 'changes_required':
      return COLORS.blue;

    case 'rejected':
      return COLORS.red;

    default:
      return COLORS.muted;
  }
}

function PropertyCard({
  property,
}: {
  property: any;
}) {
  const statusColor =
    getStatusColor(property.status);

  return (
    <Pressable
      style={styles.propertyCard}
      onPress={() =>
        router.push(
          `/marketer/properties/${property.id}`,
        )
      }
    >
      <View style={styles.propertyTop}>
        <View style={styles.propertyIcon}>
          <Building2
            size={21}
            color={COLORS.lime}
          />
        </View>

        <View style={styles.propertyMain}>
          <Text
            style={styles.propertyTitle}
            numberOfLines={1}
          >
            {property.title ||
              'Untitled Property'}
          </Text>

          <Text
            style={styles.propertyLocation}
            numberOfLines={1}
          >
            {property.location?.area ||
              'Area not specified'}
            {property.location?.town
              ? `, ${property.location.town}`
              : ''}
          </Text>
        </View>

        <ChevronRight
          size={19}
          color={COLORS.muted}
        />
      </View>

      <View
        style={
          styles.propertyDivider
        }
      />

      <View style={styles.propertyMeta}>
        <View>
          <Text
            style={styles.metaLabel}
          >
            Rent
          </Text>

          <Text
            style={styles.metaValue}
          >
            KSh{' '}
            {Number(
              property.rent || 0,
            ).toLocaleString()}
          </Text>
        </View>

        <View>
          <Text
            style={styles.metaLabel}
          >
            Type
          </Text>

          <Text
            style={styles.metaValue}
          >
            {property.type ||
              'Property'}
          </Text>
        </View>

        <View>
          <Text
            style={styles.metaLabel}
          >
            Status
          </Text>

          <View
            style={[
              styles.statusPill,
              {
                borderColor:
                  statusColor +
                  '55',
              },
            ]}
          >
            <StatusIcon
              status={
                property.status
              }
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusColor,
                },
              ]}
            >
              {statusLabel(
                property.status,
              )}
            </Text>
          </View>
        </View>
      </View>

      {property.adminReviewNotes ? (
        <View
          style={styles.reviewNotice}
        >
          <Text
            style={
              styles.reviewNoticeLabel
            }
          >
            ADMIN NOTE
          </Text>

          <Text
            style={
              styles.reviewNoticeText
            }
            numberOfLines={2}
          >
            {
              property.adminReviewNotes
            }
          </Text>
        </View>
      ) : null}

      <View
        style={styles.propertyFooter}
      >
        <Text
          style={styles.footerText}
        >
          {property.images?.length ||
            0}{' '}
          photos
        </Text>

        <Text
          style={styles.footerText}
        >
          {property.bedrooms || 0}{' '}
          bedroom
          {property.bedrooms === 1
            ? ''
            : 's'}
        </Text>

        <Text
          style={styles.footerText}
        >
          {property.bathrooms || 0}{' '}
          bathroom
          {property.bathrooms === 1
            ? ''
            : 's'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MarketerPropertiesScreen() {
  const {
    properties,
  } = useProperties();

  const {
    marketers,
  } = useMarketers();

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<Filter>('all');

  const [
    search,
    setSearch,
  ] = useState('');

  const marketer =
    marketers.find(
      (item) =>
        item.portalAccess &&
        item.status === 'Active',
    ) ??
    marketers[0];

  const marketerProperties =
    useMemo(() => {
      if (!marketer) {
        return [];
      }

      return properties.filter(
        (property) => {
          /*
           * Properties created by this
           * marketer.
           *
           * For the current frontend
           * prototype, properties without
           * a marketerId are also excluded
           * from this portal.
           */
          return (
            property.marketerId ===
            marketer.id
          );
        },
      );
    }, [
      properties,
      marketer,
    ]);

  const filteredProperties =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return marketerProperties.filter(
        (property) => {
          const matchesFilter =
            activeFilter === 'all' ||
            property.status ===
              activeFilter;

          const matchesSearch =
            !query ||
            property.title
              ?.toLowerCase()
              .includes(query) ||
            property.location?.area
              ?.toLowerCase()
              .includes(query) ||
            property.location?.town
              ?.toLowerCase()
              .includes(query);

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      marketerProperties,
      activeFilter,
      search,
    ]);

  const counts = useMemo(
    () => ({
      all:
        marketerProperties.length,

      draft:
        marketerProperties.filter(
          (item) =>
            item.status ===
            'draft',
        ).length,

      under_review:
        marketerProperties.filter(
          (item) =>
            item.status ===
            'under_review',
        ).length,

      changes_required:
        marketerProperties.filter(
          (item) =>
            item.status ===
            'changes_required',
        ).length,

      published:
        marketerProperties.filter(
          (item) =>
            item.status ===
            'published',
        ).length,

      rejected:
        marketerProperties.filter(
          (item) =>
            item.status ===
            'rejected',
        ).length,
    }),
    [marketerProperties],
  );

  if (!marketer) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text
          style={styles.loadingText}
        >
          Loading marketer...
        </Text>
      </View>
    );
  }

  const filters: {
    key: Filter;
    label: string;
  }[] = [
    {
      key: 'all',
      label: `All (${counts.all})`,
    },
    {
      key: 'draft',
      label: `Drafts (${counts.draft})`,
    },
    {
      key: 'under_review',
      label: `Review (${counts.under_review})`,
    },
    {
      key: 'changes_required',
      label: `Changes (${counts.changes_required})`,
    },
    {
      key: 'published',
      label: `Published (${counts.published})`,
    },
    {
      key: 'rejected',
      label: `Rejected (${counts.rejected})`,
    },
  ];

  return (
    <View
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={styles.header}
        >
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={20}
              color={COLORS.white}
            />
          </Pressable>

          <View
            style={styles.headerText}
          >
            <Text
              style={styles.eyebrow}
            >
              MARKETER PORTAL
            </Text>

            <Text
              style={styles.title}
            >
              My Properties
            </Text>

            <Text
              style={styles.subtitle}
            >
              Manage your listings and
              track admin approval.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push(
                '/marketer/properties/add',
              )
            }
          >
            <Plus
              size={20}
              color={COLORS.background}
            />

            <Text
              style={styles.addButtonText}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <View
          style={styles.searchBox}
        >
          <Search
            size={19}
            color={COLORS.muted}
          />

          <Text
            style={styles.searchPlaceholder}
          >
            {search
              ? search
              : 'Search your properties'}
          </Text>
        </View>

        <View
          style={styles.filters}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            {filters.map(
              (filter) => {
                const active =
                  activeFilter ===
                  filter.key;

                return (
                  <Pressable
                    key={filter.key}
                    style={[
                      styles.filter,
                      active &&
                        styles.filterActive,
                    ]}
                    onPress={() =>
                      setActiveFilter(
                        filter.key,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {
                        filter.label
                      }
                    </Text>
                  </Pressable>
                );
              },
            )}
          </ScrollView>
        </View>

        <View
          style={styles.summaryCard}
        >
          <View>
            <Text
              style={styles.summaryLabel}
            >
              YOUR LISTINGS
            </Text>

            <Text
              style={styles.summaryNumber}
            >
              {counts.all}
            </Text>

            <Text
              style={styles.summaryText}
            >
              properties in your
              portfolio
            </Text>
          </View>

          <View
            style={styles.summaryIcon}
          >
            <Building2
              size={30}
              color={COLORS.lime}
            />
          </View>
        </View>

        <View
          style={styles.sectionHeader}
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Listings
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              {filteredProperties.length}{' '}
              result
              {filteredProperties.length ===
              1
                ? ''
                : 's'}
            </Text>
          </View>
        </View>

        {filteredProperties.length ===
        0 ? (
          <View
            style={styles.emptyCard}
          >
            <View
              style={styles.emptyIcon}
            >
              <Building2
                size={28}
                color={COLORS.muted}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No properties here
            </Text>

            <Text
              style={styles.emptyText}
            >
              Add a property and submit
              it to the Makazii admin
              team for review.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() =>
                router.push(
                  '/marketer/properties/add',
                )
              }
            >
              <Plus
                size={18}
                color={COLORS.background}
              />

              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Add Property
              </Text>
            </Pressable>
          </View>
        ) : (
          filteredProperties.map(
            (property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ),
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 120,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  addButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  addButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },

  searchBox: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  searchPlaceholder: {
    color: COLORS.muted,
    fontSize: 14,
    flex: 1,
  },

  filters: {
    marginBottom: 18,
  },

  filter: {
    paddingHorizontal: 13,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.card,
    justifyContent: 'center',
    marginRight: 8,
  },

  filterActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  filterTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },

  summaryCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 24,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  summaryNumber: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },

  summaryText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      '#D7FF5F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginBottom: 12,
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

  propertyCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  propertyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  propertyIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor:
      '#D7FF5F12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  propertyMain: {
    flex: 1,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  propertyLocation: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  propertyDivider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical: 15,
  },

  propertyMeta: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    gap: 10,
  },

  metaLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 5,
  },

  metaValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  statusPill: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  reviewNotice: {
    marginTop: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor:
      '#72A7FF0D',
    borderWidth: 1,
    borderColor:
      '#72A7FF22',
  },

  reviewNoticeLabel: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  reviewNoticeText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  propertyFooter: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 15,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  emptyCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      COLORS.cardSoft,
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
    maxWidth: 290,
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  emptyButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
});
