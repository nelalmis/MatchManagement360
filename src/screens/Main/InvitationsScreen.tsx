// ============================================
// Invitations Screen
// ============================================

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Home, Bell, Calendar, MapPin, Check, X } from 'lucide-react-native';

import { useState } from 'react';
import { IInvitation } from '../../types/types';
import { useAppContext } from '../../context/AppContext';
import { PageHeader } from '../../components/PageHeader';


export const InvitationsScreen = () => {
  const { setCurrentScreen } = useAppContext();
  const [invitations, setInvitations] = useState<IInvitation[]>([
    {
      id: 2,
      name: 'Cumartesi Turnuvası',
      date: '2025-10-12',
      time: '18:00',
      location: 'Stadyum Halı Saha',
      organizer: 'Mehmet Demir',
      status: 'pending'
    }
  ]);

  const acceptInvitation = (id: number) => {
    const invitation = invitations.find(inv => inv.id === id);
    if (invitation) {
      const newMatch: any = {
        ...invitation,
        participants: 1,
        maxParticipants: 10,
        maxSubstitutes: 4,
        substitutes: 0,
        isPeriodic: false,
        field: "",
        status: 'confirmed'
      };
      setInvitations(invitations.filter(inv => inv.id !== id));
    }
  };

  const rejectInvitation = (id: number) => {
    setInvitations(invitations.filter(inv => inv.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <PageHeader title='Davetler' onPressMenuButton={(screenName) => setCurrentScreen("home")} />

      {/* Invitations List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {invitations.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell color="#d1d5db" size={64} />
            <Text style={styles.emptyText}>Bekleyen davetiniz yok</Text>
          </View>
        ) : (
          invitations.map((invitation: IInvitation) => (
            <View key={invitation.id} style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <Text style={styles.invitationName}>{invitation.name}</Text>
                <Text style={styles.organizerText}>
                  Organizatör: {invitation.organizer}
                </Text>
              </View>

              <View style={styles.invitationDetails}>
                <View style={styles.detailRow}>
                  <Calendar color="#16a34a" size={16} />
                  <Text style={styles.detailText}>
                    {invitation.date} - {invitation.time}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <MapPin color="#16a34a" size={16} />
                  <Text style={styles.detailText}>
                    {invitation.location}
                  </Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => acceptInvitation(invitation.id)}
                  style={[styles.button, styles.acceptButton]}
                >
                  <Check color="#fff" size={20} />
                  <Text style={styles.buttonText}>Kabul Et</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => rejectInvitation(invitation.id)}
                  style={[styles.button, styles.rejectButton]}
                >
                  <X color="#fff" size={20} />
                  <Text style={styles.buttonText}>Reddet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  invitationHeader: {
    marginBottom: 16,
  },
  invitationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  organizerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  invitationDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#16a34a',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});
