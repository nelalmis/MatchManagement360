import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Header } from '../components/Header';
import { SideMenu } from '../components/SideMenu';
import { BottomNav } from '../components/BottomNav';
import { useNavigationContext } from '../context/NavigationContext';

// Screens
import { HomeScreen } from '../screens/Main/HomeScreen';
import { InvitesScreen } from '../screens/Main/InvitesScreen';
import { VerificationSuccessScreen } from '../screens/Auth/VerificationSuccessScreen';
import { VerificationScreen } from '../screens/Auth/VerificationScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { isProfileComplete } from '../helper/helper';
import { MyFixturesScreen } from '../screens/Fixture/MyFixturesScreen';
import { MyProfileScreen } from '../screens/Profile/MyProfileScreen';
import { MyLeaguesScreen } from '../screens/League/MyLeaguesScreen';
import { CreateLeagueScreen } from '../screens/League/CreateLeagueScreen';
import { LeagueDetailScreen } from '../screens/League/LeagueDetailScreen';
import { EditProfileScreen } from '../screens/Profile/EditProfileScreen';

const Stack = createNativeStackNavigator();

// MainLayout Wrapper - Header + SideMenu + BottomNav ile
interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
  headerTitle?: string;
  headerLeftIcon?: 'users' | 'back' | 'none';
  onLeftPress?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showHeader = true,
  showBottomNav = true,
  headerTitle,
  headerLeftIcon = 'users',
  onLeftPress,
}) => {
  const { menuOpen, setMenuOpen, headerTitle: contextHeaderTitle } = useNavigationContext();

  const onCloseSideMenu = () => {
    setMenuOpen(false);
  };

  const finalHeaderTitle = headerTitle || contextHeaderTitle || 'Maç Yönetimi';

  return (
    <SafeAreaView style={styles.safeArea}>
      {showHeader && (
        <Header
          title={finalHeaderTitle}
          leftIcon={headerLeftIcon}
          onLeftPress={onLeftPress}
          rightIcon="menu"
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
      )}

      <SideMenu isOpen={menuOpen} onClose={onCloseSideMenu} />

      <View style={styles.mainContent}>
        {children}
      </View>

      {showBottomNav && <BottomNav />}
    </SafeAreaView>
  );
};

// Auth Layout - Header/BottomNav olmadan
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SafeAreaView style={styles.authSafeArea}>
      {children}
    </SafeAreaView>
  );
};

export default function AppRouter() {
  const { user, isVerified } = useAppContext();
  const navigation = useNavigationContext();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user && isVerified && isProfileComplete(user) ? 'home' : 'login'}
    >
      {user && isVerified && isProfileComplete(user) ? (
        <>
          {/* Ana Sayfa */}
          <Stack.Screen name="home">
            {() => (
              <MainLayout headerTitle="Ana Sayfa">
                <HomeScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          {/* Maçlarım */}
          <Stack.Screen name="myFixtures">
            {() => (
              <MainLayout headerTitle="Fikstürlerim">
                <MyFixturesScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          {/* Davetler */}
          <Stack.Screen name="invites">
            {() => (
              <MainLayout headerTitle="Davetler">
                <InvitesScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          {/* Profilim */}
          <Stack.Screen name="profile">
            {() => (
              <MainLayout headerTitle="Profilim">
                <MyProfileScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          {/* Maç Detay - Geri butonu ile */}
          {/* <Stack.Screen name="matchDetail">
            {() => (
              <MainLayout
                headerTitle="Maç Detayı"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <MatchDetailScreenV2 />
              </MainLayout>
            )}
          </Stack.Screen> */}
          <Stack.Screen name="myLeagues">
            {() => (
              <MainLayout
                headerTitle="Liglerim"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <MyLeaguesScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="createLeague">
            {() => (
              <MainLayout
                headerTitle="Lig Oluştur"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <CreateLeagueScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          <Stack.Screen name="leagueDetail">
            {() => (
              <MainLayout
                headerTitle="Lig Detayı"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <LeagueDetailScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          {/* Maç Oluştur */}
          {/* <Stack.Screen name="createMatch">
            {() => (
              <MainLayout
                headerTitle="Maç Oluştur"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <CreateMatchOrganizationScreen />
              </MainLayout>
            )}
          </Stack.Screen> */}

          {/* Profili Düzenle - Geri butonu ile, BottomNav olmadan */}
          <Stack.Screen name="editProfile">
            {() => (
              <MainLayout
                headerTitle="Profili Düzenle"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <EditProfileScreen />
              </MainLayout>
            )}
          </Stack.Screen>
        </>
      ) : (
        <>
          {/* Auth Ekranları - Layout olmadan */}
          <Stack.Screen name="login">
            {() => (
              <AuthLayout>
                <LoginScreen />
              </AuthLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="verification">
            {() => (
              <AuthLayout>
                <VerificationScreen />
              </AuthLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="verificationSuccess">
            {() => (
              <AuthLayout>
                <VerificationSuccessScreen />
              </AuthLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="register">
            {() => (
              <AuthLayout>
                <RegisterScreen />
              </AuthLayout>
            )}
          </Stack.Screen>
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  authSafeArea: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});