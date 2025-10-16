// ============================================
// types/index.ts - COMPLETE TYPE DEFINITIONS
// ============================================

// ============================================
// 1. ENUMS & CONSTANTS
// ============================================

/**
 * Desteklenen spor türleri
 * Her spor için config bilgisi SPORT_CONFIGS'te tanımlı
 */
export type SportType =
  | "Futbol"
  | "Basketbol"
  | "Voleybol"
  | "Tenis"
  | "Masa Tenisi"
  | "Badminton";

/**
 * Maç türleri
 * LEAGUE: Fikstüre bağlı, lig puanını etkiler
 * FRIENDLY: Bağımsız maç, isteğe bağlı puan etkisi
 */
export enum MatchType {
  LEAGUE = 'LEAGUE',
  FRIENDLY = 'FRIENDLY'
}

/**
 * Maç durumları - Lifecycle flow
 * created → registration_open → registration_closed → teams_set → 
 * in_progress → awaiting_score → completed / cancelled
 */
export enum MatchStatus {
  CREATED = 'created',                    // İlk oluşturma
  REGISTRATION_OPEN = 'registration_open', // Oyuncular kayıt olabilir
  REGISTRATION_CLOSED = 'registration_closed', // Kayıtlar kapandı
  TEAMS_SET = 'teams_set',                // Takımlar belirlendi
  IN_PROGRESS = 'in_progress',            // Maç oynanıyor
  AWAITING_SCORE = 'awaiting_score',      // Skor bekleniyor
  COMPLETED = 'completed',                // Tamamlandı
  CANCELLED = 'cancelled'                 // İptal edildi
}

/**
 * Sezon durumları
 * upcoming → active → completed → archived
 */
export enum SeasonStatus {
  UPCOMING = 'upcoming',     // Henüz başlamadı
  ACTIVE = 'active',         // Aktif sezon
  COMPLETED = 'completed',   // Tamamlandı
  ARCHIVED = 'archived'      // Arşivlendi (12+ ay sonra)
}

/**
 * Her spor için varsayılan konfigürasyon
 * UI'da emoji, renk, pozisyon listesi için kullanılır
 */
export interface SportConfig {
  emoji: string;              // Spor ikonu
  name: string;               // Görünen ad
  defaultPlayers: number;     // Varsayılan oyuncu sayısı
  defaultDuration: number;    // Varsayılan maç süresi (dk)
  positions: string[];        // Pozisyon listesi (boş ise pozisyon yok)
  color: string;              // Tema rengi (hex)
}

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  Futbol: {
    emoji: "⚽",
    name: "Futbol",
    defaultPlayers: 10,
    defaultDuration: 60,
    positions: ["Kaleci", "Defans", "Orta Saha", "Forvet"],
    color: "#16a34a",
  },
  Basketbol: {
    emoji: "🏀",
    name: "Basketbol",
    defaultPlayers: 10,
    defaultDuration: 40,
    positions: ["Guard", "Forward", "Center"],
    color: "#F59E0B",
  },
  Voleybol: {
    emoji: "🏐",
    name: "Voleybol",
    defaultPlayers: 12,
    defaultDuration: 90,
    positions: ["Libero", "Pasör", "Smaçör", "Orta Oyuncu"],
    color: "#2563EB",
  },
  Tenis: {
    emoji: "🎾",
    name: "Tenis",
    defaultPlayers: 2,
    defaultDuration: 90,
    positions: [],
    color: "#10B981",
  },
  "Masa Tenisi": {
    emoji: "🏓",
    name: "Masa Tenisi",
    defaultPlayers: 2,
    defaultDuration: 45,
    positions: [],
    color: "#8B5CF6",
  },
  Badminton: {
    emoji: "🏸",
    name: "Badminton",
    defaultPlayers: 2,
    defaultDuration: 45,
    positions: [],
    color: "#EC4899",
  },
};

// ============================================
// 2. HELPER TYPES
// ============================================

/**
 * Oyuncu listesi konfigürasyonu (Hybrid sistem)
 * mode='auto': inherited listesini kullan (Fixture güncellemeleri yansır)
 * mode='custom': overrides listesini kullan (Manuel özelleştirme)
 */
export interface PlayerListConfig {
  mode: 'auto' | 'custom';      // Otomatik mı manuel mi
  inherited: string[];           // League/Fixture'dan gelen liste (readonly)
  overrides?: string[];          // Manuel özelleştirme (mode='custom' ise)
}

/**
 * Helper: Etkili oyuncu listesini döndürür
 * Custom modda overrides, auto modda inherited kullanılır
 */
export const getEffectivePlayers = (config: PlayerListConfig): string[] => {
  return config.mode === 'custom' && config.overrides 
    ? config.overrides 
    : config.inherited;
};

// ============================================
// 3. PLAYER (users collection)
// ============================================

/**
 * COLLECTION: users
 * AÇIKLAMA: Kullanıcı/Oyuncu temel bilgileri
 * AUTH: Firebase Auth ile senkronize
 * CACHE: Yok
 */
export interface IPlayer {
  id: string;                   // User ID (Firebase Auth UID ile aynı)
  
  // ============================================
  // KİŞİSEL BİLGİLER
  // ============================================
  name: string;                 // Ad
  surname: string;              // Soyad
  email: string;                // E-posta (unique)
  phone?: string;               // Telefon (optional)
  
  // ============================================
  // PROFİL BİLGİLERİ
  // ============================================
  jerseyNumber?: string;        // Forma numarası
  birthDate?: string;           // Doğum tarihi (ISO format)
  profilePhoto?: string;        // Profil fotoğrafı URL
  
  // ============================================
  // SPOR TERCİHLERİ
  // ============================================
  favoriteSports: SportType[];  // Favori sporlar
  sportPositions?: Partial<Record<SportType, string[]>>; // Spor bazlı pozisyonlar
  // Örnek: { "Futbol": ["Kaleci", "Defans"], "Basketbol": ["Guard"] }
  
  // ============================================
  // AUTH
  // ============================================
  lastLogin?: Date;             // Son giriş zamanı
  
  // ============================================
  // META
  // ============================================
  createdAt: string;            // Kayıt tarihi
  updatedAt?: string;           // Son güncelleme
}

// ============================================
// 4. LEAGUE (leagues collection)
// ============================================

/**
 * COLLECTION: leagues
 * AÇIKLAMA: Lig ana tanımı (örn: "Architect Halı Saha Ligi")
 * İLİŞKİLER: seasons, fixtures, matches
 * CACHE: totalSeasons, totalMatches, totalMembers (performans için)
 */
