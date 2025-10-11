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

### 🏆 League (4 ekran + 4 component) ✅
- **LeagueListScreen** - Tüm ligleri listele ✅
- **LeagueDetailScreen** - Lig detayları, fikstürler, puan durumu ✅
- **CreateLeagueScreen** - Yeni lig oluştur ✅
- **EditLeagueScreen** - Lig düzenle ✅
- Components:
  - LeagueCard
  - LeagueHeader
  - SeasonSelector
  - PlayersList

### 📅 Fixture (4 ekran + 3 component) ✅
- **FixtureListScreen** - Fikstür listesi ✅
- **FixtureDetailScreen** - Fikstür detayları ve maçlar ✅
- **CreateFixtureScreen** - Yeni fikstür oluştur ✅
- **EditFixtureScreen** - Fikstür düzenle ✅
- Components:
  - FixtureCard
  - FixtureCalendar
  - PeriodicSettings

### ⚽ Match (8 ekran + 7 component) ✅
- **MatchListScreen** - Maç listesi ✅
- **MatchDetailScreen** - Maç detayları ✅
- **MatchRegistrationScreen** - Maça kayıt ol ✅
- **TeamBuildingScreen** - Takım kur (Organizatör) ✅
- **ScoreEntryScreen** - Final skor gir (Organizatör) ✅
- **GoalAssistEntryScreen** - Gol/Asist gir + Organizatör Onayı ✅
- **PlayerRatingScreen** - Oyuncu puanlama + Otomatik MVP ✅
- **PaymentTrackingScreen** - Ödeme takibi + Maç Tamamlama ✅
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
    ↓ (Maç bittikten sonra)
    ↓
GoalAssistEntryScreen (Kendi gol/asist gir)
    ↓
PlayerRatingScreen (Diğer oyuncuları puanla)
```

### 🎮 Match Flow (Organizatör)
```
MatchDetailScreen
    ↓
TeamBuildingScreen (Takımları kur)
    ↓ (Maç oynanır)
    ↓
ScoreEntryScreen (Final skor gir)
    ↓
GoalAssistEntryScreen (Gol/asist onayları)
    ↓
PlayerRatingScreen (MVP otomatik hesaplanır)
    ↓
PaymentTrackingScreen (Ödeme takibi + Final onay)
    ↓ (Tüm ödemeler tamamlandı)
    ↓
Maç Tamamlandı → Puan Durumu Güncellendi ✅
```

### 📊 Detaylı Match Skor Sistemi
```
1. Maç Oynanır
   ↓
2. ScoreEntryScreen (Organizatör)
   - Final skor girilir: 3-2
   - Maç durumu: "Skor Onay Bekliyor"
   ↓
3. GoalAssistEntryScreen (Tüm Oyuncular + Organizatör)
   - Oyuncular kendi gol/asistlerini girer
   - Örnek: "Ahmet: 2 gol, 1 asist"
   - Organizatör her girişi onaylar/reddeder ✅
   ↓
4. PlayerRatingScreen (Maçta Oynayan Oyuncular)
   - Her oyuncu takım arkadaşlarını puanlar (1-5 yıldız)
   - Sistem ortalama puanları otomatik hesaplar
   - En yüksek puan alan MVP olur ✅
   - Maç durumu: "Ödeme Bekliyor"
   ↓
5. PaymentTrackingScreen (Organizatör)
   - Oyuncuların ödemelerini takip eder
   - Ödemeleri tek tek veya toplu onaylar
   - "Maçı Tamamla" butonu ile final onay ✅
   ↓
6. Match Status: "Tamamlandı" 🎉
   - Standings (Puan Durumu) güncellenir
   - PlayerStats güncellenir
   - PlayerRatingProfile güncellenir
   - MVP kaydedilir
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

## 🚀 Geliştirme Sırası

### Phase 1: Core Screens (MVP) ✅
1. ✅ HomeScreen
2. ✅ LeagueListScreen
3. ✅ LeagueDetailScreen
4. ✅ MatchListScreen
5. ✅ MatchDetailScreen
6. ✅ MatchRegistrationScreen

### Phase 2: Management Screens ✅
7. ✅ CreateLeagueScreen
8. ✅ CreateFixtureScreen
9. ✅ TeamBuildingScreen
10. ✅ EditLeagueScreen
11. ✅ EditFixtureScreen
12. ✅ FixtureListScreen
13. ✅ FixtureDetailScreen

### Phase 3: Match Scoring System ✅
14. ✅ ScoreEntryScreen (Organizatör - Final skor)
15. ✅ GoalAssistEntryScreen (Oyuncular + Organizatör onayı)
16. ✅ PlayerRatingScreen (Oyuncular - Puanlama + Otomatik MVP)
17. ✅ PaymentTrackingScreen (Organizatör - Ödeme + Final onay)

