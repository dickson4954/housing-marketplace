import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Wallet,
  XCircle,
} from 'lucide-react-native';

import { useViewing } from '@/context/ViewingContext';
import { useFeedback } from '@/context/FeedbackContext';
import StayBookingsSection from '@/components/StayBookingsSection';
import type { Property } from '@/types/property';

const COLORS = {
  background: '#0B0F10',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  border: '#252C2E',

  danger: '#FF6B6B',
  dangerSoft: '#351D20',

  success: '#8BE28B',
  successSoft: '#183128',

  warning: '#FFD166',
  warningSoft: '#342818',

  blue: '#72B7FF',
  blueSoft: '#182A3B',

  green: '#62D39B',
  greenSoft: '#183128',
};

function formatCurrency(amount: number | undefined | null) {
  return `KSh ${(amount ?? 0).toLocaleString()}`;
}

function getPropertyImage(property: Property) {
  const images = [...(property.images ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const coverImage =
    images.find((image) => image.isCover) ?? images[0];

  return coverImage?.uri ?? '';
}

function getPropertyLocation(property: Property) {
  const area = property.location?.area?.trim();
  const town = property.location?.town?.trim();
  const county = property.location?.county?.trim();

  if (area && town) {
    return `${area}, ${town}`;
  }

  return town || area || county || 'Kenya';
}

function getPropertyFromViewing(property: unknown): Property | null {
  if (
    property &&
    typeof property === 'object' &&
    'id' in property &&
    'title' in property
  ) {
    return property as Property;
  }

  return null;
}

function getRequestTypeLabel(requestType: string | undefined) {
  if (requestType === 'view_and_rent') {
    return 'View & Rent';
  }

  return 'View Only';
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'Payment Pending':
      return 'Payment Pending';

    case 'Payment Received':
      return 'Payment Received';

    case 'Awaiting Representative':
      return 'Awaiting Representative';

    case 'Representative Assigned':
      return 'Representative Assigned';

    case 'Approved':
      return 'Approved';

    case 'Rescheduled':
      return 'Rescheduled';

    case 'Confirmed':
      return 'Approved';

    case 'Completed':
      return 'Completed';

    case 'Cancelled':
      return 'Cancelled';

    default:
      return status;
  }
}

function getStatusDescription(status: string) {
  switch (status) {
    case 'Payment Pending':
      return 'Your viewing request is waiting for the viewing fee payment to be completed.';

    case 'Payment Received':
      return 'Your viewing fee has been received. MAKAZII is processing your viewing request.';

    case 'Awaiting Representative':
      return 'Your payment is confirmed. MAKAZII is arranging the representative for this property.';

    case 'Representative Assigned':
      return 'A representative has been assigned to your viewing. Their contact details are now available below.';

    case 'Approved':
      return 'Your representative has approved the scheduled viewing appointment.';

    case 'Rescheduled':
      return 'Your representative selected a different appointment time. See the scheduled appointment below.';

    case 'Confirmed':
      return 'Your viewing has been approved. Your MAKAZII representative can contact you.';

    case 'Completed':
      return 'This viewing has been completed. You can now share your feedback.';

    case 'Cancelled':
      return 'This viewing request has been cancelled.';

    default:
      return 'Your viewing request is being processed.';
  }
}

export default function VisitsScreen() {
  const [activeSection, setActiveSection] = useState<'STAYS' | 'VISITS'>('STAYS');
  const {
    viewingRequests,
    refreshViewings,
  } = useViewing();

  useFocusEffect(
    useCallback(() => {
      refreshViewings().catch((error) => {
        console.error('Failed to refresh visits:', error);
      });
    }, [refreshViewings]),
  );

  const {
    hasRatingForViewing,
  } = useFeedback();

  const handleCallRepresentative = async (phone: string) => {
    const cleanedPhone = phone.replace(/\s+/g, '');

    try {
      await Linking.openURL(`tel:${cleanedPhone}`);
    } catch {
      Alert.alert(
        'Unable to call',
        'Your device could not open the phone dialer.',
      );
    }
  };

  const openRating = (
    requestId: string,
    propertyId: string,
    propertyTitle: string,
  ) => {
    router.push({
      pathname: '../feedback/rate',
      params: {
        viewingId: requestId,
        propertyId,
        propertyTitle,
      },
    });
  };

  const openConcern = (
    requestId: string,
    propertyId: string,
    propertyTitle: string,
  ) => {
    router.push({
      pathname: '../feedback/concern',
      params: {
        viewingId: requestId,
        propertyId,
        propertyTitle,
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Representative Assigned':
      case 'Approved':
      case 'Rescheduled':
      case 'Confirmed':
        return (
          <CheckCircle2
            size={15}
            color={
              status === 'Rescheduled'
                ? COLORS.blue
                : COLORS.lime
            }
            strokeWidth={2.2}
          />
        );

      case 'Completed':
        return (
          <CheckCircle2
            size={15}
            color={COLORS.success}
            strokeWidth={2.2}
          />
        );

      case 'Cancelled':
        return (
          <XCircle
            size={15}
            color={COLORS.danger}
            strokeWidth={2.2}
          />
        );

      default:
        return (
          <Clock3
            size={15}
            color={COLORS.warning}
            strokeWidth={2.2}
          />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Representative Assigned':
      case 'Approved':
      case 'Confirmed':
        return COLORS.lime;

      case 'Rescheduled':
        return COLORS.blue;

      case 'Completed':
        return COLORS.success;

      case 'Cancelled':
        return COLORS.danger;

      default:
        return COLORS.warning;
    }
  };


  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <View style={styles.container}>

        {/* ================================================================
            HEADER
        ================================================================= */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={21}
              color={COLORS.white}
              strokeWidth={2.2}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              My Visits
            </Text>

            <Text style={styles.headerSubtitle}>
              Manage your accommodation bookings and property visits
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <CalendarDays
              size={21}
              color={COLORS.lime}
              strokeWidth={2}
            />
          </View>
        </View>

        {/* ================================================================
            CONTENT
        ================================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ============================================================== 
              INTRO CARD
          ============================================================== */}

          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Home
                size={23}
                color={COLORS.lime}
                strokeWidth={2}
              />
            </View>

            <View style={styles.introText}>
              <Text style={styles.introTitle}>
                Your MAKAZII activity
              </Text>

              <Text style={styles.introDescription}>
                Follow your stay reservations, accommodation payments,
                home viewing appointments and feedback in one place.
              </Text>
            </View>
          </View>

          {/* ============================================================== 
              STAY BOOKINGS / PROPERTY VISITS SWITCHER
          ============================================================== */}

          <View style={styles.sectionTabs}>
            <Pressable
              onPress={() => setActiveSection('STAYS')}
              style={[
                styles.sectionTab,
                activeSection === 'STAYS' && styles.sectionTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sectionTabText,
                  activeSection === 'STAYS' && styles.sectionTabTextActive,
                ]}
              >
                Stay Bookings
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveSection('VISITS')}
              style={[
                styles.sectionTab,
                activeSection === 'VISITS' && styles.sectionTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sectionTabText,
                  activeSection === 'VISITS' && styles.sectionTabTextActive,
                ]}
              >
                Property Visits
              </Text>
            </Pressable>
          </View>

          {activeSection === 'STAYS' ? (
            <StayBookingsSection />
          ) : (
            <>
          {/* ==============================================================
              EMPTY STATE
          ============================================================== */}

          {viewingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <CalendarDays
                  size={38}
                  color={COLORS.lime}
                  strokeWidth={1.7}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No visits yet
              </Text>

              <Text style={styles.emptyDescription}>
                When you request to view a home, your viewing
                appointment will appear here.
              </Text>

              <Pressable
                style={styles.exploreButton}
                onPress={() => router.push('/search')}
              >
                <Home
                  size={18}
                  color={COLORS.background}
                  strokeWidth={2.3}
                />

                <Text style={styles.exploreButtonText}>
                  Explore homes
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.requestsContainer}>

              {/* ==========================================================
                  SECTION HEADER
              =========================================================== */}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Viewing requests
                </Text>

                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {viewingRequests.length}
                  </Text>
                </View>
              </View>

              {/* ==========================================================
                  REQUESTS
              =========================================================== */}

              {viewingRequests.map((request) => {
                const property = getPropertyFromViewing(
                  request.property,
                );

                if (!property) {
                  return null;
                }

                const statusColor = getStatusColor(
                  request.status,
                );

                const propertyImage =
                  getPropertyImage(property);

                const location =
                  getPropertyLocation(property);

                const statusLabel =
                  getStatusLabel(request.status);

                const statusDescription =
                  getStatusDescription(request.status);

                const requestType =
                  getRequestTypeLabel(request.requestType);

                const viewingFee =
                  request.viewingFee ?? property.viewingFee ?? 0;

                const rentAmount =
                  request.rentAmount ?? property.monthlyRent ?? 0;

                const totalPaid =
                  request.totalPaid ?? 0;

                const alreadyRated =
                  request.status === 'Completed' &&
                  hasRatingForViewing(request.id);

                const isPaymentPending =
                  request.status === 'Payment Pending';

                const isPaymentReceived =
                  request.status === 'Payment Received';

                const isAwaitingRepresentative =
                  request.status === 'Awaiting Representative';

                const isRepresentativeAssigned =
                  request.status === 'Representative Assigned';

                const isApproved =
                  request.status === 'Approved' ||
                  request.status === 'Confirmed';

                const isRescheduled =
                  request.status === 'Rescheduled';

                const isCompleted =
                  request.status === 'Completed';

                /*
                 * The backend releases the representative's contact
                 * once admin has officially assigned that representative.
                 */
                const contactReleased =
                  isRepresentativeAssigned ||
                  isApproved ||
                  isRescheduled ||
                  isCompleted;

                const hasRepresentative =
                  contactReleased &&
                  Boolean(request.assignedTo) &&
                  Boolean(request.assignedToPhone);

                const hasScheduledAppointment =
                  Boolean(request.scheduledAt) &&
                  (
                    isApproved ||
                    isRescheduled ||
                    isCompleted
                  );

                return (
                  <View
                    key={request.id}
                    style={styles.requestCard}
                  >

                    {/* ==================================================
                        PROPERTY IMAGE
                    =================================================== */}

                    <Pressable
                      onPress={() =>
                        router.push(
                          `/property/${property.id}`,
                        )
                      }
                    >
                      <View style={styles.imageContainer}>
                        {propertyImage ? (
                          <Image
                            source={{
                              uri: propertyImage,
                            }}
                            style={styles.propertyImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={styles.imagePlaceholder}
                          >
                            <Home
                              size={35}
                              color="#596466"
                              strokeWidth={1.5}
                            />

                            <Text
                              style={
                                styles.imagePlaceholderText
                              }
                            >
                              No image
                            </Text>
                          </View>
                        )}

                        {/* STATUS */}

                        <View style={styles.statusBadge}>
                          {getStatusIcon(
                            request.status,
                          )}

                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: statusColor,
                              },
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {/* ==================================================
                        PROPERTY INFORMATION
                    =================================================== */}

                    <View style={styles.cardContent}>

                      <Text
                        style={styles.propertyTitle}
                        numberOfLines={2}
                      >
                        {property.title}
                      </Text>

                      {/* Location */}

                      <View style={styles.locationRow}>
                        <MapPin
                          size={15}
                          color={COLORS.muted}
                          strokeWidth={2}
                        />

                        <Text
                          style={styles.locationText}
                          numberOfLines={1}
                        >
                          {location}
                        </Text>
                      </View>

                      {/* County */}

                      {property.location?.county ? (
                        <Text style={styles.countyText}>
                          {property.location.county}
                        </Text>
                      ) : null}

                      {/* Rent */}

                      <View style={styles.rentRow}>
                        <Text style={styles.rent}>
                          {formatCurrency(property.monthlyRent)}
                        </Text>

                        <Text style={styles.perMonth}>
                          / month
                        </Text>
                      </View>

                      {/* ==================================================
                          APPOINTMENT DETAILS
                      =================================================== */}

                      <View style={styles.detailsBox}>

                        <View style={styles.detailRow}>
                          <CalendarDays
                            size={17}
                            color={COLORS.lime}
                            strokeWidth={2}
                          />

                          <View style={styles.detailText}>
                            <Text
                              style={styles.detailLabel}
                            >
                              {hasScheduledAppointment
                                ? 'Scheduled date'
                                : 'Requested date'}
                            </Text>

                            <Text
                              style={styles.detailValue}
                            >
                              {hasScheduledAppointment
                                ? new Date(
                                    request.scheduledAt!,
                                  ).toLocaleDateString(
                                    'en-KE',
                                    {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    },
                                  )
                                : request.date}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={styles.verticalDivider}
                        />

                        <View style={styles.detailRow}>
                          <Clock3
                            size={17}
                            color={COLORS.lime}
                            strokeWidth={2}
                          />

                          <View style={styles.detailText}>
                            <Text
                              style={styles.detailLabel}
                            >
                              {hasScheduledAppointment
                                ? 'Scheduled time'
                                : 'Preferred time'}
                            </Text>

                            <Text
                              style={styles.detailValue}
                            >
                              {hasScheduledAppointment
                                ? new Date(
                                    request.scheduledAt!,
                                  ).toLocaleTimeString(
                                    'en-KE',
                                    {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    },
                                  )
                                : request.time}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* ==================================================
                          REQUEST TYPE
                      =================================================== */}

                      <View style={styles.requestTypeBox}>
                        <View style={styles.requestTypeIcon}>
                          <Home
                            size={16}
                            color={COLORS.blue}
                            strokeWidth={2}
                          />
                        </View>

                        <View style={styles.requestTypeText}>
                          <Text style={styles.smallLabel}>
                            Viewing option
                          </Text>

                          <Text style={styles.requestTypeValue}>
                            {requestType}
                          </Text>
                        </View>
                      </View>

                      {/* ==================================================
                          PAYMENT SUMMARY
                      =================================================== */}

                      <View style={styles.paymentBox}>
                        <View style={styles.paymentHeader}>
                          <View style={styles.paymentHeaderLeft}>
                            <View style={styles.paymentIcon}>
                              <Wallet
                                size={16}
                                color={COLORS.lime}
                                strokeWidth={2}
                              />
                            </View>

                            <View>
                              <Text style={styles.paymentTitle}>
                                Payment
                              </Text>

                              <Text style={styles.paymentSubtitle}>
                                Viewing fee payment
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.paidBadge,
                              request.viewingPaymentStatus !==
                                'Paid' &&
                                styles.unpaidBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.paidBadgeText,
                                request.viewingPaymentStatus !==
                                  'Paid' &&
                                  styles.unpaidBadgeText,
                              ]}
                            >
                              {request.viewingPaymentStatus ===
                              'Paid'
                                ? 'PAID'
                                : request.viewingPaymentStatus}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.paymentRows}>

                          <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>
                              Viewing fee
                            </Text>

                            <Text style={styles.paymentValue}>
                              {formatCurrency(viewingFee)}
                            </Text>
                          </View>

                          {request.requestType ===
                          'view_and_rent' ? (
                            <View style={styles.paymentRow}>
                              <Text style={styles.paymentLabel}>
                                First month rent
                              </Text>

                              <Text style={styles.paymentValue}>
                                {formatCurrency(rentAmount)}
                              </Text>
                            </View>
                          ) : null}

                          <View style={styles.paymentDivider} />

                          <View style={styles.paymentRow}>
                            <Text style={styles.totalLabel}>
                              Total paid
                            </Text>

                            <Text style={styles.totalValue}>
                              {formatCurrency(totalPaid)}
                            </Text>
                          </View>
                        </View>

                        {request.requestType ===
                        'view_and_rent' ? (
                          <View style={styles.refundNotice}>
                            <Text style={styles.refundNoticeText}>
                              Rental payment is subject to
                              MAKAZII&apos;s rental terms if you
                              decide not to proceed after
                              viewing.
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.nonRefundableText}>
                            Viewing fee is non-refundable.
                          </Text>
                        )}
                      </View>

                      {/* ==================================================
                          STATUS / NEXT STEP
                      =================================================== */}

                      {(
                        isPaymentPending ||
                        isPaymentReceived ||
                        isAwaitingRepresentative
                      ) ? (
                        <View style={styles.pendingBox}>

                          <View style={styles.pendingIcon}>
                            <Clock3
                              size={19}
                              color={COLORS.warning}
                              strokeWidth={2}
                            />
                          </View>

                          <View style={styles.statusInfo}>
                            <Text style={styles.statusInfoTitle}>
                              {isPaymentPending
                                ? 'Payment confirmation pending'
                                : isPaymentReceived
                                  ? 'Payment received'
                                  : 'Awaiting representative assignment'}
                            </Text>

                            <Text style={styles.statusInfoText}>
                              {statusDescription}
                            </Text>
                          </View>

                        </View>
                      ) : null}


                      {/* ==================================================
                          REPRESENTATIVE / APPOINTMENT
                      =================================================== */}

                      {contactReleased ? (
                        <View style={styles.confirmedSection}>

                          <View style={styles.confirmedHeader}>

                            <View style={styles.confirmedIcon}>
                              <ShieldCheck
                                size={18}
                                color={
                                  isRescheduled
                                    ? COLORS.blue
                                    : COLORS.success
                                }
                                strokeWidth={2}
                              />
                            </View>

                            <View style={styles.confirmedHeaderText}>

                              <Text style={styles.confirmedTitle}>
                                {isRepresentativeAssigned
                                  ? 'Representative assigned'
                                  : isRescheduled
                                    ? 'Viewing rescheduled'
                                    : isCompleted
                                      ? 'Viewing completed'
                                      : 'Viewing approved'}
                              </Text>

                              <Text style={styles.confirmedSubtitle}>
                                {isRepresentativeAssigned
                                  ? 'Your MAKAZII viewing representative'
                                  : isRescheduled
                                    ? 'Your representative selected a new time'
                                    : isCompleted
                                      ? 'Your representative marked the visit completed'
                                      : 'Your MAKAZII viewing representative'}
                              </Text>

                            </View>

                          </View>


                          {hasScheduledAppointment ? (
                            <View
                              style={
                                styles.scheduledAppointmentBox
                              }
                            >

                              <CalendarDays
                                size={16}
                                color={COLORS.lime}
                                strokeWidth={2}
                              />

                              <View
                                style={
                                  styles.scheduledAppointmentText
                                }
                              >

                                <Text
                                  style={
                                    styles.scheduledAppointmentLabel
                                  }
                                >
                                  {isRescheduled
                                    ? 'New scheduled appointment'
                                    : 'Scheduled appointment'}
                                </Text>

                                <Text
                                  style={
                                    styles.scheduledAppointmentValue
                                  }
                                >
                                  {new Date(
                                    request.scheduledAt!,
                                  ).toLocaleString(
                                    'en-KE',
                                    {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    },
                                  )}
                                </Text>

                              </View>

                            </View>
                          ) : null}


                          {hasRepresentative ? (
                            <View style={styles.representativeCard}>

                              <View
                                style={
                                  styles.representativeAvatar
                                }
                              >
                                <Text
                                  style={
                                    styles.representativeAvatarText
                                  }
                                >
                                  {request.assignedTo
                                    ?.trim()
                                    .charAt(0)
                                    .toUpperCase() || 'M'}
                                </Text>
                              </View>

                              <View
                                style={
                                  styles.representativeDetails
                                }
                              >

                                <Text
                                  style={
                                    styles.representativeName
                                  }
                                  numberOfLines={1}
                                >
                                  {request.assignedTo}
                                </Text>

                                <Text
                                  style={
                                    styles.representativeRole
                                  }
                                >
                                  {request.assignedToRole ||
                                    'MAKAZII Viewing Representative'}
                                </Text>

                                <View
                                  style={
                                    styles.representativePhoneRow
                                  }
                                >
                                  <Phone
                                    size={13}
                                    color={COLORS.muted}
                                    strokeWidth={2}
                                  />

                                  <Text
                                    style={
                                      styles.representativePhone
                                    }
                                  >
                                    {request.assignedToPhone}
                                  </Text>
                                </View>

                              </View>

                              {request.assignedToPhone ? (
                                <Pressable
                                  style={styles.callButton}
                                  onPress={() =>
                                    handleCallRepresentative(
                                      request.assignedToPhone!,
                                    )
                                  }
                                >
                                  <Phone
                                    size={17}
                                    color={COLORS.background}
                                    strokeWidth={2.3}
                                  />

                                  <Text
                                    style={styles.callButtonText}
                                  >
                                    Call
                                  </Text>
                                </Pressable>
                              ) : null}

                            </View>
                          ) : null}


                          <Text style={styles.statusInfoText}>
                            {statusDescription}
                          </Text>

                        </View>
                      ) : null}

                      {/* ==================================================
                          CONTACT PRIVACY NOTICE
                      =================================================== */}

                      {(isPaymentPending ||
                        isPaymentReceived ||
                        isAwaitingRepresentative) ? (
                        <View style={styles.privacyNotice}>
                          <ShieldCheck
                            size={15}
                            color={COLORS.lime}
                            strokeWidth={2}
                          />

                          <Text style={styles.privacyNoticeText}>
                            Your contact details are shared with
                            the assigned MAKAZII representative only
                            after assignment. Landlord contact details
                            are never displayed here.
                          </Text>
                        </View>
                      ) : null}

                      {/* ==================================================
                          NOTES
                      =================================================== */}

                      {request.notes ? (
                        <View style={styles.notesBox}>
                          <Text
                            style={styles.notesLabel}
                          >
                            Your note
                          </Text>

                          <Text
                            style={styles.notesText}
                          >
                            {request.notes}
                          </Text>
                        </View>
                      ) : null}

                      {/* ==================================================
                          STANDARD ACTIONS
                      =================================================== */}

                      <View style={styles.actions}>

                        <Pressable
                          style={styles.viewHomeButton}
                          onPress={() =>
                            router.push(
                              `/property/${property.id}`,
                            )
                          }
                        >
                          <Home
                            size={16}
                            color={COLORS.lime}
                            strokeWidth={2}
                          />

                          <Text
                            style={
                              styles.viewHomeButtonText
                            }
                          >
                            View home
                          </Text>
                        </Pressable>


                      </View>

                      {/* ==================================================
                          COMPLETED VIEWING FEEDBACK
                      =================================================== */}

                      {isCompleted ? (
                        <View style={styles.feedbackSection}>

                          <View style={styles.feedbackHeader}>
                            <View
                              style={styles.feedbackHeaderIcon}
                            >
                              <CheckCircle2
                                size={17}
                                color={COLORS.success}
                                strokeWidth={2.2}
                              />
                            </View>

                            <View
                              style={styles.feedbackHeaderText}
                            >
                              <Text
                                style={styles.feedbackTitle}
                              >
                                Viewing completed
                              </Text>

                              <Text
                                style={
                                  styles.feedbackSubtitle
                                }
                              >
                                How was your experience?
                              </Text>
                            </View>
                          </View>

                          {alreadyRated ? (
                            <View style={styles.ratedBox}>
                              <View style={styles.ratedIcon}>
                                <Star
                                  size={16}
                                  color={COLORS.lime}
                                  fill={COLORS.lime}
                                  strokeWidth={2}
                                />
                              </View>

                              <View
                                style={
                                  styles.ratedTextContainer
                                }
                              >
                                <Text
                                  style={styles.ratedTitle}
                                >
                                  Thanks for your feedback
                                </Text>

                                <Text
                                  style={
                                    styles.ratedDescription
                                  }
                                >
                                  You have already rated this
                                  viewing.
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <Pressable
                              style={styles.rateButton}
                              onPress={() =>
                                openRating(
                                  request.id,
                                  property.id,
                                  property.title,
                                )
                              }
                            >
                              <Star
                                size={17}
                                color={COLORS.background}
                                strokeWidth={2.2}
                              />

                              <Text
                                style={styles.rateButtonText}
                              >
                                Rate viewing
                              </Text>
                            </Pressable>
                          )}

                          <Pressable
                            style={styles.concernButton}
                            onPress={() =>
                              openConcern(
                                request.id,
                                property.id,
                                property.title,
                              )
                            }
                          >
                            <AlertTriangle
                              size={16}
                              color={COLORS.warning}
                              strokeWidth={2}
                            />

                            <Text
                              style={styles.concernButtonText}
                            >
                              Report a concern
                            </Text>
                          </Pressable>

                          <Text style={styles.feedbackHint}>
                            Your feedback helps MAKAZII improve
                            the viewing experience and address
                            property-related concerns.
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
            </>
          )}

          {/* ==============================================================
              HOW VIEWINGS WORK
          ============================================================== */}

          {activeSection === 'VISITS' ? (
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>
              How viewing works
            </Text>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  1
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Request & pay
                </Text>

                <Text style={styles.stepText}>
                  Choose a home, select your viewing option,
                  choose your preferred date and time, then
                  complete the M-Pesa payment. MAKAZII verifies it securely with Safaricom.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  2
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  MAKAZII assigns
                </Text>

                <Text style={styles.stepText}>
                  After your payment is received, MAKAZII
                  assigns the representative responsible for
                  the property. Their contact is released only
                  after assignment.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  3
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Appointment is approved
                </Text>

                <Text style={styles.stepText}>
                  Your representative checks the requested
                  time. They approve it or select another
                  appointment time if needed.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  4
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Visit & share feedback
                </Text>

                <Text style={styles.stepText}>
                  Attend the scheduled viewing. Your
                  representative marks it completed after the
                  physical visit, then you can rate the experience
                  or report a concern.
                </Text>
              </View>
            </View>
          </View>
          ) : null}

          {/* Space for the global floating AppTabs */}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ==========================================================================
   STYLES
============================================================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ------------------------------------------------------------------------
     HEADER
  ------------------------------------------------------------------------ */

  header: {
    height: 86,
    paddingHorizontal: 18,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#182018',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#303A27',
  },

  /* ------------------------------------------------------------------------
     CONTENT
  ------------------------------------------------------------------------ */

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 150,
  },

  introCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },

  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#20291A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  introText: {
    flex: 1,
    marginLeft: 13,
  },

  introTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  introDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  requestsContainer: {
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },

  countBadge: {
    marginLeft: 9,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },

  /* ------------------------------------------------------------------------
     REQUEST CARD
  ------------------------------------------------------------------------ */

  requestCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  imageContainer: {
    height: 190,
    position: 'relative',
    backgroundColor: '#171E20',
  },

  propertyImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182021',
  },

  imagePlaceholderText: {
    color: '#697477',
    fontSize: 11,
    marginTop: 7,
    fontWeight: '600',
  },

  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(11,15,16,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

  cardContent: {
    padding: 16,
  },

  propertyTitle: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  locationText: {
    color: COLORS.muted,
    fontSize: 12,
    marginLeft: 5,
    flex: 1,
  },

  countyText: {
    color: '#6F7A7D',
    fontSize: 11,
    marginTop: 3,
    marginLeft: 20,
  },

  rentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },

  rent: {
    color: COLORS.lime,
    fontSize: 19,
    fontWeight: '900',
  },

  perMonth: {
    color: COLORS.muted,
    fontSize: 11,
    marginLeft: 5,
  },

  /* ------------------------------------------------------------------------
     VIEWING DETAILS
  ------------------------------------------------------------------------ */

  detailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSoft,
    borderRadius: 15,
    padding: 13,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    marginLeft: 8,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 2,
  },

  detailValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  verticalDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },

  /* ------------------------------------------------------------------------
     REQUEST TYPE
  ------------------------------------------------------------------------ */

  requestTypeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: '#263B50',
  },

  requestTypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#20354A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestTypeText: {
    marginLeft: 9,
  },

  smallLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  requestTypeValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  /* ------------------------------------------------------------------------
     PAYMENT
  ------------------------------------------------------------------------ */

  paymentBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#111718',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
  },

  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  paymentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  paymentIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#20291A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  paymentSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  paidBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: '#2C503D',
  },

  paidBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  unpaidBadge: {
    backgroundColor: COLORS.warningSoft,
    borderColor: '#4B3E22',
  },

  unpaidBadgeText: {
    color: COLORS.warning,
  },

  paymentRows: {
    marginTop: 12,
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 26,
  },

  paymentLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },

  paymentValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 7,
  },

  totalLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  totalValue: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: '900',
  },

  refundNotice: {
    marginTop: 10,
    padding: 9,
    borderRadius: 9,
    backgroundColor: '#171A15',
  },

  refundNoticeText: {
    color: '#88938D',
    fontSize: 9,
    lineHeight: 14,
  },

  nonRefundableText: {
    color: '#737E80',
    fontSize: 9,
    marginTop: 9,
  },

  /* ------------------------------------------------------------------------
     PENDING
  ------------------------------------------------------------------------ */

  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    padding: 13,
    borderRadius: 15,
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: '#4B3E22',
  },

  pendingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#40341E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusInfo: {
    flex: 1,
    marginLeft: 10,
  },

  statusInfoTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  statusInfoText: {
    color: '#A9A28D',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------
     CONFIRMED / REPRESENTATIVE
  ------------------------------------------------------------------------ */

  confirmedSection: {
    marginTop: 13,
    padding: 13,
    borderRadius: 16,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: '#2C503D',
  },

  confirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  confirmedIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#203E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmedHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  confirmedTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  confirmedSubtitle: {
    color: '#89A696',
    fontSize: 10,
    marginTop: 2,
  },

  scheduledAppointmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 11,
    borderRadius: 13,
    backgroundColor: '#102018',
    borderWidth: 1,
    borderColor: '#2C503D',
  },

  scheduledAppointmentText: {
    flex: 1,
    marginLeft: 9,
  },

  scheduledAppointmentLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
  },

  scheduledAppointmentValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },

  representativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 11,
    borderRadius: 13,
    backgroundColor: '#102018',
    borderWidth: 1,
    borderColor: '#2C503D',
  },

  representativeAvatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  representativeAvatarText: {
    color: COLORS.background,
    fontSize: 17,
    fontWeight: '900',
  },

  representativeDetails: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },

  representativeName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  representativeRole: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  representativePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  representativePhone: {
    color: '#C7D2CC',
    fontSize: 10,
    marginLeft: 5,
    fontWeight: '700',
  },

  callButton: {
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  callButtonText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },

  /* ------------------------------------------------------------------------
     PRIVACY NOTICE
  ------------------------------------------------------------------------ */

  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 11,
    paddingHorizontal: 3,
  },

  privacyNoticeText: {
    flex: 1,
    color: '#717C7E',
    fontSize: 9,
    lineHeight: 14,
    marginLeft: 6,
  },

  /* ------------------------------------------------------------------------
     NOTES
  ------------------------------------------------------------------------ */

  notesBox: {
    marginTop: 13,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#111618',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notesLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  notesText: {
    color: '#D9DEDF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  /* ------------------------------------------------------------------------
     ACTIONS
  ------------------------------------------------------------------------ */

  actions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 9,
  },

  viewHomeButton: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#39452D',
    backgroundColor: '#1A2118',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewHomeButtonText: {
    color: COLORS.lime,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  cancelButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: '#241719',
    borderWidth: 1,
    borderColor: '#4B282B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  /* ------------------------------------------------------------------------
     FEEDBACK
  ------------------------------------------------------------------------ */

  feedbackSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: 17,
    backgroundColor: '#111718',
    borderWidth: 1,
    borderColor: '#303A2B',
  },

  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  feedbackHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1B271D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  feedbackHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  feedbackTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  feedbackSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  rateButton: {
    height: 46,
    borderRadius: 13,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rateButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 7,
  },

  concernButton: {
    height: 44,
    borderRadius: 13,
    backgroundColor: '#211F17',
    borderWidth: 1,
    borderColor: '#4A4325',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },

  concernButtonText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 7,
  },

  feedbackHint: {
    color: '#747F81',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 10,
  },

  ratedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 13,
    backgroundColor: '#1A2118',
    borderWidth: 1,
    borderColor: '#39452D',
  },

  ratedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#25301C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ratedTextContainer: {
    flex: 1,
    marginLeft: 9,
  },

  ratedTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  ratedDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  /* ------------------------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------------------------ */

  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    alignItems: 'center',
    marginTop: 4,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#20291A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },

  emptyDescription: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 310,
  },

  exploreButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  exploreButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },

  /* ------------------------------------------------------------------------
     HOW IT WORKS
  ------------------------------------------------------------------------ */

  howItWorks: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    marginTop: 8,
  },

  howTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 17,
  },

  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },

  stepContent: {
    flex: 1,
    marginLeft: 11,
  },

  stepTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  stepText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------
     SPACE FOR GLOBAL APP TABS
  ------------------------------------------------------------------------ */

  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },

  sectionTab: {
    flex: 1,
    minHeight: 43,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  sectionTabActive: {
    backgroundColor: COLORS.lime,
  },

  sectionTabText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionTabTextActive: {
    color: COLORS.background,
  },

  bottomSpace: {
    height: 95,
  },
});