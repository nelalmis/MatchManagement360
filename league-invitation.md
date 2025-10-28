# League Invitation System - Navigation Integration

## 📱 Ekranların Kullanım Yerleri

### 1. **CreateInvitationScreen** - Davet Kodu Oluşturma

#### Nerede Kullanılır?
**LeagueDetailScreen** içinden açılır:

```typescript
// LeagueDetailScreen.tsx içinde

import { NavigationService } from '../../navigation/NavigationService';

// Admin için buton
{isAdmin && (
  <TouchableOpacity 
    style={styles.inviteButton}
    onPress={() => NavigationService.navigate('CreateInvitation', {
      leagueId: league.id,
      leagueTitle: league.title,
    })}
  >
    <Plus size={20} color="white" />
    <Text style={styles.inviteButtonText}>Davet Kodu Oluştur</Text>
  </TouchableOpacity>
)}
```

#### Kullanım Akışı
```
LeagueDetailScreen
  └─> "Davet Kodu Oluştur" butonu (Sadece Admin)
      └─> CreateInvitationScreen
          ├─> Form doldur
          ├─> Kod oluştur
          └─> Başarı → Paylaş/Kopyala
```

---

### 2. **JoinLeagueScreen** - Kod ile Liga Katılma

#### Nerede Kullanılır?

**A) Ana Ekrandan (Home/Dashboard)**
```typescript
// HomeScreen.tsx veya DashboardScreen.tsx

<TouchableOpacity 
  style={styles.joinLeagueCard}
  onPress={() => NavigationService.navigate('JoinLeague')}
>
  <UserPlus size={24} color="#16a34a" />
  <Text style={styles.cardTitle}>Lige Katıl</Text>
  <Text style={styles.cardDesc}>Davet kodu ile katıl</Text>
</TouchableOpacity>
```

**B) Deep Link ile Otomatik**
```typescript
// App.tsx - Deep linking configuration

const linking = {
  prefixes: ['matchmanagement360://'],
  config: {
    screens: {
      JoinLeague: {
        path: 'join-league/:code',
        parse: {
          code: (code: string) => code.toUpperCase(),
        },
      },
    },
  },
};

// Kullanım:
// matchmanagement360://join-league/ABC123XY
// → Otomatik JoinLeagueScreen açılır ve kod doğrulanır
```

**C) QR Code Scanner ile**
```typescript
// QRScannerScreen.tsx

const handleQRScan = (data: string) => {
  // QR'dan kod okundu
  if (data.includes('join-league/')) {
    const code = data.split('/').pop();
    NavigationService.navigate('JoinLeague', { initialCode: code });
  }
};
```

#### Kullanım Akışı
```
1. Manuel Giriş:
   HomeScreen → "Lige Katıl" → JoinLeagueScreen → Kod Gir → Doğrula → Katıl

2. Deep Link:
   WhatsApp/SMS Link → App Açılır → JoinLeagueScreen (kod hazır) → Doğrula → Katıl

3. QR Code:
   QR Scanner → Kod Oku → JoinLeagueScreen → Doğrula → Katıl
```

---

### 3. **ManageInvitationsScreen** - Davet Kodlarını Yönetme

#### Nerede Kullanılır?
**LeagueDetailScreen** veya **LeagueSettingsScreen** içinden:

```typescript
// LeagueDetailScreen.tsx - Admin Menüsü

{isAdmin && (
  <View style={styles.adminSection}>
    <TouchableOpacity 
      style={styles.adminMenuItem}
      onPress={() => NavigationService.navigate('ManageInvitations', {
        leagueId: league.id,
        leagueTitle: league.title,
      })}
    >
      <Share2 size={20} color="#6B7280" />
      <Text style={styles.menuItemText}>Davet Kodlarını Yönet</Text>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  </View>
)}
```

