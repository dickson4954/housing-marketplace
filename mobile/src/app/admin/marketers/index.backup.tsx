import React, { useMemo, useState } from 'react';
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
import { router } from 'expo-router';

import {
  Marketer,
  MarketerAccountStatus,
  MarketerApplication,
  MarketerApplicationStatus,
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

type MainTab = 'applications' | 'marketers';

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
    setSelectedApplication(application);
    setReviewNote('');
    setRejectReason('');
    setApplicationVisible(true);
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

  const saveEdit = () => {
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

    updateMarketer(
      selectedMarketer.id,
      {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        area: editArea.trim(),
        experience:
          editExperience.trim() ||
          'Property onboarding',
        notes: editNotes.trim(),
      },
    );

    setSelectedMarketer({
      ...selectedMarketer,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      area: editArea.trim(),
      experience:
        editExperience.trim() ||
        'Property onboarding',
      notes: editNotes.trim(),
    });

    setEditVisible(false);

    Alert.alert(
      'Marketer updated',
      'The marketer information has been updated.',
    );
  };

  const toggleMarketerStatus = () => {
    if (!selectedMarketer) return;

    if (
      selectedMarketer.status ===
      'Suspended'
    ) {
      activateMarketer(
        selectedMarketer.id,
      );

      setSelectedMarketer({
        ...selectedMarketer,
        status: 'Active',
        portalAccess: true,
      });

      Alert.alert(
        'Marketer activated',
        `${selectedMarketer.name} is active and has portal access.`,
      );

      return;
    }

    suspendMarketer(
      selectedMarketer.id,
    );

    setSelectedMarketer({
      ...selectedMarketer,
      status: 'Suspended',
      portalAccess: false,
    });

    Alert.alert(
      'Marketer suspended',
      `${selectedMarketer.name} has been suspended and portal access disabled.`,
    );
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
                {application.places.length
                  ? ` • ${application.places.join(', ')}`
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
            style={styles.columnLabel}
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

            {/* ==========================================
                TOP SUMMARY
               ========================================== */}

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

            {/* ==========================================
                MAIN TABS
               ========================================== */}

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
            </View>

            {/* ==========================================
                APPLICATIONS
               ========================================== */}

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

            {/* ==========================================
                MARKETERS
               ========================================== */}

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
                        {selectedApplication.places.length
                          ? ` • ${selectedApplication.places.join(', ')}`
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
                      Places:{' '}
                      {selectedApplication.places.join(
                        ', ',
                      ) ||
                        'None provided'}
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

                  {/* REVIEW INPUTS */}

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
                </ScrollView>

                <View
                  style={
                    styles.modalActions
                  }
                >
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
                      'Suspended'
                        ? styles.confirmButton
                        : styles.dangerButton
                    }
                    onPress={
                      toggleMarketerStatus
                    }
                  >
                    {selectedMarketer.status ===
                    'Suspended' ? (
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
                        'Suspended'
                          ? styles.confirmButtonText
                          : styles.dangerButtonText
                      }
                    >
                      {selectedMarketer.status ===
                      'Suspended'
                        ? 'Activate'
                        : 'Suspend'}
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
    width: 245,
    backgroundColor: COLORS.sidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  mobileSidebar: {
    width: 300,
  },

  sidebarHeader: {
    height: 82,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  brandSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },

  platformStatus: {
    marginHorizontal: 16,
    marginBottom: 20,
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
    paddingBottom: 30,
  },

  menuLabel: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  navItem: {
    height: 46,
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
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
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  navBadgeText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },

  adminCard: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminAvatarText: {
    color: COLORS.background,
    fontSize: 13,
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
    color: COLORS.mutedDark,
    fontSize: 10,
    marginTop: 2,
  },

  signOutButton: {
    height: 44,
    marginTop: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  signOutText: {
    color: COLORS.sidebarText,
    fontSize: 12,
    fontWeight: '600',
  },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 40,
  },

  content: {
    flex: 1,
  },

  contentDesktop: {
    minWidth: 0,
  },

  topBar: {
    height: 76,
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
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  topTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  topSearch: {
    width: 260,
    height: 40,
    paddingHorizontal: 12,
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
    outlineStyle: 'none',
  } as any,

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
    right: 9,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.red,
  },

  topAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topAvatarText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '900',
  },

  pageContent: {
    padding: 24,
    paddingBottom: 60,
  },

  pageContentTablet: {
    paddingHorizontal: 28,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 26,
  },

  pageHeaderText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 7,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
  },

  pageDescription: {
    maxWidth: 700,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
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
    marginBottom: 26,
  },

  statsGridMobile: {
    flexWrap: 'wrap',
  },

  statCard: {
    flex: 1,
    minWidth: 155,
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
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 18,
  },

  statLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  statSubtext: {
    color: COLORS.mutedDark,
    fontSize: 9,
    marginTop: 5,
  },

  mobileSearch: {
    height: 46,
    borderRadius: 11,
    paddingHorizontal: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 18,
  },

  mobileSearchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
  },

  mainTabs: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },

  mainTab: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  mainTabActive: {
    backgroundColor: COLORS.cardSoft,
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
    minWidth: 21,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
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
    gap: 16,
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 10,
    marginTop: 4,
  },

  filterScroll: {
    flexDirection: 'row',
    gap: 7,
  },

  filterChip: {
    minHeight: 34,
    paddingHorizontal: 11,
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
    fontWeight: '800',
  },

  filterChipTextActive: {
    color: COLORS.background,
  },

  table: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  tableHeader: {
    minHeight: 40,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  tableHeaderText: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  marketerHeader: {
    flex: 1.4,
  },

  contactHeader: {
    flex: 1.1,
  },

  performanceHeader: {
    flex: 0.8,
  },

  areaHeader: {
    flex: 1,
  },

  applicationCard: {
    minHeight: 100,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  applicationIdentity: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minWidth: 180,
  },

  applicationAvatar: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applicationAvatarText: {
    color: COLORS.blue,
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
    flexWrap: 'wrap',
  },

  applicationId: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
  },

  applicationName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },

  applicationColumn: {
    flex: 0.9,
    minWidth: 110,
  },

  applicationValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  applicationMuted: {
    color: COLORS.mutedDark,
    fontSize: 9,
    marginTop: 3,
  },

  marketerCard: {
    minHeight: 105,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  marketerMain: {
    flex: 1.4,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  marketerAvatar: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  marketerAvatarText: {
    color: COLORS.purple,
    fontSize: 15,
    fontWeight: '900',
  },

  marketerIdentity: {
    flex: 1,
  },

  marketerId: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: '900',
  },

  marketerName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },

  locationText: {
    color: COLORS.muted,
    fontSize: 10,
    flexShrink: 1,
  },

  contactColumn: {
    flex: 1.1,
    minWidth: 150,
  },

  columnLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  contactText: {
    color: COLORS.muted,
    fontSize: 10,
    flexShrink: 1,
  },

  performanceColumn: {
    flex: 0.8,
    minWidth: 125,
  },

  activityStats: {
    flexDirection: 'row',
    gap: 15,
  },

  performanceValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  performanceLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    marginTop: 2,
  },

  areaColumn: {
    flex: 1,
    minWidth: 130,
  },

  specialtyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  joinedText: {
    color: COLORS.mutedDark,
    fontSize: 8,
    marginTop: 5,
  },

  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 23,
    paddingHorizontal: 8,
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
    paddingVertical: 55,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  emptyText: {
    color: COLORS.mutedDark,
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },

  performanceNotice: {
    marginTop: 18,
    padding: 15,
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
    backgroundColor: `${COLORS.lime}14`,
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
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  applicationModal: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '92%',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  detailsModal: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '88%',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  formModal: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  modalMobile: {
    maxHeight: '94%',
  },

  modalHeader: {
    minHeight: 72,
    paddingHorizontal: 20,
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
    letterSpacing: 1.5,
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    padding: 20,
    paddingBottom: 30,
  },

  profileHero: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '900',
  },

  profileHeroInfo: {
    flex: 1,
  },

  profileName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  profileLocation: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },

  detailItem: {
    flex: 1,
    minWidth: 180,
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  detailLabelSpaced: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
  },

  detailValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  modalSection: {
    marginTop: 20,
  },

  modalSectionTitle: {
    color: COLORS.mutedDark,
    fontSize: 9,
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

  documentNotice: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.blueSoft,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 9,
  },

  documentNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  warningBox: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.purpleSoft,
    borderWidth: 1,
    borderColor: `${COLORS.purple}40`,
  },

  warningText: {
    color: COLORS.purple,
    fontSize: 11,
    lineHeight: 17,
  },

  rejectionBox: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: `${COLORS.red}40`,
  },

  rejectionText: {
    color: COLORS.red,
    fontSize: 11,
    lineHeight: 17,
  },

  activityCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  activityMetric: {
    alignItems: 'center',
    minWidth: 80,
  },

  activityMetricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityMetricValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 7,
  },

  activityMetricLabel: {
    color: COLORS.mutedDark,
    fontSize: 9,
    marginTop: 2,
  },

  assignmentCard: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 8,
  },

  assignmentInfo: {
    flex: 1,
  },

  assignmentTitle: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  assignmentValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  notesBox: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notesText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },

  modalActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: COLORS.card,
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
    borderColor: `${COLORS.red}55`,
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
    paddingBottom: 30,
  },

  formGroup: {
    marginBottom: 15,
  },

  formLabel: {
    color: COLORS.mutedDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 7,
  },

  inputStandalone: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 12,
  },

  textArea: {
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 12,
  },

  formActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  cancelFormButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  cancelFormText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },

  primaryFormButton: {
    minHeight: 42,
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
    fontSize: 11,
    fontWeight: '900',
  },
});