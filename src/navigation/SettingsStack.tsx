// src/navigation/SettingsNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Main
import { SettingsScreen } from '../screens/Settings/SettingsScreen';

// Profile
import { ProfileSettingsScreen } from '../screens/Settings/ProfileSettings/EditProfileScreen';
// import { EditDisplayNameScreen } from '../screens/Settings/ProfileSettings/EditDisplayNameScreen';

// Notifications
import { NotificationSettingsScreen } from '../screens/Settings/Notifications/NotificationSettingsScreen';
import { EmailNotificationsScreen } from '../screens/Settings/Notifications/EmailNotificationsScreen';
import { PushNotificationsScreen } from '../screens/Settings/Notifications/PushNotificationsScreen';
import { SmsNotificationsScreen } from '../screens/Settings/Notifications/SmsNotificationsScreen';
import { InAppNotificationsScreen } from '../screens/Settings/Notifications/InAppNotificationsScreen';
import { QuietHoursScreen } from '../screens/Settings/Notifications/QuietHoursScreen';

// Privacy
import { PrivacySettingsScreen } from '../screens/Settings/Privacy/PrivacySettingsScreen';
// import { BlockedUsersScreen } from '../screens/Settings/Privacy/BlockedUsersScreen';
// import { DataSharingScreen } from '../screens/Settings/Privacy/DataSharingScreen';
import { SecuritySettingsScreen } from '../screens/Settings/Privacy/SecuritySettingsScreen';

// Preferences
import { GamePreferencesScreen } from '../screens/Settings/Preferences/GamePreferencesScreen';
import { SportsPositionsScreen } from '../screens/Settings/Preferences/SportsPositionsScreen';
import { SkillLevelScreen } from '../screens/Settings/Preferences/SkillLevelScreen';
import { AvailabilityScreen } from '../screens/Settings/Preferences/AvailabilityScreen';
// import { LocationPreferencesScreen } from '../screens/Settings/Preferences/LocationPreferencesScreen';
import { PaymentPreferencesScreen } from '../screens/Settings/Preferences/PaymentPreferencesScreen';

// Appearance
import { AppearanceScreen } from '../screens/Settings/Appearance/AppearanceScreen';
import { ThemeSelectionScreen } from '../screens/Settings/Appearance/ThemeSelectionScreen';

// Others
import { AccessibilityScreen } from '../screens/Settings/Accessibility/AccessibilityScreen';
import { CalendarSyncScreen } from '../screens/Settings/Calendar/CalendarSyncScreen';
// import { SocialSettingsScreen } from '../screens/Settings/Social/SocialSettingsScreen';
// import { AnalyticsSettingsScreen } from '../screens/Settings/Analytics/AnalyticsSettingsScreen';
// import { StorageSettingsScreen } from '../screens/Settings/Storage/StorageSettingsScreen';
// import { BetaFeaturesScreen } from '../screens/Settings/Beta/BetaFeaturesScreen';

// About
import { AboutScreen } from '../screens/Settings/About/AboutScreen';
import { HelpScreen } from '../screens/Settings/About/HelpScreen';
import { TermsScreen } from '../screens/Settings/About/TermsScreen';

const Stack = createNativeStackNavigator();

export const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#16a34a' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {/* Main */}
      <Stack.Screen
        name="settings"
        component={SettingsScreen}
        options={{headerShown: false}}
      />

      {/* Profile */}
      <Stack.Screen
        name="profileSettings"
        component={ProfileSettingsScreen}
        options={{headerShown: false}}
      />
       {/* <Stack.Screen
        name="editProfile"
        component={EditProfileScreen}
        options={{headerShown: false}}
      /> */}
      {/* <Stack.Screen
        name="EditDisplayName"
        component={EditDisplayNameScreen}
        options={{ title: 'İsim Düzenle' }}
      /> */}

      {/* Notifications */}
      <Stack.Screen
        name="notificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="emailNotifications"
        component={EmailNotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="pushNotifications"
        component={PushNotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="smsNotifications"
        component={SmsNotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="inAppNotifications"
        component={InAppNotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="quietHours"
        component={QuietHoursScreen}
        options={{ headerShown: false }}
      />

      {/* Privacy */}
      <Stack.Screen
        name="privacySettings"
        component={PrivacySettingsScreen}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ title: 'Engellenmiş Kullanıcılar' }}
      />
      <Stack.Screen
        name="DataSharing"
        component={DataSharingScreen}
        options={{ title: 'Veri Paylaşımı' }}
      /> */}
      <Stack.Screen
        name="securitySettings"
        component={SecuritySettingsScreen}
        options={{ headerShown: false }}
      />

      {/* Preferences */}
      <Stack.Screen
        name="gamePreferences"
        component={GamePreferencesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="sportsPositions"
        component={SportsPositionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="skillLevel"
        component={SkillLevelScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="availability"
        component={AvailabilityScreen}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="LocationPreferences"
        component={LocationPreferencesScreen}
        options={{ title: 'Konum Tercihleri' }}
      />*/}
      <Stack.Screen
        name="PaymentPreferences"
        component={PaymentPreferencesScreen}
        options={{ title: 'Ödeme Tercihleri' }}
      /> 

      {/* Appearance */}
      <Stack.Screen
        name="appearance"
        component={AppearanceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="themeSelection"
        component={ThemeSelectionScreen}
        options={{ headerShown: false }}
      />

      {/* Others */}
      <Stack.Screen
        name="accessibility"
        component={AccessibilityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="calendarSync"
        component={CalendarSyncScreen}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="SocialSettings"
        component={SocialSettingsScreen}
        options={{ title: 'Sosyal Ayarlar' }}
      />
      <Stack.Screen
        name="AnalyticsSettings"
        component={AnalyticsSettingsScreen}
        options={{ title: 'Analitik & Performans' }}
      />
      <Stack.Screen
        name="StorageSettings"
        component={StorageSettingsScreen}
        options={{ title: 'Depolama & Veri' }}
      />
      <Stack.Screen
        name="BetaFeatures"
        component={BetaFeaturesScreen}
        options={{ title: 'Beta Özellikler' }}
      /> */}

      {/* About */}
      <Stack.Screen
        name="about"
        component={AboutScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="help"
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="terms"
        component={TermsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};