import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from '../api/firestoreApiBase';
const collectionName = 'matchOrganizationSetups';
// Maç ekle
export async function add(matchData: any) {
    return addBase(collectionName, matchData);
}

// Tüm maçları getir
export async function getAllMatchOrganizationSetups() {
   return getAllBase(collectionName);
}

export async function getMatchOrganizationSetupById(id: string) {
  return getByIdBase(collectionName, id);
}

// Maç güncelle
export async function updateMatchOrganizationSetup(id: string, updates: any) {
   return updateBase(collectionName,id,updates);
}

// Maç sil
export async function deleteMatchOrganizationSetupById(id: string) {
  return deleteByIdBase(collectionName, id);
}

