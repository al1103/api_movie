const { Router } = require('express');
const movieController = require('../controllers/movieController');

const router = Router();

router.get('/movies/new', movieController.handleLatestMovies);
router.get('/movies/tmdb/:type/:id', movieController.handleMovieByTmdb);
router.get('/movies/:slug', movieController.handleMovieDetails);
router.get('/collections', movieController.handleCollections);
router.get('/search', movieController.handleSearch);
router.get('/genres', movieController.handleGenres);
router.get('/genres/:slug', movieController.handleGenreDetail);
router.get('/countries', movieController.handleCountries);
router.get('/countries/:slug', movieController.handleCountryDetail);
router.get('/years/:year', movieController.handleYearDetail);

module.exports = router;
