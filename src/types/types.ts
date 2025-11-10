// // types.ts

// // ============================================
// // 1. SPORT TYPE ENUM
// // ============================================
// export type SportType =
//   | "Futbol"
//   | "Basketbol"
//   | "Voleybol"
//   | "Tenis"
//   | "Masa Tenisi"
//   | "Badminton";

// // ============================================
// // 2. SPORT CONFIGS
// // ============================================
// export interface SportConfig {
//   emoji: string;
//   name: string;
//   defaultPlayers: number;
//   defaultDuration: number;
//   positions: string[];
//   color: string;
// }

// // ============================================
// // 3. SPORT CONFIG RECORD
// // ============================================
// export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
//   Futbol: {
//     emoji: "⚽",
//     name: "Futbol",
//     defaultPlayers: 10,
//     defaultDuration: 60,
//     positions: ["Kaleci", "Defans", "Orta Saha", "Forvet"],
//     color: "#16a34a",
//   },
//   Basketbol: {
//     emoji: "🏀",
//     name: "Basketbol",
//     defaultPlayers: 10,
//     defaultDuration: 40,
//     positions: ["Guard", "Forward", "Center"],
//     color: "#F59E0B",
//   },
//   Voleybol: {
//     emoji: "🏐",
//     name: "Voleybol",
//     defaultPlayers: 12,
//     defaultDuration: 90,
//     positions: ["Libero", "Pasör", "Smaçör", "Orta Oyuncu"],
//     color: "#2563EB",
//   },
//   Tenis: {
//     emoji: "🎾",
//     name: "Tenis",
//     defaultPlayers: 2,
//     defaultDuration: 90,
//     positions: [],
//     color: "#10B981",
//   },
//   "Masa Tenisi": {
//     emoji: "🏓",
//     name: "Masa Tenisi",
//     defaultPlayers: 2,
//     defaultDuration: 45,
//     positions: [],
//     color: "#8B5CF6",
//   },
//   Badminton: {
//     emoji: "🏸",
//     name: "Badminton",
//     defaultPlayers: 2,
//     defaultDuration: 45,
//     positions: [],
//     color: "#EC4899",
//   },
// };

// // ============================================
// // 4. MATCH TYPE ENUM (YENİ)
// // ============================================
// export enum MatchType {
//   LEAGUE = 'LEAGUE',           // Lig maçı (fikstüre bağlı)
//   FRIENDLY = 'FRIENDLY',       // Dostluk maçı (ligden bağımsız)
//   TOURNAMENT = 'TOURNAMENT'    // Turnuva (gelecek)
// }

// // ============================================
// // 5. LIG (LEAGUE)
// // ============================================
// export interface ILeague {
//   id: any;
//   title: string; // "Architect Halı Saha Ligi"
//   sportType: SportType;
//   spreadSheetId?: string;

//   // Sezon Ayarları
//   seasonDuration?: number; // Sezon süresi (gün cinsinden)
//   seasonStartDate: string; // Sezon başlangıç tarihi (ISO string)
//   seasonEndDate: string; // Sezon bitiş tarihi (ISO string)
//   autoResetStandings: boolean; // Sezon bitince puan durumu sıfırlansın mı
//   canChangeSeason: boolean; // Lig devam ederken sezon değiştirilebilir mi (false = geçmiş tarih olamaz)

//   // Oyuncu Listeleri (Lig Seviyesi)
//   playerIds: string[]; // Lige kayıtlı tüm oyuncular
//   premiumPlayerIds: string[]; // Premium oyuncular (kayıt olursa öncelikli)
//   directPlayerIds: string[]; // Direkt oyuncular (otomatik kadroda)

//   // Yetkililer
//   teamBuildingAuthorityPlayerIds: string[]; // Takım kurma yetkisi olan oyuncular

//   // İlişkiler
//   matchFixtures: Array<IMatchFixture>;

