import { IFixture } from "../types/entity/types";

export const isOrganizer = (fixture: IFixture, playerId: string): boolean => {
    return fixture.permissions.organizers.includes(playerId);
};