export interface ILeague {
  id: string;
  
  // ============================================
  // TEMEL BİLGİLER
  // ============================================
  title: string;                // Lig adı
  sportType: SportType;         // Hangi spor
  description?: string;         // Açıklama
  logo?: string;                // Lig logosu URL
  
  // ============================================
  // AKTİF SEZON
  // ============================================
  currentSeasonId?: string;     // Şu anki aktif sezon ID'si (→ seasons)
  
  // ============================================
  // SEZON AYARLARI
  // ============================================
  seasonSettings: {
    autoCreateNewSeason: boolean;      // Sezon bitince otomatik yeni sezon
    seasonDuration: number;            // Sezon süresi (gün)
    autoArchiveOldSeasons: boolean;    // Eski sezonları otomatik arşivle
    archiveAfterMonths: number;        // Kaç ay sonra arşivlensin (12)
  };
  
  // ============================================
  // ÜYELER
  // ============================================
  members: {
    all: string[];              // Tüm lig üyeleri (Player ID'leri)
    admins: string[];           // Lig yöneticileri (Player ID'leri)
  };
  
  // ============================================
  // VARSAYILAN OYUNCU LİSTELERİ
  // Yeni fixture/match oluşturulduğunda base olarak kullanılır
  // ============================================
  defaultPlayers: {
    premium: string[];          // Öncelikli oyuncular (kayıt olursa başa geçer)
    direct: string[];           // Direkt oyuncular (otomatik kadroda)
  };
  
  // ============================================
  // GENEL AYARLAR
  // ============================================
  settings: {
    allowFriendlyMatches: boolean;        // Friendly maç oluşturma izni
    friendlyAffectsStats: boolean;        // Friendly istatistikleri etkiler mi
    friendlyAffectsStandings: boolean;    // Friendly puan durumunu etkiler mi
  };
  
  // ============================================
  // CACHE (Performans için hesaplanıp saklanır)
  // ============================================
  totalSeasons: number;         // CACHE: Toplam sezon sayısı
  totalMatches: number;         // CACHE: Toplam maç sayısı
  totalMembers: number;         // CACHE: Toplam üye sayısı
  
  // ============================================
  // META
  // ============================================
  createdBy: string;            // Lig kurucusu (Player ID)
  createdAt: string;            // Oluşturma tarihi
  updatedAt?: string;           // Son güncelleme
}

// ============================================
// 5. SEASON (seasons collection)
// ============================================

/**
 * COLLECTION: seasons
 * AÇIKLAMA: Sezon tanımı (örn: "2025 İlkbahar Sezonu")
 * İLİŞKİLER: league → standings → matches
 * CACHE: summary (sezon özeti - top scorer, MVP vb.)
 */
export interface ISeason {
  id: string;
  leagueId: string;             // Hangi lige ait (→ leagues)
  
  // ============================================
  // TEMEL BİLGİLER
  // ============================================
  name: string;                 // Sezon adı
  seasonNumber: number;         // Sezon sırası (1, 2, 3...)
  
  // ============================================
  // TARİH
  // ============================================
  startDate: string;            // Başlangıç tarihi (ISO format)
  endDate: string;              // Bitiş tarihi (ISO format)
  
  // ============================================
  // DURUM
  // ============================================
  status: SeasonStatus;         // upcoming/active/completed/archived
  
  // ============================================
  // AYARLAR (Sezon özelinde)
  // ============================================
  settings: {
    pointsForWin: number;       // Galibiyet puanı (varsayılan: 3)
    pointsForDraw: number;      // Beraberlik puanı (varsayılan: 1)
    pointsForLoss: number;      // Mağlubiyet puanı (varsayılan: 0)
  };
  
  // ============================================
  // ÖZET (CACHE - Sezon tamamlandığında hesaplanır)
  // ============================================
  summary?: {
    totalMatches: number;       // CACHE: Toplam maç sayısı
    totalGoals: number;         // CACHE: Toplam gol sayısı
    
    topScorer?: {               // CACHE: En çok gol atan
      playerId: string;
      playerName: string;       // CACHE: İsim
      goals: number;
    };
    
    mvp?: {                     // CACHE: Sezon MVP
      playerId: string;
      playerName: string;       // CACHE: İsim
      rating: number;
      mvpCount: number;         // Kaç kez MVP seçildi
    };
  };
  
  // ============================================
  // İLİŞKİLER
  // ============================================
  standingsId?: string;         // Puan durumu ID'si (→ standings)
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  completedAt?: string;         // Tamamlanma tarihi
  archivedAt?: string;          // Arşivlenme tarihi
  updatedAt?: string;
}

// ============================================
// 6. FIXTURE (fixtures collection)
// ============================================

/**
 * COLLECTION: fixtures
 * AÇIKLAMA: Tekrarlayan maç şablonu (örn: "Her Salı 19:00 Maçı")
 * SADECE LEAGUE için kullanılır (Friendly'ler fixture'a bağlı değil)
 * İLİŞKİLER: league → matches
 * CACHE: totalMatches, nextMatchDate
 */
export interface IFixture {
  id: string;
  leagueId: string;             // Hangi lige ait (→ leagues)
  
  // ============================================
  // TEMEL BİLGİLER
  // ============================================
  title: string;                // Fixture adı (örn: "Salı Maçı")
  description?: string;         // Açıklama
  
  // ============================================
  // ZAMANLAMA
  // ============================================
  schedule: {
    registrationStartTime: string;  // Kayıt başlangıç saati ("18:00")
    matchStartTime: string;         // Maç başlangıç saati ("19:00")
    matchDuration: number;          // Maç süresi (dakika)
    
    // Periyodik ayarlar
    isRecurring: boolean;           // Tekrarlayan mı, tek seferlik mi
    pattern?: {
      type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
      dayOfWeek?: number;           // 0-6 (Pazar-Cumartesi)
      dayOfMonth?: number;          // 1-31 (monthly için)
      interval?: number;            // custom için: her X günde bir
      endsAt?: string;              // Tekrarın bitiş tarihi (optional)
    };
  };
  
  // ============================================
  // KADRO AYARLARI
  // ============================================
  squad: {
    totalPlayers: number;           // Toplam kadro sayısı (10)
    reservePlayers: number;         // Yedek oyuncu sayısı (2)
    minPlayersToStart: number;      // Maç başlamak için min. oyuncu (8)
  };
  
