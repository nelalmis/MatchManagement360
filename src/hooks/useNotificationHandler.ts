import { useEffect, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useNavigationContext } from '../context/NavigationContext';

// Bildirim tipi interface
interface NotificationData {
  type: string;
  matchId?: string;
  leagueId?: string;
  fixtureId?: string;
  title?: string;
  body?: string;
  [key: string]: any;
}

// Hook props interface
interface UseNotificationHandlerProps {
  shouldShowAlert?: boolean;
  shouldPlaySound?: boolean;
  shouldSetBadge?: boolean;
}

export const useNotificationHandler = (props?: UseNotificationHandlerProps) => {
  const {
    shouldShowAlert = true,
    shouldPlaySound = true,
    shouldSetBadge = true,
  } = props || {};

  // Bildirimlerin nasıl gösterileceğini ayarla (props'larla kontrol edilebilir)
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert,
        shouldPlaySound,
        shouldSetBadge,
        shouldShowBanner: shouldShowAlert, // iOS için banner
        shouldShowList: shouldShowAlert,   // iOS için notification center
      }),
    });
  }, [shouldShowAlert, shouldPlaySound, shouldSetBadge]);
  const { navigate } = useNavigationContext();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Bildirim navigasyonunu işle
  const handleNotificationNavigation = (data: NotificationData) => {
    console.log('📢 Bildirim işleniyor:', data);

    switch (data.type) {
      case 'match_registration_open':
        if (data.matchId) {
          navigate('matchRegistration', { matchId: data.matchId });
        }
        break;

      case 'match_starting_soon':
        if (data.matchId) {
          navigate('matchDetail', { matchId: data.matchId });
        }
        break;

      case 'team_building_ready':
        if (data.matchId) {
          navigate('teamBuilding', { matchId: data.matchId });
        }
        break;

      case 'score_updated':
        if (data.matchId) {
          navigate('matchDetail', { matchId: data.matchId });
        }
        break;

      case 'new_fixture_created':
        if (data.fixtureId) {
          navigate('fixtureDetail', { fixtureId: data.fixtureId });
        }
        break;

      case 'league_invitation':
        if (data.leagueId) {
          navigate('leagueDetail', { leagueId: data.leagueId });
        }
        break;

      case 'payment_reminder':
        if (data.matchId) {
          navigate('paymentTracking', { matchId: data.matchId });
        }
        break;

      case 'match_cancelled':
        if (data.matchId) {
          alert('Maç İptal Edildi: ' + (data.body || 'Kayıtlı olduğunuz maç iptal edildi.'));
          navigate('Home');
        }
        break;

      default:
        console.warn('⚠️ Bilinmeyen bildirim tipi:', data.type);
        navigate('home');
    }
  };

  useEffect(() => {
    // 1️⃣ FOREGROUND - Uygulama açıkken gelen bildirimler
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log('📱 Foreground bildirim:', notification);
        
        const data = notification.request.content.data as NotificationData;
        if (data && data.type) {
          // İsterseniz burada in-app alert gösterebilirsiniz
          // handleNotificationNavigation(data);
        }
      }
    );

    // 2️⃣ BACKGROUND/QUIT - Bildirime tıklandığında
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('🔔 Bildirim tıklandı:', response);
        
        const data = response.notification.request.content.data as NotificationData;
        if (data && data.type) {
          handleNotificationNavigation(data);
        }
      }
    );

    // 3️⃣ APP AÇILDIĞINDA - Son tıklanan bildirimi kontrol et
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          console.log('🚀 App açıldı bildirimden:', response);
          
          const data = response.notification.request.content.data as NotificationData;
          if (data && data.type) {
            // Biraz gecikme ekle (navigation hazır olsun)
            setTimeout(() => {
              handleNotificationNavigation(data);
            }, 1000);
          }
        }
      });

    // Cleanup (Expo 54+ için güncellenmiş)
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [navigate]);
};

// 🔧 Expo Push Token Yönetimi
export const ExpoNotificationService = {
  // Push Token al
  async getExpoPushToken(): Promise<string | null> {
    try {
      // Fiziksel cihaz kontrolü
      if (!Device.isDevice) {
        console.warn('⚠️ Bildirimler sadece fiziksel cihazlarda çalışır');
        return null;
      }

      // Bildirim izni iste
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Bildirim izni verilmedi');
        return null;
      }

      // Push token al (Expo 54+ için projectId gerekli değil)
      const tokenData = await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
      console.log('✅ Expo Push Token alındı:', token);

      // Android için bildirim kanalı oluştur
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Varsayılan',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
        });

        // Maç bildirimleri kanalı
        await Notifications.setNotificationChannelAsync('match_notifications', {
          name: 'Maç Bildirimleri',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      return token;
    } catch (error) {
      console.error('❌ Push token alma hatası:', error);
      return null;
    }
  },

  // Token'ı backend'e kaydet
  async saveTokenToBackend(playerId: string, token: string) {
    try {
      console.log('💾 Token backend\'e kaydediliyor:', { playerId, token });
      
      // deviceService kullanarak kaydedin
      // await deviceService.add({
      //   playerId,
      //   deviceId: token,
      //   platform: Platform.OS,
      //   deviceName: await Device.deviceName || 'Unknown Device',
      //   isActive: true
      // });
      
      return true;
    } catch (error) {
      console.error('❌ Token kaydetme hatası:', error);
      return false;
    }
  },

  // Local bildirim gönder (Test için)
  async sendLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Hemen gönder
      });
      console.log('✅ Local bildirim gönderildi');
    } catch (error) {
      console.error('❌ Local bildirim hatası:', error);
    }
  },

  // Zamanlanmış bildirim (örn: maç 1 saat önce)
  async scheduleNotification(
    title: string,
    body: string,
    triggerDate: Date,
    data?: NotificationData
  ) {
    try {
      const triggerSeconds = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
      
      if (triggerSeconds <= 0) {
        console.warn('⚠️ Bildirim zamanı geçmiş');
        return null;
      }

      // Expo 54 için trigger objesi
      const trigger: any = {
        seconds: triggerSeconds,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger,
      });

      console.log('✅ Bildirim zamanlandı:', id);
      return id;
    } catch (error) {
      console.error('❌ Bildirim zamanlama hatası:', error);
      return null;
    }
  },

  // Tüm zamanlanmış bildirimleri iptal et
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Tüm zamanlanmış bildirimler iptal edildi');
    } catch (error) {
      console.error('❌ Bildirim iptal hatası:', error);
    }
  },

  // Belirli bir bildirimi iptal et
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('🗑️ Bildirim iptal edildi:', notificationId);
    } catch (error) {
      console.error('❌ Bildirim iptal hatası:', error);
    }
  },

  // Badge sayısını ayarla (iOS)
  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Badge ayarlama hatası:', error);
    }
  },

  // Badge'i sıfırla
  async clearBadge() {
    await this.setBadgeCount(0);
  },

  // Bildirim ayarlarını aç
  async openNotificationSettings() {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('❌ Ayarlar açma hatası:', error);
    }
  },
};