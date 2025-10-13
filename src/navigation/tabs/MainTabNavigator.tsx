// navigation/tabs/MainTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Home, Trophy, Calendar, User, BarChart3 } from 'lucide-react-native';
import { MainTabParamList } from '../types';
import { HomeStack } from '../stacks/HomeStack';
import { LeagueStack } from '../stacks/LeagueStack';
import { FixtureStack } from '../stacks/FixtureStack';
import { MyMatchesStack } from '../stacks/MyMatchesStack';
import { ProfileStack } from '../stacks/ProfileStack';
import { StandingsStack } from '../stacks/StandingsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MODAL_SCREENS = [
  'createLeague',
  'editLeague',
  'createFixture',
  'editFixture',
  'editProfile',
];

const getTabBarStyle = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? '';
  
  if (MODAL_SCREENS.includes(routeName)) {
    return { display: 'none' as const };
  }
  
  return {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  };
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({ route }) => ({
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            
            if (currentRoute.name === 'HomeTab') {
              const tabState = currentRoute.state;
              if (tabState && tabState.index > 0) {
                e.preventDefault();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'HomeTab' }],
                });
              }
            }
          },
        })}
      />

      <Tab.Screen
        name="LeaguesTab"
        component={LeagueStack}
        options={({ route }) => ({
          tabBarLabel: 'Ligler',
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} strokeWidth={2} />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            if (currentRoute.name === 'LeaguesTab') {
              e.preventDefault();
              // Önce LeagueList'e navigate et
              navigation.navigate('LeaguesTab', { screen: 'leagueList' });
              // Sonra stack'i sıfırla
              setTimeout(() => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'LeaguesTab',
                      state: {
                        index: 0,
                        routes: [{ name: 'leagueList' }],
                      },
                    },
                  ],
                });
              }, 0);
            }
          },
        })}
      />

      {/* <Tab.Screen
        name="FixturesTab"
        component={FixtureStack}
        options={{
          tabBarLabel: 'Maçlarım',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} strokeWidth={2} />
          ),
          tabBarStyle: getTabBarStyle({}),
        }}
      /> */}

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={({ route }) => ({
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={2} />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            
            if (currentRoute.name === 'ProfileTab') {
              const tabState = currentRoute.state;
              if (tabState && tabState.index > 0) {
                e.preventDefault();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ProfileTab' }],
                });
              }
            }
          },
        })}
      />

      {/* <Tab.Screen
        name="StandingsTab"
        component={StandingsStack}
        options={({ route }) => ({
          tabBarLabel: 'İstatistikler',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} strokeWidth={2} />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];
            
            if (currentRoute.name === 'StandingsTab') {
              const tabState = currentRoute.state;
              if (tabState && tabState.index > 0) {
                e.preventDefault();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'StandingsTab' }],
                });
              }
            }
          },
        })}
      /> */}
    </Tab.Navigator>
  );
};