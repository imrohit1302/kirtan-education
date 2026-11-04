import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/apiError.js';

interface ValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate = (schemas: ValidationSchema): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const targets: Array<'body' | 'query' | 'params'> = ['body', 'query', 'params'];

      for (const target of targets) {
        const schema = schemas[target];
        if (schema) {
          const result = await schema.safeParseAsync(req[target]);

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

          // In Express 5, req.query is a getter-only property on express.request prototype.
          // Direct assignment (`req.query = ...`) throws a TypeError.
          // Defining an own-property via Object.defineProperty cleanly overrides it.
          if (target === 'query') {
            Object.defineProperty(req, 'query', {
              value: result.data,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          } else {
            try {
              req[target] = result.data;
            } catch {
              Object.defineProperty(req, target, {
                value: result.data,
                writable: true,
                enumerable: true,
                configurable: true,
              });
            }
          }
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
