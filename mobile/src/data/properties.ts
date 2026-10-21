export type PropertyType =
  | 'Single Room'
  | 'Bedsitter'
  | '1 Bedroom'
  | '2 Bedroom'
  | '3 Bedroom';

export type PropertyStatus = 'published' | 'draft' | 'unavailable';

export type NearbyPlace = {
  name: string;
  distance: string;
};

export type Property = {
  id: string;

  // Basic information
  title: string;
  type: PropertyType;
  description: string;

  // Location hierarchy
  county: string;
  town: string;
  area: string;

  // Pricing
  rent: number;
  deposit: number;
  serviceCharge: number;
  viewingFee?: number;

  // Property details
  bedrooms: number;
  bathrooms: number;
  size?: string;

  // Availability
  available: boolean;
  availableFrom?: string;

  // Features
  amenities: string[];

  // Property images
  images: string[];

  // Verification
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;

  // Viewing
  viewingAvailable: boolean;

  // Nearby places
  nearby: NearbyPlace[];

  // Future admin control
  status: PropertyStatus;
};

/*
|--------------------------------------------------------------------------
| MAKAZII PROPERTY DATA
|--------------------------------------------------------------------------
|
| This data is currently hardcoded for the mobile-app prototype.
|
| Later this will be replaced by data coming from:
|
| Admin Dashboard
|       ↓
| Backend API
|       ↓
| Database
|       ↓
| Customer Mobile App
|
| Each property has a unique ID so the exact property can be followed
| from Explore → Property Details → Request Viewing.
|
|--------------------------------------------------------------------------
*/

