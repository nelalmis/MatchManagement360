// src/screens/Settings/Legal/TermsScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  FileText,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { goBack } from '../../../navigation';

interface Section {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const LAST_UPDATED = '10 Kasım 2024';

const TERMS_SECTIONS: Section[] = [
  {
    title: '1. Hizmet Kullanım Koşulları',
    icon: <FileText size={20} color="#3B82F6" strokeWidth={2} />,
    content: `MatchManagement360 platformunu kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız. Platform, spor etkinliklerini organize etmek ve yönetmek için tasarlanmıştır.

Kullanıcılar, platformu yalnızca yasal amaçlar için kullanmayı kabul eder. Yasadışı, zararlı veya uygunsuz içerik paylaşmak yasaktır.`,
  },
  {
    title: '2. Kullanıcı Hesapları',
    icon: <Shield size={20} color="#10B981" strokeWidth={2} />,
    content: `Hesap oluşturmak için 13 yaşından büyük olmanız gerekmektedir. Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.

Hesabınızda gerçekleşen tüm faaliyetlerden siz sorumlusunuz. Şüpheli bir aktivite fark ederseniz derhal bizi bilgilendirin.

Hesabınızı başkalarıyla paylaşamazsınız. Her kullanıcı yalnızca bir hesap oluşturabilir.`,
  },
  {
    title: '3. Gizlilik ve Veri Koruma',
    icon: <Shield size={20} color="#8B5CF6" strokeWidth={2} />,
    content: `Kişisel verileriniz KVKK ve GDPR kapsamında korunur. Verilerinizi üçüncü şahıslarla paylaşmayız.

Topladığımız veriler: Ad, e-posta, telefon numarası, konum bilgisi (isteğe bağlı), etkinlik verileri ve kullanım istatistikleri.

Verilerinizi dilediğiniz zaman dışa aktarabilir veya hesabınızı silebilirsiniz.`,
  },
  {
    title: '4. İçerik Politikası',
    icon: <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />,
    content: `Kullanıcılar, paylaştıkları içeriklerden sorumludur. Aşağıdaki içerikler yasaktır:

- Nefret söylemi veya ayrımcılık içeren içerikler
- Şiddet, tehdit veya taciz içeren paylaşımlar
- Telif hakkı ihlali yapan içerikler
- Yanıltıcı veya sahte bilgiler
- Uygunsuz veya müstehcen içerikler

Uygunsuz içerikler tespit edildiğinde kaldırılır ve hesap askıya alınabilir.`,
  },
  {
    title: '5. Ödeme ve İadeler',
    icon: <FileText size={20} color="#EF4444" strokeWidth={2} />,
    content: `Platform üzerinden yapılan ödemeler güvenli ödeme sistemleri üzerinden işlenir. Ücretli etkinliklerde organizatör iade politikasını belirler.

Uygulama içi satın alımlar için Apple App Store ve Google Play Store politikaları geçerlidir.

İade talepleri, etkinlik başlangıcından en az 24 saat önce yapılmalıdır.`,
  },
  {
    title: '6. Sorumluluk Sınırlaması',
    icon: <AlertCircle size={20} color="#6B7280" strokeWidth={2} />,
    content: `MatchManagement360, kullanıcılar arasındaki etkileşimlerden sorumlu değildir. Platform yalnızca organizasyon aracıdır.

Platformun kesintisiz veya hatasız çalışacağını garanti etmeyiz. Teknik sorunlardan kaynaklanan kayıplardan sorumlu değiliz.

Kullanıcıların kişisel güvenliği kendi sorumluluğundadır. Etkinliklere katılırken gerekli önlemleri alınız.`,
  },
  {
    title: '7. Fikri Mülkiyet',
    icon: <FileText size={20} color="#3B82F6" strokeWidth={2} />,
    content: `Platform ve içeriğindeki tüm fikri mülkiyet hakları MatchManagement360'a aittir. İzinsiz kullanım yasaktır.

Kullanıcıların paylaştığı içeriklerin telif hakları kendilerine aittir ancak platformda kullanım için bize lisans verirler.`,
  },
  {
    title: '8. Hesap Askıya Alma ve Sonlandırma',
    icon: <AlertCircle size={20} color="#EF4444" strokeWidth={2} />,
    content: `Kullanım koşullarını ihlal eden hesaplar uyarı almadan askıya alınabilir veya sonlandırılabilir.

Hesabınızı istediğiniz zaman kapatabilirsiniz. Kapatılan hesaplar 30 gün içinde kalıcı olarak silinir.`,
  },
  {
    title: '9. Değişiklikler',
    icon: <FileText size={20} color="#8B5CF6" strokeWidth={2} />,
    content: `Bu kullanım koşullarını istediğimiz zaman değiştirebiliriz. Önemli değişiklikler için kullanıcılara bildirim gönderilir.

Değişiklikler yürürlüğe girdikten sonra platformu kullanmaya devam etmek, yeni koşulları kabul ettiğiniz anlamına gelir.`,
  },
  {
    title: '10. İletişim',
    icon: <FileText size={20} color="#10B981" strokeWidth={2} />,
    content: `Sorularınız için bize ulaşabilirsiniz:

E-posta: legal@matchmanagement360.com
Adres: İstanbul, Türkiye
Telefon: +90 555 123 45 67

Kullanım koşulları hakkında sorularınız varsa lütfen bizimle iletişime geçin.`,
  },
];

export const TermsScreen: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Kullanım Koşulları"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <FileText size={32} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.headerTitle}>Kullanım Koşulları</Text>
          <View style={styles.lastUpdated}>
            <Calendar size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.lastUpdatedText}>
              Son Güncelleme: {LAST_UPDATED}
            </Text>
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
          <Text style={styles.noticeText}>
            Lütfen bu kullanım koşullarını dikkatlice okuyun. Platformu
            kullanarak bu koşulları kabul etmiş sayılırsınız.
          </Text>
        </View>

        {/* Sections */}
        {TERMS_SECTIONS.map((section, index) => {
          const isExpanded = expandedSection === index;

          return (
            <TouchableOpacity
              key={index}
              style={styles.sectionCard}
              onPress={() => setExpandedSection(isExpanded ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  {section.icon}
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color="#6B7280" strokeWidth={2} />
                ) : (
                  <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
                )}
              </View>
              {isExpanded && (
                <Text style={styles.sectionContent}>{section.content}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Footer */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Yasal Uyarı</Text>
          <Text style={styles.footerText}>
            Bu kullanım koşulları Türkiye Cumhuriyeti kanunlarına tabidir.
            Uyuşmazlıklar İstanbul mahkemelerinde çözülecektir.
          </Text>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightCard}>
          <Text style={styles.copyrightText}>
            © 2024 MatchManagement360. Tüm hakları saklıdır.
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

  // Header Card
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastUpdatedText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Notice Card
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Section Card
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },

  // Footer Card
  footerCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },

  // Copyright Card
  copyrightCard: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  copyrightText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});