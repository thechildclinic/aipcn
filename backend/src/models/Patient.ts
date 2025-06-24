import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// Patient attributes interface
export interface PatientAttributes {
  id: string;
  userId: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: object; // JSON field for medical history
  allergies?: string[];
  currentMedications?: string[];
  insuranceInfo?: object; // JSON field for insurance details
  preferredLanguage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
export interface PatientCreationAttributes extends Optional<PatientAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Patient model class
class Patient extends Model<PatientAttributes, PatientCreationAttributes> implements PatientAttributes {
  public id!: string;
  public userId!: string;
  public dateOfBirth?: Date;
  public gender?: string;
  public address?: string;
  public emergencyContactName?: string;
  public emergencyContactPhone?: string;
  public medicalHistory?: object;
  public allergies?: string[];
  public currentMedications?: string[];
  public insuranceInfo?: object;
  public preferredLanguage?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association methods
  public getUser!: () => Promise<User>;
  public setUser!: (user: User) => Promise<void>;

  // Instance methods
  public getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  public hasAllergy(allergen: string): boolean {
    return this.allergies ? this.allergies.includes(allergen) : false;
  }

  public isOnMedication(medication: string): boolean {
    return this.currentMedications ? this.currentMedications.includes(medication) : false;
  }
}

// Initialize the model
Patient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['male', 'female', 'other', 'prefer_not_to_say']],
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    medicalHistory: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    currentMedications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    insuranceInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'en',
    },
  },
  {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
  }
);

// Associations are defined in models/index.ts to avoid circular dependencies

export default Patient;
