/**
 * Standard Response Formatter for all API endpoints
 * Provides consistent response structure across the application
 */

class APIResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code (200, 201, etc.)
   * @param {String} message - Human-readable message
   * @param {Object} data - Response data
   */
  static success(res, statusCode, message, data = null) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code (400, 404, 500, etc.)
   * @param {String} message - Error message
   * @param {Object} error - Error details
   */
  static error(res, statusCode, message, error = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: error ? (typeof error === 'string' ? { detail: error } : error) : null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Paginated response
   * @param {Object} res - Express response object
   * @param {String} message - Message
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination info { page, limit, total, pages }
   */
  static paginated(res, message, items, pagination) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message,
      data: {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          pages: pagination.pages,
          hasNextPage: pagination.page < pagination.pages,
          hasPrevPage: pagination.page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Created response (201)
   */
  static created(res, message, data) {
    return this.success(res, 201, message, data);
  }

  /**
   * Bad request response (400)
   */
  static badRequest(res, message, error = null) {
    return this.error(res, 400, message, error);
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, 401, message);
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, 403, message);
  }

  /**
   * Not found response (404)
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, 404, message);
  }

  /**
   * Conflict response (409)
   */
  static conflict(res, message, error = null) {
    return this.error(res, 409, message, error);
  }

  /**
   * Server error response (500)
   */
  static serverError(res, message = 'Internal server error', error = null) {
    return this.error(res, 500, message, error);
  }
}

module.exports = APIResponse;
