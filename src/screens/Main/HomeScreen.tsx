import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { useAppContext } from '../../context/AppContext';
import { auth } from '../../api/firebaseConfig';
import { TrendingUp } from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';

export const HomeScreen: React.FC = () => {
    const {user} = useAppContext();
   return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Üst bölüm */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcome}>Hoş geldin,</Text>
            <Text style={styles.userName}>{user?.name || "" + " "+ user?.surname || ""}</Text>
          </View>
          <View style={styles.iconBox}>
            <TrendingUp size={28} color="white" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Toplam Maç</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Galibiyet</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Gol</Text>
          </View>
        </View>
      </View>

      {/* Maç listesi */}
      <View style={styles.matchSection}>
        <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>

        <View style={styles.matchList}>
          <MatchCard
            title="Salı Akşam Maçı"
            date="15 Ekim 2025"
            time="20:00"
            location="Arena Spor Tesisleri"
            players="8/10 Oyuncu"
            status="confirmed"
          />
          <MatchCard
            title="Cumartesi Derbi"
            date="19 Ekim 2025"
            time="18:30"
            location="City Halısaha"
            players="6/12 Oyuncu"
            status="pending"
          />
           <MatchCard
            title="Cumartesi Derbi"
            date="19 Ekim 2025"
            time="18:30"
            location="City Halısaha"
            players="6/12 Oyuncu"
            status="pending"
          />
           <MatchCard
            title="Cumartesi Derbi"
            date="19 Ekim 2025"
            time="18:30"
            location="City Halısaha"
            players="6/12 Oyuncu"
            status="pending"
          />
        </View>
      </View>

      {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    //padding: 16,
    backgroundColor: '#f9fafb',
  },
  headerCard: {
    backgroundColor: '#16a34a',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop:20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    color: '#bbf7d0',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  iconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  statNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: '#bbf7d0',
    fontSize: 12,
    marginTop: 4,
  },
  matchSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  matchList: {
    gap: 10,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
