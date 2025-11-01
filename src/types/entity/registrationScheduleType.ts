// src/types/entity/registrationSchedule.types.ts
// 🚀 Flexible Registration Timing System

import { RecurringPattern } from "./recurringPattern";

/**
 * Registration Timing Type
 * Defines when registration opens relative to match time
 */
export type RegistrationTimingType =
    | 'hours_before'    // X saat önce (same day)
    | 'days_before'     // X gün önce
    | 'weeks_before'    // X hafta önce
    | 'fixed_date'      // Belirli bir tarih/saat
    | 'always_open';    // Her zaman açık

/**
 * Registration Schedule Configuration
 * Flexible timing for when registration opens/closes
 */
export interface RegistrationSchedule {
    /**
     * Opening configuration
     */
    opening: {
        /**
         * Timing type
         */
        type: RegistrationTimingType;

        /**
         * Value (used for hours/days/weeks before)
         * - hours_before: 2 = 2 hours before match
         * - days_before: 3 = 3 days before match
         * - weeks_before: 2 = 2 weeks before match
         */
        value?: number;

        /**
         * Fixed date/time (ISO string)
         * Used only when type = 'fixed_date'
         */
        fixedDateTime?: string;

        /**
         * Time of day for 'days_before' and 'weeks_before'
         * Example: "18:00" = Opens at 6 PM on the calculated day
         */
        timeOfDay?: string;
    };

    /**
     * Closing configuration (when registration closes)
     * Usually closes at match start, but can be customized
     */
    closing?: {
        /**
         * Timing type
         */
        type: 'at_match_start' | 'hours_before' | 'minutes_before';

        /**
         * Value (used for hours/minutes before)
         */
        value?: number;
    };
}

/**
 * Updated Fixture Schedule
 * Now with flexible registration timing
 */
export interface FixtureSchedule {
    /**
     * Match start time (HH:MM format)
     */
    matchStartTime: string;

    /**
     * Match duration in minutes
     */
    matchDuration: number;

    /**
     * Registration schedule (flexible timing)
     */
    registrationSchedule: RegistrationSchedule;

    /**
     * Is this a recurring fixture?
     */
    isRecurring: boolean;

