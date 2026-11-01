import crypto from 'node:crypto';

/**
 * Assigns a unique Correlation ID (X-Request-Id) to each request.
 * Useful for tracing requests through logs and distributed systems.
 */
export const requestIdMiddleware = (req, res, next) => {
  const headerId = req.headers['x-request-id'];
  const requestId =
    typeof headerId === 'string' && headerId.trim().length > 0 ? headerId : crypto.randomUUID();

  req.id = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};
