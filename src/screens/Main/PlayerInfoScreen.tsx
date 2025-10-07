import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
} from 'react-native';

interface Player {
    id: string;
    name: string;
    surname: string;
    position: string;
    jerseyNumber: string;
    //phoneNumber: string;
    birthDate: string;
    email: string;
}

export default function PlayerInfoScreen() {
    const [formData, setFormData] = useState<Partial<Player>>({
        name: '',
        surname: '',
        position: '',
        jerseyNumber: '',
        //phoneNumber: '',
        birthDate: '',
        email: '',
    });

    const [selectedPosition, setSelectedPosition] = useState('');

    const positions = [
        { id: 'gk', name: 'Kaleci', icon: '🧤' },
        { id: 'df', name: 'Defans', icon: '🛡️' },
        { id: 'mf', name: 'Orta Saha', icon: '⚡' },
        { id: 'fw', name: 'Forvet', icon: '⚽' },
    ];

    const handleInputChange = (field: keyof Player, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handlePositionSelect = (positionId: string) => {
        setSelectedPosition(positionId);
        const position = positions.find(p => p.id === positionId);
        if (position) {
            handleInputChange('position', position.name);
        }
    };

    // const handlePhoneChange = (text: string) => {
    //     const cleaned = text.replace(/\D/g, '');
    //     if (cleaned.length <= 10) {
    //         handleInputChange('phoneNumber', cleaned);
    //     }
    // };

    const formatDateInput = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    };

    const handleDateChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 8) {
            handleInputChange('birthDate', cleaned);
        }
    };

    const validateForm = () => {
        if (!formData.name?.trim()) {
            Alert.alert('Hata', 'Lütfen oyuncu adını girin');
            return false;
        }
        if (!formData.surname?.trim()) {
            Alert.alert('Hata', 'Lütfen oyuncu soyadını girin');
            return false;
        }
        if (!formData.position) {
            Alert.alert('Hata', 'Lütfen oyuncu pozisyonunu seçin');
            return false;
        }
        if (!formData.jerseyNumber?.trim()) {
            Alert.alert('Hata', 'Lütfen forma numarasını girin');
            return false;
        }
        // if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
        //     Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin');
        //     return false;
        // }
        return true;
    };

    const handleSave = () => {
        if (validateForm()) {
            const playerData = {
                ...formData,
                id: Date.now().toString(),
            };
            
            // Burada Firebase'e veya local storage'a kaydedilecek
            console.log('Kaydedilen oyuncu:', playerData);
            
            Alert.alert(
                'Başarılı!',
                `${formData.name} ${formData.surname} oyuncu olarak kaydedildi.`,
                [
                    {
                        text: 'Tamam',
                        onPress: () => {
                            // Formu temizle
                            setFormData({
                                name: '',
                                surname: '',
                                position: '',
                                jerseyNumber: '',
                               // phoneNumber: '',
                                birthDate: '',
                                email: '',
                            });
                            setSelectedPosition('');
                        },
                    },
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
            
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Text style={styles.headerIconText}>👤</Text>
                    </View>
                    <Text style={styles.headerTitle}>Oyuncu Bilgileri</Text>
                    <Text style={styles.headerSubtitle}>Yeni oyuncu ekleyin</Text>
                </View>

                {/* Form Card */}
                <View style={styles.card}>
                    {/* Ad Soyad */}
                    <View style={styles.nameRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Ad *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => handleInputChange('name', text)}
                                placeholder="Ahmet"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>Soyad *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.surname}
                                onChangeText={(text) => handleInputChange('surname', text)}
                                placeholder="Yılmaz"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Pozisyon Seçimi */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Pozisyon *</Text>
                        <View style={styles.positionsContainer}>
                            {positions.map((position) => (
                                <TouchableOpacity
                                    key={position.id}
                                    style={[
                                        styles.positionButton,
                                        selectedPosition === position.id && styles.positionButtonSelected,
                                    ]}
                                    onPress={() => handlePositionSelect(position.id)}
                                >
                                    <Text style={styles.positionIcon}>{position.icon}</Text>
                                    <Text
                                        style={[
                                            styles.positionText,
                                            selectedPosition === position.id && styles.positionTextSelected,
                                        ]}
                                    >
                                        {position.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Forma Numarası */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Forma Numarası *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.jerseyNumber}
                            onChangeText={(text) => handleInputChange('jerseyNumber', text.replace(/\D/g, ''))}
                            placeholder="10"
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Telefon Numarası */}
                    {/* <View style={styles.inputGroup}>
                        <Text style={styles.label}>Telefon Numarası *</Text>
                        <View style={styles.phoneInputContainer}>
                            <Text style={styles.countryCode}>🇹🇷 +90</Text>
                            <TextInput
                                style={styles.phoneInput}
                                value={formatPhoneNumber(formData.phoneNumber || '')}
                                onChangeText={handlePhoneChange}
                                placeholder="5XX XXX XX XX"
                                keyboardType="phone-pad"
                                maxLength={13}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View> */}

                    {/* Doğum Tarihi */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Doğum Tarihi</Text>
                        <TextInput
                            style={styles.input}
                            value={formatDateInput(formData.birthDate || '')}
                            onChangeText={handleDateChange}
                            placeholder="GG/AA/YYYY"
                            keyboardType="number-pad"
                            maxLength={10}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-posta</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(text) => handleInputChange('email', text)}
                            placeholder="ornek@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Bilgilendirme</Text>
                        <Text style={styles.infoText}>
                            * işareti olan alanlar zorunludur. Oyuncu telefon numarasına bildirimler gönderilecektir.
                        </Text>
                    </View>
                </View>

                {/* Kaydet Butonu */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>💾 Oyuncuyu Kaydet</Text>
                </TouchableOpacity>

                {/* Preview Card */}
                {formData.name && formData.surname && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>Önizleme</Text>
                        <View style={styles.previewContent}>
                            <View style={styles.previewAvatar}>
                                <Text style={styles.previewAvatarText}>
                                    {formData.name?.charAt(0)}{formData.surname?.charAt(0)}
                                </Text>
                            </View>
                            <View style={styles.previewInfo}>
                                <Text style={styles.previewName}>
                                    {formData.name} {formData.surname}
                                </Text>
                                {formData.position && (
                                    <Text style={styles.previewDetail}>📍 {formData.position}</Text>
                                )}
                                {formData.jerseyNumber && (
                                    <Text style={styles.previewDetail}>👕 #{formData.jerseyNumber}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFF6FF',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerIcon: {
        width: 80,
        height: 80,
        backgroundColor: '#4F46E5',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    headerIconText: {
        fontSize: 40,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    nameRow: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
    },
    positionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    positionButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    positionButtonSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    positionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    positionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    positionTextSelected: {
        color: '#4F46E5',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 14,
        color: '#1F2937',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        borderWidth: 2,
        borderColor: '#FCD34D',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#B45309',
        lineHeight: 18,
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    previewCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 16,
    },
    previewContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewAvatar: {
        width: 64,
        height: 64,
        backgroundColor: '#4F46E5',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    previewAvatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    previewInfo: {
        flex: 1,
    },
    previewName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    previewDetail: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
});