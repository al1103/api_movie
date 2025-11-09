const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Upload video lên Cloudinary
 * @param {string} filePath - Đường dẫn file local
 * @param {Object} options - Tuỳ chọn upload
 * @returns {Promise} - URL của video sau khi upload
 */
const uploadVideo = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'movies/videos',
      quality: 'auto',
      fetch_format: 'auto',
      timeout: 60000,
      ...options,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload thumbnail/poster lên Cloudinary
 * @param {string} filePath - Đường dẫn file local
 * @param {Object} options - Tuỳ chọn upload
 * @returns {Promise} - URL của image sau khi upload
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder: 'movies/images',
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Xóa file từ Cloudinary
 * @param {string} publicId - Public ID của file
 * @param {string} resourceType - Loại resource (video hoặc image)
 * @returns {Promise}
 */
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return {
      success: result.result === 'ok',
      message: result.result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  uploadVideo,
  uploadImage,
  deleteFile,
  cloudinary,
};
