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
import { Platform } from 'react-native';

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '@/config/api';

/* =========================================================
   CONSTANTS
   ========================================================= */

const MARKETER_TOKEN_KEY =
  'makazii_marketer_token';

/* =========================================================
   MARKETER ACCOUNT
   ========================================================= */

export type MarketerAccountStatus =
  | 'Active'
  | 'Inactive'
  | 'Suspended';

export type MarketerStatus =
  MarketerAccountStatus;

/* =========================================================
   AUTHENTICATED MARKETER
   ========================================================= */

/*
 * This is the real marketer returned by:
 *
 * GET /api/marketer/me
 *
 * Unlike the old Marketer type, this object represents
 * the currently authenticated backend account.
 */

export type AuthenticatedMarketer = {
  id: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
    accountStatus: string;
    statusReason: string | null;
    statusChangedAt: string | null;
    emailVerifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  coverage: {
    id: string;
    county: {
      id: string;
      sourceId: string;
      name: string;
    } | null;
    constituency: {
      id: string;
      sourceId: string;
      name: string;
      countyId: string;
    } | null;
    wards: Array<{
      id: string;
      sourceId: string;
      name: string;
      constituencyId: string;
    }>;
    assignedAt: string;
    updatedAt: string;
  } | null;

  places: Array<{
    id: string;
    name: string;
    countyId: string;
    assignedAt: string;
  }>;

  statistics: {
    properties: {
      total: number;
      draft: number;
      pendingVerification: number;
      changesRequired: number;
      active: number;
      rented: number;
      inactive: number;
      rejected: number;
    };

    viewings: {
      total: number;
      requested: number;
      confirmed: number;
      assigned: number;
      completed: number;
      cancelled: number;
      declined: number;
    };

    assignedPlaces: number;
  };
};

/* =========================================================
   MARKETER APPLICATION
   ========================================================= */

export type MarketerApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

/* =========================================================
   IDENTITY
   ========================================================= */

export type MarketerIdType =
  | 'National ID'
  | 'Passport';

export type MarketerDocument = {
  uri: string;
  name: string;
  type: 'image';
};

export type MarketerUploadFile = {
  uri: string;
  name: string;
  type: string;
};

/* =========================================================
   IDENTITY VERIFICATION
   ========================================================= */

export type MarketerIdVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REVIEW'
  | 'REJECTED';

/* =========================================================
   APPLICATION
   ========================================================= */

export type MarketerApplication = {
  id: string;

  firstName: string;
  lastName: string;
  phone: string;
  email: string;

  idType: MarketerIdType;
  idNumber: string;

  idFront?: {
    uri: string;
    name: string;
    type: string;
  } | null;

  idBack?: {
    uri: string;
    name: string;
    type: string;
  } | null;

  nationalIdFront?: MarketerDocument;
  nationalIdBack?: MarketerDocument;
  passportPage?: MarketerDocument;

  idVerificationStatus?: MarketerIdVerificationStatus;
  idVerificationDecision?: string | null;
  idVerificationMessage?: string | null;
  idVerificationTransactionId?: string | null;
  idVerifiedAt?: string | null;

  county: string;
  countyId: string;
  constituencyId: string;
  wardIds: string[];
  placeIds: string[];
  places: string[];
  timeInSelectedAreas: string;

  hasRealEstateExperience: boolean;
  experienceAreas: string[];
  experienceDuration: string;
  experienceDescription: string;

  currentOccupation: string;
  workingWithAnotherAgency: boolean;
  currentAgencyName: string;

  motivation: string;
  contribution: string;

  expectedPropertiesPerMonth: string;
  propertySources: string[];

  knowsLandlords: boolean;
  approximateLandlordCount: number | null;

  comfortableCommunicating: boolean;
  communicationMethods: string[];

  timeAvailability: string;
  willingToFollowProcedures: boolean;

  referenceName: string;
  referencePhone: string;
  referenceRelationship: string;

  declarationAccepted: boolean;

  status: MarketerApplicationStatus;

  adminNotes: string;
  rejectionReason: string;
  requestedChanges: string;

  submittedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;

  marketerId?: string;
};

/* =========================================================
   MARKETER
   ========================================================= */

export type Marketer = {
  id: string;

  name: string;
  phone: string;
  email: string;

  area: string;

  username: string;
  temporaryPassword: string;

  properties: number;
  landlords: number;
  viewings: number;

  status: MarketerAccountStatus;
  portalAccess: boolean;

  joined: string;
  experience: string;
  notes: string;

  applicationId?: string;
};

/* =========================================================
   CREATE MARKETER
   ========================================================= */

export type CreateMarketerInput = {
  name: string;
  phone: string;
  email: string;
  area: string;

  username: string;
  temporaryPassword: string;

  experience?: string;
  notes?: string;
};

/* =========================================================
   UPDATE MARKETER
   ========================================================= */

export type UpdateMarketerInput = Partial<
  Omit<Marketer, 'id'>
>;

/* =========================================================
   CREATE APPLICATION
   ========================================================= */

export type CreateMarketerApplicationInput =
  Omit<
    MarketerApplication,
    | 'id'
    | 'status'
    | 'adminNotes'
    | 'rejectionReason'
    | 'requestedChanges'
    | 'submittedAt'
    | 'reviewedAt'
    | 'approvedAt'
    | 'rejectedAt'
    | 'marketerId'
    | 'idVerificationStatus'
    | 'idVerificationDecision'
    | 'idVerificationMessage'
    | 'idVerificationTransactionId'
    | 'idVerifiedAt'
  >;

/* =========================================================
   UPDATE APPLICATION
   ========================================================= */

export type UpdateMarketerApplicationInput =
  Partial<Omit<MarketerApplication, 'id'>>;

/* =========================================================
   UPDATE MY PROFILE
   ========================================================= */

export type UpdateMyProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};


/* =========================================================
   MARKETER PROFILE CHANGE REQUESTS
   ========================================================= */

export type MarketerProfileChangeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type MarketerProfileChangeRequest = {
  id: string;
  marketerId: string;

  currentFirstName: string | null;
  currentLastName: string | null;
  currentEmail: string | null;
  currentPhone: string | null;

  requestedFirstName: string | null;
  requestedLastName: string | null;
  requestedEmail: string | null;
  requestedPhone: string | null;

  reason: string | null;

  status: MarketerProfileChangeStatus;

  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;

  createdAt: string;
  updatedAt: string;

  marketer?: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    };
  };
};

export type CreateMarketerProfileChangeRequestInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  reason?: string;
};


/* =========================================================
   ADMIN MARKETER PROFILE CHANGE REQUESTS
   ========================================================= */

export type AdminProfileChangeRequestActionResult = {
  updatedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    role: string;
    accountStatus?: string;
    statusReason?: string | null;
    statusChangedAt?: string | null;
    statusChangedById?: string | null;
    isActive: boolean;
    emailVerifiedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  updatedRequest: MarketerProfileChangeRequest;
};

/* =========================================================
   CONTEXT
   ========================================================= */

