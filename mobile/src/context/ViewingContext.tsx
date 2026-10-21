import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import type { Property } from '@/types/property';
import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

const CUSTOMER_TOKEN_KEY = 'makazii_customer_token';

/* ============================================================================
   VIEWING STATUS
============================================================================ */

export type ViewingStatus =
  | 'Payment Pending'
  | 'Payment Received'
  | 'Awaiting Representative'
  | 'Representative Assigned'
  | 'Approved'
  | 'Rescheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled';

/* ============================================================================
   REQUEST TYPE
============================================================================ */

export type ViewingRequestType =
  | 'view_only'
  | 'view_and_rent';

/* ============================================================================
   PAYMENT STATUS
============================================================================ */

export type PaymentStatus =
  | 'Not Required'
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refund Pending'
  | 'Refunded';

/* ============================================================================
   MARKETER CONTACT STATUS
============================================================================ */

export type MarketerContactStatus =
  | 'Not Assigned'
  | 'Assigned'
  | 'Contact Pending'
  | 'Contacted';

/* ============================================================================
   BACKEND TYPES
============================================================================ */

type BackendImage = {
  id: string;
  url: string;
  sortOrder?: number | null;
  isPrimary?: boolean | null;
};

type BackendLocationItem = {
  id?: string;
  name?: string;
} | null;

type BackendPayment = {
  id: string;
  amount: number;
  currency: string;
  method?: string | null;
  provider?: string | null;
  reference?: string | null;
  status: string;
  paidAt?: string | null;
};

/*
 * This mirrors the public customer property response.
 *
 * IMPORTANT:
 * The backend property is the source of truth.
 * We do not replace backend values with local/mock
 * property values when the backend has supplied them.
 */
type BackendViewingProperty = {
  id: string;
  title: string;

  description?: string | null;

  purpose?: string | null;

  longStayType?: string | null;
  shortStayType?: string | null;

  monthlyRent?: number | null;
  deposit?: number | null;
  viewingFee?: number | null;
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

  furnishing?: string | null;

  available?: boolean | null;
  verified?: boolean | null;
  status?: string | null;

  county?: string | null;
  town?: string | null;
  area?: string | null;

  place?: BackendLocationItem;

  location?: {
    county?: BackendLocationItem;
    constituency?: BackendLocationItem;
    ward?: BackendLocationItem;
    place?: BackendLocationItem;
  };

  latitude?: number | null;
  longitude?: number | null;

  amenities?: string[] | null;

  images?: BackendImage[] | null;
};

