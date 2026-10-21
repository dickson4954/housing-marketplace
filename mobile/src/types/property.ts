export type PropertyStatus =
  | 'draft'
  | 'under_review'
  | 'changes_required'
  | 'published'
  | 'rejected'
  | 'hidden'
  | 'archived';

export type PropertyAvailability =
  | 'available'
  | 'occupied'
  | 'temporarily_unavailable';

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected';

export type PropertyType =
  | 'Bedsitter'
  | 'Studio'
  | '1 Bedroom'
  | '2 Bedroom'
  | '3 Bedroom'
  | 'Other';

export type FurnishingStatus =
  | 'Furnished'
  | 'Unfurnished'
  | 'Partly Furnished';

export interface PropertyImage {
  id: string;
  uri: string;
  isCover: boolean;
  order: number;
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: string;
}

export interface PropertySource {
  type: 'landlord' | 'marketer' | 'internal';
  name?: string;
  phone?: string;
  notes?: string;
}

export interface PropertyLocation {
  county: string;
  town: string;
  area: string;
  landmark?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyLandlord {
  name: string;
  phone: string;
  email?: string;
}

export interface Property {
  id: string;

  /* Basic information */
  title: string;
  type: string;
  description: string;

  /* Pricing */
  rent: number;
  deposit: number;
  serviceCharge?: number;

  /*
   * Fee charged when a customer requests a physical viewing.
   *
   * This amount is configured by MAKAZII management/admin
   * or an authorized marketer.
   *
   * Customers only see the fee and do not edit it.
   */
  monthlyRent?: number;
viewingFee?: number;

  /* Short-stay / BNB pricing */
  dayRate?: number;
  nightRate?: number;
  dayNightRate?: number;
  stayMode?: string;
  purpose?: 'LONG_STAY' | 'SHORT_STAY' | string;

  /* Property specifications */
  bedrooms: number;
  bathrooms: number;

  /*
   * Short-stay / BNB specifications.
   */
  beds?: number;
  rooms?: number;
  maxGuests?: number;

  size?: number;
  floor?: number;
  totalFloors?: number;
  furnishing?: FurnishingStatus;

  /* Location */
  location: PropertyLocation;

  /* Facilities */
  amenities: string[];
  nearby: NearbyPlace[];

  /* Actual uploaded property video */
  videoUrl?: string | null;
  videoMimeType?: string | null;

  /* Images */
  images: PropertyImage[];

  /* Source */
  source?: PropertySource;

  /*
   * Internal landlord information.
   *
   * This is for MAKAZII management/marketers/admin.
   * It must never be displayed on customer-facing screens.
   */
  landlord?: PropertyLandlord;

  /*
   * Marketer who submitted the property.
   */
  marketerId?: string;
  marketerName?: string;

  /* Property features */
  parking?: boolean;
  waterAvailability?: string;
  electricity?: string;
  security?: string;

  /* Verification */
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedDate?: string;
  verificationNotes?: string;

  /*
   * Admin review information.
   */
  adminReviewNotes?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  publishedAt?: string;

  /* Availability */
  availability: PropertyAvailability;
  availableFrom?: string;

  /* Publishing */
  status: PropertyStatus;
  featured: boolean;

  /* Metadata */
  createdAt: string;
  updatedAt: string;
}