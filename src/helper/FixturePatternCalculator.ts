// src/services/helpers/PatternCalculator.ts
// 🚀 ADVANCED PATTERN CALCULATOR - Full Featured

import {
  RecurringPattern,
  DayOfWeek,
  getDayNameTR,
  hasSpecificDays,
  hasDayOfMonth,
} from '../types/entity/recurringPattern';

export class PatternCalculator {
  // ============================================
  // MAIN CALCULATION METHOD
  // ============================================

  /**
   * Calculate next date based on pattern
   * @param from - Base date to calculate from
   * @param pattern - Recurring pattern configuration
   * @returns Next match date or null if pattern has ended
   */
  public static calculateNextDate(
    from: Date,
    pattern?: RecurringPattern
  ): Date | null {
    if (!pattern) return null;

    let nextDate: Date | null = null;

    switch (pattern.type) {
      case 'weekly':
        nextDate = this.getNextWeeklyDate(from, pattern);
        break;
      case 'biweekly':
        nextDate = this.getNextBiweeklyDate(from, pattern);
        break;
      case 'monthly':
        nextDate = this.getNextMonthlyDate(from, pattern);
        break;
      case 'custom':
        nextDate = this.getNextCustomDate(from, pattern);
        break;
    }

    // Check end condition
    if (pattern.endCondition && nextDate) {
      if (pattern.endCondition.type === 'date' && pattern.endCondition.endDate) {
        const endsAt = new Date(pattern.endCondition.endDate);
        if (nextDate > endsAt) {
          return null;
        }
      }
      // Note: 'count' type is handled by the caller
    }

    return nextDate;
  }

  // ============================================
  // PATTERN-SPECIFIC METHODS
  // ============================================

  /**
   * Get next weekly date
   * Supports specific days of week
   */
  private static getNextWeeklyDate(
    from: Date,
    pattern: RecurringPattern
  ): Date {
    const result = new Date(from);

    if (hasSpecificDays(pattern) && pattern.daysOfWeek) {
      // Find next occurrence of specified day(s)
      return this.findNextDayOfWeek(result, pattern.daysOfWeek, 7);
    } else {
      // Simple interval-based
      result.setDate(result.getDate() + pattern.interval);
      return result;
    }
  }

  /**
   * Get next biweekly date
   * Supports specific days of week
   */
  private static getNextBiweeklyDate(
    from: Date,
    pattern: RecurringPattern
  ): Date {
    const result = new Date(from);

    if (hasSpecificDays(pattern) && pattern.daysOfWeek) {
      // Find next occurrence of specified day(s) in 2 weeks
      return this.findNextDayOfWeek(result, pattern.daysOfWeek, 14);
    } else {
      // Simple interval-based
      result.setDate(result.getDate() + pattern.interval);
      return result;
    }
  }

  /**
   * Get next monthly date
   * Supports specific day of month
   */
  private static getNextMonthlyDate(
    from: Date,
    pattern: RecurringPattern
  ): Date {
    const result = new Date(from);

    if (hasDayOfMonth(pattern) && pattern.dayOfMonth) {
      // Set to specific day of month
      result.setDate(pattern.dayOfMonth);

      // If we're past that day this month, move to next month
      if (result <= from) {
        result.setMonth(result.getMonth() + 1);
        result.setDate(pattern.dayOfMonth);
      }

      // Handle months with fewer days (e.g., Feb 31 → Feb 28/29)
      if (result.getDate() !== pattern.dayOfMonth) {
        // Day doesn't exist in this month, use last day
        result.setDate(0); // Go to last day of previous month
        result.setMonth(result.getMonth() + 1);
        result.setDate(0); // Last day of target month
      }

      return result;
    } else {
      // Simple: Add one month
      result.setMonth(result.getMonth() + 1);
      return result;
    }
  }

