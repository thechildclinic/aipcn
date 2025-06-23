import { PatientProfile, ClinicSpecialty } from '../types';
import { samplePatients } from './samplePatients';

// Demo Scenarios for Each Specialty
export interface DemoScenario {
  id: string;
  title: string;
  specialty: ClinicSpecialty;
  patient: PatientProfile;
  symptoms: string;
  expectedOutcome: string;
  complexity: 'low' | 'medium' | 'high';
  highlights: string[];
}

export const demoScenarios: DemoScenario[] = [
  // Cardiology Demo Scenarios
  {
    id: 'cardio-acs',
    title: 'Acute Coronary Syndrome Assessment',
    specialty: 'Cardiology',
    patient: {
      name: "Robert Chen",
      age: "58",
      gender: "male",
      pastHistory: "Type 2 diabetes (10 years), hyperlipidemia, family history of CAD",
      habits: "Former smoker (quit 5 years ago), sedentary lifestyle",
      allergies: "Penicillin (rash)",
      currentMedications: "Metformin 1000mg BID, Atorvastatin 40mg daily, Aspirin 81mg daily"
    },
    symptoms: "Severe chest pain radiating to left arm, shortness of breath, diaphoresis, started 2 hours ago",
    expectedOutcome: "AI provides cardiology-specific assessment focusing on ACS vs other cardiac causes",
    complexity: 'high',
    highlights: [
      'Specialty-aware AI recognizes cardiology context',
      'Advanced cardiac differential diagnosis',
      'Immediate intervention recommendations',
      'Drug interaction checking with cardiac medications'
    ]
  },
  {
    id: 'cardio-htn',
    title: 'Hypertension Management Protocol',
    specialty: 'Cardiology',
    patient: {
      name: "Maria Rodriguez",
      age: "45",
      gender: "female",
      pastHistory: "Newly diagnosed hypertension, anxiety disorder",
      habits: "Non-smoker, exercises regularly",
      allergies: "NKDA",
      currentMedications: "Sertraline 50mg daily"
    },
    symptoms: "Elevated blood pressure readings at home (160/95), occasional headaches",
    expectedOutcome: "Comprehensive hypertension management with evidence-based protocols",
    complexity: 'medium',
    highlights: [
      'Automated treatment plan generation',
      'Evidence-based medication protocols',
      'Monitoring and follow-up schedules',
      'Patient education materials'
    ]
  },

  // Dermatology Demo Scenarios
  {
    id: 'derm-psoriasis',
    title: 'Psoriatic Arthritis Evaluation',
    specialty: 'Dermatology',
    patient: {
      name: "David Kim",
      age: "35",
      gender: "male",
      pastHistory: "Psoriasis (5 years), family history of autoimmune conditions",
      habits: "High-stress job, moderate alcohol use",
      allergies: "Sulfa drugs",
      currentMedications: "Methotrexate 15mg weekly, Folic acid 5mg weekly"
    },
    symptoms: "Worsening psoriatic plaques on elbows and knees, new joint pain and stiffness in hands",
    expectedOutcome: "Dermatology-specific assessment with systemic treatment considerations",
    complexity: 'high',
    highlights: [
      'Specialty-specific differential diagnosis',
      'Systemic therapy considerations',
      'Drug interaction checking with immunosuppressants',
      'Monitoring requirements for biologics'
    ]
  },

  // Orthopedics Demo Scenarios
  {
    id: 'ortho-knee',
    title: 'Sports Injury Assessment',
    specialty: 'Orthopedics',
    patient: {
      name: "Jennifer Walsh",
      age: "42",
      gender: "female",
      pastHistory: "Previous ACL repair (left knee, 2018), active runner",
      habits: "Regular exercise, non-smoker",
      allergies: "Codeine (nausea)",
      currentMedications: "Ibuprofen 400mg PRN"
    },
    symptoms: "Right knee pain and swelling after running, clicking sensation, difficulty bearing weight",
    expectedOutcome: "Orthopedic-specific evaluation with imaging and treatment recommendations",
    complexity: 'medium',
    highlights: [
      'Sports medicine focus',
      'Imaging protocol recommendations',
      'Conservative vs surgical options',
      'Return-to-activity guidelines'
    ]
  },

  // Psychiatry Demo Scenarios
  {
    id: 'psych-depression',
    title: 'Treatment-Resistant Depression',
    specialty: 'Psychiatry',
    patient: {
      name: "Emily Davis",
      age: "31",
      gender: "female",
      pastHistory: "Major depressive disorder (recurrent), anxiety disorder, family history of bipolar",
      habits: "Regular therapy, minimal alcohol",
      allergies: "NKDA",
      currentMedications: "Escitalopram 20mg daily, Lorazepam 0.5mg PRN"
    },
    symptoms: "Worsening depression despite medication, sleep disturbances, increased anxiety, suicidal ideation",
    expectedOutcome: "Psychiatric assessment with medication optimization and safety planning",
    complexity: 'high',
    highlights: [
      'Mental health risk assessment',
      'Medication optimization strategies',
      'Drug interaction checking with psychiatric medications',
      'Safety planning and monitoring'
    ]
  },

  // General Practice Demo Scenarios
  {
    id: 'gp-diabetes',
    title: 'Diabetes Management in Primary Care',
    specialty: 'General Practice',
    patient: {
      name: "Patricia Lee",
      age: "52",
      gender: "female",
      pastHistory: "Prediabetes progressing to Type 2 diabetes, hypothyroidism",
      habits: "Sedentary job, trying to lose weight",
      allergies: "NKDA",
      currentMedications: "Levothyroxine 100mcg daily"
    },
    symptoms: "Elevated blood glucose readings, fatigue, increased thirst and urination",
    expectedOutcome: "Comprehensive diabetes management with lifestyle and medication recommendations",
    complexity: 'medium',
    highlights: [
      'Primary care approach to diabetes',
      'Lifestyle modification counseling',
      'Medication initiation protocols',
      'Monitoring and referral guidelines'
    ]
  }
];

