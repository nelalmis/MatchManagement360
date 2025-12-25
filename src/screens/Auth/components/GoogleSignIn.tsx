// src/components/GoogleSignIn.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';

interface GoogleSignInButtonProps {
  onSignInSuccess?: (user: User) => void;
  onSignInError?: (error: any) => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
  onSignInError,
  loading = false,
  disabled = false,
  style,
}) => {
  useEffect(() => {
    // Google Sign-In yapılandırması
    GoogleSignin.configure({
      // Firebase Console > Project Settings > Web Client ID
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      
      // iOS için
      iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      
      // Offline erişim
      offlineAccess: true,
      
      // İstenen izinler
      scopes: ['profile', 'email'],
      
      // iOS için gerekli
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // Google Play Services kontrolü (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Kullanıcı girişi
      const userInfo = await GoogleSignin.signIn();

      // ID Token'ı al (Backend için)
      const tokens = await GoogleSignin.getTokens();
      
      console.log('✅ Google Sign-In successful:', {
        user: userInfo.data?.user,
        idToken: tokens.idToken,
      });

      // Başarı callback'i
      onSignInSuccess?.(userInfo.data as User);

    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Kullanıcı iptal etti
        console.log('User cancelled sign in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Giriş zaten devam ediyor
        console.log('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services',
          'Google Play Services yüklü değil veya güncel değil'
        );
      } else {
        Alert.alert('Hata', 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
      }

      onSignInError?.(error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.button, styles.loadingButton, style]}>
        <ActivityIndicator size="small" color="#555" />
        <Text style={styles.loadingText}>Google ile giriş yapılıyor...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={handleGoogleSignIn}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
        }}
        style={styles.googleIcon}
      />
      <Text style={styles.buttonText}>Google ile Giriş Yap</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingButton: {
    borderColor: '#D1D5DB',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
});

// Helper function to sign out
export const googleSignOut = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('✅ Google sign out successful');
  } catch (error) {
    console.error('❌ Google sign out error:', error);
  }
};