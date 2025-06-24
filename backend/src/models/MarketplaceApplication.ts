import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Business type enum
export enum BusinessType {
  CLINIC = 'clinic',
  LAB = 'lab',
  PHARMACY = 'pharmacy',
}

// Application status enum
export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// MarketplaceApplication attributes interface
export interface MarketplaceApplicationAttributes {
  id: string;
  businessType: BusinessType;
  businessName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  
  // Clinic specific fields
  clinicSpecialties?: string;
  doctorCount?: number;
  
  // Lab specific fields
  labTestTypes?: string;
  labCertifications?: string;
  
  // Pharmacy specific fields
  pharmacyServices?: string;
  prescriptionDelivery?: boolean;
  
  // Common fields
  regulatoryComplianceNotes: string;
  attestedCompliance: boolean;
  serviceRegion?: string;
  status: ApplicationStatus;
  submissionDate: Date;
  reviewedBy?: string;
  reviewDate?: Date;
  reviewNotes?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
export interface MarketplaceApplicationCreationAttributes extends Optional<MarketplaceApplicationAttributes, 'id' | 'status' | 'submissionDate' | 'createdAt' | 'updatedAt'> {}

// MarketplaceApplication model class
class MarketplaceApplication extends Model<MarketplaceApplicationAttributes, MarketplaceApplicationCreationAttributes> implements MarketplaceApplicationAttributes {
  public id!: string;
  public businessType!: BusinessType;
  public businessName!: string;
  public address!: string;
  public contactEmail!: string;
  public contactPhone!: string;
  public website?: string;
  
  // Clinic specific
  public clinicSpecialties?: string;
  public doctorCount?: number;
  
  // Lab specific
  public labTestTypes?: string;
  public labCertifications?: string;
  
  // Pharmacy specific
  public pharmacyServices?: string;
  public prescriptionDelivery?: boolean;
  
  // Common
  public regulatoryComplianceNotes!: string;
  public attestedCompliance!: boolean;
  public serviceRegion?: string;
  public status!: ApplicationStatus;
  public submissionDate!: Date;
  public reviewedBy?: string;
  public reviewDate?: Date;
  public reviewNotes?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public approve(reviewedBy: string, notes?: string): void {
    this.status = ApplicationStatus.APPROVED;
    this.reviewedBy = reviewedBy;
    this.reviewDate = new Date();
    this.reviewNotes = notes;
  }

  public reject(reviewedBy: string, notes: string): void {
    this.status = ApplicationStatus.REJECTED;
    this.reviewedBy = reviewedBy;
    this.reviewDate = new Date();
    this.reviewNotes = notes;
  }

  public isApproved(): boolean {
    return this.status === ApplicationStatus.APPROVED;
  }

  public isPending(): boolean {
    return this.status === ApplicationStatus.SUBMITTED || this.status === ApplicationStatus.UNDER_REVIEW;
  }
}

// Initialize the model
MarketplaceApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    businessType: {
      type: DataTypes.ENUM(...Object.values(BusinessType)),
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
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
    clinicSpecialties: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    doctorCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    labTestTypes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    labCertifications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pharmacyServices: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prescriptionDelivery: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    regulatoryComplianceNotes: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attestedCompliance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    serviceRegion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ApplicationStatus)),
      allowNull: false,
      defaultValue: ApplicationStatus.SUBMITTED,
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reviewedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'MarketplaceApplication',
    tableName: 'marketplace_applications',
  }
);

export default MarketplaceApplication;