  // ============================================
  // LOKASYON VE ÖDEME
  // ============================================
  venue: {
    location: string;               // Saha adresi
    pricePerPlayer: number;         // Kişi başı ücret
    payment: {
      iban: string;                 // IBAN
      accountName: string;          // Hesap sahibi
    };
  };
  
  // ============================================
  // OYUNCU LİSTELERİ (Hybrid sistem)
  // League'den inherit edilir, özelleştirilebilir
  // ============================================
  players: {
    premium: PlayerListConfig;      // Öncelikli oyuncular
    direct: PlayerListConfig;       // Direkt oyuncular
  };
  
  // ============================================
  // YETKİLER
  // ============================================
  permissions: {
    organizers: string[];           // Fixture organizatörleri
    teamBuilders?: string[];        // Takım kurma yetkisi olanlar
  };
  
  // ============================================
  // CACHE
  // ============================================
  totalMatches: number;         // CACHE: Bu fixture'dan oluşturulan toplam maç
  nextMatchDate?: string;       // CACHE: Bir sonraki maç tarihi
  
  // ============================================
  // DURUM
  // ============================================
  status: 'active' | 'inactive'; // Aktif/Pasif
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 7. MATCH (matches collection)
// ============================================

/**
 * COLLECTION: matches
 * AÇIKLAMA: Maç (League veya Friendly)
 * İLİŞKİLER: league, season, fixture (league için) veya organizer (friendly için)
 * CACHE: totalComments, totalRatings, ratingSummary, mvp
 */
export interface IMatch {
  id: string;
  type: MatchType;              // LEAGUE veya FRIENDLY
  
  // ============================================
  // İLİŞKİLER
  // ============================================
  // League Match için:
  leagueId?: string;            // Lig ID (→ leagues) - LEAGUE için zorunlu
  fixtureId?: string;           // Fixture ID (→ fixtures) - LEAGUE için zorunlu
  seasonId?: string;            // Sezon ID (→ seasons) - LEAGUE için zorunlu
  
  // Friendly Match için:
  organizerId?: string;         // Organize eden oyuncu ID - FRIENDLY için zorunlu
  linkedLeagueId?: string;      // Bağlı lig (opsiyonel - friendly + lig entegrasyonu)
  
  // ============================================
  // TEMEL BİLGİLER
  // ============================================
  title: string;                // Maç başlığı
  sportType: SportType;         // Hangi spor
  description?: string;         // Açıklama
  
  // ============================================
  // ZAMANLAMA
  // ============================================
  schedule: {
    registrationStart: Date;    // Kayıt başlangıç
    registrationEnd: Date;      // Kayıt bitiş
    matchStart: Date;           // Maç başlangıç
    matchEnd: Date;             // Maç bitiş
  };
  
  // ============================================
  // KADRO AYARLARI
  // Fixture'dan inherit edilir, özelleştirilebilir
  // ============================================
  squad: {
    totalPlayers: number;
    reservePlayers: number;
    minPlayersToStart: number;
  };
  
  // ============================================
  // OYUNCU YÖNETİMİ (ÖNCELİK SİSTEMİ)
  // ============================================
  players: {
    // 1️⃣ Premium (Kayıt olursa kadronun başına geçer)
    premium: PlayerListConfig;  // Fixture'dan inherit + özelleştirme
    
    // 2️⃣ Direct (Otomatik kadroda, kayıt beklenmez)
    direct: PlayerListConfig;   // Fixture'dan inherit + özelleştirme
    
    // 3️⃣ Misafir (Sadece bu maç için)
    guests: string[];           // Kadronun sonuna eklenir
    
    // 4️⃣ Kayıtlı (Normal kayıt olanlar, sıraya göre)
    registered: Array<{
      playerId: string;
      registeredAt: Date;
      preferredPosition?: string;
    }>;
    
    // 5️⃣ Yedekler (Kadro dolarsa buraya alınır)
    reserves: string[];
    
    // Takımlar (Organizatör oluşturur)
    teams?: {
      team1: Array<{
        playerId: string;
        position?: string;      // Atanan pozisyon
      }>;
      team2: Array<{
        playerId: string;
        position?: string;
      }>;
    };
  };
  
  // ============================================
  // YETKİLER
  // ============================================
  permissions: {
    organizers: string[];       // Maç organizatörleri
    teamBuilders: string[];     // Takım kurma yetkisi olanlar
  };
  
  // ============================================
  // LOKASYON VE ÖDEME
  // Fixture'dan farklı olabilir (maça özel özelleştirme)
  // ============================================
  venue?: {
    location: string;
    pricePerPlayer: number;
    payment: {
      iban: string;
      accountName: string;
    };
  };
  
  // ============================================
  // SKOR
  // ============================================
  score?: {
    team1: number;
    team2: number;
    scorers: Array<{
      playerId: string;
      goals: number;
      assists: number;
      confirmed: boolean;       // Organizatör onayı
    }>;
  };
  
  // ============================================
  // ÖDEME
  // ============================================
  payments: Array<{
    playerId: string;
    amount: number;
    paid: boolean;
    paidAt?: Date;
    confirmedBy?: string;       // Onaylayan organizatör ID
  }>;
  
  // ============================================
  // MVP (Hybrid - Basit)
  // ============================================
  mvp?: {
    playerId: string;           // MVP oyuncu ID
    calculatedAt: string;       // Hesaplama zamanı
    autoCalculated: boolean;    // Otomatik mi hesaplandı
  };
  
  // ============================================
  // DURUM
  // ============================================
  status: MatchStatus;
  
  // ============================================
  // FRIENDLY AYARLARI
  // ============================================
  friendlySettings?: {
    isPublic: boolean;          // Herkes görebilir mi
    invitedPlayerIds?: string[]; // Özel davetliler
    affectsStats: boolean;      // İstatistikleri etkiler mi
    affectsStandings: boolean;  // Puan durumunu etkiler mi
  };
  
  // ============================================
  // CACHE
  // ============================================
  totalComments?: number;       // CACHE: Toplam yorum sayısı
  totalRatings?: number;        // CACHE: Toplam rating sayısı
  
