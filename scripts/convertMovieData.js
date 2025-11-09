/**
 * Data Mapping Conversion Script
 * Converts your data format to API expected format
 */

// Type mapping
const typeMap = {
  "phim bộ": "series",
  "phim lẻ": "single",
  "tv shows": "tv",
  "hoạt hình": "hoat-hinh",
};

// Status mapping
const statusMap = {
  "đang chiếu": "ongoing",
  "hoàn thành": "completed",
  "sắp chiếu": "ongoing",
};

/**
 * Convert your data format to API format
 * @param {Object} yourData - Your original data
 * @returns {Object} - Converted data for API
 */
function convertMovieData(yourData) {
  // Map type
  const normalizedType = yourData.type.toLowerCase().trim();
  const convertedType = typeMap[normalizedType] || yourData.type;

  // Map status
  const normalizedStatus = yourData.status.toLowerCase().trim();
  const convertedStatus = statusMap[normalizedStatus] || yourData.status;

  // Convert genres array of IDs to category array of objects
  // Note: This assumes you'll populate name and slug separately
  const category = (yourData.genres || []).map((genreId) => ({
    name: "", // You'll need to query this from Genre collection
    slug: "", // You'll need to query this from Genre collection
    _id: genreId, // Keep original ID for reference
  }));

  // Convert duration to time string
  const time = yourData.duration
    ? `${yourData.duration} min`
    : yourData.time || "";

  // Build converted object
  const convertedData = {
    // Keep as is
    name: yourData.name,
    origin_name: yourData.origin_name || "",
    slug: yourData.slug,
    description: yourData.description || yourData.content || "",
    year: yourData.year,
    quality: yourData.quality,
    lang: yourData.lang || "vi",

    // Field name changes
    poster_url: yourData.poster || yourData.poster_url || "",
    thumb_url: yourData.banner || yourData.thumb_url || "",
    time: time,

    // Array conversions
    director: yourData.director
      ? Array.isArray(yourData.director)
        ? yourData.director
        : yourData.director.split(",").map((d) => d.trim())
      : [],
    actor: yourData.cast || yourData.actor || [],
    category: category,
    country: yourData.country || [],

    // Type and status conversions
    type: convertedType,
    status: convertedStatus,

    // Additional fields
    content:
      yourData.description || yourData.content || "No description available",
  };

  return convertedData;
}

/**
 * Example usage
 */
const yourData = {
  name: "fwefwef",
  description: "fewfwe",
  poster:
    "https://res.cloudinary.com/dcmzsjorh/image/upload/v1762694371/movies/images/zijcnay7cef7ignf8753.png",
  banner:
    "https://res.cloudinary.com/dcmzsjorh/image/upload/v1762694378/movies/images/q8bunzv9111udhyb6wsu.png",
  year: 2025,
  country: "",
  duration: 120,
  director: "Anthony Russo, Joe Russo",
  genres: ["690f1bd732aa6ef77bac2bc3"],
  cast: [],
  trailer:
    "https://res.cloudinary.com/dcmzsjorh/video/upload/v1762694392/movies/videos/wsjbkuudvfljsxadm8xo.mp4",
  slug: "fwefwef",
  type: "phim lẻ",
  status: "Đang chiếu",
  quality: "720p",
};

// Convert
const convertedData = convertMovieData(yourData);

console.log("Original data:");
console.log(JSON.stringify(yourData, null, 2));
console.log("\n\nConverted data for API:");
console.log(JSON.stringify(convertedData, null, 2));

/**
 * Next step: Get genre names and slugs from database
 *
 * For each genre ID in genres array, query MongoDB:
 *
 * db.genres.findOne({_id: ObjectId("690f1bd732aa6ef77bac2bc3")})
 *
 * Then update category array with actual name and slug
 */

module.exports = { convertMovieData, typeMap, statusMap };