type MarketerContextValue = {
  /* -------------------------------------------------------
     LOCAL / ADMIN MARKETER MANAGEMENT
     ------------------------------------------------------- */

  marketers: Marketer[];

  addMarketer: (
    input: CreateMarketerInput
  ) => Marketer;

  updateMarketer: (
    id: string,
    changes: UpdateMarketerInput
  ) => void;

  approveMarketer: (
    id: string
  ) => void;

  suspendMarketer: (
    id: string
  ) => void;

  activateMarketer: (
    id: string
  ) => void;

  getMarketerById: (
    id: string
  ) => Marketer | undefined;

  /* -------------------------------------------------------
     AUTHENTICATED MARKETER PORTAL
     ------------------------------------------------------- */

  currentMarketer:
    | AuthenticatedMarketer
    | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  refreshCurrentMarketer: () => Promise<
    AuthenticatedMarketer | null
  >;

  updateMyProfile: (
    changes: UpdateMyProfileInput
  ) => Promise<AuthenticatedMarketer | null>;


  createProfileChangeRequest: (
    changes: CreateMarketerProfileChangeRequestInput
  ) => Promise<MarketerProfileChangeRequest>;

  getMyProfileChangeRequests: () => Promise<
    MarketerProfileChangeRequest[]
  >;

  getAllProfileChangeRequests: (
    status?: MarketerProfileChangeStatus
  ) => Promise<MarketerProfileChangeRequest[]>;

  approveProfileChangeRequest: (
    id: string
  ) => Promise<AdminProfileChangeRequestActionResult>;

  rejectProfileChangeRequest: (
    id: string,
    adminNotes: string
  ) => Promise<MarketerProfileChangeRequest>;

  logout: () => Promise<void>;

  /* -------------------------------------------------------
     APPLICATIONS
     ------------------------------------------------------- */

  applications: MarketerApplication[];

  submitApplication: (
    input: CreateMarketerApplicationInput
  ) => Promise<MarketerApplication>;

  getApplicationById: (
    id: string
  ) => MarketerApplication | undefined;

  getApplicationsByStatus: (
    status: MarketerApplicationStatus
  ) => MarketerApplication[];

  getApplicationByEmail: (
    email: string
  ) => MarketerApplication | undefined;

  updateApplication: (
    id: string,
    changes: UpdateMarketerApplicationInput
  ) => void;

  startApplicationReview: (
    id: string
  ) => void;

  requestApplicationChanges: (
    id: string,
    message: string
  ) => void;

  approveApplication: (
    id: string
  ) => Marketer | undefined;

  rejectApplication: (
    id: string,
    reason: string
  ) => void;

  resubmitApplication: (
    id: string
  ) => void;
};

/* =========================================================
   TOKEN STORAGE
   ========================================================= */

async function getMarketerToken(): Promise<
  string | null
> {
  try {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      return (
        window.localStorage.getItem(
          MARKETER_TOKEN_KEY
        ) || null
      );
    }

    return await SecureStore.getItemAsync(
      MARKETER_TOKEN_KEY
    );
  } catch (error) {
    console.error(
      'Unable to read marketer token:',
      error
    );

    return null;
  }
}

async function removeMarketerToken(): Promise<void> {
  try {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.removeItem(
        MARKETER_TOKEN_KEY
      );
      return;
    }

    await SecureStore.deleteItemAsync(
      MARKETER_TOKEN_KEY
    );
  } catch (error) {
    console.error(
      'Unable to remove marketer token:',
      error
    );
  }
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getCurrentDate(): string {
  return new Date().toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function getCurrentDateTime(): string {
  return new Date().toISOString();
}

function getNextMarketerId(
  marketers: Marketer[]
): string {
  const highestNumber =
    marketers.reduce(
      (highest, marketer) => {
        const match =
          marketer.id.match(
            /^MK-(\d+)$/
          );

        if (!match) {
          return highest;
        }

        const number = Number(
          match[1]
        );

        if (!Number.isFinite(number)) {
          return highest;
        }

        return Math.max(
          highest,
          number
        );
      },
      0
    );

  return `MK-${String(
    highestNumber + 1
  ).padStart(3, '0')}`;
}

function getNextApplicationId(
  applications: MarketerApplication[]
): string {
  const highestNumber =
    applications.reduce(
      (highest, application) => {
        const match =
          application.id.match(
            /^APP-(\d+)$/
          );

        if (!match) {
          return highest;
        }

        const number = Number(
          match[1]
        );

        if (!Number.isFinite(number)) {
          return highest;
        }

        return Math.max(
          highest,
          number
        );
      },
      0
    );

  return `APP-${String(
    highestNumber + 1
  ).padStart(3, '0')}`;
}

/* =========================================================
   BACKEND HELPERS
   ========================================================= */

function formValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return String(value);
}

function appendJsonArray(
  formData: FormData,
  key: string,
  value: string[]
) {
  formData.append(
    key,
    JSON.stringify(
      Array.isArray(value)
        ? value
        : []
    )
  );
}

async function getApiErrorMessage(
  response: Response
): Promise<string> {
  try {
    const body =
      await response.json();

    if (
      body &&
      typeof body.message ===
        'string' &&
      body.message.trim()
    ) {
      return body.message;
    }

    if (
      body &&
      typeof body.error ===
        'string' &&
      body.error.trim()
    ) {
      return body.error;
    }

    if (
      body &&
      body.errors &&
      Array.isArray(body.errors)
    ) {
      const messages =
        body.errors
          .map(
            (item: unknown) =>
              typeof item ===
              'string'
                ? item
                : item &&
                    typeof item ===
                      'object' &&
                    'message' in item
                  ? String(
                      (
                        item as {
                          message: unknown;
                        }
                      ).message
                    )
                  : ''
          )
          .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(
          ', '
        );
      }
    }
  } catch {
    // Response wasn't JSON.
  }

  return (
    response.statusText ||
    `Request failed with status ${response.status}`
  );
}

/* =========================================================
   NORMALIZE AUTHENTICATED MARKETER
   ========================================================= */


function normalizeProfileChangeRequest(
  raw: any
): MarketerProfileChangeRequest {
  const request =
    raw?.data?.request ??
    raw?.request ??
    raw?.data ??
    raw ??
    {};

  const status =
    request?.status;

  const normalizedStatus: MarketerProfileChangeStatus =
    status === 'APPROVED' ||
    status === 'REJECTED'
      ? status
      : 'PENDING';

  const marketer =
    request?.marketer;

  const marketerUser =
    marketer?.user;

  return {
    id: String(request?.id ?? ''),
    marketerId: String(request?.marketerId ?? ''),

    currentFirstName:
      request?.currentFirstName ?? null,

    currentLastName:
      request?.currentLastName ?? null,

    currentEmail:
      request?.currentEmail ?? null,

    currentPhone:
      request?.currentPhone ?? null,

    requestedFirstName:
      request?.requestedFirstName ?? null,

    requestedLastName:
      request?.requestedLastName ?? null,

    requestedEmail:
      request?.requestedEmail ?? null,

    requestedPhone:
      request?.requestedPhone ?? null,

    reason:
      request?.reason ?? null,

    status:
      normalizedStatus,

    adminNotes:
      request?.adminNotes ?? null,

    reviewedAt:
      request?.reviewedAt ?? null,

    reviewedById:
      request?.reviewedById ?? null,

    createdAt:
      String(
        request?.createdAt ??
        new Date().toISOString()
      ),

    updatedAt:
      String(
        request?.updatedAt ??
        new Date().toISOString()
      ),

    marketer: marketer
      ? {
          id: String(marketer?.id ?? ''),
          user: marketerUser
            ? {
                firstName:
                  String(
                    marketerUser?.firstName ?? ''
                  ),

                lastName:
                  String(
                    marketerUser?.lastName ?? ''
                  ),

                email:
                  marketerUser?.email ?? null,

                phone:
                  marketerUser?.phone ?? null,
              }
            : undefined,
        }
      : undefined,
  };
}

