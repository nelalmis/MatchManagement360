import { IPlayer } from "../types/types";

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

export {
    formatPhoneNumber,
    isProfileComplete
}