type BackendViewing = {
  id: string;

  /*
   * THIS IS THE EXACT PROPERTY ID FROM THE
   * ViewingRequest DATABASE RECORD.
   */
  propertyId: string;

  requestedDate?: string | null;
  preferredTime?: string | null;
  scheduledAt?: string | null;

  notes?: string | null;

  status: string;
  requestedBy?: string | null;

  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;

  createdAt: string;
  updatedAt: string;

  /*
   * This is the exact property referenced by propertyId.
   */
  property: BackendViewingProperty;

  payment?: BackendPayment | null;

  /*
   * The backend only returns this when customer contact
   * is allowed to be released.
   */
  marketer?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

type CustomerViewingsResponse = {
  success: boolean;
  data?: {
    viewings?: BackendViewing[];
    count?: number;
  };
  message?: string;
};

type CustomerViewingResponse = {
  success: boolean;
  data?: {
    viewing?: BackendViewing;
  };
  message?: string;
};

/* ============================================================================
   VIEWING REQUEST
============================================================================ */

export type ViewingRequest = {
  id: string;

  /*
   * EXACT ViewingRequest.propertyId from the backend.
   */
  propertyId: string;

  /*
   * Property corresponding to propertyId.
   */
  property: Property;

  name: string;
  phone: string;

  date: string;
  time: string;

  scheduledAt?: string;

  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;

  notes: string;

  requestType: ViewingRequestType;

  viewingFee: number;
  rentAmount: number;

  viewingPaymentStatus: PaymentStatus;
  rentalPaymentStatus: PaymentStatus;

  totalPaid: number;

  status: ViewingStatus;

  assignedTo?: string;
  assignedToRole?: string;
  assignedToPhone?: string;

  marketerContactStatus: MarketerContactStatus;

  createdAt: string;
  updatedAt: string;

  paymentReference?: string;
};

/* ============================================================================
   INPUT
============================================================================ */

export type AddViewingRequestInput = {
  /*
   * This must come from the property currently being viewed.
   */
  propertyId: string;

  /*
   * Used only as a compatibility fallback when the backend
   * response does not contain a property.
   *
   * The backend remains the source of truth after creation.
   */
  property: Property;

  name: string;
  phone: string;

  date: string;
  time: string;

  notes: string;

  requestType: ViewingRequestType;

  viewingFee: number;
  rentAmount: number;

  assignedTo?: string;
  assignedToRole?: string;
  assignedToPhone?: string;
  marketerContactStatus?: MarketerContactStatus;
};

/* ============================================================================
   CONTEXT
============================================================================ */

type ViewingContextType = {
  viewingRequests: ViewingRequest[];

  loading: boolean;

  addViewingRequest: (
    request: AddViewingRequestInput,
  ) => Promise<ViewingRequest>;

  refreshViewings: () => Promise<void>;

  getViewingRequestById: (
    id: string,
  ) => ViewingRequest | undefined;

  getViewingRequestsForProperty: (
    propertyId: string,
  ) => ViewingRequest[];

  cancelViewingRequest: (
    id: string,
  ) => Promise<void>;

  updateViewingStatus: (
    id: string,
    status: ViewingStatus,
  ) => Promise<void>;

  updateViewingDetails: (
    id: string,
    details: Partial<{
      date: string;
      time: string;
      notes: string;
      assignedTo: string;
      assignedToRole: string;
      assignedToPhone: string;
      marketerContactStatus: MarketerContactStatus;
    }>,
  ) => Promise<void>;

  clearViewingRequests: () => void;
};

const ViewingContext =
  createContext<ViewingContextType | undefined>(
    undefined,
  );

/* ============================================================================
   TOKEN
============================================================================ */

async function getCustomerToken(): Promise<
  string | null
> {
  return SecureStore.getItemAsync(
    CUSTOMER_TOKEN_KEY,
  );
}

/* ============================================================================
   API REQUEST
============================================================================ */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getCustomerToken();

  if (!token) {
    throw new Error(
      'Please sign in to continue.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data: unknown =
    await response.json().catch(() => null);

  if (!response.ok) {
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      throw new Error(data.message);
    }

    throw new Error(
      'Unable to complete the request.',
    );
  }

  return data as T;
}

/* ============================================================================
   STATUS MAPPING
============================================================================ */

function mapViewingStatus(
  status: string,
): ViewingStatus {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Payment Pending';

    case 'PAID':
      return 'Payment Received';

    case 'AWAITING_ASSIGNMENT':
      return 'Awaiting Representative';

    case 'ASSIGNED':
      return 'Representative Assigned';

    case 'APPROVED':
      return 'Approved';

    case 'RESCHEDULED':
      return 'Rescheduled';

    /*
     * Legacy backend status.
     */
    case 'CONFIRMED':
      return 'Approved';

    case 'COMPLETED':
      return 'Completed';

    case 'CANCELLED':
      return 'Cancelled';

    default:
      return 'Payment Pending';
  }
}

/* ============================================================================
   PAYMENT MAPPING
============================================================================ */

function mapPaymentStatus(
  payment: BackendPayment | null | undefined,
): PaymentStatus {
  if (!payment) {
    return 'Pending';
  }

  switch (payment.status) {
    case 'SUCCESS':
      return 'Paid';

    case 'FAILED':
      return 'Failed';

    case 'REFUNDED':
      return 'Refunded';

    case 'REFUND_PENDING':
      return 'Refund Pending';

    case 'PENDING':
    default:
      return 'Pending';
  }
}

/* ============================================================================
   PROPERTY HELPERS
============================================================================ */

function getBackendCounty(
  backend: BackendViewingProperty,
  fallbackProperty?: Property,
): string {
  return (
    backend.county ??
    backend.location?.county?.name ??
    fallbackProperty?.location?.county ??
    ''
  );
}

function getBackendTown(
  backend: BackendViewingProperty,
  fallbackProperty?: Property,
): string {
  return (
    backend.town ??
    backend.location?.place?.name ??
    backend.location?.ward?.name ??
    backend.location?.constituency?.name ??
    fallbackProperty?.location?.town ??
    ''
  );
}

