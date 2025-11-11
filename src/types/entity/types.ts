// ============================================
// types/index.ts - COMPLETE TYPE DEFINITIONS
// ============================================

// ============================================
// 1. ENUMS & CONSTANTS
// ============================================
import {
  Timestamp,
  FieldValue,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  WhereFilterOp,
  OrderByDirection
} from 'firebase/firestore';
import { FixtureSchedule } from './registrationScheduleType';

export type FirestoreTimestamp = Timestamp;
export type FirestoreFieldValue = FieldValue;
export type FirestoreWhereOperator = WhereFilterOp;
export type FirestoreOrderDirection = OrderByDirection;
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
  displayName?: string;             // "John Doe"

  // ============================================
  // AUTH (Global)
  // ============================================
  email: string;                    // PRIMARY identifier
  emailVerified: boolean;           // Email doğrulandı mı

  // Auth providers
  authProviders: Array<'email' | 'google' | 'apple' | 'facebook'>;

  // Optional phone (2FA için)
  phone?: string;
  phoneVerified?: boolean;

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
  // SETTINGS
  // ============================================
  language?: 'en' | 'tr' | 'es' | 'de' | 'fr';  // Multi-language support
  timezone?: string;                 // User timezone

  // ============================================
  // SECURITY
  // ============================================
  twoFactorEnabled?: boolean;
  lastLogin?: Date;

  // ============================================
  // META
  // ============================================
  createdAt: string;            // Kayıt tarihi
  updatedAt?: string;           // Son güncelleme
  isActive?: boolean;
  isBanned?: boolean;
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
    allowLateRegistration: boolean;          // Geç kayıt izinli mi
    lateRegistrationDeadlineHours: number;   // Maçtan kaç saat önceye kadar izinli 
    requirePaymentForRegistration: boolean;  // Kayıt için ödeme zorunlu mu
    autoConfirmPayment: boolean;             // Ödeme için manuel onay gerektirme!
    cancellationDeadlineHours: number;       // Maçtan kaç saat önce iptal edilebilir.
    //Kadroya girmek için organizatör onayı gerekli mi? for squad management
    requireOrganizerApprovalForSquad: boolean;
  };

  // ============================================
  // SKOR & İSTATİSTİK KURALLARI
  // ============================================
  scoring: {
    requireScoreConfirmation: boolean;  // Skor girişi onay gerektirir mi
    scoreConfirmationTimeoutHours: number; // Onay için süre (saat)
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
  schedule: FixtureSchedule

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
  venue: Venue;

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

    squad: string[]; // Kadrodaki oyuncu ID'leri

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
    teamBuilders?: string[];     // Takım kurma yetkisi olanlar
  };

  // ============================================
  // LOKASYON VE ÖDEME
  // Fixture'dan farklı olabilir (maça özel özelleştirme)
  // ============================================
  venue?: Venue;

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
    method?: 'cash' | 'bank_transfer' | 'credit_card'; //TODO: sonra implemente edilecek
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

  //Cache
  invitationCode?: string; // Maç davet kodu

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
// 11. MATCH COMMENT (match_comments collection)
// ============================================