  // Rating özeti (CACHE - Performans için)
  ratingSummary?: {
    enabled: boolean;           // Rating sistemi aktif mi
    totalRatings: number;       // Toplam rating sayısı
    averageRating: number;      // Genel ortalama
    participationRate: number;  // Kaç oyuncu rating verdi (%)
    
    // Detaylar (Opsiyonel - admin panel için)
    details?: {
      bySource: {
        fromTeammates: { average: number; count: number };
        fromOpponents: { average: number; count: number };
      };
      topRated: Array<{
        playerId: string;
        playerName: string; // CACHE
        averageRating: number;
        isTeam1: boolean;
      }>;
    };
    
    lastCalculated: string;     // Son hesaplama zamanı
  };
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 8. STANDINGS (standings collection)
// ============================================

/**
 * COLLECTION: standings
 * AÇIKLAMA: Puan durumu (Sezon bazlı)
 * İLİŞKİLER: league, season
 * CACHE: standings array içindeki playerName, performance metrikleri
 */
export interface IStandings {
  id: string;
  leagueId: string;             // Hangi lig (→ leagues)
  seasonId: string;             // Hangi sezon (→ seasons)
  
  // ============================================
  // PUAN DURUMU
  // ============================================
  standings: Array<{
    playerId: string;
    playerName: string;         // CACHE: Oyuncu adı
    
    // Lig İstatistikleri (Puan durumunu etkiler)
    league: {
      played: number;           // Oynadığı maç
      won: number;              // Kazandığı
      drawn: number;            // Berabere
      lost: number;             // Kaybetti
      goals: number;            // Attığı gol
      goalsAgainst: number;     // Yediği gol
      goalDifference: number;   // Averaj (goals - goalsAgainst)
      assists: number;          // Asist
      points: number;           // Puan (won*3 + drawn*1)
    };
    
    // Friendly İstatistikleri (Sadece bilgi amaçlı)
    friendly?: {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goals: number;
      assists: number;
    };
    
    // Performans Metrikleri (CACHE)
    performance: {
      rating: number;           // CACHE: Ortalama rating
      totalRatingsReceived: number; // CACHE: Kaç kez puanlandı
      mvpCount: number;         // CACHE: MVP sayısı
      mvpRate: number;          // CACHE: MVP oranı (%)
      attendanceRate: number;   // CACHE: Katılım oranı (%)
      form: string;             // CACHE: Son 5 maç formu ("WWDLW")
      ratingTrend: 'up' | 'stable' | 'down'; // CACHE: Rating trendi
    };
  }>;
  
  // ============================================
  // META
  // ============================================
  lastUpdated: string;          // Son güncelleme zamanı
}

// ============================================
// 9. PLAYER STATS (player_stats collection)
// ============================================

/**
 * COLLECTION: player_stats
 * AÇIKLAMA: Oyuncu istatistikleri (Sezon + Lig bazlı)
 * İLİŞKİLER: player, league, season
 * CACHE: Hesaplanmış metrikler (goalsPerMatch, winRate vb.)
 */
export interface IPlayerStats {
  id: string;
  playerId: string;             // Hangi oyuncu (→ users)
  leagueId: string;             // Hangi lig (→ leagues)
  seasonId: string;             // Hangi sezon (→ seasons)
  
  // ============================================
  // LİG İSTATİSTİKLERİ
  // ============================================
  league: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    points: number;
    
    // Hesaplanmış metrikler (CACHE)
    goalsPerMatch: number;      // CACHE: goals / matches
    assistsPerMatch: number;    // CACHE: assists / matches
    winRate: number;            // CACHE: (wins / matches) * 100
    cleanSheets?: number;       // Gol yemeden kazanılan maçlar
  };
  
  // ============================================
  // FRIENDLY İSTATİSTİKLERİ
  // ============================================
  friendly: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    
    // Hesaplanmış metrikler (CACHE)
    goalsPerMatch: number;      // CACHE
    assistsPerMatch: number;    // CACHE
    winRate: number;            // CACHE
  };
  
  // ============================================
  // TOPLAM (League + Friendly)
  // ============================================
  total: {
    matches: number;            // CACHE: league + friendly
    goals: number;              // CACHE
    assists: number;            // CACHE
    points: number;             // Sadece league puanı
  };
  
  // ============================================
  // RATING & PERFORMANS
  // ============================================
  rating: {
    average: number;            // Ortalama rating (1-5)
    totalReceived: number;      // Kaç kez puanlandı
    
    // Kategorik (varsa)
    categories?: {
      skill: number;
      teamwork: number;
      sportsmanship: number;
      effort: number;
    };
    
    // Son performans (CACHE)
    lastFiveRatings: number[];  // Son 5 maçın rating'leri
    trend: 'improving' | 'stable' | 'declining'; // CACHE: Trend
    
    // Kaynak bazlı (CACHE)
    fromTeammates: {
      average: number;
      count: number;
    };
    fromOpponents: {
      average: number;
      count: number;
    };
  };
  
  // ============================================
  // MVP İSTATİSTİKLERİ
  // ============================================
  mvp: {
    count: number;              // Kaç kez MVP seçildi
    rate: number;               // CACHE: MVP oranı (count/matches * 100)
    lastMvpDate?: string;       // Son MVP tarihi
  };
  
  // ============================================
  // KATILIM
  // ============================================
  attendance: {
    invited: number;            // Kaç maça davet edildi
    played: number;             // Kaç maça katıldı
    rate: number;               // CACHE: (played / invited) * 100
  };
  
  // ============================================
  // POZİSYON ANALİZİ (Opsiyonel)
  // ============================================
  positions?: Record<string, {
    matches: number;
    goals: number;
    assists: number;
    rating: number;
  }>;
  
  // ============================================
  // META
  // ============================================
  lastUpdated: string;
}

// ============================================
// 10. MATCH RATING (ratings collection)
// ============================================

/**
 * COLLECTION: ratings
 * AÇIKLAMA: Maç sonrası oyuncu puanlaması
 * İLİŞKİLER: match, rater (player), rated player
 * CACHE: Yok
 */
export interface IMatchRating {
  id: string;
  matchId: string;              // Hangi maç (→ matches)
  matchType: MatchType;         // League veya Friendly
  leagueId?: string;            // Query için (→ leagues)
  seasonId?: string;            // Query için (→ seasons)
  
  // ============================================
  // PUANLAMA
  // ============================================
  raterId: string;              // Puanlayan oyuncu (→ users)
  ratedPlayerId: string;        // Puanlanan oyuncu (→ users)
  
  rating: number;               // 1-5 yıldız
  
  // Kategorik puanlama (opsiyonel)
  categories?: {
    skill?: number;             // Beceri (1-5)
    teamwork?: number;          // Takım çalışması (1-5)
    sportsmanship?: number;     // Sportmenlik (1-5)
    effort?: number;            // Çaba (1-5)
  };
  
