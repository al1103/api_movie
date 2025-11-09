# ⚡ Quick Reference - Dynamic Validation

## 📌 The Problem You Had

```json
{ "error": "\"type\" must be one of [series, single, tv, hoat-hinh]" }
```

## ✅ The Solution

### 1. Types Now Dynamic ✨

```javascript
// Before: Hardcoded
type: Joi.string().valid("series", "single", "tv", "hoat-hinh");

// After: From Database
const types = await MovieType.find();
type: Joi.string().valid(...types.map((t) => t.slug));
```

### 2. Genres Now Validated ✨

```javascript
// Before: No validation
category: Joi.array().items(Joi.object({ slug: Joi.string() }));

// After: From Database
const genres = await Genre.find();
category: Joi.array().items(
  Joi.object({ slug: Joi.string().valid(...genres.map((g) => g.slug)) })
);
```

---

## 🚀 Quick Setup

```bash
# 1. Seed types (one-time)
npm run seed:types

# 2. Start server
npm run dev

# 3. Ready!
```

---

## 📝 API Usage

```bash
# Login
POST /api/auth/login
{"email":"admin@example.com","password":"admin123"}

# Create movie with valid type + genres
POST /api/movies/upload
Authorization: Bearer TOKEN

{
  "name": "My Movie",
  "slug": "my-movie",
  "type": "series",                    # ✅ From MovieType DB
  "category": [
    {"name":"Action","slug":"action"}  # ✅ From Genre DB
  ]
}
```

---

## ❌ Common Errors & Fix

### Error: Invalid Type

```json
{ "error": "\"type\" must be one of [series, single, tv, hoat-hinh]" }
```

**Fix:** Check `/api/movietypes` for valid types

### Error: Invalid Genre

```json
{ "error": "\"category[0].slug\" must be one of [...]" }
```

**Fix:** Check `/api/genres` for valid genres

---

## 🔍 Verify Setup

```bash
# Check types were seeded
mongosh mongodb://localhost:27017/movie
db.movietypes.find()
# Should show: series, single, tv, hoat-hinh

# Check genres exist
db.genres.find()
# Should show: action, comedy, drama, etc.
```

---

## 📊 Files Changed

```
✅ MovieType.js         - Created
✅ seedMovieTypes.js    - Created
✅ movieController.js   - Updated (2 functions)
✅ package.json         - Added seed:types
```

---

## 🧪 Test It

### Valid Request

```bash
curl -X POST http://localhost:3000/api/movies/upload \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test","type":"series","category":[{"slug":"action"}]}'
# ✅ Success
```

### Invalid Request

```bash
curl -X POST http://localhost:3000/api/movies/upload \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test","type":"fake-type","category":[{"slug":"fake"}]}'
# ❌ Error: must be one of [...]
```

---

## 💾 Database Pattern

### Add New Type

```javascript
db.movietypes.insertOne({
  name: "New Type",
  slug: "new-type",
});
```

✅ Automatically available in API validation

### Add New Genre

```javascript
db.genres.insertOne({
  name: "New Genre",
  slug: "new-genre",
});
```

✅ Automatically available in API validation

---

## 📚 Full Documentation

- 📖 [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
- 📖 [GENRES_AND_TYPES_VALIDATION.md](GENRES_AND_TYPES_VALIDATION.md)
- 📖 [FIX_SUMMARY.md](FIX_SUMMARY.md)

---

**TL;DR:**

1. ✅ Seeded types
2. ✅ Added genre validation
3. ✅ Both now dynamic from database
4. ✅ Ready to use!
