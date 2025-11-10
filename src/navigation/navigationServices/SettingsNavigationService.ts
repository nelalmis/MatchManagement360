import { NavigationBaseService } from "./NavigationBaseService";

class SettingsNavigationService extends NavigationBaseService {
    constructor() {
        super('main', 'settingsFlow');
    }

    navigateToPlayerProfile(playerId?: string): void {
        this.safeNavigate({
            screen: 'playerProfile',
            params: playerId ? { playerId } : {},
        });
    }

    navigateToEditProfile(): void {
        this.safeNavigate({ screen: 'profileSettings' });
    }

    navigateToSettings(): void {
        this.safeNavigate({
            screen: 'settings',
        });
    }

    navigateToNotificationSettings(): void {
        this.safeNavigate({ screen: 'notificationSettings' });
    }
    navigateToAbout(): void {
        this.safeNavigate({ screen: 'about' });
    }
    navigateToHelp(): void {
        this.safeNavigate({ screen: 'help' });
    }
    navigateToTerms(): void {
        this.safeNavigate({ screen: 'terms' });
    }
    navigateToAccessibility(): void {
        this.safeNavigate({ screen: 'accessibility' });
    }
    navigateToAppearance(): void {
        this.safeNavigate({ screen: 'appearance' });
    }
    navigateToThemeSelection(): void {
        this.safeNavigate({ screen: 'themeSelection' });
    }
    navigateToCalendarSync(): void {
        this.safeNavigate({ screen: 'calendarSync' });
    }
    navigateToEmailNotifications(): void {
        this.safeNavigate({ screen: 'emailNotifications' });
    }
    navigateToInAppNotifications(): void {
        this.safeNavigate({ screen: 'inAppNotifications' });
    }
    navigateToPushNotifications(): void {
        this.safeNavigate({ screen: 'pushNotifications' });
    }
    navigateToQuietHours(): void {
        this.safeNavigate({ screen: 'quietHours' });
    }
    navigateToSmsNotifications(): void {
        this.safeNavigate({ screen: 'smsNotifications' });
    }
    navigateToAvailability(): void {
        this.safeNavigate({ screen: 'availability' });
    }
    navigateToSkillLevel(): void {
        this.safeNavigate({ screen: 'skillLevel' });
    }
    navigateToSportsPositions(): void {
        this.safeNavigate({ screen: 'sportsPositions' });
    }
    navigateToBlockedUsers(): void {
        this.safeNavigate({ screen: 'blockedUsers' });
    }
    navigateToDataSharing(): void {
        this.safeNavigate({ screen: 'dataSharing' });
    }
    navigateToPrivacySettings(): void {
        this.safeNavigate({ screen: 'privacySettings' });
    }
    navigateToSecuritySettings(): void {
        this.safeNavigate({ screen: 'securitySettings' });
    }
    navigateToGamePreferences(): void {
        this.safeNavigate({ screen: 'gamePreferences' });
    }
    navigateToPaymentPreferences(): void {
        this.safeNavigate({ screen: 'paymentPreferences' });
    }
}

export default new SettingsNavigationService();