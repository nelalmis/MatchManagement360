import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Calendar, ChevronRight, Clock, MapPin, Users } from "lucide-react-native";
import { MatchCardProps } from "../../components/MatchCard";
import { useNavigationContext } from "../../context/NavigationContext";
import { useRoute } from "@react-navigation/native";
import { IMatch } from "../../types/types";

interface MatchDetailScreenProps {
  params: MatchCardProps;
}
interface MatchDetailRouteParams {
  match: IMatch
}
export const MatchDetailScreenV2: React.FC = ({ }) => {
  const navigationRm = useNavigationContext();
  const route = useRoute<any>();

  const match = (route.params as MatchDetailRouteParams)?.match;
  
  useEffect(()=>{
    navigationRm.setHeaderTitle("Maç Detayı");
  },[]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Geri butonu */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigationRm.goBack()}>
        <ChevronRight size={20} color="#16A34A" style={styles.backIcon} />
        <Text style={styles.backText}>Geri</Text>
      </TouchableOpacity>

      {/* Kart */}
      <View style={styles.card}>
        <Text style={styles.title}>{match?.title}</Text>

        <View style={styles.detailList}>
          <View style={styles.detailRow}>
            <Calendar size={20} color="#16A34A" />
            <Text style={styles.detailText}>{match?.matchStartTime.toLocaleDateString()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={20} color="#16A34A" />
            <Text style={styles.detailText}>{match?.matchStartTime.toLocaleDateString()}</Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={20} color="#16A34A" />
            <Text style={styles.detailText}>{match?.location}</Text>
          </View>

          <View style={styles.detailRow}>
            <Users size={20} color="#16A34A" />
            <Text style={styles.detailText}>{match?.registrationCount}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Maça Katıl</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backIcon: {
    transform: [{ rotate: "180deg" }],
  },
  backText: {
    color: "#16A34A",
    fontWeight: "600",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4, // Android gölgesi
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  detailList: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    color: "#374151",
    fontWeight: "500",
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
