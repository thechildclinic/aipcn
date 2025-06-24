import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Algorithm configuration attributes interface
export interface AlgorithmConfigurationAttributes {
  id: string;
  name: string;
  description?: string;
  
  // Factor weights (should sum to 1.0)
  priceWeight: number;
  speedWeight: number;
  qualityWeight: number;
  
  // Additional configuration
  maxBidWaitTimeMinutes: number;
  minBidsRequired: number;
  maxBidsConsidered: number;
  
  // Service type specific settings
  serviceType: 'pharmacy' | 'lab' | 'both';
  
  // Status and versioning
  isActive: boolean;
  version: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
export interface AlgorithmConfigurationCreationAttributes extends Optional<AlgorithmConfigurationAttributes, 'id' | 'isActive' | 'version' | 'createdAt' | 'updatedAt'> {}

// AlgorithmConfiguration model class
class AlgorithmConfiguration extends Model<AlgorithmConfigurationAttributes, AlgorithmConfigurationCreationAttributes> implements AlgorithmConfigurationAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  
  public priceWeight!: number;
  public speedWeight!: number;
  public qualityWeight!: number;
  
  public maxBidWaitTimeMinutes!: number;
  public minBidsRequired!: number;
  public maxBidsConsidered!: number;
  
  public serviceType!: 'pharmacy' | 'lab' | 'both';
  
  public isActive!: boolean;
  public version!: number;

  // Model timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public validateWeights(): boolean {
    const sum = this.priceWeight + this.speedWeight + this.qualityWeight;
    return Math.abs(sum - 1.0) < 0.001; // Allow for floating point precision
  }

  public normalizeWeights(): void {
    const sum = this.priceWeight + this.speedWeight + this.qualityWeight;
    if (sum > 0) {
      this.priceWeight = this.priceWeight / sum;
      this.speedWeight = this.speedWeight / sum;
      this.qualityWeight = this.qualityWeight / sum;
    }
  }

  public calculateBidScore(bid: {
    bidAmount: number;
    estimatedTime: number; // in hours
    qualityScore: number; // 0-100
  }, orderContext: {
    averageBidAmount: number;
    fastestTime: number;
    highestQuality: number;
  }): number {
    // Normalize price (lower is better, so invert)
    const priceScore = orderContext.averageBidAmount > 0 ? 
      (1 - (bid.bidAmount / orderContext.averageBidAmount)) * 100 : 50;
    
    // Normalize speed (faster is better, so invert)
    const speedScore = orderContext.fastestTime > 0 ? 
      (1 - (bid.estimatedTime / orderContext.fastestTime)) * 100 : 50;
    
    // Quality score is already 0-100
    const qualityScore = bid.qualityScore;
    
    // Calculate weighted score
    const totalScore = 
      (Math.max(0, priceScore) * this.priceWeight) +
      (Math.max(0, speedScore) * this.speedWeight) +
      (qualityScore * this.qualityWeight);
    
    return Math.min(100, Math.max(0, totalScore));
  }

  public getWeightsSummary(): string {
    return `Price: ${(this.priceWeight * 100).toFixed(1)}%, Speed: ${(this.speedWeight * 100).toFixed(1)}%, Quality: ${(this.qualityWeight * 100).toFixed(1)}%`;
  }

  public clone(newName: string): AlgorithmConfigurationCreationAttributes {
    return {
      name: newName,
      description: `Cloned from ${this.name}`,
      priceWeight: this.priceWeight,
      speedWeight: this.speedWeight,
      qualityWeight: this.qualityWeight,
      maxBidWaitTimeMinutes: this.maxBidWaitTimeMinutes,
      minBidsRequired: this.minBidsRequired,
      maxBidsConsidered: this.maxBidsConsidered,
      serviceType: this.serviceType,
      isActive: false, // New clones start inactive
      version: 1,
    };
  }
}

// Initialize the model
AlgorithmConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priceWeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    speedWeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    qualityWeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    maxBidWaitTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 1,
        max: 1440, // Max 24 hours
      },
    },
    minBidsRequired: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    maxBidsConsidered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
      },
    },
    serviceType: {
      type: DataTypes.ENUM('pharmacy', 'lab', 'both'),
      allowNull: false,
      defaultValue: 'both',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: 'AlgorithmConfiguration',
    tableName: 'algorithm_configurations',
    validate: {
      weightsSum(this: AlgorithmConfiguration) {
        const sum = this.priceWeight + this.speedWeight + this.qualityWeight;
        if (Math.abs(sum - 1.0) > 0.001) {
          throw new Error('Price, speed, and quality weights must sum to 1.0');
        }
      },
    },
    hooks: {
      beforeSave: (config: AlgorithmConfiguration) => {
        // Ensure only one active config per service type
        if (config.isActive) {
          // This would need to be handled in the service layer to avoid circular dependencies
        }
      },
    },
  }
);

export default AlgorithmConfiguration;
