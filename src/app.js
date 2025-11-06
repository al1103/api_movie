const express = require('express');
const cors = require('cors');
const movieRoutes = require('./routes/movieRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', movieRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.isJoi) {
    return res.status(400).json({ message: 'Invalid request', details: error.details });
  }

  const statusCode = error.response?.status || 500;
  const message =
    error.response?.data?.message ||
    error.message ||
    'An unexpected error occurred while processing the request.';

  res.status(statusCode).json({ message });
});

module.exports = app;
