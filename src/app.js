const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// File upload middleware
const uploadDir = path.join(__dirname, "..", "uploads");
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: uploadDir,
    createParentPath: true,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", movieRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.isJoi) {
    return res
      .status(400)
      .json({ message: "Invalid request", details: error.details });
  }

  const statusCode = error.response?.status || 500;
  const message =
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred while processing the request.";

  res.status(statusCode).json({ message });
});

module.exports = app;
