import { UserService } from '../../src/services/UserService';
import { UserRole } from '../../src/models/User';
import {
  createMockUser,
  expectValidationError,
  expectNotFoundError,
  expectConflictError,
  expectAsync
} from '../setup';

// Mock the User model completely
jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACY_STAFF: 'pharmacy_staff',
    LAB_STAFF: 'lab_staff',
    ADMIN: 'admin',
  },
}));

const User = require('../../src/models/User').default;

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-123', role: 'patient' }),
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUser: any;

  beforeEach(() => {
    userService = new UserService();
    mockUser = createMockUser();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.PATIENT,
    };

    it('should create a new user successfully', async () => {
      User.create.mockResolvedValue(mockUser);

      const result = await userService.create(validUserData);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validUserData.email,
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          role: validUserData.role,
          password: 'hashed_password',
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw validation error for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const { error } = await expectAsync(userService.create(invalidData));
      
      expectValidationError(error, 'email');
    });

    it('should throw validation error for weak password', async () => {
      const invalidData = { ...validUserData, password: '123' };
      
      const { error } = await expectAsync(userService.create(invalidData));
      
      expectValidationError(error, 'password');
    });

    it('should throw conflict error for duplicate email', async () => {
      const sequelizeError = new Error('Unique constraint error');
      (sequelizeError as any).name = 'SequelizeUniqueConstraintError';
      User.create.mockRejectedValue(sequelizeError);

      const { error } = await expectAsync(userService.create(validUserData));

      expectConflictError(error);
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const result = await userService.login(loginCredentials);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }),
        token: 'mock.jwt.token',
        refreshToken: 'mock.jwt.token',
      });
    });

    it('should throw validation error for non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      const { error } = await expectAsync(userService.login(loginCredentials));

      expectValidationError(error, 'email');
    });

    it('should throw validation error for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      User.findOne.mockResolvedValue(inactiveUser);

      const { error } = await expectAsync(userService.login(loginCredentials));

      expectValidationError(error, 'account');
    });

    it('should throw validation error for incorrect password', async () => {
      User.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      const { error } = await expectAsync(userService.login(loginCredentials));

      expectValidationError(error, 'password');
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.findById('user-123');

      expect(User.findByPk).toHaveBeenCalledWith('user-123', {});
      expect(result).toEqual(mockUser);
    });

    it('should throw not found error for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const { error } = await expectAsync(userService.findById('non-existent'));

      expectNotFoundError(error, 'User');
    });
  });

  describe('update', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await userService.update('user-123', updateData);

      expect(mockUser.update).toHaveBeenCalledWith(updateData, {});
      expect(result).toEqual(mockUser);
    });

    it('should throw not found error for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const { error } = await expectAsync(userService.update('non-existent', updateData));

      expectNotFoundError(error, 'User');
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should change password successfully', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update = jest.fn().mockResolvedValue(mockUser);

      await userService.changePassword('user-123', passwordData);

      expect(mockUser.update).toHaveBeenCalledWith(
        { password: 'hashed_password' },
        {}
      );
    });

    it('should throw validation error for incorrect current password', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      const { error } = await expectAsync(
        userService.changePassword('user-123', passwordData)
      );

      expectValidationError(error, 'currentPassword');
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.verifyToken('valid.jwt.token');

      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      }));
    });

    it('should throw validation error for invalid token', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const { error } = await expectAsync(userService.verifyToken('invalid.token'));

      expectValidationError(error, 'token');
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const users = [mockUser];
      User.findAll.mockResolvedValue(users);

      const result = await userService.searchUsers('test');

      expect(User.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [expect.any(Symbol)]: expect.any(Array)
          })
        })
      );
      expect(result).toEqual(users);
    });
  });

  describe('getUserStatistics', () => {
    it('should get user statistics successfully', async () => {
      User.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(95)  // active users
        .mockResolvedValueOnce(20)  // patients
        .mockResolvedValueOnce(5)   // doctors
        .mockResolvedValueOnce(3)   // pharmacy staff
        .mockResolvedValueOnce(2)   // lab staff
        .mockResolvedValueOnce(1);  // admins

      const result = await userService.getUserStatistics();

      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 95,
        usersByRole: {
          patient: 20,
          doctor: 5,
          pharmacy_staff: 3,
          lab_staff: 2,
          admin: 1,
        },
      });
    });
  });

  describe('setUserStatus', () => {
    it('should activate user successfully', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update = jest.fn().mockResolvedValue({ ...mockUser, isActive: true });

      const result = await userService.setUserStatus('user-123', true);

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: true }, {});
      expect(result.isActive).toBe(true);
    });

    it('should deactivate user successfully', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      mockUser.update = jest.fn().mockResolvedValue({ ...mockUser, isActive: false });

      const result = await userService.setUserStatus('user-123', false);

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false }, {});
      expect(result.isActive).toBe(false);
    });
  });
});
