import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/config/api';

export type FeedbackType = 'rating' | 'concern';

export type ConcernCategory =
  | 'Property information'
  | 'Pricing'
  | 'Property availability'
  | 'Property condition'
  | 'Viewing experience'
  | 'Safety concern'
  | 'Suspicious listing'
  | 'Marketer/representative'
  | 'Other';

export type ConcernStatus =
  | 'Open'
  | 'Under Review'
  | 'Resolved'
  | 'Dismissed';

export interface PropertyRating {
  id: string;
  type: 'rating';
  propertyId: string;
  propertyTitle: string;
  viewingId: string;
  customerName: string;
  customerPhone: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface PropertyConcern {
  id: string;
  type: 'concern';
  propertyId: string;
  propertyTitle: string;
  viewingId?: string;
  customerName: string;
  customerPhone: string;
  category: ConcernCategory;
  description: string;
  status: ConcernStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateRatingInput {
  propertyId: string;
  propertyTitle: string;
  viewingId: string;
  customerName: string;
  customerPhone: string;
  stars: number;
  comment?: string;
}

export interface CreateConcernInput {
  propertyId: string;
  propertyTitle: string;
  viewingId?: string;
  customerName: string;
  customerPhone: string;
  category: ConcernCategory;
  description: string;
}

export interface UpdateConcernInput {
  status?: ConcernStatus;
  adminNotes?: string;
}

interface FeedbackContextValue {
  ratings: PropertyRating[];
  concerns: PropertyConcern[];

  addRating: (
    input: CreateRatingInput,
  ) => Promise<PropertyRating>;

  addConcern: (
    input: CreateConcernInput,
  ) => Promise<PropertyConcern>;

  updateConcern: (
    id: string,
    input: UpdateConcernInput,
  ) => Promise<void>;

  getRatingById: (
    id: string,
  ) => PropertyRating | undefined;

  getConcernById: (
    id: string,
  ) => PropertyConcern | undefined;

  getRatingsForProperty: (
    propertyId: string,
  ) => PropertyRating[];

  getConcernsForProperty: (
    propertyId: string,
  ) => PropertyConcern[];

  getFeedbackForViewing: (
    viewingId: string,
  ) => {
    ratings: PropertyRating[];
    concerns: PropertyConcern[];
  };

  hasRatingForViewing: (
    viewingId: string,
  ) => boolean;

  getAverageRatingForProperty: (
    propertyId: string,
  ) => number;

  getTotalRatingsForProperty: (
    propertyId: string,
  ) => number;

  getOpenConcernsCount: () => number;
  getPendingConcernsCount: () => number;
  getResolvedConcernsCount: () => number;

  refreshFeedback: () => Promise<void>;

  refreshAdminFeedback: () => Promise<void>;

  updateAdminConcern: (
    id: string,
    input: UpdateConcernInput,
  ) => Promise<void>;
}

const FeedbackContext =
  createContext<FeedbackContextValue | undefined>(
    undefined,
  );

const CUSTOMER_TOKEN_KEY = 'makazii_customer_token';
const ADMIN_TOKEN_KEY = 'makazii_admin_token';

const CUSTOMER_CATEGORIES: ConcernCategory[] = [
  'Property information',
  'Pricing',
  'Property availability',
  'Property condition',
  'Viewing experience',
  'Safety concern',
  'Suspicious listing',
  'Marketer/representative',
  'Other',
];

const mapBackendStatus = (
  status: string | undefined,
): ConcernStatus => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Under Review';

    case 'RESOLVED':
      return 'Resolved';

    case 'CLOSED':
      return 'Dismissed';

    case 'OPEN':
    default:
      return 'Open';
  }
};

const mapBackendCategory = (
  category: string | undefined,
): ConcernCategory => {
  switch (category) {
    case 'VIEWING':
      return 'Viewing experience';

    case 'MARKETER':
      return 'Marketer/representative';

    case 'PROPERTY':
      return 'Property information';

    case 'OTHER':
    default:
      return 'Other';
  }
};

const normalizeRating = (
  item: any,
): PropertyRating => {
  const property =
    item?.property ?? {};

  const user =
    item?.user ??
    item?.customer ??
    {};

  const customerName =
    item?.customerName ??
    user?.name ??
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(' ');

  const customerPhone =
    item?.customerPhone ??
    user?.phone ??
    '';

  return {
    id: String(item?.id ?? ''),
    type: 'rating',
    propertyId: String(
      item?.propertyId ??
        property?.id ??
        '',
    ),
    propertyTitle:
      String(
        item?.propertyTitle ??
          property?.title ??
          'Property',
      ),
    viewingId: String(
      item?.viewingId ?? '',
    ),
    customerName:
      String(customerName),
    customerPhone:
      String(customerPhone),
    stars: Number(
      item?.rating ??
        item?.stars ??
        0,
    ),
    comment:
      typeof item?.message === 'string'
        ? item.message
        : typeof item?.comment === 'string'
          ? item.comment
          : undefined,
    createdAt:
      String(
        item?.createdAt ??
          new Date().toISOString(),
      ),
  };
};

