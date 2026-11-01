import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const headerId = req.headers['x-request-id'];
  const requestId =
    typeof headerId === 'string' && headerId.trim().length > 0 ? headerId : crypto.randomUUID();

  req.id = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};

