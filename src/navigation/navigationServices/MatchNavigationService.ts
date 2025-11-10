import { MatchNavigationBaseService } from "./MatchNavigationServiceBase";

class MatchNavigationService extends MatchNavigationBaseService {
    constructor() {
        super('matchFlow');
    }
}
export default new MatchNavigationService();
