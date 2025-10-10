import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../../context/AppContext";
import { useNavigationContext } from "../../context/NavigationContext";
import { playerService } from "../../services/playerService";
import { ArrowRight, User, Calendar, Award } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IPlayer } from "../../types/types";

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigationContext();
    const { setUser, phoneNumber, user, isVerified, setIsVerified } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: "",
        surname: "",
        position: undefined,
        jerseyNumber: "",
        birthDate: new Date(),
    });

    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleRegister = async () => {
        // Validasyon
        if (!formData.name.trim()) {
            Alert.alert("Hata", "Lütfen adınızı girin");
            return;
        }
        if (!formData.surname.trim()) {
            Alert.alert("Hata", "Lütfen soyadınızı girin");
            return;
        }
        if (!formData.position) {
            Alert.alert("Hata", "Lütfen pozisyon seçin");
            return;
        }

        setLoading(true);
        try {
            const userData: IPlayer = {
                ...formData,
                phone: `+90${phoneNumber || user?.phone}`,
                birthDate: formData.birthDate.toISOString(),
                lastLogin: new Date().toISOString(),
                id: user?.id || null,
            };

            // Firestore'a kaydet
            const savedUser = await playerService.update(user?.id, userData);

            setUser({ ...userData, id: user?.id });
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            console.log("isVerifieed" + isVerified);
            navigation.navigate("home");

            // Alert.alert(
            //     "Başarılı!",
            //     "Kayıt işlemi tamamlandı.",
            //     [
            //         {
            //             text: "Tamam",
            //             onPress: () => navigation.navigate("home"),
            //         },
            //     ]
            // );
        } catch (error) {
            console.error("Register error:", error);
            Alert.alert("Hata", "Kayıt işlemi başarısız. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const positions = [
        { label: "Pozisyon Seçiniz", value: "" },
        { label: "Kaleci", value: "Kaleci" },
        { label: "Defans", value: "Defans" },
        { label: "Orta Saha", value: "Orta Saha" },
        { label: "Forvet", value: "Forvet" },
    ];

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <View style={styles.iconContainer}>
                            <User color="#16a34a" size={32} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.title}>Oyuncu Bilgileri</Text>
                        <Text style={styles.subtitle}>
                            Profilinizi tamamlayın, maçlara katılın veya kendi maçınızı organize edin
                        </Text>
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>
                        {/* Ad */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Ad *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(val) => setFormData({ ...formData, name: val })}
                                placeholder="Adınızı girin"
                                placeholderTextColor="#9CA3AF"
                                editable={!loading}
                            />
                        </View>

                        {/* Soyad */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Soyad *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.surname}
                                onChangeText={(val) => setFormData({ ...formData, surname: val })}
                                placeholder="Soyadınızı girin"
                                placeholderTextColor="#9CA3AF"
                                editable={!loading}
                            />
                        </View>

                        {/* Pozisyon */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Pozisyon *</Text>
                            <View style={styles.pickerWrapper}>
                                <View style={styles.pickerIconContainer}>
                                    <Award color="#16a34a" size={20} strokeWidth={2} />
                                </View>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.position}
                                        onValueChange={(val: any) =>
                                            setFormData({ ...formData, position: val })
                                        }
                                        style={styles.picker}
                                        enabled={!loading}
                                    >
                                        {positions.map((pos) => (
                                            <Picker.Item
                                                key={pos.value}
                                                label={pos.label}
                                                value={pos.value}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Forma Numarası */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Forma Numarası</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.jerseyNumber}
                                onChangeText={(val) => {
                                    // Sadece rakam kabul et, max 2 hane
                                    if (/^\d{0,2}$/.test(val)) {
                                        setFormData({ ...formData, jerseyNumber: val });
                                    }
                                }}
                                placeholder="10"
                                placeholderTextColor="#9CA3AF"
                                maxLength={2}
                                editable={!loading}
                            />
                        </View>

                        {/* Doğum Tarihi */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Doğum Tarihi</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => !loading && setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Calendar color="#6B7280" size={18} strokeWidth={2} />
                                <Text style={styles.dateText}>
                                    {formatDate(formData.birthDate)}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={formData.birthDate}
                                    mode="date"
                                    display="default"
                                    maximumDate={new Date()}
                                    onChange={(event: any, selectedDate: any) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            setFormData({ ...formData, birthDate: selectedDate });
                                        }
                                    }}
                                />
                            )}
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoIcon}>ℹ️</Text>
                            <Text style={styles.infoText}>
                                * ile işaretli alanlar zorunludur
                            </Text>
                        </View>

                        {/* Kayıt Butonu */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!formData.name.trim() ||
                                    !formData.surname.trim() ||
                                    !formData.position ||
                                    loading) &&
                                styles.buttonDisabled,
                            ]}
                            onPress={handleRegister}
                            disabled={
                                !formData.name.trim() ||
                                !formData.surname.trim() ||
                                !formData.position ||
                                loading
                            }
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>Kayıt Ol</Text>
                                    <ArrowRight color="white" size={20} strokeWidth={2.5} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0FDF4",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: "center",
        marginBottom: 32,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#111827",
        backgroundColor: "#F9FAFB",
    },
    pickerWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        overflow: "hidden",
    },
    pickerIconContainer: {
        paddingLeft: 16,
        paddingRight: 8,
    },
    pickerContainer: {
        flex: 1,
    },
    picker: {
        height: 50,
    },
    dateInput: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#F9FAFB",
        gap: 10,
    },
    dateText: {
        fontSize: 16,
        color: "#111827",
        flex: 1,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2FF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#C7D2FE",
    },
    infoIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    infoText: {
        fontSize: 13,
        color: "#4338CA",
        flex: 1,
        lineHeight: 18,
    },
    button: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#16a34a",
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: "#16a34a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: "#D1D5DB",
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
});