function getBackendArea(
  backend: BackendViewingProperty,
  fallbackProperty?: Property,
): string {
  return (
    backend.area ??
    backend.location?.place?.name ??
    fallbackProperty?.location?.area ??
    ''
  );
}

/* ============================================================================
   PROPERTY MAPPER
============================================================================ */

/*
 * Converts the backend property into the existing Property type used
 * by the customer UI.
 *
 * IMPORTANT:
 * Backend values always win.
 *
 * fallbackProperty is only used for fields that the current backend
 * customer response does not provide.
 */

function mapFurnishingStatus(
  value: string | null | undefined,
  fallback?: Property["furnishing"],
): Property["furnishing"] {
  if (!value) return fallback;

  const normalized = value.toLowerCase().replace(/_/g, "-");

  switch (normalized) {
    case "furnished":
      return "furnished" as Property["furnishing"];

    case "semi-furnished":
    case "semifurnished":
      return "semi-furnished" as Property["furnishing"];

    case "unfurnished":
      return "unfurnished" as Property["furnishing"];

    default:
      return fallback;
  }
}

function mapPropertyStatus(
  value: string | null | undefined,
  fallback?: Property["status"],
): Property["status"] {
  if (!value) {
    return fallback ?? ("published" as Property["status"]);
  }

  const normalized = value.toLowerCase().replace(/-/g, "_");

  switch (normalized) {
    case "draft":
      return "draft" as Property["status"];

    case "under_review":
    case "pending_verification":
      return "under_review" as Property["status"];

    case "changes_required":
      return "changes_required" as Property["status"];

    case "published":
    case "active":
      return "published" as Property["status"];

    case "rented":
      return "rented" as Property["status"];

    case "inactive":
      return "inactive" as Property["status"];

    case "rejected":
      return "rejected" as Property["status"];

    default:
      return fallback ?? ("published" as Property["status"]);
  }
}

