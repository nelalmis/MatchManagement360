// src/hooks/useAuth.ts - Expo Firebase JS SDK + PlayerService Version
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  loginUser,
  signUpUser,
  logoutUser,
  resetPassword,
  updateUserProfile,
  sendEmailVerification,
  checkEmailVerification,
  reloadUserData,
  addFavoriteSport,
  updateSportPositions,
  clearError,
  clearMessage,
} from '../store/slices/authSlice';
import type { IPlayer, SportType } from '../types/entity/types';
import type { AppDispatch } from '../store';

/**
 * useAuth Hook - Firebase Authentication + PlayerService
 * 
 * Tüm auth işlemlerini kolaylaştıran custom hook
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { user, isAuthenticated, loading, error, message } = useSelector(
    (state: any) => state.auth
  );

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await dispatch(loginUser({ email, password }));

        if (loginUser.fulfilled.match(result)) {
          return { success: true, data: result.payload };
        } else {
          return { 
            success: false, 
            error: result.payload as string || 'Giriş başarısız' 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      surname: string;
      phone?: string;
    }) => {
      try {
        const result = await dispatch(signUpUser(data));

        if (signUpUser.fulfilled.match(result)) {
          return { success: true, data: result.payload };
        } else {
          return { 
            success: false, 
            error: result.payload as string || 'Kayıt başarısız' 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );

  /**
   * Sign out
   */
  const logout = useCallback(async () => {
    try {
      const result = await dispatch(logoutUser());

      if (logoutUser.fulfilled.match(result)) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.payload as string || 'Çıkış yapılamadı' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Bir hata oluştu' 
      };
    }
  }, [dispatch]);

  /**
   * Reset password - Send reset email
   */
  const sendPasswordResetEmail = useCallback(
    async (email: string) => {
      try {
        const result = await dispatch(resetPassword(email));

        if (resetPassword.fulfilled.match(result)) {
          return { success: true, message: result.payload };
        } else {
          return { 
            success: false, 
            error: result.payload as string || 'E-posta gönderilemedi' 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<IPlayer>) => {
      try {
        const result = await dispatch(updateUserProfile(updates));

        if (updateUserProfile.fulfilled.match(result)) {
          return { success: true, data: result.payload };
        } else {
          return { 
            success: false, 
            error: result.payload as string || 'Profil güncellenemedi' 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );

  /**
   * Send email verification
   */
  const sendVerificationEmail = useCallback(async () => {
    try {
      const result = await dispatch(sendEmailVerification());

      if (sendEmailVerification.fulfilled.match(result)) {
        return { success: true, message: result.payload };
      } else {
        return { 
          success: false, 
          error: result.payload as string || 'E-posta gönderilemedi' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Bir hata oluştu' 
      };
    }
  }, [dispatch]);

  /**
   * Check if email is verified
   */
  const checkVerification = useCallback(async () => {
    try {
      const result = await dispatch(checkEmailVerification());

      if (checkEmailVerification.fulfilled.match(result)) {
        return { success: true, verified: result.payload };
      } else {
        return { 
          success: false, 
          error: result.payload as string || 'Kontrol edilemedi' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Bir hata oluştu' 
      };
    }
  }, [dispatch]);

  /**
   * Reload user data from database
   */
  const reloadUser = useCallback(async () => {
    try {
      const result = await dispatch(reloadUserData());

      if (reloadUserData.fulfilled.match(result)) {
        return { success: true, data: result.payload };
      } else {
        return { 
          success: false, 
          error: result.payload as string || 'Veriler yüklenemedi' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Bir hata oluştu' 
      };
    }
  }, [dispatch]);

  /**
   * Add favorite sport
   */
  const addSport = useCallback(
    async (sportType: SportType) => {
      try {
        const result = await dispatch(addFavoriteSport({ sportType }));

        if (addFavoriteSport.fulfilled.match(result)) {
          return { success: true, data: result.payload };
        } else {
          return { 
            success: false, 
            error: result.payload as string || 'Spor eklenemedi' 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );

  /**
   * Update sport positions
   */
  const setSportPositions = useCallback(
    async (sportType: SportType, positions: string[]) => {
      try {
        const result = await dispatch(
          updateSportPositions({ sportType, positions })
        );

        if (updateSportPositions.fulfilled.match(result)) {
          return { success: true, data: result.payload };
        } else {
          return { 
            success: false, 
            error: result.payload as string || 'Pozisyonlar güncellenemedi' 
          };
        }
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message || 'Bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );

  /**
   * Clear error message
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Clear success message
   */
  const clearAuthMessage = useCallback(() => {
    dispatch(clearMessage());
  }, [dispatch]);

  /**
   * Check if user has specific sport
   */
  const hasSport = useCallback(
    (sportType: SportType): boolean => {
      return user?.favoriteSports?.includes(sportType) || false;
    },
    [user]
  );

  /**
   * Get user's positions for a sport
   */
  const getPositions = useCallback(
    (sportType: SportType): string[] => {
      return user?.sportPositions?.[sportType] || [];
    },
    [user]
  );

  /**
   * Check if profile is complete
   */
  const isProfileComplete = useCallback((): boolean => {
    if (!user) return false;
    
    return !!(
      user.name &&
      user.surname &&
      user.email &&
      user.emailVerified &&
      user.favoriteSports &&
      user.favoriteSports.length > 0
    );
  }, [user]);

  /**
   * Check if user is active
   */
  const isUserActive = useCallback((): boolean => {
    if (!user) return false;
    return (user.isActive || false) && !(user.isBanned || false);
  }, [user]);

  return {
    // ============================================
    // STATE
    // ============================================
    user,
    isAuthenticated,
    loading,
    error,
    message,

    // ============================================
    // AUTH ACTIONS
    // ============================================
    signIn,
    signUp,
    logout,
    sendPasswordResetEmail,

    // ============================================
    // PROFILE ACTIONS
    // ============================================
    updateProfile,
    reloadUser,

    // ============================================
    // EMAIL VERIFICATION
    // ============================================
    sendVerificationEmail,
    checkVerification,

    // ============================================
    // SPORT PREFERENCES
    // ============================================
    addSport,
    setSportPositions,
    hasSport,
    getPositions,

    // ============================================
    // UTILITIES
    // ============================================
    clearError: clearAuthError,
    clearMessage: clearAuthMessage,
    isProfileComplete,
    isUserActive,
  };
};

export default useAuth;

/* 
================================================================================
KULLANIM ÖRNEKLERİ
================================================================================

1. LOGIN
--------------------------------------------------------------------------------
import { useAuth } from '../hooks';

function LoginScreen() {
  const { signIn, loading, error } = useAuth();

  const handleLogin = async () => {
    const result = await signIn('user@example.com', 'password123');
    
    if (result.success) {
      console.log('Giriş başarılı!');
    } else {
      Alert.alert('Hata', result.error);
    }
  };

  return (
    <View>
      <Button title="Giriş Yap" onPress={handleLogin} disabled={loading} />
      {error && <Text>{error}</Text>}
    </View>
  );
}

2. REGISTER
--------------------------------------------------------------------------------
function RegisterScreen() {
  const { signUp, loading } = useAuth();

  const handleRegister = async () => {
    const result = await signUp({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'Ahmet',
      surname: 'Yılmaz',
      phone: '+905551234567'
    });

    if (result.success) {
      Alert.alert('Başarılı', 'Kayıt tamamlandı!');
    }
  };

  return <Button title="Kayıt Ol" onPress={handleRegister} />;
}

3. PROFILE UPDATE
--------------------------------------------------------------------------------
function EditProfileScreen() {
  const { user, updateProfile, loading } = useAuth();

  const handleUpdate = async () => {
    const result = await updateProfile({
      name: 'Yeni İsim',
      jerseyNumber: '10',
      birthDate: '1990-01-01'
    });

    if (result.success) {
      Alert.alert('Başarılı', 'Profil güncellendi');
    }
  };

  return (
    <View>
      <TextInput defaultValue={user?.name} />
      <Button title="Güncelle" onPress={handleUpdate} />
    </View>
  );
}

4. EMAIL VERIFICATION
--------------------------------------------------------------------------------
function EmailVerificationScreen() {
  const { user, sendVerificationEmail, checkVerification } = useAuth();

  const handleSendEmail = async () => {
    const result = await sendVerificationEmail();
    
    if (result.success) {
      Alert.alert('Başarılı', result.message);
    }
  };

  const handleCheck = async () => {
    const result = await checkVerification();
    
    if (result.success && result.verified) {
      Alert.alert('Tebrikler', 'E-posta doğrulandı!');
    }
  };

  if (user?.emailVerified) {
    return <Text>✅ E-posta doğrulandı</Text>;
  }

  return (
    <View>
      <Button title="Doğrulama E-postası Gönder" onPress={handleSendEmail} />
      <Button title="Kontrol Et" onPress={handleCheck} />
    </View>
  );
}

5. SPORT PREFERENCES
--------------------------------------------------------------------------------
function SportsScreen() {
  const { user, addSport, setSportPositions, hasSport, getPositions } = useAuth();

  const handleAddFootball = async () => {
    const result = await addSport('Futbol');
    
    if (result.success) {
      Alert.alert('Başarılı', 'Futbol eklendi');
    }
  };

  const handleSetPositions = async () => {
    const result = await setSportPositions('Futbol', ['Forvet', 'Kanat']);
    
    if (result.success) {
      Alert.alert('Başarılı', 'Pozisyonlar kaydedildi');
    }
  };

  const hasFootball = hasSport('Futbol');
  const footballPositions = getPositions('Futbol');

  return (
    <View>
      <Text>Futbol: {hasFootball ? '✓' : '✗'}</Text>
      <Text>Pozisyonlar: {footballPositions.join(', ')}</Text>
      <Button title="Futbol Ekle" onPress={handleAddFootball} />
      <Button title="Pozisyon Ayarla" onPress={handleSetPositions} />
    </View>
  );
}

6. PROFILE STATUS
--------------------------------------------------------------------------------
function ProfileScreen() {
  const { user, isProfileComplete, isUserActive, logout } = useAuth();

  const profileComplete = isProfileComplete();
  const userActive = isUserActive();

  return (
    <View>
      <Text>Profil: {profileComplete ? 'Tamamlandı' : 'Eksik'}</Text>
      <Text>Durum: {userActive ? 'Aktif' : 'Pasif/Banlı'}</Text>
      
      {!profileComplete && (
        <Button title="Profili Tamamla" onPress={() => {}} />
      )}
      
      {!userActive && (
        <Text>Hesabınız aktif değil</Text>
      )}
      
      <Button title="Çıkış Yap" onPress={logout} />
    </View>
  );
}

7. COMPLETE EXAMPLE - Home Screen
--------------------------------------------------------------------------------
function HomeScreen() {
  const { 
    user, 
    isAuthenticated, 
    loading,
    error,
    reloadUser,
    isProfileComplete,
    hasSport,
    logout 
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    await reloadUser();
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <ScrollView>
      <Text>Hoş geldin, {user?.displayName || user?.name}</Text>
      
      {!user?.emailVerified && (
        <Text style={styles.warning}>⚠️ E-postanızı doğrulayın</Text>
      )}
      
      {!isProfileComplete() && (
        <Text style={styles.warning}>⚠️ Profilinizi tamamlayın</Text>
      )}
      
      <Text>Favori Sporlar:</Text>
      {user?.favoriteSports?.map(sport => (
        <Text key={sport}>✓ {sport}</Text>
      ))}
      
      <Button title="Çıkış Yap" onPress={logout} />
    </ScrollView>
  );
}

8. WITH NAVIGATION
--------------------------------------------------------------------------------
function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

================================================================================
*/