// src/screens/auth/SplashScreen.tsx - WITH AUTO LOGIN CHECK

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import { commonColors, typography, spacing } from '../../utils/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingStorage } from '../../services/storage/onboardingStorage';
import { isProfileComplete } from '../../helper/helper';

type Props = NativeStackScreenProps<AuthStackParamList, 'splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // ✅ useAuth hook'undan checkAutoLogin'i alıyoruz
  const { checkAutoLogin, loading: authLoading } = useAuth();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // ✅ Navigation logic with auto-login check
    const initializeApp = async () => {
      try {
        // Minimum splash screen time (UX için)
        await new Promise(resolve => setTimeout(resolve, 2500));

        console.log('🔍 Splash - Checking authentication...');

        // 1️⃣ Auto-login kontrolü (trusted device check)
        const autoLoginUser = await checkAutoLogin();

        if (autoLoginUser) {
          // ✅ Auto-login başarılı
          console.log('✅ Auto-login successful:', autoLoginUser.email);

          // Profile completion check
          if (!isProfileComplete(autoLoginUser)) {
            console.log('➡️ Profile incomplete, navigating to complete profile');
            navigation.navigate('completeProfile');
          } else {
            console.log('✅ Profile complete, user authenticated');
            // RootNavigator otomatik olarak Main stack'e geçecek
            // Burada bir şey yapmamıza gerek yok
          }
          return;
        }

        // 2️⃣ Auto-login yok, onboarding kontrolü
        console.log('🔍 No auto-login, checking onboarding...');
        const isFirstLaunch = await OnboardingStorage.isFirstLaunch();

        if (isFirstLaunch) {
          // İlk açılış
          console.log('➡️ First launch, navigating to welcome');
          navigation.navigate('welcome');
        } else {
          // İlk açılış değil, login'e git
          console.log('➡️ Not first launch, navigating to login');
          navigation.navigate('login');
        }
      } catch (error) {
        console.error('❌ Splash initialization error:', error);
        // Hata durumunda login'e yönlendir
        navigation.navigate('login');
      }
    };

    initializeApp();
  }, [navigation, checkAutoLogin]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={['#16a34a', '#15803d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>⚽</Text>
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.appName}>SportMatch</Text>
            <Text style={styles.tagline}>Spor Arkadaşını Bul</Text>
          </Animated.View>

          {/* Loading Indicator */}
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.loadingDots}>
              <LoadingDot delay={0} />
              <LoadingDot delay={200} />
              <LoadingDot delay={400} />
            </View>
          </Animated.View>

          {/* Version Info */}
          <Animated.Text
            style={[
              styles.version,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            v1.0.0
          </Animated.Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ============================================
// LOADING DOT COMPONENT
// ============================================

const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoEmoji: {
    fontSize: 64,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: commonColors.white,
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.h5.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: commonColors.white,
    marginHorizontal: 4,
  },
  version: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    fontSize: typography.caption.fontSize,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});

export default SplashScreen;