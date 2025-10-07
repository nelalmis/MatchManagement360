import React from 'react';
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

const Stack = createNativeStackNavigator();

const MainLayout = ({ children }: any) => (
  <View style={styles.container}>
    <View style={styles.content}>{children}</View>
    <BottomMenu />
  </View>
);

export default function AppRouter() {
  const { user } = useAppContext();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="home" options={{ headerShown: false }}>
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
        <Stack.Screen name="login" component={LoginScreen} />
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
