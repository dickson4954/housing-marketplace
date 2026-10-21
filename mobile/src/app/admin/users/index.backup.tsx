import React, { useMemo, useState } from 'react';
import {
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
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react-native';

const COLORS = {
  background: '#0B0F10',
  sidebar: '#0E1314',
  card: '#14191B',
  cardSoft: '#181E20',
  lime: '#D7FF5F',
  white: '#FFFFFF',
  muted: '#9CA5A7',
  sidebarText: '#7F898B',
  border: '#252C2E',
  danger: '#FF6B6B',
  warning: '#FFC857',
  success: '#7BE495',
};

type UserStatus = 'Active' | 'Inactive' | 'Blocked';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joined: string;
  status: UserStatus;
  savedHomes: number;
  viewings: number;
};

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/admin/dashboard' },
  { label: 'Properties', icon: Building2, route: '/admin/properties' },
  { label: 'Viewings', icon: CalendarDays, route: '/admin/viewings', badge: '24' },
  { label: 'Verification', icon: ShieldCheck, route: '/admin/verification', badge: '12' },
  { label: 'Landlords', icon: UserRound, route: '/admin/landlords' },
  { label: 'Marketers', icon: Megaphone, route: '/admin/marketers' },
  { label: 'Users', icon: UsersRound, route: '/admin/users' },
  { label: 'Settings', icon: Settings, route: '/admin/settings' },
];

const MOCK_USERS: UserRecord[] = [
  {
    id: 'USR-001',
    name: 'Brian Mwangi',
    email: 'brian@example.com',
    phone: '+254 712 345 678',
    location: 'Kilimani, Nairobi',
    joined: '24 Sep 2026',
    status: 'Active',
    savedHomes: 8,
    viewings: 3,
  },
  {
    id: 'USR-002',
    name: 'Faith Wanjiku',
    email: 'faith@example.com',
    phone: '+254 723 456 789',
    location: 'Muthaiga, Nairobi',
    joined: '22 Sep 2026',
    status: 'Active',
    savedHomes: 5,
    viewings: 2,
  },
  {
    id: 'USR-003',
    name: 'Kevin Mutua',
    email: 'kevin@example.com',
    phone: '+254 734 567 890',
    location: 'Nchiru, Meru',
    joined: '20 Sep 2026',
    status: 'Inactive',
    savedHomes: 3,
    viewings: 1,
  },
  {
    id: 'USR-004',
    name: 'Mercy Njeri',
    email: 'mercy@example.com',
    phone: '+254 745 678 901',
    location: 'Kileleshwa, Nairobi',
    joined: '19 Sep 2026',
    status: 'Active',
    savedHomes: 11,
    viewings: 4,
  },
  {
    id: 'USR-005',
    name: 'Daniel Kiptoo',
    email: 'daniel@example.com',
    phone: '+254 756 789 012',
    location: 'Westlands, Nairobi',
    joined: '17 Sep 2026',
    status: 'Blocked',
    savedHomes: 2,
    viewings: 0,
  },
  {
    id: 'USR-006',
    name: 'Sharon Akinyi',
    email: 'sharon@example.com',
    phone: '+254 767 890 123',
    location: 'Roysambu, Nairobi',
    joined: '15 Sep 2026',
    status: 'Active',
    savedHomes: 6,
    viewings: 2,
  },
  {
    id: 'USR-007',
    name: 'Sammy Kimani',
    email: 'sammy@example.com',
    phone: '+254 778 901 234',
    location: 'Kasarani, Nairobi',
    joined: '12 Sep 2026',
    status: 'Inactive',
    savedHomes: 4,
    viewings: 1,
  },
  {
    id: 'USR-008',
    name: 'Esther Wambui',
    email: 'esther@example.com',
    phone: '+254 789 012 345',
    location: 'Mikinduri, Meru',
    joined: '10 Sep 2026',
    status: 'Active',
    savedHomes: 9,
    viewings: 3,
  },
];

