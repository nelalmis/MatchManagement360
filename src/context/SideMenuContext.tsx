// context/SideMenuContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SideMenuContextType {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export const SideMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <SideMenuContext.Provider value={{ isOpen, openMenu, closeMenu, toggleMenu }}>
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error('useSideMenu must be used within SideMenuProvider');
  }
  return context;
};