//   // ============================================
//   // YENİ: FRIENDLY MATCH AYARLARI
//   // ============================================
//   settings?: {
//     allowFriendlyMatches?: boolean;        // Lig üyelerine dostluk maçı oluşturma izni
//     friendlyMatchesAffectStats?: boolean;  // Dostluk maçları istatistikleri etkiler mi
//     friendlyMatchesAffectStandings?: boolean; // Dostluk maçları puan durumunu etkiler mi
//     friendlyMatchesRequireApproval?: boolean; // Dostluk maçları admin onayı gerektirir mi
//   };

//   // Meta
//   createdAt: string;
//   createdBy: string; // User ID (Lig sahibi)
// }

// // ============================================
// // 6. FİKSTÜR (FIXTURE)
// // ============================================
// export interface IMatchFixture {
//   id: any;
//   leagueId: any;
//   title: string; // "Salı Maçı"
//   sportType: SportType; // Lig'den inherit

//   // Zamanlama
//   registrationStartTime: Date; // Kayıt başlangıç
//   matchStartTime: Date; // Maç başlangıç
//   matchTotalTimeInMinute: number;

//   // Periyodik Ayarları
//   isPeriodic: boolean; // Rutin mu, tek seferlik mi
//   periodDayCount?: number; // Periyot (7 = Her hafta)

//   // Kadro Ayarları
//   staffPlayerCount: number; // Kadro sayısı (10)
//   reservePlayerCount: number; // Yedek sayısı (2)

//   // Oyuncu Listeleri (Fikstür Seviyesi - Lig'den inherit edilir, özelleştirilebilir)
//   premiumPlayerIds?: string[]; // Fikstür özelinde premium oyuncular
//   directPlayerIds?: string[]; // Fikstür özelinde direkt oyuncular

//   // Yetkililer
//   organizerPlayerIds: string[]; // Fikstür organizatörleri (PlayerID'ler)
//   teamBuildingAuthorityPlayerIds?: string[]; // Fikstür özelinde takım kurma yetkisi

//   // Lokasyon ve Ödeme
//   location: string;
//   pricePerPlayer: number;
//   peterIban: string; // Ödeme alacak kişinin IBAN'ı
//   peterFullName: string; // Ödeme alacak kişinin adı

//   // Durum
//   status: 'Aktif' | 'Pasif';

//   // Form ve Takvim
//   surveyFormId?: string;
//   commentFormId?: string;
//   calendarId?: string;

//   // İlişkiler
//   matchIds: string[]; // Bu fikstüre ait maçlar

//   // Meta
//   createdAt: string;
// }

// // ============================================
// // 7. MAÇ (MATCH)
// // ============================================
// export interface IMatch {
//   id: any;
//   // ============================================
//   // YENİ: MAÇ TİPİ VE İLİŞKİLER
//   // ============================================
//   type: MatchType;                    // 'LEAGUE' | 'FRIENDLY' | 'TOURNAMENT'

//   // League Match için (type === 'LEAGUE')
//   fixtureId?: any;
//   leagueId?: any;                     // Lig ID (fikstürden alınabilir ama cache için)
//   tournamentId?: any;                 // Turnuva ID (gelecek)
//   seasonId?: string;                 // Sezon ID (ligden alınabilir ama cache için)

//   // Friendly Match için (type === 'FRIENDLY')
//   organizerId?: string;               // Maçı organize eden oyuncu (FRIENDLY'de zorunlu)
//   isPublic?: boolean;                 // Public = herkes görebilir/kayıt olabilir
//   invitedPlayerIds?: string[];        // Sadece davetli oyuncular (isPublic=false ise)
//   linkedLeagueId?: any;               // Opsiyonel: Bir lige bağlı friendly match

//   // Ortak Alanlar
//   eventId?: string;
//   title: string; // "Salı Maçı - 15 Ekim 2025"

