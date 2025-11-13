const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");

/**
 * Tạo JWT token
 * @param {string} userId - ID của user
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * POST /auth/register
 * Đăng ký tài khoản mới
 */
const register = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: "user", // Default role
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error during registration",
      error: error.message,
    });
  }
};

/**
 * POST /auth/login
 * Đăng nhập
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

/**
 * GET /auth/profile
 * Lấy profile người dùng hiện tại
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving profile",
      error: error.message,
    });
  }
};

/**
 * PUT /auth/profile
 * Cập nhật profile người dùng
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, avatar, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          "profile.fullName": fullName,
          "profile.avatar": avatar,
          "profile.bio": bio,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

/**
 * POST /auth/logout
 * Đăng xuất (client-side sẽ xóa token)
 */
const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message,
    });
  }
};

/**
 * GET /auth/users (ADMIN ONLY)
 * Lấy danh sách tất cả người dùng
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message,
    });
  }
};

/**
 * PUT /auth/users/:userId/role (ADMIN ONLY)
 * Cập nhật role của người dùng
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["user", "admin", "moderator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message,
    });
  }
};

/**
 * PUT /auth/users/:userId/status (ADMIN ONLY)
 * Kích hoạt/vô hiệu hóa tài khoản
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User account ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: error.message,
    });
  }
};

/**
 * POST /auth/favorites/:movieSlug
 * Thêm phim vào danh sách yêu thích
 */
const addFavorite = async (req, res) => {
  try {
    const { movieSlug } = req.params;
    const userId = req.userId;

    // Check if movie exists
    const Movie = require("../models/Movie");
    const movie = await Movie.findOne({ slug: movieSlug });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Check if already in favorites
    const user = await User.findById(userId);
    const isFavorited = user.favorites.some(
      (fav) => fav.movieSlug === movieSlug
    );

    if (isFavorited) {
      return res.status(400).json({
        success: false,
        message: "Movie already in favorites",
      });
    }

    // Add to favorites
    user.favorites.push({
      movieId: movie._id,
      movieSlug: movieSlug,
      addedAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Movie added to favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error adding to favorites",
      error: error.message,
    });
  }
};

/**
 * DELETE /auth/favorites/:movieSlug
 * Xóa phim khỏi danh sách yêu thích
 */
const removeFavorite = async (req, res) => {
  try {
    const { movieSlug } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);

    // Check if in favorites
    const isFavorited = user.favorites.some(
      (fav) => fav.movieSlug === movieSlug
    );

    if (!isFavorited) {
      return res.status(400).json({
        success: false,
        message: "Movie not in favorites",
      });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(
      (fav) => fav.movieSlug !== movieSlug
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Movie removed from favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error removing from favorites",
      error: error.message,
    });
  }
};

/**
 * GET /auth/favorites
 * Lấy danh sách yêu thích của người dùng
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate("favorites.movieId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.favorites.length,
      favorites: user.favorites,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving favorites",
      error: error.message,
    });
  }
};

/**
 * GET /auth/favorites/:movieSlug
 * Kiểm tra phim có trong yêu thích không
 */
const checkFavorite = async (req, res) => {
  try {
    const { movieSlug } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    const isFavorited = user.favorites.some(
      (fav) => fav.movieSlug === movieSlug
    );

    return res.status(200).json({
      success: true,
      isFavorited,
      movieSlug,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking favorite status",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
};