function mapBackendProperty(
  backend: BackendViewingProperty,
  fallbackProperty?: Property,
): Property {
  const images = backend.images ?? [];

  const mappedImages = images.map(
    (image, index) => ({
      id: image.id,
      uri: image.url,
      isCover:
        image.isPrimary === true ||
        (image.isPrimary == null &&
          index === 0),
      order:
        image.sortOrder ?? index,
    }),
  );

  const county = getBackendCounty(
    backend,
    fallbackProperty,
  );

  const town = getBackendTown(
    backend,
    fallbackProperty,
  );

  const area = getBackendArea(
    backend,
    fallbackProperty,
  );

  return {
    /*
     * ========================================================================
     * IDENTITY
     * ========================================================================
     */

    id: backend.id,

    title:
      backend.title ??
      fallbackProperty?.title ??
      'Property',

    /*
     * ========================================================================
     * PROPERTY TYPE
     * ========================================================================
     */

    type:
      backend.longStayType ??
      backend.shortStayType ??
      fallbackProperty?.type ??
      'Other',

    description:
      backend.description ??
      fallbackProperty?.description ??
      '',

    /*
     * ========================================================================
     * PRICING
     * ========================================================================
     */

    rent:
      backend.monthlyRent ??
      fallbackProperty?.rent ??
      0,

    deposit:
      backend.deposit ??
      fallbackProperty?.deposit ??
      0,

    serviceCharge:
      backend.serviceCharge ??
      fallbackProperty?.serviceCharge,

    viewingFee:
      backend.viewingFee ??
      fallbackProperty?.viewingFee,

    /*
     * ========================================================================
     * PROPERTY DETAILS
     * ========================================================================
     */

    bedrooms:
      backend.bedrooms ??
      fallbackProperty?.bedrooms ??
      0,

    bathrooms:
      backend.bathrooms ??
      fallbackProperty?.bathrooms ??
      0,

    /*
     * The old Property type may not contain these fields.
     * They are therefore only included when supported by
     * that type through the existing model.
     */

    beds:
      backend.beds ??
      fallbackProperty?.beds,

    maxGuests:
      backend.maxGuests ??
      fallbackProperty?.maxGuests,

    rooms:
      backend.rooms ??
      fallbackProperty?.rooms,

    size:
      fallbackProperty?.size,

    floor:
      fallbackProperty?.floor,

    totalFloors:
      fallbackProperty?.totalFloors,

    furnishing:
      mapFurnishingStatus(
        backend.furnishing,
        fallbackProperty?.furnishing,
      ),

    /*
     * ========================================================================
     * LOCATION
     * ========================================================================
     */

    location: {
      county,

      town,

      area,

      landmark:
        fallbackProperty?.location?.landmark,

      address:
        fallbackProperty?.location?.address,

      latitude:
        backend.latitude ??
        fallbackProperty?.location?.latitude,

      longitude:
        backend.longitude ??
        fallbackProperty?.location?.longitude,
    },

    /*
     * ========================================================================
     * AMENITIES / IMAGES
     * ========================================================================
     */

    amenities:
      backend.amenities ??
      fallbackProperty?.amenities ??
      [],

    nearby:
      fallbackProperty?.nearby ??
      [],

    images:
      mappedImages.length > 0
        ? mappedImages
        : fallbackProperty?.images ?? [],

    /*
     * ========================================================================
     * SOURCE
     * ========================================================================
     */

    source:
      fallbackProperty?.source,

    /*
     * NEVER expose landlord information.
     */

    landlord: undefined,

    marketerId:
      fallbackProperty?.marketerId,

    marketerName:
      fallbackProperty?.marketerName,

    /*
     * ========================================================================
     * PROPERTY FEATURES
     * ========================================================================
     */

    parking:
      fallbackProperty?.parking,

    waterAvailability:
      fallbackProperty?.waterAvailability,

    electricity:
      fallbackProperty?.electricity,

    security:
      fallbackProperty?.security,

    /*
     * ========================================================================
     * VERIFICATION
     * ========================================================================
     */

    verificationStatus:
      backend.verified === true
        ? 'verified'
        : fallbackProperty?.verificationStatus ??
          'pending',

    verifiedBy:
      fallbackProperty?.verifiedBy,

    verifiedDate:
      fallbackProperty?.verifiedDate,

    verificationNotes:
      fallbackProperty?.verificationNotes,

    adminReviewNotes:
      fallbackProperty?.adminReviewNotes,

    submittedAt:
      fallbackProperty?.submittedAt,

    approvedAt:
      fallbackProperty?.approvedAt,

    rejectedAt:
      fallbackProperty?.rejectedAt,

    publishedAt:
      fallbackProperty?.publishedAt,

    /*
     * ========================================================================
     * AVAILABILITY
     * ========================================================================
     */

    availability:
      backend.available === false
        ? 'occupied'
        : fallbackProperty?.availability ??
          'available',

    availableFrom:
      fallbackProperty?.availableFrom,

    /*
     * ========================================================================
     * STATUS
     * ========================================================================
     */

    status:
      mapPropertyStatus(
        backend.status,
        fallbackProperty?.status,
      ),

    featured:
      fallbackProperty?.featured ??
      false,

    createdAt:
      fallbackProperty?.createdAt ??
      new Date().toISOString(),

    updatedAt:
      fallbackProperty?.updatedAt ??
      new Date().toISOString(),
  };
}

/* ============================================================================
   VIEWING MAPPER
============================================================================ */

