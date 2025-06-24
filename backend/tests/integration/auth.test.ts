import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth';
import { errorHandler } from '../../src/middleware/errorHandler';
import { UserRole } from '../../src/models/User';
import { 
  createMockUser,
  mockJWT,
  mockBcrypt,
  setupTestDatabase,
  cleanupTestDatabase 
} from '../setup';

// Mock the services
jest.mock('../../src/services');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Auth API Integration Tests', () => {
  let app: express.Application;
  let mockUserService: any;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Setup Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup bcrypt and jwt mocks
    bcrypt.hash = mockBcrypt.hash;
    bcrypt.compare = mockBcrypt.compare;
    jwt.sign = mockJWT.sign;
    jwt.verify = mockJWT.verify;
    
    // Mock userService
    const { userService } = require('../../src/services');
    mockUserService = userService;
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.PATIENT,
    };

    it('should register a new user successfully', async () => {
      const mockUser = createMockUser(validRegistrationData);
      mockUserService.create.mockResolvedValue(mockUser);
      mockUserService.login.mockResolvedValue({
        user: mockUser,
        token: 'mock.jwt.token',
        refreshToken: 'mock.refresh.token',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'User registered successfully',
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
          token: 'mock.jwt.token',
          refreshToken: 'mock.refresh.token',
        },
      });

      expect(mockUserService.create).toHaveBeenCalledWith(validRegistrationData);
    });

    it('should return validation error for invalid email', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
          }),
        ]),
      });
    });

    it('should return validation error for weak password', async () => {
      const invalidData = { ...validRegistrationData, password: '123' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
          }),
        ]),
      });
    });

    it('should return conflict error for duplicate email', async () => {
      const conflictError = new Error('Email already exists');
      conflictError.name = 'ConflictError';
      mockUserService.create.mockRejectedValue(conflictError);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        message: 'Email already exists',
        error: 'CONFLICT',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      const loginResult = {
        user: mockUser,
        token: 'mock.jwt.token',
        refreshToken: 'mock.refresh.token',
      };
      mockUserService.login.mockResolvedValue(loginResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: loginResult,
      });

      expect(mockUserService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('should return validation error for invalid credentials', async () => {
      const validationError = new Error('Invalid credentials');
      validationError.name = 'ValidationError';
      (validationError as any).details = [{ field: 'email', message: 'Invalid credentials' }];
      mockUserService.login.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid credentials',
        error: 'VALIDATION_ERROR',
        details: [{ field: 'email', message: 'Invalid credentials' }],
      });
    });

    it('should return validation error for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
          }),
        ]),
      });
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenData = { refreshToken: 'valid.refresh.token' };
      const newTokens = {
        token: 'new.jwt.token',
        refreshToken: 'new.refresh.token',
      };
      mockUserService.refreshToken.mockResolvedValue(newTokens);

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(refreshTokenData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Token refreshed successfully',
        data: newTokens,
      });

      expect(mockUserService.refreshToken).toHaveBeenCalledWith('valid.refresh.token');
    });

    it('should return error for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Refresh token is required',
        error: 'MISSING_REFRESH_TOKEN',
      });
    });

    it('should return error for invalid refresh token', async () => {
      const validationError = new Error('Invalid refresh token');
      validationError.name = 'ValidationError';
      mockUserService.refreshToken.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid.token' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid refresh token',
        error: 'VALIDATION_ERROR',
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully with valid token', async () => {
      const mockUser = createMockUser();
      mockUserService.getUserProfile.mockResolvedValue(mockUser);
      mockUserService.verifyToken.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid.jwt.token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: mockUser },
      });
    });

    it('should return authentication error without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Access token required',
        error: 'AUTHENTICATION_REQUIRED',
      });
    });

    it('should return authentication error with invalid token', async () => {
      const validationError = new Error('Invalid token');
      validationError.name = 'ValidationError';
      mockUserService.verifyToken.mockRejectedValue(validationError);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN',
      });
    });
  });

  describe('PUT /api/auth/profile', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update profile successfully', async () => {
      const mockUser = createMockUser();
      const updatedUser = { ...mockUser, ...updateData };
      mockUserService.verifyToken.mockResolvedValue(mockUser);
      mockUserService.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });

      expect(mockUserService.update).toHaveBeenCalledWith(mockUser.id, updateData);
    });

    it('should return validation error for invalid update data', async () => {
      const mockUser = createMockUser();
      mockUserService.verifyToken.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
          }),
        ]),
      });
    });
  });

  describe('POST /api/auth/change-password', () => {
    const passwordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should change password successfully', async () => {
      const mockUser = createMockUser();
      mockUserService.verifyToken.mockResolvedValue(mockUser);
      mockUserService.changePassword.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(passwordData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Password changed successfully',
      });

      expect(mockUserService.changePassword).toHaveBeenCalledWith(mockUser.id, passwordData);
    });

    it('should return validation error for weak new password', async () => {
      const mockUser = createMockUser();
      mockUserService.verifyToken.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send({ ...passwordData, newPassword: '123' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'newPassword',
          }),
        ]),
      });
    });
  });
});
