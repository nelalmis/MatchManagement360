import { IMatch } from "../types/entity/types";
import { IPlayer } from "../types/entity/types";

const formatPhoneNumber = (value: any) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
};
// helper/profileHelper.ts
const isProfileComplete = (user: IPlayer | null): boolean => {
    if (!user) return false;
    
    const requiredFields = ['name', 'surname'];
    return requiredFields.every(field => user[field as keyof IPlayer]);
};


  const isPlayerInMatch = (eligiblePlayers: { all: string[]; squad: string[]; reserve: string[] }, match: IMatch, playerId: string): boolean => {
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


export {
    formatPhoneNumber,
    isProfileComplete,
    isPlayerInMatch
}