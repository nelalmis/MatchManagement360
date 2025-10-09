import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Header } from '../components/Header';
import { SideMenu } from '../components/SideMenu';
import { BottomNav } from '../components/BottomNav';
import { useNavigationContext } from '../context/NavigationContext';

// Screens
import { HomeScreen } from '../screens/Main/HomeScreen';
import { MatchesScreen } from '../screens/Main/MatchesScreen';
import { InvitationsScreen } from '../screens/Main/InvitationsScreen';
import { ProfileScreen } from '../screens/Main/ProfileScreen';
import { MatchDetailScreen } from '../screens/Main/MatchDetailScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { VerificationScreen } from '../screens/Auth/VerificationScreen';
import { VerificationSuccessScreen } from '../screens/Auth/VerificationSuccessScreen';
import { MyMatchesScreen } from '../screens/Main/MyMatchesScreen';
import { InvitesScreen } from '../screens/Main/InvitesScreen';
import { MyProfileScreen } from '../screens/Main/MyProfileScreen';
import { MatchDetailScreenV2 } from '../screens/Main/MatchDetailScreenV2';
import { CreateMatchScreen } from '../screens/Main/CreateMatchScreen';

const Stack = createNativeStackNavigator();

// MainLayout Wrapper
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { menuOpen, setMenuOpen, headerTitle } = useNavigationContext();

  const onCloseSideMenu = () => {
    setMenuOpen(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header menuOpen={menuOpen} title={headerTitle} setMenuOpen={(open) => setMenuOpen(open)} />
      <SideMenu isOpen={menuOpen} onClose={onCloseSideMenu} />

      <SafeAreaView style={styles.mainContent}>
        {children}
      </SafeAreaView>

      <BottomNav />
    </SafeAreaView>
  );
};

export default function AppRouter() {
  const { user, isVerified } = useAppContext();
  const [initialRoute, setInitialRoute] = useState<'login' | 'home'>('login');

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'none' }}
      initialRouteName={initialRoute}
    >
      {user && isVerified ? (
        <>
          {/* Main Layout ile sarmalanmış ekranlar */}
          <Stack.Screen name="home">
            {() => (
              <MainLayout>
                <HomeScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="matches">
            {() => (
              <MainLayout>
                <MyMatchesScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="invites">
            {() => (
              <MainLayout>
                <InvitesScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="profile">
            {() => (
              <MainLayout>
                <MyProfileScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="matchDetail">
            {() => (
              <MainLayout>
                <MatchDetailScreenV2 />
              </MainLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="createMatch">
            {() => (
              <MainLayout>
                <CreateMatchScreen />
              </MainLayout>
            )}
          </Stack.Screen>
        </>
      ) : (
        <>
          {/* Auth ekranları MainLayout dışı */}
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
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 96, // BottomNav alanı için
  },
});
