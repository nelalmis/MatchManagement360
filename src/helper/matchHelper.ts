import { IMatch, MatchStatus } from "../types/entity/types";

export const isPlayerInMatch = (playerId: string | null, match: IMatch): boolean => {
    if (!playerId) return false;

    if (match.players.registered?.some(r => r.playerId === playerId)) return true;
    if (match.players.guests?.includes(playerId)) return true;
    if (match.players.teams) {
        const inTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
        const inTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);
        if (inTeam1 || inTeam2) return true;
    }

    return false;
};

const isPlayerInMatchV2 = (eligiblePlayers: { all: string[]; squad: string[]; reserve: string[] }, match: IMatch, playerId: string): boolean => {
    if (eligiblePlayers.all.some(id => id === playerId)) return true;

    // Check registered
    if (match.players.registered?.some(r => r.playerId === playerId)) return true;

    // Check guests
    if (match.players.guests?.includes(playerId)) return true;

    // Check teams
    if (match.players.teams) {
        const inTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
        const inTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);
        return inTeam1 || inTeam2;
    }

    return false;
};


export const getMatchStatusColor = (status: MatchStatus): string => {
    switch (status) {
        case MatchStatus.CREATED: return '#9CA3AF';
        case MatchStatus.REGISTRATION_OPEN: return '#10B981';
        case MatchStatus.REGISTRATION_CLOSED: return '#F59E0B';
        case MatchStatus.TEAMS_SET: return '#2563EB';
        case MatchStatus.IN_PROGRESS: return '#8B5CF6';
        case MatchStatus.AWAITING_SCORE: return '#F59E0B';
        case MatchStatus.COMPLETED: return '#16a34a';
        case MatchStatus.CANCELLED: return '#DC2626';
        default: return '#6B7280';
    }
};

export const getMatchStatusText = (status: MatchStatus): string => {
    switch (status) {
        case MatchStatus.CREATED: return 'Oluşturuldu';
        case MatchStatus.REGISTRATION_OPEN: return 'Kayıt Açık';
        case MatchStatus.REGISTRATION_CLOSED: return 'Kayıt Kapandı';
        case MatchStatus.TEAMS_SET: return 'Takımlar Kuruldu';
        case MatchStatus.IN_PROGRESS: return 'Oynanıyor';
        case MatchStatus.AWAITING_SCORE: return 'Skor Bekleniyor';
        case MatchStatus.COMPLETED: return 'Tamamlandı';
        case MatchStatus.CANCELLED: return 'İptal';
        default: return status;
    }
};


export const getMatchResultBadge = (match: IMatch, playerId: string) => {
    if (!match.players.teams || !match.score) return null;

    const isInTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
    const isInTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);

    if (!isInTeam1 && !isInTeam2) return null;

    const team1Score = match.score.team1;
    const team2Score = match.score.team2;

    let result: 'win' | 'draw' | 'loss';
    if (isInTeam1) {
        if (team1Score > team2Score) result = 'win';
        else if (team1Score < team2Score) result = 'loss';
        else result = 'draw';
    } else {
        if (team2Score > team1Score) result = 'win';
        else if (team2Score < team1Score) result = 'loss';
        else result = 'draw';
    }

    return result;
};
