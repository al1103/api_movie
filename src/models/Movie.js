const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: String,
    origin_name: String,
    description: String,
    content: String,
    status: String,
    poster_url: String,
    poster: String,
    banner: String,
    thumb_url: String,
    is_copyright: Boolean,
    sub_docquyen: Boolean,
    chieurap: Boolean,
    time: String,
    episode_current: String,
    episode_total: String,
    quality: String,
    lang: String,
    notify: String,
    showtimes: String,
    year: Number,
    duration: Number,
    view: Number,
    actor: [String],
    director: [String],
    cast: [String],
    trailer: String,
    category: [Object],
    country: Object,
    tmdb: Object,
    imdb: Object,
    rating: Number,
    modified: Date,
    episodes: [
      {
        episodeNumber: Number,
        title: String,
        description: String,
        videoUrl: String,
        thumbnailUrl: String,
        duration: Number,
        quality: String,
        language: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
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

movieSchema.index({ slug: 1 });
movieSchema.index({ name: "text", origin_name: "text" });
movieSchema.index({ year: 1 });
movieSchema.index({ "category.slug": 1 });
movieSchema.index({ "country.slug": 1 });
movieSchema.index({ updatedAt: 1 });

module.exports = mongoose.model("Movie", movieSchema);