export default function UsersPage() {
  const { width } = useWindowDimensions();

  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | UserStatus>('All');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDesktop = width >= 900;

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchesFilter =
        filter === 'All' ? true : user.status === filter;

      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [users, search, filter]);

  const total = users.length;
  const active = users.filter((u) => u.status === 'Active').length;
  const inactive = users.filter((u) => u.status === 'Inactive').length;
  const blocked = users.filter((u) => u.status === 'Blocked').length;

  const updateStatus = (id: string, status: UserStatus) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, status } : user
      )
    );

    setSelectedUser((current) =>
      current && current.id === id
        ? { ...current, status }
        : current
    );
  };

  const navigate = (route: string) => {
    // Navigation is intentionally kept simple for this frontend phase.
    // The actual router can be connected here when the admin navigation
    // is centralized.
    console.log(`Navigate to ${route}`);
  };

  return (
    <View style={styles.container}>
      {isDesktop ? (
        <View style={styles.desktopSidebar}>
          <SidebarContent navigate={navigate} />
        </View>
      ) : sidebarOpen ? (
        <View style={styles.mobileSidebarOverlay}>
          <View style={styles.mobileSidebar}>
            <View style={styles.mobileSidebarHeader}>
              <Text style={styles.mobileSidebarTitle}>MAKAZII</Text>

              <Pressable
                style={styles.closeButton}
                onPress={() => setSidebarOpen(false)}
              >
                <X size={20} color={COLORS.white} />
              </Pressable>
            </View>

            <SidebarContent
              navigate={(route) => {
                setSidebarOpen(false);
                navigate(route);
              }}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.main}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            {!isDesktop && (
              <Pressable
                style={styles.menuButton}
                onPress={() => setSidebarOpen(true)}
              >
                <Menu size={21} color={COLORS.white} />
              </Pressable>
            )}

            <View>
              <Text style={styles.breadcrumb}>ADMIN / USERS</Text>
              <Text style={styles.topbarTitle}>Customer management</Text>
            </View>
          </View>

          <View style={styles.topbarRight}>
            <Pressable style={styles.iconButton}>
              <Bell size={19} color={COLORS.white} />
              <View style={styles.notificationDot} />
            </Pressable>

            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>A</Text>
            </View>

            {isDesktop && (
              <View>
                <Text style={styles.adminName}>Admin</Text>
                <Text style={styles.adminRole}>Platform administrator</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.eyebrow}>CUSTOMER DIRECTORY</Text>
              <Text style={styles.pageTitle}>Users</Text>
              <Text style={styles.pageSubtitle}>
                Monitor customer activity, saved homes and viewing requests.
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              label="Total users"
              value={String(total)}
              description="Registered customers"
              icon={UsersRound}
            />

            <StatCard
              label="Active"
              value={String(active)}
              description="Currently active"
              icon={Check}
              accent={COLORS.success}
            />

            <StatCard
              label="Inactive"
              value={String(inactive)}
              description="No recent activity"
              icon={Clock3}
              accent={COLORS.warning}
            />

            <StatCard
              label="Blocked"
              value={String(blocked)}
              description="Restricted accounts"
              icon={ShieldCheck}
              accent={COLORS.danger}
            />
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Search size={18} color={COLORS.muted} />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search users, email, location..."
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(['All', 'Active', 'Inactive', 'Blocked'] as const).map(
                (item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.filterButton,
                      filter === item && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilter(item)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === item && styles.filterTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Customer directory</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredUsers.length} users shown
              </Text>
            </View>
          </View>

          {isDesktop ? (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeading, styles.userColumn]}>
                  USER
                </Text>
                <Text style={[styles.tableHeading, styles.locationColumn]}>
                  LOCATION
                </Text>
                <Text style={[styles.tableHeading, styles.activityColumn]}>
                  ACTIVITY
                </Text>
                <Text style={[styles.tableHeading, styles.statusColumn]}>
                  STATUS
                </Text>
                <Text style={[styles.tableHeading, styles.actionColumn]}>
                  ACTION
                </Text>
              </View>

              {filteredUsers.map((user) => (
                <Pressable
                  key={user.id}
                  style={styles.tableRow}
                  onPress={() => setSelectedUser(user)}
                >
                  <View style={[styles.userColumn, styles.userCell]}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.name.charAt(0)}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userId}>{user.id}</Text>
                    </View>
                  </View>

                  <View style={styles.locationColumn}>
                    <Text style={styles.locationText}>{user.location}</Text>
                    <Text style={styles.joinedText}>
                      Joined {user.joined}
                    </Text>
                  </View>

                  <View style={styles.activityColumn}>
                    <View style={styles.activityItem}>
                      <HeartPlaceholder />
                      <Text style={styles.activityText}>
                        {user.savedHomes} saved homes
                      </Text>
                    </View>

                    <View style={styles.activityItem}>
                      <CalendarDays size={14} color={COLORS.muted} />
                      <Text style={styles.activityText}>
                        {user.viewings} viewings
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusColumn}>
                    <StatusBadge status={user.status} />
                  </View>

                  <View style={styles.actionColumn}>
                    <Pressable
                      style={styles.viewButton}
                      onPress={() => setSelectedUser(user)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                      <ChevronRight
                        size={15}
                        color={COLORS.lime}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              ))}

              {filteredUsers.length === 0 && (
                <EmptyState />
              )}
            </View>
          ) : (
            <View style={styles.mobileList}>
              {filteredUsers.map((user) => (
                <Pressable
                  key={user.id}
                  style={styles.mobileUserCard}
                  onPress={() => setSelectedUser(user)}
                >
                  <View style={styles.mobileUserTop}>
                    <View style={styles.userCell}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {user.name.charAt(0)}
                        </Text>
                      </View>

                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>

                    <StatusBadge status={user.status} />
                  </View>

                  <View style={styles.mobileDivider} />

                  <View style={styles.mobileMetaRow}>
                    <View style={styles.mobileMetaItem}>
                      <MapPin size={14} color={COLORS.muted} />
                      <Text style={styles.mobileMetaText}>
                        {user.location}
                      </Text>
                    </View>

                    <Text style={styles.userId}>{user.id}</Text>
                  </View>

                  <View style={styles.mobileActivityRow}>
                    <Text style={styles.mobileActivityText}>
                      {user.savedHomes} saved homes
                    </Text>

                    <Text style={styles.mobileActivityText}>
                      {user.viewings} viewings
                    </Text>

                    <ChevronRight
                      size={17}
                      color={COLORS.muted}
                    />
                  </View>
                </Pressable>
              ))}

              {filteredUsers.length === 0 && <EmptyState />}
            </View>
          )}

          <View style={styles.demoNotice}>
            <ShieldCheck size={18} color={COLORS.lime} />

            <View style={styles.demoNoticeContent}>
              <Text style={styles.demoNoticeTitle}>
                Frontend demonstration
              </Text>

              <Text style={styles.demoNoticeText}>
                These customer records are currently local demo data.
                Authentication, customer activity and account changes will
                connect to the Makazii backend later.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={Boolean(selectedUser)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModal}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalEyebrow}>
                      CUSTOMER PROFILE
                    </Text>
                    <Text style={styles.modalTitle}>
                      {selectedUser.name}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setSelectedUser(null)}
                  >
                    <X size={20} color={COLORS.white} />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScroll}
                >
                  <View style={styles.profileHero}>
                    <View style={styles.largeAvatar}>
                      <Text style={styles.largeAvatarText}>
                        {selectedUser.name.charAt(0)}
                      </Text>
                    </View>

                    <View style={styles.profileHeroText}>
                      <Text style={styles.profileName}>
                        {selectedUser.name}
                      </Text>
                      <Text style={styles.profileEmail}>
                        {selectedUser.email}
                      </Text>
                      <StatusBadge status={selectedUser.status} />
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <InfoItem
                      icon={Mail}
                      label="Email"
                      value={selectedUser.email}
                    />

                    <InfoItem
                      icon={MapPin}
                      label="Location"
                      value={selectedUser.location}
                    />

                    <InfoItem
                      icon={CalendarDays}
                      label="Joined"
                      value={selectedUser.joined}
                    />

                    <InfoItem
                      icon={Building2}
                      label="Saved homes"
                      value={String(selectedUser.savedHomes)}
                    />

                    <InfoItem
                      icon={Clock3}
                      label="Viewings"
                      value={String(selectedUser.viewings)}
                    />

                    <InfoItem
                      icon={UserRound}
                      label="Customer ID"
                      value={selectedUser.id}
                    />
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Account status
                    </Text>

                    <View style={styles.statusOptions}>
                      {(['Active', 'Inactive', 'Blocked'] as const).map(
                        (status) => (
                          <Pressable
                            key={status}
                            style={[
                              styles.statusOption,
                              selectedUser.status === status &&
                                styles.statusOptionActive,
                            ]}
                            onPress={() =>
                              updateStatus(selectedUser.id, status)
                            }
                          >
                            {selectedUser.status === status && (
                              <Check
                                size={15}
                                color={COLORS.lime}
                              />
                            )}

                            <Text
                              style={[
                                styles.statusOptionText,
                                selectedUser.status === status &&
                                  styles.statusOptionTextActive,
                              ]}
                            >
                              {status}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.securityNotice}>
                    <ShieldCheck size={17} color={COLORS.lime} />

                    <Text style={styles.securityNoticeText}>
                      Customer contact information is for authorized Makazii
                      team use. Landlords should not receive customer
                      information through the public customer app.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setSelectedUser(null)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Close
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => setSelectedUser(null)}
                  >
                    <Check size={16} color={COLORS.background} />
                    <Text style={styles.primaryButtonText}>
                      Done
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SidebarContent({
  navigate,
}: {
  navigate: (route: string) => void;
}) {
  return (
    <View style={styles.sidebarContent}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>MAKAZII</Text>
        <Text style={styles.brandSubtitle}>TEAM PORTAL</Text>

        <View style={styles.onlineRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>PLATFORM ONLINE</Text>
        </View>
      </View>

      <View style={styles.navSection}>
        <Text style={styles.navLabel}>WORKSPACE</Text>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.label === 'Users';

          return (
            <Pressable
              key={item.label}
              style={[
                styles.navItem,
                active && styles.navItemActive,
              ]}
              onPress={() => navigate(item.route)}
            >
              <Icon
                size={18}
                color={active ? COLORS.lime : COLORS.sidebarText}
              />

              <Text
                style={[
                  styles.navItemText,
                  active && styles.navItemTextActive,
                ]}
              >
                {item.label}
              </Text>

              {item.badge && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>
                    {item.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sidebarBottom}>
        <View style={styles.adminMiniProfile}>
          <View style={styles.adminAvatar}>
            <Text style={styles.adminAvatarText}>A</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.adminName}>Admin</Text>
            <Text style={styles.adminRole}>Administrator</Text>
          </View>

          <MoreHorizontal
            size={18}
            color={COLORS.sidebarText}
          />
        </View>

        <Text style={styles.sidebarFooter}>
          MAKAZII · FIND YOUR PLACE
        </Text>
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = COLORS.lime,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>{label}</Text>

        <View
          style={[
            styles.statIcon,
            { borderColor: `${accent}33` },
          ]}
        >
          <Icon size={17} color={accent} />
        </View>
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDescription}>{description}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const color =
    status === 'Active'
      ? COLORS.success
      : status === 'Inactive'
        ? COLORS.warning
        : COLORS.danger;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          borderColor: `${color}44`,
          backgroundColor: `${color}10`,
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          { backgroundColor: color },
        ]}
      />

      <Text
        style={[
          styles.statusBadgeText,
          { color },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Icon size={16} color={COLORS.lime} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <UsersRound size={28} color={COLORS.muted} />

      <Text style={styles.emptyTitle}>No users found</Text>

      <Text style={styles.emptyText}>
        Try changing your search or status filter.
      </Text>
    </View>
  );
}

function HeartPlaceholder() {
  return (
    <View style={styles.heartPlaceholder}>
      <Text style={styles.heartText}>♡</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },

  desktopSidebar: {
    width: 245,
    backgroundColor: COLORS.sidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  mobileSidebarOverlay: {
    position: 'absolute',
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  mobileSidebar: {
    width: 285,
    height: '100%',
    backgroundColor: COLORS.sidebar,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  mobileSidebarHeader: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  mobileSidebarTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },

  sidebarContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 24,
  },

  brandBlock: {
    paddingHorizontal: 10,
    paddingBottom: 25,
  },

  brand: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },

  brandSubtitle: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 7,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: COLORS.success,
  },

  onlineText: {
    color: COLORS.sidebarText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  navSection: {
    flex: 1,
  },

  navLabel: {
    color: COLORS.sidebarText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 10,
    marginBottom: 10,
  },

  navItem: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: '#1A211F',
  },

  navItemText: {
    flex: 1,
    color: COLORS.sidebarText,
    fontSize: 13,
    fontWeight: '600',
  },

  navItemTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },

  navBadge: {
    minWidth: 24,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 7,
    backgroundColor: '#252C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBadgeText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  sidebarBottom: {
    paddingTop: 15,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  adminMiniProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 18,
  },

  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminAvatarText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
  },

  adminName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  adminRole: {
    color: COLORS.sidebarText,
    fontSize: 10,
    marginTop: 2,
  },

  sidebarFooter: {
    color: COLORS.sidebarText,
    fontSize: 8,
    letterSpacing: 1,
    paddingHorizontal: 8,
  },

  main: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  topbar: {
    minHeight: 78,
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  breadcrumb: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  topbarTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },

  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderRadius: 6,
    backgroundColor: COLORS.lime,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 28,
    paddingBottom: 60,
  },

  pageHeader: {
    marginBottom: 25,
  },

  pageHeaderText: {
    maxWidth: 720,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  pageSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 18,
  },

  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSoft,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 14,
  },

  statDescription: {
    color: COLORS.sidebarText,
    fontSize: 10,
    marginTop: 3,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },

  searchBox: {
    flex: 1,
    minHeight: 46,
    maxWidth: 520,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 12,
    paddingVertical: 0,
  },

  filterRow: {
    gap: 7,
  },

  filterButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: COLORS.lime,
    borderColor: COLORS.lime,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },

  filterTextActive: {
    color: COLORS.background,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: COLORS.sidebarText,
    fontSize: 10,
    marginTop: 3,
  },

  tableCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    overflow: 'hidden',
  },

  tableHeader: {
    minHeight: 46,
    backgroundColor: '#111617',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  tableHeading: {
    color: COLORS.sidebarText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  tableRow: {
    minHeight: 82,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  userColumn: {
    flex: 2.1,
  },

  locationColumn: {
    flex: 1.5,
  },

  activityColumn: {
    flex: 1.3,
  },

  statusColumn: {
    flex: 1,
  },

  actionColumn: {
    flex: 0.75,
    alignItems: 'flex-end',
  },

  userCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#232B2D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userAvatarText: {
    color: COLORS.lime,
    fontSize: 15,
    fontWeight: '900',
  },

  userInfo: {
    minWidth: 0,
  },

  userName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  userEmail: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  userId: {
    color: COLORS.sidebarText,
    fontSize: 8,
    letterSpacing: 0.7,
    marginTop: 3,
  },

  locationText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  joinedText: {
    color: COLORS.sidebarText,
    fontSize: 9,
    marginTop: 4,
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },

  activityText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  heartPlaceholder: {
    width: 16,
    alignItems: 'center',
  },

  heartText: {
    color: COLORS.muted,
    fontSize: 17,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    minHeight: 27,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },

  viewButton: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34403C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  viewButtonText: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: '900',
  },

  mobileList: {
    gap: 10,
  },

  mobileUserCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 15,
  },

  mobileUserTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  mobileDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 13,
  },

  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mobileMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  mobileMetaText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  mobileActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 13,
  },

  mobileActivityText: {
    color: COLORS.sidebarText,
    fontSize: 10,
    flex: 1,
  },

  emptyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },

  demoNotice: {
    marginTop: 20,
    padding: 16,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#34402C',
    backgroundColor: '#151B15',
    flexDirection: 'row',
    gap: 11,
  },

  demoNoticeContent: {
    flex: 1,
  },

  demoNoticeTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  demoNoticeText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  detailModal: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '88%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    overflow: 'hidden',
  },

  modalHeader: {
    minHeight: 74,
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
    fontSize: 21,
    fontWeight: '900',
    marginTop: 3,
  },

  modalScroll: {
    padding: 20,
    paddingBottom: 25,
  },

  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  largeAvatar: {
    width: 62,
    height: 62,
    borderRadius: 17,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeAvatarText: {
    color: COLORS.background,
    fontSize: 23,
    fontWeight: '900',
  },

  profileHeroText: {
    flex: 1,
    gap: 7,
  },

  profileName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },

  profileEmail: {
    color: COLORS.muted,
    fontSize: 11,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },

  infoItem: {
    flex: 1,
    minWidth: 190,
    minHeight: 67,
    padding: 12,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  infoIcon: {
    width: 31,
    height: 31,
    borderRadius: 8,
    backgroundColor: '#20272A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoLabel: {
    color: COLORS.sidebarText,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  infoValue: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  modalSection: {
    marginTop: 20,
  },

  modalSectionTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 9,
  },

  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  statusOption: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statusOptionActive: {
    borderColor: '#586B37',
    backgroundColor: '#1B2417',
  },

  statusOptionText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  statusOptionTextActive: {
    color: COLORS.lime,
  },

  securityNotice: {
    marginTop: 18,
    padding: 13,
    backgroundColor: '#151B15',
    borderWidth: 1,
    borderColor: '#34402C',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 9,
  },

  securityNoticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  modalFooter: {
    minHeight: 70,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
  },

  secondaryButton: {
    height: 40,
    paddingHorizontal: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  primaryButton: {
    height: 40,
    paddingHorizontal: 17,
    borderRadius: 9,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  primaryButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },
});