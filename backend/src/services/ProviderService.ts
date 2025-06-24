import { FindOptions, Op } from 'sequelize';
import Provider, {
  ProviderAttributes,
  ProviderCreationAttributes,
  ProviderType
} from '../models/Provider';
import MarketplaceApplication, { ApplicationStatus } from '../models/MarketplaceApplication';
import { BaseService, NotFoundError, ConflictError } from './BaseService';
import { validateSchema, providerSchemas, ValidationError } from '../utils/validation';

// Provider update attributes
export interface ProviderUpdateAttributes {
  serviceRegion?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  servicesOffered?: string[];
  certifications?: string[];
  offersDelivery?: boolean;
  deliveryRadius?: number;
  testsOffered?: string[];
  avgTurnaroundTimeHours?: number;
  isActive?: boolean;
  acceptingNewOrders?: boolean;
  currentCapacity?: number;
  maxCapacity?: number;
  businessHours?: object;
}

// Provider search criteria
export interface ProviderSearchCriteria {
  type?: ProviderType;
  serviceRegion?: string;
  isActive?: boolean;
  acceptingNewOrders?: boolean;
  servicesOffered?: string[];
  testsOffered?: string[];
  minRating?: number;
  maxDistance?: number;
  location?: { lat: number; lng: number };
}

export class ProviderService extends BaseService<Provider, ProviderCreationAttributes, ProviderUpdateAttributes> {
  constructor() {
    super(Provider, 'Provider');
  }

  /**
   * Create a new provider with validation
   */
  async create(data: ProviderCreationAttributes): Promise<Provider> {
    const validatedData = validateSchema(providerSchemas.create, data);
    
    // Verify application exists and is approved
    const application = await MarketplaceApplication.findByPk(validatedData.applicationId);
    if (!application) {
      throw new NotFoundError('MarketplaceApplication', validatedData.applicationId);
    }
    
    if (application.status !== ApplicationStatus.APPROVED) {
      throw new ValidationError('Application not approved', [
        { field: 'applicationId', message: 'Marketplace application must be approved before creating provider' }
      ]);
    }
    
    // Check if provider already exists for this application
    const existingProvider = await this.findOne({ where: { applicationId: validatedData.applicationId } });
    if (existingProvider) {
      throw new ConflictError('Provider already exists for this application');
    }

    return super.create(validatedData);
  }

  /**
   * Update provider with validation
   */
  async update(id: string, data: ProviderUpdateAttributes): Promise<Provider> {
    const validatedData = validateSchema(providerSchemas.update, data);
    return super.update(id, validatedData);
  }

  /**
   * Search providers by criteria
   */
  async searchProviders(criteria: ProviderSearchCriteria, options: FindOptions = {}): Promise<Provider[]> {
    const whereConditions: any = {};

    if (criteria.type) {
      whereConditions.type = criteria.type;
    }

    if (criteria.serviceRegion) {
      whereConditions.serviceRegion = { [Op.iLike]: `%${criteria.serviceRegion}%` };
    }

    if (criteria.isActive !== undefined) {
      whereConditions.isActive = criteria.isActive;
    }

    if (criteria.acceptingNewOrders !== undefined) {
      whereConditions.acceptingNewOrders = criteria.acceptingNewOrders;
    }

    if (criteria.servicesOffered && criteria.servicesOffered.length > 0) {
      whereConditions.servicesOffered = { [Op.overlap]: criteria.servicesOffered };
    }

    if (criteria.testsOffered && criteria.testsOffered.length > 0) {
      whereConditions.testsOffered = { [Op.overlap]: criteria.testsOffered };
    }

    if (criteria.minRating) {
      whereConditions.averageRating = { [Op.gte]: criteria.minRating };
    }

    return this.findAll({
      ...options,
      where: { ...options.where, ...whereConditions },
      order: [['averageRating', 'DESC'], ['name', 'ASC']],
    });
  }