function normalizeAuthenticatedMarketer(
  raw: any
): AuthenticatedMarketer {
  const marketer =
    raw?.marketer ??
    raw?.data?.marketer ??
    raw?.data ??
    raw;

  if (
    !marketer ||
    typeof marketer !== 'object'
  ) {
    throw new Error(
      'The server returned an invalid marketer profile.'
    );
  }

  const user =
    marketer.user ?? {};

  const coverage =
    marketer.coverage ?? null;

  const statistics =
    marketer.statistics ?? {};

  const properties =
    statistics.properties ?? {};

  const viewings =
    statistics.viewings ?? {};

  return {
    id: String(
      marketer.id ?? ''
    ),

    user: {
      id: String(
        user.id ?? ''
      ),

      firstName: String(
        user.firstName ?? ''
      ),

      lastName: String(
        user.lastName ?? ''
      ),

      email:
        user.email === null ||
        user.email === undefined
          ? null
          : String(user.email),

      phone:
        user.phone === null ||
        user.phone === undefined
          ? null
          : String(user.phone),

      role: String(
        user.role ?? ''
      ),

      isActive:
        Boolean(
          user.isActive
        ),

      accountStatus: String(
        user.accountStatus ?? ''
      ),

      statusReason:
        user.statusReason ??
        null,

      statusChangedAt:
        user.statusChangedAt ??
        null,

      emailVerifiedAt:
        user.emailVerifiedAt ??
        null,

      createdAt: String(
        user.createdAt ?? ''
      ),

      updatedAt: String(
        user.updatedAt ?? ''
      ),
    },

    notes:
      marketer.notes ??
      null,

    createdAt: String(
      marketer.createdAt ?? ''
    ),

    updatedAt: String(
      marketer.updatedAt ?? ''
    ),

    coverage: coverage
      ? {
          id: String(
            coverage.id ?? ''
          ),

          county:
            coverage.county
              ? {
                  id: String(
                    coverage.county.id ??
                      ''
                  ),

                  sourceId:
                    String(
                      coverage.county
                        .sourceId ??
                        ''
                    ),

                  name: String(
                    coverage.county
                      .name ?? ''
                  ),
                }
              : null,

          constituency:
            coverage.constituency
              ? {
                  id: String(
                    coverage
                      .constituency
                      .id ?? ''
                  ),

                  sourceId:
                    String(
                      coverage
                        .constituency
                        .sourceId ??
                        ''
                    ),

                  name: String(
                    coverage
                      .constituency
                      .name ?? ''
                  ),

                  countyId:
                    String(
                      coverage
                        .constituency
                        .countyId ??
                        ''
                    ),
                }
              : null,

          wards:
            Array.isArray(
              coverage.wards
            )
              ? coverage.wards.map(
                  (ward: any) => ({
                    id: String(
                      ward.id ?? ''
                    ),

                    sourceId:
                      String(
                        ward.sourceId ??
                          ''
                      ),

                    name: String(
                      ward.name ?? ''
                    ),

                    constituencyId:
                      String(
                        ward.constituencyId ??
                          ''
                      ),
                  })
                )
              : [],

          assignedAt: String(
            coverage.assignedAt ??
              ''
          ),

          updatedAt: String(
            coverage.updatedAt ??
              ''
          ),
        }
      : null,

    places:
      Array.isArray(
        marketer.places
      )
        ? marketer.places.map(
            (place: any) => ({
              id: String(
                place.id ?? ''
              ),
              name: String(
                place.name ?? ''
              ),
              countyId: String(
                place.countyId ??
                  ''
              ),
              assignedAt:
                String(
                  place.assignedAt ??
                    ''
                ),
            })
          )
        : [],

    statistics: {
      properties: {
        total: Number(
          properties.total ?? 0
        ),

        draft: Number(
          properties.draft ?? 0
        ),

        pendingVerification:
          Number(
            properties.pendingVerification ??
              0
          ),

        changesRequired:
          Number(
            properties.changesRequired ??
              0
          ),

        active: Number(
          properties.active ?? 0
        ),

        rented: Number(
          properties.rented ?? 0
        ),

        inactive: Number(
          properties.inactive ?? 0
        ),

        rejected: Number(
          properties.rejected ?? 0
        ),
      },

      viewings: {
        total: Number(
          viewings.total ?? 0
        ),

        requested: Number(
          viewings.requested ?? 0
        ),

        confirmed: Number(
          viewings.confirmed ?? 0
        ),

        assigned: Number(
          viewings.assigned ?? 0
        ),

        completed: Number(
          viewings.completed ?? 0
        ),

        cancelled: Number(
          viewings.cancelled ?? 0
        ),

        declined: Number(
          viewings.declined ?? 0
        ),
      },

      assignedPlaces:
        Number(
          statistics.assignedPlaces ??
            0
        ),
    },
  };
}

/* =========================================================
   INITIAL MARKETERS
   ========================================================= */

const INITIAL_MARKETERS: Marketer[] = [
  {
    id: 'MK-001',
    name: 'Brian Kamau',
    phone: '0712 456 781',
    email: 'brian@makazii.co.ke',
    area: 'Kilimani',
    username: 'brian@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 18,
    landlords: 9,
    viewings: 31,
    status: 'Active',
    portalAccess: true,
    joined: '05 Aug 2026',
    experience:
      'Residential property marketing',
    notes:
      'Experienced marketer covering Kilimani and surrounding areas.',
  },

  {
    id: 'MK-002',
    name: 'Lucy Wanjiru',
    phone: '0723 518 442',
    email: 'lucy@makazii.co.ke',
    area: 'Kileleshwa',
    username: 'lucy@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 14,
    landlords: 7,
    viewings: 24,
    status: 'Active',
    portalAccess: true,
    joined: '08 Aug 2026',
    experience:
      'Residential property marketing',
    notes:
      'Covers Kileleshwa and Lavington.',
  },

  {
    id: 'MK-003',
    name: 'Kevin Mutua',
    phone: '0708 315 902',
    email: 'kevin@makazii.co.ke',
    area: 'Roysambu',
    username: 'kevin@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 11,
    landlords: 6,
    viewings: 19,
    status: 'Active',
    portalAccess: true,
    joined: '14 Aug 2026',
    experience:
      'Residential property marketing',
    notes:
      'Covers Roysambu, Kasarani and nearby areas.',
  },

  {
    id: 'MK-004',
    name: 'Mercy Muthoni',
    phone: '0791 428 615',
    email: 'mercy@makazii.co.ke',
    area: 'Meru Town',
    username: 'mercy@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 9,
    landlords: 5,
    viewings: 14,
    status: 'Active',
    portalAccess: true,
    joined: '20 Aug 2026',
    experience:
      'Residential property marketing',
    notes:
      'Handles Meru Town, Nchiru and surrounding locations.',
  },

  {
    id: 'MK-005',
    name: 'Dennis Mwangi',
    phone: '0715 630 284',
    email: 'dennis@makazii.co.ke',
    area: 'Ruaka',
    username: 'dennis@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 8,
    landlords: 4,
    viewings: 12,
    status: 'Inactive',
    portalAccess: false,
    joined: '18 Sep 2026',
    experience: 'New marketer',
    notes:
      'Legacy demo marketer. Awaiting onboarding completion.',
  },

  {
    id: 'MK-006',
    name: 'Esther Akinyi',
    phone: '0721 842 193',
    email: 'esther@makazii.co.ke',
    area: 'South B',
    username: 'esther@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 13,
    landlords: 8,
    viewings: 22,
    status: 'Active',
    portalAccess: true,
    joined: '26 Aug 2026',
    experience:
      'Residential property marketing',
    notes:
      'Covers South B and South C.',
  },

  {
    id: 'MK-007',
    name: 'Sammy Kariuki',
    phone: '0703 716 529',
    email: 'sammy@makazii.co.ke',
    area: 'Kahawa',
    username: 'sammy@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 6,
    landlords: 3,
    viewings: 8,
    status: 'Inactive',
    portalAccess: false,
    joined: '21 Sep 2026',
    experience: 'New marketer',
    notes:
      'Legacy demo marketer. Awaiting onboarding completion.',
  },

  {
    id: 'MK-008',
    name: 'Faith Njeri',
    phone: '0782 361 904',
    email: 'faith@makazii.co.ke',
    area: 'Westlands',
    username: 'faith@makazii.co.ke',
    temporaryPassword: 'demo1234',
    properties: 10,
    landlords: 5,
    viewings: 17,
    status: 'Suspended',
    portalAccess: false,
    joined: '11 Aug 2026',
    experience:
      'Residential property marketing',
    notes:
      'Account currently suspended by administrator.',
  },
];

