const mongoose = require('mongoose');
const config = require('../src/config/env');
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

// Sample data
const sampleGenres = [
  { name: 'Hành động', slug: 'hanh-dong' },
  { name: 'Kinh dị', slug: 'kinh-di' },
  { name: 'Hài hước', slug: 'hai-huoc' },
  { name: 'Tâm lý', slug: 'tam-ly' },
  { name: 'Tình cảm', slug: 'tinh-cam' },
  { name: 'Khoa học viễn tưởng', slug: 'khoa-hoc-vien-tuong' },
  { name: 'Thực tế', slug: 'thuc-te' },
  { name: 'Phiêu lưu', slug: 'phieu-luu' },
];

const sampleCountries = [
  { name: 'Mỹ', slug: 'quoc-gia-usa' },
  { name: 'Việt Nam', slug: 'quoc-gia-viet-nam' },
  { name: 'Nhật Bản', slug: 'quoc-gia-nhat-ban' },
  { name: 'Hàn Quốc', slug: 'quoc-gia-han-quoc' },
  { name: 'Anh', slug: 'quoc-gia-anh' },
  { name: 'Pháp', slug: 'quoc-gia-phap' },
  { name: 'Trung Quốc', slug: 'quoc-gia-trung-quoc' },
  { name: 'Ấn Độ', slug: 'quoc-gia-an-do' },
];

const sampleMovies = [
  {
    slug: 'iron-man-2024',
    name: 'Iron Man',
    origin_name: 'Iron Man',
    type: 'single',
    status: 'completed',
    year: 2024,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: '1',
    episode_total: '1',
    time: '126 phút',
    actor: ['Robert Downey Jr.', 'Terrence Howard'],
    director: ['Jon Favreau'],
    category: [
      { name: 'Hành động', slug: 'hanh-dong' },
      { name: 'Khoa học viễn tưởng', slug: 'khoa-hoc-vien-tuong' },
    ],
    country: [{ name: 'Mỹ', slug: 'quoc-gia-usa' }],
    poster_url: 'https://via.placeholder.com/300x450?text=Iron+Man',
    thumb_url: 'https://via.placeholder.com/150x225?text=Iron+Man',
    rating: 7.6,
    view: 15234,
    content: 'Tony Stark, một triệu phú kiêm kỹ sư có tài năng, phát triển một bộ giáp siêu mạnh và trở thành Iron Man.',
  },
  {
    slug: 'avengers-endgame-2024',
    name: 'Avengers: Endgame',
    origin_name: 'Avengers: Endgame',
    type: 'single',
    status: 'completed',
    year: 2024,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: '1',
    episode_total: '1',
    time: '181 phút',
    actor: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson'],
    director: ['Anthony Russo', 'Joe Russo'],
    category: [
      { name: 'Hành động', slug: 'hanh-dong' },
      { name: 'Khoa học viễn tưởng', slug: 'khoa-hoc-vien-tuong' },
    ],
    country: [{ name: 'Mỹ', slug: 'quoc-gia-usa' }],
    poster_url: 'https://via.placeholder.com/300x450?text=Avengers',
    thumb_url: 'https://via.placeholder.com/150x225?text=Avengers',
    rating: 8.4,
    view: 32145,
    content: 'Sau khi Thanos xóa sổ nửa dân số vũ trụ, những siêu anh hùng còn lại phải kết hợp để khôi phục mọi thứ.',
  },
  {
    slug: 'ngay-mai-khong-duoc-danh-rot-series',
    name: 'Ngày mai không được đánh rơi',
    origin_name: 'Ngày mai không được đánh rơi',
    type: 'series',
    status: 'ongoing',
    year: 2024,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: '12',
    episode_total: '16',
    time: '45 phút/tập',
    actor: ['Diễn viên A', 'Diễn viên B'],
    director: ['Đạo diễn C'],
    category: [
      { name: 'Tâm lý', slug: 'tam-ly' },
      { name: 'Tình cảm', slug: 'tinh-cam' },
    ],
    country: [{ name: 'Việt Nam', slug: 'quoc-gia-viet-nam' }],
    poster_url: 'https://via.placeholder.com/300x450?text=Vietnamese+Series',
    thumb_url: 'https://via.placeholder.com/150x225?text=Vietnamese+Series',
    rating: 7.2,
    view: 8932,
    content: 'Một câu chuyện tình cảm phức tạp giữa hai người trong thế giới hiện đại.',
  },
  {
    slug: 'shutter-island-2024',
    name: 'Shutter Island',
    origin_name: 'Shutter Island',
    type: 'single',
    status: 'completed',
    year: 2024,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: '1',
    episode_total: '1',
    time: '138 phút',
    actor: ['Leonardo DiCaprio', 'Mark Ruffalo'],
    director: ['Martin Scorsese'],
    category: [
      { name: 'Kinh dị', slug: 'kinh-di' },
      { name: 'Tâm lý', slug: 'tam-ly' },
    ],
    country: [{ name: 'Mỹ', slug: 'quoc-gia-usa' }],
    poster_url: 'https://via.placeholder.com/300x450?text=Shutter+Island',
    thumb_url: 'https://via.placeholder.com/150x225?text=Shutter+Island',
    rating: 8.1,
    view: 12456,
    content: 'Một đặc vụ liên bang đi điều tra một vụ mất tích tại một bệnh viện tâm thần trên một hòn đảo cô lập.',
  },
  {
    slug: 'demon-slayer-season-1',
    name: 'Thanh Gươm Diệt Quỷ',
    origin_name: 'Demon Slayer',
    type: 'series',
    status: 'completed',
    year: 2024,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: '26',
    episode_total: '26',
    time: '24 phút/tập',
    actor: ['Tanjiro Kamado', 'Nezuko Kamado'],
    director: ['Haruo Sotozaki'],
    category: [
      { name: 'Hành động', slug: 'hanh-dong' },
      { name: 'Phiêu lưu', slug: 'phieu-luu' },
    ],
    country: [{ name: 'Nhật Bản', slug: 'quoc-gia-nhat-ban' }],
    poster_url: 'https://via.placeholder.com/300x450?text=Demon+Slayer',
    thumb_url: 'https://via.placeholder.com/150x225?text=Demon+Slayer',
    rating: 8.7,
    view: 28934,
    content: 'Tanjiro đi cứu em gái mình khỏi lời nguyền của quỷ, trở thành một kiếm sĩ diệt quỷ.',
  },
  {
    slug: 'squid-game-season-1',
    name: 'Trò Chơi Con Mực',
    origin_name: 'Squid Game',
    type: 'series',
    status: 'completed',
    year: 2024,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: '9',
    episode_total: '9',
    time: '52 phút/tập',
    actor: ['Lee Jung-jae', 'Park Hae-soo'],
    director: ['Hwang Dong-hyuk'],
    category: [
      { name: 'Tâm lý', slug: 'tam-ly' },
      { name: 'Thực tế', slug: 'thuc-te' },
    ],
    country: [{ name: 'Hàn Quốc', slug: 'quoc-gia-han-quoc' }],
    poster_url: 'https://via.placeholder.com/300x450?text=Squid+Game',
    thumb_url: 'https://via.placeholder.com/150x225?text=Squid+Game',
    rating: 8.0,
    view: 45678,
    content: 'Hàng trăm người chơi trong tình cảnh tuyệt vọng tham gia một loạt trò chơi tử thần để chiến thắng một giải thưởng lớn.',
  },
];

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

