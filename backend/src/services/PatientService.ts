import { FindOptions, Op } from 'sequelize';
import Patient, { PatientAttributes, PatientCreationAttributes } from '../models/Patient';
import User, { UserRole } from '../models/User';
import { BaseService, NotFoundError, ConflictError } from './BaseService';
import { validateSchema, patientSchemas, ValidationError } from '../utils/validation';

// Patient update attributes
export interface PatientUpdateAttributes {
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string[];
  currentMedications?: string[];
  preferredLanguage?: string;
  medicalHistory?: object;
  insuranceInfo?: object;
}

// Patient search criteria
export interface PatientSearchCriteria {
  name?: string;
  email?: string;
  phone?: string;
  age?: { min?: number; max?: number };
  gender?: string;
  allergies?: string[];
  medications?: string[];
}

export class PatientService extends BaseService<Patient, PatientCreationAttributes, PatientUpdateAttributes> {
  constructor() {
    super(Patient, 'Patient');
  }

  /**
   * Create a new patient with validation
   */
  async create(data: PatientCreationAttributes): Promise<Patient> {
    const validatedData = validateSchema(patientSchemas.create, data);
    
    // Verify user exists and is a patient
    const user = await User.findByPk(validatedData.userId);
    if (!user) {
      throw new NotFoundError('User', validatedData.userId);
    }
    
    if (user.role !== UserRole.PATIENT) {
      throw new ValidationError('Invalid user role', [
        { field: 'userId', message: 'User must have patient role' }
      ]);
    }
    
    // Check if patient profile already exists
    const existingPatient = await this.findOne({ where: { userId: validatedData.userId } });
    if (existingPatient) {
      throw new ConflictError('Patient profile already exists for this user');
    }

    return super.create(validatedData);
  }

  /**
   * Update patient with validation
   */
  async update(id: string, data: PatientUpdateAttributes): Promise<Patient> {
    const validatedData = validateSchema(patientSchemas.update, data);
    return super.update(id, validatedData);
  }

  /**
   * Find patient by user ID
   */
  async findByUserId(userId: string): Promise<Patient | null> {
    return this.findOne({ 
      where: { userId },
      include: [{ model: User, as: 'user' }]
    });
  }

  /**
   * Find patient by user ID (required)
   */
  async findByUserIdRequired(userId: string): Promise<Patient> {
    const patient = await this.findByUserId(userId);
    if (!patient) {
      throw new NotFoundError('Patient profile', `for user ${userId}`);
    }
    return patient;
  }

  /**
   * Get patient with user information
   */
  async findByIdWithUser(id: string): Promise<Patient> {
    return this.findById(id, {
      include: [{ model: User, as: 'user' }]
    });
  }