//   sportType?: SportType;              // YENİ: Friendly maçlar için zorunlu
//   sportPositions?: string[];               // O spora özel pozisyonlar TODO: yeni eklendi maç servisine entegre etilecek

//   // Zamanlama
//   registrationTime: Date; // Kayıt başlangıç
//   registrationEndTime: Date; // Kayıt bitiş
//   matchStartTime: Date;
//   matchEndTime: Date;
//   matchTotalTimeInMinute?: number; //Ligden inherit edilebilir
//   // ============================================
//   // OYUNCU YÖNETİMİ (Öncelik Sırası)
//   // ============================================

//   // 1. Premium Oyuncular (Lig/Fikstür/Maç seviyesinden birleştirilerek gelir)
//   // Kayıt olursa kadronun başına geçer
//   premiumPlayerIds: string[];

//   // 2. Direkt Oyuncular (Lig/Fikstür/Maç seviyesinden birleştirilerek gelir)
//   // Otomatik kadroda, kayıt beklenmiyor
//   directPlayerIds: string[];

//   // 3. Misafir Oyuncular (Sadece maç özelinde eklenir)
//   // Kadronun sonuna veya yedeğe eklenir
//   guestPlayerIds: string[];

//   // 4. Kayıtlı Oyuncular (Normal kayıt olan oyuncular)
//   // Kayıt sırasına göre kadroya alınır
//   registeredPlayerIds: string[];

//   // 5. Yedek Oyuncular
//   // Kadro dolarsa yedek listesine alınır
//   reservePlayerIds: string[];

//   // ============================================
//   // KADRO AYARLARI (FRIENDLY için özelleştirilebilir)
//   // ============================================
//   staffPlayerCount?: number;          // Kadro sayısı (Friendly'de organizatör belirler)
//   reservePlayerCount?: number;        // Yedek sayısı
//   minPlayersToStartMatch?: number;    // Maç başlatmak için minimum oyuncu sayısı
//   maxPlayersAllowed?: number;         // Maksimum kayıtlı oyuncu sayısı

//   // ============================================
//   // TAKIMLAR (Organizatörler veya yetkili oyuncular oluşturur)
//   // ============================================
//   team1PlayerIds?: string[];
//   team2PlayerIds?: string[];

//   // Takım kurulurken belirlenen pozisyonlar (Maç özelinde)
//   playerPositions?: Record<string, string>;
//   // playerId -> position mapping
//   // Örnek: { 
//   //   "player123": "Kaleci", 
//   //   "player456": "Forvet",
//   //   "player789": "Orta Saha" 
//   // }

//   // ============================================
//   // SKOR YÖNETİMİ
//   // ============================================
//   score?: string; // "3-2"
//   team1Score?: number;
//   team2Score?: number;

//   // Gol ve Asist Sistemi
//   goalScorers: Array<{
//     playerId: string;
//     goals: number;
//     assists: number;
//     confirmed: boolean; // Organizatör onayı
//     submittedAt: string; // Giriş zamanı
//   }>;

//   // ============================================
//   // RATING & MVP SYSTEM (UPDATED)
//   // ============================================
//   playerIdOfMatchMVP?: string;        // MVP oyuncu ID
//   mvpCalculatedAt?: string;           // MVP hesaplama zamanı
//   mvpAutoCalculated: boolean;         // Otomatik mi hesaplandı

//   // Rating özeti (performans için cache)
//   ratingsSummary?: {
//     totalRatings: number;             // Toplam puanlama sayısı
//     averageRating: number;            // Ortalama puan
//     participationRate: number;        // Kaç oyuncu puanladı (%)
//     topRatedPlayers: Array<{
//       playerId: string;
//       averageRating: number;
//     }>;
//   };

//   // ============================================
//   // COMMENTS SYSTEM (NEW)
//   // ============================================
//   commentsEnabled: boolean;           // Yorum sistemi aktif mi
//   totalComments?: number;             // Cache: Toplam yorum sayısı

