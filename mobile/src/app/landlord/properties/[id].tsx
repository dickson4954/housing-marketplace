import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
  Wallet,
  XCircle,
} from "lucide-react-native";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

type PropertyImage = {
  id?: string;
  url: string;
  altText?: string | null;
  category?: string;
  isPrimary?: boolean;
};

type PropertyAmenity = {
  amenity?: {
    id?: string;
    name?: string;
    category?: string;
  };
};

type PropertyStatusHistory = {
  id?: string;
  fromStatus?: string | null;
  toStatus?: string;
  note?: string | null;
  createdAt?: string;
};

type Property = {
  id: string;
  title: string;
  description?: string | null;
  purpose?: string;
  longStayType?: string | null;
  shortStayType?: string | null;
  status?: string;
  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  inspectionFee?: number | null;
  serviceCharge?: number | null;
  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;
  stayMode?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  rooms?: number | null;
  maxGuests?: number | null;
  furnishing?: string | null;
  available?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  county?: string | null;
  town?: string | null;
  area?: string | null;
  countyRelation?: { name?: string } | null;
  constituency?: { name?: string } | null;
  ward?: { name?: string } | null;
  place?: { name?: string } | null;
  images?: PropertyImage[];
  amenities?: PropertyAmenity[];
  statusHistory?: PropertyStatusHistory[];
};

function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_VERIFICATION: "Pending review",
    CHANGES_REQUIRED: "Changes required",
    ACTIVE: "Approved and active",
    RENTED: "Rented",
    INACTIVE: "Inactive",
    REJECTED: "Rejected",
  };

  const key = (status || "UNKNOWN").toUpperCase();
  return labels[key] || key.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusColor(status?: string | null) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "#D7FF5F";
    case "PENDING_VERIFICATION":
      return "#9BC7FF";
    case "CHANGES_REQUIRED":
      return "#FFC875";
    case "REJECTED":
      return "#FF8C8C";
    case "RENTED":
      return "#C8B6FF";
    default:
      return "#B9C1C3";
  }
}

function formatStatusDescription(status?: string | null) {
  switch ((status || "").toUpperCase()) {
    case "DRAFT":
      return "This property is saved as a draft and is not available to customers.";
    case "PENDING_VERIFICATION":
      return "Your property has been submitted and is waiting for administrator review.";
    case "CHANGES_REQUIRED":
      return "The administrator has requested changes. Review the feedback below and contact Makazii for the next steps.";
    case "ACTIVE":
      return "Your property is approved and active on the platform, subject to availability.";
    case "RENTED":
      return "This property is marked as rented.";
    case "INACTIVE":
      return "This property is currently inactive and is not available to customers.";
    case "REJECTED":
      return "This property submission was rejected. Check the administrator's feedback below.";
    default:
      return "The current property status is shown above. Contact Makazii if you need clarification.";
  }
}

function money(value?: number | null) {
  if (value == null) return null;
  return `KSh ${Number(value).toLocaleString("en-KE")}`;
}

function dateLabel(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readable(value?: string | null) {
  if (!value) return null;
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (token) return token;
    }
  } catch {}

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
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
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{String(value)}</Text>
    </View>
  );
}

