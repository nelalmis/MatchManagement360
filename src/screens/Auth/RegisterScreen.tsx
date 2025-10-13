import React, { useState, useEffect } from "react";
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
    Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../../context/AppContext";
import { NavigationService } from '../../navigation/NavigationService';
import { playerService } from "../../services/playerService";
import {
    ArrowRight,
    User,
    Calendar,
    Award,
    Hash,
    CheckCircle2,
    ChevronRight
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IPlayer, SportType, SPORT_CONFIGS } from "../../types/types";

interface FormData {
    name: string;
    surname: string;
    favoriteSport: SportType;
    position: string;
    jerseyNumber: string;
    birthDate: Date;
}

export const RegisterScreen: React.FC = () => {
    const { setUser, phoneNumber, user, setIsVerified } = useAppContext();

    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [progressAnim] = useState(new Animated.Value(0));

    const [formData, setFormData] = useState<FormData>({
        name: user?.name || "",
        surname: user?.surname || "",
        favoriteSport: "Futbol",
        position: user?.sportPositions?.Futbol?.[0] || "",
        jerseyNumber: user?.jerseyNumber || "",
        birthDate: user?.birthDate ? new Date(user.birthDate) : new Date(2000, 0, 1),
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const isEditing = !!user?.id;

    useEffect(() => {
        animateProgress();
    }, [currentStep]);

    const animateProgress = () => {
        Animated.timing(progressAnim, {
            toValue: currentStep / 3,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!formData.name.trim() || !formData.surname.trim()) {
                Alert.alert("Eksik Bilgi", "Lütfen adınızı ve soyadınızı girin");
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!formData.position) {
                Alert.alert("Eksik Bilgi", "Lütfen bir pozisyon seçin");
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const sportPositions: Partial<Record<SportType, string[]>> = {};
            sportPositions[formData.favoriteSport] = [formData.position];

            const userData: IPlayer = {
                name: formData.name.trim(),
                surname: formData.surname.trim(),
                phone: user?.phone || `+90${phoneNumber}`,
                email: user?.email,
                jerseyNumber: formData.jerseyNumber || undefined,
                birthDate: formData.birthDate.toISOString().split('T')[0],
                favoriteSports: [formData.favoriteSport],
                sportPositions,
                lastLogin: new Date(),
                id: user?.id || null,
            };

            if (user?.id) {
                await playerService.update(user.id, userData);
                setUser({ ...userData, id: user.id });
            } else {
                const response = await playerService.add(userData);
                setUser({ ...userData, id: response.id });
            }

            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            Alert.alert(
                "Hoş Geldin! 🎉",
                `${userData.name}, profilin başarıyla oluşturuldu!`,
                [
                    {
                        text: "Hadi Başlayalım",
                        onPress: () => NavigationService.navigateToHomeTab()
                    },
                ]
            );
        } catch (error) {
            console.error("Register error:", error);
            Alert.alert("Hata", "Kayıt işlemi başarısız. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const getSportPositions = () => {
        if (!formData.favoriteSport) return [];
        return SPORT_CONFIGS[formData.favoriteSport as SportType]?.positions || [];
    };
    const formatDate = (date: Date) => {
        return date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: progressWidth }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>Adım {currentStep}/3</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Step 1: Kişisel Bilgiler */}
                    {currentStep === 1 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.stepHeader}>
                                <View style={styles.stepIconContainer}>
                                    <User color="#16a34a" size={28} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.stepTitle}>Tanışalım</Text>
                                <Text style={styles.stepSubtitle}>
                                    Adını ve soyadını öğrenebilir miyiz?
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Ad</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.name}
                                        onChangeText={(val) => setFormData({ ...formData, name: val })}
                                        placeholder="Örn: Ahmet"
                                        placeholderTextColor="#9CA3AF"
                                        autoFocus
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Soyad</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.surname}
                                        onChangeText={(val) => setFormData({ ...formData, surname: val })}
                                        placeholder="Örn: Yılmaz"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Step 2: Spor Tercihi */}
                    {currentStep === 2 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.stepHeader}>
                                <View style={styles.stepIconContainer}>
                                    <Award color="#16a34a" size={28} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.stepTitle}>Spor Dalın</Text>
                                <Text style={styles.stepSubtitle}>
                                    Hangi sporu oynamayı tercih ediyorsun?
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                {/* Sport Selection */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Spor Dalı</Text>
                                    <View style={styles.sportGrid}>
                                        {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sport) => {
                                            const config = SPORT_CONFIGS[sport];
                                            const isSelected = formData.favoriteSport === sport;

                                            return (
                                                <TouchableOpacity
                                                    key={sport}
                                                    style={[
                                                        styles.sportCard,
                                                        isSelected && styles.sportCardSelected
                                                    ]}
                                                    onPress={() => {
                                                        setFormData({
                                                            ...formData,
                                                            favoriteSport: sport,
                                                            position: "" // Reset position when sport changes
                                                        });
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.sportEmoji}>{config.emoji}</Text>
                                                    <Text style={[
                                                        styles.sportName,
                                                        isSelected && styles.sportNameSelected
                                                    ]}>
                                                        {config.name}
                                                    </Text>
                                                    {isSelected && (
                                                        <View style={styles.sportCheck}>
                                                            <CheckCircle2 color="#16a34a" size={16} />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Position Selection */}
                                {getSportPositions().length > 0 && (
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Pozisyon</Text>
                                        <View style={styles.positionGrid}>
                                            {getSportPositions().map((position: any) => {
                                                const isSelected = formData.position === position;

                                                return (
                                                    <TouchableOpacity
                                                        key={position}
                                                        style={[
                                                            styles.positionChip,
                                                            isSelected && styles.positionChipSelected
                                                        ]}
                                                        onPress={() => {
                                                            setFormData({ ...formData, position });
                                                        }}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={[
                                                            styles.positionText,
                                                            isSelected && styles.positionTextSelected
                                                        ]}>
                                                            {position}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Step 3: Ek Bilgiler */}
                    {currentStep === 3 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.stepHeader}>
                                <View style={styles.stepIconContainer}>
                                    <Hash color="#16a34a" size={28} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.stepTitle}>Son Dokunuşlar</Text>
                                <Text style={styles.stepSubtitle}>
                                    Bu bilgiler opsiyonel, istersenatlayabilirsiniz
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                {/* Jersey Number */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Forma Numarası
                                        <Text style={styles.optional}> (Opsiyonel)</Text>
                                    </Text>
                                    <View style={styles.jerseyInputContainer}>
                                        <Hash color="#9CA3AF" size={20} />
                                        <TextInput
                                            style={styles.jerseyInput}
                                            keyboardType="numeric"
                                            value={formData.jerseyNumber}
                                            onChangeText={(val) => {
                                                if (/^\d{0,2}$/.test(val)) {
                                                    setFormData({ ...formData, jerseyNumber: val });
                                                }
                                            }}
                                            placeholder="10"
                                            placeholderTextColor="#9CA3AF"
                                            maxLength={2}
                                        />
                                    </View>
                                </View>

                                {/* Birth Date */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Doğum Tarihi
                                        <Text style={styles.optional}> (Opsiyonel)</Text>
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dateInput}
                                        onPress={() => setShowDatePicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Calendar color="#9CA3AF" size={20} />
                                        <Text style={styles.dateText}>
                                            {formatDate(formData.birthDate)}
                                        </Text>
                                        <ChevronRight color="#9CA3AF" size={20} />
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

                                {/* Skip Info */}
                                <View style={styles.skipInfo}>
                                    <Text style={styles.skipText}>
                                        💡 Bu bilgileri daha sonra profilinden ekleyebilirsin
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Bottom Actions */}
                <View style={styles.bottomContainer}>
                    <View style={styles.actionButtons}>
                        {currentStep > 1 && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.backButtonText}>Geri</Text>
                            </TouchableOpacity>
                        )}

                        {currentStep < 3 ? (
                            <TouchableOpacity
                                style={[
                                    styles.nextButton,
                                    currentStep === 1 && styles.nextButtonFull
                                ]}
                                onPress={handleNext}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.nextButtonText}>Devam Et</Text>
                                <ArrowRight color="white" size={20} strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.nextButton,
                                    styles.nextButtonFull
                                ]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.nextButtonText}>
                                            {isEditing ? "Profili Güncelle" : "Kayıt Ol"}
                                        </Text>
                                        <CheckCircle2 color="white" size={20} strokeWidth={2.5} />
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    keyboardView: {
        flex: 1,
    },
    progressContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
    },
    progressBar: {
        height: 4,
        backgroundColor: "#E5E7EB",
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#16a34a',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    stepContainer: {
        flex: 1,
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    stepIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    inputGroup: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    optional: {
        fontSize: 12,
        fontWeight: '400',
        color: '#9CA3AF',
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#F9FAFB',
    },
    sportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    sportCard: {
        width: '31%',
        aspectRatio: 1,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    sportCardSelected: {
        borderColor: '#16a34a',
        backgroundColor: '#F0FDF4',
    },
    sportEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    sportName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    sportNameSelected: {
        color: '#16a34a',
    },
    sportCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    positionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    positionChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    positionChipSelected: {
        borderColor: '#16a34a',
        backgroundColor: '#F0FDF4',
    },
    positionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    positionTextSelected: {
        color: '#16a34a',
    },
    jerseyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        gap: 8,
    },
    jerseyInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#F9FAFB',
        gap: 10,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    skipInfo: {
        backgroundColor: '#F0F9FF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    skipText: {
        fontSize: 13,
        color: '#0369A1',
        lineHeight: 18,
    },
    bottomContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    backButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    nextButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});