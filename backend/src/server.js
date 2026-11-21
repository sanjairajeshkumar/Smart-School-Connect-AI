const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const seedInitialData = require('./utils/seedData');

const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(config.port, () => {
      console.log(`Smart School Connect API running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
