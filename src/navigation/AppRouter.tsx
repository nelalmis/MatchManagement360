import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { BottomMenu } from '../components/BottomMenu';

// Screens
import { HomeScreen } from '../screens/Main/HomeScreen';
import { MatchesScreen } from '../screens/Main/MatchesScreen';
import { InvitationsScreen } from '../screens/Main/InvitationsScreen';
import { ProfileScreen } from '../screens/Main/ProfileScreen';
import { MatchDetailScreen } from '../screens/Main/MatchDetailScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { VerificationScreen } from '../screens/Auth/VerificationScreen';
import { VerificationSuccessScreen } from '../screens/Auth/VerificationSuccessScreen';

const Stack = createNativeStackNavigator();

const MainLayout = ({ children }: any) => (
  <View style={styles.container}>
    <View style={styles.content}>{children}</View>
    <BottomMenu />
  </View>
);

export default function AppRouter() {
  const { user, isVerified } = useAppContext();
  const [initialRoute, setInitialRoute] = useState<'login' | 'home'>('login');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none'
      }}
      initialRouteName={initialRoute}
    >
      {user && isVerified ? (
        <>
          <Stack.Screen name="home"
            options={{
              headerShown: false,
              //animation: 'fade',              // Fade in/out
              // animation: 'slide_from_right', // Sağdan sola (default)
              // animation: 'slide_from_left',  // Soldan sağa
              // animation: 'slide_from_bottom', // Alttan yukarı
              // animation: 'none',             // Animasyon yok
            }}>
            {() => <MainLayout><HomeScreen /></MainLayout>}
          </Stack.Screen>

          <Stack.Screen name="matches">
            {() => <MainLayout><MatchesScreen /></MainLayout>}
          </Stack.Screen>

          <Stack.Screen name="invitations">
            {() => <MainLayout><InvitationsScreen /></MainLayout>}
          </Stack.Screen>

          <Stack.Screen name="profile">
            {() => <MainLayout><ProfileScreen /></MainLayout>}
          </Stack.Screen>

          <Stack.Screen name="matchDetail" component={MatchDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="login" component={LoginScreen} />
          <Stack.Screen name="verification" component={VerificationScreen} />
          <Stack.Screen
            name="verificationSuccess"
            component={VerificationSuccessScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});
