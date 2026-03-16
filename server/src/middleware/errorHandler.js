// =============================================
// Global Error Handler Middleware
// =============================================
// WHY: Express requires a special 4-argument middleware for errors.
// When any route calls next(error) or throws, Express skips all
// remaining middleware and jumps directly to this error handler.
//
// This centralizes error responses so you don't need try/catch
// in every single controller — just throw or next(error).
// =============================================

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  // Determine status code — default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Custom error class with status code
 * Usage: throw new AppError('Not found', 404);
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Async handler wrapper — catches errors and passes to error handler
 * Use this to wrap async controller functions so you don't need try/catch
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => {
 *     const { rows } = await query('SELECT * FROM users');
 *     res.json(rows);
 *   }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
