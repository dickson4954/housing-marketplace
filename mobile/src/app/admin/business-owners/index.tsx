import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  RefreshCw,
  Search,
  Store,
  UserRound,
} from "lucide-react-native";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "makazii_admin_token";
const C = {
  bg: "#0B0F10",
  card: "#14191B",
  soft: "#181E20",
  lime: "#D7FF5F",
  white: "#F4F7F7",
  muted: "#9CA5A7",
  border: "#252C2E",
  green: "#75D99A",
  orange: "#F2B66D",
  red: "#FF7777",
  blue: "#80B5F4",
};

type OwnerBusiness = {
  id: string;
  name: string;
  category?: string | null;
  categoryLabel?: string | null;
  isActive?: boolean;
  application?: {
    id: string;
    status: string;
    submittedAt?: string | null;
    actionRequired?: string | null;
  } | null;
};

type Owner = {
  id: string;
  status: string;
  idVerificationStatus: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    accountStatus?: string | null;
    isActive?: boolean;
  };
  businesses: OwnerBusiness[];
  _count?: {
    businesses?: number;
    documents?: number;
  };
};

type ListResponse = {
  success?: boolean;
  owners?: Owner[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: {
    total: number;
    statuses?: Record<string, number>;
  };
  message?: string;
  error?: string;
};

const OWNER_FILTERS = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
];

const ID_FILTERS = ["ALL", "PENDING", "VERIFIED", "REVIEW", "REJECTED"];

