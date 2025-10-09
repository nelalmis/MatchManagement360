import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, Users, ChevronRight, MapPin, Clock } from "lucide-react-native";
import { useNavigationContext } from "../context/NavigationContext";

export interface MatchCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  players: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export const MatchCard: React.FC<MatchCardProps> = ({ title, date, time, location, players, status }) => {
  const navigation = useNavigationContext();

  const statusStyles = {
    confirmed: { backgroundColor: "#DCFCE7", color: "#166534", label: "Onaylandı" },
    pending: { backgroundColor: "#FEF3C7", color: "#92400E", label: "Bekliyor" },
    completed: { backgroundColor: "#F3F4F6", color: "#374151", label: "Tamamlandı" },
  };

  const currentStatus = statusStyles[status];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('matchDetail', { title, date, time, location, players, status })}
    >
      {/* Başlık ve konum */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.backgroundColor }]}>
          <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
        </View>
      </View>

      {/* Tarih ve saat */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <Calendar size={16} color="#4B5563" />
          <Text style={styles.dateTimeText}>{date}</Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Clock size={16} color="#4B5563" />
          <Text style={styles.dateTimeText}>{time}</Text>
        </View>
      </View>

      {/* Oyuncular ve detay */}
      <View style={styles.footer}>
        <View style={styles.playersRow}>
          <Users size={18} color="#9CA3AF" />
          <Text style={styles.playersText}>{players}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>Detaylar</Text>
          <ChevronRight size={16} color="#16A34A" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {},
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playersText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#16A34A",
  },
});
