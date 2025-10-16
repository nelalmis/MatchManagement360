# 📱 CustomHeader Kullanım Kılavuzu

## 🎯 Genel Bakış

CustomHeader, uygulamanızın tüm ekranlarında tutarlı bir header deneyimi sağlar.

### ✨ Özellikler:
- ✅ Esnek left button (Menu, Back, Close)
- ✅ Çoklu right buttons (Notifications, Search, Create, Edit, Save, Filter, More, Settings)
- ✅ Subtitle desteği
- ✅ Notification badge
- ✅ Loading state (Save butonu için)
- ✅ Custom background color
- ✅ Type-safe props

---

## 📦 Import

```typescript
import { CustomHeader } from '../components/CustomHeader';
```

---

## 🎨 Kullanım Senaryoları

### 1️⃣ **Ana Tab Ekranları** (Menu + Notifications)

```typescript
// HomeStack.tsx
<Stack.Screen
  name="homeScreen"
  component={HomeScreen}
  options={{
    header: () => (
      <CustomHeader 
        title="Ana Sayfa" 
        showMenu 
        showNotifications
        notificationCount={5}
        onNotificationPress={() => {
          NavigationService.navigateToNotifications();
        }}
      />
    ),
  }}
/>
```

**Görünüm:**
```
☰  Ana Sayfa  🔔(5)
```

---

### 2️⃣ **Liste Ekranları** (Menu + Search + Create)

```typescript
// LeaguesStack.tsx
<Stack.Screen
  name="leagueList"
  component={LeagueListScreen}
  options={{
    header: () => (
      <CustomHeader 
        title="Ligler" 
        showMenu 
        showSearch
        showCreate
        showNotifications
        notificationCount={3}
        onSearchPress={() => setSearchVisible(true)}
        onCreatePress={() => NavigationService.navigateToCreateLeague()}
        onNotificationPress={() => {}}
      />
    ),
  }}
/>
```

**Görünüm:**
```
☰  Ligler  🔍 ➕ 🔔(3)
```

---

### 3️⃣ **Detay Ekranları** (Back + Edit)

```typescript
// LeagueDetailScreen.tsx
const LeagueDetailScreen = () => {
  return (
    <View style={styles.container}>
      <CustomHeader
        title={league.name}
        subtitle={`${league.sportType} • ${league.playerCount} oyuncu`}
        showBack
        showEdit
        showMore
        onLeftPress={() => navigation.goBack()}
        onEditPress={() => NavigationService.navigateToEditLeague(league.id)}
        onMorePress={() => setMenuVisible(true)}
        backgroundColor={getSportColor(league.sportType)}
      />
      {/* Screen content */}
    </View>
  );
};
```

**Görünüm:**
```
←  Süper Lig           ✏️ ⋮
   ⚽ Futbol • 22 oyuncu
```

---

### 4️⃣ **Create/Edit Ekranları** (Close + Save)

```typescript
// CreateLeagueScreen.tsx
const CreateLeagueScreen = () => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await createLeague(data);
    setSaving(false);
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Yeni Lig Oluştur"
        showClose
        showSave
        loading={saving}
        onLeftPress={() => navigation.goBack()}
        onSavePress={handleSave}
      />
      {/* Form fields */}
    </View>
  );
};
```

**Görünüm (Normal):**
```
✕  Yeni Lig Oluştur  💾
```

**Görünüm (Saving):**
```
✕  Yeni Lig Oluştur  ●
```

---

### 5️⃣ **Filtreleme İle Liste** (Menu + Filter + Search)

```typescript
// MatchListScreen.tsx
<CustomHeader
  title="Maçlar"
  showMenu
  showFilter
  showSearch
  showNotifications
  onFilterPress={() => setFilterModalVisible(true)}
  onSearchPress={() => setSearchVisible(true)}
  onNotificationPress={() => {}}
/>
```

**Görünüm:**
```
☰  Maçlar  🎚️ 🔍 🔔
```

---

### 6️⃣ **Profile Ekranları** (Settings + Notifications)

```typescript
// PlayerStatsScreen.tsx (Profile Tab)
<Stack.Screen
  name="playerStats"
  component={PlayerStatsScreen}
  options={{
    header: () => (
      <CustomHeader 
        title="Profilim"
        showSettings
        showNotifications
        onSettingsPress={() => NavigationService.navigateToSettings()}
        onNotificationPress={() => {}}
      />
    ),
  }}
/>
```

