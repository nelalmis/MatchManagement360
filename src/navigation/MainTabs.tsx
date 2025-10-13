// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Trophy, Calendar, User, BarChart3 } from 'lucide-react-native';

// Screens
import { HomeScreen, LeagueListScreen, MyMatchesScreen, PlayerStatsScreen, PlayerProfileScreen } from '../screens';
import { StackHeader } from '../components/StackHeader';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#16a34a',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            {/* 1. Ana Sayfa */}
            <Tab.Screen
                name="homeTab"
                component={HomeScreen}
                options={{
                    headerShown: true,
                    tabBarLabel: 'Ana Sayfa',
                    tabBarIcon: ({ color, size }) => (
                        <Home size={size} color={color} strokeWidth={2} />
                    ),
                    title: 'Ana Sayfa',
                    header: (props) => (
                        <StackHeader
                            {...props}
                            showMenuButton
                            showNotificationButton
                            onNotification={() => console.log('Notifications')}
                        />
                    ),
                }}
            />

            {/* 2. Liglerim */}
            <Tab.Screen
                name="leaguesTab"
                component={LeagueListScreen}
                options={{
                    tabBarLabel: 'Liglerim',
                    tabBarIcon: ({ color, size }) => (
                        <Trophy size={size} color={color} strokeWidth={2} />
                    ),
                }}
            />

            {/* 3. Maçlarım (En önemli) */}
            <Tab.Screen
                name="matchesTab"
                component={MyMatchesScreen}
                options={{
                    tabBarLabel: 'Maçlarım',
                    tabBarIcon: ({ color, size }) => (
                        <Calendar size={size} color={color} strokeWidth={2} />
                    ),
                    // Badge göster (kayıt açık maç sayısı)
                    tabBarBadge: undefined, // Dinamik olarak set edilecek
                }}
            />

            {/* 4. İstatistikler */}
            <Tab.Screen
                name="statsTab"
                component={PlayerStatsScreen}
                options={{
                    tabBarLabel: 'İstatistikler',
                    tabBarIcon: ({ color, size }) => (
                        <BarChart3 size={size} color={color} strokeWidth={2} />
                    ),
                }}
            />

            {/* 5. Profil */}
            <Tab.Screen
                name="profileTab"
                component={PlayerProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ color, size }) => (
                        <User size={size} color={color} strokeWidth={2} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}