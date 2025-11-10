import { InvitationType } from "../../types/entity/invitation";
import { SportType } from "../../types/entity/types";
import { NavigationBaseService } from "./NavigationBaseService";
type tabName = 'matchFlow' | 'myMatches';
export abstract class MatchNavigationBaseService extends NavigationBaseService {
    constructor(tabName: tabName = 'matchFlow') {
        super('main', tabName);
    }

    navigateToMatchList(params?: { leagueId?: string; fixtureId?: string }): void {
        this.safeNavigate({
            screen: 'matchList',
            params: params || {},
        });
    }

    navigateToMyMatches(playerId?: string): void {
        this.navigate({
            screen: 'myMatches',
            params: playerId ? { playerId } : {},
        })
    }

    navigateToMatchDetail(matchId: string): void {
        this.safeNavigate({
            screen: 'matchDetail',
            params: { matchId },
        });
    }

    navigateToCreateFriendlyMatch(templateId?: string): void {
        this.safeNavigate({
            screen: 'createFriendlyMatch',
            params: templateId ? { templateId } : {},
        });
    }

    navigateToFriendlyMatchInvitations(): void {
        this.safeNavigate({ screen: 'friendlyMatchInvitations' });
    }

    navigateToEditFriendlyMatch(matchId: string): void {
        this.safeNavigate({
            screen: 'editFriendlyMatch',
            params: { matchId },
        });
    }

    navigateToEditMatch(matchId: string): void {
        this.safeNavigate({
            screen: 'editMatch',
            params: { matchId },
        });
    }

    navigateToFriendlyMatchTemplates(): void {
        this.safeNavigate({ screen: 'friendlyMatchTemplates' });
    }

    navigateToCreateFriendlyMatchTemplate(): void {
        this.safeNavigate({ screen: 'createFriendlyMatchTemplate' });
    }

    navigateToEditFriendlyMatchTemplate(templateId: string): void {
        this.safeNavigate({
            screen: 'editFriendlyMatchTemplate',
            params: { templateId },
        });
    }

    navigateToMatchRegistration(matchId: string): void {
        this.safeNavigate({
            screen: 'matchRegistration',
            params: { matchId },
        });
    }

    navigateToTeamBuilding(matchId: string): void {
        this.safeNavigate({
            screen: 'teamBuilding',
            params: { matchId },
        });
    }

    navigateToScoreEntry(matchId: string): void {
        this.safeNavigate({
            screen: 'scoreEntry',
            params: { matchId },
        });
    }

    navigateToGoalAssistEntry(matchId: string): void {
        this.safeNavigate({
            screen: 'goalAssistEntry',
            params: { matchId },
        });
    }

    navigateToPlayerRating(matchId: string): void {
        this.safeNavigate({
            screen: 'playerRating',
            params: { matchId },
        });
    }

    navigateToPaymentTracking(matchId: string): void {
        this.safeNavigate({
            screen: 'paymentTracking',
            params: { matchId },
        });
    }
    navigateToPlayerPayment(matchId: string): void {
        this.safeNavigate({
            screen: 'playerPayment',
            params: { matchId },
        });
    }
    navigateToManageInvitations(matchId: string, matchTitle: string, sportType: SportType): void {
        this.safeNavigate({
            screen: 'manageInvitations',
            params: {
                type: InvitationType.MATCH,
                targetId: matchId,
                targetTitle: matchTitle,
                sportType,
            },
        });
    }

    navigateToCreateInvitation(matchId: string, matchTitle: string, sportType: SportType): void {
        this.safeNavigate({
            screen: 'createInvitation',
            params: {
                type: InvitationType.MATCH,
                targetId: matchId,
                targetTitle: matchTitle,
                sportType,
            },
        });
    }

    navigateToJoinWithCode(): void {
        this.safeNavigate({
            screen: 'joinWithCode',
            params: { type: InvitationType.MATCH },
        });
    }
}