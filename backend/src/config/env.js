const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'supersecret_school_connect_jwt_key_2026',
  nodeEnv: process.env.NODE_ENV || 'development',
  groqApiKey: process.env.GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'groq',
};
