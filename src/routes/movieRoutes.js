const { Router } = require("express");
const movieController = require("../controllers/movieController");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

// Public routes
router.get("/movies/new", movieController.handleLatestMovies);
router.get("/movies/tmdb/:type/:id", movieController.handleMovieByTmdb);
router.get("/movies/:slug", movieController.handleMovieDetails);
router.get("/collections", movieController.handleCollections);
router.get("/search", movieController.handleSearch);
router.get("/genres", movieController.handleGenres);
router.get("/genres/:slug", movieController.handleGenreDetail);
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
  "/movies/:slug",
  authenticate,
  authorize("admin"),
  movieController.handleUpdateMovie
);

router.delete(
  "/movies/:slug",
  authenticate,
  authorize("admin"),
  movieController.handleDeleteMovie
);

router.post(
  "/movies/:movieSlug/episodes",
  authenticate,
  authorize("admin"),
  movieController.handleUploadEpisode
);

router.post(
  "/movies/:movieSlug/episodes/batch",
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
  "/movies/:movieSlug/episodes/upload",
  authenticate,
  authorize("admin"),
  movieController.handleUploadEpisodeWithVideo
);

router.post(
  "/movies/:movieSlug/poster/upload",
  authenticate,
  authorize("admin"),
  movieController.handleUploadNewPosterImage
);

// Public upload routes (Simple upload - no auth required for images/videos)
router.post("/upload/image", movieController.handleUploadImage);

router.post("/upload/video", movieController.handleUploadVideoFile);

module.exports = router;