function Feature({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number | null;
}) {
  if (value == null) return null;

  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureValue}>{value}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export default function LandlordPropertyDetails() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProperty = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      if (!propertyId) {
        throw new Error("The property ID is missing. Return to My Properties and try again.");
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Your landlord session has expired. Please sign in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.landlordProperties}/${encodeURIComponent(propertyId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "Could not load this property's details."
        );
      }

      const item = result?.data;

      if (!item || typeof item.id !== "string") {
        throw new Error("The server returned an invalid property response.");
      }

      setProperty(item as Property);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading this property."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      void loadProperty();
    }, [loadProperty])
  );

  const status = (property?.status || "UNKNOWN").toUpperCase();
  const statusColor = getStatusColor(status);
  const isShortStay = property?.purpose === "SHORT_STAY";

  const location = [
    property?.place?.name,
    property?.area,
    property?.ward?.name,
    property?.constituency?.name,
    property?.countyRelation?.name || property?.county,
  ]
    .filter((item, index, all): item is string => Boolean(item) && all.indexOf(item) === index)
    .join(", ");

  const images = [...(property?.images || [])].sort(
    (a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))
  );

  const amenities = (property?.amenities || [])
    .map((item) => item.amenity)
    .filter((amenity): amenity is NonNullable<typeof amenity> => Boolean(amenity?.name));

  const history = property?.statusHistory || [];
  const reviewNotes = history.filter(
    (entry) => Boolean(entry.note?.trim())
  );

  const prices = isShortStay
    ? [
        { label: "Day rate", value: money(property?.dayRate) },
        { label: "Overnight rate", value: money(property?.nightRate) },
        { label: "Day and night rate", value: money(property?.dayNightRate) },
        { label: "Inspection fee", value: money(property?.inspectionFee) },
      ]
    : [
        { label: "Monthly rent", value: money(property?.monthlyRent) },
        { label: "Deposit", value: money(property?.deposit) },
        { label: "Viewing fee", value: money(property?.viewingFee) },
        { label: "Service charge", value: money(property?.serviceCharge) },
      ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to My Properties"
          style={styles.headerButton}
          onPress={() => router.replace("/landlord/properties" as any)}
        >
          <ArrowLeft color="#F4F6F6" size={21} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
          <Text style={styles.headerTitle}>Property details</Text>
        </View>

        <Pressable
          accessibilityLabel="Refresh property details"
          style={styles.headerButton}
          onPress={() => void loadProperty(true)}
        >
          <RefreshCw color="#D7FF5F" size={18} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#D7FF5F" size="large" />
          <Text style={styles.muted}>Loading property details...</Text>
        </View>
      ) : error && !property ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Building2 color="#FF8C8C" size={28} />
          </View>
          <Text style={styles.stateTitle}>Unable to load property</Text>
          <Text style={styles.stateDescription}>{error}</Text>

          {error.toLowerCase().includes("session") ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/landlord/login" as any)}
            >
              <Text style={styles.primaryButtonText}>Sign in again</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.primaryButton}
              onPress={() => void loadProperty()}
            >
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace("/landlord/properties" as any)}
          >
            <Text style={styles.secondaryButtonText}>Back to My Properties</Text>
          </Pressable>
        </View>
      ) : !property ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Property not found</Text>
          <Text style={styles.stateDescription}>
            This property may have been removed or may not belong to your account.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/landlord/properties" as any)}
          >
            <Text style={styles.primaryButtonText}>Back to My Properties</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadProperty(true)}
              tintColor="#D7FF5F"
            />
          }
        >
          {error ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.heroCard}>
            {images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageGallery}
              >
                {images.map((image, index) => (
                  <View key={image.id || `${image.url}-${index}`} style={styles.imagePage}>
                    <Image
                      source={{ uri: image.url }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                    {image.isPrimary ? (
                      <View style={styles.primaryImageBadge}>
                        <Text style={styles.primaryImageText}>Cover photo</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.heroImage, styles.imageFallback]}>
                <Building2 color="#697477" size={42} />
                <Text style={styles.imageFallbackText}>No property photos</Text>
              </View>
            )}

            {images.length > 1 ? (
              <Text style={styles.imageCount}>{images.length} photos</Text>
            ) : null}

            <View style={styles.heroBody}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>
                  {readable(property.purpose) || "Property"}
                </Text>
              </View>

              <Text style={styles.propertyTitle}>
                {property.title || "Untitled property"}
              </Text>

              {location ? (
                <View style={styles.locationRow}>
                  <MapPin color="#9CA5A7" size={16} />
                  <Text style={styles.locationText}>{location}</Text>
                </View>
              ) : null}

              <View style={[styles.statusCard, { borderColor: `${statusColor}55` }]}>
                <View style={styles.statusTopRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusLabel, { color: statusColor }]}>
                    {getStatusLabel(status)}
                  </Text>
                </View>
                <Text style={styles.statusDescription}>
                  {formatStatusDescription(status)}
                </Text>
              </View>
            </View>
          </View>

          {status === "ACTIVE" ? (
            <View style={styles.successNotice}>
              <CheckCircle2 color="#D7FF5F" size={19} />
              <Text style={styles.successNoticeText}>
                This listing is approved and active.
              </Text>
            </View>
          ) : null}

          {status === "CHANGES_REQUIRED" || status === "REJECTED" ? (
            <View style={styles.warningNotice}>
              <XCircle color={status === "REJECTED" ? "#FF8C8C" : "#FFC875"} size={20} />
              <View style={styles.noticeTextContainer}>
                <Text style={styles.noticeTitle}>
                  {status === "REJECTED" ? "Administrator decision" : "Action required"}
                </Text>
                <Text style={styles.muted}>
                  Read the feedback below. This screen does not submit changes; contact Makazii for the appropriate next step.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <SectionTitle
              title="Property overview"
              subtitle="Details recorded for this submission"
            />

            <View style={styles.featureGrid}>
              <Feature
                icon={<BedDouble color="#D7FF5F" size={19} />}
                label="Bedrooms"
                value={property.bedrooms}
              />
              <Feature
                icon={<Building2 color="#D7FF5F" size={19} />}
                label="Bathrooms"
                value={property.bathrooms}
              />
              <Feature
                icon={<BedDouble color="#D7FF5F" size={19} />}
                label="Beds"
                value={property.beds}
              />
              <Feature
                icon={<Building2 color="#D7FF5F" size={19} />}
                label="Rooms"
                value={property.rooms}
              />
              <Feature
                icon={<Users color="#D7FF5F" size={19} />}
                label="Max guests"
                value={property.maxGuests}
              />
            </View>

            <View style={styles.detailList}>
              <DetailRow label="Property purpose" value={readable(property.purpose)} />
              <DetailRow label="Long-stay type" value={readable(property.longStayType)} />
              <DetailRow label="Short-stay type" value={readable(property.shortStayType)} />
              <DetailRow label="Stay pricing mode" value={readable(property.stayMode)} />
              <DetailRow label="Furnishing" value={readable(property.furnishing)} />
              <DetailRow label="Availability" value={property.available == null ? null : property.available ? "Available" : "Unavailable"} />
              <DetailRow label="Verification" value={property.verified ? "Verified" : "Not yet verified"} />
            </View>

            {property.description?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.descriptionText}>{property.description}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <SectionTitle title="Pricing" subtitle="Amounts recorded for this property" />

            {prices.some((price) => price.value != null) ? (
              <View style={styles.priceList}>
                {prices.map((price) =>
                  price.value != null ? (
                    <View key={price.label} style={styles.priceRow}>
                      <View style={styles.priceIcon}>
                        <Wallet color="#D7FF5F" size={17} />
                      </View>
                      <Text style={styles.priceLabel}>{price.label}</Text>
                      <Text style={styles.priceValue}>{price.value}</Text>
                    </View>
                  ) : null
                )}
              </View>
            ) : (
              <Text style={styles.muted}>No pricing information is available.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <SectionTitle title="Location" subtitle="Registered property location" />
            <View style={styles.locationPanel}>
              <MapPin color="#D7FF5F" size={21} />
              <View style={styles.locationPanelText}>
                <Text style={styles.locationPanelTitle}>
                  {property.place?.name || property.area || property.town || "Property location"}
                </Text>
                <Text style={styles.muted}>
                  {[
                    property.ward?.name,
                    property.constituency?.name,
                    property.countyRelation?.name || property.county,
                  ].filter(Boolean).join(", ") || "Location details unavailable"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <SectionTitle title="Amenities" subtitle="Facilities associated with this property" />
            {amenities.length > 0 ? (
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity, index) => (
                  <View
                    key={amenity.id || `${amenity.name}-${index}`}
                    style={styles.amenityChip}
                  >
                    <CheckCircle2 color="#D7FF5F" size={14} />
                    <Text style={styles.amenityText}>{amenity.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>No amenities were recorded for this property.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <SectionTitle
              title="Administrator feedback"
              subtitle="Notes recorded during the review process"
            />

            {reviewNotes.length > 0 ? (
              <View style={styles.timeline}>
                {reviewNotes.map((entry, index) => (
                  <View key={entry.id || `${entry.createdAt}-${index}`} style={styles.timelineItem}>
                    <View style={styles.timelineRail}>
                      <View style={styles.timelineDot} />
                      {index < reviewNotes.length - 1 ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineStatus}>
                        {getStatusLabel(entry.toStatus)}
                      </Text>
                      <Text style={styles.noteText}>{entry.note}</Text>
                      <Text style={styles.timelineDate}>
                        {dateLabel(entry.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noNotes}>
                <Clock3 color="#9CA5A7" size={20} />
                <Text style={styles.muted}>
                  No administrator notes have been recorded in the property status history yet.
                </Text>
              </View>
            )}

            <Text style={styles.reviewDisclaimer}>
              Only the Makazii administrator team can approve, reject, or publish a property.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <SectionTitle title="Submission history" />
            <View style={styles.historyRow}>
              <CalendarDays color="#9CA5A7" size={18} />
              <View style={styles.historyText}>
                <Text style={styles.historyLabel}>Created</Text>
                <Text style={styles.historyValue}>{dateLabel(property.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.historyRow}>
              <RefreshCw color="#9CA5A7" size={18} />
              <View style={styles.historyText}>
                <Text style={styles.historyLabel}>Last updated</Text>
                <Text style={styles.historyValue}>{dateLabel(property.updatedAt)}</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.backToListButton}
            onPress={() => router.replace("/landlord/properties" as any)}
          >
            <ChevronLeft color="#D7FF5F" size={19} />
            <Text style={styles.backToListText}>Back to My Properties</Text>
          </Pressable>

          <Text style={styles.footer}>
            MAKAZII reviews property submissions before they become available to customers.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B0F10" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: "#9CA5A7",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
  },
  headerTitle: { color: "#F4F6F6", fontSize: 22, fontWeight: "900", marginTop: 3 },
  content: { paddingHorizontal: 18, paddingBottom: 36, gap: 15 },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    backgroundColor: "#14191B",
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: { color: "#F4F6F6", fontSize: 20, fontWeight: "900", textAlign: "center" },
  stateDescription: { color: "#9CA5A7", fontSize: 13, lineHeight: 20, textAlign: "center" },
  muted: { color: "#9CA5A7", fontSize: 12, lineHeight: 19 },
  primaryButton: {
    backgroundColor: "#D7FF5F",
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#0B0F10", fontSize: 13, fontWeight: "900" },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#3B4548",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#F4F6F6", fontSize: 12, fontWeight: "800" },
  inlineError: {
    backgroundColor: "#28191A",
    borderColor: "#653638",
    borderWidth: 1,
    padding: 12,
    borderRadius: 13,
  },
  inlineErrorText: { color: "#FFB2B2", fontSize: 12, lineHeight: 18 },
  heroCard: {
    backgroundColor: "#14191B",
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#252C2E",
  },
  imageGallery: { width: "100%" },
  imagePage: { width: 330, maxWidth: 390 },
  heroImage: { width: "100%", height: 235, backgroundColor: "#181E20" },
  imageFallback: { alignItems: "center", justifyContent: "center", gap: 10 },
  imageFallbackText: { color: "#9CA5A7", fontSize: 12 },
  primaryImageBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "#0B0F10DD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  primaryImageText: { color: "#D7FF5F", fontSize: 10, fontWeight: "900" },
  imageCount: {
    color: "#9CA5A7",
    fontSize: 11,
    textAlign: "right",
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  heroBody: { padding: 16, gap: 12 },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "#252C2E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  typePillText: { color: "#D7FF5F", fontSize: 10, fontWeight: "900" },
  propertyTitle: { color: "#F4F6F6", fontSize: 23, lineHeight: 30, fontWeight: "900" },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  locationText: { flex: 1, color: "#B4BDBF", fontSize: 12, lineHeight: 18 },
  statusCard: {
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: "#0B0F10",
    padding: 13,
    gap: 7,
  },
  statusTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusLabel: { fontSize: 13, fontWeight: "900" },
  statusDescription: { color: "#B4BDBF", fontSize: 12, lineHeight: 18 },
  successNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#192019",
    borderWidth: 1,
    borderColor: "#3B4B28",
  },
  successNoticeText: { color: "#D7FF5F", fontSize: 12, fontWeight: "800", flex: 1 },
  warningNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#211F19",
    borderWidth: 1,
    borderColor: "#51452C",
  },
  noticeTextContainer: { flex: 1, gap: 6 },
  noticeTitle: { color: "#FFC875", fontSize: 13, fontWeight: "900" },
  sectionCard: {
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    borderRadius: 20,
    padding: 16,
    gap: 15,
  },
  sectionHeading: { gap: 4 },
  sectionTitle: { color: "#F4F6F6", fontSize: 16, fontWeight: "900" },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  feature: {
    width: "31%",
    minWidth: 82,
    flexGrow: 1,
    backgroundColor: "#0F1415",
    borderWidth: 1,
    borderColor: "#252C2E",
    borderRadius: 14,
    padding: 10,
    gap: 5,
  },
  featureIcon: { marginBottom: 2 },
  featureValue: { color: "#F4F6F6", fontSize: 17, fontWeight: "900" },
  featureLabel: { color: "#9CA5A7", fontSize: 10 },
  detailList: { gap: 0 },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#252C2E",
  },
  detailLabel: { color: "#9CA5A7", fontSize: 12, flex: 1 },
  detailValue: { color: "#F4F6F6", fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  descriptionBlock: { gap: 8, borderTopWidth: 1, borderTopColor: "#252C2E", paddingTop: 14 },
  descriptionText: { color: "#D0D6D7", fontSize: 13, lineHeight: 21 },
  priceList: { gap: 13 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priceIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  priceLabel: { color: "#B4BDBF", fontSize: 12, flex: 1 },
  priceValue: { color: "#D7FF5F", fontSize: 13, fontWeight: "900" },
  locationPanel: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locationPanelText: { flex: 1, gap: 5 },
  locationPanelTitle: { color: "#F4F6F6", fontSize: 14, fontWeight: "800" },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#333D3F",
    backgroundColor: "#0F1415",
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  amenityText: { color: "#D0D6D7", fontSize: 11, fontWeight: "700" },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: "row", gap: 12, minHeight: 78 },
  timelineRail: { width: 14, alignItems: "center" },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#D7FF5F", marginTop: 4 },
  timelineLine: { width: 1, flex: 1, backgroundColor: "#3B4548", marginTop: 5 },
  timelineBody: { flex: 1, gap: 6, paddingBottom: 18 },
  timelineStatus: { color: "#F4F6F6", fontSize: 12, fontWeight: "900" },
  noteText: { color: "#D0D6D7", fontSize: 13, lineHeight: 20 },
  timelineDate: { color: "#697477", fontSize: 10 },
  noNotes: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reviewDisclaimer: {
    color: "#9CA5A7",
    fontSize: 11,
    lineHeight: 17,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#252C2E",
  },
  historyRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  historyText: { flex: 1, gap: 4 },
  historyLabel: { color: "#9CA5A7", fontSize: 11 },
  historyValue: { color: "#F4F6F6", fontSize: 12, fontWeight: "700" },
  backToListButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#3B4548",
    borderRadius: 15,
    backgroundColor: "#14191B",
  },
  backToListText: { color: "#D7FF5F", fontSize: 12, fontWeight: "900" },
  footer: { color: "#697477", fontSize: 11, lineHeight: 17, textAlign: "center", paddingHorizontal: 12 },
});
