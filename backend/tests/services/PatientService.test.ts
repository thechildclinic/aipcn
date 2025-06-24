import { PatientService } from '../../src/services/PatientService';
import Patient from '../../src/models/Patient';
import User from '../../src/models/User';
import {
  createMockPatient,
  createMockUser,
  expectValidationError,
  expectNotFoundError,
  expectAsync
} from '../setup';

// Mock the models
jest.mock('../../src/models/Patient');
jest.mock('../../src/models/User');
const MockPatient = Patient as jest.MockedClass<typeof Patient>;
const MockUser = User as jest.MockedClass<typeof User>;

describe('PatientService', () => {
  let patientService: PatientService;
  let mockPatient: any;
  let mockUser: any;

  beforeEach(() => {
    patientService = new PatientService();
    mockPatient = createMockPatient();
    mockUser = createMockUser();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    MockPatient.findByPk = jest.fn();
    MockPatient.findOne = jest.fn();
    MockPatient.create = jest.fn();
    MockPatient.findAll = jest.fn();
    MockPatient.count = jest.fn();
    MockUser.findByPk = jest.fn();
  });

  describe('create', () => {
    const validPatientData = {
      userId: 'user-123',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male' as const,
      phone: '+1234567890',
      address: '123 Test St, Test City, TS 12345',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+1987654321',
      preferredLanguage: 'en',
    };

    it('should create a new patient successfully', async () => {
      MockPatient.create.mockResolvedValue(mockPatient);

      const result = await patientService.create(validPatientData);

      expect(MockPatient.create).toHaveBeenCalledWith(validPatientData);
      expect(result).toEqual(mockPatient);
    });

    it('should throw validation error for invalid phone number', async () => {
      const invalidData = { ...validPatientData, phone: 'invalid-phone' };
      
      const { error } = await expectAsync(patientService.create(invalidData));
      
      expectValidationError(error, 'phone');
    });

    it('should throw validation error for invalid gender', async () => {
      const invalidData = { ...validPatientData, gender: 'invalid' as any };
      
      const { error } = await expectAsync(patientService.create(invalidData));
      
      expectValidationError(error, 'gender');
    });

    it('should throw validation error for future birth date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const invalidData = { ...validPatientData, dateOfBirth: futureDate };
      
      const { error } = await expectAsync(patientService.create(invalidData));
      
      expectValidationError(error, 'dateOfBirth');
    });
  });

  describe('findByIdWithUser', () => {
    it('should find patient with user data successfully', async () => {
      const patientWithUser = { ...mockPatient, User: mockUser };
      MockPatient.findByPk.mockResolvedValue(patientWithUser);

      const result = await patientService.findByIdWithUser('patient-123');

      expect(MockPatient.findByPk).toHaveBeenCalledWith('patient-123', {
        include: [{ model: MockUser, as: 'User' }]
      });
      expect(result).toEqual(patientWithUser);
    });

    it('should throw not found error for non-existent patient', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      const { error } = await expectAsync(patientService.findByIdWithUser('non-existent'));
      
      expectNotFoundError(error, 'Patient');
    });
  });

  describe('findByUserIdRequired', () => {
    it('should find patient by user ID successfully', async () => {
      MockPatient.findOne.mockResolvedValue(mockPatient);

      const result = await patientService.findByUserIdRequired('user-123');

      expect(MockPatient.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      });
      expect(result).toEqual(mockPatient);
    });

    it('should throw not found error for non-existent patient', async () => {
      MockPatient.findOne.mockResolvedValue(null);

      const { error } = await expectAsync(patientService.findByUserIdRequired('non-existent'));
      
      expectNotFoundError(error, 'Patient');
    });
  });

  describe('updateAllergies', () => {
    const allergies = ['peanuts', 'shellfish', 'dairy'];

    it('should update allergies successfully', async () => {
      MockPatient.findByPk.mockResolvedValue(mockPatient);
      mockPatient.update = jest.fn().mockResolvedValue({ ...mockPatient, allergies });

      const result = await patientService.updateAllergies('patient-123', allergies);

      expect(mockPatient.update).toHaveBeenCalledWith({ allergies }, {});
      expect(result.allergies).toEqual(allergies);
    });

    it('should throw validation error for invalid allergies format', async () => {
      const { error } = await expectAsync(
        patientService.updateAllergies('patient-123', 'not-an-array' as any)
      );
      
      expectValidationError(error, 'allergies');
    });
  });

  describe('addAllergy', () => {
    it('should add new allergy successfully', async () => {
      const existingAllergies = ['peanuts'];
      const patientWithAllergies = { ...mockPatient, allergies: existingAllergies };
      MockPatient.findByPk.mockResolvedValue(patientWithAllergies);
      patientWithAllergies.update = jest.fn().mockResolvedValue({
        ...patientWithAllergies,
        allergies: [...existingAllergies, 'shellfish']
      });

      const result = await patientService.addAllergy('patient-123', 'shellfish');

      expect(patientWithAllergies.update).toHaveBeenCalledWith({
        allergies: ['peanuts', 'shellfish']
      }, {});
    });

    it('should not add duplicate allergy', async () => {
      const existingAllergies = ['peanuts'];
      const patientWithAllergies = { ...mockPatient, allergies: existingAllergies };
      MockPatient.findByPk.mockResolvedValue(patientWithAllergies);
      patientWithAllergies.update = jest.fn().mockResolvedValue(patientWithAllergies);

      const result = await patientService.addAllergy('patient-123', 'peanuts');

      expect(patientWithAllergies.update).toHaveBeenCalledWith({
        allergies: ['peanuts']
      }, {});
    });
  });

  describe('removeAllergy', () => {
    it('should remove allergy successfully', async () => {
      const existingAllergies = ['peanuts', 'shellfish'];
      const patientWithAllergies = { ...mockPatient, allergies: existingAllergies };
      MockPatient.findByPk.mockResolvedValue(patientWithAllergies);
      patientWithAllergies.update = jest.fn().mockResolvedValue({
        ...patientWithAllergies,
        allergies: ['shellfish']
      });

      const result = await patientService.removeAllergy('patient-123', 'peanuts');

      expect(patientWithAllergies.update).toHaveBeenCalledWith({
        allergies: ['shellfish']
      }, {});
    });

    it('should handle removing non-existent allergy gracefully', async () => {
      const existingAllergies = ['peanuts'];
      const patientWithAllergies = { ...mockPatient, allergies: existingAllergies };
      MockPatient.findByPk.mockResolvedValue(patientWithAllergies);
      patientWithAllergies.update = jest.fn().mockResolvedValue(patientWithAllergies);

      const result = await patientService.removeAllergy('patient-123', 'shellfish');

      expect(patientWithAllergies.update).toHaveBeenCalledWith({
        allergies: ['peanuts']
      }, {});
    });
  });

  describe('updateMedications', () => {
    const medications = ['aspirin', 'ibuprofen'];

    it('should update medications successfully', async () => {
      MockPatient.findByPk.mockResolvedValue(mockPatient);
      mockPatient.update = jest.fn().mockResolvedValue({ ...mockPatient, currentMedications: medications });

      const result = await patientService.updateMedications('patient-123', medications);

      expect(mockPatient.update).toHaveBeenCalledWith({ currentMedications: medications }, {});
      expect(result.currentMedications).toEqual(medications);
    });
  });

  describe('searchPatients', () => {
    const searchCriteria = {
      name: 'John',
      email: 'john@example.com',
      age: { min: 18, max: 65 },
    };

    it('should search patients successfully', async () => {
      const patients = [mockPatient];
      MockPatient.findAll.mockResolvedValue(patients);

      const result = await patientService.searchPatients(searchCriteria);

      expect(MockPatient.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({ model: MockUser })
          ])
        })
      );
      expect(result).toEqual(patients);
    });

    it('should handle empty search criteria', async () => {
      const patients = [mockPatient];
      MockPatient.findAll.mockResolvedValue(patients);

      const result = await patientService.searchPatients({});

      expect(MockPatient.findAll).toHaveBeenCalled();
      expect(result).toEqual(patients);
    });
  });

  describe('getPatientStatistics', () => {
    it('should get patient statistics successfully', async () => {
      MockPatient.count
        .mockResolvedValueOnce(100) // total patients
        .mockResolvedValueOnce(60)  // male patients
        .mockResolvedValueOnce(40)  // female patients
        .mockResolvedValueOnce(20)  // patients 18-30
        .mockResolvedValueOnce(30)  // patients 31-50
        .mockResolvedValueOnce(25)  // patients 51-70
        .mockResolvedValueOnce(25); // patients 70+

      const result = await patientService.getPatientStatistics();

      expect(result).toEqual({
        totalPatients: 100,
        genderDistribution: {
          male: 60,
          female: 40,
        },
        ageDistribution: {
          '18-30': 20,
          '31-50': 30,
          '51-70': 25,
          '70+': 25,
        },
      });
    });
  });

  describe('updateMedicalHistory', () => {
    const medicalHistory = {
      conditions: ['hypertension', 'diabetes'],
      surgeries: ['appendectomy'],
      familyHistory: ['heart disease'],
    };

    it('should update medical history successfully', async () => {
      MockPatient.findByPk.mockResolvedValue(mockPatient);
      mockPatient.update = jest.fn().mockResolvedValue({ ...mockPatient, medicalHistory });

      const result = await patientService.updateMedicalHistory('patient-123', medicalHistory);

      expect(mockPatient.update).toHaveBeenCalledWith({ medicalHistory }, {});
      expect(result.medicalHistory).toEqual(medicalHistory);
    });
  });

  describe('updateInsuranceInfo', () => {
    const insuranceInfo = {
      provider: 'Blue Cross',
      policyNumber: 'BC123456',
      groupNumber: 'GRP789',
    };

    it('should update insurance info successfully', async () => {
      MockPatient.findByPk.mockResolvedValue(mockPatient);
      mockPatient.update = jest.fn().mockResolvedValue({ ...mockPatient, insuranceInfo });

      const result = await patientService.updateInsuranceInfo('patient-123', insuranceInfo);

      expect(mockPatient.update).toHaveBeenCalledWith({ insuranceInfo }, {});
      expect(result.insuranceInfo).toEqual(insuranceInfo);
    });
  });
});
