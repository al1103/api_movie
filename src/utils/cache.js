const CacheEntry = require('../models/CacheEntry');
const config = require('../config/env');

async function getCachedPayload(key) {
  const entry = await CacheEntry.findOne({ key }).lean();
  if (!entry) {
    return null;
  }

  const ageMinutes = (Date.now() - new Date(entry.fetchedAt).getTime()) / (1000 * 60);
  if (ageMinutes > config.cacheTtlMinutes) {
    return null;
  }

  return entry.payload;
}

async function setCachedPayload(key, payload) {
  await CacheEntry.findOneAndUpdate(
    { key },
    { payload, fetchedAt: new Date() },
    { upsert: true, new: true }
  );
}

module.exports = {
  getCachedPayload,
  setCachedPayload,
};
