const axios = require('axios');
const config = require('../config/env');
const { getCachedPayload, setCachedPayload } = require('../utils/cache');

const client = axios.create({
  baseURL: config.phimApiBaseUrl,
  timeout: 15000,
});

function buildQueryParams(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function fetchWithCache(path, queryParams, cacheKeyPrefix) {
  const queryString = buildQueryParams(queryParams);
  const url = `${path}${queryString}`;
  const cacheKey = `${cacheKeyPrefix || path}${queryString}`;

  const cached = await getCachedPayload(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await client.get(url);
  await setCachedPayload(cacheKey, data);
  return data;
}

async function getLatestMovies({ page = 1, version = 'v1' }) {
  let path = '/danh-sach/phim-moi-cap-nhat';
  if (version === 'v2') {
    path += '-v2';
  }
  if (version === 'v3') {
    path += '-v3';
  }
  return fetchWithCache(path, { page }, `latest:${version}`);
}

async function getMovieDetails(slug) {
  return fetchWithCache(`/phim/${slug}`, {}, `movie:${slug}`);
}

async function getMovieByTmdb(type, id) {
  return fetchWithCache(`/tmdb/${type}/${id}`, {}, `tmdb:${type}:${id}`);
}

async function getCollection({ typeList, ...params }) {
  return fetchWithCache(`/v1/api/danh-sach/${typeList}`, params, `collection:${typeList}`);
}

async function searchMovies(params) {
  return fetchWithCache('/v1/api/tim-kiem', params, 'search');
}

async function getGenres() {
  return fetchWithCache('/the-loai', {}, 'genres');
}

async function getGenreDetail(slug, params) {
  return fetchWithCache(`/v1/api/the-loai/${slug}`, params, `genre:${slug}`);
}

async function getCountries() {
  return fetchWithCache('/quoc-gia', {}, 'countries');
}

async function getCountryDetail(slug, params) {
  return fetchWithCache(`/v1/api/quoc-gia/${slug}`, params, `country:${slug}`);
}

async function getYearDetail(year, params) {
  return fetchWithCache(`/v1/api/nam/${year}`, params, `year:${year}`);
}

module.exports = {
  getLatestMovies,
  getMovieDetails,
  getMovieByTmdb,
  getCollection,
  searchMovies,
  getGenres,
  getGenreDetail,
  getCountries,
  getCountryDetail,
  getYearDetail,
};
