const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Database Configuration (MongoDB)
  mongodbUri: process.env.MONGODB_URI,
  
  // JWT Secret
  jwtSecret: process.env.JWT_SECRET || 'supersecret_school_connect_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Transactional Email / SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"Smart School Connect" <noreply@schoolconnect.io>',
  },
  
  // Resend / SendGrid optional API Keys
  resendApiKey: process.env.RESEND_API_KEY,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  
  // AI Provider Keys
  groqApiKey: process.env.GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'groq',
};
