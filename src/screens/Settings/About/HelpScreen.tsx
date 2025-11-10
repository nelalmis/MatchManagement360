// src/screens/Settings/Help/HelpScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Book,
  Video,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Send,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import { goBack } from '../../../navigation';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface HelpLink {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}

const FAQS: FAQ[] = [
  {
    category: 'Genel',
    question: 'MatchManagement360 nedir?',
    answer:
      'MatchManagement360, spor maçlarınızı organize etmenizi, liglerinizi yönetmenizi ve takım arkadaşlarınızla iletişim kurmanızı sağlayan kapsamlı bir spor yönetim platformudur.',
  },
  {
    category: 'Genel',
    question: 'Hangi sporları destekliyorsunuz?',
    answer:
      'Futbol, basketbol, voleybol, tenis, masa tenisi ve badminton gibi birçok sporu destekliyoruz. Her spor için özel özellikler ve istatistikler sunuyoruz.',
  },
  {
    category: 'Hesap',
    question: 'Hesabımı nasıl silebilirim?',
    answer:
      'Ayarlar > Hesap > Hesabı Sil bölümünden hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz ve tüm verileriniz silinir.',
  },
  {
    category: 'Maçlar',
    question: 'Nasıl maç oluşturabilirim?',
    answer:
      'Ana ekranda "+" butonuna tıklayarak yeni maç oluşturabilirsiniz. Spor türünü seçin, tarih ve saat belirleyin ve oyuncuları davet edin.',
  },
  {
    category: 'Maçlar',
    question: 'Maç davetini nasıl iptal edebilirim?',
    answer:
      'Maç detaylarına gidin, üç nokta menüsünden "İptali Et" seçeneğini seçin. Tüm davet edilen oyunculara bildirim gönderilir.',
  },
  {
    category: 'Ligler',
    question: 'Lig nasıl oluşturabilirim?',
    answer:
      'Ligler sekmesine gidin, "Yeni Lig" butonuna tıklayın. Lig adı, format ve kurallarını belirleyin, ardından takımları ekleyin.',
  },
  {
    category: 'Ligler',
    question: 'Lig fikstürü otomatik oluşturuluyor mu?',
    answer:
      'Evet, lig oluştururken formatı seçtiğinizde (tek devreli/çift devreli) fikstür otomatik olarak oluşturulur. Dilerseniz manuel olarak düzenleyebilirsiniz.',
  },
  {
    category: 'Ödemeler',
    question: 'Maç ücretleri nasıl ödenir?',
    answer:
      'Maç oluştururken ücret belirleyebilirsiniz. Oyuncular uygulama içinden veya nakit olarak ödeme yapabilir. Ödeme durumu otomatik takip edilir.',
  },
  {
    category: 'Bildirimler',
    question: 'Çok fazla bildirim alıyorum, ne yapmalıyım?',
    answer:
      'Ayarlar > Bildirimler bölümünden bildirim tercihlerinizi özelleştirebilirsiniz. Sadece önemli bildirimleri almayı seçebilirsiniz.',
  },
  {
    category: 'Güvenlik',
    question: 'Verilerim güvende mi?',
    answer:
      'Evet, tüm verileriniz şifreli olarak saklanır ve üçüncü şahıslarla paylaşılmaz. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.',
  },
];

const HELP_LINKS: HelpLink[] = [
  {
    title: 'Kullanım Kılavuzu',
    description: 'Detaylı kullanım talimatları',
    url: 'https://docs.matchmanagement360.com',
    icon: <Book size={22} color="#3B82F6" strokeWidth={2} />,
  },
  {
    title: 'Video Eğitimleri',
    description: 'Adım adım video rehberleri',
    url: 'https://youtube.com/matchmanagement360',
    icon: <Video size={22} color="#EF4444" strokeWidth={2} />,
  },
  {
    title: 'SSS',
    description: 'Sık sorulan sorular',
    url: 'https://help.matchmanagement360.com/faq',
    icon: <HelpCircle size={22} color="#F59E0B" strokeWidth={2} />,
  },
];

