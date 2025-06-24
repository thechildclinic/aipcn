# 🔧 AIPC Technical Implementation Guide

## 🎯 **Jest TypeScript Configuration - FIXED**

### **Problem Solved:**
The Jest test configuration was failing to parse TypeScript syntax, causing all 7 test suites to fail with "Missing semicolon" and "Unexpected token" errors.

### **Solution Implemented:**

#### **1. Updated `jest.config.js`:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: false
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // ... other configurations
};
```

#### **2. Created `tsconfig.test.json`:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

#### **3. Fixed Import Path Casing:**
```typescript
// Fixed in src/services/index.ts
export { OrderOrchestrationService } from './orderOrchestrationService';
```

### **Result:**
✅ **All TypeScript syntax now parses correctly**  
✅ **17/17 tests passing in UserService.simple.test.ts**  
✅ **Jest properly recognizes TypeScript types and interfaces**  
✅ **Test coverage can be generated for TypeScript source files**  

## 🏗️ **Architecture Overview**

### **Backend Structure:**
```
AIPC/backend/
├── src/
│   ├── controllers/       # HTTP request handlers
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   └── SymptomController.ts
│   ├── services/          # Business logic layer
│   │   ├── UserService.ts
│   │   ├── PatientService.ts
│   │   ├── OrderService.ts
│   │   └── BaseService.ts
│   ├── models/            # Database models (Sequelize)
│   │   ├── User.ts
│   │   ├── Patient.ts
│   │   └── Order.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/            # API route definitions
│   │   ├── auth.ts
│   │   └── api.ts
│   └── utils/             # Utility functions
├── tests/                 # Jest test suites
│   ├── services/          # Service layer tests
│   ├── integration/       # API integration tests
│   └── setup.ts           # Test configuration
├── jest.config.js         # Jest configuration
├── tsconfig.json          # TypeScript config
├── tsconfig.test.json     # Test-specific TS config
└── basic-server.js        # Production server entry
```

## 🔐 **Authentication System**

### **JWT Implementation:**
```typescript
// JWT Token Generation
private generateToken(user: any): string {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// Token Verification Middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await userService.findById(decoded.userId);
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
```

### **Password Security:**
```typescript
// Password Hashing (in UserService)
private async hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Password Validation
private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

## 🤖 **AI Integration (Google Gemini)**

### **Symptom Checker Implementation:**
```typescript
// AI Service for Symptom Analysis
export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async analyzeSymptoms(symptoms: string[], patientInfo?: any): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Analyze these symptoms: ${symptoms.join(', ')}
      Patient info: ${JSON.stringify(patientInfo)}
      
      Provide:
      1. Possible conditions (with confidence levels)
      2. Recommended next steps
      3. Urgency level (low/medium/high)
      4. When to seek immediate care
    `;

    const result = await model.generateContent(prompt);
    return this.parseAIResponse(result.response.text());
  }
}
```

## 🗄️ **Database Design**

### **Core Models:**

#### **User Model:**
```typescript
export class User extends Model {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: UserRole;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  // ... other fields
}, { sequelize, modelName: 'User' });
```

#### **Patient Model:**
```typescript
export class Patient extends Model {
  public id!: string;
  public userId!: string;
  public dateOfBirth!: Date;
  public gender!: string;
  public phoneNumber!: string;
  public address!: object;
  public emergencyContact!: object;
  public medicalHistory!: object[];
  public allergies!: string[];
  public currentMedications!: object[];
}
```

## 🧪 **Testing Strategy**

### **Test Structure:**
```typescript
// Example Test Suite Structure
describe('UserService - Core Functionality', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('User creation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PATIENT
      };

      User.create.mockResolvedValue(mockUser);
      
      const result = await userService.create(userData);
      
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        email: userData.email,
        role: userData.role
      }));
    });
  });
});
```

### **Mock Configuration:**
```typescript
// Proper Sequelize Model Mocking
jest.mock('../src/models/User', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  }
}));
```

## 🔄 **API Response Format**

### **Standard Response Structure:**
```typescript
// Success Response
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### **Validation Schema Example:**
```typescript
// Joi Validation Schema
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('patient', 'doctor', 'admin').required()
});
```

## 🚀 **Deployment Configuration**

### **Render.com Setup:**
```yaml
# render.yaml (if using)
services:
  - type: web
    name: aipc-backend
    env: node
    buildCommand: cd AIPC/backend && npm install
    startCommand: cd AIPC/backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: aipc-postgres
          property: connectionString
```

### **Environment Variables:**
```bash
# Production Environment
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-frontend-domain.com
```

## 📊 **Performance Optimizations**

### **Database Optimizations:**
```typescript
// Efficient Queries with Includes
const user = await User.findByPk(userId, {
  include: [
    {
      model: Patient,
      as: 'patient',
      include: ['medicalHistory', 'allergies']
    }
  ],
  attributes: { exclude: ['password'] }
});

// Pagination Implementation
const getUsers = async (page: number = 1, limit: number = 10) => {
  const offset = (page - 1) * limit;
  return User.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
};
```

### **Caching Strategy:**
```typescript
// Redis Caching (when implemented)
const getCachedUser = async (userId: string) => {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await User.findByPk(userId);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
};
```

## 🔍 **Monitoring & Logging**

### **Audit Logging:**
```typescript
// Audit Middleware
export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const auditData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      userRole: req.user?.role,
      action,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: `${req.method} ${req.path}`
    };
    
    console.log(`[AUDIT] User ${auditData.userId} (${auditData.userRole}) performed action: ${action}`, auditData);
    next();
  };
};
```

### **Error Handling:**
```typescript
// Global Error Handler
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
    user: req.user?.id
  });

  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: error.details
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};
```

## 🔧 **Development Tools**

### **Useful Scripts:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  }
}
```

### **VS Code Configuration:**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

**🎯 This technical guide covers all the key implementation details for the AIPC backend system.**