//   // ============================================
//   // ÖDEME YÖNETİMİ
//   // ============================================
//   paymentStatus: Array<{
//     playerId: string;
//     paid: boolean;
//     amount: number;
//     paidAt?: string;
//     confirmedBy?: string; // Organizatör PlayerID
//   }>;

//   // ============================================
//   // YETKİLER (Maç Özelinde Özelleştirilebilir)
//   // ============================================
//   organizerPlayerIds: string[];              // FRIENDLY'de = [organizerId]
//   teamBuildingAuthorityPlayerIds: string[]; // Bu maçta takım kurabilecek oyuncular

//   // ============================================
//   // MAÇ ÖZELİNDE ÖZELLEŞTİRİLEBİLİR ALANLAR
//   // ============================================
//   location?: string; // Fikstür'den farklı olabilir
//   pricePerPlayer?: number; // Fikstür'den farklı olabilir
//   peterIban?: string;
//   peterFullName?: string;

//   // ============================================
//   // DURUM
//   // ============================================
//   status:
//   | 'Oluşturuldu' // İlk oluşturma
//   | 'Kayıt Açık' // Oyuncular kayıt olabilir
//   | 'Kayıt Kapandı' // Kayıtlar kapandı
//   | 'Takımlar Oluşturuldu' // Takımlar belirlendi
//   | 'Oynanıyor' // Maç devam ediyor
//   | 'Skor Bekleniyor' // Organizatör skor girecek
//   | 'Skor Onay Bekliyor' // Gol/asist onay bekliyor
//   | 'Ödeme Bekliyor' // Oyunculardan ödeme bekleniyor
//   | 'Tamamlandı' // Her şey bitti, puan durumu güncellendi
//   | 'İptal Edildi'; // Maç iptal

//   // ============================================
//   // YENİ: FRIENDLY MATCH İSTATİSTİK AYARLARI
//   // ============================================
//   affectsStats?: boolean;              // Bu maç istatistikleri etkiler mi
//   affectsStandings?: boolean;          // Bu maç puan durumunu etkiler mi
//   requiresApproval?: boolean;          // Bu maç organizatör onayı gerektirir mi
//   isApproved?: boolean;                // Organizör onayladı mı
//   approvedBy?: string;                // Onaylayan organizatör ID
//   approvedAt?: string;                // Onaylanma zamanı


//   // Meta
//   matchBoardSheetId?: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// // ============================================
// // 8. PUAN DURUMU (STANDINGS)
// // ============================================
// export interface IStandings {
//   id: any;
//   leagueId: any;
//   seasonId: string; // "season_2025_q1"

//   playerStandings: Array<{
//     playerId: string;
//     playerName: string;

//     // Maç İstatistikleri
//     played: number; // Oynadığı maç
//     won: number; // Kazandığı maç
//     drawn: number; // Berabere
//     lost: number; // Kaybettiği maç

//     // ============================================
//     // YENİ: FRIENDLY MATCH İSTATİSTİKLERİ
//     // ============================================
//     friendlyPlayed?: number;           // Dostluk maçı sayısı
//     friendlyWon?: number;
//     friendlyDrawn?: number;
//     friendlyLost?: number;


//     // Gol İstatistikleri
//     goalsScored: number; // Attığı gol
//     goalsAgainst: number; // Yediği gol
//     goalDifference: number; // Averaj
//     assists: number; // Asist

//     // Puan (Galibiyet: 3, Beraberlik: 1, Mağlubiyet: 0)
//     points: number;

//     // ============================================
//     // RATING STATISTICS (UPDATED)
//     // ============================================
//     rating: number;                    // Ortalama rating (1-5)
//     totalRatingsReceived: number;      // Kaç kez puanlandı
//     ratingTrend: 'up' | 'stable' | 'down'; // Trend

//     mvpCount: number;                  // MVP seçilme sayısı
//     mvpRate: number;                   // MVP oranı (%)
//     attendanceRate: number; // Katılım oranı %
//   }>;