// Demo Flow Manager
export class DemoFlowManager {
  private currentScenario: DemoScenario | null = null;
  private currentStep: number = 0;
  private demoResults: any = {};

  // Demo Steps
  private readonly demoSteps = [
    'Patient Selection',
    'Symptom Assessment',
    'AI Diagnosis',
    'Treatment Planning',
    'Drug Interaction Check',
    'Final Prescription'
  ];

  setCurrentScenario(scenarioId: string): DemoScenario | null {
    this.currentScenario = demoScenarios.find(s => s.id === scenarioId) || null;
    this.currentStep = 0;
    this.demoResults = {};
    return this.currentScenario;
  }

  getCurrentScenario(): DemoScenario | null {
    return this.currentScenario;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getStepName(): string {
    return this.demoSteps[this.currentStep] || 'Complete';
  }

  getTotalSteps(): number {
    return this.demoSteps.length;
  }

  nextStep(): boolean {
    if (this.currentStep < this.demoSteps.length - 1) {
      this.currentStep++;
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    if (this.currentStep > 0) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  saveStepResult(stepName: string, result: any): void {
    this.demoResults[stepName] = result;
  }

  getStepResult(stepName: string): any {
    return this.demoResults[stepName];
  }

  getAllResults(): any {
    return this.demoResults;
  }

  resetDemo(): void {
    this.currentScenario = null;
    this.currentStep = 0;
    this.demoResults = {};
  }

  // Get scenarios by specialty
  getScenariosBySpecialty(specialty: ClinicSpecialty): DemoScenario[] {
    return demoScenarios.filter(s => s.specialty === specialty);
  }

  // Get demo narrative for current step
  getDemoNarrative(): string {
    if (!this.currentScenario) return '';

    const stepName = this.getStepName();
    const scenario = this.currentScenario;

    switch (stepName) {
      case 'Patient Selection':
        return `We're demonstrating ${scenario.specialty} capabilities with ${scenario.patient.name}, a ${scenario.patient.age}-year-old ${scenario.patient.gender} with ${scenario.patient.pastHistory}.`;
      
      case 'Symptom Assessment':
        return `The patient presents with: ${scenario.symptoms}. Notice how the AI will provide specialty-specific assessment.`;
      
      case 'AI Diagnosis':
        return `The AI provides ${scenario.specialty}-specific differential diagnosis and recommendations. ${scenario.expectedOutcome}`;
      
      case 'Treatment Planning':
        return `Watch as the system generates evidence-based treatment protocols specific to ${scenario.specialty} practice.`;
      
      case 'Drug Interaction Check':
        return `The system performs comprehensive safety checking, considering the patient's current medications and medical history.`;
      
      case 'Final Prescription':
        return `The final prescription includes all safety checks, patient education, and monitoring requirements.`;
      
      default:
        return 'Demo complete! The system has demonstrated comprehensive AI-assisted clinical decision support.';
    }
  }

  // Get expected highlights for current scenario
  getScenarioHighlights(): string[] {
    return this.currentScenario?.highlights || [];
  }
}

export const demoManager = new DemoFlowManager();
export default { demoScenarios, demoManager };