export const HelpScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactMessage, setContactMessage] = useState('');

  const filteredFAQs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const body = encodeURIComponent(contactMessage);
    
    handleOpenLink(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir mesaj yazın');
      return;
    }

    Alert.alert(
      'Mesaj Gönder',
      'Destek ekibimize e-posta ile iletişime geçmek ister misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: handleContactSupport,
        },
      ]
    );
  };

  const getCategoryFAQs = (category: string) => {
    return filteredFAQs.filter((faq) => faq.category === category);
  };

  const categories = [...new Set(FAQS.map((faq) => faq.category))];

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Yardım & Destek"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Soru veya konu ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Links */}
        <SettingsSection title="Hızlı Erişim">
          {HELP_LINKS.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.helpLink}
              onPress={() => handleOpenLink(link.url)}
              activeOpacity={0.7}
            >
              <View style={styles.helpLinkLeft}>
                {link.icon}
                <View style={styles.helpLinkContent}>
                  <Text style={styles.helpLinkTitle}>{link.title}</Text>
                  <Text style={styles.helpLinkDescription}>
                    {link.description}
                  </Text>
                </View>
              </View>
              <ExternalLink size={18} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </SettingsSection>

        {/* FAQs */}
        <SettingsSection title="Sık Sorulan Sorular">
          {categories.map((category) => {
            const categoryFAQs = getCategoryFAQs(category);
            
            if (categoryFAQs.length === 0) return null;

            return (
              <View key={category}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {categoryFAQs.map((faq, index) => {
                  const globalIndex = FAQS.indexOf(faq);
                  const isExpanded = expandedFAQ === globalIndex;

                  return (
                    <TouchableOpacity
                      key={globalIndex}
                      style={styles.faqItem}
                      onPress={() =>
                        setExpandedFAQ(isExpanded ? null : globalIndex)
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqHeader}>
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                        {isExpanded ? (
                          <ChevronUp size={20} color="#6B7280" strokeWidth={2} />
                        ) : (
                          <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
                        )}
                      </View>
                      {isExpanded && (
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </SettingsSection>

        {/* Contact Form */}
        <SettingsSection title="Bize Ulaşın">
          <View style={styles.contactForm}>
            <Text style={styles.contactFormLabel}>
              Sorunuzu bulamadınız mı? Bize mesaj gönderin:
            </Text>
            <TextInput
              style={styles.contactTextArea}
              placeholder="Sorunuzu veya geri bildiriminizi yazın..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={6}
              value={contactMessage}
              onChangeText={setContactMessage}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Send size={18} color="white" strokeWidth={2} />
              <Text style={styles.sendButtonText}>Mesaj Gönder</Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>

        {/* Contact Methods */}
        <SettingsSection title="Diğer İletişim Yolları">
          <SettingsItem
            icon={<Mail size={22} color="#3B82F6" strokeWidth={2} />}
            title="E-posta"
            subtitle="support@matchmanagement360.com"
            onPress={() =>
              handleOpenLink('mailto:support@matchmanagement360.com')
            }
            showChevron={true}
          />

          <SettingsItem
            icon={<MessageCircle size={22} color="#10B981" strokeWidth={2} />}
            title="Canlı Sohbet"
            subtitle="Pazartesi-Cuma, 09:00-18:00"
            onPress={() => Alert.alert('Canlı Sohbet', 'Yakında aktif olacak')}
            showChevron={true}
          />

          <SettingsItem
            icon={<Phone size={22} color="#F59E0B" strokeWidth={2} />}
            title="Telefon"
            subtitle="+90 555 123 45 67"
            onPress={() => handleOpenLink('tel:+905551234567')}
            showChevron={true}
          />
        </SettingsSection>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İpucu</Text>
          <Text style={styles.tipsText}>
            Daha hızlı yanıt almak için sorunuzu detaylı açıklayın ve mümkünse
            ekran görüntüleri ekleyin. Destek ekibimiz 24 saat içinde size geri
            dönecektir.
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },

  // Help Links
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  helpLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  helpLinkContent: {
    flex: 1,
  },
  helpLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  helpLinkDescription: {
    fontSize: 13,
    color: '#6B7280',
  },

  // FAQs
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  faqItem: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },

  // Contact Form
  contactForm: {
    padding: 16,
    gap: 12,
  },
  contactFormLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  contactTextArea: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },

  // Tips
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
});