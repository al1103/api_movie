const app = require('./app');
const connectToDatabase = require('./config/database');
const config = require('./config/env');

(async () => {
  try {
    await connectToDatabase();
    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
})();
