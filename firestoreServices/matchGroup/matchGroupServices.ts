import { addBase, deleteByIdBase, getAllBase, getByIdBase, listenBase, updateBase } from '../firestoreServiceBase';
const collectionName = 'matchGroups';
// Maç ekle
export async function add(matchData: any) {
  return addBase(collectionName, matchData);
}

// Tüm maçları getir
export async function getAllMatchGroups() {
  return getAllBase(collectionName);
}

export async function getMatchGroupById(id: string) {
  return getByIdBase(collectionName, id);
}

// Maç güncelle
export async function updateMatchGroup(id: string, updates: any) {
  return updateBase(collectionName, id, updates);
}

// Maç sil
export async function deleteMatchGroupById(id: string) {
  return deleteByIdBase(collectionName, id);
}

export async function listenToMatchGroups(callback: (docs: any[]) => void) {
  return listenBase(collectionName, callback);
}