//   lastUpdated: string;
// }

// // ============================================
// // 9. OYUNCU İSTATİSTİKLERİ
// // ============================================
// export interface IPlayerStats {
//   playerId: string;
//   leagueId: any;
//   seasonId: string;

//   // ============================================
//   // YENİ: GENEL İSTATİSTİKLER (Tüm maçlar)
//   // ============================================
//   allMatches?: {
//     total: number;
//     wins: number;
//     draws: number;
//     losses: number;
//     goals: number;
//     assists: number;
//   };

//   // ============================================
//   // LİG İSTATİSTİKLERİ (Sadece lig maçları)
//   // ============================================
//   leagueMatches?: {
//     total: number;
//     wins: number;
//     draws: number;
//     losses: number;
//     goals: number;
//     assists: number;
//     points: number;                    // Puan sadece lig maçlarında
//   };

//   // ============================================
//   // FRIENDLY İSTATİSTİKLERİ
//   // ============================================
//   friendlyMatches?: {
//     total: number;
//     wins: number;
//     draws: number;
//     losses: number;
//     goals: number;
//     assists: number;
//   };

//   // Maç
//   totalMatches: number;
//   wins: number;
//   draws: number;
//   losses: number;

//   // Gol & Asist
//   totalGoals: number;
//   totalAssists: number;

//   // Puan
//   points: number;

//   // ============================================
//   // RATING STATS (UPDATED)
//   // ============================================
//   rating: number;                      // Ortalama rating
//   totalRatingsReceived: number;        // Kaç kez puanlandı
//   ratingHistory: Array<{               // Rating geçmişi
//     matchId: string;
//     matchType: MatchType;              // YENİ: Hangi tip maçtan geldi
//     rating: number;
//     date: string;
//   }>;

//   mvpCount: number;                    // MVP sayısı
//   mvpRate: number;                     // MVP oranı

//   // Kategori ortalamaları (varsa)
//   categoryRatings?: {
//     skill?: number;
//     teamwork?: number;
//     sportsmanship?: number;
//     effort?: number;
//   };

//   // Diğer
//   attendanceRate: number; // Katılım oranı %
//   averageGoalsPerMatch: number;
//   averageAssistsPerMatch: number;
// }

// // ============================================
// // 10. PLAYER (Existing)
// // ============================================
// export interface IPlayer {
//   id?: any;
//   name?: string;
//   surname?: string;
//   jerseyNumber?: string;
//   birthDate?: string;
//   phone?: string;
//   email?: string;
//   lastLogin?: Date;
//   favoriteSports?: SportType[];
//   profilePhoto?: string;

//   // Her spor için tercih ettiği pozisyonlar (Birden fazla olabilir)
//   sportPositions?: Partial<Record<SportType, string[]>>; // 👈 Partial ekleyin
//   // Örnek: { 
//   //   "Futbol": ["Kaleci", "Defans"], 
//   //   "Basketbol": ["Guard", "Forward"] 
//   // }
// }

// // ============================================
// // 10. PLAYER (Existing) Maç bazlı oyuncu puanlaması
// // ============================================
// export interface IMatchRating {
//   id: any;
//   matchId: any;
//   matchType: MatchType;     // YENİ: Maç tipi
//   raterId: string;          // Puanlayan oyuncu ID
//   ratedPlayerId: string;    // Puanlanan oyuncu ID
//   rating: number;           // 1-5 yıldız

//   // Opsiyonel: Kategorik puanlama
//   categories?: {
//     skill?: number;         // Beceri (1-5)
//     teamwork?: number;      // Takım çalışması (1-5)
//     sportsmanship?: number; // Sportmenlik (1-5)
//     effort?: number;        // Çaba (1-5)
//   };

//   comment?: string;         // Opsiyonel yorum
//   isAnonymous: boolean;     // Puanlama anonim mi