const normalizeConcern = (
  item: any,
): PropertyConcern => {
  const property =
    item?.property ?? {};

  const user =
    item?.user ??
    item?.customer ??
    {};

  const customerName =
    item?.customerName ??
    user?.name ??
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(' ');

  const customerPhone =
    item?.customerPhone ??
    user?.phone ??
    '';

  const backendCategory =
    item?.customerCategory ??
    item?.category;

  return {
    id: String(item?.id ?? ''),
    type: 'concern',
    propertyId: String(
      item?.propertyId ??
        property?.id ??
        '',
    ),
    propertyTitle:
      String(
        item?.propertyTitle ??
          property?.title ??
          'Property',
      ),
    viewingId:
      item?.viewingId
        ? String(item.viewingId)
        : undefined,
    customerName:
      String(customerName),
    customerPhone:
      String(customerPhone),
    category:
      CUSTOMER_CATEGORIES.includes(
        backendCategory,
      )
        ? backendCategory
        : mapBackendCategory(
            backendCategory,
          ),
    description:
      String(
        item?.message ??
          item?.description ??
          '',
      ),
    status: mapBackendStatus(
      item?.status,
    ),
    adminNotes:
      item?.adminResponse ??
      item?.adminNotes ??
      undefined,
    createdAt:
      String(
        item?.createdAt ??
          new Date().toISOString(),
      ),
    updatedAt:
      String(
        item?.updatedAt ??
          item?.createdAt ??
          new Date().toISOString(),
      ),
    resolvedAt:
      item?.respondedAt &&
      item?.status === 'RESOLVED'
        ? String(item.respondedAt)
        : undefined,
  };
};


const extractItems = (
  payload: any,
): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.feedback)) {
    return payload.data.feedback;
  }

  if (Array.isArray(payload?.data?.ratings)) {
    return payload.data.ratings;
  }

  if (Array.isArray(payload?.data?.reports)) {
    return payload.data.reports;
  }

  if (Array.isArray(payload?.feedback)) {
    return payload.feedback;
  }

  if (Array.isArray(payload?.ratings)) {
    return payload.ratings;
  }

  if (Array.isArray(payload?.reports)) {
    return payload.reports;
  }

  return [];
};

async function getCustomerToken() {
  return SecureStore.getItemAsync(
    CUSTOMER_TOKEN_KEY,
  );
}

async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const token =
    await getCustomerToken();

  if (!token) {
    throw new Error(
      'Please log in to your MAKAZII customer account.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
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

  const text =
    await response.text();

  let payload: any = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {
        message: text,
      };
    }
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        'Unable to connect to MAKAZII.',
    );
  }

  return payload;
}


async function getAdminToken() {
  return SecureStore.getItemAsync(
    ADMIN_TOKEN_KEY,
  );
}

async function adminApiRequest(
  path: string,
  options: RequestInit = {},
) {
  const token =
    await getAdminToken();

  if (!token) {
    throw new Error(
      'Please log in to your MAKAZII admin account.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
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

  const responseText =
    await response.text();

  let payload: any = {};

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = {
        message: responseText,
      };
    }
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        'Unable to connect to MAKAZII admin services.',
    );
  }

  return payload;
}

async function fetchFeedbackFromBackend() {
  const token =
    await getCustomerToken();

  if (!token) {
    return {
      ratings: [] as PropertyRating[],
      concerns: [] as PropertyConcern[],
    };
  }

  /*
   * The current customer feedback backend exposes
   * creation endpoints. We keep the context ready for
   * backend list endpoints when the admin/feedback API
   * is added, while submissions are already persisted.
   */
  return {
    ratings: [] as PropertyRating[],
    concerns: [] as PropertyConcern[],
  };
}

