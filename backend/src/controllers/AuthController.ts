import { Request, Response } from 'express';
import { userService, patientService } from '../services';
import { UserRole } from '../models/User';
import { validateSchema, userSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData = validateSchema(userSchemas.create, req.body);
    
    // Create user
    const user = await userService.create(userData);
    
    // If user is a patient, create patient profile
    if (user.role === UserRole.PATIENT) {
      await patientService.create({
        userId: user.id,
        preferredLanguage: 'en',
      });
    }
    
    // Generate tokens
    const tokens = await userService.login({
      email: user.email,
      password: req.body.password, // Use original password before hashing
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: tokens.user,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      },
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const credentials = validateSchema(userSchemas.login, req.body);
    
    const result = await userService.login(credentials);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'MISSING_REFRESH_TOKEN',
      });
      return;
    }
    
    const tokens = await userService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }
    
    const user = await userService.getUserProfile(req.user.id);
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  });

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }
    
    const updateData = validateSchema(userSchemas.update, req.body);
    
    const user = await userService.update(req.user.id, updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  });

  /**
   * Change password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }
    
    const passwordData = validateSchema(userSchemas.changePassword, req.body);
    
    await userService.changePassword(req.user.id, passwordData);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Logout user (client-side token invalidation)
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a more sophisticated implementation, you might maintain a blacklist of tokens
    // For now, we'll just return success and let the client handle token removal
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Verify token (for client-side token validation)
   */
  verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          isActive: req.user.isActive,
        },
      },
    });
  });

  /**
   * Get user statistics (admin only)
   */
  getUserStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const statistics = await userService.getUserStatistics();
    
    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: { statistics },
    });
  });

  /**
   * Search users (admin only)
   */
  searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: 'MISSING_QUERY',
      });
      return;
    }
    
    const users = await userService.searchUsers(query);
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: paginatedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: users.length,
          totalPages: Math.ceil(users.length / Number(limit)),
        },
      },
    });
  });

  /**
   * Activate/deactivate user (admin only)
   */
  setUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
        error: 'INVALID_STATUS',
      });
      return;
    }
    
    const user = await userService.setUserStatus(userId, isActive);
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user },
    });
  });

  /**
   * Get users by role (admin only)
   */
  getUsersByRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user role',
        error: 'INVALID_ROLE',
        validRoles: Object.values(UserRole),
      });
      return;
    }
    
    const result = await userService.findWithPagination(
      Number(page),
      Number(limit),
      { where: { role, isActive: true } }
    );
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: result.records,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  });
}
