# 🚀 Friendly Match Sistemi - Detaylı İş Listesi

## 📋 Genel Bakış

**Yeni Eklenen Backend Özellikleri:**
- ✅ League ve Friendly match type desteği
- ✅ Match invitation (davetiye) sistemi
- ✅ Friendly match config ve template sistemi
- ✅ İstatistiklerde 3 seviye breakdown (All/League/Friendly)
- ✅ Rating sisteminde match type ayrımı
- ✅ League settings ve friendly permissions

---

## 🎯 PHASE 1: Match Type System (Temel Altyapı)

### 1.1 Match Modülü Güncellemeleri ⚡ YÜK SEK ÖNCELİK

#### A. MatchListScreen Güncelleme
**Değişiklikler:**
- [ ] Tab sistemi ekle: "Lig Maçları" | "Dostluk Maçları" | "Hepsi"
- [ ] Filter chip'leri ekle (Upcoming/Completed/My Matches)
- [ ] Match card'da match type badge göster
- [ ] Friendly match için davetiye durumu göster

**Yeni Özellikler:**
```typescript
- matchType filter (League/Friendly/All)
- invitationStatus badge (Pending/Accepted/Rejected)
- "Friendly Oluştur" FAB butonu
```

#### B. MatchDetailScreen Güncelleme
**Değişiklikler:**
- [ ] Match type'a göre farklı UI göster
- [ ] Friendly match için davetiye bilgileri section
- [ ] "Affects Standings" badge (friendly için optional)
- [ ] Organizatör için "Davetiye Yönet" butonu

**Yeni Sections:**
```typescript
- Match Type Badge (League 🏆 / Friendly 🤝)
- Invitation Status (Sadece friendly için)
- Scoring Rules (Puan etkileme durumu)
```

#### C. MatchRegistrationScreen Güncelleme
**Değişiklikler:**
- [ ] Friendly match için davetiye kontrolü
- [ ] "Bu maç puan durumunu etkilemez" uyarısı
- [ ] Auto-accept davetiye özelliği

---

### 1.2 Yeni Match Ekranları 🆕

#### D. **CreateFriendlyMatchScreen** (YENİ EKRAN)
**Lokasyon:** `screens/Match/CreateFriendlyMatchScreen.tsx`

**Özellikler:**
- [ ] Template seçimi (kayıtlı şablonlardan)
- [ ] Config yükle (default ayarlar)
- [ ] Temel maç bilgileri (tarih, saha, maliyet)
- [ ] Puan durumu etkileme toggle
- [ ] Davetiye listesi seçimi
- [ ] "Şablon olarak kaydet" option
- [ ] Toplu davet gönderimi

**Form Sections:**
```typescript
1. Template Selection (optional)
   - Kayıtlı şablonlar listesi
   - "Boş başlat" seçeneği

2. Match Details
   - Tarih/saat
   - Saha
   - Maliyet
   - Açıklama

3. Settings
   - Affects standings (toggle)
   - Min/Max oyuncu sayısı
   - Auto-accept invitations

4. Player Selection
   - Oyuncu listesi (multi-select)
   - "Tümünü seç" butonu
   - Favoriler listesi

5. Actions
   - "Şablon olarak kaydet"
   - "Oluştur ve Davet Gönder"
```

#### E. **FriendlyMatchInvitationsScreen** (YENİ EKRAN)
**Lokasyon:** `screens/Match/FriendlyMatchInvitationsScreen.tsx`

**Özellikler:**
- [ ] Bekleyen davetler listesi
- [ ] Accept/Reject aksiyonları
- [ ] Davet detayları modal
- [ ] Toplu işlemler
- [ ] Bildirimleri yönet

**UI Bölümleri:**
```typescript
1. Header Stats
   - Toplam bekleyen: X
   - Bu hafta: Y
   - Reddedilen: Z

2. Invitation Cards
   - Match bilgileri
   - Organizatör
   - Tarih/saha
   - Son kabul tarihi
   - Accept/Reject butonları

3. Filter/Sort
   - Tarihe göre
   - Organizatöre göre
   - Sahaya göre
```

#### F. **FriendlyMatchTemplatesScreen** (YENİ EKRAN)
**Lokasyon:** `screens/Match/FriendlyMatchTemplatesScreen.tsx`

**Özellikler:**
- [ ] Kayıtlı şablonlar listesi
- [ ] Şablon detayları görüntüle
- [ ] Şablondan hızlı maç oluştur
- [ ] Şablon düzenle/sil
- [ ] Şablon paylaş

