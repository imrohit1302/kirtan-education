import { ApiError } from '../utils/apiError.js';

/**
 * Validation Middleware using Zod Schema.
 * Validates request body, query, and params.
 *
 * @param {object} schemas
 * @param {import('zod').ZodTypeAny} [schemas.body]
 * @param {import('zod').ZodTypeAny} [schemas.query]
 * @param {import('zod').ZodTypeAny} [schemas.params]
 */
export const validate = schemas => {
  return async (req, res, next) => {
    try {
      const validationTargets = ['body', 'query', 'params'];

      for (const target of validationTargets) {
        if (schemas[target]) {
          const result = await schemas[target].safeParseAsync(req[target]);

          if (!result.success) {
            const formattedErrors = result.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              target,
            }));

            return next(
              ApiError.badRequest(`Request ${target} validation failed`, formattedErrors)
            );
          }

          // Overwrite with sanitized and coerced data
          req[target] = result.data;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
