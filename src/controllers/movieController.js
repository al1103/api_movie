const Joi = require('joi');
const phimApiService = require('../services/phimApiService');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  sort_field: Joi.string(),
  sort_type: Joi.string().valid('asc', 'desc'),
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
    const { version = 'v1' } = req.query;

    const data = await phimApiService.getLatestMovies({ page, version });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleMovieDetails(req, res, next) {
  try {
    const { slug } = req.params;
    const data = await phimApiService.getMovieDetails(slug);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleMovieByTmdb(req, res, next) {
  try {
    const schema = Joi.object({
      type: Joi.string().valid('tv', 'movie').required(),
      id: Joi.alternatives(Joi.string(), Joi.number()).required(),
    });

    const { type, id } = await schema.validateAsync(req.params);
    const data = await phimApiService.getMovieByTmdb(type, id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleCollections(req, res, next) {
  try {
    const schema = paginationSchema.append({
      typeList: Joi.string()
        .valid(
          'phim-bo',
          'phim-le',
          'tv-shows',
          'hoat-hinh',
          'phim-vietsub',
          'phim-thuyet-minh',
          'phim-long-tieng'
        )
        .required(),
    });

    const { typeList, ...params } = await schema.validateAsync(
      { ...req.query, typeList: req.query.type_list || req.query.typeList },
      {
        convert: true,
        allowUnknown: true,
        stripUnknown: true,
      }
    );

    const data = await phimApiService.getCollection({ typeList, ...params });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleSearch(req, res, next) {
  try {
    const schema = paginationSchema.append({
      keyword: Joi.string().trim().min(1).required(),
    });

    const params = await schema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const data = await phimApiService.searchMovies(params);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleGenres(req, res, next) {
  try {
    const data = await phimApiService.getGenres();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleGenreDetail(req, res, next) {
  try {
    const { slug } = req.params;
    const params = await paginationSchema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const data = await phimApiService.getGenreDetail(slug, params);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleCountries(req, res, next) {
  try {
    const data = await phimApiService.getCountries();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleCountryDetail(req, res, next) {
  try {
    const { slug } = req.params;
    const params = await paginationSchema.validateAsync(req.query, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const data = await phimApiService.getCountryDetail(slug, params);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function handleYearDetail(req, res, next) {
  try {
    const { year } = req.params;
    const schema = paginationSchema.append({
      year: Joi.number().integer().min(1970).max(new Date().getFullYear()).required(),
    });

    const params = await schema.validateAsync({ ...req.query, year }, {
      convert: true,
      allowUnknown: true,
      stripUnknown: true,
    });

    const { year: validatedYear, ...filters } = params;
    const data = await phimApiService.getYearDetail(validatedYear, filters);
    res.json(data);
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
};