/* =========================================================
   INITIAL APPLICATIONS
   ========================================================= */

const INITIAL_APPLICATIONS: MarketerApplication[] = [
  {
    id: 'APP-001',
    firstName: 'Dennis',
    lastName: 'Mwangi',
    phone: '0715 630 284',
    email: 'dennis@example.com',

    idType: 'National ID',
    idNumber: '********',

    idFront: null,
    idBack: null,

    idVerificationStatus: 'PENDING',
    idVerificationDecision: null,
    idVerificationMessage: null,
    idVerificationTransactionId: null,
    idVerifiedAt: null,

    county: 'Kiambu',
    countyId: '',
    constituencyId: '',
    wardIds: [],
    placeIds: [],
    places: [],

    timeInSelectedAreas:
      '3–5 years',

    hasRealEstateExperience: false,
    experienceAreas: [],
    experienceDuration:
      'Less than 1 year',
    experienceDescription: '',

    currentOccupation:
      'Self-employed',
    workingWithAnotherAgency: false,
    currentAgencyName: '',

    motivation:
      'I would like to help connect renters with available homes in my area.',

    contribution:
      'I know several rental areas and can help identify available properties.',

    expectedPropertiesPerMonth:
      '1–5',

    propertySources: [
      'Local landlords',
      'Visit properties',
      'Referrals',
    ],

    knowsLandlords: true,
    approximateLandlordCount: 8,

    comfortableCommunicating: true,

    communicationMethods: [
      'Phone',
      'WhatsApp',
      'In-person',
    ],

    timeAvailability:
      'Part-time',

    willingToFollowProcedures:
      true,

    referenceName: '',
    referencePhone: '',
    referenceRelationship: '',

    declarationAccepted: true,

    status: 'PENDING',

    adminNotes: '',
    rejectionReason: '',
    requestedChanges: '',

    submittedAt:
      '2026-09-18T10:30:00.000Z',
  },

  {
    id: 'APP-002',
    firstName: 'Sammy',
    lastName: 'Kariuki',
    phone: '0703 716 529',
    email: 'sammy@example.com',

    idType: 'National ID',
    idNumber: '********',

    idFront: null,
    idBack: null,

    idVerificationStatus: 'REVIEW',

    idVerificationDecision: null,

    idVerificationMessage:
      'Identity documents are currently being reviewed.',

    idVerificationTransactionId:
      null,

    idVerifiedAt: null,

    county: 'Nairobi',
    countyId: '',
    constituencyId: '',
    wardIds: [],
    placeIds: [],
    places: [],

    timeInSelectedAreas:
      '1–2 years',

    hasRealEstateExperience: true,

    experienceAreas: [
      'Property marketing',
    ],

    experienceDuration:
      '1–2 years',

    experienceDescription:
      'I have previously helped landlords find tenants.',

    currentOccupation:
      'Self-employed',

    workingWithAnotherAgency: false,
    currentAgencyName: '',

    motivation:
      'I want to work with MAKAZII and help grow the available rental inventory.',

    contribution:
      'I have local knowledge and landlord connections.',

    expectedPropertiesPerMonth:
      '6–10',

    propertySources: [
      'Local landlords',
      'Referrals',
      'Property agents',
    ],

    knowsLandlords: true,
    approximateLandlordCount: 12,

    comfortableCommunicating: true,

    communicationMethods: [
      'Phone',
      'WhatsApp',
    ],

    timeAvailability:
      'Full-time',

    willingToFollowProcedures:
      true,

    referenceName: '',
    referencePhone: '',
    referenceRelationship: '',

    declarationAccepted: true,

    status: 'UNDER_REVIEW',

    adminNotes:
      'Identity documents are currently being reviewed.',

    rejectionReason: '',
    requestedChanges: '',

    submittedAt:
      '2026-09-21T09:15:00.000Z',

    reviewedAt:
      '2026-09-22T08:30:00.000Z',
  },
];

/* =========================================================
   CONTEXT
   ========================================================= */

const MarketerContext =
  createContext<
    MarketerContextValue | undefined
  >(undefined);


/* =========================================================
   BACKEND APPLICATION NORMALIZER
   ========================================================= */

