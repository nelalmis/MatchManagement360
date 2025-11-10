import { InvitationType } from "../../types/entity/invitation";
import { SportType } from "../../types/entity/types";
import { NavigationBaseService } from "./NavigationBaseService";

class LeagueNavigationService extends NavigationBaseService {
  constructor() {
    super('main','leagueFlow');
  }

  navigateToLeagueList(): void {
    this.safeNavigate({ screen: 'leagueList' });
  }

  navigateToLeagueDetail(leagueId: string): void {
    this.safeNavigate({
      screen: 'leagueDetail',
      params: { leagueId },
    });
  }

  navigateToCreateLeague(): void {
    this.safeNavigate({ screen: 'createLeague' });
  }

  navigateToEditLeague(leagueId: string): void {
    this.safeNavigate({
      screen: 'editLeague',
      params: { leagueId },
    });
  }

  navigateToManageInvitations(leagueId: string, leagueTitle: string, sportType: SportType): void {
    this.safeNavigate({
      screen: 'manageInvitations',
      params: {
        type: InvitationType.LEAGUE,
        targetId: leagueId,
        targetTitle: leagueTitle,
        sportType,
      },
    });
  }

  navigateToCreateInvitation(leagueId: string, leagueTitle: string, sportType: SportType): void {
    this.safeNavigate({
      screen: 'createInvitation',
      params: {
        type: InvitationType.LEAGUE,
        targetId: leagueId,
        targetTitle: leagueTitle,
        sportType,
      },
    });
  }

  navigateToJoinWithCode(): void {
    this.safeNavigate({
      screen: 'joinWithCode',
      params: { type: InvitationType.LEAGUE },
    });
  }

  navigateToLeagueSettings(leagueId: string): void {
    this.safeNavigate({
      screen: 'leagueSettings',
      params: { leagueId },
    });
  }
  navigateToManageLeagueMembers(leagueId: string): void {
    this.safeNavigate({
      screen: 'manageLeagueMembers',
      params: { leagueId },
    });
  }
}
export default new LeagueNavigationService();