    /**
     * Recurring pattern (only if isRecurring = true)
     */
    pattern?: RecurringPattern;
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

/**
 * Common registration timing presets
 */
export const REGISTRATION_PRESETS = {
    /**
     * Opens 2 hours before match
     */
    TWO_HOURS_BEFORE: {
        opening: {
            type: 'hours_before' as RegistrationTimingType,
            value: 2,
        },
        closing: {
            type: 'at_match_start' as const,
        },
    },

    /**
     * Opens 1 day before at 6 PM
     */
    ONE_DAY_BEFORE: {
        opening: {
            type: 'days_before' as RegistrationTimingType,
            value: 1,
            timeOfDay: '18:00',
        },
        closing: {
            type: 'at_match_start' as const,
        },
    },

    /**
     * Opens 3 days before at 12 PM
     */
    THREE_DAYS_BEFORE: {
        opening: {
            type: 'days_before' as RegistrationTimingType,
            value: 3,
            timeOfDay: '12:00',
        },
        closing: {
            type: 'at_match_start' as const,
        },
    },

    /**
     * Opens 1 week before at 6 PM
     */
    ONE_WEEK_BEFORE: {
        opening: {
            type: 'weeks_before' as RegistrationTimingType,
            value: 1,
            timeOfDay: '18:00',
        },
        closing: {
            type: 'at_match_start' as const,
        },
    },

    /**
     * Opens 2 weeks before at 12 PM
     */
    TWO_WEEKS_BEFORE: {
        opening: {
            type: 'weeks_before' as RegistrationTimingType,
            value: 2,
            timeOfDay: '12:00',
        },
        closing: {
            type: 'at_match_start' as const,
        },
    },

    /**
     * Always open (no restrictions)
     */
    ALWAYS_OPEN: {
        opening: {
            type: 'always_open' as RegistrationTimingType,
        },
        closing: {
            type: 'at_match_start' as const,
        },
    },

    /**
     * Fixed date registration
     */
    FIXED_DATE: (dateTime: string) => ({
        opening: {
            type: 'fixed_date' as RegistrationTimingType,
            fixedDateTime: dateTime,
        },
        closing: {
            type: 'at_match_start' as const,
        },
    }),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate registration opening time
 * @param matchDateTime - Match date and time
 * @param schedule - Registration schedule config
 * @returns Registration opening date/time
 */
export const calculateRegistrationOpenTime = (
    matchDateTime: Date,
    schedule: RegistrationSchedule
): Date => {
    const opening = schedule.opening;

    switch (opening.type) {
        case 'hours_before': {
            const openTime = new Date(matchDateTime);
            openTime.setHours(openTime.getHours() - (opening.value || 0));
            return openTime;
        }

        case 'days_before': {
            const openTime = new Date(matchDateTime);
            openTime.setDate(openTime.getDate() - (opening.value || 0));

            // Set time of day if specified
            if (opening.timeOfDay) {
                const [hours, minutes] = opening.timeOfDay.split(':').map(Number);
                openTime.setHours(hours, minutes, 0, 0);
            }

            return openTime;
        }

        case 'weeks_before': {
            const openTime = new Date(matchDateTime);
            openTime.setDate(openTime.getDate() - (opening.value || 0) * 7);

            // Set time of day if specified
            if (opening.timeOfDay) {
                const [hours, minutes] = opening.timeOfDay.split(':').map(Number);
                openTime.setHours(hours, minutes, 0, 0);
            }

            return openTime;
        }

        case 'fixed_date': {
            if (opening.fixedDateTime) {
                return new Date(opening.fixedDateTime);
            }
            // Fallback to match time if no fixed date
            return new Date(matchDateTime);
        }

        case 'always_open': {
            // Opens far in the past (effectively always open)
            const openTime = new Date(matchDateTime);
            openTime.setFullYear(openTime.getFullYear() - 1);
            return openTime;
        }

        default:
            return new Date(matchDateTime);
    }
};

/**
 * Calculate registration closing time
 * @param matchDateTime - Match date and time
 * @param schedule - Registration schedule config
 * @returns Registration closing date/time
 */
export const calculateRegistrationCloseTime = (
    matchDateTime: Date,
    schedule: RegistrationSchedule
): Date => {
    const closing = schedule.closing;

    if (!closing || closing.type === 'at_match_start') {
        return new Date(matchDateTime);
    }

    const closeTime = new Date(matchDateTime);

    switch (closing.type) {
        case 'hours_before':
            closeTime.setHours(closeTime.getHours() - (closing.value || 0));
            break;

        case 'minutes_before':
            closeTime.setMinutes(closeTime.getMinutes() - (closing.value || 0));
            break;
    }

    return closeTime;
};

/**
 * Check if registration is currently open
 * @param matchDateTime - Match date and time
 * @param schedule - Registration schedule config
 * @returns true if registration is open
 */
export const isRegistrationOpen = (
    matchDateTime: Date,
    schedule: RegistrationSchedule
): boolean => {
    const now = new Date();
    const openTime = calculateRegistrationOpenTime(matchDateTime, schedule);
    const closeTime = calculateRegistrationCloseTime(matchDateTime, schedule);

    return now >= openTime && now < closeTime;
};

/**
 * Get registration status
 * @param matchDateTime - Match date and time
 * @param schedule - Registration schedule config
 * @returns Registration status
 */
export const getRegistrationStatus = (
    matchDateTime: Date,
    schedule: RegistrationSchedule
): 'not_yet_open' | 'open' | 'closed' => {
    const now = new Date();
    const openTime = calculateRegistrationOpenTime(matchDateTime, schedule);
    const closeTime = calculateRegistrationCloseTime(matchDateTime, schedule);

    if (now < openTime) {
        return 'not_yet_open';
    } else if (now >= openTime && now < closeTime) {
        return 'open';
    } else {
        return 'closed';
    }
};

/**
 * Get human-readable description of registration timing
 * @param schedule - Registration schedule config
 * @returns Turkish description
 */
export const getRegistrationTimingDescription = (
    schedule: RegistrationSchedule
): string => {
    const { opening } = schedule;

    switch (opening.type) {
        case 'hours_before':
            return `Maçtan ${opening.value} saat önce açılır`;

        case 'days_before':
            const daysDesc = opening.value === 1 ? '1 gün' : `${opening.value} gün`;
            const timeDesc = opening.timeOfDay ? ` saat ${opening.timeOfDay}'te` : '';
            return `Maçtan ${daysDesc} önce${timeDesc} açılır`;

        case 'weeks_before':
            const weeksDesc = opening.value === 1 ? '1 hafta' : `${opening.value} hafta`;
            const timeDesc2 = opening.timeOfDay ? ` saat ${opening.timeOfDay}'te` : '';
            return `Maçtan ${weeksDesc} önce${timeDesc2} açılır`;

        case 'fixed_date':
            if (opening.fixedDateTime) {
                const date = new Date(opening.fixedDateTime);
                return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} tarihinde açılır`;
            }
            return 'Belirli bir tarihte açılır';

        case 'always_open':
            return 'Her zaman açık';

        default:
            return 'Kayıt zamanlaması belirtilmemiş';
    }
};

/**
 * Get short description
 * @param schedule - Registration schedule config
 * @returns Short Turkish description
 */
export const getRegistrationTimingShort = (
    schedule: RegistrationSchedule
): string => {
    const { opening } = schedule;

    switch (opening.type) {
        case 'hours_before':
            return `${opening.value} saat önce`;
        case 'days_before':
            return `${opening.value} gün önce`;
        case 'weeks_before':
            return `${opening.value} hafta önce`;
        case 'fixed_date':
            return 'Belirli tarih';
        case 'always_open':
            return 'Her zaman açık';
        default:
            return 'Bilinmeyen';
    }
};

export const formatRegistrationTiming = (
    registrationSchedule: RegistrationSchedule,
    matchDateTime?: Date
): string => {
    const { opening } = registrationSchedule;

    // If match date is provided, show calculated time
    if (matchDateTime) {
        const openTime = calculateRegistrationOpenTime(matchDateTime, registrationSchedule);
        return openTime.toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Otherwise show description
    return getRegistrationTimingShort(registrationSchedule);
};

// Get registration status badge color
export const getRegistrationStatusColor = (
  registrationSchedule: RegistrationSchedule,
  matchDateTime: Date
): string => {
  const status = getRegistrationStatus(matchDateTime, registrationSchedule);
  
  switch (status) {
    case 'not_yet_open':
      return '#9CA3AF'; // Gray
    case 'open':
      return '#10B981'; // Green
    case 'closed':
      return '#EF4444'; // Red
  }
};

// Get registration status text
export const getRegistrationStatusText = (
  registrationSchedule: RegistrationSchedule,
  matchDateTime: Date
): string => {
  const status = getRegistrationStatus(matchDateTime, registrationSchedule);
  
  switch (status) {
    case 'not_yet_open':
      return 'Henüz Açılmadı';
    case 'open':
      return 'Kayıt Açık';
    case 'closed':
      return 'Kayıt Kapandı';
  }
};
/**
 * Validate registration schedule
 * @param schedule - Registration schedule config
 * @returns Validation result
 */
export const validateRegistrationSchedule = (
    schedule: RegistrationSchedule
): { valid: boolean; error?: string } => {
    const { opening, closing } = schedule;

    // Validate opening
    if (!opening.type) {
        return { valid: false, error: 'Kayıt açılış tipi belirtilmeli' };
    }

    if (opening.type === 'hours_before' && (!opening.value || opening.value < 0)) {
        return { valid: false, error: 'Saat değeri geçersiz' };
    }

    if (opening.type === 'days_before' && (!opening.value || opening.value < 1)) {
        return { valid: false, error: 'Gün değeri en az 1 olmalı' };
    }

    if (opening.type === 'weeks_before' && (!opening.value || opening.value < 1)) {
        return { valid: false, error: 'Hafta değeri en az 1 olmalı' };
    }

    if (opening.type === 'fixed_date' && !opening.fixedDateTime) {
        return { valid: false, error: 'Sabit tarih belirtilmeli' };
    }

    if (opening.timeOfDay) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(opening.timeOfDay)) {
            return { valid: false, error: 'Geçersiz saat formatı (HH:MM olmalı)' };
        }
    }

    // Validate closing
    if (closing) {
        if (closing.type === 'hours_before' && (!closing.value || closing.value < 0)) {
            return { valid: false, error: 'Kapanış saat değeri geçersiz' };
        }

        if (closing.type === 'minutes_before' && (!closing.value || closing.value < 0)) {
            return { valid: false, error: 'Kapanış dakika değeri geçersiz' };
        }
    }

    return { valid: true };
};

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example 1: Opens 2 hours before match
 */
export const EXAMPLE_TWO_HOURS: RegistrationSchedule = {
    opening: {
        type: 'hours_before',
        value: 2,
    },
    closing: {
        type: 'at_match_start',
    },
};

/**
 * Example 2: Opens 3 days before at 6 PM
 */
export const EXAMPLE_THREE_DAYS: RegistrationSchedule = {
    opening: {
        type: 'days_before',
        value: 3,
        timeOfDay: '18:00',
    },
    closing: {
        type: 'at_match_start',
    },
};

/**
 * Example 3: Opens 1 week before at 12 PM, closes 2 hours before match
 */
export const EXAMPLE_ONE_WEEK_EARLY_CLOSE: RegistrationSchedule = {
    opening: {
        type: 'weeks_before',
        value: 1,
        timeOfDay: '12:00',
    },
    closing: {
        type: 'hours_before',
        value: 2,
    },
};

/**
 * Example 4: Fixed date registration
 */
export const EXAMPLE_FIXED_DATE: RegistrationSchedule = {
    opening: {
        type: 'fixed_date',
        fixedDateTime: '2025-01-15T18:00:00Z',
    },
    closing: {
        type: 'at_match_start',
    },
};

/**
 * Example 5: Always open
 */
export const EXAMPLE_ALWAYS_OPEN: RegistrationSchedule = {
    opening: {
        type: 'always_open',
    },
    closing: {
        type: 'at_match_start',
    },
};
