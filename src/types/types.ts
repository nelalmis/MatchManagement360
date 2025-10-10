// types.ts

export type SportType = 
  | "Futbol" 
  | "Basketbol" 
  | "Voleybol" 
  | "Tenis"
  | "Masa Tenisi"
  | "Badminton";

export interface SportConfig {
  emoji: string;
  name: string;
  defaultPlayers: number;
  defaultDuration: number;
  positions: string[];
  color: string;
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
// 1. LIG (LEAGUE)
// ============================================
export interface ILeague {
  id: any;
  title: string; // "Architect Halı Saha Ligi"
  sportType: SportType;
  spreadSheetId?: string;
  
  // Sezon Ayarları
  seasonDuration?: number; // Sezon süresi (gün cinsinden)
  seasonStartDate: string; // Sezon başlangıç tarihi (ISO string)
  seasonEndDate: string; // Sezon bitiş tarihi (ISO string)
  autoResetStandings: boolean; // Sezon bitince puan durumu sıfırlansın mı
  canChangeSeason: boolean; // Lig devam ederken sezon değiştirilebilir mi (false = geçmiş tarih olamaz)
  
  // Oyuncu Listeleri (Lig Seviyesi)
  playerIds: string[]; // Lige kayıtlı tüm oyuncular
  premiumPlayerIds: string[]; // Premium oyuncular (kayıt olursa öncelikli)
  directPlayerIds: string[]; // Direkt oyuncular (otomatik kadroda)
  
  // Yetkililer
  teamBuildingAuthorityPlayerIds: string[]; // Takım kurma yetkisi olan oyuncular
  
  // İlişkiler
  matchFixtures: Array<IMatchFixture>;
  
  // Meta
  createdAt: string;
  createdBy: string; // User ID (Lig sahibi)
}

// ============================================
// 2. FİKSTÜR (FIXTURE)
// ============================================
export interface IMatchFixture {
  id: any;
  leagueId: any;
  title: string; // "Salı Maçı"
  sportType: SportType; // Lig'den inherit
  
  // Zamanlama
  registrationStartTime: Date; // Kayıt başlangıç
  matchStartTime: Date; // Maç başlangıç
  matchTotalTimeInMinute: number;
  
  // Periyodik Ayarları
  isPeriodic: boolean; // Rutin mu, tek seferlik mi
  periodDayCount?: number; // Periyot (7 = Her hafta)
  
  // Kadro Ayarları
  staffPlayerCount: number; // Kadro sayısı (10)
  reservePlayerCount: number; // Yedek sayısı (2)
  
  // Oyuncu Listeleri (Fikstür Seviyesi - Lig'den inherit edilir, özelleştirilebilir)
  premiumPlayerIds?: string[]; // Fikstür özelinde premium oyuncular
  directPlayerIds?: string[]; // Fikstür özelinde direkt oyuncular
  
  // Yetkililer
  organizerPlayerIds: string[]; // Fikstür organizatörleri (PlayerID'ler)
  teamBuildingAuthorityPlayerIds?: string[]; // Fikstür özelinde takım kurma yetkisi
  
  // Lokasyon ve Ödeme
  location: string;
  pricePerPlayer: number;
  peterIban: string; // Ödeme alacak kişinin IBAN'ı
  peterFullName: string; // Ödeme alacak kişinin adı
  
  // Durum
  status: 'Aktif' | 'Pasif';
  
  // Form ve Takvim
  surveyFormId?: string;
  commentFormId?: string;
  calendarId?: string;
  
  // İlişkiler
  matchIds: string[]; // Bu fikstüre ait maçlar
  
  // Meta
  createdAt: string;
}

// ============================================
// 3. MAÇ (MATCH)
// ============================================
export interface IMatch {
  id: any;
  fixtureId: any;
  eventId?: string;
  title: string; // "Salı Maçı - 15 Ekim 2025"
  
  // Zamanlama
  registrationTime: Date; // Kayıt başlangıç
  registrationEndTime: Date; // Kayıt bitiş
  matchStartTime: Date;
  matchEndTime: Date;
  
  // ============================================
  // OYUNCU YÖNETİMİ (Öncelik Sırası)
  // ============================================
  
  // 1. Premium Oyuncular (Lig/Fikstür/Maç seviyesinden birleştirilerek gelir)
  // Kayıt olursa kadronun başına geçer
  premiumPlayerIds: string[];
  
  // 2. Direkt Oyuncular (Lig/Fikstür/Maç seviyesinden birleştirilerek gelir)
  // Otomatik kadroda, kayıt beklenmiyor
  directPlayerIds: string[];
  
  // 3. Misafir Oyuncular (Sadece maç özelinde eklenir)
  // Kadronun sonuna veya yedeğe eklenir
  guestPlayerIds: string[];
  
