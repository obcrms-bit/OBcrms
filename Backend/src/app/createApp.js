const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { buildOriginList, isOriginAllowed } = require('../../utils/origins');
const { registerRoutes } = require('./registerRoutes');

function createApp({ nodeEnv = process.env.NODE_ENV || 'development' } = {}) {
  const app = express();
  const isProduction = nodeEnv === 'production';
  const allowedOrigins = buildOriginList();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (isOriginAllowed(origin, allowedOrigins)) {
          return callback(null, true);
        }

        if (!isProduction) {
          return callback(null, true);
        }

        return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Trust Education CRM API Running',
      environment: nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const isMongoConnected = mongoose.connection.readyState === 1;

    res.status(isMongoConnected ? 200 : 503).json({
      status: isMongoConnected ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      mongo: isMongoConnected ? 'connected' : 'disconnected',
    });
  });

  registerRoutes(app);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
      error: isProduction ? undefined : err.stack,
    });
  });

  return {
    app,
    allowedOrigins,
  };
}

module.exports = {
  createApp,
};
