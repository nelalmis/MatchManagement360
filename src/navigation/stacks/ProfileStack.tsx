// navigation/stacks/ProfileStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import {
  PlayerProfileScreen,
  EditProfileScreen,
  SettingsScreen,
  NotificationSettingsScreen,
} from '../../screens';
import { StackHeader } from '../../components/StackHeader';
import { useAppContext } from '../../context/AppContext';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
    const {user} = useAppContext();
    return (
        <Stack.Navigator
            initialRouteName="playerProfile" // ✅ İlk ekrans
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#8B5CF6',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: '700',
                        fontSize: 18,
                    },
                    headerBackTitleVisible: false,
                    animation: 'slide_from_right',
                    gestureEnabled: true,
            }}
        >
            <Stack.Screen
                name="playerProfile"
                component={PlayerProfileScreen}
                options={{
                    title: 'Profilim',
                    header: (props) =>  <StackHeader {...props} showMenuButton />, // ✅
                    
                    headerShown: true, // Tab'da headerShown: false
                }}
            />

            <Stack.Screen
                name="editProfile"
                component={EditProfileScreen}
                options={{
                    title: 'Profil Düzenle',
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    headerShown:false
                }}
            />
            <Stack.Screen
                name="settings"
                component={SettingsScreen}
                options={{
                    title: 'Ayarlar',
                    presentation: 'card',
                    // animation: 'slide_from_bottom',
                                        header: (props) =>  <StackHeader {...props} showMenuButton />, // ✅

                    headerShown:true
                }}
            />
            <Stack.Screen
                name="notificationSettings"
                component={NotificationSettingsScreen}
                options={{
                    title: 'Bildirim Ayarları',
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    headerShown:false
                }}
            />
        </Stack.Navigator>
    );
};