### Phase 4: Statistics & Profile 🔄
18. StandingsScreen
19. PlayerProfileScreen
20. PlayerStatsScreen
21. TopScorersScreen
22. TopAssistsScreen
23. MVPScreen

### Phase 5: Settings & Extras
24. SettingsScreen
25. EditProfileScreen
26. MyMatchesScreen
27. NotificationSettingsScreen

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

// Geri giderken parametre gönder
goBack({ updated: true, _refresh: Date.now() });
```

---

## 🎯 Match Scoring System - Detaylı Açıklama

### 1. ScoreEntryScreen (Organizatör) ✅
**Amaç**: Maç final skorunu girmek
- Sadece organizatör erişebilir
- Basit skor girişi: Takım 1 vs Takım 2
- +/- butonlar ile hızlı giriş
- Kaydedilince maç durumu "Skor Onay Bekliyor" olur

### 2. GoalAssistEntryScreen (Oyuncular + Organizatör) ✅
**Amaç**: Gol/Asist girişi ve onay sistemi
- **Oyuncular**: Kendi performanslarını girerler
- **Organizatör**: Her girişi onaylar veya reddeder
- "Tümünü Onayla" ile toplu onay
- Doğrulama: Takım skorundan fazla gol girilemez

**Özellikler**:
- Self-reporting sistemi
- Modal ile kolay giriş (+/- butonlar)
- Organizatör moderasyonu
- Onaylı/Bekleyen durumları

### 3. PlayerRatingScreen (Oyuncular) ✅
**Amaç**: Takım arkadaşlarını puanlama ve otomatik MVP
- Sadece maçta oynayan oyuncular puanlayabilir
- 1-5 yıldız arası interaktif puanlama
- Tüm oyuncular puanlanmalı (zorunlu)
- Sistem otomatik MVP hesaplar

**MVP Belirleme**:
```
MVP = En Yüksek Ortalama Puana Sahip Oyuncu
Örnek:
- Ahmet: 4.5 ⭐ (10 oyuncu puanladı)
- Mehmet: 4.8 ⭐ (10 oyuncu puanladı) → MVP 🏆
- Ali: 4.2 ⭐ (10 oyuncu puanladı)
```

**Özet Bilgiler**:
- İlerleme çubuğu (Kaç oyuncu puanlandı)
- Mevcut MVP önizlemesi
- Ortalama verilen puan
- Kategori ortalamaları (isteğe bağlı)

### 4. PaymentTrackingScreen (Organizatör) ✅
**Amaç**: Ödeme takibi ve maç tamamlama
- Ödeme durumu listesi (Ödendi/Bekliyor)
- IBAN bilgilerini görüntüleme ve kopyalama
- Ödeme bilgilerini paylaşma (WhatsApp/SMS)
- Tek tık veya toplu ödeme onayı
- "Maçı Tamamla" butonu (tüm ödemeler onaylandıktan sonra)

**Özellikler**:
- İlerleme çubuğu ve istatistikler
- Toplam/Toplanan/Bekleyen tutarlar
- Oyuncu bazlı ödeme durumu
- Tamamlama onayı

---

## 🗄️ Database Collections

### Yeni Koleksiyonlar:

1. **match_ratings** - Maç bazlı oyuncu puanlamaları
   ```typescript
   {
     matchId: string,
     raterId: string,
     ratedPlayerId: string,
     rating: number (1-5),
     categories?: { skill, teamwork, sportsmanship, effort },
     comment?: string,
     isAnonymous: boolean,
     createdAt: string
   }
   ```

2. **match_comments** - Maç yorumları
   ```typescript
   {
     matchId: string,
     playerId: string,
     comment: string,
     type: 'general' | 'highlight' | 'improvement',
     isApproved: boolean,
     likes?: string[],
     createdAt: string
   }
   ```

3. **player_rating_profiles** - Oyuncu genel rating profili
   ```typescript
   {
     playerId: string,
     leagueId: string,
     seasonId: string,
     overallRating: number,
     totalRatingsReceived: number,
     mvpCount: number,
     ratingTrend: 'improving' | 'stable' | 'declining',
     lastFiveRatings: number[],
     categoryAverages?: {},
     lastUpdated: string
   }
   ```

---

## 📊 Güncellenmiş İstatistikler

**Toplam**: 31 ekran + 27 component = **58 dosya**

**İlerleme**: 
- ✅ Tamamlanan: 19 ekran (61%)
- 🔄 Devam Eden: 0 ekran  
- ⏳ Bekleyen: 12 ekran (39%)

**Match Modülü**: 8/8 ekran tamamlandı! 🎉

---

## 🎯 Sıradaki Adımlar
