import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  Users,
  X,
} from "lucide-react-native";

const COLORS = {
  background: "#0B0F10",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  white: "#FFFFFF",
  muted: "#9CA5A7",
  border: "#252C2E",
  orange: "#F5B94C",
  red: "#FF6B6B",
  green: "#72D572",
  blue: "#65B8FF",
};

type ViewingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_ASSIGNMENT"
  | "ASSIGNED"
  | "APPROVED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED"
  | "CONFIRMED";

type BackendImage = {
  id: string;
  url: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

type GeographyItem = {
  id: string;
  name: string;
};

type BackendProperty = {
  id: string;
  title: string;
  description?: string | null;

  purpose?: "LONG_STAY" | "SHORT_STAY" | string | null;

  longStayType?: string | null;
  shortStayType?: string | null;
  stayMode?: string | null;
  furnishing?: string | null;

  status?: string | null;
  available?: boolean;
  verified?: boolean;

  monthlyRent?: number | string | null;
  deposit?: number | string | null;
  viewingFee?: number | string | null;
  serviceCharge?: number | string | null;

  dayRate?: number | string | null;
  nightRate?: number | string | null;
  dayNightRate?: number | string | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  maxGuests?: number | null;
  rooms?: number | null;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  countyRelation?: GeographyItem | null;
  constituency?: GeographyItem | null;
  ward?: GeographyItem | null;
  place?: GeographyItem | null;

  images?: BackendImage[];
};

type BackendViewing = {
  id: string;

  propertyId: string;
  renterId: string;

  requestedDate: string | null;
  preferredTime: string | null;
  scheduledAt: string | null;

  notes: string | null;

  status: ViewingStatus | string;

  requestedBy?: string;

  assignedMarketerId?: string | null;
  assignedAt?: string | null;

  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;

  createdAt?: string;
  updatedAt?: string;

  renter?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };

  property?: BackendProperty;

  statusHistory?: {
    id: string;
    status?: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    createdAt: string;
  }[];
};

type FilterKey =
  | "all"
  | "assigned"
  | "approved"
  | "rescheduled"
  | "completed";

type ActionType =
  | "confirm"
  | "reschedule"
  | "complete"
  | null;

const MARKETER_TOKEN_KEY = "makazii_marketer_token";

function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

async function getMarketerToken(): Promise<string | null> {
  try {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.localStorage
    ) {
      return (
        window.localStorage.getItem(
          MARKETER_TOKEN_KEY,
        ) || null
      );
    }

    return await SecureStore.getItemAsync(
      MARKETER_TOKEN_KEY,
    );
  } catch (error) {
    console.error(
      "Unable to read marketer token:",
      error,
    );

    return null;
  }
}

function normalizeStatus(status?: string | null) {
  return (status ?? "").toUpperCase();
}

function getStatusLabel(status?: string | null) {
  switch (normalizeStatus(status)) {
    case "PENDING_PAYMENT":
      return "Payment Pending";

    case "PAID":
      return "Paid";

    case "AWAITING_ASSIGNMENT":
      return "Awaiting Assignment";

    case "ASSIGNED":
      return "Assigned";

    case "APPROVED":
      return "Approved";

    case "RESCHEDULED":
      return "Rescheduled";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    case "DECLINED":
      return "Declined";

    case "CONFIRMED":
      return "Confirmed";

    default:
      return (
        status ??
        "Unknown"
      )
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        );
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Date not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(
  value?: number | string | null,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return `KES ${amount.toLocaleString("en-KE")}`;
}

function getPropertyType(
  property?: BackendProperty,
) {
  if (!property) {
    return "Property";
  }

  if (property.purpose === "SHORT_STAY") {
    return (
      property.shortStayType
        ?.replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        ) ?? "Short Stay"
    );
  }

  return (
    property.longStayType
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      ) ?? "Long Stay"
  );
}