  // 4. Kayıtlı Oyuncular (Normal kayıt olan oyuncular)
  // Kayıt sırasına göre kadroya alınır
  registeredPlayerIds: string[];
  
  // 5. Yedek Oyuncular
  // Kadro dolarsa yedek listesine alınır
  reservePlayerIds: string[];
  
  // ============================================
  // TAKIMLAR (Organizatörler veya yetkili oyuncular oluşturur)
  // ============================================
  team1PlayerIds?: string[];
  team2PlayerIds?: string[];
  
  // Takım kurulurken belirlenen pozisyonlar (Maç özelinde)
  playerPositions?: Record<string, string>; 
  // playerId -> position mapping
  // Örnek: { 
  //   "player123": "Kaleci", 
  //   "player456": "Forvet",
  //   "player789": "Orta Saha" 
  // }
  
  // ============================================
  // SKOR YÖNETİMİ
  // ============================================
  score?: string; // "3-2"
  team1Score?: number;
  team2Score?: number;
  
  // Gol ve Asist Sistemi
  goalScorers: Array<{
    playerId: string;
    goals: number;
    assists: number;
    confirmed: boolean; // Organizatör onayı
    submittedAt: string; // Giriş zamanı
  }>;
  
  playerIdOfMatchMVP?: string; // Maçın MVP'si
  
  // ============================================
  // ÖDEME YÖNETİMİ
  // ============================================
  paymentStatus: Array<{
    playerId: string;
    paid: boolean;
    amount: number;
    paidAt?: string;
    confirmedBy?: string; // Organizatör PlayerID
  }>;
  
  // ============================================
  // YETKİLER (Maç Özelinde Özelleştirilebilir)
  // ============================================
  organizerPlayerIds: string[]; // Fikstür'den inherit
  teamBuildingAuthorityPlayerIds: string[]; // Bu maçta takım kurabilecek oyuncular
  
  // ============================================
  // MAÇ ÖZELİNDE ÖZELLEŞTİRİLEBİLİR ALANLAR
  // ============================================
  location?: string; // Fikstür'den farklı olabilir
  pricePerPlayer?: number; // Fikstür'den farklı olabilir
  peterIban?: string;
  peterFullName?: string;
  
  // ============================================
  // DURUM
  // ============================================
  status: 
    | 'Oluşturuldu' // İlk oluşturma
    | 'Kayıt Açık' // Oyuncular kayıt olabilir
    | 'Kayıt Kapandı' // Kayıtlar kapandı
    | 'Takımlar Oluşturuldu' // Takımlar belirlendi
    | 'Oynanıyor' // Maç devam ediyor
    | 'Skor Bekleniyor' // Organizatör skor girecek
    | 'Skor Onay Bekliyor' // Gol/asist onay bekliyor
    | 'Ödeme Bekliyor' // Oyunculardan ödeme bekleniyor
    | 'Tamamlandı' // Her şey bitti, puan durumu güncellendi
    | 'İptal Edildi'; // Maç iptal
  
  // Meta
  matchBoardSheetId?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// 4. PUAN DURUMU (STANDINGS)
// ============================================
export interface IStandings {
  id: any;
  leagueId: any;
  seasonId: string; // "season_2025_q1"
  
  playerStandings: Array<{
    playerId: string;
    playerName: string;
    
    // Maç İstatistikleri
    played: number; // Oynadığı maç
    won: number; // Kazandığı maç
    drawn: number; // Berabere
    lost: number; // Kaybettiği maç
    
    // Gol İstatistikleri
    goalsScored: number; // Attığı gol
    goalsAgainst: number; // Yediği gol
    goalDifference: number; // Averaj
    assists: number; // Asist
    
    // Puan (Galibiyet: 3, Beraberlik: 1, Mağlubiyet: 0)
    points: number;
    
    // Diğer
    rating: number; // Ortalama puan (4.5/5.0)
    mvpCount: number; // MVP seçilme sayısı
    attendanceRate: number; // Katılım oranı %
  }>;
  
  lastUpdated: string;
}

// ============================================
// 5. OYUNCU İSTATİSTİKLERİ
// ============================================
export interface IPlayerStats {
  playerId: string;
  leagueId: any;
  seasonId: string;
  
  // Maç
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  
  // Gol & Asist
  totalGoals: number;
  totalAssists: number;
  
  // Puan
  points: number;
  rating: number;
  mvpCount: number;
  
  // Diğer
  attendanceRate: number; // Katılım oranı %
  averageGoalsPerMatch: number;
  averageAssistsPerMatch: number;
}

// ============================================
// PLAYER (Existing)
// ============================================
export interface IPlayer {
  id?: any;
  name?: string;
  surname?: string;
  jerseyNumber?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  lastLogin?: Date;
  favoriteSports?: SportType[];
  profilePhoto?: string;
  
