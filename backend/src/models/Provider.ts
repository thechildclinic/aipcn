import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import MarketplaceApplication from './MarketplaceApplication';

// Provider type enum
export enum ProviderType {
  PHARMACY = 'pharmacy',
  LAB = 'lab',
}

// Provider attributes interface
export interface ProviderAttributes {
  id: string;
  applicationId: string;
  type: ProviderType;
  name: string;
  address: string;
  serviceRegion: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  
  // Services and capabilities
  servicesOffered: string[];
  certifications?: string[];
  
  // Pharmacy specific
  offersDelivery?: boolean;
  deliveryRadius?: number; // in kilometers
  
  // Lab specific
  testsOffered?: string[];
  avgTurnaroundTimeHours?: number;
  
  // Performance metrics
  averageRating?: number;
  totalRatings?: number;
  slaCompliance?: number; // percentage
  qualityScore?: string;
  
  // Operational status
  isActive: boolean;
  acceptingNewOrders: boolean;
  currentCapacity?: number;
  maxCapacity?: number;
  
  // Business hours (JSON format)
  businessHours?: object;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
export interface ProviderCreationAttributes extends Optional<ProviderAttributes, 'id' | 'isActive' | 'acceptingNewOrders' | 'createdAt' | 'updatedAt'> {}

// Provider model class
class Provider extends Model<ProviderAttributes, ProviderCreationAttributes> implements ProviderAttributes {
  public id!: string;
  public applicationId!: string;
  public type!: ProviderType;
  public name!: string;
  public address!: string;
  public serviceRegion!: string;
  public contactEmail!: string;
  public contactPhone!: string;
  public website?: string;
  
  public servicesOffered!: string[];
  public certifications?: string[];
  
  // Pharmacy specific
  public offersDelivery?: boolean;
  public deliveryRadius?: number;
  
  // Lab specific
  public testsOffered?: string[];
  public avgTurnaroundTimeHours?: number;
  
  // Performance metrics
  public averageRating?: number;
  public totalRatings?: number;
  public slaCompliance?: number;
  public qualityScore?: string;
  
  // Operational status
  public isActive!: boolean;
  public acceptingNewOrders!: boolean;
  public currentCapacity?: number;
  public maxCapacity?: number;
  
  public businessHours?: object;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public getApplication!: () => Promise<MarketplaceApplication>;

  // Instance methods
  public updateRating(newRating: number): void {
    if (!this.averageRating || !this.totalRatings) {
      this.averageRating = newRating;
      this.totalRatings = 1;
    } else {
      const totalScore = this.averageRating * this.totalRatings;
      this.totalRatings += 1;
      this.averageRating = (totalScore + newRating) / this.totalRatings;
    }
  }

  public isAvailable(): boolean {
    return this.isActive && this.acceptingNewOrders;
  }

  public hasCapacity(): boolean {
    if (!this.maxCapacity) return true;
    return (this.currentCapacity || 0) < this.maxCapacity;
  }

  public canServiceRegion(region: string): boolean {
    return this.serviceRegion.toLowerCase().includes(region.toLowerCase());
  }

  public offersService(service: string): boolean {
    return this.servicesOffered.some(s => 
      s.toLowerCase().includes(service.toLowerCase())
    );
  }

  // Pharmacy specific methods
  public canDeliver(): boolean {
    return this.type === ProviderType.PHARMACY && (this.offersDelivery || false);
  }

  // Lab specific methods
  public offersTest(testName: string): boolean {
    if (this.type !== ProviderType.LAB || !this.testsOffered) return false;
    return this.testsOffered.some(test => 
      test.toLowerCase().includes(testName.toLowerCase())
    );
  }

  public getEstimatedTurnaround(): string {
    if (this.type === ProviderType.LAB && this.avgTurnaroundTimeHours) {
      if (this.avgTurnaroundTimeHours <= 24) {
        return `${this.avgTurnaroundTimeHours} hours`;
      } else {
        return `${Math.ceil(this.avgTurnaroundTimeHours / 24)} days`;
      }
    }
    return 'Contact provider';
  }
}

// Initialize the model
Provider.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: MarketplaceApplication,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ProviderType)),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    serviceRegion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    servicesOffered: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    offersDelivery: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    deliveryRadius: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    testsOffered: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    avgTurnaroundTimeHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    averageRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    slaCompliance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    qualityScore: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    acceptingNewOrders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    currentCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    businessHours: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Provider',
    tableName: 'providers',
  }
);

// Associations are defined in models/index.ts to avoid circular dependencies

export default Provider;
