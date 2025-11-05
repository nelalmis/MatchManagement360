// src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    Home,
    Trophy,
    CalendarDays,
    BarChart3,
    User,
} from 'lucide-react-native';

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
// import { JoinLeagueScreen } from '../screens';
// import { ManageLeagueInvitationsScreen } from '../screens';
// import { CreateLeagueInvitationScreen } from '../screens';
// Fixture
import { FixtureListScreen } from '../screens';
import { FixtureDetailScreen } from '../screens';
import { CreateFixtureScreen } from '../screens';
import { EditFixtureScreen } from '../screens';

// Match
import { MatchListScreen } from '../screens';
import { MatchDetailScreen } from '../screens';
import { CreateFriendlyMatchScreen } from '../screens';
// import { FriendlyMatchInvitationsScreen } from '../screens';
import { ManageInvitationsScreen } from '../screens';
import { EditMatchScreen } from '../screens';
// import { FriendlyMatchTemplatesScreen } from '../screens';
// import { CreateFriendlyMatchTemplateScreen } from '../../screens/Match/CreateFriendlyMatchTemplateScreen';
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

// Components
import { CustomHeader } from '../components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============================================
// TAB STACKS
// ============================================

// 🏠 HOME STACK (Header ✅, SideMenu ✅)
const HomeStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="homeScreen"
                component={HomeScreen}
                options={({ navigation }) => {
                    // Navigation state değiştiğinde yeni instance oluştur
                    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

                    useFocusEffect(
                        React.useCallback(() => {
                            forceUpdate();
                        }, [])
                    );

                    return {
                        header: () => (
                            <CustomHeader
                                title="Ana Sayfa"
                                showMenu
                                showNotifications
                            />
                        ),
                    };
                }}
            />
            {/* Modal Screens Group */}
            <Stack.Group
                screenOptions={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            >
                <Stack.Screen
                    name="joinWithCode"
                    component={JoinWithCodeScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Group>
        </Stack.Navigator>
    );
};

