import { IMatch, IMatchFixture } from '../types/types';

/**
 * Bir oyuncunun bir maça kayıt olup olamayacağını kontrol eder.
 * @param match IMatch
 * @param userId string | number
 * @param fixture IMatchFixture
 */
export function canRegisterToMatch(
  match: IMatch | null,
  userId: string | number | undefined,
  fixture: IMatchFixture | null
): boolean {
  if (!match || !userId || !fixture) return false;
  const now = new Date();
  if (match.status !== 'Kayıt Açık') return false;
  if (now < new Date(match.registrationTime)) return false;
  if (now > new Date(match.registrationEndTime)) return false;
  if (match.registeredPlayerIds?.includes(String(userId))) return false;
  if (match.reservePlayerIds?.includes(String(userId))) return false;
  const totalRegistered = match.registeredPlayerIds?.length || 0;
  const totalDirect = match.directPlayerIds?.length || 0;
  const staffSlots = fixture.staffPlayerCount || 0;
  const occupied = totalRegistered + totalDirect;
  if (occupied >= staffSlots) return false;
  return true;
}
