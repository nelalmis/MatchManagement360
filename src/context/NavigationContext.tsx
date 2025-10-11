import React, { ReactNode, useState } from "react";
import { NavigationContextType } from "../types/types";
import { useNavigation as useNavigationRN, NavigationProp } from '@react-navigation/native';
import { IScreenNameTitleMap, ScreenNameTitleMap } from "../navigation/ScreenNameTitleMap";

// Navigation Stack Item interface
interface NavigationStackItem {
    page: string;
    params?: any;
}

// Navigation Context
const NavigationContext = React.createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Stack-based navigation history
    const [navigationStack, setNavigationStack] = useState<NavigationStackItem[]>([
        { page: 'login', params: null }
    ]);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [headerTitle, setHeaderTitle] = useState("Maç Yönetimi");
    const navigationRN = useNavigationRN<NavigationProp<any>>();

    // Get current page from stack
    const currentStackItem = navigationStack[navigationStack.length - 1];
    const currentPage = currentStackItem.page;
    const currentParams = currentStackItem.params;

    const navigation: NavigationContextType = {
        currentPage,
        params: currentParams,

        navigate: (page: string, params: any = null) => {
            console.log("navigate to page=" + page, "params=", params);

            // Update header title
            // const pageInfo = ScreenNameTitleMap.find((u: IScreenNameTitleMap) => u.code === page);
            // if (pageInfo?.isShowTitle) {
            //     setHeaderTitle(pageInfo.title);
            // } else {
            //     setHeaderTitle("");
            // }

            // Add to navigation stack
            setNavigationStack(prev => [...prev, { page, params }]);
            setMenuOpen(false);

            // React Navigation navigate
            navigationRN.navigate(page, params);
        },

        goBack: (returnParams?: any) => {
            if (navigationStack.length > 1) {
                setNavigationStack(prev => {
                    const newStack = prev.slice(0, -1);

                    if (returnParams) {
                        const lastIndex = newStack.length - 1;
                        newStack[lastIndex] = {
                            ...newStack[lastIndex],
                            params: {
                                ...newStack[lastIndex].params,
                                ...returnParams,
                                _refresh: Date.now()
                            }
                        };

                        // ✅ React Navigation params'ını güncelle
                        const previousPage = newStack[lastIndex].page;
                        const updatedParams = newStack[lastIndex].params;

                        // goBack sonrası params'ı set et
                        setTimeout(() => {
                            navigationRN.setParams(updatedParams);
                        }, 100);
                    }

                    return newStack;
                });

                // Update header
                if (navigationStack.length > 1) {
                    const previousPage = navigationStack[navigationStack.length - 2];
                    // const pageInfo = ScreenNameTitleMap.find((u: IScreenNameTitleMap) => u.code === previousPage.page);
                    // if (pageInfo?.isShowTitle) {
                    //     setHeaderTitle(pageInfo.title);
                    // } else {
                    //     setHeaderTitle("");
                    // }
                }

                navigationRN.goBack();
            }
        },
        menuOpen: menuOpen,
        setMenuOpen: (menuOpen: boolean) => setMenuOpen(menuOpen),
        headerTitle: headerTitle,
        setHeaderTitle: (title: string) => setHeaderTitle(title),
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