function getLocation(
  property?: BackendProperty,
) {
  if (!property) {
    return "MAKAZII property";
  }

  const parts = [
    property.area,
    property.town,
    property.ward?.name,
    property.countyRelation?.name ??
      property.county,
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : "Location not provided";
}

function getCustomerName(
  viewing: BackendViewing,
) {
  const first =
    viewing.renter?.firstName?.trim() ?? "";

  const last =
    viewing.renter?.lastName?.trim() ?? "";

  const fullName =
    `${first} ${last}`.trim();

  return fullName || "MAKAZII customer";
}

function getStatusConfig(status?: string | null) {
  switch (normalizeStatus(status)) {
    case "ASSIGNED":
      return {
        color: COLORS.orange,
        background:
          "rgba(245, 185, 76, 0.12)",
        icon: UserRound,
      };

    case "APPROVED":
      return {
        color: COLORS.green,
        background:
          "rgba(114, 213, 114, 0.12)",
        icon: CheckCircle2,
      };

    case "RESCHEDULED":
      return {
        color: COLORS.lime,
        background:
          "rgba(215, 255, 95, 0.12)",
        icon: Clock3,
      };

    case "COMPLETED":
      return {
        color: COLORS.blue,
        background:
          "rgba(101, 184, 255, 0.12)",
        icon: CheckCircle2,
      };

    case "PAID":
    case "AWAITING_ASSIGNMENT":
      return {
        color: COLORS.orange,
        background:
          "rgba(245, 185, 76, 0.12)",
        icon: Clock3,
      };

    case "CANCELLED":
    case "DECLINED":
      return {
        color: COLORS.red,
        background:
          "rgba(255, 107, 107, 0.12)",
        icon: Clock3,
      };

    default:
      return {
        color: COLORS.muted,
        background:
          "rgba(156, 165, 167, 0.10)",
        icon: Clock3,
      };
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateInputValue(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(date);

  const year =
    parts.find(
      (part) => part.type === "year",
    )?.value ?? "";

  const month =
    parts.find(
      (part) => part.type === "month",
    )?.value ?? "";

  const day =
    parts.find(
      (part) => part.type === "day",
    )?.value ?? "";

  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function parsePreferredTime(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const normalized = value
    .trim()
    .toUpperCase();

  const match = normalized.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/,
  );

  if (!match) {
    return "";
  }

  let hour = Number(match[1]);
  const minute = Number(
    match[2] ?? "00",
  );

  const meridiem = match[3];

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    minute > 59
  ) {
    return "";
  }

  if (meridiem === "AM") {
    if (hour === 12) {
      hour = 0;
    }
  } else if (meridiem === "PM") {
    if (hour !== 12) {
      hour += 12;
    }
  }

  if (hour > 23) {
    return "";
  }

  return `${pad(hour)}:${pad(minute)}`;
}

function getTimeInputValue(
  viewing: BackendViewing,
) {
  if (viewing.scheduledAt) {
    const date = new Date(
      viewing.scheduledAt,
    );

    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Africa/Nairobi",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
      ).formatToParts(date);

      const hour =
        parts.find(
          (part) => part.type === "hour",
        )?.value ?? "";

      const minute =
        parts.find(
          (part) => part.type === "minute",
        )?.value ?? "";

      if (hour && minute) {
        return `${hour}:${minute}`;
      }
    }
  }

  return parsePreferredTime(
    viewing.preferredTime,
  );
}

function createKenyaIso(
  dateValue: string,
  timeValue: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateValue,
    )
  ) {
    throw new Error(
      "Enter the date in YYYY-MM-DD format.",
    );
  }

  if (
    !/^\d{2}:\d{2}$/.test(
      timeValue,
    )
  ) {
    throw new Error(
      "Enter the time in HH:MM format.",
    );
  }

  const [year, month, day] =
    dateValue.split("-").map(Number);

  const [hour, minute] =
    timeValue.split(":").map(Number);

  const localDate = new Date(
    `${dateValue}T${timeValue}:00+03:00`,
  );

  if (
    Number.isNaN(
      localDate.getTime(),
    )
  ) {
    throw new Error(
      "The selected date or time is invalid.",
    );
  }

  if (
    year < 2020 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(
      "The selected date or time is invalid.",
    );
  }

  if (
    localDate.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "The appointment must be scheduled for a future date and time.",
    );
  }

  return localDate.toISOString();
}

