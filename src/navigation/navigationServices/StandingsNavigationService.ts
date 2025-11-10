import { NavigationBaseService } from "./NavigationBaseService";

class StandingsNavigationService extends NavigationBaseService {
    constructor() {
        super('main', 'leagueFlow');
    }

    navigateToPlayerStats(playerId?: string, leagueId?: string): void {
        this.safeNavigate({
            screen: 'playerStats',
            params: { playerId, leagueId },
        });
    }
    navigateToStandingsList(): void {
        this.safeNavigate({ screen: 'standingsList' });
    }

    navigateToStandings(leagueId: string): void {
        this.safeNavigate({
            screen: 'standings',
            params: { leagueId },
        });
    }

    navigateToTopScorers(leagueId: string): void {
        this.safeNavigate({
            screen: 'topScorers',
            params: { leagueId },
        });
    }

    navigateToTopAssists(leagueId: string): void {
        this.safeNavigate({
            screen: 'topAssists',
            params: { leagueId },
        });
    }

    navigateToMVP(leagueId: string): void {
        this.safeNavigate({
            screen: 'mvp',
            params: { leagueId },
        });
    }

}
export default new StandingsNavigationService();