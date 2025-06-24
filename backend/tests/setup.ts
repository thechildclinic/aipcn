import { Sequelize } from 'sequelize';

// Mock database for testing
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  transaction: jest.fn().mockImplementation((callback) => {
    const mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    return callback(mockTransaction);
  }),
};

// Mock models
const createMockModel = (name: string) => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
  findAndCountAll: jest.fn(),
  bulkCreate: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
  hasOne: jest.fn(),
  belongsToMany: jest.fn(),
  associate: jest.fn(),
  tableName: name.toLowerCase(),
  name,
});

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'test_db';
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
});

afterAll(async () => {
  // Cleanup after all tests
  jest.clearAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Export mock utilities for tests
export { mockSequelize, createMockModel };

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'patient',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPatient = (overrides = {}) => ({
  id: 'patient-123',
  userId: 'user-123',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male',
  phone: '+1234567890',
  address: '123 Test St, Test City, TS 12345',
  emergencyContact: 'Emergency Contact',
  emergencyPhone: '+1987654321',
  allergies: ['peanuts'],
  currentMedications: ['aspirin'],
  preferredLanguage: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProvider = (overrides = {}) => ({
  id: 'provider-123',
  name: 'Test Pharmacy',
  type: 'pharmacy',
  address: '456 Provider St, Test City, TS 12345',
  phone: '+1555123456',
  email: 'provider@example.com',
  licenseNumber: 'LIC123456',
  isActive: true,
  acceptingNewOrders: true,
  averageRating: 4.5,
  totalOrders: 100,
  completedOrders: 95,
  servicesOffered: ['Prescription Dispensing'],
  operatingHours: { monday: '9:00-17:00' },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  patientId: 'patient-123',
  type: 'pharmacy',
  status: 'pending',
  orderDate: new Date(),
  prescriptionData: { medications: ['test medication'] },
  totalAmount: 50.00,
  urgency: 'medium',
  deliveryAddress: '123 Test St, Test City, TS 12345',
  notes: 'Test order notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBid = (overrides = {}) => ({
  id: 'bid-123',
  orderId: 'order-123',
  providerId: 'provider-123',
  bidAmount: 45.00,
  estimatedDeliveryTime: '2 hours',
  notes: 'Test bid notes',
  status: 'submitted',
  submittedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock external services
export const mockGeminiService = {
  generateResponse: jest.fn().mockResolvedValue('Mock AI response'),
  analyzeSymptoms: jest.fn().mockResolvedValue({
    assessment: 'Mock assessment',
    recommendations: ['Mock recommendation'],
  }),
};

// Mock JWT utilities
export const mockJWT = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-123', role: 'patient' }),
};

// Mock bcrypt utilities
export const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
};

// Test database utilities
export const setupTestDatabase = async () => {
  // Mock database setup for tests
  return mockSequelize;
};

export const cleanupTestDatabase = async () => {
  // Mock database cleanup for tests
  jest.clearAllMocks();
};

// Error testing utilities
export const expectValidationError = (error: any, field?: string) => {
  expect(error.name).toBe('ValidationError');
  if (field) {
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field })
      ])
    );
  }
};

export const expectNotFoundError = (error: any, resource?: string) => {
  expect(error.name).toBe('NotFoundError');
  if (resource) {
    expect(error.message).toContain(resource);
  }
};

export const expectConflictError = (error: any) => {
  expect(error.name).toBe('ConflictError');
};

// Async test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expectAsync = async (promise: Promise<any>) => {
  try {
    const result = await promise;
    return { result, error: null };
  } catch (error) {
    return { result: null, error };
  }
};
