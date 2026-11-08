import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  AlertCircle,
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  FileEdit,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  Save,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react-native";

import { API_BASE_URL } from "@/config/api";

const COLORS = {
  background: "#0B0F10",
  card: "#14191B",
  cardSoft: "#181E20",
  lime: "#D7FF5F",
  white: "#FFFFFF",
  muted: "#9CA5A7",
  border: "#252C2E",
  green: "#65D98A",
  amber: "#F2C94C",
  red: "#FF7070",
  blue: "#72A7FF",
};

type PropertyStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "CHANGES_REQUIRED"
  | "ACTIVE"
  | "RENTED"
  | "INACTIVE"
  | "REJECTED";

type PropertyPurpose = "LONG_STAY" | "SHORT_STAY";

type LongStayType =
  | "SINGLE_ROOM"
  | "BEDSITTER"
  | "STUDIO"
  | "ONE_BEDROOM"
  | "TWO_BEDROOM"
  | "THREE_BEDROOM"
  | "FOUR_PLUS_BEDROOM"
  | "HOUSE"
  | "APARTMENT";

type ShortStayType =
  | "BNB"
  | "LODGE"
  | "GUEST_HOUSE"
  | "HOTEL_ROOM"
  | "SERVICED_APARTMENT"
  | "FURNISHED_APARTMENT"
  | "HOLIDAY_HOME"
  | "VILLA"
  | "COTTAGE"
  | "HOSTEL"
  | "PRIVATE_ROOM";

type StayMode =
  | "DAY"
  | "OVERNIGHT"
  | "DAY_AND_NIGHT"
  | "FLEXIBLE";

type FurnishingType =
  | "UNFURNISHED"
  | "SEMI_FURNISHED"
  | "FURNISHED";

type BackendImage = {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt?: string;
};

type GeographyItem = {
  id: string;
  name: string;
};

type BackendAmenity = {
  amenity?: {
    id: string;
    name: string;
  };
};

type BackendStatusHistory = {
  id: string;
  fromStatus?: PropertyStatus | null;
  toStatus?: PropertyStatus | null;
  status?: PropertyStatus | null;
  note?: string | null;
  createdAt: string;
};

type BackendProperty = {
  id: string;
  title: string;
  description?: string | null;

  purpose: PropertyPurpose;
  longStayType?: LongStayType | null;
  shortStayType?: ShortStayType | null;
  stayMode?: StayMode | null;
  furnishing?: FurnishingType | null;

  status: PropertyStatus;

  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
  inspectionFee?: number | null;
  serviceCharge?: number | null;

  dayRate?: number | null;
  nightRate?: number | null;
  dayNightRate?: number | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  rooms?: number | null;
  maxGuests?: number | null;

  countyId: string;
  constituencyId: string;
  wardId: string;

  placeId?: string | null;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  available: boolean;
  verified: boolean;
  verifiedAt?: string | null;

  images?: BackendImage[];

  amenities?: BackendAmenity[];

  countyRelation?: GeographyItem | null;
  constituency?: GeographyItem | null;
  ward?: GeographyItem | null;
  place?: GeographyItem | null;

  statusHistory?: BackendStatusHistory[];

  _count?: {
    viewingRequests?: number;
    shortlists?: number;
  };
};

type Amenity = {
  id: string;
  name: string;
};

type FormState = {
  title: string;
  description: string;

  purpose: PropertyPurpose;

  longStayType: LongStayType | "";
  shortStayType: ShortStayType | "";

  stayMode: StayMode | "";
  furnishing: FurnishingType | "";

  monthlyRent: string;
  deposit: string;
  viewingFee: string;
  inspectionFee: string;
  serviceCharge: string;

  dayRate: string;
  nightRate: string;
  dayNightRate: string;

  bedrooms: string;
  bathrooms: string;
  beds: string;
  rooms: string;
  maxGuests: string;

  countyId: string;
  constituencyId: string;
  wardId: string;

  amenityIds: string[];

  available: boolean;
};

type Coverage = {
  countyId: string;
  countyName: string;
  constituencyIds: string[];
  wardIds: string[];
};

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  amenities?: T;
};

const LONG_STAY_TYPES: {
  value: LongStayType;
  label: string;
}[] = [
  { value: "SINGLE_ROOM", label: "Single Room" },
  { value: "BEDSITTER", label: "Bedsitter" },
  { value: "STUDIO", label: "Studio" },
  { value: "ONE_BEDROOM", label: "One Bedroom" },
  { value: "TWO_BEDROOM", label: "Two Bedroom" },
  { value: "THREE_BEDROOM", label: "Three Bedroom" },
  { value: "FOUR_PLUS_BEDROOM", label: "Four Plus Bedroom" },
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
];

const SHORT_STAY_TYPES: {
  value: ShortStayType;
  label: string;
}[] = [
  { value: "BNB", label: "B&B" },
  { value: "LODGE", label: "Lodge" },
  { value: "GUEST_HOUSE", label: "Guest House" },
  { value: "HOTEL_ROOM", label: "Hotel Room" },
  {
    value: "SERVICED_APARTMENT",
    label: "Serviced Apartment",
  },
  {
    value: "FURNISHED_APARTMENT",
    label: "Furnished Apartment",
  },
  {
    value: "HOLIDAY_HOME",
    label: "Holiday Home",
  },
  { value: "VILLA", label: "Villa" },
  { value: "COTTAGE", label: "Cottage" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "PRIVATE_ROOM", label: "Private Room" },
];

const STAY_MODES: {
  value: StayMode;
  label: string;
}[] = [
  { value: "DAY", label: "Day Stay" },
  { value: "OVERNIGHT", label: "Overnight" },
  {
    value: "DAY_AND_NIGHT",
    label: "Day & Night",
  },
  { value: "FLEXIBLE", label: "Flexible" },
];

const FURNISHING_TYPES: {
  value: FurnishingType;
  label: string;
}[] = [
  {
    value: "UNFURNISHED",
    label: "Unfurnished",
  },
  {
    value: "SEMI_FURNISHED",
    label: "Semi Furnished",
  },
  {
    value: "FURNISHED",
    label: "Furnished",
  },
];

function getToken() {
  return SecureStore.getItemAsync("makazii_token");
}

async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = await getToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });
}

async function parseResponse(
  response: Response,
): Promise<ApiResult> {
  const text = await response.text();

  if (!text) {
    return {
      success: response.ok,
      message: response.statusText,
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message:
        text || "Unexpected server response.",
    };
  }
}

function normalizeMoneyInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function parseOptionalNumber(
  value: string,
): number | null {
  const normalized = normalizeMoneyInput(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function parseRequiredPositive(
  value: string,
): number | null {
  const parsed = parseOptionalNumber(value);

  if (parsed === null || parsed <= 0) {
    return null;
  }

  return parsed;
}

function formatMoney(
  value?: number | null,
) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return `KES ${Number(value).toLocaleString(
    "en-KE",
  )}`;
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

function labelFromEnum(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function propertyTypeLabel(
  property: BackendProperty,
) {
  if (property.purpose === "LONG_STAY") {
    return labelFromEnum(
      property.longStayType,
    );
  }

  return labelFromEnum(
    property.shortStayType,
  );
}

function purposeLabel(
  purpose: PropertyPurpose,
) {
  return purpose === "LONG_STAY"
    ? "Long Stay"
    : "Short Stay";
}

function stayModeLabel(
  stayMode?: StayMode | null,
) {
  return labelFromEnum(stayMode);
}

function statusLabel(
  status: PropertyStatus,
) {
  return labelFromEnum(status);
}

function statusColor(
  status: PropertyStatus,
) {
  switch (status) {
    case "ACTIVE":
      return COLORS.green;

    case "PENDING_VERIFICATION":
      return COLORS.amber;

    case "CHANGES_REQUIRED":
      return COLORS.blue;

    case "REJECTED":
    case "RENTED":
      return COLORS.red;

    case "DRAFT":
    case "INACTIVE":
    default:
      return COLORS.muted;
  }
}

function StatusIcon({
  status,
  size = 17,
}: {
  status: PropertyStatus;
  size?: number;
}) {
  if (status === "ACTIVE") {
    return (
      <CheckCircle2
        size={size}
        color={COLORS.green}
      />
    );
  }

  if (
    status === "REJECTED" ||
    status === "RENTED"
  ) {
    return (
      <XCircle
        size={size}
        color={COLORS.red}
      />
    );
  }

  if (
    status === "PENDING_VERIFICATION"
  ) {
    return (
      <Clock3
        size={size}
        color={COLORS.amber}
      />
    );
  }

  if (status === "CHANGES_REQUIRED") {
    return (
      <AlertCircle
        size={size}
        color={COLORS.blue}
      />
    );
  }

  return (
    <FileEdit
      size={size}
      color={COLORS.muted}
    />
  );
}

function buildForm(
  property: BackendProperty,
): FormState {
  return {
    title: property.title ?? "",
    description:
      property.description ?? "",

    purpose: property.purpose,

    longStayType:
      property.longStayType ?? "",

    shortStayType:
      property.shortStayType ?? "",

    stayMode:
      property.stayMode ?? "",

    furnishing:
      property.furnishing ?? "",

    monthlyRent:
      property.monthlyRent != null
        ? String(property.monthlyRent)
        : "",

    deposit:
      property.deposit != null
        ? String(property.deposit)
        : "",

    viewingFee:
      property.viewingFee != null
        ? String(property.viewingFee)
        : "",

    inspectionFee:
      property.inspectionFee != null
        ? String(property.inspectionFee)
        : "",

    serviceCharge:
      property.serviceCharge != null
        ? String(property.serviceCharge)
        : "",

    dayRate:
      property.dayRate != null
        ? String(property.dayRate)
        : "",

    nightRate:
      property.nightRate != null
        ? String(property.nightRate)
        : "",

    dayNightRate:
      property.dayNightRate != null
        ? String(property.dayNightRate)
        : "",

    bedrooms:
      property.bedrooms != null
        ? String(property.bedrooms)
        : "",

    bathrooms:
      property.bathrooms != null
        ? String(property.bathrooms)
        : "",

    beds:
      property.beds != null
        ? String(property.beds)
        : "",

    rooms:
      property.rooms != null
        ? String(property.rooms)
        : "",

    maxGuests:
      property.maxGuests != null
        ? String(property.maxGuests)
        : "",

    countyId:
      property.countyId ?? "",

    constituencyId:
      property.constituencyId ?? "",

    wardId:
      property.wardId ?? "",

    amenityIds:
      property.amenities
        ?.map((item) => item.amenity?.id)
        .filter(
          (id): id is string =>
            Boolean(id),
        ) ?? [],

    available:
      Boolean(property.available),
  };
}

function getLatestReviewNote(
  property: BackendProperty,
) {
  const history =
    property.statusHistory ?? [];

  const review = history.find(
    (item) =>
      Boolean(item.note) &&
      (
        item.toStatus ===
          "CHANGES_REQUIRED" ||
        item.toStatus === "REJECTED" ||
        item.status ===
          "CHANGES_REQUIRED" ||
        item.status === "REJECTED"
      ),
  );

  return review?.note ?? null;
}

function getPrimaryShortStayRate(
  property: BackendProperty,
) {
  switch (property.stayMode) {
    case "DAY":
      return {
        label: "PER DAY",
        value: property.dayRate,
      };

    case "OVERNIGHT":
      return {
        label: "PER NIGHT",
        value: property.nightRate,
      };

    case "DAY_AND_NIGHT":
      return {
        label: "DAY & NIGHT",
        value: property.dayNightRate,
      };

    case "FLEXIBLE":
      if (property.dayNightRate) {
        return {
          label: "DAY & NIGHT",
          value: property.dayNightRate,
        };
      }

      if (property.nightRate) {
        return {
          label: "PER NIGHT",
          value: property.nightRate,
        };
      }

      return {
        label: "PER DAY",
        value: property.dayRate,
      };

    default:
      return {
        label: "RATE",
        value:
          property.dayRate ??
          property.nightRate ??
          property.dayNightRate,
      };
  }
}

export default function MarketerPropertyDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const propertyId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [property, setProperty] =
    useState<BackendProperty | null>(
      null,
    );

  const [form, setForm] =
    useState<FormState | null>(null);

  const [amenities, setAmenities] =
    useState<Amenity[]>([]);

  const [counties, setCounties] =
    useState<GeographyItem[]>([]);

  const [, setConstituencies] =
    useState<GeographyItem[]>([]);

  const [wards, setWards] =
    useState<GeographyItem[]>([]);

  const [coverage, setCoverage] =
    useState<Coverage | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    updatingAvailability,
    setUpdatingAvailability,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [fieldError, setFieldError] =
    useState<string | null>(null);

  const [editMode, setEditMode] =
    useState(false);

  const [
    showPurposeModal,
    setShowPurposeModal,
  ] = useState(false);

  const [
    showPropertyTypeModal,
    setShowPropertyTypeModal,
  ] = useState(false);

  const [
    showStayModeModal,
    setShowStayModeModal,
  ] = useState(false);

  const [
    showFurnishingModal,
    setShowFurnishingModal,
  ] = useState(false);

  const [
    showWardModal,
    setShowWardModal,
  ] = useState(false);

  const selectedAmenities =
    useMemo(() => {
      if (!form) {
        return [];
      }

      return amenities.filter((amenity) =>
        form.amenityIds.includes(
          amenity.id,
        ),
      );
    }, [
      amenities,
      form,
    ]);

  const canEdit =
    property !== null &&
    property.status !== "RENTED";

  const canSubmit =
    property?.status === "DRAFT" ||
    property?.status ===
      "CHANGES_REQUIRED";

  const countyName =
    property?.countyRelation?.name ??
    property?.county ??
    "—";

  const constituencyName =
    property?.constituency?.name ??
    "—";

  const wardName =
    property?.ward?.name ?? "—";

  const loadMarketerCoverage =
    useCallback(async () => {
      try {
        const response =
          await authenticatedFetch(
            "/marketer/coverage",
          );

        const result =
          await parseResponse(response);

        if (
          !response.ok ||
          !result.success
        ) {
          return;
        }

        const data =
          result.data as
            | Coverage
            | undefined;

        if (data) {
          setCoverage(data);

          if (
            data.countyId &&
            !counties.some(
              (item) =>
                item.id ===
                data.countyId,
            )
          ) {
            setCounties([
              {
                id: data.countyId,
                name:
                  data.countyName,
              },
            ]);
          }
        }
      } catch {
        // Coverage is supplemental.
      }
    }, [counties]);

  const loadCounties =
    useCallback(async () => {
      try {
        const response =
          await authenticatedFetch(
            "/geography/counties",
          );

        const result =
          await parseResponse(response);

        if (
          response.ok &&
          result.success
        ) {
          const data =
            (result.data ??
              []) as GeographyItem[];

          setCounties(data);
        }
      } catch {
        // Keep existing data.
      }
    }, []);

  const loadConstituencies =
    useCallback(
      async (countyId: string) => {
        if (!countyId) {
          setConstituencies([]);
          return;
        }

        try {
          const response =
            await authenticatedFetch(
              `/geography/counties/${encodeURIComponent(
                countyId,
              )}/constituencies`,
            );

          const result =
            await parseResponse(response);

          if (
            response.ok &&
            result.success
          ) {
            setConstituencies(
              (result.data ??
                []) as GeographyItem[],
            );
          }
        } catch {
          // Keep existing data.
        }
      },
      [],
    );

  const loadWards =
    useCallback(
      async (constituencyId: string) => {
        if (!constituencyId) {
          setWards([]);
          return;
        }

        try {
          const response =
            await authenticatedFetch(
              `/geography/constituencies/${encodeURIComponent(
                constituencyId,
              )}/wards`,
            );

          const result =
            await parseResponse(response);

          if (
            response.ok &&
            result.success
          ) {
            setWards(
              (result.data ??
                []) as GeographyItem[],
            );
          }
        } catch {
          // Keep existing data.
        }
      },
      [],
    );

  const loadAmenities =
    useCallback(async () => {
      try {
        const response =
          await authenticatedFetch(
            "/marketer/amenities",
          );

        const result =
          await parseResponse(response);

        if (
          !response.ok ||
          !result.success
        ) {
          return;
        }

        const data =
          result.amenities ??
          result.data ??
          [];

        setAmenities(
          data as Amenity[],
        );
      } catch {
        // Keep current amenities.
      }
    }, []);

  const loadProperty =
    useCallback(async () => {
      if (!propertyId) {
        setError(
          "Property ID is missing.",
        );
        setLoading(false);
        return;
      }

      const response =
        await authenticatedFetch(
          `/marketer/properties/${encodeURIComponent(
            propertyId,
          )}`,
        );

      const result =
        await parseResponse(response);

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ??
            "Failed to load property.",
        );
      }

      const data =
        result.data as BackendProperty;

      setProperty(data);
      setForm(buildForm(data));

      await Promise.all([
        loadConstituencies(
          data.countyId,
        ),
        loadWards(
          data.constituencyId,
        ),
      ]);
    }, [
      propertyId,
      loadConstituencies,
      loadWards,
    ]);

  const loadAll =
    useCallback(async () => {
      try {
        setError(null);

        await Promise.all([
          loadProperty(),
          loadAmenities(),
          loadCounties(),
          loadMarketerCoverage(),
        ]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load property.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [
      loadProperty,
      loadAmenities,
      loadCounties,
      loadMarketerCoverage,
    ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAll();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAll]);

  const onRefresh =
    useCallback(() => {
      setRefreshing(true);
      loadAll();
    }, [loadAll]);

  const updateForm = useCallback(
    <K extends keyof FormState>(
      key: K,
      value: FormState[K],
    ) => {
      setForm((current) =>
        current
          ? {
              ...current,
              [key]: value,
            }
          : current,
      );

      setFieldError(null);
    },
    [],
  );

  const validateForm = useCallback(() => {
    if (!form) {
      return false;
    }

    if (form.title.trim().length < 3) {
      setFieldError(
        "Property title must contain at least 3 characters.",
      );
      return false;
    }

    if (!form.countyId) {
      setFieldError(
        "County is required.",
      );
      return false;
    }

    if (!form.constituencyId) {
      setFieldError(
        "Constituency is required.",
      );
      return false;
    }

    if (!form.wardId) {
      setFieldError(
        "Ward is required.",
      );
      return false;
    }

    const numericFields = [
      {
        label: "Bedrooms",
        value: form.bedrooms,
      },
      {
        label: "Bathrooms",
        value: form.bathrooms,
      },
      {
        label: "Beds",
        value: form.beds,
      },
    ];

    for (const field of numericFields) {
      if (!field.value.trim()) {
        continue;
      }

      const value =
        parseOptionalNumber(
          field.value,
        );

      if (
        value === null ||
        value < 0
      ) {
        setFieldError(
          `${field.label} must be zero or greater.`,
        );
        return false;
      }
    }

    if (
      form.purpose === "LONG_STAY"
    ) {
      if (!form.longStayType) {
        setFieldError(
          "Select a long-stay property type.",
        );
        return false;
      }

      const monthlyRent =
        parseRequiredPositive(
          form.monthlyRent,
        );

      if (!monthlyRent) {
        setFieldError(
          "Monthly rent must be greater than zero.",
        );
        return false;
      }

      const optionalLongStayValues = [
        {
          label: "Viewing fee",
          value: form.viewingFee,
        },
        {
          label: "Deposit",
          value: form.deposit,
        },
        {
          label: "Service charge",
          value: form.serviceCharge,
        },
      ];

      for (const field of optionalLongStayValues) {
        if (!field.value.trim()) {
          continue;
        }

        const value =
          parseOptionalNumber(
            field.value,
          );

        if (
          value === null ||
          value < 0
        ) {
          setFieldError(
            `${field.label} must be zero or greater.`,
          );
          return false;
        }
      }
    }

    if (
      form.purpose === "SHORT_STAY"
    ) {
      if (!form.shortStayType) {
        setFieldError(
          "Select a short-stay property type.",
        );
        return false;
      }

      if (!form.stayMode) {
        setFieldError(
          "Select a stay mode.",
        );
        return false;
      }

      const inspectionFee =
        parseRequiredPositive(
          form.inspectionFee,
        );

      if (!inspectionFee) {
        setFieldError(
          "Inspection fee must be greater than zero.",
        );
        return false;
      }

      const rooms =
        parseRequiredPositive(
          form.rooms,
        );

      if (!rooms) {
        setFieldError(
          "Number of rooms must be greater than zero.",
        );
        return false;
      }

      const maxGuests =
        parseRequiredPositive(
          form.maxGuests,
        );

      if (!maxGuests) {
        setFieldError(
          "Maximum guests must be greater than zero.",
        );
        return false;
      }

      const dayRate =
        parseOptionalNumber(
          form.dayRate,
        );

      const nightRate =
        parseOptionalNumber(
          form.nightRate,
        );

      const dayNightRate =
        parseOptionalNumber(
          form.dayNightRate,
        );

      if (
        form.stayMode === "DAY" &&
        (!dayRate || dayRate <= 0)
      ) {
        setFieldError(
          "Day rate must be greater than zero.",
        );
        return false;
      }

      if (
        form.stayMode === "OVERNIGHT" &&
        (!nightRate ||
          nightRate <= 0)
      ) {
        setFieldError(
          "Night rate must be greater than zero.",
        );
        return false;
      }

      if (
        form.stayMode ===
          "DAY_AND_NIGHT" &&
        (!dayNightRate ||
          dayNightRate <= 0)
      ) {
        setFieldError(
          "Day-and-night rate must be greater than zero.",
        );
        return false;
      }

      if (
        form.stayMode === "FLEXIBLE" &&
        (!dayRate || dayRate <= 0) &&
        (!nightRate ||
          nightRate <= 0) &&
        (!dayNightRate ||
          dayNightRate <= 0)
      ) {
        setFieldError(
          "At least one short-stay rate is required for flexible stays.",
        );
        return false;
      }

      if (
        form.deposit.trim() &&
        (parseOptionalNumber(
          form.deposit,
        ) ?? -1) < 0
      ) {
        setFieldError(
          "Deposit must be zero or greater.",
        );
        return false;
      }
    }

    return true;
  }, [form]);

  const buildPayload = useCallback(() => {
    if (!form) {
      return null;
    }

    return {
      title: form.title.trim(),

      description:
        form.description.trim(),

      purpose: form.purpose,

      longStayType:
        form.purpose === "LONG_STAY"
          ? form.longStayType || null
          : null,

      shortStayType:
        form.purpose === "SHORT_STAY"
          ? form.shortStayType || null
          : null,

      stayMode:
        form.purpose === "SHORT_STAY"
          ? form.stayMode || null
          : null,

      furnishing:
        form.furnishing || null,

      monthlyRent:
        form.purpose === "LONG_STAY"
          ? parseRequiredPositive(
              form.monthlyRent,
            )
          : null,

      deposit:
        form.deposit.trim()
          ? parseOptionalNumber(
              form.deposit,
            )
          : null,

      viewingFee:
        form.purpose === "LONG_STAY" &&
        form.viewingFee.trim()
          ? parseOptionalNumber(
              form.viewingFee,
            )
          : null,

      inspectionFee:
        form.purpose === "SHORT_STAY"
          ? parseRequiredPositive(
              form.inspectionFee,
            )
          : null,

      serviceCharge:
        form.serviceCharge.trim()
          ? parseOptionalNumber(
              form.serviceCharge,
            )
          : null,

      dayRate:
        form.purpose === "SHORT_STAY" &&
        form.dayRate.trim()
          ? parseOptionalNumber(
              form.dayRate,
            )
          : null,

      nightRate:
        form.purpose === "SHORT_STAY" &&
        form.nightRate.trim()
          ? parseOptionalNumber(
              form.nightRate,
            )
          : null,

      dayNightRate:
        form.purpose === "SHORT_STAY" &&
        form.dayNightRate.trim()
          ? parseOptionalNumber(
              form.dayNightRate,
            )
          : null,

      bedrooms:
        form.bedrooms.trim()
          ? parseOptionalNumber(
              form.bedrooms,
            )
          : null,

      bathrooms:
        form.bathrooms.trim()
          ? parseOptionalNumber(
              form.bathrooms,
            )
          : null,

      beds:
        form.beds.trim()
          ? parseOptionalNumber(
              form.beds,
            )
          : null,

      rooms:
        form.purpose === "SHORT_STAY"
          ? parseRequiredPositive(
              form.rooms,
            )
          : null,

      maxGuests:
        form.purpose === "SHORT_STAY"
          ? parseRequiredPositive(
              form.maxGuests,
            )
          : null,

      countyId: form.countyId,
      constituencyId:
        form.constituencyId,
      wardId: form.wardId,

      available: form.available,

      amenityIds:
        form.amenityIds,
    };
  }, [form]);

  const saveChanges =
    useCallback(async () => {
      if (
        !property ||
        !form ||
        !canEdit
      ) {
        return;
      }

      if (!validateForm()) {
        return;
      }

      const payload =
        buildPayload();

      if (!payload) {
        return;
      }

      try {
        setSaving(true);
        setFieldError(null);

        const response =
          await authenticatedFetch(
            `/marketer/properties/${encodeURIComponent(
              property.id,
            )}`,
            {
              method: "PATCH",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        const result =
          await parseResponse(response);

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Failed to save property.",
          );
        }

        const updated =
          result.data as BackendProperty;

        setProperty(updated);
        setForm(buildForm(updated));
        setEditMode(false);

        Alert.alert(
          "Property saved",
          updated.status ===
            "PENDING_VERIFICATION"
            ? "Your changes were saved and the property was sent back for admin verification."
            : "Your property changes have been saved.",
        );
      } catch (err) {
        setFieldError(
          err instanceof Error
            ? err.message
            : "Failed to save property.",
        );
      } finally {
        setSaving(false);
      }
    }, [
      property,
      form,
      canEdit,
      validateForm,
      buildPayload,
    ]);

  const submitForVerification =
    useCallback(async () => {
      if (
        !property ||
        !form ||
        !canSubmit
      ) {
        return;
      }

      if (!validateForm()) {
        return;
      }

      const payload =
        buildPayload();

      if (!payload) {
        return;
      }

      try {
        setSubmitting(true);
        setFieldError(null);

        /*
         * First save the latest form data.
         * This keeps the backend property synchronized
         * before changing the status.
         */
        const updateResponse =
          await authenticatedFetch(
            `/marketer/properties/${encodeURIComponent(
              property.id,
            )}`,
            {
              method: "PATCH",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        const updateResult =
          await parseResponse(
            updateResponse,
          );

        if (
          !updateResponse.ok ||
          !updateResult.success
        ) {
          throw new Error(
            updateResult.message ??
              "Failed to save property changes.",
          );
        }

        /*
         * The marketer controller can automatically
         * move CHANGES_REQUIRED back to
         * PENDING_VERIFICATION when edited.
         *
         * For DRAFT properties we explicitly submit
         * for verification here.
         */
        const updated =
          updateResult.data as BackendProperty;

        if (
          updated.status ===
          "PENDING_VERIFICATION"
        ) {
          setProperty(updated);
          setForm(buildForm(updated));
          setEditMode(false);

          Alert.alert(
            "Submitted",
            "The property has been submitted for admin verification.",
          );

          return;
        }

        const statusResponse =
          await authenticatedFetch(
            `/marketer/properties/${encodeURIComponent(
              property.id,
            )}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({
                status:
                  "PENDING_VERIFICATION",
              }),
            },
          );

        const statusResult =
          await parseResponse(
            statusResponse,
          );

        if (
          !statusResponse.ok ||
          !statusResult.success
        ) {
          throw new Error(
            statusResult.message ??
              "Failed to submit property for verification.",
          );
        }

        const statusUpdated =
          statusResult.data as BackendProperty;

        setProperty(statusUpdated);
        setForm(
          buildForm(statusUpdated),
        );
        setEditMode(false);

        Alert.alert(
          "Submitted",
          "The property has been submitted for admin verification.",
        );
      } catch (err) {
        setFieldError(
          err instanceof Error
            ? err.message
            : "Failed to submit property.",
        );
      } finally {
        setSubmitting(false);
      }
    }, [
      property,
      form,
      canSubmit,
      validateForm,
      buildPayload,
    ]);

  const toggleAvailability =
    useCallback(async () => {
      if (!property) {
        return;
      }

      const nextValue =
        !property.available;

      try {
        setUpdatingAvailability(
          true,
        );

        const response =
          await authenticatedFetch(
            `/marketer/properties/${encodeURIComponent(
              property.id,
            )}/availability`,
            {
              method: "PATCH",
              body: JSON.stringify({
                available:
                  nextValue,
              }),
            },
          );

        const result =
          await parseResponse(response);

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Failed to update availability.",
          );
        }

        const updated =
          result.data as BackendProperty;

        setProperty(updated);
        setForm((current) =>
          current
            ? {
                ...current,
                available:
                  updated.available,
              }
            : current,
        );
      } catch (err) {
        Alert.alert(
          "Availability",
          err instanceof Error
            ? err.message
            : "Failed to update availability.",
        );
      } finally {
        setUpdatingAvailability(
          false,
        );
      }
    }, [property]);

  const toggleAmenity =
    useCallback(
      (amenityId: string) => {
        setForm((current) => {
          if (!current) {
            return current;
          }

          const exists =
            current.amenityIds.includes(
              amenityId,
            );

          return {
            ...current,
            amenityIds: exists
              ? current.amenityIds.filter(
                  (id) =>
                    id !== amenityId,
                )
              : [
                  ...current.amenityIds,
                  amenityId,
                ],
          };
        });

        setFieldError(null);
      },
      [],
    );

  const handlePurposeChange =
    useCallback(
      (purpose: PropertyPurpose) => {
        setForm((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            purpose,
            viewingFee:
              purpose === "LONG_STAY"
                ? current.viewingFee
                : "",
            inspectionFee:
              purpose === "SHORT_STAY"
                ? current.inspectionFee
                : "",
            longStayType:
              purpose ===
              "LONG_STAY"
                ? current.longStayType
                : "",
            shortStayType:
              purpose ===
              "SHORT_STAY"
                ? current.shortStayType
                : "",
          };
        });

        setShowPurposeModal(false);
        setFieldError(null);
      },
      [],
    );

  const availablePropertyTypes =
    form?.purpose === "SHORT_STAY"
      ? SHORT_STAY_TYPES
      : LONG_STAY_TYPES;

  const primaryRate =
    property
      ? property.purpose ===
        "LONG_STAY"
        ? {
            label: "MONTHLY RENT",
            value:
              property.monthlyRent,
          }
        : getPrimaryShortStayRate(
            property,
          )
      : {
          label: "RATE",
          value: null,
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
          Loading property...
        </Text>
      </View>
    );
  }

  if (error || !property || !form) {
    return (
      <View
        style={styles.loadingScreen}
      >
        <View
          style={styles.errorLargeIcon}
        >
          <AlertCircle
            size={28}
            color={COLORS.red}
          />
        </View>

        <Text
          style={styles.errorTitle}
        >
          Unable to load property
        </Text>

        <Text
          style={styles.errorText}
        >
          {error ??
            "The property could not be found."}
        </Text>

        <View
          style={styles.errorActions}
        >
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={16}
              color={COLORS.white}
            />

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Go Back
            </Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            onPress={loadAll}
          >
            <RefreshCw
              size={16}
              color={
                COLORS.background
              }
            />

            <Text
              style={
                styles.primaryButtonText
              }
            >
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const latestReviewNote =
    getLatestReviewNote(property);

  const sortedImages = [
    ...(property.images ?? []),
  ].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder,
  );

  return (
    <View
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.lime}
          />
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.headerAction}
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={19}
              color={COLORS.white}
            />
          </Pressable>

          <View
            style={styles.headerMain}
          >
            <Text
              style={
                styles.headerEyebrow
              }
            >
              MARKETER PROPERTY
            </Text>

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {property.title}
            </Text>
          </View>

          {canEdit ? (
            <Pressable
              style={[
                styles.headerAction,
                editMode &&
                  styles.headerActionActive,
              ]}
              onPress={() => {
                setFieldError(null);
                setEditMode(
                  (current) =>
                    !current,
                );
              }}
            >
              {editMode ? (
                <X
                  size={18}
                  color={
                    COLORS.background
                  }
                />
              ) : (
                <Edit3
                  size={18}
                  color={
                    COLORS.white
                  }
                />
              )}
            </Pressable>
          ) : null}
        </View>

        <View
          style={styles.statusCard}
        >
          <View
            style={styles.statusLeft}
          >
            <View
              style={[
                styles.statusIconBox,
                {
                  backgroundColor:
                    `${statusColor(
                      property.status,
                    )}18`,
                },
              ]}
            >
              <StatusIcon
                status={
                  property.status
                }
              />
            </View>

            <View
              style={styles.statusInfo}
            >
              <Text
                style={
                  styles.statusCaption
                }
              >
                CURRENT STATUS
              </Text>

              <Text
                style={styles.statusTitle}
              >
                {statusLabel(
                  property.status,
                )}
              </Text>
            </View>
          </View>

          <View
            style={styles.statusRight}
          >
            <Text
              style={styles.statusIdLabel}
            >
              PROPERTY ID
            </Text>

            <Text
              style={styles.statusId}
              numberOfLines={1}
            >
              {property.id}
            </Text>
          </View>
        </View>

        {latestReviewNote ? (
          <View
            style={styles.feedbackCard}
          >
            <View
              style={styles.feedbackHeader}
            >
              <AlertCircle
                size={17}
                color={COLORS.blue}
              />

              <Text
                style={styles.feedbackTitle}
              >
                Admin Feedback
              </Text>
            </View>

            <Text
              style={styles.feedbackText}
            >
              {latestReviewNote}
            </Text>

            <Text
              style={styles.feedbackHint}
            >
              Update the property details
              above and submit the
              corrected listing for
              verification.
            </Text>
          </View>
        ) : null}

        <View
          style={styles.imageSection}
        >
          <View
            style={styles.sectionHeader}
          >
            <View
              style={styles.sectionHeaderIcon}
            >
              <ImageIcon
                size={18}
                color={COLORS.lime}
              />
            </View>

            <View
              style={styles.sectionHeaderText}
            >
              <Text
                style={styles.sectionTitle}
              >
                Property Images
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                Images currently stored
                for this listing.
              </Text>
            </View>
          </View>

          {sortedImages.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.imageRow
              }
            >
              {sortedImages.map(
                (image, index) => (
                  <View
                    key={image.id}
                    style={styles.imageWrap}
                  >
                    <Image
                      source={{
                        uri: image.url,
                      }}
                      style={
                        styles.propertyImage
                      }
                    />

                    {image.isPrimary ||
                    index === 0 ? (
                      <View
                        style={
                          styles.coverBadge
                        }
                      >
                        <Text
                          style={
                            styles.coverBadgeText
                          }
                        >
                          PRIMARY
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ),
              )}
            </ScrollView>
          ) : (
            <View
              style={styles.noImageCard}
            >
              <ImageIcon
                size={25}
                color={COLORS.muted}
              />

              <Text
                style={styles.noImageTitle}
              >
                No images uploaded
              </Text>

              <Text
                style={styles.noImageText}
              >
                This property does not
                currently have images.
              </Text>
            </View>
          )}
        </View>

        <View
          style={styles.metricsRow}
        >
          <View
            style={styles.metricCard}
          >
            <Text
              style={styles.metricLabel}
            >
              {primaryRate.label}
            </Text>

            <Text
              style={styles.metricValue}
            >
              {formatMoney(
                primaryRate.value,
              )}
            </Text>
          </View>

          <View
            style={styles.metricCard}
          >
            <Text
              style={styles.metricLabel}
            >
              PROPERTY TYPE
            </Text>

            <Text
              style={styles.metricValue}
              numberOfLines={2}
            >
              {propertyTypeLabel(
                property,
              )}
            </Text>
          </View>
        </View>

        {editMode ? (
          <>
            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={styles.sectionNumber}
                >
                  <Text
                    style={
                      styles.sectionNumberText
                    }
                  >
                    01
                  </Text>
                </View>

                <View
                  style={styles.sectionHeaderText}
                >
                  <Text
                    style={styles.sectionTitle}
                  >
                    Property Details
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Update the listing
                    information.
                  </Text>
                </View>
              </View>

              <Field
                label="PROPERTY TITLE"
                value={form.title}
                onChangeText={(value) =>
                  updateForm(
                    "title",
                    value,
                  )
                }
                placeholder="e.g. Modern BNB in Meru"
              />

              <Text
                style={styles.fieldLabel}
              >
                PURPOSE
              </Text>

              <Pressable
                style={
                  styles.selectButton
                }
                onPress={() =>
                  setShowPurposeModal(
                    true,
                  )
                }
              >
                <Building2
                  size={16}
                  color={COLORS.lime}
                />

                <Text
                  style={styles.selectText}
                >
                  {purposeLabel(
                    form.purpose,
                  )}
                </Text>

                <ChevronDown
                  size={17}
                  color={COLORS.muted}
                />
              </Pressable>

              <Text
                style={styles.fieldLabel}
              >
                PROPERTY TYPE
              </Text>

              <Pressable
                style={
                  styles.selectButton
                }
                onPress={() =>
                  setShowPropertyTypeModal(
                    true,
                  )
                }
              >
                <Building2
                  size={16}
                  color={COLORS.lime}
                />

                <Text
                  style={styles.selectText}
                >
                  {propertyTypeLabel(
                    property,
                  )}
                </Text>

                <ChevronDown
                  size={17}
                  color={COLORS.muted}
                />
              </Pressable>

              {form.purpose ===
              "SHORT_STAY" ? (
                <>
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    STAY MODE
                  </Text>

                  <Pressable
                    style={
                      styles.selectButton
                    }
                    onPress={() =>
                      setShowStayModeModal(
                        true,
                      )
                    }
                  >
                    <Clock3
                      size={16}
                      color={
                        COLORS.lime
                      }
                    />

                    <Text
                      style={
                        styles.selectText
                      }
                    >
                      {stayModeLabel(
                        form.stayMode || undefined,
                      )}
                    </Text>

                    <ChevronDown
                      size={17}
                      color={
                        COLORS.muted
                      }
                    />
                  </Pressable>
                </>
              ) : null}

              <Text
                style={styles.fieldLabel}
              >
                FURNISHING
              </Text>

              <Pressable
                style={
                  styles.selectButton
                }
                onPress={() =>
                  setShowFurnishingModal(
                    true,
                  )
                }
              >
                <Building2
                  size={16}
                  color={COLORS.lime}
                />

                <Text
                  style={styles.selectText}
                >
                  {labelFromEnum(
                    form.furnishing,
                  )}
                </Text>

                <ChevronDown
                  size={17}
                  color={COLORS.muted}
                />
              </Pressable>

              {form.purpose ===
              "LONG_STAY" ? (
                <>
                  <View
                    style={
                      styles.twoColumns
                    }
                  >
                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="MONTHLY RENT"
                        value={
                          form.monthlyRent
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "monthlyRent",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="18000"
                        keyboardType="numeric"
                      />
                    </View>

                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="VIEWING FEE"
                        value={
                          form.viewingFee
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "viewingFee",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="Optional"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View
                    style={
                      styles.twoColumns
                    }
                  >
                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="DEPOSIT"
                        value={
                          form.deposit
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "deposit",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="Optional"
                        keyboardType="numeric"
                      />
                    </View>

                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="SERVICE CHARGE"
                        value={
                          form.serviceCharge
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "serviceCharge",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="Optional"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={
                      styles.twoColumns
                    }
                  >
                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="INSPECTION FEE"
                        value={
                          form.inspectionFee
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "inspectionFee",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="e.g. 500"
                        keyboardType="numeric"
                      />
                    </View>

                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="DEPOSIT"
                        value={
                          form.deposit
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "deposit",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="Optional"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    SHORT-STAY RATES
                  </Text>

                  <View
                    style={
                      styles.twoColumns
                    }
                  >
                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="DAY RATE"
                        value={
                          form.dayRate
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "dayRate",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="Optional"
                        keyboardType="numeric"
                      />
                    </View>

                    <View
                      style={
                        styles.column
                      }
                    >
                      <Field
                        label="NIGHT RATE"
                        value={
                          form.nightRate
                        }
                        onChangeText={(
                          value,
                        ) =>
                          updateForm(
                            "nightRate",
                            normalizeMoneyInput(
                              value,
                            ),
                          )
                        }
                        placeholder="Optional"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Field
                    label="DAY & NIGHT RATE"
                    value={
                      form.dayNightRate
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateForm(
                        "dayNightRate",
                        normalizeMoneyInput(
                          value,
                        ),
                      )
                    }
                    placeholder="Optional"
                    keyboardType="numeric"
                  />
                </>
              )}

              <View
                style={
                  styles.twoColumns
                }
              >
                <View
                  style={
                    styles.column
                  }
                >
                  <Field
                    label="BEDROOMS"
                    value={
                      form.bedrooms
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateForm(
                        "bedrooms",
                        normalizeMoneyInput(
                          value,
                        ),
                      )
                    }
                    placeholder="Optional"
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.column
                  }
                >
                  <Field
                    label="BATHROOMS"
                    value={
                      form.bathrooms
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateForm(
                        "bathrooms",
                        normalizeMoneyInput(
                          value,
                        ),
                      )
                    }
                    placeholder="Optional"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View
                style={
                  styles.twoColumns
                }
              >
                <View
                  style={
                    styles.column
                  }
                >
                  <Field
                    label="BEDS"
                    value={form.beds}
                    onChangeText={(
                      value,
                    ) =>
                      updateForm(
                        "beds",
                        normalizeMoneyInput(
                          value,
                        ),
                      )
                    }
                    placeholder="Optional"
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.column
                  }
                >
                  <Field
                    label="ROOMS"
                    value={form.rooms}
                    onChangeText={(
                      value,
                    ) =>
                      updateForm(
                        "rooms",
                        normalizeMoneyInput(
                          value,
                        ),
                      )
                    }
                    placeholder={
                      form.purpose ===
                      "SHORT_STAY"
                        ? "Required"
                        : "N/A"
                    }
                    keyboardType="numeric"
                    editable={
                      form.purpose ===
                      "SHORT_STAY"
                    }
                  />
                </View>
              </View>

              {form.purpose ===
              "SHORT_STAY" ? (
                <Field
                  label="MAXIMUM GUESTS"
                  value={
                    form.maxGuests
                  }
                  onChangeText={(
                    value,
                  ) =>
                    updateForm(
                      "maxGuests",
                      normalizeMoneyInput(
                        value,
                      ),
                    )
                  }
                  placeholder="e.g. 4"
                  keyboardType="numeric"
                />
              ) : null}

              <Text
                style={styles.fieldLabel}
              >
                DESCRIPTION
              </Text>

              <TextInput
                value={
                  form.description
                }
                onChangeText={(value) =>
                  updateForm(
                    "description",
                    value,
                  )
                }
                placeholder="Describe the property..."
                placeholderTextColor={
                  COLORS.muted
                }
                multiline
                textAlignVertical="top"
                style={
                  styles.textArea
                }
              />
            </View>

            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={styles.sectionNumber}
                >
                  <Text
                    style={
                      styles.sectionNumberText
                    }
                  >
                    02
                  </Text>
                </View>

                <View
                  style={styles.sectionHeaderText}
                >
                  <Text
                    style={styles.sectionTitle}
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Official Kenya
                    geography.
                  </Text>
                </View>
              </View>

              <LocationRow
                label="County"
                value={
                  countyName
                }
              />

              <LocationRow
                label="Constituency"
                value={
                  constituencyName
                }
              />

              <Text
                style={styles.fieldLabel}
              >
                WARD
              </Text>

              <Pressable
                style={
                  styles.selectButton
                }
                onPress={() =>
                  setShowWardModal(
                    true,
                  )
                }
              >
                <MapPin
                  size={16}
                  color={COLORS.lime}
                />

                <Text
                  style={styles.selectText}
                >
                  {wardName}
                </Text>

                <ChevronDown
                  size={17}
                  color={COLORS.muted}
                />
              </Pressable>

              {coverage ? (
                <Text
                  style={
                    styles.lockedHint
                  }
                >
                  County and
                  constituency are locked
                  to your approved
                  marketer coverage.
                </Text>
              ) : null}
            </View>

            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={styles.sectionNumber}
                >
                  <Text
                    style={
                      styles.sectionNumberText
                    }
                  >
                    03
                  </Text>
                </View>

                <View
                  style={styles.sectionHeaderText}
                >
                  <Text
                    style={styles.sectionTitle}
                  >
                    Amenities
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    {selectedAmenities.length}{" "}
                    selected
                  </Text>
                </View>
              </View>

              {amenities.length > 0 ? (
                <View
                  style={
                    styles.amenitiesGrid
                  }
                >
                  {amenities.map(
                    (amenity) => {
                      const selected =
                        form.amenityIds.includes(
                          amenity.id,
                        );

                      return (
                        <Pressable
                          key={
                            amenity.id
                          }
                          style={[
                            styles.amenity,
                            selected &&
                              styles.amenitySelected,
                          ]}
                          onPress={() =>
                            toggleAmenity(
                              amenity.id,
                            )
                          }
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selected &&
                                styles.checkboxSelected,
                            ]}
                          >
                            {selected ? (
                              <Check
                                size={
                                  13
                                }
                                color={
                                  COLORS.background
                                }
                              />
                            ) : null}
                          </View>

                          <Text
                            style={[
                              styles.amenityText,
                              selected &&
                                styles.amenityTextSelected,
                            ]}
                          >
                            {
                              amenity.name
                            }
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              ) : (
                <Text
                  style={
                    styles.emptySectionText
                  }
                >
                  No amenities are
                  currently available.
                </Text>
              )}
            </View>

            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={styles.sectionNumber}
                >
                  <Text
                    style={
                      styles.sectionNumberText
                    }
                  >
                    04
                  </Text>
                </View>

                <View
                  style={styles.sectionHeaderText}
                >
                  <Text
                    style={styles.sectionTitle}
                  >
                    Availability
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Current listing
                    availability.
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.availabilityRow
                }
              >
                <View
                  style={
                    styles.availabilityIcon
                  }
                >
                  <CheckCircle2
                    size={18}
                    color={COLORS.green}
                  />
                </View>

                <View
                  style={
                    styles.availabilityInfo
                  }
                >
                  <Text
                    style={
                      styles.availabilityTitle
                    }
                  >
                    {form.available
                      ? "Available"
                      : "Unavailable"}
                  </Text>

                  <Text
                    style={
                      styles.availabilityText
                    }
                  >
                    {form.available
                      ? "Customers can see this property as available."
                      : "This property is currently unavailable to customers."}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.toggle,
                    form.available &&
                      styles.toggleActive,
                  ]}
                  onPress={() =>
                    updateForm(
                      "available",
                      !form.available,
                    )
                  }
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      form.available &&
                        styles.toggleKnobActive,
                    ]}
                  />
                </Pressable>
              </View>
            </View>

            {fieldError ? (
              <View
                style={styles.validationError}
              >
                <AlertCircle
                  size={17}
                  color={COLORS.red}
                />

                <Text
                  style={
                    styles.validationErrorText
                  }
                >
                  {fieldError}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.saveButton,
                saving &&
                  styles.buttonDisabled,
              ]}
              disabled={saving}
              onPress={saveChanges}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.background
                  }
                />
              ) : (
                <Save
                  size={18}
                  color={
                    COLORS.background
                  }
                />
              )}

              <Text
                style={
                  styles.saveButtonText
                }
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={
                    styles.sectionHeaderIcon
                  }
                >
                  <Building2
                    size={18}
                    color={COLORS.lime}
                  />
                </View>

                <View
                  style={
                    styles.sectionHeaderText
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Property Details
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Current property
                    information.
                  </Text>
                </View>
              </View>

              <DetailRow
                label="Purpose"
                value={purposeLabel(
                  property.purpose,
                )}
              />

              <DetailRow
                label="Property Type"
                value={propertyTypeLabel(
                  property,
                )}
              />

              {property.stayMode ? (
                <DetailRow
                  label="Stay Mode"
                  value={stayModeLabel(
                    property.stayMode,
                  )}
                />
              ) : null}

              <DetailRow
                label="Furnishing"
                value={labelFromEnum(
                  property.furnishing,
                )}
              />

              {property.purpose ===
              "LONG_STAY" ? (
                <>
                  <DetailRow
                    label="Monthly Rent"
                    value={formatMoney(
                      property.monthlyRent,
                    )}
                    emphasized
                  />

                  <DetailRow
                    label="Deposit"
                    value={formatMoney(
                      property.deposit,
                    )}
                  />

                  <DetailRow
                    label="Viewing Fee"
                    value={formatMoney(
                      property.viewingFee,
                    )}
                  />

                  <DetailRow
                    label="Service Charge"
                    value={formatMoney(
                      property.serviceCharge,
                    )}
                  />
                </>
              ) : (
                <>
                  <DetailRow
                    label="Day Rate"
                    value={formatMoney(
                      property.dayRate,
                    )}
                  />

                  <DetailRow
                    label="Night Rate"
                    value={formatMoney(
                      property.nightRate,
                    )}
                  />

                  <DetailRow
                    label="Day & Night Rate"
                    value={formatMoney(
                      property.dayNightRate,
                    )}
                  />

                  <DetailRow
                    label="Inspection Fee"
                    value={formatMoney(
                      property.inspectionFee,
                    )}
                    emphasized
                  />

                  <DetailRow
                    label="Rooms"
                    value={
                      property.rooms !=
                      null
                        ? String(
                            property.rooms,
                          )
                        : "—"
                    }
                  />

                  <DetailRow
                    label="Maximum Guests"
                    value={
                      property.maxGuests !=
                      null
                        ? String(
                            property.maxGuests,
                          )
                        : "—"
                    }
                  />
                </>
              )}

              <View
                style={
                  styles.twoColumnDetails
                }
              >
                <View
                  style={
                    styles.detailMetric
                  }
                >
                  <BedDouble
                    size={17}
                    color={COLORS.lime}
                  />

                  <Text
                    style={
                      styles.detailMetricValue
                    }
                  >
                    {property.bedrooms ??
                      "—"}
                  </Text>

                  <Text
                    style={
                      styles.detailMetricLabel
                    }
                  >
                    Bedrooms
                  </Text>
                </View>

                <View
                  style={
                    styles.detailMetric
                  }
                >
                  <Bath
                    size={17}
                    color={COLORS.lime}
                  />

                  <Text
                    style={
                      styles.detailMetricValue
                    }
                  >
                    {property.bathrooms ??
                      "—"}
                  </Text>

                  <Text
                    style={
                      styles.detailMetricLabel
                    }
                  >
                    Bathrooms
                  </Text>
                </View>

                <View
                  style={
                    styles.detailMetric
                  }
                >
                  <BedDouble
                    size={17}
                    color={COLORS.lime}
                  />

                  <Text
                    style={
                      styles.detailMetricValue
                    }
                  >
                    {property.beds ??
                      "—"}
                  </Text>

                  <Text
                    style={
                      styles.detailMetricLabel
                    }
                  >
                    Beds
                  </Text>
                </View>

                {property.purpose ===
                "SHORT_STAY" ? (
                  <View
                    style={
                      styles.detailMetric
                    }
                  >
                    <Users
                      size={17}
                      color={
                        COLORS.lime
                      }
                    />

                    <Text
                      style={
                        styles.detailMetricValue
                      }
                    >
                      {property.maxGuests ??
                        "—"}
                    </Text>

                    <Text
                      style={
                        styles.detailMetricLabel
                      }
                    >
                      Guests
                    </Text>
                  </View>
                ) : null}
              </View>

              <View
                style={styles.descriptionBlock}
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  DESCRIPTION
                </Text>

                <Text
                  style={
                    styles.descriptionText
                  }
                >
                  {property.description ||
                    "No description has been added."}
                </Text>
              </View>
            </View>

            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={
                    styles.sectionHeaderIcon
                  }
                >
                  <MapPin
                    size={18}
                    color={COLORS.lime}
                  />
                </View>

                <View
                  style={
                    styles.sectionHeaderText
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Official Kenya
                    geography.
                  </Text>
                </View>
              </View>

              <LocationRow
                label="County"
                value={countyName}
              />

              <LocationRow
                label="Constituency"
                value={
                  constituencyName
                }
              />

              <LocationRow
                label="Ward"
                value={wardName}
              />

              {property.town ? (
                <LocationRow
                  label="Town"
                  value={
                    property.town
                  }
                />
              ) : null}

              {property.area ? (
                <LocationRow
                  label="Area"
                  value={
                    property.area
                  }
                />
              ) : null}

              {property.place?.name ? (
                <LocationRow
                  label="Place"
                  value={
                    property.place.name
                  }
                />
              ) : null}
            </View>

            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={
                    styles.sectionHeaderIcon
                  }
                >
                  <CheckCircle2
                    size={18}
                    color={COLORS.lime}
                  />
                </View>

                <View
                  style={
                    styles.sectionHeaderText
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Amenities
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    {
                      selectedAmenities.length
                    }{" "}
                    selected
                  </Text>
                </View>
              </View>

              {selectedAmenities.length >
              0 ? (
                <View
                  style={
                    styles.selectedAmenities
                  }
                >
                  {selectedAmenities.map(
                    (
                      amenity,
                    ) => (
                      <View
                        key={
                          amenity.id
                        }
                        style={
                          styles.amenityTag
                        }
                      >
                        <Check
                          size={13}
                          color={
                            COLORS.lime
                          }
                        />

                        <Text
                          style={
                            styles.amenityTagText
                          }
                        >
                          {
                            amenity.name
                          }
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              ) : (
                <Text
                  style={
                    styles.emptySectionText
                  }
                >
                  No amenities have
                  been selected.
                </Text>
              )}
            </View>

            <View
              style={styles.sectionCard}
            >
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={
                    styles.sectionHeaderIcon
                  }
                >
                  <Building2
                    size={18}
                    color={COLORS.lime}
                  />
                </View>

                <View
                  style={
                    styles.sectionHeaderText
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Availability
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Current listing
                    availability.
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.availabilityDisplay
                }
              >
                <View
                  style={
                    styles.availabilityDisplayLeft
                  }
                >
                  <View
                    style={[
                      styles.availabilityStatusDot,
                      {
                        backgroundColor:
                          property.available
                            ? COLORS.green
                            : COLORS.red,
                      },
                    ]}
                  />

                  <View>
                    <Text
                      style={
                        styles.availabilityDisplayTitle
                      }
                    >
                      {property.available
                        ? "Available"
                        : "Unavailable"}
                    </Text>

                    <Text
                      style={
                        styles.availabilityDisplayText
                      }
                    >
                      {property.available
                        ? "This property is currently available."
                        : "This property is currently unavailable."}
                    </Text>
                  </View>
                </View>

                {property.status !==
                "RENTED" ? (
                  <Pressable
                    style={
                      styles.availabilityButton
                    }
                    disabled={
                      updatingAvailability
                    }
                    onPress={
                      toggleAvailability
                    }
                  >
                    {updatingAvailability ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          COLORS.lime
                        }
                      />
                    ) : (
                      <RefreshCw
                        size={15}
                        color={
                          COLORS.lime
                        }
                      />
                    )}

                    <Text
                      style={
                        styles.availabilityButtonText
                      }
                    >
                      {property.available
                        ? "Mark Unavailable"
                        : "Mark Available"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View
              style={styles.statsRow}
            >
              <View
                style={styles.statCard}
              >
                <Text
                  style={
                    styles.statNumber
                  }
                >
                  {property._count
                    ?.viewingRequests ??
                    0}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  VIEWING REQUESTS
                </Text>
              </View>

              <View
                style={styles.statCard}
              >
                <Text
                  style={
                    styles.statNumber
                  }
                >
                  {property._count
                    ?.shortlists ??
                    0}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  SHORTLISTS
                </Text>
              </View>
            </View>

            {canSubmit ? (
              <>
                {fieldError ? (
                  <View
                    style={
                      styles.validationError
                    }
                  >
                    <AlertCircle
                      size={17}
                      color={
                        COLORS.red
                      }
                    />

                    <Text
                      style={
                        styles.validationErrorText
                      }
                    >
                      {fieldError}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={[
                    styles.submitButton,
                    submitting &&
                      styles.buttonDisabled,
                  ]}
                  disabled={
                    submitting
                  }
                  onPress={
                    submitForVerification
                  }
                >
                  {submitting ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.background
                      }
                    />
                  ) : (
                    <Send
                      size={18}
                      color={
                        COLORS.background
                      }
                    />
                  )}

                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit for Verification"}
                  </Text>
                </Pressable>
              </>
            ) : null}

            {property.status ===
            "PENDING_VERIFICATION" ? (
              <View
                style={
                  styles.waitingCard
                }
              >
                <Clock3
                  size={19}
                  color={COLORS.amber}
                />

                <View
                  style={
                    styles.waitingContent
                  }
                >
                  <Text
                    style={
                      styles.waitingTitle
                    }
                  >
                    Waiting for Admin
                    Verification
                  </Text>

                  <Text
                    style={
                      styles.waitingText
                    }
                  >
                    Your property has
                    been submitted and is
                    currently waiting for
                    the MAKAZII admin team
                    to review it.
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        )}

        <View
          style={styles.sectionCard}
        >
          <View
            style={styles.sectionHeader}
          >
            <View
              style={
                styles.sectionHeaderIcon
              }
            >
              <Clock3
                size={18}
                color={COLORS.lime}
              />
            </View>

            <View
              style={
                styles.sectionHeaderText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Property History
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Status changes recorded by
                MAKAZII.
              </Text>
            </View>
          </View>

          {property.statusHistory &&
          property.statusHistory.length >
            0 ? (
            property.statusHistory.map(
              (
                history,
                index,
              ) => {
                const historyStatus =
                  history.toStatus ??
                  history.status ??
                  "DRAFT";

                return (
                  <View
                    key={
                      history.id
                    }
                    style={
                      styles.historyRow
                    }
                  >
                    <View
                      style={
                        styles.historyTimeline
                      }
                    >
                      <View
                        style={[
                          styles.historyDot,
                          {
                            backgroundColor:
                              statusColor(
                                historyStatus,
                              ),
                          },
                        ]}
                      />

                      {index <
                      (property
                        .statusHistory
                        ?.length ??
                        0) -
                        1 ? (
                        <View
                          style={
                            styles.historyLine
                          }
                        />
                      ) : null}
                    </View>

                    <View
                      style={
                        styles.historyContent
                      }
                    >
                      <View
                        style={
                          styles.historyTop
                        }
                      >
                        <Text
                          style={
                            styles.historyStatus
                          }
                        >
                          {statusLabel(
                            historyStatus,
                          )}
                        </Text>

                        <Text
                          style={
                            styles.historyDate
                          }
                        >
                          {formatDate(
                            history.createdAt,
                          )}
                        </Text>
                      </View>

                      {history.note ? (
                        <Text
                          style={
                            styles.historyNote
                          }
                        >
                          {
                            history.note
                          }
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              },
            )
          ) : (
            <Text
              style={
                styles.emptySectionText
              }
            >
              No property history is
              available yet.
            </Text>
          )}
        </View>

        <View
          style={styles.bottomNotice}
        >
          <AlertCircle
            size={16}
            color={COLORS.lime}
          />

          <Text
            style={
              styles.bottomNoticeText
            }
          >
            Property changes may require
            admin verification before the
            listing becomes visible to
            customers. MAKAZII controls
            the customer contact and
            viewing assignment process.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showPurposeModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowPurposeModal(false)
        }
      >
        <SelectionModal
          title="Property Purpose"
          items={[
            {
              id: "LONG_STAY",
              name: "Long Stay",
            },
            {
              id: "SHORT_STAY",
              name: "Short Stay",
            },
          ]}
          selectedId={
            form.purpose
          }
          onSelect={(id) =>
            handlePurposeChange(
              id as PropertyPurpose,
            )
          }
          onClose={() =>
            setShowPurposeModal(
              false,
            )
          }
        />
      </Modal>

      <Modal
        visible={
          showPropertyTypeModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowPropertyTypeModal(
            false,
          )
        }
      >
        <SelectionModal
          title={
            form.purpose ===
            "SHORT_STAY"
              ? "Short-Stay Type"
              : "Long-Stay Type"
          }
          items={availablePropertyTypes.map(
            (item) => ({
              id: item.value,
              name: item.label,
            }),
          )}
          selectedId={
            form.purpose ===
            "SHORT_STAY"
              ? form.shortStayType
              : form.longStayType
          }
          onSelect={(id) => {
            if (
              form.purpose ===
              "SHORT_STAY"
            ) {
              updateForm(
                "shortStayType",
                id as ShortStayType,
              );
            } else {
              updateForm(
                "longStayType",
                id as LongStayType,
              );
            }

            setShowPropertyTypeModal(
              false,
            );
          }}
          onClose={() =>
            setShowPropertyTypeModal(
              false,
            )
          }
        />
      </Modal>

      <Modal
        visible={showStayModeModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowStayModeModal(false)
        }
      >
        <SelectionModal
          title="Stay Mode"
          items={STAY_MODES.map(
            (item) => ({
              id: item.value,
              name: item.label,
            }),
          )}
          selectedId={
            form.stayMode
          }
          onSelect={(id) => {
            updateForm(
              "stayMode",
              id as StayMode,
            );

            setShowStayModeModal(
              false,
            );
          }}
          onClose={() =>
            setShowStayModeModal(
              false,
            )
          }
        />
      </Modal>

      <Modal
        visible={
          showFurnishingModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowFurnishingModal(
            false,
          )
        }
      >
        <SelectionModal
          title="Furnishing"
          items={FURNISHING_TYPES.map(
            (item) => ({
              id: item.value,
              name: item.label,
            }),
          )}
          selectedId={
            form.furnishing
          }
          onSelect={(id) => {
            updateForm(
              "furnishing",
              id as FurnishingType,
            );

            setShowFurnishingModal(
              false,
            );
          }}
          onClose={() =>
            setShowFurnishingModal(
              false,
            )
          }
        />
      </Modal>

      <Modal
        visible={showWardModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowWardModal(false)
        }
      >
        <SelectionModal
          title="Select Ward"
          items={wards.map(
            (item) => ({
              id: item.id,
              name: item.name,
            }),
          )}
          selectedId={
            form.wardId
          }
          onSelect={(id) => {
            updateForm(
              "wardId",
              id,
            );

            setShowWardModal(false);
          }}
          onClose={() =>
            setShowWardModal(false)
          }
        />
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string,
  ) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  editable?: boolean;
}) {
  return (
    <>
      <Text
        style={styles.fieldLabel}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          COLORS.muted
        }
        keyboardType={
          keyboardType
        }
        editable={editable}
        style={[
          styles.input,
          !editable &&
            styles.inputDisabled,
        ]}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View
      style={styles.detailRow}
    >
      <View
        style={
          styles.detailLabelWrap
        }
      >
        <Text
          style={styles.detailLabel}
        >
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.detailValue,
          emphasized &&
            styles.detailValueEmphasized,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function LocationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.locationRow}
    >
      <View
        style={styles.locationBullet}
      />

      <View
        style={styles.locationContent}
      >
        <Text
          style={
            styles.locationLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.locationValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function SelectionModal({
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  title: string;
  items: {
    id: string;
    name: string;
  }[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <View
      style={styles.modalOverlay}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={onClose}
      />

      <View
        style={styles.modalCard}
      >
        <View
          style={styles.modalHeader}
        >
          <Text
            style={styles.modalTitle}
          >
            {title}
          </Text>

          <Pressable
            style={styles.modalClose}
            onPress={onClose}
          >
            <X
              size={18}
              color={COLORS.white}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.modalList
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {items.map((item) => {
            const selected =
              selectedId ===
              item.id;

            return (
              <Pressable
                key={item.id}
                style={[
                  styles.modalItem,
                  selected &&
                    styles.modalItemSelected,
                ]}
                onPress={() =>
                  onSelect(
                    item.id,
                  )
                }
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selected &&
                      styles.modalItemTextSelected,
                  ]}
                >
                  {item.name}
                </Text>

                {selected ? (
                  <Check
                    size={17}
                    color={
                      COLORS.lime
                    }
                  />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 12,
  },

  errorLargeIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor:
      "#FF707012",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 330,
  },

  errorActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  headerMain: {
    flex: 1,
  },

  headerEyebrow: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerActionActive: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  statusCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  statusIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  statusInfo: {
    flex: 1,
  },

  statusCaption: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  statusTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },

  statusRight: {
    maxWidth: 110,
    alignItems: "flex-end",
  },

  statusIdLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  statusId: {
    color: COLORS.white,
    fontSize: 8,
    marginTop: 4,
  },

  feedbackCard: {
    backgroundColor:
      "#72A7FF0D",
    borderWidth: 1,
    borderColor:
      "#72A7FF28",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  feedbackTitle: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "800",
  },

  feedbackText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  feedbackHint: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },

  imageSection: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  imageRow: {
    gap: 10,
    paddingTop: 3,
  },

  imageWrap: {
    width: 190,
    height: 135,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor:
      COLORS.cardSoft,
  },

  propertyImage: {
    width: "100%",
    height: "100%",
  },

  coverBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor:
      COLORS.lime,
  },

  coverBadgeText: {
    color: COLORS.background,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  noImageCard: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  noImageTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 7,
  },

  noImageText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  metricCard: {
    flex: 1,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 17,
    padding: 14,
  },

  metricLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  metricValue: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 5,
  },

  sectionCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  sectionNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      "#D7FF5F10",
    borderWidth: 1,
    borderColor:
      "#D7FF5F25",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionNumberText: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: "900",
  },

  sectionHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      "#D7FF5F10",
    borderWidth: 1,
    borderColor:
      "#D7FF5F25",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  input: {
    minHeight: 47,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    color: COLORS.white,
    paddingHorizontal: 13,
    fontSize: 13,
    marginBottom: 13,
  },

  inputDisabled: {
    opacity: 0.5,
  },

  textArea: {
    minHeight: 105,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    color: COLORS.white,
    paddingHorizontal: 13,
    paddingTop: 12,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 5,
  },

  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },

  column: {
    flex: 1,
  },

  twoColumnDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 14,
  },

  detailMetric: {
    width: "48%",
    minHeight: 67,
    borderRadius: 13,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding: 10,
  },

  detailMetricValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  detailMetricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 1,
  },

  lockedSelectButton: {
    minHeight: 47,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 13,
    opacity: 0.9,
  },

  lockedHint: {
    marginTop: -6,
    marginBottom: 13,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  selectButton: {
    minHeight: 47,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },

  selectText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
  },

  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  amenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.cardSoft,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  amenitySelected: {
    borderColor:
      "#D7FF5F55",
    backgroundColor:
      "#D7FF5F0D",
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor:
      COLORS.lime,
    borderColor:
      COLORS.lime,
  },

  amenityText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  amenityTextSelected: {
    color: COLORS.white,
  },

  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderRadius: 14,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  availabilityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      "#65D98A12",
    alignItems: "center",
    justifyContent: "center",
  },

  availabilityInfo: {
    flex: 1,
  },

  availabilityTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  availabilityText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  toggle: {
    width: 45,
    height: 25,
    borderRadius: 13,
    backgroundColor:
      COLORS.border,
    padding: 3,
    justifyContent: "center",
  },

  toggleActive: {
    backgroundColor:
      COLORS.lime,
  },

  toggleKnob: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor:
      COLORS.muted,
  },

  toggleKnobActive: {
    backgroundColor:
      COLORS.background,
    alignSelf: "flex-end",
  },

  validationError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 13,
    backgroundColor:
      "#FF70700D",
    borderWidth: 1,
    borderColor:
      "#FF707028",
    marginBottom: 10,
  },

  validationErrorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 11,
    lineHeight: 17,
  },

  saveButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor:
      COLORS.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },

  saveButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },

  submitButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor:
      COLORS.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },

  submitButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor:
      COLORS.lime,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "800",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    gap: 15,
  },

  detailLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: 10,
  },

  detailValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    maxWidth: "58%",
  },

  detailValueEmphasized: {
    color: COLORS.lime,
    fontSize: 13,
  },

  descriptionBlock: {
    paddingTop: 14,
  },

  descriptionText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  locationRow: {
    flexDirection: "row",
    gap: 11,
    marginBottom: 15,
  },

  locationBullet: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      COLORS.lime,
    marginTop: 5,
  },

  locationContent: {
    flex: 1,
  },

  locationLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  locationValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },

  selectedAmenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  amenityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor:
      "#D7FF5F0D",
    borderWidth: 1,
    borderColor:
      "#D7FF5F25",
  },

  amenityTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },

  emptySectionText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  availabilityDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  availabilityDisplayLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  availabilityStatusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  availabilityDisplayTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  availabilityDisplayText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  availabilityButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      "#D7FF5F33",
    backgroundColor:
      "#D7FF5F0D",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  availabilityButtonText: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 17,
    padding: 15,
  },

  statNumber: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginTop: 4,
  },

  waitingCard: {
    flexDirection: "row",
    gap: 11,
    padding: 14,
    borderRadius: 16,
    backgroundColor:
      "#F2C94C0D",
    borderWidth: 1,
    borderColor:
      "#F2C94C25",
    marginBottom: 12,
  },

  waitingContent: {
    flex: 1,
  },

  waitingTitle: {
    color: COLORS.amber,
    fontSize: 12,
    fontWeight: "800",
  },

  waitingText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  historyRow: {
    flexDirection: "row",
    minHeight: 63,
  },

  historyTimeline: {
    width: 25,
    alignItems: "center",
  },

  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },

  historyLine: {
    width: 1,
    flex: 1,
    backgroundColor:
      COLORS.border,
    marginTop: 5,
  },

  historyContent: {
    flex: 1,
    paddingBottom: 16,
    paddingLeft: 5,
  },

  historyTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    gap: 10,
  },

  historyStatus: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  historyDate: {
    color: COLORS.muted,
    fontSize: 9,
  },

  historyNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  bottomNotice: {
    flexDirection: "row",
    gap: 9,
    padding: 14,
    borderRadius: 15,
    backgroundColor:
      "#D7FF5F08",
    borderWidth: 1,
    borderColor:
      "#D7FF5F1C",
    marginTop: 2,
  },

  bottomNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      "#00000099",
  },

  modalCard: {
    maxHeight: "78%",
    backgroundColor:
      COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  modalHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      COLORS.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  modalList: {
    paddingBottom: 20,
    gap: 7,
  },

  modalItem: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor:
      COLORS.cardSoft,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  modalItemSelected: {
    borderColor:
      "#D7FF5F44",
    backgroundColor:
      "#D7FF5F0D",
  },

  modalItemText: {
    color: COLORS.white,
    fontSize: 12,
    flex: 1,
  },

  modalItemTextSelected: {
    color: COLORS.lime,
    fontWeight: "800",
  },
});