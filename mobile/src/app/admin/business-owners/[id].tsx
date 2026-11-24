import React, { useCallback, useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  Store,
  UserRound,
  X,
  XCircle,
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

type Document = {
  id: string;
  documentType: string;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  verificationStatus?: string | null;
  verificationNotes?: string | null;
  createdAt?: string;
};

type Business = {
  id: string;
  name: string;
  category?: string | null;
  categoryLabel?: string | null;
  description?: string | null;
  suggestedCategory?: string | null;
  operatingModel?: unknown;
  requestedModules?: unknown;
  isActive?: boolean;
  createdAt?: string;
  application?: {
    id: string;
    status: string;
    questionnaire?: unknown;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewNotes?: string | null;
    actionRequired?: string | null;
    reviewedBy?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

type Owner = {
  id: string;
  status: string;
  idVerificationStatus: string;
  nationalIdNumber?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    accountStatus?: string | null;
    isActive?: boolean;
    emailVerifiedAt?: string | null;
    createdAt?: string;
  };
  reviewedBy?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  businesses: Business[];
  documents: Document[];
};

type DetailResponse = {
  success?: boolean;
  owner?: Owner;
  message?: string;
  error?: string;
};

type ActionKind =
  | "OWNER_CHANGES"
  | "OWNER_REJECT"
  | "OWNER_APPROVE"
  | "ID_REVIEW"
  | "ID_REJECT"
  | "BUSINESS_CHANGES"
  | "BUSINESS_REJECT"
  | "BUSINESS_APPROVE";

type PendingAction = {
  kind: ActionKind;
  businessId?: string;
  title: string;
  description: string;
  placeholder: string;
  required: boolean;
};

type ImagePreview = {
  title: string;
  uri: string;
};

async function getToken() {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error("Admin session not found. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const raw = await response.text();
  let body: any = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed (${response.status}).`
    );
  }

  return body as T;
}

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.replace(/_/g, " ");
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value.map((item) => pretty(item)).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${pretty(key)}: ${pretty(item)}`)
      .join("\n");
  }
  return String(value);
}

function label(value?: string | null) {
  return (value || "UNKNOWN")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function colorFor(status?: string | null) {
  if (status === "APPROVED" || status === "VERIFIED") return C.green;
  if (status === "REJECTED" || status === "SUSPENDED") return C.red;
  if (status === "ACTION_REQUIRED" || status === "REVIEW") return C.orange;
  if (status === "UNDER_REVIEW") return C.blue;
  return C.muted;
}

function dateOf(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nameOf(user?: Owner["user"] | null) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Name not provided";
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  label: rowLabel,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{rowLabel}</Text>
      <Text style={styles.infoValue}>{pretty(value)}</Text>
    </View>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  const color = colorFor(status);
  return (
    <View style={[styles.statusPill, { borderColor: `${color}66`, backgroundColor: `${color}15` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusPillText, { color }]}>{label(status)}</Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  kind = "neutral",
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: "neutral" | "primary" | "danger" | "success";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        kind === "primary" && styles.actionPrimary,
        kind === "danger" && styles.actionDanger,
        kind === "success" && styles.actionSuccess,
        disabled && styles.actionDisabled,
      ]}
    >
      {icon}
      <Text style={[styles.actionText, kind === "primary" && styles.actionTextDark]}>
        {title}
      </Text>
    </Pressable>
  );
}

export default function AdminBusinessOwnerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ownerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [imageLoading, setImageLoading] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [expandedQuestionnaires, setExpandedQuestionnaires] = useState<string[]>([]);

  // Remove private National ID previews from the temporary cache when
  // the preview closes, another image replaces it, or this screen unmounts.
  useEffect(() => {
    const uri = imagePreview?.uri;
    return () => {
      if (uri) {
        void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      }
    };
  }, [imagePreview?.uri]);

  const loadOwner = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const body = await apiRequest<DetailResponse>(
        `/admin/business-owners/${encodeURIComponent(ownerId || "")}`
      );
      if (!body.owner) throw new Error("The owner application was not returned.");
      setOwner(body.owner);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load owner application.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (ownerId) void loadOwner();
  }, [ownerId, loadOwner]);

  const openAction = (
    kind: ActionKind,
    title: string,
    description: string,
    placeholder: string,
    required: boolean,
    businessId?: string
  ) => {
    setActionMessage("");
    setPendingAction({ kind, title, description, placeholder, required, businessId });
  };

  const submitAction = async () => {
    if (!pendingAction || !owner) return;
    const action = pendingAction;
    const message = actionMessage.trim();

    if (action.required && !message) {
      Alert.alert("Message required", "Please provide a reason or instructions before continuing.");
      return;
    }

    let path = "";
    let method = "PATCH";
    let body: Record<string, string> | undefined;

    switch (action.kind) {
      case "OWNER_CHANGES":
        path = `/admin/business-owners/${owner.id}/request-changes`;
        body = { message };
        break;
      case "OWNER_REJECT":
        path = `/admin/business-owners/${owner.id}/reject`;
        body = { rejectionReason: message };
        break;
      case "OWNER_APPROVE":
        path = `/admin/business-owners/${owner.id}/approve`;
        body = message ? { adminNotes: message } : undefined;
        break;
      case "ID_REVIEW":
        path = `/admin/business-owners/${owner.id}/id-verification`;
        body = { status: "REVIEW", message };
        break;
      case "ID_REJECT":
        path = `/admin/business-owners/${owner.id}/id-verification`;
        body = { status: "REJECTED", message };
        break;
      case "BUSINESS_CHANGES":
        path = `/admin/businesses/${action.businessId}/request-changes`;
        body = { message };
        break;
      case "BUSINESS_REJECT":
        path = `/admin/businesses/${action.businessId}/reject`;
        body = { rejectionReason: message };
        break;
      case "BUSINESS_APPROVE":
        path = `/admin/businesses/${action.businessId}/approve`;
        body = message ? { adminNotes: message } : undefined;
        break;
    }

    setActionLoading(true);
    try {
      await apiRequest(path, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setPendingAction(null);
      setActionMessage("");
      await loadOwner(true);
      Alert.alert("Updated", "The application decision was saved successfully.");
    } catch (err) {
      Alert.alert(
        "Action failed",
        err instanceof Error ? err.message : "The decision could not be saved."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const startOwnerReview = async () => {
    if (!owner) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/business-owners/${owner.id}/review`, { method: "PATCH" });
      await loadOwner(true);
    } catch (err) {
      Alert.alert("Could not start review", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const startBusinessReview = async (businessId: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/admin/businesses/${businessId}/review`, { method: "PATCH" });
      await loadOwner(true);
    } catch (err) {
      Alert.alert("Could not start review", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const verifyIdentity = async () => {
    if (!owner) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/business-owners/${owner.id}/id-verification`, {
        method: "PATCH",
        body: JSON.stringify({ status: "VERIFIED" }),
      });
      await loadOwner(true);
      Alert.alert("Identity verified", "The owner's National ID has been marked as verified.");
    } catch (err) {
      Alert.alert("Verification failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const previewDocument = async (document: Document) => {
    if (!owner) return;
    if (Platform.OS === "web") {
      Alert.alert("Preview unavailable", "Secure document preview is currently available in the mobile app.");
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Session expired", "Please sign in again.");
      return;
    }

    if (!FileSystem.cacheDirectory) {
      Alert.alert("Preview unavailable", "A secure temporary cache directory is unavailable on this device.");
      return;
    }

    setImageLoading(document.id);
    try {
      const extension = document.mimeType?.includes("png")
        ? "png"
        : document.mimeType?.includes("webp")
          ? "webp"
          : "jpg";
      const destination = `${FileSystem.cacheDirectory}makazii-owner-${owner.id}-${document.id}.${extension}`;
      const result = await FileSystem.downloadAsync(
        `${API_BASE_URL}/admin/business-owners/${encodeURIComponent(owner.id)}/documents/${encodeURIComponent(document.id)}`,
        destination,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Document request failed (${result.status}).`);
      }

      setImagePreview({
        title: document.documentType === "NATIONAL_ID_FRONT" ? "National ID — Front" : "National ID — Back",
        uri: result.uri,
      });
    } catch (err) {
      Alert.alert("Could not open document", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setImageLoading(null);
    }
  };

  const toggleQuestionnaire = (businessId: string) => {
    setExpandedQuestionnaires((current) =>
      current.includes(businessId)
        ? current.filter((id) => id !== businessId)
        : [...current, businessId]
    );
  };

  const documents = owner?.documents || [];
  const frontDocument = documents.find((item) => item.documentType === "NATIONAL_ID_FRONT");
  const backDocument = documents.find((item) => item.documentType === "NATIONAL_ID_BACK");
  const identityVerified = owner?.idVerificationStatus === "VERIFIED";
  const ownerApproved = owner?.status === "APPROVED";
  const canApproveOwner = identityVerified && !["APPROVED", "REJECTED", "SUSPENDED"].includes(owner?.status || "");
  const canReviewBusinesses = ownerApproved && identityVerified;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.fullCenter}>
          <ActivityIndicator color={C.lime} size="large" />
          <Text style={styles.mutedText}>Loading owner application…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !owner) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={19} color={C.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Business Owner</Text>
        </View>
        <View style={styles.fullCenter}>
          <Text style={styles.errorTitle}>Application unavailable</Text>
          <Text style={styles.mutedText}>{error || "The owner could not be found."}</Text>
          <ActionButton title="Try again" onPress={() => void loadOwner()} kind="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={19} color={C.white} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>OWNER APPLICATION</Text>
          <Text style={styles.headerTitle}>Application review</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => void loadOwner(true)}>
          <RefreshCw size={17} color={C.lime} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadOwner(true)} tintColor={C.lime} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatar}>
              <UserRound size={25} color={C.lime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{nameOf(owner.user)}</Text>
              <Text style={styles.heroEmail}>{owner.user.email || "No email provided"}</Text>
              <Text style={styles.heroEmail}>{owner.user.phone || "No phone provided"}</Text>
            </View>
          </View>
          <View style={styles.heroStatuses}>
            <View style={styles.statusGroup}>
              <Text style={styles.statusCaption}>OWNER STATUS</Text>
              <StatusPill status={owner.status} />
            </View>
            <View style={styles.statusGroup}>
              <Text style={styles.statusCaption}>NATIONAL ID</Text>
              <StatusPill status={owner.idVerificationStatus} />
            </View>
          </View>
        </View>

        <Section title="Owner identity" subtitle="Review the applicant's account and identity information">
          <View style={styles.panel}>
            <InfoRow label="Full name" value={nameOf(owner.user)} />
            <InfoRow label="Email address" value={owner.user.email} />
            <InfoRow label="Phone number" value={owner.user.phone} />
            <InfoRow label="National ID number" value={owner.nationalIdNumber} />
            <InfoRow label="Account status" value={owner.user.accountStatus} />
            <InfoRow label="Account active" value={owner.user.isActive ? "Yes" : "No"} />
            <InfoRow label="Email verified" value={owner.user.emailVerifiedAt ? dateOf(owner.user.emailVerifiedAt) : "Not verified"} />
            <InfoRow label="Application submitted" value={dateOf(owner.createdAt)} />
            <InfoRow label="Last reviewed" value={dateOf(owner.reviewedAt)} />
            <InfoRow label="Reviewer" value={owner.reviewedBy ? nameOf(owner.reviewedBy as Owner["user"]) : "—"} />
            {owner.reviewNotes ? <InfoRow label="Review notes" value={owner.reviewNotes} /> : null}
          </View>
        </Section>

        <Section title="National ID documents" subtitle="Private documents — each view is recorded in the admin audit log">
          <View style={styles.documentGrid}>
            {[frontDocument, backDocument].map((document, index) => {
              const title = index === 0 ? "ID front" : "ID back";
              return (
                <View key={document?.id || title} style={styles.documentCard}>
                  <View style={styles.documentIcon}>
                    <ImageIcon size={22} color={C.lime} />
                  </View>
                  <Text style={styles.documentTitle}>{title}</Text>
                  <Text style={styles.documentName} numberOfLines={2}>
                    {document?.originalName || (document ? "National ID image" : "Not uploaded")}
                  </Text>
                  <StatusPill status={document?.verificationStatus || "MISSING"} />
                  {document ? (
                    <ActionButton
                      title={imageLoading === document.id ? "Opening…" : "View document"}
                      disabled={!!imageLoading}
                      onPress={() => void previewDocument(document)}
                      kind="primary"
                      icon={imageLoading === document.id
                        ? <ActivityIndicator size="small" color={C.bg} />
                        : <ImageIcon size={14} color={C.bg} />}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
          <View style={styles.notice}>
            <ShieldCheck size={17} color={C.orange} />
            <Text style={styles.noticeText}>
              Verify that both images are readable and match the applicant's submitted identity details before marking the ID as verified.
            </Text>
          </View>
          <View style={styles.actionWrap}>
            <ActionButton
              title="Mark ID verified"
              kind="success"
              disabled={!frontDocument || !backDocument || identityVerified || actionLoading}
              onPress={verifyIdentity}
              icon={<Check size={15} color={C.bg} />}
            />
            <ActionButton
              title="Flag for review"
              disabled={actionLoading || identityVerified}
              onPress={() => openAction(
                "ID_REVIEW",
                "Flag identity for review",
                "Explain what needs further identity verification.",
                "Reason for additional review…",
                true
              )}
            />
            <ActionButton
              title="Reject ID"
              kind="danger"
              disabled={actionLoading || identityVerified}
              onPress={() => openAction(
                "ID_REJECT",
                "Reject National ID",
                "Provide the reason the submitted identity documents cannot be accepted.",
                "Reason for rejecting the ID…",
                true
              )}
              icon={<XCircle size={15} color={C.white} />}
            />
          </View>
        </Section>

        <Section title="Owner application decision" subtitle="Owner approval is separate from approval of every individual business">
          {!identityVerified ? (
            <View style={styles.notice}>
              <ShieldCheck size={17} color={C.orange} />
              <Text style={styles.noticeText}>
                The owner cannot be approved until National ID verification is marked VERIFIED.
              </Text>
            </View>
          ) : null}
          <View style={styles.panel}>
            <InfoRow label="Owner application" value={label(owner.status)} />
            <InfoRow label="Identity verification" value={label(owner.idVerificationStatus)} />
            <InfoRow label="Registered businesses" value={owner.businesses.length} />
          </View>
          <View style={styles.actionWrap}>
            {["PENDING", "ACTION_REQUIRED"].includes(owner.status) ? (
              <ActionButton
                title="Start owner review"
                onPress={startOwnerReview}
                disabled={actionLoading}
                kind="primary"
              />
            ) : null}
            <ActionButton
              title="Request owner changes"
              onPress={() => openAction(
                "OWNER_CHANGES",
                "Request owner changes",
                "Explain what the applicant must correct or resubmit.",
                "Required corrections…",
                true
              )}
              disabled={actionLoading || ["APPROVED", "REJECTED", "SUSPENDED"].includes(owner.status)}
            />
            <ActionButton
              title="Approve owner"
              kind="success"
              onPress={() => openAction(
                "OWNER_APPROVE",
                "Approve business owner",
                "Optional internal admin notes for this approval.",
                "Optional admin notes…",
                false
              )}
              disabled={!canApproveOwner || actionLoading}
              icon={<Check size={15} color={C.bg} />}
            />
            <ActionButton
              title="Reject owner"
              kind="danger"
              onPress={() => openAction(
                "OWNER_REJECT",
                "Reject owner application",
                "Provide the reason for rejecting this owner's application.",
                "Rejection reason…",
                true
              )}
              disabled={actionLoading || ["APPROVED", "REJECTED", "SUSPENDED"].includes(owner.status)}
              icon={<XCircle size={15} color={C.white} />}
            />
          </View>
        </Section>

        <Section
          title="Registered businesses"
          subtitle="Each business has its own questionnaire, review and approval decision"
        >
          {owner.businesses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Store size={25} color={C.muted} />
              <Text style={styles.emptyTitle}>No businesses submitted</Text>
            </View>
          ) : owner.businesses.map((business, index) => {
            const app = business.application;
            const questionnaire = app?.questionnaire;
            const questionnaireEntries =
              questionnaire && typeof questionnaire === "object" && !Array.isArray(questionnaire)
                ? Object.entries(questionnaire as Record<string, unknown>)
                : [];
            const expanded = expandedQuestionnaires.includes(business.id);
            const canDecide = canReviewBusinesses && !!app;
            const terminal = ["APPROVED", "REJECTED"].includes(app?.status || "");

            return (
              <View key={business.id} style={styles.businessCard}>
                <View style={styles.businessHeading}>
                  <View style={styles.businessIcon}>
                    <Building2 size={21} color={C.lime} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessTitle}>{business.name}</Text>
                    <Text style={styles.businessCategory}>
                      {business.categoryLabel || label(business.category)}
                    </Text>
                  </View>
                  <Text style={styles.businessNumber}>#{index + 1}</Text>
                </View>

                <View style={styles.businessStatuses}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusCaption}>APPLICATION</Text>
                    <StatusPill status={app?.status || "MISSING"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusCaption}>BUSINESS</Text>
                    <StatusPill status={business.isActive ? "ACTIVE" : "INACTIVE"} />
                  </View>
                </View>

                {business.description ? (
                  <Text style={styles.businessDescription}>{business.description}</Text>
                ) : null}

                <View style={styles.panelCompact}>
                  <InfoRow label="Category" value={business.categoryLabel || business.category} />
                  <InfoRow label="Suggested category" value={business.suggestedCategory} />
                  <InfoRow label="Submitted" value={dateOf(app?.submittedAt)} />
                  <InfoRow label="Last reviewed" value={dateOf(app?.reviewedAt)} />
                  {app?.reviewNotes ? <InfoRow label="Review notes" value={app.reviewNotes} /> : null}
                  {app?.actionRequired ? <InfoRow label="Action required" value={app.actionRequired} /> : null}
                </View>

                <Pressable style={styles.questionnaireToggle} onPress={() => toggleQuestionnaire(business.id)}>
                  <View style={styles.questionnaireLabel}>
                    <FileText size={16} color={C.lime} />
                    <Text style={styles.questionnaireTitle}>Registration questionnaire</Text>
                  </View>
                  <ChevronDown
                    size={17}
                    color={C.muted}
                    style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
                  />
                </Pressable>

                {expanded ? (
                  <View style={styles.questionnaireBody}>
                    {questionnaireEntries.length ? questionnaireEntries.map(([key, value]) => (
                      <InfoRow key={key} label={label(key)} value={pretty(value)} />
                    )) : (
                      <Text style={styles.mutedText}>No questionnaire details were returned.</Text>
                    )}
                    {business.operatingModel ? (
                      <InfoRow label="Operating model" value={pretty(business.operatingModel)} />
                    ) : null}
                    {business.requestedModules ? (
                      <InfoRow label="Requested modules" value={pretty(business.requestedModules)} />
                    ) : null}
                  </View>
                ) : null}

                {!ownerApproved ? (
                  <View style={styles.notice}>
                    <ShieldCheck size={16} color={C.orange} />
                    <Text style={styles.noticeText}>
                      Approve the owner and verify their ID before approving this business.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionWrap}>
                  {["PENDING", "ACTION_REQUIRED"].includes(app?.status || "") ? (
                    <ActionButton
                      title="Start business review"
                      onPress={() => void startBusinessReview(business.id)}
                      disabled={actionLoading || !canReviewBusinesses}
                      kind="primary"
                    />
                  ) : null}
                  <ActionButton
                    title="Request business changes"
                    onPress={() => openAction(
                      "BUSINESS_CHANGES",
                      "Request business changes",
                      `Explain what ${business.name} must correct or provide.`,
                      "Required corrections…",
                      true,
                      business.id
                    )}
                    disabled={actionLoading || !canDecide || terminal}
                  />
                  <ActionButton
                    title="Approve business"
                    kind="success"
                    onPress={() => openAction(
                      "BUSINESS_APPROVE",
                      "Approve this business",
                      `Approve ${business.name} independently. Optional admin notes.`,
                      "Optional admin notes…",
                      false,
                      business.id
                    )}
                    disabled={actionLoading || !canDecide || terminal || app?.status === "APPROVED"}
                    icon={<Check size={15} color={C.bg} />}
                  />
                  <ActionButton
                    title="Reject business"
                    kind="danger"
                    onPress={() => openAction(
                      "BUSINESS_REJECT",
                      "Reject this business",
                      `Provide the reason for rejecting ${business.name}.`,
                      "Rejection reason…",
                      true,
                      business.id
                    )}
                    disabled={actionLoading || !canDecide || terminal}
                    icon={<XCircle size={15} color={C.white} />}
                  />
                </View>
              </View>
            );
          })}
        </Section>
      </ScrollView>

      <Modal
        visible={!!pendingAction}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionLoading) setPendingAction(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{pendingAction?.title}</Text>
                <Text style={styles.modalDescription}>{pendingAction?.description}</Text>
              </View>
              <Pressable
                style={styles.modalClose}
                disabled={actionLoading}
                onPress={() => setPendingAction(null)}
              >
                <X size={18} color={C.white} />
              </Pressable>
            </View>
            <TextInput
              value={actionMessage}
              onChangeText={setActionMessage}
              placeholder={pendingAction?.placeholder}
              placeholderTextColor="#6F7B7D"
              multiline
              textAlignVertical="top"
              editable={!actionLoading}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <ActionButton
                title="Cancel"
                onPress={() => setPendingAction(null)}
                disabled={actionLoading}
              />
              <ActionButton
                title={actionLoading ? "Saving…" : "Confirm decision"}
                onPress={() => void submitAction()}
                kind="primary"
                disabled={actionLoading}
                icon={actionLoading ? <ActivityIndicator size="small" color={C.bg} /> : undefined}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!imagePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreview(null)}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{imagePreview?.title || "National ID"}</Text>
            <Pressable style={styles.modalClose} onPress={() => setImagePreview(null)}>
              <X size={19} color={C.white} />
            </Pressable>
          </View>
          {imagePreview ? (
            <Image
              source={{ uri: imagePreview.uri }}
              resizeMode="contain"
              style={styles.previewImage}
            />
          ) : null}
          <Text style={styles.previewNotice}>Private identity document · Admin access recorded</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 17, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
  },
  eyebrow: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: "900", marginTop: 3 },
  content: { padding: 17, paddingBottom: 50, maxWidth: 950, width: "100%", alignSelf: "center" },
  heroCard: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 20, padding: 17 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  heroAvatar: { width: 53, height: 53, borderRadius: 17, backgroundColor: C.soft, alignItems: "center", justifyContent: "center" },
  heroName: { color: C.white, fontSize: 18, fontWeight: "900" },
  heroEmail: { color: C.muted, fontSize: 11, marginTop: 4 },
  heroStatuses: { flexDirection: "row", gap: 12, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  statusGroup: { flex: 1, gap: 7 },
  statusCaption: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2, marginBottom: 6 },
  statusPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 30, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 9, fontWeight: "900" },
  section: { marginTop: 23 },
  sectionHeading: { marginBottom: 11 },
  sectionTitle: { color: C.white, fontSize: 15, fontWeight: "900" },
  sectionSubtitle: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  panel: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14 },
  panelCompact: { backgroundColor: C.soft, borderRadius: 13, paddingHorizontal: 12, marginTop: 13 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabel: { flex: 0.85, color: C.muted, fontSize: 10, lineHeight: 16 },
  infoValue: { flex: 1.15, color: C.white, fontSize: 10, lineHeight: 16, textAlign: "right", fontWeight: "700" },
  documentGrid: { flexDirection: "row", gap: 11 },
  documentCard: { flex: 1, minWidth: 0, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 13, gap: 9 },
  documentIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: C.soft, alignItems: "center", justifyContent: "center" },
  documentTitle: { color: C.white, fontSize: 12, fontWeight: "900" },
  documentName: { color: C.muted, fontSize: 9, minHeight: 26 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, marginTop: 12, borderRadius: 12, backgroundColor: "#292117", borderWidth: 1, borderColor: "#554027" },
  noticeText: { flex: 1, color: "#E8C99F", fontSize: 10, lineHeight: 16 },
  actionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  actionButton: { minHeight: 39, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.soft },
  actionPrimary: { backgroundColor: C.lime, borderColor: C.lime },
  actionDanger: { backgroundColor: "#3A2022", borderColor: "#704044" },
  actionSuccess: { backgroundColor: C.green, borderColor: C.green },
  actionDisabled: { opacity: 0.35 },
  actionText: { color: C.white, fontSize: 10, fontWeight: "900" },
  actionTextDark: { color: C.bg },
  businessCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, marginBottom: 12 },
  businessHeading: { flexDirection: "row", alignItems: "center", gap: 11 },
  businessIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: C.soft, alignItems: "center", justifyContent: "center" },
  businessTitle: { color: C.white, fontSize: 14, fontWeight: "900" },
  businessCategory: { color: C.muted, fontSize: 10, marginTop: 4 },
  businessNumber: { color: C.muted, fontSize: 10, fontWeight: "800" },
  businessStatuses: { flexDirection: "row", gap: 12, marginTop: 15, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  businessDescription: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 12 },
  questionnaireToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, marginTop: 5 },
  questionnaireLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  questionnaireTitle: { color: C.white, fontSize: 11, fontWeight: "800" },
  questionnaireBody: { backgroundColor: C.soft, borderRadius: 12, paddingHorizontal: 11, marginBottom: 8 },
  emptyCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 25, alignItems: "center", gap: 10 },
  emptyTitle: { color: C.white, fontSize: 13, fontWeight: "800" },
  mutedText: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 7 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 25, gap: 12 },
  errorTitle: { color: C.white, fontSize: 17, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "#000000B8", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: C.card, borderRadius: 19, borderWidth: 1, borderColor: C.border, padding: 17, width: "100%", maxWidth: 520, alignSelf: "center" },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalTitle: { color: C.white, fontSize: 16, fontWeight: "900" },
  modalDescription: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  modalClose: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.soft, alignItems: "center", justifyContent: "center" },
  modalInput: { minHeight: 115, maxHeight: 190, marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, color: C.white, fontSize: 12, lineHeight: 18 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 8, marginTop: 14 },
  previewBackdrop: { flex: 1, backgroundColor: "#050708", paddingTop: Platform.OS === "ios" ? 55 : 25, paddingHorizontal: 14, paddingBottom: 22 },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 },
  previewTitle: { color: C.white, fontSize: 15, fontWeight: "900" },
  previewImage: { flex: 1, width: "100%" },
  previewNotice: { color: C.muted, fontSize: 9, textAlign: "center", paddingVertical: 10 },
});
