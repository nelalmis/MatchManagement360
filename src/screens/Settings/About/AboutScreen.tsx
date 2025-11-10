// src/screens/Settings/About/AboutScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import {
  Info,
  Code,
  Shield,
  Heart,
  Mail,
  Globe,
  Github,
  Twitter,
  ExternalLink,
  Award,
  Users,
  Zap,
  Star,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import Constants from 'expo-constants';
import { goBack, SettingsNavigationService } from '../../../navigation';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || 
                     Constants.expoConfig?.android?.versionCode || '1';
const APP_NAME = 'MatchManagement360';

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Nevzat',
    role: 'Lead Developer',
    avatar: '👨‍💻',
  },
  // Add more team members as needed
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Website',
    url: 'https://matchmanagement360.com',
    icon: <Globe size={20} color="#3B82F6" strokeWidth={2} />,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/matchmanagement360',
    icon: <Github size={20} color="#1F2937" strokeWidth={2} />,
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/matchmgmt360',
    icon: <Twitter size={20} color="#1DA1F2" strokeWidth={2} />,
  },
];

const FEATURES = [
  'Çoklu spor desteği',
  'Lig yönetimi',
  'Maç organizasyonu',
  'İstatistik takibi',
  'Sosyal özellikler',
  'Takvim entegrasyonu',
];

export const AboutScreen: React.FC = () => {
  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const handleContactSupport = () => {
    const email = 'support@matchmanagement360.com';
    const subject = encodeURIComponent('Destek Talebi');
    const body = encodeURIComponent(
      `Uygulama: ${APP_NAME}\nSürüm: ${APP_VERSION}\nCihaz: ${Platform.OS}\n\n`
    );
    
    handleOpenLink(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleRateApp = () => {
    if (Platform.OS === 'ios') {
      handleOpenLink(`itms-apps://itunes.apple.com/app/id123456789`);
    } else {
      handleOpenLink(`market://details?id=com.matchmanagement360`);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Hakkında"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo & Info */}
        <View style={styles.appInfoCard}>
          <View style={styles.appLogoContainer}>
            <Text style={styles.appLogo}>⚽</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.appTagline}>
            Spor Organizasyonunda Yeni Dönem
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>
              v{APP_VERSION} ({BUILD_NUMBER})
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Users size={24} color="#3B82F6" strokeWidth={2} />
            <Text style={styles.statValue}>10K+</Text>
            <Text style={styles.statLabel}>Kullanıcı</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Zap size={24} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.statValue}>50K+</Text>
            <Text style={styles.statLabel}>Maç</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Star size={24} color="#10B981" strokeWidth={2} />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        {/* Features */}
        <SettingsSection title="Özellikler">
          <View style={styles.featuresList}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </SettingsSection>

        {/* Team */}
        <SettingsSection title="Ekip">
          <View style={styles.teamList}>
            {TEAM_MEMBERS.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </SettingsSection>

        {/* Social Links */}
        <SettingsSection title="Bizi Takip Edin">
          {SOCIAL_LINKS.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.socialLink}
              onPress={() => handleOpenLink(link.url)}
              activeOpacity={0.7}
            >
              <View style={styles.socialLinkLeft}>
                {link.icon}
                <Text style={styles.socialLinkText}>{link.name}</Text>
              </View>
              <ExternalLink size={18} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </SettingsSection>

        {/* Actions */}
        <SettingsSection>
          <SettingsItem
            icon={<Mail size={22} color="#3B82F6" strokeWidth={2} />}
            title="İletişim"
            subtitle="support@matchmanagement360.com"
            onPress={handleContactSupport}
            showChevron={true}
          />

          <SettingsItem
            icon={<Star size={22} color="#F59E0B" strokeWidth={2} />}
            title="Uygulamayı Değerlendir"
            subtitle="App Store / Play Store'da değerlendirin"
            onPress={handleRateApp}
            showChevron={true}
          />

          <SettingsItem
            icon={<Shield size={22} color="#10B981" strokeWidth={2} />}
            title="Gizlilik Politikası"
            subtitle="Gizlilik ve veri koruma"
            onPress={() => 
                SettingsNavigationService.navigateToTerms()
                // handleOpenLink('https://matchmanagement360.com/privacy-policy')
            }
            showChevron={true}
          />

          <SettingsItem
            icon={<Info size={22} color="#8B5CF6" strokeWidth={2} />}
            title="Kullanım Koşulları"
            subtitle="Hizmet şartları ve koşulları"
            onPress={() => 
                SettingsNavigationService.navigateToTerms()
                // handleOpenLink('https://matchmanagement360.com/terms-of-service')
                }
            showChevron={true}
          />
        </SettingsSection>

        {/* Credits */}
        <View style={styles.creditsCard}>
          <Heart size={20} color="#EF4444" strokeWidth={2} fill="#EF4444" />
          <Text style={styles.creditsText}>
            Türkiye'de ❤️ ile yapılmıştır
          </Text>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightCard}>
          <Text style={styles.copyrightText}>
            © 2024 MatchManagement360
          </Text>
          <Text style={styles.copyrightSubtext}>
            Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
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
  },
  scrollContent: {
    padding: 16,
  },

  // App Info Card
  appInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogo: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Features List
  featuresList: {
    padding: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  featureText: {
    fontSize: 14,
    color: '#1F2937',
  },

  // Team List
  teamList: {
    padding: 16,
    gap: 16,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    fontSize: 32,
    width: 48,
    height: 48,
    textAlign: 'center',
    lineHeight: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Social Links
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  socialLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialLinkText: {
    fontSize: 15,
    color: '#1F2937',
  },

  // Credits Card
  creditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginBottom: 8,
  },
  creditsText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Copyright Card
  copyrightCard: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  copyrightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});