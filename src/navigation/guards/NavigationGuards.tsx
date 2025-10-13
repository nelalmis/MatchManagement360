// ============================================
// NAVIGATION GUARDS
// ============================================
// Ekran erişim yetkisi kontrolleri

import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';

// ============================================
// ORGANIZER GUARD
// Sadece organizatörler girebilir
// ============================================

interface GuardProps {
  children: React.ReactNode;
}

export const OrganizerGuard: React.FC<GuardProps> = ({ children }) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: IPlayer'a isOrganizer field'ı eklenecek
    const isOrganizer = user?.id; // Geçici, tüm kullanıcılar organizatör varsayılıyor
    
    if (!isOrganizer) {
      Alert.alert(
        'Yetki Gerekli',
        'Bu sayfaya erişim için organizatör olmalısınız.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [user, navigation]);

  // TODO: isOrganizer kontrolü aktif edilecek
  // if (!user?.isOrganizer) return null;

  return <>{children}</>;
};

// ============================================
// AUTH GUARD
// Sadece giriş yapmış kullanıcılar girebilir
// ============================================

export const AuthGuard: React.FC<GuardProps> = ({ children }) => {
  const { user, isVerified } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    if (!user || !isVerified) {
      Alert.alert(
        'Giriş Gerekli',
        'Bu sayfaya erişmek için giriş yapmalısınız.',
        [
          {
            text: 'Giriş Yap',
            onPress: () => {
              // @ts-ignore - Navigation type conflict
              navigation.navigate('Auth', { screen: 'login' });
            },
          },
        ]
      );
    }
  }, [user, isVerified, navigation]);

  if (!user || !isVerified) return null;

  return <>{children}</>;
};

// ============================================
// TEAM BUILDING PERMISSION GUARD
// Sadece takım kurma yetkisi olanlar girebilir
// ============================================

interface TeamBuildingGuardProps extends GuardProps {
  leagueId: string;
}

export const TeamBuildingGuard: React.FC<TeamBuildingGuardProps> = ({ 
  children, 
  leagueId 
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: League'den teamBuildingPermissions çekip kontrol edilecek
    const hasPermission = true; // Geçici, tüm kullanıcılar yetkili varsayılıyor
    
    if (!hasPermission) {
      Alert.alert(
        'Yetki Gerekli',
        'Bu ligde takım kurma yetkiniz bulunmamaktadır.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [user, leagueId, navigation]);

  // TODO: Gerçek yetki kontrolü aktif edilecek
  // if (!hasPermission) return null;

  return <>{children}</>;
};

// ============================================
// LEAGUE OWNER GUARD
// Sadece lig sahibi girebilir
// ============================================

interface LeagueOwnerGuardProps extends GuardProps {
  leagueId: string;
}

export const LeagueOwnerGuard: React.FC<LeagueOwnerGuardProps> = ({ 
  children, 
  leagueId 
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: League'den ownerPlayerId çekip kontrol edilecek
    const isOwner = true; // Geçici, tüm kullanıcılar owner varsayılıyor
    
    if (!isOwner) {
      Alert.alert(
        'Yetki Gerekli',
        'Bu işlem için lig sahibi olmalısınız.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [user, leagueId, navigation]);

  // TODO: Gerçek yetki kontrolü aktif edilecek
  // if (!isOwner) return null;

  return <>{children}</>;
};

// ============================================
// MATCH ORGANIZER GUARD
// Sadece maç organizatörü girebilir
// ============================================

interface MatchOrganizerGuardProps extends GuardProps {
  matchId: string;
}

export const MatchOrganizerGuard: React.FC<MatchOrganizerGuardProps> = ({ 
  children, 
  matchId 
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: Match'ten organizerId çekip kontrol edilecek
    const isOrganizer = true; // Geçici, tüm kullanıcılar organizatör varsayılıyor
    
    if (!isOrganizer) {
      Alert.alert(
        'Yetki Gerekli',
        'Bu işlem için maç organizatörü olmalısınız.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [user, matchId, navigation]);

  // TODO: Gerçek yetki kontrolü aktif edilecek
  // if (!isOrganizer) return null;

  return <>{children}</>;
};

// ============================================
// GUARD USAGE EXAMPLES
// ============================================

/*
// 1. Stack Screen'de kullanım:
<Stack.Screen name="createLeague">
  {() => (
    <OrganizerGuard>
      <CreateLeagueScreen />
    </OrganizerGuard>
  )}
</Stack.Screen>

// 2. Component içinde kullanım:
export const TeamBuildingScreen = () => {
  const route = useRoute();
  const { matchId } = route.params;
  
  return (
    <MatchOrganizerGuard matchId={matchId}>
      <View>
        // Screen content
      </View>
    </MatchOrganizerGuard>
  );
};

// 3. Çoklu guard kullanımı:
<AuthGuard>
  <OrganizerGuard>
    <LeagueOwnerGuard leagueId={leagueId}>
      <EditLeagueScreen />
    </LeagueOwnerGuard>
  </OrganizerGuard>
</AuthGuard>
*/