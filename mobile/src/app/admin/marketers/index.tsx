import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Activity,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Eye,
  Home,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  Marketer,
  MarketerAccountStatus,
  MarketerApplication,
  MarketerApplicationStatus,
  MarketerProfileChangeRequest,
  MarketerProfileChangeStatus,
  useMarketers,
} from '@/context/MarketerContext';

const COLORS = {
  background: '#0B0F10',
  sidebar: '#101516',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  mutedDark: '#657073',
  sidebarText: '#7F898B',
  border: '#252C2E',

  green: '#62D39B',
  greenSoft: '#183128',

  orange: '#FFB45B',
  orangeSoft: '#342818',

  red: '#FF7070',
  redSoft: '#351D20',

  blue: '#72B7FF',
  blueSoft: '#182A3B',

  purple: '#B899FF',
  purpleSoft: '#2A213D',
};

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    route: '/admin/dashboard',
  },
  {
    label: 'Properties',
    icon: Home,
    route: '/admin/properties',
  },
  {
    label: 'Viewings',
    icon: Building2,
    route: '/admin/viewings',
    badge: '24',
  },
  {
    label: 'Verification',
    icon: ShieldCheck,
    route: '/admin/verification',
    badge: '12',
  },
  {
    label: 'Landlords',
    icon: Users,
    route: '/admin/landlords',
  },
  {
    label: 'Marketers',
    icon: UserCheck,
    route: '/admin/marketers',
  },
  {
    label: 'Users',
    icon: Users,
    route: '/admin/users',
  },
  {
    label: 'Settings',
    icon: Settings,
    route: '/admin/settings',
  },
];

type MainTab = 'applications' | 'marketers' | 'profileChanges';

type ApplicationFilter =
  | 'All'
  | MarketerApplicationStatus;

type MarketerFilter =
  | 'All'
  | MarketerAccountStatus;

const APPLICATION_FILTERS: ApplicationFilter[] = [
  'All',
  'PENDING',
  'UNDER_REVIEW',
  'ACTION_REQUIRED',
  'APPROVED',
  'REJECTED',
];

const MARKETER_FILTERS: MarketerFilter[] = [
  'All',
  'Active',
  'Inactive',
  'Suspended',
];

const formatNumber = (value: number) =>
  value.toLocaleString('en-KE');

function getApplicationStatusColors(
  status: MarketerApplicationStatus,
) {
  switch (status) {
    case 'PENDING':
      return {
        backgroundColor: COLORS.orangeSoft,
        color: COLORS.orange,
      };

    case 'UNDER_REVIEW':
      return {
        backgroundColor: COLORS.blueSoft,
        color: COLORS.blue,
      };

    case 'ACTION_REQUIRED':
      return {
        backgroundColor: COLORS.purpleSoft,
        color: COLORS.purple,
      };

    case 'APPROVED':
      return {
        backgroundColor: COLORS.greenSoft,
        color: COLORS.green,
      };

    case 'REJECTED':
      return {
        backgroundColor: COLORS.redSoft,
        color: COLORS.red,
      };
  }
}

function getMarketerStatusColors(
  status: MarketerAccountStatus,
) {
  switch (status) {
    case 'Active':
      return {
        backgroundColor: COLORS.greenSoft,
        color: COLORS.green,
      };

    case 'Suspended':
      return {
        backgroundColor: COLORS.redSoft,
        color: COLORS.red,
      };

    case 'Inactive':
      return {
        backgroundColor: COLORS.orangeSoft,
        color: COLORS.orange,
      };
  }
}

function formatApplicationStatus(
  status: MarketerApplicationStatus,
) {
  switch (status) {
    case 'PENDING':
      return 'Pending';

    case 'UNDER_REVIEW':
      return 'Under review';

    case 'ACTION_REQUIRED':
      return 'Action required';

    case 'APPROVED':
      return 'Approved';

    case 'REJECTED':
      return 'Rejected';
  }
}

