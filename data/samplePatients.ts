import { PatientProfile, ClinicSpecialty } from '../types';

// Comprehensive Sample Patient Profiles for Testing and Demonstration
export const samplePatients: PatientProfile[] = [
  // Cardiology Patients
  {
    name: "Robert Chen",
    age: "58",
    gender: "male",
    pastHistory: "Type 2 diabetes (10 years), hyperlipidemia, family history of CAD (father had MI at 62)",
    habits: "Former smoker (quit 5 years ago, 30 pack-year history), occasional alcohol, sedentary lifestyle",
    allergies: "Penicillin (rash), shellfish",
    currentMedications: "Metformin 1000mg BID, Atorvastatin 40mg daily, Aspirin 81mg daily"
  },
  {
    name: "Maria Rodriguez",
    age: "45",
    gender: "female",
    pastHistory: "Hypertension (3 years), anxiety disorder, no family history of heart disease",
    habits: "Non-smoker, social drinker, exercises 3x/week",
    allergies: "NKDA",
    currentMedications: "Lisinopril 10mg daily, Sertraline 50mg daily"
  },

  // Dermatology Patients
  {
    name: "Sarah Johnson",
    age: "28",
    gender: "female",
    pastHistory: "Eczema since childhood, seasonal allergies",
    habits: "Non-smoker, minimal alcohol, works outdoors frequently",
    allergies: "Fragrances, nickel, pollen",
    currentMedications: "Cetirizine 10mg PRN, topical hydrocortisone PRN"
  },
  {
    name: "David Kim",
    age: "35",
    gender: "male",
    pastHistory: "Psoriasis (5 years), family history of autoimmune conditions",
    habits: "Non-smoker, moderate alcohol, high-stress job",
    allergies: "Sulfa drugs",
    currentMedications: "Methotrexate 15mg weekly, Folic acid 5mg weekly"
  },

  // Orthopedics Patients
  {
    name: "Jennifer Walsh",
    age: "42",
    gender: "female",
    pastHistory: "Previous ACL repair (left knee, 2018), osteoarthritis family history",
    habits: "Former athlete, current runner, non-smoker",
    allergies: "Codeine (nausea)",
    currentMedications: "Ibuprofen 400mg PRN, Glucosamine supplement"
  },
  {
    name: "Michael Thompson",
    age: "67",
    gender: "male",
    pastHistory: "Osteoarthritis (bilateral knees), previous back surgery (L4-L5 fusion, 2015)",
    habits: "Retired, limited mobility, former smoker",
    allergies: "NKDA",
    currentMedications: "Tramadol 50mg BID, Acetaminophen 1000mg TID"
  },

  // Psychiatry Patients
  {
    name: "Emily Davis",
    age: "31",
    gender: "female",
    pastHistory: "Major depressive disorder (recurrent), anxiety disorder, family history of bipolar disorder",
    habits: "Non-smoker, minimal alcohol, regular therapy sessions",
    allergies: "NKDA",
    currentMedications: "Escitalopram 20mg daily, Lorazepam 0.5mg PRN"
  },
  {
    name: "James Wilson",
    age: "24",
    gender: "male",
    pastHistory: "ADHD (childhood diagnosis), recent onset anxiety",
    habits: "College student, occasional binge drinking, irregular sleep",
    allergies: "NKDA",
    currentMedications: "Adderall XR 20mg daily"
  },

  // Pediatrics Patients
  {
    name: "Sophia Martinez",
    age: "8",
    gender: "female",
    pastHistory: "Asthma (mild persistent), multiple food allergies",
    habits: "Active child, plays soccer",
    allergies: "Peanuts, tree nuts, eggs",
    currentMedications: "Albuterol inhaler PRN, Fluticasone inhaler daily"
  },
  {
    name: "Lucas Brown",
    age: "15",
    gender: "male",
    pastHistory: "Type 1 diabetes (diagnosed age 10), no other significant history",
    habits: "High school athlete (basketball), good diabetes management",
    allergies: "NKDA",
    currentMedications: "Insulin pump therapy (Humalog), CGM"
  },

  // Endocrinology Patients
  {
    name: "Patricia Lee",
    age: "52",
    gender: "female",
    pastHistory: "Hypothyroidism (8 years), prediabetes, family history of diabetes",
    habits: "Non-smoker, trying to lose weight, sedentary job",
    allergies: "NKDA",
    currentMedications: "Levothyroxine 100mcg daily"
  },

  // Complex/Edge Case Patients
  {
    name: "George Anderson",
    age: "78",
    gender: "male",
    pastHistory: "CHF (EF 35%), CKD Stage 3, AFib, previous stroke (2019), multiple drug allergies",
    habits: "Former smoker, minimal alcohol, limited mobility",
    allergies: "Warfarin (bleeding), ACE inhibitors (angioedema), Sulfa (Stevens-Johnson syndrome)",
    currentMedications: "Apixaban 5mg BID, Metoprolol 50mg BID, Furosemide 40mg daily, Spironolactone 25mg daily"
  },
  {
    name: "Isabella Garcia",
    age: "29",
    gender: "female",
    pastHistory: "Pregnancy (32 weeks), gestational diabetes, history of depression",
    habits: "Non-smoker, no alcohol during pregnancy, prenatal vitamins",
    allergies: "Latex",
    currentMedications: "Prenatal vitamins, Insulin (pregnancy-safe regimen)"
  }
];

