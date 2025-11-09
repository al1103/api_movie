# 📖 README - API Movie Project

## 🎬 Project Overview

This is a **Movie API** with Express.js and MongoDB that provides:

- ✅ User authentication with JWT
- ✅ Movie management with episodes
- ✅ Dynamic type and genre validation
- ✅ Video/image upload to Cloudinary
- ✅ Role-based access control

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Setup Environment

Create `.env` file:

```env
MONGO_URI=mongodb://localhost:27017/movie
JWT_SECRET=your_secret_key
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
```

### 3. Seed Movie Types (One-time)

```bash
npm run seed:types
```

### 4. Start Server

```bash
npm run dev
```

---

## 📋 Key Features

### Authentication

- User registration with password hashing
- Login with JWT tokens
- Role-based authorization (admin, moderator, user)
- Token expiration (7 days)

### Movie Management

- Create movies with type validation (from DB)
- Add episodes to movies
- Upload videos to Cloudinary
- Upload images to Cloudinary
- Dynamic genre validation (from DB)

### Validation

- ✅ Type validation from MovieType collection
- ✅ Genre validation from Genre collection
- ✅ Dynamic error messages
- ✅ Graceful fallbacks

---

## 🎯 Current Issue Fixed

### Original Error

```json
{ "error": "\"type\" must be one of [series, single, tv, hoat-hinh]" }
```

### Root Cause

- Type was hardcoded enum in validation
- Genres were not validated

### Solution Implemented

- ✅ Type validation from MovieType database
- ✅ Genre validation from Genre database
- ✅ Dynamic error messages
- ✅ Fully scalable

---

## 📊 API Endpoints

### Public Endpoints

```
GET  /api/genres              - Get all genres
GET  /api/genres/:slug        - Get genre by slug
GET  /api/movies              - Get latest movies
GET  /api/movies/:slug        - Get movie details
GET  /api/countries           - Get countries
```

### Authentication

```
POST /api/auth/register       - Register new user
POST /api/auth/login          - Login user
POST /api/auth/logout         - Logout user
GET  /api/auth/profile        - Get user profile
```

### Protected (Admin Only)

```
POST /api/movies/upload       - Create movie
POST /api/movies/upload-video - Create movie with video
POST /api/movies/:slug/episodes - Add episode
POST /api/upload/image        - Upload image
POST /api/upload/video        - Upload video
```

---

## 🗂️ Project Structure

```
api_movie/
├── src/
│   ├── models/
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Genre.js
│   │   ├── Country.js
│   │   ├── MovieType.js         ← ✅ New
│   │   └── Collection.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── movieController.js   ← ✅ Updated
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── movieRoutes.js
│   ├── utils/
│   │   ├── cache.js
│   │   └── cloudinary.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── app.js
│   └── server.js
├── scripts/
│   ├── seedDatabase.js
│   ├── seedMovieTypes.js        ← ✅ New
│   ├── seedSampleData.js
│   └── convertMovieData.js      ← ✅ New
├── uploads/                     ← Temp file storage
└── package.json                 ← ✅ Updated
```

---

## 🔧 Type & Genre Validation

### Movie Types (4 Available)

```
- series    (Phim Bộ)
- single    (Phim Lẻ)
- tv        (TV Shows)
- hoat-hinh (Hoạt Hình)
```

### Valid Genres (From Database)

```
- hanh-dong (Hành động)
- hai-huoc  (Hài hước)
- drama     (Drama)
- tinh-cam  (Tình cảm)
- hoat-hinh (Hoạt Hình)
- ... and many more
```

---

## 📝 Example Requests

### Create Movie

```bash
curl -X POST http://localhost:3000/api/movies/upload \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Avengers",
    "slug": "avengers",
    "type": "series",
    "year": 2024,
    "category": [
      {"name": "Action", "slug": "action"}
    ],
    "director": ["Director Name"],
    "actor": ["Actor Name"]
  }'
```

### Response

```json
{
  "success": true,
  "message": "Movie uploaded successfully",
  "movie": {
    "_id": "...",
    "name": "Avengers",
    "type": "series",
    "category": [{ "name": "Action", "slug": "action" }]
  }
}
```

---

## 📚 Documentation

### Quick Start

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 2-minute overview
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Complete documentation index

### Setup & Configuration

