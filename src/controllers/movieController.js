const Joi = require("joi");
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
    const { slug } = req.params;
    const movie = await Movie.findOne({ slug });

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
      origin_name: Joi.string().trim(),
      slug: Joi.string().trim().required(),
      genres: Joi.array().items(Joi.string()).min(1).required(),
      description: Joi.string().trim(),
      content: Joi.string().trim(),
      status: Joi.string().valid("ongoing", "completed").default("ongoing"),
      year: Joi.number().integer().min(1970),
      time: Joi.string(),
      duration: Joi.number().integer(),
      poster: Joi.string().uri(),
      poster_url: Joi.string().uri(),
      banner: Joi.string().uri(),
      thumb_url: Joi.string().uri(),
      quality: Joi.string(),
      lang: Joi.string(),
      trailer: Joi.string().uri(),
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
    const schema = Joi.object({
      movieSlug: Joi.string().trim().required(),
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

    // Tìm phim theo slug
    const movie = await Movie.findOne({ slug: episodeData.movieSlug });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Khởi tạo episodes array nếu chưa có
    if (!movie.episodes) {
      movie.episodes = [];
    }

    // Kiểm tra tập phim đã tồn tại
    const episodeExists = movie.episodes.some(
      (ep) => ep.episodeNumber === episodeData.episodeNumber
    );

    if (episodeExists) {
      return res.status(400).json({
        error: `Episode ${episodeData.episodeNumber} already exists`,
      });
    }

    // Thêm tập phim mới
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

    // Cập nhật episode_current và episode_total
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
    const schema = Joi.object({
      movieSlug: Joi.string().trim().required(),
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

    // Tìm phim theo slug
    const movie = await Movie.findOne({ slug: uploadData.movieSlug });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Khởi tạo episodes array nếu chưa có
    if (!movie.episodes) {
      movie.episodes = [];
    }

    const addedEpisodes = [];
    const failedEpisodes = [];

    for (const episodeData of uploadData.episodes) {
      // Kiểm tra tập phim đã tồn tại
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

      // Thêm tập phim mới
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
      // Cập nhật episode_current và episode_total
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
      origin_name: Joi.string().trim(),
      slug: Joi.string().trim().required(),
      genres: Joi.array().items(Joi.string()).min(1).required(),
      description: Joi.string().trim(),
      content: Joi.string().trim(),
      status: Joi.string().valid("ongoing", "completed").default("ongoing"),
      year: Joi.number().integer().min(1970),
      time: Joi.string(),
      duration: Joi.number().integer(),
      poster: Joi.string().uri(),
      poster_url: Joi.string().uri(),
      banner: Joi.string().uri(),
      thumb_url: Joi.string().uri(),
      quality: Joi.string(),
      lang: Joi.string(),
      trailer: Joi.string().uri(),
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
    const episodeSchema = Joi.object({
      movieSlug: Joi.string().trim().required(),
      episodeNumber: Joi.number().integer().min(1).required(),
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      quality: Joi.string().valid("360p", "480p", "720p", "1080p"),
      language: Joi.string(),
    });

    const episodeData = await episodeSchema.validateAsync(req.body);

    // Kiểm tra file video
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "Video file is required" });
    }

    // Tìm phim theo slug
    const movie = await Movie.findOne({ slug: episodeData.movieSlug });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Khởi tạo episodes array nếu chưa có
    if (!movie.episodes) {
      movie.episodes = [];
    }

    // Kiểm tra tập phim đã tồn tại
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

    // Lưu file tạm thời
    await videoFile.mv(videoPath);

    try {
      // Upload video lên Cloudinary
      const uploadResult = await uploadVideo(videoPath);

      if (!uploadResult.success) {
        fs.unlinkSync(videoPath);
        return res.status(400).json({ error: uploadResult.error });
      }

      // Upload thumbnail nếu có
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

      // Thêm tập phim mới
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

      // Cập nhật episode_current và episode_total
      movie.episode_current = `${movie.episodes.length}`;
      movie.episode_total = `${movie.episodes.length}`;
      movie.updatedAt = new Date();

      await movie.save();

      // Xóa file tạm thời
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
    const imageSchema = Joi.object({
      movieSlug: Joi.string().trim().required(),
      imageType: Joi.string().valid("poster", "thumbnail").required(),
    });

    const imageData = await imageSchema.validateAsync(req.body);

    // Kiểm tra file image
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Tìm phim theo slug
    const movie = await Movie.findOne({ slug: imageData.movieSlug });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const imageFile = req.files.image;
    const imagePath = path.join(uploadDir, imageFile.name);

    // Lưu file tạm thời
    await imageFile.mv(imagePath);

    try {
      // Upload image lên Cloudinary
      const uploadResult = await uploadImage(imagePath);

      if (!uploadResult.success) {
        fs.unlinkSync(imagePath);
        return res.status(400).json({ error: uploadResult.error });
      }

      // Cập nhật poster hoặc thumbnail
      if (imageData.imageType === "poster") {
        movie.poster_url = uploadResult.url;
      } else {
        movie.thumb_url = uploadResult.url;
      }

      movie.updatedAt = new Date();
      await movie.save();

      // Xóa file tạm thời
      fs.unlinkSync(imagePath);

      res.status(200).json({
        success: true,
        message: `${imageData.imageType} image uploaded successfully`,
        imageUrl: uploadResult.url,
      });
    } catch (uploadError) {
      // Xóa file tạm thời nếu lỗi
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
    const { slug } = req.params;

    // Lấy danh sách tất cả genres
    const allGenres = await Genre.find().select("_id slug name");
    const validGenreIds = allGenres.map((g) => g._id.toString());

    const schema = Joi.object({
      name: Joi.string().trim(),
      origin_name: Joi.string().trim(),
      slug: Joi.string().trim(),
      genres: Joi.array().items(Joi.string()).min(1),
      description: Joi.string().trim(),
      content: Joi.string().trim(),
      status: Joi.string().valid("ongoing", "completed"),
      year: Joi.number().integer().min(1970),
      time: Joi.string(),
      duration: Joi.number().integer(),
      poster: Joi.string().uri(),
      poster_url: Joi.string().uri(),
      banner: Joi.string().uri(),
      thumb_url: Joi.string().uri(),
      quality: Joi.string(),
      lang: Joi.string(),
      trailer: Joi.string().uri(),
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

    // If genres provided, validate them
    if (movieData.genres) {
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

      movieData.category = genreDetails.map((g) => ({
        name: g.name,
        slug: g.slug,
      }));
    }

    // Check if new slug already exists (if slug is being updated)
    if (movieData.slug && movieData.slug !== slug) {
      const existingMovie = await Movie.findOne({ slug: movieData.slug });
      if (existingMovie) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    // Update movie
    const updatedMovie = await Movie.findOneAndUpdate(
      { slug },
      { ...movieData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ error: "Movie not found" });
    }

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
 * DELETE /api/movies/:slug
 * Delete movie
 */
async function handleDeleteMovie(req, res, next) {
  try {
    const { slug } = req.params;

    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Delete from database
    await Movie.deleteOne({ slug });

    res.json({
      success: true,
      message: "Movie deleted successfully",
      movie,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleLatestMovies,
  handleMovieDetails,
  handleMovieByTmdb,
  handleCollections,
  handleSearch,
  handleGenres,
  handleGenreDetail,
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