  comment?: string;             // Opsiyonel yorum
  isAnonymous: boolean;         // Anonim mi
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 11. MATCH COMMENT (comments collection)
// ============================================

/**
 * COLLECTION: comments
 * AÇIKLAMA: Maç yorumları (Genel yorumlar, oyuncu özelinde değil)
 * İLİŞKİLER: match, player
 * CACHE: playerName, playerPhoto (gösterim için)
 */
export interface IMatchComment {
  id: string;
  matchId: string;              // Hangi maç (→ matches)
  matchType: MatchType;
  
  // ============================================
  // YORUM
  // ============================================
  playerId: string;             // Yorum yapan (→ users)
  playerName: string;           // CACHE: Oyuncu adı
  playerPhoto?: string;         // CACHE: Profil fotoğrafı
  
  comment: string;              // Yorum içeriği
  type: 'general' | 'highlight' | 'improvement'; // Yorum türü
  
  // ============================================
  // MODERASYON
  // ============================================
  isApproved: boolean;          // Organizatör onayı
  approvedBy?: string;          // Onaylayan organizatör ID
  approvedAt?: string;
  
  // ============================================
  // REAKSİYON
  // ============================================
  likes: string[];              // Like atan oyuncu ID'leri
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 12. MATCH INVITATION (invitations collection)
// ============================================

/**
 * COLLECTION: invitations
 * AÇIKLAMA: Maça davet sistemi
 * İLİŞKİLER: match, inviter, invitee
 * CACHE: inviterName, inviteeName (gösterim için)
 */
export interface IMatchInvitation {
  id: string;
  matchId: string;              // Hangi maç (→ matches)
  matchType: MatchType;
  
  // ============================================
  // DAVET
  // ============================================
  inviterId: string;            // Davet eden (→ users)
  inviterName: string;          // CACHE: Davet eden adı
  
  inviteeId: string;            // Davet edilen (→ users)
  inviteeName: string;          // CACHE: Davet edilen adı
  
  // ============================================
  // DURUM
  // ============================================
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  
  message?: string;             // Davet mesajı
  
  // ============================================
  // META
  // ============================================
  sentAt: string;
  respondedAt?: string;
  expiresAt?: string;
}

// ============================================
// 13. NOTIFICATION (notifications collection)
// ============================================

/**
 * COLLECTION: notifications
 * AÇIKLAMA: Kullanıcı bildirimleri
 * İLİŞKİLER: user, related entity (match/league/season)
 * CACHE: Yok
 */
export interface INotification {
  id: string;
  userId: string;               // Bildirim alacak kullanıcı (→ users)
  
  // ============================================
  // BİLDİRİM TİPİ
  // ============================================
  type: 
    | 'match_invitation'        // Maça davet
    | 'match_reminder'          // Maç hatırlatması
    | 'team_assignment'         // Takıma atandı
    | 'payment_reminder'        // Ödeme hatırlatması
    | 'rating_request'          // Rating talebi
    | 'mvp_announcement'        // MVP seçildi
    | 'season_start'            // Sezon başladı
    | 'season_end';             // Sezon bitti
  
  // ============================================
  // İÇERİK
  // ============================================
  title: string;
  message: string;
  
  // İlişkili veri
  relatedId?: string;           // matchId, leagueId, seasonId vb.
  relatedType?: 'match' | 'league' | 'season' | 'player';
  
  // ============================================
  // DURUM
  // ============================================
  read: boolean;
  readAt?: string;
  
  // ============================================
  // AKSİYON
  // ============================================
  actionUrl?: string;           // Tıklanınca gidilecek URL
  actionLabel?: string;         // Buton etiketi
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
}

// ============================================
// 14. ACTIVITY LOG (activity_logs collection)
// ============================================

/**
 * COLLECTION: activity_logs
 * AÇIKLAMA: Sistem aktivite kayıtları (audit trail)
 * İLİŞKİLER: user, entity
 * CACHE: userName, entityName (gösterim için)
 */
export interface IActivityLog {
  id: string;
  
  // ============================================
  // KİM
  // ============================================
  userId: string;               // İşlemi yapan (→ users)
  userName: string;             // CACHE: Kullanıcı adı
  
  // ============================================
  // NE
  // ============================================
  action: 
    | 'league_created'
    | 'match_created'
    | 'match_registered'
    | 'team_assigned'
    | 'score_submitted'
    | 'payment_confirmed'
    | 'rating_given'
    | 'comment_posted'
    | 'mvp_awarded';
  
  // ============================================
  // NEREDE
  // ============================================
  entityType: 'league' | 'season' | 'fixture' | 'match' | 'player';
  entityId: string;
  entityName?: string;          // CACHE: Entity adı
  
  // ============================================
  // DETAY
  // ============================================
  details?: Record<string, any>; // Ek bilgiler (JSON)
  
  // ============================================
  // META
  // ============================================
  timestamp: string;
  ipAddress?: string;
}

// ============================================
// 15. APP CONFIG (app_config collection)
// ============================================

/**
 * COLLECTION: app_config
 * AÇIKLAMA: Global uygulama ayarları (SINGLETON - tek döküman)
 * ID: 'main'
 * CACHE: Yok
 */
export interface IAppConfig {
  id: string;                   // 'main' (sabit)
  
  // ============================================
  // UYGULAMA BİLGİLERİ
  // ============================================
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    maintenanceMode: boolean;
    maintenanceMessage?: string;
  };
  
  // ============================================
  // ÖZELLİK FLAGLER (Feature Flags)
  // ============================================
  features: {
    friendlyMatches: boolean;
    ratingSystem: boolean;
    commentSystem: boolean;
    paymentTracking: boolean;
    mvpSystem: boolean;
    notifications: boolean;
    invitations: boolean;
    multiLeague: boolean;       // Kullanıcı birden fazla lige katılabilir mi
  };
  
  // ============================================
  // VARSAYILAN DEĞERLER
  // ============================================
  defaults: {
    seasonDuration: number;             // 180 gün
    pointsForWin: number;               // 3
    pointsForDraw: number;              // 1
    pointsForLoss: number;              // 0
    minPlayersToStart: number;          // 8
    registrationDeadlineHours: number;  // Maç başlamadan kaç saat önce kayıt kapanır
    autoArchiveMonths: number;          // 12 ay
  };
  
  // ============================================
  // LİMİTLER
  // ============================================
  limits: {
    maxLeaguesPerUser: number;          // 5
    maxPlayersPerLeague: number;        // 100
    maxMatchesPerDay: number;           // 10
    maxCommentsPerMatch: number;        // 50
    maxInvitationsPerMatch: number;     // 20
  };
  