// Test Scenarios by Specialty
export const testScenarios = {
  cardiology: [
    {
      patientId: "Robert Chen",
      symptoms: "Chest pain radiating to left arm, shortness of breath, diaphoresis",
      expectedDiagnosis: "Acute Coronary Syndrome",
      complexity: "high",
      drugInteractionRisk: "high"
    },
    {
      patientId: "Maria Rodriguez",
      symptoms: "Palpitations, dizziness, fatigue",
      expectedDiagnosis: "Arrhythmia vs Anxiety",
      complexity: "medium",
      drugInteractionRisk: "low"
    }
  ],
  dermatology: [
    {
      patientId: "Sarah Johnson",
      symptoms: "Itchy, red, scaly patches on elbows and knees",
      expectedDiagnosis: "Eczema flare vs Psoriasis",
      complexity: "medium",
      drugInteractionRisk: "low"
    },
    {
      patientId: "David Kim",
      symptoms: "Worsening psoriatic plaques, joint pain",
      expectedDiagnosis: "Psoriatic arthritis",
      complexity: "high",
      drugInteractionRisk: "medium"
    }
  ],
  orthopedics: [
    {
      patientId: "Jennifer Walsh",
      symptoms: "Knee pain and swelling after running, clicking sensation",
      expectedDiagnosis: "Meniscal tear vs Patellofemoral syndrome",
      complexity: "medium",
      drugInteractionRisk: "low"
    },
    {
      patientId: "Michael Thompson",
      symptoms: "Severe back pain radiating down right leg, numbness in foot",
      expectedDiagnosis: "Lumbar radiculopathy",
      complexity: "high",
      drugInteractionRisk: "medium"
    }
  ],
  psychiatry: [
    {
      patientId: "Emily Davis",
      symptoms: "Worsening depression, sleep disturbances, anxiety attacks",
      expectedDiagnosis: "Major depressive episode with anxiety",
      complexity: "high",
      drugInteractionRisk: "medium"
    },
    {
      patientId: "James Wilson",
      symptoms: "Difficulty concentrating, restlessness, panic attacks",
      expectedDiagnosis: "ADHD with comorbid anxiety disorder",
      complexity: "medium",
      drugInteractionRisk: "low"
    }
  ]
};

// Edge Cases for Drug Interaction Testing
export const drugInteractionEdgeCases = [
  {
    scenario: "Multiple Anticoagulants",
    medications: ["warfarin", "aspirin", "clopidogrel"],
    expectedSeverity: "contraindicated",
    patientProfile: samplePatients.find(p => p.name === "George Anderson")
  },
  {
    scenario: "Pregnancy Drug Safety",
    medications: ["lisinopril", "metformin", "sertraline"],
    expectedSeverity: "major",
    patientProfile: samplePatients.find(p => p.name === "Isabella Garcia")
  },
  {
    scenario: "Pediatric Dosing",
    medications: ["amoxicillin", "ibuprofen"],
    expectedSeverity: "minor",
    patientProfile: samplePatients.find(p => p.name === "Sophia Martinez")
  },
  {
    scenario: "Renal Impairment",
    medications: ["metformin", "gabapentin", "atorvastatin"],
    expectedSeverity: "moderate",
    patientProfile: samplePatients.find(p => p.name === "George Anderson")
  }
];

