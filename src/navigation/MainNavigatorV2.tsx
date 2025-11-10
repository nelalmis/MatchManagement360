// src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, CalendarDays, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBar } from '../context/TabBarContext';
import { SideMenu } from '../components/SideMenu';

// ============================================
// SCREENS IMPORTS
// ============================================

// Home
import { CreateInvitationScreen, HomeScreen, JoinWithCodeScreen, LeagueSettingsScreen, ManageLeagueMembersScreen, PlayerPaymentScreen } from '../screens';

// League
import { LeagueListScreen } from '../screens';
import { LeagueDetailScreen } from '../screens';
import { CreateLeagueScreen } from '../screens';
import { EditLeagueScreen } from '../screens';

// Fixture
import { FixtureListScreen } from '../screens';
import { FixtureDetailScreen } from '../screens';
import { CreateFixtureScreen } from '../screens';
import { EditFixtureScreen } from '../screens';

// Match
import { MatchListScreen } from '../screens';
import { MatchDetailScreen } from '../screens';
import { CreateFriendlyMatchScreen } from '../screens';
import { ManageInvitationsScreen } from '../screens';
import { EditMatchScreen } from '../screens';
import { EditFriendlyMatchTemplateScreen } from '../screens';
import { MatchRegistrationScreen } from '../screens';
import { TeamBuildingScreen } from '../screens';
import { ScoreEntryScreen } from '../screens';
import { GoalAssistEntryScreen } from '../screens';
import { PlayerRatingScreen } from '../screens';
import { PaymentTrackingScreen } from '../screens';
import { MyMatchesScreen } from '../screens';

// Standings
import { StandingsScreen } from '../screens';
import { TopScorersScreen } from '../screens';
import { TopAssistsScreen } from '../screens';
import { MVPScreen } from '../screens';

// Player
import { PlayerProfileScreen } from '../screens';
import { EditProfileScreen } from '../screens';
import { PlayerStatsScreen } from '../screens';
import { SelectPositionsScreen } from '../screens';

// Settings
import { SettingsScreen } from '../screens';
import { NotificationSettingsScreen } from '../screens';
import { SettingsStack } from './SettingsStack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============================================
// TAB STACKS (aynı)
// ============================================

const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="homeScreen" component={HomeScreen} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="joinWithCode" component={JoinWithCodeScreen} />
        </Stack.Group>
    </Stack.Navigator>
);

const MyMatchesStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="myMatches" component={MyMatchesScreen} />
        <Stack.Screen name="matchDetail" component={MatchDetailScreen} />
        <Stack.Screen name="matchRegistration" component={MatchRegistrationScreen} />
        <Stack.Screen name="teamBuilding" component={TeamBuildingScreen} />
        <Stack.Screen name="scoreEntry" component={ScoreEntryScreen} />
        <Stack.Screen name="goalAssistEntry" component={GoalAssistEntryScreen} />
        <Stack.Screen name="playerRating" component={PlayerRatingScreen} />
        <Stack.Screen name="paymentTracking" component={PaymentTrackingScreen} />
        <Stack.Screen name="playerPayment" component={PlayerPaymentScreen} />
    </Stack.Navigator>
);

const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="playerProfile" component={PlayerProfileScreen} />
        <Stack.Screen name="editProfile" component={EditProfileScreen} />
        <Stack.Screen name="playerStats" component={PlayerStatsScreen} />
        <Stack.Screen name="settings" component={SettingsScreen} />
        <Stack.Screen name="notificationSettings" component={NotificationSettingsScreen} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="selectPositions" component={SelectPositionsScreen} />
        </Stack.Group>
    </Stack.Navigator>
);

// ============================================
// LEAGUE STACK (Tab için gizli - no tab bar label)
// ============================================

const LeagueStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="leagueList" component={LeagueListScreen} />
        <Stack.Screen name="leagueDetail" component={LeagueDetailScreen} />
        <Stack.Screen name="createLeague" component={CreateLeagueScreen} />
        <Stack.Screen name="editLeague" component={EditLeagueScreen} />
        <Stack.Screen name="leagueSettings" component={LeagueSettingsScreen} />
        <Stack.Screen name="manageLeagueMembers" component={ManageLeagueMembersScreen} />
        
        {/* Fixture */}
        <Stack.Screen name="fixtureList" component={FixtureListScreen} />
        <Stack.Screen name="fixtureDetail" component={FixtureDetailScreen} />
        <Stack.Screen name="createFixture" component={CreateFixtureScreen} />
        <Stack.Screen name="editFixture" component={EditFixtureScreen} />
        
        {/* Stats */}
        <Stack.Screen name="standings" component={StandingsScreen} />
        <Stack.Screen name="topScorers" component={TopScorersScreen} />
        <Stack.Screen name="topAssists" component={TopAssistsScreen} />
        <Stack.Screen name="mvp" component={MVPScreen} />
        
        {/* Modals */}
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="manageInvitations" component={ManageInvitationsScreen} />
            <Stack.Screen name="createInvitation" component={CreateInvitationScreen} />
            <Stack.Screen name="joinWithCode" component={JoinWithCodeScreen} />
        </Stack.Group>
    </Stack.Navigator>
);

// ============================================
// MATCH STACK (Tab için gizli)
// ============================================

const MatchStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="matchList" component={MatchListScreen} />
        <Stack.Screen name="matchDetail" component={MatchDetailScreen} />
        <Stack.Screen name="createFriendlyMatch" component={CreateFriendlyMatchScreen} />
        <Stack.Screen name="editMatch" component={EditMatchScreen} />
        <Stack.Screen name="editFriendlyMatchTemplate" component={EditFriendlyMatchTemplateScreen} />
        
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="manageInvitations" component={ManageInvitationsScreen} />
            <Stack.Screen name="createInvitation" component={CreateInvitationScreen} />
            <Stack.Screen name="joinWithCode" component={JoinWithCodeScreen} />
        </Stack.Group>
    </Stack.Navigator>
);

// ============================================
// MAIN TAB NAVIGATOR (Tüm stack'leri içerir)
// ============================================

export const MainNavigatorV2: React.FC = () => {
    const { isTabBarVisible } = useTabBar();
    const insets = useSafeAreaInsets();
    
    return (
        <>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarActiveTintColor: '#16a34a',
                    tabBarInactiveTintColor: '#9CA3AF',
                    tabBarStyle: {
                        display: isTabBarVisible ? 'flex' : 'none',
                        backgroundColor: 'white',
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                        paddingTop: 8,
                        height: insets.bottom > 0 ? 55 + insets.bottom : 55,
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 4,
                    },
                    tabBarIcon: ({ focused, color, size }) => {
                        let IconComponent;

                        switch (route.name) {
                            case 'homeTab':
                                IconComponent = Home;
                                break;
                            case 'matchesTab':
                                IconComponent = CalendarDays;
                                break;
                            case 'profileTab':
                                IconComponent = User;
                                break;
                            default:
                                return null;
                        }

                        return (
                            <IconComponent
                                size={size}
                                color={color}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        );
                    },
                })}
            >
                {/* ✅ Görünen Tab'lar */}
                <Tab.Screen
                    name="homeTab"
                    component={HomeStack}
                    options={{ tabBarLabel: 'Ana Sayfa' }}
                />
                <Tab.Screen
                    name="matchesTab"
                    component={MyMatchesStack}
                    options={{ tabBarLabel: 'Maçlarım' }}
                />
                <Tab.Screen
                    name="profileTab"
                    component={ProfileStack}
                    options={{ tabBarLabel: 'Profilim' }}
                />

                {/* ✅ Gizli Stack'ler (Tab bar'da görünmez ama tab bar var) */}
                <Tab.Screen
                    name="leagueFlow"
                    component={LeagueStack}
                    options={{
                        tabBarButton: () => null, // ← Tab bar'da buton görünmez
                        tabBarStyle: { display: 'none' }, // ← Bu stack aktifken tab gizli
                    }}
                />
                <Tab.Screen
                    name="matchFlow"
                    component={MatchStack}
                    options={{
                        tabBarButton: () => null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                 <Tab.Screen
                    name="settingsFlow"
                    component={SettingsStack}
                    options={{
                        tabBarButton: () => null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
            </Tab.Navigator>

            {/* Global Side Menu */}
            <SideMenu />
        </>
    );
};