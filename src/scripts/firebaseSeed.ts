// @ts-nocheck
/* eslint-disable */
/**
 * Firebase Seed Script - Standalone
 * Run with: npx tsx src/scripts/firebaseSeed.ts
 * or: npx tsx src/scripts/firebaseSeed.ts --clean
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCYGeOzB8nZPnWBLs_lEu1136XTngFe86g",
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

// Types
type SportType = "Futbol" | "Basketbol" | "Voleybol" | "Tenis" | "Masa Tenisi" | "Badminton";

// ============================================
// DEMO DATA GENERATORS
// ============================================

const firstNames = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Emre', 'Burak', 'Cem',
  'Deniz', 'Efe', 'Furkan', 'Gökhan', 'Halil', 'İsmail', 'Kemal', 'Murat', 'Oğuz', 'Ömer',
  'Serkan', 'Tolga', 'Umut', 'Volkan', 'Yusuf', 'Can', 'Kaan', 'Onur', 'Selim', 'Taner',
  'Eren', 'Barış', 'Arda', 'Ozan', 'Kaya', 'Alper', 'Berk', 'Doruk', 'Emir', 'Koray'
];

const lastNames = [
  'Yılmaz', 'Demir', 'Çelik', 'Kaya', 'Aydın', 'Arslan', 'Şahin', 'Özdemir', 'Yıldız', 'Koç',
  'Öztürk', 'Yıldırım', 'Acar', 'Aslan', 'Doğan', 'Kılıç', 'Güneş', 'Polat', 'Aksoy', 'Erdoğan',
  'Kurt', 'Özkan', 'Şimşek', 'Bulut', 'Akın', 'Sarı', 'Tekin', 'Ateş', 'Karaca', 'Bozkurt'
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
  'Aydınlar Spor Tesisleri'
];

const sampleComments = {
  general: [
    'Harika bir maç oldu, herkes elinden gelenin en iyisini yaptı!',
    'Çok keyifli bir akşamdı, teşekkürler organizatöre.',
    'Güzel bir oyun sergiledik, gelecek hafta daha iyisini yapacağız.',
    'Takım ruhu harikaydı, böyle devam!'
  ],
  highlight: [
    'İkinci yarıdaki o kombinezon muhteşemdi!',
    'Son dakikalardaki gol müthişti, maçın kaderini değiştirdi.',
    'Savunma performansı takımı ayakta tuttu.',
    'O asist harikaydı, tam zamanında geldi!'
  ],
  improvement: [
    'Pas organizasyonunda biraz daha çalışmamız gerekiyor.',
    'Defansta boşluklar bıraktık, buna dikkat etmeliyiz.',
    'İletişimi arttırabilirsek daha iyi sonuçlar alırız.',
    'Kondisyon çalışması yapmamız lazım.'
  ]
};

// Random Helpers
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const randomRating = (min: number = 3, max: number = 5): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
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
      }
    });

    const player = {
      name: randomItem(firstNames),
      surname: randomItem(lastNames),
      phone: `+90${random(500, 599)}${random(100, 999)}${random(1000, 9999)}`,
      email: `player${i + 1}@example.com`,
      jerseyNumber: `${random(1, 99)}`,
      birthDate: `${random(1985, 2005)}-${String(random(1, 12)).padStart(2, '0')}-${String(random(1, 28)).padStart(2, '0')}`,
      favoriteSports,
      sportPositions,
      lastLogin: new Date(),
      profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomItem(firstNames))}`
    };

    const docRef = await addDoc(collection(db, 'players'), player);
    playerIds.push(docRef.id);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1}/50 players...`);
    }
  }

  console.log(`  ✓ All 50 players created!`);
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
    const leaguePlayerIds = playerIds.slice(i * 10, (i + 1) * 10);

    const league = {
      title: leagueNames[i],
      sportType: sport,
      seasonStartDate: '2025-01-01',
      seasonEndDate: '2025-12-31',
      seasonDuration: 365,
      autoResetStandings: false,
      canChangeSeason: true,
      playerIds: leaguePlayerIds,
      premiumPlayerIds: leaguePlayerIds.slice(0, 3),
      directPlayerIds: leaguePlayerIds.slice(0, 2),
      teamBuildingAuthorityPlayerIds: [leaguePlayerIds[0]],
      matchFixtures: [],
      createdAt: new Date().toISOString(),
      createdBy: playerIds[0],
    };

    const docRef = await addDoc(collection(db, 'leagues'), league);
    leagueIds.push(docRef.id);
    console.log(`  ✓ League ${i + 1}/5: ${league.title}`);
  }

  return leagueIds;
}

// ============================================
// 3. CREATE FIXTURES (3 per league = 15)
// ============================================
async function createFixtures(leagueIds: string[], playerIds: string[]) {
  console.log('\n📅 Creating 15 fixtures...');
  const fixtureIds: string[] = [];
  const sports: SportType[] = ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Masa Tenisi'];

  for (let leagueIndex = 0; leagueIndex < leagueIds.length; leagueIndex++) {
    const leagueId = leagueIds[leagueIndex];
    const sport = sports[leagueIndex];
    const leaguePlayerIds = playerIds.slice(leagueIndex * 10, (leagueIndex + 1) * 10);

    for (let fixtureIndex = 0; fixtureIndex < 3; fixtureIndex++) {
      const baseDate = new Date(2025, 9, 14 + fixtureIndex * 2); // Ekim 2025
      const isPeriodic = fixtureIndex === 0;

      const fixture: any = {
        leagueId,
        title: `${['Salı', 'Perşembe', 'Cumartesi'][fixtureIndex]} Maçı`,
        sportType: sport,
        registrationStartTime: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        matchStartTime: baseDate,
        matchTotalTimeInMinute: [60, 40, 90, 90, 45][leagueIndex],
        isPeriodic,
        staffPlayerCount: [10, 10, 12, 2, 2][leagueIndex],
        reservePlayerCount: 2,
        organizerPlayerIds: [leaguePlayerIds[0]],
        teamBuildingAuthorityPlayerIds: [leaguePlayerIds[0]],
        location: randomItem(locations),
        pricePerPlayer: random(100, 200),
        peterIban: 'TR330006100519786457841326',
        peterFullName: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        status: 'Aktif',
        matchIds: [],
        createdAt: new Date().toISOString(),
      };

      // ✅ Sadece isPeriodic true ise periodDayCount ekle
      if (isPeriodic) {
        fixture.periodDayCount = 7;
      }

      const docRef = await addDoc(collection(db, 'matchFixtures'), fixture);
      fixtureIds.push(docRef.id);
    }
    console.log(`  ✓ Created 3 fixtures for league ${leagueIndex + 1}`);
  }

  return fixtureIds;
}
// ============================================
// 4. CREATE MATCHES (5 per fixture = 75)
// ============================================
async function createMatches(fixtureIds: string[], leagueIds: string[], playerIds: string[]) {
  console.log('\n⚽ Creating 75 matches...');
  const matchIds: string[] = [];
  const allMatchesData: any[] = [];

  const statuses = ['Tamamlandı', 'Tamamlandı', 'Kayıt Açık', 'Oluşturuldu', 'Oluşturuldu'];

  for (let fixtureIndex = 0; fixtureIndex < fixtureIds.length; fixtureIndex++) {
    const fixtureId = fixtureIds[fixtureIndex];
    const leagueIndex = Math.floor(fixtureIndex / 3);
    const leaguePlayerIds = playerIds.slice(leagueIndex * 10, (leagueIndex + 1) * 10);

    for (let matchIndex = 0; matchIndex < 5; matchIndex++) {
      const matchDate = new Date(2025, 9, 14 + matchIndex * 7);
      const status = statuses[matchIndex];

      const registeredPlayers = leaguePlayerIds.slice(0, 10);
      const team1 = registeredPlayers.slice(0, 5);
      const team2 = registeredPlayers.slice(5, 10);

      const match: any = {
        fixtureId,
        title: `Maç ${matchIndex + 1} - ${matchDate.toLocaleDateString('tr-TR')}`,
        registrationTime: new Date(matchDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        registrationEndTime: new Date(matchDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        matchStartTime: matchDate,
        matchEndTime: new Date(matchDate.getTime() + 90 * 60 * 1000),
        premiumPlayerIds: leaguePlayerIds.slice(0, 2),
        directPlayerIds: leaguePlayerIds.slice(0, 2),
        guestPlayerIds: [],
        registeredPlayerIds: registeredPlayers,
        reservePlayerIds: [],
        organizerPlayerIds: [leaguePlayerIds[0]],
        teamBuildingAuthorityPlayerIds: [leaguePlayerIds[0]],
        status,
        goalScorers: [],
        paymentStatus: [],
        mvpAutoCalculated: true,
        commentsEnabled: status === 'Tamamlandı',
        createdAt: new Date().toISOString(),
      };

      if (status === 'Tamamlandı') {
        match.team1PlayerIds = team1;
        match.team2PlayerIds = team2;
        match.team1Score = random(0, 5);
        match.team2Score = random(0, 5);
        match.score = `${match.team1Score}-${match.team2Score}`;
        
        // Goal scorers
        match.goalScorers = [];
        for (let g = 0; g < match.team1Score; g++) {
          match.goalScorers.push({
            playerId: randomItem(team1),
            goals: 1,
            assists: Math.random() > 0.5 ? 1 : 0,
            confirmed: true,
            submittedAt: new Date().toISOString()
          });
        }
        
        // MVP
        match.playerIdOfMatchMVP = randomItem([...team1, ...team2]);
        match.mvpCalculatedAt = new Date().toISOString();
        
        // Payment status
        match.paymentStatus = [...team1, ...team2].map(playerId => ({
          playerId,
          paid: true,
          amount: 150,
          paidAt: new Date().toISOString(),
          confirmedBy: leaguePlayerIds[0]
        }));
      }

      const docRef = await addDoc(collection(db, 'matches'), match);
      matchIds.push(docRef.id);
      allMatchesData.push({ ...match, id: docRef.id, leagueId: leagueIds[leagueIndex] });
    }
    
    if ((fixtureIndex + 1) % 5 === 0) {
      console.log(`  ✓ Created ${(fixtureIndex + 1) * 5}/75 matches...`);
    }
  }

  console.log(`  ✓ All 75 matches created!`);
  return { matchIds, allMatchesData };
}

// ============================================
// 5. CREATE MATCH RATINGS
// ============================================
async function createMatchRatings(allMatchesData: any[], playerIds: string[]) {
  console.log('\n⭐ Creating match ratings...');
  let count = 0;

  const completedMatches = allMatchesData.filter(m => m.status === 'Tamamlandı');

  for (const match of completedMatches) {
    const allPlayers = [...(match.team1PlayerIds || []), ...(match.team2PlayerIds || [])];

    for (const raterId of allPlayers) {
      for (const ratedPlayerId of allPlayers) {
        if (raterId === ratedPlayerId) continue;

        const rating = {
          matchId: match.id,
          raterId,
          ratedPlayerId,
          rating: randomRating(3.0, 5.0),
          categories: {
            skill: randomRating(3.0, 5.0),
            teamwork: randomRating(3.0, 5.0),
            sportsmanship: randomRating(4.0, 5.0),
            effort: randomRating(3.5, 5.0)
          },
          isAnonymous: true,
          leagueId: match.leagueId,
          seasonId: 'season_2025',
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'matchRatings'), rating);
        count++;
      }
    }
  }

  console.log(`  ✓ Created ${count} match ratings`);
}

// ============================================
// 6. CREATE MATCH COMMENTS
// ============================================
async function createMatchComments(allMatchesData: any[]) {
  console.log('\n💬 Creating match comments...');
  let count = 0;

  const completedMatches = allMatchesData.filter(m => m.status === 'Tamamlandı');

  for (const match of completedMatches) {
    const allPlayers = [...(match.team1PlayerIds || []), ...(match.team2PlayerIds || [])];
    const commentCount = random(2, 5);

    for (let i = 0; i < commentCount; i++) {
      const type = randomItem(['general', 'highlight', 'improvement'] as const);
      
      const comment = {
        matchId: match.id,
        playerId: randomItem(allPlayers),
        comment: randomItem(sampleComments[type]),
        type,
        isApproved: Math.random() > 0.2,
        approvedBy: Math.random() > 0.2 ? match.organizerPlayerIds[0] : null,
        likes: Math.random() > 0.5 ? [randomItem(allPlayers)] : [],
        createdAt: new Date().toISOString()
      };


      await addDoc(collection(db, 'matchComments'), comment);
      count++;
    }
  }

  console.log(`  ✓ Created ${count} match comments`);
}

// ============================================
// 7. CREATE PLAYER RATING PROFILES
// ============================================
async function createPlayerRatingProfiles(leagueIds: string[], playerIds: string[]) {
  console.log('\n📊 Creating player rating profiles...');
  let count = 0;

  for (let leagueIndex = 0; leagueIndex < leagueIds.length; leagueIndex++) {
    const leagueId = leagueIds[leagueIndex];
    const leaguePlayerIds = playerIds.slice(leagueIndex * 10, (leagueIndex + 1) * 10);

    for (const playerId of leaguePlayerIds) {
      const profile = {
        playerId,
        leagueId,
        seasonId: 'season_2025',
        overallRating: randomRating(3.5, 4.8),
        totalRatingsReceived: random(20, 50),
        categoryAverages: {
          skill: randomRating(3.5, 4.8),
          teamwork: randomRating(3.8, 5.0),
          sportsmanship: randomRating(4.2, 5.0),
          effort: randomRating(3.5, 4.8)
        },
        mvpCount: random(0, 3),
        mvpRate: parseFloat((Math.random() * 20).toFixed(2)),
        ratingTrend: randomItem(['improving', 'stable', 'declining']),
        lastFiveRatings: Array(5).fill(0).map(() => randomRating(3.5, 4.8)),
        teammateRatings: {
          average: randomRating(3.8, 4.8),
          count: random(10, 30)
        },
        opponentRatings: {
          average: randomRating(3.5, 4.5),
          count: random(5, 20)
        },
        lastUpdated: new Date().toISOString()
      };

      await addDoc(collection(db, 'playerRatingRrofiles'), profile);
      count++;
    }
  }

  console.log(`  ✓ Created ${count} player rating profiles`);
}

// ============================================
// 8. CREATE STANDINGS
// ============================================
async function createStandings(leagueIds: string[], playerIds: string[]) {
  console.log('\n🏅 Creating standings...');

  for (let i = 0; i < leagueIds.length; i++) {
    const leagueId = leagueIds[i];
    const leaguePlayerIds = playerIds.slice(i * 10, (i + 1) * 10);

    const playerStandings = leaguePlayerIds.map(playerId => {
      const played = random(5, 15);
      const won = random(0, played);
      const drawn = random(0, played - won);
      const lost = played - won - drawn;
      const goalsScored = random(0, played * 3);
      const goalsAgainst = random(0, played * 2);

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
        rating: randomRating(3.5, 4.8),
        totalRatingsReceived: random(20, 50),
        ratingTrend: randomItem(['up', 'stable', 'down']),
        mvpCount: random(0, 3),
        mvpRate: parseFloat((Math.random() * 20).toFixed(2)),
        attendanceRate: parseFloat((70 + Math.random() * 30).toFixed(1))
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsScored - a.goalsScored;
    });

    const standings = {
      leagueId,
      seasonId: 'season_2025',
      playerStandings,
      lastUpdated: new Date().toISOString()
    };

    await addDoc(collection(db, 'standings'), standings);
  }

  console.log(`  ✓ Created 5 standings`);
}

// ============================================
// 9. CREATE PLAYER STATS
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

      const stats = {
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
        rating: randomRating(3.5, 4.8),
        totalRatingsReceived: random(20, 50),
        ratingHistory: [],
        mvpCount: random(0, 3),
        mvpRate: parseFloat((Math.random() * 20).toFixed(2)),
        categoryRatings: {
          skill: randomRating(3.5, 4.8),
          teamwork: randomRating(3.8, 5.0),
          sportsmanship: randomRating(4.2, 5.0),
          effort: randomRating(3.5, 4.8)
        },
        attendanceRate: parseFloat((70 + Math.random() * 30).toFixed(1)),
        averageGoalsPerMatch: totalMatches > 0 ? parseFloat((totalGoals / totalMatches).toFixed(2)) : 0,
        averageAssistsPerMatch: totalMatches > 0 ? parseFloat((totalAssists / totalMatches).toFixed(2)) : 0
      };

      await addDoc(collection(db, 'playerStats'), stats);
      count++;
    }
  }

  console.log(`  ✓ Created ${count} player stats`);
}

// ============================================
// CLEAN DATABASE
// ============================================
async function cleanDatabase() {
  console.log('🧹 Cleaning database...\n');
  
  const collections = [
    'players', 'devices', 'leagues', 'matchFixtures', 'matches', 
    'matchRatings', 'matchComments', 'playerRatingProfiles', 
    'playerStats', 'standings'
  ];
  
  for (const collectionName of collections) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`  ✓ Deleted ${querySnapshot.size} documents from ${collectionName}`);
    } catch (error) {
      console.log(`  ⚠️  Could not clean ${collectionName}`);
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

    if (cleanFirst) {
      await cleanDatabase();
    }

    const playerIds = await createPlayers();
    const leagueIds = await createLeagues(playerIds);
    const fixtureIds = await createFixtures(leagueIds, playerIds);
    const { matchIds, allMatchesData } = await createMatches(fixtureIds, leagueIds, playerIds);
    
    await createMatchRatings(allMatchesData, playerIds);
    await createMatchComments(allMatchesData);
    await createPlayerRatingProfiles(leagueIds, playerIds);
    await createStandings(leagueIds, playerIds);
    await createPlayerStats(leagueIds, playerIds);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n================================');
    console.log('✅ Firebase Seed Complete!');
    console.log('================================');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`\n📊 Summary:`);
    console.log(`   - 50 Players`);
    console.log(`   - 5 Leagues`);
    console.log(`   - 15 Fixtures`);
    console.log(`   - 75 Matches`);
    console.log(`   - Match Ratings`);
    console.log(`   - Match Comments`);
    console.log(`   - Player Rating Profiles`);
    console.log(`   - 5 Standings`);
    console.log(`   - 50 Player Stats`);
    console.log('\n🎉 Database is ready!');

  } catch (error) {
    console.error('\n❌ Seed error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const shouldClean = process.argv.includes('--clean');
  
  seedFirebase(shouldClean)
    .then(() => {
      console.log('\n👋 Seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed:', error);
      process.exit(1);
    });
}