**Template Card:**
```typescript
- Template adı
- Varsayılan saha
- Varsayılan oyuncu sayısı
- Favoriler listesi
- Kullanım sayısı
- Hızlı oluştur butonu
```

---

## 🎯 PHASE 2: Statistics & Profile Updates

### 2.1 PlayerStatsScreen Güncelleme ⚡ YÜKSEK ÖNCELİK

**Değişiklikler:**
- [ ] Tab sistemi: "Tümü" | "Lig" | "Dostluk"
- [ ] Her tab için ayrı istatistikler
- [ ] Karşılaştırma grafikler
- [ ] Match type breakdown chart

**Yeni Bölümler:**
```typescript
1. Overview Cards (3 Tab)
   All Matches | League Matches | Friendly Matches

2. Detailed Stats per Tab
   - Maç sayısı
   - Gol/Asist
   - Galibiyet/Beraberlik/Mağlubiyet
   - Win rate
   - Ortalama rating

3. Comparison Charts
   - League vs Friendly performance
   - Trend grafikleri
   - Position breakdown
```

### 2.2 PlayerProfileScreen Güncelleme

**Değişiklikler:**
- [ ] Rating profile'da match type ayrımı
- [ ] Friendly stats section
- [ ] MVP count breakdown
- [ ] Recent friendly matches

**Yeni Sections:**
```typescript
- Overall vs League vs Friendly Stats
- Rating Comparison Chart
- Friendly Match History
- Template Favorileri
```

### 2.3 StandingsScreen Güncelleme

**Değişiklikler:**
- [ ] "Sadece lig maçları" notu
- [ ] Friendly stats link/button
- [ ] Combined stats toggle (optional)

---

## 🎯 PHASE 3: League Management Updates

### 3.1 LeagueDetailScreen Güncelleme

**Değişiklikler:**
- [ ] "Friendly Maç Ayarları" tab ekle
- [ ] Friendly permissions yönetimi
- [ ] Friendly match statistics link

**Yeni Tab: "Friendly Settings"**
```typescript
- Allow friendly matches (toggle)
- Auto-create friendly matches (toggle)
- Default friendly settings
- Permission management
```

### 3.2 EditLeagueScreen Güncelleme

**Değişiklikler:**
- [ ] Friendly match settings section
- [ ] Permission presets
- [ ] Template management

---

## 🎯 PHASE 4: Settings & Configuration

### 4.1 Yeni Settings Ekranları

#### G. **FriendlyMatchSettingsScreen** (YENİ EKRAN)
**Lokasyon:** `screens/Settings/FriendlyMatchSettingsScreen.tsx`

**Özellikler:**
- [ ] Default config yönetimi
- [ ] Favorite players listesi
- [ ] Default saha
- [ ] Notification preferences
- [ ] Template management

**Sections:**
```typescript
1. Default Configuration
   - Default venue
   - Default cost
   - Default player count
   - Auto-accept invitations

2. Favorite Players
   - Favori oyuncu listesi
   - Hızlı davet için

3. Notifications
   - Davetiye bildirimleri
   - Reminder ayarları
   - WhatsApp/Email preferences

4. Templates
   - Template yönetimi
   - Import/Export
```

---

## 🎯 PHASE 5: Home & Navigation Updates

### 5.1 HomeScreen Güncelleme

**Değişiklikler:**
- [ ] Bekleyen friendly invitations kartı
- [ ] Recent friendly matches
- [ ] Quick action: "Friendly Oluştur"
- [ ] Invitation count badge

**Yeni Sections:**
```typescript
1. Invitation Alert Card
   - "X bekleyen davet"
   - Quick accept/reject
   
2. Upcoming Friendly Matches
   - Yaklaşan dostluk maçları
   - Hazırlanan takımlar

3. Quick Stats
   - League vs Friendly comparison
```

### 5.2 Navigation Updates

**Yeni Navigasyon Yapısı:**
```typescript
Match Tab:
  ├─ All Matches (Lig + Friendly)
  ├─ League Matches
  ├─ Friendly Matches
  └─ My Invitations (badge ile)

Profile Tab:
  └─ Stats → All/League/Friendly tabs

Settings Tab:
  └─ Friendly Match Settings
```

---

## 🎯 PHASE 6: Components & Utilities

### 6.1 Yeni Components

#### MatchTypeToggle.tsx
```typescript
- League/Friendly/All toggle
- Filter chip component
- Badge component
```

#### InvitationCard.tsx
```typescript
- Davetiye kartı
- Accept/Reject butonları
- Detay modal
```

