# 🎯 Optimal Navigation Yapısı

## 🏗️ Mimari Özet

```
RootNavigator
├── Auth Stack (Login, Register, Verify)
└── Main (BottomTab - ALWAYS VISIBLE)
    ├── 🏠 Home Tab
    ├── 🏆 Leagues Tab
    ├── 📅 Matches Tab
    ├── 📊 Stats Tab
    └── 👤 Profile Tab
```

---

## 📱 5 Ana Tab (Bottom Navigation)

### 1. 🏠 **Home Tab**
**Ana Ekran:** `homeScreen`
- **Header:** ✅ CustomHeader (Menu + Notifications)
- **SideMenu:** ✅ Açılır

**Gösterilen:**
- Son maçlar
- Yaklaşan maçlar
- Hızlı aksiyonlar
- Bildirimler

---

### 2. 🏆 **Leagues Tab**
**Ana Ekran:** `leagueList`
- **Header:** ✅ CustomHeader (Menu + Notifications)
- **SideMenu:** ✅ Açılır

**Stack Ekranları:**
```
leagueList (Ana)
├── leagueDetail (Detail)
├── createLeague (Create)
├── editLeague (Edit)
├── fixtureList (Nested)
├── fixtureDetail (Nested)
├── createFixture (Nested)
└── editFixture (Nested)
```

**Kullanım:**
- Tüm ligleri listele
- Lig detayları görüntüle
- Lig oluştur/düzenle
- Lig içindeki fikstürleri yönet

---

### 3. 📅 **Matches Tab**
**Ana Ekran:** `matchList`
- **Header:** ✅ CustomHeader (Menu + Notifications)
- **SideMenu:** ✅ Açılır

**Stack Ekranları:**
```
matchList (Ana)
├── myMatches
├── matchDetail
│
├── Friendly Match Flow
│   ├── createFriendlyMatch
│   ├── friendlyMatchInvitations
│   ├── manageInvitations
│   ├── editFriendlyMatch
│   └── Templates
│       ├── friendlyMatchTemplates
│       ├── createFriendlyMatchTemplate
│       └── editFriendlyMatchTemplate
│
├── Match Management
│   ├── editMatch
│   ├── matchRegistration
│   ├── teamBuilding
│   ├── scoreEntry
│   ├── goalAssistEntry
│   ├── playerRating
│   └── paymentTracking
```

**En Büyük Stack - Tüm Maç İşlemleri Burada!**

---

### 4. 📊 **Stats Tab**
**Ana Ekran:** `standingsList`
- **Header:** ✅ CustomHeader (Menu + Notifications)
- **SideMenu:** ✅ Açılır

**Stack Ekranları:**
```
standingsList (Ana - Lig Seçimi)
├── standings (Puan Durumu)
├── topScorers (Gol Krallığı)
├── topAssists (Asist Krallığı)
└── mvp (MVP Sıralaması)
```

**Kullanım:**
- Tüm liglerin istatistikleri
- Puan durumu
- Gol/Asist kralları
- MVP sıralaması

---

### 5. 👤 **Profile Tab**
**Ana Ekran:** `playerStats` (Kendi İstatistiklerim)
- **Header:** ✅ CustomHeader (Notifications only)
- **SideMenu:** ❌ Kapalı (Profil alanı)

**Stack Ekranları:**
```
playerStats (Ana - Kendi Stats)
├── playerProfile (Profil Görüntüle)
├── editProfile (Profil Düzenle)
├── selectPositions (Pozisyon Seçimi)
├── settings (Ayarlar)
└── notificationSettings (Bildirim Ayarları)
```

**Kullanım:**
- Kendi istatistiklerim (ilk ekran)
- Profil görüntüle/düzenle
- Ayarlar
- Çıkış yap

---

## 🎨 Header & SideMenu Kuralları

### ✅ CustomHeader Kullanımı

| Tab | Header | Menu | Notifications |
|-----|--------|------|---------------|
| 🏠 Home | ✅ | ✅ | ✅ |
| 🏆 Leagues | ✅ | ✅ | ✅ |
| 📅 Matches | ✅ | ✅ | ✅ |
| 📊 Stats | ✅ | ✅ | ✅ |
| 👤 Profile | ✅ | ❌ | ✅ |

### 🎯 Header Olmayan Ekranlar
**Detay/Edit ekranları kendi header'larını kullanır:**
- `leagueDetail` → Sport-based dynamic header
- `matchDetail` → Sport-based dynamic header
- `editLeague` → Custom header with save button
- `createFriendlyMatch` → Custom header
- Ve tüm diğer detail/edit ekranları

---

## 🚀 Navigation Service Kullanımı

### Tab Navigation
```typescript
// Ana tab'lara git
NavigationService.navigateToHomeTab();
NavigationService.navigateToLeaguesTab();
NavigationService.navigateToMatchesTab();
NavigationService.navigateToStatsTab();
NavigationService.navigateToProfileTab();
```

### League Navigation
```typescript
// Liglere git
NavigationService.navigateToLeagueList();
NavigationService.navigateToLeagueDetail('league123');
NavigationService.navigateToCreateLeague();
NavigationService.navigateToEditLeague('league123');
```