  // ============================================
  // BİLDİRİM AYARLARI
  // ============================================
  notifications: {
    enabled: boolean;
    channels: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    timings: {
      matchReminder: number;            // Maçtan kaç saat önce (24)
      paymentReminder: number;          // Maçtan kaç saat önce (48)
      ratingRequest: number;            // Maç bitiminden kaç saat sonra (2)
    };
  };
  
  // ============================================
  // E-POSTA ŞABLONLARI
  // ============================================
  emailTemplates: {
    matchInvitation: {
      subject: string;
      enabled: boolean;
    };
    matchReminder: {
      subject: string;
      enabled: boolean;
    };
    paymentReminder: {
      subject: string;
      enabled: boolean;
    };
    seasonReport: {
      subject: string;
      enabled: boolean;
    };
  };
  
  // ============================================
  // SOSYAL MEDYA
  // ============================================
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  
  // ============================================
  // İLETİŞİM
  // ============================================
  contact: {
    email: string;
    phone?: string;
    supportEmail: string;
  };
  
  // ============================================
  // META
  // ============================================
  lastUpdated: string;
  updatedBy: string;
}

// ============================================
// 16. USER SETTINGS (user_settings collection)
// ============================================

/**
 * COLLECTION: user_settings
 * AÇIKLAMA: Kullanıcı özel ayarları
 * İLİŞKİLER: user (id = userId)
 * CACHE: Yok
 */
export interface IUserSettings {
  id: string;                   // userId ile aynı
  userId: string;
  
  // ============================================
  // PROFİL TERCİHLERİ
  // ============================================
  profile: {
    displayName?: string;       // Takma ad
    showEmail: boolean;
    showPhone: boolean;
    showBirthDate: boolean;
  };
  
  // ============================================
  // BİLDİRİM TERCİHLERİ
  // ============================================
  notifications: {
    email: {
      matchInvitations: boolean;
      matchReminders: boolean;
      teamAssignments: boolean;
      paymentReminders: boolean;
      ratingRequests: boolean;
      mvpAnnouncements: boolean;
      seasonUpdates: boolean;
      weeklyDigest: boolean;
    };
    push: {
      matchInvitations: boolean;
      matchReminders: boolean;
      teamAssignments: boolean;
      paymentReminders: boolean;
      ratingRequests: boolean;
      mvpAnnouncements: boolean;
    };
    sms: {
      matchReminders: boolean;
      urgentUpdates: boolean;
    };
  };
  
  // ============================================
  // GİZLİLİK
  // ============================================
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showStats: boolean;
    showRating: boolean;
    allowInvitations: boolean;
    allowFriendRequests: boolean;
  };
  
  // ============================================
  // OYUN TERCİHLERİ
  // ============================================
  preferences: {
    favoritePositions: Partial<Record<SportType, string[]>>;
    availableDays: number[];            // 0-6 (Pazar-Cumartesi)
    preferredTimes: {
      morning: boolean;                 // 06:00-12:00
      afternoon: boolean;               // 12:00-18:00
      evening: boolean;                 // 18:00-00:00
    };
    maxDistanceKm?: number;             // Maks. saha mesafesi
  };
  
  // ============================================
  // GÖRÜNÜM AYARLARI
  // ============================================
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: 'tr' | 'en';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '24h' | '12h';
  };
  
  // ============================================
  // QUICK ACTIONS (Sık Kullanılan - CACHE)
  // ============================================
  quickActions?: {
    favoriteLeagues: string[];          // CACHE: Favori lig ID'leri
    recentMatches: string[];            // CACHE: Son 5 maç ID'si
    frequentPlayers: string[];          // CACHE: Sık oynadığı oyuncular
  };
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 17. LEAGUE SETTINGS (league_settings collection)
// ============================================

/**
 * COLLECTION: league_settings
 * AÇIKLAMA: Lig özel ayarları ve kuralları
 * İLİŞKİLER: league (id = leagueId)
 * CACHE: Yok
 */
export interface ILeagueSettings {
  id: string;                   // leagueId ile aynı
  leagueId: string;
  
  // ============================================
  // GENEL KURALLAR
  // ============================================
  rules: {
    lateArrivalPenalty?: number;        // Geç gelme cezası (TL)
    absentWithoutNoticePenalty?: number; // Haber vermeden gelmeme cezası
    yellowCardFine?: number;
    redCardFine?: number;
    minAttendanceRate?: number;         // Min katılım oranı (%)
  };
  
  // ============================================
  // MAÇ KURALLARI
  // ============================================
  matchRules: {
    allowGuestPlayers: boolean;
    maxGuestPlayersPerMatch: number;
    guestPlayerPriceMultiplier: number; // 1.5 = %50 fazla
    autoAssignTeams: boolean;           // Algoritma ile otomatik takım kur
    teamBalanceAlgorithm: 'random' | 'rating' | 'position';
  };
  
  // ============================================
  // KAYIT KURALLARI
  // ============================================
  registration: {
    allowLateRegistration: boolean;
    lateRegistrationDeadlineHours: number;
    requirePaymentForRegistration: boolean;
    autoConfirmPayment: boolean;        // Manuel onay gerektirme
    cancellationDeadlineHours: number;
  };
  
  // ============================================
  // SKOR & İSTATİSTİK KURALLARI
  // ============================================
  scoring: {
    requireScoreConfirmation: boolean;  // Skor girişi onay gerektirir mi
    scoreConfirmationTimeoutHours: number;
    allowPlayerSelfReporting: boolean;  // Oyuncular kendi gollerini girebilir mi
  };
  
  // ============================================
  // RATING KURALLARI
  // ============================================
  rating: {
    enabled: boolean;
    mandatory: boolean;                 // Zorunlu mu
    anonymous: boolean;                 // Anonim mi
    ratingDeadlineHours: number;
    minRatingsForMVP: number;           // MVP için min rating sayısı
    allowCategoryRating: boolean;       // Kategorik puanlama
  };
  
  // ============================================
  // YORUM KURALLARI
  // ============================================
  comments: {
    enabled: boolean;
    requireApproval: boolean;
    allowLikes: boolean;
    maxLength: number;
  };
  
  // ============================================
  // ÖDEME AYARLARI
  // ============================================
  payment: {
    defaultIban?: string;
    defaultAccountName?: string;
    defaultPricePerPlayer: number;
    currency: 'TRY' | 'USD' | 'EUR';
    allowInstallment: boolean;
    paymentMethods: ('cash' | 'bank_transfer' | 'credit_card')[];
  };
  
