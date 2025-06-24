import { FindOptions } from 'sequelize';
import AlgorithmConfiguration, {
  AlgorithmConfigurationAttributes,
  AlgorithmConfigurationCreationAttributes
} from '../models/AlgorithmConfiguration';
import { BaseService, ConflictError } from './BaseService';
import { validateSchema, algorithmConfigSchemas, ValidationError } from '../utils/validation';

// Algorithm configuration update attributes
export interface AlgorithmConfigurationUpdateAttributes {
  description?: string;
  priceWeight?: number;
  speedWeight?: number;
  qualityWeight?: number;
  maxBidWaitTimeMinutes?: number;
  minBidsRequired?: number;
  maxBidsConsidered?: number;
  serviceType?: 'pharmacy' | 'lab' | 'both';
  isActive?: boolean;
}

export class AlgorithmConfigurationService extends BaseService<
  AlgorithmConfiguration, 
  AlgorithmConfigurationCreationAttributes, 
  AlgorithmConfigurationUpdateAttributes
> {
  constructor() {
    super(AlgorithmConfiguration, 'AlgorithmConfiguration');
  }

  /**
   * Create a new algorithm configuration with validation
   */
  async create(data: AlgorithmConfigurationCreationAttributes): Promise<AlgorithmConfiguration> {
    const validatedData = validateSchema(algorithmConfigSchemas.create, data);
    
    // Check if name already exists
    const existingConfig = await this.findOne({ where: { name: validatedData.name } });
    if (existingConfig) {
      throw new ConflictError('Algorithm configuration with this name already exists');
    }

    return super.create(validatedData);
  }

  /**
   * Update algorithm configuration with validation
   */
  async update(id: string, data: AlgorithmConfigurationUpdateAttributes): Promise<AlgorithmConfiguration> {
    const validatedData = validateSchema(algorithmConfigSchemas.update, data);
    
    const config = await this.findById(id);
    
    // If updating weights, ensure they sum to 1.0
    if (validatedData.priceWeight !== undefined || 
        validatedData.speedWeight !== undefined || 
        validatedData.qualityWeight !== undefined) {
      
      const priceWeight = validatedData.priceWeight ?? config.priceWeight;
      const speedWeight = validatedData.speedWeight ?? config.speedWeight;
      const qualityWeight = validatedData.qualityWeight ?? config.qualityWeight;
      
      const sum = priceWeight + speedWeight + qualityWeight;
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new ValidationError('Invalid weights', [
          { field: 'weights', message: 'Price, speed, and quality weights must sum to 1.0' }
        ]);
      }
    }
    
    return super.update(id, validatedData);
  }

  /**
   * Activate configuration (deactivate others of same service type)
   */
  async activateConfiguration(id: string): Promise<AlgorithmConfiguration> {
    const config = await this.findById(id);
    
    // Deactivate other configurations of the same service type
    await this.bulkUpdate(
      { isActive: false },
      { 
        where: { 
          serviceType: config.serviceType,
          id: { $ne: id } as any
        } 
      }
    );
    
    // Activate this configuration
    return this.update(id, { isActive: true });
  }

  /**
   * Get active configuration for service type
   */
  async getActiveConfiguration(serviceType: 'pharmacy' | 'lab' | 'both'): Promise<AlgorithmConfiguration | null> {
    return this.findOne({
      where: {
        serviceType,
        isActive: true,
      },
    });
  }

  /**
   * Get active configuration for service type (required)
   */
  async getActiveConfigurationRequired(serviceType: 'pharmacy' | 'lab' | 'both'): Promise<AlgorithmConfiguration> {
    const config = await this.getActiveConfiguration(serviceType);
    if (!config) {
      throw new ValidationError('No active configuration', [
        { field: 'serviceType', message: `No active algorithm configuration found for ${serviceType}` }
      ]);
    }
    return config;
  }

  /**
   * Get configurations by service type
   */
  async getConfigurationsByServiceType(serviceType: 'pharmacy' | 'lab' | 'both'): Promise<AlgorithmConfiguration[]> {
    return this.findAll({
      where: { serviceType },
      order: [['isActive', 'DESC'], ['version', 'DESC']],
    });
  }

  /**
   * Clone configuration
   */
  async cloneConfiguration(id: string, newName: string): Promise<AlgorithmConfiguration> {
    const originalConfig = await this.findById(id);
    
    // Check if new name already exists
    const existingConfig = await this.findOne({ where: { name: newName } });
    if (existingConfig) {
      throw new ConflictError('Algorithm configuration with this name already exists');
    }
    
    const cloneData = originalConfig.clone(newName);
    return this.create(cloneData);
  }

  /**
   * Calculate bid score using configuration
   */
  async calculateBidScore(
    configId: string,
    bid: {
      bidAmount: number;
      estimatedTime: number; // in hours
      qualityScore: number; // 0-100
    },
    orderContext: {
      averageBidAmount: number;
      fastestTime: number;
      highestQuality: number;
    }
  ): Promise<number> {
    const config = await this.findById(configId);
    return config.calculateBidScore(bid, orderContext);
  }

  /**
   * Get configuration statistics
   */
  async getConfigurationStatistics(): Promise<{
    total: number;
    active: number;
    byServiceType: { [key: string]: number };
    averageWeights: {
      price: number;
      speed: number;
      quality: number;
    };
  }> {
    const total = await this.count();
    const active = await this.count({ where: { isActive: true } });
    
    // Service type statistics
    const serviceTypes = ['pharmacy', 'lab', 'both'];
    const byServiceType: { [key: string]: number } = {};
    
    for (const serviceType of serviceTypes) {
      byServiceType[serviceType] = await this.count({ where: { serviceType } });
    }
    
    // Calculate average weights
    const configs = await this.findAll();
    const totalConfigs = configs.length;
    
    const averageWeights = {
      price: totalConfigs > 0 ? configs.reduce((sum, config) => sum + config.priceWeight, 0) / totalConfigs : 0,
      speed: totalConfigs > 0 ? configs.reduce((sum, config) => sum + config.speedWeight, 0) / totalConfigs : 0,
      quality: totalConfigs > 0 ? configs.reduce((sum, config) => sum + config.qualityWeight, 0) / totalConfigs : 0,
    };
    
    return {
      total,
      active,
      byServiceType,
      averageWeights,
    };
  }

  /**
   * Test configuration with sample data
   */
  async testConfiguration(
    id: string,
    sampleBids: Array<{
      bidAmount: number;
      estimatedTime: number;
      qualityScore: number;
    }>
  ): Promise<Array<{
    bid: any;
    score: number;
    rank: number;
  }>> {
    const config = await this.findById(id);
    
    if (sampleBids.length === 0) {
      return [];
    }
    
    // Calculate order context
    const averageBidAmount = sampleBids.reduce((sum, bid) => sum + bid.bidAmount, 0) / sampleBids.length;
    const fastestTime = Math.min(...sampleBids.map(bid => bid.estimatedTime));
    const highestQuality = Math.max(...sampleBids.map(bid => bid.qualityScore));
    
    const orderContext = {
      averageBidAmount,
      fastestTime,
      highestQuality,
    };
    
    // Calculate scores for each bid
    const bidsWithScores = sampleBids.map(bid => ({
      bid,
      score: config.calculateBidScore(bid, orderContext),
    }));
    
    // Sort by score (highest first) and add rank
    bidsWithScores.sort((a, b) => b.score - a.score);
    
    return bidsWithScores.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  /**
   * Get configuration history (versions)
   */
  async getConfigurationHistory(name: string): Promise<AlgorithmConfiguration[]> {
    return this.findAll({
      where: { name },
      order: [['version', 'DESC']],
    });
  }

  /**
   * Create new version of configuration
   */
  async createNewVersion(id: string, updates: AlgorithmConfigurationUpdateAttributes): Promise<AlgorithmConfiguration> {
    const currentConfig = await this.findById(id);
    
    // Create new version with incremented version number
    const newVersionData: AlgorithmConfigurationCreationAttributes = {
      name: currentConfig.name,
      description: updates.description ?? currentConfig.description,
      priceWeight: updates.priceWeight ?? currentConfig.priceWeight,
      speedWeight: updates.speedWeight ?? currentConfig.speedWeight,
      qualityWeight: updates.qualityWeight ?? currentConfig.qualityWeight,
      maxBidWaitTimeMinutes: updates.maxBidWaitTimeMinutes ?? currentConfig.maxBidWaitTimeMinutes,
      minBidsRequired: updates.minBidsRequired ?? currentConfig.minBidsRequired,
      maxBidsConsidered: updates.maxBidsConsidered ?? currentConfig.maxBidsConsidered,
      serviceType: updates.serviceType ?? currentConfig.serviceType,
      isActive: false, // New versions start inactive
      version: currentConfig.version + 1,
    };
    
    // Validate the new version data
    const validatedData = validateSchema(algorithmConfigSchemas.create, newVersionData);
    
    return super.create(validatedData);
  }

  /**
   * Get default configurations
   */
  async getDefaultConfigurations(): Promise<{
    pharmacy: AlgorithmConfiguration | null;
    lab: AlgorithmConfiguration | null;
  }> {
    const pharmacy = await this.getActiveConfiguration('pharmacy');
    const lab = await this.getActiveConfiguration('lab');
    
    return { pharmacy, lab };
  }

  /**
   * Reset to default configurations
   */
  async resetToDefaults(): Promise<{
    pharmacy: AlgorithmConfiguration;
    lab: AlgorithmConfiguration;
  }> {
    // Deactivate all configurations
    await this.bulkUpdate({ isActive: false }, { where: {} });
    
    // Create or activate default pharmacy configuration
    let pharmacyConfig = await this.findOne({ where: { name: 'Default Pharmacy Algorithm' } });
    if (!pharmacyConfig) {
      pharmacyConfig = await this.create({
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
      });
    } else {
      await pharmacyConfig.update({ isActive: true });
    }
    
    // Create or activate default lab configuration
    let labConfig = await this.findOne({ where: { name: 'Default Lab Algorithm' } });
    if (!labConfig) {
      labConfig = await this.create({
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
      });
    } else {
      await labConfig.update({ isActive: true });
    }
    
    return {
      pharmacy: pharmacyConfig,
      lab: labConfig,
    };
  }
}
