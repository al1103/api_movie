# KKPhim API Proxy Backend

Backend service built with **Node.js**, **Express**, and **MongoDB** that proxies the public [phimapi.com](https://phimapi.com) endpoints used by KKPhim. Responses are cached in MongoDB to reduce repeated calls and provide a stable contract for client applications.

## Features

- Unified REST API that mirrors the publicly documented KKPhim endpoints.
- MongoDB-backed caching layer to minimize repeated remote calls.
- Input validation via Joi to guarantee well-structured queries.
- Health-check endpoint for deployment observability.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or hosted)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file based on the provided template:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port where the Express server runs | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/api_movie` |
| `PHIM_API_BASE_URL` | Base URL for the upstream API | `https://phimapi.com` |
| `CACHE_TTL_MINUTES` | Cache expiration in minutes | `60` |

### Running the server

```bash
npm run start
```

For local development with auto-reload:

```bash
npm run dev
```

### Available Endpoints

All endpoints are prefixed with `/api`.

| Endpoint | Description |
| --- | --- |
| `GET /api/movies/new` | Latest movies (`version` query parameter supports `v1`, `v2`, `v3`) |
| `GET /api/movies/:slug` | Movie details including episodes |
| `GET /api/movies/tmdb/:type/:id` | Movie or TV details fetched by TMDB ID |
| `GET /api/collections` | Aggregated lists filtered by type, page, sort options, etc. |
| `GET /api/search` | Search movies by keyword and optional filters |
| `GET /api/genres` | List of available genres |
| `GET /api/genres/:slug` | Movies for a specific genre |
| `GET /api/countries` | List of countries |
| `GET /api/countries/:slug` | Movies filtered by country |
| `GET /api/years/:year` | Movies released in a specific year |
| `GET /health` | Service health check |

Each endpoint forwards the corresponding request to `phimapi.com`, caches the response, and returns the results to the caller. Query parameters follow the upstream API specification.

### Error Handling

Validation errors return **400 Bad Request** with details. Upstream failures propagate the original status code whenever possible with a message describing the issue.

### Testing

No automated tests are included yet. You can manually verify responses using `curl` or API clients such as Postman.