#### TemplateCard.tsx
```typescript
- Template kartı
- Quick actions
- Usage stats
```

#### StatsComparisonChart.tsx
```typescript
- League vs Friendly grafik
- Performance comparison
- Trend visualization
```

### 6.2 Utility Functions

#### invitationUtils.ts
```typescript
- Davetiye durumu kontrolü
- Toplu davet gönderimi
- Reminder işlemleri
```

#### templateUtils.ts
```typescript
- Template validation
- Default değerler
- Template export/import
```

#### statsComparison.ts
```typescript
- Stats karşılaştırma
- Breakdown calculations
- Trend analysis
```

---

## 📊 Güncellenmiş Ekran İstatistikleri

### Mevcut Ekranlar
- ✅ Tamamlanan: 19 ekran
- 🔄 Güncellenecek: 8 ekran
- 🆕 Yeni: 4 ekran

### Yeni Ekranlar (4)
1. CreateFriendlyMatchScreen
2. FriendlyMatchInvitationsScreen
3. FriendlyMatchTemplatesScreen
4. FriendlyMatchSettingsScreen

### Güncellenecek Ekranlar (8)
1. MatchListScreen
2. MatchDetailScreen
3. MatchRegistrationScreen
4. PlayerStatsScreen ⭐
5. PlayerProfileScreen
6. LeagueDetailScreen
7. EditLeagueScreen
8. HomeScreen

### Yeni Components (4)
1. MatchTypeToggle
2. InvitationCard
3. TemplateCard
4. StatsComparisonChart

---

## 🚀 Önerilen Geliştirme Sırası

### Sprint 1: Core Functionality (2-3 hafta)
1. ✅ Backend API'ları test et
2. CreateFriendlyMatchScreen
3. MatchListScreen güncelle
4. MatchDetailScreen güncelle
5. InvitationCard component

### Sprint 2: Invitation System (1-2 hafta)
6. FriendlyMatchInvitationsScreen
7. MatchRegistrationScreen güncelle
8. HomeScreen invitation alerts
9. Notification sistemi

### Sprint 3: Statistics & Profile (2 hafta)
10. PlayerStatsScreen güncelle ⭐
11. PlayerProfileScreen güncelle
12. StatsComparisonChart component
13. Match type breakdown charts

### Sprint 4: Templates & Settings (1-2 hafta)
14. FriendlyMatchTemplatesScreen
15. FriendlyMatchSettingsScreen
16. TemplateCard component
17. Template management

### Sprint 5: League Management (1 hafta)
18. LeagueDetailScreen güncelle
19. EditLeagueScreen güncelle
20. Permission management UI

---

## 🔧 Teknik Notlar

### API Entegrasyonları
```typescript
// Yeni servisler kullanılacak:
- matchService.createFriendlyMatch()
- matchService.invitePlayersToMatch()
- friendlyMatchConfigService.*
- playerStatsService.getPlayerStatsComparison()
- playerRatingProfileService.getPlayerRatingComparison()
```

### State Management
```typescript
// Yeni context'ler:
- InvitationContext (davetiye yönetimi)
- TemplateContext (şablon yönetimi)
- FriendlyMatchContext (friendly match state)
```

### Notification System
```typescript
// Push notification topics:
- friendly_invitation_received
- friendly_invitation_accepted
- friendly_match_reminder
- friendly_match_team_announced
```

---

## ✅ Definition of Done

Her ekran için tamamlanma kriterleri:

- [ ] UI tamamen responsive
- [ ] API entegrasyonu çalışıyor
- [ ] Loading/Error states mevcut
- [ ] Empty states tasarlandı
- [ ] Navigation akışı test edildi
- [ ] Match type ayrımı çalışıyor
- [ ] Backend ile senkronize
- [ ] Bildirimleri entegre

---

## 📝 Notlar

1. **Öncelik Sırası**: 
   - CreateFriendlyMatchScreen (En kritik)
   - PlayerStatsScreen güncellemesi
   - Invitation sistemi

2. **Bağımlılıklar**:
   - Backend API'ları hazır ✅
   - Navigation sistemi mevcut ✅
   - Component library mevcut ✅

3. **Risk Alanları**:
   - Template sistemi karmaşık olabilir
   - Stats comparison UI challenging
   - Notification timing önemli

---

**Toplam İş Yükü Tahmini**: 8-10 hafta
**Ekip Büyüklüğü**: 1-2 developer
**Backend Hazır**: ✅ %100

Hangi sprint'ten başlamak istersiniz? 🚀