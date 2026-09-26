import { ApiError } from '../utils/apiError.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not an instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    const errors = error.errors ? Object.values(error.errors).map((e) => e.message) : [];
    error = new ApiError(statusCode, message, errors, err.stack);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(409, message);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired');
  }

  const response = {
    success: false,
    message: error.message || 'An unexpected error occurred',
    errors: error.errors && error.errors.length > 0 ? error.errors : [error.message],
  };

  // Only include stack trace in development if needed for debugging, never in production
  if (process.env.NODE_ENV === 'development' && false) {
    response.stack = error.stack;
  }

  return res.status(error.statusCode || 500).json(response);
};

export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`);
  next(error);
};
