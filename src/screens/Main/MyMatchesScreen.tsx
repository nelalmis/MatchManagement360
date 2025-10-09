import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MatchCard } from "../../components/MatchCard";
import { useNavigationContext } from "../../context/NavigationContext";

export const MyMatchesScreen: React.FC = () => {
  const { setHeaderTitle } = useNavigationContext();

  useEffect(() => {
    setHeaderTitle("Maçlarım");
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container} >
      {/* <Text style={styles.title}>Maçlarım</Text> */}

      <View style={styles.cardWrapper}>
        <MatchCard
          title="Salı Akşam Maçı"
          date="15 Ekim 2025"
          time="20:00"
          location="Arena Spor Tesisleri"
          players="8/10 Oyuncu"
          status="confirmed"
        />
      </View>

      <View style={styles.cardWrapper}>
        <MatchCard
          title="Cumartesi Derbi"
          date="19 Ekim 2025"
          time="18:30"
          location="City Halısaha"
          players="6/12 Oyuncu"
          status="pending"
        />
      </View>

      <View style={styles.cardWrapper}>
        <MatchCard
          title="Çarşamba Maçı"
          date="9 Ekim 2025"
          time="19:00"
          location="Star Halısaha"
          players="10/10 Oyuncu"
          status="completed"
        />
      </View>
      <View style={styles.cardWrapper}>
        <MatchCard
          title="Çarşamba Maçı"
          date="9 Ekim 2025"
          time="19:00"
          location="Star Halısaha"
          players="10/10 Oyuncu"
          status="completed"
        />
      </View>
      <View style={styles.cardWrapper}>
        <MatchCard
          title="Çarşamba Maçı"
          date="9 Ekim 2025"
          time="19:00"
          location="Star Halısaha"
          players="10/10 Oyuncu"
          status="completed"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    // paddingBottom: 100
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937", // Tailwind text-gray-800
    marginBottom: 24,
  },
  cardWrapper: {
    marginBottom: 0,
  },
});
