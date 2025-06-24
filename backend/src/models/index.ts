// Import all models
import User, { UserRole } from './User';
import Patient from './Patient';
import MarketplaceApplication from './MarketplaceApplication';
import Provider from './Provider';
import Order from './Order';
import Bid from './Bid';
import AlgorithmConfiguration from './AlgorithmConfiguration';

// Import database connection
import sequelize, { testConnection, syncDatabase } from '../config/database';

// Export all models
export {
  User,
  Patient,
  MarketplaceApplication,
  Provider,
  Order,
  Bid,
  AlgorithmConfiguration,
  sequelize,
  testConnection,
  syncDatabase,
};

// Define all associations here to avoid circular dependencies
export const initializeAssociations = (): void => {
  // User -> Patient (One-to-One)
  User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
  Patient.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // MarketplaceApplication -> Provider (One-to-One)
  MarketplaceApplication.hasOne(Provider, { foreignKey: 'applicationId', as: 'provider' });
  Provider.belongsTo(MarketplaceApplication, { foreignKey: 'applicationId', as: 'application' });

  // Patient -> Order (One-to-Many)
  Patient.hasMany(Order, { foreignKey: 'patientId', as: 'orders' });
  Order.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

  // Provider -> Order (One-to-Many for assigned orders)
  Provider.hasMany(Order, { foreignKey: 'assignedProviderId', as: 'assignedOrders' });
  Order.belongsTo(Provider, { foreignKey: 'assignedProviderId', as: 'assignedProvider' });

  // Order -> Bid (One-to-Many)
  Order.hasMany(Bid, { foreignKey: 'orderId', as: 'bids' });
  Bid.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

  // Provider -> Bid (One-to-Many)
  Provider.hasMany(Bid, { foreignKey: 'providerId', as: 'bids' });
  Bid.belongsTo(Provider, { foreignKey: 'providerId', as: 'provider' });
};

// Initialize database with all models and associations
export const initializeDatabase = async (force = false): Promise<void> => {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await testConnection();
    
    // Initialize associations
    initializeAssociations();
    
    // Sync database
    await syncDatabase(force);
    
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Create default data
export const createDefaultData = async (): Promise<void> => {
  try {
    console.log('🔄 Creating default data...');
    
    // Create default algorithm configurations
    const defaultPharmacyConfig = await AlgorithmConfiguration.findOrCreate({
      where: { name: 'Default Pharmacy Algorithm' },
      defaults: {
        name: 'Default Pharmacy Algorithm',
        description: 'Balanced algorithm for pharmacy order assignment',
        priceWeight: 0.4,
        speedWeight: 0.3,
        qualityWeight: 0.3,
        maxBidWaitTimeMinutes: 30,
        minBidsRequired: 1,
        maxBidsConsidered: 5,
        serviceType: 'pharmacy',
        isActive: true,
        version: 1,
      },
    });

    const defaultLabConfig = await AlgorithmConfiguration.findOrCreate({
      where: { name: 'Default Lab Algorithm' },
      defaults: {
        name: 'Default Lab Algorithm',
        description: 'Quality-focused algorithm for lab order assignment',
        priceWeight: 0.2,
        speedWeight: 0.3,
        qualityWeight: 0.5,
        maxBidWaitTimeMinutes: 60,
        minBidsRequired: 1,
        maxBidsConsidered: 8,
        serviceType: 'lab',
        isActive: true,
        version: 1,
      },
    });

    // Create admin user if it doesn't exist
    const adminUser = await User.findOrCreate({
      where: { email: 'admin@aipc.com' },
      defaults: {
        email: 'admin@aipc.com',
        password: 'admin123!', // Will be hashed by the model hook
        role: UserRole.ADMIN,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        isEmailVerified: true,
      },
    });

    console.log('✅ Default data created successfully!');
    console.log('📧 Admin user: admin@aipc.com / admin123!');
    
  } catch (error) {
    console.error('❌ Failed to create default data:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  connected: boolean;
  tablesExist: boolean;
  recordCounts: { [key: string]: number };
}> => {
  try {
    // Test connection
    await testConnection();
    
    // Check if tables exist and get record counts
    const recordCounts: { [key: string]: number } = {};
    
    recordCounts.users = await User.count();
    recordCounts.patients = await Patient.count();
    recordCounts.marketplace_applications = await MarketplaceApplication.count();
    recordCounts.providers = await Provider.count();
    recordCounts.orders = await Order.count();
    recordCounts.bids = await Bid.count();
    recordCounts.algorithm_configurations = await AlgorithmConfiguration.count();
    
    return {
      connected: true,
      tablesExist: true,
      recordCounts,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      connected: false,
      tablesExist: false,
      recordCounts: {},
    };
  }
};

// Export types for use in other files
export type {
  UserAttributes,
  UserCreationAttributes,
} from './User';

export type {
  PatientAttributes,
  PatientCreationAttributes,
} from './Patient';

export type {
  MarketplaceApplicationAttributes,
  MarketplaceApplicationCreationAttributes,
} from './MarketplaceApplication';

export type {
  ProviderAttributes,
  ProviderCreationAttributes,
} from './Provider';

export type {
  OrderAttributes,
  OrderCreationAttributes,
} from './Order';

export type {
  BidAttributes,
  BidCreationAttributes,
} from './Bid';

export type {
  AlgorithmConfigurationAttributes,
  AlgorithmConfigurationCreationAttributes,
} from './AlgorithmConfiguration';

// Export enums
export { UserRole } from './User';
export { BusinessType, ApplicationStatus } from './MarketplaceApplication';
export { ProviderType } from './Provider';
export { OrderType, OrderStatus } from './Order';
export { BidStatus } from './Bid';