async function seedGenres() {
  try {
    log('\n🎭 Seeding genres...', 'blue');
    await Genre.insertMany(sampleGenres);
    log(`✓ ${sampleGenres.length} genres created`, 'green');
  } catch (error) {
    log(`✗ Error seeding genres: ${error.message}`, 'red');
  }
}

async function seedCountries() {
  try {
    log('\n🌍 Seeding countries...', 'blue');
    await Country.insertMany(sampleCountries);
    log(`✓ ${sampleCountries.length} countries created`, 'green');
  } catch (error) {
    log(`✗ Error seeding countries: ${error.message}`, 'red');
  }
}

async function seedMovies() {
  try {
    log('\n🎬 Seeding movies...', 'blue');
    await Movie.insertMany(sampleMovies);
    log(`✓ ${sampleMovies.length} movies created`, 'green');
  } catch (error) {
    log(`✗ Error seeding movies: ${error.message}`, 'red');
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
    log('║   📦 Sample Data Seeding Script 📦           ║', 'bright');
    log('╚═══════════════════════════════════════════════╝', 'bright');

    await connectToDatabase();
    await clearDatabase();

    await seedGenres();
    await seedCountries();
    await seedMovies();

    await showStatistics();

    log('\n✓ Sample data seeding completed successfully!', 'green');
  } catch (error) {
    log(`\n✗ Seeding failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('✓ Database connection closed\n', 'green');
  }
}

main();
