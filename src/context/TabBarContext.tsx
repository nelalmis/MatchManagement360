// 1. TAB BAR CONTEXT (Sadece tab kontrolü için)
// contexts/TabBarContext.tsx

import { useFocusEffect } from '@react-navigation/native';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabBarContextType {
    isTabBarVisible: boolean;
    hideTabBar: () => void;
    showTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType>({
    isTabBarVisible: true,
    hideTabBar: () => {},
    showTabBar: () => {},
});

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTabBarVisible, setIsTabBarVisible] = useState(true);

    const hideTabBar = useCallback(() => setIsTabBarVisible(false), []);
    const showTabBar = useCallback(() => setIsTabBarVisible(true), []);

    return (
        <TabBarContext.Provider value={{ isTabBarVisible, hideTabBar, showTabBar }}>
            {children}
        </TabBarContext.Provider>
    );
};

export const useTabBar = () => useContext(TabBarContext);

// Custom hook - Auto hide/show
export const useAutoHideTabBar = (shouldHide = true) => {
    const { hideTabBar, showTabBar } = useTabBar();
    
    useFocusEffect(
        useCallback(() => {
            if (shouldHide) {
                hideTabBar();
            }
            return () => {
                showTabBar();
            };
        }, [shouldHide, hideTabBar, showTabBar])
    );
};