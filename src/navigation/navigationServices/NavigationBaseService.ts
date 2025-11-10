import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from '../types';
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
const navigationRefCustom = createNavigationContainerRef<any>();

export abstract class NavigationBaseService {

    protected rootStackName: keyof RootStackParamList;
    protected tabName?: keyof MainTabParamList | keyof AuthStackParamList;

    constructor(rootStackName: keyof RootStackParamList, tabName?: keyof MainTabParamList | keyof AuthStackParamList) {
        this.rootStackName = rootStackName;
        this.tabName = tabName;
    }
    // ============================================
    // CORE METHODS
    // ============================================

    static isReady(): boolean {
        return navigationRef.isReady();
    }

    static goBack(): void {
        if (this.isReady() && navigationRef.canGoBack()) {
            navigationRef.goBack();
        }
    }

    static getCurrentRoute() {
        if (this.isReady()) {
            return navigationRef.getCurrentRoute();
        }
        return null;
    }


    static resetToAuth(): void {
        if (this.isReady()) {
            navigationRef.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'auth' }],
                })
            );
        }
    }

    static resetToMain(): void {
        if (this.isReady()) {
            navigationRef.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'main' }],
                })
            );
        }
    }

    protected safeNavigate(params?: any) {
        if (navigationRef.isReady()) {
            navigationRef.navigate(this.rootStackName as keyof RootStackParamList, this.tabName ? {
                screen: this.tabName as keyof MainTabParamList | keyof AuthStackParamList,
                params: {
                    screen: params?.screen,
                    params: params?.params,
                },
            } : {
                screen: params?.screen,
                params: params?.params,
            });
        }
    }

    protected navigate(params?: any) {
        //navigate without tabName and rootStackName
        navigationRefCustom.navigate(params?.screen, params?.params);
    }
    // navigate(screen: string, params?: any) {
    //     this.safeNavigate({ screen, params });
    // }

    static navigateToMain(): void {
        this.resetToMain();
    }
}