#### Kullanım Akışı
```
LeagueDetailScreen (Admin)
  └─> "Davet Kodlarını Yönet"
      └─> ManageInvitationsScreen
          ├─> Kodları listele
          ├─> Aktif/Pasif yap
          ├─> Paylaş
          ├─> Sil
          └─> "+" → CreateInvitationScreen
```

---

## 🗺️ Navigation Stack Structure

```typescript
// navigation/AppNavigator.tsx

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateInvitationScreen } from '../screens/league/CreateInvitationScreen';
import { JoinLeagueScreen } from '../screens/league/JoinLeagueScreen';
import { ManageInvitationsScreen } from '../screens/league/ManageInvitationsScreen';

export type RootStackParamList = {
  // ... diğer ekranlar
  
  // League Invitation Screens
  CreateInvitation: {
    leagueId: string;
    leagueTitle: string;
  };
  JoinLeague: {
    initialCode?: string;
  };
  ManageInvitations: {
    leagueId: string;
    leagueTitle: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator>
      {/* ... diğer ekranlar */}
      
      <Stack.Screen 
        name="CreateInvitation" 
        component={CreateInvitationScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="JoinLeague" 
        component={JoinLeagueScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="ManageInvitations" 
        component={ManageInvitationsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
```

---

## 🎨 UI/UX Entegrasyonu

### HomeScreen / Dashboard Entegrasyonu

```typescript
// HomeScreen.tsx

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Merhaba, {user?.name}!</Text>
        <Text style={styles.heroSubtitle}>Ligine katıl veya yeni lig oluştur</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {/* Lige Katıl Card */}
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => NavigationService.navigate('JoinLeague')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
            <UserPlus size={28} color="#16a34a" strokeWidth={2} />
          </View>
          <Text style={styles.actionTitle}>Lige Katıl</Text>
          <Text style={styles.actionDesc}>Davet kodu ile hemen katıl</Text>
        </TouchableOpacity>

        {/* Lig Oluştur Card */}
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => NavigationService.navigate('CreateLeague')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Plus size={28} color="#2563eb" strokeWidth={2} />
          </View>
          <Text style={styles.actionTitle}>Lig Oluştur</Text>
          <Text style={styles.actionDesc}>Kendi ligini başlat</Text>
        </TouchableOpacity>
      </View>

      {/* Ligilerim */}
      <MyLeaguesList />
    </ScrollView>
  );
};
```

### LeagueDetailScreen Entegrasyonu

```typescript
// LeagueDetailScreen.tsx

export const LeagueDetailScreen: React.FC<Props> = ({ route }) => {
  const { leagueId } = route.params;
  const { user } = useAuth();
  const [league, setLeague] = useState<ILeague | null>(null);
  
  const isAdmin = league?.members.admins.includes(user?.id || '');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LeagueHeader league={league} />

      {/* Admin Actions */}
      {isAdmin && (
        <View style={styles.adminPanel}>
          <Text style={styles.sectionTitle}>Yönetim</Text>
          
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => NavigationService.navigate('CreateInvitation', {
              leagueId: league.id!,
              leagueTitle: league.title,
            })}
          >
            <Plus size={20} color="white" />
            <Text style={styles.adminButtonText}>Davet Kodu Oluştur</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminMenuItem}
            onPress={() => NavigationService.navigate('ManageInvitations', {
              leagueId: league.id!,
              leagueTitle: league.title,
            })}
          >
            <Share2 size={20} color="#6B7280" />
            <Text style={styles.menuText}>Davet Kodlarını Yönet</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeInvitesCount}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats & Members */}
      <LeagueStats league={league} />
      <MembersList league={league} />
    </ScrollView>
  );
};
```

---

## 🔗 Deep Linking Kurulumu

### 1. App.tsx Configuration

```typescript
// App.tsx

import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './navigation/AppNavigator';

const linking = {
  prefixes: [
    'matchmanagement360://',
    'https://matchmanagement360.app',
  ],
  config: {
    screens: {
      // League Invitation Deep Links
      JoinLeague: {
        path: 'join-league/:code',
        parse: {
          code: (code: string) => code.toUpperCase(),
        },
      },
      LeagueDetail: 'league/:leagueId',
      // ... diğer screens
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

### 2. Android Manifest (android/app/src/main/AndroidManifest.xml)

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="matchmanagement360" />
</intent-filter>
```