// Sample Orders and Test Data for Role-Based System
export const samplePrescriptionOrders = [
  {
    id: 'RX001',
    patientId: 'P001',
    patientName: 'Robert Chen',
    doctorId: 'D001',
    doctorName: 'Dr. Sarah Smith',
    clinicName: 'Cardiac Care Specialists',
    medications: [
      {
        name: 'Atorvastatin',
        dosage: '40mg',
        quantity: 30,
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with evening meal',
        genericAllowed: true,
        refills: 5
      },
      {
        name: 'Metoprolol',
        dosage: '50mg',
        quantity: 60,
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Take with food',
        genericAllowed: true,
        refills: 5
      }
    ],
    orderDate: new Date('2024-01-15'),
    urgency: 'routine' as const,
    status: 'pending' as const,
    deliveryAddress: '123 Main St, City, State 12345',
    contactNumber: '(555) 123-4567'
  },
  {
    id: 'RX002',
    patientId: 'P002',
    patientName: 'Maria Rodriguez',
    doctorId: 'D001',
    doctorName: 'Dr. Sarah Smith',
    clinicName: 'Cardiac Care Specialists',
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        quantity: 30,
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take in morning',
        genericAllowed: true,
        refills: 3
      }
    ],
    orderDate: new Date('2024-01-16'),
    urgency: 'urgent' as const,
    status: 'bidding' as const,
    deliveryAddress: '456 Oak Ave, City, State 12345',
    contactNumber: '(555) 987-6543'
  }
];

export const sampleLabOrders = [
  {
    id: 'LAB001',
    patientId: 'P001',
    patientName: 'Robert Chen',
    doctorId: 'D001',
    doctorName: 'Dr. Sarah Smith',
    clinicName: 'Cardiac Care Specialists',
    tests: [
      {
        testCode: 'LIPID',
        testName: 'Lipid Panel',
        category: 'Chemistry',
        sampleType: 'blood' as const,
        fastingRequired: true,
        estimatedTurnaroundTime: 4,
        urgency: 'routine' as const
      },
      {
        testCode: 'TROP',
        testName: 'Troponin I',
        category: 'Cardiac Markers',
        sampleType: 'blood' as const,
        fastingRequired: false,
        estimatedTurnaroundTime: 2,
        urgency: 'urgent' as const
      }
    ],
    orderDate: new Date('2024-01-15'),
    urgency: 'urgent' as const,
    status: 'pending' as const,
    clinicalInfo: 'Patient with chest pain, rule out ACS',
    fastingRequired: true,
    specialInstructions: 'Priority processing for cardiac markers'
  }
];

export const sampleAppointments = [
  {
    id: 'APT001',
    patientId: 'P001',
    patientName: 'Robert Chen',
    doctorId: 'D001',
    doctorName: 'Dr. Sarah Smith',
    appointmentType: 'consultation' as const,
    scheduledDate: new Date('2024-01-17T10:00:00'),
    duration: 30,
    status: 'scheduled' as const,
    reason: 'Chest pain evaluation',
    priority: 'high' as const
  },
  {
    id: 'APT002',
    patientId: 'P002',
    patientName: 'Maria Rodriguez',
    doctorId: 'D001',
    doctorName: 'Dr. Sarah Smith',
    appointmentType: 'follow_up' as const,
    scheduledDate: new Date('2024-01-17T11:00:00'),
    duration: 20,
    status: 'checked_in' as const,
    reason: 'Hypertension follow-up',
    priority: 'medium' as const
  }
];

export default {
  samplePatients,
  testScenarios,
  drugInteractionEdgeCases,
  samplePrescriptionOrders,
  sampleLabOrders,
  sampleAppointments
};
