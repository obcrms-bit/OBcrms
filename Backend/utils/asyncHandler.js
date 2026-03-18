/**
 * Async Handler - Wraps async controllers and catches errors
 * Eliminates the need for try-catch blocks in every route handler
 */
const APIResponse = require('./APIResponse');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Request error:', error.message);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return APIResponse.badRequest(res, 'Validation error', messages);
    }

    if (error.name === 'CastError') {
      return APIResponse.badRequest(res, 'Invalid ID format');
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return APIResponse.conflict(res, `${field} already exists`, `Duplicate value for ${field}`);
    }

    // Default error handling
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: process.env.NODE_ENV === 'development' ? error.stack : null,
      timestamp: new Date().toISOString(),
    });
  });
};

module.exports = asyncHandler;
