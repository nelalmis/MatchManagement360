// screens/Settings/index.ts
export { SettingsScreen } from './SettingsScreen';
export { NotificationSettingsScreen } from './Notifications/NotificationSettingsScreen';
export { EmailNotificationsScreen } from './Notifications/EmailNotificationsScreen';
export { PushNotificationsScreen } from './Notifications/PushNotificationsScreen';
export { SmsNotificationsScreen } from './Notifications/SmsNotificationsScreen';
export { ProfileSettingsScreen } from './ProfileSettings/EditProfileScreen';
export { PrivacySettingsScreen } from './Privacy/PrivacySettingsScreen';
export { SportsPositionsScreen } from './Preferences/SportsPositionsScreen';
export { SkillLevelScreen } from './Preferences/SkillLevelScreen';
export { AvailabilityScreen } from './Preferences/AvailabilityScreen';
export { AppearanceScreen } from './Appearance/AppearanceScreen';
export { ThemeSelectionScreen } from './Appearance/ThemeSelectionScreen';   
export { AccessibilityScreen } from './Accessibility/AccessibilityScreen';
export { CalendarSyncScreen } from './Calendar/CalendarSyncScreen';
export { AboutScreen } from './About/AboutScreen';
export { HelpScreen } from './About/HelpScreen';
export { TermsScreen } from './About/TermsScreen';
export { QuietHoursScreen } from './Notifications/QuietHoursScreen';
export { SecuritySettingsScreen } from './Privacy/SecuritySettingsScreen';
export {GamePreferencesScreen} from './Preferences/GamePreferencesScreen';
export {PaymentPreferencesScreen} from './Preferences/PaymentPreferencesScreen';
// Add more exports as needed


// export * from './components';

/* 

src/screens/Settings/
├── SettingsScreen.tsx                    // Ana settings menüsü 👍
├── ProfileSettings/ 👍
│   ├── ProfileSettingsScreen.tsx         // Profil ayarları   👍
│   └── EditDisplayNameScreen.tsx         // Display name düzenle
├── Notifications/ 👍
│   ├── NotificationSettingsScreen.tsx    // Bildirim ana menüsü 👍
│   ├── EmailNotificationsScreen.tsx      // Email bildirimleri 👍
│   ├── PushNotificationsScreen.tsx       // Push bildirimleri 👍
│   ├── SmsNotificationsScreen.tsx        // SMS bildirimleri 👍
│   ├── InAppNotificationsScreen.tsx      // In-app bildirimleri 👍
│   └── QuietHoursScreen.tsx              // Sessiz saatler 👍
├── Privacy/ 
│   ├── PrivacySettingsScreen.tsx         // Gizlilik ayarları 👍
│   ├── BlockedUsersScreen.tsx            // Engellenmiş kullanıcılar 
|   ├── DataSharingScreen.tsx             // Veri paylaşımı
│   └── SecuritySettingsScreen.tsx        // Güvenlik ayarları 👍
├── Preferences/
│   ├── GamePreferencesScreen.tsx         // Oyun tercihleri ana menü
│   ├── SportsPositionsScreen.tsx         // Spor & pozisyonlar 👍
│   ├── SkillLevelScreen.tsx              // Yetenek seviyesi 👍
│   ├── AvailabilityScreen.tsx            // Müsaitlik 👍
│   ├── LocationPreferencesScreen.tsx     // Konum tercihleri
│   └── PaymentPreferencesScreen.tsx      // Ödeme tercihleri
├── Appearance/
│   ├── AppearanceScreen.tsx              // Görünüm ayarları 👍
│   └── ThemeSelectionScreen.tsx          // Tema seçimi 👍
├── Accessibility/
│   └── AccessibilityScreen.tsx           // Erişilebilirlik 👍
├── Calendar/
│   └── CalendarSyncScreen.tsx            // Takvim senkronizasyonu 👍
├── Social/
│   └── SocialSettingsScreen.tsx          // Sosyal ayarlar 
├── Analytics/ 
│   └── AnalyticsSettingsScreen.tsx       // Analitik ayarları
├── Storage/
│   └── StorageSettingsScreen.tsx         // Depolama ayarları
├── Beta/
│   └── BetaFeaturesScreen.tsx            // Beta özellikler
├── About/
│   ├── AboutScreen.tsx                   // Hakkında 👍
│   ├── HelpScreen.tsx                    // Yardım 👍
│   └── TermsScreen.tsx                   // Şartlar & Gizlilik 👍
└── components/
    ├── SettingsItem.tsx                  // Ayar öğesi component
    ├── SettingsSection.tsx               // Ayar bölümü component
    ├── SettingsToggle.tsx                // Toggle switch component
    ├── SettingsSlider.tsx                // Slider component
    ├── SettingsPicker.tsx                // Picker component
    └── SettingsHeader.tsx                // Header component
*/