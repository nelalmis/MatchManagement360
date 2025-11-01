// src/types/entity/recurringPattern.types.ts
// 🚀 ADVANCED RECURRING PATTERN - Full Featured

/**
 * Recurring Pattern Types
 */
export type RecurringPatternType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

/**
 * Day of Week
 * 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * End Condition Type
 */
export type EndConditionType = 'date' | 'count' | 'never';

/**
 * End Condition Configuration
 */
export interface EndCondition {
  /**
   * How the pattern should end
   * - date: End on specific date
   * - count: End after N occurrences
   * - never: Never ending
   */
  type: EndConditionType;

  /**
   * End date (ISO string)
   * Required if type = 'date'
   */
  endDate?: string;

  /**
   * Number of occurrences
   * Required if type = 'count'
   */
  occurrenceCount?: number;
}

/**
 * Recurring Pattern Interface
 * Supports multiple scheduling strategies
 */
export interface RecurringPattern {
  /**
   * Pattern type
   */
  type: RecurringPatternType;

  /**
   * Base interval in days
   * - weekly: 7
   * - biweekly: 14
   * - monthly: 30 (approximate)
   * - custom: any value
   */
  interval: number;

  /**
   * Specific days of week (optional)
   * Used for weekly/biweekly patterns
   * Example: [2] = Every Tuesday
   * Example: [2, 5] = Every Tuesday and Friday
   */
  daysOfWeek?: DayOfWeek[];

  /**
   * Specific day of month (optional)
   * Used for monthly patterns
   * Example: 15 = 15th of every month
   * Range: 1-31
   */
  dayOfMonth?: number;

  /**
   * End condition (optional)
   * If not provided, pattern never ends
   */
  endCondition?: EndCondition;
}

// ============================================
// PATTERN PRESETS
// ============================================

/**
 * Common pattern presets for quick creation
 */
export const PATTERN_PRESETS = {
  /**
   * Every Tuesday at same time
   */
  WEEKLY_TUESDAY: {
    type: 'weekly' as RecurringPatternType,
    interval: 7,
    daysOfWeek: [2] as DayOfWeek[],
  },

  /**
   * Every Friday at same time
   */
  WEEKLY_FRIDAY: {
    type: 'weekly' as RecurringPatternType,
    interval: 7,
    daysOfWeek: [5] as DayOfWeek[],
  },

  /**
   * Tuesday and Friday every week
   */
  TWICE_WEEKLY: {
    type: 'weekly' as RecurringPatternType,
    interval: 7,
    daysOfWeek: [2, 5] as DayOfWeek[],
  },

  /**
   * Every other Tuesday
   */
  BIWEEKLY_TUESDAY: {
    type: 'biweekly' as RecurringPatternType,
    interval: 14,
    daysOfWeek: [2] as DayOfWeek[],
  },

  /**
   * 15th of every month
   */
  MONTHLY_15TH: {
    type: 'monthly' as RecurringPatternType,
    interval: 30,
    dayOfMonth: 15,
  },

  /**
   * Every 3 days
   */
  EVERY_3_DAYS: {
    type: 'custom' as RecurringPatternType,
    interval: 3,
  },

  /**
   * Every 10 days
   */
  EVERY_10_DAYS: {
    type: 'custom' as RecurringPatternType,
    interval: 10,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get day name in Turkish
 */
export const getDayNameTR = (day: DayOfWeek): string => {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[day];
};

/**
 * Get day name in English
 */
export const getDayNameEN = (day: DayOfWeek): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
};

/**
 * Get pattern display name
 */
export const getPatternDisplayName = (pattern: RecurringPattern): string => {
  let text = '';

  switch (pattern.type) {
    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = pattern.daysOfWeek.map(d => getDayNameTR(d));
        text = `Her ${dayNames.join(' ve ')}`;
      } else {
        text = 'Her hafta';
      }
      break;

    case 'biweekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = pattern.daysOfWeek.map(d => getDayNameTR(d));
        text = `İki haftada bir ${dayNames.join(' ve ')}`;
      } else {
        text = 'İki haftada bir';
      }
      break;

    case 'monthly':
      if (pattern.dayOfMonth) {
        text = `Her ayın ${pattern.dayOfMonth}. günü`;
      } else {
        text = 'Her ay';
      }
      break;

    case 'custom':
      text = `${pattern.interval} günde bir`;
      break;
  }

  // Add end condition
  if (pattern.endCondition) {
    switch (pattern.endCondition.type) {
      case 'date':
        if (pattern.endCondition.endDate) {
          const date = new Date(pattern.endCondition.endDate);
          text += ` (${date.toLocaleDateString('tr-TR')} tarihine kadar)`;
        }
        break;
      case 'count':
        if (pattern.endCondition.occurrenceCount) {
          text += ` (${pattern.endCondition.occurrenceCount} maç)`;
        }
        break;
      case 'never':
        text += ' (süresiz)';
        break;
    }
  }

  return text;
};

/**
 * Get short pattern description
 */
