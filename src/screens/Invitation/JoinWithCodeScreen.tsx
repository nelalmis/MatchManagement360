// src/screens/Invitation/JoinWithCodeScreen.tsx
// 🎯 GENERIC JOIN WITH CODE - WITH PASTE SUPPORT

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Keyboard,
    Image,
} from 'react-native';
import {
    ArrowLeft,
    Check,
    AlertCircle,
    Info,
    Trophy,
    Users,
    Calendar,
    MapPin,
} from 'lucide-react-native';
import { NavigationService } from '../../navigation/NavigationService';
import LeagueInvitationService, { InvitationService, MatchInvitationService } from '../../services/serviceLayer/invitationService';
import { useAuth } from '../../hooks';
import { InvitationType } from '../../types/entity/invitation';
import { getSportEmoji, getSportPrimaryColor, getSportDisplayName } from '../../utils/theme';
import { SportType } from '../../types/entity/types';
import { useRoute } from '../../navigation';
import { CustomHeader } from '../../components/CustomHeader';

type JoinWithCodeParams = {
    type: InvitationType;
};

export const JoinWithCodeScreen: React.FC = () => {
    const route: any = useRoute();
    const { user } = useAuth();

    const params: JoinWithCodeParams = route.params;
    const { type } = params;

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validation, setValidation] = useState<any>(null);

    // Refs for text inputs
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // ============================================
    // CODE INPUT HANDLING
    // ============================================

    const handleCodeChange = (value: string, index: number) => {
        // Only allow alphanumeric
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Handle paste (multiple characters)
        if (cleaned.length > 1) {
            handlePaste(cleaned);
            return;
        }

        const newCode = [...code];
        newCode[index] = cleaned;
        setCode(newCode);
        setError(null);
        setValidation(null);

        // Auto-focus next input
        if (cleaned && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-validate when all filled
        if (cleaned && index === 5) {
            const fullCode = [...newCode.slice(0, 5), cleaned].join('');
            if (fullCode.length === 6) {
                Keyboard.dismiss();
                handleValidate(fullCode);
            }
        }
    };

    const handlePaste = (pastedText: string) => {
        // Extract only alphanumeric characters
        const cleaned = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (cleaned.length === 0) return;

        // Take first 6 characters
        const chars = cleaned.substring(0, 6).split('');
        
        // Fill the code array
        const newCode = [...code];
        chars.forEach((char, i) => {
            if (i < 6) {
                newCode[i] = char;
            }
        });
        
        setCode(newCode);
        setError(null);
        setValidation(null);

        // Focus on next empty input or last input
        const nextEmptyIndex = newCode.findIndex(c => !c);
        if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
        } else {
            // All filled, dismiss keyboard and validate
            Keyboard.dismiss();
            if (newCode.every(c => c)) {
                handleValidate(newCode.join(''));
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const clearCode = () => {
        setCode(['', '', '', '', '', '']);
        setError(null);
        setValidation(null);
        inputRefs.current[0]?.focus();
    };

    // ============================================
    // VALIDATE CODE
    // ============================================

    const handleValidate = async (codeString?: string) => {
        const fullCode = codeString || code.join('');

        if (fullCode.length !== 6) {
            setError('Lütfen 6 haneli kodu girin');
            return;
        }

        if (!user?.id) {
            setError('Kullanıcı bilgisi bulunamadı');
            return;
        }

        try {
            setValidating(true);
            setError(null);
            setValidation(null);

            const result = await InvitationService.validateInvitationCode(
                fullCode,
                user.id
            );

            if (!result.success) {
                setError(result.error?.message || 'Doğrulama başarısız');
                return;
            }

            const validationData = result.data!;

            if (!validationData.valid) {
                switch (validationData.error?.code) {
                    case 'INVALID_CODE':
                        setError('Geçersiz davet kodu. Lütfen kontrol edin.');
                        break;
                    case 'EXPIRED':
                        setError('Bu davet kodunun süresi dolmuş.');
                        break;
                    case 'MAX_USES_REACHED':
                        setError('Bu kod maksimum kullanım sayısına ulaşmış.');
                        break;
                    case 'INACTIVE':
                        setError('Bu davet kodu devre dışı bırakılmış.');
                        break;
                    case 'ALREADY_MEMBER':
                    case 'ALREADY_USED':
                        setError(validationData.error.message);
                        break;
                    default:
                        setError(validationData.error?.message || 'Kod geçersiz');
                }
                return;
            }

            // Success - show preview
            setValidation(validationData);
        } catch (error) {
            console.error('Validation error:', error);
            setError('Beklenmeyen bir hata oluştu');
        } finally {
            setValidating(false);
        }
    };

    // ============================================
    // JOIN
    // ============================================

    const handleJoin = async () => {
        if (!validation || !validation.valid || !user?.id) return;

        const fullCode = code.join('');

        try {
            setLoading(true);
            setError(null);

            // Determine invitation type
            const invitationType = validation.invitation.type;

            if (invitationType === InvitationType.LEAGUE) {
                // Join league
                const result = await LeagueInvitationService.joinLeague({
                    code: fullCode,
                    userId: user.id,
                    device: { platform: 'ios' }, // TODO: Get from Platform.OS
                });

                if (!result.success) {
                    setError(result.error?.message || 'Lige katılırken hata oluştu');
                    return;
                }

                Alert.alert(
                    'Başarılı! 🎉',
                    `${validation.league?.title || 'Lig'}e başarıyla katıldınız`,
                    [
                        {
                            text: 'Lige Git',
                            onPress: () => {
                                NavigationService.navigateToLeague(result.data!.leagueId);
                            },
                        },
                    ]
                );
            } else if (invitationType === InvitationType.MATCH) {
                // Join match
                const result = await MatchInvitationService.joinMatch({
                    code: fullCode,
                    userId: user.id,
                    device: { platform: 'ios' },
                });

                if (!result.success) {
                    setError(result.error?.message || 'Maça katılırken hata oluştu');
                    return;
                }

                Alert.alert(
                    'Başarılı! 🎉',
                    'Maça katılmak için kayıt ekranına yönlendiriliyorsunuz',
                    [
                        {
                            text: 'Devam Et',
                            onPress: () => {
                                // Navigate to match registration screen
                                NavigationService.navigateToMatchRegistration(result.data!.matchId);
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Join error:', error);
            setError('Beklenmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // RENDER PREVIEW
    // ============================================

    const renderPreview = () => {
        if (!validation || !validation.valid) return null;

        const isLeague = validation.invitation.type === InvitationType.LEAGUE;
        const target = isLeague ? validation.league : validation.match;

        if (!target) return null;

        const sportEmoji = getSportEmoji(target.sportType as SportType);
        const sportColor = getSportPrimaryColor(target.sportType as SportType);

        return (
            <View style={styles.previewCard}>
                {/* Header */}
                <View style={styles.previewHeader}>
                    {target.logo ? (
                        <Image source={{ uri: target.logo }} style={styles.targetLogo} />
                    ) : (
                        <View style={[styles.targetIcon, { backgroundColor: sportColor + '20' }]}>
                            <Text style={styles.sportEmoji}>{sportEmoji}</Text>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Text style={styles.previewTitle}>{target.title}</Text>
                <Text style={styles.previewSport}>
                    {sportEmoji} {getSportDisplayName(target.sportType as SportType)}
                </Text>

                {/* Type Badge */}
                <View style={[styles.typeBadge, { backgroundColor: sportColor + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: sportColor }]}>
                        {isLeague ? '🏆 Lig' : '⚽ Maç'}
                    </Text>
                </View>

                {/* Info */}
                {isLeague ? (
                    <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                            <Users size={18} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.infoText}>{target.memberCount} üye</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                            <Calendar size={18} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.infoText}>
                                {new Date(target.matchDate).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>
                        {target.location && (
                            <View style={styles.infoItem}>
                                <MapPin size={18} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.infoText} numberOfLines={1}>
                                    {target.location}
                                </Text>
                            </View>
                        )}
                        {target.totalSlots && (
                            <View style={styles.infoItem}>
                                <Users size={18} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.infoText}>
                                    {target.registeredCount || 0}/{target.totalSlots}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Join Button */}
                <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: sportColor }, loading && styles.joinButtonDisabled]}
                    onPress={handleJoin}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Check size={20} color="#FFF" strokeWidth={2.5} />
                            <Text style={styles.joinButtonText}>
                                {isLeague ? 'Lige Katıl' : 'Maça Katıl'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Try Another Code */}
                <TouchableOpacity style={styles.tryAnotherButton} onPress={clearCode} activeOpacity={0.7}>
                    <Text style={styles.tryAnotherText}>Farklı Kod Dene</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ============================================
    // MAIN RENDER
    // ============================================

    const isCodeComplete = code.every((digit) => digit.length === 1);

    return (
        <View style={styles.container}>
            {/* Header */}
            <CustomHeader
                title="Davet Kodu ile Katıl"
                showClose={true}
                onLeftPress={() => NavigationService.goBack()}
            />

            <View style={styles.content}>
                {!validation && (
                    <>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Trophy size={48} color="#10B981" strokeWidth={2} />
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Davet Kodu Girin</Text>
                        <Text style={styles.subtitle}>
                            {type === InvitationType.LEAGUE ? 'Lige' : type === InvitationType.MATCH ? 'Maça' : 'Liga veya maça'} katılmak için 6 haneli kodu girin
                        </Text>

                        {/* Code Input */}
                        <View style={styles.codeContainer}>
                            {code.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        inputRefs.current[index] = ref;
                                    }}
                                    style={[
                                        styles.codeInput,
                                        digit && styles.codeInputFilled,
                                        error && styles.codeInputError,
                                    ]}
                                    value={digit}
                                    onChangeText={(value) => handleCodeChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    maxLength={1}
                                    keyboardType="ascii-capable"
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    selectTextOnFocus
                                    editable={!validating && !loading}
                                />
                            ))}
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <AlertCircle size={16} color="#DC2626" strokeWidth={2} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearCode}
                                disabled={validating || loading || !code.some((d) => d)}
                            >
                                <Text style={styles.clearButtonText}>Temizle</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.validateButton,
                                    (!isCodeComplete || validating || loading) && styles.validateButtonDisabled,
                                ]}
                                onPress={() => handleValidate()}
                                disabled={!isCodeComplete || validating || loading}
                            >
                                {validating ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Check size={20} color="#FFF" strokeWidth={2.5} />
                                        <Text style={styles.validateButtonText}>Doğrula</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Info size={20} color="#3B82F6" strokeWidth={2} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Davet Kodu Nasıl Alınır?</Text>
                                <Text style={styles.infoText}>
                                    • Lig yöneticisinden veya maç organizatöründen kod alın{'\n'}
                                    • Kod genellikle 48-72 saat süreyle geçerlidir{'\n'}
                                    • Kodu doğrulayınca otomatik olarak katılırsınız
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Preview */}
                {validation && renderPreview()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFF',
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    codeInputFilled: {
        borderColor: '#10B981',
        backgroundColor: '#DCFCE7',
    },
    codeInputError: {
        borderColor: '#DC2626',
        backgroundColor: '#FEE2E2',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
    },
    validateButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: '#10B981',
        borderRadius: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    validateButtonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    validateButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 20,
    },
    previewCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    previewHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    targetLogo: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    targetIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sportEmoji: {
        fontSize: 40,
    },
    previewTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    previewSport: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    typeBadge: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    typeBadgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    infoSection: {
        gap: 12,
        marginBottom: 24,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    joinButtonDisabled: {
        opacity: 0.6,
    },
    joinButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    tryAnotherButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    tryAnotherText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
});