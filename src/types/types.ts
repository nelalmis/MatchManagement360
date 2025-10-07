// ============================================
// types.ts - Tüm TypeScript tipleri
// ============================================
export interface IMatchGroup {
  id: any;
  title: string; //Arc Halı Saha Maçları
  spreadSheetId: string;
  matchOrganizationSetups: Array<IMatchOrganizationSetup>;
  playerIds: string[];
}
export interface IMatchOrganizationSetup {
  id: any;
  matchGroupId: any;
  subTitle: string; // Perşembe Maçı , Salı Maçı
  registrationStartTime: Date;
  matchStartTime: Date;
  matchTotalTimeInMinute: number;
  staffPlayerCount: number;
  reservePlayerCount: number;
  isPeriodic: boolean;
  periodDayCount?: number;
  location: string;
  peterIban: string;
  peterFullName: string;
  pricePerPlayer: number;
  gmailsOfOrganizers: Array<string>;
  premiumPlayers: Array<string>;
  status: 'Aktif' | 'Pasif';
  surveyFormId: string;
  commentFormId: string;
  calendarId: string;
  matchIds: string[];
}
export interface IPlayer {
  id: any;
  name: string;
  surname: string;
  position: string;
  jerseyNumber?: string;
  birthDate: string;
  phone: string;
  email?: string;
  lastLogin?: Date;
}

export interface IMatch {
  id: any;
  matchOrganizationSetupId: any;
  eventId?: string;
  title: string;
  registrationTime: Date;
  registrationEndTime: Date;
  registrationCount?: number;
  matchStartTime: Date;
  matchEndTime: Date;
  team1PlayerIds?: Array<string>;
  team2PlayerIds?: Array<string>
  score?: string;
  status: 'Oluşturuldu' | 'Planlandı' | 'Ödeme Kontrolü' | 'Skor Bekleniyor' | 'Tamamlandı' | 'İptal Edildi';
  matchBoardSheetId?: any;
  playerIdOfMatchMVP?: string;
  guestPlayers?: Array<string>;
  directPlayers?: Array<string>;
  teamBuildingAuthorityIds?: Array<string>;
  location?: string; //maç özelinde özelleştirilebilir
  pricePerPlayer?: number;//maç özelinde özelleştirilebilir
  peterIban?: string;//maç özelinde özelleştirilebilir
  peterFullName?: string;//maç özelinde özelleştirilebilir
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

export interface Contact {
  id: number;
  name: string;
  phone: string;
}

export interface AppContextType {
  user: IPlayer | null;
  setUser: (user: IPlayer | null) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
}