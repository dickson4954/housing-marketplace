import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config/api';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  Image as ImageIcon,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react-native";


const ADMIN_TOKEN_KEY = "makazii_admin_token";

type PropertyStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "CHANGES_REQUIRED"
  | "ACTIVE"
  | "RENTED"
  | "INACTIVE"
  | "REJECTED";

type VerificationFilter =
  | "ALL"
  | "PENDING_VERIFICATION"
  | "CHANGES_REQUIRED"
  | "ACTIVE"
  | "REJECTED";

type Property = {
  id: string;
  title?: string | null;
  name?: string | null;

  description?: string | null;

  purpose?: string | null;
  longStayType?: string | null;
  shortStayType?: string | null;

  status?: PropertyStatus | string | null;
  verified?: boolean | null;
  available?: boolean | null;

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
  maxGuests?: number | null;
  rooms?: number | null;

  county?: {
    id?: string;
    name?: string | null;
  } | null;

  constituency?: {
    id?: string;
    name?: string | null;
  } | null;

  ward?: {
    id?: string;
    name?: string | null;
  } | null;

  location?: string | null;
  address?: string | null;

  source?: string | null;
  propertySource?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
  submittedAt?: string | null;

  createdBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  } | null;

  marketer?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;

  landlord?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;

  amenities?: (| string
    | {
        id?: string;
        name?: string | null;
        title?: string | null;
      })[];

  images?: (| string
    | {
        id?: string;
        url?: string | null;
        imageUrl?: string | null;
        path?: string | null;
      })[];

  verificationNotes?: string | null;
  verificationNote?: string | null;
};

type ApiResponse = {
  properties?: Property[];
  data?:
    | Property[]
    | {
        properties?: Property[];
        property?: Property;
      };
  property?: Property;
  message?: string;
  error?: string;
};

function getPropertyTitle(property: Property) {
  return property.title || property.name || "Untitled Property";
}

