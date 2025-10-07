// ============================================
// RegisterScreen.tsx (React Native)
// ============================================

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../../context/AppContext";

export const RegisterScreen: React.FC = () => {
  const { setUser, setCurrentScreen, phoneNumber } = useAppContext();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    position: "",
    jerseyNumber: "",
    birthDate: new Date(),
    lastLogin: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = () => {
    const userData: any = {
      ...formData,
      phone: phoneNumber,
      id: 1,
    };
    setUser(userData);
    setCurrentScreen("home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Oyuncu Bilgileri</Text>

        {/* Ad */}
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(val) => setFormData({ ...formData, name: val })}
              placeholder="Adınızı girin"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Soyad</Text>
            <TextInput
              style={styles.input}
              value={formData.surname}
              onChangeText={(val) => setFormData({ ...formData, surname: val })}
              placeholder="Soyadınızı girin"
            />
          </View>
        </View>

        {/* Pozisyon */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pozisyon</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.position}
              onValueChange={(val:any) => setFormData({ ...formData, position: val })}
            >
              <Picker.Item label="Seçiniz" value="" />
              <Picker.Item label="Kaleci" value="goalkeeper" />
              <Picker.Item label="Defans" value="defender" />
              <Picker.Item label="Orta Saha" value="midfielder" />
              <Picker.Item label="Forvet" value="forward" />
            </Picker>
          </View>
        </View>

        {/* Forma No & Doğum Tarihi */}
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Forma Numarası</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={formData.jerseyNumber}
              onChangeText={(val) => setFormData({ ...formData, jerseyNumber: val })}
              placeholder="10"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doğum Tarihi</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>
                {formData.birthDate.toLocaleDateString("tr-TR")}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.birthDate}
                mode="date"
                display="default"
                onChange={(event:any, selectedDate:any) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData({ ...formData, birthDate: selectedDate });
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* Kayıt Butonu */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