  // ============================================
  // WEBHOOK & INTEGRATIONS
  // ============================================
  integrations?: {
    googleCalendar: boolean;
    googleSheets: boolean;
    whatsapp: boolean;
    slack: boolean;
  };
  
  // ============================================
  // META
  // ============================================
  updatedAt: string;
  updatedBy: string;
}

// ============================================
// 18. SYSTEM LOG (system_logs collection)
// ============================================

/**
 * COLLECTION: system_logs
 * AÇIKLAMA: Sistem hata ve bilgi logları
 * İLİŞKİLER: user (optional)
 * CACHE: Yok
 */
export interface ISystemLog {
  id: string;
  
  // ============================================
  // LOG SEVİYESİ
  // ============================================
  level: 'info' | 'warning' | 'error' | 'critical';
  
  // ============================================
  // KATEGORİ
  // ============================================
  category: 
    | 'auth'
    | 'match'
    | 'payment'
    | 'notification'
    | 'calculation'
    | 'integration'
    | 'security';
  
  // ============================================
  // MESAJ
  // ============================================
  message: string;
  
  // ============================================
  // DETAY
  // ============================================
  details?: {
    userId?: string;
    leagueId?: string;
    matchId?: string;
    error?: any;
    stackTrace?: string;
    request?: any;
    response?: any;
  };
  
  // ============================================
  // META
  // ============================================
  timestamp: string;
  source: string;               // 'web' | 'api' | 'cron' | 'webhook'
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// 19. FAQ (faqs collection)
// ============================================

/**
 * COLLECTION: faqs
 * AÇIKLAMA: Sıkça sorulan sorular
 * İLİŞKİLER: Yok
 * CACHE: views, helpful, notHelpful (istatistik için)
 */
export interface IFAQ {
  id: string;
  
  // ============================================
  // İÇERİK
  // ============================================
  question: string;
  answer: string;
  
  // ============================================
  // KATEGORİ
  // ============================================
  category: 
    | 'general'
    | 'league'
    | 'match'
    | 'payment'
    | 'rating'
    | 'account';
  
  // ============================================
  // ÖNCELİK & GÖRÜNÜRLÜK
  // ============================================
  priority: number;             // Sıralama için (1-100)
  isPublished: boolean;
  
  // ============================================
  // İSTATİSTİK (CACHE)
  // ============================================
  views: number;                // CACHE: Görüntülenme sayısı
  helpful: number;              // CACHE: Faydalı bulanlar
  notHelpful: number;           // CACHE: Faydalı bulmayanlar
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

// ============================================
// 20. ANNOUNCEMENT (announcements collection)
// ============================================

/**
 * COLLECTION: announcements
 * AÇIKLAMA: Duyurular (Global veya lig özelinde)
 * İLİŞKİLER: league (optional), users (optional)
 * CACHE: stats (views, clicks, dismissed)
 */
export interface IAnnouncement {
  id: string;
  
  // ============================================
  // İÇERİK
  // ============================================
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  
  // ============================================
  // HEDEF KİTLE
  // ============================================
  target: {
    scope: 'global' | 'league' | 'users';
    leagueIds?: string[];       // Sadece bu liglere göster
    userIds?: string[];         // Sadece bu kullanıcılara göster
  };
  
  // ============================================
  // GÖRÜNÜM
  // ============================================
  display: {
    showOnHome: boolean;
    showAsPopup: boolean;
    showInLeague: boolean;
    dismissable: boolean;
  };
  
  // ============================================
  // ZAMANLAMA
  // ============================================
  schedule: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  
  // ============================================
  // AKSİYON
  // ============================================
  action?: {
    label: string;
    url: string;
  };
  
  // ============================================
  // İSTATİSTİK (CACHE)
  // ============================================
  stats: {
    views: number;              // CACHE
    clicks: number;             // CACHE
    dismissed: number;          // CACHE
  };
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

// ============================================
// 21. FEEDBACK (feedbacks collection)
// ============================================

/**
 * COLLECTION: feedbacks
 * AÇIKLAMA: Kullanıcı geri bildirimleri
 * İLİŞKİLER: user
 * CACHE: userName, userEmail (gösterim için)
 */
export interface IFeedback {
  id: string;
  
  // ============================================
  // KULLANICI
  // ============================================
  userId: string;
  userName: string;             // CACHE
  userEmail: string;            // CACHE
  
  // ============================================
  // FEEDBACK TİPİ
  // ============================================
  type: 'bug' | 'feature' | 'improvement' | 'complaint' | 'other';
  
  // ============================================
  // İÇERİK
  // ============================================
  title: string;
  description: string;
  
  // İlgili Sayfa/Özellik
  page?: string;
  feature?: string;
  
  // ============================================
  // EKLER
  // ============================================
  attachments?: string[];       // URL'ler
  screenshots?: string[];
  
  // ============================================
  // DURUM
  // ============================================
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // ============================================
  // YANIT
  // ============================================
  response?: {
    message: string;
    respondedBy: string;
    respondedAt: string;
  };
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  resolvedAt?: string;
  
  // ============================================
  // SİSTEM BİLGİSİ (Debug için)
  // ============================================
  systemInfo?: {
    browser: string;
    os: string;
    device: string;
    appVersion: string;
  };
}

// ============================================
// 22. PLAYER PROFILE (player_profiles collection)
// ============================================

/**
 * COLLECTION: player_profiles
 * AÇIKLAMA: Oyuncu genel profil özeti (Tüm ligler arası)
 * İLİŞKİLER: player
 * CACHE: Tüm alan cache (hesaplanmış değerler)
 */
export interface IPlayerProfile {
  id: string;                   // playerId ile aynı
  playerId: string;
  
  // ============================================
  // GENEL İSTATİSTİKLER (CACHE - Tüm ligler)
  // ============================================
  overall: {
    totalLeagues: number;       // CACHE: Kaç ligde oynadı
    totalMatches: number;       // CACHE: Toplam maç
    totalGoals: number;         // CACHE: Toplam gol
    totalAssists: number;       // CACHE: Toplam asist
    totalMVPs: number;          // CACHE: Toplam MVP
    averageRating: number;      // CACHE: Genel ortalama rating
  };
  
