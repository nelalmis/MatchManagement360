import { NavigationBaseService, navigationRef } from "./NavigationBaseService";

class AuthNavigationService extends NavigationBaseService {
    constructor() {
        super('auth');
    }
    resetToAuth(): void {
        this.resetToAuth();
    }

    navigateToRegister(): void {
        // @ts-ignore
        this.safeNavigate({ screen: 'register' });
    }

    navigateToPhoneVerification(phoneNumber: string): void {
        this.safeNavigate({ screen: 'phoneVerification', params: { phoneNumber } });
    }    
}
    
export default new AuthNavigationService();