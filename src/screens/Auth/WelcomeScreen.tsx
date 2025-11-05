// src/screens/auth/WelcomeScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { commonColors, typography, spacing, borderRadius } from '../../utils/theme';
import { AuthButton } from './components/AuthButton';
import { getSportEmoji } from '../../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { AuthStackParamList } from '../../navigation/types';
import { OnboardingStorage } from '../../services/storage/onboardingStorage';

type Props = NativeStackScreenProps<AuthStackParamList, 'welcome'>;

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  gradient: [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '⚽🏀🏐',
    title: 'Sevdiğin Sporu Seç',
    description: 'Futbol, basketbol, voleybol, tenis ve daha fazlası! Hangi sporu seviyorsan seç, oynamaya başla.',
    gradient: ['#16a34a', '#15803d'],
  },
  {
    id: '2',
    emoji: '👥',
    title: 'Takım Arkadaşı Bul',
    description: 'Çevrendeki sporcularla tanış, arkadaşlık kur ve birlikte maçlara katıl.',
    gradient: ['#2563eb', '#1d4ed8'],
  },
  {
    id: '3',
    emoji: '🏆',
    title: 'Liglere Katıl',
    description: 'Lig oluştur veya mevcut liglere katıl. Performansını takip et, sıralamalarda yüksel!',
    gradient: ['#f59e0b', '#d97706'],
  },
];

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

   const handleGetStarted = async () => {
    try {
      // Welcome ekranı görüldü olarak işaretle
      await OnboardingStorage.markWelcomeAsSeen();
      
      // Auth ekranına yönlendir
      navigation.replace('login');
    } catch (error) {
      console.error('Error completing welcome:', error);
      navigation.replace('login');
    }
  };
  
  const handleSkip = () => {
    navigation.replace('login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.replace('login');
    }
  };


  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slideGradient}
        >
          <Animated.View
            style={[
              styles.emojiContainer,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity }]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {renderPagination()}

        <View style={styles.buttonsContainer}>
          {currentIndex === slides.length - 1 ? (
            <>
              <AuthButton
                title="Hemen Başla"
                onPress={handleGetStarted}
                variant="gradient"
                gradientColors={['#16a34a', '#15803d']}
                icon="arrow-forward"
                iconPosition="right"
              />
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.replace('login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLinkText}>
                  Zaten hesabın var mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <AuthButton
              title="İleri"
              onPress={handleNext}
              variant="gradient"
              gradientColors={slides[currentIndex].gradient}
              icon="arrow-forward"
              iconPosition="right"
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonColors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.body1.fontSize,
    color: commonColors.white,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emojiContainer: {
    marginBottom: spacing.xxl,
  },
  emoji: {
    fontSize: 120,
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: commonColors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body1.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    backgroundColor: commonColors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: commonColors.info,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginLinkText: {
    fontSize: typography.body2.fontSize,
    color: commonColors.text.secondary,
  },
  loginLinkBold: {
    color: commonColors.info,
    fontWeight: '600',
  },
});