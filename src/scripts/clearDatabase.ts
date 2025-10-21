// src/scripts/clearDatabase.ts
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

const COLLECTIONS = [
  'users',
  'leagues',
  'seasons',
  'fixtures',
  'matches',
  'standings',
  'player_stats',
  'ratings',
  'comments',
  'invitations',
  'notifications',
  'activity_logs',
  'app_config',
  'user_settings',
  'league_settings',
  'faqs',
  'announcements',
  'feedbacks',
  'player_profiles',
  'player_rating_profiles',
  'friendly_match_configs',
  'system_logs',
];

async function clearCollection(collectionName: string) {
  console.log(`   Clearing ${collectionName}...`);
  
  const snapshot = await getDocs(collection(db, collectionName));
  
  if (snapshot.empty) {
    console.log(`   ✓ ${collectionName} is already empty`);
    return;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach((document) => {
    batch.delete(doc(db, collectionName, document.id));
    count++;
  });

  await batch.commit();
  console.log(`   ✓ Deleted ${count} documents from ${collectionName}`);
}

async function main() {
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗑️  CLEAR FIREBASE DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n');

  // Onay iste
  console.warn('⚠️  WARNING: This will DELETE ALL DATA!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log('🗑️  Starting database clear...\n');

    for (const collectionName of COLLECTIONS) {
      await clearCollection(collectionName);
    }

    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database cleared successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to clear database:', error);
    process.exit(1);
  }
}

main();