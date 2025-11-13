const { Router } = require("express");
const movieController = require("../controllers/movieController");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

// Public routes
router.get("/movies/new", movieController.handleLatestMovies);
router.get("/movies/top", movieController.handleTopMovies);
router.get("/movies/tmdb/:type/:id", movieController.handleMovieByTmdb);
router.get("/movies/:movieIdOrSlug", movieController.handleMovieDetails);
router.get("/collections", movieController.handleCollections);
router.get("/search", movieController.handleSearch);
router.get("/genres", movieController.handleGenres);
router.get("/genres/:genreId/movies", movieController.handleMoviesByGenreId);
router.get("/genres/:slug", movieController.handleGenreDetail);

// Genre CRUD routes (Admin only)
router.post(
  "/genres",
  authenticate,
  authorize("admin"),
  movieController.handleCreateGenre
);

router.put(
  "/genres/:genreId",
  authenticate,
  authorize("admin"),
  movieController.handleUpdateGenre
);

router.delete(
  "/genres/:genreId",
  authenticate,
  authorize("admin"),
  movieController.handleDeleteGenre
);

router.get("/countries", movieController.handleCountries);
router.get("/countries/:slug", movieController.handleCountryDetail);
router.get("/years/:year", movieController.handleYearDetail);

// Protected routes - Upload (require ADMIN role)
router.post(
  "/movies/upload",
  authenticate,
  authorize("admin"),
  movieController.handleUploadNewMovie
);

router.put(
  "/movies/:movieId",
  authenticate,
  authorize("admin"),
  movieController.handleUpdateMovie
);

router.delete(
  "/movies/:movieId",
  authenticate,
  authorize("admin"),
  movieController.handleDeleteMovie
);

router.post(
  "/movies/:movieId/episodes",
  authenticate,
  authorize("admin"),
  movieController.handleUploadEpisode
);

router.post(
  "/movies/:movieId/episodes/batch",
  authenticate,
  authorize("admin"),
  movieController.handleUploadMultipleEpisodes
);

// Cloudinary upload routes
router.post(
  "/movies/upload/cloudinary",
  authenticate,
  authorize("admin"),
  movieController.handleUploadNewMovieWithVideo
);

router.post(
  "/movies/:movieId/episodes/upload",
  authenticate,
  authorize("admin"),
  movieController.handleUploadEpisodeWithVideo
);

router.post(
  "/movies/:movieId/poster/upload",
  authenticate,
  authorize("admin"),
  movieController.handleUploadNewPosterImage
);

router.post("/upload/image", movieController.handleUploadImage);

router.post("/upload/video", movieController.handleUploadVideoFile);

module.exports = router;
