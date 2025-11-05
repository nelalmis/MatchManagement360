// ============================================
// BASE INVITATION INTERFACE (Ortak)
// ============================================

import { Timestamp } from "firebase/firestore";

export enum InvitationType {
  LEAGUE = 'league',
  MATCH = 'match',
  TEAM = 'team',
  TOURNAMENT = 'tournament',
}

export enum InvitationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
  MAX_USES_REACHED = 'max_uses_reached',
}
/**
 * COLLECTION: invitations
 * Base invitation structure - tüm davet türleri için ortak
 */
export interface IBaseInvitation {
  id: string;
  
  // ============================================
  // TİP & HEDEF
  // ============================================
  type: InvitationType;
  targetId: string;
  
  // ============================================
  // DAVET KODU
  // ============================================
  code: string;
  inviteLink: string;
  qrCode?: string;
  
  // ============================================
  // YARATICI & ZAMAN
  // ============================================
  createdBy: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  
  // ============================================
  // KULLANIM LİMİTLERİ
  // ============================================
  maxUses?: number;
  usedCount: number;
  status: InvitationStatus;
  
  // ============================================
  // ORTAK AYARLAR
  // ============================================
  settings: {
    description?: string;
    tags?: string[];
    autoAccept?: boolean;
    requireApproval?: boolean;
  };
  
  // ============================================
  // İSTATİSTİKLER
  // ============================================
  stats: {
    totalViews: number;
    totalAttempts: number;
    successfulJoins: number;
    failedAttempts: number;
    lastUsedAt?: Timestamp;
  };
  
  updatedAt: Timestamp;
}

// ============================================
// LEAGUE-SPECIFIC INVITATION
// ============================================

export interface ILeagueInvitation extends IBaseInvitation {
  type: InvitationType.LEAGUE;
  
  leagueSettings: {
    assignRole: 'member' | 'premium' | 'direct';
    autoApprove: boolean;
    welcomeMessage?: string;
  };
}

// ============================================
// MATCH-SPECIFIC INVITATION
// ============================================

export interface IMatchInvitation extends IBaseInvitation {
  type: InvitationType.MATCH;
  
  matchSettings: {
    matchType: 'FRIENDLY' | 'LEAGUE' | 'TOURNAMENT';
    allowGuests: boolean;
    registrationType: 'player' | 'reserve' | 'any';
    teamAssignment?: 'auto' | 'team1' | 'team2' | 'manual';
    preferredPosition?: string;
    maxPlayersPerInvite?: number;      // Bir kişi kaç oyuncu getirebilir
    guestSettings?: {
      requireFullName: boolean;
      requirePhone: boolean;
      allowMultipleGuests: boolean;
    };
  };
}

// ============================================
// TEAM-SPECIFIC INVITATION
// ============================================

export interface ITeamInvitation extends IBaseInvitation {
  type: InvitationType.TEAM;
  
  teamSettings: {
    assignRole: 'player' | 'coach' | 'staff';
    requireApproval: boolean;
    requiredSkillLevel?: number;
  };
}

// ============================================
// UNION TYPE
// ============================================

export type IInvitation = ILeagueInvitation | IMatchInvitation | ITeamInvitation;

// ============================================
// BASE INVITATION USE (Ortak)
// ============================================

export interface IBaseInvitationUse {
  id: string;
  invitationId: string;
  type: InvitationType;
  targetId: string;
  
  userId: string;
  joinedAt: Timestamp;
  status: 'success' | 'pending' | 'rejected';
  
  device: {
    platform: 'ios' | 'android' | 'web';
    model?: string;
    osVersion?: string;
  };
}

// ============================================
// LEAGUE USE
// ============================================

export interface ILeagueInvitationUse extends IBaseInvitationUse {
  type: InvitationType.LEAGUE;
  
  leagueData: {
    assignedRole: 'member' | 'premium' | 'direct';
    approvedBy?: string;
    approvedAt?: Timestamp;
  };
}

// ============================================
// MATCH USE
// ============================================

export interface IMatchInvitationUse extends IBaseInvitationUse {
  type: InvitationType.MATCH;
  
  matchData: {
    assignedRole: 'player' | 'reserve' | 'guest' | 'direct';
    assignedTeam?: 'team1' | 'team2';
    position?: string;
    guestInfo?: {
      fullName: string;
      phone?: string;
      accompaniedBy: string;    // Kimin daveti ile geldi
    };
  };
}

// ============================================
// TEAM USE
// ============================================

export interface ITeamInvitationUse extends IBaseInvitationUse {
  type: InvitationType.TEAM;
  
  teamData: {
    assignedRole: 'player' | 'coach' | 'staff';
    approvedBy?: string;
  };
}

export type IInvitationUse = ILeagueInvitationUse | IMatchInvitationUse | ITeamInvitationUse;