// src/navigation/index.ts

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';

import { LoadingScreen } from '../screens';
import { navigationRef } from './NavigationService';
import { AuthStack } from './stacks/AuthStack';
import MainStack from './stacks/MainStack';
import { isProfileComplete } from '../helper/helper';
import { SideMenu } from '../components/SideMenu';

const Stack = createNativeStackNavigator();

export function RootNavigatorV3() {
  const { isVerified, user } = useAppContext();
  const isAuthenticated = user && isVerified && isProfileComplete(user);

  if (user === undefined) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isVerified ? (
            <Stack.Screen name="auth" component={AuthStack} />
          ) : (
            <Stack.Screen name="main" component={MainStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && <SideMenu />}
    </>
  );
}
