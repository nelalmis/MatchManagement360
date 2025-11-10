import { InvitationType } from "../../types/entity/invitation";
import { NavigationBaseService } from "./NavigationBaseService";

class HomeNavigationService extends NavigationBaseService {
    constructor() {
        super('main', 'homeTab');
    }

    navigateToJoinWithCode(type: InvitationType): void {
        this.safeNavigate({
          screen: 'joinWithCode',
          params: { type },
        });
      }
}
export default new HomeNavigationService();