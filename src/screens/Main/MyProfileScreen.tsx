import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { User } from "lucide-react-native"; // React Native sürümünü kullan

export const MyProfileScreen: React.FC = () => (
  <View style={styles.container}>
    <User size={48} color="#D1D5DB" style={styles.icon} />
    <Text style={styles.text}>Profil bilgileri</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80, // py-20 karşılığı
    backgroundColor: "#fff",
  },
  icon: {
    marginBottom: 16, // mb-4 karşılığı
  },
  text: {
    color: "#6B7280", // Tailwind text-gray-500
    fontSize: 16,
  },
});
