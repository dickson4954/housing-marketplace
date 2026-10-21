import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/config/api';

import type {
  Property,
  PropertyAvailability,
  PropertyImage,
  PropertyStatus,
  VerificationStatus,
} from '@/types/property';

type PropertyContextValue = {
  properties: Property[];

  getPropertyById: (id: string) => Property | undefined;
  getPublishedProperties: () => Property[];
  getAvailableProperties: () => Property[];

  createProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  savePropertyDraft: (
    property: Property,
  ) => void;

  submitPropertyForReview: (
    id: string,
  ) => void;

  approveProperty: (
    id: string,
    notes?: string,
  ) => void;

  requestPropertyChanges: (
    id: string,
    notes: string,
  ) => void;

  rejectProperty: (
    id: string,
    notes: string,
  ) => void;

  publishProperty: (id: string) => void;
  unpublishProperty: (id: string) => void;

  setAvailability: (
    id: string,
    availability: PropertyAvailability,
  ) => void;

  setVerificationStatus: (
    id: string,
    status: VerificationStatus,
    notes?: string,
  ) => void;

  addPropertyImage: (
    id: string,
    image: PropertyImage,
  ) => void;

  removePropertyImage: (
    id: string,
    imageId: string,
  ) => void;

  setCoverImage: (
    id: string,
    imageId: string,
  ) => void;

  reorderPropertyImages: (
    id: string,
    images: PropertyImage[],
  ) => void;

  featuredProperty: (
    id: string,
    featured: boolean,
  ) => void;
};

const PropertyContext =
  createContext<PropertyContextValue | undefined>(
    undefined,
  );