//   // NEW: Query için
//   leagueId?: any;            // 🆕 Eklendi
//   seasonId?: string;         // 🆕 Eklendi

//   createdAt: string;
//   updatedAt?: string;
// }

// // ============================================
// // 11. Maç yorumları (Genel yorumlar, belirli oyuncuya değil)
// // ============================================
// export interface IMatchComment {
//   id: any;
//   matchId: any;
//   matchType: MatchType;     // YENİ: Maç tipi
//   playerId: string;         // Yorum yapan oyuncu
//   comment: string;

//   // Yorum türü
//   type: 'general' | 'highlight' | 'improvement';

//   // Moderasyon
//   isApproved: boolean;      // Organizatör onayı
//   approvedBy?: string;      // Onaylayan organizatör ID

//   // Reaksiyon sistemi
//   likes?: string[];         // Like atan oyuncu ID'leri

//   createdAt: string;
//   updatedAt?: string;
// }


// // ============================================
// // 12. Oyuncunun genel rating profili (Tüm maçlardan hesaplanan)
// // ============================================
// export interface IPlayerRatingProfile {
//   id: any;
//   playerId: string;
//   leagueId?: any;
//   seasonId?: string;

//   // ============================================
//   // YENİ: GENEL PROFIL (Tüm maç tipleri)
//   // ============================================
//   overall?: {
//     overallRating: number;
//     totalRatingsReceived: number;
//     mvpCount: number;
//     mvpRate: number;
//   };

//   // ============================================
//   // LİG BAZLI PROFIL
//   // ============================================
//   league?: {
//     overallRating: number;
//     totalRatingsReceived: number;
//     mvpCount: number;
//     mvpRate: number;
//   };

//   // ============================================
//   // FRIENDLY BAZLI PROFIL
//   // ============================================
//   friendly?: {
//     overallRating: number;
//     totalRatingsReceived: number;
//     mvpCount: number;
//     mvpRate: number;
//   };

//   // Genel ortalamalar
//   overallRating: number;           // Toplam ortalama rating (1-5)
//   totalRatingsReceived: number;    // Kaç kez puanlandı

//   // Kategorik ortalamalar (varsa)
//   categoryAverages?: {
//     skill?: number;
//     teamwork?: number;
//     sportsmanship?: number;
//     effort?: number;
//   };

//   // MVP istatistikleri
//   mvpCount: number;                // Kaç kez MVP seçildi
//   mvpRate: number;                 // MVP seçilme oranı (%)

//   // Trend analizi
//   ratingTrend: 'improving' | 'stable' | 'declining'; // Son 5 maçın trendi
//   lastFiveRatings: number[];       // Son 5 maçın rating'leri

//   // Rakip oyunculardan gelenler
//   teammateRatings: {
//     average: number;
//     count: number;
//   };
//   opponentRatings: {
//     average: number;
//     count: number;
//   };

//   lastUpdated: string;
// }
// // ============================================
// // 13. YENİ: FRIENDLY MATCH CONFIG
// // ============================================
// export interface IFriendlyMatchConfig {
//   id: any;
//   organizerId: string;                 // Maçı organize eden

//   // Varsayılan ayarlar (tekrar tekrar kullanmak için)
//   defaultLocation?: string;
//   defaultStaffCount?: number;
//   defaultReserveCount?: number;
//   defaultPrice?: number;
//   defaultPeterIban?: string;
//   defaultPeterFullName?: string;

//   // Favori oyuncular (hızlı davet için)
//   favoritePlayerIds?: string[];

//   // Şablon maçlar
//   templates?: Array<{
//     id: string;
//     name: string;                      // "Hafta Sonu Maçı"
//     settings: Partial<IMatch>;
//   }>;

//   createdAt: string;
//   updatedAt?: string;
// }

// // ============================================
// // 14. YENİ: MATCH INVITATION (Davet Sistemi)
// // ============================================
// export interface IMatchInvitation {
//   id: any;
//   matchId: any;
//   matchType: MatchType;
//   inviterId: string;                   // Davet eden
//   inviteeId: string;                   // Davet edilen