**Görünüm:**
```
   Profilim  ⚙️ 🔔
```

**Not:** Profile tab'de Menu butonu YOK!

---

## 🎛️ Props API

### Title Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Header başlığı |
| `subtitle` | `string` | - | Alt başlık (opsiyonel) |

### Left Button Props (Sadece biri)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showMenu` | `boolean` | `false` | Ana tab ekranları için menu butonu |
| `showBack` | `boolean` | `false` | Detay ekranlar için geri butonu |
| `showClose` | `boolean` | `false` | Modal tarzı ekranlar için kapat butonu |
| `onLeftPress` | `() => void` | - | Custom left action (override) |

### Right Button Props (Çoklu)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showNotifications` | `boolean` | `false` | Bildirim butonu |
| `showSearch` | `boolean` | `false` | Arama butonu |
| `showCreate` | `boolean` | `false` | Oluştur butonu (➕) |
| `showEdit` | `boolean` | `false` | Düzenle butonu |
| `showSave` | `boolean` | `false` | Kaydet butonu |
| `showFilter` | `boolean` | `false` | Filtre butonu |
| `showMore` | `boolean` | `false` | Daha fazla butonu (⋮) |
| `showSettings` | `boolean` | `false` | Ayarlar butonu |

### Callback Props
| Prop | Type | Description |
|------|------|-------------|
| `onNotificationPress` | `() => void` | Bildirime tıklandığında |
| `onSearchPress` | `() => void` | Arama butonuna tıklandığında |
| `onCreatePress` | `() => void` | Oluştur butonuna tıklandığında |
| `onEditPress` | `() => void` | Düzenle butonuna tıklandığında |
| `onSavePress` | `() => void` | Kaydet butonuna tıklandığında |
| `onFilterPress` | `() => void` | Filtre butonuna tıklandığında |
| `onMorePress` | `() => void` | Daha fazla butonuna tıklandığında |
| `onSettingsPress` | `() => void` | Ayarlar butonuna tıklandığında |

### Style Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `'#16a34a'` | Header arka plan rengi |
| `notificationCount` | `number` | - | Bildirim badge sayısı |
| `loading` | `boolean` | `false` | Save butonu loading state |

---

## 🎨 Özelleştirilmiş Renkler

### Sport-based Colors
```typescript
import { getSportColor } from '../types/types';

<CustomHeader
  title={fixture.title}
  backgroundColor={getSportColor(fixture.sportType)}
  showBack
  showEdit
  onLeftPress={() => navigation.goBack()}
  onEditPress={() => {}}
/>
```

### Custom Colors
```typescript
<CustomHeader
  title="Özel Ekran"
  backgroundColor="#3B82F6" // Blue
  showBack
  onLeftPress={() => navigation.goBack()}
/>
```

---

## 🔔 Notification Badge

### Badge Gösterimi
```typescript
<CustomHeader
  title="Ana Sayfa"
  showNotifications
  notificationCount={12}
  onNotificationPress={() => {}}
/>
```

**Sonuç:** Bildirim ikonu üzerinde kırmızı badge: `🔔(12)`

### 99+ Badge
```typescript
notificationCount={150} // "99+" olarak gösterilir
```

---

## 💾 Loading State (Save Button)

### Normal State
```typescript
<CustomHeader
  title="Düzenle"
  showSave
  loading={false}
  onSavePress={handleSave}
/>
```

### Loading State
```typescript
const [saving, setSaving] = useState(false);

<CustomHeader
  title="Düzenle"
  showSave
  loading={saving}
  onSavePress={async () => {
    setSaving(true);
    await saveData();
    setSaving(false);
  }}
/>
```

**Görünüm değişimi:** 💾 → ●

---

## 🎯 MainNavigator İle Entegrasyon

### Stack Screen Options
```typescript
// MainNavigator.tsx - HomeStack
<Stack.Screen
  name="homeScreen"
  component={HomeScreen}
  options={{
    header: () => (
      <CustomHeader 
        title="Ana Sayfa" 
        showMenu 
        showNotifications
        onNotificationPress={() => {}}
      />
    ),
  }}
/>
```

