import { NavigationBaseService } from "./NavigationBaseService";

class FixtureNavigationService extends NavigationBaseService {
    constructor() {
        super('main', 'leagueFlow');
    }
    
    navigateToFixtureList(leagueId: string): void {
        this.safeNavigate({
            screen: 'fixtureList',
            params: { leagueId },
        });
    }

    navigateToFixtureDetail(fixtureId: string): void {
        this.safeNavigate({
            screen: 'fixtureDetail',
            params: { fixtureId },
        });
    }

    navigateToCreateFixture(leagueId: string): void {
        this.safeNavigate({
            screen: 'createFixture',
            params: { leagueId },
        });
    }

    navigateToEditFixture(fixtureId: string): void {
        this.safeNavigate({
            screen: 'editFixture',
            params: { fixtureId },
        });
    }
}

export default new FixtureNavigationService();