- **[MOVIE_TYPES_FROM_DB.md](MOVIE_TYPES_FROM_DB.md)** - How to seed types
- **[USE_GENRES_DATA.md](USE_GENRES_DATA.md)** - How to use genres
- **[CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md)** - Cloudinary configuration

### Testing & Validation

- **[TEST_MOVIE_TYPES.md](TEST_MOVIE_TYPES.md)** - Test guide
- **[GENRES_AND_TYPES_VALIDATION.md](GENRES_AND_TYPES_VALIDATION.md)** - Validation guide
- **[POSTMAN_TYPES_GENRES_TEST.json](POSTMAN_TYPES_GENRES_TEST.json)** - Postman collection

### Data Mapping

- **[DATA_MAPPING_GUIDE.md](DATA_MAPPING_GUIDE.md)** - How to map your data
- **[TYPE_FORMAT_REFERENCE.md](TYPE_FORMAT_REFERENCE.md)** - Type format reference

### Architecture

- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - System architecture
- **[SYSTEM_WORKFLOW.md](SYSTEM_WORKFLOW.md)** - Complete workflow

### Enhancements

- **[NEXT_STEPS_ACTION_REQUIRED.md](NEXT_STEPS_ACTION_REQUIRED.md)** - Next enhancement steps
- **[AUTO_DERIVE_TYPE_FROM_GENRE.md](AUTO_DERIVE_TYPE_FROM_GENRE.md)** - Auto-derive type feature

---

## ⚙️ Configuration

### Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/movie

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=development
```

---

## 🧪 Testing

### Using Postman

1. Import: `POSTMAN_TYPES_GENRES_TEST.json`
2. Set environment variable: `{{token}}`
3. Run tests in sequence

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Create movie
curl -X POST http://localhost:3000/api/movies/upload \
  -H "Authorization: Bearer TOKEN" \
  -d '{...}'
```

---

## ✅ Data Validation

### Type Field

- ✅ Must be one of: `series`, `single`, `tv`, `hoat-hinh`
- ✅ Validated against MovieType collection
- ✅ Error if invalid: `"type" must be one of [...]`

### Category/Genres Field

- ✅ Array of objects with `name` and `slug`
- ✅ Genre slug validated against Genre collection
- ✅ Error if invalid: `"category[].slug" must be one of [...]`

### Slug Field

- ✅ Must be unique (no duplicates)
- ✅ URL-friendly format (no spaces)
- ✅ Error if duplicate: `Slug already exists`

---

## 🚀 Deployment

### Prerequisites

- ✅ Node.js 18+
- ✅ MongoDB running
- ✅ Cloudinary account configured
- ✅ Environment variables set

### Steps

1. Install dependencies: `npm install`
2. Seed types: `npm run seed:types`
3. Start server: `npm run dev` (development) or `npm start` (production)
4. Verify: `curl http://localhost:3000/api/genres`

---

## 📞 Support

### Common Issues

**"type" must be one of [...]**
→ Read: [TYPE_FORMAT_REFERENCE.md](TYPE_FORMAT_REFERENCE.md)

**Genre validation error**
→ Read: [DATA_MAPPING_GUIDE.md](DATA_MAPPING_GUIDE.md)

**How does it work?**
→ Read: [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)

**Want to enhance?**
→ Read: [NEXT_STEPS_ACTION_REQUIRED.md](NEXT_STEPS_ACTION_REQUIRED.md)

---

## 🎯 Next Steps

1. ✅ Review this README
2. ✅ Read QUICK_REFERENCE.md
3. ✅ Seed movie types
4. ✅ Test with Postman
5. 🔄 Implement enhancement (optional)

---

## 📊 Session Status

```
✅ Original Error:     FIXED
✅ Dynamic Types:      IMPLEMENTED
✅ Dynamic Genres:     IMPLEMENTED
✅ Documentation:      COMPLETE
✅ Testing:            COMPLETE
✅ Enhancement:        READY
```

---

## 📖 Additional Resources

- **[SESSION_SUMMARY.md](SESSION_SUMMARY.md)** - What was accomplished
- **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** - Project completion status
- **[MASTER_GUIDE.md](MASTER_GUIDE.md)** - Complete system overview

---

**Version:** 2.0
**Last Updated:** Nov 9, 2025
**Status:** ✅ Production Ready

---

🎉 **Welcome to the Movie API! Ready to get started?**

Start with: **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
