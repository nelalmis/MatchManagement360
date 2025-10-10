import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  User,
  Phone,
  Calendar,
  Award,
  Shield,
  TrendingUp,
  Star,
  Trophy,
  Users,
  Target,
  Edit,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MyProfileScreen: React.FC = () => {
  const navigation = useNavigationContext();
  const { user, setUser, setCurrentScreen, setIsVerified } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Mock data - gerçek uygulamada API'den gelecek
  const stats = {
    rating: 4.5,
    totalMatches: 24,
    wins: 16,
    goals: 12,
    assists: 8,
  };

  const handleEditProfile = () => {
    navigation.navigate('editProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('deviceToken');
              await AsyncStorage.removeItem('trustedDevice');
              
              setUser(null);
              setIsVerified(false);
              setCurrentScreen('login');
              navigation.navigate('login');
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPositionName = (position?: string) => {
    const positions: any = {
      'Kaleci': 'Kaleci',
      'Defans': 'Defans',
      'Orta Saha': 'Orta Saha',
      'Forvet': 'Forvet',
    };
    return positions[position || ''] || position || '-';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        {/* <View style={styles.header}>
          <View style={styles.headerLeft}>
            <User color="white" size={24} strokeWidth={2} />
            <Text style={styles.headerTitle}>Profilim</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Edit color="white" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View> */}
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            {user?.jerseyNumber && (
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyNumber}>#{user.jerseyNumber}</Text>
              </View>
            )}
          </View>

          <Text style={styles.playerName}>
            {user?.name} {user?.surname}
          </Text>
          
          {user?.position && (
            <View style={styles.positionBadge}>
              <Award color="#16a34a" size={16} strokeWidth={2} />
              <Text style={styles.positionText}>
                {getPositionName(user.position)}
              </Text>
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Star color="#F59E0B" size={24} strokeWidth={2} fill="#F59E0B" />
            <Text style={styles.ratingText}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.ratingLabel}>Puan</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Trophy color="#2563EB" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{stats.totalMatches}</Text>
              <Text style={styles.statLabel}>Toplam Maç</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Target color="#16a34a" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{stats.wins}</Text>
              <Text style={styles.statLabel}>Kazanılan</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <TrendingUp color="#F59E0B" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{stats.goals}</Text>
              <Text style={styles.statLabel}>Gol</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Users color="#6366F1" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{stats.assists}</Text>
              <Text style={styles.statLabel}>Asist</Text>
            </View>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Phone color="#6B7280" size={18} strokeWidth={2} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Calendar color="#6B7280" size={18} strokeWidth={2} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Doğum Tarihi</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user?.birthDate)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Shield color="#6B7280" size={18} strokeWidth={2} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Üyelik Tarihi</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user?.lastLogin?.toString())}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Edit color="#374151" size={20} strokeWidth={2} />
              <Text style={styles.actionText}>Profili Düzenle</Text>
            </View>
            <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={styles.actionLeft}>
              <LogOut color="#DC2626" size={20} strokeWidth={2} />
              <Text style={[styles.actionText, styles.logoutText]}>
                Çıkış Yap
              </Text>
            </View>
            <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16a34a',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  jerseyNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: '#DC2626',
  },
  bottomSpacing: {
    height: 40,
  },
});