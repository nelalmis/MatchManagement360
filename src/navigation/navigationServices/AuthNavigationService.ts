import { NavigationBaseService, navigationRef } from "./NavigationBaseService";

class AuthNavigationService extends NavigationBaseService {
    constructor() {
        super('auth');
    }
    resetToAuth(): void {
        this.resetToAuth();
    }

    navigateToWelcome(): void {
        this.safeNavigate({ screen: 'welcome' });
    }
    navigateToLogin(): void {
        this.safeNavigate({ screen: 'login' });
    }

    navigateToSplash(): void {
        this.safeNavigate({ screen: 'splash' });
    }

    navigateToRegister(): void {
        // @ts-ignore
        this.safeNavigate({ screen: 'register' });
    }
    navigateToForgotPassword(email: string): void {
        this.safeNavigate({ screen: 'forgotPassword', params: { email } });
    }

    navigateToEmailVerification(email: string): void {
        this.safeNavigate({ screen: 'emailVerification', params: { email } });
    }

    navigateToPhoneVerification(phoneNumber: string): void {
        this.safeNavigate({ screen: 'phoneVerification', params: { phoneNumber } });
    }    
    navigateToCompleteProfile(): void {
        this.safeNavigate({ screen: 'completeProfile' });
    }
}
    
export default new AuthNavigationService();