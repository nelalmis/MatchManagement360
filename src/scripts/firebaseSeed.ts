// @ts-nocheck
/* eslint-disable */
/**
 * Firebase Seed Script - Standalone
 * Run with: npx tsx src/scripts/firebaseSeed.ts
 * or: node src/scripts/firebaseSeed.js (after compiling)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

// ============================================
// TYPES (Inline - to avoid import issues)
// ============================================
type SportType = 
  | "Futbol" 
  | "Basketbol" 
  | "Voleybol" 
  | "Tenis"
  | "Masa Tenisi"
  | "Badminton";

interface IPlayer {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  jerseyNumber?: string;
  birthDate?: string;
  favoriteSports?: SportType[];
  sportPositions?: Partial<Record<SportType, string[]>>;
  lastLogin?: Date;
}

interface ILeague {
  title: string;
  sportType: SportType;
  seasonStartDate: string;
  seasonEndDate: string;
  autoResetStandings: boolean;
  canChangeSeason: boolean;
  playerIds: string[];
  premiumPlayerIds: string[];
  directPlayerIds: string[];
  teamBuildingAuthorityPlayerIds: string[];
  matchFixtures: any[];
  createdAt: string;
  createdBy: string;
}

interface IMatchFixture {
  leagueId: any;
  title: string;
  sportType: SportType;
  registrationStartTime: Date;
  matchStartTime: Date;
  matchTotalTimeInMinute: number;
  isPeriodic: boolean;
  periodDayCount?: number;
  staffPlayerCount: number;
  reservePlayerCount: number;
  organizerPlayerIds: string[];
  location: string;
  pricePerPlayer: number;
  peterIban: string;
  peterFullName: string;
  status: 'Aktif' | 'Pasif';
  matchIds: string[];
  createdAt: string;
}

interface IMatch {
  fixtureId: any;
  title: string;
  registrationTime: Date;
  registrationEndTime: Date;
  matchStartTime: Date;
  matchEndTime: Date;
  premiumPlayerIds: string[];
  directPlayerIds: string[];
  guestPlayerIds: string[];
  registeredPlayerIds: string[];
  reservePlayerIds: string[];
  team1PlayerIds?: string[];
  team2PlayerIds?: string[];
  playerPositions?: Record<string, string>;
  score?: string;
  team1Score?: number;
  team2Score?: number;
  goalScorers: Array<{
    playerId: string;
    goals: number;
    assists: number;
    confirmed: boolean;
    submittedAt: string;
  }>;
  playerIdOfMatchMVP?: string;
  paymentStatus: any[];
  organizerPlayerIds: string[];
  teamBuildingAuthorityPlayerIds: string[];
  status: 'Oluşturuldu' | 'Kayıt Açık' | 'Kayıt Kapandı' | 'Takımlar Oluşturuldu' | 'Oynanıyor' | 'Skor Bekleniyor' | 'Skor Onay Bekliyor' | 'Ödeme Bekliyor' | 'Tamamlandı' | 'İptal Edildi';
  createdAt: string;
}

interface IStandings {
  leagueId: any;
  seasonId: string;
  playerStandings: Array<{
    playerId: string;
    playerName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsScored: number;
    goalsAgainst: number;
    goalDifference: number;
    assists: number;
    points: number;
    rating: number;
    mvpCount: number;
    attendanceRate: number;
  }>;
  lastUpdated: string;
}

// Firebase Config
const firebaseConfig = {
  authDomain: "matchmanagement360.firebaseapp.com",
  projectId: "matchmanagement360",
  storageBucket: "matchmanagement360.firebasestorage.app",
  messagingSenderId: "1085707335219",
  appId: "1:1085707335219:web:54694271b8969278b95546",
  measurementId: "G-S9MJ2BRXK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// DEMO DATA GENERATORS
// ============================================

// Türkçe İsimler
const firstNames = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Emre', 'Burak', 'Cem',
  'Deniz', 'Efe', 'Furkan', 'Gökhan', 'Halil', 'İsmail', 'Kemal', 'Murat', 'Oğuz', 'Ömer',
  'Serkan', 'Tolga', 'Umut', 'Volkan', 'Yusuf', 'Can', 'Kaan', 'Onur', 'Selim', 'Taner',
  'Eren', 'Barış', 'Arda', 'Ozan', 'Kaya', 'Alper', 'Berk', 'Doruk', 'Emir', 'Koray',
  'Mert', 'Orkun', 'Sinan', 'Tunç', 'Utku', 'Yasin', 'Zafer', 'Erdem', 'Tarık', 'Sami'
];

const lastNames = [
  'Yılmaz', 'Demir', 'Çelik', 'Kaya', 'Aydın', 'Arslan', 'Şahin', 'Özdemir', 'Yıldız', 'Koç',
  'Öztürk', 'Yıldırım', 'Acar', 'Aslan', 'Doğan', 'Kılıç', 'Güneş', 'Polat', 'Aksoy', 'Erdoğan',
  'Kurt', 'Özkan', 'Şimşek', 'Bulut', 'Akın', 'Özkan', 'Sarı', 'Tekin', 'Ateş', 'Karaca',
  'Bozkurt', 'Tuncer', 'Durmaz', 'Ünal', 'Kara', 'Türk', 'Güven', 'Aksu', 'Işık', 'Bayrak',
  'Toprak', 'Erkan', 'Mutlu', 'Yavuz', 'Soylu', 'Ceylan', 'Aktaş', 'Koçak', 'Ergin', 'Keskin'
];

const positions: Record<SportType, string[]> = {
  'Futbol': ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'],
  'Basketbol': ['Guard', 'Forward', 'Center'],
  'Voleybol': ['Libero', 'Pasör', 'Smaçör', 'Orta Oyuncu'],
  'Tenis': [],
  'Masa Tenisi': [],
  'Badminton': [],
};

const leagueNames = [
  'Architect Halı Saha Ligi',
  'Elazığ Basketbol Turnuvası',
  'Şehir Voleybol Ligi',
  'Tenis Kortları Şampiyonası',
  'Masa Tenisi Pro League'
];

const locations = [
  'Elazığ Halı Saha',
  'Fırat Üniversitesi Spor Salonu',
  'Merkez Spor Kompleksi',
  'Şehir Stadyumu',
  'Aydınlar Spor Tesisleri',
  'Cumhuriyet Spor Salonu'
];

// Random Helper
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// ============================================
// 1. CREATE PLAYERS (50)
// ============================================
async function createPlayers() {
  console.log('🏃 Creating 50 players...');
  const playerIds: string[] = [];
  const sports: SportType[] = ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Masa Tenisi', 'Badminton'];

  for (let i = 0; i < 50; i++) {
    const favoriteSports = [randomItem(sports)];
    if (Math.random() > 0.5) favoriteSports.push(randomItem(sports));

    const sportPositions: Partial<Record<SportType, string[]>> = {};
    favoriteSports.forEach(sport => {
      if (positions[sport].length > 0) {
        sportPositions[sport] = [randomItem(positions[sport])];
        if (Math.random() > 0.6) {
          const currentPositions = sportPositions[sport]!;
          const otherPosition = randomItem(positions[sport].filter(p => p !== currentPositions[0]));
          if (otherPosition) {
            currentPositions.push(otherPosition);
          }
        }
      }
    });

    const player: Omit<IPlayer, 'id'> = {
      name: randomItem(firstNames),
      surname: randomItem(lastNames),
      phone: `+90${random(300, 599)}${random(100, 999)}${random(1000, 9999)}`,
      email: `player${i + 1}@example.com`,
      jerseyNumber: `${random(1, 99)}`,
      birthDate: `${random(1985, 2005)}-${String(random(1, 12)).padStart(2, '0')}-${String(random(1, 28)).padStart(2, '0')}`,
      favoriteSports,
      sportPositions: sportPositions as Record<SportType, string[]>,
      lastLogin: new Date(),
    };

    const docRef = await addDoc(collection(db, 'players'), player);
    playerIds.push(docRef.id);
    console.log(`  ✓ Player ${i + 1}/50: ${player.name} ${player.surname}`);
  }

  return playerIds;
}

// ============================================
// 2. CREATE LEAGUES (5)
// ============================================
async function createLeagues(playerIds: string[]) {
  console.log('\n🏆 Creating 5 leagues...');
  const leagueIds: string[] = [];
  const sports: SportType[] = ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Masa Tenisi'];

  for (let i = 0; i < 5; i++) {
    const sport = sports[i];
    const leaguePlayerIds = playerIds.slice(i * 10, (i + 1) * 10); // 10 players per league
    const premiumCount = random(2, 4);
    const directCount = random(2, 3);

    const seasonStart = new Date(2025, 0, 1); // 1 Ocak 2025
    const seasonEnd = new Date(2025, 11, 31); // 31 Aralık 2025

    const league: Omit<ILeague, 'id'> = {
      title: leagueNames[i],
      sportType: sport,
      seasonStartDate: seasonStart.toISOString(),
      seasonEndDate: seasonEnd.toISOString(),
      autoResetStandings: true,
      canChangeSeason: false,
      playerIds: leaguePlayerIds,
      premiumPlayerIds: leaguePlayerIds.slice(0, premiumCount),
      directPlayerIds: leaguePlayerIds.slice(0, directCount),
      teamBuildingAuthorityPlayerIds: [leaguePlayerIds[0], leaguePlayerIds[1]],
      matchFixtures: [],
      createdAt: new Date().toISOString(),
      createdBy: playerIds[0],
    };

    const docRef = await addDoc(collection(db, 'leagues'), league);
    leagueIds.push(docRef.id);
    console.log(`  ✓ League ${i + 1}/5: ${league.title} (${sport})`);
  }

  return leagueIds;
}

// ============================================
// 3. CREATE FIXTURES (3 per league = 15)
// ============================================
async function createFixtures(leagueIds: string[], playerIds: string[]) {
  console.log('\n📅 Creating 15 fixtures (3 per league)...');
  const fixtureIds: string[] = [];
  const sports: SportType[] = ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Masa Tenisi'];

  for (let leagueIndex = 0; leagueIndex < leagueIds.length; leagueIndex++) {
    const leagueId = leagueIds[leagueIndex];
    const sport = sports[leagueIndex];

    for (let fixtureIndex = 0; fixtureIndex < 3; fixtureIndex++) {
      const baseDate = new Date(2025, fixtureIndex * 2, 1); // Her 2 ayda bir
      const isPeriodic = fixtureIndex === 0; // İlk fikstür periyodik

      const fixture: any = {
        leagueId,
        title: `${['Pazartesi', 'Çarşamba', 'Cuma'][fixtureIndex]} Maçı`,
        sportType: sport,
        registrationStartTime: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
        matchStartTime: baseDate,
        matchTotalTimeInMinute: [90, 48, 120, 90, 45][leagueIndex],
        isPeriodic,
        staffPlayerCount: [10, 10, 12, 2, 2][leagueIndex],
        reservePlayerCount: 2,
        organizerPlayerIds: [playerIds[leagueIndex * 10], playerIds[leagueIndex * 10 + 1]],
        location: randomItem(locations),
        pricePerPlayer: random(50, 150),
        peterIban: `TR${random(10, 99)} ${random(1000, 9999)} ${random(1000, 9999)} ${random(1000, 9999)} ${random(1000, 9999)} ${random(1000, 9999)}`,
        peterFullName: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        status: 'Aktif',
        matchIds: [],
        createdAt: new Date().toISOString(),
      };

      // Add periodDayCount only if isPeriodic is true
      if (isPeriodic) {
        fixture.periodDayCount = 7;
      }

      const docRef = await addDoc(collection(db, 'matchFixtures'), fixture);
      fixtureIds.push(docRef.id);
      console.log(`  ✓ Fixture ${leagueIndex * 3 + fixtureIndex + 1}/15: ${fixture.title}`);
    }
  }

  return fixtureIds;
}

// ============================================
// 4. CREATE MATCHES (10 per fixture = 150)
// ============================================
async function createMatches(fixtureIds: string[], leagueIds: string[], playerIds: string[]) {
  console.log('\n⚽ Creating 150 matches (10 per fixture)...');
  const matchIds: string[][] = Array(fixtureIds.length).fill([]).map(() => []);

  const statuses: IMatch['status'][] = [
    'Tamamlandı',
    'Tamamlandı',
    'Tamamlandı',
    'Oynanıyor',
    'Takımlar Oluşturuldu',
    'Kayıt Kapandı',
    'Kayıt Açık',
    'Kayıt Açık',
    'Oluşturuldu',
    'Oluşturuldu',
  ];

  for (let fixtureIndex = 0; fixtureIndex < fixtureIds.length; fixtureIndex++) {
    const fixtureId = fixtureIds[fixtureIndex];
    const leagueIndex = Math.floor(fixtureIndex / 3);
    const leaguePlayerIds = playerIds.slice(leagueIndex * 10, (leagueIndex + 1) * 10);

    for (let matchIndex = 0; matchIndex < 10; matchIndex++) {
      const baseDate = new Date(2025, Math.floor(fixtureIndex / 3) * 2 + matchIndex, 15);
      const matchDate = new Date(baseDate.getTime() + matchIndex * 7 * 24 * 60 * 60 * 1000);
      const status = statuses[matchIndex];

      const registeredCount = random(8, 12);
      const registeredPlayers = leaguePlayerIds.slice(0, registeredCount);

      const match: Omit<IMatch, 'id'> = {
        fixtureId,
        title: `Maç ${matchIndex + 1} - ${matchDate.toLocaleDateString('tr-TR')}`,
        registrationTime: new Date(matchDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        registrationEndTime: new Date(matchDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        matchStartTime: matchDate,
        matchEndTime: new Date(matchDate.getTime() + 90 * 60 * 1000),
        premiumPlayerIds: leaguePlayerIds.slice(0, 2),
        directPlayerIds: leaguePlayerIds.slice(0, 2),
        guestPlayerIds: [],
        registeredPlayerIds: registeredPlayers,
        reservePlayerIds: [],
        organizerPlayerIds: [leaguePlayerIds[0]],
        teamBuildingAuthorityPlayerIds: [leaguePlayerIds[0], leaguePlayerIds[1]],
        status,
        goalScorers: [],
        paymentStatus: [],
        createdAt: new Date().toISOString(),
      };

      // Add teams for completed matches
      if (status === 'Tamamlandı' || status === 'Oynanıyor' || status === 'Takımlar Oluşturuldu') {
        const team1 = registeredPlayers.slice(0, 5);
        const team2 = registeredPlayers.slice(5, 10);
        match.team1PlayerIds = team1;
        match.team2PlayerIds = team2;

        // Add player positions
        match.playerPositions = {};
        [...team1, ...team2].forEach(playerId => {
          const positions = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'];
          match.playerPositions![playerId] = randomItem(positions);
        });
      }

      // Add scores for completed matches
      if (status === 'Tamamlandı') {
        match.team1Score = random(0, 5);
        match.team2Score = random(0, 5);
        match.score = `${match.team1Score}-${match.team2Score}`;

        // Add goal scorers
        match.goalScorers = [];
        const totalGoals = match.team1Score + match.team2Score;
        for (let i = 0; i < totalGoals; i++) {
          const team = i < match.team1Score ? match.team1PlayerIds! : match.team2PlayerIds!;
          match.goalScorers.push({
            playerId: randomItem(team),
            goals: 1,
            assists: Math.random() > 0.5 ? 1 : 0,
            confirmed: true,
            submittedAt: new Date().toISOString(),
          });
        }

        // Select MVP
        match.playerIdOfMatchMVP = randomItem([...match.team1PlayerIds!, ...match.team2PlayerIds!]);
      }

      const docRef = await addDoc(collection(db, 'matches'), match);
      matchIds[fixtureIndex].push(docRef.id);
      
      if ((fixtureIndex * 10 + matchIndex + 1) % 30 === 0) {
        console.log(`  ✓ Created ${fixtureIndex * 10 + matchIndex + 1}/150 matches...`);
      }
    }
  }

  console.log(`  ✓ All 150 matches created!`);
  return matchIds;
}

// ============================================
// 5. CREATE STANDINGS (1 per league = 5)
// ============================================
async function createStandings(leagueIds: string[], playerIds: string[]) {
  console.log('\n📊 Creating 5 standings...');

  for (let i = 0; i < leagueIds.length; i++) {
    const leagueId = leagueIds[i];
    const leaguePlayerIds = playerIds.slice(i * 10, (i + 1) * 10);

    const playerStandings = leaguePlayerIds.map(playerId => {
      const played = random(5, 15);
      const won = random(0, played);
      const drawn = random(0, played - won);
      const lost = played - won - drawn;
      const goalsScored = random(0, played * 3);
      const goalsAgainst = random(0, played * 3);

      return {
        playerId,
        playerName: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        played,
        won,
        drawn,
        lost,
        goalsScored,
        goalsAgainst,
        goalDifference: goalsScored - goalsAgainst,
        assists: random(0, goalsScored),
        points: won * 3 + drawn,
        rating: Number((3 + Math.random() * 2).toFixed(1)),
        mvpCount: random(0, 3),
        attendanceRate: Number((60 + Math.random() * 40).toFixed(1)),
      };
    });

    // Sort by points
    playerStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsScored - a.goalsScored;
    });

    const standings: Omit<IStandings, 'id'> = {
      leagueId,
      seasonId: 'season_2025',
      playerStandings,
      lastUpdated: new Date().toISOString(),
    };

    await addDoc(collection(db, 'standings'), standings);
    console.log(`  ✓ Standings ${i + 1}/5 created for league ${i + 1}`);
  }
}

// ============================================
// 6. CREATE PLAYER STATS (1 per player per league)
// ============================================
async function createPlayerStats(leagueIds: string[], playerIds: string[]) {
  console.log('\n📈 Creating player stats...');
  let count = 0;

  for (let leagueIndex = 0; leagueIndex < leagueIds.length; leagueIndex++) {
    const leagueId = leagueIds[leagueIndex];
    const leaguePlayerIds = playerIds.slice(leagueIndex * 10, (leagueIndex + 1) * 10);

    for (const playerId of leaguePlayerIds) {
      const totalMatches = random(5, 15);
      const wins = random(0, totalMatches);
      const draws = random(0, totalMatches - wins);
      const losses = totalMatches - wins - draws;
      const totalGoals = random(0, totalMatches * 3);
      const totalAssists = random(0, totalGoals);

      const playerStats = {
        playerId,
        leagueId,
        seasonId: 'season_2025',
        totalMatches,
        wins,
        draws,
        losses,
        totalGoals,
        totalAssists,
        points: wins * 3 + draws,
        rating: Number((3 + Math.random() * 2).toFixed(1)),
        mvpCount: random(0, 3),
        attendanceRate: Number((60 + Math.random() * 40).toFixed(1)),
        averageGoalsPerMatch: totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0,
        averageAssistsPerMatch: totalMatches > 0 ? Number((totalAssists / totalMatches).toFixed(2)) : 0,
      };

      await addDoc(collection(db, 'playerStats'), playerStats);
      count++;
    }
  }

  console.log(`  ✓ Created ${count} player stats records`);
}

// ============================================
// CLEAN DATABASE (DELETE ALL COLLECTIONS)
// ============================================
async function cleanDatabase() {
  console.log('🧹 Cleaning database...\n');
  
  const collections = ['players', 'leagues', 'matchFixtures', 'matches', 'standings', 'playerStats'];
  
  for (const collectionName of collections) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`  ✓ Deleted ${querySnapshot.size} documents from ${collectionName}`);
    } catch (error) {
      console.log(`  ⚠️  Could not clean ${collectionName}:`, error);
    }
  }
  
  console.log('\n✅ Database cleaned!\n');
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
export async function seedFirebase(cleanFirst: boolean = false) {
  console.log('🌱 Starting Firebase Seed...\n');
  console.log('================================');

  try {
    const startTime = Date.now();

    // Clean database first if requested
    if (cleanFirst) {
      await cleanDatabase();
    }

    // 1. Create Players
    const playerIds = await createPlayers();

    // 2. Create Leagues
    const leagueIds = await createLeagues(playerIds);

    // 3. Create Fixtures
    const fixtureIds = await createFixtures(leagueIds, playerIds);

    // 4. Create Matches
    const matchIds = await createMatches(fixtureIds, leagueIds, playerIds);

    // 5. Create Standings
    await createStandings(leagueIds, playerIds);

    // 6. Create Player Stats
    await createPlayerStats(leagueIds, playerIds);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n================================');
    console.log('✅ Firebase Seed Complete!');
    console.log('================================');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`\n📊 Created:`);
    console.log(`   - 50 Players`);
    console.log(`   - 5 Leagues`);
    console.log(`   - 15 Fixtures`);
    console.log(`   - 150 Matches`);
    console.log(`   - 5 Standings`);
    console.log(`   - 50 Player Stats`);
    console.log('\n🎉 Your database is ready!');

  } catch (error) {
    console.error('\n❌ Error during seed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  // Check if --clean flag is provided
  const shouldClean = process.argv.includes('--clean');
  
  seedFirebase(shouldClean)
    .then(() => {
      console.log('\n👋 Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed:', error);
      process.exit(1);
    });
}