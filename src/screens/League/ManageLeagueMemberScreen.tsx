// src/screens/League/ManageLeagueMembersScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import {
  Users,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Trophy,
  X,
  Check,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Star,
  Hash,
  MapPin,
} from 'lucide-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../../hooks';
import { NavigationService } from '../../navigation/NavigationService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { PlayerService } from '../../services/serviceLayer/playerService';
import { ILeague, IPlayer, SportType } from '../../types/entity/types';
import { getSportPrimaryColor, getSportEmoji } from '../../utils/theme';

// ============================================
// TYPES
// ============================================

type ManageLeagueMembersRouteProp = RouteProp<
  { params: { leagueId: string; leagueTitle: string } },
  'params'
>;

interface MemberWithDetails extends IPlayer {
  role: 'admin' | 'premium' | 'direct' | 'member';
  roles: string[]; // Can have multiple roles
  joinedLeagueAt?: string; // When joined this league
  matchesPlayed?: number;
  averageRating?: number;
}

type FilterType = 'all' | 'admins' | 'premium' | 'direct' | 'regular';
type SortType = 'name' | 'joinDate' | 'matches' | 'rating';

// ============================================
// MAIN COMPONENT
// ============================================

export const ManageLeagueMembersScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<ManageLeagueMembersRouteProp>();
  const { leagueId, leagueTitle } = route.params;

  // State
  const [league, setLeague] = useState<ILeague | null>(null);
  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');

  // Modal State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithDetails | null>(null);

  // Permissions
  const [isAdmin, setIsAdmin] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================

  useEffect(() => {
    loadData();
  }, [leagueId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [members, searchQuery, activeFilter, sortBy]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load league
      const leagueResult = await LeagueService.getLeague(leagueId);
      if (!leagueResult.success || !leagueResult.data) {
        Alert.alert('Hata', 'Lig bulunamadı');
        NavigationService.goBack();
        return;
      }

      const leagueData = leagueResult.data;
      setLeague(leagueData);

      // Check permissions
      const userIsAdmin = leagueData.members.admins.includes(user.id);
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin) {
        Alert.alert('Yetkisiz', 'Bu sayfayı görüntülemek için admin olmalısınız');
        NavigationService.goBack();
        return;
      }

      // Load member details
      await loadMemberDetails(leagueData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadMemberDetails = async (leagueData: ILeague) => {
    try {
      const memberPromises = leagueData.members.all.map(async (memberId) => {
        // Load player details using new PlayerService
        const playerResult = await PlayerService.getPlayer(memberId);
        const playerData = playerResult.success ? playerResult.data : null;

        // Determine roles
        const roles: string[] = [];
        let primaryRole: 'admin' | 'premium' | 'direct' | 'member' = 'member';

        if (leagueData.members.admins.includes(memberId)) {
          roles.push('admin');
          primaryRole = 'admin';
        }
        if (leagueData.defaultPlayers.premium.includes(memberId)) {
          roles.push('premium');
          if (primaryRole === 'member') primaryRole = 'premium';
        }
        if (leagueData.defaultPlayers.direct.includes(memberId)) {
          roles.push('direct');
          if (primaryRole === 'member') primaryRole = 'direct';
        }

        // Return member with all IPlayer fields
        return {
          // IPlayer fields
          id: memberId,
          name: playerData?.name || 'Unknown',
          surname: playerData?.surname || 'User',
          displayName: playerData?.displayName || 
                      PlayerService.formatFullName(playerData || { 
                        id: memberId,
                        name: 'Unknown', 
                        surname: 'User',
                        email: 'unknown@email.com',
                        emailVerified: false,
                        authProviders: ['email'],
                        favoriteSports: [],
                        createdAt: new Date().toISOString()
                      } as IPlayer),
          email: playerData?.email || 'unknown@email.com',
          emailVerified: playerData?.emailVerified || false,
          authProviders: playerData?.authProviders || ['email'],
          phone: playerData?.phone,
          phoneVerified: playerData?.phoneVerified || false,
          profilePhoto: playerData?.profilePhoto,
          jerseyNumber: playerData?.jerseyNumber,
          birthDate: playerData?.birthDate,
          favoriteSports: playerData?.favoriteSports || [],
          sportPositions: playerData?.sportPositions || {},
          language: playerData?.language || 'tr',
          timezone: playerData?.timezone,
          twoFactorEnabled: playerData?.twoFactorEnabled || false,
          lastLogin: playerData?.lastLogin,
          createdAt: playerData?.createdAt || new Date().toISOString(),
          updatedAt: playerData?.updatedAt,
          isActive: playerData?.isActive !== false,
          isBanned: playerData?.isBanned || false,

          // League-specific fields
          role: primaryRole,
          roles,
          joinedLeagueAt: playerData?.createdAt || new Date().toISOString(),
          matchesPlayed: 0, // TODO: Calculate from fixtures
          averageRating: 0, // TODO: Calculate from ratings
        } as MemberWithDetails;
      });

      const memberDetails = await Promise.all(memberPromises);
      setMembers(memberDetails);
    } catch (error) {
      console.error('Error loading member details:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ============================================
  // FILTER & SORT
  // ============================================

  const applyFiltersAndSort = () => {
    let filtered = [...members];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.displayName?.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.name?.toLowerCase().includes(query) ||
          member.surname?.toLowerCase().includes(query) ||
          member.phone?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    switch (activeFilter) {
      case 'admins':
        filtered = filtered.filter((m) => m.roles.includes('admin'));
        break;
      case 'premium':
        filtered = filtered.filter((m) => m.roles.includes('premium'));
        break;
      case 'direct':
        filtered = filtered.filter((m) => m.roles.includes('direct'));
        break;
      case 'regular':
        filtered = filtered.filter(
          (m) =>
            !m.roles.includes('admin') &&
            !m.roles.includes('premium') &&
            !m.roles.includes('direct')
        );
        break;
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.displayName || '').localeCompare(b.displayName || '');
        case 'joinDate':
          return new Date(b.joinedLeagueAt || 0).getTime() - new Date(a.joinedLeagueAt || 0).getTime();
        case 'matches':
          return (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  };

  // ============================================
  // MEMBER ACTIONS
  // ============================================

  const handleMemberPress = (member: MemberWithDetails) => {
    setSelectedMember(member);
    setShowMemberActions(true);
  };

  const handleToggleAdmin = async (memberId: string, currentlyAdmin: boolean) => {
    if (!user?.id || !league) return;

    // Can't remove yourself if you're the only admin
    if (currentlyAdmin && memberId === user.id) {
      const adminCount = league.members.admins.length;
      if (adminCount <= 1) {
        Alert.alert(
          'İşlem Yapılamaz',
          'Son admin olarak kendinizi admin olmaktan çıkaramazsınız'
        );
        return;
      }
    }

    const action = currentlyAdmin ? 'çıkarmak' : 'eklemek';
    Alert.alert(
      'Admin Yetkisi',
      `Bu üyeyi admin olarak ${action} istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              const result = currentlyAdmin
                ? await LeagueService.removeAdmin(leagueId, user.id, memberId)
                : await LeagueService.addAdmin(leagueId, user.id, memberId);

              if (result.success) {
                Alert.alert('✅ Başarılı', 'Admin yetkisi güncellendi');
                setShowMemberActions(false);
                await loadData();
              } else {
                Alert.alert('Hata', result.error?.message || 'İşlem başarısız');
              }
            } catch (error) {
              console.error('Error toggling admin:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleTogglePremium = async (memberId: string, currentlyPremium: boolean) => {
    if (!user?.id) return;

    const action = currentlyPremium ? 'çıkarmak' : 'eklemek';
    Alert.alert(
      'Premium Oyuncu',
      `Bu üyeyi premium oyuncu olarak ${action} istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              const result = currentlyPremium
                ? await LeagueService.removePremiumPlayer(leagueId, user.id, memberId)
                : await LeagueService.addPremiumPlayer(leagueId, user.id, memberId);

              if (result.success) {
                Alert.alert('✅ Başarılı', 'Premium oyuncu durumu güncellendi');
                setShowMemberActions(false);
                await loadData();
              } else {
                Alert.alert('Hata', result.error?.message || 'İşlem başarısız');
              }
            } catch (error) {
              console.error('Error toggling premium:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleToggleDirect = async (memberId: string, currentlyDirect: boolean) => {
    if (!user?.id) return;

    const action = currentlyDirect ? 'çıkarmak' : 'eklemek';
    Alert.alert(
      'Direkt Oyuncu',
      `Bu üyeyi direkt oyuncu olarak ${action} istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              const result = currentlyDirect
                ? await LeagueService.removeDirectPlayer(leagueId, user.id, memberId)
                : await LeagueService.addDirectPlayer(leagueId, user.id, memberId);

              if (result.success) {
                Alert.alert('✅ Başarılı', 'Direkt oyuncu durumu güncellendi');
                setShowMemberActions(false);
                await loadData();
              } else {
                Alert.alert('Hata', result.error?.message || 'İşlem başarısız');
              }
            } catch (error) {
              console.error('Error toggling direct:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.id || !league) return;

    // Can't remove yourself if you're the only admin
    if (league.members.admins.includes(memberId) && memberId === user.id) {
      const adminCount = league.members.admins.length;
      if (adminCount <= 1) {
        Alert.alert(
          'İşlem Yapılamaz',
          'Son admin olarak kendinizi ligden çıkaramazsınız'
        );
        return;
      }
    }

    Alert.alert(
      '⚠️ Dikkat',
      'Bu üyeyi ligden çıkarmak istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await LeagueService.removeMember(leagueId, user.id, memberId);

              if (result.success) {
                Alert.alert('✅ Çıkarıldı', 'Üye ligden çıkarıldı');
                setShowMemberActions(false);
                await loadData();
              } else {
                Alert.alert('Hata', result.error?.message || 'Üye çıkarılamadı');
              }
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const formatDate = (date: any): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : date;
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return '#F59E0B';
      case 'premium':
        return '#8B5CF6';
      case 'direct':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    const color = getRoleBadgeColor(role);
    switch (role) {
      case 'admin':
        return <Crown size={14} color={color} strokeWidth={2.5} />;
      case 'premium':
        return <Trophy size={14} color={color} strokeWidth={2.5} />;
      case 'direct':
        return <Shield size={14} color={color} strokeWidth={2.5} />;
      default:
        return <Users size={14} color={color} strokeWidth={2.5} />;
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'premium':
        return 'Premium';
      case 'direct':
        return 'Direkt';
      default:
        return 'Üye';
    }
  };

  const getPlayerAge = (member: MemberWithDetails): string => {
    if (!member.birthDate) return '-';
    const age = PlayerService.calculateAge(member.birthDate);
    return age ? `${age} yaşında` : '-';
  };

  // ============================================
  // RENDER HEADER
  // ============================================

  const renderHeader = () => {
    const sportColor = league ? getSportPrimaryColor(league.sportType) : '#2563EB';

    return (
      <View style={[styles.header, { borderBottomColor: sportColor }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Üyeleri Yönet</Text>
          <Text style={styles.headerSubtitle}>{leagueTitle}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={styles.headerButton}
        >
          <Filter size={22} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================
  // RENDER STATS
  // ============================================

  const renderStats = () => {
    if (!league) return null;

    const sportColor = getSportPrimaryColor(league.sportType);

    const stats = {
      total: league.members.all.length,
      admins: league.members.admins.length,
      premium: league.defaultPlayers.premium.length,
      direct: league.defaultPlayers.direct.length,
    };

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
      >
        {/* Total */}
        <View style={[styles.statCard, { borderLeftColor: sportColor }]}>
          <Users size={20} color={sportColor} strokeWidth={2.5} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>

        {/* Admins */}
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Crown size={20} color="#F59E0B" strokeWidth={2.5} />
          <Text style={styles.statValue}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Admin</Text>
        </View>

        {/* Premium */}
        <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
          <Trophy size={20} color="#8B5CF6" strokeWidth={2.5} />
          <Text style={styles.statValue}>{stats.premium}</Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>

        {/* Direct */}
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Shield size={20} color="#10B981" strokeWidth={2.5} />
          <Text style={styles.statValue}>{stats.direct}</Text>
          <Text style={styles.statLabel}>Direkt</Text>
        </View>
      </ScrollView>
    );
  };

  // ============================================
  // RENDER SEARCH BAR
  // ============================================

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Üye ara (isim, email, telefon)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER FILTER CHIPS
  // ============================================

  const renderFilterChips = () => {
    const filters: { key: FilterType; label: string; icon: any }[] = [
      { key: 'all', label: 'Tümü', icon: Users },
      { key: 'admins', label: 'Adminler', icon: Crown },
      { key: 'premium', label: 'Premium', icon: Trophy },
      { key: 'direct', label: 'Direkt', icon: Shield },
      { key: 'regular', label: 'Üyeler', icon: Users },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          const Icon = filter.icon;

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Icon
                size={16}
                color={isActive ? 'white' : '#6B7280'}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // ============================================
  // RENDER MEMBER LIST
  // ============================================

  const renderMemberList = () => {
    if (filteredMembers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Users size={48} color="#D1D5DB" strokeWidth={2} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'Üye bulunamadı' : 'Henüz üye yok'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.memberList}>
        {filteredMembers.map((member) => {
          const initials = PlayerService.getInitials(member);
          const fullName = PlayerService.formatFullName(member);

          return (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCard}
              onPress={() => handleMemberPress(member)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{initials}</Text>
              </View>

              {/* Info */}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{fullName}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>

                {/* Role Badges */}
                <View style={styles.roleBadges}>
                  {member.roles.map((role) => (
                    <View
                      key={role}
                      style={[
                        styles.roleBadge,
                        { backgroundColor: `${getRoleBadgeColor(role)}20` },
                      ]}
                    >
                      {getRoleIcon(role)}
                      <Text
                        style={[
                          styles.roleBadgeText,
                          { color: getRoleBadgeColor(role) },
                        ]}
                      >
                        {getRoleLabel(role)}
                      </Text>
                    </View>
                  ))}
                  
                  {/* Verification Badge */}
                  {member.emailVerified && (
                    <View style={[styles.roleBadge, { backgroundColor: '#DCFCE720' }]}>
                      <Check size={12} color="#16A34A" strokeWidth={2.5} />
                      <Text style={[styles.roleBadgeText, { color: '#16A34A' }]}>
                        Doğrulanmış
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Arrow */}
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ============================================
  // RENDER FILTER MODAL
  // ============================================

  const renderFilterModal = () => {
    const sortOptions: { key: SortType; label: string; icon: any }[] = [
      { key: 'name', label: 'İsme Göre', icon: Users },
      { key: 'joinDate', label: 'Katılma Tarihine Göre', icon: Calendar },
      { key: 'matches', label: 'Maç Sayısına Göre', icon: Trophy },
      { key: 'rating', label: 'Değerlendirmeye Göre', icon: Star },
    ];

    return (
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sıralama</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {sortOptions.map((option) => {
                const isActive = sortBy === option.key;
                const Icon = option.icon;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      isActive && styles.sortOptionActive,
                    ]}
                    onPress={() => {
                      setSortBy(option.key);
                      setShowFilterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      size={20}
                      color={isActive ? '#2563EB' : '#6B7280'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        isActive && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={20} color="#2563EB" strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================
  // RENDER MEMBER ACTIONS MODAL
  // ============================================

  const renderMemberActionsModal = () => {
    if (!selectedMember) return null;

    const isCurrentUser = selectedMember.id === user?.id;
    const isAdmin = selectedMember.roles.includes('admin');
    const isPremium = selectedMember.roles.includes('premium');
    const isDirect = selectedMember.roles.includes('direct');
    const fullName = PlayerService.formatFullName(selectedMember);
    const accountStatus = PlayerService.getAccountStatusText(selectedMember);
    const verificationStatus = PlayerService.getVerificationStatusText(selectedMember);
    const age = getPlayerAge(selectedMember);
    const formattedPhone = selectedMember.phone 
      ? PlayerService.formatPhone(selectedMember.phone)
      : null;

    return (
      <Modal
        visible={showMemberActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{fullName}</Text>
              <TouchableOpacity
                onPress={() => setShowMemberActions(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Member Info Card */}
              <View style={styles.memberDetailCard}>
                <View style={styles.memberDetailRow}>
                  <Mail size={18} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.memberDetailText}>{selectedMember.email}</Text>
                  {selectedMember.emailVerified && (
                    <Check size={16} color="#16A34A" strokeWidth={2.5} />
                  )}
                </View>

                {formattedPhone && (
                  <View style={styles.memberDetailRow}>
                    <Phone size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.memberDetailText}>{formattedPhone}</Text>
                    {selectedMember.phoneVerified && (
                      <Check size={16} color="#16A34A" strokeWidth={2.5} />
                    )}
                  </View>
                )}

                {selectedMember.jerseyNumber && (
                  <View style={styles.memberDetailRow}>
                    <Hash size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.memberDetailText}>
                      Forma: {selectedMember.jerseyNumber}
                    </Text>
                  </View>
                )}

                {selectedMember.birthDate && (
                  <View style={styles.memberDetailRow}>
                    <Calendar size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.memberDetailText}>{age}</Text>
                  </View>
                )}

                <View style={styles.memberDetailRow}>
                  <Users size={18} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.memberDetailText}>
                    Katılma: {formatDate(selectedMember.joinedLeagueAt)}
                  </Text>
                </View>

                {selectedMember.matchesPlayed !== undefined && (
                  <View style={styles.memberDetailRow}>
                    <Trophy size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.memberDetailText}>
                      {selectedMember.matchesPlayed} maç oynadı
                    </Text>
                  </View>
                )}

                <View style={styles.memberDetailRow}>
                  <AlertCircle size={18} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.memberDetailText}>Durum: {accountStatus}</Text>
                </View>

                <View style={styles.memberDetailRow}>
                  <Check size={18} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.memberDetailText}>{verificationStatus}</Text>
                </View>
              </View>

              {/* Favorite Sports */}
              {selectedMember.favoriteSports && selectedMember.favoriteSports.length > 0 && (
                <View style={styles.favoriteSportsCard}>
                  <Text style={styles.favoriteSportsTitle}>Favori Sporlar</Text>
                  <View style={styles.favoriteSportsList}>
                    {selectedMember.favoriteSports.map((sport) => (
                      <View key={sport} style={styles.sportChip}>
                        <Text style={styles.sportChipText}>
                          {getSportEmoji(sport)} {sport}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsList}>
                {/* Toggle Admin */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleToggleAdmin(selectedMember.id, isAdmin)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonIcon}>
                    <Crown
                      size={20}
                      color={isAdmin ? '#EF4444' : '#F59E0B'}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.actionButtonText}>
                    {isAdmin ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                  </Text>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>

                {/* Toggle Premium */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleTogglePremium(selectedMember.id, isPremium)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonIcon}>
                    <Trophy
                      size={20}
                      color={isPremium ? '#EF4444' : '#8B5CF6'}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.actionButtonText}>
                    {isPremium
                      ? 'Premium Listesinden Çıkar'
                      : 'Premium Oyuncu Yap'}
                  </Text>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>

                {/* Toggle Direct */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleToggleDirect(selectedMember.id, isDirect)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonIcon}>
                    <Shield
                      size={20}
                      color={isDirect ? '#EF4444' : '#10B981'}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.actionButtonText}>
                    {isDirect
                      ? 'Direkt Listesinden Çıkar'
                      : 'Direkt Oyuncu Yap'}
                  </Text>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>

                {/* Remove Member */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => handleRemoveMember(selectedMember.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonIcon}>
                    <UserMinus size={20} color="#EF4444" strokeWidth={2} />
                  </View>
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                    {isCurrentUser ? 'Ligden Ayrıl' : 'Ligden Çıkar'}
                  </Text>
                  <ChevronRight size={20} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Üyeler yükleniyor...</Text>
      </View>
    );
  }

  if (!league || !isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#EF4444" strokeWidth={2} />
        <Text style={styles.errorText}>Bu sayfaya erişim yetkiniz yok</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => NavigationService.goBack()}
        >
          <Text style={styles.errorButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStats()}
        {renderSearchBar()}
        {renderFilterChips()}
        {renderMemberList()}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderFilterModal()}
      {renderMemberActionsModal()}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 2,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Content
  content: {
    flex: 1,
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Filter Chips
  filterChipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: 'white',
  },

  // Member List
  memberList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  memberEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
  },

  // Sort Options
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortOptionTextActive: {
    color: '#2563EB',
  },

  // Member Detail
  memberDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  memberDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetailText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Favorite Sports
  favoriteSportsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  favoriteSportsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  favoriteSportsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sportChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Actions
  actionsList: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  actionButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default ManageLeagueMembersScreen;