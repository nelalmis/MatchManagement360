// ============================================
// ProfileScreen.tsx
// ============================================

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Home, User, Edit } from 'lucide-react-native';
import React from 'react';
import globalStyles from '../../styles/globalStyle';
import { useAppContext } from '../../context/AppContext';

export const ProfileScreen: React.FC = () => {
  const { user, setCurrentScreen } = useAppContext();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={globalStyles.pageHeader}>
        <TouchableOpacity
          onPress={() => setCurrentScreen('menu')}
          style={styles.headerButton}
        >
          <Home color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>

      {/* Profile Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileCard}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User color="#16a34a" size={40} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.name} {user?.surname}
              </Text>
              <Text style={styles.profilePosition}>{user?.position}</Text>
            </View>
          </View>

          {/* Profile Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Forma Numarası</Text>
              <Text style={styles.detailValue}>{user?.jerseyNumber}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Doğum Tarihi</Text>
              <Text style={styles.detailValue}>{user?.birthDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Telefon</Text>
              <Text style={styles.detailValue}>{user?.phone}</Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity style={styles.editButton}>
            <Edit color="#fff" size={20} />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  editButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});