export const PROPERTIES: Property[] = [
  // ========================================================================
  // NAIROBI — KILIMANI
  // ========================================================================

  {
    id: 'nairobi-kilimani-bedsitter-001',
    title: 'Modern Bedsitter in Kilimani',
    type: 'Bedsitter',

    description:
      'A modern and comfortable bedsitter in Kilimani, located close to shopping centres, public transport and everyday amenities.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'Kilimani',

    rent: 18000,
    deposit: 18000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,
    size: 'Single unit',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Wi-Fi',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-10',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Yaya Centre',
        distance: '5 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
      {
        name: 'Shopping Centre',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'nairobi-kilimani-bedsitter-002',
    title: 'Bright Modern Bedsitter',
    type: 'Bedsitter',

    description:
      'A bright modern bedsitter with a comfortable living space and easy access to transport, shops and restaurants around Kilimani.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'Kilimani',

    rent: 20000,
    deposit: 20000,
    serviceCharge: 1000,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,
    size: 'Compact modern unit',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Wi-Fi',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-11',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Yaya Centre',
        distance: '6 min',
      },
      {
        name: 'Ngong Road',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // NAIROBI — KILELESHWA
  // ========================================================================

  {
    id: 'nairobi-kileleshwa-1br-001',
    title: 'Bright 1 Bedroom Apartment',
    type: '1 Bedroom',

    description:
      'A spacious one-bedroom apartment in Kileleshwa with a modern finish, secure compound and convenient access to major roads.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'Kileleshwa',

    rent: 28000,
    deposit: 28000,
    serviceCharge: 2000,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,
    size: '55 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Balcony',
      'Wardrobes',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-09',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Lavington Mall',
        distance: '7 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
      {
        name: 'Shopping Centre',
        distance: '5 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'nairobi-kileleshwa-2br-001',
    title: 'Spacious 2 Bedroom Home',
    type: '2 Bedroom',

    description:
      'A spacious two-bedroom apartment in Kileleshwa suitable for couples, small families or professionals looking for a convenient Nairobi home.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'Kileleshwa',

    rent: 42000,
    deposit: 42000,
    serviceCharge: 3000,
    viewingFee: 500,

    bedrooms: 2,
    bathrooms: 2,
    size: '85 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Balcony',
      'Wardrobes',
      'Hot Shower',
      'Borehole',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-08',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Lavington Mall',
        distance: '8 min',
      },
      {
        name: 'Public Transport',
        distance: '5 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // NAIROBI — SOUTH B
  // ========================================================================

  {
    id: 'nairobi-southb-2br-001',
    title: 'Family 2 Bedroom Apartment',
    type: '2 Bedroom',

    description:
      'A comfortable two-bedroom family apartment in South B with good access to schools, shopping centres and public transport.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'South B',

    rent: 35000,
    deposit: 35000,
    serviceCharge: 1500,
    viewingFee: 500,

    bedrooms: 2,
    bathrooms: 2,
    size: '80 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'CCTV',
      'Wardrobes',
      'Balcony',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-07',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Shopping Centre',
        distance: '4 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
      {
        name: 'School',
        distance: '8 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // NAIROBI — KASARANI
  // ========================================================================

  {
    id: 'nairobi-kasarani-singleroom-001',
    title: 'Affordable Room in Kasarani',
    type: 'Single Room',

    description:
      'An affordable single room in Kasarani suitable for someone looking for a simple and convenient place close to public transport and local shops.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'Kasarani',

    rent: 6000,
    deposit: 6000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-13',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Public Transport',
        distance: '2 min',
      },
      {
        name: 'Local Shops',
        distance: '3 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // NAIROBI — WESTLANDS
  // ========================================================================

  {
    id: 'nairobi-westlands-3br-001',
    title: 'Spacious 3 Bedroom Family Home',
    type: '3 Bedroom',

    description:
      'A spacious three-bedroom home in Westlands offering comfortable living spaces and convenient access to shopping, offices and transport.',

    county: 'Nairobi',
    town: 'Nairobi',
    area: 'Westlands',

    rent: 65000,
    deposit: 65000,
    serviceCharge: 4000,
    viewingFee: 500,

    bedrooms: 3,
    bathrooms: 3,
    size: '125 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Balcony',
      'Wardrobes',
      'Hot Shower',
      'Borehole',
      'Garden',
    ],

    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-06',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Westlands Mall',
        distance: '5 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
      {
        name: 'Office District',
        distance: '8 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // MERU — NCHIRU
  // ========================================================================

  {
    id: 'meru-nchiru-singleroom-001',
    title: 'Affordable Single Room in Nchiru',
    type: 'Single Room',

    description:
      'An affordable single room in Nchiru, suitable for someone looking for a convenient and budget-friendly home close to local shops and transport.',

    county: 'Meru',
    town: 'Meru',
    area: 'Nchiru',

    rent: 4500,
    deposit: 4500,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-12',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Public Transport',
        distance: '3 min',
      },
      {
        name: 'Local Shops',
        distance: '2 min',
      },
      {
        name: 'Market',
        distance: '7 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'meru-nchiru-singleroom-002',
    title: 'Clean Single Room Near Nchiru Centre',
    type: 'Single Room',

    description:
      'A clean and affordable single room located near Nchiru Centre with convenient access to transport and nearby businesses.',

    county: 'Meru',
    town: 'Meru',
    area: 'Nchiru',

    rent: 5000,
    deposit: 5000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-12',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Nchiru Centre',
        distance: '4 min',
      },
      {
        name: 'Public Transport',
        distance: '2 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'meru-nchiru-bedsitter-001',
    title: 'Clean Bedsitter in Nchiru',
    type: 'Bedsitter',

    description:
      'A clean and comfortable bedsitter located in Nchiru with convenient access to shops, transport and everyday services.',

    county: 'Meru',
    town: 'Meru',
    area: 'Nchiru',

    rent: 7000,
    deposit: 7000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Self Contained',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-12',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Local Shops',
        distance: '2 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'meru-nchiru-bedsitter-002',
    title: 'Spacious Bedsitter in Nchiru',
    type: 'Bedsitter',

    description:
      'A spacious bedsitter in Nchiru with a comfortable layout, secure compound and easy access to public transport.',

    county: 'Meru',
    town: 'Meru',
    area: 'Nchiru',

    rent: 7500,
    deposit: 7500,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-13',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Local Shops',
        distance: '3 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // MERU — KIANJAI
  // ========================================================================

  {
    id: 'meru-kianjai-singleroom-001',
    title: 'Affordable Single Room in Kianjai',
    type: 'Single Room',

    description:
      'A simple and affordable single room in Kianjai with convenient access to shops and public transport.',

    county: 'Meru',
    town: 'Meru',
    area: 'Kianjai',

    rent: 4000,
    deposit: 4000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-13',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Kianjai Centre',
        distance: '3 min',
      },
      {
        name: 'Public Transport',
        distance: '2 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'meru-kianjai-bedsitter-001',
    title: 'Modern Bedsitter in Kianjai',
    type: 'Bedsitter',

    description:
      'A modern bedsitter in Kianjai offering a comfortable living space in a convenient location close to shops and transport.',

    county: 'Meru',
    town: 'Meru',
    area: 'Kianjai',

    rent: 7000,
    deposit: 7000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-13',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Kianjai Centre',
        distance: '4 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'meru-kianjai-1br-001',
    title: 'Comfortable 1 Bedroom in Kianjai',
    type: '1 Bedroom',

    description:
      'A comfortable one-bedroom home in Kianjai suitable for an individual or couple looking for a little more living space.',

    county: 'Meru',
    town: 'Meru',
    area: 'Kianjai',

    rent: 10000,
    deposit: 10000,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Wardrobes',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-14',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Kianjai Centre',
        distance: '5 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // MOMBASA — NYALI
  // ========================================================================

  {
    id: 'mombasa-nyali-1br-001',
    title: 'Coastal 1 Bedroom Apartment',
    type: '1 Bedroom',

    description:
      'A comfortable one-bedroom apartment in Nyali with a modern coastal feel and convenient access to shopping, transport and the beach.',

    county: 'Mombasa',
    town: 'Mombasa',
    area: 'Nyali',

    rent: 22000,
    deposit: 22000,
    serviceCharge: 1500,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,
    size: '55 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Balcony',
      'Hot Shower',
      'Wardrobes',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-11',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Nyali Beach',
        distance: '8 min',
      },
      {
        name: 'Nyali Centre',
        distance: '5 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'mombasa-nyali-2br-001',
    title: 'Modern 2 Bedroom Apartment in Nyali',
    type: '2 Bedroom',

    description:
      'A modern two-bedroom apartment in Nyali with spacious interiors and convenient access to shopping and coastal attractions.',

    county: 'Mombasa',
    town: 'Mombasa',
    area: 'Nyali',

    rent: 35000,
    deposit: 35000,
    serviceCharge: 2500,
    viewingFee: 500,

    bedrooms: 2,
    bathrooms: 2,
    size: '90 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'CCTV',
      'Parking',
      'Balcony',
      'Wardrobes',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-10',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Nyali Centre',
        distance: '5 min',
      },
      {
        name: 'Nyali Beach',
        distance: '10 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // MOMBASA — BAMBURI
  // ========================================================================

  {
    id: 'mombasa-bamburi-3br-001',
    title: 'Family Home in Bamburi',
    type: '3 Bedroom',

    description:
      'A spacious three-bedroom family home in Bamburi with comfortable living areas and easy access to schools, shops and transport.',

    county: 'Mombasa',
    town: 'Mombasa',
    area: 'Bamburi',

    rent: 30000,
    deposit: 30000,
    serviceCharge: 1000,
    viewingFee: 500,

    bedrooms: 3,
    bathrooms: 2,
    size: '110 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Wardrobes',
      'Hot Shower',
      'Borehole',
      'Garden',
    ],

    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-09',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Bamburi Beach',
        distance: '10 min',
      },
      {
        name: 'Local Shopping Centre',
        distance: '5 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // KISUMU — MILIMANI
  // ========================================================================

  {
    id: 'kisumu-milimani-2br-001',
    title: 'Family 2 Bedroom Apartment',
    type: '2 Bedroom',

    description:
      'A comfortable two-bedroom apartment in Milimani, Kisumu, suitable for families and professionals looking for a quiet and convenient location.',

    county: 'Kisumu',
    town: 'Kisumu',
    area: 'Milimani',

    rent: 25000,
    deposit: 25000,
    serviceCharge: 1000,
    viewingFee: 500,

    bedrooms: 2,
    bathrooms: 2,
    size: '85 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'CCTV',
      'Balcony',
      'Wardrobes',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-08',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Kisumu CBD',
        distance: '8 min',
      },
      {
        name: 'Shopping Centre',
        distance: '5 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'kisumu-milimani-1br-001',
    title: 'Modern 1 Bedroom Home',
    type: '1 Bedroom',

    description:
      'A modern one-bedroom home in Milimani with a comfortable layout and convenient access to Kisumu town.',

    county: 'Kisumu',
    town: 'Kisumu',
    area: 'Milimani',

    rent: 18000,
    deposit: 18000,
    serviceCharge: 1000,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Wardrobes',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-08',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Kisumu CBD',
        distance: '7 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // NAKURU — MILIMANI
  // ========================================================================

  {
    id: 'nakuru-milimani-3br-001',
    title: 'Spacious 3 Bedroom Home',
    type: '3 Bedroom',

    description:
      'A spacious three-bedroom home in Milimani, Nakuru, suitable for families looking for a comfortable and convenient residential location.',

    county: 'Nakuru',
    town: 'Nakuru',
    area: 'Milimani',

    rent: 35000,
    deposit: 35000,
    serviceCharge: 1500,
    viewingFee: 500,

    bedrooms: 3,
    bathrooms: 2,
    size: '120 sqm',

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'CCTV',
      'Garden',
      'Wardrobes',
      'Hot Shower',
      'Borehole',
    ],

    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-07',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Nakuru CBD',
        distance: '8 min',
      },
      {
        name: 'Shopping Centre',
        distance: '5 min',
      },
      {
        name: 'School',
        distance: '6 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'nakuru-milimani-2br-001',
    title: 'Comfortable 2 Bedroom Apartment',
    type: '2 Bedroom',

    description:
      'A comfortable two-bedroom apartment in Milimani, Nakuru with secure parking and convenient access to town.',

    county: 'Nakuru',
    town: 'Nakuru',
    area: 'Milimani',

    rent: 28000,
    deposit: 28000,
    serviceCharge: 1000,
    viewingFee: 500,

    bedrooms: 2,
    bathrooms: 2,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'CCTV',
      'Wardrobes',
      'Hot Shower',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-07',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Nakuru CBD',
        distance: '7 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
    ],

    status: 'published',
  },

  // ========================================================================
  // ELDORET — PIONEER
  // ========================================================================

  {
    id: 'eldoret-pioneer-bedsitter-001',
    title: 'Modern Bedsitter in Eldoret',
    type: 'Bedsitter',

    description:
      'A modern and affordable bedsitter in Pioneer, Eldoret with easy access to transport, shops and essential services.',

    county: 'Uasin Gishu',
    town: 'Eldoret',
    area: 'Pioneer',

    rent: 8500,
    deposit: 8500,
    serviceCharge: 0,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-06',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Eldoret CBD',
        distance: '7 min',
      },
      {
        name: 'Public Transport',
        distance: '3 min',
      },
    ],

    status: 'published',
  },

  {
    id: 'eldoret-pioneer-1br-001',
    title: 'Affordable 1 Bedroom in Pioneer',
    type: '1 Bedroom',

    description:
      'A comfortable one-bedroom apartment in Pioneer, Eldoret suitable for an individual or couple.',

    county: 'Uasin Gishu',
    town: 'Eldoret',
    area: 'Pioneer',

    rent: 12000,
    deposit: 12000,
    serviceCharge: 500,
    viewingFee: 500,

    bedrooms: 1,
    bathrooms: 1,

    available: true,
    availableFrom: 'Immediately',

    amenities: [
      'Water',
      'Electricity',
      'Security',
      'Parking',
      'Wardrobes',
      'Hot Shower',
      'Self Contained',
    ],

    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77',
    ],

    verified: true,
    verifiedBy: 'Makazii Team',
    verifiedDate: '2026-09-06',

    viewingAvailable: true,

    nearby: [
      {
        name: 'Eldoret CBD',
        distance: '8 min',
      },
      {
        name: 'Public Transport',
        distance: '4 min',
      },
    ],

    status: 'published',
  },
];

/*
|--------------------------------------------------------------------------
| HELPER FUNCTIONS
|--------------------------------------------------------------------------
*/

export const getPropertyById = (
  id: string | string[] | undefined,
): Property | undefined => {
  if (!id) return undefined;

  const propertyId = Array.isArray(id) ? id[0] : id;

  return PROPERTIES.find((property) => property.id === propertyId);
};

export const getPropertiesByCounty = (county: string): Property[] => {
  return PROPERTIES.filter(
    (property) =>
      property.county.toLowerCase() === county.toLowerCase(),
  );
};

export const getPropertiesByTown = (town: string): Property[] => {
  return PROPERTIES.filter(
    (property) =>
      property.town.toLowerCase() === town.toLowerCase(),
  );
};

export const getPropertiesByArea = (area: string): Property[] => {
  return PROPERTIES.filter(
    (property) =>
      property.area.toLowerCase() === area.toLowerCase(),
  );
};

export const getPropertiesByType = (
  type: PropertyType,
): Property[] => {
  return PROPERTIES.filter(
    (property) => property.type === type,
  );
};

export const getPropertiesByAreaAndType = (
  area: string,
  type: PropertyType,
): Property[] => {
  return PROPERTIES.filter(
    (property) =>
      property.area.toLowerCase() === area.toLowerCase() &&
      property.type === type,
  );
};

export const getPublishedProperties = (): Property[] => {
  return PROPERTIES.filter(
    (property) =>
      property.status === 'published' &&
      property.available,
  );
};
