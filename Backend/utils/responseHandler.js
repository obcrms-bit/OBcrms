// Standardized response handler for all API endpoints
const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };
  if (data) response.data = data;
  res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message, errorDetails = null) => {
  const response = {
    success: false,
    message,
  };
  if (errorDetails) response.error = errorDetails;
  res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