  // ============================================
  // LİG BAZLI ÖZET (CACHE)
  // ============================================
  leagueSummaries: Array<{
    leagueId: string;
    leagueName: string;         // CACHE: Lig adı
    sportType: string;
    
    stats: {
      matches: number;          // CACHE
      wins: number;             // CACHE
      goals: number;            // CACHE
      assists: number;          // CACHE
      mvps: number;             // CACHE
      rating: number;           // CACHE
    };
    
    isActive: boolean;
    joinedAt: string;
    lastPlayedAt?: string;
  }>;
  
  // ============================================
  // BAŞARILAR / ROZETLER (CACHE)
  // ============================================
  achievements?: Array<{
    id: string;
    type: 'top_scorer' | 'most_mvp' | 'perfect_attendance' | 'veteran' | 'rising_star';
    name: string;
    description: string;
    earnedAt: string;
    leagueId?: string;
    seasonId?: string;
  }>;
  
  // ============================================
  // TERCİHLER VE ANALİZ
  // ============================================
  preferences: {
    favoriteSports: string[];
    preferredPositions: Record<string, string[]>;
    availableDays: number[];
    preferredTimes: string[];
  };
  
  // ============================================
  // OYUN TARZI ANALİZİ (CACHE - ML ile hesaplanabilir)
  // ============================================
  playStyle?: {
    offensive: number;          // CACHE: 0-100 (Ofansif eğilim)
    defensive: number;          // CACHE: 0-100 (Defansif eğilim)
    teamPlayer: number;         // CACHE: 0-100 (Takım oyuncusu)
    consistent: number;         // CACHE: 0-100 (Tutarlılık)
  };
  
  // ============================================
  // SOSYAL
  // ============================================
  social?: {
    friendIds: string[];
    blockedIds: string[];
    followersCount: number;     // CACHE
    followingCount: number;     // CACHE
  };
  
  // ============================================
  // META
  // ============================================
  lastUpdated: string;
}

// ============================================
// 23. PLAYER RATING PROFILE (player_rating_profiles collection)
// ============================================

/**
 * COLLECTION: player_rating_profiles
 * AÇIKLAMA: Oyuncu rating profili (Sezon + Lig bazlı)
 * İLİŞKİLER: player, league (optional), season (optional)
 * CACHE: Tüm alan cache (hesaplanmış rating değerleri)
 */
export interface IPlayerRatingProfile {
  id: string;
  playerId: string;
  leagueId?: string;            // Optional: Lig bazlı profil
  seasonId?: string;            // Optional: Sezon bazlı profil
  
  // ============================================
  // GENEL PROFIL (CACHE - Tüm maç tipleri)
  // ============================================
  overall: {
    overallRating: number;      // CACHE: Tüm maçlardan ortalama
    totalRatingsReceived: number; // CACHE
    mvpCount: number;           // CACHE
    mvpRate: number;            // CACHE: %
  };
  
  // ============================================
  // LİG BAZLI PROFIL (CACHE)
  // ============================================
  league: {
    overallRating: number;      // CACHE: Sadece lig maçları
    totalRatingsReceived: number; // CACHE
    mvpCount: number;           // CACHE
    mvpRate: number;            // CACHE
  };
  
  // ============================================
  // FRIENDLY BAZLI PROFIL (CACHE)
  // ============================================
  friendly: {
    overallRating: number;      // CACHE: Sadece friendly maçları
    totalRatingsReceived: number; // CACHE
    mvpCount: number;           // CACHE
    mvpRate: number;            // CACHE
  };

  // ============================================
  // KATEGORİK ORTALAMALAR (CACHE - varsa)
  // ============================================
  categoryAverages?: {
    skill: number;              // CACHE: Beceri ortalaması
    teamwork: number;           // CACHE: Takım çalışması ortalaması
    sportsmanship: number;      // CACHE: Sportmenlik ortalaması
    effort: number;             // CACHE: Çaba ortalaması
  };
  
  // ============================================
  // TREND ANALİZİ (CACHE)
  // ============================================
  ratingTrend: 'improving' | 'stable' | 'declining'; // CACHE: Son 5 maçın trendi
  lastFiveRatings: number[];    // CACHE: Son 5 maçın rating'leri
  
  // ============================================
  // KAYNAK BAZLI (CACHE)
  // ============================================
  teammateRatings: {
    average: number;            // CACHE: Takım arkadaşlarından ortalama
    count: number;              // CACHE
  };
  opponentRatings: {
    average: number;            // CACHE: Rakiplerden ortalama
    count: number;              // CACHE
  };
  
  // ============================================
  // META
  // ============================================
  lastUpdated: string;
}

// ============================================
// 24. FRIENDLY MATCH CONFIG (friendly_match_configs collection)
// ============================================

/**
 * COLLECTION: friendly_match_configs
 * AÇIKLAMA: Kullanıcının friendly maç oluşturma tercihleri ve şablonları
 * İLİŞKİLER: organizer (user)
 * CACHE: recentSettings (son kullanılanlar)
 */
export interface IFriendlyMatchConfig {
  id: string;                   // organizerId ile aynı
  organizerId: string;          // Kullanıcı ID (→ users)
  
  // ============================================
  // VARSAYILAN AYARLAR (Tekrar kullanım için)
  // ============================================
  defaultSettings: {
    location?: string;          // Varsayılan saha
    staffCount?: number;        // Varsayılan kadro sayısı
    reserveCount?: number;      // Varsayılan yedek sayısı
    pricePerPlayer?: number;    // Varsayılan ücret
    paymentInfo?: {
      iban?: string;
      accountName?: string;
    };
  };
  
  // ============================================
  // FAVORİ OYUNCULAR (Hızlı davet için)
  // ============================================
  favoritePlayerIds: string[];  // Sık oynadığı oyuncular
  
  // ============================================
  // ŞABLON MAÇLAR
  // ============================================
  templates: Array<{
    id: string;
    name: string;               // "Cumartesi Maçı", "Akşam Halısaha"
    sportType: string;
    settings: {
      location: string;
      staffCount: number;
      reserveCount: number;
      pricePerPlayer: number;
      matchDuration: number;
    };
  }>;
  
  // ============================================
  // SON KULLANILANLAR (CACHE - Quick access)
  // ============================================
  recentSettings?: {
    lastLocation?: string;      // CACHE: Son kullanılan saha
    lastPrice?: number;         // CACHE: Son kullanılan ücret
    lastStaffCount?: number;    // CACHE: Son kullanılan kadro sayısı
  };
  
  // ============================================
  // META
  // ============================================
  createdAt: string;
  updatedAt?: string;
}