  /**
   * Get next custom date
   * Simple interval-based
   */
  private static getNextCustomDate(
    from: Date,
    pattern: RecurringPattern
  ): Date {
    const result = new Date(from);
    result.setDate(result.getDate() + pattern.interval);
    return result;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Find next occurrence of specified day(s) of week
   * @param from - Starting date
   * @param daysOfWeek - Target days (0=Sunday, 6=Saturday)
   * @param minDaysAhead - Minimum days to look ahead (7 for weekly, 14 for biweekly)
   */
  private static findNextDayOfWeek(
    from: Date,
    daysOfWeek: DayOfWeek[],
    minDaysAhead: number
  ): Date {
    const result = new Date(from);
    const currentDay = result.getDay();

    // Sort target days
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

    // Find next occurrence
    let daysToAdd = 0;
    let found = false;

    // First, check if any target day is coming this week
    for (const targetDay of sortedDays) {
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilTarget > 0) {
        // This day is coming this week
        daysToAdd = daysUntilTarget;
        found = true;
        break;
      }
    }

    // If not found this week, take the first day of next cycle
    if (!found || daysToAdd < 1) {
      const firstTargetDay = sortedDays[0];
      daysToAdd = ((firstTargetDay - currentDay + 7) % 7) + minDaysAhead;
    }

    // Ensure we meet minimum days ahead requirement
    if (minDaysAhead > 7 && daysToAdd < minDaysAhead) {
      daysToAdd += 7;
    }

    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  /**
   * Get all target days in a week starting from a date
   */
  private static getTargetDaysInWeek(
    weekStart: Date,
    daysOfWeek: DayOfWeek[]
  ): Date[] {
    const dates: Date[] = [];
    const startDay = weekStart.getDay();

    for (const targetDay of daysOfWeek) {
      const date = new Date(weekStart);
      const daysToAdd = (targetDay - startDay + 7) % 7;
      date.setDate(date.getDate() + daysToAdd);
      dates.push(date);
    }

    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  // ============================================
  // ADVANCED FUNCTIONS
  // ============================================

  /**
   * Generate multiple future dates based on pattern
   * @param startDate - Starting date
   * @param pattern - Recurring pattern
   * @param maxCount - Maximum number of dates to generate
   * @returns Array of future dates
   */
  public static generateFutureDates(
    startDate: Date,
    pattern: RecurringPattern,
    maxCount: number = 10
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    // Apply end condition count limit if exists
    const limit = pattern.endCondition?.type === 'count'
      ? Math.min(pattern.endCondition.occurrenceCount || maxCount, maxCount)
      : maxCount;

    // Special handling for multi-day weekly patterns
    if (
      (pattern.type === 'weekly' || pattern.type === 'biweekly') &&
      hasSpecificDays(pattern) &&
      pattern.daysOfWeek &&
      pattern.daysOfWeek.length > 1
    ) {
      return this.generateMultiDayWeeklyDates(startDate, pattern, limit);
    }

    // Standard generation
    for (let i = 0; i < limit; i++) {
      if (i === 0) {
        dates.push(new Date(currentDate));
      } else {
        const nextDate = this.calculateNextDate(currentDate, pattern);
        if (!nextDate) break;
        dates.push(nextDate);
        currentDate = nextDate;
      }
    }

    return dates;
  }

  /**
   * Generate dates for multi-day weekly patterns (e.g., Tuesday and Friday)
   */
  private static generateMultiDayWeeklyDates(
    startDate: Date,
    pattern: RecurringPattern,
    maxCount: number
  ): Date[] {
    const dates: Date[] = [];
    let currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    const weeksNeeded = Math.ceil(maxCount / (pattern.daysOfWeek?.length || 1));
    const intervalWeeks = pattern.type === 'biweekly' ? 2 : 1;

    for (let week = 0; week < weeksNeeded; week++) {
      const weekDates = this.getTargetDaysInWeek(
        currentWeekStart,
        pattern.daysOfWeek!
      );

      for (const date of weekDates) {
        if (date >= startDate && dates.length < maxCount) {
          // Check end condition
          if (pattern.endCondition?.type === 'date' && pattern.endCondition.endDate) {
            const endDate = new Date(pattern.endCondition.endDate);
            if (date > endDate) break;
          }
          dates.push(date);
        }
      }

      if (dates.length >= maxCount) break;

      // Move to next week cycle
      currentWeekStart.setDate(currentWeekStart.getDate() + (7 * intervalWeeks));
    }

    return dates.slice(0, maxCount);
  }

  /**
   * Check if a specific date matches the pattern
   */
  public static isDateInPattern(
    date: Date,
    startDate: Date,
    pattern: RecurringPattern
  ): boolean {
    const dates = this.generateFutureDates(startDate, pattern, 100);
    return dates.some(d =>
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  }

  /**
   * Calculate days until next match
   */
  public static daysUntilNextMatch(
    today: Date,
    pattern: RecurringPattern,
    lastMatchDate: Date
  ): number | null {
    const nextDate = this.calculateNextDate(lastMatchDate, pattern);
    if (!nextDate) return null;

    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Check if pattern has ended
   */
  public static hasPatternEnded(
    pattern: RecurringPattern,
    currentDate: Date,
    createdMatchCount?: number
  ): boolean {
    if (!pattern.endCondition) {
      return false;
    }

    switch (pattern.endCondition.type) {
      case 'date':
        if (pattern.endCondition.endDate) {
          const endDate = new Date(pattern.endCondition.endDate);
          return currentDate > endDate;
        }
        return false;

      case 'count':
        if (pattern.endCondition.occurrenceCount && createdMatchCount !== undefined) {
          return createdMatchCount >= pattern.endCondition.occurrenceCount;
        }
        return false;

      case 'never':
        return false;

      default:
        return false;
    }
  }

  /**
   * Get pattern summary text
   */
  public static getPatternSummary(pattern: RecurringPattern): string {
    let summary = '';

    // Type and days
    switch (pattern.type) {
      case 'weekly':
        if (hasSpecificDays(pattern) && pattern.daysOfWeek) {
          const dayNames = pattern.daysOfWeek.map(d => getDayNameTR(d));
          summary = `Her ${dayNames.join(' ve ')}`;
        } else {
          summary = 'Her hafta';
        }
        break;
      case 'biweekly':
        if (hasSpecificDays(pattern) && pattern.daysOfWeek) {
          const dayNames = pattern.daysOfWeek.map(d => getDayNameTR(d));
          summary = `İki haftada bir ${dayNames.join(' ve ')}`;
        } else {
          summary = 'İki haftada bir';
        }
        break;
      case 'monthly':
        if (hasDayOfMonth(pattern) && pattern.dayOfMonth) {
          summary = `Her ayın ${pattern.dayOfMonth}. günü`;
        } else {
          summary = 'Her ay';
        }
        break;
      case 'custom':
        summary = `${pattern.interval} günde bir`;
        break;
    }

    return summary;
  }

  /**
   * Validate pattern configuration
   */
  public static validatePattern(pattern: RecurringPattern): {
    valid: boolean;
    error?: string;
  } {
    // Import validation from types file
    // This is just a wrapper
    if (pattern.interval < 1) {
      return { valid: false, error: 'Interval 1\'den küçük olamaz' };
    }

    // Type-specific validation
    if (pattern.type === 'weekly' && pattern.interval !== 7) {
      return { valid: false, error: 'Haftalık için interval 7 olmalı' };
    }

    if (pattern.type === 'biweekly' && pattern.interval !== 14) {
      return { valid: false, error: 'İki haftalık için interval 14 olmalı' };
    }

    if (pattern.type === 'monthly' && pattern.interval !== 30) {
      return { valid: false, error: 'Aylık için interval 30 olmalı' };
    }

    return { valid: true };
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Every Tuesday
const pattern1: RecurringPattern = {
  type: 'weekly',
  interval: 7,
  daysOfWeek: [2],
};
const nextTuesday = PatternCalculator.calculateNextDate(new Date(), pattern1);

// Example 2: Tuesday and Friday every week
const pattern2: RecurringPattern = {
  type: 'weekly',
  interval: 7,
  daysOfWeek: [2, 5],
};
const dates = PatternCalculator.generateFutureDates(new Date(), pattern2, 10);
// → [Date(Tue), Date(Fri), Date(Tue), Date(Fri), ...]

// Example 3: 15th of every month
const pattern3: RecurringPattern = {
  type: 'monthly',
  interval: 30,
  dayOfMonth: 15,
};
const next15th = PatternCalculator.calculateNextDate(new Date(), pattern3);

// Example 4: Every 3 days for 20 matches
const pattern4: RecurringPattern = {
  type: 'custom',
  interval: 3,
  endCondition: { type: 'count', occurrenceCount: 20 },
};
const allDates = PatternCalculator.generateFutureDates(new Date(), pattern4, 20);

// Example 5: Check pattern summary
const summary = PatternCalculator.getPatternSummary(pattern2);
// → "Her Salı ve Cuma"
*/

export default PatternCalculator;