function mapBackendViewing(
  viewing: BackendViewing,
  fallbackProperty?: Property,
): ViewingRequest {
  const payment =
    viewing.payment ?? null;

  const status =
    mapViewingStatus(
      viewing.status,
    );

  const paymentStatus =
    mapPaymentStatus(payment);

  /*
   * ========================================================================
   * CONTACT RELEASE
   * ========================================================================
   *
   * The backend decides when marketer is included.
   *
   * We additionally protect the UI so contact information can only
   * become visible for the approved lifecycle stages.
   */

  const contactReleased =
    Boolean(viewing.marketer) &&
    (
      viewing.status === 'ASSIGNED' ||
      viewing.status === 'APPROVED' ||
      viewing.status === 'RESCHEDULED' ||
      viewing.status === 'COMPLETED' ||
      viewing.status === 'CONFIRMED'
    );

  const marketerName =
    contactReleased
      ? [
          viewing.marketer?.firstName,
          viewing.marketer?.lastName,
        ]
          .filter(Boolean)
          .join(' ')
      : undefined;

  /*
   * ========================================================================
   * EXACT PROPERTY
   * ========================================================================
   *
   * viewing.property is the property referenced by viewing.propertyId.
   *
   * We intentionally map this backend object directly.
   */

  const property =
    mapBackendProperty(
      viewing.property,
      fallbackProperty,
    );

  /*
   * Safety check:
   *
   * The property returned by the backend must correspond to the
   * property's ID stored on the viewing.
   */
  if (
    property.id !==
    viewing.propertyId
  ) {
    throw new Error(
      'The viewing property does not match the requested property.',
    );
  }

  return {
    /*
     * ======================================================================
     * VIEWING IDENTITY
     * ======================================================================
     */

    id: viewing.id,

    /*
     * THIS IS THE EXACT DATABASE PROPERTY ID.
     */
    propertyId:
      viewing.propertyId,

    /*
     * EXACT PROPERTY ASSOCIATED WITH THAT ID.
     */
    property,

    /*
     * Customer identity is intentionally not reconstructed from
     * the backend response.
     */
    name:
      fallbackProperty?.source?.name ??
      '',

    phone: '',

    /*
     * ======================================================================
     * REQUEST DETAILS
     * ======================================================================
     */

    date:
      viewing.requestedDate ??
      '',

    time:
      viewing.preferredTime ??
      '',

    scheduledAt:
      viewing.scheduledAt ??
      undefined,

    confirmedAt:
      viewing.confirmedAt ??
      undefined,

    completedAt:
      viewing.completedAt ??
      undefined,

    cancelledAt:
      viewing.cancelledAt ??
      undefined,

    notes:
      viewing.notes ??
      '',

    requestType:
      'view_only',

    /*
     * ======================================================================
     * FINANCIAL INFORMATION
     * ======================================================================
     */

    viewingFee:
      viewing.property.viewingFee ??
      0,

    rentAmount:
      viewing.property.monthlyRent ??
      0,

    viewingPaymentStatus:
      paymentStatus,

    rentalPaymentStatus:
      'Not Required',

    totalPaid:
      paymentStatus === 'Paid'
        ? payment?.amount ?? 0
        : 0,

    /*
     * ======================================================================
     * STATUS
     * ======================================================================
     */

    status,

    /*
     * ======================================================================
     * REPRESENTATIVE
     * ======================================================================
     *
     * These values remain undefined until the backend has released
     * the representative contact.
     */

    assignedTo:
      contactReleased
        ? marketerName ||
          undefined
        : undefined,

    assignedToRole:
      contactReleased
        ? 'Property Representative'
        : undefined,

    assignedToPhone:
      contactReleased
        ? viewing.marketer?.phone ??
          undefined
        : undefined,

    marketerContactStatus:
      contactReleased
        ? 'Assigned'
        : 'Not Assigned',

    /*
     * ======================================================================
     * TIMESTAMPS
     * ======================================================================
     */

    createdAt:
      viewing.createdAt,

    updatedAt:
      viewing.updatedAt,

    paymentReference:
      payment?.reference ??
      undefined,
  };
}

/* ============================================================================
   PROVIDER
============================================================================ */

