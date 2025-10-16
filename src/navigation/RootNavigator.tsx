// src/navigation/RootNavigatorV3.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import { LoadingScreen } from '../screens';
import { navigationRef } from './NavigationService';
import { linking } from './linking';
import { AuthStack } from './AuthStack';
import { isProfileComplete } from '../helper/helper';
import { SideMenu } from '../components/SideMenu';
import { MainNavigator } from './MainNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isVerified, user } = useAppContext();
  const isAuthenticated = user && isVerified && isProfileComplete(user);

  if (user === undefined) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationContainer 
        ref={navigationRef}
        linking={linking as any}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="auth" component={AuthStack} />
          ) : (
            <Stack.Screen name="main" component={MainNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && <SideMenu />}
    </>
  );
}