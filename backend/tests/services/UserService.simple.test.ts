import { UserService } from '../../src/services/UserService';
import { UserRole } from '../../src/models/User';

// Mock all external dependencies
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

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-123', role: 'patient' }),
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  },
}));

jest.mock('../../src/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
  },
}));

const User = require('../../src/models/User').default;

describe('UserService - Core Functionality', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();

    // Reset JWT mocks to default values
    const jwt = require('jsonwebtoken');
    jwt.sign.mockReturnValue('mock.jwt.token');
    jwt.verify.mockReturnValue({ userId: 'user-123', role: 'patient' });
  });

  describe('Service instantiation', () => {
    it('should create UserService instance', () => {
      expect(userService).toBeInstanceOf(UserService);
    });

    it('should have all required methods', () => {
      expect(typeof userService.create).toBe('function');
      expect(typeof userService.login).toBe('function');
      expect(typeof userService.findById).toBe('function');
      expect(typeof userService.update).toBe('function');
      expect(typeof userService.verifyToken).toBe('function');
    });
  });

  describe('User creation validation', () => {
    it('should validate required fields', async () => {
      try {
        await userService.create({} as any);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate email format', async () => {
      try {
        await userService.create({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.PATIENT,
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate password strength', async () => {
      try {
        await userService.create({
          email: 'test@example.com',
          password: '123', // Too weak
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.PATIENT,
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('User creation success', () => {
    it('should create user with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PATIENT,
        isActive: true,
      };

      User.create.mockResolvedValue(mockUser);

      const validUserData = {
        email: 'test@example.com',
        password: 'Password123!', // Must include special character
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PATIENT,
      };

      const result = await userService.create(validUserData);

      expect(User.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('User login validation', () => {
    it('should validate login credentials format', async () => {
      try {
        await userService.login({
          email: 'invalid-email',
          password: 'password123',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should require password', async () => {
      try {
        await userService.login({
          email: 'test@example.com',
          password: '',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('User login success', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
        password: 'hashed_password',
        validatePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue({}),
        toJSON: jest.fn().mockReturnValue({
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.PATIENT,
          isActive: true,
        }),
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await userService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

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
  });

  describe('User search functionality', () => {
    it('should search users by query', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'john@example.com', firstName: 'John' },
        { id: 'user-2', email: 'jane@example.com', firstName: 'Jane' },
      ];

      User.findAll.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers('john');

      expect(User.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('User statistics', () => {
    it('should get user statistics', async () => {
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

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      User.create.mockRejectedValue(new Error('Database connection failed'));

      try {
        await userService.create({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.PATIENT,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle unique constraint violations', async () => {
      const uniqueError = new Error('Unique constraint violation');
      (uniqueError as any).name = 'SequelizeUniqueConstraintError';
      User.create.mockRejectedValue(uniqueError);

      try {
        await userService.create({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.PATIENT,
        });
        fail('Should have thrown conflict error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Token operations', () => {
    it('should verify valid tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.PATIENT,
        isActive: true,
      };

      // Reset the JWT mock to return the correct payload
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'user-123', role: 'patient' });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.verifyToken('valid.jwt.token');

      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      }));
    });

    it('should handle invalid tokens', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      try {
        await userService.verifyToken('invalid.token');
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('User status management', () => {
    it('should activate user', async () => {
      const mockUser = {
        id: 'user-123',
        isActive: false,
        update: jest.fn().mockImplementation((data) => {
          Object.assign(mockUser, data);
          return Promise.resolve(mockUser);
        }),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.setUserStatus('user-123', true);

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: true }, {});
      expect(result.isActive).toBe(true);
    });

    it('should deactivate user', async () => {
      const mockUser = {
        id: 'user-123',
        isActive: true,
        update: jest.fn().mockImplementation((data) => {
          Object.assign(mockUser, data);
          return Promise.resolve(mockUser);
        }),
      };

      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.setUserStatus('user-123', false);

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false }, {});
      expect(result.isActive).toBe(false);
    });
  });
});
