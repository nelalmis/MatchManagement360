import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  X,
  Check,
  Users,
  Trophy,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';
import { IInviteValidation } from '../../types/entity/types';
import { NavigationService } from '../../navigation/NavigationService';
import { useAuth } from '../../hooks';
import { getSportIcon, getSportColor } from '../../types/types';
import LeagueInvitationService from '../../services/serviceLayer/LeagueInvitationService';

interface JoinLeagueScreenProps {
  initialCode?: string; // Deep link'ten gelen kod
}

export const JoinLeagueScreen: React.FC<JoinLeagueScreenProps> = ({ initialCode }) => {
  const { user } = useAuth();

  // Form State
  const [code, setCode] = useState(initialCode || '');
  const [validation, setValidation] = useState<IInviteValidation | null>(null);

  // UI State
  const [validating, setValidating] = useState(false);
  const [joining, setJoining] = useState(false);

  // ============================================
  // AUTO-VALIDATE IF CODE PROVIDED
  // ============================================
  useEffect(() => {
    if (initialCode && user?.id) {
      handleValidateCode();
    }
  }, [initialCode, user?.id]);

  // ============================================
  // VALIDATE CODE
  // ============================================
  const handleValidateCode = async () => {
    if (!code.trim() || !user?.id) return;

    try {
      setValidating(true);
      setValidation(null);

      const result = await LeagueInvitationService.validateInvite(code.toUpperCase(), user.id);

      if (result.success && result.data) {
        setValidation(result.data);

        if (!result.data.valid && result.data.error) {
          Alert.alert('Hata', result.data.error.message);
        }
      } else {
        Alert.alert('Hata', result.error?.message || 'Doğrulama başarısız');
      }
    } catch (error) {
      console.error('Error validating code:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setValidating(false);
    }
  };

  // ============================================
  // JOIN LEAGUE
  // ============================================
  const handleJoinLeague = async () => {
    if (!user?.id || !validation?.valid) return;

    try {
      setJoining(true);

      const result = await LeagueInvitationService.joinLeague({
        code: code.toUpperCase(),
        userId: user.id,
        device: {
          platform: 'ios', // or 'android' based on Platform.OS
        },
      });

      if (result.success && result.data) {
        Alert.alert(
          'Başarılı! 🎉',
          'Lige başarıyla katıldınız',
          [
            {
              text: 'Tamam',
              onPress: () => NavigationService.navigateToLeague(result.data!.leagueId),
            },
          ]
        );
      } else {
        Alert.alert('Hata', result.error?.message || 'Lige katılırken hata oluştu');
      }
    } catch (error) {
      console.error('Error joining league:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setJoining(false);
    }
  };

  // ============================================
  // RENDER CODE INPUT
  // ============================================
  const renderCodeInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.title}>Lige Katıl</Text>
      <Text style={styles.subtitle}>
        Size verilen davet kodunu girerek lige katılabilirsiniz
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="DAVET KODU"
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={!initialCode}
        />
      </View>

      <TouchableOpacity
        style={[styles.validateButton, (!code.trim() || validating) && styles.buttonDisabled]}
        onPress={handleValidateCode}
        disabled={!code.trim() || validating}
        activeOpacity={0.7}
      >
        {validating ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Check size={20} color="white" strokeWidth={2.5} />
            <Text style={styles.buttonText}>Kodu Doğrula</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <AlertCircle size={20} color="#1E40AF" strokeWidth={2} />
        <View style={styles.infoBoxContent}>
          <Text style={styles.infoBoxText}>
            Davet kodu lig yöneticisinden alınmalıdır. Kod 8 karakter uzunluğundadır.
          </Text>
        </View>
      </View>
    </View>
  );

  // ============================================
  // RENDER LEAGUE PREVIEW
  // ============================================
  const renderLeaguePreview = () => {
    if (!validation?.valid || !validation.league) return null;

    const SportIcon = getSportIcon(validation.league.sportType as any);
    const sportColor = getSportColor(validation.league.sportType as any);

    return (
      <View style={styles.previewSection}>
        <View style={styles.previewHeader}>
          <View style={[styles.previewIcon, { backgroundColor: `${sportColor}20` }]}>
            {validation.league.logo ? (
              <Image source={{ uri: validation.league.logo }} style={styles.leagueLogo} />
            ) : (
              React.createElement(SportIcon, {
                size: 40,
                color: sportColor,
                strokeWidth: 2,
              })
            )}
          </View>
        </View>

        <Text style={styles.previewTitle}>{validation.league.title}</Text>
        <Text style={styles.previewSport}>{validation.league.sportType}</Text>

        <View style={styles.previewStats}>
          <View style={styles.statItem}>
            <Users size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.statValue}>{validation.league.memberCount}</Text>
            <Text style={styles.statLabel}>Üye</Text>
          </View>
        </View>

        {validation.invitation?.metadata.assignRole && (
          <View style={styles.roleInfo}>
            <Trophy size={16} color="#16a34a" strokeWidth={2} />
            <Text style={styles.roleInfoText}>
              {validation.invitation.metadata.assignRole === 'premium'
                ? 'Premium Oyuncu olarak katılacaksınız'
                : validation.invitation.metadata.assignRole === 'direct'
                ? 'Direkt Oyuncu olarak katılacaksınız'
                : 'Üye olarak katılacaksınız'}
            </Text>
          </View>
        )}

        {validation.invitation?.metadata.description && (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {validation.invitation.metadata.description}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.joinButton, joining && styles.buttonDisabled]}
          onPress={handleJoinLeague}
          disabled={joining}
          activeOpacity={0.7}
        >
          {joining ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.joinButtonText}>Lige Katıl</Text>
              <ArrowRight size={20} color="white" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setCode('');
            setValidation(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Farklı Kod Dene</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================
  // RENDER ERROR
  // ============================================
  const renderError = () => {
    if (!validation || validation.valid) return null;

    return (
      <View style={styles.errorSection}>
        <View style={styles.errorIcon}>
          <X size={32} color="#EF4444" strokeWidth={3} />
        </View>

        <Text style={styles.errorTitle}>Davet Kodu Geçersiz</Text>
        <Text style={styles.errorMessage}>{validation.error?.message}</Text>

        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => {
            setCode('');
            setValidation(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.tryAgainButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <X size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lige Katıl</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!validation && renderCodeInput()}
        {validation && !validation.valid && renderError()}
        {validation && validation.valid && renderLeaguePreview()}
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 4,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoBoxContent: {
    flex: 1,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  previewSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  previewHeader: {
    marginBottom: 24,
  },
  previewIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 24,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  roleInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  descriptionBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    width: '100%',
    marginBottom: 12,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  tryAgainButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  tryAgainButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});