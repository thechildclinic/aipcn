import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validation';
import { NotFoundError, ConflictError, DatabaseError } from '../services/BaseService';

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: any;
  stack?: string;
}

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id,
  });

  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR',
  };

  // Handle specific error types
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      success: false,
      message: error.message,
      error: 'VALIDATION_ERROR',
      details: error.details,
    };
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorResponse = {
      success: false,
      message: error.message,
      error: 'NOT_FOUND',
    };
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorResponse = {
      success: false,
      message: error.message,
      error: 'CONFLICT',
    };
  } else if (error instanceof DatabaseError) {
    statusCode = 500;
    errorResponse = {
      success: false,
      message: 'Database operation failed',
      error: 'DATABASE_ERROR',
    };
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    const details = (error as any).errors?.map((err: any) => ({
      field: err.path,
      message: err.message,
    })) || [];
    
    errorResponse = {
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details,
    };
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorResponse = {
      success: false,
      message: 'Resource already exists',
      error: 'DUPLICATE_RESOURCE',
    };
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    errorResponse = {
      success: false,
      message: 'Invalid reference to related resource',
      error: 'FOREIGN_KEY_CONSTRAINT',
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN',
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED',
    };
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    errorResponse = {
      success: false,
      message: 'Invalid JSON in request body',
      error: 'INVALID_JSON',
    };
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: 'ROUTE_NOT_FOUND',
  });
};

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request validation middleware
export const validateRequest = (schema: any, property: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details,
      });
      return;
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// CORS error handler
export const corsErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          error: 'REQUEST_TIMEOUT',
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Request size limit error handler
export const requestSizeLimitHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length'], 10);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: 'Request entity too large',
        error: 'REQUEST_TOO_LARGE',
        maxSize: `${maxSize / (1024 * 1024)}MB`,
      });
      return;
    }
  }

  next();
};
