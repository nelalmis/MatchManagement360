import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Bell,
  BellOff,
  Trophy,
  Calendar,
  Users,
  Star,
  MessageCircle,
  Zap,
  Crown,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';

interface NotificationSetting {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  color: string;
}

export const NotificationSettingsScreen: React.FC = () => {
  const [allNotifications, setAllNotifications] = useState(true);
  
  const [matchNotifications, setMatchNotifications] = useState({
    matchReminder: true,
    matchStarting: true,
    matchCompleted: true,
    matchCancelled: true,
    teamAnnouncement: true,
  });

  const [leagueNotifications, setLeagueNotifications] = useState({
    newFixture: true,
    fixtureUpdate: true,
    standingsUpdate: false,
    newLeague: true,
  });

  const [socialNotifications, setSocialNotifications] = useState({
    newComment: true,
    commentReply: false,
    ratingReceived: true,
    mvpAward: true,
  });

  const [activityNotifications, setActivityNotifications] = useState({
    goalMilestone: true,
    mvpStreak: true,
    newAchievement: true,
    weeklyReport: false,
  });

  const handleToggleAll = useCallback((value: boolean) => {
    setAllNotifications(value);
    
    if (!value) {
      // Turn off all notifications
      setMatchNotifications({
        matchReminder: false,
        matchStarting: false,
        matchCompleted: false,
        matchCancelled: false,
        teamAnnouncement: false,
      });
      setLeagueNotifications({
        newFixture: false,
        fixtureUpdate: false,
        standingsUpdate: false,
        newLeague: false,
      });
      setSocialNotifications({
        newComment: false,
        commentReply: false,
        ratingReceived: false,
        mvpAward: false,
      });
      setActivityNotifications({
        goalMilestone: false,
        mvpStreak: false,
        newAchievement: false,
        weeklyReport: false,
      });
    }
  }, []);

  const handleSave = useCallback(() => {
    Alert.alert(
      'Başarılı',
      'Bildirim ayarlarınız kaydedildi',
      [{ text: 'Tamam' }]
    );
  }, []);

  const handleTestNotification = useCallback(() => {
    Alert.alert(
      'Test Bildirimi',
      'Bir test bildirimi gönderildi! 🔔',
      [{ text: 'Tamam' }]
    );
  }, []);

  const renderNotificationItem = (
    title: string,
    description: string,
    icon: React.ReactNode,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled: boolean = false
  ) => (
    <View style={[styles.notificationItem, disabled && styles.disabledItem]}>
      <View style={styles.notificationItemLeft}>
        <View style={styles.notificationIcon}>{icon}</View>
        <View style={styles.notificationTextContainer}>
          <Text style={[styles.notificationTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          <Text style={[styles.notificationDescription, disabled && styles.disabledText]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
        thumbColor={value ? '#16a34a' : '#F3F4F6'}
      />
    </View>
  );

  const isAllDisabled = !allNotifications;

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerContent}>
          <Bell size={28} color="white" strokeWidth={2.5} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
            <Text style={styles.headerSubtitle}>
              Hangi bildirimleri almak istediğinizi seçin
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.masterToggleCard}>
          <View style={styles.masterToggleLeft}>
            <View style={[styles.masterToggleIcon, allNotifications ? styles.masterToggleIconActive : styles.masterToggleIconInactive]}>
              {allNotifications ? (
                <Bell size={24} color="#16a34a" strokeWidth={2.5} />
              ) : (
                <BellOff size={24} color="#9CA3AF" strokeWidth={2.5} />
              )}
            </View>
            <View>
              <Text style={styles.masterToggleTitle}>
                {allNotifications ? 'Bildirimler Açık' : 'Bildirimler Kapalı'}
              </Text>
              <Text style={styles.masterToggleDescription}>
                {allNotifications 
                  ? 'Tüm bildirimleri alıyorsunuz'
                  : 'Hiçbir bildirim almıyorsunuz'}
              </Text>
            </View>
          </View>
          <Switch
            value={allNotifications}
            onValueChange={handleToggleAll}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={allNotifications ? '#16a34a' : '#F3F4F6'}
            style={styles.masterToggleSwitch}
          />
        </View>

        {/* Match Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color="#16a34a" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Maç Bildirimleri</Text>
          </View>
          <View style={styles.notificationGroup}>
            {renderNotificationItem(
              'Maç Hatırlatıcısı',
              '1 saat önce hatırlatma',
              <Calendar size={20} color="#3B82F6" strokeWidth={2} />,
              matchNotifications.matchReminder,
              (value) => setMatchNotifications({ ...matchNotifications, matchReminder: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Maç Başlıyor',
              'Maç başlamadan 15 dk önce',
              <Zap size={20} color="#F59E0B" strokeWidth={2} />,
              matchNotifications.matchStarting,
              (value) => setMatchNotifications({ ...matchNotifications, matchStarting: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Maç Tamamlandı',
              'Maç sonucu ve istatistikler',
              <CheckCircle2 size={20} color="#10B981" strokeWidth={2} />,
              matchNotifications.matchCompleted,
              (value) => setMatchNotifications({ ...matchNotifications, matchCompleted: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Maç İptal Edildi',
              'İptal bildirimleri',
              <AlertCircle size={20} color="#EF4444" strokeWidth={2} />,
              matchNotifications.matchCancelled,
              (value) => setMatchNotifications({ ...matchNotifications, matchCancelled: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Takım Duyuruları',
              'Kadro ve takım değişiklikleri',
              <Users size={20} color="#8B5CF6" strokeWidth={2} />,
              matchNotifications.teamAnnouncement,
              (value) => setMatchNotifications({ ...matchNotifications, teamAnnouncement: value }),
              isAllDisabled
            )}
          </View>
        </View>

        {/* League Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={18} color="#16a34a" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Lig Bildirimleri</Text>
          </View>
          <View style={styles.notificationGroup}>
            {renderNotificationItem(
              'Yeni Fikstür',
              'Yeni fikstür oluşturuldu',
              <Calendar size={20} color="#3B82F6" strokeWidth={2} />,
              leagueNotifications.newFixture,
              (value) => setLeagueNotifications({ ...leagueNotifications, newFixture: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Fikstür Güncellemesi',
              'Fikstür tarih/saat değişiklikleri',
              <Calendar size={20} color="#F59E0B" strokeWidth={2} />,
              leagueNotifications.fixtureUpdate,
              (value) => setLeagueNotifications({ ...leagueNotifications, fixtureUpdate: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Puan Durumu Güncellemesi',
              'Puan durumu değişiklikleri',
              <Trophy size={20} color="#10B981" strokeWidth={2} />,
              leagueNotifications.standingsUpdate,
              (value) => setLeagueNotifications({ ...leagueNotifications, standingsUpdate: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Yeni Lig',
              'Yeni lig duyuruları',
              <Trophy size={20} color="#8B5CF6" strokeWidth={2} />,
              leagueNotifications.newLeague,
              (value) => setLeagueNotifications({ ...leagueNotifications, newLeague: value }),
              isAllDisabled
            )}
          </View>
        </View>

        {/* Social Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={18} color="#16a34a" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Sosyal Bildirimler</Text>
          </View>
          <View style={styles.notificationGroup}>
            {renderNotificationItem(
              'Yeni Yorum',
              'Maçlara yeni yorum geldiğinde',
              <MessageCircle size={20} color="#3B82F6" strokeWidth={2} />,
              socialNotifications.newComment,
              (value) => setSocialNotifications({ ...socialNotifications, newComment: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Yorum Yanıtı',
              'Yorumlarınıza yanıt geldiğinde',
              <MessageCircle size={20} color="#10B981" strokeWidth={2} />,
              socialNotifications.commentReply,
              (value) => setSocialNotifications({ ...socialNotifications, commentReply: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Puanlama Alındı',
              'Yeni puanlama aldığınızda',
              <Star size={20} color="#F59E0B" strokeWidth={2} />,
              socialNotifications.ratingReceived,
              (value) => setSocialNotifications({ ...socialNotifications, ratingReceived: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'MVP Ödülü',
              'MVP seçildiğinizde',
              <Crown size={20} color="#8B5CF6" strokeWidth={2} />,
              socialNotifications.mvpAward,
              (value) => setSocialNotifications({ ...socialNotifications, mvpAward: value }),
              isAllDisabled
            )}
          </View>
        </View>

        {/* Activity Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={18} color="#16a34a" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Aktivite Bildirimleri</Text>
          </View>
          <View style={styles.notificationGroup}>
            {renderNotificationItem(
              'Gol Başarımı',
              '10, 25, 50 gol başarıları',
              <Target size={20} color="#EF4444" strokeWidth={2} />,
              activityNotifications.goalMilestone,
              (value) => setActivityNotifications({ ...activityNotifications, goalMilestone: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'MVP Serisi',
              'Ardışık MVP başarıları',
              <Crown size={20} color="#F59E0B" strokeWidth={2} />,
              activityNotifications.mvpStreak,
              (value) => setActivityNotifications({ ...activityNotifications, mvpStreak: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Yeni Başarım',
              'Rozetler ve başarımlar',
              <Star size={20} color="#8B5CF6" strokeWidth={2} />,
              activityNotifications.newAchievement,
              (value) => setActivityNotifications({ ...activityNotifications, newAchievement: value }),
              isAllDisabled
            )}
            {renderNotificationItem(
              'Haftalık Rapor',
              'Haftalık performans özeti',
              <Trophy size={20} color="#10B981" strokeWidth={2} />,
              activityNotifications.weeklyReport,
              (value) => setActivityNotifications({ ...activityNotifications, weeklyReport: value }),
              isAllDisabled
            )}
          </View>
        </View>

        {/* Test Notification Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestNotification}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.testButtonText}>Test Bildirimi Gönder</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <AlertCircle size={20} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.infoText}>
            Bildirim ayarları cihazınıza özeldir. Farklı cihazlarda farklı
            ayarlar yapabilirsiniz.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <CheckCircle2 size={20} color="white" strokeWidth={2.5} />
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBanner: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  masterToggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  masterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  masterToggleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterToggleIconActive: {
    backgroundColor: '#DCFCE7',
  },
  masterToggleIconInactive: {
    backgroundColor: '#F3F4F6',
  },
  masterToggleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  masterToggleDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  masterToggleSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationGroup: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledItem: {
    opacity: 0.4,
  },
  notificationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  saveButtonContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  bottomSpacing: {
    height: 16,
  },
});