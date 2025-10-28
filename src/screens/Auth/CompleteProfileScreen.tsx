import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
    Animated,
} from "react-native";
import { NavigationService } from '../../navigation/NavigationService';
import { PlayerService } from "../../services/serviceLayer/playerService";
import {
    Award,
    CheckCircle2,
    ArrowRight,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IPlayer, SportType, SPORT_CONFIGS } from "../../types/entity/types";
import { useAuth } from "../../hooks";

export const CompleteProfileScreen: React.FC = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    const [selectedSports, setSelectedSports] = useState<SportType[]>([]);
    const [sportPositions, setSportPositions] = useState<Partial<Record<SportType, string[]>>>({});

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // ============================================
    // SPORT SELECTION HANDLERS
    // ============================================
    const toggleSport = (sport: SportType) => {
        const currentSports = [...selectedSports];
        const index = currentSports.indexOf(sport);

        if (index > -1) {
            // Remove sport
            if (currentSports.length === 1) {
                Alert.alert("Uyarı", "En az bir spor seçili olmalıdır");
                return;
            }
            currentSports.splice(index, 1);
            
            // Remove sport's positions
            const newPositions = { ...sportPositions };
            delete newPositions[sport];
            setSportPositions(newPositions);
            
            setSelectedSports(currentSports);
        } else {
            // Add sport
            currentSports.push(sport);
            setSelectedSports(currentSports);
        }
    };

    const selectPosition = (sport: SportType, position: string) => {
        setSportPositions(prev => ({
            ...prev,
            [sport]: [position] // Single position per sport for now
        }));
    };

    const getSportPositions = (sport: SportType) => {
        return SPORT_CONFIGS[sport]?.positions || [];
    };

    const isPositionSelected = (sport: SportType, position: string) => {
        return sportPositions[sport]?.includes(position) || false;
    };

    // ============================================
    // REGISTER HANDLER
    // ============================================
    const handleComplete = async () => {
        if (selectedSports.length === 0) {
            Alert.alert("Eksik Bilgi", "Lütfen en az bir spor seçin");
            return;
        }

        // Check if all selected sports have positions
        for (const sport of selectedSports) {
            if (!sportPositions[sport] || sportPositions[sport]!.length === 0) {
                Alert.alert(
                    "Eksik Bilgi", 
                    `${SPORT_CONFIGS[sport].name} için pozisyon seçmelisiniz`
                );
                return;
            }
        }

        setLoading(true);
        try {
            const userData: Partial<IPlayer> = {
                name: user?.name || "",
                surname: user?.surname || "",
                displayName: `${user?.name || ""} ${user?.surname || ""}`.trim(),
                email: user?.email || "",
                favoriteSports: selectedSports,
                sportPositions: sportPositions,
                lastLogin: new Date(),
                id: user?.id || '',
            };

            if (user?.id) {
                await PlayerService.updateProfile(user.id, userData as any);
            } else {
                await PlayerService.registerPlayer({
                    id: user?.id || '',
                    email: user?.email || '',
                    name: user?.name || '',
                    surname: user?.surname || '',
                    favoriteSports: selectedSports,
                });
            }

            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            Alert.alert(
                "Hoş Geldin! 🎉",
                `${userData.name}, profilin başarıyla oluşturuldu! Diğer bilgileri daha sonra ekleyebilirsin.`,
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <View style={styles.iconContainer}>
                        <Award color="#16a34a" size={48} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.title}>Bir Adım Kaldı!</Text>
                    <Text style={styles.subtitle}>
                        Hangi sporları oynuyorsun? Diğer bilgileri daha sonra ekleyebilirsin.
                    </Text>
                </Animated.View>

                {/* Sports Selection */}
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    <Text style={styles.cardTitle}>Sporlarını Seç</Text>
                    <Text style={[styles.cardSubtitle, { marginBottom: 20 }]}>
                        Birden fazla seçebilirsin. Her spor için pozisyon seçmen gerekecek.
                    </Text>

                    <View style={styles.sportGrid}>
                        {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sport) => {
                            const config = SPORT_CONFIGS[sport];
                            const isSelected = selectedSports.includes(sport);

                            return (
                                <TouchableOpacity
                                    key={sport}
                                    style={[
                                        styles.sportCard,
                                        isSelected && styles.sportCardSelected,
                                    ]}
                                    onPress={() => toggleSport(sport)}
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
                                            <CheckCircle2 color="#16a34a" size={18} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Position Selection for Each Sport */}
                {selectedSports.map((sport) => {
                    const config = SPORT_CONFIGS[sport];
                    const positions = getSportPositions(sport);
                    const hasSelectedPosition = sportPositions[sport] && sportPositions[sport]!.length > 0;

                    return (
                        <Animated.View key={sport} style={[styles.card, { opacity: fadeAnim }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.sportEmojiSmall}>{config.emoji}</Text>
                                <View style={styles.cardHeaderText}>
                                    <Text style={styles.cardTitle}>{config.name} Pozisyonun</Text>
                                    <Text style={styles.cardSubtitle}>
                                        {hasSelectedPosition 
                                            ? `Seçili: ${sportPositions[sport]![0]}` 
                                            : 'Pozisyon seç'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.positionGrid}>
                                {positions.map((position) => {
                                    const isSelected = isPositionSelected(sport, position);

                                    return (
                                        <TouchableOpacity
                                            key={position}
                                            style={[
                                                styles.positionChip,
                                                isSelected && styles.positionChipSelected
                                            ]}
                                            onPress={() => selectPosition(sport, position)}
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
                        </Animated.View>
                    );
                })}

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        💡 Profil fotoğrafı, telefon, doğum tarihi gibi bilgileri daha sonra profil
                        ayarlarından ekleyebilirsin.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleComplete}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={styles.completeButtonText}>Tamamla ve Başla</Text>
                            <ArrowRight color="white" size={20} strokeWidth={2.5} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },

    // Card
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 0,
    },

    // Sport Grid
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
        fontSize: 36,
        marginBottom: 8,
    },
    sportEmojiSmall: {
        fontSize: 28,
    },
    sportName: {
        fontSize: 13,
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

    // Position Grid
    positionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    positionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        gap: 6,
    },
    positionChipSelected: {
        borderColor: '#16a34a',
        backgroundColor: '#F0FDF4',
    },
    positionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    positionTextSelected: {
        color: '#16a34a',
    },

    // Info Box
    infoBox: {
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginTop: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },

    // Bottom Button
    bottomContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
});

export default CompleteProfileScreen;