function normalizeBackendProperty(
  property: any,
): Property {
  const backendImages = Array.isArray(property?.images)
    ? property.images
    : [];

  const images: PropertyImage[] =
    backendImages.map(
      (image: any, index: number) => ({
        id: String(
          image?.id ??
            `${property?.id ?? 'property'}-image-${index}`,
        ),
        uri:
          image?.url ??
          image?.uri ??
          '',
        isCover: Boolean(
          image?.isPrimary ??
            image?.isCover ??
            index === 0,
        ),
        order: Number(
          image?.sortOrder ??
            image?.order ??
            index,
        ),
      }),
    );

  const backendAmenities = Array.isArray(
    property?.amenities,
  )
    ? property.amenities
    : [];

  const amenities = backendAmenities
    .map((amenity: any) =>
      typeof amenity === 'string'
        ? amenity
        : amenity?.name ?? '',
    )
    .filter(Boolean);

  const county =
    property?.county?.name ??
    property?.county ??
    '';

  const town =
    property?.town?.name ??
    property?.town ??
    '';

  const area =
    property?.area?.name ??
    property?.area ??
    property?.place?.name ??
    '';

  const purpose = String(
    property?.purpose ?? '',
  ).toUpperCase();

  const propertyType =
    property?.longStayType ??
    property?.shortStayType ??
    property?.type ??
    (purpose === 'SHORT_STAY'
      ? 'Short Stay'
      : 'Other');

  const furnishingRaw =
    property?.furnishing;

  const furnishing =
    furnishingRaw === 'FURNISHED'
      ? 'Furnished'
      : furnishingRaw === 'UNFURNISHED'
        ? 'Unfurnished'
        : furnishingRaw === 'PARTLY_FURNISHED'
          ? 'Partly Furnished'
          : undefined;

  const backendStatus = String(
    property?.status ?? '',
  ).toUpperCase();

  const status: PropertyStatus =
    backendStatus === 'ACTIVE' ||
    backendStatus === 'PUBLISHED'
      ? 'published'
      : backendStatus === 'CHANGES_REQUIRED'
        ? 'changes_required'
        : backendStatus === 'UNDER_REVIEW'
          ? 'under_review'
          : backendStatus === 'REJECTED'
            ? 'rejected'
            : backendStatus === 'HIDDEN'
              ? 'hidden'
              : 'draft';

  const availability: PropertyAvailability =
    property?.available === true
      ? 'available'
      : property?.available === false
        ? 'occupied'
        : 'temporarily_unavailable';

  const marketer =
    property?.marketer ??
    property?.source?.marketer ??
    undefined;

  const marketerId =
    property?.marketerId ??
    marketer?.id ??
    undefined;

  const marketerName =
    property?.marketerName ??
    marketer?.name ??
    marketer?.user?.name ??
    undefined;

  const sourceType =
    property?.source?.type ??
    (marketerId
      ? 'marketer'
      : undefined);

  const source =
    sourceType
      ? {
          type: sourceType,
          name:
            property?.source?.name ??
            marketerName,
          phone:
            property?.source?.phone ??
            marketer?.phone,
          notes:
            property?.source?.notes,
        }
      : undefined;

  const verified =
    property?.verified === true ||
    String(
      property?.verificationStatus ?? '',
    ).toLowerCase() === 'verified';

  return {
    id: String(property?.id ?? ''),
    title: property?.title ?? '',
    type: String(propertyType),
    description:
      property?.description ?? '',

    rent: Number(
      property?.monthlyRent ??
        property?.rent ??
        0,
    ),

    deposit: Number(
      property?.deposit ?? 0,
    ),

    serviceCharge:
      property?.serviceCharge == null
        ? undefined
        : Number(
            property.serviceCharge,
          ),

    viewingFee:
      property?.viewingFee == null
        ? undefined
        : Number(
            property.viewingFee,
          ),

    dayRate:
      property?.dayRate == null
        ? undefined
        : Number(property.dayRate),

    nightRate:
      property?.nightRate == null
        ? undefined
        : Number(property.nightRate),

    dayNightRate:
      property?.dayNightRate == null
        ? undefined
        : Number(property.dayNightRate),

    stayMode:
      property?.stayMode ?? undefined,

    purpose:
      property?.purpose ?? undefined,

    bedrooms: Number(
      property?.bedrooms ?? 0,
    ),

    bathrooms: Number(
      property?.bathrooms ?? 0,
    ),

    beds:
      property?.beds == null
        ? undefined
        : Number(property.beds),

    rooms:
      property?.rooms == null
        ? undefined
        : Number(property.rooms),

    maxGuests:
      property?.maxGuests == null
        ? undefined
        : Number(
            property.maxGuests,
          ),

    furnishing,

    location: {
      county,
      town,
      area,
      landmark:
        property?.landmark ??
        undefined,
      address:
        property?.address ??
        undefined,
      latitude:
        property?.latitude == null
          ? undefined
          : Number(
              property.latitude,
            ),
      longitude:
        property?.longitude == null
          ? undefined
          : Number(
              property.longitude,
            ),
    },

    amenities,
    nearby: [],

    images,

    videoUrl: property?.videoUrl ?? undefined,
    videoMimeType: property?.videoMimeType ?? undefined,

    source,

    marketerId,
    marketerName,

    parking:
      property?.parking == null
        ? undefined
        : Boolean(property.parking),

    waterAvailability:
      property?.waterAvailability ??
      undefined,

    electricity:
      property?.electricity ??
      undefined,

    security:
      property?.security ??
      undefined,

    verificationStatus:
      property?.verificationStatus ===
        'rejected' ||
      property?.verificationStatus ===
        'REJECTED'
        ? 'rejected'
        : verified
          ? 'verified'
          : 'pending',

    verifiedBy:
      property?.verifiedBy ??
      undefined,

    verifiedDate:
      property?.verifiedDate ??
      undefined,

    verificationNotes:
      property?.verificationNotes ??
      undefined,

    adminReviewNotes:
      property?.adminReviewNotes ??
      undefined,

    submittedAt:
      property?.submittedAt ??
      undefined,

    approvedAt:
      property?.approvedAt ??
      undefined,

    rejectedAt:
      property?.rejectedAt ??
      undefined,

    publishedAt:
      property?.publishedAt ??
      undefined,

    availability,

    availableFrom:
      property?.availableFrom ??
      undefined,

    status,

    featured: Boolean(
      property?.featured ??
        property?.isFeatured ??
        false,
    ),

    createdAt:
      property?.createdAt ??
      new Date().toISOString(),

    updatedAt:
      property?.updatedAt ??
      new Date().toISOString(),
  };
}