export function ViewingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    viewingRequests,
    setViewingRequests,
  ] = useState<ViewingRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  /* ==========================================================================
     REFRESH VIEWINGS
  ========================================================================== */

  const refreshViewings =
    useCallback(async () => {
      const token =
        await getCustomerToken();

      if (!token) {
        setViewingRequests([]);
        return;
      }

      setLoading(true);

      try {
        const response =
          await apiRequest<CustomerViewingsResponse>(
            API_ENDPOINTS.customerViewings,
          );

        const backendViewings =
          response.data?.viewings ??
          [];

        const mappedViewings =
          backendViewings.map(
            (viewing) =>
              mapBackendViewing(
                viewing,
              ),
          );

        setViewingRequests(
          mappedViewings,
        );
      } catch (error) {
        /*
         * Do not silently replace backend data with mock/local data.
         *
         * Existing data is kept if refresh fails.
         */
        console.error(
          'Failed to refresh customer viewings:',
          error,
        );

        throw error;
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================================
     INITIAL LOAD
  ========================================================================== */

  useEffect(() => {
    void refreshViewings().catch(
      (error) => {
        console.error(
          'Initial viewing load failed:',
          error,
        );
      },
    );
  }, [refreshViewings]);

  /* ==========================================================================
     CREATE VIEWING
  ========================================================================== */

  const addViewingRequest =
    useCallback(
      async (
        request: AddViewingRequestInput,
      ): Promise<ViewingRequest> => {
        /*
         * Validate the property identity before sending anything.
         *
         * This prevents creating a viewing where the property ID and
         * property object refer to different properties.
         */
        if (
          !request.propertyId ||
          request.property.id !==
            request.propertyId
        ) {
          throw new Error(
            'The selected property does not match the viewing property.',
          );
        }

        const response =
          await apiRequest<CustomerViewingResponse>(
            API_ENDPOINTS.customerViewings,
            {
              method: 'POST',

              body: JSON.stringify({
                /*
                 * EXACT property ID selected by the customer.
                 */
                propertyId:
                  request.propertyId,

                requestedDate:
                  request.date,

                preferredTime:
                  request.time,

                notes:
                  request.notes ||
                  undefined,
              }),
            },
          );

        const backendViewing =
          response.data?.viewing;

        if (!backendViewing) {
          throw new Error(
            'The viewing request was created, but the server did not return the viewing.',
          );
        }

        /*
         * Verify that the backend created the viewing against the
         * exact property the customer selected.
         */
        if (
          backendViewing.propertyId !==
          request.propertyId
        ) {
          throw new Error(
            'The server returned a viewing for a different property.',
          );
        }

        /*
         * Verify the nested property as well.
         */
        if (
          backendViewing.property?.id !==
          request.propertyId
        ) {
          throw new Error(
            'The server returned a property that does not match the viewing.',
          );
        }

        /*
         * Backend response is now the source of truth.
         */
        const mapped =
          mapBackendViewing(
            backendViewing,
            request.property,
          );

        setViewingRequests(
          (current) => [
            mapped,

            ...current.filter(
              (item) =>
                item.id !==
                mapped.id,
            ),
          ],
        );

        return mapped;
      },
      [],
    );

  /* ==========================================================================
     GET ONE
  ========================================================================== */

  const getViewingRequestById =
    useCallback(
      (id: string) =>
        viewingRequests.find(
          (request) =>
            request.id === id,
        ),
      [viewingRequests],
    );

  /* ==========================================================================
     GET BY PROPERTY
  ========================================================================== */

  const getViewingRequestsForProperty =
    useCallback(
      (propertyId: string) =>
        viewingRequests.filter(
          (request) =>
            request.propertyId ===
            propertyId,
        ),
      [viewingRequests],
    );

  /* ==========================================================================
     CANCEL
     
     There is currently no customer cancellation endpoint.
     Do not fake cancellation locally.
  ========================================================================== */

  const cancelViewingRequest =
    useCallback(
      async (_id: string) => {
        throw new Error(
          'Viewing cancellation is not available yet.',
        );
      },
      [],
    );

  /* ==========================================================================
     ADMIN COMPATIBILITY
     
     Customer app does not directly mutate backend lifecycle state.
  ========================================================================== */

  const updateViewingStatus =
    useCallback(
      async (
        _id: string,
        _status: ViewingStatus,
      ) => {
        await refreshViewings();
      },
      [refreshViewings],
    );

  const updateViewingDetails =
    useCallback(
      async (
        _id: string,
        _details: Partial<{
          date: string;
          time: string;
          notes: string;
          assignedTo: string;
          assignedToRole: string;
          assignedToPhone: string;
          marketerContactStatus: MarketerContactStatus;
        }>,
      ) => {
        await refreshViewings();
      },
      [refreshViewings],
    );

  /* ==========================================================================
     CLEAR LOCAL CACHE
  ========================================================================== */

  const clearViewingRequests =
    useCallback(() => {
      setViewingRequests([]);
    }, []);

  /* ==========================================================================
     CONTEXT VALUE
  ========================================================================== */

  const value =
    useMemo(
      () => ({
        viewingRequests,
        loading,

        addViewingRequest,
        refreshViewings,

        getViewingRequestById,
        getViewingRequestsForProperty,

        cancelViewingRequest,
        updateViewingStatus,
        updateViewingDetails,

        clearViewingRequests,
      }),
      [
        viewingRequests,
        loading,

        addViewingRequest,
        refreshViewings,

        getViewingRequestById,
        getViewingRequestsForProperty,

        cancelViewingRequest,
        updateViewingStatus,
        updateViewingDetails,

        clearViewingRequests,
      ],
    );

  return (
    <ViewingContext.Provider
      value={value}
    >
      {children}
    </ViewingContext.Provider>
  );
}

/* ============================================================================
   HOOK
============================================================================ */

export function useViewing() {
  const context =
    useContext(ViewingContext);

  if (!context) {
    throw new Error(
      'useViewing must be used inside a ViewingProvider',
    );
  }

  return context;
}