export const getPatternShortDescription = (pattern: RecurringPattern): string => {
  switch (pattern.type) {
    case 'weekly':
      return pattern.daysOfWeek && pattern.daysOfWeek.length > 0
        ? pattern.daysOfWeek.map(d => getDayNameTR(d)).join(', ')
        : 'Haftalık';
    case 'biweekly':
      return 'İki haftada bir';
    case 'monthly':
      return pattern.dayOfMonth ? `Ayın ${pattern.dayOfMonth}. günü` : 'Aylık';
    case 'custom':
      return `${pattern.interval} günde bir`;
    default:
      return 'Özel';
  }
};

/**
 * Validate pattern
 */
export const validatePattern = (pattern: RecurringPattern): { valid: boolean; error?: string } => {
  // Check interval
  if (pattern.interval < 1) {
    return { valid: false, error: 'Interval en az 1 gün olmalı' };
  }

  // Type-specific validation
  switch (pattern.type) {
    case 'weekly':
      if (pattern.interval !== 7) {
        return { valid: false, error: 'Haftalık pattern için interval 7 olmalı' };
      }
      break;
    case 'biweekly':
      if (pattern.interval !== 14) {
        return { valid: false, error: 'İki haftalık pattern için interval 14 olmalı' };
      }
      break;
    case 'monthly':
      if (pattern.interval !== 30) {
        return { valid: false, error: 'Aylık pattern için interval 30 olmalı' };
      }
      if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
        return { valid: false, error: 'Ayın günü 1-31 arasında olmalı' };
      }
      break;
    case 'custom':
      if (pattern.interval < 1 || pattern.interval > 365) {
        return { valid: false, error: 'Özel interval 1-365 gün arasında olmalı' };
      }
      break;
  }

  // Validate daysOfWeek
  if (pattern.daysOfWeek) {
    for (const day of pattern.daysOfWeek) {
      if (day < 0 || day > 6) {
        return { valid: false, error: 'Geçersiz gün değeri (0-6 arası olmalı)' };
      }
    }
  }

  // Validate end condition
  if (pattern.endCondition) {
    switch (pattern.endCondition.type) {
      case 'date':
        if (!pattern.endCondition.endDate) {
          return { valid: false, error: 'Bitiş tarihi belirtilmeli' };
        }
        const endDate = new Date(pattern.endCondition.endDate);
        if (isNaN(endDate.getTime())) {
          return { valid: false, error: 'Geçersiz bitiş tarihi' };
        }
        break;
      case 'count':
        if (!pattern.endCondition.occurrenceCount || pattern.endCondition.occurrenceCount < 1) {
          return { valid: false, error: 'Tekrar sayısı en az 1 olmalı' };
        }
        break;
    }
  }

  return { valid: true };
};

/**
 * Create pattern from type
 */
export const createPatternFromType = (type: RecurringPatternType): RecurringPattern => {
  switch (type) {
    case 'weekly':
      return { type, interval: 7 };
    case 'biweekly':
      return { type, interval: 14 };
    case 'monthly':
      return { type, interval: 30 };
    case 'custom':
      return { type, interval: 7 };
  }
};

// ============================================
// EXAMPLES
// ============================================

/**
 * Example 1: Every Tuesday
 */
export const EXAMPLE_EVERY_TUESDAY: RecurringPattern = {
  type: 'weekly',
  interval: 7,
  daysOfWeek: [2],
};

/**
 * Example 2: Tuesday and Friday every week
 */
export const EXAMPLE_TWICE_WEEKLY: RecurringPattern = {
  type: 'weekly',
  interval: 7,
  daysOfWeek: [2, 5],
};

/**
 * Example 3: 15th of every month
 */
export const EXAMPLE_MONTHLY_15TH: RecurringPattern = {
  type: 'monthly',
  interval: 30,
  dayOfMonth: 15,
};

/**
 * Example 4: Every 3 days for 20 matches
 */
export const EXAMPLE_CUSTOM_WITH_COUNT: RecurringPattern = {
  type: 'custom',
  interval: 3,
  endCondition: {
    type: 'count',
    occurrenceCount: 20,
  },
};

/**
 * Example 5: Every Tuesday until end of year
 */
export const EXAMPLE_WEEKLY_WITH_END_DATE: RecurringPattern = {
  type: 'weekly',
  interval: 7,
  daysOfWeek: [2],
  endCondition: {
    type: 'date',
    endDate: '2025-12-31',
  },
};

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if pattern is weekly
 */
export const isWeeklyPattern = (pattern: RecurringPattern): boolean => {
  return pattern.type === 'weekly';
};

/**
 * Check if pattern has specific days
 */
export const hasSpecificDays = (pattern: RecurringPattern): boolean => {
  return !!(pattern.daysOfWeek && pattern.daysOfWeek.length > 0);
};

/**
 * Check if pattern has day of month
 */
export const hasDayOfMonth = (pattern: RecurringPattern): boolean => {
  return pattern.dayOfMonth !== undefined;
};

/**
 * Check if pattern has end condition
 */
export const hasEndCondition = (pattern: RecurringPattern): boolean => {
  return pattern.endCondition !== undefined;
};
