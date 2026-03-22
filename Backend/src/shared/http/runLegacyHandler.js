const { createHttpError } = require('./createHttpError');

async function runLegacyHandler(handler, req, res, next) {
  if (typeof handler !== 'function') {
    throw createHttpError(500, 'Legacy handler is not available');
  }

  return Promise.resolve(handler(req, res, next));
}

module.exports = {
  runLegacyHandler,
};
