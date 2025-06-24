import { FindOptions, Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import User, { UserRole, UserAttributes, UserCreationAttributes } from '../models/User';
import { BaseService, NotFoundError, ConflictError, DatabaseError } from './BaseService';
import { validateSchema, userSchemas, ValidationError } from '../utils/validation';
import { config } from '../config';

// User update attributes (excluding sensitive fields)
export interface UserUpdateAttributes {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

// Authentication interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserAttributes;
  token: string;
  refreshToken: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class UserService extends BaseService<User, UserCreationAttributes, UserUpdateAttributes> {
  constructor() {
    super(User, 'User');
  }

  /**
   * Create a new user with validation
   */
  async create(data: UserCreationAttributes): Promise<User> {
    const validatedData = validateSchema(userSchemas.create, data);
    
    // Check if user already exists
    const existingUser = await this.findOne({ where: { email: validatedData.email } });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    return super.create(validatedData);
  }

  /**
   * Update user with validation
   */
  async update(id: string, data: UserUpdateAttributes): Promise<User> {
    const validatedData = validateSchema(userSchemas.update, data);
    return super.update(id, validatedData);
  }

  /**
   * Authenticate user and return tokens
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const validatedCredentials = validateSchema(userSchemas.login, credentials);
    
    // Find user by email
    const user = await this.findOne({ 
      where: { email: validatedCredentials.email, isActive: true } 
    });
    
    if (!user) {
      throw new NotFoundError('User', 'with these credentials');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(validatedCredentials.password);
    if (!isValidPassword) {
      throw new NotFoundError('User', 'with these credentials');
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toJSON() as UserAttributes,
      token,
      refreshToken,
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, passwordData: ChangePasswordData): Promise<void> {
    const validatedData = validateSchema(userSchemas.changePassword, passwordData);
    
    const user = await this.findById(userId);
    
    // Validate current password
    const isValidPassword = await user.validatePassword(validatedData.currentPassword);
    if (!isValidPassword) {
      throw new ValidationError('Invalid current password', [
        { field: 'currentPassword', message: 'Current password is incorrect' }
      ]);
    }

    // Update password
    await user.update({ password: validatedData.newPassword });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole, options: FindOptions = {}): Promise<User[]> {
    return this.findAll({ 
      ...options, 
      where: { ...options.where, role } 
    });
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, options: FindOptions = {}): Promise<User[]> {
    return this.findAll({
      ...options,
      where: {
        ...options.where,
        [Op.or]: [
          { email: { [Op.iLike]: `%${query}%` } },
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
        ],
      },
    });
  }

  /**
   * Activate/deactivate user
   */
  async setUserStatus(userId: string, isActive: boolean): Promise<User> {
    return this.update(userId, { isActive });
  }

  /**
   * Get user statistics by role
   */
  async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: { [key in UserRole]: number };
  }> {
    const totalUsers = await this.count();
    const activeUsers = await this.count({ where: { isActive: true } });

    const usersByRole = {} as { [key in UserRole]: number };
    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.count({ where: { role, isActive: true } });
    }

    return {
      totalUsers,
      activeUsers,
      usersByRole,
    };
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const secret = config.jwt.secret || 'dev-secret-key-change-in-production';
      const payload = jwt.verify(token, secret) as TokenPayload;
      const user = await this.findById(payload.userId);
      
      if (!user.isActive) {
        throw new NotFoundError('User', 'account is deactivated');
      }
      
      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError('Invalid token', [
          { field: 'token', message: 'Token is invalid or expired' }
        ]);
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const secret = config.jwt.secret || 'dev-secret-key-change-in-production';
      const payload = jwt.verify(refreshToken, secret) as TokenPayload;
      const user = await this.findById(payload.userId);
      
      if (!user.isActive) {
        throw new NotFoundError('User', 'account is deactivated');
      }
      
      return {
        token: this.generateToken(user),
        refreshToken: this.generateRefreshToken(user),
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError('Invalid refresh token', [
          { field: 'refreshToken', message: 'Refresh token is invalid or expired' }
        ]);
      }
      throw error;
    }
  }

  /**
   * Generate access token
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = config.jwt.secret || 'dev-secret-key-change-in-production';
    return jwt.sign(payload, secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = config.jwt.secret || 'dev-secret-key-change-in-production';
    return jwt.sign(payload, secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Get user profile with related data
   */
  async getUserProfile(userId: string): Promise<User> {
    return this.findById(userId, {
      include: [
        {
          association: 'patientProfile',
          required: false,
        },
      ],
    });
  }

  /**
   * Bulk create users (for admin operations)
   */
  async bulkCreateUsers(users: UserCreationAttributes[]): Promise<User[]> {
    // Validate all users
    const validatedUsers = users.map(user => validateSchema(userSchemas.create, user));
    
    // Check for duplicate emails
    const emails = validatedUsers.map(user => user.email);
    const existingUsers = await this.findAll({ 
      where: { email: { [Op.in]: emails } } 
    });
    
    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map(user => user.email);
      throw new ConflictError(`Users with emails already exist: ${existingEmails.join(', ')}`);
    }
    
    return this.bulkCreate(validatedUsers);
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async delete(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  /**
   * Hard delete user (permanent deletion)
   */
  async hardDelete(id: string): Promise<void> {
    await super.delete(id);
  }
}
