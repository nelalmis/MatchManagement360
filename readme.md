# 📱 Screens Klasör Yapısı

## 🗂️ Genel Yapı

```
screens/
├── Auth/                    # Kimlik doğrulama ekranları
├── Home/                    # Ana sayfa
├── League/                  # Lig yönetimi ekranları
├── Fixture/                 # Fikstür yönetimi ekranları
├── Match/                   # Maç yönetimi ekranları
├── Standings/               # Puan durumu ekranları
├── Player/                  # Oyuncu profil ve istatistik ekranları
├── Settings/                # Ayarlar ekranları
└── Common/                  # Ortak component'ler
```

## 📋 Ekran Listesi

### 🔐 Auth (3 ekran)
- **LoginScreen** - Giriş yapma
- **RegisterScreen** - Kayıt olma
- **PhoneVerificationScreen** - Telefon doğrulama

### 🏠 Home (1 ekran + 3 component)
- **HomeScreen** - Ana sayfa / Dashboard
- Components:
  - WelcomeBanner
  - UpcomingMatchCard
  - QuickStats

### 🏆 League (4 ekran + 4 component)
- **LeagueListScreen** - Tüm ligleri listele
- **LeagueDetailScreen** - Lig detayları, fikstürler, puan durumu
- **CreateLeagueScreen** - Yeni lig oluştur
- **EditLeagueScreen** - Lig düzenle
- Components:
  - LeagueCard
  - LeagueHeader
  - SeasonSelector
  - PlayersList

### 📅 Fixture (4 ekran + 3 component)
- **FixtureListScreen** - Fikstür listesi
- **FixtureDetailScreen** - Fikstür detayları ve maçlar
- **CreateFixtureScreen** - Yeni fikstür oluştur
- **EditFixtureScreen** - Fikstür düzenle
- Components:
  - FixtureCard
  - FixtureCalendar
  - PeriodicSettings

### ⚽ Match (6 ekran + 7 component)
- **MatchListScreen** - Maç listesi
- **MatchDetailScreen** - Maç detayları
- **MatchRegistrationScreen** - Maça kayıt ol
- **TeamBuildingScreen** - Takım kur (Organizatör)
- **ScoreEntryScreen** - Skor gir (Organizatör)
- **PaymentTrackingScreen** - Ödeme takibi (Organizatör)
- Components:
  - MatchCard
  - MatchHeader
  - PlayerList
  - TeamFormation
  - ScoreBoard
  - GoalAssistForm
  - PaymentStatus

### 📊 Standings (4 ekran + 3 component)
- **StandingsScreen** - Puan durumu tablosu
- **TopScorersScreen** - Gol krallığı
- **TopAssistsScreen** - Asist krallığı
- **MVPScreen** - MVP listesi
- Components:
  - StandingsTable
  - PlayerStatsCard
  - StatsBadge

### 👤 Player (4 ekran + 5 component)
- **PlayerProfileScreen** - Oyuncu profili
- **EditProfileScreen** - Profil düzenle
- **PlayerStatsScreen** - Oyuncu istatistikleri (Tüm ligler)
- **MyMatchesScreen** - Geçmiş maçlarım
- Components:
  - ProfileHeader
  - StatsOverview
  - SportPositions
  - MatchHistory
  - Achievements

### ⚙️ Settings (2 ekran + 1 component)
- **SettingsScreen** - Ayarlar
- **NotificationSettingsScreen** - Bildirim ayarları
- Components:
  - SettingItem

### 🔧 Common (4 component)
- **LoadingScreen** - Yükleniyor ekranı
- **EmptyState** - Boş durum
- **ErrorScreen** - Hata ekranı
- **ConfirmDialog** - Onay dialogu

---

## 🔄 Ekran Akışları

### 🔐 Authentication Flow
```
LoginScreen 
    ↓
PhoneVerificationScreen 
    ↓
HomeScreen
```

### 🏆 League Management Flow
```
HomeScreen 
    ↓
LeagueListScreen 
    ↓
LeagueDetailScreen
    ├→ FixtureListScreen → FixtureDetailScreen → MatchListScreen
    ├→ StandingsScreen
    └→ EditLeagueScreen
```

### ⚽ Match Flow (Oyuncu)
```
HomeScreen/MatchListScreen
    ↓
MatchDetailScreen
    ↓
MatchRegistrationScreen (Kayıt ol)
```

### 🎮 Match Flow (Organizatör)
```
MatchDetailScreen
    ├→ TeamBuildingScreen (Takım kur)
    ├→ ScoreEntryScreen (Skor gir)
    └→ PaymentTrackingScreen (Ödeme takibi)
```

### 👤 Player Profile Flow
```
HomeScreen
    ↓
PlayerProfileScreen
    ├→ EditProfileScreen
    ├→ PlayerStatsScreen
    └→ MyMatchesScreen
```

---

## 📝 Naming Conventions

1. **Screen Dosyaları**: `ScreenName` + `Screen.tsx`
   - Örnek: `LeagueDetailScreen.tsx`

2. **Component Dosyaları**: `ComponentName.tsx`
   - Örnek: `LeagueCard.tsx`

3. **Index Dosyaları**: Her klasörde `index.ts`
   - Export'ları toplar

4. **Import Kullanımı**:
   ```typescript
   // ✅ Doğru
   import { HomeScreen, LeagueCard } from '@/screens';
   
   // ❌ Yanlış
   import HomeScreen from '@/screens/Home/HomeScreen';
   ```

---

## 🎨 Component Hierarchy

```
Screen
  └── Container
      ├── Header
      ├── Content
      │   ├── Card Components
      │   ├── List Components
      │   └── Form Components
      └── Footer
```

---

## 🚀 Geliştirme Sırası Önerisi

### Phase 1: Core Screens (MVP)
1. ✅ HomeScreen
2. ✅ LeagueListScreen
3. ✅ LeagueDetailScreen
4. ✅ MatchListScreen
5. ✅ MatchDetailScreen
6. ✅ MatchRegistrationScreen

### Phase 2: Management Screens
7. CreateLeagueScreen
8. CreateFixtureScreen
9. TeamBuildingScreen
10. ScoreEntryScreen

### Phase 3: Statistics & Profile
11. StandingsScreen
12. PlayerProfileScreen
13. PlayerStatsScreen
14. TopScorersScreen

### Phase 4: Settings & Extras
15. SettingsScreen
16. PaymentTrackingScreen
17. EditProfileScreen

---

## 📦 Dependencies

Her screen şu yapıları kullanabilir:
- **Types**: `@/types/types.ts`
- **Services**: `@/services/*`
- **Contexts**: `@/contexts/*`
- **Hooks**: `@/hooks/*`
- **Utils**: `@/utils/*`

---

## 💡 Best Practices

1. **Single Responsibility**: Her screen tek bir amaca hizmet etmeli
2. **Reusable Components**: Ortak component'leri `Common/` altında tut
3. **Props Interface**: Her component için interface tanımla
4. **Error Handling**: Her screen'de error state yönet
5. **Loading States**: Her async işlemde loading göster
6. **Empty States**: Veri yoksa anlamlı empty state göster

---

## 🔗 Navigation

Navigation yapısı `NavigationContext` kullanacak:

```typescript
const { navigate } = useNavigation();

// Basit navigasyon
navigate('LeagueDetail');

// Parametre ile
navigate('LeagueDetail', { leagueId: '123' });

// Geri git
goBack();
```

---

**Toplam Ekran Sayısı**: 28 ekran + 27 component = **55 dosya**