export default function MarketerViewingsScreen() {
  const router = useRouter();

  const [viewings, setViewings] =
    useState<BackendViewing[]>([]);

  const [filter, setFilter] =
    useState<FilterKey>("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [actionType, setActionType] =
    useState<ActionType>(null);

  const [actionViewingId, setActionViewingId] =
    useState<string | null>(null);

  const [scheduleModalVisible, setScheduleModalVisible] =
    useState(false);

  const [scheduleMode, setScheduleMode] =
    useState<"confirm" | "reschedule">(
      "confirm",
    );

  const [selectedViewing, setSelectedViewing] =
    useState<BackendViewing | null>(null);

  const [scheduleDate, setScheduleDate] =
    useState("");

  const [scheduleTime, setScheduleTime] =
    useState("");

  const [scheduleError, setScheduleError] =
    useState<string | null>(null);

  const loadViewings = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError(null);

        const token =
          await getMarketerToken();

        if (!token) {
          throw new Error(
            "MARKETER_AUTH_REQUIRED",
          );
        }

        const response = await fetch(
          `${getApiBaseUrl()}/marketer/viewings`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Unable to load viewing requests.",
          );
        }

        const backendViewings =
          Array.isArray(
            result.data?.viewings,
          )
            ? result.data.viewings
            : [];

        setViewings(
          backendViewings as BackendViewing[],
        );
      } catch (requestError) {
        console.error(
          "Load marketer viewings error:",
          requestError,
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load viewing requests.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadViewings();
  }, [loadViewings]);

  const counts = useMemo(() => {
    return {
      assigned: viewings.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "ASSIGNED",
      ).length,

      approved: viewings.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "APPROVED",
      ).length,

      rescheduled: viewings.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "RESCHEDULED",
      ).length,

      completed: viewings.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "COMPLETED",
      ).length,
    };
  }, [viewings]);

  const filteredViewings = useMemo(() => {
    if (filter === "all") {
      return viewings;
    }

    const statusMap: Record<
      Exclude<FilterKey, "all">,
      string
    > = {
      assigned: "ASSIGNED",
      approved: "APPROVED",
      rescheduled: "RESCHEDULED",
      completed: "COMPLETED",
    };

    return viewings.filter(
      (item) =>
        normalizeStatus(item.status) ===
        statusMap[filter],
    );
  }, [filter, viewings]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadViewings(false);
  };

  const handleCallCustomer = async (
    phone?: string | null,
  ) => {
    if (!phone) {
      Alert.alert(
        "No phone number",
        "This customer does not have a phone number available.",
      );
      return;
    }

    try {
      await Linking.openURL(
        `tel:${phone}`,
      );
    } catch (callError) {
      console.error(
        "Unable to open phone dialer:",
        callError,
      );

      Alert.alert(
        "Unable to call",
        "Your device could not open the phone dialer.",
      );
    }
  };

  const openScheduleModal = (
    viewing: BackendViewing,
    mode: "confirm" | "reschedule",
  ) => {
    setSelectedViewing(viewing);
    setScheduleMode(mode);

    setScheduleDate(
      getDateInputValue(
        viewing.scheduledAt ??
          viewing.requestedDate,
      ),
    );

    setScheduleTime(
      getTimeInputValue(viewing),
    );

    setScheduleError(null);
    setScheduleModalVisible(true);
  };

  const closeScheduleModal = () => {
    if (actionType) {
      return;
    }

    setScheduleModalVisible(false);
    setSelectedViewing(null);
    setScheduleError(null);
  };

  const submitScheduleAction =
    async () => {
      if (!selectedViewing) {
        return;
      }

      try {
        setScheduleError(null);

        const scheduledAt =
          createKenyaIso(
            scheduleDate.trim(),
            scheduleTime.trim(),
          );

        const token =
          await getMarketerToken();

        if (!token) {
          throw new Error(
            "MARKETER_AUTH_REQUIRED",
          );
        }

        setActionType(scheduleMode);
        setActionViewingId(
          selectedViewing.id,
        );

        const endpoint =
          scheduleMode === "confirm"
            ? `/marketer/viewings/${selectedViewing.id}/confirm`
            : `/marketer/viewings/${selectedViewing.id}/reschedule`;

        const response = await fetch(
          `${getApiBaseUrl()}${endpoint}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              scheduledAt,
            }),
          },
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Unable to update the viewing.",
          );
        }

        setScheduleModalVisible(false);
        setSelectedViewing(null);

        Alert.alert(
          scheduleMode === "confirm"
            ? "Viewing approved"
            : "Viewing rescheduled",
          scheduleMode === "confirm"
            ? "The customer has been notified of the approved appointment."
            : "The customer has been notified of the new appointment time.",
        );

        await loadViewings(false);
      } catch (requestError) {
        console.error(
          "Schedule viewing action error:",
          requestError,
        );

        setScheduleError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to update the viewing.",
        );
      } finally {
        setActionType(null);
        setActionViewingId(null);
      }
    };

  const handleCompleteViewing = (
    viewing: BackendViewing,
  ) => {
    Alert.alert(
      "Complete viewing",
      "Only mark this viewing as completed after the physical viewing has actually taken place.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark Completed",
          onPress: async () => {
            try {
              const token =
                await getMarketerToken();

              if (!token) {
                throw new Error(
                  "MARKETER_AUTH_REQUIRED",
                );
              }

              setActionType("complete");
              setActionViewingId(
                viewing.id,
              );

              const response =
                await fetch(
                  `${getApiBaseUrl()}/marketer/viewings/${viewing.id}/complete`,
                  {
                    method: "POST",
                    headers: {
                      Accept:
                        "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );

              const result =
                await response.json();

              if (
                !response.ok ||
                !result.success
              ) {
                throw new Error(
                  result.message ??
                    "Unable to complete the viewing.",
                );
              }

              Alert.alert(
                "Viewing completed",
                "The viewing has been marked as completed.",
              );

              await loadViewings(false);
            } catch (requestError) {
              console.error(
                "Complete viewing error:",
                requestError,
              );

              Alert.alert(
                "Unable to complete",
                requestError instanceof
                  Error
                  ? requestError.message
                  : "Unable to complete the viewing.",
              );
            } finally {
              setActionType(null);
              setActionViewingId(null);
            }
          },
        },
      ],
    );
  };

  const renderFilter = (
    key: FilterKey,
    label: string,
    count: number,
  ) => {
    const active = filter === key;

    return (
      <Pressable
        key={key}
        onPress={() => setFilter(key)}
        style={({ pressed }) => [
          styles.filterChip,
          active &&
            styles.filterChipActive,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.filterText,
            active &&
              styles.filterTextActive,
          ]}
        >
          {label}
        </Text>

        <View
          style={[
            styles.filterCount,
            active &&
              styles.filterCountActive,
          ]}
        >
          <Text
            style={[
              styles.filterCountText,
              active &&
                styles.filterCountTextActive,
            ]}
          >
            {count}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderPropertyDetails = (
    property?: BackendProperty,
  ): string[] => {
    if (!property) {
      return [];
    }

    const details: string[] = [];

    if (
      property.bedrooms !== null &&
      property.bedrooms !== undefined
    ) {
      details.push(
        `${property.bedrooms} bedroom${
          property.bedrooms === 1
            ? ""
            : "s"
        }`,
      );
    }

    if (
      property.bathrooms !== null &&
      property.bathrooms !== undefined
    ) {
      details.push(
        `${property.bathrooms} bath${
          property.bathrooms === 1
            ? ""
            : "s"
        }`,
      );
    }

    if (
      property.beds !== null &&
      property.beds !== undefined
    ) {
      details.push(
        `${property.beds} bed${
          property.beds === 1
            ? ""
            : "s"
        }`,
      );
    }

    if (
      property.purpose ===
        "SHORT_STAY" &&
      property.rooms !== null &&
      property.rooms !== undefined
    ) {
      details.push(
        `${property.rooms} room${
          property.rooms === 1
            ? ""
            : "s"
        }`,
      );
    }

    if (
      property.purpose ===
        "SHORT_STAY" &&
      property.maxGuests !== null &&
      property.maxGuests !== undefined
    ) {
      details.push(
        `${property.maxGuests} guest${
          property.maxGuests === 1
            ? ""
            : "s"
        }`,
      );
    }

    return details;
  };

  const getPrimaryImage = (
    property?: BackendProperty,
  ) => {
    if (
      !property?.images ||
      property.images.length === 0
    ) {
      return null;
    }

    const primary =
      property.images.find(
        (image) => image.isPrimary,
      );

    return (
      primary?.url ??
      property.images[0]?.url ??
      null
    );
  };

  const canShowCustomerContact = (
    viewing: BackendViewing,
  ) => {
    const status =
      normalizeStatus(
        viewing.status,
      );

    return [
      "ASSIGNED",
      "APPROVED",
      "RESCHEDULED",
      "COMPLETED",
      "CONFIRMED",
    ].includes(status);
  };

  const renderActionButton = (
    viewing: BackendViewing,
  ) => {
    const status =
      normalizeStatus(
        viewing.status,
      );

    const busy =
      actionViewingId ===
      viewing.id;

    if (status === "ASSIGNED") {
      return (
        <View style={styles.actionsArea}>
          <Pressable
            onPress={() =>
              openScheduleModal(
                viewing,
                "confirm",
              )
            }
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                styles.buttonPressed,
              busy &&
                styles.buttonDisabled,
            ]}
          >
            {busy &&
            actionType === "confirm" ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.background
                }
              />
            ) : (
              <Check
                size={17}
                color={
                  COLORS.background
                }
                strokeWidth={2.5}
              />
            )}

            <Text
              style={
                styles.primaryButtonText
              }
            >
              Approve Appointment
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              openScheduleModal(
                viewing,
                "reschedule",
              )
            }
            disabled={busy}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed &&
                styles.buttonPressed,
              busy &&
                styles.buttonDisabled,
            ]}
          >
            <RefreshCw
              size={17}
              color={COLORS.white}
              strokeWidth={2}
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Reschedule
            </Text>
          </Pressable>
        </View>
      );
    }

    if (
      status === "APPROVED" ||
      status === "RESCHEDULED"
    ) {
      return (
        <View style={styles.actionsArea}>
          <Pressable
            onPress={() =>
              handleCompleteViewing(
                viewing,
              )
            }
            disabled={busy}
            style={({ pressed }) => [
              styles.completeButton,
              pressed &&
                styles.buttonPressed,
              busy &&
                styles.buttonDisabled,
            ]}
          >
            {busy &&
            actionType === "complete" ? (
              <ActivityIndicator
                size="small"
                color={COLORS.background}
              />
            ) : (
              <CheckCircle2
                size={18}
                color={
                  COLORS.background
                }
                strokeWidth={2.3}
              />
            )}

            <Text
              style={
                styles.completeButtonText
              }
            >
              Mark Viewing Completed
            </Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  const renderViewingCard = (
    viewing: BackendViewing,
  ) => {
    const status =
      normalizeStatus(
        viewing.status,
      );

    const statusConfig =
      getStatusConfig(
        viewing.status,
      );

    const StatusIcon =
      statusConfig.icon;

    const property =
      viewing.property;

    const propertyDetails =
      renderPropertyDetails(
        property,
      );

    const imageUrl =
      getPrimaryImage(property);

    const scheduled =
      viewing.scheduledAt;

    const requested =
      viewing.requestedDate;

    const isAssigned =
      status === "ASSIGNED";

    const isApproved =
      status === "APPROVED";

    const isRescheduled =
      status === "RESCHEDULED";

    const isCompleted =
      status === "COMPLETED";

    const isActionBusy =
      actionViewingId ===
      viewing.id;

    return (
      <View
        key={viewing.id}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusConfig.background,
              },
            ]}
          >
            <StatusIcon
              size={14}
              color={statusConfig.color}
              strokeWidth={2}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusConfig.color,
                },
              ]}
            >
              {getStatusLabel(
                viewing.status,
              )}
            </Text>
          </View>

          {viewing.createdAt ? (
            <Text style={styles.createdText}>
              {formatDate(
                viewing.createdAt,
              )}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            if (property?.id) {
              router.push(
                `/marketer/properties/${property.id}`,
              );
            }
          }}
          disabled={!property?.id}
          style={({ pressed }) => [
            styles.propertyHeader,
            pressed &&
              property?.id &&
              styles.propertyPressed,
          ]}
        >
          <View
            style={styles.propertyImage}
          >
            {imageUrl ? (
              <View
                style={
                  styles.imagePlaceholder
                }
              >
                <Home
                  size={22}
                  color={COLORS.muted}
                />
              </View>
            ) : (
              <Home
                size={22}
                color={COLORS.muted}
              />
            )}
          </View>

          <View
            style={
              styles.propertyHeaderText
            }
          >
            <Text
              style={styles.propertyTitle}
              numberOfLines={2}
            >
              {property?.title ??
                "MAKAZII property"}
            </Text>

            <Text
              style={styles.propertyType}
            >
              {getPropertyType(
                property,
              )}
            </Text>
          </View>
        </Pressable>

        <View style={styles.locationRow}>
          <MapPin
            size={15}
            color={COLORS.muted}
          />

          <Text
            style={styles.locationText}
            numberOfLines={2}
          >
            {getLocation(property)}
          </Text>
        </View>

        {propertyDetails.length >
        0 ? (
          <View
            style={styles.detailsRow}
          >
            {propertyDetails.map(
              (detail, index) => {
                const lower =
                  detail.toLowerCase();

                const Icon =
                  lower.includes(
                    "bath",
                  )
                    ? Bath
                    : lower.includes(
                          "guest",
                        ) ||
                        lower.includes(
                          "room",
                        )
                      ? Users
                      : BedDouble;

                return (
                  <View
                    key={`${detail}-${index}`}
                    style={
                      styles.detailItem
                    }
                  >
                    <Icon
                      size={14}
                      color={
                        COLORS.muted
                      }
                    />

                    <Text
                      style={
                        styles.detailText
                      }
                    >
                      {detail}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        ) : null}

        <View
          style={styles.divider}
        />

        <View style={styles.customerSection}>
          <View
            style={styles.sectionHeader}
          >
            <View
              style={
                styles.sectionTitleWrap
              }
            >
              <UserRound
                size={16}
                color={COLORS.lime}
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Customer
              </Text>
            </View>
          </View>

          <Text
            style={styles.customerName}
          >
            {getCustomerName(
              viewing,
            )}
          </Text>

          {canShowCustomerContact(
            viewing,
          ) ? (
            <View
              style={styles.contactArea}
            >
              {viewing.renter
                ?.phone ? (
                <Pressable
                  onPress={() =>
                    handleCallCustomer(
                      viewing.renter
                        ?.phone,
                    )
                  }
                  style={styles.phoneButton}
                >
                  <Phone
                    size={16}
                    color={
                      COLORS.background
                    }
                  />

                  <Text
                    style={
                      styles.phoneButtonText
                    }
                  >
                    {viewing.renter.phone}
                  </Text>
                </Pressable>
              ) : (
                <Text
                  style={
                    styles.noContactText
                  }
                >
                  No phone number available
                </Text>
              )}

              {viewing.renter
                ?.email ? (
                <Text
                  style={
                    styles.emailText
                  }
                >
                  {viewing.renter.email}
                </Text>
              ) : null}
            </View>
          ) : (
            <View
              style={
                styles.contactLocked
              }
            >
              <Text
                style={
                  styles.contactLockedText
                }
              >
                Customer contact becomes available after admin assigns this viewing.
              </Text>
            </View>
          )}
        </View>

        <View
          style={styles.divider}
        />

        <View style={styles.scheduleSection}>
          <View
            style={styles.sectionHeader}
          >
            <View
              style={
                styles.sectionTitleWrap
              }
            >
              <CalendarDays
                size={16}
                color={COLORS.lime}
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Appointment
              </Text>
            </View>
          </View>

          {scheduled ? (
            <View
              style={
                styles.appointmentBox
              }
            >
              <Text
                style={
                  styles.appointmentLabel
                }
              >
                Scheduled time
              </Text>

              <Text
                style={
                  styles.appointmentTime
                }
              >
                {formatDateTime(
                  scheduled,
                )}
              </Text>
            </View>
          ) : requested ? (
            <View
              style={
                styles.appointmentBox
              }
            >
              <Text
                style={
                  styles.appointmentLabel
                }
              >
                Customer requested
              </Text>

              <Text
                style={
                  styles.appointmentTime
                }
              >
                {formatDate(
                  requested,
                )}
              </Text>

              {viewing.preferredTime ? (
                <Text
                  style={
                    styles.appointmentSubtext
                  }
                >
                  Preferred time:{" "}
                  {
                    viewing.preferredTime
                  }
                </Text>
              ) : null}
            </View>
          ) : (
            <Text
              style={
                styles.noScheduleText
              }
            >
              No appointment time has been set.
            </Text>
          )}
        </View>

        {viewing.notes ? (
          <>
            <View
              style={styles.divider}
            />

            <View
              style={styles.notesSection}
            >
              <Text
                style={
                  styles.notesLabel
                }
              >
                Customer note
              </Text>

              <Text
                style={styles.notesText}
              >
                {viewing.notes}
              </Text>
            </View>
          </>
        ) : null}

        {isAssigned ? (
          <View
            style={styles.infoBanner}
          >
            <Clock3
              size={17}
              color={COLORS.orange}
            />

            <Text
              style={styles.infoBannerText}
            >
              Admin has assigned this paid viewing to you. Approve the requested time or choose a new time.
            </Text>
          </View>
        ) : null}

        {isApproved ? (
          <View
            style={[
              styles.infoBanner,
              styles.approvedBanner,
            ]}
          >
            <CheckCircle2
              size={17}
              color={COLORS.green}
            />

            <Text
              style={
                styles.infoBannerText
              }
            >
              Appointment approved. Mark the viewing completed only after you meet the customer.
            </Text>
          </View>
        ) : null}

        {isRescheduled ? (
          <View
            style={[
              styles.infoBanner,
              styles.rescheduledBanner,
            ]}
          >
            <RefreshCw
              size={17}
              color={COLORS.lime}
            />

            <Text
              style={
                styles.infoBannerText
              }
            >
              A new appointment time has been scheduled. Mark it completed after the physical viewing.
            </Text>
          </View>
        ) : null}

        {isCompleted ? (
          <View
            style={[
              styles.infoBanner,
              styles.completedBanner,
            ]}
          >
            <CheckCircle2
              size={17}
              color={COLORS.blue}
            />

            <Text
              style={
                styles.infoBannerText
              }
            >
              This viewing was completed
              {viewing.completedAt
                ? ` on ${formatDateTime(
                    viewing.completedAt,
                  )}.`
                : "."}
            </Text>
          </View>
        ) : null}

        {renderActionButton(
          viewing,
        )}

        {isActionBusy &&
        actionType ? (
          <View
            style={styles.actionProgress}
          >
            <ActivityIndicator
              size="small"
              color={COLORS.lime}
            />

            <Text
              style={
                styles.actionProgressText
              }
            >
              Updating viewing...
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={styles.loadingScreen}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.lime}
        />

        <Text
          style={styles.loadingText}
        >
          Loading your viewings...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.lime}
          />
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={styles.header}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <ArrowLeft
              size={21}
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
              Viewings
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Manage appointments assigned to you.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              loadViewings()
            }
            style={({ pressed }) => [
              styles.refreshButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <RefreshCw
              size={19}
              color={COLORS.lime}
            />
          </Pressable>
        </View>

        <View
          style={styles.summaryCard}
        >
          <View
            style={styles.summaryMain}
          >
            <Text
              style={
                styles.summaryNumber
              }
            >
              {viewings.length}
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Total assigned viewings
            </Text>
          </View>

          <View
            style={styles.summaryStats}
          >
            <View
              style={styles.summaryStat}
            >
              <Text
                style={
                  styles.summaryStatNumber
                }
              >
                {counts.assigned}
              </Text>

              <Text
                style={
                  styles.summaryStatLabel
                }
              >
                Action
              </Text>
            </View>

            <View
              style={styles.summaryDivider}
            />

            <View
              style={styles.summaryStat}
            >
              <Text
                style={
                  styles.summaryStatNumber
                }
              >
                {counts.approved +
                  counts.rescheduled}
              </Text>

              <Text
                style={
                  styles.summaryStatLabel
                }
              >
                Upcoming
              </Text>
            </View>

            <View
              style={styles.summaryDivider}
            />

            <View
              style={styles.summaryStat}
            >
              <Text
                style={
                  styles.summaryStatNumber
                }
              >
                {counts.completed}
              </Text>

              <Text
                style={
                  styles.summaryStatLabel
                }
              >
                Done
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filters
          }
        >
          {renderFilter(
            "all",
            "All",
            viewings.length,
          )}

          {renderFilter(
            "assigned",
            "Action Required",
            counts.assigned,
          )}

          {renderFilter(
            "approved",
            "Approved",
            counts.approved,
          )}

          {renderFilter(
            "rescheduled",
            "Rescheduled",
            counts.rescheduled,
          )}

          {renderFilter(
            "completed",
            "Completed",
            counts.completed,
          )}
        </ScrollView>

        {error ? (
          <View
            style={styles.errorCard}
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to load viewings
            </Text>

            <Text
              style={styles.errorText}
            >
              {error ===
              "MARKETER_AUTH_REQUIRED"
                ? "Your marketer session has expired. Please sign in again."
                : error}
            </Text>

            <Pressable
              onPress={() =>
                loadViewings()
              }
              style={
                styles.retryButton
              }
            >
              <RefreshCw
                size={16}
                color={
                  COLORS.background
                }
              />

              <Text
                style={
                  styles.retryButtonText
                }
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!error &&
        filteredViewings.length ===
          0 ? (
          <View
            style={styles.emptyState}
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <CalendarDays
                size={28}
                color={COLORS.lime}
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No viewings here
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {filter === "all"
                ? "You do not have any assigned viewing appointments yet."
                : "There are no viewings matching this filter."}
            </Text>
          </View>
        ) : (
          <View
            style={styles.list}
          >
            {filteredViewings.map(
              renderViewingCard,
            )}
          </View>
        )}

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>

      {scheduleModalVisible ? (
        <View
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeScheduleModal}
          />

          <View
            style={styles.modalCard}
          >
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={
                    styles.modalEyebrow
                  }
                >
                  {scheduleMode ===
                  "confirm"
                    ? "APPROVE APPOINTMENT"
                    : "RESCHEDULE APPOINTMENT"}
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Choose appointment time
                </Text>
              </View>

              <Pressable
                onPress={
                  closeScheduleModal
                }
                disabled={
                  !!actionType
                }
                style={
                  styles.modalClose
                }
              >
                <X
                  size={20}
                  color={
                    COLORS.white
                  }
                />
              </Pressable>
            </View>

            {selectedViewing ? (
              <View
                style={
                  styles.modalCustomer
                }
              >
                <UserRound
                  size={17}
                  color={COLORS.lime}
                />

                <View
                  style={
                    styles.modalCustomerText
                  }
                >
                  <Text
                    style={
                      styles.modalCustomerName
                    }
                  >
                    {getCustomerName(
                      selectedViewing,
                    )}
                  </Text>

                  <Text
                    style={
                      styles.modalPropertyName
                    }
                  >
                    {selectedViewing
                      .property
                      ?.title ??
                      "MAKAZII property"}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text
              style={
                styles.fieldLabel
              }
            >
              Appointment date
            </Text>

            <TextInput
              value={scheduleDate}
              onChangeText={
                setScheduleDate
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={
                COLORS.muted
              }
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputHint
              }
            >
              Example: 2026-10-12
            </Text>

            <Text
              style={[
                styles.fieldLabel,
                styles.timeLabel,
              ]}
            >
              Appointment time
            </Text>

            <TextInput
              value={scheduleTime}
              onChangeText={
                setScheduleTime
              }
              placeholder="HH:MM"
              placeholderTextColor={
                COLORS.muted
              }
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              style={
                styles.input
              }
            />

            <Text
              style={
                styles.inputHint
              }
            >
              Use Kenya time, for example 10:30 or 14:00.
            </Text>

            {scheduleError ? (
              <View
                style={
                  styles.modalError
                }
              >
                <Text
                  style={
                    styles.modalErrorText
                  }
                >
                  {scheduleError}
                </Text>
              </View>
            ) : null}

            <View
              style={styles.modalActions}
            >
              <Pressable
                onPress={
                  closeScheduleModal
                }
                disabled={
                  !!actionType
                }
                style={
                  styles.modalCancelButton
                }
              >
                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  submitScheduleAction
                }
                disabled={
                  !!actionType
                }
                style={({ pressed }) => [
                  styles.modalSubmitButton,
                  pressed &&
                    styles.buttonPressed,
                  !!actionType &&
                    styles.buttonDisabled,
                ]}
              >
                {actionType ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.background
                    }
                  />
                ) : scheduleMode ===
                  "confirm" ? (
                  <Check
                    size={18}
                    color={
                      COLORS.background
                    }
                  />
                ) : (
                  <RefreshCw
                    size={18}
                    color={
                      COLORS.background
                    }
                  />
                )}

                <Text
                  style={
                    styles.modalSubmitText
                  }
                >
                  {scheduleMode ===
                  "confirm"
                    ? "Approve"
                    : "Reschedule"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 3,
  },

  title: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pressed: {
    opacity: 0.72,
  },

  summaryCard: {
    backgroundColor:
      COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 15,
  },

  summaryMain: {
    marginBottom: 17,
  },

  summaryNumber: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "800",
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 1,
  },

  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryStat: {
    flex: 1,
    alignItems: "center",
  },

  summaryStatNumber: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  summaryStatLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  summaryDivider: {
    width: 1,
    height: 27,
    backgroundColor:
      COLORS.border,
  },

  filters: {
    gap: 8,
    paddingBottom: 16,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  filterTextActive: {
    color: COLORS.background,
  },

  filterCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountActive: {
    backgroundColor:
      "rgba(11,15,16,0.14)",
  },

  filterCountText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },

  filterCountTextActive: {
    color: COLORS.background,
  },

  list: {
    gap: 0,
  },

  card: {
    backgroundColor:
      COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  createdText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  propertyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  propertyPressed: {
    opacity: 0.7,
  },

  propertyImage: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  propertyHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },

  propertyType: {
    color: COLORS.lime,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    gap: 7,
  },

  locationText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor:
      COLORS.cardSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  detailText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical: 16,
  },

  customerSection: {},

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  customerName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  contactArea: {
    marginTop: 9,
    gap: 7,
  },

  phoneButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor:
      COLORS.lime,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  phoneButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "800",
  },

  emailText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  noContactText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  contactLocked: {
    marginTop: 9,
    padding: 10,
    borderRadius: 12,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  contactLockedText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  scheduleSection: {},

  appointmentBox: {
    backgroundColor:
      COLORS.cardSoft,
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  appointmentLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },

  appointmentTime: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },

  appointmentSubtext: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  noScheduleText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  notesSection: {},

  notesLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 5,
  },

  notesText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor:
      "rgba(245,185,76,0.09)",
    borderWidth: 1,
    borderColor:
      "rgba(245,185,76,0.18)",
    borderRadius: 14,
    padding: 11,
    marginTop: 15,
  },

  approvedBanner: {
    backgroundColor:
      "rgba(114,213,114,0.08)",
    borderColor:
      "rgba(114,213,114,0.17)",
  },

  rescheduledBanner: {
    backgroundColor:
      "rgba(215,255,95,0.07)",
    borderColor:
      "rgba(215,255,95,0.15)",
  },

  completedBanner: {
    backgroundColor:
      "rgba(101,184,255,0.08)",
    borderColor:
      "rgba(101,184,255,0.17)",
  },

  infoBannerText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  actionsArea: {
    gap: 9,
    marginTop: 14,
  },

  primaryButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 15,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 15,
  },

  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  completeButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 15,
  },

  completeButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.78,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  actionProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 9,
  },

  actionProgressText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  errorCard: {
    backgroundColor:
      "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,107,107,0.18)",
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  retryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor:
      COLORS.lime,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: "800",
  },

  emptyState: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 25,
    paddingVertical: 38,
    alignItems: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor:
      "rgba(215,255,95,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
  },

  bottomSpace: {
    height: 80,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    zIndex: 100,
  },

  modalCard: {
    backgroundColor:
      COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    paddingBottom: 28,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    marginBottom: 17,
  },

  modalEyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalCustomer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.cardSoft,
    borderRadius: 14,
    padding: 11,
    marginBottom: 18,
  },

  modalCustomerText: {
    flex: 1,
    marginLeft: 9,
  },

  modalCustomerName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  modalPropertyName: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  fieldLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
  },

  timeLabel: {
    marginTop: 14,
  },

  input: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    color: COLORS.white,
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "600",
  },

  inputHint: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 5,
  },

  modalError: {
    backgroundColor:
      "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,107,107,0.18)",
    borderRadius: 12,
    padding: 10,
    marginTop: 13,
  },

  modalErrorText: {
    color: COLORS.red,
    fontSize: 10,
    lineHeight: 15,
  },

  modalActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 20,
  },

  modalCancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  modalSubmitButton: {
    flex: 1.3,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  modalSubmitText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "800",
  },
});