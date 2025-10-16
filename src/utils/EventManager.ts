// src/utils/EventManager.ts

/**
 * ============================================
 * EVENT MANAGER
 * ============================================
 * Ekranlar arası event-based iletişim için
 */

type EventCallback = (data?: any) => void;

class EventManager {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Event'e abone ol
   * @param eventName - Event ismi
   * @param callback - Tetiklenecek fonksiyon
   * @returns Unsubscribe fonksiyonu
   */
  on(eventName: string, callback: EventCallback): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const callbacks = this.events.get(eventName)!;
    callbacks.push(callback);

    // Unsubscribe fonksiyonu döndür
    return () => this.off(eventName, callback);
  }

  /**
   * Event'ten ayrıl
   * @param eventName - Event ismi
   * @param callback - Kaldırılacak fonksiyon
   */
  off(eventName: string, callback: EventCallback): void {
    const callbacks = this.events.get(eventName);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }

    // Eğer hiç callback kalmadıysa event'i sil
    if (callbacks.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Event tetikle
   * @param eventName - Event ismi
   * @param data - Gönderilecek data
   */
  emit(eventName: string, data?: any): void {
    const callbacks = this.events.get(eventName);
    if (!callbacks || callbacks.length === 0) {
      console.log(`[EventManager] No listeners for: ${eventName}`);
      return;
    }

    console.log(`[EventManager] Emitting: ${eventName}`, data);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventManager] Error in callback for ${eventName}:`, error);
      }
    });
  }

  /**
   * Belirli bir event için listener sayısını döndür
   */
  listenerCount(eventName: string): number {
    return this.events.get(eventName)?.length || 0;
  }

  /**
   * Tüm event'leri listele
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Tüm listener'ları temizle
   */
  clear(): void {
    console.log('[EventManager] Clearing all events');
    this.events.clear();
  }

  /**
   * Belirli bir event'in tüm listener'larını temizle
   */
  clearEvent(eventName: string): void {
    console.log(`[EventManager] Clearing event: ${eventName}`);
    this.events.delete(eventName);
  }
}

// Singleton instance
export const eventManager = new EventManager();

// Event isimleri için type-safe constants
export const Events = {
  // Match events
  MATCH_UPDATED: 'matchUpdated',
  MATCH_CREATED: 'matchCreated',
  MATCH_DELETED: 'matchDeleted',
  MATCH_REGISTERED: 'matchRegistered',
  MATCH_UNREGISTERED: 'matchUnregistered',
  INVITATION_SENT: 'invitationSent',
  INVITATION_ACCEPTED: 'invitationAccepted',
  INVITATION_DECLINED: 'invitationDeclined',
  INVITATION_UPDATED: 'invitationUpdated',
  INVITATION_CANCELLED: 'invitationCancelled',
  TEMPLATE_UPDATED: 'template_updated',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_DELETED: 'template_deleted',
  // Fixture events
  FIXTURE_UPDATED: 'fixtureUpdated',
  FIXTURE_CREATED: 'fixtureCreated',
  FIXTURE_DELETED: 'fixtureDeleted',

  // League events
  LEAGUE_UPDATED: 'leagueUpdated',
  LEAGUE_CREATED: 'leagueCreated',
  LEAGUE_DELETED: 'leagueDeleted',

  // Player events
  PLAYER_UPDATED: 'playerUpdated',
  PROFILE_UPDATED: 'profileUpdated',

  // Team events
  TEAM_UPDATED: 'teamUpdated',
  TEAM_CREATED: 'teamCreated',

  // Score events
  SCORE_UPDATED: 'scoreUpdated',
  SCORE_CONFIRMED: 'scoreConfirmed',

  // Payment events
  PAYMENT_UPDATED: 'paymentUpdated',
  PAYMENT_CONFIRMED: 'paymentConfirmed',

  // Notification events
  NOTIFICATION_RECEIVED: 'notificationReceived',
  NOTIFICATION_READ: 'notificationRead',
} as const;

// Event data types
export interface MatchEventData {
  matchId: string;
  timestamp: number;
}

export interface FixtureEventData {
  fixtureId: string;
  timestamp: number;
}

export interface LeagueEventData {
  leagueId: string;
  timestamp: number;
}

export interface PlayerEventData {
  playerId: string;
  timestamp: number;
}