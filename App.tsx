import React, { useEffect } from "react";
import { Platform } from "react-native";
import { AppProvider, useAppContext } from "./src/context/AppContext";
import AppRouter from './src/navigation/AppRouter';
import { NavigationProvider } from "./src/context/NavigationContext";
import { NavigationContainer } from "@react-navigation/native";
import { 
  useNotificationHandler, 
  ExpoNotificationService 
} from "./src/hooks/useNotificationHandler";
import { deviceService } from "./src/services/deviceService";
import * as Device from "expo-device";
import { getOrCreateDeviceId } from "./src/helper/deviceHelper";

/*
Uygulama İsmi Önerileri:

⚡ "MatchUp" - Her Spor İçin
🏆 "TeamPlay" - Takım Sporları Hub'ı
🎯 "SportSync" - Spor Organizasyon Platformu
🏅 "PlayMate" - Oyun Arkadaşı Bul
*/

// AppContent - Bildirim yönetimi burada
function AppContent() {
  const { user } = useAppContext();
  
  // 🔔 Bildirim handler'ı başlat
  useNotificationHandler({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  });

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user?.id) return;

      try {
        console.log('📱 Bildirimler başlatılıyor...');
        
        // Push token al
        const pushToken = await ExpoNotificationService.getExpoPushToken();
        
        if (pushToken) {
          console.log('✅ Push Token alındı:', pushToken.substring(0, 50) + '...');
          
          // Cihaz bilgilerini al
          const deviceName = Device.deviceName || 'Unknown Device';
          const platform = Platform.OS;

          // Token'ı backend'e kaydet
          const existingDevice = await deviceService.getDeviceByDeviceId(pushToken);

          if (existingDevice) {
            // Mevcut cihazı güncelle
            await deviceService.update(existingDevice.id.toString(), {
              playerId: user.id.toString(),
              lastUsed: new Date().toISOString(),
              isActive: true,
            });
            console.log('✅ Cihaz güncellendi');
          } else {
            // Yeni cihaz ekle
            await deviceService.add({
              id: getOrCreateDeviceId(),
              playerId: user.id.toString(),
              deviceId: pushToken,
              deviceName,
              platform,
              isActive: true,
            });
            console.log('✅ Yeni cihaz eklendi');
          }

          console.log('✅ Device token backend\'e kaydedildi');
        } else {
          console.warn('⚠️ Push token alınamadı');
        }

        // Badge'i sıfırla
        await ExpoNotificationService.clearBadge();
        
      } catch (error) {
        console.error('❌ Notification initialization hatası:', error);
      }
    };

    initializeNotifications();
  }, [user]);

  return <AppRouter />;
}

export default function App() {
  return (
    <NavigationContainer>
      <NavigationProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </NavigationProvider>
    </NavigationContainer>
  );
}