//   status: 'pending' | 'accepted' | 'declined' | 'expired';

//   message?: string;                    // Davet mesajı

//   sentAt: string;
//   respondedAt?: string;
//   expiresAt?: string;
// }
// export interface IDevice {
//   id: any;
//   playerId?: string;
//   deviceId?: string;
//   deviceName?: string;
//   platform?: string;
//   addedAt?: string;
//   lastUsed?: string;
//   isActive?: boolean;
// }
// // ============================================
// // QUERY HELPERS
// // ============================================


// export const getSportIcon = (sportType: SportType): string => {
//   return SPORT_CONFIGS[sportType]?.emoji || "⚽";
// };

// export const getSportName = (sportType: SportType): string => {
//   return SPORT_CONFIGS[sportType]?.name || sportType;
// };

// export const getSportColor = (sportType: SportType): string => {
//   return SPORT_CONFIGS[sportType]?.color || "#16a34a";
// };

// export const getSportDefaults = (sportType: SportType) => {
//   return SPORT_CONFIGS[sportType];
// };

// export const getMatchStatusColor = (status: IMatch['status']): string => {
//   switch (status) {
//     case 'Oluşturuldu': return '#9CA3AF';
//     case 'Kayıt Açık': return '#10B981';
//     case 'Kayıt Kapandı': return '#F59E0B';
//     case 'Takımlar Oluşturuldu': return '#2563EB';
//     case 'Oynanıyor': return '#8B5CF6';
//     case 'Skor Bekleniyor': return '#F59E0B';
//     case 'Skor Onay Bekliyor': return '#F59E0B';
//     case 'Tamamlandı': return '#16a34a';
//     case 'İptal Edildi': return '#DC2626';
//     default: return '#6B7280';
//   }
// };

// // Puan Hesaplama (Galibiyet: 3, Beraberlik: 1)
// export const calculatePoints = (won: number, drawn: number): number => {
//   return won * 3 + drawn * 1;
// };

// // Averaj Hesaplama
// export const calculateGoalDifference = (scored: number, against: number): number => {
//   return scored - against;
// };

// // Kadro Oluşturma Algoritması
// export const buildSquad = (
//   match: IMatch,
//   staffPlayerCount: number,
//   reservePlayerCount: number
// ): { squad: string[]; reserves: string[] } => {
//   const squad: string[] = [];
//   const reserves: string[] = [];

//   // 1. Direkt Oyuncular (Otomatik kadroda)
//   squad.push(...match.directPlayerIds);

//   // 2. Premium Oyuncular (Kayıt olmuşsa öncelikli)
//   const registeredPremiums = match.registeredPlayerIds.filter(id =>
//     match.premiumPlayerIds.includes(id)
//   );
//   squad.push(...registeredPremiums.slice(0, staffPlayerCount - squad.length));

//   // 3. Normal Kayıtlı Oyuncular (Sıraya göre)
//   const normalRegistered = match.registeredPlayerIds.filter(id =>
//     !match.premiumPlayerIds.includes(id)
//   );
//   squad.push(...normalRegistered.slice(0, staffPlayerCount - squad.length));

//   // 4. Misafir Oyuncular (Kadro sonuna veya yedeğe)
//   if (squad.length < staffPlayerCount) {
//     squad.push(...match.guestPlayerIds.slice(0, staffPlayerCount - squad.length));
//   } else {
//     reserves.push(...match.guestPlayerIds);
//   }

//   // 5. Kalan Oyuncular Yedek'e
//   const remaining = [
//     ...normalRegistered.slice(squad.length - match.directPlayerIds.length - registeredPremiums.length),
//     ...match.guestPlayerIds.filter(id => !squad.includes(id)),
//   ];
//   reserves.push(...remaining.slice(0, reservePlayerCount));

