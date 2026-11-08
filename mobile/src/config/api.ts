const configuredApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL. Configure it in .env.local."
  );
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");

export const API_ENDPOINTS = {
  customerViewings: "/viewings",

  customerStayInspections: "/stay-inspections",

  customerStayBookings: "/stay-bookings",

  createStayBooking: "/stay-bookings",

  initiateStayBookingPayment: (bookingId: string) =>
    `/payments/bookings/${encodeURIComponent(bookingId)}`,

  initiateStayBookingBalancePayment: (bookingId: string) =>
    `/payments/bookings/${encodeURIComponent(bookingId)}/balance`,


  initiateInspectionPayment: (inspectionId: string) =>
    `/payments/inspections/${encodeURIComponent(inspectionId)}`,

  customerViewingById: (viewingId: string) =>
    `/viewings/${viewingId}`,

  initiateViewingPayment: (viewingId: string) =>
    `/payments/viewings/${viewingId}`,

  customerPaymentStatus: (paymentId: string) =>
    `/payments/${encodeURIComponent(paymentId)}`,

  /* =======================================================
  CUSTOMER AUTH
  ======================================================= */

  customerSignup:
    "/auth/customer/signup",

  customerLogin:
    "/auth/customer/login",

  customerVerifyEmail:
    "/auth/customer/verify-email",

  customerResendVerification:
    "/auth/customer/resend-verification",

  /* =======================================================
  ADMIN AUTH
  ======================================================= */

  adminLogin:
    "/auth/admin/login",

  /* =======================================================
  MARKETER AUTH
  ======================================================= */

  marketerLogin:
    "/auth/marketer/login",

  marketerMe:
    "/marketer/me",

  /* =======================================================
  GENERAL AUTH
  ======================================================= */

  me:
    "/auth/me",

  profile:
    "/auth/profile",

  changePassword:
    "/auth/change-password",

  forgotPassword:
    "/auth/forgot-password",

  resetPassword:
    "/auth/reset-password",

  /* =======================================================
  MARKETER PROFILE CHANGE REQUESTS
  ======================================================= */

  profileChangeRequest:
    "/auth/profile/change-request",

  profileChangeRequests:
    "/auth/profile/change-requests",

  /* =======================================================
  ADMIN
  ======================================================= */

  adminMarketers:
    "/admin/marketers",

  adminProperties:
    "/admin/properties",

  adminPropertyImages:
    "/admin/property-images",

  adminPropertyVideos:
    "/admin/property-videos",

  adminViewings:
    "/admin/viewings",

  adminStayBookings: "/admin/stay-bookings",

  adminStayBookingById: (bookingId: string) =>
    `/admin/stay-bookings/${encodeURIComponent(bookingId)}`,

  confirmAdminStayBooking: (bookingId: string) =>
    `/admin/stay-bookings/${encodeURIComponent(bookingId)}/confirm`,

  checkInAdminStayBooking: (bookingId: string) =>
    `/admin/stay-bookings/${encodeURIComponent(bookingId)}/check-in`,

  checkOutAdminStayBooking: (bookingId: string) =>
    `/admin/stay-bookings/${encodeURIComponent(bookingId)}/check-out`,

  completeAdminStayBooking: (bookingId: string) =>
    `/admin/stay-bookings/${encodeURIComponent(bookingId)}/complete`,

  adminUsers:
    "/admin/users",

  adminLandlords:
    "/admin/landlords",

  adminMarketerProfileChangeRequests:
    "/admin/marketers/profile-change-requests",

  /* =======================================================
  LANDLORD PROPERTIES
  ======================================================= */

  landlordProperties: "/landlord/properties",

  landlordViewings: "/landlord/viewings",

  marketerStayBookings: "/marketer/bookings",

  landlordStayBookings: "/landlord/bookings",

  landlordStayBookingById: (bookingId: string) =>
    `/landlord/bookings/${encodeURIComponent(bookingId)}`,

  confirmLandlordStayBooking: (bookingId: string) =>
    `/landlord/bookings/${encodeURIComponent(bookingId)}/confirm`,

  checkInLandlordStayBooking: (bookingId: string) =>
    `/landlord/bookings/${encodeURIComponent(bookingId)}/check-in`,

  checkOutLandlordStayBooking: (bookingId: string) =>
    `/landlord/bookings/${encodeURIComponent(bookingId)}/check-out`,

  landlordViewingById: (viewingId: string) =>
    `/landlord/viewings/${encodeURIComponent(viewingId)}`,


  landlordPropertyImages: "/landlord/property-images",

  landlordPropertyVideos: "/landlord/property-videos",

  landlordAmenities: "/landlord/amenities",

  /* =======================================================
  MARKETER PROPERTIES
  ======================================================= */

  marketerProperties:
    "/marketer/properties",

  marketerPropertyImages:
    "/marketer/property-images",

  marketerPropertyVideos:
    "/marketer/property-videos",

  marketerPropertyById: (propertyId: string) =>
    `/marketer/properties/${propertyId}`,

  marketerPropertyStatus: (propertyId: string) =>
    `/marketer/properties/${propertyId}/status`,

  marketerPropertyAvailability: (propertyId: string) =>
    `/marketer/properties/${propertyId}/availability`,

  marketerAmenities:
    "/marketer/amenities",

  /* =======================================================
  PUBLIC PROPERTIES
  ======================================================= */

  properties:
    "/properties",

  propertyById:
    (propertyId: string) =>
      `/properties/${propertyId}`,

  /* =======================================================
  CUSTOMER SHORTLIST
  ======================================================= */

  customerShortlist:
    "/customer/shortlist",

  customerShortlistByProperty:
    (propertyId: string) =>
      `/customer/shortlist/${propertyId}`,

  /* =======================================================
  PUBLIC GEOGRAPHY
  ======================================================= */

  geographyCounties:
    "/geography/counties",

  geographyConstituencies:
    (countyId: string) =>
      `/geography/counties/${countyId}/constituencies`,

  geographyWards:
    (constituencyId: string) =>
      `/geography/constituencies/${constituencyId}/wards`,

  geographyPlaces:
    (countyId: string) =>
      `/geography/counties/${countyId}/places`,

  /* =======================================================
  MARKETER APPLICATIONS
  ======================================================= */

  marketerApplications:
    "/marketer-applications",
} as const;
