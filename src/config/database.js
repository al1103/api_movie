const mongoose = require('mongoose');
const config = require('./env');

async function connectToDatabase() {
  try {
    const connection = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    // eslint-disable-next-line no-console
    console.log(`Connected to MongoDB: ${connection.connection.name}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

module.exports = connectToDatabase;