  /**
   * Search patients by various criteria
   */
  async searchPatients(criteria: PatientSearchCriteria, options: FindOptions = {}): Promise<Patient[]> {
    const whereConditions: any = {};
    const userWhereConditions: any = {};

    // Search by name or email (in user table)
    if (criteria.name) {
      userWhereConditions[Op.or] = [
        { firstName: { [Op.iLike]: `%${criteria.name}%` } },
        { lastName: { [Op.iLike]: `%${criteria.name}%` } },
      ];
    }

    if (criteria.email) {
      userWhereConditions.email = { [Op.iLike]: `%${criteria.email}%` };
    }

    if (criteria.phone) {
      userWhereConditions.phone = { [Op.iLike]: `%${criteria.phone}%` };
    }

    // Search by gender
    if (criteria.gender) {
      whereConditions.gender = criteria.gender;
    }

    // Search by age range
    if (criteria.age) {
      const today = new Date();
      if (criteria.age.min !== undefined) {
        const maxBirthDate = new Date(today.getFullYear() - criteria.age.min, today.getMonth(), today.getDate());
        whereConditions.dateOfBirth = { [Op.lte]: maxBirthDate };
      }
      if (criteria.age.max !== undefined) {
        const minBirthDate = new Date(today.getFullYear() - criteria.age.max - 1, today.getMonth(), today.getDate());
        whereConditions.dateOfBirth = {
          ...whereConditions.dateOfBirth,
          [Op.gte]: minBirthDate,
        };
      }
    }

    // Search by allergies
    if (criteria.allergies && criteria.allergies.length > 0) {
      whereConditions.allergies = { [Op.overlap]: criteria.allergies };
    }

    // Search by medications
    if (criteria.medications && criteria.medications.length > 0) {
      whereConditions.currentMedications = { [Op.overlap]: criteria.medications };
    }

    return this.findAll({
      ...options,
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhereConditions).length > 0 ? userWhereConditions : undefined,
        },
      ],
    });
  }

  /**
   * Get patients with specific allergies
   */
  async findPatientsWithAllergies(allergies: string[]): Promise<Patient[]> {
    return this.findAll({
      where: {
        allergies: { [Op.overlap]: allergies },
      },
      include: [{ model: User, as: 'user' }],
    });
  }

  /**
   * Get patients on specific medications
   */
  async findPatientsOnMedications(medications: string[]): Promise<Patient[]> {
    return this.findAll({
      where: {
        currentMedications: { [Op.overlap]: medications },
      },
      include: [{ model: User, as: 'user' }],
    });
  }

  /**
   * Update patient allergies
   */
  async updateAllergies(patientId: string, allergies: string[]): Promise<Patient> {
    return this.update(patientId, { allergies });
  }

  /**
   * Add allergy to patient
   */
  async addAllergy(patientId: string, allergy: string): Promise<Patient> {
    const patient = await this.findById(patientId);
    const currentAllergies = patient.allergies || [];
    
    if (!currentAllergies.includes(allergy)) {
      currentAllergies.push(allergy);
      await patient.update({ allergies: currentAllergies });
    }
    
    return patient;
  }

  /**
   * Remove allergy from patient
   */
  async removeAllergy(patientId: string, allergy: string): Promise<Patient> {
    const patient = await this.findById(patientId);
    const currentAllergies = patient.allergies || [];
    
    const updatedAllergies = currentAllergies.filter((a: string) => a !== allergy);
    await patient.update({ allergies: updatedAllergies });
    
    return patient;
  }

  /**
   * Update patient medications
   */
  async updateMedications(patientId: string, medications: string[]): Promise<Patient> {
    return this.update(patientId, { currentMedications: medications });
  }

  /**
   * Add medication to patient
   */
  async addMedication(patientId: string, medication: string): Promise<Patient> {
    const patient = await this.findById(patientId);
    const currentMedications = patient.currentMedications || [];
    
    if (!currentMedications.includes(medication)) {
      currentMedications.push(medication);
      await patient.update({ currentMedications });
    }
    
    return patient;
  }

  /**
   * Remove medication from patient
   */
  async removeMedication(patientId: string, medication: string): Promise<Patient> {
    const patient = await this.findById(patientId);
    const currentMedications = patient.currentMedications || [];
    
    const updatedMedications = currentMedications.filter((m: string) => m !== medication);
    await patient.update({ currentMedications: updatedMedications });
    
    return patient;
  }

  /**
   * Update medical history
   */
  async updateMedicalHistory(patientId: string, medicalHistory: object): Promise<Patient> {
    return this.update(patientId, { medicalHistory });
  }

  /**
   * Update insurance information
   */
  async updateInsuranceInfo(patientId: string, insuranceInfo: object): Promise<Patient> {
    return this.update(patientId, { insuranceInfo });
  }

  /**
   * Get patient statistics
   */
  async getPatientStatistics(): Promise<{
    total: number;
    byGender: { [key: string]: number };
    byAgeGroup: { [key: string]: number };
    withAllergies: number;
    onMedications: number;
  }> {
    const total = await this.count();
    
    // Gender statistics
    const genderStats = await Patient.findAll({
      attributes: [
        'gender',
        [Patient.sequelize!.fn('COUNT', Patient.sequelize!.col('gender')), 'count'],
      ],
      group: ['gender'],
      raw: true,
    }) as any[];
    
    const byGender: { [key: string]: number } = {};
    genderStats.forEach(stat => {
      byGender[stat.gender || 'unknown'] = parseInt(stat.count);
    });

    // Age group statistics
    const patients = await this.findAll();
    const byAgeGroup: { [key: string]: number } = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0,
      'unknown': 0,
    };

    patients.forEach(patient => {
      const age = patient.getAge();
      if (age === null) {
        byAgeGroup.unknown++;
      } else if (age <= 18) {
        byAgeGroup['0-18']++;
      } else if (age <= 35) {
        byAgeGroup['19-35']++;
      } else if (age <= 50) {
        byAgeGroup['36-50']++;
      } else if (age <= 65) {
        byAgeGroup['51-65']++;
      } else {
        byAgeGroup['65+']++;
      }
    });

    // Allergy and medication statistics
    const withAllergies = await this.count({
      where: {
        allergies: { [Op.not]: null, [Op.ne]: [] },
      },
    });

    const onMedications = await this.count({
      where: {
        currentMedications: { [Op.not]: null, [Op.ne]: [] },
      },
    });

    return {
      total,
      byGender,
      byAgeGroup,
      withAllergies,
      onMedications,
    };
  }

  /**
   * Get patient's orders
   */
  async getPatientOrders(patientId: string): Promise<any[]> {
    const patient = await this.findById(patientId, {
      include: [{ association: 'orders' }],
    });
    
    return (patient as any).orders || [];
  }
}