//   return {
//     squad: squad.slice(0, staffPlayerCount),
//     reserves: reserves.slice(0, reservePlayerCount),
//   };
// };

// // Yetki Kontrolleri
// export const canOrganizeMatch = (userId: string, match: IMatch): boolean => {
//   return match.organizerPlayerIds.includes(userId);
// };

// export const canBuildTeam = (userId: string, match: IMatch): boolean => {
//   return (
//     match.organizerPlayerIds.includes(userId) ||
//     match.teamBuildingAuthorityPlayerIds.includes(userId)
//   );
// };


// // MVP Hesaplama
// export const calculateMVP = (ratings: IMatchRating[]): string | null => {
//   if (ratings.length === 0) return null;

//   // Her oyuncu için ortalama rating hesapla
//   const playerRatings: Record<string, { total: number; count: number }> = {};

//   ratings.forEach(rating => {
//     if (!playerRatings[rating.ratedPlayerId]) {
//       playerRatings[rating.ratedPlayerId] = { total: 0, count: 0 };
//     }
//     playerRatings[rating.ratedPlayerId].total += rating.rating;
//     playerRatings[rating.ratedPlayerId].count += 1;
//   });

//   // En yüksek ortalamaya sahip oyuncuyu bul
//   let mvpId: string | null = null;
//   let maxAverage = 0;

//   Object.keys(playerRatings).forEach(playerId => {
//     const average = playerRatings[playerId].total / playerRatings[playerId].count;
//     if (average > maxAverage) {
//       maxAverage = average;
//       mvpId = playerId;
//     }
//   });

//   return mvpId;
// };

// // Oyuncu ortalama rating hesaplama
// export const calculatePlayerAverageRating = (
//   ratings: IMatchRating[],
//   playerId: string
// ): number => {
//   const playerRatings = ratings.filter(r => r.ratedPlayerId === playerId);
//   if (playerRatings.length === 0) return 0;

//   const total = playerRatings.reduce((sum, r) => sum + r.rating, 0);
//   return total / playerRatings.length;
// };

// // Rating trend hesaplama
// export const calculateRatingTrend = (
//   lastFiveRatings: number[]
// ): 'improving' | 'stable' | 'declining' => {
//   if (lastFiveRatings.length < 3) return 'stable';

//   const recentAvg = lastFiveRatings.slice(-3).reduce((a, b) => a + b) / 3;
//   const oldAvg = lastFiveRatings.slice(0, 2).reduce((a, b) => a + b) / 2;

//   const diff = recentAvg - oldAvg;

//   if (diff > 0.3) return 'improving';
//   if (diff < -0.3) return 'declining';
//   return 'stable';
// };

// // Minimum rating sayısı kontrolü (spam önleme)
// export const hasEnoughRatings = (count: number): boolean => {
//   return count >= 3; // En az 3 puanlama olmalı
// };

// // Rating yüzdesi hesaplama
// export const getRatingPercentage = (rating: number): number => {
//   return (rating / 5) * 100;
// };

// // Yıldız sayısına göre emoji
// export const getRatingEmoji = (rating: number): string => {
//   if (rating >= 4.5) return '🌟'; // Mükemmel
//   if (rating >= 4.0) return '⭐'; // Harika
//   if (rating >= 3.5) return '✨'; // İyi
//   if (rating >= 3.0) return '👍'; // Orta
//   if (rating >= 2.0) return '👌'; // Zayıf
//   return '😐'; // Çok zayıf
// };

// // Rating badge rengi
// export const getRatingColor = (rating: number): string => {
//   if (rating >= 4.5) return '#F59E0B'; // Gold
//   if (rating >= 4.0) return '#10B981'; // Green
//   if (rating >= 3.5) return '#3B82F6'; // Blue
//   if (rating >= 3.0) return '#6B7280'; // Gray
//   if (rating >= 2.0) return '#F97316'; // Orange
//   return '#DC2626'; // Red
// };

