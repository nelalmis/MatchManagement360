// ============================================
// config/environment.ts
// ============================================

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  isTest: boolean;
  current: Environment;
}

/**
 * Get current environment configuration
 */
export const getEnvironment = (): EnvironmentConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const customEnv = process.env.REACT_APP_ENV || process.env.VITE_ENV;
  console.log('Current Environment:', customEnv || nodeEnv);
  // Custom env varsa onu kullan, yoksa NODE_ENV'i kullan
  const current = (customEnv || nodeEnv) as Environment;
  
  return {
    isDevelopment: current === 'development',
    isStaging: current === 'staging',
    isProduction: current === 'production',
    isTest: current === 'test',
    current,
  };
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironment().isDevelopment;
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironment().isProduction;
};

/**
 * Check if running in staging mode
 */
export const isStaging = (): boolean => {
  return getEnvironment().isStaging;
};

/**
 * Check if running in test mode
 */
export const isTest = (): boolean => {
  return getEnvironment().isTest;
};

// Export environment instance
export const environment = getEnvironment();