function normalizeBackendApplication(
  responseBody: any,
  fallback?: Partial<CreateMarketerApplicationInput>
): MarketerApplication {
  const responseApplication =
    responseBody?.data?.application ??
    responseBody?.application ??
    responseBody?.data ??
    responseBody ??
    {};

  const geography =
    responseBody?.data?.geography ??
    responseBody?.geography ??
    {};

  const backendCounty =
    geography?.county ?? null;

  const backendConstituency =
    geography?.constituency ?? null;

  const backendWards =
    Array.isArray(geography?.wards)
      ? geography.wards
      : [];

  const normalizeIdType = (
    value: unknown
  ): MarketerIdType => {
    if (
      value === 'PASSPORT' ||
      value === 'Passport'
    ) {
      return 'Passport';
    }

    return 'National ID';
  };

  const normalizeStatus = (
    value: unknown
  ): MarketerApplicationStatus => {
    switch (value) {
      case 'UNDER_REVIEW':
        return 'UNDER_REVIEW';

      case 'ACTION_REQUIRED':
        return 'ACTION_REQUIRED';

      case 'APPROVED':
        return 'APPROVED';

      case 'REJECTED':
        return 'REJECTED';

      case 'PENDING':
      default:
        return 'PENDING';
    }
  };

  const submittedAt =
    responseApplication?.createdAt ??
    responseApplication?.submittedAt ??
    new Date().toISOString();

  const wardIds =
    Array.isArray(responseApplication?.wardIds)
      ? responseApplication.wardIds
      : Array.isArray(fallback?.wardIds)
        ? fallback.wardIds
        : [];

  const placeIds =
    Array.isArray(responseApplication?.placeIds)
      ? responseApplication.placeIds
      : Array.isArray(fallback?.placeIds)
        ? fallback.placeIds
        : [];

  const places =
    Array.isArray(fallback?.places)
      ? fallback.places
      : backendWards.map(
          (ward: any) =>
            typeof ward?.name === 'string'
              ? ward.name
              : ''
        ).filter(Boolean);

  return {
    id:
      typeof responseApplication?.id === 'string'
        ? responseApplication.id
        : '',

    firstName:
      responseApplication?.firstName ??
      fallback?.firstName ??
      '',

    lastName:
      responseApplication?.lastName ??
      fallback?.lastName ??
      '',

    phone:
      responseApplication?.phone ??
      fallback?.phone ??
      '',

    email:
      responseApplication?.email ??
      fallback?.email ??
      '',

    idType:
      normalizeIdType(
        responseApplication?.idType ??
        fallback?.idType
      ),

    idNumber:
      responseApplication?.idNumber ??
      fallback?.idNumber ??
      '',

    idFront:
      fallback?.idFront ??
      null,

    idBack:
      fallback?.idBack ??
      null,

    nationalIdFront:
      fallback?.nationalIdFront,

    nationalIdBack:
      fallback?.nationalIdBack,

    passportPage:
      fallback?.passportPage,

    idVerificationStatus:
      responseApplication?.idVerificationStatus ??
      'PENDING',

    idVerificationDecision:
      responseApplication?.idVerificationDecision ??
      null,

    idVerificationMessage:
      responseApplication?.idVerificationMessage ??
      null,

    idVerificationTransactionId:
      responseApplication?.idVerificationTransactionId ??
      null,

    idVerifiedAt:
      responseApplication?.idVerifiedAt ??
      null,

    county:
      backendCounty?.name ??
      fallback?.county ??
      '',

    countyId:
      responseApplication?.countyId ??
      fallback?.countyId ??
      backendCounty?.id ??
      '',

    constituencyId:
      responseApplication?.constituencyId ??
      fallback?.constituencyId ??
      backendConstituency?.id ??
      '',

    wardIds,

    placeIds,

    places,

    timeInSelectedAreas:
      fallback?.timeInSelectedAreas ??
      '',

    hasRealEstateExperience:
      fallback?.hasRealEstateExperience ??
      false,

    experienceAreas:
      Array.isArray(fallback?.experienceAreas)
        ? fallback.experienceAreas
        : [],

    experienceDuration:
      fallback?.experienceDuration ??
      '',

    experienceDescription:
      fallback?.experienceDescription ??
      '',

    currentOccupation:
      fallback?.currentOccupation ??
      '',

    workingWithAnotherAgency:
      fallback?.workingWithAnotherAgency ??
      false,

    currentAgencyName:
      fallback?.currentAgencyName ??
      '',

    motivation:
      fallback?.motivation ??
      '',

    contribution:
      fallback?.contribution ??
      '',

    expectedPropertiesPerMonth:
      fallback?.expectedPropertiesPerMonth ??
      '',

    propertySources:
      Array.isArray(fallback?.propertySources)
        ? fallback.propertySources
        : [],

    knowsLandlords:
      fallback?.knowsLandlords ??
      false,

    approximateLandlordCount:
      fallback?.approximateLandlordCount ??
      null,

    comfortableCommunicating:
      fallback?.comfortableCommunicating ??
      false,

    communicationMethods:
      Array.isArray(fallback?.communicationMethods)
        ? fallback.communicationMethods
        : [],

    timeAvailability:
      fallback?.timeAvailability ??
      '',

    willingToFollowProcedures:
      fallback?.willingToFollowProcedures ??
      false,

    referenceName:
      fallback?.referenceName ??
      '',

    referencePhone:
      fallback?.referencePhone ??
      '',

    referenceRelationship:
      fallback?.referenceRelationship ??
      '',

    declarationAccepted:
      responseApplication?.declarationAccepted ??
      fallback?.declarationAccepted ??
      true,

    status:
      normalizeStatus(
        responseApplication?.status
      ),

    adminNotes:
      responseApplication?.adminNotes ??
      '',

    rejectionReason:
      responseApplication?.rejectionReason ??
      '',

    requestedChanges:
      responseApplication?.requestedChanges ??
      '',

    submittedAt,

    reviewedAt:
      responseApplication?.reviewedAt ??
      undefined,

    approvedAt:
      responseApplication?.approvedAt ??
      undefined,

    rejectedAt:
      responseApplication?.rejectedAt ??
      undefined,

    marketerId:
      responseApplication?.marketerId ??
      undefined,
  };
}

/* =========================================================
   PROVIDER
   ========================================================= */

