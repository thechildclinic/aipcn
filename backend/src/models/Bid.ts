import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';
import Provider from './Provider';

// Bid status enum
export enum BidStatus {
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Bid attributes interface
export interface BidAttributes {
  id: string;
  orderId: string;
  providerId: string;
  bidAmount: number;
  currency: string;
  
  // Service-specific estimates
  estimatedDeliveryTime?: string; // For pharmacy orders
  estimatedTurnaroundTime?: string; // For lab orders
  
  // Bid details
  notes?: string;
  validUntil?: Date;
  status: BidStatus;
  
  // Quality metrics snapshot (at time of bid)
  providerRatingSnapshot?: number;
  providerSlaSnapshot?: number;
  providerQualityScoreSnapshot?: string;
  
  // Timestamps
  submittedAt: Date;
  respondedAt?: Date;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
export interface BidCreationAttributes extends Optional<BidAttributes, 'id' | 'status' | 'submittedAt' | 'createdAt' | 'updatedAt'> {}

// Bid model class
class Bid extends Model<BidAttributes, BidCreationAttributes> implements BidAttributes {
  public id!: string;
  public orderId!: string;
  public providerId!: string;
  public bidAmount!: number;
  public currency!: string;
  
  public estimatedDeliveryTime?: string;
  public estimatedTurnaroundTime?: string;
  
  public notes?: string;
  public validUntil?: Date;
  public status!: BidStatus;
  
  public providerRatingSnapshot?: number;
  public providerSlaSnapshot?: number;
  public providerQualityScoreSnapshot?: string;
  
  public submittedAt!: Date;
  public respondedAt?: Date;

  // Model timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public getOrder!: () => Promise<Order>;
  public getProvider!: () => Promise<Provider>;

  // Instance methods
  public accept(): void {
    this.status = BidStatus.ACCEPTED;
    this.respondedAt = new Date();
  }

  public reject(): void {
    this.status = BidStatus.REJECTED;
    this.respondedAt = new Date();
  }

  public expire(): void {
    this.status = BidStatus.EXPIRED;
  }

  public isValid(): boolean {
    if (this.status !== BidStatus.SUBMITTED) return false;
    if (!this.validUntil) return true;
    return new Date() <= this.validUntil;
  }

  public isExpired(): boolean {
    if (!this.validUntil) return false;
    return new Date() > this.validUntil;
  }

  public getFormattedAmount(): string {
    return `${this.currency} ${this.bidAmount.toFixed(2)}`;
  }

  public getTimeToExpiry(): string | null {
    if (!this.validUntil) return null;
    
    const now = new Date();
    const diffMs = this.validUntil.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  }

  public getQualityScore(): number {
    // Calculate a composite quality score based on available metrics
    let score = 0;
    let factors = 0;

    if (this.providerRatingSnapshot) {
      score += (this.providerRatingSnapshot / 5) * 40; // 40% weight for rating
      factors++;
    }

    if (this.providerSlaSnapshot) {
      score += (this.providerSlaSnapshot / 100) * 30; // 30% weight for SLA
      factors++;
    }

    if (this.providerQualityScoreSnapshot) {
      // Convert quality score to numeric (assuming A+ = 100, A = 90, etc.)
      const qualityMap: { [key: string]: number } = {
        'A+': 100, 'A': 90, 'B+': 80, 'B': 70, 'C+': 60, 'C': 50
      };
      const qualityValue = qualityMap[this.providerQualityScoreSnapshot] || 50;
      score += (qualityValue / 100) * 30; // 30% weight for quality
      factors++;
    }

    return factors > 0 ? score / factors : 50; // Default to 50 if no metrics
  }
}

// Initialize the model
Bid.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Order,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Provider,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    bidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD',
    },
    estimatedDeliveryTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estimatedTurnaroundTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BidStatus)),
      allowNull: false,
      defaultValue: BidStatus.SUBMITTED,
    },
    providerRatingSnapshot: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    providerSlaSnapshot: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    providerQualityScoreSnapshot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Bid',
    tableName: 'bids',
    hooks: {
      beforeCreate: async (bid: Bid) => {
        // Capture provider metrics at time of bid submission
        const provider = await Provider.findByPk(bid.providerId);
        if (provider) {
          bid.providerRatingSnapshot = provider.averageRating;
          bid.providerSlaSnapshot = provider.slaCompliance;
          bid.providerQualityScoreSnapshot = provider.qualityScore;
        }
      },
    },
  }
);

// Associations are defined in models/index.ts to avoid circular dependencies

export default Bid;
