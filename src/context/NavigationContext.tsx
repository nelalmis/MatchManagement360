import React, { ReactNode, useState } from "react";
import { NavigationContextType } from "../types/types";
import { useNavigation as useNavigationRN, NavigationProp } from '@react-navigation/native';

// Navigation Context
const NavigationContext = React.createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [history, setHistory] = useState<string[]>(['home']);
    const [pageParams, setPageParams] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState<string>('login');
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [headerTitle, setHeaderTitle] = useState("Maç Yönetimi");
    const navigationRN = useNavigationRN<NavigationProp<any>>();
    const navigation: NavigationContextType = {
        currentPage,
        navigate: (page: string, params: any = null) => {
            setHeaderTitle("");
            setCurrentPage(page);
            setPageParams(params);
            setHistory(prev => [...prev, page]);
            setMenuOpen(false);
            navigationRN.navigate(page, params);
        },
        goBack: () => {
            if (history.length > 1) {
                const newHistory = [...history];
                newHistory.pop();
                const previousPage = newHistory[newHistory.length - 1];
                setCurrentPage(previousPage);
                navigationRN.navigate(previousPage);
                setHistory(newHistory);
                setPageParams(null);
                setHeaderTitle("");
            }
        },
        menuOpen: menuOpen,
        setMenuOpen: (menuOpen: boolean) => setMenuOpen(menuOpen),
        headerTitle: headerTitle,
        setHeaderTitle: (title: string) => setHeaderTitle(title)
    };
    return (
        <NavigationContext.Provider value={navigation}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigationContext = (): NavigationContextType => {
    const context = React.useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within NavigationProvider');
    }
    return context;
};
