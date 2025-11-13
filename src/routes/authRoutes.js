const { Router } = require("express");
const authController = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes (require authentication)
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);

// Favorites routes (require authentication)
router.post("/favorites/:movieSlug", authenticate, authController.addFavorite);
router.delete(
  "/favorites/:movieSlug",
  authenticate,
  authController.removeFavorite
);
router.get("/favorites", authenticate, authController.getFavorites);
router.get("/favorites/:movieSlug", authenticate, authController.checkFavorite);

// Admin only routes
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  authController.getAllUsers
);
router.put(
  "/users/:userId/role",
  authenticate,
  authorize("admin"),
  authController.updateUserRole
);
router.put(
  "/users/:userId/status",
  authenticate,
  authorize("admin"),
  authController.toggleUserStatus
);

module.exports = router;