function label(value?: string | null) {
  return (value || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function personName(owner: Owner) {
  return [owner.user?.firstName, owner.user?.lastName]
    .filter(Boolean)
    .join(" ") || "Name not provided";
}

function statusColor(status?: string) {
  if (status === "APPROVED" || status === "VERIFIED") return C.green;
  if (status === "REJECTED" || status === "SUSPENDED") return C.red;
  if (status === "ACTION_REQUIRED" || status === "REVIEW") return C.orange;
  if (status === "UNDER_REVIEW") return C.blue;
  return C.muted;
}

async function getToken() {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export default function AdminBusinessOwnersScreen() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [search, setSearch] = useState("");
  const [ownerStatus, setOwnerStatus] = useState("ALL");
  const [idStatus, setIdStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOwners = useCallback(async (nextPage = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Admin session not found. Please sign in again.");

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "20",
      });
      if (search.trim()) params.set("search", search.trim());
      if (ownerStatus !== "ALL") params.set("status", ownerStatus);
      if (idStatus !== "ALL") params.set("idVerificationStatus", idStatus);

      const response = await fetch(
        `${API_BASE_URL}/admin/business-owners?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const body = (await response.json()) as ListResponse;
      if (!response.ok) {
        throw new Error(body.message || body.error || `Request failed (${response.status}).`);
      }

      setOwners(Array.isArray(body.owners) ? body.owners : []);
      setPage(body.pagination?.page || nextPage);
      setPages(Math.max(1, body.pagination?.pages || 1));
      setTotal(body.pagination?.total ?? body.summary?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load business owners.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, ownerStatus, idStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOwners(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadOwners]);

  const openOwner = (owner: Owner) => {
    router.push({
      pathname: "/admin/business-owners/[id]",
      params: { id: owner.id },
    } as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.push("/admin/dashboard" as never)}>
          <ArrowLeft size={19} color={C.white} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>MARKETPLACE ADMINISTRATION</Text>
          <Text style={styles.title}>Business Owners</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={() => void loadOwners(1, true)}>
          <RefreshCw size={18} color={C.lime} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadOwners(1, true)}
            tintColor={C.lime}
          />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <BriefcaseBusiness size={22} color={C.lime} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>OWNER APPLICATIONS</Text>
            <Text style={styles.summaryValue}>{total.toLocaleString("en-KE")}</Text>
            <Text style={styles.summaryHint}>Review owner identity and each business independently</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email, phone or business"
            placeholderTextColor="#697476"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        <Text style={styles.filterHeading}>OWNER APPLICATION</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {OWNER_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setOwnerStatus(filter)}
              style={[styles.chip, ownerStatus === filter && styles.chipActive]}
            >
              <Text style={[styles.chipText, ownerStatus === filter && styles.chipTextActive]}>
                {label(filter)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>NATIONAL ID VERIFICATION</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {ID_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setIdStatus(filter)}
              style={[styles.chip, idStatus === filter && styles.chipActive]}
            >
              <Text style={[styles.chipText, idStatus === filter && styles.chipTextActive]}>
                {label(filter)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={C.lime} size="large" />
            <Text style={styles.stateText}>Loading owner applications…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load applications</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadOwners(1)}>
              <RefreshCw size={15} color={C.bg} />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : owners.length === 0 ? (
          <View style={styles.emptyCard}>
            <Store size={30} color={C.muted} />
            <Text style={styles.emptyTitle}>No business owners found</Text>
            <Text style={styles.emptyText}>Try changing your search or application filters.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {owners.map((owner) => (
              <Pressable
                key={owner.id}
                onPress={() => openOwner(owner)}
                style={({ pressed }) => [styles.ownerCard, pressed && { opacity: 0.78 }]}
              >
                <View style={styles.ownerTop}>
                  <View style={styles.avatar}>
                    <UserRound size={21} color={C.lime} />
                  </View>
                  <View style={styles.ownerIdentity}>
                    <Text style={styles.ownerName}>{personName(owner)}</Text>
                    <Text style={styles.ownerContact}>{owner.user?.email || "No email provided"}</Text>
                    <Text style={styles.ownerContact}>{owner.user?.phone || "No phone provided"}</Text>
                  </View>
                  <ChevronRight size={19} color={C.muted} />
                </View>

                <View style={styles.statusRow}>
                  <View style={styles.statusBlock}>
                    <Text style={styles.statusCaption}>OWNER</Text>
                    <Text style={[styles.statusValue, { color: statusColor(owner.status) }]}>
                      {label(owner.status)}
                    </Text>
                  </View>
                  <View style={styles.statusDivider} />
                  <View style={styles.statusBlock}>
                    <Text style={styles.statusCaption}>NATIONAL ID</Text>
                    <Text style={[styles.statusValue, { color: statusColor(owner.idVerificationStatus) }]}>
                      {label(owner.idVerificationStatus)}
                    </Text>
                  </View>
                </View>

                <View style={styles.businessSummary}>
                  <Building2 size={16} color={C.muted} />
                  <Text style={styles.businessCount}>
                    {owner._count?.businesses ?? owner.businesses?.length ?? 0} business(es)
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.viewLabel}>Review application</Text>
                </View>

                {owner.businesses?.slice(0, 3).map((business) => (
                  <View key={business.id} style={styles.businessLine}>
                    <Text style={styles.businessName} numberOfLines={1}>{business.name}</Text>
                    <Text style={[styles.businessStatus, { color: statusColor(business.application?.status) }]}>
                      {label(business.application?.status)}
                    </Text>
                  </View>
                ))}
                {(owner.businesses?.length || 0) > 3 ? (
                  <Text style={styles.moreBusinesses}>+{owner.businesses.length - 3} more businesses</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

        {!loading && pages > 1 ? (
          <View style={styles.pagination}>
            <Pressable
              disabled={page <= 1}
              onPress={() => void loadOwners(page - 1)}
              style={[styles.pageButton, page <= 1 && styles.disabledButton]}
            >
              <Text style={styles.pageButtonText}>Previous</Text>
            </Pressable>
            <Text style={styles.pageText}>Page {page} of {pages}</Text>
            <Pressable
              disabled={page >= pages}
              onPress={() => void loadOwners(page + 1)}
              style={[styles.pageButton, page >= pages && styles.disabledButton]}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
  },
  headerText: { flex: 1 },
  eyebrow: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: C.white, fontSize: 22, fontWeight: "900", marginTop: 3 },
  refreshButton: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
  },
  content: { padding: 18, paddingBottom: 40, maxWidth: 900, width: "100%", alignSelf: "center" },
  summaryCard: {
    backgroundColor: C.card, borderColor: C.border, borderWidth: 1,
    borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 15,
  },
  summaryIcon: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: "#242D18",
    alignItems: "center", justifyContent: "center",
  },
  summaryLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  summaryValue: { color: C.white, fontSize: 27, fontWeight: "900", marginTop: 3 },
  summaryHint: { color: C.muted, fontSize: 11, marginTop: 3 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 14, minHeight: 50,
  },
  searchInput: { flex: 1, color: C.white, fontSize: 13, paddingVertical: 12, outlineStyle: "none" as any },
  filterHeading: {
    color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4,
    marginTop: 20, marginBottom: 9,
  },
  chips: { gap: 8, paddingRight: 12 },
  chip: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 30,
  },
  chipActive: { backgroundColor: C.lime, borderColor: C.lime },
  chipText: { color: C.muted, fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: C.bg },
  centerState: { paddingVertical: 60, alignItems: "center", gap: 13 },
  stateText: { color: C.muted, fontSize: 12 },
  errorCard: { marginTop: 20, backgroundColor: C.card, borderColor: "#5A292D", borderWidth: 1, borderRadius: 16, padding: 18 },
  errorTitle: { color: C.white, fontSize: 15, fontWeight: "800" },
  errorText: { color: C.muted, fontSize: 12, marginTop: 7, lineHeight: 18 },
  retryButton: { marginTop: 14, alignSelf: "flex-start", backgroundColor: C.lime, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 7 },
  retryText: { color: C.bg, fontSize: 11, fontWeight: "900" },
  emptyCard: { marginTop: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 28, alignItems: "center" },
  emptyTitle: { color: C.white, fontSize: 15, fontWeight: "800", marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 12, marginTop: 6, textAlign: "center" },
  list: { gap: 12, marginTop: 18 },
  ownerCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15 },
  ownerTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: { width: 43, height: 43, borderRadius: 14, backgroundColor: C.soft, alignItems: "center", justifyContent: "center" },
  ownerIdentity: { flex: 1 },
  ownerName: { color: C.white, fontSize: 14, fontWeight: "900" },
  ownerContact: { color: C.muted, fontSize: 10, marginTop: 3 },
  statusRow: { flexDirection: "row", marginTop: 15, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  statusBlock: { flex: 1 },
  statusCaption: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  statusValue: { fontSize: 10, fontWeight: "900", marginTop: 5 },
  statusDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 12 },
  businessSummary: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  businessCount: { color: C.muted, fontSize: 10, fontWeight: "700" },
  viewLabel: { color: C.lime, fontSize: 10, fontWeight: "900" },
  businessLine: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 10, paddingLeft: 23 },
  businessName: { flex: 1, color: C.white, fontSize: 11, fontWeight: "700" },
  businessStatus: { fontSize: 9, fontWeight: "900" },
  moreBusinesses: { color: C.muted, fontSize: 9, marginTop: 8, paddingLeft: 23 },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  pageButton: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  disabledButton: { opacity: 0.35 },
  pageButtonText: { color: C.white, fontSize: 10, fontWeight: "800" },
  pageText: { color: C.muted, fontSize: 10, fontWeight: "700" },
});