export function FeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ratings, setRatings] =
    useState<PropertyRating[]>([]);

  const [concerns, setConcerns] =
    useState<PropertyConcern[]>([]);

  const refreshFeedback =
    useCallback(async () => {
      const feedback =
        await fetchFeedbackFromBackend();

      setRatings(feedback.ratings);
      setConcerns(feedback.concerns);
    }, []);

  useEffect(() => {
    void refreshFeedback();
  }, [refreshFeedback]);

  const refreshAdminFeedback = useCallback(
    async () => {
      const [
        feedbackPayload,
        reportsPayload,
      ] = await Promise.all([
        adminApiRequest('/admin/feedback'),
        adminApiRequest('/admin/problem-reports'),
      ]);

      const feedbackItems =
        extractItems(feedbackPayload);

      const reportItems =
        extractItems(reportsPayload);

      const normalizedRatings =
        feedbackItems
          .map(normalizeRating)
          .filter(
            (item) =>
              Boolean(item.id),
          );

      const normalizedConcerns =
        reportItems
          .map(normalizeConcern)
          .filter(
            (item) =>
              Boolean(item.id),
          );

      setRatings(normalizedRatings);
      setConcerns(normalizedConcerns);
    },
    [],
  );

  const updateAdminConcern = useCallback(
    async (
      id: string,
      input: UpdateConcernInput,
    ) => {
      const backendStatus =
        input.status === 'Under Review'
          ? 'IN_PROGRESS'
          : input.status === 'Resolved'
            ? 'RESOLVED'
            : input.status === 'Dismissed'
              ? 'CLOSED'
              : input.status === 'Open'
                ? 'OPEN'
                : undefined;

      const payload =
        await adminApiRequest(
          `/admin/problem-reports/${encodeURIComponent(id)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              ...(backendStatus
                ? {
                    status:
                      backendStatus,
                  }
                : {}),
              ...(input.adminNotes !==
              undefined
                ? {
                    adminResponse:
                      input.adminNotes.trim(),
                  }
                : {}),
            }),
          },
        );

      const updatedConcern =
        normalizeConcern(
          payload?.data?.report ??
            payload?.data ??
            payload?.report ??
            payload,
        );

      setConcerns((current) =>
        current.map((concern) =>
          concern.id === id
            ? {
                ...concern,
                ...updatedConcern,
                id: concern.id,
              }
            : concern,
        ),
      );
    },
    [],
  );

  const addRating = useCallback(
    async (
      input: CreateRatingInput,
    ): Promise<PropertyRating> => {
      const stars = Math.max(
        1,
        Math.min(
          5,
          Math.round(input.stars),
        ),
      );

      if (!input.viewingId) {
        throw new Error(
          'Viewing ID is required.',
        );
      }

      const payload =
        await apiRequest(
          `/feedback/viewings/${encodeURIComponent(
            input.viewingId,
          )}`,
          {
            method: 'POST',
            body: JSON.stringify({
              rating: stars,
              message:
                input.comment?.trim() ||
                `Customer rated this viewing ${stars} out of 5.`,
            }),
          },
        );

      const backendRating =
        normalizeRating(
          payload?.data?.feedback ??
            payload?.data ??
            payload?.feedback ??
            payload,
        );

      const rating: PropertyRating = {
        ...backendRating,
        propertyId:
          backendRating.propertyId ||
          input.propertyId,
        propertyTitle:
          backendRating.propertyTitle !==
            'Property'
            ? backendRating.propertyTitle
            : input.propertyTitle,
        viewingId:
          backendRating.viewingId ||
          input.viewingId,
        customerName:
          backendRating.customerName ||
          input.customerName.trim(),
        customerPhone:
          backendRating.customerPhone ||
          input.customerPhone.trim(),
        stars,
        comment:
          input.comment?.trim() ||
          backendRating.comment,
      };

      setRatings((current) => [
        rating,
        ...current.filter(
          (item) =>
            item.id !== rating.id,
        ),
      ]);

      return rating;
    },
    [],
  );

  const addConcern = useCallback(
    async (
      input: CreateConcernInput,
    ): Promise<PropertyConcern> => {
      if (!input.viewingId) {
        throw new Error(
          'Viewing ID is required.',
        );
      }

      const payload =
        await apiRequest(
          `/problem-reports/viewings/${encodeURIComponent(
            input.viewingId,
          )}`,
          {
            method: 'POST',
            body: JSON.stringify({
              category:
                input.category,
              message:
                input.description.trim(),
            }),
          },
        );

      const backendConcern =
        normalizeConcern(
          payload?.data?.report ??
            payload?.data ??
            payload?.report ??
            payload,
        );

      const now =
        new Date().toISOString();

      const concern: PropertyConcern = {
        ...backendConcern,
        propertyId:
          backendConcern.propertyId ||
          input.propertyId,
        propertyTitle:
          backendConcern.propertyTitle !==
            'Property'
            ? backendConcern.propertyTitle
            : input.propertyTitle,
        viewingId:
          backendConcern.viewingId ||
          input.viewingId,
        customerName:
          backendConcern.customerName ||
          input.customerName.trim(),
        customerPhone:
          backendConcern.customerPhone ||
          input.customerPhone.trim(),
        category:
          input.category,
        description:
          input.description.trim(),
        status:
          backendConcern.status ||
          'Open',
        createdAt:
          backendConcern.createdAt ||
          now,
        updatedAt:
          backendConcern.updatedAt ||
          now,
      };

      setConcerns((current) => [
        concern,
        ...current.filter(
          (item) =>
            item.id !== concern.id,
        ),
      ]);

      return concern;
    },
    [],
  );

  const updateConcern = useCallback(
    async (
      id: string,
      input: UpdateConcernInput,
    ) => {
      /*
       * Customer feedback/report creation is now
       * backend-backed. Admin status updates will be
       * connected when the admin problem-report API is
       * implemented.
       */
      setConcerns((current) =>
        current.map((concern) => {
          if (concern.id !== id) {
            return concern;
          }

          const now =
            new Date().toISOString();

          const nextStatus =
            input.status ??
            concern.status;

          return {
            ...concern,
            ...input,
            status: nextStatus,
            updatedAt: now,
            resolvedAt:
              nextStatus === 'Resolved'
                ? concern.resolvedAt ??
                  now
                : undefined,
          };
        }),
      );
    },
    [],
  );

  const getRatingById = useCallback(
    (id: string) =>
      ratings.find(
        (rating) =>
          rating.id === id,
      ),
    [ratings],
  );

  const getConcernById = useCallback(
    (id: string) =>
      concerns.find(
        (concern) =>
          concern.id === id,
      ),
    [concerns],
  );

  const getRatingsForProperty =
    useCallback(
      (propertyId: string) =>
        ratings.filter(
          (rating) =>
            rating.propertyId ===
            propertyId,
        ),
      [ratings],
    );

  const getConcernsForProperty =
    useCallback(
      (propertyId: string) =>
        concerns.filter(
          (concern) =>
            concern.propertyId ===
            propertyId,
        ),
      [concerns],
    );

  const getFeedbackForViewing =
    useCallback(
      (viewingId: string) => ({
        ratings: ratings.filter(
          (rating) =>
            rating.viewingId ===
            viewingId,
        ),
        concerns: concerns.filter(
          (concern) =>
            concern.viewingId ===
            viewingId,
        ),
      }),
      [ratings, concerns],
    );

  const hasRatingForViewing =
    useCallback(
      (viewingId: string) =>
        ratings.some(
          (rating) =>
            rating.viewingId ===
            viewingId,
        ),
      [ratings],
    );

  const getAverageRatingForProperty =
    useCallback(
      (propertyId: string) => {
        const propertyRatings =
          ratings.filter(
            (rating) =>
              rating.propertyId ===
              propertyId,
          );

        if (
          propertyRatings.length ===
          0
        ) {
          return 0;
        }

        const total =
          propertyRatings.reduce(
            (sum, rating) =>
              sum + rating.stars,
            0,
          );

        return Number(
          (
            total /
            propertyRatings.length
          ).toFixed(1),
        );
      },
      [ratings],
    );

  const getTotalRatingsForProperty =
    useCallback(
      (propertyId: string) =>
        ratings.filter(
          (rating) =>
            rating.propertyId ===
            propertyId,
        ).length,
      [ratings],
    );

  const getOpenConcernsCount =
    useCallback(
      () =>
        concerns.filter(
          (concern) =>
            concern.status === 'Open',
        ).length,
      [concerns],
    );

  const getPendingConcernsCount =
    useCallback(
      () =>
        concerns.filter(
          (concern) =>
            concern.status ===
            'Under Review',
        ).length,
      [concerns],
    );

  const getResolvedConcernsCount =
    useCallback(
      () =>
        concerns.filter(
          (concern) =>
            concern.status ===
            'Resolved',
        ).length,
      [concerns],
    );

  const value =
    useMemo<FeedbackContextValue>(
      () => ({
        ratings,
        concerns,
        addRating,
        addConcern,
        updateConcern,
        getRatingById,
        getConcernById,
        getRatingsForProperty,
        getConcernsForProperty,
        getFeedbackForViewing,
        hasRatingForViewing,
        getAverageRatingForProperty,
        getTotalRatingsForProperty,
        getOpenConcernsCount,
        getPendingConcernsCount,
        getResolvedConcernsCount,
        refreshFeedback,
        refreshAdminFeedback,
        updateAdminConcern,
      }),
      [
        ratings,
        concerns,
        addRating,
        addConcern,
        updateConcern,
        getRatingById,
        getConcernById,
        getRatingsForProperty,
        getConcernsForProperty,
        getFeedbackForViewing,
        hasRatingForViewing,
        getAverageRatingForProperty,
        getTotalRatingsForProperty,
        getOpenConcernsCount,
        getPendingConcernsCount,
        getResolvedConcernsCount,
        refreshFeedback,
        refreshAdminFeedback,
        updateAdminConcern,
      ],
    );

  return (
    <FeedbackContext.Provider
      value={value}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context =
    useContext(FeedbackContext);

  if (!context) {
    throw new Error(
      'useFeedback must be used inside FeedbackProvider',
    );
  }

  return context;
}