### Component İçinde Kullanım
```typescript
// Detay ekranlar için
const LeagueDetailScreen = () => {
  return (
    <View style={styles.container}>
      <CustomHeader
        title="Lig Detayı"
        showBack
        showEdit
        onLeftPress={() => navigation.goBack()}
        onEditPress={() => {}}
      />
      {/* Content */}
    </View>
  );
};
```

---

## 📋 En İyi Pratikler

### ✅ DO

```typescript
// 1. Ana tab ekranlarında Menu kullan
<CustomHeader title="Ana Sayfa" showMenu />

// 2. Detay ekranlarında Back kullan
<CustomHeader title="Detay" showBack />

// 3. Modal ekranlarında Close kullan
<CustomHeader title="Filtrele" showClose />

// 4. Callback'leri her zaman sağla
<CustomHeader 
  showNotifications
  onNotificationPress={() => handleNotification()} // ✅
/>

// 5. Sport-based colors kullan
<CustomHeader 
  backgroundColor={getSportColor(sportType)}
/>
```

### ❌ DON'T

```typescript
// 1. Birden fazla left button kullanma
<CustomHeader showMenu showBack /> // ❌

// 2. Callback olmadan button gösterme
<CustomHeader showNotifications /> // ❌ onNotificationPress yok

// 3. Profile tab'de Menu butonu
<CustomHeader title="Profilim" showMenu /> // ❌

// 4. Gereksiz butonlar
<CustomHeader 
  showCreate
  showEdit
  showSave
  showFilter
  showSearch
  showMore
  showSettings
/> // ❌ Çok fazla!
```

---

## 🎨 Görsel Örnekler

### Ana Tab Ekranları
```
┌─────────────────────────────────────┐
│ ☰  Ana Sayfa                 🔔(5) │
└─────────────────────────────────────┘
```

### Liste + Actions
```
┌─────────────────────────────────────┐
│ ☰  Ligler            🔍 ➕ 🔔(3)  │
└─────────────────────────────────────┘
```

### Detay Ekranı
```
┌─────────────────────────────────────┐
│ ←  Süper Lig              ✏️ ⋮    │
│    ⚽ Futbol • 22 oyuncu            │
└─────────────────────────────────────┘
```

### Create/Edit
```
┌─────────────────────────────────────┐
│ ✕  Yeni Lig Oluştur          💾   │
└─────────────────────────────────────┘
```

### Profile
```
┌─────────────────────────────────────┐
│    Profilim                 ⚙️ 🔔  │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Reference

| Ekran Tipi | Left | Right | Örnek |
|-----------|------|-------|-------|
| Ana Tab | Menu | Notifications | Home, Leagues List |
| Liste + Actions | Menu | Search, Create, Notifications | Match List |
| Detay | Back | Edit, More | League Detail |
| Create/Edit | Close | Save | Create League |
| Profile | - | Settings, Notifications | Player Stats |
| Modal | Close | - | Filter Modal |

---

## 🎓 Gelişmiş Kullanım

### Dynamic Title
```typescript
const [league, setLeague] = useState<ILeague>();

<CustomHeader
  title={league?.name || 'Yükleniyor...'}
  subtitle={league ? `${league.sportType} • ${league.playerCount} oyuncu` : undefined}
  showBack
  onLeftPress={() => navigation.goBack()}
/>
```

### Conditional Buttons
```typescript
const canEdit = league?.creatorId === user?.id;

<CustomHeader
  title={league.name}
  showBack
  showEdit={canEdit} // Sadece creator görür
  onLeftPress={() => navigation.goBack()}
  onEditPress={canEdit ? () => handleEdit() : undefined}
/>
```

### Multiple Actions
```typescript
<CustomHeader
  title="Maçlar"
  showMenu
  showFilter
  showSearch
  showCreate
  showNotifications
  notificationCount={unreadCount}
  onFilterPress={() => setFilterModal(true)}
  onSearchPress={() => setSearchModal(true)}
  onCreatePress={() => setCreateModal(true)}
  onNotificationPress={() => NavigationService.navigateToNotifications()}
/>
```

---

## ✨ Sonuç

CustomHeader ile:
- ✅ Tutarlı UX
- ✅ Kolay kullanım
- ✅ Esnek yapı
- ✅ Type-safe
- ✅ Performanslı

**Tüm ekranlarınızda profesyonel header deneyimi!** 🎉