export function MarketerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [marketers, setMarketers] =
    useState<Marketer[]>(
      INITIAL_MARKETERS
    );

  const [applications, setApplications] =
    useState<MarketerApplication[]>(
      INITIAL_APPLICATIONS
    );

  /* =======================================================
     AUTHENTICATED MARKETER STATE
     ======================================================= */

  const [
    currentMarketer,
    setCurrentMarketer,
  ] =
    useState<AuthenticatedMarketer | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  /* =======================================================
     LOAD CURRENT MARKETER
     ======================================================= */

  const refreshCurrentMarketer =
    useCallback(
      async (): Promise<
        AuthenticatedMarketer | null
      > => {
        try {
          const token =
            await getMarketerToken();

          if (!token) {
            setCurrentMarketer(null);
            return null;
          }

          const endpoint =
            `${API_BASE_URL}${
              API_ENDPOINTS.marketerMe ??
              '/marketer/me'
            }`;

          const response =
            await fetch(endpoint, {
              method: 'GET',
              headers: {
                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },
            });

          if (
            response.status ===
              401 ||
            response.status ===
              403
          ) {
            await removeMarketerToken();
            setCurrentMarketer(null);
            return null;
          }

          if (!response.ok) {
            const message =
              await getApiErrorMessage(
                response
              );

            throw new Error(
              message ||
                'Unable to load marketer profile.'
            );
          }

          const body =
            await response.json();

          if (!body?.success) {
            throw new Error(
              body?.message ||
                'Unable to load marketer profile.'
            );
          }

          const normalized =
            normalizeAuthenticatedMarketer(
              body
            );

          setCurrentMarketer(
            normalized
          );

          return normalized;
        } catch (error) {
          console.error(
            'LOAD CURRENT MARKETER ERROR:',
            error
          );

          /*
           * Do not immediately delete the token for a
           * temporary network failure.
           *
           * This allows the app to recover when the backend
           * becomes available again.
           */
          if (
            error instanceof TypeError
          ) {
            return null;
          }

          return null;
        }
      },
      []
    );

  /* =======================================================
     RESTORE MARKETER SESSION
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        try {
          await refreshCurrentMarketer();
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [
    refreshCurrentMarketer,
  ]);

  /* =======================================================
     UPDATE MY PROFILE
     ======================================================= */

  const updateMyProfile =
    useCallback(
      async (
        changes: UpdateMyProfileInput
      ): Promise<
        AuthenticatedMarketer | null
      > => {
        const token =
          await getMarketerToken();

        if (!token) {
          throw new Error(
            'Your marketer session has expired. Please sign in again.'
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}${
              API_ENDPOINTS.profile
            }`,
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                firstName:
                  changes.firstName,
                lastName:
                  changes.lastName,
                email:
                  changes.email,
                phone:
                  changes.phone,
              }),
            }
          );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          await removeMarketerToken();
          setCurrentMarketer(null);

          throw new Error(
            'Your marketer session has expired. Please sign in again.'
          );
        }

        if (!response.ok) {
          const message =
            await getApiErrorMessage(
              response
            );

          throw new Error(
            message ||
              'Unable to update your profile.'
          );
        }

        const body =
          await response.json();

        if (!body?.success) {
          throw new Error(
            body?.message ||
              'Unable to update your profile.'
          );
        }

        /*
         * /api/auth/profile returns the updated User,
         * not the complete marketer portal object.
         *
         * Therefore we reload /api/marketer/me so that
         * currentMarketer remains the complete source of
         * truth.
         */
        return await refreshCurrentMarketer();
      },
      [refreshCurrentMarketer]
    );


  /* =======================================================
     ADMIN PROFILE CHANGE REQUEST HELPERS
     ======================================================= */

  const getAdminToken = useCallback(
    async (): Promise<string | null> => {
      if (Platform.OS === 'web') {
        try {
          return (
            window.localStorage.getItem(
              'makazii_admin_token'
            ) ?? null
          );
        } catch {
          return null;
        }
      }

      try {
        return await SecureStore.getItemAsync(
          'makazii_admin_token'
        );
      } catch {
        return null;
      }
    },
    []
  );

  /* =======================================================
     MARKETER PROFILE CHANGE REQUESTS
     ======================================================= */

  const createProfileChangeRequest = useCallback(
    async (
      changes: CreateMarketerProfileChangeRequestInput
    ): Promise<MarketerProfileChangeRequest> => {
      const token = await getMarketerToken();

      if (!token) {
        throw new Error(
          'Your marketer session has expired. Please sign in again.'
        );
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.profileChangeRequest}`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            firstName: changes.firstName,
            lastName: changes.lastName,
            email: changes.email,
            phone: changes.phone,
            reason: changes.reason,
          }),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await removeMarketerToken();
        setCurrentMarketer(null);

        throw new Error(
          'Your marketer session has expired. Please sign in again.'
        );
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(response);

        throw new Error(
          message ||
          'Unable to submit your profile change request.'
        );
      }

      const body = await response.json();

      if (!body?.success) {
        throw new Error(
          body?.message ||
          'Unable to submit your profile change request.'
        );
      }

      const request =
        normalizeProfileChangeRequest(body);

      if (!request.id) {
        throw new Error(
          'The server did not return a profile change request ID.'
        );
      }

      return request;
    },
    []
  );

  const getMyProfileChangeRequests = useCallback(
    async (): Promise<
      MarketerProfileChangeRequest[]
    > => {
      const token = await getMarketerToken();

      if (!token) {
        throw new Error(
          'Your marketer session has expired. Please sign in again.'
        );
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.profileChangeRequests}`,
        {
          method: 'GET',

          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await removeMarketerToken();
        setCurrentMarketer(null);

        throw new Error(
          'Your marketer session has expired. Please sign in again.'
        );
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(response);

        throw new Error(
          message ||
          'Unable to load your profile change requests.'
        );
      }

      const body = await response.json();

      if (!body?.success) {
        throw new Error(
          body?.message ||
          'Unable to load your profile change requests.'
        );
      }

      const rawRequests =
        body?.data?.requests ??
        body?.requests ??
        body?.data ??
        [];

      if (!Array.isArray(rawRequests)) {
        return [];
      }

      return rawRequests.map(
        (request: any) =>
          normalizeProfileChangeRequest(request)
      );
    },
    []
  );

  /* =======================================================
     ADMIN PROFILE CHANGE REQUESTS
     ======================================================= */

  const getAllProfileChangeRequests = useCallback(
    async (
      status?: MarketerProfileChangeStatus
    ): Promise<MarketerProfileChangeRequest[]> => {
      const token = await getAdminToken();

      if (!token) {
        throw new Error(
          'Your admin session has expired. Please sign in again.'
        );
      }

      const query =
        status
          ? `?status=${encodeURIComponent(status)}`
          : '';

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adminMarketerProfileChangeRequests}${query}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        if (Platform.OS === 'web') {
          try {
            window.localStorage.removeItem(
              'makazii_admin_token'
            );
          } catch {
            // Ignore storage errors.
          }
        } else {
          try {
            await SecureStore.deleteItemAsync(
              'makazii_admin_token'
            );
          } catch {
            // Ignore storage errors.
          }
        }

        throw new Error(
          'Your admin session has expired. Please sign in again.'
        );
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(response);

        throw new Error(
          message ||
            'Unable to load marketer profile change requests.'
        );
      }

      const body = await response.json();

      if (!body?.success) {
        throw new Error(
          body?.message ||
            'Unable to load marketer profile change requests.'
        );
      }

      const rawRequests =
        body?.data?.requests ??
        body?.requests ??
        body?.data ??
        [];

      if (!Array.isArray(rawRequests)) {
        return [];
      }

      return rawRequests.map(
        (request: any) =>
          normalizeProfileChangeRequest(request)
      );
    },
    [getAdminToken]
  );

  const approveProfileChangeRequest = useCallback(
    async (
      id: string
    ): Promise<AdminProfileChangeRequestActionResult> => {
      const token = await getAdminToken();

      if (!token) {
        throw new Error(
          'Your admin session has expired. Please sign in again.'
        );
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adminMarketerProfileChangeRequests}/${encodeURIComponent(id)}/approve`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          'Your admin session has expired. Please sign in again.'
        );
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(response);

        throw new Error(
          message ||
            'Unable to approve marketer profile change request.'
        );
      }

      const body = await response.json();

      if (!body?.success) {
        throw new Error(
          body?.message ||
            'Unable to approve marketer profile change request.'
        );
      }

      const result =
        body?.data ?? body;

      return {
        updatedUser:
          result?.updatedUser
            ? {
                ...result.updatedUser,
                email:
                  result.updatedUser.email ?? null,
                phone:
                  result.updatedUser.phone ?? null,
              }
            : undefined,

        updatedRequest:
          normalizeProfileChangeRequest(
            result?.updatedRequest ??
              result?.request ??
              result
          ),
      };
    },
    [getAdminToken]
  );

  const rejectProfileChangeRequest = useCallback(
    async (
      id: string,
      adminNotes: string
    ): Promise<MarketerProfileChangeRequest> => {
      const token = await getAdminToken();

      if (!token) {
        throw new Error(
          'Your admin session has expired. Please sign in again.'
        );
      }

      const notes = adminNotes.trim();

      if (!notes) {
        throw new Error(
          'A rejection reason is required.'
        );
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adminMarketerProfileChangeRequests}/${encodeURIComponent(id)}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminNotes: notes,
          }),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          'Your admin session has expired. Please sign in again.'
        );
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(response);

        throw new Error(
          message ||
            'Unable to reject marketer profile change request.'
        );
      }

      const body = await response.json();

      if (!body?.success) {
        throw new Error(
          body?.message ||
            'Unable to reject marketer profile change request.'
        );
      }

      return normalizeProfileChangeRequest(
        body?.data?.request ??
          body?.request ??
          body?.data ??
          body
      );
    },
    [getAdminToken]
  );

  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout =
    useCallback(
      async () => {
        await removeMarketerToken();
        setCurrentMarketer(null);
      },
      []
    );

  /* =======================================================
     MARKETER MANAGEMENT
     ======================================================= */

  const addMarketer = (
    input: CreateMarketerInput
  ): Marketer => {
    const newMarketer: Marketer = {
      id: getNextMarketerId(
        marketers
      ),

      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),

      area: input.area.trim(),

      username:
        input.username.trim(),

      temporaryPassword:
        input.temporaryPassword.trim(),

      properties: 0,
      landlords: 0,
      viewings: 0,

      status: 'Inactive',
      portalAccess: false,

      joined: getCurrentDate(),

      experience:
        input.experience?.trim() ||
        'New marketer',

      notes:
        input.notes?.trim() ||
        'Created by administrator.',
    };

    setMarketers((current) => [
      ...current,
      newMarketer,
    ]);

    return newMarketer;
  };

  const updateMarketer = (
    id: string,
    changes: UpdateMarketerInput
  ) => {
    setMarketers((current) =>
      current.map((marketer) => {
        if (marketer.id !== id) {
          return marketer;
        }

        const updated: Marketer = {
          ...marketer,
          ...changes,
        };

        updated.portalAccess =
          updated.status === 'Active';

        return updated;
      })
    );
  };

  const approveMarketer = (
    id: string
  ) => {
    updateMarketer(id, {
      status: 'Active',
      portalAccess: true,
    });
  };

  const suspendMarketer = (
    id: string
  ) => {
    updateMarketer(id, {
      status: 'Suspended',
      portalAccess: false,
    });
  };

  const activateMarketer = (
    id: string
  ) => {
    updateMarketer(id, {
      status: 'Active',
      portalAccess: true,
    });
  };

  const getMarketerById = (
    id: string
  ): Marketer | undefined => {
    return marketers.find(
      (marketer) =>
        marketer.id === id
    );
  };

  /* =======================================================
     SUBMIT APPLICATION
     ======================================================= */

  const submitApplication = async (
    input: CreateMarketerApplicationInput
  ): Promise<MarketerApplication> => {
    if (!input.idFront?.uri) {
      throw new Error(
        'Please upload the front of your identity document.'
      );
    }

    if (
      input.idType === 'National ID' &&
      !input.idBack?.uri
    ) {
      throw new Error(
        'Please upload the back of your National ID.'
      );
    }

    const formData =
      new FormData();

    formData.append(
      'firstName',
      formValue(input.firstName)
    );

    formData.append(
      'lastName',
      formValue(input.lastName)
    );

    formData.append(
      'phone',
      formValue(input.phone)
    );

    formData.append(
      'email',
      formValue(input.email)
    );

    formData.append(
      'idType',
      formValue(input.idType)
    );

    formData.append(
      'idNumber',
      formValue(input.idNumber)
    );

    formData.append(
      'idFront',
      {
        uri: input.idFront.uri,
        name:
          input.idFront.name ||
          'national-id-front.jpg',
        type:
          input.idFront.type ||
          'image/jpeg',
      } as any
    );

    if (input.idBack?.uri) {
      formData.append(
        'idBack',
        {
          uri: input.idBack.uri,
          name:
            input.idBack.name ||
            'national-id-back.jpg',
          type:
            input.idBack.type ||
            'image/jpeg',
        } as any
      );
    }

    formData.append(
      'county',
      formValue(input.county)
    );

    formData.append(
      'countyId',
      formValue(input.countyId)
    );

    formData.append(
      'constituencyId',
      formValue(
        input.constituencyId
      )
    );

    appendJsonArray(
      formData,
      'wardIds',
      input.wardIds
    );

    appendJsonArray(
      formData,
      'placeIds',
      []
    );

    appendJsonArray(
      formData,
      'places',
      []
    );

    formData.append(
      'timeInSelectedAreas',
      formValue(
        input.timeInSelectedAreas
      )
    );

    formData.append(
      'hasRealEstateExperience',
      formValue(
        input.hasRealEstateExperience
      )
    );

    appendJsonArray(
      formData,
      'experienceAreas',
      input.experienceAreas
    );

    formData.append(
      'experienceDuration',
      formValue(
        input.experienceDuration
      )
    );

    formData.append(
      'experienceDescription',
      formValue(
        input.experienceDescription
      )
    );

    formData.append(
      'currentOccupation',
      formValue(
        input.currentOccupation
      )
    );

    formData.append(
      'workingWithAnotherAgency',
      formValue(
        input.workingWithAnotherAgency
      )
    );

    formData.append(
      'currentAgencyName',
      formValue(
        input.currentAgencyName
      )
    );

    formData.append(
      'motivation',
      formValue(
        input.motivation
      )
    );

    formData.append(
      'contribution',
      formValue(
        input.contribution
      )
    );

    formData.append(
      'expectedPropertiesPerMonth',
      formValue(
        input.expectedPropertiesPerMonth
      )
    );

    appendJsonArray(
      formData,
      'propertySources',
      input.propertySources
    );

    formData.append(
      'knowsLandlords',
      formValue(
        input.knowsLandlords
      )
    );

    formData.append(
      'approximateLandlordCount',
      input.approximateLandlordCount ===
        null
        ? ''
        : String(
            input.approximateLandlordCount
          )
    );

    formData.append(
      'comfortableCommunicating',
      formValue(
        input.comfortableCommunicating
      )
    );

    appendJsonArray(
      formData,
      'communicationMethods',
      input.communicationMethods
    );

    formData.append(
      'timeAvailability',
      formValue(
        input.timeAvailability
      )
    );

    formData.append(
      'willingToFollowProcedures',
      formValue(
        input.willingToFollowProcedures
      )
    );

    formData.append(
      'referenceName',
      formValue(
        input.referenceName
      )
    );

    formData.append(
      'referencePhone',
      formValue(
        input.referencePhone
      )
    );

    formData.append(
      'referenceRelationship',
      formValue(
        input.referenceRelationship
      )
    );

    formData.append(
      'declarationAccepted',
      formValue(
        input.declarationAccepted
      )
    );

    const endpoint =
      `${API_BASE_URL}/marketer-applications`;

    let response: Response;

    try {
      response =
        await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
    } catch (error) {
      console.error(
        'Marketer application network error:',
        error
      );

      throw new Error(
        'Unable to connect to MAKAZII. Please check your internet connection and try again.'
      );
    }

    if (!response.ok) {
      const message =
        await getApiErrorMessage(
          response
        );

      if (
        response.status === 422
      ) {
        throw new Error(
          message ||
            'The identity document could not be verified. Please upload a clear, valid document.'
        );
      }

      throw new Error(
        message ||
          'Your marketer application could not be submitted.'
      );
    }

    let responseBody: any;

    try {
      responseBody =
        await response.json();
    } catch {
      throw new Error(
        'The server accepted the request but returned an invalid response.'
      );
    }

    const newApplication =
      normalizeBackendApplication(
        responseBody,
        input
      );

    if (!newApplication.id) {
      throw new Error(
        'The server did not return an application ID.'
      );
    }

    setApplications(
      (current) => {
        const withoutDuplicate =
          current.filter(
            (application) =>
              application.id !==
              newApplication.id
          );

        return [
          ...withoutDuplicate,
          newApplication,
        ];
      }
    );

    return newApplication;
  };

  /* =======================================================
     APPLICATION HELPERS
     ======================================================= */

  const getApplicationById = (
    id: string
  ): MarketerApplication | undefined => {
    return applications.find(
      (application) =>
        application.id === id
    );
  };

  const getApplicationsByStatus = (
    status: MarketerApplicationStatus
  ): MarketerApplication[] => {
    return applications.filter(
      (application) =>
        application.status ===
        status
    );
  };

  const getApplicationByEmail = (
    email: string
  ): MarketerApplication | undefined => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      return undefined;
    }

    const matchingApplications =
      applications.filter(
        (application) =>
          application.email
            .trim()
            .toLowerCase() ===
          normalizedEmail
      );

    if (
      matchingApplications.length ===
      0
    ) {
      return undefined;
    }

    return matchingApplications.reduce(
      (latest, application) =>
        new Date(
          application.submittedAt
        ).getTime() >
        new Date(
          latest.submittedAt
        ).getTime()
          ? application
          : latest
    );
  };

  const updateApplication = (
    id: string,
    changes: UpdateMarketerApplicationInput
  ) => {
    setApplications((current) =>
      current.map(
        (application) =>
          application.id === id
            ? {
                ...application,
                ...changes,
              }
            : application
      )
    );
  };

  const startApplicationReview = (
    id: string
  ) => {
    setApplications((current) =>
      current.map(
        (application) =>
          application.id === id
            ? {
                ...application,
                status:
                  'UNDER_REVIEW',
                reviewedAt:
                  getCurrentDateTime(),
                rejectionReason: '',
                requestedChanges: '',
              }
            : application
      )
    );
  };

  const requestApplicationChanges = (
    id: string,
    message: string
  ) => {
    const cleanMessage =
      message.trim();

    setApplications((current) =>
      current.map(
        (application) =>
          application.id === id
            ? {
                ...application,
                status:
                  'ACTION_REQUIRED',
                requestedChanges:
                  cleanMessage,
                reviewedAt:
                  getCurrentDateTime(),
                rejectionReason: '',
              }
            : application
      )
    );
  };

  const approveApplication = (
    id: string
  ): Marketer | undefined => {
    const application =
      applications.find(
        (item) =>
          item.id === id
      );

    if (!application) {
      return undefined;
    }

    if (
      application.idVerificationStatus ===
        'REJECTED' ||
      application.idVerificationStatus ===
        'REVIEW' ||
      application.idVerificationStatus ===
        'PENDING'
    ) {
      console.warn(
        'Application cannot be approved before identity verification is resolved.',
        {
          applicationId:
            application.id,
          idVerificationStatus:
            application.idVerificationStatus,
        }
      );

      return undefined;
    }

    if (
      application.status ===
        'APPROVED' &&
      application.marketerId
    ) {
      return marketers.find(
        (marketer) =>
          marketer.id ===
          application.marketerId
      );
    }

    const newMarketer: Marketer = {
      id: getNextMarketerId(
        marketers
      ),

      name:
        `${application.firstName} ${application.lastName}`.trim(),

      phone:
        application.phone.trim(),

      email:
        application.email.trim(),

      area:
        application.places.length >
        0
          ? application.places.join(
              ', '
            )
          : application.county,

      username:
        application.email.trim(),

      temporaryPassword: '',

      properties: 0,
      landlords: 0,
      viewings: 0,

      status: 'Active',
      portalAccess: true,

      joined: getCurrentDate(),

      experience:
        application.hasRealEstateExperience
          ? application
              .experienceDescription ||
            application.experienceAreas.join(
              ', '
            ) ||
            'Real estate experience'
          : 'New marketer',

      notes:
        application.contribution ||
        'Approved through marketer application.',

      applicationId:
        application.id,
    };

    setMarketers((current) => [
      ...current,
      newMarketer,
    ]);

    setApplications((current) =>
      current.map(
        (item) => {
          if (item.id !== id) {
            return item;
          }

          const now =
            getCurrentDateTime();

          return {
            ...item,

            status: 'APPROVED',

            marketerId:
              newMarketer.id,

            approvedAt: now,
            reviewedAt: now,

            rejectionReason: '',
            requestedChanges: '',
          };
        }
      )
    );

    return newMarketer;
  };

  const rejectApplication = (
    id: string,
    reason: string
  ) => {
    const cleanReason =
      reason.trim();

    setApplications((current) =>
      current.map(
        (application) => {
          if (
            application.id !== id
          ) {
            return application;
          }

          const now =
            getCurrentDateTime();

          return {
            ...application,

            status: 'REJECTED',

            rejectionReason:
              cleanReason,

            requestedChanges: '',

            reviewedAt: now,
            rejectedAt: now,
          };
        }
      )
    );
  };

  const resubmitApplication = (
    id: string
  ) => {
    setApplications((current) =>
      current.map(
        (application) =>
          application.id === id
            ? {
                ...application,

                status: 'PENDING',

                submittedAt:
                  getCurrentDateTime(),

                reviewedAt:
                  undefined,

                approvedAt:
                  undefined,

                rejectedAt:
                  undefined,

                rejectionReason: '',
                requestedChanges: '',

                idVerificationStatus:
                  'PENDING',

                idVerificationDecision:
                  null,

                idVerificationMessage:
                  null,

                idVerificationTransactionId:
                  null,

                idVerifiedAt: null,
              }
            : application
      )
    );
  };

  /* =======================================================
     CONTEXT VALUE
     ======================================================= */

  const value =
    useMemo<MarketerContextValue>(
      () => ({
        /* -------------------------------------------------
           Local/admin marketers
           ------------------------------------------------- */

        marketers,

        addMarketer,
        updateMarketer,

        approveMarketer,
        suspendMarketer,
        activateMarketer,

        getMarketerById,

        /* -------------------------------------------------
           Authenticated marketer
           ------------------------------------------------- */

        currentMarketer,

        isAuthenticated:
          Boolean(
            currentMarketer
          ),

        isLoading,

        refreshCurrentMarketer,

        updateMyProfile,
        createProfileChangeRequest,
        getMyProfileChangeRequests,

        getAllProfileChangeRequests,
        approveProfileChangeRequest,
        rejectProfileChangeRequest,

        logout,

        /* -------------------------------------------------
           Applications
           ------------------------------------------------- */

        applications,

        submitApplication,

        getApplicationById,
        getApplicationsByStatus,
        getApplicationByEmail,

        updateApplication,

        startApplicationReview,
        requestApplicationChanges,

        approveApplication,
        rejectApplication,
        resubmitApplication,
      }),
      [
        marketers,
        applications,
        currentMarketer,
        isLoading,
        refreshCurrentMarketer,
        updateMyProfile,
        createProfileChangeRequest,
        getMyProfileChangeRequests,
        getAllProfileChangeRequests,
        approveProfileChangeRequest,
        rejectProfileChangeRequest,
        logout,
      ]
    );

  return (
    <MarketerContext.Provider
      value={value}
    >
      {children}
    </MarketerContext.Provider>
  );
}

/* =========================================================
   HOOK
   ========================================================= */

export function useMarketers(): MarketerContextValue {
  const context =
    useContext(
      MarketerContext
    );

  if (!context) {
    throw new Error(
      'useMarketers must be used inside a MarketerProvider'
    );
  }

  return context;
}