/**
 * COLLECTION: match_comments
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
    welcomeMessage?: string;
    splashText?: string;
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

// src/types/entity/userSettings.types.ts

export type NotificationChannel = 'email' | 'push' | 'sms' | 'inApp';
export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0: Pazar, 6: Cumartesi
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IUserSettings {
  id: string;                   // userId ile aynı
  userId: string;

  // ============================================
  // PROFİL TERCİHLERİ
  // ============================================
  profile: {
    displayName?: string;              // Takma ad
    bio?: string;                      // Kısa biyografi (max 200 karakter)
    showEmail: boolean;
    showPhone: boolean;
    showBirthDate: boolean;
    showLocation: boolean;             // Şehir/bölge göster
    showSocialMedia: boolean;          // Sosyal medya linklerini göster
    allowProfileSearch: boolean;       // Arama sonuçlarında çık
    verifiedBadge?: boolean;           // Doğrulanmış kullanıcı rozeti (admin)
  };

  // ============================================
  // BİLDİRİM TERCİHLERİ
  // ============================================
  notifications: {
    // Genel bildirim ayarları
    enabled: boolean;                  // Ana anahtar
    frequency: NotificationFrequency;  // Genel sıklık
    quietHours: {
      enabled: boolean;
      daysOfWeek: DayOfWeek[];    // Hangi günler

      start: string;                   // "22:00"
      end: string;                     // "08:00"
    };

    // Email bildirimleri
    email: {
      enabled: boolean;                // Email ana anahtarı
      matchInvitations: boolean;
      matchReminders: boolean;
      matchCancellations: boolean;     // ✨ Yeni
      teamAssignments: boolean;
      paymentReminders: boolean;
      paymentReceived: boolean;        // ✨ Yeni - Ödeme alındı
      ratingRequests: boolean;
      ratingReceived: boolean;         // ✨ Yeni - Rating aldım
      mvpAnnouncements: boolean;
      seasonUpdates: boolean;
      weeklyDigest: boolean;
      monthlyReport: boolean;          // ✨ Yeni - Aylık performans raporu
      leagueInvitations: boolean;      // ✨ Yeni - Lig davetleri
      friendRequests: boolean;         // ✨ Yeni - Arkadaşlık istekleri
      comments: boolean;               // ✨ Yeni - Yorum bildirimleri
      mentions: boolean;               // ✨ Yeni - @mention bildirimleri
      systemUpdates: boolean;          // ✨ Yeni - Sistem güncellemeleri
    };

    // Push bildirimleri
    push: {
      enabled: boolean;                // Push ana anahtarı
      matchInvitations: boolean;
      matchReminders: boolean;
      matchCancellations: boolean;     // ✨ Yeni
      matchStartingSoon: boolean;      // ✨ Yeni - Maç yakında başlıyor (30dk önce)
      teamAssignments: boolean;
      paymentReminders: boolean;
      paymentReceived: boolean;        // ✨ Yeni
      ratingRequests: boolean;
      ratingReceived: boolean;         // ✨ Yeni
      mvpAnnouncements: boolean;
      friendRequests: boolean;         // ✨ Yeni
      comments: boolean;               // ✨ Yeni
      mentions: boolean;               // ✨ Yeni
      chatMessages: boolean;           // ✨ Yeni - Sohbet mesajları
      achievementUnlocked: boolean;    // ✨ Yeni - Başarı kazanıldı
    };

    // SMS bildirimleri
    sms: {
      enabled: boolean;                // SMS ana anahtarı
      matchReminders: boolean;
      matchCancellations: boolean;     // ✨ Yeni
      urgentUpdates: boolean;
      paymentReminders: boolean;       // ✨ Yeni
      emergencyOnly: boolean;          // ✨ Yeni - Sadece acil durumlar
    };

    // In-App bildirimleri
    inApp: {
      enabled: boolean;
      showBadges: boolean;             // ✨ Yeni - Bildirim rozetleri
      playSound: boolean;              // ✨ Yeni - Ses çal
      vibrate: boolean;                // ✨ Yeni - Titreşim
      showPopup: boolean;              // ✨ Yeni - Pop-up göster
      displayDuration: 3 | 5 | 7 | 10; // ✨ Yeni - Gösterim süresi (saniye)
      sound?: 'default' | 'gentle' | 'alert' | 'none'; // ✨ Yeni - Bildirim sesi
      showPreview: boolean;         // ✨ Yeni - Önizleme göster      
      highlightImportant: boolean; // ✨ Yeni - Önemli bildirimleri vurgula
      fullScreenForImportant: boolean; // ✨ Yeni - Önemli bildirimlerde tam ekran göster
    };
  };

  // ============================================
  // GİZLİLİK
  // ============================================
  privacy: {
    whoCanViewProfile: 'everyone' | 'friends' | 'nobody'; // ✨ Yeni - Profil görüntüleme
    profileVisibility: 'public' | 'friends' | 'private';
    showStats: boolean;
    showRating: boolean;
    showAchievements: boolean;         // ✨ Yeni - Başarıları göster
    showMatchHistory: boolean;         // ✨ Yeni - Maç geçmişini göster
    showCurrentLeagues: boolean;       // ✨ Yeni - Aktif ligleri göster
    allowInvitations: boolean;
    allowFriendRequests: boolean;
    allowMessages: 'everyone' | 'friends' | 'nobody'; // ✨ Yeni - Mesaj izinleri
    blockList: string[];               // ✨ Yeni - Engellenmiş kullanıcılar
    dataSharing: {
      analytics: boolean;              // ✨ Yeni - Analitik verisi paylaş
      marketing: boolean;              // ✨ Yeni - Pazarlama izni
      thirdParty: boolean;             // ✨ Yeni - 3. parti servisler
    };
  };

  // ============================================
  // OYUN TERCİHLERİ
  // ============================================
  preferences: {
    // Spor tercihleri
    favoriteSports: SportType[];       // ✨ Yeni - Favori sporlar
    favoritePositions: Partial<Record<SportType, string[]>>;
    skillLevel: Partial<Record<SportType, SkillLevel>>; // ✨ Yeni

    // Zaman tercihleri
    availableDays: DayOfWeek[];        // 0-6 (Pazar-Cumartesi)
    preferredTimes: {
      morning: boolean;                // 06:00-12:00
      afternoon: boolean;              // 12:00-18:00
      evening: boolean;                // 18:00-00:00
      night: boolean;                  // ✨ Yeni - 00:00-06:00
    };

    // Konum tercihleri
    preferredLocations: string[];      // ✨ Yeni - Tercih edilen sahalar/bölgeler
    maxDistanceKm?: number;            // Maks. saha mesafesi
    autoLocationUpdate: boolean;       // ✨ Yeni - Konum otomatik güncelleme

    // Maç tercihleri
    autoAcceptInvitations: boolean;    // ✨ Yeni - Otomatik davet kabul
    autoRegisterToLeagues: boolean;    // ✨ Yeni - Liglere otomatik kayıt
    preferredTeamSize: {               // ✨ Yeni - Tercih edilen takım büyüklüğü
      min?: number;
      max?: number;
    };
    playWithFriendsOnly: boolean;      // ✨ Yeni - Sadece arkadaşlarla oyna

    // Ödeme tercihleri
    paymentMethod: 'cash' | 'card' | 'bank' | 'mixed'; // ✨ Yeni
    autoPayment: boolean;              // ✨ Yeni - Otomatik ödeme
    paymentReminder: {                 // ✨ Yeni - Ödeme hatırlatıcı
      enabled: boolean;
      daysBefore: number;              // Kaç gün önce hatırlat
    };
  };

  // ============================================
  // GÖRÜNÜM AYARLARI
  // ============================================
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor?: string;              // ✨ Yeni - Vurgu rengi (#16a34a)
    language: 'tr' | 'en';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'; // ✨ Genişletildi
    timeFormat: '24h' | '12h';
    currency: 'TRY' | 'USD' | 'EUR';   // ✨ Yeni - Para birimi
    distanceUnit: 'km' | 'mile';       // ✨ Yeni - Mesafe birimi
    fontSize: 'small' | 'medium' | 'large' | 'extraLarge'; // ✨ Yeni - Yazı tipi boyutu

    // List view preferences
    defaultView: 'list' | 'grid' | 'map'; // ✨ Yeni - Varsayılan görünüm
    sortBy: 'date' | 'distance' | 'rating' | 'alphabetical'; // ✨ Yeni
    compactMode: boolean;              // ✨ Yeni - Kompakt mod
    showAvatars: boolean;              // ✨ Yeni - Avatar göster
    animationsEnabled: boolean;        // ✨ Yeni - Animasyonlar
    reducedMotion: boolean;            // ✨ Yeni - Azaltılmış hareket (accessibility)
  };

  // ============================================
  // ERİŞİLEBİLİRLİK (ACCESSIBILITY)
  // ============================================
  accessibility: {
    textSize: 'small' | 'medium' | 'large' | 'extraLarge'; // ✨ Yeni
    colorScheme: 'normal' | 'highContrast' | 'grayscale' | 'colorBlind'; // ✨ Yeni
    highContrast: boolean;             // ✨ Yeni - Yüksek kontrast
    screenReaderEnabled: boolean;      // ✨ Yeni - Ekran okuyucu
    voiceCommands: boolean;            // ✨ Yeni - Sesli komutlar
    hapticFeedback: boolean;           // ✨ Yeni - Dokunsal geri bildirim
    colorBlindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia'; // ✨ Yeni
    boldText: boolean;                // ✨ Yeni - Kalın metin
  };

  // ============================================
  // MAÇ HATIRLATICILAR & TAKVİM
  // ============================================
  calendar: {
    lastSyncedAt?: string;          // ✨ Yeni - Son senkronizasyon zamanı
    syncConfirmedMatches: boolean; // ✨ Yeni - Onaylı maçları senkronize et
    syncLeagueMatches: boolean;   // ✨ Yeni - Lig maçlarını senkronize et
    syncPendingInvites: boolean;  // ✨ Yeni - Bekleyen davetleri senkronize et
    addReminder: boolean;            // ✨ Yeni - Hatırlatıcı ekle
    reminderMinutes: number;   // ✨ Yeni - Hatırlatma süresi (dakika)
    syncWithDevice: boolean;           // ✨ Yeni - Cihaz takvimiyle senkronize
    autoAddMatches: boolean;           // ✨ Yeni - Maçları otomatik ekle
    reminderTimes: number[];           // ✨ Yeni - Hatırlatma zamanları (dakika) [1440, 60, 15]
    syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual'; // ✨ Yeni
    conflictResolution: 'app' | 'calendar' | 'ask'; // ✨ Yeni
  };

  // ============================================
  // SOSYAL ÖZELLIKLER
  // ============================================
  social: {
    autoFollowTeammates: boolean;      // ✨ Yeni - Takım arkadaşlarını otomatik takip et
    shareMatchResults: boolean;        // ✨ Yeni - Maç sonuçlarını paylaş
    showOnlineStatus: boolean;         // ✨ Yeni - Çevrimiçi durumu göster
    allowTagging: boolean;             // ✨ Yeni - Etiketlenmeye izin ver
    defaultPrivacy: 'public' | 'friends' | 'private'; // ✨ Yeni - Varsayılan gizlilik
  };

  // ============================================
  // PERFORMANS & ANALYTICS
  // ============================================
  analytics: {
    trackPerformance: boolean;         // ✨ Yeni - Performans takibi
    weeklyReports: boolean;            // ✨ Yeni - Haftalık raporlar
    monthlyReports: boolean;           // ✨ Yeni - Aylık raporlar
    compareWithFriends: boolean;       // ✨ Yeni - Arkadaşlarla karşılaştır
    goalTracking: boolean;             // ✨ Yeni - Hedef takibi
    showInsights: boolean;             // ✨ Yeni - İçgörüler göster
  };

  // ============================================
  // DATA & STORAGE
  // ============================================
  storage: {
    cacheEnabled: boolean;             // ✨ Yeni - Cache kullan
    offlineMode: boolean;              // ✨ Yeni - Çevrimdışı mod
    autoSync: boolean;                 // ✨ Yeni - Otomatik senkronizasyon
    syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual'; // ✨ Yeni
    dataUsage: 'high' | 'medium' | 'low'; // ✨ Yeni - Veri kullanımı
    downloadOverWiFiOnly: boolean;     // ✨ Yeni - Sadece WiFi'de indir
    clearCacheOnLogout: boolean;       // ✨ Yeni - Çıkışta cache temizle
  };

  // ============================================
  // GÜVENLİK
  // ============================================
  security: {
    biometricLogin: boolean;           // ✨ Yeni - Biyometrik giriş
    twoFactorAuth: boolean;            // ✨ Yeni - İki faktörlü doğrulama
    trustedDevices: string[];          // ✨ Yeni - Güvenilir cihazlar
    loginAlerts: boolean;              // ✨ Yeni - Giriş bildirimleri
    sessionTimeout: number;            // ✨ Yeni - Oturum zaman aşımı (dakika)
    autoLock: boolean;                 // ✨ Yeni - Otomatik kilitleme
    autoLockTimeout: number;           // ✨ Yeni - Otomatik kilit süresi (dakika)
  };

  // ============================================
  // QUICK ACTIONS (Sık Kullanılan - CACHE)
  // ============================================
  quickActions?: {
    favoriteLeagues: string[];         // CACHE: Favori lig ID'leri
    recentMatches: string[];           // CACHE: Son 5 maç ID'si
    frequentPlayers: string[];         // CACHE: Sık oynadığı oyuncular
    pinnedVenues: string[];            // ✨ Yeni - CACHE: Sabitlenmiş sahalar
    savedSearches: Array<{             // ✨ Yeni - Kayıtlı aramalar
      query: string;
      filters: any;
      timestamp: string;
    }>;
    recentActions: Array<{             // ✨ Yeni - Son işlemler
      action: string;
      timestamp: string;
    }>;
  };

  // ============================================
  // BETA FEATURES (Test Özellikleri)
  // ============================================
  beta?: {
    enabledFeatures: string[];         // ✨ Yeni - Aktif beta özellikleri
    optInToNewFeatures: boolean;       // ✨ Yeni - Yeni özellikleri test et
    feedbackConsent: boolean;          // ✨ Yeni - Geri bildirim izni
  };

  // ============================================
  // COACHING & TRAINING (Gelecek özellik)
  // ============================================
  coaching?: {
    receiveCoachingTips: boolean;      // ✨ Yeni - Koçluk ipuçları al
    trainingProgram?: string;          // ✨ Yeni - Antrenman programı ID
    goalsAndTargets: Array<{           // ✨ Yeni - Hedefler
      id: string;
      sport: SportType;
      goal: string;
      target: number;
      current: number;
      deadline?: string;
    }>;
  };

  // ============================================
  // META
  // ============================================
  version: number;                     // ✨ Yeni - Settings versiyonu (migration için)
  createdAt: string;
  updatedAt?: string;
  lastSyncedAt?: string;               // ✨ Yeni - Son senkronizasyon
  migratedFrom?: string;               // ✨ Yeni - Hangi versiyondan migrate edildi
}

// ============================================
// DEFAULT SETTINGS
// ============================================
export const DEFAULT_USER_SETTINGS: Omit<IUserSettings, 'id' | 'userId' | 'createdAt'> = {
  profile: {
    showEmail: false,
    showPhone: false,
    showBirthDate: false,
    showLocation: true,
    showSocialMedia: true,
    allowProfileSearch: true,
  },

  notifications: {
    enabled: true,
    frequency: 'immediate',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    },
    email: {
      enabled: true,
      matchInvitations: true,
      matchReminders: true,
      matchCancellations: true,
      teamAssignments: true,
      paymentReminders: true,
      paymentReceived: true,
      ratingRequests: true,
      ratingReceived: true,
      mvpAnnouncements: true,
      seasonUpdates: true,
      weeklyDigest: false,
      monthlyReport: true,
      leagueInvitations: true,
      friendRequests: true,
      comments: true,
      mentions: true,
      systemUpdates: false,
    },
    push: {
      enabled: true,
      matchInvitations: true,
      matchReminders: true,
      matchCancellations: true,
      matchStartingSoon: true,
      teamAssignments: true,
      paymentReminders: true,
      paymentReceived: true,
      ratingRequests: true,
      ratingReceived: true,
      mvpAnnouncements: true,
      friendRequests: true,
      comments: true,
      mentions: true,
      chatMessages: true,
      achievementUnlocked: true,
    },
    sms: {
      enabled: false,
      matchReminders: false,
      matchCancellations: false,
      urgentUpdates: true,
      paymentReminders: false,
      emergencyOnly: true,
    },
    inApp: {
      enabled: true,
      showBadges: true,
      playSound: true,
      vibrate: true,
      showPopup: true,
      displayDuration: 5,
      sound: 'default',
      showPreview: true,
      highlightImportant: true,
      fullScreenForImportant: false,
    },
  },

  privacy: {
    whoCanViewProfile: 'everyone',
    profileVisibility: 'public',
    showStats: true,
    showRating: true,
    showAchievements: true,
    showMatchHistory: true,
    showCurrentLeagues: true,
    allowInvitations: true,
    allowFriendRequests: true,
    allowMessages: 'friends',
    blockList: [],
    dataSharing: {
      analytics: true,
      marketing: false,
      thirdParty: false,
    },
  },

  preferences: {
    favoriteSports: [],
    favoritePositions: {},
    skillLevel: {},
    availableDays: [1, 2, 3, 4, 5], // Pazartesi-Cuma
    preferredTimes: {
      morning: false,
      afternoon: false,
      evening: true,
      night: false,
    },
    preferredLocations: [],
    maxDistanceKm: 10,
    autoLocationUpdate: true,
    autoAcceptInvitations: false,
    autoRegisterToLeagues: false,
    preferredTeamSize: {},
    playWithFriendsOnly: false,
    paymentMethod: 'cash',
    autoPayment: false,
    paymentReminder: {
      enabled: true,
      daysBefore: 1,
    },
  },

  appearance: {
    theme: 'system',
    language: 'tr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'TRY',
    distanceUnit: 'km',
    defaultView: 'list',
    sortBy: 'date',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true,
    reducedMotion: false,
    fontSize: 'medium',
  },

  accessibility: {
    textSize: 'medium',
    highContrast: false,
    screenReaderEnabled: false,
    voiceCommands: false,
    hapticFeedback: true,
    boldText: false,
    colorScheme: 'normal',
    colorBlindMode: undefined,
  },

  calendar: {
    syncWithDevice: false,
    autoAddMatches: true,
    reminderTimes: [1440, 60, 15], // 1 gün, 1 saat, 15 dakika önce
    syncConfirmedMatches: true,
    syncLeagueMatches: true,
    syncPendingInvites: false,
    addReminder: true,
    reminderMinutes: 15,
    syncFrequency: 'daily',
    conflictResolution: 'ask',
  },

  social: {
    autoFollowTeammates: true,
    shareMatchResults: false,
    showOnlineStatus: true,
    allowTagging: true,
    defaultPrivacy: 'friends',
  },

  analytics: {
    trackPerformance: true,
    weeklyReports: true,
    monthlyReports: true,
    compareWithFriends: true,
    goalTracking: true,
    showInsights: true,
  },

  storage: {
    cacheEnabled: true,
    offlineMode: false,
    autoSync: true,
    syncFrequency: 'realtime',
    dataUsage: 'medium',
    downloadOverWiFiOnly: true,
    clearCacheOnLogout: false,
  },

  security: {
    biometricLogin: false,
    twoFactorAuth: false,
    trustedDevices: [],
    loginAlerts: true,
    sessionTimeout: 30,
    autoLock: true,
    autoLockTimeout: 5,
  },

  quickActions: {
    favoriteLeagues: [],
    recentMatches: [],
    frequentPlayers: [],
    pinnedVenues: [],
    savedSearches: [],
    recentActions: [],
  },

  beta: {
    enabledFeatures: [],
    optInToNewFeatures: false,
    feedbackConsent: true,
  },

  version: 1,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const createDefaultUserSettings = (userId: string): IUserSettings => ({
  id: userId,
  userId,
  ...DEFAULT_USER_SETTINGS,
  createdAt: new Date().toISOString(),
});

export const mergeUserSettings = (
  existing: Partial<IUserSettings>,
  updates: Partial<IUserSettings>
): IUserSettings => ({
  ...DEFAULT_USER_SETTINGS,
  ...existing,
  ...updates,
  updatedAt: new Date().toISOString(),
} as IUserSettings);

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
  id?: string;

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
      affectsStandings: boolean;
      affectsStats: boolean;
      isPublic: boolean;
      paymentInfo?: {
        iban?: string;
        accountName?: string;
      };
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

export interface IDevice {
  id: any;
  playerId?: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  addedAt?: string;
  lastUsed?: string;
  isActive?: boolean;
}
export const TimestampHelpers = {
  toDate: (timestamp: FirestoreTimestamp | Date | any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  },

  toTimestamp: (date: Date): FirestoreTimestamp => {
    return Timestamp.fromDate(date);
  },

  now: (): FirestoreTimestamp => {
    return Timestamp.now();
  },

  serverTimestamp: () => serverTimestamp(),

  increment: (n: number) => increment(n),

  arrayUnion: (...elements: any[]) => arrayUnion(...elements),

  arrayRemove: (...elements: any[]) => arrayRemove(...elements),

  delete: () => deleteField()
};

export interface Venue {
  location: string;               // Saha adresi
  googleMapsUrl?: string;         // Google Maps link (optional)
  pricePerPlayer: number;         // Kişi başı ücret
  payment?: {
    iban?: string;                 // IBAN
    accountName?: string;          // Hesap sahibi
  };
}

// ============================================
// ADDITIONAL ENUMS
// ============================================

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WAIVED = 'waived'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export const SKILL_LEVELS: { value: SkillLevel; label: string; description: string; color: string }[] = [
  {
    value: 'beginner',
    label: 'Başlangıç',
    description: 'Yeni başladım, temel kuralları öğreniyorum',
    color: '#9CA3AF',
  },
  {
    value: 'intermediate',
    label: 'Orta',
    description: 'Düzenli oynuyorum, temel tekniklere hakimim',
    color: '#3B82F6',
  },
  {
    value: 'advanced',
    label: 'İleri',
    description: 'Deneyimliyim, rekabetçi maçlarda oynuyorum',
    color: '#F59E0B',
  },
  {
    value: 'expert',
    label: 'Uzman',
    description: 'Profesyonel veya yarı-profesyonel seviyede',
    color: '#10B981',
  },
];
