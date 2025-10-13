// ✅ YENİ: Modal açma (3 yöntem)

  // Yöntem 1: Navigation hook ile
  const handleMatchPressV1 = (matchId: string) => {
    navigation.navigate('matchDetail', { matchId });
  };

  // Yöntem 2: NavigationService ile (component dışından da çalışır)
  const handleMatchPressV2 = (matchId: string) => {
    NavigationService.navigate('matchDetail', { matchId });
  };

  // Yöntem 3: Helper method ile
  const handleMatchPressV3 = (matchId: string) => {
    NavigationService.navigateToMatch(matchId);
  };

  // ✅ YENİ: Modal açmak için root navigation
  const navigation = useRootNavigation();
  const route = useRoute<FixtureDetailRouteProp>();

  const { fixtureId } = route.params;



  // 1. NavigationContext'i kaldır
// ❌ import { useNavigationContext } from '../context/NavigationContext';

// 2. Yeni hook'ları ekle
// ✅ import { useLeagueNavigation } from '../../navigation';
// ✅ import { useRoute, RouteProp } from '@react-navigation/native';
// ✅ import { LeagueStackParamList } from '../../navigation/types';



// ❌ ESKİ:
const navigation = useNavigationContext();

// ✅ YENİ (Ekrana göre):
const navigation = useLeagueNavigation();    // League screens
const navigation = useFixtureNavigation();   // Fixture screens
const navigation = useProfileNavigation();   // Profile screens
const navigation = useRootNavigation();      // Modal açmak için


// ❌ ESKİ:
const { leagueId } = route.params;

// ✅ YENİ (Type-safe):
type MyRouteProp = RouteProp<LeagueStackParamList, 'leagueDetail'>;
const route = useRoute<MyRouteProp>();
const { leagueId } = route.params; // ✅ TypeScript artık type-safe!


// 1. CustomHeader ile (Drawer button otomatik eklenir)
import { CustomHeader } from '../../components/CustomHeader';

<CustomHeader title="Ekran Başlığı" />

// 2. Manuel drawer açma
import { useState } from 'react';
import { DrawerContent } from '../../navigation/DrawerNavigator';

const [drawerVisible, setDrawerVisible] = useState(false);

// Drawer button
<TouchableOpacity onPress={() => setDrawerVisible(true)}>
  <Menu size={24} />
</TouchableOpacity>

// Drawer modal
<Modal visible={drawerVisible}>
  <DrawerContent onClose={() => setDrawerVisible(false)} />
</Modal>