function getLocation(property: Property) {
  const parts = [
    property.ward?.name,
    property.constituency?.name,
    property.county?.name,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return property.location || property.address || "Location not provided";
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `KES ${Number(value).toLocaleString("en-KE")}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getImageUrl(
  image:
    | string
    | {
        id?: string;
        url?: string | null;
        imageUrl?: string | null;
        path?: string | null;
      }
    | null
    | undefined
) {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  return image.url || image.imageUrl || image.path || "";
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "Pending Verification";
    case "CHANGES_REQUIRED":
      return "Changes Required";
    case "ACTIVE":
      return "Active";
    case "REJECTED":
      return "Rejected";
    case "DRAFT":
      return "Draft";
    case "RENTED":
      return "Rented";
    case "INACTIVE":
      return "Inactive";
    default:
      return status || "Unknown";
  }
}

function getStatusTone(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "CHANGES_REQUIRED":
      return "changes";
    case "REJECTED":
      return "rejected";
    case "PENDING_VERIFICATION":
    default:
      return "pending";
  }
}

function normalizeProperties(response: ApiResponse): Property[] {
  if (Array.isArray(response.properties)) {
    return response.properties;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    Array.isArray(response.data.properties)
  ) {
    return response.data.properties;
  }

  return [];
}

async function getAdminToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(ADMIN_TOKEN_KEY);
      }
      return null;
    }

    return await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAdminToken();

  if (!token) {
    throw new Error("Admin session not found. Please sign in again.");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let body: T | ApiResponse | null = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : body &&
            typeof body === "object" &&
            "error" in body &&
            typeof body.error === "string"
          ? body.error
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}

export default function AdminVerificationScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);

  const [filter, setFilter] = useState<VerificationFilter>(
    "PENDING_VERIFICATION"
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [changesModalVisible, setChangesModalVisible] = useState(false);

  const [decisionNote, setDecisionNote] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadProperties = useCallback(async () => {
    try {
      const response = await apiRequest<ApiResponse>("/admin/properties");

      const loadedProperties = normalizeProperties(response);

      setProperties(loadedProperties);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load properties.";

      Alert.alert("Unable to load verification queue", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProperties();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadProperties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProperties();
  }, [loadProperties]);

  const stats = useMemo(() => {
    return {
      pending: properties.filter(
        (property) => property.status === "PENDING_VERIFICATION"
      ).length,

      changes: properties.filter(
        (property) => property.status === "CHANGES_REQUIRED"
      ).length,

      active: properties.filter(
        (property) => property.status === "ACTIVE"
      ).length,

      rejected: properties.filter(
        (property) => property.status === "REJECTED"
      ).length,
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties
      .filter((property) => {
        if (filter === "ALL") {
          return true;
        }

        return property.status === filter;
      })
      .filter((property) => {
        if (!query) {
          return true;
        }

        const searchable = [
          getPropertyTitle(property),
          getLocation(property),
          property.purpose,
          property.longStayType,
          property.shortStayType,
          property.source,
          property.propertySource,
          property.createdBy?.name,
          property.createdBy?.email,
          property.marketer?.name,
          property.landlord?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
  }, [properties, filter, search]);

  const updatePropertyStatus = async (
    property: Property,
    status: PropertyStatus,
    note?: string
  ) => {
    setActionLoading(true);

    try {
      const response = await apiRequest<ApiResponse>(
        `/admin/properties/${property.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            ...(note?.trim() ? { note: note.trim() } : {}),
            ...(note?.trim() ? { verificationNote: note.trim() } : {}),
          }),
        }
      );

      const updatedProperty =
        response.property ||
        (response.data && !Array.isArray(response.data)
          ? response.data.property
          : undefined);

      setProperties((current) =>
        current.map((item) =>
          item.id === property.id
            ? {
                ...item,
                ...(updatedProperty || {}),
                status,
                verificationNotes:
                  note?.trim() || item.verificationNotes || null,
                verificationNote:
                  note?.trim() || item.verificationNote || null,
                verified: status === "ACTIVE" ? true : item.verified,
              }
            : item
        )
      );

      if (selectedProperty?.id === property.id) {
        setSelectedProperty((current) =>
          current
            ? {
                ...current,
                ...(updatedProperty || {}),
                status,
                verificationNotes:
                  note?.trim() || current.verificationNotes || null,
                verificationNote:
                  note?.trim() || current.verificationNote || null,
                verified: status === "ACTIVE" ? true : current.verified,
              }
            : null
        );
      }

      setDecisionNote("");
      setRejectModalVisible(false);
      setChangesModalVisible(false);

      const successMessage =
        status === "ACTIVE"
          ? "The property has been approved and is now active."
          : status === "CHANGES_REQUIRED"
            ? "The property has been returned for corrections."
            : "The property has been rejected.";

      Alert.alert("Verification updated", successMessage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update property status.";

      Alert.alert("Action failed", message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (property: Property) => {
    Alert.alert(
      "Approve property",
      `Approve "${getPropertyTitle(property)}"? This will move it to ACTIVE.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: () =>
            updatePropertyStatus(
              property,
              "ACTIVE",
              "Property verified and approved by admin."
            ),
        },
      ]
    );
  };

  const handleReject = (property: Property) => {
    setSelectedProperty(property);
    setDecisionNote("");
    setRejectModalVisible(true);
  };

  const handleRequestChanges = (property: Property) => {
    setSelectedProperty(property);
    setDecisionNote("");
    setChangesModalVisible(true);
  };

  const handleReopen = (property: Property) => {
    Alert.alert(
      "Return to verification",
      `Move "${getPropertyTitle(property)}" back to pending verification?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reopen",
          onPress: () =>
            updatePropertyStatus(
              property,
              "PENDING_VERIFICATION",
              "Property reopened for admin verification."
            ),
        },
      ]
    );
  };

  const closeProperty = () => {
    if (!actionLoading) {
      setSelectedProperty(null);
    }
  };

  const renderStatusBadge = (status?: string | null) => {
    const tone = getStatusTone(status);

    return (
      <View style={[styles.statusBadge, styles[`statusBadge_${tone}`]]}>
        {tone === "active" ? (
          <CheckCircle2 size={14} color="#D7FF5F" />
        ) : tone === "changes" ? (
          <RefreshCw size={14} color="#F5C451" />
        ) : tone === "rejected" ? (
          <XCircle size={14} color="#FF7777" />
        ) : (
          <Clock3 size={14} color="#AFC7FF" />
        )}

        <Text style={[styles.statusText, styles[`statusText_${tone}`]]}>
          {getStatusLabel(status)}
        </Text>
      </View>
    );
  };

  const renderPropertyCard = (property: Property) => {
    const firstImage =
      property.images && property.images.length > 0
        ? getImageUrl(property.images[0])
        : "";

    const isPending =
      property.status === "PENDING_VERIFICATION" ||
      property.status === "CHANGES_REQUIRED";

    return (
      <View key={property.id} style={styles.propertyCard}>
        <View style={styles.propertyImageWrap}>
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              style={styles.propertyImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={28} color="#667174" />
              <Text style={styles.imagePlaceholderText}>No image</Text>
            </View>
          )}
        </View>

        <View style={styles.propertyContent}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardTitleArea}>
              <Text numberOfLines={1} style={styles.propertyTitle}>
                {getPropertyTitle(property)}
              </Text>

              <View style={styles.locationRow}>
                <MapPin size={14} color="#9CA5A7" />
                <Text numberOfLines={1} style={styles.locationText}>
                  {getLocation(property)}
                </Text>
              </View>
            </View>

            {renderStatusBadge(property.status)}
          </View>

          <View style={styles.metaRow}>
            {property.bedrooms !== null &&
              property.bedrooms !== undefined && (
                <Text style={styles.metaText}>
                  {property.bedrooms} bedroom
                  {property.bedrooms === 1 ? "" : "s"}
                </Text>
              )}

            {property.bathrooms !== null &&
              property.bathrooms !== undefined && (
                <Text style={styles.metaText}>
                  {property.bathrooms} bath
                  {property.bathrooms === 1 ? "" : "s"}
                </Text>
              )}

            {property.rooms !== null && property.rooms !== undefined && (
              <Text style={styles.metaText}>
                {property.rooms} room{property.rooms === 1 ? "" : "s"}
              </Text>
            )}

            {property.maxGuests !== null &&
              property.maxGuests !== undefined && (
                <Text style={styles.metaText}>
                  {property.maxGuests} guest
                  {property.maxGuests === 1 ? "" : "s"}
                </Text>
              )}
          </View>

          <View style={styles.cardInfoRow}>
            <View>
              <Text style={styles.infoLabel}>
                {property.purpose === "SHORT_STAY"
                  ? "Short-stay rate"
                  : "Monthly rent"}
              </Text>

              <Text style={styles.priceText}>
                {property.purpose === "SHORT_STAY"
                  ? formatMoney(
                      property.dayNightRate ||
                        property.nightRate ||
                        property.dayRate
                    )
                  : formatMoney(property.monthlyRent)}
              </Text>
            </View>

            <View style={styles.submittedArea}>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>
                {formatDate(property.submittedAt || property.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.submittedByRow}>
            <Text style={styles.infoLabel}>Submitted by</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {property.marketer?.name ||
                property.createdBy?.name ||
                property.landlord?.name ||
                "—"}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push(
                  (`/admin/verification/${encodeURIComponent(property.id)}`) as never
                )
              }
            >
              <Eye size={17} color="#D7FF5F" />
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </Pressable>

            {isPending && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.changesButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleRequestChanges(property)}
                >
                  <RefreshCw size={16} color="#F5C451" />
                  <Text style={styles.changesButtonText}>Changes</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.approveButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleApprove(property)}
                >
                  <Check size={17} color="#071000" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </Pressable>
              </>
            )}

            {property.status === "REJECTED" && (
              <Pressable
                style={({ pressed }) => [
                  styles.approveButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handleReopen(property)}
              >
                <RefreshCw size={17} color="#071000" />
                <Text style={styles.approveButtonText}>Reopen</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSidebar = () => (
    <View style={[styles.sidebar, Platform.OS !== "web" && styles.mobileSidebar]}>
      <View style={styles.sidebarBrand}>
        <View style={styles.logoBox}>
          <ShieldCheck size={24} color="#0B0F10" />
        </View>

        <View>
          <Text style={styles.brandText}>MAKAZII</Text>
          <Text style={styles.brandSubtext}>ADMIN</Text>
        </View>
      </View>

      <View style={styles.sidebarSection}>
        <Text style={styles.sidebarSectionTitle}>MANAGEMENT</Text>

        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/admin/dashboard")}
        >
          <FileCheck2 size={18} color="#9CA5A7" />
          <Text style={styles.sidebarItemText}>Dashboard</Text>
        </Pressable>

        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/admin/properties")}
        >
          <Eye size={18} color="#9CA5A7" />
          <Text style={styles.sidebarItemText}>Properties</Text>
        </Pressable>

        <Pressable style={[styles.sidebarItem, styles.sidebarItemActive]}>
          <ShieldCheck size={18} color="#D7FF5F" />
          <Text style={styles.sidebarItemTextActive}>Verification</Text>

          {stats.pending > 0 && (
            <View style={styles.sidebarCount}>
              <Text style={styles.sidebarCountText}>{stats.pending}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/admin/viewings")}
        >
          <Clock3 size={18} color="#9CA5A7" />
          <Text style={styles.sidebarItemText}>Viewings</Text>
        </Pressable>
      </View>

      <View style={styles.sidebarSection}>
        <Text style={styles.sidebarSectionTitle}>PEOPLE</Text>

        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/admin/landlords")}
        >
          <ShieldCheck size={18} color="#9CA5A7" />
          <Text style={styles.sidebarItemText}>Landlords</Text>
        </Pressable>

        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/admin/marketers")}
        >
          <ShieldCheck size={18} color="#9CA5A7" />
          <Text style={styles.sidebarItemText}>Marketers</Text>
        </Pressable>

        <Pressable
          style={styles.sidebarItem}
          onPress={() => router.push("/admin/users")}
        >
          <ShieldCheck size={18} color="#9CA5A7" />
          <Text style={styles.sidebarItemText}>Customers</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {Platform.OS === "web" ? (
        <View style={styles.desktopSidebar}>{renderSidebar()}</View>
      ) : sidebarOpen ? (
        <Modal
          visible={sidebarOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setSidebarOpen(false)}
        >
          <Pressable
            style={styles.sidebarOverlay}
            onPress={() => setSidebarOpen(false)}
          >
            <Pressable
              style={styles.mobileSidebarContainer}
              onPress={(event) => event.stopPropagation()}
            >
              {renderSidebar()}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <View style={styles.main}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {Platform.OS !== "web" && (
              <Pressable
                style={styles.menuButton}
                onPress={() => setSidebarOpen(true)}
              >
                <Menu size={22} color="#F4F7F7" />
              </Pressable>
            )}

            <View>
              <Text style={styles.headerTitle}>Property Verification</Text>
              <Text style={styles.headerSubtitle}>
                Review and approve properties before they go live.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onRefresh}
          >
            <RefreshCw
              size={18}
              color="#D7FF5F"
              style={refreshing ? styles.rotating : undefined}
            />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D7FF5F"
            />
          }
        >
          <View style={styles.statsGrid}>
            <StatCard
              label="Pending Verification"
              value={stats.pending}
              icon={<Clock3 size={21} color="#AFC7FF" />}
              active={filter === "PENDING_VERIFICATION"}
              onPress={() => setFilter("PENDING_VERIFICATION")}
            />

            <StatCard
              label="Changes Required"
              value={stats.changes}
              icon={<RefreshCw size={21} color="#F5C451" />}
              active={filter === "CHANGES_REQUIRED"}
              onPress={() => setFilter("CHANGES_REQUIRED")}
            />

            <StatCard
              label="Active"
              value={stats.active}
              icon={<CheckCircle2 size={21} color="#D7FF5F" />}
              active={filter === "ACTIVE"}
              onPress={() => setFilter("ACTIVE")}
            />

            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={<XCircle size={21} color="#FF7777" />}
              active={filter === "REJECTED"}
              onPress={() => setFilter("REJECTED")}
            />
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Search size={18} color="#6F797B" />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search properties, locations or submitters..."
                placeholderTextColor="#687174"
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(
                [
                  ["ALL", "All"],
                  ["PENDING_VERIFICATION", "Pending"],
                  ["CHANGES_REQUIRED", "Changes Required"],
                  ["ACTIVE", "Active"],
                  ["REJECTED", "Rejected"],
                ] as [VerificationFilter, string][]
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  style={[
                    styles.filterButton,
                    filter === value && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilter(value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === value && styles.filterButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {filter === "ALL"
                  ? "All Properties"
                  : getStatusLabel(filter)}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {filteredProperties.length}{" "}
                {filteredProperties.length === 1 ? "property" : "properties"}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#D7FF5F" />
              <Text style={styles.centerStateText}>
                Loading verification queue...
              </Text>
            </View>
          ) : filteredProperties.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <ShieldCheck size={30} color="#D7FF5F" />
              </View>

              <Text style={styles.emptyTitle}>
                {filter === "PENDING_VERIFICATION"
                  ? "No properties awaiting verification"
                  : "No properties found"}
              </Text>

              <Text style={styles.emptyText}>
                {search
                  ? "Try changing your search or selected filter."
                  : filter === "PENDING_VERIFICATION"
                    ? "New property submissions will appear here when they are sent for verification."
                    : "There are currently no properties in this category."}
              </Text>
            </View>
          ) : (
            <View style={styles.propertyList}>
              {filteredProperties.map(renderPropertyCard)}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={!!selectedProperty && !rejectModalVisible && !changesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeProperty}
      >
        {selectedProperty && (
          <View style={styles.modalBackdrop}>
            <View style={styles.detailModal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {getPropertyTitle(selectedProperty)}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {getLocation(selectedProperty)}
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={closeProperty}
                  disabled={actionLoading}
                >
                  <X size={21} color="#F4F7F7" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
              >
                {renderStatusBadge(selectedProperty.status)}

                <View style={styles.detailImages}>
                  {selectedProperty.images &&
                  selectedProperty.images.length > 0 ? (
                    selectedProperty.images.slice(0, 5).map((image, index) => {
                      const uri = getImageUrl(image);

                      if (!uri) {
                        return (
                          <View
                            key={`${selectedProperty.id}-image-${index}`}
                            style={styles.detailImagePlaceholder}
                          >
                            <ImageIcon size={24} color="#667174" />
                          </View>
                        );
                      }

                      return (
                        <Image
                          key={`${selectedProperty.id}-image-${index}`}
                          source={{ uri }}
                          style={styles.detailImage}
                          resizeMode="cover"
                        />
                      );
                    })
                  ) : (
                    <View style={styles.noImagesBox}>
                      <ImageIcon size={24} color="#667174" />
                      <Text style={styles.noImagesText}>
                        No property images
                      </Text>
                    </View>
                  )}
                </View>

                <DetailSection title="Property">
                  <DetailRow
                    label="Purpose"
                    value={
                      selectedProperty.purpose
                        ? selectedProperty.purpose.replace(/_/g, " ")
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Long-stay type"
                    value={selectedProperty.longStayType || "—"}
                  />

                  <DetailRow
                    label="Short-stay type"
                    value={selectedProperty.shortStayType || "—"}
                  />

                  <DetailRow
                    label="Bedrooms"
                    value={
                      selectedProperty.bedrooms !== null &&
                      selectedProperty.bedrooms !== undefined
                        ? String(selectedProperty.bedrooms)
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Bathrooms"
                    value={
                      selectedProperty.bathrooms !== null &&
                      selectedProperty.bathrooms !== undefined
                        ? String(selectedProperty.bathrooms)
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Beds"
                    value={
                      selectedProperty.beds !== null &&
                      selectedProperty.beds !== undefined
                        ? String(selectedProperty.beds)
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Rooms"
                    value={
                      selectedProperty.rooms !== null &&
                      selectedProperty.rooms !== undefined
                        ? String(selectedProperty.rooms)
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Maximum guests"
                    value={
                      selectedProperty.maxGuests !== null &&
                      selectedProperty.maxGuests !== undefined
                        ? String(selectedProperty.maxGuests)
                        : "—"
                    }
                  />
                </DetailSection>

                <DetailSection title="Location">
                  <DetailRow
                    label="County"
                    value={selectedProperty.county?.name || "—"}
                  />

                  <DetailRow
                    label="Constituency"
                    value={selectedProperty.constituency?.name || "—"}
                  />

                  <DetailRow
                    label="Ward"
                    value={selectedProperty.ward?.name || "—"}
                  />

                  <DetailRow
                    label="Address"
                    value={selectedProperty.address || "—"}
                  />
                </DetailSection>

                <DetailSection title="Pricing">
                  <DetailRow
                    label="Monthly rent"
                    value={formatMoney(selectedProperty.monthlyRent)}
                  />

                  <DetailRow
                    label="Deposit"
                    value={formatMoney(selectedProperty.deposit)}
                  />

                  {selectedProperty.purpose?.toUpperCase() === "SHORT_STAY" ? (
                    <DetailRow
                      label="Inspection fee"
                      value={formatMoney(selectedProperty.inspectionFee)}
                    />
                  ) : (
                    <DetailRow
                      label="Viewing fee"
                      value={formatMoney(selectedProperty.viewingFee)}
                    />
                  )}

                  <DetailRow
                    label="Service charge"
                    value={formatMoney(selectedProperty.serviceCharge)}
                  />

                  <DetailRow
                    label="Day rate"
                    value={formatMoney(selectedProperty.dayRate)}
                  />

                  <DetailRow
                    label="Night rate"
                    value={formatMoney(selectedProperty.nightRate)}
                  />

                  <DetailRow
                    label="Day & night rate"
                    value={formatMoney(selectedProperty.dayNightRate)}
                  />

                  <DetailRow
                    label="Stay mode"
                    value={selectedProperty.stayMode || "—"}
                  />
                </DetailSection>

                <DetailSection title="Submission">
                  <DetailRow
                    label="Source"
                    value={
                      selectedProperty.source ||
                      selectedProperty.propertySource ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Submitted by"
                    value={
                      selectedProperty.marketer?.name ||
                      selectedProperty.createdBy?.name ||
                      selectedProperty.landlord?.name ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Submitted"
                    value={formatDate(
                      selectedProperty.submittedAt ||
                        selectedProperty.createdAt
                    )}
                  />
                </DetailSection>

                {selectedProperty.description ? (
                  <DetailSection title="Description">
                    <Text style={styles.descriptionText}>
                      {selectedProperty.description}
                    </Text>
                  </DetailSection>
                ) : null}

                {selectedProperty.amenities &&
                selectedProperty.amenities.length > 0 ? (
                  <DetailSection title="Amenities">
                    <View style={styles.amenitiesWrap}>
                      {selectedProperty.amenities.map((amenity, index) => {
                        const name =
                          typeof amenity === "string"
                            ? amenity
                            : amenity.name || amenity.title || "Amenity";

                        return (
                          <View
                            key={`${selectedProperty.id}-amenity-${index}`}
                            style={styles.amenityChip}
                          >
                            <Text style={styles.amenityText}>{name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </DetailSection>
                ) : null}

                {selectedProperty.verificationNotes ||
                selectedProperty.verificationNote ? (
                  <DetailSection title="Verification Notes">
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>
                        {selectedProperty.verificationNotes ||
                          selectedProperty.verificationNote}
                      </Text>
                    </View>
                  </DetailSection>
                ) : null}
              </ScrollView>

              {(selectedProperty.status === "PENDING_VERIFICATION" ||
                selectedProperty.status === "CHANGES_REQUIRED") && (
                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalSecondaryAction,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleReject(selectedProperty)}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} color="#FF7777" />
                    <Text style={styles.rejectActionText}>Reject</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.modalChangesAction,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleRequestChanges(selectedProperty)}
                    disabled={actionLoading}
                  >
                    <RefreshCw size={18} color="#F5C451" />
                    <Text style={styles.changesActionText}>
                      Request Changes
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.modalApproveAction,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleApprove(selectedProperty)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#071000" />
                    ) : (
                      <Check size={19} color="#071000" />
                    )}

                    <Text style={styles.modalApproveText}>Approve</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionLoading) {
            setRejectModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.decisionModal}>
            <View style={styles.decisionIconReject}>
              <XCircle size={28} color="#FF7777" />
            </View>

            <Text style={styles.decisionTitle}>Reject Property</Text>

            <Text style={styles.decisionDescription}>
              Explain why this property is being rejected. The note will be
              recorded with the verification decision.
            </Text>

            <TextInput
              value={decisionNote}
              onChangeText={setDecisionNote}
              placeholder="Enter rejection reason..."
              placeholderTextColor="#687174"
              multiline
              textAlignVertical="top"
              style={styles.decisionInput}
            />

            <View style={styles.decisionActions}>
              <Pressable
                style={styles.cancelDecisionButton}
                onPress={() => setRejectModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.cancelDecisionText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmRejectButton}
                onPress={() => {
                  if (!selectedProperty) return;

                  if (!decisionNote.trim()) {
                    Alert.alert(
                      "Reason required",
                      "Please enter a reason before rejecting the property."
                    );
                    return;
                  }

                  updatePropertyStatus(
                    selectedProperty,
                    "REJECTED",
                    decisionNote
                  );
                }}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <XCircle size={17} color="#FFFFFF" />
                    <Text style={styles.confirmRejectText}>
                      Reject Property
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={changesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionLoading) {
            setChangesModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.decisionModal}>
            <View style={styles.decisionIconChanges}>
              <RefreshCw size={28} color="#F5C451" />
            </View>

            <Text style={styles.decisionTitle}>Request Changes</Text>

            <Text style={styles.decisionDescription}>
              Tell the property submitter what needs to be corrected before
              the property can be approved.
            </Text>

            <TextInput
              value={decisionNote}
              onChangeText={setDecisionNote}
              placeholder="Example: Update the property photos and provide the correct monthly rent."
              placeholderTextColor="#687174"
              multiline
              textAlignVertical="top"
              style={styles.decisionInput}
            />

            <View style={styles.decisionActions}>
              <Pressable
                style={styles.cancelDecisionButton}
                onPress={() => setChangesModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.cancelDecisionText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmChangesButton}
                onPress={() => {
                  if (!selectedProperty) return;

                  if (!decisionNote.trim()) {
                    Alert.alert(
                      "Note required",
                      "Please describe the changes that are required."
                    );
                    return;
                  }

                  updatePropertyStatus(
                    selectedProperty,
                    "CHANGES_REQUIRED",
                    decisionNote
                  );
                }}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#071000" />
                ) : (
                  <>
                    <RefreshCw size={17} color="#071000" />
                    <Text style={styles.confirmChangesText}>
                      Request Changes
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  active,
  onPress,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statCard,
        active && styles.statCardActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.statIcon}>{icon}</View>

      <View style={styles.statTextArea}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      <ChevronRight size={18} color="#566063" />
    </Pressable>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F10",
    flexDirection: "row",
  },

  desktopSidebar: {
    width: 250,
    borderRightWidth: 1,
    borderRightColor: "#252C2E",
  },

  sidebar: {
    flex: 1,
    backgroundColor: "#101516",
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  mobileSidebarContainer: {
    width: 280,
    height: "100%",
    backgroundColor: "#101516",
  },

  mobileSidebar: {
    width: 280,
  },

  sidebarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 7,
    marginBottom: 35,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#D7FF5F",
    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    color: "#F4F7F7",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  brandSubtext: {
    color: "#778183",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 2,
  },

  sidebarSection: {
    marginBottom: 28,
  },

  sidebarSectionTitle: {
    color: "#586164",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 9,
    paddingHorizontal: 8,
  },

  sidebarItem: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },

  sidebarItemActive: {
    backgroundColor: "#19201F",
  },

  sidebarItemText: {
    flex: 1,
    color: "#9CA5A7",
    fontSize: 14,
    fontWeight: "600",
  },

  sidebarItemTextActive: {
    flex: 1,
    color: "#D7FF5F",
    fontSize: 14,
    fontWeight: "800",
  },

  sidebarCount: {
    minWidth: 23,
    height: 23,
    borderRadius: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D7FF5F",
  },

  sidebarCountText: {
    color: "#0B0F10",
    fontSize: 11,
    fontWeight: "900",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    minHeight: 88,
    paddingHorizontal: 26,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#252C2E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    flex: 1,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#14191B",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#F4F7F7",
    fontSize: 24,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#7F898B",
    fontSize: 13,
    marginTop: 4,
  },

  refreshButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#30383A",
    backgroundColor: "#14191B",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  refreshButtonText: {
    color: "#D7FF5F",
    fontSize: 13,
    fontWeight: "800",
  },

  rotating: {
    transform: [{ rotate: "20deg" }],
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 26,
    paddingTop: 0,
    paddingBottom: 60,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    minWidth: 190,
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  statCardActive: {
    borderColor: "#4C5A32",
    backgroundColor: "#181E20",
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#1B2224",
    alignItems: "center",
    justifyContent: "center",
  },

  statTextArea: {
    flex: 1,
  },

  statValue: {
    color: "#F4F7F7",
    fontSize: 24,
    fontWeight: "900",
  },

  statLabel: {
    color: "#818B8D",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  toolbar: {
    marginBottom: 25,
  },

  searchBox: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    color: "#F4F7F7",
    fontSize: 14,
    minWidth: 0,
    outlineStyle: "none",
  } as any,

  filterRow: {
    gap: 8,
  },

  filterButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    borderColor: "#D7FF5F",
    backgroundColor: "#D7FF5F",
  },

  filterButtonText: {
    color: "#8E989A",
    fontSize: 12,
    fontWeight: "700",
  },

  filterButtonTextActive: {
    color: "#0B0F10",
  },

  sectionHeader: {
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#F4F7F7",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#687274",
    fontSize: 12,
    marginTop: 3,
  },

  propertyList: {
    gap: 13,
  },

  propertyCard: {
    backgroundColor: "#14191B",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#252C2E",
    overflow: "hidden",
    flexDirection: "row",
    minHeight: 205,
  },

  propertyImageWrap: {
    width: 235,
    backgroundColor: "#101516",
  },

  propertyImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  imagePlaceholderText: {
    color: "#596365",
    fontSize: 11,
  },

  propertyContent: {
    flex: 1,
    padding: 17,
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  cardTitleArea: {
    flex: 1,
    minWidth: 0,
  },

  propertyTitle: {
    color: "#F4F7F7",
    fontSize: 17,
    fontWeight: "900",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  locationText: {
    color: "#8D9799",
    fontSize: 12,
    flex: 1,
  },

  statusBadge: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusBadge_pending: {
    backgroundColor: "#172031",
  },

  statusBadge_changes: {
    backgroundColor: "#292313",
  },

  statusBadge_active: {
    backgroundColor: "#1D2911",
  },

  statusBadge_rejected: {
    backgroundColor: "#2A1718",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  statusText_pending: {
    color: "#AFC7FF",
  },

  statusText_changes: {
    color: "#F5C451",
  },

  statusText_active: {
    color: "#D7FF5F",
  },

  statusText_rejected: {
    color: "#FF7777",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 15,
  },

  metaText: {
    color: "#9CA5A7",
    backgroundColor: "#1B2224",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "700",
  },

  cardInfoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 15,
  },

  infoLabel: {
    color: "#626D70",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  priceText: {
    color: "#D7FF5F",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3,
  },

  submittedArea: {
    alignItems: "flex-end",
  },

  infoValue: {
    color: "#B7C0C2",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    maxWidth: 220,
  },

  submittedByRow: {
    marginTop: 11,
  },

  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 7,
    marginTop: 14,
  },

  secondaryButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#30383A",
    backgroundColor: "#181E20",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  secondaryButtonText: {
    color: "#D7FF5F",
    fontSize: 11,
    fontWeight: "800",
  },

  changesButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: "#292313",
    borderWidth: 1,
    borderColor: "#594B25",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  changesButtonText: {
    color: "#F5C451",
    fontSize: 11,
    fontWeight: "800",
  },

  approveButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: "#D7FF5F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  approveButtonText: {
    color: "#071000",
    fontSize: 11,
    fontWeight: "900",
  },

  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },

  centerState: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
  },

  centerStateText: {
    color: "#7C8688",
    fontSize: 13,
  },

  emptyState: {
    minHeight: 330,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#14191B",
    alignItems: "center",
    justifyContent: "center",
    padding: 35,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#1D2714",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    color: "#E7ECEC",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    color: "#727D7F",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 460,
    marginTop: 7,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  detailModal: {
    width: "100%",
    maxWidth: 920,
    maxHeight: "92%",
    backgroundColor: "#101516",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#30383A",
    overflow: "hidden",
  },

  modalHeader: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#252C2E",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    color: "#F4F7F7",
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: "#7C8789",
    fontSize: 12,
    marginTop: 4,
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: "#181E20",
    alignItems: "center",
    justifyContent: "center",
  },

  detailScroll: {
    flex: 1,
  },

  detailContent: {
    padding: 20,
    paddingBottom: 25,
  },

  detailImages: {
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
    marginBottom: 20,
  },

  detailImage: {
    flex: 1,
    minWidth: 0,
    height: 135,
    borderRadius: 12,
    backgroundColor: "#181E20",
  },

  detailImagePlaceholder: {
    flex: 1,
    height: 135,
    borderRadius: 12,
    backgroundColor: "#181E20",
    alignItems: "center",
    justifyContent: "center",
  },

  noImagesBox: {
    height: 115,
    borderRadius: 13,
    backgroundColor: "#181E20",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 16,
    marginBottom: 20,
  },

  noImagesText: {
    color: "#657073",
    fontSize: 11,
  },

  detailSection: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#252C2E",
    paddingTop: 15,
  },

  detailSectionTitle: {
    color: "#D7FF5F",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 9,
  },

  detailRow: {
    minHeight: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1D2325",
  },

  detailLabel: {
    color: "#697477",
    fontSize: 12,
    flex: 1,
  },

  detailValue: {
    color: "#DDE3E3",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    flex: 1.5,
  },

  descriptionText: {
    color: "#AEB8BA",
    fontSize: 13,
    lineHeight: 21,
  },

  amenitiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#181E20",
    borderWidth: 1,
    borderColor: "#252C2E",
  },

  amenityText: {
    color: "#B8C1C3",
    fontSize: 11,
    fontWeight: "700",
  },

  noteBox: {
    borderRadius: 11,
    backgroundColor: "#1A211C",
    borderWidth: 1,
    borderColor: "#34412A",
    padding: 12,
  },

  noteText: {
    color: "#C3CEB0",
    fontSize: 12,
    lineHeight: 19,
  },

  modalActions: {
    borderTopWidth: 1,
    borderTopColor: "#252C2E",
    padding: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  modalSecondaryAction: {
    minHeight: 43,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A292B",
    backgroundColor: "#221719",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  rejectActionText: {
    color: "#FF7777",
    fontSize: 12,
    fontWeight: "800",
  },

  modalChangesAction: {
    minHeight: 43,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#594B25",
    backgroundColor: "#292313",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  changesActionText: {
    color: "#F5C451",
    fontSize: 12,
    fontWeight: "800",
  },

  modalApproveAction: {
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#D7FF5F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  modalApproveText: {
    color: "#071000",
    fontSize: 12,
    fontWeight: "900",
  },

  decisionModal: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#30383A",
    padding: 22,
  },

  decisionIconReject: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#2A1718",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  decisionIconChanges: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#292313",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  decisionTitle: {
    color: "#F4F7F7",
    fontSize: 20,
    fontWeight: "900",
  },

  decisionDescription: {
    color: "#818B8D",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 15,
  },

  decisionInput: {
    minHeight: 125,
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#30383A",
    backgroundColor: "#0F1415",
    padding: 13,
    color: "#F4F7F7",
    fontSize: 13,
    lineHeight: 20,
    outlineStyle: "none",
  } as any,

  decisionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 15,
  },

  cancelDecisionButton: {
    minHeight: 43,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#1B2224",
    borderWidth: 1,
    borderColor: "#30383A",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelDecisionText: {
    color: "#A9B2B4",
    fontSize: 12,
    fontWeight: "800",
  },

  confirmRejectButton: {
    minHeight: 43,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#B94A4A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  confirmRejectText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  confirmChangesButton: {
    minHeight: 43,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#D7FF5F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  confirmChangesText: {
    color: "#071000",
    fontSize: 12,
    fontWeight: "900",
  },
});