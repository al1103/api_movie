const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/api_movie',
  phimApiBaseUrl: process.env.PHIM_API_BASE_URL || 'https://phimapi.com',
  cacheTtlMinutes: Number(process.env.CACHE_TTL_MINUTES || 60),
};

module.exports = config;
