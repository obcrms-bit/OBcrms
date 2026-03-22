const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];

function loadEnv() {
  const envCandidates = [
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(__dirname, '..', '..', '..', '.env'),
  ];

  let loadedEnvFile = null;

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      loadedEnvFile = envPath;
      break;
    }
  }

  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingEnv.join(', ')}`);
    if (loadedEnvFile) {
      console.error(`Loaded environment file: ${loadedEnvFile}`);
    } else {
      console.error('No .env file found in Backend/ or project root.');
    }
    console.error('For Render, set these values in the service dashboard under Environment.');
    process.exit(1);
  }

  return {
    loadedEnvFile,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
  };
}

module.exports = {
  loadEnv,
};