  /**
   * Get providers by type
   */
  async findByType(type: ProviderType, options: FindOptions = {}): Promise<Provider[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, type },
    });
  }

  /**
   * Get active providers
   */
  async getActiveProviders(options: FindOptions = {}): Promise<Provider[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, isActive: true },
    });
  }

  /**
   * Get providers accepting new orders
   */
  async getAvailableProviders(type?: ProviderType): Promise<Provider[]> {
    const whereConditions: any = {
      isActive: true,
      acceptingNewOrders: true,
    };

    if (type) {
      whereConditions.type = type;
    }

    return this.findAll({
      where: whereConditions,
      order: [['averageRating', 'DESC']],
    });
  }

  /**
   * Find providers by service region
   */
  async findByServiceRegion(region: string): Promise<Provider[]> {
    return this.findAll({
      where: {
        serviceRegion: { [Op.iLike]: `%${region}%` },
        isActive: true,
      },
    });
  }

  /**
   * Find providers offering specific service
   */
  async findByService(service: string, type?: ProviderType): Promise<Provider[]> {
    const whereConditions: any = {
      servicesOffered: { [Op.contains]: [service] },
      isActive: true,
    };

    if (type) {
      whereConditions.type = type;
    }

    return this.findAll({
      where: whereConditions,
      order: [['averageRating', 'DESC']],
    });
  }

  /**
   * Find lab providers offering specific test
   */
  async findLabsByTest(testName: string): Promise<Provider[]> {
    return this.findAll({
      where: {
        type: ProviderType.LAB,
        testsOffered: { [Op.contains]: [testName] },
        isActive: true,
        acceptingNewOrders: true,
      },
      order: [['averageRating', 'DESC']],
    });
  }

  /**
   * Find pharmacy providers with delivery
   */
  async findPharmaciesWithDelivery(region?: string): Promise<Provider[]> {
    const whereConditions: any = {
      type: ProviderType.PHARMACY,
      offersDelivery: true,
      isActive: true,
      acceptingNewOrders: true,
    };

    if (region) {
      whereConditions.serviceRegion = { [Op.iLike]: `%${region}%` };
    }

    return this.findAll({
      where: whereConditions,
      order: [['averageRating', 'DESC']],
    });
  }

  /**
   * Update provider rating
   */
  async updateRating(providerId: string, newRating: number): Promise<Provider> {
    const provider = await this.findById(providerId);
    provider.updateRating(newRating);
    await provider.save();
    return provider;
  }

  /**
   * Update provider capacity
   */
  async updateCapacity(providerId: string, currentCapacity: number): Promise<Provider> {
    return this.update(providerId, { currentCapacity });
  }

  /**
   * Set provider availability
   */
  async setAvailability(providerId: string, acceptingNewOrders: boolean): Promise<Provider> {
    return this.update(providerId, { acceptingNewOrders });
  }

  /**
   * Get provider statistics
   */
  async getProviderStatistics(): Promise<{
    total: number;
    byType: { [key in ProviderType]: number };
    active: number;
    acceptingOrders: number;
    averageRating: number;
  }> {
    const total = await this.count();
    
    // Type statistics
    const byType = {} as { [key in ProviderType]: number };
    for (const type of Object.values(ProviderType)) {
      byType[type] = await this.count({ where: { type } });
    }

    const active = await this.count({ where: { isActive: true } });
    const acceptingOrders = await this.count({ 
      where: { isActive: true, acceptingNewOrders: true } 
    });

    // Calculate average rating
    const providers = await this.findAll({
      where: { averageRating: { [Op.not]: null } },
    });
    
    const totalRating = providers.reduce((sum, provider) => sum + (provider.averageRating || 0), 0);
    const averageRating = providers.length > 0 ? totalRating / providers.length : 0;

    return {
      total,
      byType,
      active,
      acceptingOrders,
      averageRating,
    };
  }

  /**
   * Get provider with application details
   */
  async findWithApplication(id: string): Promise<Provider> {
    return this.findById(id, {
      include: [{ model: MarketplaceApplication, as: 'application' }],
    });
  }

  /**
   * Get top-rated providers
   */
  async getTopRatedProviders(limit: number = 10, type?: ProviderType): Promise<Provider[]> {
    const whereConditions: any = {
      isActive: true,
      averageRating: { [Op.not]: null },
    };

    if (type) {
      whereConditions.type = type;
    }

    return this.findAll({
      where: whereConditions,
      order: [['averageRating', 'DESC'], ['totalRatings', 'DESC']],
      limit,
    });
  }
}
