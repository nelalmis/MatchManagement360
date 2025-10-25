// src/utils/theme.ts
import { SportType } from '../types/entity/types';

// ============================================
// SPORT-SPECIFIC COLOR PALETTES
// ============================================

export const sportThemes = {
  Futbol: {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#22c55e',
    gradient: ['#16a34a', '#15803d'] as const,
    emoji: '⚽',
    background: '#f0fdf4', // green-50
    lightBackground: '#dcfce7', // green-100
  },
  Basketbol: {
    primary: '#f59e0b',
    primaryDark: '#d97706',
    primaryLight: '#fbbf24',
    gradient: ['#f59e0b', '#d97706'] as const,
    emoji: '🏀',
    background: '#fffbeb', // amber-50
    lightBackground: '#fef3c7', // amber-100
  },
  Voleybol: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    gradient: ['#2563eb', '#1d4ed8'] as const,
    emoji: '🏐',
    background: '#eff6ff', // blue-50
    lightBackground: '#dbeafe', // blue-100
  },
  Tenis: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    gradient: ['#10b981', '#059669'] as const,
    emoji: '🎾',
    background: '#ecfdf5', // emerald-50
    lightBackground: '#d1fae5', // emerald-100
  },
  'Masa Tenisi': {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    emoji: '🏓',
    background: '#faf5ff', // violet-50
    lightBackground: '#f3e8ff', // violet-100
  },
  Badminton: {
    primary: '#ec4899',
    primaryDark: '#db2777',
    primaryLight: '#f472b6',
    gradient: ['#ec4899', '#db2777'] as const,
    emoji: '🏸',
    background: '#fdf2f8', // pink-50
    lightBackground: '#fce7f3', // pink-100
  },
} as const;

// ============================================
// COMMON COLORS (Sport-agnostic)
// ============================================

export const commonColors = {
  // Semantic colors
  success: '#10b981',
  successDark: '#059669',
  successLight: '#34d399',
  
  error: '#ef4444',
  errorDark: '#dc2626',
  errorLight: '#f87171',
  
  warning: '#f59e0b',
  warningDark: '#d97706',
  warningLight: '#fbbf24',
  
  info: '#3b82f6',
  infoDark: '#2563eb',
  infoLight: '#60a5fa',
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text colors
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
    disabled: '#cbd5e1',
    placeholder: '#94a3b8',
  },
  
  // Border colors
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    dark: '#94a3b8',
    focus: '#3b82f6',
  },
  
  // Overlay colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Card colors
  card: {
    background: '#ffffff',
    border: '#e2e8f0',
    hover: '#f8fafc',
  },
  
  // Input colors
  input: {
    background: '#ffffff',
    border: '#e2e8f0',
    focus: '#3b82f6',
    error: '#ef4444',
    disabled: '#f1f5f9',
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.25,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.25,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.25,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const;

// ============================================
// SPACING
// ============================================

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

// ============================================
// ANIMATIONS
// ============================================

export const animations = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ============================================
// BREAKPOINTS (for responsive design)
// ============================================

export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

// ============================================
// THEME GENERATOR
// ============================================

/**
 * Seçilen spora göre dinamik tema oluşturur
 * @param sport - Spor türü
 * @returns Tam tema objesi
 */
export const getThemeForSport = (sport: SportType) => {
  const sportTheme = sportThemes[sport];
  
  return {
    sport: sportTheme,
    colors: commonColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    breakpoints,
    zIndex,
  } as const;
};

// ============================================
// DEFAULT THEME (Futbol)
// ============================================

export const defaultTheme = getThemeForSport('Futbol');

// ============================================
// THEME TYPE
// ============================================

export type Theme = ReturnType<typeof getThemeForSport>;
export type SportTheme = typeof sportThemes[SportType];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Spor emoji'sini getirir
 */
export const getSportEmoji = (sport: SportType): string => {
  return sportThemes[sport].emoji;
};

/**
 * Spor ana rengini getirir
 */
export const getSportPrimaryColor = (sport: SportType): string => {
  return sportThemes[sport].primary;
};

/**
 * Spor gradient renklerini getirir
 */
export const getSportGradient = (sport: SportType): readonly [string, string] => {
  return sportThemes[sport].gradient;
};

/**
 * Spor arka plan rengini getirir
 */
export const getSportBackgroundColor = (sport: SportType): string => {
  return sportThemes[sport].background;
};

/**
 * Opacity ile renk oluşturur
 */
export const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Rengi koyulaştırır
 */
export const darkenColor = (color: string, amount: number = 0.1): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount * 255);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount * 255);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount * 255);
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};

/**
 * Rengi açar
 */
export const lightenColor = (color: string, amount: number = 0.1): string => {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount * 255);
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount * 255);
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount * 255);
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};