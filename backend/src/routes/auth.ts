import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { 
  authenticate, 
  adminOnly, 
  requireActiveAccount,
  rateLimitByUser,
  auditLog 
} from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';
import { userSchemas } from '../utils/validation';
import Joi from 'joi';

const router = Router();
const authController = new AuthController();

// Validation schemas for auth routes
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const userStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const searchQuerySchema = Joi.object({
  query: Joi.string().min(1).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Public routes (no authentication required)
router.post('/register', 
  rateLimitByUser(5, 15 * 60 * 1000), // 5 registrations per 15 minutes
  validateRequest(userSchemas.create),
  auditLog('USER_REGISTER'),
  authController.register
);

router.post('/login', 
  rateLimitByUser(10, 15 * 60 * 1000), // 10 login attempts per 15 minutes
  validateRequest(userSchemas.login),
  auditLog('USER_LOGIN'),
  authController.login
);

router.post('/refresh-token', 
  rateLimitByUser(20, 15 * 60 * 1000), // 20 refresh attempts per 15 minutes
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes (authentication required)
router.use(authenticate);
router.use(requireActiveAccount);

router.get('/profile', 
  auditLog('GET_PROFILE'),
  authController.getProfile
);

router.put('/profile', 
  validateRequest(userSchemas.update),
  auditLog('UPDATE_PROFILE'),
  authController.updateProfile
);

router.post('/change-password', 
  validateRequest(userSchemas.changePassword),
  auditLog('CHANGE_PASSWORD'),
  authController.changePassword
);

router.post('/logout', 
  auditLog('USER_LOGOUT'),
  authController.logout
);

router.get('/verify-token', 
  authController.verifyToken
);

// Admin-only routes
router.get('/statistics', 
  adminOnly,
  auditLog('GET_USER_STATISTICS'),
  authController.getUserStatistics
);

router.get('/search', 
  adminOnly,
  validateRequest(searchQuerySchema, 'query'),
  auditLog('SEARCH_USERS'),
  authController.searchUsers
);

router.put('/users/:userId/status', 
  adminOnly,
  validateRequest(userStatusSchema),
  auditLog('SET_USER_STATUS'),
  authController.setUserStatus
);

router.get('/users/role/:role', 
  adminOnly,
  auditLog('GET_USERS_BY_ROLE'),
  authController.getUsersByRole
);

export default router;
