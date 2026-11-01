/**
 * Higher-Order Function to eliminate boilerplate try-catch blocks in async route controllers.
 * Forwards any unhandled Promise rejections directly to Express global error handling pipeline.
 *
 * @param {Function} fn - Async express route handler (req, res, next)
 * @returns {Function} Express middleware function
 */
export const catchAsync = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => next(err));
  };
};
