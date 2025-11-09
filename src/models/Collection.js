const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['phim-bo', 'phim-le', 'tv-shows', 'hoat-hinh', 'phim-vietsub', 'phim-thuyet-minh', 'phim-long-tieng'],
      index: true,
    },
    movies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
      },
    ],
    pagination: Object,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

collectionSchema.index({ type: 1, updatedAt: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
