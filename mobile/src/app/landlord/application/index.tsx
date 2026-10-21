import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  IdCard,
  MapPin,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Save,
} from "lucide-react-native";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "makazii_landlord_token";

type CountyOption = {
  id: string;
  name: string;
};

type Application = {
  applicationStatus?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  idVerificationStatus?: string | null;
  idVerificationMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  propertyCounties?: CountyOption[];
};

type StatusCardProps = {
  title: string;
  description: string;
  status?: string | null;
  message?: string | null;
  icon: React.ReactNode;
  kind: "application" | "identity";
};

function normalizeStatus(value?: string | null) {
  return (value || "").trim().toUpperCase();
}

function formatStatus(value?: string | null) {
  if (!value) return "Not available";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const webToken = window.localStorage.getItem(TOKEN_KEY);
      if (webToken) return webToken;
    }
  } catch {
    // Continue to secure storage on native platforms.
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStatusAppearance(
  status: string,
  kind: "application" | "identity"
) {
  if (
    ["APPROVED", "VERIFIED", "COMPLETE", "COMPLETED"].includes(status)
  ) {
    return {
      color: "#D7FF5F",
      heading:
        kind === "application"
          ? "Application approved"
          : "Identity verified",
      detail:
        kind === "application"
          ? "Your landlord application has been approved."
          : "Your identity verification has been completed.",
      icon: "success" as const,
    };
  }

  if (
    ["REJECTED", "FAILED"].includes(status)
  ) {
    return {
      color: "#FF8C8C",
      heading:
        kind === "application"
          ? "Application rejected"
          : "Verification unsuccessful",
      detail:
        kind === "application"
          ? "Please read the review message below for further information."
          : "Please read the verification message below for further information.",
      icon: "error" as const,
    };
  }

  if (
    ["ACTION_REQUIRED", "CHANGES_REQUIRED", "NEEDS_ATTENTION"].includes(
      status
    )
  ) {
    return {
      color: "#FFC875",
      heading: "Action required",
      detail:
        kind === "application"
          ? "Makazii needs you to address the feedback on your application."
          : "Please follow the instructions in the identity verification message.",
      icon: "warning" as const,
    };
  }

  if (
    [
      "PENDING",
      "UNDER_REVIEW",
      "PENDING_REVIEW",
      "IN_REVIEW",
      "PROCESSING",
      "SUBMITTED",
      "PENDING_VERIFICATION",
    ].includes(status)
  ) {
    return {
      color: "#FFC875",
      heading:
        status === "PENDING"
          ? "Waiting for review"
          : "Review in progress",
      detail:
        kind === "application"
          ? "Your application is awaiting review or is being reviewed by Makazii."
          : "Your identity verification is awaiting review or is being processed.",
      icon: "pending" as const,
    };
  }

  if (!status) {
    return {
      color: "#9CA5A7",
      heading: "Status not available",
      detail: "Refresh this page to check for an updated status.",
      icon: "warning" as const,
    };
  }

  return {
    color: "#9CA5A7",
    heading: formatStatus(status),
    detail: "Check again later or contact Makazii if you need assistance.",
    icon: "pending" as const,
  };
}

function StatusCard({
  title,
  description,
  status,
  message,
  icon,
  kind,
}: StatusCardProps) {
  const normalized = normalizeStatus(status);
  const appearance = getStatusAppearance(normalized, kind);

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.iconBox}>{icon}</View>

        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.muted}>{description}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[styles.dot, { backgroundColor: appearance.color }]}
        />
        <Text style={[styles.status, { color: appearance.color }]}>
          {formatStatus(status)}
        </Text>
      </View>

      <Text style={styles.statusHeading}>{appearance.heading}</Text>
      <Text style={styles.muted}>{appearance.detail}</Text>

      {message?.trim() ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>MESSAGE FROM MAKAZII</Text>
          <Text style={styles.message}>{message.trim()}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function LandlordApplication() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  const [availableCounties, setAvailableCounties] = useState<CountyOption[]>([]);
  const [selectedCountyIds, setSelectedCountyIds] = useState<string[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(true);
  const [countyLoadError, setCountyLoadError] = useState("");
  const [savingCounties, setSavingCounties] = useState(false);
  const [countySaveError, setCountySaveError] = useState("");
  const [countySaveMessage, setCountySaveMessage] = useState("");

  const loadApplication = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setLoginRequired(false);

    try {
      const token = await getToken();

      if (!token) {
        setLoginRequired(true);
        setError("Please log in to view your landlord application.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/landlord/application-status`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        setLoginRequired(true);
        setError(
          response.status === 403
            ? "Your session is no longer authorized. Please log in again."
            : "Your session may have expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Could not load your application status."
        );
      }

      if (!result.data || typeof result.data !== "object") {
        throw new Error("The server returned an unexpected response.");
      }

      const loadedApplication = result.data as Application;
      setApplication(loadedApplication);
      setSelectedCountyIds(
        Array.isArray(loadedApplication.propertyCounties)
          ? loadedApplication.propertyCounties
              .filter((county) => (
                typeof county?.id === "string" &&
                typeof county?.name === "string"
              ))
              .map((county) => county.id)
          : []
      );
      setCountySaveError("");
      setCountySaveMessage("");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Unable to connect to Makazii. Check your internet connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to load your application."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    let cancelled = false;

    async function loadCounties() {
      setCountiesLoading(true);
      setCountyLoadError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/geography/counties`,
          { headers: { Accept: "application/json" } }
        );
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message || "Unable to load the county list."
          );
        }

        const rows = result?.data?.counties;
        if (!Array.isArray(rows)) {
          throw new Error("The server returned an unexpected county list.");
        }

        const counties: CountyOption[] = rows
          .filter((item: any) => (
            typeof item?.id === "string" &&
            typeof item?.name === "string"
          ))
          .map((item: any) => ({ id: item.id, name: item.name }));

        if (!cancelled) {
          setAvailableCounties(counties);
        }
      } catch (err) {
        if (!cancelled) {
          setCountyLoadError(
            err instanceof TypeError
              ? "Unable to connect to Makazii to load counties."
              : err instanceof Error
                ? err.message
                : "Unable to load counties."
          );
        }
      } finally {
        if (!cancelled) {
          setCountiesLoading(false);
        }
      }
    }

    void loadCounties();

    return () => {
      cancelled = true;
    };
  }, []);

  const applicationStatus = normalizeStatus(
    application?.applicationStatus
  );
  const isApproved = applicationStatus === "APPROVED";
  const needsAction = [
    "ACTION_REQUIRED",
    "CHANGES_REQUIRED",
    "NEEDS_ATTENTION",
  ].includes(applicationStatus);
  const isRejected = applicationStatus === "REJECTED";
  const canEditCounties = Boolean(application) && !isApproved && !isRejected;

  async function savePropertyCounties() {
    if (selectedCountyIds.length === 0) {
      setCountySaveError("Select at least one county before saving.");
      setCountySaveMessage("");
      return;
    }

    setSavingCounties(true);
    setCountySaveError("");
    setCountySaveMessage("");

    try {
      const token = await getToken();

      if (!token) {
        setLoginRequired(true);
        setCountySaveError("Your session may have expired. Please log in again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/landlord/account/questionnaire`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyCountyIds: selectedCountyIds,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        setLoginRequired(true);
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Unable to save your county selections."
        );
      }

      const savedCounties: CountyOption[] = Array.isArray(
        result?.data?.propertyCounties
      )
        ? result.data.propertyCounties.filter((item: any) => (
            typeof item?.id === "string" &&
            typeof item?.name === "string"
          ))
        : [];

      setSelectedCountyIds(savedCounties.map((county) => county.id));
      setApplication((current) => current
        ? { ...current, propertyCounties: savedCounties }
        : current
      );
      setCountySaveMessage(
        result.message || "Your county selections have been saved."
      );
    } catch (err) {
      setCountySaveError(
        err instanceof TypeError
          ? "Unable to connect to Makazii. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to save your county selections."
      );
    } finally {
      setSavingCounties(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.flex}>
          <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>
          <Text style={styles.headerTitle}>My application</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh application status"
          style={styles.headerButton}
          disabled={loading || refreshing}
          onPress={() => void loadApplication(true)}
        >
          {refreshing ? (
            <ActivityIndicator color="#D7FF5F" />
          ) : (
            <RefreshCw size={18} color="#D7FF5F" />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadApplication(true)}
            tintColor="#D7FF5F"
            colors={["#D7FF5F"]}
          />
        }
      >
        <View style={styles.introIcon}>
          <FileCheck2 size={25} color="#D7FF5F" />
        </View>

        <Text style={styles.title}>Track your progress</Text>

        <Text style={styles.subtitle}>
          Follow your landlord application and national ID verification
          separately. Any action requested by Makazii will appear in the
          messages below.
        </Text>

        {loading ? (
          <View style={styles.feedback}>
            <ActivityIndicator size="large" color="#D7FF5F" />
            <Text style={styles.muted}>Loading your application...</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <View style={styles.errorHeading}>
              <AlertCircle size={21} color="#FF8C8C" />
              <Text style={styles.errorTitle}>Unable to load status</Text>
            </View>

            <Text style={styles.muted}>{error}</Text>

            <Pressable
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={() => {
                if (loginRequired) {
                  router.replace("/landlord/login" as any);
                } else {
                  void loadApplication();
                }
              }}
            >
              <Text style={styles.primaryText}>
                {loginRequired ? "Go to login" : "Try again"}
              </Text>
            </Pressable>
          </View>
        ) : application ? (
          <>
            <StatusCard
              title="Application review"
              description="Makazii's review of your landlord application"
              status={application.applicationStatus}
              message={application.reviewNotes}
              kind="application"
              icon={<ShieldCheck size={21} color="#D7FF5F" />}
            />

            <StatusCard
              title="National ID verification"
              description="A separate check of your identity documents"
              status={application.idVerificationStatus}
              message={application.idVerificationMessage}
              kind="identity"
              icon={<IdCard size={21} color="#D7FF5F" />}
            />

            <View style={styles.card}>
              <View style={styles.heading}>
                <View style={styles.iconBox}>
                  <MapPin size={21} color="#D7FF5F" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Property counties</Text>
                  <Text style={styles.muted}>
                    Choose the counties where you intend to list properties.
                    After approval, your property form will be limited to
                    these counties.
                  </Text>
                </View>
              </View>

              {canEditCounties ? (
                <>
                  <Text style={styles.countyHelp}>
                    Select at least one county. Saving these choices does not
                    approve your application or remove any review requirements.
                  </Text>

                  {countiesLoading ? (
                    <View style={styles.countyFeedback}>
                      <ActivityIndicator color="#D7FF5F" />
                      <Text style={styles.muted}>Loading counties...</Text>
                    </View>
                  ) : countyLoadError ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.message}>{countyLoadError}</Text>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.countyRetryButton}
                        onPress={() => {
                          setCountyLoadError("");
                          setCountiesLoading(true);
                          void fetch(`${API_BASE_URL}/geography/counties`, {
                            headers: { Accept: "application/json" },
                          })
                            .then(async (response) => {
                              const result = await response.json();
                              if (!response.ok || !result?.success ||
                                  !Array.isArray(result?.data?.counties)) {
                                throw new Error(
                                  result?.message || "Unable to load counties."
                                );
                              }
                              setAvailableCounties(
                                result.data.counties
                                  .filter((item: any) => (
                                    typeof item?.id === "string" &&
                                    typeof item?.name === "string"
                                  ))
                                  .map((item: any) => ({
                                    id: item.id,
                                    name: item.name,
                                  }))
                              );
                            })
                            .catch((err) => setCountyLoadError(
                              err instanceof Error
                                ? err.message
                                : "Unable to load counties."
                            ))
                            .finally(() => setCountiesLoading(false));
                        }}
                      >
                        <Text style={styles.secondaryText}>Retry loading counties</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.countyList}>
                      {availableCounties.map((county) => {
                        const selected = selectedCountyIds.includes(county.id);

                        return (
                          <Pressable
                            key={county.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            accessibilityLabel={county.name}
                            disabled={savingCounties}
                            onPress={() => {
                              setCountySaveError("");
                              setCountySaveMessage("");
                              setSelectedCountyIds((current) => (
                                selected
                                  ? current.filter((id) => id !== county.id)
                                  : [...current, county.id]
                              ));
                            }}
                            style={[
                              styles.countyOption,
                              selected && styles.countyOptionSelected,
                            ]}
                          >
                            <View
                              style={[
                                styles.countyCheckbox,
                                selected && styles.countyCheckboxSelected,
                              ]}
                            >
                              {selected ? (
                                <Check size={14} color="#101410" strokeWidth={3} />
                              ) : null}
                            </View>
                            <Text
                              style={[
                                styles.countyName,
                                selected && styles.countyNameSelected,
                              ]}
                            >
                              {county.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <Text style={styles.countyCount}>
                    {selectedCountyIds.length} county
                    {selectedCountyIds.length === 1 ? "" : "ies"} selected
                  </Text>

                  {countySaveError ? (
                    <Text style={styles.countyError}>{countySaveError}</Text>
                  ) : null}

                  {countySaveMessage ? (
                    <Text style={styles.countySuccess}>{countySaveMessage}</Text>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    disabled={savingCounties || countiesLoading || Boolean(countyLoadError)}
                    onPress={() => void savePropertyCounties()}
                    style={[
                      styles.primaryButton,
                      (savingCounties || countiesLoading || Boolean(countyLoadError)) &&
                        styles.buttonDisabled,
                    ]}
                  >
                    {savingCounties ? (
                      <ActivityIndicator color="#101410" />
                    ) : (
                      <Save size={17} color="#101410" />
                    )}
                    <Text style={styles.primaryText}>
                      {savingCounties ? "Saving counties..." : "Save county selections"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.savedCountyWrap}>
                  {application.propertyCounties?.length ? (
                    application.propertyCounties.map((county) => (
                      <View key={county.id} style={styles.savedCountyChip}>
                        <CheckCircle2 size={14} color="#D7FF5F" />
                        <Text style={styles.savedCountyText}>{county.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.muted}>
                      No property counties are recorded for this application.
                      Contact Makazii if you need to change them.
                    </Text>
                  )}
                  <Text style={styles.muted}>
                    County changes are locked for approved or rejected applications.
                    Contact Makazii for assistance.
                  </Text>
                </View>
              )}
            </View>

            {needsAction ? (
              <View style={styles.actionNotice}>
                <AlertCircle size={20} color="#FFC875" />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Your attention is needed</Text>
                  <Text style={styles.muted}>
                    Read the application review message above and follow the
                    instructions provided by Makazii. If no instructions are
                    shown, contact support for clarification.
                  </Text>
                </View>
              </View>
            ) : null}

            {isRejected ? (
              <View style={styles.actionNotice}>
                <AlertCircle size={20} color="#FF8C8C" />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Application not approved</Text>
                  <Text style={styles.muted}>
                    Check the review notes for the reason. Contact Makazii
                    if you need clarification about the decision or possible
                    next steps.
                  </Text>
                </View>
              </View>
            ) : null}

            {isApproved ? (
              <>
                <View style={styles.approvedNotice}>
                  <CheckCircle2 size={21} color="#D7FF5F" />
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>
                      Landlord application approved
                    </Text>
                    <Text style={styles.approvedText}>
                      You can continue to your landlord dashboard. Each
                      property you submit still needs its own review and
                      approval before it appears in the marketplace.
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  onPress={() =>
                    router.replace("/landlord/dashboard" as any)
                  }
                >
                  <Text style={styles.primaryText}>
                    Enter landlord dashboard
                  </Text>
                </Pressable>
              </>
            ) : null}

            <View style={styles.notice}>
              <Clock3 size={19} color="#FFC875" />
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>What happens next?</Text>
                <Text style={styles.muted}>
                  Your application and ID verification may have different
                  statuses. Check this page for updates. Once your landlord
                  application is approved, property submissions must still
                  be reviewed separately.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.metaTitle}>APPLICATION DETAILS</Text>

              {[
                ["Submitted", application.createdAt],
                ["Last updated", application.updatedAt],
                ["Reviewed", application.reviewedAt],
              ].map(([label, value]) => (
                <View key={label} style={styles.metaRow}>
                  <Text style={styles.muted}>{label}</Text>
                  <Text style={styles.metaValue}>{formatDate(value)}</Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              style={styles.secondaryButton}
              disabled={refreshing}
              onPress={() => void loadApplication(true)}
            >
              {refreshing ? (
                <ActivityIndicator color="#D7FF5F" />
              ) : (
                <RefreshCw size={17} color="#D7FF5F" />
              )}
              <Text style={styles.secondaryText}>Refresh status</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B0F10",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#252C2E",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },
  content: {
    padding: 20,
    paddingBottom: 45,
  },
  introIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: "#181E20",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 15,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },
  subtitle: {
    color: "#9CA5A7",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 23,
  },
  card: {
    backgroundColor: "#14191B",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#252C2E",
    marginBottom: 14,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#202820",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  muted: {
    color: "#9CA5A7",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#252C2E",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "900",
  },
  statusHeading: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 12,
  },
  messageBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0B0F10",
  },
  messageLabel: {
    color: "#9CA5A7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  message: {
    color: "#E3E8E8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  countyHelp: {
    color: "#9CA5A7",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 17,
    marginBottom: 12,
  },
  countyFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
  },
  countyList: {
    gap: 8,
  },
  countyOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252C2E",
    backgroundColor: "#0B0F10",
  },
  countyOptionSelected: {
    borderColor: "#667A38",
    backgroundColor: "#171F15",
  },
  countyCheckbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#566064",
    alignItems: "center",
    justifyContent: "center",
  },
  countyCheckboxSelected: {
    backgroundColor: "#D7FF5F",
    borderColor: "#D7FF5F",
  },
  countyName: {
    color: "#E3E8E8",
    fontSize: 13,
    flex: 1,
  },
  countyNameSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  countyCount: {
    color: "#9CA5A7",
    fontSize: 11,
    marginTop: 12,
  },
  countyError: {
    color: "#FF8C8C",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  countySuccess: {
    color: "#D7FF5F",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  countyRetryButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  savedCountyWrap: {
    gap: 9,
    marginTop: 16,
  },
  savedCountyChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3A4730",
    backgroundColor: "#171F15",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  savedCountyText: {
    color: "#E3E8E8",
    fontSize: 12,
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 15,
    backgroundColor: "#14191B",
    borderWidth: 1,
    borderColor: "#252C2E",
    borderRadius: 15,
    marginBottom: 14,
  },
  actionNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 15,
    backgroundColor: "#211C13",
    borderWidth: 1,
    borderColor: "#59452B",
    borderRadius: 15,
    marginBottom: 14,
  },
  approvedNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 15,
    backgroundColor: "#171F15",
    borderWidth: 1,
    borderColor: "#3A4730",
    borderRadius: 15,
    marginBottom: 14,
  },
  approvedText: {
    color: "#DCE7D3",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  metaTitle: {
    color: "#9CA5A7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 9,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  metaValue: {
    color: "#E8ECEC",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  secondaryButton: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#3A4730",
    borderRadius: 13,
    marginTop: 3,
  },
  secondaryText: {
    color: "#D7FF5F",
    fontSize: 13,
    fontWeight: "800",
  },
  feedback: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 13,
  },
  errorHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 5,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#D7FF5F",
    marginTop: 18,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: "#101410",
    fontSize: 14,
    fontWeight: "900",
  },
});