async function fetchPropertiesFromBackend(): Promise<
  Property[]
> {
  const response = await fetch(
    `${API_BASE_URL}/properties`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load properties (${response.status})`,
    );
  }

  const payload = await response.json();

  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.properties)
        ? payload.properties
        : [];

  return records
    .filter(
      (property: any) =>
        property && property.id,
    )
    .map(normalizeBackendProperty);
}

export function PropertyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    properties,
    setProperties,
  ] = useState<Property[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadProperties =
      async () => {
        try {
          const backendProperties =
            await fetchPropertiesFromBackend();

          if (!cancelled) {
            setProperties(
              backendProperties,
            );
          }
        } catch (error) {
          console.error(
            'Failed to load MAKAZII properties:',
            error,
          );

          if (!cancelled) {
            setProperties([]);
          }
        }
      };

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  const getPropertyById =
    useCallback(
      (id: string) => {
        return properties.find(
          (property) =>
            property.id === id,
        );
      },
      [properties],
    );

  /*
   * Customer-facing published properties.
   *
   * Only published + available properties
   * are returned here.
   */
  const getPublishedProperties =
    useCallback(() => {
      return properties.filter(
        (property) =>
          property.status ===
            'published' &&
          property.availability ===
            'available',
      );
    }, [properties]);

  const getAvailableProperties =
    useCallback(() => {
      return properties.filter(
        (property) =>
          property.availability ===
          'available',
      );
    }, [properties]);

  const createProperty =
    useCallback(
      (property: Property) => {
        setProperties((current) => [
          property,
          ...current,
        ]);
      },
      [],
    );

  const updateProperty =
    useCallback(
      (
        id: string,
        updates: Partial<Property>,
      ) => {
        setProperties((current) =>
          current.map((property) =>
            property.id === id
              ? {
                  ...property,
                  ...updates,
                  updatedAt:
                    new Date().toISOString(),
                }
              : property,
          ),
        );
      },
      [],
    );

  const deleteProperty =
    useCallback((id: string) => {
      setProperties((current) =>
        current.filter(
          (property) =>
            property.id !== id,
        ),
      );
    }, []);

  /*
   * Save a property as a draft.
   */
  const savePropertyDraft =
    useCallback(
      (property: Property) => {
        setProperties((current) => {
          const exists =
            current.some(
              (item) =>
                item.id === property.id,
            );

          if (exists) {
            return current.map(
              (item) =>
                item.id === property.id
                  ? {
                      ...item,
                      ...property,
                      status: 'draft',
                      updatedAt:
                        new Date().toISOString(),
                    }
                  : item,
            );
          }

          return [
            {
              ...property,
              status: 'draft',
              updatedAt:
                new Date().toISOString(),
            },
            ...current,
          ];
        });
      },
      [],
    );

  /*
   * Marketer submits a draft for admin review.
   */
  const submitPropertyForReview =
    useCallback((id: string) => {
      setProperties((current) =>
        current.map((property) =>
          property.id === id
            ? {
                ...property,
                status:
                  'under_review',
                verificationStatus:
                  'pending',
                submittedAt:
                  new Date().toISOString(),
                updatedAt:
                  new Date().toISOString(),
              }
            : property,
        ),
      );
    }, []);

  /*
   * Admin approves and publishes.
   */
  const approveProperty =
    useCallback(
      (
        id: string,
        notes?: string,
      ) => {
        setProperties((current) =>
          current.map(
            (property) =>
              property.id === id
                ? {
                    ...property,
                    status:
                      'published',
                    verificationStatus:
                      'verified',
                    verificationNotes:
                      notes ??
                      property.verificationNotes,
                    adminReviewNotes:
                      notes ??
                      property.adminReviewNotes,
                    verifiedBy:
                      'Makazii Admin',
                    verifiedDate:
                      new Date().toISOString(),
                    approvedAt:
                      new Date().toISOString(),
                    publishedAt:
                      new Date().toISOString(),
                    updatedAt:
                      new Date().toISOString(),
                  }
                : property,
          ),
        );
      },
      [],
    );

  /*
   * Admin requests changes.
   */
  const requestPropertyChanges =
    useCallback(
      (
        id: string,
        notes: string,
      ) => {
        setProperties((current) =>
          current.map(
            (property) =>
              property.id === id
                ? {
                    ...property,
                    status:
                      'changes_required',
                    verificationStatus:
                      'pending',
                    adminReviewNotes:
                      notes,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : property,
          ),
        );
      },
      [],
    );

  /*
   * Admin rejects the property.
   */
  const rejectProperty =
    useCallback(
      (
        id: string,
        notes: string,
      ) => {
        setProperties((current) =>
          current.map(
            (property) =>
              property.id === id
                ? {
                    ...property,
                    status:
                      'rejected',
                    verificationStatus:
                      'rejected',
                    adminReviewNotes:
                      notes,
                    rejectedAt:
                      new Date().toISOString(),
                    updatedAt:
                      new Date().toISOString(),
                  }
                : property,
          ),
        );
      },
      [],
    );

  /*
   * Admin-only publishing method.
   */
  const publishProperty =
    useCallback((id: string) => {
      setProperties((current) =>
        current.map((property) =>
          property.id === id
            ? {
                ...property,
                status:
                  'published',
                publishedAt:
                  new Date().toISOString(),
                updatedAt:
                  new Date().toISOString(),
              }
            : property,
        ),
      );
    }, []);

  const unpublishProperty =
    useCallback((id: string) => {
      setProperties((current) =>
        current.map((property) =>
          property.id === id
            ? {
                ...property,
                status: 'hidden',
                updatedAt:
                  new Date().toISOString(),
              }
            : property,
        ),
      );
    }, []);

  const setAvailability =
    useCallback(
      (
        id: string,
        availability: PropertyAvailability,
      ) => {
        setProperties((current) =>
          current.map((property) =>
            property.id === id
              ? {
                  ...property,
                  availability,
                  updatedAt:
                    new Date().toISOString(),
                }
              : property,
          ),
        );
      },
      [],
    );

  const setVerificationStatus =
    useCallback(
      (
        id: string,
        status: VerificationStatus,
        notes?: string,
      ) => {
        setProperties((current) =>
          current.map((property) => {
            if (
              property.id !== id
            ) {
              return property;
            }

            return {
              ...property,
              verificationStatus:
                status,
              verificationNotes:
                notes ??
                property.verificationNotes,
              verifiedBy:
                status === 'verified'
                  ? property.verifiedBy ??
                    'Makazii Team'
                  : property.verifiedBy,
              verifiedDate:
                status === 'verified'
                  ? new Date().toISOString()
                  : property.verifiedDate,
              updatedAt:
                new Date().toISOString(),
            };
          }),
        );
      },
      [],
    );

  const addPropertyImage =
    useCallback(
      (
        id: string,
        image: PropertyImage,
      ) => {
        setProperties((current) =>
          current.map((property) => {
            if (
              property.id !== id
            ) {
              return property;
            }

            const nextOrder =
              property.images.length;

            const newImage: PropertyImage =
              {
                ...image,
                order: nextOrder,
                isCover:
                  property.images
                    .length === 0
                    ? true
                    : image.isCover,
              };

            let images = [
              ...property.images,
              newImage,
            ];

            if (newImage.isCover) {
              images = images.map(
                (item) => ({
                  ...item,
                  isCover:
                    item.id ===
                    newImage.id,
                }),
              );
            }

            return {
              ...property,
              images,
              updatedAt:
                new Date().toISOString(),
            };
          }),
        );
      },
      [],
    );

  const removePropertyImage =
    useCallback(
      (
        id: string,
        imageId: string,
      ) => {
        setProperties((current) =>
          current.map((property) => {
            if (
              property.id !== id
            ) {
              return property;
            }

            const wasCover =
              property.images.some(
                (image) =>
                  image.id ===
                    imageId &&
                  image.isCover,
              );

            let images =
              property.images
                .filter(
                  (image) =>
                    image.id !==
                    imageId,
                )
                .map(
                  (
                    image,
                    index,
                  ) => ({
                    ...image,
                    order: index,
                  }),
                );

            if (
              wasCover &&
              images.length > 0
            ) {
              images =
                images.map(
                  (
                    image,
                    index,
                  ) => ({
                    ...image,
                    isCover:
                      index === 0,
                  }),
                );
            }

            return {
              ...property,
              images,
              updatedAt:
                new Date().toISOString(),
            };
          }),
        );
      },
      [],
    );

  const setCoverImage =
    useCallback(
      (
        id: string,
        imageId: string,
      ) => {
        setProperties((current) =>
          current.map((property) => {
            if (
              property.id !== id
            ) {
              return property;
            }

            return {
              ...property,
              images:
                property.images.map(
                  (image) => ({
                    ...image,
                    isCover:
                      image.id ===
                      imageId,
                  }),
                ),
              updatedAt:
                new Date().toISOString(),
            };
          }),
        );
      },
      [],
    );

  const reorderPropertyImages =
    useCallback(
      (
        id: string,
        images: PropertyImage[],
      ) => {
        setProperties((current) =>
          current.map((property) => {
            if (
              property.id !== id
            ) {
              return property;
            }

            return {
              ...property,
              images: images.map(
                (
                  image,
                  index,
                ) => ({
                  ...image,
                  order: index,
                }),
              ),
              updatedAt:
                new Date().toISOString(),
            };
          }),
        );
      },
      [],
    );

  const featuredProperty =
    useCallback(
      (
        id: string,
        featured: boolean,
      ) => {
        setProperties((current) =>
          current.map((property) =>
            property.id === id
              ? {
                  ...property,
                  featured,
                  updatedAt:
                    new Date().toISOString(),
                }
              : property,
          ),
        );
      },
      [],
    );

  const value =
    useMemo<PropertyContextValue>(
      () => ({
        properties,
        getPropertyById,
        getPublishedProperties,
        getAvailableProperties,

        createProperty,
        updateProperty,
        deleteProperty,

        savePropertyDraft,
        submitPropertyForReview,

        approveProperty,
        requestPropertyChanges,
        rejectProperty,

        publishProperty,
        unpublishProperty,

        setAvailability,
        setVerificationStatus,

        addPropertyImage,
        removePropertyImage,
        setCoverImage,
        reorderPropertyImages,

        featuredProperty,
      }),
      [
        properties,
        getPropertyById,
        getPublishedProperties,
        getAvailableProperties,

        createProperty,
        updateProperty,
        deleteProperty,

        savePropertyDraft,
        submitPropertyForReview,

        approveProperty,
        requestPropertyChanges,
        rejectProperty,

        publishProperty,
        unpublishProperty,

        setAvailability,
        setVerificationStatus,

        addPropertyImage,
        removePropertyImage,
        setCoverImage,
        reorderPropertyImages,

        featuredProperty,
      ],
    );

  return (
    <PropertyContext.Provider
      value={value}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const context =
    useContext(PropertyContext);

  if (!context) {
    throw new Error(
      'useProperties must be used inside PropertyProvider',
    );
  }

  return context;
}

