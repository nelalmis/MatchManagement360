import { MatchNavigationBaseService } from "./MatchNavigationServiceBase";

class MyMatchesNavigationService extends MatchNavigationBaseService {
    constructor() {
        super('myMatches');
    }
}

export default new MyMatchesNavigationService();