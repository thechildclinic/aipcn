import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { UserRole } from '../models/User';
import { ValidationError } from '../utils/validation';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isActive: boolean;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const user = await userService.verifyToken(token);
      
      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
          error: 'INVALID_TOKEN',
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: 'AUTHENTICATION_ERROR',
    });
  }
};

// Authorization middleware factory
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

// Resource ownership middleware (for patients accessing their own data)
export const authorizeOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    // Admins can access any resource
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // For patients, check if they're accessing their own data
    if (req.user.role === UserRole.PATIENT) {
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (resourceUserId && resourceUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Can only access your own data',
          error: 'OWNERSHIP_REQUIRED',
        });
        return;
      }
    }

    next();
  };
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const user = await userService.verifyToken(token);
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        };
      } catch (error) {
        // Ignore authentication errors for optional auth
        console.warn('Optional authentication failed:', error);
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication
  }
};

// Rate limiting by user
export const rateLimitByUser = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();

    const userRecord = userRequestCounts.get(userId);

    if (!userRecord || now > userRecord.resetTime) {
      // Reset or create new record
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }
    
    if (userRecord.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000),
      });
      return;
    }
    
    userRecord.count++;
    next();
  };
};

// Admin-only middleware
export const adminOnly = authorize(UserRole.ADMIN);

// Healthcare staff middleware (doctors, pharmacy staff, lab staff)
export const healthcareStaffOnly = authorize(
  UserRole.DOCTOR, 
  UserRole.PHARMACY_STAFF, 
  UserRole.LAB_STAFF, 
  UserRole.ADMIN
);

// Patient or admin middleware
export const patientOrAdmin = authorize(UserRole.PATIENT, UserRole.ADMIN);

// Provider staff middleware (pharmacy and lab staff)
export const providerStaffOnly = authorize(
  UserRole.PHARMACY_STAFF, 
  UserRole.LAB_STAFF, 
  UserRole.ADMIN
);

// Middleware to check if user account is active
export const requireActiveAccount = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED',
    });
    return;
  }

  if (!req.user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Account is deactivated',
      error: 'ACCOUNT_DEACTIVATED',
    });
    return;
  }

  next();
};

// Middleware to log user actions for audit trail
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      console.log(`[AUDIT] User ${req.user.id} (${req.user.role}) performed action: ${action}`, {
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        userRole: req.user.role,
        action,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: `${req.method} ${req.path}`,
      });
    }
    next();
  };
};
