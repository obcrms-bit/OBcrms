const mongoose = require('mongoose');
const { initSocket } = require('./sockets/chatSocket');
const {
  startReminderScheduler,
  stopReminderSchedulers,
} = require('./services/followUpReminder.service');
const { loadEnv } = require('./src/config/loadEnv');
const { createApp } = require('./src/app/createApp');

const { NODE_ENV, PORT } = loadEnv();
const mongoTarget =
  process.env.MONGO_URI?.split('@')[1]?.split('/')[0] || 'unknown-host';
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};
const mongoRetryDelayMs = Math.max(
  Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 5000),
  1000
);

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const { app, allowedOrigins } = createApp({ nodeEnv: NODE_ENV });
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${NODE_ENV}]`);
  console.log(`Allowed web origins: ${allowedOrigins.join(', ')}`);
  console.log(`MongoDB target host: ${mongoTarget}`);
});

const io = initSocket(server);

let isShuttingDown = false;
const isMongoConfigured = Boolean(process.env.MONGO_URI);
let isMongoConnecting = false;
let mongoRetryHandle = null;
let reminderSchedulerStarted = false;
let stopReminderScheduler = () => {};

const ensureReminderScheduler = () => {
  if (reminderSchedulerStarted) {
    return;
  }

  stopReminderScheduler = startReminderScheduler();
  reminderSchedulerStarted = true;
};

const logMongoError = (err) => {
  console.error(`MongoDB connection error [${mongoTarget}]`);
  console.error('Name:', err.name);
  if (err.cause?.message) {
    console.error('Cause:', err.cause.message);
  }
  if (err.stack) {
    console.error(err.stack);
  }
  console.error('MongoDB connection error:', err.message);
};

const scheduleMongoReconnect = () => {
  if (isShuttingDown || mongoRetryHandle) {
    return;
  }

  console.warn(
    `Retrying MongoDB connection in ${mongoRetryDelayMs / 1000} seconds...`
  );
  mongoRetryHandle = setTimeout(() => {
    mongoRetryHandle = null;
    void connectMongo();
  }, mongoRetryDelayMs);
};

const connectMongo = async () => {
  if (!isMongoConfigured) {
    console.warn('MONGO_URI not set; skipping MongoDB connection (health will show warning).');
    return;
  }

  if (isShuttingDown || isMongoConnecting || mongoose.connection.readyState === 1) {
    return;
  }

  isMongoConnecting = true;

  try {
    await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log('MongoDB connected successfully');
    ensureReminderScheduler();
  } catch (err) {
    logMongoError(err);
    scheduleMongoReconnect();
  } finally {
    isMongoConnecting = false;
  }
};

mongoose.connection.on('connected', () => {
  ensureReminderScheduler();
});

mongoose.connection.on('disconnected', () => {
  if (isShuttingDown) {
    return;
  }

  console.warn('MongoDB disconnected.');
  scheduleMongoReconnect();
});

void connectMongo();

const shutdown = (signal) => {
  isShuttingDown = true;
  console.log(`\n${signal} received. Closing server gracefully...`);

  if (mongoRetryHandle) {
    clearTimeout(mongoRetryHandle);
    mongoRetryHandle = null;
  }

  io.close();
  stopReminderScheduler();
  stopReminderSchedulers();
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
