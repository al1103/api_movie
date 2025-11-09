const mongoose = require('mongoose');
const config = require('../src/config/env');
const phimApiService = require('../src/services/phimApiService');
const Movie = require('../src/models/Movie');
const Genre = require('../src/models/Genre');
const Country = require('../src/models/Country');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    log(`✓ Connected to MongoDB: ${config.mongoUri}`, 'green');
  } catch (error) {
    log(`✗ Failed to connect to MongoDB: ${error.message}`, 'red');
    throw error;
  }
}

async function clearDatabase() {
  try {
    log('\n📋 Clearing existing data...', 'blue');
    await Movie.deleteMany({});
    await Genre.deleteMany({});
    await Country.deleteMany({});
    log('✓ Database cleared', 'green');
  } catch (error) {
    log(`✗ Error clearing database: ${error.message}`, 'red');
    throw error;
  }
}

async function seedMovies() {
  try {
    log('\n🎬 Fetching movies from API...', 'blue');

    // Fetch latest movies from multiple pages
    const pages = 3; // Fetch first 3 pages
    let totalMovies = 0;

    for (let page = 1; page <= pages; page++) {
      try {
        log(`  Fetching page ${page}...`, 'yellow');
        const data = await phimApiService.getLatestMovies({
          page,
          version: 'v1'
        });

        if (data?.items && data.items.length > 0) {
          totalMovies += data.items.length;
          log(`  ✓ Page ${page}: ${data.items.length} movies`, 'green');
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        log(`  ⚠ Error fetching page ${page}: ${error.message}`, 'yellow');
      }
    }

    log(`✓ Total movies stored: ${totalMovies}`, 'green');
  } catch (error) {
    log(`✗ Error seeding movies: ${error.message}`, 'red');
  }
}

async function seedGenres() {
  try {
    log('\n🎭 Fetching genres from API...', 'blue');

    const data = await phimApiService.getGenres();

    if (data?.items && data.items.length > 0) {
      log(`✓ Genres stored: ${data.items.length}`, 'green');
    }
  } catch (error) {
    log(`✗ Error seeding genres: ${error.message}`, 'red');
  }
}

async function seedCountries() {
  try {
    log('\n🌍 Fetching countries from API...', 'blue');

    const data = await phimApiService.getCountries();

    if (data?.items && data.items.length > 0) {
      log(`✓ Countries stored: ${data.items.length}`, 'green');
    }
  } catch (error) {
    log(`✗ Error seeding countries: ${error.message}`, 'red');
  }
}

async function seedCollections() {
  try {
    log('\n📚 Fetching collections from API...', 'blue');

    const collectionTypes = [
      'phim-bo',
      'phim-le',
      'tv-shows',
      'hoat-hinh',
      'phim-vietsub',
      'phim-thuyet-minh',
      'phim-long-tieng',
    ];

    for (const type of collectionTypes) {
      try {
        log(`  Fetching ${type}...`, 'yellow');
        await phimApiService.getCollection({
          typeList: type,
          page: 1,
          limit: 20,
        });
        log(`  ✓ ${type}`, 'green');

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        log(`  ⚠ Error fetching ${type}: ${error.message}`, 'yellow');
      }
    }
  } catch (error) {
    log(`✗ Error seeding collections: ${error.message}`, 'red');
  }
}

async function showStatistics() {
  try {
    log('\n📊 Database Statistics:', 'blue');

    const movieCount = await Movie.countDocuments();
    const genreCount = await Genre.countDocuments();
    const countryCount = await Country.countDocuments();

    log(`  Movies: ${movieCount}`, 'green');
    log(`  Genres: ${genreCount}`, 'green');
    log(`  Countries: ${countryCount}`, 'green');
  } catch (error) {
    log(`✗ Error showing statistics: ${error.message}`, 'red');
  }
}

async function main() {
  try {
    log('╔═══════════════════════════════════════════════╗', 'bright');
    log('║     🚀 MongoDB Database Seed Script 🚀      ║', 'bright');
    log('╚═══════════════════════════════════════════════╝', 'bright');

    await connectToDatabase();
    await clearDatabase();

    await seedMovies();
    await seedGenres();
    await seedCountries();
    await seedCollections();

    await showStatistics();

    log('\n✓ Seeding completed successfully!', 'green');
  } catch (error) {
    log(`\n✗ Seeding failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('✓ Database connection closed\n', 'green');
  }
}

main();
