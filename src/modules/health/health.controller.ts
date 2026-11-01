import { Request, Response } from 'express';
import { getDBStatus } from '../../config/db.config.js';
import { envConfig } from '../../config/env.config.js';
import { HTTP_STATUS } from '../../constants/httpStatusCodes.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const getHealthStatus = catchAsync(async (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  const dbStatus = getDBStatus();

  const healthData = {
    status: dbStatus.isHealthy ? 'healthy' : 'degraded',
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: envConfig.NODE_ENV,
    nodeVersion: process.version,
    database: {
      connection: dbStatus.state,
      isHealthy: dbStatus.isHealthy,
    },
    memory: {
      heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
    },
  };

  const statusCode = dbStatus.isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
  return ApiResponse.success(res, 'System health report', healthData, statusCode);
});
