import { NavigationBaseService } from "./NavigationBaseService";

class TabNavigationService extends NavigationBaseService {
    constructor() {
        super('main');
    }
    // navigateToLeagueTab(): void {
    //     this.safeNavigate({ screen: 'leagueTab' });
    // }
    navigateToMatchesTab(): void {
        this.safeNavigate({ screen: 'matchesTab' });
    }
    navigateToSettingsTab(): void {
        this.safeNavigate({ screen: 'settingsTab' });
    }
    navigateToHomeTab(): void {
        this.safeNavigate({
            screen: 'homeTab',
            params: { screen: 'homeScreen' }
        });
    }
    navigateToStatsTab(): void {
        this.safeNavigate({ screen: 'statsTab' });
    }
    navigateToProfileTab(): void {
        this.safeNavigate({ screen: 'profileTab' });
    }
}
export default new TabNavigationService();