const mongoose = require('mongoose');

const cacheEntrySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

cacheEntrySchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

module.exports = mongoose.model('CacheEntry', cacheEntrySchema);
