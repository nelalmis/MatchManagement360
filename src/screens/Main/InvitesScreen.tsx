import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native"; // ⚠️ React Native sürümünü kullan

export const InvitesScreen: React.FC = () => (
  <View style={styles.container}>
    <Bell size={48} color="#D1D5DB" style={styles.icon} />
    <Text style={styles.text}>3 yeni davet var</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    backgroundColor: "#fff",
  },
  icon: {
    marginBottom: 16,
  },
  text: {
    color: "#6B7280", // Tailwind text-gray-500
    fontSize: 16,
  },
});
