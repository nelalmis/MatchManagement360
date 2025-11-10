import { NavigationBaseService } from "./NavigationBaseService";

class ProfileNavigationService extends NavigationBaseService {
    constructor() {
        super('main', 'profileTab');
    }


    navigateToPlayerProfile(playerId?: string): void {
        this.safeNavigate({
            screen: 'playerProfile',
            params: playerId ? { playerId } : {}

        });
    }

    // navigateToEditProfile(): void {
    //     this.safeNavigate( {
    //         screen: 'profileTab',
    //         params: { screen: 'editProfile' }
    //     });
    // }

    navigateToPlayerStats(playerId?: string, leagueId?: string): void {
        this.safeNavigate({
            screen: 'playerStats',
            params: { playerId, leagueId }

        });
    }

    // navigateToSettings(): void {
    //     this.safeNavigate( {
    //         screen: 'profileTab',
    //         params: { screen: 'settings' }
    //     });
    // }

    // navigateToSelectPositions(): void {
    //     this.safeNavigate( {
    //         screen: 'profileTab',
    //         params: { screen: 'selectPositions' }
    //     });
    // }
}

export default new ProfileNavigationService();