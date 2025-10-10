import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Header } from '../components/Header';
import { SideMenu } from '../components/SideMenu';
import { BottomNav } from '../components/BottomNav';
import { useNavigationContext } from '../context/NavigationContext';
import { isProfileComplete } from '../helper/helper';

// ============================================
// AUTH SCREENS
// ============================================
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { PhoneVerificationScreen } from '../screens/Auth/PhoneVerificationScreen';

// ============================================
// HOME SCREENS
// ============================================
import { HomeScreen } from '../screens/Home/HomeScreen';

// ============================================
// LEAGUE SCREENS
// ============================================
import { LeagueListScreen } from '../screens/League/LeagueListScreen';
import { VerificationSuccessScreen } from '../screens/Auth/VerificationSuccessScreen';
// import { LeagueDetailScreen } from '../screens/League/LeagueDetailScreen';
// import { CreateLeagueScreen } from '../screens/League/CreateLeagueScreen';
// import { EditLeagueScreen } from '../screens/League/EditLeagueScreen';

// ============================================
// FIXTURE SCREENS
// ============================================
// import { FixtureListScreen } from '../screens/Fixture/FixtureListScreen';
// import { FixtureDetailScreen } from '../screens/Fixture/FixtureDetailScreen';
// import { CreateFixtureScreen } from '../screens/Fixture/CreateFixtureScreen';
// import { EditFixtureScreen } from '../screens/Fixture/EditFixtureScreen';

// ============================================
// MATCH SCREENS
// ============================================
// import { MatchListScreen } from '../screens/Match/MatchListScreen';
// import { MatchDetailScreen } from '../screens/Match/MatchDetailScreen';
// import { MatchRegistrationScreen } from '../screens/Match/MatchRegistrationScreen';
// import { TeamBuildingScreen } from '../screens/Match/TeamBuildingScreen';
// import { ScoreEntryScreen } from '../screens/Match/ScoreEntryScreen';
// import { PaymentTrackingScreen } from '../screens/Match/PaymentTrackingScreen';

// ============================================
// STANDINGS SCREENS
// ============================================
// import { StandingsScreen } from '../screens/Standings/StandingsScreen';
// import { TopScorersScreen } from '../screens/Standings/TopScorersScreen';
// import { TopAssistsScreen } from '../screens/Standings/TopAssistsScreen';
// import { MVPScreen } from '../screens/Standings/MVPScreen';

// ============================================
// PLAYER SCREENS
// ============================================
// import { PlayerProfileScreen } from '../screens/Player/PlayerProfileScreen';
// import { EditProfileScreen } from '../screens/Player/EditProfileScreen';
// import { PlayerStatsScreen } from '../screens/Player/PlayerStatsScreen';
// import { MyMatchesScreen } from '../screens/Player/MyMatchesScreen';

// ============================================
// SETTINGS SCREENS
// ============================================
// import { SettingsScreen } from '../screens/Settings/SettingsScreen';
// import { NotificationSettingsScreen } from '../screens/Settings/NotificationSettingsScreen';

const Stack = createNativeStackNavigator();

// ============================================
// LAYOUT COMPONENTS
// ============================================

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

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SafeAreaView style={styles.authSafeArea}>
      {children}
    </SafeAreaView>
  );
};

// ============================================
// MAIN ROUTER
// ============================================

