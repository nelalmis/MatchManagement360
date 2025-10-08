// ============================================
// AppContext.tsx - Global State Management
// ============================================

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppContextType, IPlayer } from '../types/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IPlayer | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [currentScreen, setCurrentScreen] = useState<string>('login');
  const [countdown, setCountdown] = useState(0);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const value: AppContextType = {
    user,
    setUser,
    phoneNumber,
    setPhoneNumber,
    currentScreen,
    setCurrentScreen,
    countdown,
    setCountdown,
    rememberDevice,
    setRememberDevice,
    isVerified,
    setIsVerified
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