### Match Navigation
```typescript
// Maçlara git
NavigationService.navigateToMatchList();
NavigationService.navigateToMyMatches();
NavigationService.navigateToMatchDetail('match123');

// Friendly match
NavigationService.navigateToCreateFriendlyMatch();
NavigationService.navigateToFriendlyMatchInvitations();
NavigationService.navigateToFriendlyMatchTemplates();

// Match management
NavigationService.navigateToMatchRegistration('match123');
NavigationService.navigateToTeamBuilding('match123');
NavigationService.navigateToScoreEntry('match123');
```

### Stats Navigation
```typescript
// İstatistiklere git
NavigationService.navigateToStandingsList();
NavigationService.navigateToStandings('league123');
NavigationService.navigateToTopScorers('league123');
NavigationService.navigateToTopAssists('league123');
NavigationService.navigateToMVP('league123');
```

### Profile Navigation
```typescript
// Profile git
NavigationService.navigateToPlayerStats(); // Kendi statsım
NavigationService.navigateToPlayerProfile(); // Kendi profilim
NavigationService.navigateToEditProfile();
NavigationService.navigateToSettings();
```

---

## 🎯 Kullanıcı Akışları

### 1️⃣ Lig Oluşturma Akışı
```
Home → Menu → "Yeni Lig"
  ↓
LeaguesTab → createLeague
  ↓
Lig oluşturuldu
  ↓
leagueDetail (yeni lig)
```

### 2️⃣ Arkadaşlık Maçı Oluşturma
```
MatchesTab → "+" Button
  ↓
createFriendlyMatch
  ↓
(Opsiyonel) Template seç
  ↓
Oyuncu seç & Ayarlar
  ↓
Maç oluştur & Davet gönder
  ↓
matchDetail (yeni maç)
```

### 3️⃣ Maça Kayıt Olma
```
Home → Yaklaşan Maç Card
  ↓
matchDetail
  ↓
"Kayıt Ol" button
  ↓
matchRegistration
  ↓
Kayıt tamamla
  ↓
Geri → matchDetail (güncellenmiş)
```

### 4️⃣ Maç Sonucu Girme
```
MatchesTab → Tamamlanmış Maç
  ↓
matchDetail → "Sonuç Gir"
  ↓
scoreEntry
  ↓
Skor girildi
  ↓
goalAssistEntry (otomatik)
  ↓
Gol/Asist girildi
  ↓
playerRating (opsiyonel)
```

### 5️⃣ İstatistik Görüntüleme
```
StatsTab → standingsList
  ↓
Lig seç
  ↓
standings / topScorers / topAssists / mvp
  ↓
Oyuncuya tıkla
  ↓
playerProfile (detaylı istatistikler)
```

---

## 🔥 Avantajlar

### ✅ BottomTab Her Zaman Görünür
- Kullanıcı her zaman ana 5 alana erişebilir
- Hızlı geçişler
- Kaybolma riski yok

### ✅ Stack İçinde Detay Navigasyon
- Her tab kendi stack'inde derinlemesine gezinti
- Geri butonu her zaman çalışır
- Doğal flow

### ✅ Header Stratejisi
- Ana ekranlarda: CustomHeader (Menu + Notifications)
- Detay ekranlarda: Kendi dynamic header'ları
- Tutarlı UX

### ✅ SideMenu Kontrolü
- Ana tab'larda açılır (quick actions)
- Profile tab'de kapalı (odaklanma)

### ✅ Performans
- Lazy loading
- Stack içinde state korunur
- Gereksiz re-render yok

---

## 📦 Dosya Yapısı

```
src/navigation/
├── RootNavigatorV3.tsx      # Ana navigator
├── MainNavigator.tsx         # Tab + Stack yapısı
├── NavigationService.ts      # Helper fonksiyonlar
├── types.ts                  # TypeScript types
└── stacks/
    └── AuthStack.tsx         # Auth stack
```

---

## 🚨 Önemli Notlar

1. **BottomTab asla gizlenmez** - Kullanıcı her zaman 5 ana tab'ı görür
2. **Header sadece ana ekranlarda** - Detay ekranları kendi header'larını kullanır
3. **SideMenu 4 tab'de açılır** - Sadece Profile tab'de kapalı
4. **Stack içinde navigasyon** - Her tab kendi stack'inde derinlemesine gezinti
5. **Type-safe navigation** - TypeScript ile tip güvenliği

---

## 🎓 Kullanım Örnekleri

### Herhangi bir yerden maç detayına git:
```typescript
NavigationService.navigateToMatchDetail('match123');
```

### Geri dön:
```typescript
NavigationService.goBack();
```

### Logout:
```typescript
NavigationService.resetToAuth();
```

### Login sonrası:
```typescript
NavigationService.resetToMain();
```

---

## ✨ Sonuç

Bu yapı ile:
- ✅ Kullanıcı asla kaybolmaz (BottomTab her zaman görünür)
- ✅ Hızlı erişim (SideMenu + Quick Actions)
- ✅ Derin navigasyon (Stack içinde detaylar)
- ✅ Tutarlı UX (Header stratejisi)
- ✅ Performanslı (Lazy loading + State preservation)

**Maksimum kullanıcı deneyimi için optimize edilmiş yapı!** 🚀