// 🏆 LEAGUES STACK (Header ✅, SideMenu ✅)
const LeaguesStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="leagueList"
                component={LeagueListScreen}
                options={{
                    header: () => <CustomHeader title="Ligler" showMenu showNotifications />,
                }}
            />
            <Stack.Screen
                name="leagueDetail"
                component={LeagueDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="createLeague"
                component={CreateLeagueScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="editLeague"
                component={EditLeagueScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="fixtureList"
                component={FixtureListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="fixtureDetail"
                component={FixtureDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="createFixture"
                component={CreateFixtureScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="editFixture"
                component={EditFixtureScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="leagueSettings"
                component={LeagueSettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="manageLeagueMembers"
                component={ManageLeagueMembersScreen}
                options={{ headerShown: false }}
            />

            {/* Modal Screens Group */}
            <Stack.Group
                screenOptions={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            >
                <Stack.Screen
                    name="manageInvitations"
                    component={ManageInvitationsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="createInvitation"
                    component={CreateInvitationScreen}
                    options={{ headerShown: false }}
                />
                {/* Legacy screens - will be removed */}
                {/* <Stack.Screen
                    name="createLeagueInvitation"
                    component={CreateLeagueInvitationScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                name="joinLeague"
                component={JoinLeagueScreen}
                options={{ headerShown: false }}
                /> */}
                {/* <Stack.Screen
                    name="manageLeagueInvitations"
                    component={ManageLeagueInvitationsScreen}
                    options={{ headerShown: false }}
                /> */}
            </Stack.Group>
        </Stack.Navigator>
    );
};

// 📅 MATCHES STACK (Header ✅, SideMenu ✅)
const MatchesStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="matchList"
                component={MatchListScreen}
                options={{ headerShown: true , header: () => <CustomHeader title="Maçlar" showMenu showNotifications /> }}
            />
            <Stack.Screen
                name="myMatches"
                component={MyMatchesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="matchDetail"
                component={MatchDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="createFriendlyMatch"
                component={CreateFriendlyMatchScreen}
                options={{ headerShown: false }}
            />
            {/* <Stack.Screen
                name="friendlyMatchInvitations"
                component={FriendlyMatchInvitationsScreen}
                options={{ headerShown: false }}
            /> */}

            {/* <Stack.Screen
        name="editFriendlyMatch"
        component={EditFriendlyMatchScreen}
        options={{ headerShown: false }}
      /> */}
            <Stack.Screen
                name="editMatch"
                component={EditMatchScreen}
                options={{ headerShown: false }}
            />
            {/* <Stack.Screen
                name="friendlyMatchTemplates"
                component={FriendlyMatchTemplatesScreen}
                options={{ headerShown: false }}
            /> */}
            {/* <Stack.Screen
        name="createFriendlyMatchTemplate"
        component={CreateFriendlyMatchTemplateScreen}
        options={{ headerShown: false }}
      /> */}
            <Stack.Screen
                name="editFriendlyMatchTemplate"
                component={EditFriendlyMatchTemplateScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="matchRegistration"
                component={MatchRegistrationScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="teamBuilding"
                component={TeamBuildingScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="scoreEntry"
                component={ScoreEntryScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="goalAssistEntry"
                component={GoalAssistEntryScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="playerRating"
                component={PlayerRatingScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="paymentTracking"
                component={PaymentTrackingScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="playerPayment"
                component={PlayerPaymentScreen}
                options={{ headerShown: false }}
            />
            {/* Modal Screens Group */}
            <Stack.Group
                screenOptions={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            >
                <Stack.Screen
                    name="manageInvitations"
                    component={ManageInvitationsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="createInvitation"
                    component={CreateInvitationScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="joinWithCode"
                    component={JoinWithCodeScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Group>


        </Stack.Navigator>
    );
};

// 📊 STATS STACK (Header ✅, SideMenu ✅)
const StatsStack = () => {
    return (
        <Stack.Navigator>

            <Stack.Screen
                name="standings"
                component={StandingsScreen}
                options={{
                    header: () => <CustomHeader title="İstatistikler" showMenu showNotifications />,
                }}
            />
            <Stack.Screen
                name="topScorers"
                component={TopScorersScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="topAssists"
                component={TopAssistsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="mvp"
                component={MVPScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

// 👤 PROFILE STACK (Header ✅, SideMenu ❌)
const ProfileStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="playerStats"
                component={PlayerStatsScreen}
                options={{
                    header: () => <CustomHeader title="Profilim" showNotifications />,
                }}
            />
            <Stack.Screen
                name="playerProfile"
                component={PlayerProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="editProfile"
                component={EditProfileScreen}
                options={{ headerShown: false }}
            />
            
            <Stack.Screen
                name="settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="notificationSettings"
                component={NotificationSettingsScreen}
                options={{ headerShown: false }}
            />
            {/* Modal Screens Group */}
            <Stack.Group
                screenOptions={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            >
               <Stack.Screen
                   name="selectPositions"
                   component={SelectPositionsScreen}
                   options={{ headerShown: false }}
               />
            </Stack.Group>
        </Stack.Navigator>
    );
};

// ============================================
// BOTTOM TAB NAVIGATOR
// ============================================
export const MainNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();
    console.log('Safe Area Insets:', insets.bottom);
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#16a34a',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8, // iOS için dinamik, Android için sabit
                    paddingTop: 8,
                    height: insets.bottom > 0 ? 55 + insets.bottom : 55, // iOS için dinamik yükseklik
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
                        case 'leaguesTab':
                            IconComponent = Trophy;
                            break;
                        case 'matchesTab':
                            IconComponent = CalendarDays;
                            break;
                        case 'statsTab':
                            IconComponent = BarChart3;
                            break;
                        case 'profileTab':
                            IconComponent = User;
                            break;
                        default:
                            IconComponent = Home;
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
            <Tab.Screen
                name="homeTab"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Ana Sayfa',
                }}
            />
            <Tab.Screen
                name="leaguesTab"
                component={LeaguesStack}
                options={{
                    tabBarLabel: 'Ligler',
                }}
            />
            <Tab.Screen
                name="matchesTab"
                component={MatchesStack}
                options={{
                    tabBarLabel: 'Maçlar',
                }}
            />
            <Tab.Screen
                name="statsTab"
                component={StatsStack}
                options={{
                    tabBarLabel: 'İstatistikler',
                }}
            />
            <Tab.Screen
                name="profileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: 'Profilim',
                }}
            />
        </Tab.Navigator>
    );
}