export default function MarketersPage() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 760;

  const {
    marketers,
    applications,
    refreshAdminApplications,
    refreshAdminMarketers,

    getAllProfileChangeRequests,
    approveProfileChangeRequest,
    rejectProfileChangeRequest,

    updateMarketer,
    suspendMarketer,
    activateMarketer,

    startApplicationReview,
    requestApplicationChanges,
    approveApplication,
    rejectApplication,
  } = useMarketers();

  const [mainTab, setMainTab] =
    useState<MainTab>('applications');

  const [profileChangeRequests, setProfileChangeRequests] =
    useState<MarketerProfileChangeRequest[]>([]);

  const [profileChangeFilter, setProfileChangeFilter] =
    useState<MarketerProfileChangeStatus | 'All'>('All');

  const [selectedProfileChangeRequest, setSelectedProfileChangeRequest] =
    useState<MarketerProfileChangeRequest | null>(null);

  const [profileChangeVisible, setProfileChangeVisible] =
    useState(false);

  const [rejectProfileChangeVisible, setRejectProfileChangeVisible] =
    useState(false);

  const [profileChangeRejectNotes, setProfileChangeRejectNotes] =
    useState('');

  const [profileChangeLoading, setProfileChangeLoading] =
    useState(false);

  const [profileChangeError, setProfileChangeError] =
    useState('');

  const [search, setSearch] = useState('');

  const [applicationFilter, setApplicationFilter] =
    useState<ApplicationFilter>('All');

  const [marketerFilter, setMarketerFilter] =
    useState<MarketerFilter>('All');

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState<MarketerApplication | null>(null);

  const [selectedMarketer, setSelectedMarketer] =
    useState<Marketer | null>(null);

  const [applicationVisible, setApplicationVisible] =
    useState(false);

  const [detailsVisible, setDetailsVisible] =
    useState(false);

  const [editVisible, setEditVisible] =
    useState(false);

  const [reviewNote, setReviewNote] =
    useState('');

  const [rejectReason, setRejectReason] =
    useState('');

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editExperience, setEditExperience] =
    useState('');
  const [editNotes, setEditNotes] = useState('');

  /* =====================================================
     COUNTS
     ===================================================== */

  const stats = useMemo(() => {
    const pendingApplications =
      applications.filter(
        (item) => item.status === 'PENDING',
      ).length;

    const underReview =
      applications.filter(
        (item) => item.status === 'UNDER_REVIEW',
      ).length;

    const actionRequired =
      applications.filter(
        (item) =>
          item.status === 'ACTION_REQUIRED',
      ).length;

    const activeMarketers =
      marketers.filter(
        (item) => item.status === 'Active',
      ).length;

    const suspendedMarketers =
      marketers.filter(
        (item) => item.status === 'Suspended',
      ).length;

    const properties =
      marketers.reduce(
        (sum, item) =>
          sum + item.properties,
        0,
      );

    const landlords =
      marketers.reduce(
        (sum, item) =>
          sum + item.landlords,
        0,
      );

    const viewings =
      marketers.reduce(
        (sum, item) =>
          sum + item.viewings,
        0,
      );

    return {
      totalApplications: applications.length,
      pendingApplications,
      underReview,
      actionRequired,

      totalMarketers: marketers.length,
      activeMarketers,
      suspendedMarketers,

      properties,
      landlords,
      viewings,
    };
  }, [applications, marketers]);

  /* =====================================================
     FILTER APPLICATIONS
     ===================================================== */

  const loadProfileChangeRequests = async () => {
    setProfileChangeLoading(true);
    setProfileChangeError('');

    try {
      const requests =
        await getAllProfileChangeRequests();

      setProfileChangeRequests(requests);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load marketer profile change requests.';

      setProfileChangeError(message);
    } finally {
      setProfileChangeLoading(false);
    }
  };

  const getProfileChangeMarketerName = (
    request: MarketerProfileChangeRequest,
  ) => {
    const firstName =
      request.marketer?.user?.firstName?.trim() || '';

    const lastName =
      request.marketer?.user?.lastName?.trim() || '';

    const fullName =
      `${firstName} ${lastName}`.trim();

    return (
      fullName ||
      `Marketer ${request.marketerId}`
    );
  };

  const getProfileChangeFields = (
    request: MarketerProfileChangeRequest,
  ) => {
    const fields: Array<{
      label: string;
      current: string;
      requested: string;
    }> = [];

    if (
      request.requestedFirstName !== null &&
      request.requestedFirstName !== undefined
    ) {
      fields.push({
        label: 'First name',
        current:
          request.currentFirstName || '—',
        requested:
          request.requestedFirstName || '—',
      });
    }

    if (
      request.requestedLastName !== null &&
      request.requestedLastName !== undefined
    ) {
      fields.push({
        label: 'Last name',
        current:
          request.currentLastName || '—',
        requested:
          request.requestedLastName || '—',
      });
    }

    if (
      request.requestedPhone !== null &&
      request.requestedPhone !== undefined
    ) {
      fields.push({
        label: 'Phone',
        current:
          request.currentPhone || '—',
        requested:
          request.requestedPhone || '—',
      });
    }

    if (
      request.requestedEmail !== null &&
      request.requestedEmail !== undefined
    ) {
      fields.push({
        label: 'Email',
        current:
          request.currentEmail || '—',
        requested:
          request.requestedEmail || '—',
      });
    }

    return fields;
  };

  const pendingProfileChanges =
    useMemo(
      () =>
        profileChangeRequests.filter(
          (request) =>
            request.status === 'PENDING',
        ),
      [profileChangeRequests],
    );

  const filteredProfileChangeRequests =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return profileChangeRequests.filter(
        (request) => {
          const marketerName =
            getProfileChangeMarketerName(
              request,
            ).toLowerCase();

          const matchesStatus =
            profileChangeFilter === 'All' ||
            request.status ===
              profileChangeFilter;

          const matchesSearch =
            !query ||
            marketerName.includes(query) ||
            request.marketerId
              .toLowerCase()
              .includes(query) ||
            (
              request.currentEmail || ''
            )
              .toLowerCase()
              .includes(query) ||
            (
              request.requestedEmail || ''
            )
              .toLowerCase()
              .includes(query) ||
            (
              request.currentPhone || ''
            )
              .toLowerCase()
              .includes(query) ||
            (
              request.requestedPhone || ''
            )
              .toLowerCase()
              .includes(query);

          return (
            matchesStatus &&
            matchesSearch
          );
        },
      );
    }, [
      profileChangeRequests,
      profileChangeFilter,
      search,
    ]);

  const openProfileChangeRequest = (
    request: MarketerProfileChangeRequest,
  ) => {
    setSelectedProfileChangeRequest(
      request,
    );
    setProfileChangeVisible(true);
  };

  const handleApproveProfileChange = async (
    request: MarketerProfileChangeRequest,
  ) => {
    Alert.alert(
      'Approve profile change',
      `Approve the requested profile changes for ${getProfileChangeMarketerName(request)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: async () => {
            setProfileChangeLoading(true);
            setProfileChangeError('');

            try {
              await approveProfileChangeRequest(
                request.id,
              );

              await loadProfileChangeRequests();

              setProfileChangeVisible(
                false,
              );

              setSelectedProfileChangeRequest(
                null,
              );

              Alert.alert(
                'Profile change approved',
                'The marketer profile has been updated successfully.',
              );
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Unable to approve this profile change request.';

              setProfileChangeError(
                message,
              );

              Alert.alert(
                'Approval failed',
                message,
              );
            } finally {
              setProfileChangeLoading(
                false,
              );
            }
          },
        },
      ],
    );
  };

  const handleRejectProfileChange = async () => {
    if (
      !selectedProfileChangeRequest
    ) {
      return;
    }

    const notes =
      profileChangeRejectNotes.trim();

    if (!notes) {
      Alert.alert(
        'Admin note required',
        'Please provide a reason for rejecting this profile change request.',
      );
      return;
    }

    setProfileChangeLoading(true);
    setProfileChangeError('');

    try {
      await rejectProfileChangeRequest(
        selectedProfileChangeRequest.id,
        notes,
      );

      await loadProfileChangeRequests();

      setRejectProfileChangeVisible(
        false,
      );
      setProfileChangeVisible(false);
      setSelectedProfileChangeRequest(
        null,
      );
      setProfileChangeRejectNotes('');

      Alert.alert(
        'Profile change rejected',
        'The marketer has not been updated and the request has been rejected.',
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to reject this profile change request.';

      setProfileChangeError(message);

      Alert.alert(
        'Rejection failed',
        message,
      );
    } finally {
      setProfileChangeLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (mainTab === 'applications') {
        refreshAdminApplications().catch((error: unknown) => {
          console.error('Unable to refresh marketer applications:', error);
          Alert.alert(
            'Applications could not load',
            error instanceof Error ? error.message : 'Please try again.'
          );
        });
      } else if (mainTab === 'marketers') {
        refreshAdminMarketers().catch((error: unknown) => {
          console.error('Unable to refresh admin marketers:', error);
          Alert.alert(
            'Marketers could not load',
            error instanceof Error ? error.message : 'Please try again.'
          );
        });
      }
    }, [
      mainTab,
      refreshAdminApplications,
      refreshAdminMarketers,
    ])
  );

  useEffect(() => {
    if (mainTab === 'profileChanges') {
      loadProfileChangeRequests();
    }
  }, [mainTab]);

  const filteredApplications = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return applications.filter(
      (application) => {
        const matchesStatus =
          applicationFilter === 'All' ||
          application.status ===
            applicationFilter;

        const fullName =
          `${application.firstName} ${application.lastName}`;

        const matchesSearch =
          !query ||
          application.id
            .toLowerCase()
            .includes(query) ||
          fullName
            .toLowerCase()
            .includes(query) ||
          application.email
            .toLowerCase()
            .includes(query) ||
          application.phone
            .toLowerCase()
            .includes(query) ||
          application.county
            .toLowerCase()
            .includes(query);

        return (
          matchesStatus &&
          matchesSearch
        );
      },
    );
  }, [
    applications,
    applicationFilter,
    search,
  ]);

  /* =====================================================
     FILTER MARKETERS
     ===================================================== */

  const filteredMarketers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return marketers.filter(
      (marketer) => {
        const matchesStatus =
          marketerFilter === 'All' ||
          marketer.status ===
            marketerFilter;

        const matchesSearch =
          !query ||
          marketer.id
            .toLowerCase()
            .includes(query) ||
          marketer.name
            .toLowerCase()
            .includes(query) ||
          marketer.phone
            .toLowerCase()
            .includes(query) ||
          marketer.email
            .toLowerCase()
            .includes(query) ||
          marketer.area
            .toLowerCase()
            .includes(query);

        return (
          matchesStatus &&
          matchesSearch
        );
      },
    );
  }, [
    marketers,
    marketerFilter,
    search,
  ]);

  /* =====================================================
     APPLICATION ACTIONS
     ===================================================== */

  const openApplication = (
    application: MarketerApplication,
  ) => {
    router.push({
      pathname: '/admin/marketers/application/[id]',
      params: { id: String(application.id) },
    } as never);
  };

  const beginReview = () => {
    if (!selectedApplication) return;

    startApplicationReview(
      selectedApplication.id,
    );

    setSelectedApplication({
      ...selectedApplication,
      status: 'UNDER_REVIEW',
    });
  };

  const handleRequestChanges = () => {
    if (!selectedApplication) return;

    if (!reviewNote.trim()) {
      Alert.alert(
        'Message required',
        'Tell the applicant what needs to be corrected before requesting changes.',
      );
      return;
    }

    requestApplicationChanges(
      selectedApplication.id,
      reviewNote.trim(),
    );

    setSelectedApplication({
      ...selectedApplication,
      status: 'ACTION_REQUIRED',
      requestedChanges:
        reviewNote.trim(),
    });

    Alert.alert(
      'Changes requested',
      'The application has been marked as requiring changes.',
    );
  };

  const handleApproveApplication = () => {
    if (!selectedApplication) return;

    Alert.alert(
      'Approve application',
      `Approve ${selectedApplication.firstName} ${selectedApplication.lastName} as a MAKAZII marketer?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: () => {
            const marketer =
              approveApplication(
                selectedApplication.id,
              );

            if (!marketer) {
              Alert.alert(
                'Unable to approve',
                'The application could not be approved.',
              );
              return;
            }

            setApplicationVisible(false);
            setSelectedApplication(null);

            Alert.alert(
              'Application approved',
              `${marketer.name} is now an active MAKAZII marketer with portal access.`,
            );
          },
        },
      ],
    );
  };

  const handleRejectApplication = () => {
    if (!selectedApplication) return;

    if (!rejectReason.trim()) {
      Alert.alert(
        'Reason required',
        'Enter a reason for rejecting this application.',
      );
      return;
    }

    Alert.alert(
      'Reject application',
      'Are you sure you want to reject this application?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            rejectApplication(
              selectedApplication.id,
              rejectReason.trim(),
            );

            setSelectedApplication({
              ...selectedApplication,
              status: 'REJECTED',
              rejectionReason:
                rejectReason.trim(),
            });

            Alert.alert(
              'Application rejected',
              'The application has been rejected.',
            );
          },
        },
      ],
    );
  };

  /* =====================================================
     MARKETER ACTIONS
     ===================================================== */

  const openMarketerDetails = (
    marketer: Marketer,
  ) => {
    setSelectedMarketer(marketer);
    setDetailsVisible(true);
  };

  /**
   * ADMIN → MARKETER DASHBOARD
   *
   * Admin does not log in as the marketer.
   * This simply opens an authorized admin
   * view of the selected marketer dashboard.
   */
  const openMarketerDashboard = () => {
    if (!selectedMarketer) return;

    if (
      selectedMarketer.status !== 'Active' ||
      !selectedMarketer.portalAccess
    ) {
      Alert.alert(
        'Dashboard unavailable',
        'Only active marketers with portal access can have their dashboard opened.',
      );
      return;
    }

    const marketerId =
      String(selectedMarketer.id);

    setDetailsVisible(false);

    router.push({
      pathname:
        '/admin/marketers/dashboard',
      params: {
        marketerId,
      },
    } as never);
  };

  const openEdit = (
    marketer: Marketer,
  ) => {
    setSelectedMarketer(marketer);

    setEditName(marketer.name);
    setEditPhone(marketer.phone);
    setEditEmail(marketer.email);
    setEditArea(marketer.area);
    setEditExperience(
      marketer.experience,
    );
    setEditNotes(marketer.notes);

    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!selectedMarketer) return;

    if (
      !editName.trim() ||
      !editPhone.trim() ||
      !editArea.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Name, phone and area are required.',
      );
      return;
    }

    try {
      await updateMarketer(
        selectedMarketer.id,
        {
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          area: editArea.trim(),
          experience:
            editExperience.trim(),
          notes:
            editNotes.trim(),
        },
      );

      setEditVisible(false);
      setDetailsVisible(false);

      Alert.alert(
        'Marketer updated',
        `${editName.trim()} has been updated successfully.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to update marketer',
        error instanceof Error
          ? error.message
          : 'The marketer could not be updated. Please try again.',
      );
    }
  };

  const toggleMarketerStatus = async () => {
    if (!selectedMarketer) return;

    try {
      if (
        selectedMarketer.status ===
        'Inactive'
      ) {
        await activateMarketer(
          selectedMarketer.id,
        );

        Alert.alert(
          'Marketer approved',
          `${selectedMarketer.name} is now active and has portal access.`,
        );

        return;
      }

      if (
        selectedMarketer.status ===
        'Active'
      ) {
        await suspendMarketer(
          selectedMarketer.id,
        );

        Alert.alert(
          'Marketer deactivated',
          `${selectedMarketer.name} has been deactivated and portal access is disabled.`,
        );

        return;
      }

      Alert.alert(
        'Action unavailable',
        'This marketer account has a status that is not supported by the current backend.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to update marketer',
        error instanceof Error
          ? error.message
          : 'The marketer status could not be updated.',
      );
    }
  };

  /* =====================================================
     SIDEBAR
     ===================================================== */

  const renderSidebar = () => (
    <View
      style={[
        styles.sidebar,
        !isDesktop &&
          styles.mobileSidebar,
        !isDesktop && {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          width: Math.min(
            width * 0.86,
            320,
          ),
        },
        !isDesktop &&
          !sidebarOpen && {
            display: 'none',
          },
      ]}
    >
      <View
        style={styles.sidebarHeader}
      >
        <View style={styles.logoMark}>
          <Text
            style={styles.logoMarkText}
          >
            M
          </Text>
        </View>

        <View>
          <Text
            style={styles.brandName}
          >
            MAKAZII
          </Text>

          <Text
            style={styles.brandSubtitle}
          >
            TEAM PORTAL
          </Text>
        </View>
      </View>

      <View
        style={styles.platformStatus}
      >
        <View
          style={styles.onlineDot}
        />

        <Text
          style={styles.platformText}
        >
          PLATFORM ONLINE
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.sidebarScroll
        }
      >
        <Text
          style={styles.menuLabel}
        >
          WORKSPACE
        </Text>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.label === 'Marketers';

          return (
            <Pressable
              key={item.label}
              style={[
                styles.navItem,
                active &&
                  styles.navItemActive,
              ]}
              onPress={() => {
                setSidebarOpen(false);

                if (
                  item.route !==
                  '/admin/marketers'
                ) {
                  router.push(
                    item.route as never,
                  );
                }
              }}
            >
              <Icon
                size={19}
                color={
                  active
                    ? COLORS.lime
                    : COLORS.sidebarText
                }
              />

              <Text
                style={[
                  styles.navText,
                  active &&
                    styles.navTextActive,
                ]}
              >
                {item.label}
              </Text>

              {item.badge && (
                <View
                  style={
                    styles.navBadge
                  }
                >
                  <Text
                    style={
                      styles.navBadgeText
                    }
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        <View
          style={styles.sidebarDivider}
        />

        <Text
          style={styles.menuLabel}
        >
          ACCOUNT
        </Text>

        <View
          style={styles.adminCard}
        >
          <View
            style={styles.adminAvatar}
          >
            <Text
              style={
                styles.adminAvatarText
              }
            >
              A
            </Text>
          </View>

          <View
            style={styles.adminInfo}
          >
            <Text
              style={styles.adminName}
            >
              Admin
            </Text>

            <Text
              style={styles.adminRole}
            >
              Administrator
            </Text>
          </View>

          <MoreHorizontal
            size={18}
            color={
              COLORS.mutedDark
            }
          />
        </View>

        <Pressable
          style={
            styles.signOutButton
          }
          onPress={() =>
            Alert.alert(
              'Sign out',
              'Sign out functionality will be connected to the backend later.',
            )
          }
        >
          <XCircle
            size={18}
            color={
              COLORS.sidebarText
            }
          />

          <Text
            style={styles.signOutText}
          >
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  /* =====================================================
     TOP BAR
     ===================================================== */

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.topLeft}>
        {!isDesktop && (
          <Pressable
            style={
              styles.menuButton
            }
            onPress={() =>
              setSidebarOpen(true)
            }
          >
            <Menu
              size={21}
              color={COLORS.white}
            />
          </Pressable>
        )}

        <View>
          <Text
            style={styles.breadcrumb}
          >
            ADMIN / MARKETERS
          </Text>

          <Text
            style={styles.topTitle}
          >
            Marketer management
          </Text>
        </View>
      </View>

      <View
        style={styles.topActions}
      >
        {isDesktop && (
          <View
            style={styles.topSearch}
          >
            <Search
              size={17}
              color={
                COLORS.mutedDark
              }
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={
                mainTab ===
                'applications'
                  ? 'Search applications...'
                  : 'Search marketers...'
              }
              placeholderTextColor={
                COLORS.mutedDark
              }
              style={
                styles.topSearchInput
              }
            />
          </View>
        )}

        <Pressable
          style={
            styles.iconButton
          }
        >
          <Bell
            size={19}
            color={COLORS.muted}
          />

          {(stats.pendingApplications >
            0 ||
            stats.actionRequired >
              0) && (
            <View
              style={
                styles.notificationDot
              }
            />
          )}
        </Pressable>

        <View
          style={styles.topAvatar}
        >
          <Text
            style={
              styles.topAvatarText
            }
          >
            A
          </Text>
        </View>
      </View>
    </View>
  );

  /* =====================================================
     STAT CARD
     ===================================================== */

  const renderStatCard = (
    label: string,
    value: number,
    Icon: React.ElementType,
    accent: string,
    description: string,
  ) => (
    <View style={styles.statCard}>
      <View
        style={styles.statTop}
      >
        <View
          style={[
            styles.statIcon,
            {
              backgroundColor:
                `${accent}18`,
            },
          ]}
        >
          <Icon
            size={20}
            color={accent}
          />
        </View>

        <MoreHorizontal
          size={18}
          color={
            COLORS.mutedDark
          }
        />
      </View>

      <Text
        style={styles.statValue}
      >
        {formatNumber(value)}
      </Text>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.statSubtext}
      >
        {description}
      </Text>
    </View>
  );

  /* =====================================================
     APPLICATION STATUS
     ===================================================== */

  const renderApplicationStatus = (
    status: MarketerApplicationStatus,
  ) => {
    const colors =
      getApplicationStatusColors(
        status,
      );

    return (
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor:
              colors.backgroundColor,
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                colors.color,
            },
          ]}
        />

        <Text
          style={[
            styles.statusText,
            {
              color: colors.color,
            },
          ]}
        >
          {formatApplicationStatus(
            status,
          )}
        </Text>
      </View>
    );
  };

  /* =====================================================
     MARKETER STATUS
     ===================================================== */

  const renderMarketerStatus = (
    status: MarketerAccountStatus,
  ) => {
    const colors =
      getMarketerStatusColors(
        status,
      );

    return (
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor:
              colors.backgroundColor,
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                colors.color,
            },
          ]}
        />

        <Text
          style={[
            styles.statusText,
            {
              color: colors.color,
            },
          ]}
        >
          {status}
        </Text>
      </View>
    );
  };

  /* =====================================================
     APPLICATION CARD
     ===================================================== */

  const renderApplicationCard = (
    application: MarketerApplication,
  ) => {
    const name =
      `${application.firstName} ${application.lastName}`;

    return (
      <Pressable
        key={application.id}
        style={
          styles.applicationCard
        }
        onPress={() =>
          openApplication(
            application,
          )
        }
      >
        <View
          style={
            styles.applicationIdentity
          }
        >
          <View
            style={
              styles.applicationAvatar
            }
          >
            <Text
              style={
                styles.applicationAvatarText
              }
            >
              {application.firstName
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.applicationIdentityText
            }
          >
            <View
              style={styles.idRow}
            >
              <Text
                style={
                  styles.applicationId
                }
              >
                {application.id}
              </Text>

              {renderApplicationStatus(
                application.status,
              )}
            </View>

            <Text
              style={
                styles.applicationName
              }
            >
              {name}
            </Text>

            <View
              style={styles.locationRow}
            >
              <MapPin
                size={13}
                color={
                  COLORS.mutedDark
                }
              />

              <Text
                style={
                  styles.locationText
                }
                numberOfLines={1}
              >
                {application.county}
                {application.constituencyId
                  ? ` • ${application.constituencyId}`
                  : ''}
                {application.wardIds?.length
                  ? ` • ${application.wardIds.join(', ')}`
                  : ''}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={styles.contactColumn}
        >
          <Text
            style={styles.columnLabel}
          >
            CONTACT
          </Text>

          <View
            style={styles.contactRow}
          >
            <Phone
              size={13}
              color={
                COLORS.mutedDark
              }
            />

            <Text
              style={
                styles.contactText
              }
            >
              {application.phone}
            </Text>
          </View>

          <View
            style={styles.contactRow}
          >
            <Mail
              size={13}
              color={
                COLORS.mutedDark
              }
            />

            <Text
              style={
                styles.contactText
              }
              numberOfLines={1}
            >
              {application.email}
            </Text>
          </View>
        </View>

        <View
          style={styles.applicationColumn}
        >
          <Text
            style={styles.columnLabel}
          >
            IDENTITY
          </Text>

          <Text
            style={
              styles.applicationValue
            }
          >
            {application.idType}
          </Text>

          <Text
            style={
              styles.applicationMuted
            }
          >
            Documents submitted
          </Text>
        </View>

        <View
          style={styles.applicationColumn}
        >
          <Text
            style={
              styles.columnLabel
            }
          >
            EXPERIENCE
          </Text>

          <Text
            style={
              styles.applicationValue
            }
          >
            {application.hasRealEstateExperience
              ? application.experienceDuration
              : 'New to real estate'}
          </Text>

          <Text
            style={
              styles.applicationMuted
            }
            numberOfLines={1}
          >
            {application.currentOccupation}
          </Text>
        </View>

        <ChevronRight
          size={19}
          color={COLORS.mutedDark}
        />
      </Pressable>
    );
  };

  /* =====================================================
     MARKETER CARD
     ===================================================== */

  const renderMarketerCard = (
    marketer: Marketer,
  ) => (
    <Pressable
      key={marketer.id}
      style={styles.marketerCard}
      onPress={() =>
        openMarketerDetails(
          marketer,
        )
      }
    >
      <View
        style={styles.marketerMain}
      >
        <View
          style={styles.marketerAvatar}
        >
          <Text
            style={
              styles.marketerAvatarText
            }
          >
            {marketer.name
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={
            styles.marketerIdentity
          }
        >
          <View
            style={styles.idRow}
          >
            <Text
              style={styles.marketerId}
            >
              {marketer.id}
            </Text>

            {renderMarketerStatus(
              marketer.status,
            )}
          </View>

          <Text
            style={
              styles.marketerName
            }
            numberOfLines={1}
          >
            {marketer.name}
          </Text>

          <View
            style={styles.locationRow}
          >
            <MapPin
              size={13}
              color={
                COLORS.mutedDark
              }
            />

            <Text
              style={
                styles.locationText
              }
              numberOfLines={1}
            >
              {marketer.area}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.contactColumn}
      >
        <Text
          style={styles.columnLabel}
        >
          CONTACT
        </Text>

        <View
          style={styles.contactRow}
        >
          <Phone
            size={13}
            color={
              COLORS.mutedDark
            }
          />

          <Text
            style={styles.contactText}
          >
            {marketer.phone}
          </Text>
        </View>

        <View
          style={styles.contactRow}
        >
          <Mail
            size={13}
            color={
              COLORS.mutedDark
            }
          />

          <Text
            style={styles.contactText}
            numberOfLines={1}
          >
            {marketer.email}
          </Text>
        </View>
      </View>

      <View
        style={styles.performanceColumn}
      >
        <Text
          style={styles.columnLabel}
        >
          ACTIVITY
        </Text>

        <View
          style={styles.activityStats}
        >
          <View>
            <Text
              style={
                styles.performanceValue
              }
            >
              {marketer.properties}
            </Text>

            <Text
              style={
                styles.performanceLabel
              }
            >
              properties
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.performanceValue
              }
            >
              {marketer.landlords}
            </Text>

            <Text
              style={
                styles.performanceLabel
              }
            >
              landlords
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.performanceValue
              }
            >
              {marketer.viewings}
            </Text>

            <Text
              style={
                styles.performanceLabel
              }
            >
              viewings
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.areaColumn}
      >
        <Text
          style={styles.columnLabel}
        >
          SPECIALTY
        </Text>

        <Text
          style={styles.specialtyText}
          numberOfLines={1}
        >
          {marketer.experience}
        </Text>

        <Text
          style={styles.joinedText}
        >
          Joined {marketer.joined}
        </Text>
      </View>

      <Eye
        size={17}
        color={COLORS.muted}
      />
    </Pressable>
  );

  /* =====================================================
     MAIN PAGE
     ===================================================== */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.app}>
        {renderSidebar()}

        {!isDesktop &&
          sidebarOpen && (
            <Pressable
              style={styles.overlay}
              onPress={() =>
                setSidebarOpen(false)
              }
            />
          )}

        <View
          style={[
            styles.content,
            isDesktop &&
              styles.contentDesktop,
          ]}
        >
          {renderTopBar()}

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={[
              styles.pageContent,
              isTablet &&
                styles.pageContentTablet,
            ]}
          >
            <View
              style={styles.pageHeader}
            >
              <View
                style={
                  styles.pageHeaderText
                }
              >
                <Text
                  style={styles.eyebrow}
                >
                  FIELD NETWORK
                </Text>

                <Text
                  style={styles.pageTitle}
                >
                  Marketers
                </Text>

                <Text
                  style={
                    styles.pageDescription
                  }
                >
                  Review marketer applications,
                  manage approved field members
                  and control marketer portal
                  access.
                </Text>
              </View>

              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={() =>
                  router.push(
                    '/admin/marketers/add',
                  )
                }
              >
                <UserPlus
                  size={18}
                  color={
                    COLORS.background
                  }
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Add marketer
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.statsGrid,
                !isTablet &&
                  styles.statsGridMobile,
              ]}
            >
              {renderStatCard(
                'Pending applications',
                stats.pendingApplications,
                UserPlus,
                COLORS.orange,
                'Waiting for review',
              )}

              {renderStatCard(
                'Under review',
                stats.underReview,
                ShieldCheck,
                COLORS.blue,
                'Currently being reviewed',
              )}

              {renderStatCard(
                'Action required',
                stats.actionRequired,
                Activity,
                COLORS.purple,
                'Applicants need changes',
              )}

              {renderStatCard(
                'Active marketers',
                stats.activeMarketers,
                UserCheck,
                COLORS.green,
                'Portal access enabled',
              )}

              {isDesktop &&
                renderStatCard(
                  'Properties sourced',
                  stats.properties,
                  Home,
                  COLORS.lime,
                  'Across marketer network',
                )}
            </View>

            {!isDesktop && (
              <View
                style={
                  styles.mobileSearch
                }
              >
                <Search
                  size={18}
                  color={
                    COLORS.mutedDark
                  }
                />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={
                    mainTab ===
                    'applications'
                      ? 'Search applications...'
                      : 'Search marketers...'
                  }
                  placeholderTextColor={
                    COLORS.mutedDark
                  }
                  style={
                    styles.mobileSearchInput
                  }
                />
              </View>
            )}

            <View
              style={styles.mainTabs}
            >
              <Pressable
                style={[
                  styles.mainTab,
                  mainTab ===
                    'applications' &&
                    styles.mainTabActive,
                ]}
                onPress={() =>
                  setMainTab(
                    'applications',
                  )
                }
              >
                <ShieldCheck
                  size={17}
                  color={
                    mainTab ===
                    'applications'
                      ? COLORS.lime
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.mainTabText,
                    mainTab ===
                      'applications' &&
                      styles.mainTabTextActive,
                  ]}
                >
                  Applications
                </Text>

                <View
                  style={[
                    styles.mainTabBadge,
                    mainTab ===
                      'applications' &&
                      styles.mainTabBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.mainTabBadgeText,
                      mainTab ===
                        'applications' &&
                        styles.mainTabBadgeTextActive,
                    ]}
                  >
                    {applications.length}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.mainTab,
                  mainTab ===
                    'marketers' &&
                    styles.mainTabActive,
                ]}
                onPress={() =>
                  setMainTab(
                    'marketers',
                  )
                }
              >
                <Users
                  size={17}
                  color={
                    mainTab ===
                    'marketers'
                      ? COLORS.lime
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.mainTabText,
                    mainTab ===
                      'marketers' &&
                      styles.mainTabTextActive,
                  ]}
                >
                  Marketers
                </Text>

                <View
                  style={[
                    styles.mainTabBadge,
                    mainTab ===
                      'marketers' &&
                      styles.mainTabBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.mainTabBadgeText,
                      mainTab ===
                        'marketers' &&
                        styles.mainTabBadgeTextActive,
                    ]}
                  >
                    {marketers.length}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.mainTab,
                  mainTab ===
                    'profileChanges' &&
                    styles.mainTabActive,
                ]}
                onPress={() =>
                  setMainTab(
                    'profileChanges',
                  )
                }
              >
                <Pencil
                  size={17}
                  color={
                    mainTab ===
                    'profileChanges'
                      ? COLORS.lime
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.mainTabText,
                    mainTab ===
                      'profileChanges' &&
                      styles.mainTabTextActive,
                  ]}
                >
                  Profile changes
                </Text>

                <View
                  style={[
                    styles.mainTabBadge,
                    mainTab ===
                      'profileChanges' &&
                      styles.mainTabBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.mainTabBadgeText,
                      mainTab ===
                        'profileChanges' &&
                        styles.mainTabBadgeTextActive,
                    ]}
                  >
                    {pendingProfileChanges.length}
                  </Text>
                </View>
              </Pressable>
            </View>

            {mainTab ===
              'applications' && (
              <>
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Marketer applications
                    </Text>

                    <Text
                      style={
                        styles.sectionSubtitle
                      }
                    >
                      {
                        filteredApplications.length
                      }{' '}
                      application
                      {filteredApplications.length ===
                      1
                        ? ''
                        : 's'} found
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                  >
                    <View
                      style={
                        styles.filterScroll
                      }
                    >
                      {APPLICATION_FILTERS.map(
                        (status) => {
                          const active =
                            applicationFilter ===
                            status;

                          return (
                            <Pressable
                              key={status}
                              onPress={() =>
                                setApplicationFilter(
                                  status,
                                )
                              }
                              style={[
                                styles.filterChip,
                                active &&
                                  styles.filterChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.filterChipText,
                                  active &&
                                    styles.filterChipTextActive,
                                ]}
                              >
                                {status ===
                                'All'
                                  ? 'All'
                                  : formatApplicationStatus(
                                      status,
                                    )}
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                  </ScrollView>
                </View>

                <View
                  style={styles.table}
                >
                  {isDesktop && (
                    <View
                      style={
                        styles.tableHeader
                      }
                    >
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.marketerHeader,
                        ]}
                      >
                        APPLICANT
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.contactHeader,
                        ]}
                      >
                        CONTACT
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.performanceHeader,
                        ]}
                      >
                        IDENTITY
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.areaHeader,
                        ]}
                      >
                        EXPERIENCE
                      </Text>
                    </View>
                  )}

                  {filteredApplications.length >
                  0 ? (
                    filteredApplications.map(
                      renderApplicationCard,
                    )
                  ) : (
                    <View
                      style={
                        styles.emptyState
                      }
                    >
                      <View
                        style={
                          styles.emptyIcon
                        }
                      >
                        <ShieldCheck
                          size={28}
                          color={
                            COLORS.mutedDark
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        No applications found
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        Try another search or
                        application status.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {mainTab ===
              'profileChanges' && (
              <>
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Marketer profile changes
                    </Text>

                    <Text
                      style={
                        styles.sectionSubtitle
                      }
                    >
                      {
                        filteredProfileChangeRequests.length
                      }{' '}
                      request
                      {filteredProfileChangeRequests.length ===
                      1
                        ? ''
                        : 's'} found
                    </Text>
                  </View>

                  <Pressable
                    onPress={
                      loadProfileChangeRequests
                    }
                    style={[
                      styles.refreshButton,
                    ]}
                  >
                    <Activity
                      size={16}
                      color={COLORS.lime}
                    />

                    <Text
                      style={
                        styles.refreshButtonText
                      }
                    >
                      Refresh
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={
                    styles.profileChangeNotice
                  }
                >
                  <View
                    style={
                      styles.profileChangeNoticeIcon
                    }
                  >
                    <ShieldCheck
                      size={17}
                      color={COLORS.orange}
                    />
                  </View>

                  <View
                    style={
                      styles.profileChangeNoticeContent
                    }
                  >
                    <Text
                      style={
                        styles.profileChangeNoticeTitle
                      }
                    >
                      Administrator approval required
                    </Text>

                    <Text
                      style={
                        styles.profileChangeNoticeText
                      }
                    >
                      Marketers cannot directly change
                      their name, phone number or email.
                      Review the old and requested values
                      before approving a change.
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  <View
                    style={
                      styles.filterScroll
                    }
                  >
                    {[
                      'All',
                      'PENDING',
                      'APPROVED',
                      'REJECTED',
                    ].map((status) => {
                      const active =
                        profileChangeFilter ===
                        status;

                      return (
                        <Pressable
                          key={status}
                          onPress={() =>
                            setProfileChangeFilter(
                              status as
                                | 'All'
                                | MarketerProfileChangeStatus,
                            )
                          }
                          style={[
                            styles.filterChip,
                            active &&
                              styles.filterChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              active &&
                                styles.filterChipTextActive,
                            ]}
                          >
                            {status ===
                            'PENDING'
                              ? 'Pending'
                              : status ===
                                  'APPROVED'
                                ? 'Approved'
                                : status ===
                                    'REJECTED'
                                  ? 'Rejected'
                                  : 'All'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {profileChangeError ? (
                  <View
                    style={
                      styles.errorBox
                    }
                  >
                    <XCircle
                      size={17}
                      color={COLORS.red}
                    />

                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {profileChangeError}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={
                    styles.changeRequestList
                  }
                >
                  {profileChangeLoading &&
                  filteredProfileChangeRequests.length ===
                    0 ? (
                    <View
                      style={
                        styles.emptyState
                      }
                    >
                      <View
                        style={
                          styles.emptyIcon
                        }
                      >
                        <Activity
                          size={28}
                          color={
                            COLORS.lime
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        Loading requests
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        Fetching marketer profile
                        change requests...
                      </Text>
                    </View>
                  ) : filteredProfileChangeRequests.length >
                    0 ? (
                    filteredProfileChangeRequests.map(
                      (request) => {
                        const marketerName =
                          getProfileChangeMarketerName(
                            request,
                          );

                        const fields =
                          getProfileChangeFields(
                            request,
                          );

                        const isPending =
                          request.status ===
                          'PENDING';

                        const statusColor =
                          request.status ===
                          'PENDING'
                            ? COLORS.orange
                            : request.status ===
                                'APPROVED'
                              ? COLORS.green
                              : COLORS.red;

                        const statusBackground =
                          request.status ===
                          'PENDING'
                            ? COLORS.orangeSoft
                            : request.status ===
                                'APPROVED'
                              ? COLORS.greenSoft
                              : COLORS.redSoft;

                        return (
                          <Pressable
                            key={request.id}
                            onPress={() =>
                              openProfileChangeRequest(
                                request,
                              )
                            }
                            style={({ pressed }) => [
                              styles.changeRequestCard,
                              pressed &&
                                styles.pressedCard,
                            ]}
                          >
                            <View
                              style={
                                styles.changeRequestHeader
                              }
                            >
                              <View
                                style={
                                  styles.changeRequestAvatar
                                }
                              >
                                <Text
                                  style={
                                    styles.changeRequestAvatarText
                                  }
                                >
                                  {marketerName
                                    .charAt(0)
                                    .toUpperCase()}
                                </Text>
                              </View>

                              <View
                                style={
                                  styles.changeRequestHeaderInfo
                                }
                              >
                                <Text
                                  style={
                                    styles.changeRequestMarketerName
                                  }
                                >
                                  {marketerName}
                                </Text>

                                <Text
                                  style={
                                    styles.changeRequestMarketerId
                                  }
                                >
                                  Marketer ID:{' '}
                                  {request.marketerId}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.changeRequestStatus,
                                  {
                                    backgroundColor:
                                      statusBackground,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.changeRequestStatusDot,
                                    {
                                      backgroundColor:
                                        statusColor,
                                    },
                                  ]}
                                />

                                <Text
                                  style={[
                                    styles.changeRequestStatusText,
                                    {
                                      color:
                                        statusColor,
                                    },
                                  ]}
                                >
                                  {request.status}
                                </Text>
                              </View>
                            </View>

                            <View
                              style={
                                styles.changeRequestFields
                              }
                            >
                              {fields.map(
                                (field) => (
                                  <View
                                    key={
                                      field.label
                                    }
                                    style={
                                      styles.changeRequestField
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.changeRequestFieldLabel
                                      }
                                    >
                                      {field.label.toUpperCase()}
                                    </Text>

                                    <View
                                      style={
                                        styles.changeRequestValueRow
                                      }
                                    >
                                      <View
                                        style={
                                          styles.changeRequestValueColumn
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.changeRequestValueLabel
                                          }
                                        >
                                          CURRENT
                                        </Text>

                                        <Text
                                          style={
                                            styles.changeRequestCurrentValue
                                          }
                                        >
                                          {field.current}
                                        </Text>
                                      </View>

                                      <View
                                        style={
                                          styles.changeRequestArrow
                                        }
                                      >
                                        <ChevronRight
                                          size={14}
                                          color={
                                            COLORS.muted
                                          }
                                        />
                                      </View>

                                      <View
                                        style={
                                          styles.changeRequestValueColumn
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.changeRequestValueLabel
                                          }
                                        >
                                          REQUESTED
                                        </Text>

                                        <Text
                                          style={
                                            styles.changeRequestRequestedValue
                                          }
                                        >
                                          {field.requested}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                ),
                              )}
                            </View>

                            {request.reason ? (
                              <View
                                style={
                                  styles.changeRequestReason
                                }
                              >
                                <Text
                                  style={
                                    styles.changeRequestReasonLabel
                                  }
                                >
                                  REASON
                                </Text>

                                <Text
                                  style={
                                    styles.changeRequestReasonText
                                  }
                                >
                                  {request.reason}
                                </Text>
                              </View>
                            ) : null}

                            {request.adminNotes ? (
                              <View
                                style={
                                  styles.changeRequestReviewNote
                                }
                              >
                                <Text
                                  style={
                                    styles.changeRequestReviewNoteLabel
                                  }
                                >
                                  ADMIN REVIEW NOTE
                                </Text>

                                <Text
                                  style={
                                    styles.changeRequestReviewNoteText
                                  }
                                >
                                  {request.adminNotes}
                                </Text>
                              </View>
                            ) : null}

                            {isPending ? (
                              <View
                                style={
                                  styles.changeRequestActions
                                }
                              >
                                <Pressable
                                  onPress={(event) => {
                                    event.stopPropagation();

                                    setSelectedProfileChangeRequest(
                                      request,
                                    );
                                    setProfileChangeRejectNotes(
                                      '',
                                    );
                                    setProfileChangeVisible(
                                      true,
                                    );
                                    setRejectProfileChangeVisible(
                                      true,
                                    );
                                  }}
                                  style={
                                    styles.rejectChangeButton
                                  }
                                >
                                  <XCircle
                                    size={15}
                                    color={
                                      COLORS.red
                                    }
                                  />

                                  <Text
                                    style={
                                      styles.rejectChangeButtonText
                                    }
                                  >
                                    Reject
                                  </Text>
                                </Pressable>

                                <Pressable
                                  onPress={(event) => {
                                    event.stopPropagation();

                                    handleApproveProfileChange(
                                      request,
                                    );
                                  }}
                                  style={
                                    styles.approveChangeButton
                                  }
                                >
                                  <Check
                                    size={15}
                                    color={
                                      COLORS.background
                                    }
                                  />

                                  <Text
                                    style={
                                      styles.approveChangeButtonText
                                    }
                                  >
                                    Approve
                                  </Text>
                                </Pressable>
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      },
                    )
                  ) : (
                    <View
                      style={
                        styles.emptyState
                      }
                    >
                      <View
                        style={
                          styles.emptyIcon
                        }
                      >
                        <Check
                          size={28}
                          color={
                            COLORS.mutedDark
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        No profile changes found
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        There are no marketer profile
                        change requests matching this
                        filter.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {mainTab ===
              'marketers' && (
              <>
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Marketer directory
                    </Text>

                    <Text
                      style={
                        styles.sectionSubtitle
                      }
                    >
                      {
                        filteredMarketers.length
                      }{' '}
                      marketer
                      {filteredMarketers.length ===
                      1
                        ? ''
                        : 's'} found
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                  >
                    <View
                      style={
                        styles.filterScroll
                      }
                    >
                      {MARKETER_FILTERS.map(
                        (status) => {
                          const active =
                            marketerFilter ===
                            status;

                          return (
                            <Pressable
                              key={status}
                              onPress={() =>
                                setMarketerFilter(
                                  status,
                                )
                              }
                              style={[
                                styles.filterChip,
                                active &&
                                  styles.filterChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.filterChipText,
                                  active &&
                                    styles.filterChipTextActive,
                                ]}
                              >
                                {status}
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                  </ScrollView>
                </View>

                <View
                  style={styles.table}
                >
                  {isDesktop && (
                    <View
                      style={
                        styles.tableHeader
                      }
                    >
                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.marketerHeader,
                        ]}
                      >
                        MARKETER
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.contactHeader,
                        ]}
                      >
                        CONTACT
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.performanceHeader,
                        ]}
                      >
                        ACTIVITY
                      </Text>

                      <Text
                        style={[
                          styles.tableHeaderText,
                          styles.areaHeader,
                        ]}
                      >
                        SPECIALTY
                      </Text>
                    </View>
                  )}

                  {filteredMarketers.length >
                  0 ? (
                    filteredMarketers.map(
                      renderMarketerCard,
                    )
                  ) : (
                    <View
                      style={
                        styles.emptyState
                      }
                    >
                      <View
                        style={
                          styles.emptyIcon
                        }
                      >
                        <Users
                          size={28}
                          color={
                            COLORS.mutedDark
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        No marketers found
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        Try another search or
                        account status.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            <View
              style={
                styles.performanceNotice
              }
            >
              <View
                style={
                  styles.performanceNoticeIcon
                }
              >
                <Activity
                  size={18}
                  color={COLORS.lime}
                />
              </View>

              <View
                style={
                  styles.performanceNoticeContent
                }
              >
                <Text
                  style={
                    styles.performanceNoticeTitle
                  }
                >
                  Marketer workflow
                </Text>

                <Text
                  style={
                    styles.performanceNoticeText
                  }
                >
                  Applicants are reviewed before
                  they receive marketer portal
                  access. Once approved, the
                  applicant becomes an active
                  marketer account. ID documents
                  and sensitive identity information
                  are intended for authorized admin
                  review only.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* =================================================
          APPLICATION REVIEW MODAL
         ================================================= */}

      <Modal
        visible={applicationVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setApplicationVisible(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.applicationModal,
              width < 700 &&
                styles.modalMobile,
            ]}
          >
            {selectedApplication && (
              <>
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.modalEyebrow
                      }
                    >
                      MARKETER APPLICATION
                    </Text>

                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {
                        selectedApplication.id
                      }
                    </Text>
                  </View>

                  <Pressable
                    style={
                      styles.modalClose
                    }
                    onPress={() =>
                      setApplicationVisible(
                        false,
                      )
                    }
                  >
                    <X
                      size={20}
                      color={
                        COLORS.muted
                      }
                    />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.modalScroll
                  }
                >
                  <View
                    style={
                      styles.profileHero
                    }
                  >
                    <View
                      style={
                        styles.profileAvatar
                      }
                    >
                      <Text
                        style={
                          styles.profileAvatarText
                        }
                      >
                        {selectedApplication.firstName
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.profileHeroInfo
                      }
                    >
                      <Text
                        style={
                          styles.profileName
                        }
                      >
                        {
                          selectedApplication.firstName
                        }{' '}
                        {
                          selectedApplication.lastName
                        }
                      </Text>

                      <Text
                        style={
                          styles.profileLocation
                        }
                      >
                        {selectedApplication.county}
                        {selectedApplication.constituencyId
                          ? ` • ${selectedApplication.constituencyId}`
                          : ''}
                        {selectedApplication.wardIds?.length
                          ? ` • ${selectedApplication.wardIds.join(', ')}`
                          : ''}
                      </Text>
                    </View>

                    {renderApplicationStatus(
                      selectedApplication.status,
                    )}
                  </View>

                  <View
                    style={
                      styles.detailGrid
                    }
                  >
                    <DetailItem
                      label="PHONE"
                      value={
                        selectedApplication.phone
                      }
                    />

                    <DetailItem
                      label="EMAIL"
                      value={
                        selectedApplication.email
                      }
                    />

                    <DetailItem
                      label="ID TYPE"
                      value={
                        selectedApplication.idType
                      }
                    />

                    <DetailItem
                      label="ID NUMBER"
                      value={
                        selectedApplication.idNumber
                      }
                    />

                    <DetailItem
                      label="TIME IN AREA"
                      value={
                        selectedApplication.timeInSelectedAreas
                      }
                    />

                    <DetailItem
                      label="CURRENT WORK"
                      value={
                        selectedApplication.currentOccupation
                      }
                    />
                  </View>

                  <ApplicationSection
                    title="LOCATION"
                  >
                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      County: {
                        selectedApplication.county
                      }
                    </Text>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Constituency:{' '}
                      {selectedApplication.constituencyId ||
                        'Not available'}
                    </Text>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Wards:{' '}
                      {selectedApplication.wardIds?.length
                        ? selectedApplication.wardIds.join(', ')
                        : 'None provided'}
                    </Text>
                  </ApplicationSection>

                  <ApplicationSection
                    title="REAL ESTATE EXPERIENCE"
                  >
                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Experience:{' '}
                      {selectedApplication.hasRealEstateExperience
                        ? 'Yes'
                        : 'No'}
                    </Text>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Duration:{' '}
                      {
                        selectedApplication.experienceDuration
                      }
                    </Text>

                    {selectedApplication.experienceAreas.length >
                      0 && (
                      <Text
                        style={
                          styles.sectionValue
                        }
                      >
                        Areas:{' '}
                        {selectedApplication.experienceAreas.join(
                          ', ',
                        )}
                      </Text>
                    )}

                    {selectedApplication.experienceDescription ? (
                      <Text
                        style={
                          styles.sectionDescription
                        }
                      >
                        {
                          selectedApplication.experienceDescription
                        }
                      </Text>
                    ) : null}
                  </ApplicationSection>

                  <ApplicationSection
                    title="MOTIVATION"
                  >
                    <Text
                      style={
                        styles.sectionDescription
                      }
                    >
                      {
                        selectedApplication.motivation
                      }
                    </Text>

                    <Text
                      style={
                        styles.detailLabelSpaced
                      }
                    >
                      CONTRIBUTION
                    </Text>

                    <Text
                      style={
                        styles.sectionDescription
                      }
                    >
                      {
                        selectedApplication.contribution
                      }
                    </Text>
                  </ApplicationSection>

                  <ApplicationSection
                    title="PROPERTY SOURCING"
                  >
                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Expected monthly properties:{' '}
                      {
                        selectedApplication.expectedPropertiesPerMonth
                      }
                    </Text>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Sources:{' '}
                      {selectedApplication.propertySources.join(
                        ', ',
                      )}
                    </Text>
                  </ApplicationSection>

                  <ApplicationSection
                    title="LANDLORD RELATIONSHIPS"
                  >
                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Knows landlords:{' '}
                      {
                        selectedApplication.knowsLandlords
                          ? 'Yes'
                          : 'No'
                      }
                    </Text>

                    {selectedApplication.approximateLandlordCount !==
                      null && (
                      <Text
                        style={
                          styles.sectionValue
                        }
                      >
                        Approximate landlords:{' '}
                        {
                          selectedApplication.approximateLandlordCount
                        }
                      </Text>
                    )}
                  </ApplicationSection>

                  <ApplicationSection
                    title="CUSTOMER COMMUNICATION"
                  >
                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Comfortable communicating:{' '}
                      {
                        selectedApplication.comfortableCommunicating
                          ? 'Yes'
                          : 'No'
                      }
                    </Text>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Methods:{' '}
                      {selectedApplication.communicationMethods.join(
                        ', ',
                      )}
                    </Text>
                  </ApplicationSection>

                  <ApplicationSection
                    title="COMMITMENT"
                  >
                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Availability:{' '}
                      {
                        selectedApplication.timeAvailability
                      }
                    </Text>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      Will follow MAKAZII procedures:{' '}
                      {
                        selectedApplication.willingToFollowProcedures
                          ? 'Yes'
                          : 'No'
                      }
                    </Text>
                  </ApplicationSection>

                  <ApplicationSection
                    title="IDENTITY DOCUMENTS"
                  >
                    <View
                      style={
                        styles.documentNotice
                      }
                    >
                      <ShieldCheck
                        size={18}
                        color={
                          COLORS.lime
                        }
                      />

                      <Text
                        style={
                          styles.documentNoticeText
                        }
                      >
                        Identity documents are
                        sensitive information and
                        should only be accessible
                        to authorized administrators.
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.sectionValue
                      }
                    >
                      {selectedApplication.idType ===
                      'National ID'
                        ? 'National ID front and back submitted'
                        : 'Passport identification page submitted'}
                    </Text>
                  </ApplicationSection>

                  {(selectedApplication.status ===
                    'ACTION_REQUIRED' ||
                    selectedApplication.requestedChanges) && (
                    <ApplicationSection
                      title="REQUESTED CHANGES"
                    >
                      <View
                        style={
                          styles.warningBox
                        }
                      >
                        <Text
                          style={
                            styles.warningText
                          }
                        >
                          {
                            selectedApplication.requestedChanges
                          }
                        </Text>
                      </View>
                    </ApplicationSection>
                  )}

                  {selectedApplication.status ===
                    'REJECTED' && (
                    <ApplicationSection
                      title="REJECTION REASON"
                    >
                      <View
                        style={
                          styles.rejectionBox
                        }
                      >
                        <Text
                          style={
                            styles.rejectionText
                          }
                        >
                          {
                            selectedApplication.rejectionReason
                          }
                        </Text>
                      </View>
                    </ApplicationSection>
                  )}

                  {selectedApplication.status !==
                    'APPROVED' &&
                    selectedApplication.status !==
                      'REJECTED' && (
                      <>
                        <View
                          style={
                            styles.formGroup
                          }
                        >
                          <Text
                            style={
                              styles.formLabel
                            }
                          >
                            ADMIN REVIEW NOTE
                          </Text>

                          <TextInput
                            value={
                              reviewNote
                            }
                            onChangeText={
                              setReviewNote
                            }
                            placeholder="Message for the applicant..."
                            placeholderTextColor={
                              COLORS.mutedDark
                            }
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={
                              styles.textArea
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.formGroup
                          }
                        >
                          <Text
                            style={
                              styles.formLabel
                            }
                          >
                            REJECTION REASON
                          </Text>

                          <TextInput
                            value={
                              rejectReason
                            }
                            onChangeText={
                              setRejectReason
                            }
                            placeholder="Only required when rejecting..."
                            placeholderTextColor={
                              COLORS.mutedDark
                            }
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={
                              styles.textArea
                            }
                          />
                        </View>
                      </>
                    )}
                </ScrollView>

                <View
                  style={
                    styles.modalActions
                  }
                >
                  {selectedApplication.status ===
                    'PENDING' && (
                    <Pressable
                      style={
                        styles.secondaryButton
                      }
                      onPress={
                        beginReview
                      }
                    >
                      <ShieldCheck
                        size={16}
                        color={
                          COLORS.white
                        }
                      />

                      <Text
                        style={
                          styles.secondaryButtonText
                        }
                      >
                        Start review
                      </Text>
                    </Pressable>
                  )}

                  {(selectedApplication.status ===
                    'UNDER_REVIEW' ||
                    selectedApplication.status ===
                      'ACTION_REQUIRED') && (
                    <Pressable
                      style={
                        styles.warningButton
                      }
                      onPress={
                        handleRequestChanges
                      }
                    >
                      <Activity
                        size={16}
                        color={
                          COLORS.background
                        }
                      />

                      <Text
                        style={
                          styles.confirmButtonText
                        }
                      >
                        Request changes
                      </Text>
                    </Pressable>
                  )}

                  {selectedApplication.status !==
                    'APPROVED' &&
                    selectedApplication.status !==
                      'REJECTED' && (
                    <>
                      <Pressable
                        style={
                          styles.confirmButton
                        }
                        onPress={
                          handleApproveApplication
                        }
                      >
                        <Check
                          size={16}
                          color={
                            COLORS.background
                          }
                        />

                        <Text
                          style={
                            styles.confirmButtonText
                          }
                        >
                          Approve
                        </Text>
                      </Pressable>

                      <Pressable
                        style={
                          styles.dangerButton
                        }
                        onPress={
                          handleRejectApplication
                        }
                      >
                        <XCircle
                          size={16}
                          color={
                            COLORS.red
                          }
                        />

                        <Text
                          style={
                            styles.dangerButtonText
                          }
                        >
                          Reject
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =================================================
          MARKETER DETAILS MODAL
         ================================================= */}

      <Modal
        visible={detailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setDetailsVisible(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.detailsModal,
              width < 650 &&
                styles.modalMobile,
            ]}
          >
            {selectedMarketer && (
              <>
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.modalEyebrow
                      }
                    >
                      MARKETER PROFILE
                    </Text>

                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {
                        selectedMarketer.id
                      }
                    </Text>
                  </View>

                  <Pressable
                    style={
                      styles.modalClose
                    }
                    onPress={() =>
                      setDetailsVisible(
                        false,
                      )
                    }
                  >
                    <X
                      size={20}
                      color={
                        COLORS.muted
                      }
                    />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.modalScroll
                  }
                >
                  <View
                    style={
                      styles.profileHero
                    }
                  >
                    <View
                      style={
                        styles.profileAvatar
                      }
                    >
                      <Text
                        style={
                          styles.profileAvatarText
                        }
                      >
                        {selectedMarketer.name
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.profileHeroInfo
                      }
                    >
                      <Text
                        style={
                          styles.profileName
                        }
                      >
                        {
                          selectedMarketer.name
                        }
                      </Text>

                      <Text
                        style={
                          styles.profileLocation
                        }
                      >
                        {
                          selectedMarketer.area
                        }
                      </Text>
                    </View>

                    {renderMarketerStatus(
                      selectedMarketer.status,
                    )}
                  </View>

                  <View
                    style={
                      styles.detailGrid
                    }
                  >
                    <DetailItem
                      label="PHONE"
                      value={
                        selectedMarketer.phone
                      }
                    />

                    <DetailItem
                      label="EMAIL"
                      value={
                        selectedMarketer.email
                      }
                    />

                    <DetailItem
                      label="PROPERTIES"
                      value={`${selectedMarketer.properties} sourced`}
                    />

                    <DetailItem
                      label="LANDLORDS"
                      value={`${selectedMarketer.landlords} onboarded`}
                    />

                    <DetailItem
                      label="VIEWINGS"
                      value={`${selectedMarketer.viewings} supported`}
                    />

                    <DetailItem
                      label="JOINED"
                      value={
                        selectedMarketer.joined
                      }
                    />
                  </View>

                  <ApplicationSection
                    title="FIELD ACTIVITY"
                  >
                    <View
                      style={
                        styles.activityCard
                      }
                    >
                      <ActivityMetric
                        icon={
                          <Home
                            size={17}
                            color={
                              COLORS.blue
                            }
                          />
                        }
                        value={
                          selectedMarketer.properties
                        }
                        label="Properties"
                      />

                      <ActivityMetric
                        icon={
                          <Users
                            size={17}
                            color={
                              COLORS.purple
                            }
                          />
                        }
                        value={
                          selectedMarketer.landlords
                        }
                        label="Landlords"
                      />

                      <ActivityMetric
                        icon={
                          <Eye
                            size={17}
                            color={
                              COLORS.green
                            }
                          />
                        }
                        value={
                          selectedMarketer.viewings
                        }
                        label="Viewings"
                      />
                    </View>
                  </ApplicationSection>

                  <ApplicationSection
                    title="ASSIGNMENT"
                  >
                    <View
                      style={
                        styles.assignmentCard
                      }
                    >
                      <MapPin
                        size={18}
                        color={
                          COLORS.lime
                        }
                      />

                      <View
                        style={
                          styles.assignmentInfo
                        }
                      >
                        <Text
                          style={
                            styles.assignmentTitle
                          }
                        >
                          Coverage area
                        </Text>

                        <Text
                          style={
                            styles.assignmentValue
                          }
                        >
                          {
                            selectedMarketer.area
                          }
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.assignmentCard
                      }
                    >
                      <Building2
                        size={18}
                        color={
                          COLORS.lime
                        }
                      />

                      <View
                        style={
                          styles.assignmentInfo
                        }
                      >
                        <Text
                          style={
                            styles.assignmentTitle
                          }
                        >
                          Specialization
                        </Text>

                        <Text
                          style={
                            styles.assignmentValue
                          }
                        >
                          {
                            selectedMarketer.experience
                          }
                        </Text>
                      </View>
                    </View>
                  </ApplicationSection>

                  <ApplicationSection
                    title="INTERNAL NOTES"
                  >
                    <View
                      style={
                        styles.notesBox
                      }
                    >
                      <Text
                        style={
                          styles.notesText
                        }
                      >
                        {selectedMarketer.notes ||
                          'No internal notes.'}
                      </Text>
                    </View>
                  </ApplicationSection>

                  {/* PORTAL ACCESS */}
                  <ApplicationSection
                    title="PORTAL ACCESS"
                  >
                    <View
                      style={
                        styles.portalAccessCard
                      }
                    >
                      <View
                        style={[
                          styles.portalAccessIcon,
                          {
                            backgroundColor:
                              selectedMarketer.portalAccess
                                ? COLORS.greenSoft
                                : COLORS.redSoft,
                          },
                        ]}
                      >
                        <LayoutDashboard
                          size={18}
                          color={
                            selectedMarketer.portalAccess
                              ? COLORS.green
                              : COLORS.red
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.portalAccessInfo
                        }
                      >
                        <Text
                          style={
                            styles.portalAccessTitle
                          }
                        >
                          {selectedMarketer.portalAccess
                            ? 'Portal access enabled'
                            : 'Portal access disabled'}
                        </Text>

                        <Text
                          style={
                            styles.portalAccessText
                          }
                        >
                          {selectedMarketer.portalAccess
                            ? 'This marketer can access the MAKAZII marketer portal.'
                            : 'This marketer cannot access the marketer portal.'}
                        </Text>
                      </View>
                    </View>
                  </ApplicationSection>
                </ScrollView>

                {/* =====================================
                    ADMIN MARKETER ACTIONS
                   ===================================== */}

                <View
                  style={
                    styles.modalActions
                  }
                >
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setDetailsVisible(false);
                      router.push({
                        pathname: '/admin/marketers/activity/[id]',
                        params: { id: selectedMarketer.id },
                      } as never);
                    }}
                  >
                    <Activity size={16} color={COLORS.lime} />
                    <Text style={styles.secondaryButtonText}>
                      Activity
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      selectedMarketer.status ===
                        'Active' &&
                      selectedMarketer.portalAccess
                        ? styles.dashboardButton
                        : styles.disabledButton
                    }
                    disabled={
                      !(
                        selectedMarketer.status ===
                          'Active' &&
                        selectedMarketer.portalAccess
                      )
                    }
                    onPress={
                      openMarketerDashboard
                    }
                  >
                    <LayoutDashboard
                      size={16}
                      color={
                        selectedMarketer.status ===
                          'Active' &&
                        selectedMarketer.portalAccess
                          ? COLORS.background
                          : COLORS.mutedDark
                      }
                    />

                    <Text
                      style={
                        selectedMarketer.status ===
                          'Active' &&
                        selectedMarketer.portalAccess
                          ? styles.dashboardButtonText
                          : styles.disabledButtonText
                      }
                    >
                      View dashboard
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.secondaryButton
                    }
                    onPress={() => {
                      setDetailsVisible(
                        false,
                      );

                      openEdit(
                        selectedMarketer,
                      );
                    }}
                  >
                    <Pencil
                      size={16}
                      color={
                        COLORS.white
                      }
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      selectedMarketer.status ===
                      'Inactive'
                        ? styles.confirmButton
                        : styles.dangerButton
                    }
                    onPress={
                      toggleMarketerStatus
                    }
                  >
                    {selectedMarketer.status ===
                    'Inactive' ? (
                      <Check
                        size={16}
                        color={
                          COLORS.background
                        }
                      />
                    ) : (
                      <XCircle
                        size={16}
                        color={
                          COLORS.red
                        }
                      />
                    )}

                    <Text
                      style={
                        selectedMarketer.status ===
                        'Inactive'
                          ? styles.confirmButtonText
                          : styles.dangerButtonText
                      }
                    >
                      {selectedMarketer.status ===
                      'Inactive'
                        ? 'Approve'
                        : 'Deactivate'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =================================================
          EDIT MARKETER MODAL
         ================================================= */}

      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEditVisible(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.formModal}
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
                  MARKETER PROFILE
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Edit marketer
                </Text>
              </View>

              <Pressable
                style={
                  styles.modalClose
                }
                onPress={() =>
                  setEditVisible(false)
                }
              >
                <X
                  size={20}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.formScroll
              }
            >
              <FormInput
                label="FULL NAME *"
                value={editName}
                onChangeText={
                  setEditName
                }
                placeholder="Marketer full name"
              />

              <FormInput
                label="PHONE NUMBER *"
                value={editPhone}
                onChangeText={
                  setEditPhone
                }
                placeholder="+254 7..."
                keyboardType="phone-pad"
              />

              <FormInput
                label="EMAIL"
                value={editEmail}
                onChangeText={
                  setEditEmail
                }
                placeholder="marketer@example.com"
                keyboardType="email-address"
              />

              <FormInput
                label="COVERAGE AREA *"
                value={editArea}
                onChangeText={
                  setEditArea
                }
                placeholder="e.g. Meru Town / Nchiru"
              />

              <FormInput
                label="SPECIALIZATION"
                value={editExperience}
                onChangeText={
                  setEditExperience
                }
                placeholder="Property onboarding"
              />

              <View
                style={styles.formGroup}
              >
                <Text
                  style={
                    styles.formLabel
                  }
                >
                  INTERNAL NOTES
                </Text>

                <TextInput
                  value={editNotes}
                  onChangeText={
                    setEditNotes
                  }
                  placeholder="Internal notes..."
                  placeholderTextColor={
                    COLORS.mutedDark
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={
                    styles.textArea
                  }
                />
              </View>
            </ScrollView>

            <View
              style={styles.formActions}
            >
              <Pressable
                style={
                  styles.cancelFormButton
                }
                onPress={() =>
                  setEditVisible(false)
                }
              >
                <Text
                  style={
                    styles.cancelFormText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.primaryFormButton
                }
                onPress={saveEdit}
              >
                <Check
                  size={17}
                  color={
                    COLORS.background
                  }
                />

                <Text
                  style={
                    styles.primaryFormButtonText
                  }
                >
                  Save changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.detailItem}
    >
      <Text
        style={styles.detailLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.detailValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function ApplicationSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={styles.modalSection}
    >
      <Text
        style={
          styles.modalSectionTitle
        }
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

function ActivityMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View
      style={
        styles.activityMetric
      }
    >
      <View
        style={
          styles.activityMetricIcon
        }
      >
        {icon}
      </View>

      <Text
        style={
          styles.activityMetricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.activityMetricLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: any;
}) {
  return (
    <View
      style={styles.formGroup}
    >
      <Text
        style={styles.formLabel}
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
          COLORS.mutedDark
        }
        keyboardType={
          keyboardType
        }
        autoCapitalize="none"
        style={
          styles.inputStandalone
        }
      />
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  app: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },

  sidebar: {
    width: 248,
    backgroundColor: COLORS.sidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  mobileSidebar: {
    width: 300,
  },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  sidebarHeader: {
    height: 82,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoMarkText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: '900',
  },

  brandName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  brandSubtitle: {
    marginTop: 2,
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  platformStatus: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },

  platformText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  sidebarScroll: {
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 30,
  },

  menuLabel: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginHorizontal: 10,
    marginBottom: 8,
  },

  navItem: {
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: COLORS.cardSoft,
  },

  navText: {
    flex: 1,
    color: COLORS.sidebarText,
    fontSize: 13,
    fontWeight: '600',
  },

  navTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },

  navBadge: {
    minWidth: 23,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBadgeText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 22,
  },

  adminCard: {
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  adminAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminAvatarText: {
    color: COLORS.background,
    fontWeight: '900',
  },

  adminInfo: {
    flex: 1,
  },

  adminName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  adminRole: {
    marginTop: 2,
    color: COLORS.mutedDark,
    fontSize: 10,
  },

  signOutButton: {
    minHeight: 44,
    marginTop: 10,
    paddingHorizontal: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  signOutText: {
    color: COLORS.sidebarText,
    fontSize: 12,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  contentDesktop: {
    maxWidth: 1800,
  },

  topBar: {
    minHeight: 82,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  breadcrumb: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  topTitle: {
    marginTop: 4,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  topSearch: {
    width: 280,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  topSearchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    paddingVertical: 0,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.red,
  },

  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topAvatarText: {
    color: COLORS.background,
    fontWeight: '900',
  },

  pageContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 50,
  },

  pageContentTablet: {
    paddingHorizontal: 30,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 24,
  },

  pageHeaderText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 7,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  pageDescription: {
    maxWidth: 720,
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
  },

  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '900',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  statsGridMobile: {
    flexWrap: 'wrap',
  },

  statCard: {
    flex: 1,
    minWidth: 160,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    marginTop: 17,
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '900',
  },

  statLabel: {
    marginTop: 2,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  statSubtext: {
    marginTop: 5,
    color: COLORS.mutedDark,
    fontSize: 9,
    lineHeight: 14,
  },

  mobileSearch: {
    height: 44,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  mobileSearchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
  },

  mainTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 24,
  },

  mainTab: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  mainTabActive: {
    borderBottomColor: COLORS.lime,
  },

  mainTabText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  mainTabTextActive: {
    color: COLORS.white,
  },

  mainTabBadge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainTabBadgeActive: {
    backgroundColor: COLORS.lime,
  },

  mainTabBadgeText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
  },

  mainTabBadgeTextActive: {
    color: COLORS.background,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.mutedDark,
    fontSize: 10,
  },

  filterScroll: {
    flexDirection: 'row',
    gap: 7,
  },

  filterChip: {
    paddingHorizontal: 11,
    minHeight: 32,
    borderRadius: 9,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterChipActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  filterChipText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  filterChipTextActive: {
    color: COLORS.background,
    fontWeight: '900',
  },

  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },

  tableHeader: {
    minHeight: 42,
    paddingHorizontal: 17,
    backgroundColor: COLORS.cardSoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tableHeaderText: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  marketerHeader: {
    flex: 2,
  },

  contactHeader: {
    flex: 1.5,
  },

  performanceHeader: {
    flex: 1.25,
  },

  areaHeader: {
    flex: 1.25,
  },

  applicationCard: {
    minHeight: 100,
    paddingHorizontal: 17,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  applicationIdentity: {
    flex: 2,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  applicationAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applicationAvatarText: {
    color: COLORS.lime,
    fontSize: 15,
    fontWeight: '900',
  },

  applicationIdentityText: {
    flex: 1,
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  applicationId: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '800',
  },

  applicationName: {
    marginTop: 4,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  locationRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  locationText: {
    flex: 1,
    color: COLORS.mutedDark,
    fontSize: 9,
  },

  contactColumn: {
    flex: 1.5,
    minWidth: 150,
  },

  columnLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 7,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },

  contactText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
  },

  applicationColumn: {
    flex: 1.25,
    minWidth: 110,
  },

  applicationValue: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  applicationMuted: {
    marginTop: 4,
    color: COLORS.mutedDark,
    fontSize: 8,
  },

  marketerCard: {
    minHeight: 105,
    paddingHorizontal: 17,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  marketerMain: {
    flex: 2,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  marketerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  marketerAvatarText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '900',
  },

  marketerIdentity: {
    flex: 1,
  },

  marketerId: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '800',
  },

  marketerName: {
    marginTop: 4,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  marketerMetaRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },

  pendingChangePill: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 7,
    backgroundColor: COLORS.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,180,91,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  pendingChangeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.orange,
  },

  pendingChangeText: {
    color: COLORS.orange,
    fontSize: 8,
    fontWeight: '900',
  },

  performanceColumn: {
    flex: 1.25,
    minWidth: 150,
  },

  activityStats: {
    flexDirection: 'row',
    gap: 18,
  },

  performanceValue: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  performanceLabel: {
    marginTop: 2,
    color: COLORS.mutedDark,
    fontSize: 8,
  },

  areaColumn: {
    flex: 1.25,
    minWidth: 120,
  },

  specialtyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  joinedText: {
    marginTop: 5,
    color: COLORS.mutedDark,
    fontSize: 8,
  },

  statusPill: {
    minHeight: 23,
    paddingHorizontal: 7,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '900',
  },

  emptyState: {
    minHeight: 260,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  emptyText: {
    marginTop: 5,
    color: COLORS.mutedDark,
    fontSize: 10,
    textAlign: 'center',
  },

  performanceNotice: {
    marginTop: 20,
    padding: 16,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
  },

  performanceNoticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  performanceNoticeContent: {
    flex: 1,
  },

  performanceNoticeTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  performanceNoticeText: {
    marginTop: 5,
    color: COLORS.mutedDark,
    fontSize: 9,
    lineHeight: 15,
  },

  modalOverlay: {
    flex: 1,
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  applicationModal: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '94%',
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  detailsModal: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  modalMobile: {
    maxHeight: '95%',
  },

  formModal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  modalHeader: {
    minHeight: 70,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalEyebrow: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  modalTitle: {
    marginTop: 4,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    padding: 20,
    paddingBottom: 28,
  },

  profileHero: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: '900',
  },

  profileHeroInfo: {
    flex: 1,
  },

  profileName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  profileLocation: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
  },

  detailGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },

  detailItem: {
    width: '33.15%',
    minHeight: 72,
    padding: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  detailValue: {
    marginTop: 6,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
  },

  modalSection: {
    marginTop: 20,
  },

  modalSectionTitle: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 9,
  },

  sectionValue: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 5,
  },

  sectionDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
  },

  detailLabelSpaced: {
    marginTop: 13,
    marginBottom: 6,
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  activityCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  activityMetric: {
    flex: 1,
    alignItems: 'center',
  },

  activityMetricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityMetricValue: {
    marginTop: 8,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  activityMetricLabel: {
    marginTop: 2,
    color: COLORS.mutedDark,
    fontSize: 9,
  },

  assignmentCard: {
    padding: 13,
    marginBottom: 8,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  assignmentInfo: {
    flex: 1,
  },

  assignmentTitle: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  assignmentValue: {
    marginTop: 4,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  notesBox: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notesText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 17,
  },

  portalAccessCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  portalAccessIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  portalAccessInfo: {
    flex: 1,
  },

  portalAccessTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  portalAccessText: {
    marginTop: 4,
    color: COLORS.mutedDark,
    fontSize: 9,
    lineHeight: 14,
  },

  documentNotice: {
    padding: 12,
    borderRadius: 11,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 9,
  },

  documentNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 15,
  },

  warningBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,180,91,0.2)',
  },

  warningText: {
    color: COLORS.orange,
    fontSize: 10,
    lineHeight: 16,
  },

  rejectionBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,112,112,0.2)',
  },

  rejectionText: {
    color: COLORS.red,
    fontSize: 10,
    lineHeight: 16,
  },

  profileChangeNotice: {
    marginBottom: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: COLORS.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,180,91,0.22)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  profileChangeNoticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileChangeNoticeContent: {
    flex: 1,
  },

  profileChangeNoticeTitle: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '900',
  },

  profileChangeNoticeText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 15,
  },

  refreshButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  refreshButtonText: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
  },

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
  },

  changeRequestList: {
    marginTop: 14,
    gap: 12,
  },

  pressedCard: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },

  changeRequestCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 13,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  changeRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  changeRequestAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  changeRequestAvatarText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  changeRequestHeaderInfo: {
    flex: 1,
  },

  changeRequestMarketerName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  changeRequestMarketerId: {
    marginTop: 3,
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '800',
  },

  changeRequestStatus: {
    minHeight: 23,
    paddingHorizontal: 8,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  changeRequestStatusPending: {
    backgroundColor: COLORS.orangeSoft,
  },

  changeRequestStatusApproved: {
    backgroundColor: COLORS.greenSoft,
  },

  changeRequestStatusRejected: {
    backgroundColor: COLORS.redSoft,
  },

  changeRequestStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  changeRequestStatusText: {
    fontSize: 8,
    fontWeight: '900',
  },

  changeRequestFields: {
    marginTop: 13,
    gap: 7,
  },

  changeRequestField: {
    padding: 11,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  changeRequestFieldLabel: {
    marginBottom: 7,
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  changeRequestValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  changeRequestValueColumn: {
    flex: 1,
    minWidth: 0,
  },

  changeRequestValueLabel: {
    marginBottom: 3,
    color: COLORS.mutedDark,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  changeRequestCurrentValue: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  changeRequestRequestedValue: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 15,
  },

  changeRequestArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  changeRequestReason: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  changeRequestReasonLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  changeRequestReasonText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  changeRequestReviewNote: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,112,112,0.18)',
  },

  changeRequestReviewNoteLabel: {
    color: COLORS.red,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },

  changeRequestReviewNoteText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  changeRequestActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },

  approveChangeButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  approveChangeButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },

  rejectChangeButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,112,112,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  rejectChangeButtonText: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '900',
  },

  profileChangeModal: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  profileChangeModalMobile: {
    maxHeight: '95%',
  },

  rejectionForm: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,112,112,0.18)',
  },

  rejectionFormLabel: {
    marginBottom: 7,
    color: COLORS.red,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  rejectionFormInput: {
    minHeight: 90,
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,112,112,0.18)',
    color: COLORS.white,
    fontSize: 10,
    lineHeight: 16,
    textAlignVertical: 'top',
  },

  modalActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },

  secondaryButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  dashboardButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  dashboardButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },

  disabledButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    opacity: 0.7,
  },

  disabledButtonText: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: '800',
  },

  confirmButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  confirmButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },

  warningButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  dangerButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,112,112,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  dangerButtonText: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '900',
  },

  formScroll: {
    padding: 20,
    paddingBottom: 25,
  },

  formGroup: {
    marginBottom: 15,
  },

  formLabel: {
    marginBottom: 7,
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  inputStandalone: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 11,
  },

  textArea: {
    minHeight: 100,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 11,
    lineHeight: 17,
  },

  formActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  cancelFormButton: {
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelFormText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  primaryFormButton: {
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  primaryFormButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },
});