  // Her spor için tercih ettiği pozisyonlar (Birden fazla olabilir)
  sportPositions?: Partial<Record<SportType, string[]>>; // 👈 Partial ekleyin
  // Örnek: { 
  //   "Futbol": ["Kaleci", "Defans"], 
  //   "Basketbol": ["Guard", "Forward"] 
  // }
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
// ============================================
// HELPER FUNCTIONS
// ============================================

export const getSportIcon = (sportType: SportType): string => {
  return SPORT_CONFIGS[sportType]?.emoji || "⚽";
};

export const getSportName = (sportType: SportType): string => {
  return SPORT_CONFIGS[sportType]?.name || sportType;
};

export const getSportColor = (sportType: SportType): string => {
  return SPORT_CONFIGS[sportType]?.color || "#16a34a";
};

export const getSportDefaults = (sportType: SportType) => {
  return SPORT_CONFIGS[sportType];
};

export const getMatchStatusColor = (status: IMatch['status']): string => {
  switch (status) {
    case 'Oluşturuldu': return '#9CA3AF';
    case 'Kayıt Açık': return '#10B981';
    case 'Kayıt Kapandı': return '#F59E0B';
    case 'Takımlar Oluşturuldu': return '#2563EB';
    case 'Oynanıyor': return '#8B5CF6';
    case 'Skor Bekleniyor': return '#F59E0B';
    case 'Skor Onay Bekliyor': return '#F59E0B';
    case 'Tamamlandı': return '#16a34a';
    case 'İptal Edildi': return '#DC2626';
    default: return '#6B7280';
  }
};

// Puan Hesaplama (Galibiyet: 3, Beraberlik: 1)
export const calculatePoints = (won: number, drawn: number): number => {
  return won * 3 + drawn * 1;
};

// Averaj Hesaplama
export const calculateGoalDifference = (scored: number, against: number): number => {
  return scored - against;
};

// Kadro Oluşturma Algoritması
export const buildSquad = (
  match: IMatch,
  staffPlayerCount: number,
  reservePlayerCount: number
): { squad: string[]; reserves: string[] } => {
  const squad: string[] = [];
  const reserves: string[] = [];
  
  // 1. Direkt Oyuncular (Otomatik kadroda)
  squad.push(...match.directPlayerIds);
  
  // 2. Premium Oyuncular (Kayıt olmuşsa öncelikli)
  const registeredPremiums = match.registeredPlayerIds.filter(id =>
    match.premiumPlayerIds.includes(id)
  );
  squad.push(...registeredPremiums.slice(0, staffPlayerCount - squad.length));
  
  // 3. Normal Kayıtlı Oyuncular (Sıraya göre)
  const normalRegistered = match.registeredPlayerIds.filter(id =>
    !match.premiumPlayerIds.includes(id)
  );
  squad.push(...normalRegistered.slice(0, staffPlayerCount - squad.length));
  
  // 4. Misafir Oyuncular (Kadro sonuna veya yedeğe)
  if (squad.length < staffPlayerCount) {
    squad.push(...match.guestPlayerIds.slice(0, staffPlayerCount - squad.length));
  } else {
    reserves.push(...match.guestPlayerIds);
  }
  
  // 5. Kalan Oyuncular Yedek'e
  const remaining = [
    ...normalRegistered.slice(squad.length - match.directPlayerIds.length - registeredPremiums.length),
    ...match.guestPlayerIds.filter(id => !squad.includes(id)),
  ];
  reserves.push(...remaining.slice(0, reservePlayerCount));
  
  return {
    squad: squad.slice(0, staffPlayerCount),
    reserves: reserves.slice(0, reservePlayerCount),
  };
};

// Yetki Kontrolleri
export const canOrganizeMatch = (userId: string, match: IMatch): boolean => {
  return match.organizerPlayerIds.includes(userId);
};

export const canBuildTeam = (userId: string, match: IMatch): boolean => {
  return (
    match.organizerPlayerIds.includes(userId) ||
    match.teamBuildingAuthorityPlayerIds.includes(userId)
  );
};
export interface AppContextType {
  user: IPlayer | null;
  setUser: (user: IPlayer | null) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  countdown: number;
  setCountdown: (count: number) => void;
  rememberDevice: boolean;
  setRememberDevice: (remember: boolean) => void;
  isVerified: boolean;
  setIsVerified: (isVerified: boolean) => void;
}

export interface NavigationContextType {
  currentPage: string;
  navigate: (currentScreen: string, params?: any) => void;
  goBack: () => void;
  setMenuOpen: (menuOpen: boolean) => void;
  menuOpen: boolean;
  headerTitle?: string
  setHeaderTitle: (title: string) => void;
}

export interface IResponseBase {
  success: boolean;
  id: any;
  error?: undefined;
}

export interface IInvitation {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  status: 'pending';
}