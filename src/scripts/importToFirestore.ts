// scripts/importToFirestore.ts
// ============================================
// FIRESTORE IMPORT SCRIPT
// ============================================
// Generates seed data and imports to Firestore

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { generateFullSeedData } from './firebaseSeedV3';

// ============================================
// CONFIGURATION
// ============================================

const BATCH_SIZE = 500; // Firestore batch limit
const COLLECTIONS_MAP = {
  players: 'users',
  leagues: 'leagues',
  leagueSettings: 'league_settings',
  invitations: 'league_invitations',
  seasons: 'seasons',
  fixtures: 'fixtures',
  matches: 'matches',
  standings: 'standings',
  playerStats: 'player_stats',
  ratings: 'ratings',
  comments: 'match_comments',
};

// ============================================
// INITIALIZE FIREBASE ADMIN
// ============================================

const initializeFirebase = () => {
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ serviceAccountKey.json not found!');
    console.error('📝 Download it from Firebase Console:');
    console.error('   Project Settings → Service Accounts → Generate New Private Key');
    console.error(`   Save it as: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized\n');
  return admin.firestore();
};

// ============================================
// IMPORT FUNCTIONS
// ============================================

const importCollection = async (
  db: admin.firestore.Firestore,
  collectionName: string,
  data: any[]
): Promise<void> => {
  console.log(`📦 Importing ${data.length} documents to ${collectionName}...`);

  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (const item of data) {
    const docRef = db.collection(collectionName).doc(item.id);
    
    // 1. Remove undefined values first (Firestore doesn't support undefined)
    const cleanedItem = removeUndefined(item);
    
    // 2. Convert Date objects to Firestore Timestamps
    const processedItem = convertDatesToTimestamps(cleanedItem);
    
    batch.set(docRef, processedItem);
    count++;
    batchCount++;

    // Commit batch every BATCH_SIZE documents
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  ✓ Imported ${count}/${data.length} documents...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Imported ${count} documents to ${collectionName}\n`);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const convertDatesToTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return admin.firestore.Timestamp.fromDate(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertDatesToTimestamps(item));
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = convertDatesToTimestamps(obj[key]);
        // Skip undefined values (Firestore doesn't support undefined)
        if (value !== undefined) {
          converted[key] = value;
        }
      }
    }
    return converted;
  }

  return obj;
};

/**
 * Remove undefined values from object recursively
 * Firestore doesn't support undefined values
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null; // Convert undefined to null for Firestore
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = removeUndefined(obj[key]);
        // Only include if value is not undefined
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  return obj;
};

const clearCollection = async (
  db: admin.firestore.Firestore,
  collectionName: string
): Promise<void> => {
  console.log(`🗑️  Clearing collection: ${collectionName}...`);

  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`  ℹ️  Collection ${collectionName} is already empty\n`);
    return;
  }

  let batch = db.batch();
  let count = 0;

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    count++;

    if (count >= BATCH_SIZE) {
      batch.commit();
      batch = db.batch();
      count = 0;
    }
  });

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}\n`);
};

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

const importSeedData = async (options: {
  clearExisting?: boolean;
  collectionsToImport?: string[];
}) => {
  console.log('🌱 Starting Firestore import...\n');
  console.log('='.repeat(60));

  const db = initializeFirebase();

  // Generate seed data
  console.log('📝 Generating seed data...\n');
  const seedData = generateFullSeedData();

  console.log('='.repeat(60));
  console.log('\n📤 Importing to Firestore...\n');

  // Determine which collections to import
  const collectionsToImport = options.collectionsToImport || Object.keys(COLLECTIONS_MAP);

  // Import each collection
  for (const [dataKey, collectionName] of Object.entries(COLLECTIONS_MAP)) {
    if (!collectionsToImport.includes(dataKey)) {
      console.log(`⏭️  Skipping ${collectionName}\n`);
      continue;
    }

    const data = (seedData as any)[dataKey];
    
    if (!data || data.length === 0) {
      console.log(`⚠️  No data for ${collectionName}\n`);
      continue;
    }

    // Clear existing data if requested
    if (options.clearExisting) {
      await clearCollection(db, collectionName);
    }

    // Import data
    await importCollection(db, collectionName, data);
  }

  console.log('='.repeat(60));
  console.log('🎉 Import completed successfully!');
  console.log('='.repeat(60));
};

// ============================================
// CLI INTERFACE
// ============================================

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    clearExisting: false,
    collectionsToImport: undefined as string[] | undefined,
  };

  args.forEach(arg => {
    if (arg === '--clear' || arg === '-c') {
      options.clearExisting = true;
    } else if (arg.startsWith('--collections=')) {
      options.collectionsToImport = arg.split('=')[1].split(',');
    }
  });

  return options;
};

const showHelp = () => {
  console.log(`
🌱 Firestore Seed Data Import Script

Usage:
  npx ts-node scripts/importToFirestore.ts [options]

Options:
  --clear, -c               Clear existing data before import
  --collections=col1,col2   Import only specific collections

Collections:
  ${Object.keys(COLLECTIONS_MAP).join(', ')}

Examples:
  # Import all data
  npx ts-node scripts/importToFirestore.ts

  # Clear and import all data
  npx ts-node scripts/importToFirestore.ts --clear

  # Import only players and leagues
  npx ts-node scripts/importToFirestore.ts --collections=players,leagues

  # Clear and import specific collections
  npx ts-node scripts/importToFirestore.ts --clear --collections=players,leagues

Requirements:
  1. serviceAccountKey.json in project root
  2. Firebase Admin SDK installed: npm install firebase-admin
`);
};

// ============================================
// RUN
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const options = parseArgs();

  importSeedData(options)
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error during import:', error);
      process.exit(1);
    });
}

export { importSeedData, initializeFirebase };