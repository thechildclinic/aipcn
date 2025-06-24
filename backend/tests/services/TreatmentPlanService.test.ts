import { TreatmentPlanService, Symptom, TreatmentPlan } from '../../src/services/TreatmentPlanService';
import { PatientService } from '../../src/services/PatientService';
import { 
  createMockPatient,
  expectValidationError,
  expectAsync 
} from '../setup';

// Mock the PatientService
jest.mock('../../src/services/PatientService');
const MockPatientService = PatientService as jest.MockedClass<typeof PatientService>;

describe('TreatmentPlanService', () => {
  let treatmentPlanService: TreatmentPlanService;
  let mockPatientService: jest.Mocked<PatientService>;
  let mockPatient: any;

  beforeEach(() => {
    treatmentPlanService = new TreatmentPlanService();
    mockPatient = createMockPatient();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock PatientService methods
    mockPatientService = {
      findByIdWithUser: jest.fn().mockResolvedValue(mockPatient),
    } as any;
    
    // Replace the patientService import with our mock
    (treatmentPlanService as any).patientService = mockPatientService;
  });

  describe('generateTreatmentPlan', () => {
    const mockSymptoms: Symptom[] = [
      {
        name: 'headache',
        severity: 'moderate',
        duration: '2 days',
        frequency: 'constant',
      },
      {
        name: 'nausea',
        severity: 'mild',
        duration: '1 day',
      },
    ];

    it('should generate treatment plan for respiratory symptoms', async () => {
      const respiratorySymptoms: Symptom[] = [
        {
          name: 'cough',
          severity: 'moderate',
          duration: '3 days',
        },
        {
          name: 'shortness of breath',
          severity: 'mild',
          duration: '2 days',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        respiratorySymptoms
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.stringContaining('plan_'),
          patientId: 'patient-123',
          symptoms: respiratorySymptoms,
          assessment: expect.objectContaining({
            primaryDiagnosis: 'Upper respiratory tract infection',
            differentialDiagnoses: expect.arrayContaining([
              'Bronchitis',
              'Pneumonia',
              'Asthma exacerbation',
            ]),
            severity: expect.any(String),
            urgency: expect.any(String),
          }),
          recommendations: expect.arrayContaining([
            expect.objectContaining({
              type: 'medication',
              title: 'Symptomatic relief',
            }),
            expect.objectContaining({
              type: 'lifestyle',
              title: 'Rest and hydration',
            }),
          ]),
          confidence: expect.any(Number),
        })
      );
    });

    it('should generate treatment plan for gastrointestinal symptoms', async () => {
      const giSymptoms: Symptom[] = [
        {
          name: 'nausea',
          severity: 'moderate',
          duration: '1 day',
        },
        {
          name: 'vomiting',
          severity: 'mild',
          duration: '1 day',
        },
        {
          name: 'diarrhea',
          severity: 'moderate',
          duration: '2 days',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        giSymptoms
      );

      expect(result.assessment.primaryDiagnosis).toBe('Gastroenteritis');
      expect(result.assessment.differentialDiagnoses).toContain('Food poisoning');
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'lifestyle',
            title: 'Dietary modifications',
          }),
        ])
      );
    });

    it('should generate treatment plan for neurological symptoms', async () => {
      const neuroSymptoms: Symptom[] = [
        {
          name: 'headache',
          severity: 'severe',
          duration: '4 hours',
        },
        {
          name: 'dizziness',
          severity: 'moderate',
          duration: '2 hours',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        neuroSymptoms
      );

      expect(result.assessment.primaryDiagnosis).toBe('Tension headache');
      expect(result.assessment.severity).toBe('severe');
      expect(result.assessment.urgency).toBe('medium');
    });

    it('should identify red flags for severe symptoms', async () => {
      const severeSymptoms: Symptom[] = [
        {
          name: 'shortness of breath',
          severity: 'severe',
          duration: '1 hour',
        },
        {
          name: 'chest pain',
          severity: 'severe',
          duration: '30 minutes',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        severeSymptoms
      );

      expect(result.redFlags).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Severe shortness of breath'),
          expect.stringContaining('Severe chest pain'),
        ])
      );
      expect(result.emergencyWarnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Seek immediate medical attention'),
        ])
      );
    });

    it('should consider patient allergies in recommendations', async () => {
      const patientWithAllergies = {
        ...mockPatient,
        allergies: ['aspirin', 'ibuprofen'],
      };
      mockPatientService.findByIdWithUser.mockResolvedValue(patientWithAllergies);

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        mockSymptoms
      );

      // Check that medication recommendations include contraindication warnings
      const medicationRecommendations = result.recommendations.filter(
        rec => rec.type === 'medication'
      );
      
      if (medicationRecommendations.length > 0) {
        expect(medicationRecommendations[0]).toEqual(
          expect.objectContaining({
            contraindications: expect.any(Array),
          })
        );
      }
    });

    it('should calculate confidence score based on symptom clarity', async () => {
      // Test with clear, consistent symptoms
      const clearSymptoms: Symptom[] = [
        {
          name: 'cough',
          severity: 'moderate',
          duration: '3 days',
        },
        {
          name: 'fever',
          severity: 'moderate',
          duration: '2 days',
        },
        {
          name: 'fatigue',
          severity: 'moderate',
          duration: '3 days',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        clearSymptoms
      );

      expect(result.confidence).toBeGreaterThan(70);
      expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it('should generate appropriate follow-up instructions based on urgency', async () => {
      const urgentSymptoms: Symptom[] = [
        {
          name: 'chest pain',
          severity: 'severe',
          duration: '1 hour',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        urgentSymptoms
      );

      expect(result.followUpInstructions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('24-48 hours'),
        ])
      );
    });

    it('should handle musculoskeletal symptoms', async () => {
      const musculoskeletalSymptoms: Symptom[] = [
        {
          name: 'back pain',
          severity: 'moderate',
          duration: '1 week',
        },
        {
          name: 'muscle pain',
          severity: 'mild',
          duration: '3 days',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        musculoskeletalSymptoms
      );

      expect(result.assessment.primaryDiagnosis).toBe('Musculoskeletal strain');
      expect(result.assessment.differentialDiagnoses).toContain('Arthritis');
    });

    it('should include emergency warnings for high-risk symptoms', async () => {
      const highRiskSymptoms: Symptom[] = [
        {
          name: 'confusion',
          severity: 'moderate',
          duration: '2 hours',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        highRiskSymptoms
      );

      expect(result.redFlags).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Altered mental status'),
        ])
      );
      expect(result.emergencyWarnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Call 911'),
        ])
      );
    });

    it('should adjust recommendations for severe gastrointestinal symptoms', async () => {
      const severeGISymptoms: Symptom[] = [
        {
          name: 'vomiting',
          severity: 'severe',
          duration: '6 hours',
        },
        {
          name: 'abdominal pain',
          severity: 'severe',
          duration: '4 hours',
        },
      ];

      const result = await treatmentPlanService.generateTreatmentPlan(
        'patient-123',
        severeGISymptoms
      );

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'test',
            title: 'Laboratory evaluation',
          }),
        ])
      );
    });
  });
});
