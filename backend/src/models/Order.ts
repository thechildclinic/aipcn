import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Patient from './Patient';
import Provider from './Provider';

// Order type enum
export enum OrderType {
  PHARMACY = 'pharmacy',
  LAB = 'lab',
}

// Order status enum
export enum OrderStatus {
  PENDING_BROADCAST = 'pending_broadcast',
  AWAITING_BIDS = 'awaiting_bids',
  BIDS_RECEIVED = 'bids_received',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  READY_FOR_PICKUP = 'ready_for_pickup',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Order attributes interface
export interface OrderAttributes {
  id: string;
  patientId: string;
  type: OrderType;
  status: OrderStatus;
  
  // Doctor/Clinic information
  requestingDoctorName?: string;
  clinicAddress?: string;
  clinicLicense?: string;
  
  // Order details (JSON fields for flexibility)
  prescriptionData?: object; // For pharmacy orders
  testData?: object; // For lab orders
  
  // Assignment and fulfillment
  assignedProviderId?: string;
  assignedAt?: Date;
  
  // Pharmacy specific
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: Date;
  pickupLocation?: string;
  trackingLink?: string;
  
  // Lab specific
  preTestInstructions?: string;
  sampleCollectionInfo?: string;
  resultsPdfUrl?: string;
  resultSummaryForDoctor?: string;
  
  // Pricing and payment
  totalAmount?: number;
  currency?: string;
  paymentStatus?: string;
  
  // Timestamps and tracking
  orderDate: Date;
  lastUpdate: Date;
  completedAt?: Date;
  
  // Notes and communication
  patientNotes?: string;
  providerNotes?: string;
  internalNotes?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'orderDate' | 'lastUpdate' | 'createdAt' | 'updatedAt'> {}

// Order model class
class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public patientId!: string;
  public type!: OrderType;
  public status!: OrderStatus;
  
  public requestingDoctorName?: string;
  public clinicAddress?: string;
  public clinicLicense?: string;
  
  public prescriptionData?: object;
  public testData?: object;
  
  public assignedProviderId?: string;
  public assignedAt?: Date;
  
  // Pharmacy specific
  public estimatedDeliveryTime?: string;
  public actualDeliveryTime?: Date;
  public pickupLocation?: string;
  public trackingLink?: string;
  
  // Lab specific
  public preTestInstructions?: string;
  public sampleCollectionInfo?: string;
  public resultsPdfUrl?: string;
  public resultSummaryForDoctor?: string;
  
  // Pricing
  public totalAmount?: number;
  public currency?: string;
  public paymentStatus?: string;
  
  // Timestamps
  public orderDate!: Date;
  public lastUpdate!: Date;
  public completedAt?: Date;
  
  // Notes
  public patientNotes?: string;
  public providerNotes?: string;
  public internalNotes?: string;

  // Model timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public getPatient!: () => Promise<Patient>;
  public getAssignedProvider!: () => Promise<Provider | null>;

  // Instance methods
  public updateStatus(newStatus: OrderStatus, notes?: string): void {
    this.status = newStatus;
    this.lastUpdate = new Date();
    
    if (notes) {
      this.internalNotes = this.internalNotes ? 
        `${this.internalNotes}\n[${new Date().toISOString()}] ${notes}` : 
        `[${new Date().toISOString()}] ${notes}`;
    }
    
    if (newStatus === OrderStatus.COMPLETED) {
      this.completedAt = new Date();
    }
  }

  public assignToProvider(providerId: string): void {
    this.assignedProviderId = providerId;
    this.assignedAt = new Date();
    this.updateStatus(OrderStatus.ASSIGNED, `Assigned to provider ${providerId}`);
  }

  public isActive(): boolean {
    return ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(this.status);
  }

  public canReceiveBids(): boolean {
    return [OrderStatus.PENDING_BROADCAST, OrderStatus.AWAITING_BIDS].includes(this.status);
  }

  public isAssigned(): boolean {
    return this.assignedProviderId !== null && this.assignedProviderId !== undefined;
  }

  public getStatusDisplay(): string {
    return this.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  public getDurationSinceOrder(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.orderDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  }
}

// Initialize the model
Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Patient,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM(...Object.values(OrderType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: false,
      defaultValue: OrderStatus.PENDING_BROADCAST,
    },
    requestingDoctorName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clinicAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clinicLicense: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    prescriptionData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    testData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    assignedProviderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Provider,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimatedDeliveryTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trackingLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    preTestInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sampleCollectionInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resultsPdfUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resultSummaryForDoctor: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'USD',
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'pending',
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastUpdate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    patientNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    providerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    hooks: {
      beforeUpdate: (order: Order) => {
        order.lastUpdate = new Date();
      },
    },
  }
);

// Associations are defined in models/index.ts to avoid circular dependencies

export default Order;