export default function AppRouter() {
  const { user, isVerified } = useAppContext();
  const navigation = useNavigationContext();

  const isAuthenticated = user && isVerified && isProfileComplete(user);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? 'home' : 'login'}
    >
      {isAuthenticated ? (
        <>
          {/* ============================================ */}
          {/* HOME SCREENS */}
          {/* ============================================ */}
          <Stack.Screen name="home">
            {() => (
              <MainLayout headerTitle="Ana Sayfa">
                <HomeScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          {/* ============================================ */}
          {/* LEAGUE SCREENS */}
          {/* ============================================ */}

          <Stack.Screen name="leagueList">
            {() => (
              <MainLayout headerTitle="Liglerim">
                <LeagueListScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          {/*
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

          <Stack.Screen name="createLeague">
            {() => (
              <MainLayout
                headerTitle="Lig Oluştur"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <CreateLeagueScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="editLeague">
            {() => (
              <MainLayout
                headerTitle="Lig Düzenle"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <EditLeagueScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          */}

          {/* ============================================ */}
          {/* FIXTURE SCREENS */}
          {/* ============================================ */}
          {/* 
          <Stack.Screen name="fixtureList">
            {() => (
              <MainLayout
                headerTitle="Fikstürler"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <FixtureListScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="fixtureDetail">
            {() => (
              <MainLayout
                headerTitle="Fikstür Detayı"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <FixtureDetailScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="createFixture">
            {() => (
              <MainLayout
                headerTitle="Fikstür Oluştur"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <CreateFixtureScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="editFixture">
            {() => (
              <MainLayout
                headerTitle="Fikstür Düzenle"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <EditFixtureScreen />
              </MainLayout>
            )}
          </Stack.Screen>
            */}
          {/* ============================================ */}
          {/* MATCH SCREENS */}
          {/* ============================================ */}
          {/*
          <Stack.Screen name="matchList">
            {() => (
              <MainLayout headerTitle="Maçlar">
                <MatchListScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="matchDetail">
            {() => (
              <MainLayout
                headerTitle="Maç Detayı"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <MatchDetailScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="matchRegistration">
            {() => (
              <MainLayout
                headerTitle="Maça Kayıt"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <MatchRegistrationScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="teamBuilding">
            {() => (
              <MainLayout
                headerTitle="Takım Kur"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <TeamBuildingScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="scoreEntry">
            {() => (
              <MainLayout
                headerTitle="Skor Gir"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <ScoreEntryScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="paymentTracking">
            {() => (
              <MainLayout
                headerTitle="Ödeme Takibi"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <PaymentTrackingScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          */}
          {/* ============================================ */}
          {/* STANDINGS SCREENS */}
          {/* ============================================ */}
          {/* 
          <Stack.Screen name="standings">
            {() => (
              <MainLayout
                headerTitle="Puan Durumu"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <StandingsScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="topScorers">
            {() => (
              <MainLayout
                headerTitle="Gol Krallığı"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <TopScorersScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="topAssists">
            {() => (
              <MainLayout
                headerTitle="Asist Krallığı"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <TopAssistsScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="mvp">
            {() => (
              <MainLayout
                headerTitle="MVP"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <MVPScreen />
              </MainLayout>
            )}
          </Stack.Screen>
            */}
          {/* ============================================ */}
          {/* PLAYER SCREENS */}
          {/* ============================================ */}
          {/*
          <Stack.Screen name="playerProfile">
            {() => (
              <MainLayout headerTitle="Profilim">
                <PlayerProfileScreen />
              </MainLayout>
            )}
          </Stack.Screen>

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

          <Stack.Screen name="playerStats">
            {() => (
              <MainLayout
                headerTitle="İstatistiklerim"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <PlayerStatsScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="myMatches">
            {() => (
              <MainLayout
                headerTitle="Maçlarım"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <MyMatchesScreen />
              </MainLayout>
            )}
          </Stack.Screen>
            */}
          {/* ============================================ */}
          {/* SETTINGS SCREENS */}
          {/* ============================================ */}
          {/* 
          <Stack.Screen name="settings">
            {() => (
              <MainLayout
                headerTitle="Ayarlar"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
              >
                <SettingsScreen />
              </MainLayout>
            )}
          </Stack.Screen>

          <Stack.Screen name="notificationSettings">
            {() => (
              <MainLayout
                headerTitle="Bildirim Ayarları"
                headerLeftIcon="back"
                onLeftPress={() => navigation.goBack()}
                showBottomNav={false}
              >
                <NotificationSettingsScreen />
              </MainLayout>
            )}
          </Stack.Screen>
          */}
        </>
      ) : (
        <>
          {/* ============================================ */}
          {/* AUTH SCREENS */}
          {/* ============================================ */}
          <Stack.Screen name="login">
            {() => (
              <AuthLayout>
                <LoginScreen />
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

          <Stack.Screen name="phoneVerification">
            {() => (
              <AuthLayout>
                <PhoneVerificationScreen />
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
        </>
      )}
    </Stack.Navigator>
  );
}

// ============================================
// STYLES
// ============================================

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