### 3. iOS Info.plist (ios/YourApp/Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>matchmanagement360</string>
    </array>
  </dict>
</array>
```

---

## 📊 Kullanım Senaryoları

### Senaryo 1: Yeni Kullanıcı Davet Edildi
```
1. Admin → ManageInvitationsScreen → "+" → CreateInvitationScreen
2. Admin → Kod oluştur → Paylaş (WhatsApp)
3. Yeni Kullanıcı → WhatsApp linki tıklar
4. App açılır → JoinLeagueScreen (kod otomatik dolu)
5. "Lige Katıl" → Başarılı → LeagueDetailScreen
```

### Senaryo 2: Sezon Başı Toplu Davet
```
1. Admin → ManageInvitationsScreen
2. "Yeni Davet Kodu" → CreateInvitationScreen
3. Açıklama: "2024-2025 Sezon Başı"
4. Max: 100 kullanım, 14 gün geçerli
5. Kod oluştur → WhatsApp grubunda paylaş
6. 100 kişi aynı kod ile katılabilir
```

### Senaryo 3: QR Code ile Katılım
```
1. Admin → Davet kodu oluştur
2. QR kod generate et (3rd party tool)
3. Halı saha girişine QR kodu as
4. Kullanıcı → QR okut
5. App açılır → JoinLeagueScreen
6. Otomatik doğrula → Katıl
```

---

## 🎯 Kullanıcı Rolleri ve Erişim

### Admin Kullanıcı
- ✅ CreateInvitationScreen - Yeni kod oluşturabilir
- ✅ ManageInvitationsScreen - Tüm kodları görebilir
- ✅ Kodları aktif/pasif yapabilir
- ✅ Kodları silebilir
- ✅ İstatistikleri görebilir

### Normal Üye
- ✅ JoinLeagueScreen - Başka liglere katılabilir
- ❌ CreateInvitationScreen - Erişemez
- ❌ ManageInvitationsScreen - Erişemez

### Yeni Kullanıcı (Kayıtlı değil)
- ✅ JoinLeagueScreen - Davet kodu ile katılabilir
- ⚠️ Önce kayıt olması gerekebilir (business logic'e göre)

---

## 💡 Ek Öneriler

### 1. Tab Bar Entegrasyonu
```typescript
// Bottom Tab Navigator'a ekle
<Tab.Screen 
  name="JoinLeague"
  component={JoinLeagueScreen}
  options={{
    tabBarLabel: 'Katıl',
    tabBarIcon: ({ color }) => <UserPlus size={24} color={color} />,
  }}
/>
```

### 2. Notification Integration
```typescript
// Push notification geldiğinde
const handleNotification = (notification) => {
  if (notification.type === 'LEAGUE_INVITATION') {
    NavigationService.navigate('JoinLeague', {
      initialCode: notification.data.code,
    });
  }
};
```

### 3. Share Sheet Enhancement
```typescript
// Native share ile daha iyi görünüm
const shareInvitation = async (invitation) => {
  await Share.share({
    title: 'Lig Daveti',
    message: `${league.title} ligine davet edildin!\n\nDavet Kodu: ${invitation.code}\n\nLinke tıkla: ${invitation.inviteLink}`,
    url: invitation.inviteLink,
  });
};
```

---

## 🎉 Sonuç

Bu ekranlar şu yerlerde kullanılıyor:

1. **CreateInvitationScreen**: LeagueDetailScreen → Admin Menüsü
2. **JoinLeagueScreen**: HomeScreen + Deep Links + QR Scanner
3. **ManageInvitationsScreen**: LeagueDetailScreen → Admin Menüsü

Hepsi birbirini tamamlayan bir **invitation flow** oluşturuyor! 🚀