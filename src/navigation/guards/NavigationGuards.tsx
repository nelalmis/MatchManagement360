// src/navigation/guards/NavigationGuards.tsx

import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../NavigationService';

// ============================================
// BASE GUARD INTERFACE
// ============================================

interface GuardProps {
  children: React.ReactNode;
}

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
            onPress: () => NavigationService.navigateToLogin(),
          },
        ]
      );
    }
  }, [user, isVerified, navigation]);

  if (!user || !isVerified) return null;

  return <>{children}</>;
};

// ============================================
// ORGANIZER GUARD
// Sadece organizatörler girebilir
// ============================================

export const OrganizerGuard: React.FC<GuardProps> = ({ children }) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    let userData:any =user;
    // TODO: IPlayer'a isOrganizer field'ı eklenecek
    const isOrganizer = userData?.isOrganizer || userData?.id; // Geçici: tüm kullanıcılar organizatör

    if (!isOrganizer) {
      Alert.alert(
        'Yetki Gerekli',
        'Bu sayfaya erişim için organizatör olmalısınız.',
        [
          {
            text: 'Tamam',
            onPress: () => NavigationService.goBack(),
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
// LEAGUE OWNER GUARD
// Sadece lig sahibi girebilir
// ============================================

interface LeagueOwnerGuardProps extends GuardProps {
  leagueId: string;
  onUnauthorized?: () => void;
}

export const LeagueOwnerGuard: React.FC<LeagueOwnerGuardProps> = ({ 
  children, 
  leagueId,
  onUnauthorized,
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: League'den ownerPlayerId çekip kontrol edilecek
    const checkOwnership = async () => {
      try {
        // const league = await leagueService.getById(leagueId);
        // const isOwner = league.ownerPlayerId === user?.id;
        const isOwner = true; // Geçici: tüm kullanıcılar owner
        
        if (!isOwner) {
          Alert.alert(
            'Yetki Gerekli',
            'Bu işlem için lig sahibi olmalısınız.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  if (onUnauthorized) {
                    onUnauthorized();
                  } else {
                    NavigationService.goBack();
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error checking league ownership:', error);
      }
    };

    if (user && leagueId) {
      checkOwnership();
    }
  }, [user, leagueId, navigation, onUnauthorized]);

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
  onUnauthorized?: () => void;
}

export const MatchOrganizerGuard: React.FC<MatchOrganizerGuardProps> = ({ 
  children, 
  matchId,
  onUnauthorized,
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: Match'ten createdBy/organizerId çekip kontrol edilecek
    const checkOrganizer = async () => {
      try {
        // const match = await matchService.getById(matchId);
        // const isOrganizer = match.createdBy === user?.id;
        const isOrganizer = true; // Geçici: tüm kullanıcılar organizatör
        
        if (!isOrganizer) {
          Alert.alert(
            'Yetki Gerekli',
            'Bu işlem için maç organizatörü olmalısınız.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  if (onUnauthorized) {
                    onUnauthorized();
                  } else {
                    NavigationService.goBack();
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error checking match organizer:', error);
      }
    };

    if (user && matchId) {
      checkOrganizer();
    }
  }, [user, matchId, navigation, onUnauthorized]);

  // TODO: Gerçek yetki kontrolü aktif edilecek
  // if (!isOrganizer) return null;

  return <>{children}</>;
};

// ============================================
// TEAM BUILDING PERMISSION GUARD
// Sadece takım kurma yetkisi olanlar girebilir
// ============================================

interface TeamBuildingGuardProps extends GuardProps {
  matchId: string;
  leagueId?: string;
  onUnauthorized?: () => void;
}

export const TeamBuildingGuard: React.FC<TeamBuildingGuardProps> = ({ 
  children, 
  matchId,
  leagueId,
  onUnauthorized,
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: League/Match'ten teamBuildingPermissions çekip kontrol edilecek
    const checkPermission = async () => {
      try {
        // const match = await matchService.getById(matchId);
        // const hasPermission = match.teamBuildingPermissions?.includes(user?.id);
        const hasPermission = true; // Geçici: tüm kullanıcılar yetkili
        
        if (!hasPermission) {
          Alert.alert(
            'Yetki Gerekli',
            'Bu maçta takım kurma yetkiniz bulunmamaktadır.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  if (onUnauthorized) {
                    onUnauthorized();
                  } else {
                    NavigationService.goBack();
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error checking team building permission:', error);
      }
    };

    if (user && matchId) {
      checkPermission();
    }
  }, [user, matchId, leagueId, navigation, onUnauthorized]);

  // TODO: Gerçek yetki kontrolü aktif edilecek
  // if (!hasPermission) return null;

  return <>{children}</>;
};

// ============================================
// FIXTURE ORGANIZER GUARD
// Sadece fikstür organizatörü girebilir
// ============================================

interface FixtureOrganizerGuardProps extends GuardProps {
  fixtureId: string;
  onUnauthorized?: () => void;
}

export const FixtureOrganizerGuard: React.FC<FixtureOrganizerGuardProps> = ({ 
  children, 
  fixtureId,
  onUnauthorized,
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    // TODO: Fixture'dan organizerId çekip kontrol edilecek
    const checkOrganizer = async () => {
      try {
        // const fixture = await matchFixtureService.getById(fixtureId);
        // const isOrganizer = fixture.organizerId === user?.id;
        const isOrganizer = true; // Geçici: tüm kullanıcılar organizatör
        
        if (!isOrganizer) {
          Alert.alert(
            'Yetki Gerekli',
            'Bu işlem için fikstür organizatörü olmalısınız.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  if (onUnauthorized) {
                    onUnauthorized();
                  } else {
                    NavigationService.goBack();
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error checking fixture organizer:', error);
      }
    };

    if (user && fixtureId) {
      checkOrganizer();
    }
  }, [user, fixtureId, navigation, onUnauthorized]);

  // TODO: Gerçek yetki kontrolü aktif edilecek
  // if (!isOrganizer) return null;

  return <>{children}</>;
};

// ============================================
// PREMIUM MATCH GUARD
// Sadece premium maçlara kayıtlı kullanıcılar girebilir
// ============================================

interface PremiumMatchGuardProps extends GuardProps {
  matchId: string;
  onUnauthorized?: () => void;
}

export const PremiumMatchGuard: React.FC<PremiumMatchGuardProps> = ({ 
  children,
  matchId,
  onUnauthorized,
}) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    const checkPremiumAccess = async () => {
      try {
        // TODO: Match'ten premium bilgisi ve kayıtlı oyuncuları çek
        // const match = await matchService.getById(matchId);
        // const isPremiumMatch = match.isPremium;
        // const isRegistered = match.premiumPlayerIds?.includes(user?.id);
        
        const isPremiumMatch = false; // Geçici: normal maç varsayılıyor
        const isRegistered = true; // Geçici: kayıtlı varsayılıyor
        
        if (isPremiumMatch && !isRegistered) {
          Alert.alert(
            'Premium Maç',
            'Bu maça erişim için premium üye olmalısınız.',
            [
              {
                text: 'Vazgeç',
                style: 'cancel',
                onPress: () => {
                  if (onUnauthorized) {
                    onUnauthorized();
                  } else {
                    NavigationService.goBack();
                  }
                },
              },
              {
                text: 'Premium Ol',
                onPress: () => {
                  // TODO: Navigate to premium upgrade screen
                  NavigationService.goBack();
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('Error checking premium match access:', error);
      }
    };

    if (user && matchId) {
      checkPremiumAccess();
    }
  }, [user, matchId, navigation, onUnauthorized]);

  // TODO: Gerçek premium kontrolü aktif edilecek
  // if (isPremiumMatch && !isRegistered) return null;

  return <>{children}</>;
};

// ============================================
// PREMIUM USER GUARD (Optional - Genel Premium Özellikler İçin)
// Sadece premium kullanıcılar girebilir
// ============================================

export const PremiumUserGuard: React.FC<GuardProps> = ({ children }) => {
  const { user } = useAppContext();
  const navigation = useNavigation();

  useEffect(() => {
    let userData:any =user;
    // TODO: IPlayer'a isPremium field'ı eklenecek
    const isPremium = userData?.isPremium || false;
    
    if (!isPremium) {
      Alert.alert(
        'Premium Özellik',
        'Bu özellik premium kullanıcılara özeldir.',
        [
          {
            text: 'Vazgeç',
            style: 'cancel',
            onPress: () => NavigationService.goBack(),
          },
          {
            text: 'Premium Ol',
            onPress: () => {
              // TODO: Navigate to premium upgrade screen
              NavigationService.goBack();
            },
          },
        ]
      );
    }
  }, [user, navigation]);

  // TODO: isPremium kontrolü aktif edilecek
  // if (!user?.isPremium) return null;

  return <>{children}</>;
};

// ============================================
// GUARD USAGE EXAMPLES
// ============================================

/*
// ============================================
// 1. STACK SCREEN'DE KULLANIM
// ============================================

// MainNavigator.tsx - LeaguesStack
<Stack.Screen name="createLeague">
  {() => (
    <OrganizerGuard>
      <CreateLeagueScreen />
    </OrganizerGuard>
  )}
</Stack.Screen>

<Stack.Screen name="editLeague">
  {(props) => (
    <LeagueOwnerGuard leagueId={props.route.params.leagueId}>
      <EditLeagueScreen />
    </LeagueOwnerGuard>
  )}
</Stack.Screen>

// ============================================
// 2. COMPONENT İÇİNDE KULLANIM
// ============================================

// TeamBuildingScreen.tsx
export const TeamBuildingScreen = () => {
  const route = useRoute<TeamBuildingRouteProp>();
  const { matchId } = route.params;
  
  return (
    <TeamBuildingGuard matchId={matchId}>
      <View style={styles.container}>
        <CustomHeader title="Takım Kurma" showBack />
        {/* Screen content *\/}
      </View>
    </TeamBuildingGuard>
  );
};

// ============================================
// 3. ÇOKLU GUARD KULLANIMI (Nested)
// ============================================

// EditLeagueScreen.tsx
export const EditLeagueScreen = () => {
  const route = useRoute<EditLeagueRouteProp>();
  const { leagueId } = route.params;
  
  return (
    <AuthGuard>
      <OrganizerGuard>
        <LeagueOwnerGuard leagueId={leagueId}>
          <View style={styles.container}>
            {/* Screen content *\/}
          </View>
        </LeagueOwnerGuard>
      </OrganizerGuard>
    </AuthGuard>
  );
};

// ============================================
// 4. CUSTOM UNAUTHORIZED HANDLER
// ============================================

// ScoreEntryScreen.tsx
export const ScoreEntryScreen = () => {
  const route = useRoute<ScoreEntryRouteProp>();
  const { matchId } = route.params;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  return (
    <MatchOrganizerGuard 
      matchId={matchId}
      onUnauthorized={() => {
        // Custom handling
        Alert.alert(
          'Yetki Yok',
          'Bu özelliği kullanmak için premium üye olmalısınız.',
          [
            { text: 'Vazgeç', onPress: () => NavigationService.goBack() },
            { text: 'Premium Ol', onPress: () => setShowUpgradeModal(true) },
          ]
        );
      }}
    >
      <View style={styles.container}>
        {/* Screen content *\/}
      </View>
    </MatchOrganizerGuard>
  );
};

// ============================================
// 5. CONDITIONAL RENDERING
// ============================================

// LeagueDetailScreen.tsx
export const LeagueDetailScreen = () => {
  const { user } = useAppContext();
  const route = useRoute<LeagueDetailRouteProp>();
  const { leagueId } = route.params;
  const [league, setLeague] = useState<ILeague>();
  
  const isOwner = league?.ownerPlayerId === user?.id;
  
  return (
    <View style={styles.container}>
      <CustomHeader 
        title={league?.name || ''} 
        showBack 
        showEdit={isOwner}  // Sadece owner görür
        onEditPress={() => NavigationService.navigateToEditLeague(leagueId)}
      />
      
      {/* Content *\/}
      
      {isOwner && (
        <TouchableOpacity onPress={() => {}}>
          <Text>Ligi Sil (Sadece Owner)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// 6. GUARD KOMBINASYONLARI
// ============================================

// Premium Match Guard - Maç Detayı
<PremiumMatchGuard matchId={matchId}>
  <MatchDetailScreen />
</PremiumMatchGuard>

// Premium User Guard - Genel Özellik
<PremiumUserGuard>
  <AdvancedStatsScreen />
</PremiumUserGuard>

// Premium + Organizer Guard
<PremiumUserGuard>
  <OrganizerGuard>
    <AdvancedLeagueSettingsScreen />
  </OrganizerGuard>
</PremiumUserGuard>

// Match Organizer + Team Building Permission
<MatchOrganizerGuard matchId={matchId}>
  <TeamBuildingGuard matchId={matchId}>
    <TeamBuildingScreen />
  </TeamBuildingGuard>
</MatchOrganizerGuard>

// ============================================
// 7. PREMIUM MATCH KULLANIM ÖRNEKLERİ
// ============================================

// MatchDetailScreen.tsx - Premium maç kontrolü
export const MatchDetailScreen = () => {
  const route = useRoute<MatchDetailRouteProp>();
  const { matchId } = route.params;
  
  return (
    <PremiumMatchGuard matchId={matchId}>
      <View style={styles.container}>
        <CustomHeader title="Maç Detayı" showBack />
        {/* Premium maç içeriği *\/}
      </View>
    </PremiumMatchGuard>
  );
};

// MatchRegistrationScreen.tsx - Premium maça kayıt
export const MatchRegistrationScreen = () => {
  const route = useRoute<MatchRegistrationRouteProp>();
  const { matchId } = route.params;
  
  return (
    <PremiumMatchGuard 
      matchId={matchId}
      onUnauthorized={() => {
        // Custom handling - Premium upgrade modal göster
        Alert.alert(
          'Premium Maç',
          'Bu maça katılmak için premium üyelik gereklidir.',
          [
            { 
              text: 'Vazgeç', 
              onPress: () => NavigationService.goBack() 
            },
            { 
              text: 'Premium Ol', 
              onPress: () => {
                // TODO: Premium upgrade screen'e git
              } 
            },
          ]
        );
      }}
    >
      <View style={styles.container}>
        {/* Registration content *\/}
      </View>
    </PremiumMatchGuard>
  );
};

// TeamBuildingScreen.tsx - Premium maç + Organizatör
export const TeamBuildingScreen = () => {
  const route = useRoute<TeamBuildingRouteProp>();
  const { matchId } = route.params;
  
  return (
    <PremiumMatchGuard matchId={matchId}>
      <MatchOrganizerGuard matchId={matchId}>
        <TeamBuildingGuard matchId={matchId}>
          <View style={styles.container}>
            {/* Team building content *\/}
          </View>
        </TeamBuildingGuard>
      </MatchOrganizerGuard>
    </PremiumMatchGuard>
  );
};

*/