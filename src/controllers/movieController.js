const Joi = require("joi");
const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Genre = require("../models/Genre");
const Country = require("../models/Country");
const { uploadVideo, uploadImage, deleteFile } = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");

// Sử dụng thư mục uploads thay vì /tmp
const uploadDir = path.join(__dirname, "../../uploads");

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  sort_field: Joi.string(),
  sort_type: Joi.string().valid("asc", "desc"),
  sort_lang: Joi.string(),
  category: Joi.string(),
  country: Joi.string(),
  year: Joi.alternatives(Joi.number().integer().min(1970), Joi.string()),
  limit: Joi.number().integer().min(1).max(64),
});

async function handleLatestMovies(req, res, next) {
  try {
    const { page } = await Joi.object({
      page: Joi.number().integer().min(1).default(1),
    }).validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const limit = 10;
    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      Movie.find().sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Movie.countDocuments(),
    ]);

    res.json({
      items: movies,
      pagination: {
        page,
        limit,
        total,
        total_page: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleMovieDetails(req, res, next) {
  try {
    const { movieIdOrSlug } = req.params;
    let movie = null;

    // Try to find by ObjectId first (if it's a valid MongoDB ID)
    if (mongoose.Types.ObjectId.isValid(movieIdOrSlug)) {
      movie = await Movie.findById(movieIdOrSlug);
    }

    // If not found and it's not a valid ObjectId, or if it's a valid ObjectId but movie not found, try slug
    if (!movie) {
      movie = await Movie.findOne({ slug: movieIdOrSlug });
    }

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({ movie });
  } catch (error) {
    next(error);
  }
}

async function handleMovieByTmdb(req, res, next) {
  try {
    const schema = Joi.object({
      type: Joi.string().valid("tv", "movie").required(),
      id: Joi.alternatives(Joi.string(), Joi.number()).required(),
    });

    const { type, id } = await schema.validateAsync(req.params);
    const movie = await Movie.findOne({ "tmdb.id": parseInt(id, 10) });

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({ movie });
  } catch (error) {
    next(error);
  }
}

async function handleCollections(req, res, next) {
  try {
    const schema = paginationSchema.append({
      type_list: Joi.string()
        .valid(
          "phim-bo",
          "phim-le",
          "tv-shows",
          "hoat-hinh",
          "phim-vietsub",
          "phim-thuyet-minh",
          "phim-long-tieng"
        )
        .required(),
    });

    const { type_list, page, limit } = await schema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const skip = (page - 1) * (limit || 10);
    const queryLimit = limit || 10;

    // Query by type (series or single)
    const typeMap = {
      "phim-bo": "series",
      "phim-le": "single",
      "tv-shows": "tv",
      "hoat-hinh": "hoat-hinh",
    };

    const movieType = typeMap[type_list] || type_list;

    const [movies, total] = await Promise.all([
      Movie.find({ type: movieType })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Movie.countDocuments({ type: movieType }),
    ]);

    res.json({
      items: movies,
      pagination: {
        page,
        limit: queryLimit,
        total,
        total_page: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleSearch(req, res, next) {
  try {
    const schema = paginationSchema.append({
      keyword: Joi.string().trim().min(1).required(),
    });

    const { keyword, page, limit } = await schema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const skip = (page - 1) * (limit || 10);
    const queryLimit = limit || 10;

    const searchFilter = {
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { origin_name: { $regex: keyword, $options: "i" } },
        { slug: { $regex: keyword, $options: "i" } },
      ],
    };

    const [movies, total] = await Promise.all([
      Movie.find(searchFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Movie.countDocuments(searchFilter),
    ]);

    res.json({
      items: movies,
      pagination: {
        page,
        limit: queryLimit,
        total,
        total_page: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleGenres(req, res, next) {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json({ items: genres });
  } catch (error) {
    next(error);
  }
}

async function handleGenreDetail(req, res, next) {
  try {
    const { slug } = req.params;
    const { page, limit } = await paginationSchema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const skip = (page - 1) * (limit || 10);
    const queryLimit = limit || 10;

    const [movies, total] = await Promise.all([
      Movie.find({ "category.slug": slug })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Movie.countDocuments({ "category.slug": slug }),
    ]);

    res.json({
      items: movies,
      pagination: {
        page,
        limit: queryLimit,
        total,
        total_page: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleMoviesByGenreId(req, res, next) {
  try {
    const { genreId } = req.params;
    const { page, limit } = await paginationSchema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const skip = (page - 1) * (limit || 10);
    const queryLimit = limit || 10;

    // Check if genre ID exists
    const genre = await Genre.findById(genreId);
    if (!genre) {
      return res.status(404).json({ error: "Genre not found" });
    }

    // Query: Tìm theo category._id hoặc category.slug (để support cả 2 format)
    const query = {
      $or: [{ "category._id": genreId }, { "category.slug": genre.slug }],
    };

    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ updatedAt: -1 }).skip(skip).limit(queryLimit),
      Movie.countDocuments(query),
    ]);

    res.json({
      items: movies,
      genre: {
        _id: genre._id,
        name: genre.name,
        slug: genre.slug,
      },
      pagination: {
        page,
        limit: queryLimit,
        total,
        total_page: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Genre CRUD Operations

async function handleCreateGenre(req, res, next) {
  try {
    const schema = Joi.object({
      name: Joi.string().trim().required(),
      slug: Joi.string().trim().required(),
    });

    const genreData = await schema.validateAsync(req.body);

    // Check if slug already exists
    const existingGenre = await Genre.findOne({ slug: genreData.slug });
    if (existingGenre) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    const genre = new Genre(genreData);
    await genre.save();

    res.status(201).json({
      success: true,
      message: "Genre created successfully",
      genre,
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

async function handleUpdateGenre(req, res, next) {
  try {
    const { genreId } = req.params;

    // Validate if genreId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(genreId)) {
      return res.status(400).json({ error: "Invalid genre ID format" });
    }

    const schema = Joi.object({
      name: Joi.string().trim(),
      slug: Joi.string().trim(),
    });

    const genreData = await schema.validateAsync(req.body);

    // Find genre by ID
    const genre = await Genre.findById(genreId);
    if (!genre) {
      return res.status(404).json({ error: "Genre not found" });
    }

    // If new slug is being updated, check uniqueness
    if (genreData.slug && genreData.slug !== genre.slug) {
      const existingGenre = await Genre.findOne({ slug: genreData.slug });
      if (existingGenre) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    const updatedGenre = await Genre.findByIdAndUpdate(
      genreId,
      { ...genreData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedGenre) {
      return res.status(404).json({ error: "Genre not found" });
    }

    res.json({
      success: true,
      message: "Genre updated successfully",
      genre: updatedGenre,
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

async function handleDeleteGenre(req, res, next) {
  try {
    const { genreId } = req.params;

    // Validate if genreId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(genreId)) {
      return res.status(400).json({ error: "Invalid genre ID format" });
    }

    const genre = await Genre.findById(genreId);
    if (!genre) {
      return res.status(404).json({ error: "Genre not found" });
    }

    // Check if genre is being used by movies
    const movieCount = await Movie.countDocuments({ genres: genreId });
    if (movieCount > 0) {
      return res.status(400).json({
        error: `Cannot delete genre. It is used by ${movieCount} movie(s)`,
      });
    }

    await Genre.findByIdAndDelete(genreId);

    res.json({
      success: true,
      message: "Genre deleted successfully",
      genre,
    });
  } catch (error) {
    next(error);
  }
}

async function handleCountries(req, res, next) {
  try {
    const countries = await Country.find().sort({ name: 1 });
    res.json({ items: countries });
  } catch (error) {
    next(error);
  }
}

async function handleCountryDetail(req, res, next) {
  try {
    const { slug } = req.params;
    const { page, limit } = await paginationSchema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const skip = (page - 1) * (limit || 10);
    const queryLimit = limit || 10;

    const [movies, total] = await Promise.all([
      Movie.find({ "country.slug": slug })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Movie.countDocuments({ "country.slug": slug }),
    ]);

    res.json({
      items: movies,
      pagination: {
        page,
        limit: queryLimit,
        total,
        total_page: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleYearDetail(req, res, next) {
  try {
    const { year } = req.params;
    const { page, limit } = await paginationSchema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const yearNum = parseInt(year, 10);
    const skip = (page - 1) * (limit || 10);
    const queryLimit = limit || 10;

    const [movies, total] = await Promise.all([
      Movie.find({ year: yearNum })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      Movie.countDocuments({ year: yearNum }),
    ]);

    res.json({
      items: movies,
      pagination: {
        page,
        limit: queryLimit,
        total,
        total_page: Math.ceil(total / queryLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function handleUploadNewMovie(req, res, next) {
  try {
    // Lấy danh sách valid genres từ database
    const genres = await Genre.find().select("slug");
    const validGenres = genres.map((g) => g.slug);

    const schema = Joi.object({
      name: Joi.string().trim().required(),
      origin_name: Joi.string().trim().allow(""),
      slug: Joi.string().trim().required(),
      genres: Joi.array().items(Joi.string()).min(1),
      description: Joi.string().trim().allow(""),
      content: Joi.string().trim().allow(""),
      status: Joi.string().valid("ongoing", "completed").default("ongoing"),
      year: Joi.number().integer().min(1970),
      time: Joi.string().allow(""),
      duration: Joi.number().integer(),
      poster: Joi.string().uri().allow(""),
      poster_url: Joi.string().uri().allow(""),
      banner: Joi.string().uri().allow(""),
      thumb_url: Joi.string().uri().allow(""),
      quality: Joi.string().allow(""),
      lang: Joi.string().allow(""),
      trailer: Joi.string().uri().allow(""),
      linkUrl: Joi.string().uri().allow(""),
      actor: Joi.array().items(Joi.string()),
      director: Joi.array().items(Joi.string()),
      cast: Joi.array().items(Joi.string()),
      country: Joi.alternatives().try(
        Joi.object({
          name: Joi.string(),
          slug: Joi.string(),
        }),
        Joi.string().allow("")
      ),
    });

    const movieData = await schema.validateAsync(req.body);

    // Lấy danh sách tất cả genres
    const allGenres = await Genre.find().select("_id slug name");
    const validGenreIds = allGenres.map((g) => g._id.toString());

    // Validate genre IDs exist
    const invalidGenreIds = movieData.genres.filter(
      (id) => !validGenreIds.includes(id)
    );
    if (invalidGenreIds.length > 0) {
      return res.status(400).json({
        error: `Invalid genre IDs: ${invalidGenreIds.join(", ")}`,
      });
    }

    // Get genre details
    const genreDetails = allGenres.filter((g) =>
      movieData.genres.includes(g._id.toString())
    );

    // Kiểm tra slug đã tồn tại
    const existingMovie = await Movie.findOne({ slug: movieData.slug });
    if (existingMovie) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    const movie = new Movie({
      ...movieData,
      category: genreDetails.map((g) => ({
        name: g.name,
        slug: g.slug,
      })),
    });
    await movie.save();

    res.status(201).json({
      success: true,
      message: "Movie uploaded successfully",
      movie,
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

async function handleUploadEpisode(req, res, next) {
  try {
    const { movieId } = req.params;

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID format" });
    }

    const schema = Joi.object({
      episodeNumber: Joi.number().integer().min(1).required(),
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      videoUrl: Joi.string().uri().required(),
      thumbnailUrl: Joi.string().uri(),
      duration: Joi.number().integer(),
      quality: Joi.string().valid("360p", "480p", "720p", "1080p"),
      language: Joi.string(),
    });

    const episodeData = await schema.validateAsync(req.body);

    // Find movie by ID
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Initialize episodes array if not exists
    if (!movie.episodes) {
      movie.episodes = [];
    }

    // Check if episode already exists
    const episodeExists = movie.episodes.some(
      (ep) => ep.episodeNumber === episodeData.episodeNumber
    );

    if (episodeExists) {
      return res.status(400).json({
        error: `Episode ${episodeData.episodeNumber} already exists`,
      });
    }

    // Add new episode
    movie.episodes.push({
      episodeNumber: episodeData.episodeNumber,
      title: episodeData.title || `Episode ${episodeData.episodeNumber}`,
      description: episodeData.description,
      videoUrl: episodeData.videoUrl,
      thumbnailUrl: episodeData.thumbnailUrl,
      duration: episodeData.duration,
      quality: episodeData.quality,
      language: episodeData.language,
      createdAt: new Date(),
    });

    // Update episode_current and episode_total
    movie.episode_current = `${movie.episodes.length}`;
    movie.episode_total = `${movie.episodes.length}`;
    movie.updatedAt = new Date();

    await movie.save();

    res.status(201).json({
      success: true,
      message: "Episode uploaded successfully",
      episode: movie.episodes[movie.episodes.length - 1],
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

async function handleUploadMultipleEpisodes(req, res, next) {
  try {
    const { movieId } = req.params;

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID format" });
    }

    const schema = Joi.object({
      episodes: Joi.array()
        .items(
          Joi.object({
            episodeNumber: Joi.number().integer().min(1).required(),
            title: Joi.string().trim(),
            videoUrl: Joi.string().uri().required(),
            thumbnailUrl: Joi.string().uri(),
            duration: Joi.number().integer(),
            quality: Joi.string().valid("360p", "480p", "720p", "1080p"),
            language: Joi.string(),
          })
        )
        .min(1)
        .required(),
    });

    const uploadData = await schema.validateAsync(req.body);

    // Find movie by ID
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Initialize episodes array if not exists
    if (!movie.episodes) {
      movie.episodes = [];
    }

    const addedEpisodes = [];
    const failedEpisodes = [];

    for (const episodeData of uploadData.episodes) {
      // Check if episode already exists
      const episodeExists = movie.episodes.some(
        (ep) => ep.episodeNumber === episodeData.episodeNumber
      );

      if (episodeExists) {
        failedEpisodes.push({
          episodeNumber: episodeData.episodeNumber,
          error: "Episode already exists",
        });
        continue;
      }

      // Add new episode
      const newEpisode = {
        episodeNumber: episodeData.episodeNumber,
        title: episodeData.title || `Episode ${episodeData.episodeNumber}`,
        description: episodeData.description,
        videoUrl: episodeData.videoUrl,
        thumbnailUrl: episodeData.thumbnailUrl,
        duration: episodeData.duration,
        quality: episodeData.quality,
        language: episodeData.language,
        createdAt: new Date(),
      };

      movie.episodes.push(newEpisode);
      addedEpisodes.push(newEpisode);
    }

    if (addedEpisodes.length > 0) {
      // Update episode_current and episode_total
      movie.episode_current = `${movie.episodes.length}`;
      movie.episode_total = `${movie.episodes.length}`;
      movie.updatedAt = new Date();
      await movie.save();
    }

    res.status(201).json({
      success: true,
      message: `${addedEpisodes.length} episode(s) uploaded successfully`,
      addedEpisodes,
      failedEpisodes: failedEpisodes.length > 0 ? failedEpisodes : undefined,
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

/**
 * Upload phim mới với video file
 * Tự động upload video lên Cloudinary
 */
async function handleUploadNewMovieWithVideo(req, res, next) {
  try {
    // Lấy danh sách tất cả genres
    const allGenres = await Genre.find().select("_id slug name");
    const validGenreIds = allGenres.map((g) => g._id.toString());

    // Lấy thông tin phim
    const movieSchema = Joi.object({
      name: Joi.string().trim().required(),
      origin_name: Joi.string().trim().allow(""),
      slug: Joi.string().trim().required(),
      genres: Joi.array().items(Joi.string()).min(1),
      description: Joi.string().trim().allow(""),
      content: Joi.string().trim().allow(""),
      status: Joi.string().valid("ongoing", "completed").default("ongoing"),
      year: Joi.number().integer().min(1970),
      time: Joi.string().allow(""),
      duration: Joi.number().integer(),
      poster: Joi.string().uri().allow(""),
      poster_url: Joi.string().uri().allow(""),
      banner: Joi.string().uri().allow(""),
      thumb_url: Joi.string().uri().allow(""),
      quality: Joi.string().allow(""),
      lang: Joi.string().allow(""),
      trailer: Joi.string().uri().allow(""),
      linkUrl: Joi.string().uri().allow(""),
      actor: Joi.array().items(Joi.string()),
      director: Joi.array().items(Joi.string()),
      cast: Joi.array().items(Joi.string()),
      country: Joi.alternatives().try(
        Joi.object({
          name: Joi.string(),
          slug: Joi.string(),
        }),
        Joi.string().allow("")
      ),
    });

    const movieData = await movieSchema.validateAsync(req.body);

    // Validate genre IDs exist
    const invalidGenreIds = movieData.genres.filter(
      (id) => !validGenreIds.includes(id)
    );
    if (invalidGenreIds.length > 0) {
      return res.status(400).json({
        error: `Invalid genre IDs: ${invalidGenreIds.join(", ")}`,
      });
    }

    // Get genre details
    const genreDetails = allGenres.filter((g) =>
      movieData.genres.includes(g._id.toString())
    );

    // Kiểm tra file video
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "Video file is required" });
    }

    // Kiểm tra slug đã tồn tại
    const existingMovie = await Movie.findOne({ slug: movieData.slug });
    if (existingMovie) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    const videoFile = req.files.video;
    const videoPath = path.join(uploadDir, videoFile.name);

    // Lưu file tạm thời
    await videoFile.mv(videoPath);

    try {
      // Upload video lên Cloudinary
      const uploadResult = await uploadVideo(videoPath);

      if (!uploadResult.success) {
        fs.unlinkSync(videoPath);
        return res.status(400).json({ error: uploadResult.error });
      }

      // Upload poster/thumbnail nếu có
      let posterUrl = movieData.poster_url;
      let thumbUrl = movieData.thumb_url;

      if (req.files && req.files.poster) {
        const posterPath = path.join(uploadDir, req.files.poster.name);
        await req.files.poster.mv(posterPath);

        const posterResult = await uploadImage(posterPath);
        if (posterResult.success) {
          posterUrl = posterResult.url;
          fs.unlinkSync(posterPath);
        }
      }

      if (req.files && req.files.thumbnail) {
        const thumbPath = path.join(uploadDir, req.files.thumbnail.name);
        await req.files.thumbnail.mv(thumbPath);

        const thumbResult = await uploadImage(thumbPath);
        if (thumbResult.success) {
          thumbUrl = thumbResult.url;
          fs.unlinkSync(thumbPath);
        }
      }

      // Tạo phim với episode đầu tiên
      const movie = new Movie({
        name: movieData.name,
        origin_name: movieData.origin_name,
        slug: movieData.slug,
        poster_url: posterUrl,
        thumb_url: thumbUrl,
        quality: movieData.quality || "720p",
        lang: movieData.lang,
        actor: movieData.actor,
        director: movieData.director,
        country: movieData.country,
        content: movieData.content,
        year: movieData.year,
        time: movieData.time,
        status: movieData.status,
        category: genreDetails.map((g) => ({
          name: g.name,
          slug: g.slug,
        })),
        episode_current: "1",
        episode_total: "1",
        episodes: [
          {
            episodeNumber: 1,
            title: "Episode 1",
            videoUrl: uploadResult.url,
            duration: uploadResult.duration,
            quality: movieData.quality || "720p",
            language: movieData.lang,
            createdAt: new Date(),
          },
        ],
      });

      await movie.save();

      // Xóa file tạm thời
      fs.unlinkSync(videoPath);

      res.status(201).json({
        success: true,
        message: "Movie uploaded successfully",
        movie: movie,
      });
    } catch (uploadError) {
      // Xóa file tạm thời nếu lỗi
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      throw uploadError;
    }
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

/**
 * Upload tập phim mới với video file
 * Tự động upload video lên Cloudinary
 */
async function handleUploadEpisodeWithVideo(req, res, next) {
  try {
    const { movieId } = req.params;

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID format" });
    }

    const episodeSchema = Joi.object({
      episodeNumber: Joi.number().integer().min(1).required(),
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      quality: Joi.string().valid("360p", "480p", "720p", "1080p"),
      language: Joi.string(),
    });

    const episodeData = await episodeSchema.validateAsync(req.body);

    // Check video file
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "Video file is required" });
    }

    // Find movie by ID
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Initialize episodes array if not exists
    if (!movie.episodes) {
      movie.episodes = [];
    }

    // Check if episode already exists
    const episodeExists = movie.episodes.some(
      (ep) => ep.episodeNumber === episodeData.episodeNumber
    );

    if (episodeExists) {
      return res.status(400).json({
        error: `Episode ${episodeData.episodeNumber} already exists`,
      });
    }

    const videoFile = req.files.video;
    const videoPath = path.join(uploadDir, videoFile.name);

    // Save temporary file
    await videoFile.mv(videoPath);

    try {
      // Upload video to Cloudinary
      const uploadResult = await uploadVideo(videoPath);

      if (!uploadResult.success) {
        fs.unlinkSync(videoPath);
        return res.status(400).json({ error: uploadResult.error });
      }

      // Upload thumbnail if exists
      let thumbnailUrl = undefined;
      if (req.files && req.files.thumbnail) {
        const thumbPath = path.join(uploadDir, req.files.thumbnail.name);
        await req.files.thumbnail.mv(thumbPath);

        const thumbResult = await uploadImage(thumbPath);
        if (thumbResult.success) {
          thumbnailUrl = thumbResult.url;
          fs.unlinkSync(thumbPath);
        }
      }

      // Add new episode
      const newEpisode = {
        episodeNumber: episodeData.episodeNumber,
        title: episodeData.title || `Episode ${episodeData.episodeNumber}`,
        description: episodeData.description,
        videoUrl: uploadResult.url,
        thumbnailUrl: thumbnailUrl,
        duration: uploadResult.duration,
        quality: episodeData.quality || "720p",
        language: episodeData.language,
        createdAt: new Date(),
      };

      movie.episodes.push(newEpisode);

      // Update episode_current and episode_total
      movie.episode_current = `${movie.episodes.length}`;
      movie.episode_total = `${movie.episodes.length}`;
      movie.updatedAt = new Date();

      await movie.save();

      // Delete temporary file
      fs.unlinkSync(videoPath);

      res.status(201).json({
        success: true,
        message: "Episode uploaded successfully",
        episode: newEpisode,
      });
    } catch (uploadError) {
      // Xóa file tạm thời nếu lỗi
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      throw uploadError;
    }
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

/**
 * Upload poster/thumbnail image cho phim
 */
async function handleUploadNewPosterImage(req, res, next) {
  try {
    const { movieId } = req.params;

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID format" });
    }

    const imageSchema = Joi.object({
      imageType: Joi.string().valid("poster", "thumbnail").required(),
    });

    const imageData = await imageSchema.validateAsync(req.body);

    // Check image file
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Find movie by ID
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const imageFile = req.files.image;
    const imagePath = path.join(uploadDir, imageFile.name);

    // Save temporary file
    await imageFile.mv(imagePath);

    try {
      // Upload image to Cloudinary
      const uploadResult = await uploadImage(imagePath);

      if (!uploadResult.success) {
        fs.unlinkSync(imagePath);
        return res.status(400).json({ error: uploadResult.error });
      }

      // Update poster or thumbnail
      if (imageData.imageType === "poster") {
        movie.poster_url = uploadResult.url;
      } else {
        movie.thumb_url = uploadResult.url;
      }

      movie.updatedAt = new Date();
      await movie.save();

      // Delete temporary file
      fs.unlinkSync(imagePath);

      res.status(200).json({
        success: true,
        message: `${imageData.imageType} image uploaded successfully`,
        imageUrl: uploadResult.url,
      });
    } catch (uploadError) {
      // Delete temporary file if error
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      throw uploadError;
    }
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

/**
 * POST /upload/image
 * Upload ảnh lên Cloudinary và trả về URL
 */
async function handleUploadImage(req, res, next) {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imageFile = req.files.image;
    const tempFilePath = imageFile.tempFilePath;

    // Upload ảnh lên Cloudinary
    const uploadResult = await uploadImage(tempFilePath, {
      folder: "movies/images",
      quality: "auto",
      fetch_format: "auto",
      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    // Xóa file tạm
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
        error: uploadResult.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      },
    });
  } catch (error) {
    // Xóa file tạm nếu có lỗi
    if (req.files && req.files.image) {
      const tempFilePath = req.files.image.tempFilePath;
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    next(error);
  }
}

/**
 * POST /upload/video
 * Upload video lên Cloudinary và trả về URL
 */
async function handleUploadVideoFile(req, res, next) {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: "No video file provided",
      });
    }

    const videoFile = req.files.video;
    const tempFilePath = videoFile.tempFilePath;

    // Kiểm tra kích thước file (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        success: false,
        message: "File size exceeds 500MB limit",
      });
    }

    // Upload video lên Cloudinary
    const uploadResult = await uploadVideo(tempFilePath, {
      folder: "movies/videos",
      resource_type: "video",
      quality: "auto",
      fetch_format: "auto",
    });

    // Xóa file tạm
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Video upload failed",
        error: uploadResult.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        duration: uploadResult.duration,
      },
    });
  } catch (error) {
    // Xóa file tạm nếu có lỗi
    if (req.files && req.files.video) {
      const tempFilePath = req.files.video.tempFilePath;
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    next(error);
  }
}

/**
 * PUT /api/movies/:slug
 * Update movie information
 */
async function handleUpdateMovie(req, res, next) {
  try {
    const { movieId } = req.params;

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID format" });
    }

    // Lấy danh sách tất cả genres
    const allGenres = await Genre.find().select("_id slug name");
    const validGenreIds = allGenres.map((g) => g._id.toString());

    const schema = Joi.object({
      name: Joi.string().trim(),
      origin_name: Joi.string().trim().allow(""),
      slug: Joi.string().trim(),
      genres: Joi.array().items(Joi.string()).min(1),
      description: Joi.string().trim().allow(""),
      content: Joi.string().trim().allow(""),
      status: Joi.string().valid("ongoing", "completed"),
      year: Joi.number().integer().min(1970),
      time: Joi.string().allow(""),
      duration: Joi.number().integer(),
      poster: Joi.string().uri().allow(""),
      poster_url: Joi.string().uri().allow(""),
      banner: Joi.string().uri().allow(""),
      thumb_url: Joi.string().uri().allow(""),
      quality: Joi.string().allow(""),
      lang: Joi.string().allow(""),
      trailer: Joi.string().uri().allow(""),
      linkUrl: Joi.string().uri().allow(""),
      actor: Joi.array().items(Joi.string()),
      director: Joi.array().items(Joi.string()),
      cast: Joi.array().items(Joi.string()),
      country: Joi.alternatives().try(
        Joi.object({
          name: Joi.string(),
          slug: Joi.string(),
        }),
        Joi.string().allow("")
      ),
    });

    const movieData = await schema.validateAsync(req.body);

    // Get current movie to check existing slug
    const currentMovie = await Movie.findById(movieId);
    if (!currentMovie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Check if new slug already exists (if slug is being updated)
    if (movieData.slug && movieData.slug !== currentMovie.slug) {
      const existingMovie = await Movie.findOne({ slug: movieData.slug });
      if (existingMovie) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    // Update movie
    const updatedMovie = await Movie.findByIdAndUpdate(
      movieId,
      { ...movieData, updatedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: "Movie updated successfully",
      movie: updatedMovie,
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next(error);
  }
}

/**
 * DELETE /api/movies/:movieId
 * Delete movie
 */
async function handleDeleteMovie(req, res, next) {
  try {
    const { movieId } = req.params;

    // Validate if movieId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ error: "Invalid movie ID format" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Delete from database
    await Movie.findByIdAndDelete(movieId);

    res.json({
      success: true,
      message: "Movie deleted successfully",
      movie,
    });
  } catch (error) {
    next(error);
  }
}

async function handleTopMovies(req, res, next) {
  try {
    const schema = Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string()
        .valid("view", "rating", "year", "updatedAt")
        .default("updatedAt"),
    });

    const { limit, sortBy } = await schema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const sortOptions = {
      view: { view: -1 },
      rating: { rating: -1 },
      year: { year: -1 },
      updatedAt: { updatedAt: -1 },
    };

    const movies = await Movie.find().sort(sortOptions[sortBy]).limit(limit);

    res.json({
      items: movies,
      count: movies.length,
      sortBy,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleLatestMovies,
  handleTopMovies,
  handleMovieDetails,
  handleMovieByTmdb,
  handleCollections,
  handleSearch,
  handleGenres,
  handleGenreDetail,
  handleMoviesByGenreId,
  handleCreateGenre,
  handleUpdateGenre,
  handleDeleteGenre,
  handleCountries,
  handleCountryDetail,
  handleYearDetail,
  handleUploadNewMovie,
  handleUploadEpisode,
  handleUploadMultipleEpisodes,
  handleUploadNewMovieWithVideo,
  handleUploadEpisodeWithVideo,
  handleUploadNewPosterImage,
  handleUploadImage,
  handleUploadVideoFile,
  handleUpdateMovie,
  handleDeleteMovie,
};
