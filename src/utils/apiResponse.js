import { HTTP_STATUS } from '../constants/httpStatusCodes.js';

/**
 * Standardized API Response Envelope
 * Guarantees uniform contract across all microservices/endpoints:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "Success",
 *   data: { ... },
 *   meta: { timestamp, requestId, ... }
 * }
 */
export class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {any} data
   * @param {object|null} meta
   */
  constructor(statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = {
      timestamp: new Date().toISOString(),
      ...(meta || {}),
    };
  }

  /**
   * Helper to send JSON response directly
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      meta: {
        timestamp: this.meta.timestamp,
        ...(res.locals?.requestId ? { requestId: res.locals.requestId } : {}),
        ...this.meta,
      },
    });
  }

  static success(res, message = 'Success', data = null, statusCode = HTTP_STATUS.OK, meta = null) {
    return new ApiResponse(statusCode, message, data, meta).send(res);
  }

  static created(res, message = 'Resource created successfully', data = null, meta = null) {
    return new ApiResponse(HTTP_STATUS.CREATED, message, data, meta).send(res);
  }

  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
}
