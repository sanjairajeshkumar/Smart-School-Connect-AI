const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const socketService = require('./services/socketService');
const seedInitialData = require('./utils/seedData');

let serverInstance = null;

const startServer = async (port = config.port) => {
  await connectDB();
  await seedInitialData();

  serverInstance = http.createServer(app);
  socketService.init(serverInstance);

  const targetPort = parseInt(port, 10) || 5000;

  return new Promise((resolve, reject) => {
    serverInstance.listen(targetPort, '0.0.0.0', () => {
      console.log(`\n=============================================================`);
      console.log(`🚀 Smart School Connect Multi-Tenant SaaS Running`);
      console.log(`📡 URL: http://localhost:${targetPort}`);
      console.log(`⚡ WebSocket Server Active (Socket.io)`);
      console.log(`🔒 Security: Strict Multi-Tenant RBAC & Email-Only Auth`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
      console.log(`=============================================================\n`);
      resolve(serverInstance);
    });

    serverInstance.on('error', (err) => {
      reject(err);
    });
  });
};

const stopServer = async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
  }
  await disconnectDB();
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer, stopServer, app };
